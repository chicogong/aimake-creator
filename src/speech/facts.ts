import type {
  AspectRatio,
  DeckDocument,
  DeckSlide,
  SupportedLocale,
} from '../schema/types.js';
import { AimakeError, SCHEMA_VERSION, sha256Hex } from './foundation.js';

export type ReleaseFactKind = 'version' | 'title' | 'highlight';

export interface ReleaseFact {
  factId: string;
  kind: ReleaseFactKind;
  text: string;
  pointer: string;
}

export interface ExtractedReleaseFacts {
  schemaVersion: typeof SCHEMA_VERSION;
  sourceLabel: string;
  sourceFormat: 'github-release-json' | 'markdown';
  inputHash: string;
  title: string;
  version?: string;
  facts: ReleaseFact[];
}

export interface BuildDeckFromFactsOptions {
  template?: string;
  locale?: SupportedLocale;
  aspect?: AspectRatio;
  author?: string;
  handle?: string;
  fps?: number;
  secondsPerSlide?: number;
  watermark?: boolean;
  tags?: string[];
  maxHighlights?: number;
}

const CJK_RE = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uac00-\ud7af]/;
const SEMVER_TAG_RE = /\bv\d+\.\d+(?:\.\d+)?(?:-[A-Za-z0-9.-]+)?\b/;

function cleanText(value: string): string {
  return value.replace(/\s+/g, ' ').trim().slice(0, 300);
}

function stripMarkdownFormatting(value: string): string {
  return cleanText(
    value
      .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
      .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/__([^_]+)__/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
  );
}

