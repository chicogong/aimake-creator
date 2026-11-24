import fsSync from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { execFile, spawn } from 'node:child_process';
import { promisify } from 'node:util';
import { createRequire } from 'node:module';
import type { Browser } from 'playwright';
import type { DeckDocument } from '../schema/types.js';
import { compileDeckToHtml } from './html-compiler.js';
import { renderWeChatInlineHtml } from './wechat-inliner.js';
import { exportDeckToPptx } from './exporter-pptx.js';
import { buildCapCutDraft } from './capcut-draft-builder.js';

const execFileAsync = promisify(execFile);
const require = createRequire(import.meta.url);

/**
 * Zero-download browser resolver: dynamically loads optional Playwright so slim npm
 * installs stay fast, reusing Chrome/Edge or Playwright Chromium when exporting PNG/PDF/MP4.
 */
export async function launchSmartBrowser(): Promise<Browser> {
  let chromium: typeof import('playwright')['chromium'];
  try {
    ({ chromium } = await import('playwright'));
  } catch {
    throw new Error(
      'PNG/PDF/MP4 export requires Playwright. Install it with: npm i -g playwright (or pnpm add -D playwright)'
    );
  }

  try {
    const defaultExec = chromium.executablePath();
    if (defaultExec && fsSync.existsSync(defaultExec)) {
      return await chromium.launch({ headless: true });
    }
  } catch {
    // fall through to system browser channels
  }

  for (const channel of ['chrome', 'msedge'] as const) {
    try {
      return await chromium.launch({ channel, headless: true });
    } catch {
      // try next channel
    }
  }

  return chromium.launch({ headless: true });
}

export async function resolveWorkingFfmpegBinary(): Promise<string> {
  // 1. Check if system ffmpeg actually executes cleanly (guards against broken Homebrew dylibs!)
  try {
    await execFileAsync('ffmpeg', ['-version'], { timeout: 3000 });
    return 'ffmpeg';
  } catch {
    // 2. Fallback to optional @ffmpeg-installer/ffmpeg binary if installed
    try {
      const installer = require('@ffmpeg-installer/ffmpeg') as { path: string };
      await execFileAsync(installer.path, ['-version'], { timeout: 3000 });
      return installer.path;
    } catch {
      throw new Error(
        'FFmpeg not found. Install system ffmpeg (e.g. brew install ffmpeg) or add @ffmpeg-installer/ffmpeg.'
      );
    }
  }
}

export async function exportDeckToPngs(
  doc: DeckDocument,
  outDir: string,
  options?: { deviceScaleFactor?: number; customTemplatesDir?: string }
): Promise<string[]> {
  await fs.mkdir(outDir, { recursive: true });
  const { html, manifest } = await compileDeckToHtml(doc, {
    editable: false,
    customTemplatesDir: options?.customTemplatesDir,
  });

  const browser = await launchSmartBrowser();
  try {
    const context = await browser.newContext({
      viewport: { width: manifest.width, height: manifest.height },
      deviceScaleFactor: options?.deviceScaleFactor ?? 2,
    });
    const page = await context.newPage();
    await page.setContent(html, { waitUntil: 'load' });
    await page.waitForSelector('.aimake-slide', { timeout: 5000 });

    const slideHandles = await page.$$('.aimake-slide');
    const files: string[] = [];
    for (let i = 0; i < slideHandles.length; i++) {
      const fileName = `slide-${String(i + 1).padStart(2, '0')}.png`;
      const fullPath = path.join(outDir, fileName);
      await slideHandles[i].screenshot({ path: fullPath, type: 'png' });
      files.push(fullPath);
    }
    return files;
  } finally {
    await browser.close();
  }
}

