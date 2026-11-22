import type { StyleDNA, SupportedLocale } from '../schema/types.js';

interface SlopRule {
  phrase: string;
  replacement: string;
}

const SLOP_RULES: Record<'zh' | 'en' | 'ja' | 'ko', SlopRule[]> = {
  zh: [
    { phrase: '总而言之，', replacement: '' },
    { phrase: '总而言之', replacement: '归根结底' },
    { phrase: '综上所述，', replacement: '' },
    { phrase: '值得注意的是，', replacement: '' },
    { phrase: '值得注意的是', replacement: '关键在于' },
    { phrase: '不仅如此，', replacement: '更进一步，' },
    { phrase: '不仅如此', replacement: '更进一步' },
    { phrase: '不可否认，', replacement: '' },
    { phrase: '不可否认', replacement: '确实' },
    { phrase: '毫无疑问，', replacement: '' },
    { phrase: '毫无疑问', replacement: '显而易见' },
    { phrase: '家人们谁懂啊', replacement: '' },
    { phrase: '让我们深入探讨', replacement: '直接看核心机制' },
    { phrase: '在当今快节奏的时代，', replacement: '' },
    { phrase: '是一把双刃剑', replacement: '有利也有代价' },
    { phrase: '全方位赋能', replacement: '直接支撑' },
    { phrase: '赋能', replacement: '驱动' },
    { phrase: '底层逻辑', replacement: '核心机制' },
    { phrase: '抓手', replacement: '切入点' },
    { phrase: '颠覆性创新', replacement: '关键突破' },
    { phrase: '颠覆性的', replacement: '重大的' },
    { phrase: '颠覆性', replacement: '突破性' },
  ],
  en: [
    { phrase: "In today's fast-paced world, ", replacement: '' },
    { phrase: "in today's fast-paced world", replacement: 'today' },
    { phrase: 'It is worth noting that ', replacement: '' },
    { phrase: 'it is worth noting that ', replacement: '' },
    { phrase: 'delve into', replacement: 'examine' },
    { phrase: 'Delve into', replacement: 'Examine' },
    { phrase: 'a testament to', replacement: 'proof of' },
    { phrase: 'rich tapestry of', replacement: 'mix of' },
    { phrase: 'game-changer', replacement: 'breakthrough' },
    { phrase: 'unlock the full potential of', replacement: 'get the most from' },
    { phrase: 'In conclusion, ', replacement: '' },
    { phrase: 'Moreover, ', replacement: 'Also, ' },
    { phrase: 'Furthermore, ', replacement: '' },
  ],
  ja: [
    { phrase: 'いかがでしたでしょうか？', replacement: '' },
    { phrase: 'いかがでしたでしょうか。', replacement: '' },
    { phrase: '特筆すべきは、', replacement: '重要なのは、' },
    { phrase: '総括すると、', replacement: '' },
    { phrase: '飛躍的に向上', replacement: '大幅に改善' },
    { phrase: '単なる〜ではなく', replacement: '〜にとどまらず' },
    { phrase: '急速に進化する現代において、', replacement: '' },
  ],
  ko: [
    { phrase: '결론적으로 말씀드리자면, ', replacement: '' },
    { phrase: '결론적으로 말씀드리자면', replacement: '핵심은' },
    { phrase: '주목할 만한 점은 ', replacement: '' },
    { phrase: '빠르게 변화하는 현대 사회에서 ', replacement: '' },
    { phrase: '혁신적인 패러다임', replacement: '새로운 방식' },
    { phrase: '단순한 도구를 넘어', replacement: '실질적인 도구로서' },
  ],
};

function bucketForLocale(locale: SupportedLocale): 'zh' | 'en' | 'ja' | 'ko' {
  if (locale === 'zh-CN' || locale === 'zh-TW') return 'zh';
  if (locale === 'ja') return 'ja';
  if (locale === 'ko') return 'ko';
  return 'en';
}

export interface SlopAuditResult {
  clean: boolean;
  score: number;
  hits: Array<{ phrase: string; replacement: string; count: number }>;
}

