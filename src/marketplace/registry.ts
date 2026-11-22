import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import {
  getTemplatesRootDir,
  listTemplates,
  loadTemplateBundle,
} from '../renderer/html-compiler.js';
import {
  parseDeckMarkdown,
  serializeDeckMarkdown,
} from '../renderer/deck-parser.js';
import type {
  AspectRatio,
  DeckDocument,
  ExportFormat,
  LocalizedText,
  SlideLayout,
  SupportedLocale,
  TemplateCategory,
  TemplateManifest,
} from '../schema/types.js';
import { humanizeText } from '../wiki/humanizer.js';

export const MARKETPLACE_DEFAULT_VERSION = '1.0.0' as const;

export interface MarketplaceTemplateEntry extends TemplateManifest {
  version: string;
  styleFamily: string;
  tier: 'built-in' | 'pack';
  packIds: string[];
  previewBadges: string[];
  sha256: string;
}

export interface TemplatePack {
  id: string;
  version: string;
  spec: string;
  name: LocalizedText;
  description: LocalizedText;
  locales: SupportedLocale[];
  templateIds: string[];
  tags: string[];
}

export interface MarketplaceCatalog {
  generatedAt: string;
  templateCount: number;
  packCount: number;
  templates: MarketplaceTemplateEntry[];
  packs: TemplatePack[];
}

export interface MarketplaceSearchQuery {
  q?: string;
  locale?: SupportedLocale;
  category?: TemplateCategory;
  styleFamily?: string;
  aspect?: AspectRatio;
  format?: ExportFormat;
  packId?: string;
}

export interface MarketplaceSearchResult {
  templates: MarketplaceTemplateEntry[];
  packs: TemplatePack[];
  totalTemplates: number;
  totalPacks: number;
}

export interface InstalledTemplateRecord {
  id: string;
  version: string;
  sha256: string;
  installedAt: string;
  sourcePackId?: string;
  relativePath: string;
}

export interface InstalledTemplateStatus extends InstalledTemplateRecord {
  resolvedDir: string;
  integrityOk: boolean;
}

export interface InstallMarketplaceResult {
  requestedSpec: string;
  resolvedType: 'template' | 'pack';
  resolvedId: string;
  version: string;
  verified: boolean;
  newlyInstalled: string[];
  alreadyInstalled: string[];
  installedRecords: InstalledTemplateRecord[];
  installedRootDir: string;
  registryFilePath: string;
}

export interface RemixDeckOptions {
  sourceTemplateId?: string;
  sourceDeckPath?: string;
  targetDeckPath: string;
  outDeckPath?: string;
  locale?: SupportedLocale;
  humanize?: boolean;
  preserveContent?: boolean;
  customTemplatesDir?: string;
}

export interface RemixDeckResult {
  mode: 'template' | 'reference-deck';
  remixedFrom: string;
  templateId: string;
  aspect: AspectRatio;
  locale: SupportedLocale;
  outDeckPath: string;
  slideCount: number;
  humanized: boolean;
  appliedLayouts: SlideLayout[];
  deck: DeckDocument;
  markdown: string;
}

interface BuiltinTemplateMeta {
  styleFamily: string;
  tier: 'built-in' | 'pack';
  previewBadges: string[];
}