export async function exportDeckToPdf(
  doc: DeckDocument,
  outFile: string,
  options?: { customTemplatesDir?: string }
): Promise<string> {
  await fs.mkdir(path.dirname(outFile), { recursive: true });
  const { html, manifest } = await compileDeckToHtml(doc, {
    editable: false,
    customTemplatesDir: options?.customTemplatesDir,
  });

  // Inject print page-break CSS so each .aimake-slide maps 1:1 to a vector PDF page!
  const printStyle = `
  <style>
    @page { size: ${manifest.width}px ${manifest.height}px; margin: 0; }
    html, body { margin: 0 !important; padding: 0 !important; background: transparent !important; display: block !important; }
    #aimake-deck-root { display: block !important; gap: 0 !important; padding: 0 !important; }
    .aimake-slide { page-break-after: always; break-after: page; margin: 0 !important; box-shadow: none !important; }
    .aimake-slide:last-child { page-break-after: auto; break-after: auto; }
  </style>`;
  const pdfHtml = html.replace('</head>', `${printStyle}\n</head>`);

  const browser = await launchSmartBrowser();
  try {
    const page = await browser.newPage({
      viewport: { width: manifest.width, height: manifest.height },
    });
    await page.setContent(pdfHtml, { waitUntil: 'load' });
    await page.waitForSelector('.aimake-slide', { timeout: 5000 });
    await page.pdf({
      path: outFile,
      width: `${manifest.width}px`,
      height: `${manifest.height}px`,
      printBackground: true,
      margin: { top: '0px', right: '0px', bottom: '0px', left: '0px' },
    });
    return outFile;
  } finally {
    await browser.close();
  }
}

/**
 * Deterministic frame-stepped HTML Motion -> H.264 MP4 exporter (`window.aimakeSeek(frame, fps)`).
 * Zero dropped frames, crisp typography, automatic static FFmpeg fallback.
 */
