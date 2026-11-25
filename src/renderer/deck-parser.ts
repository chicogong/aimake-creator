import matter from 'gray-matter';
import YAML from 'yaml';
import type {
  AspectRatio,
  ComparisonBlock,
  DeckDocument,
  DeckFrontmatter,
  DeckSlide,
  MetricItem,
  SlideLayout,
  SupportedLocale,
} from '../schema/types.js';

const DEFAULT_FRONTMATTER: DeckFrontmatter = {
  title: 'Untitled Aimake Deck',
  template: 'xhs-swiss-grid',
  locale: 'zh-CN',
  aspect: '3:4',
  watermark: true,
  fps: 30,
  secondsPerSlide: 4,
  tags: [],
};

/**
 * Splits markdown into slide chunks by `---` outside fenced code blocks.
 */
function splitSlidesOutsideFences(body: string): string[] {
  const lines = body.replace(/\r\n/g, '\n').split('\n');
  const chunks: string[] = [];
  let current: string[] = [];
  let inFence = false;
  let fenceMarker = '';

  for (const line of lines) {
    const trimmed = line.trim();
    const fenceMatch = trimmed.match(/^(`{3,}|~{3,})/);
    if (fenceMatch) {
      if (!inFence) {
        inFence = true;
        fenceMarker = fenceMatch[1][0];
      } else if (trimmed.startsWith(fenceMarker.repeat(3))) {
        inFence = false;
        fenceMarker = '';
      }
      current.push(line);
      continue;
    }

    if (!inFence && /^---+\s*$/.test(trimmed)) {
      if (current.join('\n').trim().length > 0) {
        chunks.push(current.join('\n').trim());
      }
      current = [];
      continue;
    }

    current.push(line);
  }

  if (current.join('\n').trim().length > 0) {
    chunks.push(current.join('\n').trim());
  }

  return chunks;
}

function parseSceneComment(chunk: string): {
  meta: Record<string, string>;
  cleaned: string;
} {
  const meta: Record<string, string> = {};
  const cleaned = chunk.replace(/<!--\s*([\s\S]*?)\s*-->/g, (_full, inner: string) => {
    const pairs = inner.split('|').map((s) => s.trim());
    for (const pair of pairs) {
      const idx = pair.indexOf(':');
      if (idx > 0) {
        const key = pair.slice(0, idx).trim().toLowerCase();
        const val = pair.slice(idx + 1).trim();
        if (key && val) meta[key] = val;
      }
    }
    return '';
  });
  return { meta, cleaned: cleaned.trim() };
}

function inferLayout(slide: Partial<DeckSlide>, index: number, total: number): SlideLayout {
  if (slide.diagram) return 'diagram';
  if (slide.metrics && slide.metrics.length > 0) return 'metrics';
  if (slide.code) return 'code';
  if (slide.comparison) return 'comparison';
  if (slide.quote && (!slide.bullets || slide.bullets.length === 0)) return 'quote';
  if (index === 0) return 'cover';
  if (index === total - 1 && total > 2 && (!slide.bullets || slide.bullets.length <= 2)) {
    return 'outro';
  }
  return 'bullets';
}

function parseMetricFence(content: string): MetricItem[] {
  const items: MetricItem[] = [];
  for (const rawLine of content.split('\n')) {
    const line = rawLine.replace(/^[-*]\s*/, '').trim();
    if (!line) continue;
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;
    const label = line.slice(0, colonIdx).trim();
    let rest = line.slice(colonIdx + 1).trim();
    let delta: string | undefined;
    const deltaMatch = rest.match(/\(([^)]+)\)\s*$/);
    if (deltaMatch) {
      delta = deltaMatch[1].trim();
      rest = rest.slice(0, deltaMatch.index).trim();
    }
    items.push({ label, value: rest, delta });
  }
  return items;
}

function parseCompareFence(content: string): ComparisonBlock | undefined {
  const lines = content
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length < 2) return undefined;
  const parseSide = (line: string) => {
    const [head, tail = ''] = line.split('::');
    return {
      title: head.replace(/^[-*]\s*/, '').trim(),
      items: tail
        .split('|')
        .map((s) => s.trim())
        .filter(Boolean),
    };
  };
  const left = parseSide(lines[0]);
  const right = parseSide(lines[1]);
  return {
    leftTitle: left.title,
    leftItems: left.items,
    rightTitle: right.title,
    rightItems: right.items,
  };
}

function parseSingleSlide(rawChunk: string, index: number, total: number): DeckSlide {
  const { meta, cleaned } = parseSceneComment(rawChunk);
  let working = cleaned;

  // Extract ::: speech ... ::: block
  const speechParts: string[] = [];
  working = working.replace(/:::\s*speech\s*\n([\s\S]*?)\n:::/g, (_m, inner: string) => {
    const trimmed = inner.trim();
    if (trimmed) speechParts.push(trimmed);
    return '';
  });
  const speech: string | undefined = speechParts.length > 0 ? speechParts.join('\n\n') : undefined;

  // Extract fenced blocks
  const metrics: MetricItem[] = [];
  let comparison: ComparisonBlock | undefined;
  let code: DeckSlide['code'];
  let diagram: DeckSlide['diagram'];

  working = working.replace(/```([a-zA-Z0-9_-]*)(?:\s+\{([^}]+)\})?\n([\s\S]*?)```/g, (_m, lang: string, focus: string | undefined, inner: string) => {
    const normalizedLang = (lang || '').toLowerCase();
    if (normalizedLang === 'metric' || normalizedLang === 'metrics') {
      metrics.push(...parseMetricFence(inner));
      return '';
    }
    if (normalizedLang === 'compare' || normalizedLang === 'comparison') {
      comparison = parseCompareFence(inner);
      return '';
    }
    if (normalizedLang === 'mermaid') {
      diagram = {
        engine: 'mermaid',
        code: inner.replace(/\n$/, '').trim(),
      };
      return '';
    }
    code = {
      lang: normalizedLang || 'text',
      code: inner.replace(/\n$/, ''),
      focusLines: focus,
    };
    return '';
  });

  // Extract images ![prompt](gen://...) or ![alt](url)
  let imagePrompt: string | undefined;
  let imageUrl: string | undefined;
  working = working.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_m, alt: string, target: string) => {
    if (target.startsWith('gen://')) {
      imagePrompt = decodeURIComponent(target.slice('gen://'.length)) || alt;
    } else {
      imageUrl = target.trim();
      if (!imagePrompt && alt) imagePrompt = alt;
    }
    return '';
  });

  let title = '';
  let subtitle: string | undefined;
  let eyebrow = meta.eyebrow;
  const bullets: string[] = [];
  const bodyParagraphs: string[] = [];
  const quoteLines: string[] = [];

  for (const rawLine of working.split('\n')) {
    const line = rawLine.trim();
    if (!line) continue;

    if (line.startsWith('# ') && !title) {
      title = line.slice(2).trim();
    } else if (line.startsWith('## ')) {
      if (!title) {
        title = line.slice(3).trim();
      } else if (!subtitle) {
        subtitle = line.slice(3).trim();
      } else {
        bullets.push(line.slice(3).trim());
      }
    } else if (line.startsWith('### ') && !eyebrow) {
      eyebrow = line.slice(4).trim();
    } else if (/^[-*+]\s+/.test(line) || /^\d+\.\s+/.test(line)) {
      bullets.push(line.replace(/^([-*+]|\d+\.)\s+/, '').trim());
    } else if (line.startsWith('>')) {
      quoteLines.push(line.replace(/^>\s?/, '').trim());
    } else {
      bodyParagraphs.push(line);
    }
  }

  let quote: DeckSlide['quote'];
  if (quoteLines.length > 0) {
    const joined = quoteLines.join(' ');
    const dashMatch = joined.match(/^(.*?)\s+[—–-]{1,2}\s+([^-—–]+)$/);
    if (dashMatch) {
      quote = { text: dashMatch[1].trim(), author: dashMatch[2].trim() };
    } else {
      quote = { text: joined };
    }
  }

  if (!title) {
    title = subtitle || bodyParagraphs.shift() || `Slide ${index + 1}`;
  }

  const partial: Partial<DeckSlide> = {
    metrics,
    code,
    diagram,
    comparison,
    quote,
    bullets,
  };

  const explicitLayout = meta.layout as SlideLayout | undefined;
  const validLayouts: SlideLayout[] = [
    'cover',
    'bullets',
    'metrics',
    'code',
    'diagram',
    'comparison',
    'quote',
    'quad',
    'flashcard',
    'outro',
  ];

  const layout: SlideLayout =
    explicitLayout && validLayouts.includes(explicitLayout)
      ? explicitLayout
      : inferLayout(partial, index, total);

  return {
    index,
    id: meta.scene || meta.id || `slide-${index + 1}`,
    layout,
    eyebrow,
    title,
    subtitle,
    bullets,
    bodyParagraphs,
    metrics,
    quote,
    code,
    diagram,
    comparison,
    imagePrompt,
    imageUrl,
    cite: meta.cite,
    speech,
  };
}

export function parseDeckMarkdown(markdown: string, sourcePath?: string): DeckDocument {
  const parsed = matter(markdown, {
    engines: {
      yaml: (s: string) => (YAML.parse(s) as Record<string, unknown>) || {},
    },
  });
  const data = parsed.data as Record<string, unknown>;

  const frontmatter: DeckFrontmatter = {
    title: typeof data.title === 'string' ? data.title : DEFAULT_FRONTMATTER.title,
    template: typeof data.template === 'string' ? data.template : DEFAULT_FRONTMATTER.template,
    locale: (typeof data.locale === 'string' ? data.locale : DEFAULT_FRONTMATTER.locale) as SupportedLocale,
    aspect: (typeof data.aspect === 'string' ? data.aspect : DEFAULT_FRONTMATTER.aspect) as AspectRatio,
    persona: typeof data.persona === 'string' ? data.persona : undefined,
    author: typeof data.author === 'string' ? data.author : undefined,
    handle: typeof data.handle === 'string' ? data.handle : undefined,
    accentColor: typeof data.accentColor === 'string' ? data.accentColor : undefined,
    watermark: typeof data.watermark === 'boolean' ? data.watermark : true,
    fps: typeof data.fps === 'number' ? data.fps : 30,
    secondsPerSlide: typeof data.secondsPerSlide === 'number' ? data.secondsPerSlide : 4,
    tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
  };

  const rawChunks = splitSlidesOutsideFences(parsed.content);
  const slides = rawChunks.map((chunk, idx) => parseSingleSlide(chunk, idx, rawChunks.length));

  if (slides.length === 0) {
    slides.push({
      index: 0,
      id: 'slide-1',
      layout: 'cover',
      title: frontmatter.title,
      bullets: [],
      bodyParagraphs: [],
      metrics: [],
    });
  }

  return {
    frontmatter,
    slides,
    sourcePath,
  };
}

export function serializeDeckMarkdown(doc: DeckDocument): string {
  const fmObj: Record<string, unknown> = {
    title: doc.frontmatter.title,
    template: doc.frontmatter.template,
    locale: doc.frontmatter.locale,
    aspect: doc.frontmatter.aspect,
  };
  if (doc.frontmatter.persona) fmObj.persona = doc.frontmatter.persona;
  if (doc.frontmatter.author) fmObj.author = doc.frontmatter.author;
  if (doc.frontmatter.handle) fmObj.handle = doc.frontmatter.handle;
  if (doc.frontmatter.accentColor) fmObj.accentColor = doc.frontmatter.accentColor;
  fmObj.watermark = doc.frontmatter.watermark;
  if (doc.frontmatter.fps !== 30) fmObj.fps = doc.frontmatter.fps;
  if (doc.frontmatter.secondsPerSlide !== 4) fmObj.secondsPerSlide = doc.frontmatter.secondsPerSlide;
  if (doc.frontmatter.tags.length > 0) fmObj.tags = doc.frontmatter.tags;

  const fmYaml = YAML.stringify(fmObj).trim();
  const slideBlocks = doc.slides.map((s) => {
    const parts: string[] = [];
    const metaPairs = [`scene: ${s.id}`, `layout: ${s.layout}`];
    if (s.eyebrow) metaPairs.push(`eyebrow: ${s.eyebrow}`);
    if (s.cite) metaPairs.push(`cite: ${s.cite}`);
    parts.push(`<!-- ${metaPairs.join(' | ')} -->`);
    parts.push(`# ${s.title}`);
    if (s.subtitle) parts.push(`## ${s.subtitle}`);
    for (const p of s.bodyParagraphs) parts.push(p);
    for (const b of s.bullets) parts.push(`- ${b}`);
    if (s.quote) {
      parts.push(s.quote.author ? `> ${s.quote.text} — ${s.quote.author}` : `> ${s.quote.text}`);
    }
    if (s.metrics.length > 0) {
      const mLines = s.metrics.map((m) => `- ${m.label}: ${m.value}${m.delta ? ` (${m.delta})` : ''}`);
      parts.push(['```metric', ...mLines, '```'].join('\n'));
    }
    if (s.comparison) {
      parts.push(
        [
          '```compare',
          `${s.comparison.leftTitle} :: ${s.comparison.leftItems.join(' | ')}`,
          `${s.comparison.rightTitle} :: ${s.comparison.rightItems.join(' | ')}`,
          '```',
        ].join('\n')
      );
    }
    if (s.diagram) {
      parts.push(['```mermaid', s.diagram.code, '```'].join('\n'));
    }
    if (s.code) {
      const fenceHead = s.code.focusLines ? `\`\`\`${s.code.lang} {${s.code.focusLines}}` : `\`\`\`${s.code.lang}`;
      parts.push([fenceHead, s.code.code, '```'].join('\n'));
    }
    if (s.imageUrl) {
      parts.push(`![${s.imagePrompt || ''}](${s.imageUrl})`);
    } else if (s.imagePrompt) {
      parts.push(`![${s.imagePrompt}](gen://${encodeURIComponent(s.imagePrompt)})`);
    }
    if (s.speech) {
      parts.push(['::: speech', s.speech, ':::'].join('\n'));
    }
    return parts.join('\n\n');
  });

  return `---\n${fmYaml}\n---\n\n${slideBlocks.join('\n\n---\n\n')}\n`;
}