const BUILTIN_TEMPLATE_META: Record<string, BuiltinTemplateMeta> = {
  'xhs-swiss-grid': {
    styleFamily: 'swiss-editorial',
    tier: 'built-in',
    previewBadges: ['3:4', 'zh-CN', 'Swiss Grid', 'Vermilion'],
  },
  'xhs-paper-editorial': {
    styleFamily: 'archival-paper',
    tier: 'built-in',
    previewBadges: ['3:4', 'zh-CN', 'Cotton Paper', 'Serif'],
  },
  'xhs-neon-tech': {
    styleFamily: 'dark-silicon',
    tier: 'built-in',
    previewBadges: ['3:4', 'zh-CN', 'Dark Chrome', 'Benchmark'],
  },
  'xhs-warm-magazine': {
    styleFamily: 'warm-magazine',
    tier: 'built-in',
    previewBadges: ['3:4', 'zh-CN', 'Terracotta', 'Magazine'],
  },
  'xhs-pop-sticker': {
    styleFamily: 'neo-brutalist',
    tier: 'built-in',
    previewBadges: ['3:4', 'zh-CN', 'Dot-Grid', 'Sticker Pop'],
  },
  'wechat-greenbook': {
    styleFamily: 'botanical-card',
    tier: 'built-in',
    previewBadges: ['3:4', 'zh-CN', 'Greenbook', 'Swipe Deck'],
  },
  'wechat-editorial-article': {
    styleFamily: 'editorial-column',
    tier: 'built-in',
    previewBadges: ['3:4', 'zh-CN', 'Inline CSS', 'Column'],
  },
  'wechat-minimal-brief': {
    styleFamily: 'executive-minimal',
    tier: 'built-in',
    previewBadges: ['3:4', 'zh-CN', 'Whitepaper', 'Stat Pills'],
  },
  'linkedin-exec-carousel': {
    styleFamily: 'founder-authority',
    tier: 'built-in',
    previewBadges: ['4:5', 'en', 'Vector PDF', 'B2B Carousel'],
  },
  'en-founder-whiteboard': {
    styleFamily: 'whiteboard-blueprint',
    tier: 'built-in',
    previewBadges: ['4:5', 'en', 'Blueprint', 'Marker'],
  },
  'en-substack-digest': {
    styleFamily: 'newsletter-essay',
    tier: 'built-in',
    previewBadges: ['4:5', 'en', 'Newsprint', 'Georgia Serif'],
  },
  'x-zukai-quad': {
    styleFamily: 'zukai-blueprint',
    tier: 'built-in',
    previewBadges: ['16:9', 'ja', '図解', 'Strict Kinsoku'],
  },
  'ja-note-editorial': {
    styleFamily: 'washi-minimal',
    tier: 'built-in',
    previewBadges: ['4:5', 'ja', 'Washi Paper', 'Hanko Stamp'],
  },
  'ig-cardnews-kr': {
    styleFamily: 'geometric-cardnews',
    tier: 'built-in',
    previewBadges: ['4:5', 'ko', 'Pretendard', 'keep-all'],
  },
  'ko-brand-lookbook': {
    styleFamily: 'studio-lookbook',
    tier: 'built-in',
    previewBadges: ['4:5', 'ko', 'Seoul Studio', 'keep-all'],
  },
  'ppt-executive-16x9': {
    styleFamily: 'boardroom-ppt',
    tier: 'built-in',
    previewBadges: ['16:9', 'zh-CN', 'Editable .PPTX', 'Boardroom'],
  },
  'ppt-tech-architecture': {
    styleFamily: 'tech-architecture',
    tier: 'built-in',
    previewBadges: ['16:9', 'en', 'Editable .PPTX', 'Dark Grid'],
  },
  'ppt-consulting-matrix': {
    styleFamily: 'consulting-matrix',
    tier: 'built-in',
    previewBadges: ['16:9', 'zh-CN', 'Action Title', 'KPI Matrix'],
  },
  'edu-flashcard-kids': {
    styleFamily: 'bilingual-flashcard',
    tier: 'built-in',
    previewBadges: ['3:4', 'zh-CN', 'Printable', 'Kid-Safe'],
  },
  'edu-lesson-guide': {
    styleFamily: 'classroom-notebook',
    tier: 'built-in',
    previewBadges: ['3:4', 'zh-CN', 'Chalkboard', 'Study Guide'],
  },
  'video-kinetic-reel': {
    styleFamily: 'kinetic-motion',
    tier: 'built-in',
    previewBadges: ['9:16', 'zh-CN', '60fps MP4', 'Safe-Zone'],
  },
  'video-cinema-talk': {
    styleFamily: 'cinema-letterbox',
    tier: 'built-in',
    previewBadges: ['9:16', 'zh-CN', 'Black & Gold', 'Letterbox'],
  },
  'apple-bento-launch': {
    styleFamily: 'apple-bento',
    tier: 'built-in',
    previewBadges: ['16:9', 'zh-CN', 'Bento Grid', 'Apple Keynote'],
  },
  'apple-dark-keynote': {
    styleFamily: 'apple-dark-keynote',
    tier: 'built-in',
    previewBadges: ['16:9', 'zh-CN', 'Obsidian Glow', 'Dark Glass'],
  },
  'xhs-bold-headline': {
    styleFamily: 'viral-bold-headline',
    tier: 'built-in',
    previewBadges: ['3:4', 'zh-CN', 'Acid Yellow', 'High-CTR Poster'],
  },
  'xhs-apple-notes': {
    styleFamily: 'apple-notes-journal',
    tier: 'built-in',
    previewBadges: ['3:4', 'zh-CN', 'iOS Notes', 'Warm Paper'],
  },
  'xhs-morandi-cream': {
    styleFamily: 'morandi-botanical',
    tier: 'built-in',
    previewBadges: ['3:4', 'zh-CN', 'Oat Cream', 'Sage & Terracotta'],
  },
  'xhs-liquid-glass': {
    styleFamily: 'liquid-glass-aurora',
    tier: 'built-in',
    previewBadges: ['3:4', 'zh-CN', 'Frosted Glass', 'Aurora Mesh'],
  },
  'xhs-pro-vs-con': {
    styleFamily: 'verdict-comparison',
    tier: 'built-in',
    previewBadges: ['3:4', 'zh-CN', '红黑榜', 'Pro vs Con'],
  },
  'xhs-quote-card': {
    styleFamily: 'editorial-quote-dark',
    tier: 'built-in',
    previewBadges: ['3:4', 'zh-CN', 'Forest Matte', 'Champagne Serif'],
  },
  'wechat-deep-report': {
    styleFamily: 'deep-industry-report',
    tier: 'built-in',
    previewBadges: ['3:4', 'zh-CN', 'Navy & Brass', 'Research Brief'],
  },
  'wechat-frontpage-news': {
    styleFamily: 'broadsheet-frontpage',
    tier: 'built-in',
    previewBadges: ['3:4', 'zh-CN', 'Newsprint', 'Broadsheet'],
  },
  'ppt-linear-dark': {
    styleFamily: 'linear-precision-dark',
    tier: 'built-in',
    previewBadges: ['16:9', 'en', 'Linear Style', 'Editable .PPTX'],
  },
  'ppt-bauhaus-bold': {
    styleFamily: 'bauhaus-geometric',
    tier: 'built-in',
    previewBadges: ['16:9', 'en', 'Bauhaus Grid', 'Primary Colors'],
  },
  'poster-risograph': {
    styleFamily: 'risograph-duotone',
    tier: 'built-in',
    previewBadges: ['4:5', 'en', 'Risograph', 'Coral + Cobalt'],
  },
  'video-podcast-wave': {
    styleFamily: 'podcast-waveform',
    tier: 'built-in',
    previewBadges: ['9:16', 'zh-CN', 'Equalizer Wave', '60fps MP4'],
  },
};

