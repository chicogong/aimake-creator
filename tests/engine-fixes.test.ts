import { describe, expect, it } from 'vitest';
import { mkdtemp, rm, writeFile, lstat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { compileDeckToHtml } from '../src/renderer/html-compiler.js';
import { parseDeckMarkdown } from '../src/renderer/deck-parser.js';
import { importExternalMarkdownDeck } from '../src/renderer/importers.js';
import { buildCapCutDraft } from '../src/renderer/capcut-draft-builder.js';
import { synthesizeDeckSpeech, offlineFixtureSpeechProvider } from '../src/speech/index.js';
import type { DeckDocument } from '../src/schema/types.js';

function createValidWav(durationSec = 2): Buffer {
  const sampleRate = 16000;
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

describe('Engine & Exporter Audit Fixes Verification', () => {
  it('P1-5: html-compiler replaces existing lang attribute and avoids duplicates', async () => {
    const doc: DeckDocument = {
      frontmatter: {
        title: 'Locale Test',
        template: 'apple-bento-launch',
        locale: 'ja',
        aspect: '16:9',
        watermark: false,
        fps: 30,
        secondsPerSlide: 4,
        tags: [],
      },
      slides: [
        {
          index: 0,
          id: 'slide-1',
          layout: 'cover',
          title: 'Japanese Title',
          bullets: [],
          bodyParagraphs: [],
          metrics: [],
        },
      ],
    };

    const { html } = await compileDeckToHtml(doc);
    // Must contain lang="ja"
    expect(html).toContain('lang="ja"');
    // Must NOT contain duplicate lang attributes or lang="zh-CN"
    expect(html).not.toMatch(/<html[^>]*lang="zh-CN"[^>]*lang="ja"/i);
    expect(html).not.toMatch(/<html[^>]*lang="ja"[^>]*lang="zh-CN"/i);
    const htmlTagMatch = html.match(/<html\b[^>]*>/i);
    expect(htmlTagMatch).not.toBeNull();
    const langMatches = htmlTagMatch![0].match(/\blang=/gi);
    expect(langMatches).toHaveLength(1);
  });

  it('P2-4: deck-parser aggregates multiple ::: speech blocks on one slide', () => {
    const md = `---
title: Multi Speech Test
template: apple-bento-launch
locale: en
---

# Slide 1

Some description here.

::: speech
Welcome to the first part of narration.
:::

::: speech
And here is the second concluding sentence.
:::
`;

    const deck = parseDeckMarkdown(md);
    expect(deck.slides).toHaveLength(1);
    expect(deck.slides[0].speech).toBe(
      'Welcome to the first part of narration.\n\nAnd here is the second concluding sentence.'
    );
  });

  it('P1-12: importers splitOutsideFences maintains correct delimiter state on mixed backticks and tildes', () => {
    const marp = `---
marp: true
---

# Slide 1

\`\`\`ts
const codeWithTilde = "~~~";
---
const moreCode = true;
\`\`\`

---

# Slide 2

Real second slide content.
`;

    const imported = importExternalMarkdownDeck(marp);
    expect(imported.slideCount).toBe(2);
    expect(imported.markdown).toContain('Slide 1');
    expect(imported.markdown).toContain('Slide 2');
    expect(imported.markdown).toContain('const codeWithTilde');
  });

  it('P1-7: capcut-draft-builder measures WAV duration and clamps source_timerange', async () => {
    const tmp = await mkdtemp(join(tmpdir(), 'aimake-capcut-clamp-'));
    try {
      const img1 = join(tmp, 's1.png');
      const img2 = join(tmp, 's2.png');
      // Tiny valid PNG
      const pngBuf = Buffer.from([
        137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82, 0, 0, 0, 1,
        0, 0, 0, 1, 8, 2, 0, 0, 0, 144, 119, 83, 222, 0, 0, 0, 12, 73, 68, 65,
        84, 120, 156, 99, 100, 96, 96, 0, 0, 0, 4, 0, 1, 39, 127, 240, 219, 0,
        0, 0, 0, 73, 69, 78, 68, 174, 66, 96, 130,
      ]);
      await writeFile(img1, pngBuf);
      await writeFile(img2, pngBuf);

      // 4-second WAV audio file
      const wav4Sec = join(tmp, 'narration-4s.wav');
      await writeFile(wav4Sec, createValidWav(4));

      // Deck with 2 slides of 3000ms each -> total timeline = 6000ms (6,000,000 us)
      const deck: DeckDocument = {
        frontmatter: {
          title: 'CapCut Audio Clamp Deck',
          template: 'apple-bento-launch',
          locale: 'zh-CN',
          aspect: '16:9',
          watermark: false,
          fps: 30,
          secondsPerSlide: 3,
          tags: [],
        },
        slides: [
          { index: 0, id: 's1', layout: 'cover', title: 'Page 1', bullets: [], bodyParagraphs: [], metrics: [] },
          { index: 1, id: 's2', layout: 'bullets', title: 'Page 2', bullets: [], bodyParagraphs: [], metrics: [] },
        ],
      };

      const result = await buildCapCutDraft(deck, {
        outputDir: tmp,
        audioTrackPath: wav4Sec,
        slideImages: [img1, img2],
        slideDurationsMs: [3000, 3000],
      });

      // Timeline duration should be 6,000,000 us
      expect(result.durationUs).toBe(6_000_000);

      // Audio material duration must be the actual WAV length (4,000,000 us)
      const audioMat = result.content.materials.audios[0];
      expect(audioMat).toBeDefined();
      expect(audioMat.duration).toBe(4_000_000);

      // Audio track segment source_timerange must be clamped to 4,000,000 us, not 6,000,000 us!
      const audioTrack = result.content.tracks.find((t) => t.id === 'track_audio_voice')!;
      expect(audioTrack.segments).toHaveLength(1);
      expect(audioTrack.segments[0].source_timerange.duration).toBe(4_000_000);
      expect(audioTrack.segments[0].target_timerange.duration).toBe(6_000_000);
    } finally {
      await rm(tmp, { recursive: true, force: true });
    }
  });

  it('P2-5: synthesize-deck auto-cleans unverified partial chunk artifacts and completes successfully', async () => {
    const tmp = await mkdtemp(join(tmpdir(), 'aimake-speech-recover-'));
    try {
      // Simulate partial leftover file from interrupted synthesis (e.g. .wav exists but .receipt.json missing)
      const chunksDir = join(tmp, 'chunks');
      const { mkdir } = await import('node:fs/promises');
      await mkdir(chunksDir, { recursive: true });
      const orphanedWav = join(chunksDir, 'slide-1-1.wav');
      await writeFile(orphanedWav, Buffer.from('corrupt partial wav data'));

      const deck: DeckDocument = {
        frontmatter: {
          title: 'Recovery Test Deck',
          template: 'apple-bento-launch',
          locale: 'en',
          aspect: '16:9',
          watermark: false,
          fps: 30,
          secondsPerSlide: 4,
          tags: [],
        },
        slides: [
          {
            index: 0,
            id: 'slide-1',
            layout: 'cover',
            title: 'Slide 1 Title',
            bullets: [],
            bodyParagraphs: [],
            metrics: [],
            speech: 'Testing automatic recovery of corrupted partial chunks.',
          },
        ],
      };

      // synthesizeDeckSpeech with autoClean (default true) should clean orphaned file and succeed
      const res = await synthesizeDeckSpeech(deck, tmp, {
        provider: offlineFixtureSpeechProvider(),
        cleanIncompleteChunks: true,
      });

      expect(res.providerCalls).toBe(1);
      expect(res.synthesizedSlideIds).toEqual(['slide-1']);
      expect(res.manifest.chunks).toHaveLength(1);
    } finally {
      await rm(tmp, { recursive: true, force: true });
    }
  });
});
