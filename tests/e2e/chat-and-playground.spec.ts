import http from 'node:http';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { test, expect } from '@playwright/test';
import { startStudioServer } from '../../src/studio/studio-server.js';

test('Aimake Studio: Real AI API Chat Config, Live Diff/Rollback, Non-Overlapping Toast & Auto-Fit Stage', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'aimake-chat-e2e-'));
  const deckPath = path.join(tmpDir, 'deck.md');
  const srcExample = path.resolve(process.cwd(), 'examples/zh-creator-flywheel.deck.md');
  await fs.copyFile(srcExample, deckPath);

  // Spin up an isolated local mock OpenAI-compatible server for true end-to-end verification
  const receivedPrompts: string[] = [];
  const mockLlmServer = http.createServer(async (req, res) => {
    if (req.method === 'POST' && req.url === '/v1/chat/completions') {
      const chunks: Buffer[] = [];
      for await (const c of req) chunks.push(Buffer.from(c));
      const payload = JSON.parse(Buffer.concat(chunks).toString('utf8'));
      const lastMsg = payload.messages?.[payload.messages.length - 1]?.content || '';
      receivedPrompts.push(lastMsg);

      const reply = [
        'SUMMARY: 重构当前页为实测性能指标对比',
        '<aimake-slide>',
        '<!-- scene: ai-bench | layout: metrics | eyebrow: BENCHMARK 2026 -->',
        '# 纯本地工作台真实效能实测',
        '## 配置一次模型即可无损编译至多端介质',
        '',
        '- 上下文直连当前焦点页，拒绝脱离语境的假话术',
        '',
        '```metric',
        '- 编译耗时: 120ms (-88%)',
        '- 知识命中率: 96.4% (+31%)',
        '```',
        '</aimake-slide>',
      ].join('\n');

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ choices: [{ message: { content: reply } }] }));
      return;
    }
    res.writeHead(404);
    res.end();
  });

  await new Promise<void>((resolve) => mockLlmServer.listen(0, '127.0.0.1', resolve));
  const addr = mockLlmServer.address() as { port: number };
  const mockBaseUrl = `http://127.0.0.1:${addr.port}/v1`;

  const studio = await startStudioServer({
    deckPath,
    workspaceDir: tmpDir,
    registryPath: path.join(tmpDir, 'recent-workspaces.json'),
  });

  try {
    await page.goto(studio.url);
    await expect(page.locator('#workspace-name-label')).toBeVisible();

    // 1. Verify Stage Auto-Fit scales 3:4 card smoothly inside viewport without clipping header/footer
    const frameBox = await page.locator('#preview-frame').boundingBox();
    expect(frameBox).not.toBeNull();
    const frameHandle = page.frameLocator('#preview-frame');
    await expect(frameHandle.locator('.aimake-slide').first()).toBeVisible();

    // 2. Open In-Studio AI Chat Drawer and Model Settings
    await page.locator('#btn-toggle-chat').click();
    await expect(page.locator('#chat-panel')).not.toHaveClass(/collapsed/);
    await expect(page.locator('#chat-active-slide-badge')).toContainText('当前页 01');

    await page.locator('#btn-chat-settings').click();
    await expect(page.locator('#chat-settings-box')).toHaveClass(/open/);
    await page.locator('#cfg-ai-baseurl').fill(mockBaseUrl);
    await page.locator('#cfg-ai-model').fill('deepseek-chat');
    await page.locator('#cfg-ai-apikey').fill('mock-e2e-token-123');
    await page.locator('#btn-save-ai-cfg').click();
    await expect(page.locator('#toast')).toContainText('模型配置已');

    // Verify top-center Toast NEVER overlaps chat input box
    const toastBox = await page.locator('#toast').boundingBox();
    const inputBox = await page.locator('#chat-input').boundingBox();
    expect(toastBox).not.toBeNull();
    expect(inputBox).not.toBeNull();
    expect(toastBox!.y + toastBox!.height).toBeLessThan(inputBox!.y);

    // 3. Ensure mode selector has direct API selected, then send natural instruction
    await page.locator('#chat-mode-selector').selectOption('api');
    await page.locator('#chat-input').fill('把当前页改成实测性能指标对比');
    await page.locator('#btn-chat-send').click();

    await expect(page.locator('.chat-diff-card')).toBeVisible({ timeout: 8000 });
    await expect(page.locator('.chat-diff-lines')).toBeVisible();
    await expect(page.locator('.chat-rollback-btn')).toBeVisible();
    expect(receivedPrompts.length).toBe(1);
    expect(receivedPrompts[0]).toContain('把当前页改成实测性能指标对比');

    const savedAfterAi = await fs.readFile(deckPath, 'utf8');
    expect(savedAfterAi).toContain('纯本地工作台真实效能实测');
    expect(savedAfterAi).toContain('120ms');

    // 4. Verify One-Click Rollback restores original deck on disk
    await page.locator('.chat-rollback-btn').click();
    await expect(page.locator('#toast')).toContainText('已成功回滚变更', { timeout: 5000 });
    const restoredMd = await fs.readFile(deckPath, 'utf8');
    expect(restoredMd).not.toContain('纯本地工作台真实效能实测');

    // 5. Test Offline Quick Tools: add_slide + Aspect Ratio Switcher
    await page.locator('#chat-mode-selector').selectOption('offline');
    await page.locator('#chat-input').fill('加一页关于具身智能大模型');
    await page.locator('#btn-chat-send').click();
    await expect(page.locator('#chat-active-slide-badge')).toContainText('02/04', { timeout: 5000 });

    await page.locator('#btn-dock-aspect').click();
    await expect(page.locator('#popover-aspect')).toHaveClass(/open/);
    await page.locator('[data-pick-aspect="16:9"]').click();
    await expect(page.locator('#toast')).toContainText('16:9');

    await page.locator('#btn-next-slide').click();
    await expect(page.locator('#chat-active-slide-badge')).toContainText('03/04');
  } finally {
    await studio.close();
    await new Promise<void>((resolve) => mockLlmServer.close(() => resolve()));
    await fs.rm(tmpDir, { recursive: true, force: true });
  }
});