export const CURATED_TEMPLATE_PACKS: readonly TemplatePack[] = [
  {
    id: 'pack-solopreneur-cn',
    version: MARKETPLACE_DEFAULT_VERSION,
    spec: `pack-solopreneur-cn@${MARKETPLACE_DEFAULT_VERSION}`,
    name: {
      zh: '超级个体 · 小红书 + 微信全套爆款矩阵',
      en: 'CN Solopreneur · Xiaohongshu + WeChat Matrix',
      ja: '中国SNS · 小紅書＋WeChat 全套パック',
      ko: '중국 솔로프리너 · 샤오홍슈 + 위챗 올인원 팩',
    },
    description: {
      zh: '囊括小红书 5 套差异化视觉体系与微信生态 3 套图文/白皮书主题，覆盖干货拆解、人文书卷、暗黑评测、暖阳画报与波普手账。',
      en: 'Complete 8-template Chinese creator matrix spanning 5 Xiaohongshu visual systems and 3 WeChat editorial/digest formats.',
      ja: '小紅書5種＋WeChat3種の計8テンプレートを収録した中国市場クリエイターパック。',
      ko: '샤오홍슈 5종과 위챗 생태계 3종으로 구성된 8종 중국 크리에이터 팩.',
    },
    locales: ['zh-CN'],
    templateIds: [
      'xhs-swiss-grid',
      'xhs-paper-editorial',
      'xhs-neon-tech',
      'xhs-warm-magazine',
      'xhs-pop-sticker',
      'wechat-greenbook',
      'wechat-editorial-article',
      'wechat-minimal-brief',
    ],
    tags: ['solopreneur', 'xiaohongshu', 'wechat', 'zh-CN', 'creator'],
  },
  {
    id: 'pack-global-growth',
    version: MARKETPLACE_DEFAULT_VERSION,
    spec: `pack-global-growth@${MARKETPLACE_DEFAULT_VERSION}`,
    name: {
      zh: '全球出海 · 欧美 + 日本図解 + 韩国卡片新闻矩阵',
      en: 'Global Growth · LinkedIn/Substack + Japan Zukai/Note + Korea CardNews',
      ja: 'グローバル発信 · 欧米＋日本図解/Note＋韓国カードニュース',
      ko: '글로벌 그로스 · 영미권 + 일본 도해/Note + 한국 카드뉴스 팩',
    },
    description: {
      zh: '一站式海外多语种内容增长套件：欧美 LinkedIn/白板/Substack、日本 X 図解与和纸 Note（严格禁则）、韩国 IG 卡片新闻与首尔画册（keep-all）。',
      en: '7-template international growth matrix covering English B2B carousels/newsletters, Japanese kinsoku Zukai/Note, and Korean Pretendard keep-all cards.',
      ja: '英語圏LinkedIn/Substack、日本語図解/Note、韓国語カードニュース/ルックブックを網羅。',
      ko: '영미 링크드인·서브스택, 일본 도해·노트, 한국 카드뉴스·룩북을 아우르는 7종 글로벌 팩.',
    },
    locales: ['en', 'ja', 'ko'],
    templateIds: [
      'linkedin-exec-carousel',
      'en-founder-whiteboard',
      'en-substack-digest',
      'x-zukai-quad',
      'ja-note-editorial',
      'ig-cardnews-kr',
      'ko-brand-lookbook',
    ],
    tags: ['global', 'linkedin', 'substack', 'zukai', 'note-com', 'cardnews', 'en', 'ja', 'ko'],
  },
  {
    id: 'pack-executive-ppt',
    version: MARKETPLACE_DEFAULT_VERSION,
    spec: `pack-executive-ppt@${MARKETPLACE_DEFAULT_VERSION}`,
    name: {
      zh: '高管汇报 · 16:9 原生可编辑 PPT 套件',
      en: 'Executive Presentations · 16:9 Native Editable .PPTX Suite',
      ja: 'ビジネスPPT · 16:9 編集可能プレゼンスイート',
      ko: '임원 보고 · 16:9 편집 가능 PPTX 스위트',
    },
    description: {
      zh: '包含董事会战略简报、暗色技术架构答辩与麦肯锡/BCG 咨询行动看板 3 套 16:9 宽屏模板，全部支持真实可编辑 .pptx 导出。',
      en: '3 widescreen 16:9 presentation systems — Boardroom Executive, Dark Tech Architecture, and Consulting KPI Matrix — with editable .pptx export.',
      ja: '経営報告・技術設計レビュー・戦略コンサルマトリクスの16:9スライド3種。',
      ko: '임원 전략 보고, 기술 아키텍처, 컨설팅 KPI 매트릭스 16:9 PPTX 3종.',
    },
    locales: ['zh-CN', 'en'],
    templateIds: [
      'ppt-executive-16x9',
      'ppt-tech-architecture',
      'ppt-consulting-matrix',
    ],
    tags: ['ppt', 'pptx', 'executive', 'consulting', 'architecture', '16:9'],
  },
  {
    id: 'pack-educator-pro',
    version: MARKETPLACE_DEFAULT_VERSION,
    spec: `pack-educator-pro@${MARKETPLACE_DEFAULT_VERSION}`,
    name: {
      zh: '教育备课 · 双语儿童闪卡 + 课堂导学复盘卡',
      en: 'Educator Pro · Bilingual Flashcards + Classroom Lesson Guide',
      ja: '教育プロ · バイリンガル暗記カード＋授業ガイド',
      ko: '에듀케이터 프로 · 이중언어 플래시카드 + 레슨 가이드',
    },
    description: {
      zh: '面向一线教师、教研团队与家庭教育者的高清可打印教学卡组，兼顾低龄护眼闪卡与结构化黑板导学笔记。',
      en: 'Print-ready educational templates pairing playful kid-safe bilingual flashcards with structured chalkboard-green classroom lesson guides.',
      ja: '子ども向けフラッシュカードと黒板グリーン授業ガイドの教育特化パック。',
      ko: '어린이 이중언어 플래시카드와 칠판 그린 수업 가이드 2종 교육 팩.',
    },
    locales: ['zh-CN', 'en'],
    templateIds: ['edu-flashcard-kids', 'edu-lesson-guide'],
    tags: ['education', 'teacher', 'flashcard', 'classroom', 'printable'],
  },
  {
    id: 'pack-video-creator',
    version: MARKETPLACE_DEFAULT_VERSION,
    spec: `pack-video-creator@${MARKETPLACE_DEFAULT_VERSION}`,
    name: {
      zh: '短视频工厂 · 动感快剪 + 电影感黑金口播 9:16 套件',
      en: 'Video Creator · Kinetic Reel + Cinema Talk 9:16 Suite',
      ja: 'ショート動画 · キネティック＋シネマ黒金 9:16 スイート',
      ko: '숏폼 크리에이터 · 키네틱 릴스 + 시네마 토크 9:16 팩',
    },
    description: {
      zh: '专为抖音、视频号、YouTube Shorts 与 Reels 打造的 9:16 确定性 60fps 帧步进视频模板，自带底部安全区动态口播字幕条。',
      en: '2 vertical 9:16 deterministic frame-stepped MP4 video stages: energetic neon kinetic motion and cinema obsidian-gold commentary.',
      ja: '9:16縦型60fps動画テンプレート2種（キネティック＆シネマ黒金）。',
      ko: '9:16 60fps 숏폼 영상 템플릿 2종(키네틱 모션 + 시네마 블랙&골드).',
    },
    locales: ['zh-CN', 'en'],
    templateIds: ['video-kinetic-reel', 'video-cinema-talk'],
    tags: ['video', 'mp4', '9:16', 'shorts', 'reels', 'douyin', 'cinema'],
  },
  {
    id: 'pack-apple-bento-pro',
    version: MARKETPLACE_DEFAULT_VERSION,
    spec: `pack-apple-bento-pro@${MARKETPLACE_DEFAULT_VERSION}`,
    name: {
      zh: '苹果发布会 · Bento 便当盒 & 极简暗黑 PPT 套件',
      en: 'Apple Bento Pro · Keynote, Linear Dark & Bauhaus 16:9 Suite',
      ja: 'Apple風 Bento · キーノート＆Linearダーク 16:9 スイート',
      ko: '애플 벤토 프로 · 키노트·리니어·바우하우스 16:9 스위트',
    },
    description: {
      zh: '集齐苹果发布会 Bento 便当盒、暗黑剧场光感主视觉、Linear 极简暗黑发布与包豪斯三原色几何 4 套 16:9 旗舰演示系统。',
      en: '4 flagship 16:9 presentation design systems: Apple Bento Launch, Apple Dark Keynote, Linear Precision Dark, and Bauhaus Bold Geometric.',
      ja: 'Apple風Bento・ダークキーノート・Linear極細ダーク・バウハウス幾何学の4大16:9プレゼンパック。',
      ko: '애플 벤토, 다크 키노트, 리니어 다크, 바우하우스 기하학 4종 16:9 플래그십 프레젠테이션 팩.',
    },
    locales: ['zh-CN', 'en'],
    templateIds: [
      'apple-bento-launch',
      'apple-dark-keynote',
      'ppt-linear-dark',
      'ppt-bauhaus-bold',
    ],
    tags: ['apple', 'bento', 'keynote', 'linear', 'bauhaus', 'pptx', '16:9', 'presentation'],
  },
  {
    id: 'pack-viral-editorial',
    version: MARKETPLACE_DEFAULT_VERSION,
    spec: `pack-viral-editorial@${MARKETPLACE_DEFAULT_VERSION}`,
    name: {
      zh: '爆款视觉 · 大字报 / 苹果备忘录 / 莫兰迪 / 液态玻璃 / Risograph 套件',
      en: 'Viral Editorial · Bold Poster, Apple Notes, Morandi, Liquid Glass & Risograph',
      ja: 'バズ視覚パック · 大見出し・Appleメモ・モランディ・液態ガラス・リソグラフ',
      ko: '바이럴 에디토리얼 · 볼드 포스터·애플 메모·모란디·리퀴드 글래스·리소그래프',
    },
    description: {
      zh: '10 套高点击率视觉风格全家桶：小红书黄黑大字报、苹果备忘录、莫兰迪奶油、液态毛玻璃、红黑榜评测、播客金句卡、深度研报、复古头版报纸、Risograph 海报与播客声波短视频。',
      en: '10 high-craft viral visual styles spanning Xiaohongshu posters & notes, Morandi cream, Liquid Glass, Pro-vs-Con verdicts, quote cards, deep reports, broadsheets, Risograph art posters, and podcast waveform reels.',
      ja: '高CTR大見出し・Appleメモ・モランディ・すりガラス・比較レビュー・名言カード・業界研報・新聞一面・リソグラフ・ポッドキャスト波形の10種パック。',
      ko: '고클릭 대자보, 애플 메모, 모란디 크림, 리퀴드 글래스, 장단점 비교, 명언 카드, 산업 리포트, 신문 1면, 리소그래프, 팟캐스트 웨이브 10종 올인원 팩.',
    },
    locales: ['zh-CN', 'en'],
    templateIds: [
      'xhs-bold-headline',
      'xhs-apple-notes',
      'xhs-morandi-cream',
      'xhs-liquid-glass',
      'xhs-pro-vs-con',
      'xhs-quote-card',
      'wechat-deep-report',
      'wechat-frontpage-news',
      'poster-risograph',
      'video-podcast-wave',
    ],
    tags: [
      'viral',
      'editorial',
      'bold-headline',
      'apple-notes',
      'morandi',
      'liquid-glass',
      'risograph',
      'report',
      'podcast',
    ],
  },
];

