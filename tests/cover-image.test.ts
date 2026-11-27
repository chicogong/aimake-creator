import fs from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { readCoverImage } from '../src/renderer/cover-image.js';
import { parseDeckMarkdown } from '../src/renderer/deck-parser.js';
import { compileDeckToHtml } from '../src/renderer/html-compiler.js';

const sample = path.resolve('examples/open-bench/open-bench.deck.md');

describe('Bento photo cover', () => {
  it('embeds the example photo in offline HTML', async () => {
    const deck = parseDeckMarkdown(await fs.readFile(sample, 'utf8'), sample);
    const { html } = await compileDeckToHtml(deck);

    expect(html).toContain('"coverImages":{"0":"data:image/jpeg;base64,');
    expect(html).toContain('className = \'cover-photo\'');
  });

  it('uses the standard layout when a cover photo is unavailable', async () => {
    const deck = parseDeckMarkdown(await fs.readFile(sample, 'utf8'), sample);
    const slide = { ...deck.slides[0]!, imageUrl: './assets/missing.jpg' };

    expect(await readCoverImage(deck, slide)).toBeUndefined();
  });
});
