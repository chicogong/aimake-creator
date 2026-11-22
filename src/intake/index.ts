import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { isTwitterUrl, scrapeTwitterPost } from './x-scraper.js';
import { scrapeWebArticle } from './web-scraper.js';
import { isTableFile, parseTableToMarkdown } from './table-scraper.js';
import { isTranscriptFile, parseTranscriptToMarkdown } from './transcript-scraper.js';
import type { NormalizedSource, IntakeOptions } from './types.js';

export * from './types.js';
export * from './x-scraper.js';
export * from './web-scraper.js';
export * from './table-scraper.js';
export * from './transcript-scraper.js';

/**
 * Universal source normalizer:
 * Ingests X (Twitter) URLs, WeChat articles, Zhihu answers, Web URLs, CSV tables,
 * and audio transcripts into standardized facts and Markdown with provenance.
 */
export async function normalizeSource(
  input: string,
  options: IntakeOptions = {}
): Promise<NormalizedSource> {
  const trimmed = input.trim();

  // 1. Web URL handlers
  if (/^https?:\/\//i.test(trimmed)) {
    if (isTwitterUrl(trimmed)) {
      return scrapeTwitterPost(trimmed, options);
    }
    return scrapeWebArticle(trimmed, options);
  }

  // 2. Local File handlers
  const absPath = path.resolve(process.cwd(), trimmed);
  const ext = path.extname(absPath).toLowerCase();
  const fileName = path.basename(absPath);
  const rawText = await fs.readFile(absPath, 'utf8');

  // CSV / TSV tabular spreadsheet
  if (isTableFile(ext)) {
    return parseTableToMarkdown(rawText, fileName, options);
  }

  // Audio / Video Subtitles & Transcripts
  if (isTranscriptFile(ext)) {
    return parseTranscriptToMarkdown(rawText, fileName, options);
  }

  // General Markdown or Text
  const now = new Date().toISOString();
  const title = options.title || path.basename(absPath, ext);
  const hash = crypto.createHash('sha256').update(rawText).digest('hex');

  return {
    title,
    sourceType: 'document',
    capturedAt: now,
    tags: Array.from(new Set(['Document', ext.slice(1).toUpperCase(), ...(options.tags || [])])),
    markdown: rawText,
    sha256: hash,
  };
}
