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

export interface SlideFramePlan {
  perSlideFrames: number[];
  slideFrameOffsets: number[];
  totalFrames: number;
}

export type VideoEncoderType = 'h264_videotoolbox' | 'libx264';

export interface VideoEncoderConfig {
  encoder: VideoEncoderType;
  args: string[];
}

let cachedEncoderConfig: VideoEncoderConfig | null = null;

export function resetVideoEncoderCacheForTesting(): void {
  cachedEncoderConfig = null;
}

/**
 * Probes whether the macOS hardware-accelerated H.264 VideoToolbox encoder is functional.
 */
export async function probeVideoToolboxSupport(ffmpegBin: string): Promise<boolean> {
  if (process.platform !== 'darwin') {
    return false;
  }
  try {
    await execFileAsync(
      ffmpegBin,
      [
        '-f',
        'lavfi',
        '-i',
        'color=c=black:s=16x16:d=0.04',
        '-c:v',
        'h264_videotoolbox',
        '-pix_fmt',
        'yuv420p',
        '-f',
        'null',
        '-',
      ],
      { timeout: 2500 }
    );
    return true;
  } catch {
    return false;
  }
}

/**
 * Resolves the optimal video encoder for H.264 MP4 synthesis.
 * On macOS, probes h264_videotoolbox hardware encoder and gracefully falls back to CPU libx264.
 */
export async function resolveOptimalVideoEncoder(
  ffmpegBin: string,
  preferred?: 'auto' | VideoEncoderType
): Promise<VideoEncoderConfig> {
  if (preferred === 'libx264') {
    return {
      encoder: 'libx264',
      args: ['-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-preset', 'ultrafast'],
    };
  }

  if (preferred === 'h264_videotoolbox') {
    const isSupported = await probeVideoToolboxSupport(ffmpegBin);
    if (isSupported) {
      return {
        encoder: 'h264_videotoolbox',
        args: ['-c:v', 'h264_videotoolbox', '-pix_fmt', 'yuv420p', '-b:v', '6M'],
      };
    }
    return {
      encoder: 'libx264',
      args: ['-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-preset', 'ultrafast'],
    };
  }

  // 'auto' mode:
  if (cachedEncoderConfig) {
    return cachedEncoderConfig;
  }

  if (process.platform === 'darwin') {
    const isSupported = await probeVideoToolboxSupport(ffmpegBin);
    if (isSupported) {
      cachedEncoderConfig = {
        encoder: 'h264_videotoolbox',
        args: ['-c:v', 'h264_videotoolbox', '-pix_fmt', 'yuv420p', '-b:v', '6M'],
      };
      return cachedEncoderConfig;
    }
  }

  cachedEncoderConfig = {
    encoder: 'libx264',
    args: ['-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-preset', 'ultrafast'],
  };
  return cachedEncoderConfig;
}

/**
 * Computes deterministic slide frame allocations using cumulative timestamp difference anchoring.
 *
 * Avoids cumulative floating-point duration drift over long presentations (>10-20 slides) by tracking
 * the accumulated presentation timeline in milliseconds and calculating frame allocations as:
 *   endFrame = Math.round((accumulatedMs * fps) / 1000)
 *   slideFrames = Math.max(1, endFrame - prevEndFrame)
 *
 * This guarantees the alignment drift between video frames and audio total duration remains strictly
 * <= 0.5 frame (well within <= 1 frame) across any deck length.
 */
export function computeCumulativeSlideFrames(
  slideCount: number,
  fps: number,
  options?: {
    slideDurationsMs?: number[];
    secondsPerSlide?: number;
    minTotalFrames?: number;
  }
): SlideFramePlan {
  if (slideCount <= 0) {
    return {
      perSlideFrames: [],
      slideFrameOffsets: [],
      totalFrames: options?.minTotalFrames ?? 12,
    };
  }

  const secondsPerSlide = options?.secondsPerSlide ?? 2;
  const defaultSlideMs = Math.max(1, Math.round(secondsPerSlide * 1000));
  const minTotalFrames = options?.minTotalFrames ?? 12;

  const perSlideFrames: number[] = [];
  const slideFrameOffsets: number[] = [];
  let accumulatedMs = 0;
  let prevEndFrame = 0;

  for (let idx = 0; idx < slideCount; idx++) {
    const rawMs = options?.slideDurationsMs?.[idx];
    const ms = typeof rawMs === 'number' && Number.isFinite(rawMs) && rawMs > 0
      ? rawMs
      : defaultSlideMs;

    accumulatedMs += ms;
    const endFrame = Math.round((accumulatedMs * fps) / 1000);
    const count = Math.max(1, endFrame - prevEndFrame);
    slideFrameOffsets.push(prevEndFrame);
    perSlideFrames.push(count);
    prevEndFrame += count;
  }

  const calculatedTotal = perSlideFrames.reduce((acc, n) => acc + n, 0);
  const totalFrames = Math.max(minTotalFrames, calculatedTotal);

  return {
    perSlideFrames,
    slideFrameOffsets,
    totalFrames,
  };
}

