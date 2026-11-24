import fsSync from 'node:fs';
import { lstat, mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import zlib from 'node:zlib';
import { afterEach, describe, expect, it } from 'vitest';
import {
  buildCapCutDraft,
  detectLocalDraftDirectories,
  getCanvasDimensions,
  US_PER_MS,
  US_PER_SECOND,
} from '../src/renderer/capcut-draft-builder.js';
import { exportDeckBundle } from '../src/renderer/exporter-media.js';
import { handleMcpRequest } from '../src/mcp/mcp-server.js';
import type { DeckDocument } from '../src/schema/types.js';

// --- Test Utilities ---

const tempDirs: string[] = [];

async function makeTempDir(prefix: string): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), prefix));
  tempDirs.push(dir);
  return dir;
}

afterEach(async () => {
  while (tempDirs.length > 0) {
    const dir = tempDirs.pop()!;
    await rm(dir, { recursive: true, force: true });
  }
});

/**
 * Standard CRC32 table for pure Node PNG synthesis
 */
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  }
  crcTable[n] = c >>> 0;
}

function crc32(buf: Buffer): number {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c = (c >>> 8) ^ crcTable[(c ^ buf[i]) & 0xff];
  }
  return ~c;
}

function createChunk(type: string, data: Buffer): Buffer {
  const typeBuf = Buffer.from(type, 'ascii');
  const len = data.length;
  const chunk = Buffer.alloc(4 + 4 + len + 4);
  chunk.writeUInt32BE(len, 0);
  typeBuf.copy(chunk, 4);
  data.copy(chunk, 8);
  const crc = crc32(Buffer.concat([typeBuf, data]));
  chunk.writeInt32BE(crc, 8 + len);
  return chunk;
}

/**
 * Generates a valid standard PNG image buffer (width x height, RGB)
 */
function createValidPng(width = 120, height = 80, rgb = [64, 128, 255]): Buffer {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // 8-bit depth
  ihdrData[9] = 2; // RGB
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;

  const ihdrChunk = createChunk('IHDR', ihdrData);

  const scanlineLength = 1 + width * 3;
  const rawScanlines = Buffer.alloc(scanlineLength * height);
  for (let y = 0; y < height; y++) {
    const rowOffset = y * scanlineLength;
    rawScanlines[rowOffset] = 0; // Filter 0
    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 3;
      rawScanlines[pxOffset] = rgb[0];
      rawScanlines[pxOffset + 1] = rgb[1];
      rawScanlines[pxOffset + 2] = rgb[2];
    }
  }

  const idatChunk = createChunk('IDAT', zlib.deflateSync(rawScanlines));
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

/**
 * Generates a valid RIFF PCM WAV buffer for audio tests
 */
function createValidWav(durationSec = 2): Buffer {
  const sampleRate = 44100;
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const dataSize = Math.floor(sampleRate * durationSec * blockAlign);
  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20); // PCM
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(bitsPerSample, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  return buffer;
}

function makeSampleDeck(aspect: DeckDocument['frontmatter']['aspect'] = '16:9'): DeckDocument {
  return {
    filePath: '/tmp/test.deck.md',
    frontmatter: {
      template: 'apple-dark-keynote',
      title: 'CapCut Draft Test Deck',
      aspect,
      locale: 'zh-CN',
      fps: 30,
    },
    slides: [
      {
        id: 'slide-1',
        layout: 'cover',
        title: '第一页：创新产品发布',
        subtitle: '下一代本地多模态创作引擎',
        speech: '欢迎来到爱创工坊产品发布会。今天我们将展示全新剪映草稿引擎。',
      },
      {
        id: 'slide-2',
        layout: 'bullets',
        title: '第二页：核心技术架构',
        bullets: ['确定性 AST 布局编译器', '全本地音视频六轨编排', '剪映专业版无损草稿导出'],
        speech: '系统包含确定性 AST 布局编译器，以及与剪映专业版完全兼容的六轨时间轴。',
      },
    ],
  };
}

// --- Test Suites ---

