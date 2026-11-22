import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { DeckDocument, SupportedLocale, TemplateManifest } from '../schema/types.js';
import { compileDeckToHtml } from '../renderer/html-compiler.js';
import { listMarketplaceCatalog, type MarketplaceTemplateEntry, type TemplatePack } from '../marketplace/index.js';
import { buildWebPlaygroundHtml } from './playground-builder.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PACKAGE_ROOT = path.resolve(__dirname, '..', '..');

type SiteLang = 'zh' | 'en' | 'ja' | 'ko';

const GSC_VERIFICATION = {
  google: 'uJ83um8k9_iom9DdkHRY_hTQwZE2QDjupfhvXQTyHGE',
  yandex: 'd12a2b1924f54936',
  baidu: 'codeva-dNFmwA2bNN',
  bing: 'B543FF67D291AA27F8D470ADEA45F876',
} as const;

interface LangCopy {
  htmlLang: string;
  deckLocale: SupportedLocale;
  navPlayground: string;
  navTemplates: string;
  navStudio: string;
  navUniverse: string;
  heroTag: string;
  heroTitle: string;
  heroSub: string;
  primaryCta: string;
  secondaryCta: string;
  stageCaption: string;
  pillarsHeading: string;
  pillars: Array<{ code: string; title: string; desc: string }>;
  galleryHeading: string;
  gallerySub: string;
  familyHeading: string;
  familySub: string;
  designerLabel: string;
  specLabel: string;
  deliverablesLabel: string;
  footerLine: string;
}

