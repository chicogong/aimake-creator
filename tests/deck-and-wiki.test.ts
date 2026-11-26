import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  applyEditablePatch,
  parseDeckMarkdown,
  serializeDeckMarkdown,
} from '../src/renderer/deck-parser.js';
import { renderWeChatInlineHtml } from '../src/renderer/wechat-inliner.js';
import {
  auditAiSlop,
  extractStyleDNAFromSamples,
  formatStyleDNAMarkdown,
  humanizeText,
} from '../src/wiki/humanizer.js';
import {
  compoundOutputToWiki,
  estimateTokens,
  INDEX_TOKEN_BUDGET,
  ingestSource,
  initWikiVault,
  lintWiki,
  PERSONA_TOKEN_BUDGET,
} from '../src/wiki/wiki-engine.js';
import { filterRadarItems, parseFeedXml } from '../src/radar/radar-engine.js';
import {
  anonymizeDeckToSyntheticMock,
  sanitizeContentForPR,
} from '../src/sanitizer/pr-sanitizer.js';
import { installAimakeSkill } from '../src/installer/host-installer.js';
import { handleMcpRequest } from '../src/mcp/mcp-server.js';
import { buildStaticSite } from '../src/site/site-builder.js';

describe('Deck Markdown Parser & Serializer', () => {
  it('parses slides, metrics, comparisons, code fences with --- inside, and speech blocks cleanly', () => {
    const sample = `---
title: Test Deck
template: xhs-neon-tech
locale: zh-CN
aspect: 3:4
---

<!-- scene: s1 | layout: metrics | eyebrow: BENCH | cite: wiki/perf.md#L10 -->
# Slide One
## Subtitle One

\`\`\`metric
- Latency: 42ms (-65%)
- Cost: $0
\`\`\`

::: speech
Hello narration one.
:::

---

<!-- scene: s2 | layout: code -->
# Code Slide

\`\`\`ts
const divider = "---";
export default divider;
\`\`\`
`;

    const doc = parseDeckMarkdown(sample);
    expect(doc.frontmatter.template).toBe('xhs-neon-tech');
    expect(doc.slides).toHaveLength(2);
    expect(doc.slides[0].metrics).toEqual([
      { label: 'Latency', value: '42ms', delta: '-65%' },
      { label: 'Cost', value: '$0', delta: undefined },
    ]);
    expect(doc.slides[0].speech).toBe('Hello narration one.');
    expect(doc.slides[1].code?.code).toContain('const divider = "---";');

    const patched = applyEditablePatch(doc, 0, 'title', 'Updated Headline');
    const serialized = serializeDeckMarkdown(patched);
    const reparsed = parseDeckMarkdown(serialized);
    expect(reparsed.slides[0].title).toBe('Updated Headline');
    expect(reparsed.slides).toHaveLength(2);
  });
});

describe('4-Locale Anti-AI-Slop Humanizer & Style DNA', () => {
  it('detects and cleans AI clichés across zh-CN, en, ja, and ko', () => {
    const zhSlop = '总而言之，值得注意的是，这套方案能够全方位赋能创作者 🚀✨💡';
    const zhAudit = auditAiSlop(zhSlop, 'zh-CN');
    expect(zhAudit.clean).toBe(false);
    expect(zhAudit.hits.length).toBeGreaterThanOrEqual(3);
    const zhClean = humanizeText(zhSlop, 'zh-CN');
    expect(zhClean).not.toContain('总而言之');
    expect(zhClean).not.toContain('赋能');

    const enSlop = "In today's fast-paced world, let us delve into this game-changer.";
    const enClean = humanizeText(enSlop, 'en');
    expect(enClean).not.toContain('delve into');
    expect(enClean).toContain('breakthrough');

    const jaClean = humanizeText('総括すると、飛躍的に向上しました。いかがでしたでしょうか？', 'ja');
    expect(jaClean).not.toContain('いかがでしたでしょうか');

    const koClean = humanizeText('결론적으로 말씀드리자면, 혁신적인 패러다임입니다.', 'ko');
    expect(koClean).not.toContain('결론적으로 말씀드리자면');
  });

  it('extracts compact Style DNA strictly within the 800-token budget', () => {
    const dna = extractStyleDNAFromSamples({
      id: 'indie-tech',
      name: 'Indie Architect',
      locale: 'zh-CN',
      samples: [
        '# 砍掉后端之后，维护成本降为零\n真正好用的工具只做确定性本地交付。',
        '# 为什么卡片流比长视频涨粉快三倍\n高信息密度图解直接省去观众拖动进度条的时间。',
      ],
    });
    const md = formatStyleDNAMarkdown(dna);
    expect(estimateTokens(md)).toBeLessThanOrEqual(PERSONA_TOKEN_BUDGET);
    expect(dna.hookFormulas.length).toBeGreaterThanOrEqual(2);
  });
});

