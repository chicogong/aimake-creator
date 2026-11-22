import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  CURATED_TEMPLATE_PACKS,
  installMarketplaceItem,
  listInstalledTemplates,
  listMarketplaceCatalog,
  remixDeckWithStyle,
  removeInstalledTemplate,
  searchMarketplace,
} from '../src/marketplace/index.js';
import { parseDeckMarkdown } from '../src/renderer/deck-parser.js';
import { compileDeckToHtml, loadTemplateBundle } from '../src/renderer/html-compiler.js';

const EXPECTED_LEGACY_IDS = [
  'xhs-swiss-grid',
  'xhs-paper-editorial',
  'xhs-neon-tech',
  'wechat-greenbook',
  'wechat-editorial-article',
  'linkedin-exec-carousel',
  'x-zukai-quad',
  'ig-cardnews-kr',
  'ppt-executive-16x9',
  'ppt-tech-architecture',
  'edu-flashcard-kids',
  'video-kinetic-reel',
];

const EXPECTED_NEW_IDS = [
  'xhs-warm-magazine',
  'xhs-pop-sticker',
  'wechat-minimal-brief',
  'en-founder-whiteboard',
  'en-substack-digest',
  'ja-note-editorial',
  'ko-brand-lookbook',
  'ppt-consulting-matrix',
  'edu-lesson-guide',
  'video-cinema-talk',
];

const EXPECTED_V2_CRAFT_IDS = [
  'apple-bento-launch',
  'apple-dark-keynote',
  'xhs-bold-headline',
  'xhs-apple-notes',
  'xhs-morandi-cream',
  'xhs-liquid-glass',
  'xhs-pro-vs-con',
  'xhs-quote-card',
  'wechat-deep-report',
  'wechat-frontpage-news',
  'ppt-linear-dark',
  'ppt-bauhaus-bold',
  'poster-risograph',
  'video-podcast-wave',
];

describe('Milestone M2: 36 Built-in Multi-Language & Multi-Style Templates', () => {
  it('exposes all 36 distinct built-in templates and 7 curated packs with live SHA-256 digests', async () => {
    const catalog = await listMarketplaceCatalog();
    expect(catalog.templateCount).toBeGreaterThanOrEqual(36);
    expect(catalog.templates.length).toBe(catalog.templateCount);
    expect(catalog.packCount).toBeGreaterThanOrEqual(7);
    expect(catalog.packs.length).toBe(catalog.packCount);

    const ids = new Set(catalog.templates.map((t) => t.id));
    for (const id of [...EXPECTED_LEGACY_IDS, ...EXPECTED_NEW_IDS, ...EXPECTED_V2_CRAFT_IDS]) {
      expect(ids.has(id)).toBe(true);
    }

    // Every built-in template must have a distinct styleFamily, version 1.0.0, and live 64-char SHA-256
    const styleFamilies = new Set(catalog.templates.map((t) => t.styleFamily));
    expect(styleFamilies.size).toBe(catalog.templateCount);

    const locales = new Set(catalog.templates.map((t) => t.defaultLocale));
    expect(locales).toEqual(new Set(['zh-CN', 'en', 'ja', 'ko']));

    for (const tpl of catalog.templates) {
      expect(tpl.version).toBe('1.0.0');
      expect(tpl.sha256).toMatch(/^[a-f0-9]{64}$/);
      expect(tpl.packIds.length).toBeGreaterThanOrEqual(1);
      expect(tpl.previewBadges.length).toBeGreaterThanOrEqual(3);
    }

    // All 7 curated packs cover all 36 templates
    const expectedPackIds = [
      'pack-solopreneur-cn',
      'pack-global-growth',
      'pack-executive-ppt',
      'pack-educator-pro',
      'pack-video-creator',
      'pack-apple-bento-pro',
      'pack-viral-editorial',
    ];
    expect(CURATED_TEMPLATE_PACKS.map((p) => p.id)).toEqual(expectedPackIds);
    const coveredByPacks = new Set(catalog.packs.flatMap((p) => p.templateIds));
    expect(coveredByPacks.size).toBe(catalog.templateCount);
  });

  it('enforces renderer contracts, locale typography rules (ja kinsoku & ko keep-all), and distinct HTML per template', async () => {
    const catalog = await listMarketplaceCatalog();
    const htmlDigests = new Set<string>();

    for (const entry of catalog.templates) {
      const { htmlSource } = await loadTemplateBundle(entry.id);
      htmlDigests.add(entry.sha256);

      expect(htmlSource).toContain('window.renderDeck');
      expect(htmlSource).toContain('window.fitStage');
      expect(htmlSource).toContain('data-editable="true"');
      expect(htmlSource).toContain('window.aimakeSeek');

      if (entry.defaultLocale === 'ja') {
        expect(htmlSource).toContain('line-break: strict');
      }
      if (entry.defaultLocale === 'ko') {
        expect(htmlSource).toContain('Pretendard');
        expect(htmlSource).toContain('word-break: keep-all');
      }
    }

    // All 36 templates must be genuinely distinct HTML files
    expect(htmlDigests.size).toBe(catalog.templateCount);
  });
});

