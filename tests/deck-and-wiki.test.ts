import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  applyEditablePatch,
  parseDeckMarkdown,
  serializeDeckMarkdown,
} from '../src/renderer/deck-parser.js';
import { renderChartSvg } from '../src/renderer/chart-svg.js';
import { renderMermaidSvg } from '../src/renderer/mermaid-svg.js';
import { compileDeckToHtml } from '../src/renderer/html-compiler.js';
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

  it('Issue #25: parses and roundtrips Deck AST v2 blocks (GFM tables, charts, steps, timeline, grid)', () => {
    const markdown = `---
title: Deck AST v2 Specimen
template: apple-bento-launch
locale: en
aspect: 16:9
---

<!-- scene: s1 | layout: bullets -->
# Architecture Overview

| Component | Status | Latency |
| :--- | :---: | ---: |
| Vector Parser | Ready | 1.2ms |
| Chart Renderer | Ready | 0.8ms |

\`\`\`chart {type: bar, title: "Q4 Performance Benchmarks"}
- Parser: 120
- Compiler: 240
- Bundler: 310
\`\`\`

---

<!-- scene: s2 | layout: bullets -->
# Workflow and Milestones

\`\`\`steps
1. Ingest Raw Notes :: Auto-fetch RSS & notes
2. Compile Visual IR :: Deterministic layout
3. Multi-Channel Export :: PPTX, Wechat, Video
\`\`\`

\`\`\`timeline
2024 :: Foundation & Zero-Cloud Core :: Complete local isolation
2025 :: 36 Design System Market :: Cross-locale templates
2026 :: Multimodal Agentic Flywheel :: Autonomous compilation
\`\`\`

\`\`\`grid
Card 1 :: High density layout :: Featured
Card 2 :: Responsive bento columns :: Pro
\`\`\`
`;

    const doc = parseDeckMarkdown(markdown);
    expect(doc.slides).toHaveLength(2);

    // Slide 1 checks
    const s1 = doc.slides[0];
    expect(s1.table).toBeDefined();
    expect(s1.table?.headers).toEqual(['Component', 'Status', 'Latency']);
    expect(s1.table?.alignments).toEqual(['left', 'center', 'right']);
    expect(s1.table?.rows).toHaveLength(2);
    expect(s1.table?.rows[0]).toEqual(['Vector Parser', 'Ready', '1.2ms']);

    expect(s1.chart).toBeDefined();
    expect(s1.chart?.type).toBe('bar');
    expect(s1.chart?.title).toBe('Q4 Performance Benchmarks');
    expect(s1.chart?.data).toEqual([
      { label: 'Parser', value: 120 },
      { label: 'Compiler', value: 240 },
      { label: 'Bundler', value: 310 },
    ]);

    // Slide 2 checks
    const s2 = doc.slides[1];
    expect(s2.steps).toHaveLength(3);
    expect(s2.steps?.[0]).toEqual({
      step: '1',
      title: 'Ingest Raw Notes',
      desc: 'Auto-fetch RSS & notes',
    });

    expect(s2.timeline).toHaveLength(3);
    expect(s2.timeline?.[0]).toEqual({
      time: '2024',
      event: 'Foundation & Zero-Cloud Core',
      detail: 'Complete local isolation',
    });

    expect(s2.grid).toHaveLength(2);
    expect(s2.grid?.[0]).toEqual({
      title: 'Card 1',
      content: 'High density layout',
      tag: 'Featured',
    });

    // Roundtrip verification
    const serialized = serializeDeckMarkdown(doc);
    const reparsed = parseDeckMarkdown(serialized);
    expect(reparsed.slides[0].table?.headers).toEqual(s1.table?.headers);
    expect(reparsed.slides[0].chart?.data).toEqual(s1.chart?.data);
    expect(reparsed.slides[1].steps).toEqual(s2.steps);
    expect(reparsed.slides[1].timeline).toEqual(s2.timeline);
    expect(reparsed.slides[1].grid).toEqual(s2.grid);
  });

  it('Issue #25: renders deterministic offline vector SVG charts (bar, line, radar, pie)', () => {
    const barSvg = renderChartSvg({
      type: 'bar',
      title: 'Metrics',
      data: [
        { label: 'Q1', value: 100 },
        { label: 'Q2', value: 250 },
      ],
    });
    expect(barSvg).toContain('<svg class="aimake-chart-svg"');
    expect(barSvg).toContain('Metrics');
    expect(barSvg).toContain('Q1');
    expect(barSvg).toContain('Q2');

    const lineSvg = renderChartSvg({
      type: 'line',
      title: 'Growth',
      data: [
        { label: 'Jan', value: 10 },
        { label: 'Feb', value: 45 },
      ],
    });
    expect(lineSvg).toContain('<polyline');
    expect(lineSvg).toContain('Jan');

    const radarSvg = renderChartSvg({
      type: 'radar',
      data: [
        { label: 'Speed', value: 95 },
        { label: 'Quality', value: 90 },
        { label: 'Privacy', value: 100 },
      ],
    });
    expect(radarSvg).toContain('<polygon');
    expect(radarSvg).toContain('Privacy');

    const pieSvg = renderChartSvg({
      type: 'pie',
      title: 'Distribution',
      data: [
        { label: 'Direct', value: 60 },
        { label: 'Referral', value: 40 },
      ],
    });
    expect(pieSvg).toContain('<path');
    expect(pieSvg).toContain('Direct');
  });

  it('Issue #25: auto-reflows Mermaid flowcharts from horizontal LR to vertical TD on narrow aspect ratios', () => {
    const flowchart = `flowchart LR
    A[Raw Notes] --> B[Visual IR] --> C[Publish]`;

    // Wide 16:9 preserves horizontal LR
    const wideSvg = renderMermaidSvg(flowchart, { aspect: '16:9' });
    expect(wideSvg).toContain('Raw Notes');

    // Narrow 3:4 auto-reflows to vertical TD
    const narrowSvg = renderMermaidSvg(flowchart, { aspect: '3:4' });
    expect(narrowSvg).toContain('Raw Notes');
    expect(narrowSvg).toContain('data-diagram-engine="mermaid"');
  });

  it('Issue #25: compiles Deck AST v2 elements into rich standalone HTML presentation', async () => {
    const doc = parseDeckMarkdown(`---
title: Standalone HTML Compiler Test
template: apple-bento-launch
locale: en
aspect: 16:9
---

# Feature Showcase

| Metric | Target | Result |
| :--- | :--- | :--- |
| Zero-Cloud | 100% | Pass |

\`\`\`chart {type: bar}
- A: 10
- B: 20
\`\`\`
`);

    const result = await compileDeckToHtml(doc);
    expect(result.html).toContain('aimake-chart-svg');
    expect(result.html).toContain('aimake-table');
    expect(result.html).toContain('Zero-Cloud');
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

  it('verifies Issue #42: Operations recap specimen with dual aspect and evidence mapping', async () => {
    const specimenPath = path.resolve(__dirname, '../templates/ppt-consulting-matrix/sample.deck.md');
    const content = await fs.readFile(specimenPath, 'utf8');

    // 1. Parse AST
    const doc = parseDeckMarkdown(content);
    expect(doc.frontmatter.title).toContain('2026 Q1 线下创作者沙龙暨多模态生产力试点项目深度复盘');
    expect(doc.frontmatter.template).toBe('ppt-consulting-matrix');
    expect(doc.frontmatter.tags).toContain('operations-recap');
    expect(doc.slides.length).toBe(4);

    // Slide 1: metrics
    const coverSlide = doc.slides[0];
    expect(coverSlide.layout).toBe('metrics');
    expect(coverSlide.metrics).toHaveLength(3);
    expect(coverSlide.metrics[0].label).toBe('报名人数');
    expect(coverSlide.metrics[0].value).toBe('48 人');
    expect(coverSlide.metrics[1].value).toBe('36 人');
    expect(coverSlide.metrics[2].value).toBe('27 组');
    expect(coverSlide.cite).toContain('2026-01-10 至 2026-03-25');

    // Slide 2: comparison (Observations -> Actions)
    const compSlide = doc.slides[1];
    expect(compSlide.layout).toBe('comparison');
    expect(compSlide.comparison).toBeDefined();
    expect(compSlide.comparison?.leftItems).toHaveLength(3);
    expect(compSlide.comparison?.rightItems).toHaveLength(3);
    expect(compSlide.comparison?.leftTitle).toContain('现场观察到的痛点反馈');
    expect(compSlide.comparison?.rightTitle).toContain('下月明确推进的改善动作');

    // Slide 3: GFM table
    const tableSlide = doc.slides[2];
    expect(tableSlide.table).toBeDefined();
    expect(tableSlide.table?.headers).toEqual(['优先级', '核心改进事项', '交付目标', '负责人', '截止时间', '验证来源']);
    expect(tableSlide.table?.rows).toHaveLength(3);
    expect(tableSlide.table?.rows[0][0]).toBe('P0');
    expect(tableSlide.table?.rows[0][3]).toBe('@chico');

    // Slide 4: Outro summary
    const outroSlide = doc.slides[3];
    expect(outroSlide.layout).toBe('outro');
    expect(outroSlide.bullets).toHaveLength(3);

    // 2. Dual-aspect compilation: 16:9 vs 3:4
    const html16x9 = await compileDeckToHtml(doc);
    expect(html16x9.html).toContain('2026 Q1 线下创作者沙龙暨多模态生产力试点项目深度复盘');
    expect(html16x9.html).not.toContain('.compare-grid { grid-template-columns: 1fr !important; }');

    const doc3x4 = {
      ...doc,
      frontmatter: { ...doc.frontmatter, aspect: '3:4' as const },
    };
    const html3x4 = await compileDeckToHtml(doc3x4);
    expect(html3x4.html).toContain('.compare-grid { grid-template-columns: 1fr !important; }');
  });
});