const UI_COPY: Record<SiteLang, LangCopy> = {
  zh: {
    htmlLang: 'zh-CN',
    deckLocale: 'zh-CN',
    navPlayground: '在线工坊',
    navTemplates: '36 套设计模板',
    navStudio: '爱创声画 Studio',
    navUniverse: '爱创星球 Universe',
    heroTag: 'LOCAL-FIRST · 零后端隐私架构 · 兼容 16+ AI 助手',
    heroTitle: '把每一次深度思考，编译成五种专业介质的复利资产',
    heroSub:
      'Aimake（爱创）将本地 Karpathy LLM Wiki 知识库、四语种个人风格基因（Style DNA）与确定性排版编译核融为一体。写好一份 .deck.md 原稿，同步直出小红书 3x 高清套图、微信公众号 100% 内联富文本、矢量 PDF、原生可编辑 .pptx 与 60fps 动画短视频。',
    primaryCta: '🚀 网页版在线体验 (免安装)',
    secondaryCta: '浏览 36 套设计系统与同款',
    stageCaption: '实时编译舞台 · 点击上方介质标签切换同一原稿的多端渲染画布',
    pillarsHeading: '为什么超级个体与专业团队选择 Aimake？',
    pillars: [
      {
        code: '01 · WIKI MEMORY',
        title: 'Karpathy LLM Wiki 知识复利层',
        desc: '自动摄入网页、飞书周报与 Office 文档，严格控制 index.md <= 3,000 tokens 索引预算；支持 .canvas / .excalidraw 图谱与提案审核。',
      },
      {
        code: '02 · STYLE DNA',
        title: '四语种去 AI 味与个人文风指纹',
        desc: '从历史代表作提取 <= 800 tokens 句式与审美品味，内置中/英/日严格禁则（kinsoku）/韩 Pretendard 词组断行清洗器，彻底告别套路化 AI 腔。',
      },
      {
        code: '03 · 1-TO-5 COMPILER',
        title: '一套原稿，五种原生可交付成品',
        desc: '拒绝截图凑数：PPTX 导出为真实可双击编辑的 OOXML 文本框，公众号导出为零外部样式表的纯内联 HTML，视频采用确定性逐帧步进与字幕编码。',
      },
      {
        code: '04 · MARKET & REMIX',
        title: '36 套风格市场 + 一键做同款 + 原生桌面端',
        desc: '内置 36 套四国多风格系统模板与 7 大版本化行业模板包，看到任意成品或模板一键套用到自己的 .deck.md，无缝联动 macOS 原生客户端与 16+ AI 宿主。',
      },
    ],
    galleryHeading: '模板市场 · 36 套系统预置模板与 7 大行业包',
    gallerySub: '按语种、平台与视觉风格实时筛选，支持版本化安装与「一键做同款」无损迁移排版',
    familyHeading: 'Aimake 爱创产品家族',
    familySub: '面向个人创作者、音视频制作人与家庭跨学科探索的独立本地优先产品线',
    designerLabel: '设计维护',
    specLabel: '画布规格与导出介质',
    deliverablesLabel: '支持原生导出',
    footerLine: 'Aimake 爱创 · 本地优先多模态创作与知识复利平台 · 数据 100% 留存本机',
  },
  en: {
    htmlLang: 'en',
    deckLocale: 'en',
    navPlayground: 'Web Playground',
    navTemplates: '36 Design Systems',
    navStudio: 'Aimake Studio',
    navUniverse: 'Aimake Universe',
    heroTag: 'LOCAL-FIRST · ZERO-BACKEND PRIVACY · WORKS WITH 16+ AI AGENTS',
    heroTitle: 'Compile raw notes into five publication-grade deliverables',
    heroSub:
      'Aimake unites a compounding Karpathy LLM Wiki, a 4-locale anti-slop Style DNA engine, and a deterministic layout compiler. Author one plain-Markdown .deck.md storyboard and output 3x Retina social cards, inline newsletter HTML, vector PDF carousels, native editable PowerPoint (.pptx), and 60fps MP4 reels.',
    primaryCta: '🚀 Try Live Web Playground (No Install)',
    secondaryCta: 'Explore 36 Design Systems',
    stageCaption: 'LIVE COMPILER STAGE · Switch tabs to inspect real parametric HTML outputs',
    pillarsHeading: 'Engineered for Solopreneurs & High-Output Teams',
    pillars: [
      {
        code: '01 · WIKI MEMORY',
        title: 'Karpathy LLM Wiki Compounding',
        desc: 'Ingest URLs, Markdown, and Office decks into raw/ and wiki/ with a strict <= 3,000-token index budget, graph visuals, and proposal review gates.',
      },
      {
        code: '02 · STYLE DNA',
        title: '4-Locale Anti-Slop Typography',
        desc: 'Extracts your cadence into an 800-token persona profile while enforcing CJK kinsoku rules, Korean keep-all word grouping, and cliché stripping.',
      },
      {
        code: '03 · 1-TO-5 COMPILER',
        title: 'True Native Exports, Never Flat Hacks',
        desc: 'Generates real OOXML text boxes in .pptx, 100% inline-CSS WeChat HTML, crisp vector PDFs, 3x Retina PNGs, and frame-stepped narrated MP4.',
      },
      {
        code: '04 · MARKET & REMIX',
        title: '36 Preset Styles + One-Click Remix',
        desc: 'Browse 36 built-in presets & 7 versioned packs, clone any winning deck style onto your .deck.md in one click, and run inside Aimake Desktop or 16+ AI hosts.',
      },
    ],
    galleryHeading: 'Template Marketplace · 36 Built-in Design Systems & 7 Packs',
    gallerySub: 'Filter by market, aspect ratio, or visual style — install versioned packs or launch One-Click Remix',
    familyHeading: 'The Aimake Product Family',
    familySub: 'Independent local-first tools for creators, audio-visual producers, and curious families',
    designerLabel: 'Crafted by',
    specLabel: 'Canvas & Output Specs',
    deliverablesLabel: 'Native Deliverables',
    footerLine: 'Aimake.cc · Local-First Multimodal Creator & LLM Wiki Studio · All Rights Reserved',
  },
  ja: {
    htmlLang: 'ja',
    deckLocale: 'ja',
    navPlayground: 'Web プレイグラウンド',
    navTemplates: '36 種デザインシステム',
    navStudio: 'Aimake Studio',
    navUniverse: 'Aimake Universe',
    heroTag: 'ローカルファースト · サーバー不要 · 16以上のAIエージェント対応',
    heroTitle: '日々の知見を、5つのプロ品質メディアへ一括コンパイル',
    heroSub:
      'Aimakeは、知識が複利で増えるKarpathy式LLM Wiki、AI臭さを消す文体DNAエンジン、厳格な日本語禁則処理（line-break: strict）を備えたマルチモーダル制作スタジオです。1つの .deck.md 原稿からXの「図解」・Note用HTML・LinkedIn PDF・編集可能なPPTX・60fps動画を同時出力します。',
    primaryCta: '🚀 Web版を今すぐ体験（インストール不要）',
    secondaryCta: '36種類のデザインシステムを見る',
    stageCaption: 'ライブプレビュー · タブを切り替えて各メディアの描画を確認',
    pillarsHeading: '個人の発信力を複利で伸ばす4つのコア設計',
    pillars: [
      {
        code: '01 · WIKI MEMORY',
        title: 'Karpathy式 ローカル LLM Wiki',
        desc: '記事URLや社内資料をMarkdownとして構造化蓄積。index.mdを3,000トークン以下に保ち、発信するほど知識資産が積み上がります。',
      },
      {
        code: '02 · STYLE DNA',
        title: '日本語禁則処理＆文体DNA注入',
        desc: '不自然なAI定型句を自動検出し、あなた固有の語彙とリズムを反映。句読点や括弧の禁則処理も標準搭載しています。',
      },
      {
        code: '03 · 1-TO-5 COMPILER',
        title: '1つの原稿から5形式をネイティブ出力',
        desc: '3倍解像度PNG、インラインCSS記事、ベクターPDF、テキスト再編集可能なネイティブPPTX、フレーム同期MP4動画を即座に生成。',
      },
      {
        code: '04 · 16+ HOST BRIDGE',
        title: '普段使いのAIツール＆ローカルStudio連携',
        desc: 'Claude Code・Codex・Cursor・WorkBuddy等と連携。127.0.0.1で動くStudio上で文字をダブルクリックして即座に微修正できます。',
      },
    ],
    galleryHeading: '36種類の多言語パラメトリック・テンプレート',
    gallerySub: 'X（旧Twitter）図解、LinkedInスライド、経営報告PPTX、ショート動画まで網羅',
    familyHeading: 'Aimake 製品ファミリー',
    familySub: 'クリエイターと家族の学びを支えるローカルファースト製品群',
    designerLabel: 'デザイン',
    specLabel: 'キャンバス仕様',
    deliverablesLabel: '対応出力フォーマット',
    footerLine: 'Aimake.cc · ローカルファースト・マルチモーダル制作スタジオ · All Rights Reserved',
  },
  ko: {
    htmlLang: 'ko',
    deckLocale: 'ko',
    navPlayground: '웹 플레이그라운드',
    navTemplates: '36 종 디자인 시스템',
    navStudio: 'Aimake Studio',
    navUniverse: 'Aimake Universe',
    heroTag: '로컬 퍼스트 · 무서버 프라이버시 · 16개 이상 AI 에이전트 연동',
    heroTitle: '로컬 노트 한 편을 5가지 전문가급 콘텐츠로 동시 컴파일',
    heroSub:
      'Aimake는 Karpathy 방식의 로컬 LLM 위키, AI 특유의 번역투를 제거하는 스타일 DNA 엔진, 그리고 Pretendard 단어 단위 줄바꿈(keep-all)이 적용된 멀티모달 제작 스튜디오입니다. 하나의 .deck.md 원고로 인스타그램 카드뉴스, 뉴스레터 HTML, 링크드인 PDF, 편집 가능한 네이티브 PPTX, 60fps 숏폼 영상을 완성하세요.',
    primaryCta: '🚀 웹 플레이그라운드 체험하기 (설치 불필요)',
    secondaryCta: '36가지 글로벌 템플릿 보기',
    stageCaption: '실시간 컴파일 스테이지 · 탭을 눌러 매체별 렌더링 결과를 확인하세요',
    pillarsHeading: '1인 크리에이터와 실무 팀을 위한 4대 핵심 아키텍처',
    pillars: [
      {
        code: '01 · WIKI MEMORY',
        title: '지식이 복리로 쌓이는 LLM 위키',
        desc: '웹 문서와 업무 자료를 로컬 마크다운으로 수집하고 index.md를 3,000 토큰 이내로 유지해 빠르고 정확한 맥락을 제공합니다.',
      },
      {
        code: '02 · STYLE DNA',
        title: '4개 국어 AI 상투어 제거 & 문체 복제',
        desc: '기계적인 문장을 정돈하고 어절 단위 한글 타이포그래피(word-break: keep-all)와 개인 문체 프로파일을 자동 적용합니다.',
      },
      {
        code: '03 · 1-TO-5 COMPILER',
        title: '원고 하나로 5가지 네이티브 포맷 완성',
        desc: '고해상도 PNG, 인라인 HTML, 벡터 PDF, 텍스트 수정이 가능한 진짜 PPTX, 끊김 없는 60fps MP4 영상을 동시에 내보냅니다.',
      },
      {
        code: '04 · 16+ HOST BRIDGE',
        title: '익숙한 AI 도구 & 로컬 WYSIWYG 스튜디오',
        desc: 'Claude Code, Codex, Cursor 등과 즉시 연동되며 로컬 스튜디오에서 텍스트를 직접 클릭해 오탈자를 바로잡을 수 있습니다.',
      },
    ],
    galleryHeading: '36가지 파라미터 디자인 템플릿 시스템',
    gallerySub: '인스타그램 카드뉴스, 링크드인 캐러셀, 임원 보고용 PPTX, 숏폼 릴스 완벽 대응',
    familyHeading: 'Aimake 제품 패밀리',
    familySub: '크리에이터와 가족 학습을 위한 로컬 퍼스트 제품 라인업',
    designerLabel: '디자인',
    specLabel: '캔버스 규격',
    deliverablesLabel: '네이티브 출력 포맷',
    footerLine: 'Aimake.cc · 로컬 퍼스트 멀티모달 제작 & LLM 위키 스튜디오 · All Rights Reserved',
  },
};