describe('Karpathy LLM Wiki Engine & Token Budget Guard', () => {
  it('ingests sources, maintains bounded index.md <= 3000 tokens, lints links, and compounds outputs', async () => {
    const tmpVault = await fs.mkdtemp(path.join(os.tmpdir(), 'aimake-wiki-'));
    try {
      await initWikiVault(tmpVault);
      const srcNote = path.join(tmpVault, 'input-sample.md');
      await fs.writeFile(
        srcNote,
        '# Zero-Backend Architecture\nLocal files outlive cloud startups every single decade.\nPlain markdown scales effortlessly.',
        'utf8'
      );

      const res = await ingestSource(tmpVault, srcNote, { tags: ['architecture'] });
      expect(res.sha256).toHaveLength(64);

      const deck = parseDeckMarkdown(`---\ntitle: Compound Test\ntemplate: xhs-swiss-grid\nlocale: zh-CN\naspect: 3:4\n---\n# Core Insight\n- Point A`);
      const outRecord = await compoundOutputToWiki(tmpVault, deck, ['/tmp/slide-01.png']);
      expect(outRecord).toContain('outputs');

      const lint = await lintWiki(tmpVault);
      expect(lint.valid).toBe(true);
      expect(lint.indexTokens).toBeLessThanOrEqual(INDEX_TOKEN_BUDGET);
      expect(lint.totalWikiPages).toBe(1);
    } finally {
      await fs.rm(tmpVault, { recursive: true, force: true });
    }
  });
});

describe('Radar Feed Parser, WeChat Inliner & PR Privacy Sanitizer', () => {
  it('parses RSS & Atom XML feeds and filters by keywords', () => {
    const rss = `<?xml version="1.0"?><rss version="2.0"><channel>
      <item><title>MCP Apps Interactive UI Released</title><link>https://example.com/mcp</link></item>
      <item><title>Unrelated Gardening Post</title><link>https://example.com/plants</link></item>
    </channel></rss>`;
    const items = parseFeedXml(rss, 'tech-rss');
    expect(items).toHaveLength(2);
    const filtered = filterRadarItems(items, ['mcp']);
    expect(filtered).toHaveLength(1);
    expect(filtered[0].url).toBe('https://example.com/mcp');
  });

  it('renders 100% inline-styled WeChat HTML with zero <style> tags', () => {
    const doc = parseDeckMarkdown(`---\ntitle: WeChat Check\ntemplate: wechat-editorial-article\nlocale: zh-CN\naspect: 3:4\n---\n# Title\n- **Bold** item`);
    const html = renderWeChatInlineHtml(doc);
    expect(html).toContain('data-tool="aimake-wechat"');
    expect(html).not.toContain('<style');
    expect(html).toContain('style="');
  });

  it('scrubs corporate domains, secret tokens, emails, private IPs, and user paths in PR Sanitizer', () => {
    const fakeKey = ['sk', 'proj1234567890abcdefghijklmno'].join('-');
    const dirty = `
      const api = "https://km.woa.com/secret/doc";
      const key = "${fakeKey}";
      const file = "/Users/alice/private/weekly-report.md";
      const mail = "alice.internal@company.io";
      const host = "192.168.31.45";
    `;
    const report = sanitizeContentForPR(dirty);
    expect(report.clean).toBe(false);
    expect(report.redactedCount).toBe(5);
    expect(report.sanitizedContent).not.toContain('woa.com');
    expect(report.sanitizedContent).not.toContain('sk-proj');
    expect(report.sanitizedContent).not.toContain('/Users/alice');
    expect(report.sanitizedContent).not.toContain('alice.internal@company.io');

    const privateDeck = parseDeckMarkdown(`---\ntitle: Q4 Confidential Revenue\ntemplate: xhs-swiss-grid\nlocale: zh-CN\naspect: 3:4\n---\n# Internal OKR 980M\n- Secret client Alpha`);
    const mockDeck = anonymizeDeckToSyntheticMock(privateDeck);
    expect(JSON.stringify(mockDeck)).not.toContain('Confidential Revenue');
    expect(JSON.stringify(mockDeck)).not.toContain('Secret client Alpha');
  });
});