export function applyEditablePatch(
  doc: DeckDocument,
  slideIndex: number,
  field: string,
  value: string
): DeckDocument {
  const cloned: DeckDocument = structuredClone(doc);
  const slide = cloned.slides[slideIndex];
  if (!slide) return cloned;

  if (field === 'title') {
    slide.title = value;
  } else if (field === 'subtitle') {
    slide.subtitle = value;
  } else if (field === 'eyebrow') {
    slide.eyebrow = value;
  } else if (field === 'speech') {
    slide.speech = value;
  } else if (field === 'quote.text' && slide.quote) {
    slide.quote.text = value;
  } else if (field.startsWith('bullet.')) {
    const idx = Number(field.slice('bullet.'.length));
    if (!Number.isNaN(idx) && idx >= 0 && idx < slide.bullets.length) {
      slide.bullets[idx] = value;
    }
  } else if (field.startsWith('body.')) {
    const idx = Number(field.slice('body.'.length));
    if (!Number.isNaN(idx) && idx >= 0 && idx < slide.bodyParagraphs.length) {
      slide.bodyParagraphs[idx] = value;
    }
  } else if (field.startsWith('metric.')) {
    const [, idxStr, subField] = field.split('.');
    const idx = Number(idxStr);
    if (!Number.isNaN(idx) && slide.metrics[idx]) {
      if (subField === 'label') slide.metrics[idx].label = value;
      if (subField === 'value') slide.metrics[idx].value = value;
      if (subField === 'delta') slide.metrics[idx].delta = value;
    }
  }

  return cloned;
}