export async function exportDeckToMp4(
  doc: DeckDocument,
  outFile: string,
  options?: {
    fps?: number;
    secondsPerSlide?: number;
    slideDurationsMs?: number[];
    audioTrackPath?: string;
    subtitlesSrtPath?: string;
    customTemplatesDir?: string;
  }
): Promise<string> {
  await fs.mkdir(path.dirname(outFile), { recursive: true });
  const fps = options?.fps ?? doc.frontmatter.fps ?? 24;
  const secondsPerSlide = options?.secondsPerSlide ?? doc.frontmatter.secondsPerSlide ?? 2;
  const perSlideFrames = doc.slides.map((_, idx) => {
    const ms = options?.slideDurationsMs?.[idx];
    if (typeof ms === 'number' && Number.isFinite(ms) && ms > 0) {
      return Math.max(1, Math.round((ms / 1000) * fps));
    }
    return Math.max(1, Math.round(secondsPerSlide * fps));
  });
  const totalFrames = Math.max(
    12,
    perSlideFrames.reduce((acc, n) => acc + n, 0)
  );
  const slideFrameOffsets: number[] = [];
  let running = 0;
  for (const count of perSlideFrames) {
    slideFrameOffsets.push(running);
    running += count;
  }

  const { html, manifest } = await compileDeckToHtml(doc, {
    editable: false,
    customTemplatesDir: options?.customTemplatesDir,
  });

  // Ensure even pixel dimensions for yuv420p H.264 compatibility
  const width = manifest.width % 2 === 0 ? manifest.width : manifest.width + 1;
  const height = manifest.height % 2 === 0 ? manifest.height : manifest.height + 1;

  const motionViewportCss = `
  <style>
    html, body { margin: 0 !important; padding: 0 !important; width: ${width}px; height: ${height}px; overflow: hidden !important; }
    #aimake-deck-root { margin: 0 !important; padding: 0 !important; width: ${width}px; height: ${height}px; position: relative; }
  </style>`;
  const motionHtml = html.replace('</head>', `${motionViewportCss}\n</head>`);

  const ffmpegBin = await resolveWorkingFfmpegBinary();
  const browser = await launchSmartBrowser();

  try {
    const page = await browser.newPage({
      viewport: { width, height },
      deviceScaleFactor: 1,
    });
    await page.setContent(motionHtml, { waitUntil: 'load' });
    await page.waitForSelector('.aimake-slide', { timeout: 5000 });

    const ffArgs: string[] = [
      '-y',
      '-f',
      'image2pipe',
      '-vcodec',
      'png',
      '-framerate',
      String(fps),
      '-i',
      '-',
    ];

    let nextInputIdx = 1;
    let audioInputIdx: number | null = null;
    let subtitleInputIdx: number | null = null;

    if (options?.audioTrackPath) {
      ffArgs.push('-i', options.audioTrackPath);
      audioInputIdx = nextInputIdx++;
    }
    if (options?.subtitlesSrtPath) {
      ffArgs.push('-i', options.subtitlesSrtPath);
      subtitleInputIdx = nextInputIdx++;
    }

    ffArgs.push('-map', '0:v:0');
    if (audioInputIdx !== null) {
      ffArgs.push('-map', `${audioInputIdx}:a:0`);
    }
    if (subtitleInputIdx !== null) {
      ffArgs.push('-map', `${subtitleInputIdx}:s:0`);
    }

    if (audioInputIdx !== null) {
      ffArgs.push('-af', 'loudnorm=I=-16:TP=-1.5:LRA=11', '-c:a', 'aac', '-shortest');
    }
    if (subtitleInputIdx !== null) {
      ffArgs.push('-c:s', 'mov_text');
    }

    ffArgs.push(
      '-c:v',
      'libx264',
      '-pix_fmt',
      'yuv420p',
      '-preset',
      'ultrafast',
      '-movflags',
      '+faststart',
      '-metadata',
      'comment=Generated with Aimake (aimake.cc) — AI-Synthesized Media',
      outFile
    );

    const ffProc = spawn(ffmpegBin, ffArgs, { stdio: ['pipe', 'ignore', 'pipe'] });
    let stderrLog = '';
    let stdinBroken = false;
    ffProc.stderr.on('data', (chunk: Buffer) => {
      stderrLog += chunk.toString();
    });
    ffProc.stdin.on('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'EPIPE' || err.code === 'ERR_STREAM_DESTROYED') {
        stdinBroken = true;
      }
    });

    const hasCustomDurations = Boolean(options?.slideDurationsMs && options.slideDurationsMs.length > 0);
    const entranceFrames = Math.ceil(Math.max(1, fps * 0.35));
    const settledSlideCache = new Map<number, Buffer>();

    for (let f = 0; f < totalFrames; f++) {
      if (stdinBroken || ffProc.exitCode !== null || ffProc.stdin.destroyed) {
        break;
      }
      let activeSlideIdx = 0;
      for (let i = slideFrameOffsets.length - 1; i >= 0; i--) {
        if (f >= slideFrameOffsets[i]) {
          activeSlideIdx = i;
          break;
        }
      }
      const localSlideFrame = f - (slideFrameOffsets[activeSlideIdx] ?? 0);
      const canReuseSettled =
        hasCustomDurations &&
        localSlideFrame > entranceFrames &&
        settledSlideCache.has(activeSlideIdx);

      let pngBuf: Buffer;
      if (canReuseSettled) {
        pngBuf = settledSlideCache.get(activeSlideIdx)!;
      } else {
        await page.evaluate(
          ({ frame, frameRate, slideIdx, localFrame, useCustomTiming }) => {
            const w = window as unknown as {
              aimakeSeek?: (fr: number, rate: number) => void;
            };
            if (!useCustomTiming && typeof w.aimakeSeek === 'function') {
              w.aimakeSeek(frame, frameRate);
            } else {
              const progress = Math.min(1, localFrame / Math.max(1, frameRate * 0.35));
              document.querySelectorAll<HTMLElement>('.aimake-slide').forEach((el, idx) => {
                if (idx === slideIdx) {
                  el.style.display = 'flex';
                  el.style.opacity = String(0.25 + 0.75 * progress);
                  el.style.transform = `translateY(${Math.round((1 - progress) * 18)}px)`;
                } else {
                  el.style.display = 'none';
                }
              });
            }
          },
          {
            frame: f,
            frameRate: fps,
            slideIdx: activeSlideIdx,
            localFrame: localSlideFrame,
            useCustomTiming: hasCustomDurations,
          }
        );

        pngBuf = await page.screenshot({ type: 'png' });
        if (hasCustomDurations && localSlideFrame >= entranceFrames && !settledSlideCache.has(activeSlideIdx)) {
          settledSlideCache.set(activeSlideIdx, pngBuf);
        }
      }

      if (stdinBroken || ffProc.exitCode !== null || ffProc.stdin.destroyed) {
        break;
      }
      const canWrite = ffProc.stdin.write(pngBuf);
      if (!canWrite && !stdinBroken) {
        await new Promise<void>((resolve) => {
          const done = () => {
            ffProc.stdin.off('drain', done);
            ffProc.stdin.off('error', done);
            ffProc.stdin.off('close', done);
            resolve();
          };
          ffProc.stdin.once('drain', done);
          ffProc.stdin.once('error', done);
          ffProc.stdin.once('close', done);
        });
      }
    }

    if (!ffProc.stdin.destroyed) {
      ffProc.stdin.end();
    }
    await new Promise<void>((resolve, reject) => {
      ffProc.on('close', (code) => {
        if (code === 0) resolve();
        else reject(new Error(`FFmpeg exited with code ${code}: ${stderrLog.slice(-500)}`));
      });
      ffProc.on('error', reject);
    });

    return outFile;
  } finally {
    await browser.close();
  }
}