describe('Milestone M3: Versioned Template Marketplace Search & Verified Install', () => {
  it('supports multi-facet search across zh/en/ja/ko keywords, locale, category, styleFamily, aspect, and format', async () => {
    const zhMag = await searchMarketplace({ q: '暖阳杂志' });
    expect(zhMag.templates.map((t) => t.id)).toContain('xhs-warm-magazine');

    const enWhiteboard = await searchMarketplace({ q: 'whiteboard', locale: 'en', aspect: '4:5' });
    expect(enWhiteboard.templates.map((t) => t.id)).toEqual(['en-founder-whiteboard']);

    const jaWashi = await searchMarketplace({ q: '和紙', locale: 'ja' });
    expect(jaWashi.templates.map((t) => t.id)).toEqual(['ja-note-editorial']);

    const koLookbook = await searchMarketplace({ q: '룩북', locale: 'ko' });
    expect(koLookbook.templates.map((t) => t.id)).toEqual(['ko-brand-lookbook']);

    const pptx16x9 = await searchMarketplace({ category: 'presentation', format: 'pptx', aspect: '16:9' });
    expect(pptx16x9.templates.map((t) => t.id).sort()).toEqual([
      'apple-bento-launch',
      'apple-dark-keynote',
      'ppt-bauhaus-bold',
      'ppt-consulting-matrix',
      'ppt-executive-16x9',
      'ppt-linear-dark',
      'ppt-tech-architecture',
    ]);

    const bento = await searchMarketplace({ packId: 'pack-apple-bento-pro' });
    expect(bento.templates).toHaveLength(4);

    const riso = await searchMarketplace({ q: 'Risograph', aspect: '4:5' });
    expect(riso.templates.map((t) => t.id)).toEqual(['poster-risograph']);

    const cinema = await searchMarketplace({ styleFamily: 'cinema-letterbox', format: 'mp4' });
    expect(cinema.templates.map((t) => t.id)).toEqual(['video-cinema-talk']);
  });

  it('installs single versioned templates & packs with SHA-256 verification, idempotency, tamper detection, and removal', async () => {
    const workspace = await fs.mkdtemp(path.join(os.tmpdir(), 'aimake-mkt-'));
    try {
      // 1. Install a single versioned template
      const firstInstall = await installMarketplaceItem('xhs-warm-magazine@1.0.0', workspace);
      expect(firstInstall.resolvedType).toBe('template');
      expect(firstInstall.verified).toBe(true);
      expect(firstInstall.newlyInstalled).toEqual(['xhs-warm-magazine']);
      expect(firstInstall.alreadyInstalled).toEqual([]);

      // 2. Idempotent re-install
      const secondInstall = await installMarketplaceItem('xhs-warm-magazine@1.0.0', workspace);
      expect(secondInstall.newlyInstalled).toEqual([]);
      expect(secondInstall.alreadyInstalled).toEqual(['xhs-warm-magazine']);

      // 3. Install a curated pack (7 global templates)
      const packInstall = await installMarketplaceItem('pack-global-growth@1.0.0', workspace);
      expect(packInstall.resolvedType).toBe('pack');
      expect(packInstall.verified).toBe(true);
      expect(packInstall.newlyInstalled).toHaveLength(7);

      // 4. List installed templates and confirm SHA-256 integrity
      const installed = await listInstalledTemplates(workspace);
      expect(installed).toHaveLength(8);
      expect(installed.every((r) => r.integrityOk)).toBe(true);

      // Verify registry JSON stores clean relative paths (no private absolute paths)
      const rawRegistry = await fs.readFile(path.join(workspace, '.aimake', 'installed.json'), 'utf8');
      expect(rawRegistry).toContain('.aimake/installed-templates/xhs-warm-magazine');
      expect(rawRegistry).not.toContain(workspace);

      // 5. Tamper with an installed template and confirm integrity check flags it
      const tamperedHtml = path.join(
        workspace,
        '.aimake',
        'installed-templates',
        'ja-note-editorial',
        'template.html'
      );
      await fs.appendFile(tamperedHtml, '\n<!-- tampered -->', 'utf8');
      const afterTamper = await listInstalledTemplates(workspace);
      const jaEntry = afterTamper.find((r) => r.id === 'ja-note-editorial');
      expect(jaEntry?.integrityOk).toBe(false);

      // 6. Remove an installed template cleanly
      const removed = await removeInstalledTemplate('ja-note-editorial', workspace);
      expect(removed.removed).toBe(true);
      expect(removed.remaining).toBe(7);

      // 7. Reject mismatched versions and unknown IDs
      await expect(installMarketplaceItem('xhs-warm-magazine@9.9.9', workspace)).rejects.toThrow(
        /version/i
      );
      await expect(installMarketplaceItem('nonexistent-pack@1.0.0', workspace)).rejects.toThrow(
        /not found/i
      );
    } finally {
      await fs.rm(workspace, { recursive: true, force: true });
    }
  });
});