function computeSha256(content: string | Buffer): string {
  return createHash('sha256').update(content).digest('hex');
}

function parseItemSpec(spec: string): { id: string; requestedVersion?: string } {
  const trimmed = spec.trim();
  const atIdx = trimmed.lastIndexOf('@');
  if (atIdx > 0) {
    return {
      id: trimmed.slice(0, atIdx),
      requestedVersion: trimmed.slice(atIdx + 1),
    };
  }
  return { id: trimmed };
}

function getPacksForTemplate(templateId: string): string[] {
  return CURATED_TEMPLATE_PACKS.filter((p) => p.templateIds.includes(templateId)).map((p) => p.id);
}

/**
 * Lists the full Marketplace catalog: all available templates (with live SHA-256
 * computed directly from `template.html`) plus all 5 curated versioned packs.
 */
export async function listMarketplaceCatalog(opts?: {
  customTemplatesDir?: string;
}): Promise<MarketplaceCatalog> {
  const root = opts?.customTemplatesDir || getTemplatesRootDir();
  const manifests = await listTemplates(root);

  const templates: MarketplaceTemplateEntry[] = await Promise.all(
    manifests.map(async (manifest) => {
      const htmlPath = path.join(root, manifest.id, 'template.html');
      const htmlBuf = await fs.readFile(htmlPath);
      const sha256 = computeSha256(htmlBuf);
      const meta = BUILTIN_TEMPLATE_META[manifest.id];
      const packIds = getPacksForTemplate(manifest.id);

      return {
        ...manifest,
        version: MARKETPLACE_DEFAULT_VERSION,
        styleFamily: meta?.styleFamily ?? manifest.category,
        tier: meta?.tier ?? 'pack',
        packIds,
        previewBadges: meta?.previewBadges ?? [
          manifest.aspect,
          manifest.defaultLocale,
          manifest.category,
        ],
        sha256,
      };
    })
  );

  const availableIds = new Set(templates.map((t) => t.id));
  const packs = CURATED_TEMPLATE_PACKS.map((pack) => ({
    ...pack,
    locales: [...pack.locales],
    templateIds: pack.templateIds.filter((id) => availableIds.has(id)),
    tags: [...pack.tags],
  }));

  return {
    generatedAt: new Date().toISOString(),
    templateCount: templates.length,
    packCount: packs.length,
    templates,
    packs,
  };
}