/**
 * Ensures all web fonts, images, and visual elements on the page or inside a target container
 * are fully loaded, decoded, and rasterized before screenshot capture.
 *
 * Includes timeout fallbacks to prevent hanging on unreachable remote images.
 */
export async function waitForAssetsAndFonts(
  page: import('playwright').Page,
  target?: string | number,
  timeoutMs = 3000
): Promise<void> {
  await page.evaluate(
    async ({ targetArg, timeout }) => {
      // 1. Await fonts ready
      if (document.fonts && typeof document.fonts.ready?.then === 'function') {
        try {
          await Promise.race([
            document.fonts.ready,
            new Promise((resolve) => setTimeout(resolve, timeout)),
          ]);
        } catch {
          // ignore font loading error/timeout
        }
      }

      // 2. Locate target element
      let root: Element | null = null;
      if (typeof targetArg === 'number') {
        const slides = document.querySelectorAll<HTMLElement>('.aimake-slide');
        root = slides[targetArg] || document.body;
      } else if (typeof targetArg === 'string' && targetArg) {
        root = document.querySelector(targetArg);
      } else {
        root = document.body || document.documentElement;
      }
      if (!root) return;

      // 3. Ensure all <img> tags are completed and decoded
      const images = Array.from(root.querySelectorAll<HTMLImageElement>('img'));
      await Promise.all(
        images.map((img) => {
          if (img.complete && img.naturalWidth > 0) {
            return typeof img.decode === 'function' ? img.decode().catch(() => {}) : Promise.resolve();
          }
          return new Promise<void>((resolve) => {
            let done = false;
            const finish = () => {
              if (!done) {
                done = true;
                img.removeEventListener('load', finish);
                img.removeEventListener('error', finish);
                resolve();
              }
            };
            img.addEventListener('load', finish, { once: true });
            img.addEventListener('error', finish, { once: true });
            setTimeout(finish, timeout);
          });
        })
      );

      // 4. Double rAF paint flush
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => resolve());
        });
      });
    },
    { targetArg: target, timeout: timeoutMs }
  );
}

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
    await waitForAssetsAndFonts(page);
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
    await waitForAssetsAndFonts(page);
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
    videoEncoder?: 'auto' | VideoEncoderType;
  }
): Promise<string> {
  await fs.mkdir(path.dirname(outFile), { recursive: true });
  const fps = options?.fps ?? doc.frontmatter.fps ?? 24;
  const secondsPerSlide = options?.secondsPerSlide ?? doc.frontmatter.secondsPerSlide ?? 2;
  const { slideFrameOffsets, totalFrames } = computeCumulativeSlideFrames(
    doc.slides.length,
    fps,
    {
      slideDurationsMs: options?.slideDurationsMs,
      secondsPerSlide,
      minTotalFrames: 12,
    }
  );

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
  const encoderConfig = await resolveOptimalVideoEncoder(ffmpegBin, options?.videoEncoder);
  const browser = await launchSmartBrowser();
  let ffProc: any = null;

  try {
    const page = await browser.newPage({
      viewport: { width, height },
      deviceScaleFactor: 1,
    });
    await page.setContent(motionHtml, { waitUntil: 'load' });
    await waitForAssetsAndFonts(page);
    await page.waitForSelector('.aimake-slide', { timeout: 5000 });

    const hasCustomSeek = await page.evaluate(
      () => typeof (window as unknown as { aimakeSeek?: unknown }).aimakeSeek === 'function'
    );

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
      ffArgs.push('-af', 'loudnorm=I=-14:TP=-1.0:LRA=11', '-c:a', 'aac', '-shortest');
    }
    if (subtitleInputIdx !== null) {
      ffArgs.push('-c:s', 'mov_text');
    }

    ffArgs.push(
      ...encoderConfig.args,
      '-movflags',
      '+faststart',
      '-metadata',
      'comment=Generated with Aimake (aimake.cc) — AI-Synthesized Media',
      outFile
    );

    const proc = spawn(ffmpegBin, ffArgs, { stdio: ['pipe', 'ignore', 'pipe'] });
    ffProc = proc;
    const procStdin = proc.stdin;
    const procStderr = proc.stderr;
    if (!procStdin || !procStderr) {
      throw new Error('Failed to spawn FFmpeg with piped stdio');
    }

    let stderrLog = '';
    let stdinBroken = false;
    procStderr.on('data', (chunk: Buffer) => {
      stderrLog += chunk.toString();
    });
    procStdin.on('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'EPIPE' || err.code === 'ERR_STREAM_DESTROYED') {
        stdinBroken = true;
      }
    });
    // Register close/error listener immediately before piping frames to avoid
    // missing early 'close' events (e.g. when -shortest completes before totalFrames).
    const ffClosePromise = new Promise<void>((resolve, reject) => {
      proc.once('close', (code: number | null) => {
        if (code === 0) resolve();
        else
          reject(
            new Error(
              `FFmpeg exited with code ${code} [encoder: ${encoderConfig.encoder}]: ${stderrLog.slice(-500)}`
            )
          );
      });
      proc.once('error', reject);
    });
    // Catch early rejection to avoid unhandled rejection during frame rendering
    ffClosePromise.catch(() => {});

    const entranceFrames = Math.ceil(Math.max(1, fps * 0.35));
    const settledSlideCache = new Map<number, Buffer>();

    for (let f = 0; f < totalFrames; f++) {
      if (stdinBroken || proc.exitCode !== null || procStdin.destroyed) {
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
        !hasCustomSeek &&
        localSlideFrame > entranceFrames &&
        settledSlideCache.has(activeSlideIdx);

      let pngBuf: Buffer;
      if (canReuseSettled) {
        pngBuf = settledSlideCache.get(activeSlideIdx)!;
      } else {
        await page.evaluate(
          ({ frame, frameRate, slideIdx, localFrame, hasCustomTiming }) => {
            const w = window as unknown as {
              aimakeSeek?: (fr: number, rate: number) => void;
            };
            if (hasCustomTiming && typeof w.aimakeSeek === 'function') {
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
            hasCustomTiming: hasCustomSeek,
          }
        );

        if (localSlideFrame === 0) {
          // Slide transition: wait for active slide elements and fonts before screenshotting
          await waitForAssetsAndFonts(page, activeSlideIdx, 2000);
        }

        pngBuf = await page.screenshot({ type: 'png' });
        if (!hasCustomSeek && localSlideFrame >= entranceFrames && !settledSlideCache.has(activeSlideIdx)) {
          settledSlideCache.set(activeSlideIdx, pngBuf);
        }
      }

      if (stdinBroken || proc.exitCode !== null || procStdin.destroyed) {
        break;
      }
      const canWrite = procStdin.write(pngBuf);
      if (!canWrite && !stdinBroken) {
        await new Promise<void>((resolve) => {
          let resolved = false;
          const done = () => {
            if (resolved) return;
            resolved = true;
            procStdin.off('drain', done);
            procStdin.off('error', done);
            procStdin.off('close', done);
            proc.off('close', done);
            proc.off('exit', done);
            resolve();
          };
          if (proc.exitCode !== null || procStdin.destroyed) {
            resolve();
            return;
          }
          procStdin.once('drain', done);
          procStdin.once('error', done);
          procStdin.once('close', done);
          proc.once('close', done);
          proc.once('exit', done);
        });
      }
    }

    if (!procStdin.destroyed) {
      procStdin.end();
    }
    await ffClosePromise;

    return outFile;
  } finally {
    try {
      if (ffProc) {
        if (ffProc.stdin && !ffProc.stdin.destroyed) {
          try {
            ffProc.stdin.destroy();
          } catch {
            // ignore
          }
        }
        if (ffProc.exitCode === null && !ffProc.killed) {
          try {
            ffProc.kill('SIGKILL');
          } catch {
            // ignore
          }
        }
      }
    } finally {
      await browser.close().catch(() => {});
    }
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
    videoEncoder?: 'auto' | VideoEncoderType;
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
        videoEncoder: options?.videoEncoder,
      }),
    ];
  }
  if (format === 'capcut') {
    const slidesDir = path.join(outTarget, 'slides');
    const slideImages =
      (options as any)?.slideImages && Array.isArray((options as any).slideImages)
        ? (options as any).slideImages
        : await exportDeckToPngs(doc, slidesDir, {
            customTemplatesDir: options?.customTemplatesDir,
          });
    const res = await buildCapCutDraft(doc, {
      outputDir: outTarget,
      installLocal: options?.installLocal,
      targetApp: options?.targetApp,
      audioTrackPath: options?.audioTrackPath,
      slideDurationsMs: options?.slideDurationsMs,
      slideImages,
      fps: options?.fps,
      localProjectsDir: (options as any)?.localProjectsDir,
    });
    const paths = [res.contentPath, res.metaPath, res.coverPath, ...slideImages];
    if (res.localDraftPath) {
      paths.push(res.localDraftPath);
    }
    return paths;
  }
  throw new Error(`Unsupported format: ${format}`);
}
