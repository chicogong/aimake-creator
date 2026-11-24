import { describe, expect, it } from 'vitest';
import path from 'node:path';
import fs from 'node:fs/promises';
import os from 'node:os';
import {
  resolveSlideDimensions,
  resolvePptPalette,
  normalizeHex,
  parseGfmTable,
  extractGfmTableFromSlide,
  calculateTableRowHeights,
  rasterizeMermaidToHighDpiPng,
  exportDeckToPptx,
  chooseFontFace,
} from '../src/renderer/exporter-pptx.js';
import { BUILTIN_TEMPLATES } from '../src/templates/index.js';
import type { DeckDocument, DeckSlide } from '../src/schema/types.js';

describe('PPTX Visual IR Engine (T-19)', () => {
  describe('1. Aspect-Adaptive Slide Dimensions', () => {
    it('accurately resolves slide dimensions and margins across all supported aspect ratios', () => {
      // 16:9 (Standard widescreen)
      const wide = resolveSlideDimensions('16:9');
      expect(wide.aspect).toBe('16:9');
      expect(wide.width).toBeCloseTo(13.333, 2);
      expect(wide.height).toBe(7.5);
      expect(wide.layoutName).toBe('LAYOUT_WIDE');
      expect(wide.margin.x).toBe(0.8);
      expect(wide.contentWidth).toBeCloseTo(11.733, 2);

      // 3:4 (Xiaohongshu / vertical editorial)
      const xhs = resolveSlideDimensions('3:4');
      expect(xhs.aspect).toBe('3:4');
      expect(xhs.width).toBe(7.5);
      expect(xhs.height).toBe(10.0);
      expect(xhs.layoutName).toBe('LAYOUT_3x4');
      expect(xhs.margin.x).toBe(0.6);
      expect(xhs.contentWidth).toBe(6.3);

      // 4:5 (Instagram / Social Feed)
      const insta = resolveSlideDimensions('4:5');
      expect(insta.aspect).toBe('4:5');
      expect(insta.width).toBe(8.0);
      expect(insta.height).toBe(10.0);
      expect(insta.layoutName).toBe('LAYOUT_4x5');
      expect(insta.margin.x).toBe(0.65);
      expect(insta.contentWidth).toBe(6.7);

      // 1:1 (Square cards)
      const square = resolveSlideDimensions('1:1');
      expect(square.aspect).toBe('1:1');
      expect(square.width).toBe(8.5);
      expect(square.height).toBe(8.5);
      expect(square.layoutName).toBe('LAYOUT_1x1');
      expect(square.margin.x).toBe(0.7);
      expect(square.contentWidth).toBe(7.1);

      // 9:16 (Story / Reel vertical format)
      const vertical = resolveSlideDimensions('9:16');
      expect(vertical.aspect).toBe('9:16');
      expect(vertical.width).toBe(7.5);
      expect(vertical.height).toBeCloseTo(13.333, 2);
      expect(vertical.layoutName).toBe('LAYOUT_9x16');

      // Fallback defaults to 16:9
      const fallback = resolveSlideDimensions(undefined);
      expect(fallback.aspect).toBe('16:9');
      expect(fallback.width).toBeCloseTo(13.333, 2);
    });

    it('selects localized typography font stacks properly', () => {
      expect(chooseFontFace('zh-CN')).toBe('PingFang SC');
      expect(chooseFontFace('ja')).toBe('Hiragino Sans');
      expect(chooseFontFace('ko')).toBe('Apple SD Gothic Neo');
      expect(chooseFontFace('en')).toBe('Arial');
      expect(chooseFontFace(undefined)).toBe('Arial');
    });
  });

  describe('2. Multi-Palette Inheritance (36 Templates)', () => {
    it('normalizes hex and rgb/rgba color values into clean 6-character hex', () => {
      expect(normalizeHex('#D93829', '000000')).toBe('D93829');
      expect(normalizeHex('#FFF', '000000')).toBe('FFFFFF');
      expect(normalizeHex('rgba(217, 56, 41, 0.1)', '000000')).toBe('D93829');
      expect(normalizeHex('rgb(56, 189, 248)', '000000')).toBe('38BDF8');
      expect(normalizeHex(undefined, '123456')).toBe('123456');
    });

    it('faithfully extracts CSS variable palettes across all 36 built-in templates', () => {
      expect(BUILTIN_TEMPLATES.length).toBe(36);

      for (const tmpl of BUILTIN_TEMPLATES) {
        const palette = resolvePptPalette(tmpl.manifest.id);
        expect(palette).toBeDefined();
        // Check 6-character hex format without '#'
        expect(palette.bg).toMatch(/^[0-9A-F]{6}$/);
        expect(palette.surface).toMatch(/^[0-9A-F]{6}$/);
        expect(palette.border).toMatch(/^[0-9A-F]{6}$/);
        expect(palette.title).toMatch(/^[0-9A-F]{6}$/);
        expect(palette.body).toMatch(/^[0-9A-F]{6}$/);
        expect(palette.muted).toMatch(/^[0-9A-F]{6}$/);
        expect(palette.accent).toMatch(/^[0-9A-F]{6}$/);
        expect(typeof palette.isDark).toBe('boolean');
      }
    });

    it('faithfully maps representative templates to signature colors', () => {
      // xhs-swiss-grid (Vermilion accent, Swiss typography)
      const swiss = resolvePptPalette('xhs-swiss-grid');
      expect(swiss.accent).toBe('D93829');
      expect(swiss.bg).toBe('F4F2EC');
      expect(swiss.surface).toBe('FFFFFF');
      expect(swiss.title).toBe('141518');
      expect(swiss.isDark).toBe(false);

      // xhs-neon-tech (Dark cyber with cyan accent)
      const neon = resolvePptPalette('xhs-neon-tech');
      expect(neon.accent).toBe('38BDF8');
      expect(neon.bg).toBe('090D14');
      expect(neon.surface).toBe('121926');
      expect(neon.title).toBe('F1F5F9');
      expect(neon.isDark).toBe(true);

      // xhs-paper-editorial (Forest green on warm paper)
      const paper = resolvePptPalette('xhs-paper-editorial');
      expect(paper.accent).toBe('1F5E4B');
      expect(paper.bg).toBe('FAF6EE');
      expect(paper.surface).toBe('F3ECE0');

      // xhs-warm-magazine (Warm terracotta magazine)
      const warm = resolvePptPalette('xhs-warm-magazine');
      expect(warm.accent).toBe('C44D34');
      expect(warm.bg).toBe('FBF2E6');
      expect(warm.surface).toBe('F5E6D3');
    });

    it('honors custom accentColor override from frontmatter', () => {
      const overridden = resolvePptPalette('xhs-swiss-grid', '#10B981');
      expect(overridden.accent).toBe('10B981');
      expect(overridden.bg).toBe('F4F2EC'); // Preserves base template colors

      const customHex = resolvePptPalette('xhs-neon-tech', 'rgba(255, 99, 132, 0.8)');
      expect(customHex.accent).toBe('FF6384');
    });

    it('falls back gracefully on unknown custom templates with dark/light heuristics', () => {
      const darkCustom = resolvePptPalette('my-custom-tech-dark');
      expect(darkCustom.isDark).toBe(true);
      expect(darkCustom.bg).toBe('0F1218');
      expect(darkCustom.accent).toBe('38BDF8');

      const lightCustom = resolvePptPalette('unlisted-clean-minimal');
      expect(lightCustom.isDark).toBe(false);
      expect(lightCustom.bg).toBe('F8F7F4');
      expect(lightCustom.accent).toBe('2B6BE6');
    });
  });

  describe('3. Native GFM Table & Dynamic Row Height Calculation', () => {
    it('parses pipe tables with alignments and cell contents', () => {
      const tableLines = [
        '| Metric | Baseline | Target | Status |',
        '| :--- | :---: | ---: | :--- |',
        '| Core Latency | 240ms | 45ms | PASS |',
        '| Throughput | 1.2k | 8.5k | BOOST |',
      ];
      const parsed = parseGfmTable(tableLines);
      expect(parsed).not.toBeNull();
      expect(parsed?.headers).toEqual(['Metric', 'Baseline', 'Target', 'Status']);
      expect(parsed?.alignments).toEqual(['left', 'center', 'right', 'left']);
      expect(parsed?.rows).toHaveLength(2);
      expect(parsed?.rows[0]).toEqual(['Core Latency', '240ms', '45ms', 'PASS']);
      expect(parsed?.rows[1]).toEqual(['Throughput', '1.2k', '8.5k', 'BOOST']);
    });

    it('extracts table from slide while keeping surrounding bullets and body text intact', () => {
      const slide: DeckSlide = {
        index: 1,
        id: 'slide-table',
        layout: 'bullets',
        title: 'Performance Benchmark',
        bullets: ['Key finding: significant throughput improvement across pipelines.'],
        bodyParagraphs: [
          'Overview summary before table.',
          '| Framework | QPS | Memory |',
          '| :--- | :---: | ---: |',
          '| Aimake IR | 14,200 | 48MB |',
          '| Legacy AST | 2,100 | 180MB |',
          'Footnote conclusion after table.',
        ],
        metrics: [],
      };

      const extracted = extractGfmTableFromSlide(slide);
      expect(extracted.table).not.toBeNull();
      expect(extracted.table?.headers).toEqual(['Framework', 'QPS', 'Memory']);
      expect(extracted.table?.rows).toHaveLength(2);
      expect(extracted.filteredParagraphs).toEqual([
        'Overview summary before table.',
        'Footnote conclusion after table.',
      ]);
      expect(extracted.filteredBullets).toEqual([
        'Key finding: significant throughput improvement across pipelines.',
      ]);
    });

    it('computes adaptive column widths and row heights with overflow prevention', () => {
      const table = {
        headers: ['Component', 'Description', 'SLA'],
        alignments: ['left', 'left', 'center'] as ('left' | 'center' | 'right')[],
        rows: [
          [
            'Renderer',
            'Compiles AST into visual representations across OOXML, SVG and Web formats.',
            '99.9%',
          ],
          ['Exporter', 'Encodes multi-format artifacts.', '99.5%'],
        ],
      };

      // Standard wide layout: contentWidth = 11.733, availableHeight = 4.0
      const wideLayout = calculateTableRowHeights(table, 11.733, 4.0);
      expect(wideLayout.colWidths).toHaveLength(3);
      // Description column should be significantly wider than SLA
      expect(wideLayout.colWidths[1]).toBeGreaterThan(wideLayout.colWidths[2]);
      const sumW = wideLayout.colWidths.reduce((a, b) => a + b, 0);
      expect(sumW).toBeCloseTo(11.733, 2);
      expect(wideLayout.rowHeights).toHaveLength(3); // 1 header + 2 rows
      expect(wideLayout.totalHeight).toBeLessThan(4.0);
      expect(wideLayout.fontSize).toBe(11);

      // Constrained height: test overflow compression
      const constrainedLayout = calculateTableRowHeights(table, 11.733, 0.8);
      expect(constrainedLayout.fontSize).toBeLessThanOrEqual(9.5);
      expect(constrainedLayout.totalHeight).toBeLessThanOrEqual(1.1);
    });
  });

  describe('4. Mermaid Embedding & High-DPI Diagram Rasterization', () => {
    it('rasterizes Mermaid flowcharts into crisp 3x High-DPI transparent PNGs', async () => {
      const mermaidCode = [
        'flowchart LR',
        '  MD[Markdown Deck] --> IR{Visual IR}',
        '  IR --> PPTX([PowerPoint .pptx])',
        '  IR --> PDF([Vector PDF])',
      ].join('\n');

      const palette = resolvePptPalette('xhs-neon-tech');
      const pngData = await rasterizeMermaidToHighDpiPng(mermaidCode, palette);

      expect(pngData).not.toBeNull();
      expect(pngData).toMatch(/^data:image\/png;base64,/);

      // Verify that the PNG payload has valid PNG signature
      const base64Content = (pngData || '').replace(/^data:image\/png;base64,/, '');
      const buffer = Buffer.from(base64Content, 'base64');
      expect(buffer.length).toBeGreaterThan(1000);
      // PNG header magic bytes: 0x89, 'P', 'N', 'G'
      expect(buffer[0]).toBe(0x89);
      expect(buffer[1]).toBe(0x50);
      expect(buffer[2]).toBe(0x4e);
      expect(buffer[3]).toBe(0x47);
    });

    it('gracefully handles non-flowchart syntax without throwing', async () => {
      const invalidCode = 'unsupported_syntax_block\n  A --- B';
      const palette = resolvePptPalette('xhs-swiss-grid');
      const result = await rasterizeMermaidToHighDpiPng(invalidCode, palette);
      // Falls back safely to null so native PPTX shapes can take over
      expect(result).toBeNull();
    });
  });

  describe('5. Full End-to-End Multi-Slide Deck Export Across 4 Aspect Ratios', () => {
    const makeSampleDoc = (aspect: '16:9' | '3:4' | '4:5' | '1:1'): DeckDocument => ({
      frontmatter: {
        title: `Visual IR Presentation (${aspect})`,
        template: 'xhs-swiss-grid',
        locale: 'zh-CN',
        aspect,
        author: 'Aimake Core Team',
        watermark: true,
        fps: 30,
        secondsPerSlide: 4,
        tags: ['visual-ir', 'pptx', 'testing'],
      },
      slides: [
        // Slide 1: Cover
        {
          index: 0,
          id: 'slide-cover',
          layout: 'cover',
          eyebrow: 'AIMAKE STUDIO 2.0',
          title: 'PowerPoint Visual IR 导出引擎',
          subtitle: '基于统一视觉表示与 OOXML 原生保真排版',
          bullets: [],
          bodyParagraphs: [],
          metrics: [],
        },
        // Slide 2: Metrics
        {
          index: 1,
          id: 'slide-metrics',
          layout: 'metrics',
          eyebrow: 'PERFORMANCE',
          title: '核心架构指标与吞吐量',
          subtitle: '零后端纯本地编译管线',
          bullets: [],
          bodyParagraphs: [],
          metrics: [
            { label: '解析吞吐', value: '14.2k', delta: '+340%' },
            { label: '首屏时间', value: '42ms', delta: '-68%' },
            { label: '色板还原', value: '36/36', delta: '100%' },
            { label: '原生表格', value: 'OOXML', delta: 'Native' },
          ],
        },
        // Slide 3: GFM Table with Zebra striping
        {
          index: 2,
          id: 'slide-table',
          layout: 'bullets',
          eyebrow: 'GFM TABLE',
          title: '多画幅画板自适应契约',
          subtitle: '支持移动端与桌面端全比例排版',
          bullets: [],
          bodyParagraphs: [
            '| 画幅比例 | 适用场景 | 目标画布尺寸 | 原生排版适配 |',
            '| :--- | :--- | :---: | ---: |',
            '| 16:9 | 桌面大屏、大会路演 | 13.333 × 7.50 in | 宽幅多栏横向展开 |',
            '| 3:4 | 小红书、卡片知识库 | 7.50 × 10.00 in | 纵向紧凑四格网格 |',
            '| 4:5 | 社交媒体、Instagram | 8.00 × 10.00 in | 双栏自适应均分 |',
            '| 1:1 | 方形轮播卡、朋友圈 | 8.50 × 8.50 in | 方正居中高密度排版 |',
          ],
          metrics: [],
        },
        // Slide 4: Mermaid Diagram
        {
          index: 3,
          id: 'slide-diagram',
          layout: 'diagram',
          eyebrow: 'MERMAID FLOW',
          title: '高保真 3x 光栅化内嵌流水线',
          subtitle: '动态继承模板 CSS 色彩变量并嵌入透明画板',
          bullets: [],
          bodyParagraphs: [],
          metrics: [],
          diagram: {
            engine: 'mermaid',
            code: [
              'flowchart LR',
              '  MD[Markdown Deck] --> AST{AST v2}',
              '  AST --> Table[Native OOXML Table]',
              '  AST --> Diagram[High-DPI Rasterizer]',
              '  Diagram --> PPTX([Crisp Presentation])',
              '  Table --> PPTX',
            ].join('\n'),
          },
        },
        // Slide 5: Comparison
        {
          index: 4,
          id: 'slide-comparison',
          layout: 'comparison',
          eyebrow: 'COMPARISON',
          title: 'Visual IR 与旧版导出对比',
          subtitle: '从简单单色文本升级为多维原生对象',
          bullets: [],
          bodyParagraphs: [],
          metrics: [],
          comparison: {
            leftTitle: '旧版 Hardcoded PPTX',
            leftItems: [
              '硬编码 Dark / Light 两套颜色',
              '固定 16:9 画幅，无法适配小红书 3:4',
              'Mermaid 流程图直接丢失',
              '表格渲染为普通无序列表',
            ],
            rightTitle: '新版 Visual IR 引擎',
            rightItems: [
              '完整继承 36 套模板真实 CSS 变量',
              '自适应 16:9 / 3:4 / 4:5 / 1:1 画幅',
              '3x 高清透明 PNG 原生内嵌流程图',
              '原生 pptxgenjs addTable 斑马纹与防溢出',
            ],
          },
        },
      ],
    });

    it.each(['16:9', '3:4', '4:5', '1:1'] as const)(
      'generates valid, non-empty PPTX files for aspect ratio %s',
      async (aspect) => {
        const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'aimake-pptx-test-'));
        const outFile = path.join(tmpDir, `presentation-${aspect.replace(':', 'x')}.pptx`);

        try {
          const doc = makeSampleDoc(aspect);
          const resultPath = await exportDeckToPptx(doc, outFile);

          expect(resultPath).toBe(outFile);
          const stat = await fs.stat(outFile);
          expect(stat.size).toBeGreaterThan(15000); // Must be a substantial presentation with images & tables
        } finally {
          await fs.rm(tmpDir, { recursive: true, force: true });
        }
      },
      30000 // Allow up to 30s for Playwright browser screenshot across 4 aspects
    );
  });
});