/**
 * Multi-facet Marketplace search across keywords (id + 4-locale name/description + tags + styleFamily),
 * locale, category, styleFamily, aspect ratio, export format, and pack membership.
 */
export async function searchMarketplace(
  query: MarketplaceSearchQuery = {},
  opts?: { customTemplatesDir?: string }
): Promise<MarketplaceSearchResult> {
  const catalog = await listMarketplaceCatalog(opts);
  const tokens = (query.q || '')
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);

  const templates = catalog.templates.filter((tpl) => {
    if (query.locale && tpl.defaultLocale !== query.locale) return false;
    if (query.category && tpl.category !== query.category) return false;
    if (query.styleFamily && tpl.styleFamily.toLowerCase() !== query.styleFamily.toLowerCase()) {
      return false;
    }
    if (query.aspect && tpl.aspect !== query.aspect) return false;
    if (query.format && !tpl.supportedFormats.includes(query.format)) return false;
    if (query.packId && !tpl.packIds.includes(query.packId)) return false;

    if (tokens.length > 0) {
      const haystack = [
        tpl.id,
        tpl.name.zh,
        tpl.name.en,
        tpl.name.ja,
        tpl.name.ko,
        tpl.description.zh,
        tpl.description.en,
        tpl.description.ja,
        tpl.description.ko,
        tpl.category,
        tpl.styleFamily,
        tpl.defaultLocale,
        tpl.aspect,
        ...tpl.tags,
        ...tpl.previewBadges,
      ]
        .join(' ')
        .toLowerCase();

      for (const tok of tokens) {
        if (!haystack.includes(tok)) return false;
      }
    }

    return true;
  });

  const matchingTemplateIds = new Set(templates.map((t) => t.id));
  const packs = catalog.packs.filter((pack) => {
    if (query.packId && pack.id !== query.packId) return false;
    if (query.locale && !pack.locales.includes(query.locale)) {
      const hasMatchingTpl = pack.templateIds.some((id) => matchingTemplateIds.has(id));
      if (!hasMatchingTpl) return false;
    }
    if (query.category || query.styleFamily || query.aspect || query.format) {
      const hasMatchingTpl = pack.templateIds.some((id) => matchingTemplateIds.has(id));
      if (!hasMatchingTpl) return false;
    }
    if (tokens.length > 0) {
      const packHaystack = [
        pack.id,
        pack.spec,
        pack.name.zh,
        pack.name.en,
        pack.name.ja,
        pack.name.ko,
        pack.description.zh,
        pack.description.en,
        pack.description.ja,
        pack.description.ko,
        ...pack.tags,
      ]
        .join(' ')
        .toLowerCase();
      const directMatch = tokens.every((tok) => packHaystack.includes(tok));
      const memberMatch = pack.templateIds.some((id) => matchingTemplateIds.has(id));
      if (!directMatch && !memberMatch) return false;
    }
    return true;
  });

  return {
    templates,
    packs,
    totalTemplates: templates.length,
    totalPacks: packs.length,
  };
}

interface InstalledRegistryFile {
  schemaVersion: 1;
  updatedAt: string;
  templates: InstalledTemplateRecord[];
}

function getInstalledPaths(targetWorkspaceDir: string) {
  const aimakeDir = path.join(targetWorkspaceDir, '.aimake');
  const installedRootDir = path.join(aimakeDir, 'installed-templates');
  const registryFilePath = path.join(aimakeDir, 'installed.json');
  return { aimakeDir, installedRootDir, registryFilePath };
}

async function readInstalledRegistry(targetWorkspaceDir: string): Promise<InstalledTemplateRecord[]> {
  const { registryFilePath } = getInstalledPaths(targetWorkspaceDir);
  try {
    const raw = await fs.readFile(registryFilePath, 'utf8');
    const parsed = JSON.parse(raw) as InstalledRegistryFile;
    return Array.isArray(parsed.templates) ? parsed.templates : [];
  } catch {
    return [];
  }
}

async function writeInstalledRegistry(
  targetWorkspaceDir: string,
  records: InstalledTemplateRecord[]
): Promise<string> {
  const { aimakeDir, registryFilePath } = getInstalledPaths(targetWorkspaceDir);
  await fs.mkdir(aimakeDir, { recursive: true });
  const sorted = [...records].sort((a, b) => a.id.localeCompare(b.id));
  const payload: InstalledRegistryFile = {
    schemaVersion: 1,
    updatedAt: new Date().toISOString(),
    templates: sorted,
  };
  await fs.writeFile(registryFilePath, JSON.stringify(payload, null, 2) + '\n', 'utf8');
  return registryFilePath;
}