describe('Milestone M4: One-Click Remix (「一键做同款」) Engine', () => {
  it('remixes a user deck onto a Marketplace template while preserving 100% of user content & citations', async () => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'aimake-remix-tpl-'));
    try {
      const targetDeckPath = path.join(tmpDir, 'my-notes.deck.md');
      const outDeckPath = path.join(tmpDir, 'remixed-consulting.deck.md');

      await fs.writeFile(
        targetDeckPath,
        `---
title: Q3 产品增长复盘
template: xhs-swiss-grid
locale: zh-CN
aspect: 3:4
author: Alice Lin
handle: "@alicelin"
watermark: true
tags:
  - growth
---

<!-- scene: s1 | layout: metrics | eyebrow: Q3 DATA | cite: wiki/q3-growth.md#L12 -->
# 本地优先工具如何实现 3 倍自然留存？
## 零云端摩擦让用户第一分钟就拿到真实成片

\`\`\`metric
- 次日留存: 68% (+21pp)
- 导出耗时: 1.4s (-70%)
\`\`\`

::: speech
把云端登录墙砍掉后，我们的核心转化率反而提升了三倍。
:::

---

<!-- scene: s2 | layout: bullets | eyebrow: ACTIONS | cite: wiki/q3-growth.md#L48 -->
# 下阶段四项关键动作

- 开放 22 套多语种参数化视觉模板
- 支持一键做同款跨格式无损迁移
- 接入本地 Wiki 知识复利回写链路
- 强化 16:9 原生可编辑 PPTX 导出质量
`,
        'utf8'
      );

      const res = await remixDeckWithStyle({
        sourceTemplateId: 'ppt-consulting-matrix@1.0.0',
        targetDeckPath,
        outDeckPath,
      });

      expect(res.mode).toBe('template');
      expect(res.templateId).toBe('ppt-consulting-matrix');
      expect(res.aspect).toBe('16:9');
      expect(res.locale).toBe('zh-CN');
      expect(res.remixedFrom).toBe('template:ppt-consulting-matrix@1.0.0');

      const writtenRaw = await fs.readFile(outDeckPath, 'utf8');
      const reparsed = parseDeckMarkdown(writtenRaw);

      expect(reparsed.frontmatter.template).toBe('ppt-consulting-matrix');
      expect(reparsed.frontmatter.aspect).toBe('16:9');
      expect(reparsed.frontmatter.tags).toContain('remixedFrom: template:ppt-consulting-matrix@1.0.0');

      // Verify 100% content preservation
      expect(reparsed.slides).toHaveLength(2);
      expect(reparsed.slides[0].title).toBe('本地优先工具如何实现 3 倍自然留存？');
      expect(reparsed.slides[0].metrics).toEqual([
        { label: '次日留存', value: '68%', delta: '+21pp' },
        { label: '导出耗时', value: '1.4s', delta: '-70%' },
      ]);
      expect(reparsed.slides[0].speech).toContain('核心转化率反而提升了三倍');
      expect(reparsed.slides[0].cite).toBe('wiki/q3-growth.md#L12');
      expect(reparsed.slides[1].bullets).toHaveLength(4);
      expect(reparsed.slides[1].cite).toBe('wiki/q3-growth.md#L48');

      // Verify remixed deck compiles cleanly through HTML compiler
      const compiled = await compileDeckToHtml(reparsed);
      expect(compiled.manifest.id).toBe('ppt-consulting-matrix');
      expect(compiled.html).toContain('ppt-consulting-matrix');
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  });

  it('remixes from a reference finished .deck.md adopting its style, timing, layout rhythm, and optional 4-locale humanizer', async () => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'aimake-remix-ref-'));
    try {
      const refDeckPath = path.join(tmpDir, 'viral-cinema-ref.deck.md');
      const userDeckPath = path.join(tmpDir, 'raw-draft.deck.md');
      const outDeckPath = path.join(tmpDir, 'final-cinema.deck.md');

      await fs.writeFile(
        refDeckPath,
        `---
title: Viral Reference Reel
template: video-cinema-talk
locale: zh-CN
aspect: 9:16
fps: 60
secondsPerSlide: 3
accentColor: "#E5C158"
watermark: true
---

<!-- scene: r1 | layout: cover -->
# Ref Cover

---

<!-- scene: r2 | layout: comparison -->
# Ref Compare

---

<!-- scene: r3 | layout: outro -->
# Ref Outro
`,
        'utf8'
      );

      await fs.writeFile(
        userDeckPath,
        `---
title: 总而言之，这是一套全方位赋能创作者的工具
template: xhs-swiss-grid
locale: zh-CN
aspect: 3:4
author: Bob Chen
watermark: true
---

<!-- scene: u1 | layout: bullets | cite: wiki/notes.md#L5 -->
# 值得注意的是，为什么本地创作更稳？
- 全方位赋能独立开发者，打通底层逻辑 🚀✨💡

::: speech
总而言之，家人们谁懂啊，这套本地工具真的能赋能效率。
:::

---

<!-- scene: u2 | layout: bullets | cite: wiki/notes.md#L22 -->
# 架构对比视角
- 零云端等待
- 数据 100% 留存本机

---

<!-- scene: u3 | layout: bullets -->
# 立即行动清单
- 克隆并运行本地工作流
`,
        'utf8'
      );

      const res = await remixDeckWithStyle({
        sourceDeckPath: refDeckPath,
        targetDeckPath: userDeckPath,
        outDeckPath,
        humanize: true,
      });

      expect(res.mode).toBe('reference-deck');
      expect(res.templateId).toBe('video-cinema-talk');
      expect(res.aspect).toBe('9:16');
      expect(res.humanized).toBe(true);
      expect(res.appliedLayouts).toEqual(['cover', 'comparison', 'outro']);

      const reparsed = parseDeckMarkdown(await fs.readFile(outDeckPath, 'utf8'));
      expect(reparsed.frontmatter.template).toBe('video-cinema-talk');
      expect(reparsed.frontmatter.aspect).toBe('9:16');
      expect(reparsed.frontmatter.fps).toBe(60);
      expect(reparsed.frontmatter.secondsPerSlide).toBe(3);
      expect(reparsed.frontmatter.accentColor).toBe('#E5C158');
      expect(reparsed.frontmatter.tags).toContain('remixedFrom: deck:viral-cinema-ref.deck.md');

      // Check layout rhythm copied from reference deck
      expect(reparsed.slides.map((s) => s.layout)).toEqual(['cover', 'comparison', 'outro']);

      // Check citations & core meaning preserved while AI slop phrases were stripped
      expect(reparsed.slides[0].cite).toBe('wiki/notes.md#L5');
      expect(reparsed.slides[1].cite).toBe('wiki/notes.md#L22');
      expect(reparsed.frontmatter.title).not.toContain('总而言之');
      expect(reparsed.slides[0].title).not.toContain('值得注意的是');
      expect(reparsed.slides[0].bullets[0]).not.toContain('底层逻辑');
      expect(reparsed.slides[0].speech).not.toContain('家人们谁懂啊');
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  });
});
