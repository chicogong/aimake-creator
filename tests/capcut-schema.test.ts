import { describe, expect, it } from 'vitest';
import {
  buildCapCutDraft,
  getCanvasDimensions,
  type CapCutDraftContent,
  type CapCutMetaInfo,
} from '../src/renderer/capcut-draft-builder.js';
import type { DeckDocument } from '../src/schema/types.js';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

function makeMockDeck(aspect: DeckDocument['frontmatter']['aspect'] = '16:9'): DeckDocument {
  return {
    filePath: '/tmp/test.deck.md',
    frontmatter: {
      template: 'apple-dark-keynote',
      title: 'CapCut Conformance Deck',
      aspect,
      locale: 'zh-CN',
      fps: 30,
    },
    slides: [
      {
        id: 's1',
        layout: 'cover',
        title: '产品发布',
        subtitle: '全本地多模态工坊',
        speech: '欢迎体验爱创工坊。',
      },
      {
        id: 's2',
        layout: 'bullets',
        title: '核心架构',
        bullets: ['确定性排版', '六轨时间线', '零网络遥测'],
        speech: '核心技术完全运行在本机。',
      },
    ],
  };
}

describe('T-08 / Issue #12: CapCut Draft Schema Conformance Verification', () => {
  it('validates canvas configuration across 5 standard aspect ratios', () => {
    const wide = getCanvasDimensions('16:9');
    expect(wide.width).toBe(1920);
    expect(wide.height).toBe(1080);
    expect(wide.ratio).toBe('16:9');

    const vert = getCanvasDimensions('9:16');
    expect(vert.width).toBe(1080);
    expect(vert.height).toBe(1920);
    expect(vert.ratio).toBe('9:16');

    const xhs = getCanvasDimensions('3:4');
    expect(xhs.width).toBe(1080);
    expect(xhs.height).toBe(1440);
    expect(xhs.ratio).toBe('3:4');

    const insta = getCanvasDimensions('4:5');
    expect(insta.width).toBe(1080);
    expect(insta.height).toBe(1350);
    expect(insta.ratio).toBe('4:5');

    const square = getCanvasDimensions('1:1');
    expect(square.width).toBe(1080);
    expect(square.height).toBe(1080);
    expect(square.ratio).toBe('1:1');
  });

  it('generates schema-compliant draft_content.json with integer microsecond precision and referential integrity', async () => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'aimake-capcut-schema-'));

    // Create dummy slide image
    const slide1 = path.join(tmpDir, 'slide-1.png');
    const slide2 = path.join(tmpDir, 'slide-2.png');
    await fs.writeFile(slide1, Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    await fs.writeFile(slide2, Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));

    const deck = makeMockDeck('16:9');
    const draftOut = path.join(tmpDir, 'draft');

    const result = await buildCapCutDraft(deck, {
      outputDir: draftOut,
      fps: 30,
      slideImages: [slide1, slide2],
      slideDurationsMs: [3500, 4200],
    });

    const contentRaw = await fs.readFile(result.contentPath, 'utf8');
    const content: CapCutDraftContent = JSON.parse(contentRaw);

    // 1. Duration & canvas config
    expect(Number.isInteger(content.duration)).toBe(true);
    expect(content.duration).toBeGreaterThan(0);
    expect(content.fps).toBe(30);
    expect(content.canvas_config.width).toBe(1920);
    expect(content.canvas_config.height).toBe(1080);

    // 2. Exactly 6 tracks in order
    expect(content.tracks).toHaveLength(6);
    const [tCards, tPip, tTitles, tSubtitles, tVoice, tBgm] = content.tracks;
    expect(tCards.type).toBe('video');
    expect(tPip.type).toBe('video');
    expect(tTitles.type).toBe('text');
    expect(tSubtitles.type).toBe('text');
    expect(tVoice.type).toBe('audio');
    expect(tBgm.type).toBe('audio');

    // 3. Referential integrity: every segment's material_id must exist in materials
    const videoMatIds = new Set(content.materials.videos.map((v) => v.id));
    const textMatIds = new Set(content.materials.texts.map((t) => t.id));

    for (const seg of tCards.segments) {
      expect(videoMatIds.has(seg.material_id)).toBe(true);
      expect(Number.isInteger(seg.target_timerange.start)).toBe(true);
      expect(Number.isInteger(seg.target_timerange.duration)).toBe(true);
      expect(Number.isInteger(seg.source_timerange.start)).toBe(true);
      expect(Number.isInteger(seg.source_timerange.duration)).toBe(true);
    }

    for (const seg of tTitles.segments) {
      expect(textMatIds.has(seg.material_id)).toBe(true);
    }

    for (const seg of tSubtitles.segments) {
      expect(textMatIds.has(seg.material_id)).toBe(true);
    }

    // 4. Validate metadata info
    const metaRaw = await fs.readFile(result.metaPath, 'utf8');
    const meta: CapCutMetaInfo = JSON.parse(metaRaw);
    expect(meta.draft_id).toBeDefined();
    expect(meta.draft_name).toBe('CapCut Conformance Deck');
    expect(Number.isInteger(meta.duration)).toBe(true);
    expect(meta.duration).toBe(content.duration);
    expect(path.isAbsolute(meta.draft_root_path)).toBe(true);
    expect(path.isAbsolute(meta.draft_cover_path)).toBe(true);

    await fs.rm(tmpDir, { recursive: true, force: true });
  });
});