/**
 * Installs a single versioned template (`<template-id>[@version]`) or curated pack (`<pack-id>[@version]`)
 * into `<targetWorkspaceDir>/.aimake/installed-templates/<id>/`, verifying SHA-256 integrity
 * and recording metadata idempotently in `<targetWorkspaceDir>/.aimake/installed.json`.
 */
export async function installMarketplaceItem(
  itemIdOrPackSpec: string,
  targetWorkspaceDir: string,
  opts?: { customTemplatesDir?: string }
): Promise<InstallMarketplaceResult> {
  const sourceRoot = opts?.customTemplatesDir || getTemplatesRootDir();
  const catalog = await listMarketplaceCatalog({ customTemplatesDir: sourceRoot });
  const { id, requestedVersion } = parseItemSpec(itemIdOrPackSpec);

  const pack = catalog.packs.find((p) => p.id === id);
  const singleTemplate = catalog.templates.find((t) => t.id === id);

  if (!pack && !singleTemplate) {
    throw new Error(`Marketplace item not found: "${itemIdOrPackSpec}"`);
  }

  const resolvedVersion = pack ? pack.version : singleTemplate!.version;
  if (requestedVersion && requestedVersion !== resolvedVersion) {
    throw new Error(
      `Requested version "${requestedVersion}" for "${id}" does not match available version "${resolvedVersion}"`
    );
  }

  const targetEntries: MarketplaceTemplateEntry[] = pack
    ? pack.templateIds
        .map((tid) => catalog.templates.find((t) => t.id === tid))
        .filter((t): t is MarketplaceTemplateEntry => Boolean(t))
    : [singleTemplate!];

  if (targetEntries.length === 0) {
    throw new Error(`No installable templates resolved for "${itemIdOrPackSpec}"`);
  }

  const { installedRootDir } = getInstalledPaths(targetWorkspaceDir);
  await fs.mkdir(installedRootDir, { recursive: true });

  const existingRecords = await readInstalledRegistry(targetWorkspaceDir);
  const recordMap = new Map(existingRecords.map((r) => [r.id, r]));

  const newlyInstalled: string[] = [];
  const alreadyInstalled: string[] = [];
  const installedRecords: InstalledTemplateRecord[] = [];

  for (const entry of targetEntries) {
    const srcDir = path.join(sourceRoot, entry.id);
    const destDir = path.join(installedRootDir, entry.id);
    const destHtmlPath = path.join(destDir, 'template.html');
    const relativePath = path.posix.join('.aimake', 'installed-templates', entry.id);

    const existing = recordMap.get(entry.id);
    let alreadyValidOnDisk = false;
    if (existing && existing.version === entry.version && existing.sha256 === entry.sha256) {
      try {
        const diskHtml = await fs.readFile(destHtmlPath);
        if (computeSha256(diskHtml) === entry.sha256) {
          alreadyValidOnDisk = true;
        }
      } catch {
        alreadyValidOnDisk = false;
      }
    }

    if (alreadyValidOnDisk && existing) {
      alreadyInstalled.push(entry.id);
      installedRecords.push(existing);
      continue;
    }

    await fs.mkdir(destDir, { recursive: true });
    const srcFiles = await fs.readdir(srcDir, { withFileTypes: true });
    for (const file of srcFiles) {
      if (!file.isFile()) continue;
      await fs.copyFile(path.join(srcDir, file.name), path.join(destDir, file.name));
    }

    // Verify copied template.html SHA-256 against catalog digest
    const copiedHtml = await fs.readFile(destHtmlPath);
    const actualSha = computeSha256(copiedHtml);
    if (actualSha !== entry.sha256) {
      throw new Error(
        `SHA-256 verification failed for template "${entry.id}": expected ${entry.sha256}, got ${actualSha}`
      );
    }

    const record: InstalledTemplateRecord = {
      id: entry.id,
      version: entry.version,
      sha256: actualSha,
      installedAt: new Date().toISOString(),
      sourcePackId: pack ? pack.id : undefined,
      relativePath,
    };

    recordMap.set(entry.id, record);
    newlyInstalled.push(entry.id);
    installedRecords.push(record);
  }

  const registryFilePath = await writeInstalledRegistry(
    targetWorkspaceDir,
    Array.from(recordMap.values())
  );

  return {
    requestedSpec: itemIdOrPackSpec,
    resolvedType: pack ? 'pack' : 'template',
    resolvedId: id,
    version: resolvedVersion,
    verified: true,
    newlyInstalled,
    alreadyInstalled,
    installedRecords,
    installedRootDir,
    registryFilePath,
  };
}

/**
 * Lists installed templates recorded in `<targetWorkspaceDir>/.aimake/installed.json`,
 * verifying live SHA-256 integrity on disk for each template.
 */
export async function listInstalledTemplates(
  targetWorkspaceDir: string
): Promise<InstalledTemplateStatus[]> {
  const records = await readInstalledRegistry(targetWorkspaceDir);
  const { installedRootDir } = getInstalledPaths(targetWorkspaceDir);

  return Promise.all(
    records.map(async (record) => {
      const resolvedDir = path.join(installedRootDir, record.id);
      let integrityOk = false;
      try {
        const htmlBuf = await fs.readFile(path.join(resolvedDir, 'template.html'));
        integrityOk = computeSha256(htmlBuf) === record.sha256;
      } catch {
        integrityOk = false;
      }
      return {
        ...record,
        resolvedDir,
        integrityOk,
      };
    })
  );
}

/**
 * Removes an installed template from `<targetWorkspaceDir>/.aimake/installed-templates/<id>`
 * and updates `<targetWorkspaceDir>/.aimake/installed.json`.
 */