describe('T-02: CapCut Draft Builder & Exporter Media Pipeline', () => {
  it('verifies microsecond timeline constants and precise segment calculations', async () => {
    expect(US_PER_SECOND).toBe(1_000_000);
    expect(US_PER_MS).toBe(1_000);

    const tmp = await makeTempDir('capcut-timeline-');
    const img1 = join(tmp, 'mock-slide-1.png');
    const img2 = join(tmp, 'mock-slide-2.png');
    await writeFile(img1, createValidPng(640, 360));
    await writeFile(img2, createValidPng(640, 360));

    const wavPath = join(tmp, 'master.wav');
    await writeFile(wavPath, createValidWav(6));

    const deck = makeSampleDeck('16:9');
    const slideDurationsMs = [2500, 3500]; // 2.5s and 3.5s -> total 6s (6,000,000 us)

    const result = await buildCapCutDraft(deck, {
      outputDir: tmp,
      slideImages: [img1, img2],
      slideDurationsMs,
      audioTrackPath: wavPath,
    });

    expect(result.durationUs).toBe(6_000_000);
    expect(result.durationMs).toBe(6_000);

    // Video materials
    expect(result.content.materials.videos).toHaveLength(2);
    expect(result.content.materials.videos[0].duration).toBe(2_500_000);
    expect(result.content.materials.videos[1].duration).toBe(3_500_000);

    // Track 0 (video main track) segments
    const videoTrack = result.content.tracks.find((t) => t.id === 'track_video_main')!;
    expect(videoTrack.segments).toHaveLength(2);
    expect(videoTrack.segments[0].target_timerange).toEqual({
      start: 0,
      duration: 2_500_000,
    });
    expect(videoTrack.segments[1].target_timerange).toEqual({
      start: 2_500_000,
      duration: 3_500_000,
    });

    // Track 2 (title text track)
    const titleTrack = result.content.tracks.find((t) => t.id === 'track_text_titles')!;
    expect(titleTrack.segments).toHaveLength(2);
    expect(titleTrack.segments[0].target_timerange.start).toBe(0);
    expect(titleTrack.segments[0].target_timerange.duration).toBe(2_500_000);
    expect(titleTrack.segments[1].target_timerange.start).toBe(2_500_000);
    expect(titleTrack.segments[1].target_timerange.duration).toBe(3_500_000);

    // Track 3 (subtitle text track)
    const subTrack = result.content.tracks.find((t) => t.id === 'track_text_subtitles')!;
    expect(subTrack.segments).toHaveLength(2);
    expect(subTrack.segments[0].target_timerange.start).toBe(0);
    expect(subTrack.segments[0].target_timerange.duration).toBe(2_500_000);
    expect(subTrack.segments[1].target_timerange.start).toBe(2_500_000);
    expect(subTrack.segments[1].target_timerange.duration).toBe(3_500_000);

    // Track 4 (master audio track)
    const audioTrack = result.content.tracks.find((t) => t.id === 'track_audio_voice')!;
    expect(audioTrack.segments).toHaveLength(1);
    expect(audioTrack.segments[0].target_timerange).toEqual({
      start: 0,
      duration: 6_000_000,
    });
    expect(result.content.materials.audios[0].duration).toBe(6_000_000);
  });

  it('verifies 6-track timeline schema and JSON validity across various aspect ratios', async () => {
    const tmp = await makeTempDir('capcut-schema-');

    // Test aspect ratio dimension mappings
    expect(getCanvasDimensions('16:9')).toEqual({ width: 1920, height: 1080, ratio: '16:9', color: '#000000' });
    expect(getCanvasDimensions('9:16')).toEqual({ width: 1080, height: 1920, ratio: '9:16', color: '#000000' });
    expect(getCanvasDimensions('1:1')).toEqual({ width: 1080, height: 1080, ratio: '1:1', color: '#000000' });
    expect(getCanvasDimensions('3:4')).toEqual({ width: 1080, height: 1440, ratio: '3:4', color: '#000000' });
    expect(getCanvasDimensions('4:5')).toEqual({ width: 1080, height: 1350, ratio: '4:5', color: '#000000' });

    const img1 = join(tmp, 'card-1.png');
    const img2 = join(tmp, 'card-2.png');
    await writeFile(img1, createValidPng(1080, 1920));
    await writeFile(img2, createValidPng(1080, 1920));

    const verticalDeck = makeSampleDeck('9:16');
    const result = await buildCapCutDraft(verticalDeck, {
      outputDir: tmp,
      slideImages: [img1, img2],
    });

    // 6 Standard Tracks
    expect(result.content.tracks).toHaveLength(6);
    const trackIds = result.content.tracks.map((t) => t.id);
    expect(trackIds).toEqual([
      'track_video_main',
      'track_video_pip',
      'track_text_titles',
      'track_text_subtitles',
      'track_audio_voice',
      'track_audio_bgm',
    ]);

    // Materials lists
    expect(result.content.materials).toHaveProperty('videos');
    expect(result.content.materials).toHaveProperty('audios');
    expect(result.content.materials).toHaveProperty('texts');
    expect(result.content.materials).toHaveProperty('speeds');
    expect(result.content.materials).toHaveProperty('transitions');
    expect(result.content.materials).toHaveProperty('canvases');

    // Verify on-disk draft_content.json and draft_meta_info.json validity
    const contentRaw = await readFile(result.contentPath, 'utf8');
    const parsedContent = JSON.parse(contentRaw);
    expect(parsedContent.canvas_config.ratio).toBe('9:16');
    expect(parsedContent.canvas_config.width).toBe(1080);
    expect(parsedContent.canvas_config.height).toBe(1920);

    const metaRaw = await readFile(result.metaPath, 'utf8');
    const parsedMeta = JSON.parse(metaRaw);
    expect(parsedMeta.draft_id).toBe(result.draftId);
    expect(parsedMeta.draft_name).toBe(result.draftName);
    expect(parsedMeta.draft_root_path).toBe(result.draftDir);
    expect(parsedMeta.draft_cover_path).toBe(result.coverPath);
    expect(parsedMeta.duration).toBe(result.durationUs);
  });

  it('enforces real HD images and rejects 1x1 minimal transparent PNG fallback', async () => {
    const tmp = await makeTempDir('capcut-real-img-');
    const deck = makeSampleDeck('16:9');

    // 1. Calling without slideImages must throw rather than generating 68-byte 1x1 blank image
    await expect(
      buildCapCutDraft(deck, {
        outputDir: tmp,
      })
    ).rejects.toThrow(/Slide image not found/i);

    // 2. Calling with real images produces real slide image assets and real cover
    const realImg1 = join(tmp, 'real-1.png');
    const realImg2 = join(tmp, 'real-2.png');
    const pngBuf1 = createValidPng(1920, 1080, [255, 100, 50]);
    const pngBuf2 = createValidPng(1920, 1080, [50, 150, 255]);
    await writeFile(realImg1, pngBuf1);
    await writeFile(realImg2, pngBuf2);

    const result = await buildCapCutDraft(deck, {
      outputDir: tmp,
      slideImages: [realImg1, realImg2],
    });

    // Check disk files: all slide images must have size > 68 bytes (never the 68-byte 1x1 PNG)
    for (const vid of result.content.materials.videos) {
      const fileStat = await stat(vid.path);
      expect(fileStat.size).toBeGreaterThan(68);
      const buf = await readFile(vid.path);
      // Valid PNG signature: 89 50 4E 47 0D 0A 1A 0A
      expect(buf[0]).toBe(0x89);
      expect(buf[1]).toBe(0x50);
      expect(buf[2]).toBe(0x4e);
      expect(buf[3]).toBe(0x47);
      // Verify width and height from IHDR
      const w = buf.readUInt32BE(16);
      const h = buf.readUInt32BE(20);
      expect(w).toBe(1920);
      expect(h).toBe(1080);
    }

    // Cover image must exist and be a real slide 1 image (> 68 bytes)
    const coverStat = await stat(result.coverPath);
    expect(coverStat.size).toBeGreaterThan(68);
    const coverBuf = await readFile(result.coverPath);
    expect(coverBuf.readUInt32BE(16)).toBe(1920);
    expect(coverBuf.readUInt32BE(20)).toBe(1080);
  });

  it('rewrites materials.videos and materials.audios paths inside localDraftPath when installLocal is true', async () => {
    const tmp = await makeTempDir('capcut-install-local-');
    const localLib = join(tmp, 'local-library');
    const outBase = join(tmp, 'exports-base');

    const realImg1 = join(tmp, 'slide-1.png');
    const realImg2 = join(tmp, 'slide-2.png');
    await writeFile(realImg1, createValidPng(1920, 1080, [10, 20, 30]));
    await writeFile(realImg2, createValidPng(1920, 1080, [40, 50, 60]));

    const wavFile = join(tmp, 'narration.wav');
    await writeFile(wavFile, createValidWav(4));

    const deck = makeSampleDeck('16:9');
    const result = await buildCapCutDraft(deck, {
      outputDir: outBase,
      slideImages: [realImg1, realImg2],
      audioTrackPath: wavFile,
      installLocal: true,
      localProjectsDir: localLib,
    });

    expect(result.installedLocal).toBe(true);
    expect(result.localDraftPath).toBeDefined();
    const localDir = result.localDraftPath!;

    // 1. Read local draft_content.json
    const localContentRaw = await readFile(join(localDir, 'draft_content.json'), 'utf8');
    const localContent = JSON.parse(localContentRaw);

    // 2. Video material paths must be rewritten to point inside localDir
    expect(localContent.materials.videos).toHaveLength(2);
    for (const vid of localContent.materials.videos) {
      expect(vid.path.startsWith(localDir)).toBe(true);
      // File must actually exist inside localDir
      expect(fsSync.existsSync(vid.path)).toBe(true);
      const st = await stat(vid.path);
      expect(st.size).toBeGreaterThan(68);
    }

    // 3. Audio material path must be rewritten to point inside localDir
    expect(localContent.materials.audios).toHaveLength(1);
    const localAudio = localContent.materials.audios[0];
    expect(localAudio.path.startsWith(localDir)).toBe(true);
    expect(fsSync.existsSync(localAudio.path)).toBe(true);
    const audioStat = await stat(localAudio.path);
    expect(audioStat.size).toBeGreaterThan(44);

    // 4. Meta info must point to local directory and cover
    const localMetaRaw = await readFile(join(localDir, 'draft_meta_info.json'), 'utf8');
    const localMeta = JSON.parse(localMetaRaw);
    expect(localMeta.draft_root_path).toBe(localDir);
    expect(localMeta.draft_cover_path).toBe(join(localDir, 'draft_cover.png'));
    expect(fsSync.existsSync(localMeta.draft_cover_path)).toBe(true);

    // 5. Offline resilience: simulate purging the export directory
    await rm(outBase, { recursive: true, force: true });
    // Local assets must still exist cleanly
    for (const vid of localContent.materials.videos) {
      expect(fsSync.existsSync(vid.path)).toBe(true);
    }
    expect(fsSync.existsSync(localAudio.path)).toBe(true);
    expect(fsSync.existsSync(localMeta.draft_cover_path)).toBe(true);
  });

  it('integrates exportDeckBundle with capcut format and custom slideImages', async () => {
    const tmp = await makeTempDir('capcut-bundle-');
    const deck = makeSampleDeck('16:9');
    const img1 = join(tmp, 'rendered-1.png');
    const img2 = join(tmp, 'rendered-2.png');
    await writeFile(img1, createValidPng(1920, 1080));
    await writeFile(img2, createValidPng(1920, 1080));

    const outDir = join(tmp, 'capcut-project');
    const localLib = join(tmp, 'jianying-lib');

    const artifacts = await exportDeckBundle(deck, 'capcut', outDir, {
      installLocal: true,
      slideImages: [img1, img2],
      localProjectsDir: localLib,
    } as any);

    expect(artifacts.length).toBeGreaterThanOrEqual(3);
    const contentFile = artifacts.find((a) => a.endsWith('draft_content.json'));
    const metaFile = artifacts.find((a) => a.endsWith('draft_meta_info.json'));
    const coverFile = artifacts.find((a) => a.endsWith('draft_cover.png'));

    expect(contentFile).toBeDefined();
    expect(metaFile).toBeDefined();
    expect(coverFile).toBeDefined();
    expect(fsSync.existsSync(contentFile!)).toBe(true);
    expect(fsSync.existsSync(metaFile!)).toBe(true);
    expect(fsSync.existsSync(coverFile!)).toBe(true);
  });

  it('exposes capcut in MCP aimake_render_deck format enum and processes tool call', async () => {
    // 1. Verify format enum in MCP tools list
    const listResp = (await handleMcpRequest({
      jsonrpc: '2.0',
      id: 101,
      method: 'tools/list',
    })) as {
      result: {
        tools: Array<{
          name: string;
          inputSchema: {
            properties: {
              format?: { enum?: string[] };
            };
          };
        }>;
      };
    };

    const renderTool = listResp.result.tools.find((t) => t.name === 'aimake_render_deck')!;
    expect(renderTool).toBeDefined();
    expect(renderTool.inputSchema.properties.format?.enum).toContain('capcut');

    // 2. Call aimake_render_deck tool with format: 'capcut'
    const tmp = await makeTempDir('mcp-capcut-');
    const deckFile = join(tmp, 'presentation.deck.md');
    await writeFile(
      deckFile,
      `---
template: apple-dark-keynote
title: MCP CapCut Test
aspect: 16:9
locale: zh-CN
---
## Slide 1
Title: MCP CapCut Slide
Speech: 测试 MCP 剪映草稿渲染通道。
`
    );

    const outTarget = join(tmp, 'mcp-capcut-out');
    // Pre-create slide image in slidesDir so exportDeckBundle doesn't require launching full browser in quick unit test
    const slidesDir = join(outTarget, 'slides');
    fsSync.mkdirSync(slidesDir, { recursive: true });
    await writeFile(join(slidesDir, 'slide-01.png'), createValidPng(1920, 1080));

    // Test calling handleMcpRequest with format: 'capcut'
    const callResp = (await handleMcpRequest({
      jsonrpc: '2.0',
      id: 102,
      method: 'tools/call',
      params: {
        name: 'aimake_render_deck',
        arguments: {
          deckPath: deckFile,
          format: 'capcut',
          output: outTarget,
        },
      },
    })) as {
      result: {
        content: Array<{
          type: string;
          text: string;
        }>;
      };
    };

    expect(callResp.result).toBeDefined();
    const parsedResult = JSON.parse(callResp.result.content[0].text);
    expect(parsedResult.artifacts).toBeDefined();
    expect(parsedResult.artifacts.some((a: string) => a.endsWith('draft_content.json'))).toBe(true);
    expect(parsedResult.artifacts.some((a: string) => a.endsWith('draft_meta_info.json'))).toBe(true);
    expect(parsedResult.artifacts.some((a: string) => a.endsWith('draft_cover.png'))).toBe(true);
  }, 20_000);
});