const PLANET_MATRIX = [
  {
    id: 'brain',
    nameCn: '脑力星球',
    nameEn: 'Brain Planet',
    href: 'https://kids.aimake.cc',
    desc: '每天 10 分钟，点亮专注、记忆、观察、反应与基础逻辑五维星图。',
  },
  {
    id: 'math',
    nameCn: '数学星球',
    nameEn: 'Math Planet',
    href: 'https://math.aimake.cc',
    desc: '游戏化空间逻辑与数感训练，把抽象数学变成看得见、玩得懂的直觉。',
  },
  {
    id: 'create',
    nameCn: '任务工坊',
    nameEn: 'Create Planet',
    href: 'https://create.aimake.cc',
    desc: '面向家长与老师的亲子任务、识字闪卡与魔法绘本一键排版打印工坊。',
  },
  {
    id: 'word',
    nameCn: '单词星球',
    nameEn: 'Word Planet',
    href: 'https://word.aimake.cc',
    desc: '词根词族几何拆解词典，看懂英语构词逻辑而非机械死记硬背。',
  },
  {
    id: 'code',
    nameCn: '编程星球',
    nameEn: 'Code Planet',
    href: 'https://code.aimake.cc',
    desc: '积木式互动小游戏创作，在游戏中建立顺序、条件、循环与调试思维。',
  },
  {
    id: 'ai',
    nameCn: 'AI 素养星球',
    nameEn: 'AI Planet',
    href: 'https://ai.aimake.cc',
    desc: '100% 儿童安全沙盒，学会识别 AI 幻觉、保护个人隐私与负责任提问。',
  },
] as const;