export async function removeInstalledTemplate(
  templateId: string,
  targetWorkspaceDir: string
): Promise<{ removed: boolean; templateId: string; remaining: number }> {
  const existing = await readInstalledRegistry(targetWorkspaceDir);
  const next = existing.filter((r) => r.id !== templateId);
  const removed = next.length !== existing.length;

  const { installedRootDir } = getInstalledPaths(targetWorkspaceDir);
  await fs.rm(path.join(installedRootDir, templateId), { recursive: true, force: true });
  await writeInstalledRegistry(targetWorkspaceDir, next);

  return {
    removed,
    templateId,
    remaining: next.length,
  };
}

function adaptLayoutForTemplate(
  currentLayout: SlideLayout,
  slide: DeckDocument['slides'][number],
  index: number,
  total: number,
  manifest: TemplateManifest
): SlideLayout {
  // Always honor specialized content blocks so structured blocks stay intact
  if (slide.metrics.length > 0 && currentLayout === 'metrics') return 'metrics';
  if (slide.code && currentLayout === 'code') return 'code';
  if (slide.comparison && currentLayout === 'comparison') return 'comparison';
  if (index === 0 && currentLayout === 'cover') return 'cover';
  if (index === total - 1 && currentLayout === 'outro') return 'outro';

  if (manifest.id === 'x-zukai-quad' && slide.bullets.length >= 4 && currentLayout === 'bullets') {
    return 'quad';
  }
  if (
    manifest.id === 'edu-flashcard-kids' &&
    currentLayout === 'bullets' &&
    index > 0 &&
    index < total - 1
  ) {
    return 'flashcard';
  }
  return currentLayout;
}

function humanizeDeckInPlace(doc: DeckDocument, locale: SupportedLocale): void {
  doc.frontmatter.title = humanizeText(doc.frontmatter.title, locale);
  for (const slide of doc.slides) {
    slide.title = humanizeText(slide.title, locale);
    if (slide.subtitle) {
      slide.subtitle = humanizeText(slide.subtitle, locale);
    }
    if (slide.eyebrow) {
      slide.eyebrow = humanizeText(slide.eyebrow, locale);
    }
    slide.bullets = slide.bullets.map((b) => humanizeText(b, locale));
    slide.bodyParagraphs = slide.bodyParagraphs.map((p) => humanizeText(p, locale));
    if (slide.quote) {
      slide.quote = {
        ...slide.quote,
        text: humanizeText(slide.quote.text, locale),
      };
    }
    if (slide.speech) {
      slide.speech = humanizeText(slide.speech, locale);
    }
    if (slide.comparison) {
      slide.comparison = {
        leftTitle: humanizeText(slide.comparison.leftTitle, locale),
        leftItems: slide.comparison.leftItems.map((it) => humanizeText(it, locale)),
        rightTitle: humanizeText(slide.comparison.rightTitle, locale),
        rightItems: slide.comparison.rightItems.map((it) => humanizeText(it, locale)),
      };
    }
  }
}

async function resolveTemplateManifestWithFallback(
  templateId: string,
  targetDeckPath: string,
  customTemplatesDir?: string
): Promise<TemplateManifest> {
  try {
    const bundle = await loadTemplateBundle(templateId, customTemplatesDir);
    return bundle.manifest;
  } catch {
    // Also check workspace-local installed templates next to targetDeckPath
    const installedDir = path.join(path.dirname(targetDeckPath), '.aimake', 'installed-templates');
    const bundle = await loadTemplateBundle(templateId, installedDir);
    return bundle.manifest;
  }
}

function upsertRemixedTag(tags: string[], remixedFromValue: string): string[] {
  const filtered = tags.filter((t) => !t.startsWith('remixedFrom:'));
  return [...filtered, `remixedFrom: ${remixedFromValue}`];
}

function defaultRemixOutputPath(targetDeckPath: string, templateId: string): string {
  const dir = path.dirname(targetDeckPath);
  const base = path.basename(targetDeckPath);
  const stem = base.endsWith('.deck.md')
    ? base.slice(0, -'.deck.md'.length)
    : base.replace(/\.md$/i, '');
  return path.join(dir, `${stem}.remixed.${templateId}.deck.md`);
}

const VALID_ASPECTS = new Set<AspectRatio>(['3:4', '4:5', '16:9', '9:16', '1:1', 'article']);

/**
 * Extracts `aspect` directly from raw YAML frontmatter so unquoted YAML 1.1 sexagesimal
 * values like `aspect: 16:9` or `aspect: 9:16` are never lost during gray-matter parsing.
 */