export async function exportDeckBundle(
  doc: DeckDocument,
  format: 'png' | 'wechat' | 'pdf' | 'pptx' | 'mp4' | 'html' | 'capcut',
  outTarget: string,
  options?: {
    fps?: number;
    secondsPerSlide?: number;
    slideDurationsMs?: number[];
    audioTrackPath?: string;
    subtitlesSrtPath?: string;
    customTemplatesDir?: string;
    installLocal?: boolean;
    targetApp?: 'capcut' | 'jianying' | 'auto';
  }
): Promise<string[]> {
  if (format === 'wechat') {
    await fs.mkdir(path.dirname(outTarget), { recursive: true });
    const inlineHtml = renderWeChatInlineHtml(doc);
    await fs.writeFile(outTarget, inlineHtml, 'utf8');
    return [outTarget];
  }
  if (format === 'html') {
    await fs.mkdir(path.dirname(outTarget), { recursive: true });
    const { html } = await compileDeckToHtml(doc, {
      editable: false,
      customTemplatesDir: options?.customTemplatesDir,
    });
    await fs.writeFile(outTarget, html, 'utf8');
    return [outTarget];
  }
  if (format === 'png') {
    return exportDeckToPngs(doc, outTarget, { customTemplatesDir: options?.customTemplatesDir });
  }
  if (format === 'pdf') {
    return [await exportDeckToPdf(doc, outTarget, { customTemplatesDir: options?.customTemplatesDir })];
  }
  if (format === 'pptx') {
    await fs.mkdir(path.dirname(outTarget), { recursive: true });
    return [await exportDeckToPptx(doc, outTarget)];
  }
  if (format === 'mp4') {
    return [
      await exportDeckToMp4(doc, outTarget, {
        fps: options?.fps,
        secondsPerSlide: options?.secondsPerSlide,
        slideDurationsMs: options?.slideDurationsMs,
        audioTrackPath: options?.audioTrackPath,
        subtitlesSrtPath: options?.subtitlesSrtPath,
        customTemplatesDir: options?.customTemplatesDir,
      }),
    ];
  }
  if (format === 'capcut') {
    const res = await buildCapCutDraft(doc, {
      outputDir: outTarget,
      installLocal: options?.installLocal,
      targetApp: options?.targetApp,
      audioTrackPath: options?.audioTrackPath,
      slideDurationsMs: options?.slideDurationsMs,
      fps: options?.fps,
    });
    const paths = [res.contentPath, res.metaPath, res.coverPath];
    if (res.localDraftPath) {
      paths.push(res.localDraftPath);
    }
    return paths;
  }
  throw new Error(`Unsupported format: ${format}`);
}
