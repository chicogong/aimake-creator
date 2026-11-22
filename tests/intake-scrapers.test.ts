import { describe, expect, it } from 'vitest';
import path from 'node:path';
import {
  isTwitterUrl,
  isWechatUrl,
  isZhihuUrl,
  isTableFile,
  isTranscriptFile,
  scrapeTwitterPost,
  scrapeWebArticle,
  parseTableToMarkdown,
  parseTranscriptToMarkdown,
  normalizeSource,
} from '../src/intake/index.js';

describe('Multi-Platform Universal Intake & Scrapers', () => {
  it('correctly identifies URL and file types', () => {
    expect(isTwitterUrl('https://x.com/karpathy/status/1753123456789012345')).toBe(true);
    expect(isTwitterUrl('https://twitter.com/jack/status/20')).toBe(true);
    expect(isTwitterUrl('https://example.com/not-twitter')).toBe(false);

    expect(isWechatUrl('https://mp.weixin.qq.com/s/abcdef123456')).toBe(true);
    expect(isZhihuUrl('https://zhuanlan.zhihu.com/p/123456')).toBe(true);
    expect(isZhihuUrl('https://www.zhihu.com/question/123456/answer/789')).toBe(true);

    expect(isTableFile('metrics.csv')).toBe(true);
    expect(isTableFile('data.tsv')).toBe(true);
    expect(isTableFile('deck.deck.md')).toBe(false);

    expect(isTranscriptFile('speech.vtt')).toBe(true);
    expect(isTranscriptFile('movie.srt')).toBe(true);
  });

  it('parses CSV tables and auto-extracts Bento metrics', () => {
    const csvContent = [
      'Metric,2026 Target,Growth,Status',
      'Active Users,1.2M,+45% YoY,Green',
      'API Latency,85ms,-32% QoQ,Green',
      'Token Cost,$0.55/1M,-95%,Crushing',
    ].join('\n');

    const res = parseTableToMarkdown(csvContent, 'metrics.csv', {
      title: 'Q1 Performance Metrics',
    });

    expect(res.sourceType).toBe('table-csv');
    expect(res.title).toBe('Q1 Performance Metrics');
    expect(res.metrics?.length).toBeGreaterThanOrEqual(3);
    expect(res.metrics?.[0]).toEqual({
      label: 'Active Users',
      value: '1.2M',
      delta: '+45% YoY',
    });
    expect(res.markdown).toContain('## 📊 Extracted Bento Metrics');
    expect(res.markdown).toContain('Active Users :: 1.2M | +45% YoY');
    expect(res.markdown).toContain('| Metric | 2026 Target | Growth | Status |');
  });

  it('parses WebVTT transcripts into clean timestamped speech paragraphs', () => {
    const vttContent = [
      'WEBVTT',
      '',
      '1',
      '00:00:01.000 --> 00:00:04.500',
      '[Speaker A] Welcome to the new multimodal architecture.',
      '',
      '2',
      '00:00:05.100 --> 00:00:08.200',
      '[Speaker B] We are unifying research and distribution.',
    ].join('\n');

    const res = parseTranscriptToMarkdown(vttContent, 'keynote.vtt');
    expect(res.sourceType).toBe('transcript');
    expect(res.markdown).toContain('`[00:01]` **Speaker A**: Welcome to the new multimodal architecture.');
    expect(res.markdown).toContain('`[00:05]` **Speaker B**: We are unifying research and distribution.');
    expect(res.markdown).not.toContain('-->');
  });

  it('scrapes or handles X/Twitter posts deterministically in offline environments', async () => {
    const res = await scrapeTwitterPost('https://x.com/karpathy/status/1753123456789012345', {
      timeoutMs: 1500,
    });

    expect(res.sourceType).toBe('x-twitter');
    expect(res.author).toContain('karpathy');
    expect(res.markdown).toContain('karpathy');
  });

  it('scrapes or handles web articles with fallback', async () => {
    const res = await scrapeWebArticle('https://mp.weixin.qq.com/s/sample_test_slug', {
      timeoutMs: 1500,
    });

    expect(res.sourceType).toBe('wechat');
    expect(res.markdown).toContain('mp.weixin.qq.com');
  });

  it('normalizes local sample files via universal normalizeSource router', async () => {
    const csvFile = path.resolve('examples/sources/deepseek-benchmark-table.csv');
    const res = await normalizeSource(csvFile);

    expect(res.sourceType).toBe('table-csv');
    expect(res.metrics?.length).toBeGreaterThan(0);
    expect(res.markdown).toContain('DeepSeek-R1');
  });
});