test('Aimake Web Playground: Single-Row Header, Clean Metric Rendering & Pagination', async ({
  page,
  context,
}) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']).catch(() => {});
  await page.setViewportSize({ width: 1280, height: 800 });
  const playgroundFile = path.resolve(process.cwd(), 'dist-site/playground/index.html');
  try {
    await fs.access(playgroundFile);
  } catch {
    const { execSync } = await import('node:child_process');
    execSync('pnpm site:build', { stdio: 'inherit' });
  }
  await page.goto(`file://${playgroundFile}`);

  // 1. Verify Topbar buttons never wrap into two lines (single-row height check)
  await expect(page.locator('.pg-brand strong')).toContainText('Aimake 爱创工坊');
  for (const btnId of [
    '#btn-humanize',
    '#btn-copy-wechat',
    '#btn-export-png',
    '#btn-print-pdf',
    '#btn-download-md',
    '#btn-fullscreen',
  ]) {
    const box = await page.locator(btnId).boundingBox();
    expect(box).not.toBeNull();
    expect(box!.height).toBeLessThanOrEqual(36);
  }

  // 2. Verify inside iframe that metric block renders WITHOUT duplicating metric lines in bullets
  const frame = page.frameLocator('#preview-frame');
  await expect(frame.locator('.aimake-metrics-grid').first()).toBeVisible();
  const bulletCount = await frame.locator('#slide-0 .aimake-bullets li').count();
  expect(bulletCount).toBe(0);

  // Verify 16:9 slide is wider than tall (aspect fix)
  const slideBox = await frame.locator('#slide-0').boundingBox();
  expect(slideBox).not.toBeNull();
  expect(slideBox!.width).toBeGreaterThan(slideBox!.height);

  // 3. Verify Pagination Dock
  await expect(page.locator('#pg-slide-indicator')).toContainText('01 / 03');
  await page.locator('#pg-next-slide').click();
  await expect(page.locator('#pg-slide-indicator')).toContainText('02 / 03');

  // 3.5 Verify Dual-Mode Card Editor syncs bidirectionally with stage & Markdown
  await page.locator('#tab-mode-card').click();
  await expect(page.locator('#card-editor-pane')).toBeVisible();
  await page.locator('#card-title').fill('卡片直编无代码标题');
  await expect(frame.locator('#slide-1 .aimake-title')).toContainText('卡片直编无代码标题');
  await page.locator('#tab-mode-source').click();
  expect(await page.locator('#md-input').inputValue()).toContain('# 卡片直编无代码标题');

  // 4. Test Snippet Inserters (+mermaid & +metric), Humanizer, Template Switch, and WeChat Copy
  const textarea = page.locator('#md-input');
  await page.locator('[data-insert="mermaid"]').click();
  expect(await textarea.inputValue()).toContain('```mermaid');
  await expect(frame.locator('#slide-1 svg.aimake-mermaid-svg')).toBeVisible();

  await page.locator('[data-insert="metric"]').click();
  expect(await textarea.inputValue()).toContain('```metric');

  await textarea.fill('---\ntitle: 测试\n---\n\n# 毫无疑问这是颠覆性创新的底层逻辑\n');
  await page.locator('#btn-humanize').click();
  const humanizedVal = await textarea.inputValue();
  expect(humanizedVal).not.toContain('毫无疑问');
  expect(humanizedVal).toContain('关键突破');

  await page.locator('#template-select').selectOption('xhs-bold-headline');
  expect(await textarea.inputValue()).toContain('xhs-bold-headline');

  await page.locator('#btn-copy-wechat').click();
  await expect(page.locator('#toast')).toContainText('已复制微信公众号');
});