export function auditAiSlop(
  text: string,
  locale: SupportedLocale = 'zh-CN',
  extraBannedWords: string[] = []
): SlopAuditResult {
  const bucket = bucketForLocale(locale);
  const rules = [
    ...SLOP_RULES[bucket],
    ...extraBannedWords.map((phrase) => ({ phrase, replacement: '' })),
  ];

  const hits: Array<{ phrase: string; replacement: string; count: number }> = [];
  for (const rule of rules) {
    if (!rule.phrase) continue;
    let count = 0;
    let pos = 0;
    while (true) {
      const idx = text.indexOf(rule.phrase, pos);
      if (idx === -1) break;
      count++;
      pos = idx + rule.phrase.length;
    }
    if (count > 0) {
      hits.push({ phrase: rule.phrase, replacement: rule.replacement, count });
    }
  }

  // Also penalize 3+ consecutive emojis
  const emojiSpam = text.match(/(?:[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]\s*){3,}/gu);
  if (emojiSpam && emojiSpam.length > 0) {
    hits.push({ phrase: '[3+ consecutive emojis]', replacement: '[single or zero emoji]', count: emojiSpam.length });
  }

  const penalty = hits.reduce((acc, h) => acc + h.count * 12, 0);
  const score = Math.max(0, 100 - penalty);

  return {
    clean: hits.length === 0,
    score,
    hits,
  };
}

export function humanizeText(
  text: string,
  locale: SupportedLocale = 'zh-CN',
  extraBannedWords: string[] = []
): string {
  const bucket = bucketForLocale(locale);
  const rules = [
    ...SLOP_RULES[bucket],
    ...extraBannedWords.map((phrase) => ({ phrase, replacement: '' })),
  ];

  let out = text;
  for (const rule of rules) {
    if (!rule.phrase) continue;
    out = out.split(rule.phrase).join(rule.replacement);
  }

  // Collapse 3+ consecutive emojis down to nothing
  out = out.replace(/(?:[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]\s*){3,}/gu, '');
  // Clean excessive blank lines or double spaces created by removals
  out = out.replace(/[ \t]{2,}/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
  return out;
}

export function extractStyleDNAFromSamples(params: {
  id: string;
  name: string;
  samples: string[];
  locale: SupportedLocale;
  authorName?: string;
  authorHandle?: string;
  primaryColor?: string;
}): StyleDNA {
  const joined = params.samples.join('\n\n');
  const sentences = joined
    .split(/[。！？.!?\n]+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 4);

  const totalChars = sentences.reduce((sum, s) => sum + s.length, 0);
  const avgSentenceLength = sentences.length > 0 ? Math.round(totalChars / sentences.length) : 24;

  // Extract punchy opening lines from each sample as hook inspirations
  const hooks: string[] = [];
  for (const sample of params.samples) {
    const firstLine = sample
      .split('\n')
      .map((l) => l.replace(/^#+\s*/, '').trim())
      .find((l) => l.length >= 6 && l.length <= 80);
    if (firstLine && hooks.length < 6) {
      hooks.push(firstLine);
    }
  }

  const bucket = bucketForLocale(params.locale);
  const defaultBanned = SLOP_RULES[bucket].slice(0, 10).map((r) => r.phrase);

  const cadenceDesc =
    avgSentenceLength <= 22
      ? 'Short, high-impact staccato sentences with direct assertions'
      : avgSentenceLength <= 42
        ? 'Balanced analytical rhythm alternating concrete metrics with crisp takeaways'
        : 'Deep long-form technical narrative with structured evidence clauses';

  return {
    id: params.id,
    name: params.name,
    locale: params.locale,
    voiceTone: 'Direct, evidence-backed, practitioner voice without filler',
    sentenceCadence: cadenceDesc,
    avgSentenceLength,
    hookFormulas:
      hooks.length > 0
        ? hooks
        : ['Lead with a hard counter-intuitive metric or real failure lesson'],
    bannedAiWords: defaultBanned,
    brandTokens: {
      primaryColor: params.primaryColor || '#2B6BE6',
      bgTone: 'paper',
      authorName: params.authorName || params.name,
      authorHandle: params.authorHandle || `@${params.id}`,
    },
  };
}

export function formatStyleDNAMarkdown(dna: StyleDNA): string {
  const lines = [
    `# Persona Style DNA: ${dna.name} (${dna.id})`,
    '',
    `- **Locale**: \`${dna.locale}\``,
    `- **Voice Tone**: ${dna.voiceTone}`,
    `- **Sentence Cadence**: ${dna.sentenceCadence} (avg ~${dna.avgSentenceLength} chars)`,
    `- **Brand Author**: ${dna.brandTokens.authorName} (${dna.brandTokens.authorHandle}) · \`${dna.brandTokens.primaryColor}\``,
    '',
    '## Signature Hook Patterns',
    ...dna.hookFormulas.slice(0, 8).map((h) => `- ${h}`),
    '',
    '## Strictly Banned AI Slop Phrases',
    dna.bannedAiWords.map((w) => `\`${w}\``).join(' · '),
    '',
  ];
  return lines.join('\n');
}