function createSampleDeckForTemplate(tpl: TemplateManifest, lang: SiteLang): DeckDocument {
  const locale = UI_COPY[lang].deckLocale;
  const titles: Record<SiteLang, [string, string]> = {
    zh: ['为什么纯本地 LLM Wiki 是超级个体的护城河', '一套原稿同时交付五种专业介质'],
    en: ['Why Local-First LLM Wikis Compound Creator Leverage', 'One Parametric Deck, Five Native Deliverables'],
    ja: ['ローカル LLM Wiki が個人の発信力を複利で伸ばす理由', '1つの原稿から図解・スライド・動画を同時出力'],
    ko: ['로컬 퍼스트 LLM 위키가 크리에이터의 무기가 되는 이유', '하나의 원고로 카드뉴스·PPTX·영상 동시 완성'],
  };

  const bulletsByLang: Record<SiteLang, string[]> = {
    zh: [
      '自动摄入网页、飞书周报与 Office 文档，索引严控 <= 3,000 tokens',
      '四语种去 AI 套话清洗器 + 个人高频句式 Style DNA 注入',
      '一键直出 3x 高清套图、公众号纯内联 HTML、矢量 PDF、可编辑 PPTX 与 60fps MP4',
    ],
    en: [
      'Ingest URLs, Office docs, and live feeds into raw/ & wiki/',
      'Apply 4-locale Humanizer & personal Style DNA fingerprint',
      'Export Retina PNG, inline HTML, vector PDF, editable PPTX & 60fps MP4',
    ],
    ja: [
      'URL・Office文書をローカルMarkdown知識庫へ自動構造化',
      '厳格な日本語禁則処理と個人文体DNAで不自然なAI表現を排除',
      '高解像度PNG・記事HTML・PDF・編集可能PPTX・60fps動画を一括生成',
    ],
    ko: [
      '웹 문서와 오피스 파일을 로컬 마크다운 위키로 자동 구조화',
      '4개 국어 상투어 정돈 및 Pretendard 어절 단위 줄바꿈 완벽 적용',
      '고해상도 PNG·인라인 HTML·벡터 PDF·편집형 PPTX·60fps 영상 동시 출력',
    ],
  };

  return {
    frontmatter: {
      title: titles[lang][0],
      template: tpl.id,
      locale,
      aspect: tpl.aspect,
      author: tpl.contributor.name,
      handle: tpl.contributor.handle || '@aimake',
      watermark: true,
      fps: 30,
      secondsPerSlide: 3,
      tags: tpl.tags,
    },
    slides: [
      {
        index: 0,
        id: 'sample-cover',
        layout: 'metrics',
        eyebrow: tpl.category.toUpperCase(),
        title: titles[lang][0],
        subtitle: tpl.description[lang],
        bullets: [],
        bodyParagraphs: [],
        metrics: [
          { label: 'Context Saved', value: '95%', delta: 'index.md <= 3000t' },
          { label: 'Cloud Upload', value: '0 KB', delta: '100% Local-First' },
        ],
        cite: 'wiki/index.md#L1',
      },
      {
        index: 1,
        id: 'sample-points',
        layout: 'bullets',
        eyebrow: 'DELIVERABLES',
        title: titles[lang][1],
        bullets: bulletsByLang[lang],
        bodyParagraphs: [],
        metrics: [],
        cite: 'wiki/architecture.md#L18',
      },
    ],
  };
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function verificationMetaTags(): string {
  return [
    `<meta name="google-site-verification" content="${GSC_VERIFICATION.google}" />`,
    `<meta name="yandex-verification" content="${GSC_VERIFICATION.yandex}" />`,
    `<meta name="baidu-site-verification" content="${GSC_VERIFICATION.baidu}" />`,
    `<meta name="msvalidate.01" content="${GSC_VERIFICATION.bing}" />`,
    `<link rel="icon" href="/brand/icon-192.png" sizes="192x192" type="image/png" />`,
    `<link rel="apple-touch-icon" href="/brand/icon-192.png" />`,
  ].join('\n  ');
}

function sharedSiteCss(): string {
  return `
    :root {
      --bg: #0c0f14;
      --surface: #131821;
      --elevated: #1a212e;
      --border: #263042;
      --ink: #f2f5fa;
      --muted: #9ba6b8;
      --cobalt: #3b7bf6;
      --amber: #e29d3e;
      --emerald: #2ec486;
      --mono: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
      --sans: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Hiragino Sans', 'Pretendard', sans-serif;
    }
    * { box-sizing: border-box; }
    html { scroll-behavior: smooth; }
    body { margin: 0; background: var(--bg); color: var(--ink); font-family: var(--sans); line-height: 1.62; -webkit-font-smoothing: antialiased; }
    a { color: inherit; text-decoration: none; }
    a:focus-visible, button:focus-visible { outline: 2px solid var(--amber); outline-offset: 2px; }
    .container { max-width: 1200px; margin: 0 auto; padding: 0 24px; }
    nav.topbar { border-bottom: 1px solid var(--border); padding: 14px 0; background: rgba(12, 15, 20, 0.88); position: sticky; top: 0; z-index: 30; backdrop-filter: blur(12px); }
    .nav-inner { display: flex; justify-content: space-between; align-items: center; gap: 16px; flex-wrap: wrap; }
    .logo { font-weight: 800; font-size: 18px; display: inline-flex; align-items: center; gap: 10px; letter-spacing: -0.02em; }
    .logo-badge { background: linear-gradient(135deg, var(--cobalt), #2454b8); color: #fff; width: 28px; height: 28px; border-radius: 7px; display: inline-flex; align-items: center; justify-content: center; font-family: var(--mono); font-size: 14px; font-weight: 700; box-shadow: 0 0 0 1px rgba(255,255,255,0.14) inset; }
    .logo-sub { font-size: 12px; font-weight: 500; color: var(--muted); padding-left: 8px; border-left: 1px solid var(--border); }
    .nav-links { display: flex; align-items: center; gap: 20px; font-size: 13.5px; color: var(--muted); }
    .nav-links a:hover { color: var(--ink); }
    .lang-switch { display: flex; gap: 6px; font-family: var(--mono); font-size: 11.5px; }
    .lang-switch a { padding: 4px 8px; border-radius: 5px; border: 1px solid var(--border); color: var(--muted); transition: border-color 0.15s, color 0.15s; }
    .lang-switch a:hover { color: var(--ink); border-color: #3c4a63; }
    .lang-switch a.active { border-color: var(--cobalt); color: #fff; background: rgba(59, 123, 246, 0.2); }
    .hero { padding: 64px 0 56px; border-bottom: 1px solid var(--border); background: radial-gradient(circle at 78% 18%, rgba(59, 123, 246, 0.13), transparent 44%); }
    .hero-split { display: grid; grid-template-columns: 1.06fr 0.94fr; gap: 40px; align-items: center; }
    @media (max-width: 980px) { .hero-split { grid-template-columns: 1fr; } .logo-sub { display: none; } }
    .eyebrow { font-family: var(--mono); font-size: 11.5px; color: var(--amber); letter-spacing: 0.08em; text-transform: uppercase; font-weight: 600; }
    .hero h1 { font-size: clamp(30px, 3.8vw, 46px); line-height: 1.15; margin: 14px 0 18px; letter-spacing: -0.028em; font-weight: 800; }
    .hero p.lead { font-size: 16px; color: var(--muted); margin: 0 0 26px; max-width: 620px; }
    .cta-row { display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 24px; }
    .btn-primary { display: inline-flex; align-items: center; gap: 8px; background: var(--cobalt); color: #fff; font-weight: 600; font-size: 14px; padding: 11px 20px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.14); transition: background 0.15s; }
    .btn-primary:hover { background: #2d6ae3; }
    .btn-secondary { display: inline-flex; align-items: center; gap: 8px; background: var(--surface); color: var(--ink); font-weight: 600; font-size: 14px; padding: 11px 18px; border-radius: 8px; border: 1px solid var(--border); transition: border-color 0.15s; }
    .btn-secondary:hover { border-color: var(--cobalt); }
    .spec-strip { display: flex; flex-wrap: wrap; gap: 8px; font-family: var(--mono); font-size: 11.5px; color: #cbd5e1; }
    .spec-pill { background: var(--surface); border: 1px solid var(--border); padding: 5px 10px; border-radius: 6px; }
    .stage-shell { background: var(--surface); border: 1px solid var(--border); border-radius: 14px; overflow: hidden; box-shadow: 0 24px 60px rgba(0, 0, 0, 0.45); }
    .stage-bar { display: flex; justify-content: space-between; align-items: center; gap: 8px; padding: 10px 14px; background: #0e1219; border-bottom: 1px solid var(--border); flex-wrap: wrap; }
    .stage-tabs { display: flex; gap: 6px; flex-wrap: wrap; }
    .stage-tab { background: transparent; border: 1px solid var(--border); color: var(--muted); font-family: var(--mono); font-size: 11px; padding: 5px 9px; border-radius: 5px; cursor: pointer; }
    .stage-tab.active { background: rgba(59, 123, 246, 0.22); color: #fff; border-color: var(--cobalt); }
    .stage-viewport { height: 470px; background: #090b0f; position: relative; }
    .stage-viewport iframe { width: 100%; height: 100%; border: none; display: block; }
    .stage-foot { padding: 9px 14px; font-family: var(--mono); font-size: 11px; color: var(--muted); border-top: 1px solid var(--border); background: #0e1219; }
    .section-block { padding: 64px 0; border-bottom: 1px solid var(--border); }
    .section-head { margin-bottom: 28px; }
    .section-head h2 { font-size: clamp(22px, 2.8vw, 30px); margin: 6px 0 8px; letter-spacing: -0.02em; }
    .section-head p { margin: 0; color: var(--muted); font-size: 15px; max-width: 740px; }
    .pillars-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 18px; }
    .pillar-card { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 22px; }
    .pillar-code { font-family: var(--mono); font-size: 11px; color: var(--amber); margin-bottom: 8px; letter-spacing: 0.05em; }
    .pillar-card h3 { margin: 0 0 8px; font-size: 17px; }
    .pillar-card p { margin: 0; font-size: 13.8px; color: var(--muted); }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 18px; }
    .tpl-card { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 20px; display: flex; flex-direction: column; justify-content: space-between; transition: transform 0.15s, border-color 0.15s; }
    .tpl-card:hover { transform: translateY(-2px); border-color: var(--cobalt); }
    .meta-row { display: flex; justify-content: space-between; font-family: var(--mono); font-size: 11px; color: var(--muted); margin-bottom: 10px; font-variant-numeric: tabular-nums; }
    .tpl-card h3 { margin: 0 0 8px; font-size: 17.5px; }
    .tpl-card p { margin: 0 0 16px; font-size: 13.8px; color: var(--muted); }
    .formats { display: flex; flex-wrap: wrap; gap: 6px; margin-top: auto; }
    .fmt-tag { font-family: var(--mono); font-size: 10.5px; padding: 2px 7px; border-radius: 4px; background: var(--bg); border: 1px solid var(--border); color: #cbd5e1; }
    .family-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 20px; }
    .family-card { background: linear-gradient(180deg, var(--surface), #10141c); border: 1px solid var(--border); border-radius: 14px; padding: 24px; display: flex; flex-direction: column; justify-content: space-between; gap: 16px; }
    .family-badge { display: inline-block; font-family: var(--mono); font-size: 11px; padding: 3px 8px; border-radius: 5px; background: rgba(46, 196, 134, 0.14); color: var(--emerald); border: 1px solid rgba(46, 196, 134, 0.35); width: fit-content; }
    footer { padding: 36px 0 44px; font-size: 13px; color: var(--muted); }
    .footer-inner { display: flex; justify-content: space-between; align-items: center; gap: 16px; flex-wrap: wrap; }
    .footer-links { display: flex; gap: 18px; flex-wrap: wrap; }
    .footer-links a:hover { color: var(--ink); }
    @media (prefers-reduced-motion: reduce) { * { transition: none !important; scroll-behavior: auto !important; } }
  `;
}

function renderTopNav(lang: SiteLang, activeSuffix = ''): string {
  const copy = UI_COPY[lang];
  const langs: SiteLang[] = ['zh', 'en', 'ja', 'ko'];
  return `
  <nav class="topbar">
    <div class="container nav-inner">
      <div style="display:flex;align-items:center;gap:12px;">
        <a class="logo" href="/${lang}/"><span class="logo-badge">A</span><span>Aimake 爱创</span></a>
        <span class="logo-sub">Multimodal Creator &amp; LLM Wiki</span>
      </div>
      <div class="nav-links">
        <a href="/playground/" style="color:#60a5fa;font-weight:600;">🚀 ${esc(copy.navPlayground)}</a>
        <a href="/${lang}/#templates">${esc(copy.navTemplates)}</a>
        <a href="https://studio.aimake.cc" target="_blank" rel="noopener">${esc(copy.navStudio)} ↗</a>
        <a href="/universe/">${esc(copy.navUniverse)}</a>
      </div>
      <div class="lang-switch" aria-label="Language switcher">
        ${langs
          .map(
            (l) =>
              `<a href="/${l}/${activeSuffix}" class="${l === lang ? 'active' : ''}">${l.toUpperCase()}</a>`
          )
          .join('')}
      </div>
    </div>
  </nav>`;
}

function renderLandingHtml(
  lang: SiteLang,
  templates: MarketplaceTemplateEntry[],
  packs: TemplatePack[],
  canonicalUrl: string
): string {
  const copy = UI_COPY[lang];
  const langs: SiteLang[] = ['zh', 'en', 'ja', 'ko'];

  const stagePresets: Array<{ label: string; tplId: string }> = [
    { label: '3:4 小红书 / Social', tplId: 'xhs-swiss-grid' },
    { label: '4:5 LinkedIn PDF', tplId: 'linkedin-exec-carousel' },
    { label: '16:9 図解 / PPTX', tplId: 'x-zukai-quad' },
    { label: '9:16 60fps Video', tplId: 'video-cinema-talk' },
  ];

  const packsHtml = packs
    .map(
      (p) => `
      <div class="pillar-card" style="display:flex;flex-direction:column;justify-content:space-between;gap:12px;">
        <div>
          <div class="pillar-code">${esc(p.id)} · v${esc(p.version)} · ${p.templateIds.length} templates</div>
          <h3>${esc(p.name[lang])}</h3>
          <p>${esc(p.description[lang])}</p>
        </div>
        <div style="font-family:var(--mono);font-size:11.5px;color:#93c5fd;background:var(--bg);padding:8px 10px;border-radius:6px;border:1px solid var(--border);overflow-x:auto;">aimake market install ${esc(p.id)}@${esc(p.version)}</div>
      </div>`
    )
    .join('\n');

  const cardsHtml = templates
    .map(
      (tpl) => `
      <div class="tpl-card" data-market-card="true" data-cat="${esc(tpl.category)}" data-loc="${esc(tpl.defaultLocale)}" data-search="${esc((tpl.id + ' ' + tpl.name.zh + ' ' + tpl.name.en + ' ' + tpl.styleFamily + ' ' + tpl.tags.join(' ')).toLowerCase())}">
        <div>
          <div class="meta-row">
            <span>#${esc(tpl.id)} · v${esc(tpl.version)}</span>
            <span>${esc(tpl.aspect)} · ${esc(tpl.defaultLocale)}</span>
          </div>
          <h3><a href="/${lang}/templates/${tpl.id}/">${esc(tpl.name[lang])}</a></h3>
          <p>${esc(tpl.description[lang])}</p>
        </div>
        <div>
          <div class="formats" style="margin-bottom:12px;">
            <span class="fmt-tag" style="color:var(--amber);border-color:rgba(226,157,62,0.4);">${esc(tpl.styleFamily)}</span>
            ${tpl.supportedFormats.slice(0, 4).map((f) => `<span class="fmt-tag">${esc(f.toUpperCase())}</span>`).join('')}
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            <a class="btn-secondary" style="padding:7px 12px;font-size:12.5px;" href="/${lang}/templates/${tpl.id}/">预览 Preview</a>
            <a class="btn-primary" style="padding:7px 12px;font-size:12.5px;" href="aimake://remix?template=${esc(tpl.id)}">一键做同款 Remix</a>
          </div>
        </div>
      </div>`
    )
    .join('\n');

  const pillarsHtml = copy.pillars
    .map(
      (p) => `
      <div class="pillar-card">
        <div class="pillar-code">${esc(p.code)}</div>
        <h3>${esc(p.title)}</h3>
        <p>${esc(p.desc)}</p>
      </div>`
    )
    .join('\n');

  return `<!DOCTYPE html>
<html lang="${copy.htmlLang}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${esc(copy.heroTitle)} | Aimake 爱创</title>
  <meta name="description" content="${esc(copy.heroSub)}" />
  ${verificationMetaTags()}
  <link rel="canonical" href="${canonicalUrl}" />
  <link rel="alternate" hreflang="x-default" href="https://aimake.cc/" />
  ${langs.map((l) => `<link rel="alternate" hreflang="${UI_COPY[l].htmlLang}" href="https://aimake.cc/${l}/" />`).join('\n  ')}
  <meta property="og:title" content="${esc(copy.heroTitle)} | Aimake" />
  <meta property="og:description" content="${esc(copy.heroSub)}" />
  <meta property="og:url" content="${canonicalUrl}" />
  <meta property="og:site_name" content="Aimake" />
  <meta property="og:type" content="website" />
  <style>${sharedSiteCss()}</style>
</head>
<body>
  ${renderTopNav(lang)}

  <header class="hero">
    <div class="container hero-split">
      <div>
        <div class="eyebrow">${esc(copy.heroTag)}</div>
        <h1>${esc(copy.heroTitle)}</h1>
        <p class="lead">${esc(copy.heroSub)}</p>
        <div class="cta-row">
          <a class="btn-primary" href="/playground/">${esc(copy.primaryCta)} →</a>
          <a class="btn-secondary" href="#templates">${esc(copy.secondaryCta)}</a>
        </div>
        <div class="spec-strip">
          <span class="spec-pill">3x Retina PNG</span>
          <span class="spec-pill">WeChat Inline HTML</span>
          <span class="spec-pill">Vector PDF</span>
          <span class="spec-pill">Editable OOXML .pptx</span>
          <span class="spec-pill">60fps H.264 .mp4</span>
        </div>
      </div>

      <div class="stage-shell" aria-label="Interactive compiler stage">
        <div class="stage-bar">
          <div class="stage-tabs" role="tablist">
            ${stagePresets
              .map(
                (preset, idx) =>
                  `<button type="button" class="stage-tab ${idx === 0 ? 'active' : ''}" data-src="/${lang}/templates/${preset.tplId}/preview.html">${esc(preset.label)}</button>`
              )
              .join('')}
          </div>
        </div>
        <div class="stage-viewport">
          <iframe id="hero-stage-frame" src="/${lang}/templates/${stagePresets[0].tplId}/preview.html" title="Aimake live template preview" loading="eager"></iframe>
        </div>
        <div class="stage-foot">${esc(copy.stageCaption)}</div>
      </div>
    </div>
  </header>

  <section class="section-block">
    <div class="container">
      <div class="section-head">
        <div class="eyebrow">ARCHITECTURE</div>
        <h2>${esc(copy.pillarsHeading)}</h2>
      </div>
      <div class="pillars-grid">${pillarsHtml}</div>
    </div>
  </section>

  <section id="templates" class="section-block">
    <div class="container">
      <div class="section-head">
        <div class="eyebrow">TEMPLATE MARKETPLACE &amp; ONE-CLICK REMIX</div>
        <h2>${esc(copy.galleryHeading)}</h2>
        <p>${esc(copy.gallerySub)}</p>
      </div>
      <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin-bottom:20px;">
        <input id="site-market-search" type="search" placeholder="搜索模板风格 / 平台 / 语种 (Search 36 templates)..." style="flex:1;min-width:240px;background:var(--surface);color:var(--ink);border:1px solid var(--border);border-radius:8px;padding:10px 14px;font-size:14px;" />
        <div style="display:flex;gap:6px;flex-wrap:wrap;" id="site-market-filters">
          <button type="button" class="stage-tab active" data-filter-cat="all">All (22)</button>
          <button type="button" class="stage-tab" data-filter-cat="xiaohongshu">小红书</button>
          <button type="button" class="stage-tab" data-filter-cat="wechat">微信</button>
          <button type="button" class="stage-tab" data-filter-cat="linkedin">EN/Global</button>
          <button type="button" class="stage-tab" data-filter-cat="x-japan">日本 JA</button>
          <button type="button" class="stage-tab" data-filter-cat="instagram-kr">韩国 KO</button>
          <button type="button" class="stage-tab" data-filter-cat="ppt">PPT 16:9</button>
          <button type="button" class="stage-tab" data-filter-cat="education">教育</button>
          <button type="button" class="stage-tab" data-filter-cat="video">短视频</button>
        </div>
      </div>
      <div class="grid" id="site-market-grid">${cardsHtml}</div>
      <div style="margin-top:42px;">
        <div class="eyebrow" style="margin-bottom:12px;">VERSIONED INDUSTRY PACKS (SHA-256 VERIFIED)</div>
        <div class="pillars-grid">${packsHtml}</div>
      </div>
    </div>
  </section>

  <section id="ecosystem" class="section-block">
    <div class="container">
      <div class="section-head">
        <div class="eyebrow">AIMAKE ECOSYSTEM</div>
        <h2>${esc(copy.familyHeading)}</h2>
        <p>${esc(copy.familySub)}</p>
      </div>
      <div class="family-grid">
        <div class="family-card">
          <div>
            <span class="family-badge">FLAGSHIP · aimake.cc</span>
            <h3 style="margin:12px 0 8px;font-size:20px;">Aimake 爱创 · 多模态创作与知识复利平台</h3>
            <p style="margin:0;color:var(--muted);font-size:14px;">连接本地 Karpathy LLM Wiki、个人风格基因与 12 套四国商业设计系统，在 Claude Code / Codex / WorkBuddy 内一键交付图文、公众号、可编辑 PPTX 与短视频。</p>
          </div>
          <a class="btn-secondary" style="width:fit-content;" href="#templates">${esc(copy.primaryCta)} →</a>
        </div>

        <div class="family-card">
          <div>
            <span class="family-badge">AUDIO &amp; VIDEO · studio.aimake.cc</span>
            <h3 style="margin:12px 0 8px;font-size:20px;">Aimake Studio · 爱创声画</h3>
            <p style="margin:0;color:var(--muted);font-size:14px;">面向发布视频、播客与多语言配音的智能音视频审阅专线。支持可追溯事实抽取、逐场景配音修订与本地确定性合成。</p>
          </div>
          <a class="btn-secondary" style="width:fit-content;" href="https://studio.aimake.cc" target="_blank" rel="noopener">前往 studio.aimake.cc ↗</a>
        </div>

        <div class="family-card">
          <div>
            <span class="family-badge">FAMILY LEARNING · universe.aimake.cc</span>
            <h3 style="margin:12px 0 8px;font-size:20px;">Aimake Universe · 爱创星球矩阵</h3>
            <p style="margin:0;color:var(--muted);font-size:14px;">零广告、免登录、100% 本地优先的儿童跨学科探索生态，涵盖脑力、数学、任务工坊、单词、编程与 AI 素养六大独立星球。</p>
          </div>
          <div style="display:flex;gap:10px;flex-wrap:wrap;">
            <a class="btn-secondary" style="width:fit-content;" href="/universe/">进入星球矩阵导航 →</a>
            <a class="btn-secondary" style="width:fit-content;" href="https://universe.aimake.cc">universe.aimake.cc ↗</a>
          </div>
        </div>
      </div>
    </div>
  </section>

  <footer>
    <div class="container footer-inner">
      <div>${esc(copy.footerLine)}</div>
      <div class="footer-links">
        <a href="/zh/">简体中文</a>
        <a href="/en/">English</a>
        <a href="/ja/">日本語</a>
        <a href="/ko/">한국어</a>
        <a href="https://studio.aimake.cc">爱创声画</a>
        <a href="/universe/">爱创星球</a>
      </div>
    </div>
  </footer>

  <script>
    (function () {
      var tabs = document.querySelectorAll('.stage-tab');
      var frame = document.getElementById('hero-stage-frame');
      if (!frame) return;
      tabs.forEach(function (btn) {
        btn.addEventListener('click', function () {
          tabs.forEach(function (b) { b.classList.remove('active'); });
          btn.classList.add('active');
          var nextSrc = btn.getAttribute('data-src');
          if (nextSrc && frame.getAttribute('src') !== nextSrc) {
            frame.setAttribute('src', nextSrc);
          }
        });
      });

      var searchEl = document.getElementById('site-market-search');
      var filterBtns = document.querySelectorAll('[data-filter-cat]');
      var cards = document.querySelectorAll('[data-market-card]');
      var activeCat = 'all';
      function applyMarketFilter() {
        var q = searchEl ? searchEl.value.trim().toLowerCase() : '';
        cards.forEach(function (card) {
          var cat = card.getAttribute('data-cat') || '';
          var hay = card.getAttribute('data-search') || '';
          var okCat = activeCat === 'all' || cat === activeCat;
          var okQ = !q || hay.indexOf(q) !== -1;
          card.style.display = okCat && okQ ? 'flex' : 'none';
        });
      }
      if (searchEl) searchEl.addEventListener('input', applyMarketFilter);
      filterBtns.forEach(function (btn) {
        btn.addEventListener('click', function () {
          filterBtns.forEach(function (b) { b.classList.remove('active'); });
          btn.classList.add('active');
          activeCat = btn.getAttribute('data-filter-cat') || 'all';
          applyMarketFilter();
        });
      });
    })();
  </script>
</body>
</html>`;
}

function renderUniverseBridgeHtml(): string {
  const planetCards = PLANET_MATRIX.map(
    (p) => `
      <a class="tpl-card" href="${p.href}" target="_blank" rel="noopener">
        <div>
          <div class="meta-row">
            <span>${esc(p.nameEn.toUpperCase())}</span>
            <span>LIVE · ${esc(p.href.replace('https://', ''))}</span>
          </div>
          <h3>${esc(p.nameCn)}</h3>
          <p>${esc(p.desc)}</p>
        </div>
        <div class="formats">
          <span class="fmt-tag">NO ADS</span>
          <span class="fmt-tag">NO LOGIN</span>
          <span class="fmt-tag">LOCAL-FIRST</span>
        </div>
      </a>`
  ).join('\n');

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Aimake Universe 爱创星球矩阵 | Aimake 爱创</title>
  <meta name="description" content="纯净、零广告、免登录、本地优先的儿童跨学科探索生态：脑力、数学、任务工坊、单词、编程与 AI 素养六大星球。" />
  ${verificationMetaTags()}
  <link rel="canonical" href="https://universe.aimake.cc/" />
  <style>${sharedSiteCss()}</style>
</head>
<body>
  ${renderTopNav('zh')}
  <header class="hero">
    <div class="container">
      <div class="eyebrow">AIMAKE UNIVERSE · 家庭与儿童跨学科探索生态</div>
      <h1>爱创星球矩阵已独立迁至 universe.aimake.cc</h1>
      <p class="lead">Aimake 主站（aimake.cc）现已升级为多模态创作与知识复利旗舰平台；面向孩子与家庭的「爱创星球」六大互动星球保持 100% 独立运行、零广告、免登录，可直接从下方一键进入。</p>
      <div class="cta-row">
        <a class="btn-primary" href="https://create.aimake.cc">开始一次亲子任务（create.aimake.cc） →</a>
        <a class="btn-secondary" href="https://universe.aimake.cc">打开爱创星球门户（universe.aimake.cc） ↗</a>
        <a class="btn-secondary" href="/dashboard/">家长学习回看</a>
      </div>
    </div>
  </header>
  <section class="section-block">
    <div class="container">
      <div class="section-head">
        <div class="eyebrow">6 LIVE PLANETS</div>
        <h2>六大核心探索星球直达入口</h2>
        <p>每颗星球均独立部署在专属二级域名，数据默认保存在本机浏览器中。</p>
      </div>
      <div class="grid">${planetCards}</div>
    </div>
  </section>
  <footer>
    <div class="container footer-inner">
      <div>Aimake Universe 爱创星球 · No Ads · No Login · Local-First</div>
      <div class="footer-links">
        <a href="/">返回 Aimake 创作主站</a>
        <a href="https://studio.aimake.cc">爱创声画 Studio</a>
      </div>
    </div>
  </footer>
</body>
</html>`;
}

function renderDashboardBridgeHtml(): string {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>家长学习回看迁移指引 | Aimake Universe 爱创星球</title>
  ${verificationMetaTags()}
  <link rel="canonical" href="https://universe.aimake.cc/dashboard" />
  <style>${sharedSiteCss()}</style>
</head>
<body>
  ${renderTopNav('zh')}
  <main class="section-block">
    <div class="container" style="max-width:760px;">
      <div class="eyebrow">PARENT DASHBOARD · 爱创星球</div>
      <h1 style="font-size:32px;margin:12px 0 16px;">家长回看已随爱创星球迁至独立子站</h1>
      <p style="color:var(--muted);margin-bottom:24px;">为了将创作者工作台（aimake.cc）与家庭学习空间彻底解耦，家长学习记录回看现由爱创星球独立门户承载，数据仍保存在您当前浏览器的本地存储中。</p>
      <div class="cta-row">
        <a class="btn-primary" id="universe-dash-link" href="https://universe.aimake.cc/dashboard">前往 universe.aimake.cc/dashboard →</a>
        <a class="btn-secondary" href="https://aimake-home.vercel.app/dashboard">备用直达入口 ↗</a>
        <a class="btn-secondary" href="/universe/">查看六大星球</a>
      </div>
    </div>
  </main>
</body>
</html>`;
}

export async function buildStaticSite(outDir: string): Promise<{
  pagesWritten: number;
  sitemapUrlCount: number;
}> {
  const catalog = await listMarketplaceCatalog();
  const templates = catalog.templates;
  const packs = catalog.packs;
  const langs: SiteLang[] = ['zh', 'en', 'ja', 'ko'];
  await fs.mkdir(outDir, { recursive: true });
  await fs.mkdir(path.join(outDir, 'brand'), { recursive: true });

  // Copy Aimake brand icon if present in sibling aimake-home, otherwise generate clean SVG icon fallback
  const siblingIcon = path.resolve(
    outDir,
    '../../../aimake-labs/aimake-home/public/brand/icon-192.png'
  );
  try {
    await fs.copyFile(siblingIcon, path.join(outDir, 'brand', 'icon-192.png'));
  } catch {
    // Fallback minimal valid 1x1 PNG if built outside full workspace
    const minimalPng = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    );
    await fs.writeFile(path.join(outDir, 'brand', 'icon-192.png'), minimalPng);
  }

  const urls: string[] = [
    'https://aimake.cc/',
    'https://aimake.cc/universe/',
    'https://aimake.cc/playground/',
    'https://aimake.cc/studio/',
  ];
  let pagesWritten = 0;

  // Generate interactive Web Studio & Playground
  const playgroundHtml = await buildWebPlaygroundHtml(templates, PACKAGE_ROOT);
  const playgroundDir = path.join(outDir, 'playground');
  await fs.mkdir(playgroundDir, { recursive: true });
  await fs.writeFile(path.join(playgroundDir, 'index.html'), playgroundHtml, 'utf8');
  pagesWritten++;

  const studioDir = path.join(outDir, 'studio');
  await fs.mkdir(studioDir, { recursive: true });
  await fs.writeFile(path.join(studioDir, 'index.html'), playgroundHtml, 'utf8');
  pagesWritten++;

  for (const lang of langs) {
    const copy = UI_COPY[lang];
    const langDir = path.join(outDir, lang);
    await fs.mkdir(path.join(langDir, 'templates'), { recursive: true });

    const indexHtml = renderLandingHtml(lang, templates, packs, `https://aimake.cc/${lang}/`);
    await fs.writeFile(path.join(langDir, 'index.html'), indexHtml, 'utf8');
    urls.push(`https://aimake.cc/${lang}/`);
    pagesWritten++;

    if (lang === 'zh') {
      const rootHtml = renderLandingHtml('zh', templates, packs, 'https://aimake.cc/');
      await fs.writeFile(path.join(outDir, 'index.html'), rootHtml, 'utf8');
      pagesWritten++;
    }

    for (const tpl of templates) {
      const tplSlugDir = path.join(langDir, 'templates', tpl.id);
      await fs.mkdir(tplSlugDir, { recursive: true });

      const sampleDeck = createSampleDeckForTemplate(tpl, lang);
      const { html: previewDoc } = await compileDeckToHtml(sampleDeck, { editable: false });
      await fs.writeFile(path.join(tplSlugDir, 'preview.html'), previewDoc, 'utf8');

      const seoPage = `<!DOCTYPE html>
<html lang="${copy.htmlLang}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${esc(tpl.name[lang])} — Aimake #${esc(tpl.id)}</title>
  <meta name="description" content="${esc(tpl.description[lang])}" />
  ${verificationMetaTags()}
  <link rel="canonical" href="https://aimake.cc/${lang}/templates/${tpl.id}/" />
  ${langs.map((l) => `<link rel="alternate" hreflang="${UI_COPY[l].htmlLang}" href="https://aimake.cc/${l}/templates/${tpl.id}/" />`).join('\n  ')}
  <style>${sharedSiteCss()}
    .detail-layout { display: grid; grid-template-columns: 1fr 360px; gap: 28px; padding: 36px 0 72px; }
    @media (max-width: 900px) { .detail-layout { grid-template-columns: 1fr; } }
    .preview-box { background: #090b0f; border: 1px solid var(--border); border-radius: 12px; overflow: hidden; height: 680px; }
    .preview-box iframe { width: 100%; height: 100%; border: none; }
    .info-panel { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 24px; height: fit-content; }
  </style>
</head>
<body>
  ${renderTopNav(lang, `templates/${tpl.id}/`)}
  <main class="container detail-layout">
    <div class="preview-box">
      <iframe src="./preview.html" title="${esc(tpl.name[lang])}"></iframe>
    </div>
    <aside class="info-panel">
      <div class="eyebrow">#${esc(tpl.id)} · ${esc(tpl.aspect)}</div>
      <h1 style="font-size:24px;margin:10px 0 12px;">${esc(tpl.name[lang])}</h1>
      <p style="color:var(--muted);font-size:14.5px;">${esc(tpl.description[lang])}</p>
      <div style="margin-top:20px;padding-top:16px;border-top:1px solid var(--border);">
        <div style="font-size:12px;color:var(--muted);margin-bottom:8px;">${esc(copy.specLabel)}</div>
        <div style="font-family:var(--mono);font-size:13px;">${tpl.width} × ${tpl.height}px (${esc(tpl.aspect)})</div>
      </div>
      <div style="margin-top:18px;padding-top:16px;border-top:1px solid var(--border);">
        <div style="font-size:12px;color:var(--muted);margin-bottom:8px;">${esc(copy.deliverablesLabel)}</div>
        <div class="formats">
          ${tpl.supportedFormats.map((f) => `<span class="fmt-tag">${esc(f.toUpperCase())}</span>`).join('')}
        </div>
      </div>
      <div style="margin-top:20px;padding-top:16px;border-top:1px solid var(--border);font-size:13px;">
        <span style="color:var(--muted);">${esc(copy.designerLabel)}:</span>
        <strong> ${esc(tpl.contributor.name)}</strong>
        <span style="color:var(--muted);font-family:var(--mono);font-size:11px;"> · v${esc(tpl.version)}</span>
      </div>
      <div style="margin-top:16px;display:flex;flex-direction:column;gap:8px;">
        <a class="btn-primary" style="width:100%;justify-content:center;" href="aimake://remix?template=${esc(tpl.id)}">一键做同款（Aimake 桌面端打开） →</a>
        <pre style="margin:0;background:var(--bg);padding:10px;border-radius:8px;border:1px solid var(--border);overflow-x:auto;font-family:var(--mono);font-size:11.5px;color:#93c5fd;">aimake remix ${esc(tpl.id)} --deck my.deck.md</pre>
        <a class="btn-secondary" style="width:100%;justify-content:center;" href="/${lang}/#templates">← ${esc(copy.navTemplates)}</a>
      </div>
    </aside>
  </main>
</body>
</html>`;

      await fs.writeFile(path.join(tplSlugDir, 'index.html'), seoPage, 'utf8');
      urls.push(`https://aimake.cc/${lang}/templates/${tpl.id}/`);
      pagesWritten += 2;
    }
  }

  // Write legacy continuity routes: /universe/ and /dashboard/
  await fs.mkdir(path.join(outDir, 'universe'), { recursive: true });
  await fs.writeFile(path.join(outDir, 'universe', 'index.html'), renderUniverseBridgeHtml(), 'utf8');
  pagesWritten++;

  await fs.mkdir(path.join(outDir, 'dashboard'), { recursive: true });
  await fs.writeFile(path.join(outDir, 'dashboard', 'index.html'), renderDashboardBridgeHtml(), 'utf8');
  pagesWritten++;

  const sitemapXml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls.map((u) => `  <url><loc>${u}</loc></url>`),
    '</urlset>',
    '',
  ].join('\n');
  await fs.writeFile(path.join(outDir, 'sitemap.xml'), sitemapXml, 'utf8');
  await fs.writeFile(
    path.join(outDir, 'robots.txt'),
    'User-agent: *\nAllow: /\nSitemap: https://aimake.cc/sitemap.xml\n',
    'utf8'
  );
  await fs.writeFile(
    path.join(outDir, 'vercel.json'),
    JSON.stringify(
      {
        cleanUrls: true,
        trailingSlash: true,
        headers: [
          {
            source: '/(.*)',
            headers: [
              { key: 'X-Content-Type-Options', value: 'nosniff' },
              { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
            ],
          },
        ],
      },
      null,
      2
    ),
    'utf8'
  );

  return { pagesWritten, sitemapUrlCount: urls.length };
}