function markdownHighlights(
  body: string,
  excludeLineIndex = -1
): Array<{ text: string; pointer: string }> {
  const lines = body.split(/\r?\n/);
  const bullets = lines
    .flatMap((line, index) => {
      const match = /^\s*(?:[-*+] |\d+[.)] )(.+)/.exec(line);
      if (!match) return [];
      const text = stripMarkdownFormatting(match[1]!);
      return text.length > 0 ? [{ text, pointer: `line:${index + 1}` }] : [];
    })
    .filter((item) => item.text.length > 0);

  if (bullets.length > 0) {
    return bullets.slice(0, 6);
  }

  return lines
    .flatMap((line, index) => {
      if (index === excludeLineIndex) return [];
      const trimmed = line.trim();
      if (!trimmed || /^---+$/.test(trimmed) || /^```/.test(trimmed)) return [];
      const text = stripMarkdownFormatting(trimmed.replace(/^#+\s*/, ''));
      return text.length >= 20 ? [{ text, pointer: `line:${index + 1}` }] : [];
    })
    .slice(0, 6);
}

function looksLikeReleaseJson(rawContent: string, sourceLabel: string): boolean {
  if (sourceLabel.toLowerCase().endsWith('.json')) return true;
  const trimmed = rawContent.trimStart();
  return trimmed.startsWith('{');
}

export function extractFactsFromReleaseOrMarkdown(
  rawContent: string,
  sourceLabel: string,
  inputHash?: string
): ExtractedReleaseFacts {
  if (typeof rawContent !== 'string' || rawContent.trim().length === 0) {
    throw new AimakeError('FACTS_INPUT_EMPTY', 'Release or Markdown source content must not be empty');
  }

  if (inputHash !== undefined && !/^[a-f0-9]{64}$/.test(inputHash)) {
    throw new AimakeError(
      'FACTS_INPUT_HASH_INVALID',
      'inputHash must be a 64-character lowercase hex SHA-256 digest'
    );
  }

  const resolvedHash = inputHash ?? sha256Hex(rawContent);
  const label = cleanText(sourceLabel) || 'release-notes';

  let sourceFormat: 'github-release-json' | 'markdown' = 'markdown';
  let title = 'Product update';
  let titlePointer = 'line:1';
  let version: string | undefined;
  let versionPointer = '$.tagName';
  let highlights: Array<{ text: string; pointer: string }> = [];

  if (looksLikeReleaseJson(rawContent, label)) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(rawContent);
    } catch {
      if (label.toLowerCase().endsWith('.json')) {
        throw new AimakeError('FACTS_JSON_INVALID', `Failed to parse JSON release content from ${label}`);
      }
      parsed = undefined;
    }

    if (parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed)) {
      sourceFormat = 'github-release-json';
      const release = parsed as Record<string, unknown>;
      const rawTag =
        typeof release.tagName === 'string' && release.tagName.trim()
          ? { value: release.tagName, pointer: '$.tagName' }
          : typeof release.tag_name === 'string' && release.tag_name.trim()
            ? { value: release.tag_name, pointer: '$.tag_name' }
            : undefined;

      if (rawTag) {
        version = cleanText(rawTag.value);
        versionPointer = rawTag.pointer;
      }

      if (typeof release.name === 'string' && cleanText(release.name).length > 0) {
        title = cleanText(release.name);
        titlePointer = '$.name';
      } else if (version) {
        title = version;
        titlePointer = versionPointer;
      }

      const body = typeof release.body === 'string' ? release.body : '';
      highlights = markdownHighlights(body);
    }
  }

  if (sourceFormat === 'markdown') {
    const lines = rawContent.split(/\r?\n/);
    const headingIndex = lines.findIndex((line) => /^#\s+/.test(line));
    if (headingIndex >= 0) {
      title = stripMarkdownFormatting(lines[headingIndex]!.replace(/^#\s+/, '')) || title;
      titlePointer = `line:${headingIndex + 1}`;
      const versionMatch = SEMVER_TAG_RE.exec(title);
      if (versionMatch) {
        version = versionMatch[0];
        versionPointer = `line:${headingIndex + 1}`;
      }
    } else {
      const subHeadingIndex = lines.findIndex((line) => /^##+\s+/.test(line));
      if (subHeadingIndex >= 0) {
        title = stripMarkdownFormatting(lines[subHeadingIndex]!.replace(/^##+\s+/, '')) || title;
        titlePointer = `line:${subHeadingIndex + 1}`;
      } else {
        title = label;
        titlePointer = 'line:1';
      }
    }
    highlights = markdownHighlights(rawContent, headingIndex);
  }

  const facts: ReleaseFact[] = [];
  if (version) {
    facts.push({
      factId: 'fact:version',
      kind: 'version',
      text: version,
      pointer: versionPointer,
    });
  }
  facts.push({
    factId: 'fact:title',
    kind: 'title',
    text: title,
    pointer: titlePointer,
  });
  highlights.forEach((item, index) => {
    facts.push({
      factId: `fact:highlight:${index + 1}`,
      kind: 'highlight',
      text: item.text,
      pointer: item.pointer,
    });
  });

  if (facts.filter((fact) => fact.kind === 'highlight').length === 0) {
    throw new AimakeError(
      'FACTS_INSUFFICIENT',
      'Release or Markdown source contains no usable highlights'
    );
  }

  return {
    schemaVersion: SCHEMA_VERSION,
    sourceLabel: label,
    sourceFormat,
    inputHash: resolvedHash,
    title,
    ...(version ? { version } : {}),
    facts,
  };
}

export function formatFactCite(fact: Pick<ReleaseFact, 'factId' | 'pointer'>): string {
  const id = fact.factId.startsWith('fact:') ? fact.factId : `fact:${fact.factId}`;
  return `${id}@${fact.pointer}`;
}

function deriveHighlightTitle(text: string, fallback: string): string {
  const clause = text.split(/[。！？.!?;；:：]/)[0]?.trim() ?? '';
  const candidate = clause.length >= 6 ? clause : text;
  const points = [...candidate];
  if (points.length <= 48) return candidate || fallback;
  return `${points.slice(0, 45).join('').trim()}...`;
}

function detectLocaleFromFacts(facts: ExtractedReleaseFacts): SupportedLocale {
  const sample = [facts.title, ...facts.facts.map((f) => f.text)].join(' ');
  return CJK_RE.test(sample) ? 'zh-CN' : 'en';
}

export function buildDeckFromFacts(
  facts: ExtractedReleaseFacts,
  opts: BuildDeckFromFactsOptions = {}
): DeckDocument {
  const titleFact = facts.facts.find((fact) => fact.kind === 'title');
  const versionFact = facts.facts.find((fact) => fact.kind === 'version');
  const maxHighlights = opts.maxHighlights ?? 6;
  const highlightFacts = facts.facts
    .filter((fact) => fact.kind === 'highlight')
    .slice(0, Math.max(1, maxHighlights));

  if (!titleFact || highlightFacts.length === 0) {
    throw new AimakeError(
      'FACTS_INSUFFICIENT',
      'Extracted facts must include a title and at least one highlight to build a deck'
    );
  }

  const locale = opts.locale ?? detectLocaleFromFacts(facts);
  const isZh = locale === 'zh-CN' || locale === 'zh-TW';
  const versionSuffix = versionFact && !facts.title.includes(versionFact.text) ? ` ${versionFact.text}` : '';

  const openingCite = [titleFact, ...(versionFact ? [versionFact] : [])]
    .map(formatFactCite)
    .join(', ');
  const openingSpeech = isZh
    ? `${facts.title}${versionSuffix}现已发布，以下为您梳理${highlightFacts.length}项核心更新。`
    : `${facts.title}${versionSuffix} is now available. Here are the ${highlightFacts.length} key updates.`;

  const slides: DeckSlide[] = [];

  slides.push({
    index: 0,
    id: 'slide-opening',
    layout: 'cover',
    eyebrow: versionFact ? versionFact.text : facts.sourceLabel,
    title: facts.title,
    subtitle: isZh
      ? `${highlightFacts.length} 项可追溯发布亮点`
      : `${highlightFacts.length} traceable release highlights`,
    bullets: versionFact ? [versionFact.text] : [],
    bodyParagraphs: [],
    metrics: [],
    cite: openingCite,
    speech: openingSpeech,
  });

  highlightFacts.forEach((fact, idx) => {
    const slideIndex = idx + 1;
    slides.push({
      index: slideIndex,
      id: `slide-highlight-${slideIndex}`,
      layout: 'bullets',
      eyebrow: isZh
        ? `核心更新 ${slideIndex}/${highlightFacts.length}`
        : `HIGHLIGHT ${slideIndex}/${highlightFacts.length}`,
      title: deriveHighlightTitle(fact.text, `Highlight ${slideIndex}`),
      bullets: [fact.text],
      bodyParagraphs: [],
      metrics: [],
      cite: formatFactCite(fact),
      speech: fact.text,
    });
  });

  const closingSpeech = isZh
    ? `以上是${facts.title}${versionSuffix}的核心要点，升级前请查阅完整发布说明。`
    : `Review the complete release notes for ${facts.title}${versionSuffix} before upgrading.`;

  slides.push({
    index: highlightFacts.length + 1,
    id: 'slide-closing',
    layout: 'outro',
    eyebrow: versionFact ? versionFact.text : 'SUMMARY',
    title: isZh ? '完整发布要点回顾' : 'Release Summary',
    bullets: highlightFacts.slice(0, 3).map((fact) => fact.text),
    bodyParagraphs: [],
    metrics: [],
    cite: formatFactCite(titleFact),
    speech: closingSpeech,
  });

  return {
    frontmatter: {
      title: facts.title,
      template: opts.template ?? 'ppt-executive-16x9',
      locale,
      aspect: opts.aspect ?? '16:9',
      ...(opts.author ? { author: opts.author } : {}),
      ...(opts.handle ? { handle: opts.handle } : {}),
      watermark: opts.watermark ?? false,
      fps: opts.fps ?? 24,
      secondsPerSlide: opts.secondsPerSlide ?? 4,
      tags: opts.tags ?? ['release', facts.sourceFormat],
    },
    slides,
  };
}

export function verifyDeckFactCitations(
  deck: DeckDocument,
  facts: ExtractedReleaseFacts
): { valid: boolean; missingCitations: Array<{ slideId: string; cite?: string }> } {
  const validCiteTokens = new Set(facts.facts.map((fact) => formatFactCite(fact)));
  const missingCitations: Array<{ slideId: string; cite?: string }> = [];

  for (const slide of deck.slides) {
    if (!slide.cite || slide.cite.trim().length === 0) {
      missingCitations.push({ slideId: slide.id });
      continue;
    }
    const tokens = slide.cite
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean);
    if (tokens.length === 0 || !tokens.every((token) => validCiteTokens.has(token))) {
      missingCitations.push({ slideId: slide.id, cite: slide.cite });
    }
  }

  return {
    valid: missingCitations.length === 0,
    missingCitations,
  };
}