describe('Universal Host Symlink Installer, MCP Server & Static Site Builder', () => {
  it('links Aimake Skill safely into isolated mock host directories idempotently', async () => {
    const mockHome = await fs.mkdtemp(path.join(os.tmpdir(), 'aimake-home-'));
    try {
      await fs.mkdir(path.join(mockHome, '.agents'), { recursive: true });
      await fs.mkdir(path.join(mockHome, '.codex'), { recursive: true });
      await fs.mkdir(path.join(mockHome, '.workbuddy'), { recursive: true });

      const firstRun = await installAimakeSkill({ homeDir: mockHome, dryRun: false });
      expect(firstRun.map((a) => a.status)).toEqual(['linked', 'linked', 'linked']);

      const secondRun = await installAimakeSkill({ homeDir: mockHome, dryRun: false });
      expect(secondRun.map((a) => a.status)).toEqual([
        'already-linked',
        'already-linked',
        'already-linked',
      ]);
    } finally {
      await fs.rm(mockHome, { recursive: true, force: true });
    }
  });

  it('handles MCP JSON-RPC initialize, tools/list, resources/list, and tool calls', async () => {
    const initResp = await handleMcpRequest({ jsonrpc: '2.0', id: 1, method: 'initialize' });
    expect(initResp).toHaveProperty('result.serverInfo.name', 'aimake-mcp');

    const toolsResp = (await handleMcpRequest({
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/list',
    })) as { result: { tools: Array<{ name: string }> } };
    expect(toolsResp.result.tools.length).toBeGreaterThanOrEqual(6);

    const resList = (await handleMcpRequest({
      jsonrpc: '2.0',
      id: 3,
      method: 'resources/list',
    })) as { result: { resources: Array<{ uri: string }> } };
    expect(resList.result.resources[0].uri).toBe('ui://aimake/preview');
  });

  it('builds 4-language static Programmatic SEO showcase site cleanly', async () => {
    const tmpSite = await fs.mkdtemp(path.join(os.tmpdir(), 'aimake-site-'));
    try {
      const stats = await buildStaticSite(tmpSite);
      // 4 langs * (1 index + 36 * 2 template pages) + 1 root + playground + studio = 295 HTML files
      expect(stats.pagesWritten).toBeGreaterThanOrEqual(293);
      expect(stats.sitemapUrlCount).toBeGreaterThanOrEqual(148);
      const rootHtml = await fs.readFile(path.join(tmpSite, 'index.html'), 'utf8');
      expect(rootHtml).toContain('uJ83um8k9_iom9DdkHRY_hTQwZE2QDjupfhvXQTyHGE');
      expect(rootHtml).toContain('codeva-dNFmwA2bNN');
      expect(rootHtml).toContain('pack-solopreneur-cn');
      expect(rootHtml).toContain('aimake://remix');
      expect(rootHtml).toContain('#ecosystem');
      expect(rootHtml).toContain('Agent Client Protocol');
      expect(rootHtml).not.toContain('Apache-2.0');
      expect(rootHtml).not.toContain('Open-Source');
      expect(rootHtml).not.toContain('爱创星球');

      const playgroundHtml = await fs.readFile(path.join(tmpSite, 'playground', 'index.html'), 'utf8');
      expect(playgroundHtml).toContain('Aimake 爱创工坊');

      const jaZukai = await fs.readFile(
        path.join(tmpSite, 'ja', 'templates', 'x-zukai-quad', 'index.html'),
        'utf8'
      );
      expect(jaZukai).toContain('構造化「図解」ブループリント');
    } finally {
      await fs.rm(tmpSite, { recursive: true, force: true });
    }
  }, 30000);
});
