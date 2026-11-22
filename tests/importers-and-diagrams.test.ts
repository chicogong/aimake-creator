import { describe, expect, it } from 'vitest';
import {
  parseDeckMarkdown,
  serializeDeckMarkdown,
} from '../src/renderer/deck-parser.js';
import { renderMermaidSvg } from '../src/renderer/mermaid-svg.js';
import { compileDeckToHtml } from '../src/renderer/html-compiler.js';
import { importExternalMarkdownDeck } from '../src/renderer/importers.js';

describe('Mermaid Diagrams, Highlight.js & Marp/Slidev Importer', () => {
  it('parses and serializes ```mermaid blocks without leaking bullets', () => {
    const md = [
      '---',
      'title: Architecture Flow',
      'template: ppt-linear-dark',
      'locale: zh-CN',
      '---',
      '',
      '<!-- scene: flow | eyebrow: PIPELINE -->',
      '# 编译流水线总览',
      '## 单一原稿多端渲染',
      '',
      '```mermaid',
      'flowchart LR',
      '  MD[Markdown 原稿] --> AST{结构化解析}',
      '  AST --> SVG([Mermaid 矢量图])',
      '```',
      '',
    ].join('\n');

    const doc = parseDeckMarkdown(md);
    expect(doc.slides).toHaveLength(1);
    expect(doc.slides[0].layout).toBe('diagram');
    expect(doc.slides[0].bullets).toEqual([]);
    expect(doc.slides[0].diagram).toEqual({
      engine: 'mermaid',
      code: 'flowchart LR\n  MD[Markdown 原稿] --> AST{结构化解析}\n  AST --> SVG([Mermaid 矢量图])',
    });

    const roundTrip = serializeDeckMarkdown(doc);
    expect(roundTrip).toContain('```mermaid');
    expect(roundTrip).toContain('MD[Markdown 原稿] --> AST{结构化解析}');
  });

  it('renders offline vector SVG for flowcharts and safe fallback for non-flowchart syntax', () => {
    const svg = renderMermaidSvg(
      'flowchart LR\n  Input[Markdown] -->|compile| Stage(HTML Stage)\n  Stage --> Export([PPTX / PDF])'
    );
    expect(svg).toContain('<svg class="aimake-mermaid-svg"');
    expect(svg).toContain('Markdown');
    expect(svg).toContain('HTML Stage');
    expect(svg).toContain('compile');
    expect(svg).toContain('<marker');

    // Cyclic graph must terminate cleanly without infinite recursion
    const cyclicSvg = renderMermaidSvg('flowchart TD\n  A[Start] --> B[Step]\n  B --> A');
    expect(cyclicSvg).toContain('<svg class="aimake-mermaid-svg"');

    // Sequence diagram falls back cleanly
    const seqFallback = renderMermaidSvg('sequenceDiagram\n  User->>Agent: Prompt');
    expect(seqFallback).toContain('aimake-mermaid-fallback');
    expect(seqFallback).toContain('sequenceDiagram');
  });

  it('embeds Highlight.js tokens and Mermaid SVG maps into compiled deck HTML', async () => {
    const doc = parseDeckMarkdown(
      [
        '---',
        'title: Engine Specs',
        'template: ppt-linear-dark',
        'locale: en',
        '---',
        '',
        '# SDK Quickstart',
        '',
        '```typescript',
        "export const version: string = '1.0.0';",
        '```',
        '',
        '---',
        '',
        '# Data Flow',
        '',
        '```mermaid',
        'flowchart TD',
        '  A[Source] --> B[Deck]',
        '```',
      ].join('\n')
    );

    const compiled = await compileDeckToHtml(doc);
    expect(compiled.html).toContain('hljs-keyword');
    expect(compiled.html).toContain('hljs-string');
    expect(compiled.html).toContain('aimake-mermaid-svg');
  });

  it('imports Marp and Slidev markdown into canonical .deck.md', () => {
    const marpInput = [
      '---',
      'marp: true',
      'theme: default',
      'title: Marp Launch Deck',
      '---',
      '',
      '<!-- _class: lead -->',
      '# Hello Marp Creators',
      '',
      '<!-- notes: Welcome to the keynote -->',
      '',
      '---',
      '',
      '# Key Takeaways',
      '- Fast onboarding',
      '- Zero server required',
    ].join('\n');

    const marpRes = importExternalMarkdownDeck(marpInput);
    expect(marpRes.sourceFormat).toBe('marp');
    expect(marpRes.slideCount).toBe(2);
    expect(marpRes.title).toBe('Marp Launch Deck');
    expect(marpRes.markdown).toContain('::: speech');
    expect(marpRes.markdown).toContain('Welcome to the keynote');
    expect(marpRes.markdown).not.toContain('<!-- _class: lead -->');

    const slidevInput = [
      '---',
      'theme: seriph',
      'title: Slidev Migration',
      '---',
      '',
      'layout: two-cols',
      '',
      '# Split Column Architecture',
      '',
      '::right::',
      '<v-clicks>',
      '- Modular AST',
      '- Static Exports',
      '</v-clicks>',
    ].join('\n');

    const slidevRes = importExternalMarkdownDeck(slidevInput, { template: 'ppt-linear-dark' });
    expect(slidevRes.sourceFormat).toBe('slidev');
    expect(slidevRes.markdown).toContain('template: ppt-linear-dark');
    expect(slidevRes.markdown).not.toContain('<v-clicks>');
    expect(slidevRes.markdown).toContain('Modular AST');
  });
});
