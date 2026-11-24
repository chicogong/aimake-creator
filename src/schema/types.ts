export type SupportedLocale = 'zh-CN' | 'zh-TW' | 'en' | 'ja' | 'ko' | 'es';

export type AspectRatio = '3:4' | '4:5' | '16:9' | '9:16' | '1:1' | 'article';

export type ExportFormat = 'png' | 'wechat' | 'pdf' | 'pptx' | 'mp4' | 'html' | 'capcut';

export type SlideLayout =
  | 'cover'
  | 'bullets'
  | 'metrics'
  | 'code'
  | 'diagram'
  | 'comparison'
  | 'quote'
  | 'quad'
  | 'flashcard'
  | 'outro';

export interface MetricItem {
  label: string;
  value: string;
  delta?: string;
}

export interface CodeSnippet {
  lang: string;
  code: string;
  focusLines?: string;
}

export interface ComparisonBlock {
  leftTitle: string;
  leftItems: string[];
  rightTitle: string;
  rightItems: string[];
}

export interface DeckSlide {
  index: number;
  id: string;
  layout: SlideLayout;
  eyebrow?: string;
  title: string;
  subtitle?: string;
  bullets: string[];
  bodyParagraphs: string[];
  metrics: MetricItem[];
  quote?: {
    text: string;
    author?: string;
  };
  code?: CodeSnippet;
  diagram?: {
    engine: 'mermaid';
    code: string;
  };
  comparison?: ComparisonBlock;
  imagePrompt?: string;
  imageUrl?: string;
  cite?: string;
  speech?: string;
}

export interface DeckFrontmatter {
  title: string;
  template: string;
  locale: SupportedLocale;
  aspect: AspectRatio;
  persona?: string;
  author?: string;
  handle?: string;
  accentColor?: string;
  watermark: boolean;
  fps: number;
  secondsPerSlide: number;
  tags: string[];
}

export interface DeckDocument {
  frontmatter: DeckFrontmatter;
  slides: DeckSlide[];
  sourcePath?: string;
}

export interface StyleDNA {
  id: string;
  name: string;
  locale: SupportedLocale;
  voiceTone: string;
  sentenceCadence: string;
  avgSentenceLength: number;
  hookFormulas: string[];
  bannedAiWords: string[];
  brandTokens: {
    primaryColor: string;
    bgTone: 'light' | 'dark' | 'paper';
    authorName: string;
    authorHandle: string;
    ttsVoiceId?: string;
  };
}

export type TemplateCategory =
  | 'xiaohongshu'
  | 'wechat'
  | 'linkedin'
  | 'zukai'
  | 'cardnews'
  | 'presentation'
  | 'education'
  | 'short-video';

export interface LocalizedText {
  zh: string;
  en: string;
  ja: string;
  ko: string;
}

export interface TemplateManifest {
  id: string;
  name: LocalizedText;
  description: LocalizedText;
  category: TemplateCategory;
  defaultLocale: SupportedLocale;
  aspect: AspectRatio;
  width: number;
  height: number;
  supportedFormats: ExportFormat[];
  supportsMotion: boolean;
  contributor: {
    name: string;
    handle?: string;
    url?: string;
  };
  tags: string[];
}

export interface WikiIngestResult {
  rawPath: string;
  wikiPath: string;
  indexPath: string;
  sha256: string;
  title: string;
  estimatedTokens: number;
}

export interface WikiLintReport {
  valid: boolean;
  indexTokens: number;
  indexBudget: number;
  totalRawFiles: number;
  totalWikiPages: number;
  brokenLinks: Array<{ file: string; target: string }>;
  orphanPages: string[];
  oversizedPersonas: Array<{ file: string; tokens: number }>;
}

export interface RadarItem {
  id: string;
  source: string;
  title: string;
  url: string;
  publishedAt: string;
  summary?: string;
  score?: number;
  category?: 'ai-tech' | 'social' | 'creative' | 'dev' | 'real-discussion' | 'prediction' | string;
  suggestedTemplate?: string;
  suggestedAspectRatio?: '3:4' | '16:9' | '4:5' | '9:16' | string;
  author?: string;
  hotness?: string;
  sourceKind?: 'hackernews' | 'github' | 'rss' | 'dailyhot' | 'x' | 'reddit' | 'polymarket';
  polymarketOdds?: number; // 0-100 real-money prediction probability %
  redditComments?: number; // Real human community discussion volume
  authenticityScore?: number; // 0-100 anti-SEO authenticity weight score (last30days inspired)
}

export interface SanitizeReport {
  clean: boolean;
  redactedCount: number;
  findings: Array<{
    type: 'email' | 'token' | 'internal_domain' | 'local_path' | 'phone' | 'ip_address';
    originalPreview: string;
    replacement: string;
  }>;
  sanitizedContent: string;
}
