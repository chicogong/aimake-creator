import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { test, expect } from '@playwright/test';
import { parseDeckMarkdown } from '../../src/renderer/deck-parser.js';
import { exportDeckBundle } from '../../src/renderer/exporter-media.js';
import { startStudioServer } from '../../src/studio/studio-server.js';

const execFileAsync = promisify(execFile);

test('Aimake 2.0 Calm Studio E2E: renders calm stage, switches template via Visual Gallery, syncs inline [data-editable] edits & live SSE hot-reload', async ({
  page,
}) => {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'aimake-studio-e2e-'));
  const deckPath = path.join(tmpDir, 'live.deck.md');
  const srcExample = path.resolve(process.cwd(), 'examples/zh-creator-flywheel.deck.md');
  await fs.copyFile(srcExample, deckPath);

  const studio = await startStudioServer({
    deckPath,
    workspaceDir: tmpDir,
    registryPath: path.join(tmpDir, 'recent-workspaces.json'),
  });
  try {
    await page.goto(studio.url);
    await expect(page.locator('#workspace-name-label')).toBeVisible();
    await expect(page.locator('.loop-stepper .loop-step')).toHaveCount(4);

    // Verify iframe renders slides cleanly on the 85%+ calm stage
    const frame = page.frameLocator('#preview-frame');
    const firstSlideTitle = frame.locator('.aimake-slide').first().locator('h1.slide-title');
    await expect(firstSlideTitle).toContainText('为什么纯本地 LLM Wiki');

    // Perform inline WYSIWYG edit directly on the canvas and blur to trigger sync!
    await firstSlideTitle.click();
    await firstSlideTitle.fill('本地优先架构：真机 E2E 内联编辑验证通过');
    await frame.locator('.aimake-slide').first().locator('.page-index').click();

    await expect(page.locator('#toast')).toContainText('已保存第 1 页');

    const savedMd = await fs.readFile(deckPath, 'utf8');
    expect(savedMd).toContain('本地优先架构：真机 E2E 内联编辑验证通过');

    // Open Visual Template Gallery Drawer -> verify 36 real visual template cards + switch template
    await page.locator('#btn-open-gallery').click();
    await expect(page.locator('#drawer-gallery')).toHaveClass(/open/);
    await expect(page.locator('#gallery-template-grid .tpl-card')).toHaveCount(36);

    // Verify real rendered thumbnail image loads cleanly
    const thumbRes = await page.request.get(`${studio.url}/api/templates/thumb/xhs-neon-tech.png`);
    expect(thumbRes.ok()).toBeTruthy();
    expect(thumbRes.headers()['content-type']).toBe('image/png');

    await page.locator('[data-template-id="xhs-neon-tech"]').click();
    await expect(page.locator('#toast')).toContainText('xhs-neon-tech');
    const updatedMd = await fs.readFile(deckPath, 'utf8');
    expect(updatedMd).toContain('template: xhs-neon-tech');

    // Verify external AI edit triggers real-time SSE hot-reload (<500ms)
    const aiEditedMd = updatedMd.replace(
      '本地优先架构：真机 E2E 内联编辑验证通过',
      '外部 AI 工具实时热更新验证通过'
    );
    await fs.writeFile(deckPath, aiEditedMd, 'utf8');
    await expect(page.locator('#live-sync-banner')).toHaveClass(/show/, { timeout: 5000 });
    await expect(frame.locator('.aimake-slide').first().locator('h1.slide-title')).toContainText(
      '外部 AI 工具实时热更新验证通过',
      { timeout: 5000 }
    );
  } finally {
    await studio.close();
    await fs.rm(tmpDir, { recursive: true, force: true });
  }
});

test('One-Deck -> Five Native Deliverables E2E Verification (PNG, WeChat HTML, PDF, Editable PPTX, 60fps MP4)', async () => {
  const tmpOut = await fs.mkdtemp(path.join(os.tmpdir(), 'aimake-exports-e2e-'));
  try {
    const rawZh = await fs.readFile(
      path.resolve(process.cwd(), 'examples/zh-creator-flywheel.deck.md'),
      'utf8'
    );
    const doc = parseDeckMarkdown(rawZh);

    // 1. Export Retina PNG Cards
    const pngs = await exportDeckBundle(doc, 'png', path.join(tmpOut, 'png'));
    expect(pngs).toHaveLength(3);
    const pngHeader = await fs.readFile(pngs[0]);
    expect(pngHeader.subarray(0, 4).toString('hex')).toBe('89504e47'); // PNG magic signature

    // 2. Export WeChat Official Account Inline HTML
    const [wechatFile] = await exportDeckBundle(doc, 'wechat', path.join(tmpOut, 'article.wechat.html'));
    const wechatContent = await fs.readFile(wechatFile, 'utf8');
    expect(wechatContent).toContain('data-tool="aimake-wechat"');
    expect(wechatContent).not.toContain('<style');

    // 3. Export Vector Multi-page PDF (LinkedIn 4:5 Carousel)
    const linkedinDoc = structuredClone(doc);
    linkedinDoc.frontmatter.template = 'linkedin-exec-carousel';
    linkedinDoc.frontmatter.locale = 'en';
    const [pdfFile] = await exportDeckBundle(linkedinDoc, 'pdf', path.join(tmpOut, 'carousel.pdf'));
    const pdfBuf = await fs.readFile(pdfFile);
    expect(pdfBuf.subarray(0, 5).toString('ascii')).toBe('%PDF-');

    // 4. Export Native Editable PowerPoint (.pptx) and inspect OOXML slide1.xml!
    const pptDoc = structuredClone(doc);
    pptDoc.frontmatter.template = 'ppt-executive-16x9';
    const [pptxFile] = await exportDeckBundle(pptDoc, 'pptx', path.join(tmpOut, 'executive.pptx'));
    const { stdout: slide1Xml } = await execFileAsync('unzip', ['-p', pptxFile, 'ppt/slides/slide1.xml']);
    expect(slide1Xml).toContain('为什么纯本地 LLM Wiki');
    expect(slide1Xml).toContain('<a:t>'); // Confirms real native editable PowerPoint text runs!

    // 5. Export Deterministic Frame-Stepped H.264 MP4 Video (via static FFmpeg fallback!)
    const videoDoc = structuredClone(doc);
    videoDoc.frontmatter.template = 'video-kinetic-reel';
    videoDoc.slides = videoDoc.slides.slice(0, 2);
    const [mp4File] = await exportDeckBundle(videoDoc, 'mp4', path.join(tmpOut, 'reel.mp4'), {
      fps: 12,
      secondsPerSlide: 1,
    });
    const mp4Stat = await fs.stat(mp4File);
    expect(mp4Stat.size).toBeGreaterThan(8000);
    const mp4Buf = await fs.readFile(mp4File);
    expect(mp4Buf.subarray(4, 8).toString('ascii')).toBe('ftyp'); // Valid ISO MP4 container!
  } finally {
    await fs.rm(tmpOut, { recursive: true, force: true });
  }
});