function extractRawFrontmatterAspect(markdown: string): AspectRatio | undefined {
  const fmMatch = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!fmMatch) return undefined;
  const lineMatch = fmMatch[1].match(/^aspect:\s*['"]?([0-9]+:[0-9]+|article)['"]?\s*$/m);
  if (!lineMatch) return undefined;
  const candidate = lineMatch[1] as AspectRatio;
  return VALID_ASPECTS.has(candidate) ? candidate : undefined;
}

/**
 * Ensures the serialized frontmatter `aspect` value is double-quoted so YAML 1.1 parsers
 * (such as gray-matter) always round-trip `16:9`, `9:16`, `4:5`, `3:4`, and `1:1` as strings.
 */
function quoteFrontmatterAspect(markdown: string): string {
  return markdown.replace(
    /^(---\r?\n[\s\S]*?^aspect:\s*)([0-9]+:[0-9]+)(\s*$)/m,
    '$1"$2"$3'
  );
}

/**
 * 「一键做同款」 One-Click Remix Engine.
 *
 * Mode 1 (`sourceTemplateId`):
 *   Loads a Marketplace template manifest, updates frontmatter (`template`, `aspect`,
 *   optional `locale`), tags `remixedFrom: template:<id>@1.0.0`, and adapts slide layouts
 *   while preserving 100% of user titles, bullets, metrics, speech, and citations.
 *
 * Mode 2 (`sourceDeckPath`):
 *   Reads a reference finished `.deck.md`'s frontmatter (`template`, `aspect`, `locale`,
 *   `fps`, `secondsPerSlide`) and structural slide layout rhythm (`slides[i].layout`),
 *   applies that exact visual style & rhythm to the user's target `.deck.md`, optionally
 *   humanizing copy across 4 locales (`zh-CN`, `en`, `ja`, `ko`), and writes the result.
 */
export async function remixDeckWithStyle(
  options: RemixDeckOptions
): Promise<RemixDeckResult> {
  const {
    sourceTemplateId,
    sourceDeckPath,
    targetDeckPath,
    outDeckPath,
    locale,
    humanize = false,
    preserveContent = true,
    customTemplatesDir,
  } = options;

  if (!sourceTemplateId && !sourceDeckPath) {
    throw new Error('remixDeckWithStyle requires either sourceTemplateId or sourceDeckPath');
  }

  const targetRaw = await fs.readFile(targetDeckPath, 'utf8');
  const targetDoc = parseDeckMarkdown(targetRaw, targetDeckPath);
  const remixed: DeckDocument = structuredClone(targetDoc);

  let mode: 'template' | 'reference-deck';
  let remixedFrom: string;

  if (sourceDeckPath) {
    mode = 'reference-deck';
    const refRaw = await fs.readFile(sourceDeckPath, 'utf8');
    const refDoc = parseDeckMarkdown(refRaw, sourceDeckPath);

    let resolvedTemplateId = refDoc.frontmatter.template;
    let resolvedAspect: AspectRatio =
      extractRawFrontmatterAspect(refRaw) ?? refDoc.frontmatter.aspect;
    if (sourceTemplateId) {
      const parsedSpec = parseItemSpec(sourceTemplateId);
      const manifest = await resolveTemplateManifestWithFallback(
        parsedSpec.id,
        targetDeckPath,
        customTemplatesDir
      );
      resolvedTemplateId = manifest.id;
      resolvedAspect = manifest.aspect;
    } else if (!extractRawFrontmatterAspect(refRaw)) {
      try {
        const refManifest = await resolveTemplateManifestWithFallback(
          resolvedTemplateId,
          sourceDeckPath,
          customTemplatesDir
        );
        resolvedAspect = refManifest.aspect;
      } catch {
        // Keep parsed aspect if reference template is external
      }
    }

    remixed.frontmatter.template = resolvedTemplateId;
    remixed.frontmatter.aspect = resolvedAspect;
    remixed.frontmatter.locale = locale ?? refDoc.frontmatter.locale;
    remixed.frontmatter.fps = refDoc.frontmatter.fps;
    remixed.frontmatter.secondsPerSlide = refDoc.frontmatter.secondsPerSlide;
    if (refDoc.frontmatter.accentColor && !remixed.frontmatter.accentColor) {
      remixed.frontmatter.accentColor = refDoc.frontmatter.accentColor;
    }

    const refLayouts = refDoc.slides.map((s) => s.layout);
    if (refLayouts.length > 0) {
      remixed.slides = remixed.slides.map((slide, idx) => {
        let rhythmicLayout: SlideLayout;
        if (idx < refLayouts.length) {
          rhythmicLayout = refLayouts[idx];
        } else if (
          idx === remixed.slides.length - 1 &&
          refLayouts[refLayouts.length - 1] === 'outro'
        ) {
          rhythmicLayout = 'outro';
        } else {
          rhythmicLayout = refLayouts[idx % refLayouts.length];
        }
        return {
          ...slide,
          layout: rhythmicLayout,
        };
      });
    }

    const refName = path.basename(sourceDeckPath);
    remixedFrom = `deck:${refName}`;
    remixed.frontmatter.tags = upsertRemixedTag(remixed.frontmatter.tags, remixedFrom);
  } else {
    mode = 'template';
    const parsedSpec = parseItemSpec(sourceTemplateId!);
    if (
      parsedSpec.requestedVersion &&
      parsedSpec.requestedVersion !== MARKETPLACE_DEFAULT_VERSION
    ) {
      throw new Error(
        `Template version "${parsedSpec.requestedVersion}" not found for "${parsedSpec.id}"`
      );
    }

    const manifest = await resolveTemplateManifestWithFallback(
      parsedSpec.id,
      targetDeckPath,
      customTemplatesDir
    );

    remixed.frontmatter.template = manifest.id;
    remixed.frontmatter.aspect = manifest.aspect;
    if (locale) {
      remixed.frontmatter.locale = locale;
    } else if (!remixed.frontmatter.locale) {
      remixed.frontmatter.locale = manifest.defaultLocale;
    }

    remixed.slides = remixed.slides.map((slide, idx) => ({
      ...slide,
      layout: adaptLayoutForTemplate(
        slide.layout,
        slide,
        idx,
        remixed.slides.length,
        manifest
      ),
    }));

    remixedFrom = `template:${manifest.id}@${MARKETPLACE_DEFAULT_VERSION}`;
    remixed.frontmatter.tags = upsertRemixedTag(remixed.frontmatter.tags, remixedFrom);
  }

  if (humanize && preserveContent) {
    humanizeDeckInPlace(remixed, remixed.frontmatter.locale);
  }

  const finalOutPath = outDeckPath || defaultRemixOutputPath(targetDeckPath, remixed.frontmatter.template);
  await fs.mkdir(path.dirname(finalOutPath), { recursive: true });

  const markdown = quoteFrontmatterAspect(serializeDeckMarkdown(remixed));
  await fs.writeFile(finalOutPath, markdown, 'utf8');
  remixed.sourcePath = finalOutPath;

  return {
    mode,
    remixedFrom,
    templateId: remixed.frontmatter.template,
    aspect: remixed.frontmatter.aspect,
    locale: remixed.frontmatter.locale,
    outDeckPath: finalOutPath,
    slideCount: remixed.slides.length,
    humanized: humanize,
    appliedLayouts: remixed.slides.map((s) => s.layout),
    deck: remixed,
    markdown,
  };
}
