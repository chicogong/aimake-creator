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

  it('runs Aimake Trend Radar and generates production .deck.md with smart templates', async () => {
    const { runTrendRadar, inferSuggestedTemplate, generateDeckFromRadarItem, CURATED_TREND_FIXTURES } =
      await import('../src/radar/radar-engine.js');

    // 1. Template recommendation inference
    expect(inferSuggestedTemplate('DeepSeek-R1 Benchmark vs o1').template).toBe('apple-bento-launch');
    expect(inferSuggestedTemplate('Nature Research Paper on Quantum Diffusion').template).toBe('ppt-tech-architecture');
    expect(inferSuggestedTemplate('深度复盘：超级个体如何利用开源大模型').template).toBe('xhs-paper-editorial');

    // 2. Trend radar querying (with resilient fixtures fallback)
    const items = await runTrendRadar({ limit: 6, timeoutMs: 1000 });
    expect(items.length).toBeGreaterThanOrEqual(4);
    expect(items[0]).toHaveProperty('title');
    expect(items[0]).toHaveProperty('source');
    expect(items[0]).toHaveProperty('suggestedTemplate');

    // 3. 1-Click Deck generation
    const sampleItem = CURATED_TREND_FIXTURES[0];
    const generated = generateDeckFromRadarItem(sampleItem);
    expect(generated.deckMarkdown).toContain('---');
    expect(generated.deckMarkdown).toContain('apple-bento-launch');
    expect(generated.deckMarkdown).toContain(sampleItem.title);
    expect(generated.deckMarkdown).toContain('::: speech');
  });

  it('calculates anti-SEO authenticity weight scores and filters real-world human signals', async () => {
    const { calcAuthenticityScore, filterRadarItems, CURATED_TREND_FIXTURES } =
      await import('../src/radar/radar-engine.js');

    // 1. Anti-SEO penalties for clickbait/SEO fluff
    const clickbaitScore = calcAuthenticityScore({
      sourceKind: 'rss',
      title: 'Top 10 Ultimate Guide to Game Changer AI Tools',
      summary: 'You won\'t believe this cheat sheet guaranteed to 10x your life',
    });

    // 2. High authenticity for verified Reddit human discussion with empirical technical keywords
    const authenticScore = calcAuthenticityScore({
      sourceKind: 'reddit',
      redditComments: 450,
      title: 'Benchmark and architecture post-mortem on offline weights',
      summary: 'DeepSeek reproducible latency evaluation with zero cloud dependency',
    });

    expect(authenticScore).toBeGreaterThan(clickbaitScore);
    expect(authenticScore).toBeGreaterThanOrEqual(90);
    expect(clickbaitScore).toBeLessThan(50);

    // 3. Category filtering for real-discussion and prediction
    const discussionItems = filterRadarItems(CURATED_TREND_FIXTURES, [], 'real-discussion');
    expect(discussionItems.length).toBeGreaterThanOrEqual(1);
    expect(discussionItems.some((it) => it.sourceKind === 'reddit' || (it.redditComments ?? 0) > 0)).toBe(true);

    const predictionItems = filterRadarItems(CURATED_TREND_FIXTURES, [], 'prediction');
    expect(predictionItems.length).toBeGreaterThanOrEqual(1);
    expect(predictionItems.some((it) => it.sourceKind === 'polymarket' || it.polymarketOdds !== undefined)).toBe(true);
  });
});
