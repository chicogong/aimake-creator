import matter from 'gray-matter';
import YAML from 'yaml';
import type { SupportedLocale } from '../schema/types.js';
import { parseDeckMarkdown, serializeDeckMarkdown } from './deck-parser.js';

export type ExternalDeckFormat = 'marp' | 'slidev' | 'markdown';

export interface ImportedDeckResult {
  markdown: string;
  sourceFormat: ExternalDeckFormat;
  slideCount: number;
  title: string;
}

function detectExternalFormat(
  data: Record<string, unknown>,
  rawBody: string
): ExternalDeckFormat {
  if (data.marp === true || data.marp === 'true' || /<!--\s*_(?:class|paginate|header|footer):/i.test(rawBody)) {
    return 'marp';
  }
  if (
    typeof data.theme === 'string' ||
    data.transition !== undefined ||
    data.mdc !== undefined ||
    /<v-clicks?>/i.test(rawBody) ||
    /<!--\s*layout:\s*(?:cover|two-cols|center|fact|quote)\s*-->/i.test(rawBody)
  ) {
    return 'slidev';
  }
  return 'markdown';
}

function cleanExternalSlideBody(chunk: string): string {
  // Convert Marp/Slidev HTML speaker notes into ::: speech blocks
  let working = chunk.replace(
    /<!--\s*(?:notes?:|\[\[notes?\]\])\s*([\s\S]*?)-->/gi,
    (_m, inner: string) => `\n::: speech\n${inner.trim()}\n:::\n`
  );

  // Convert Slidev trailing per-slide note blocks (`<!-- ... -->` at end if multi-sentence prose)
  // while removing Marp/Slidev styling directives like <!-- _class: lead -->, <!-- _paginate: false -->
  working = working
    .replace(/<!--\s*_[a-zA-Z0-9_-]+:[\s\S]*?-->/g, '')
    .replace(/<\/?v-clicks?>/gi, '')
    .replace(/::\s*(?:right|left)\s*::/g, '\n');

  // Remove Slidev per-slide frontmatter YAML blocks between slides (`layout: two-cols`, etc.)
  const slideFmMatch = working.match(/^([a-zA-Z_-]+:\s*[^\n]+(?:\n[a-zA-Z_-]+:\s*[^\n]+)*)\n+([\s\S]*)$/);
  if (slideFmMatch && /(?:^|\n)(?:layout|class|transition|background|image|clicks):/i.test(slideFmMatch[1])) {
    working = slideFmMatch[2];
  }

  return working.trim();
}

function splitOutsideFences(body: string): string[] {
  const lines = body.replace(/\r\n/g, '\n').split('\n');
  const chunks: string[] = [];
  let buf: string[] = [];
  let inFence = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (/^(`{3,}|~{3,})/.test(trimmed)) {
      inFence = !inFence;
      buf.push(line);
      continue;
    }
    if (!inFence && /^---+\s*$/.test(trimmed)) {
      const joined = buf.join('\n').trim();
      if (joined) chunks.push(joined);
      buf = [];
      continue;
    }
    buf.push(line);
  }
  const last = buf.join('\n').trim();
  if (last) chunks.push(last);
  return chunks;
}

/**
 * Converts Marp, Slidev, or plain Markdown decks into canonical Aimake `.deck.md`.
 */
export function importExternalMarkdownDeck(
  rawMarkdown: string,
  options: {
    template?: string;
    locale?: SupportedLocale;
    title?: string;
  } = {}
): ImportedDeckResult {
  const parsed = matter(rawMarkdown, {
    engines: {
      yaml: (s: string) => (YAML.parse(s) as Record<string, unknown>) || {},
    },
  });
  const data = parsed.data as Record<string, unknown>;
  const sourceFormat = detectExternalFormat(data, parsed.content);

  const slideChunks = splitOutsideFences(parsed.content)
    .map(cleanExternalSlideBody)
    .filter(Boolean);

  const inferredTitle =
    options.title ||
    (typeof data.title === 'string' && data.title.trim()) ||
    slideChunks[0]?.match(/^#\s+(.+)$/m)?.[1]?.trim() ||
    'Imported Aimake Presentation';

  const fmYaml = YAML.stringify({
    title: inferredTitle,
    template: options.template || 'apple-bento-launch',
    locale: options.locale || (/[\u4e00-\u9fa5]/.test(inferredTitle) ? 'zh-CN' : 'en'),
    aspect: '16:9',
  }).trim();

  const assembled = `---\n${fmYaml}\n---\n\n${slideChunks.join('\n\n---\n\n')}\n`;
  const canonical = parseDeckMarkdown(assembled);
  const serialized = serializeDeckMarkdown(canonical);

  return {
    markdown: serialized,
    sourceFormat,
    slideCount: canonical.slides.length,
    title: canonical.frontmatter.title,
  };
}
