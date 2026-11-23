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

interface BentoItem {
  stage: string;
  title: string;
  desc: string;
  tag: string;
  badge: string;
  type: 'wide' | 'tall' | 'normal';
  details: string[];
}

interface TerminalScenario {
  id: string;
  label: string;
  cmd: string;
  desc: string;
  output: string;
}

interface LangCopy {
  htmlLang: string;
  deckLocale: SupportedLocale;
  navPlayground: string;
  navFlywheel: string;
  navTemplates: string;
  navCli: string;
  navStudio: string;
  navUniverse: string;
  heroTag: string;
  heroTitle: string;
  heroSub: string;
  primaryCta: string;
  secondaryCta: string;
  quickInstall: string;
  cliCopyNotice: string;
  stageCaption: string;
  flywheelHeading: string;
  flywheelSub: string;
  bentoItems: BentoItem[];
  terminalHeading: string;
  terminalSub: string;
  terminalScenarios: TerminalScenario[];
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
    navFlywheel: '创作飞轮',
    navTemplates: '36 套设计模板',
    navCli: '终端 & MCP',
    navStudio: '爱创工坊 Studio',
    navUniverse: '爱创星球 Universe',
    heroTag: 'LOCAL-FIRST · 零后端隐私架构 · 兼容 16+ AI 助手',
    heroTitle: '把每一次深度思考，编译成五种专业介质的复利资产',
    heroSub:
      'Aimake（爱创）将本地 Karpathy LLM Wiki 知识库、四语种个人风格基因（Style DNA）与确定性排版编译核融为一体。写好一份 .deck.md 原稿，同步直出小红书 3x 高清套图、微信公众号 100% 内联富文本、矢量 PDF、原生可编辑 .pptx 与 60fps 动画短视频。',
    primaryCta: '🚀 网页版在线体验 (免安装)',
    secondaryCta: '浏览 36 套设计系统与同款',
    quickInstall: 'npm i -g @aimake/cli',
    cliCopyNotice: '已复制终端命令至剪贴板',
    stageCaption: '确定性排版编译舞台 · 点击上方介质标签实时切换同一原稿的多端渲染画布',
    flywheelHeading: '端到端创作飞轮 · 四步完成知识沉淀与全域分发',
    flywheelSub:
      '从零碎素材摄入，到 Karpathy LLM Wiki 深度萃取，再到参数化排版与全渠道一键直发，每一步都 100% 运行在本机。',
    bentoItems: [
      {
        stage: 'STAGE 01 · 零损耗全域摄入',
        title: 'X推文、微信长文、表格与音视频字幕，一键入库为纯净 Markdown',
        desc: '支持零凭证提取 X (Twitter) 推文与互动指标、清洗微信公众号防盗链文章、解析 CSV/Excel 表格提炼 Bento 卡片指标，以及聚类带时间戳的音视频字幕，原汁原味留存事实论据至 sources/。',
        tag: 'UNIVERSAL INTAKE',
        badge: '0 凭证 · 格式全保真',
        type: 'wide',
        details: [
          'X (Twitter) 零凭证指标提取',
          '微信 / 知乎 / 网页深度清洗',
          'CSV 表格提取 Bento 卡片指标',
          '音视频字幕 (VTT/SRT) 智能聚类',
        ],
      },
      {
        stage: 'STAGE 02 · 知识复利',
        title: '严格控限 <= 3,000 Token 的永久记忆网络',
        desc: '基于 Karpathy LLM Wiki 架构，每篇笔记提炼为高密度概念卡，按索引预算常驻上下文，让 AI 越创作越懂你的领域黑话与深度认知。',
        tag: 'WIKI COMPLIANCE',
        badge: '95% 上下文节省',
        type: 'tall',
        details: ['index.md <= 3,000 Tokens 预算', '概念卡与实体关系图谱', '严格标注事实来源坐标 cite'],
      },
      {
        stage: 'STAGE 03 · 确定性编译',
        title: '写一份 .deck.md，同步直出五种原生商业交付物',
        desc: '告别重复搬运排版：PPTX 是原生双击可编辑的微软 OOXML 文本框，公众号是 100% 纯内联样式无外部依赖，视频采用精准帧级语音字幕对齐。',
        tag: 'PARAMETRIC COMPILER',
        badge: '1 原稿 · 5 原生介质',
        type: 'wide',
        details: [
          '3x 高清小红书社交套图',
          '公众号 100% 内联富文本',
          '微软 Office 双击可编辑 PPTX',
          '60fps H.264 逐帧语音视频',
        ],
      },
      {
        stage: 'STAGE 04 · 全渠道直达',
        title: '一键发布至微信公众号、小红书、知乎与掘金',
        desc: '内置微信草稿箱、小红书网页同步与开源跨平台发布适配器，发布记录自动写回 wiki/published.md，闭环创作者成长飞轮。',
        tag: 'OMNI-CHANNEL PUBLISH',
        badge: '多端协同',
        type: 'normal',
        details: ['WeChat 公众号草稿箱', '小红书社交图文矩阵', '知乎 / 掘金 Markdown 同步'],
      },
      {
        stage: 'PRIVACY · 绝对安全',
        title: '0 云端数据回传 · 100% 数据留存本机',
        desc: '本地 127.0.0.1 闭环运行，兼容 Ollama、LM Studio 等私有化本地权重；任何 API Key 仅存留在本机配置文件中，断网亦可全功能编译。',
        tag: 'ZERO-CLOUD PRIVACY',
        badge: '100% 本地优先',
        type: 'normal',
        details: ['零外部服务器依赖', '断网全功能离线编译', '私有 Ollama / LM Studio 即插即用'],
      },
    ],
    terminalHeading: '极简终端命令与 MCP 协议 · 无缝集成 16+ AI 助手',
    terminalSub:
      '只需一行命令，即可在终端快速初始化工作区、排版作品、一键全渠道发布，或作为 MCP Server 接入 Claude Code、OpenAI Codex 与 AGY。',
    terminalScenarios: [
      {
        id: 'init',
        label: '1. 初始化工作区',
        cmd: 'aimake init my-workspace --scenario creator-growth',
        desc: '在本地新建包含 7 大预设 Skill（零软链接污染）、Karpathy Wiki 骨架与示例原稿的独立创作工作区。',
        output: `✔ Created local workspace at ./my-workspace
✔ Materialized 7 preset skills (0 symlinks) into .agents/skills/
✔ Initialized Karpathy LLM Wiki skeleton in wiki/
✔ Generated starter storyboard in decks/welcome.deck.md
🎉 Done! Run 'cd my-workspace && aimake studio' to open canvas.`,
      },
      {
        id: 'compose',
        label: '2. 创作与排版',
        cmd: 'aimake compose decks/growth.deck.md --template xhs-swiss-grid',
        desc: '根据 Markdown 原稿与选定视觉风格，在 80ms 内极速编译出 3x Retina PNG、公众号富文本与可编辑 PPTX。',
        output: `✔ Parsed decks/growth.deck.md (4 slides, 16:9 aspect)
✔ Applied 4-locale Humanizer (0 AI clichés detected)
✔ Compiled Retina PNG: exports/growth-01.png ~ exports/growth-04.png
✔ Generated WeChat Inline HTML: exports/growth-wechat.html
✔ Built Native PowerPoint: exports/growth.pptx (real editable OOXML text)`,
      },
      {
        id: 'publish',
        label: '3. 全渠道分发',
        cmd: 'aimake publish decks/growth.deck.md --channel all --dry-run',
        desc: '一键将排版成品推送到微信公众号草稿箱、小红书与知乎，并把发布记录回写到 wiki/published.md。',
        output: `[WeChat] Rendering inline HTML & uploading covers... Done (MediaId: wx_8f912a)
[Xiaohongshu] Packaging 4-card 3:4 carousel... Ready for browser sync
[Zhihu] Formatted column article with citations... Synced
✔ Appended publishing record to wiki/published.md (Compound leverage +1)`,
      },
      {
        id: 'mcp',
        label: '4. 启动 MCP 协议',
        cmd: 'aimake mcp',
        desc: '启动独立 Model Context Protocol 服务，为 Claude Code、OpenAI Codex 与 Cursor 提供本地编译与排版工具。',
        output: `[aimake-mcp] Server initialized on stdio (JSON-RPC 2.0)
[aimake-mcp] Registered 16 atomic tools: aimake_intake_source,
             aimake_pipeline_inspect, aimake_publish_content,
             aimake_remix_deck, aimake_render_deck, aimake_stage_focus...
[aimake-mcp] Ready to receive host requests from Claude / Cursor / AGY / WorkBuddy.`,
      },
    ],
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
    navFlywheel: 'Flywheel',
    navTemplates: '36 Design Systems',
    navCli: 'CLI & MCP',
    navStudio: 'Aimake Studio',
    navUniverse: 'Aimake Universe',
    heroTag: 'LOCAL-FIRST · ZERO-BACKEND PRIVACY · WORKS WITH 16+ AI AGENTS',
    heroTitle: 'Compile raw notes into five publication-grade deliverables',
    heroSub:
      'Aimake unites a compounding Karpathy LLM Wiki, a 4-locale anti-slop Style DNA engine, and a deterministic layout compiler. Author one plain-Markdown .deck.md storyboard and output 3x Retina social cards, inline newsletter HTML, vector PDF carousels, native editable PowerPoint (.pptx), and 60fps MP4 reels.',
    primaryCta: '🚀 Try Live Web Playground (No Install)',
    secondaryCta: 'Explore 36 Design Systems',
    quickInstall: 'npm i -g @aimake/cli',
    cliCopyNotice: 'Command copied to clipboard',
    stageCaption: 'Deterministic layout compiler stage · Switch tabs to inspect real parametric HTML outputs',
    flywheelHeading: 'The 4-Stage Creative Flywheel: From Raw Notes to Omni-Channel Assets',
    flywheelSub:
      'Intake research, distill structured Karpathy LLM Wikis, author parametric storyboards, and publish across channels with 100% local privacy.',
    bentoItems: [
      {
        stage: 'STAGE 01 · LOSSLESS INTAKE',
        title: 'Ingest X posts, articles, spreadsheets & transcripts into clean Markdown',
        desc: 'Zero-auth ingestion for X (Twitter) status and engagement metrics, WeChat anti-hotlink normalization, CSV/Excel Bento metric extraction, and timestamp-cleaned VTT/SRT transcripts directly into sources/.',
        tag: 'UNIVERSAL INTAKE',
        badge: 'Zero Clutter · Zero-Key',
        type: 'wide',
        details: [
          'X (Twitter) Zero-Auth Extraction',
          'WeChat & Web Article Cleaner',
          'CSV Spreadsheets to Bento Metrics',
          'VTT/SRT Transcript Clustering',
        ],
      },
      {
        stage: 'STAGE 02 · KNOWLEDGE LEVERAGE',
        title: 'Strictly bounded <= 3,000-token index memory network',
        desc: 'Compacting your knowledge into dense Karpathy concept cards that stay inside the LLM prompt budget without forgetting past insights.',
        tag: 'WIKI COMPLIANCE',
        badge: '95% Context Saved',
        type: 'tall',
        details: ['index.md <= 3,000 Token Cap', 'Concept & Entity Graph', 'Strict Source Citations (cite:)'],
      },
      {
        stage: 'STAGE 03 · DETERMINISTIC COMPILE',
        title: 'Write one .deck.md, generate five commercial native formats',
        desc: 'No blurry screenshots: PowerPoint exports are genuine editable OOXML text boxes, newsletters are 100% inline HTML, and video is synced per frame.',
        tag: 'PARAMETRIC COMPILER',
        badge: '1 Source · 5 Formats',
        type: 'wide',
        details: [
          '3x Retina PNG Social Cards',
          '100% Inline CSS Newsletter HTML',
          'Native Editable PowerPoint (.pptx)',
          '60fps H.264 Narrated Video',
        ],
      },
      {
        stage: 'STAGE 04 · OMNI-CHANNEL REACH',
        title: 'One-click publish to social feeds, newsletters, and slides',
        desc: 'Built-in multi-platform publishing adapters sync finished drafts and record publication milestones back into wiki/published.md.',
        tag: 'OMNI-CHANNEL PUBLISH',
        badge: 'Multi-Target',
        type: 'normal',
        details: ['Social Carousel Exports', 'Inline Newsletter Drafts', 'Compounded Publishing Log'],
      },
      {
        stage: 'PRIVACY · ZERO-CLOUD',
        title: '0 Cloud Telemetry · 100% Data Stays on Your Machine',
        desc: 'Runs completely on 127.0.0.1. Works with local Ollama or LM Studio models. API keys never leave your device, working offline seamlessly.',
        tag: 'ZERO-CLOUD PRIVACY',
        badge: '100% Local-First',
        type: 'normal',
        details: ['Zero External Cloud Servers', 'Full Offline Compile Support', 'Private Local LLMs Supported'],
      },
    ],
    terminalHeading: 'Minimal CLI & Standalone MCP Server for 16+ AI Hosts',
    terminalSub:
      'Initialize isolated workspaces, compile decks, and multi-publish in one command — or bridge natively with Claude Code, OpenAI Codex, and Cursor.',
    terminalScenarios: [
      {
        id: 'init',
        label: '1. Initialize Workspace',
        cmd: 'aimake init my-workspace --scenario creator-growth',
        desc: 'Scaffolds an isolated local workspace with 7 materialized preset skills (zero symlinks), Karpathy Wiki, and a starter storyboard.',
        output: `✔ Created local workspace at ./my-workspace
✔ Materialized 7 preset skills (0 symlinks) into .agents/skills/
✔ Initialized Karpathy LLM Wiki skeleton in wiki/
✔ Generated starter storyboard in decks/welcome.deck.md
🎉 Done! Run 'cd my-workspace && aimake studio' to open canvas.`,
      },
      {
        id: 'compose',
        label: '2. Compose & Compile',
        cmd: 'aimake compose decks/growth.deck.md --template xhs-swiss-grid',
        desc: 'Compiles your Markdown deck into 3x Retina PNGs, newsletter HTML, and native PowerPoint in under 80ms.',
        output: `✔ Parsed decks/growth.deck.md (4 slides, 16:9 aspect)
✔ Applied 4-locale Humanizer (0 AI clichés detected)
✔ Compiled Retina PNG: exports/growth-01.png ~ exports/growth-04.png
✔ Generated WeChat Inline HTML: exports/growth-wechat.html
✔ Built Native PowerPoint: exports/growth.pptx (real editable OOXML text)`,
      },
      {
        id: 'publish',
        label: '3. Multi-Channel Publish',
        cmd: 'aimake publish decks/growth.deck.md --channel all --dry-run',
        desc: 'One-click multi-platform publisher that updates drafts and logs history back to wiki/published.md.',
        output: `[WeChat] Rendering inline HTML & uploading covers... Done
[Xiaohongshu] Packaging 4-card 3:4 carousel... Ready for sync
[Zhihu] Formatted column article with citations... Synced
✔ Appended publishing record to wiki/published.md (Compound leverage +1)`,
      },
      {
        id: 'mcp',
        label: '4. Standalone MCP Server',
        cmd: 'aimake mcp',
        desc: 'Starts a standard Model Context Protocol server exposing compiler, humanizer, and publishing tools to your AI agent.',
        output: `[aimake-mcp] Server initialized on stdio (JSON-RPC 2.0)
[aimake-mcp] Registered 16 atomic tools: aimake_intake_source,
             aimake_pipeline_inspect, aimake_publish_content,
             aimake_remix_deck, aimake_render_deck, aimake_stage_focus...
[aimake-mcp] Ready to receive host requests from Claude / Cursor / AGY / WorkBuddy.`,
      },
    ],
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
    navFlywheel: '制作フライホイール',
    navTemplates: '36 種デザインシステム',
    navCli: 'CLI & MCP',
    navStudio: 'Aimake Studio',
    navUniverse: 'Aimake Universe',
    heroTag: 'ローカルファースト · サーバー不要 · 16以上のAIエージェント対応',
    heroTitle: '日々の知見を、5つのプロ品質メディアへ一括コンパイル',
    heroSub:
      'Aimakeは、知識が複利で増えるKarpathy式LLM Wiki、AI臭さを消す文体DNAエンジン、厳格な日本語禁則処理（line-break: strict）を備えたマルチモーダル制作スタジオです。1つの .deck.md 原稿からXの「図解」・Note用HTML・LinkedIn PDF・編集可能なPPTX・60fps動画を同時出力します。',
    primaryCta: '🚀 Web版を今すぐ体験（インストール不要）',
    secondaryCta: '36種類のデザインシステムを見る',
    quickInstall: 'npm i -g @aimake/cli',
    cliCopyNotice: 'コマンドをクリップボードにコピーしました',
    stageCaption: '確定性レイアウトコンパイラ · タブを切り替えて各メディアの描画を確認',
    flywheelHeading: '4段階の制作フライホイール：知識蓄積からマルチメディア同時配信まで',
    flywheelSub:
      '素材の自動摂取から Karpathy 式 LLM Wiki での知識蒸留、パラメトリック組版、そして主要プラットフォームへの一括配信まで、すべてローカルで完結。',
    bentoItems: [
      {
        stage: 'STAGE 01 · 劣化なし素材摂取',
        title: '記事URL、PDF、Office文書をクリーンなMarkdownに構造化',
        desc: 'ドラッグ＆ドロップでPDFや文書を即座に取り込み。広告やノイズをローカルで除去し、生の根拠をsources/に保存。',
        tag: 'INTAKE & RESEARCH',
        badge: 'ノイズゼロ',
        type: 'wide',
        details: ['PDF / DOCX / PPTX 抽出', 'Web 記事クレンジング', 'sources/ 自動アーカイブ'],
      },
      {
        stage: 'STAGE 02 · 知識複利化',
        title: 'index.md を 3,000 トークン以下に制限する永久記憶',
        desc: 'Karpathy 式 LLM Wiki により、過去の洞察をコンパクトな概念カードとして保持。文脈を圧迫せず AI の理解を深めます。',
        tag: 'WIKI COMPLIANCE',
        badge: '95% トークン削減',
        type: 'tall',
        details: ['index.md <= 3,000 トークン', '概念・エンティティ図譜', '厳格な典拠タグ (cite:)'],
      },
      {
        stage: 'STAGE 03 · 確定性組版',
        title: '1つの原稿から、5形式のネイティブ成果物を同時生成',
        desc: '画像キャプチャの手抜きなし：PowerPointはダブルクリックで編集可能なOOXMLテキストボックス、記事は100%インラインCSS、動画はフレーム同期。',
        tag: 'PARAMETRIC COMPILER',
        badge: '1原稿 · 5形式出力',
        type: 'wide',
        details: [
          'Retina 3倍 X用図解カード',
          '100% インライン記事 HTML',
          '文字編集可能なネイティブ PPTX',
          '60fps H.264 音声同期動画',
        ],
      },
      {
        stage: 'STAGE 04 · マルチチャネル配信',
        title: '主要プラットフォームへの一括配信と履歴蓄積',
        desc: 'マルチ配信アダプターでワンクリック配信。公開実績は wiki/published.md に自動記録され、成長サイクルを完結。',
        tag: 'OMNI-CHANNEL PUBLISH',
        badge: 'マルチ配信',
        type: 'normal',
        details: ['SNS 用カルーセル出力', 'インライン記事下書き', 'wiki/published.md 連動'],
      },
      {
        stage: 'PRIVACY · 完全保護',
        title: 'クラウド送信 0 KB · データは100%ローカルに保持',
        desc: '127.0.0.1 のローカル完結で動作。Ollama や LM Studio とも連携可能。APIキーも端末外に一切送信されません。',
        tag: 'ZERO-CLOUD PRIVACY',
        badge: '100% ローカル優先',
        type: 'normal',
        details: ['外部サーバー通信ゼロ', 'オフライン完全動作', 'プライベート LLM 即座接続'],
      },
    ],
    terminalHeading: '洗練された CLI ＆ MCP 連携 · 16以上の AI エージェントに対応',
    terminalSub:
      'コマンド一行でワークスペース構築、複数フォーマット出力、一括配信を実行。Claude Code や Cursor の MCP ツールとしても即座に稼働。',
    terminalScenarios: [
      {
        id: 'init',
        label: '1. ワークスペース初期化',
        cmd: 'aimake init my-workspace --scenario creator-growth',
        desc: '7つのプリセットSkill（0シンボリックリンク）、Karpathy Wiki、サンプル原稿を含む独立環境を即座に作成。',
        output: `✔ Created local workspace at ./my-workspace
✔ Materialized 7 preset skills (0 symlinks) into .agents/skills/
✔ Initialized Karpathy LLM Wiki skeleton in wiki/
✔ Generated starter storyboard in decks/welcome.deck.md
🎉 Done! Run 'cd my-workspace && aimake studio' to open canvas.`,
      },
      {
        id: 'compose',
        label: '2. 原稿コンパイル',
        cmd: 'aimake compose decks/growth.deck.md --template x-zukai-quad',
        desc: 'Markdown原稿から80ms以内で高解像度PNG、インラインHTML、編集可能PPTXを一括コンパイル。',
        output: `✔ Parsed decks/growth.deck.md (4 slides, 16:9 aspect)
✔ Applied 4-locale Humanizer (0 AI clichés detected)
✔ Compiled Retina PNG: exports/growth-01.png ~ exports/growth-04.png
✔ Generated WeChat Inline HTML: exports/growth-wechat.html
✔ Built Native PowerPoint: exports/growth.pptx (real editable OOXML text)`,
      },
      {
        id: 'publish',
        label: '3. マルチチャネル配信',
        cmd: 'aimake publish decks/growth.deck.md --channel all --dry-run',
        desc: '各SNS・記事メディアへの一括配信をシミュレートし、wiki/published.md に記録を追記。',
        output: `[WeChat] Rendering inline HTML & uploading covers... Done
[Xiaohongshu] Packaging 4-card 3:4 carousel... Ready for sync
[Zhihu] Formatted column article with citations... Synced
✔ Appended publishing record to wiki/published.md (Compound leverage +1)`,
      },
      {
        id: 'mcp',
        label: '4. MCP サーバー起動',
        cmd: 'aimake mcp',
        desc: 'Claude Code や OpenAI Codex に標準 MCP ツール（コンパイル・文体調整・配信）を提供。',
        output: `[aimake-mcp] Server initialized on stdio (JSON-RPC 2.0)
[aimake-mcp] Registered 6 tools: aimake_compile_deck, aimake_humanize,
             aimake_publish_content, aimake_remix_template,
             aimake_wiki_distill, aimake_market_search
[aimake-mcp] Ready to receive host requests.`,
      },
    ],
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
    navFlywheel: '플라이휠',
    navTemplates: '36 종 디자인 시스템',
    navCli: 'CLI & MCP',
    navStudio: 'Aimake Studio',
    navUniverse: 'Aimake Universe',
    heroTag: '로컬 퍼스트 · 무서버 프라이버시 · 16개 이상 AI 에이전트 연동',
    heroTitle: '로컬 노트 한 편을 5가지 전문가급 콘텐츠로 동시 컴파일',
    heroSub:
      'Aimake는 Karpathy 방식의 로컬 LLM 위키, AI 특유의 번역투를 제거하는 스타일 DNA 엔진, 그리고 Pretendard 단어 단위 줄바꿈(keep-all)이 적용된 멀티모달 제작 스튜디오입니다. 하나의 .deck.md 원고로 인스타그램 카드뉴스, 뉴스레터 HTML, 링크드인 PDF, 편집 가능한 네이티브 PPTX, 60fps 숏폼 영상을 완성하세요.',
    primaryCta: '🚀 웹 플레이그라운드 체험하기 (설치 불필요)',
    secondaryCta: '36가지 글로벌 템플릿 보기',
    quickInstall: 'npm i -g @aimake/cli',
    cliCopyNotice: '명령어가 클립보드에 복사되었습니다',
    stageCaption: '결정론적 레이아웃 컴파일러 · 탭을 눌러 매체별 렌더링 결과를 확인하세요',
    flywheelHeading: '4단계 크리에이티브 플라이휠: 지식 정리부터 멀티 플랫폼 배포까지',
    flywheelSub:
      '원문 수집부터 Karpathy 방식의 LLM 위키 구조화, 5종 네이티브 컴파일, 멀티 플랫폼 동시 발행까지 100% 로컬 프라이버시 환경에서 실행.',
    bentoItems: [
      {
        stage: 'STAGE 01 · 손실 없는 원문 수집',
        title: '기사 URL, 리포트, 문서를 깔끔한 마크다운으로 변환',
        desc: 'PDF나 문서를 드래그 앤 드롭하면 로컬 파서가 불필요한 서식을 제거하고 핵심 사실을 sources/에 안전하게 저장합니다.',
        tag: 'INTAKE & RESEARCH',
        badge: '무손실 수집',
        type: 'wide',
        details: ['PDF / DOCX / PPTX 텍스트 추출', '웹 기사 클리너', 'sources/ 자동 아카이빙'],
      },
      {
        stage: 'STAGE 02 · 지식 복리화',
        title: 'index.md 3,000 토큰 엄격 제한 영구 기억망',
        desc: 'Karpathy LLM 위키 구조로 지식을 응축 카드화하여 컨텍스트 낭비 없이 AI가 나의 업무 맥락을 지속 학습합니다.',
        tag: 'WIKI COMPLIANCE',
        badge: '95% 토큰 절약',
        type: 'tall',
        details: ['index.md <= 3,000 토큰 상한', '개념 및 개체 관계망', '명확한 출처 표기 (cite:)'],
      },
      {
        stage: 'STAGE 03 · 결정론적 컴파일',
        title: '원고 한 편으로 5종 네이티브 상업 포맷 동시 출력',
        desc: '단순 캡처가 아닌 진짜 파워포인트 OOXML 텍스트 상자, 100% 인라인 HTML, 프레임 단위 음성 동기화 영상을 생성합니다.',
        tag: 'PARAMETRIC COMPILER',
        badge: '1원고 · 5종 포맷',
        type: 'wide',
        details: [
          '3x 고해상도 카드뉴스 PNG',
          '100% 인라인 CSS 뉴스레터 HTML',
          '텍스트 수정 가능한 네이티브 PPTX',
          '60fps H.264 음성 합성 영상',
        ],
      },
      {
        stage: 'STAGE 04 · 멀티 채널 배포',
        title: '카드뉴스, 블로그, 슬라이드 멀티 플랫폼 원클릭 발행',
        desc: '멀티 플랫폼 발행 어댑터로 다양한 채널에 원클릭 전송하고, 발행 기록을 wiki/published.md에 누적합니다.',
        tag: 'OMNI-CHANNEL PUBLISH',
        badge: '멀티 발행',
        type: 'normal',
        details: ['SNS 카드뉴스 패키징', '인라인 에디터 초안 전송', 'wiki/published.md 기록'],
      },
      {
        stage: 'PRIVACY · 완벽 보호',
        title: '클라우드 전송 0 KB · 데이터는 100% 내 컴퓨터에 보관',
        desc: '127.0.0.1 로컬 환경에서 단독 구동. Ollama, LM Studio 등 로컬 모델 지원. 인터넷이 끊겨도 모든 기능이 작동합니다.',
        tag: 'ZERO-CLOUD PRIVACY',
        badge: '100% 로컬 퍼스트',
        type: 'normal',
        details: ['외부 서버 의존 없음', '오프라인 완전 구동', '프라이빗 로컬 LLM 연동'],
      },
    ],
    terminalHeading: '미니멀 CLI & 독립 MCP 서버 · 16개 이상 AI 에이전트 연동',
    terminalSub:
      '명령어 한 줄로 워크스페이스 생성, 포맷 컴파일, 채널 동시 발행 완료. Claude Code, Codex, Cursor를 위한 표준 MCP 프로토콜 완벽 지원.',
    terminalScenarios: [
      {
        id: 'init',
        label: '1. 워크스페이스 초기화',
        cmd: 'aimake init my-workspace --scenario creator-growth',
        desc: '7가지 프리셋 Skill(0 심볼릭 링크), Karpathy 위키 골격, 시작 예제 원고가 포함된 독립 환경을 생성합니다.',
        output: `✔ Created local workspace at ./my-workspace
✔ Materialized 7 preset skills (0 symlinks) into .agents/skills/
✔ Initialized Karpathy LLM Wiki skeleton in wiki/
✔ Generated starter storyboard in decks/welcome.deck.md
🎉 Done! Run 'cd my-workspace && aimake studio' to open canvas.`,
      },
      {
        id: 'compose',
        label: '2. 원고 컴파일',
        cmd: 'aimake compose decks/growth.deck.md --template ig-cardnews-kr',
        desc: '마크다운 원고를 80ms 이내에 고해상도 PNG, 인라인 HTML, 수정 가능한 PPTX로 일괄 변환합니다.',
        output: `✔ Parsed decks/growth.deck.md (4 slides, 16:9 aspect)
✔ Applied 4-locale Humanizer (0 AI clichés detected)
✔ Compiled Retina PNG: exports/growth-01.png ~ exports/growth-04.png
✔ Generated WeChat Inline HTML: exports/growth-wechat.html
✔ Built Native PowerPoint: exports/growth.pptx (real editable OOXML text)`,
      },
      {
        id: 'publish',
        label: '3. 멀티 채널 발행',
        cmd: 'aimake publish decks/growth.deck.md --channel all --dry-run',
        desc: '다양한 플랫폼으로의 전송을 시뮬레이션하고 wiki/published.md에 발행 이력을 보관합니다.',
        output: `[WeChat] Rendering inline HTML & uploading covers... Done
[Xiaohongshu] Packaging 4-card 3:4 carousel... Ready for sync
[Zhihu] Formatted column article with citations... Synced
✔ Appended publishing record to wiki/published.md (Compound leverage +1)`,
      },
      {
        id: 'mcp',
        label: '4. MCP 프로토콜 구동',
        cmd: 'aimake mcp',
        desc: 'Claude Code나 Cursor에 컴파일, 문체 정돈, 멀티 발행 도구를 제공하는 표준 MCP 서버를 실행합니다.',
        output: `[aimake-mcp] Server initialized on stdio (JSON-RPC 2.0)
[aimake-mcp] Registered 6 tools: aimake_compile_deck, aimake_humanize,
             aimake_publish_content, aimake_remix_template,
             aimake_wiki_distill, aimake_market_search
[aimake-mcp] Ready to receive host requests.`,
      },
    ],
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
      --bg: #07090e;
      --bg-alt: #0d111a;
      --surface: rgba(18, 24, 35, 0.75);
      --surface-elevated: rgba(26, 34, 49, 0.85);
      --border: rgba(255, 255, 255, 0.08);
      --border-strong: rgba(255, 255, 255, 0.16);
      --border-hover: rgba(59, 130, 246, 0.55);
      --ink: #f8fafc;
      --muted: #94a3b8;
      --dim: #64748b;
      --cobalt: #3b82f6;
      --cobalt-glow: rgba(59, 130, 246, 0.28);
      --indigo: #6366f1;
      --violet: #8b5cf6;
      --amber: #f59e0b;
      --emerald: #10b981;
      --rose: #f43f5e;
      --mono: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      --sans: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Inter', 'Plus Jakarta Sans', 'PingFang SC', 'Hiragino Sans', 'Pretendard', sans-serif;
    }
    * { box-sizing: border-box; }
    html { scroll-behavior: smooth; }
    body {
      margin: 0;
      background-color: var(--bg);
      background-image:
        radial-gradient(ellipse 90% 45% at 50% -12%, rgba(59, 130, 246, 0.16), transparent 70%),
        radial-gradient(circle 600px at 90% 25%, rgba(139, 92, 246, 0.07), transparent 60%),
        radial-gradient(circle 500px at 10% 50%, rgba(16, 185, 129, 0.05), transparent 60%);
      color: var(--ink);
      font-family: var(--sans);
      line-height: 1.62;
      -webkit-font-smoothing: antialiased;
      overflow-x: hidden;
    }
    a { color: inherit; text-decoration: none; }
    a:focus-visible, button:focus-visible { outline: 2px solid var(--cobalt); outline-offset: 2px; }
    .container { max-width: 1220px; margin: 0 auto; padding: 0 24px; }

    /* Topbar */
    nav.topbar {
      border-bottom: 1px solid var(--border);
      padding: 13px 0;
      background: rgba(7, 9, 14, 0.85);
      position: sticky;
      top: 0;
      z-index: 40;
      backdrop-filter: blur(20px) saturate(1.8);
      -webkit-backdrop-filter: blur(20px) saturate(1.8);
    }
    .nav-inner { display: flex; justify-content: space-between; align-items: center; gap: 16px; flex-wrap: wrap; }
    .logo { font-weight: 800; font-size: 17.5px; display: inline-flex; align-items: center; gap: 10px; letter-spacing: -0.025em; }
    .logo-badge {
      background: linear-gradient(135deg, var(--cobalt), var(--indigo));
      color: #fff;
      width: 28px;
      height: 28px;
      border-radius: 7px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-family: var(--mono);
      font-size: 13.5px;
      font-weight: 700;
      box-shadow: 0 0 0 1px rgba(255,255,255,0.2) inset, 0 4px 12px var(--cobalt-glow);
    }
    .logo-sub { font-size: 12px; font-weight: 500; color: var(--muted); padding-left: 10px; border-left: 1px solid var(--border); }
    .nav-links { display: flex; align-items: center; gap: 22px; font-size: 13.5px; color: var(--muted); font-weight: 500; }
    .nav-links a { transition: color 0.15s; }
    .nav-links a:hover { color: var(--ink); }
    .nav-pill-highlight {
      color: #93c5fd !important;
      background: rgba(59, 130, 246, 0.12);
      border: 1px solid rgba(59, 130, 246, 0.35);
      padding: 4px 11px;
      border-radius: 999px;
      font-weight: 600;
      display: inline-flex;
      align-items: center;
      gap: 5px;
      transition: background 0.15s, border-color 0.15s !important;
    }
    .nav-pill-highlight:hover { background: rgba(59, 130, 246, 0.22); border-color: var(--cobalt); color: #fff !important; }
    .lang-switch { display: flex; gap: 4px; font-family: var(--mono); font-size: 11px; }
    .lang-switch a {
      padding: 4px 8px;
      border-radius: 5px;
      border: 1px solid var(--border);
      color: var(--muted);
      transition: all 0.15s;
    }
    .lang-switch a:hover { color: var(--ink); border-color: var(--border-strong); }
    .lang-switch a.active { border-color: var(--cobalt); color: #fff; background: rgba(59, 130, 246, 0.2); }

    /* Hero */
    .hero {
      padding: 72px 0 64px;
      border-bottom: 1px solid var(--border);
      position: relative;
    }
    .hero-split { display: grid; grid-template-columns: 1.05fr 0.95fr; gap: 44px; align-items: center; }
    @media (max-width: 980px) { .hero-split { grid-template-columns: 1fr; } .logo-sub { display: none; } }
    .hero-badge-pill {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      padding: 5px 12px;
      border-radius: 999px;
      background: rgba(16, 185, 129, 0.1);
      border: 1px solid rgba(16, 185, 129, 0.3);
      color: var(--emerald);
      font-family: var(--mono);
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.04em;
      margin-bottom: 18px;
    }
    .pulse-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: var(--emerald);
      box-shadow: 0 0 8px var(--emerald);
      animation: pulseGlow 2s infinite;
    }
    @keyframes pulseGlow {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.45; transform: scale(0.85); }
    }
    .hero h1 {
      font-size: clamp(32px, 4.2vw, 54px);
      line-height: 1.14;
      margin: 0 0 18px;
      letter-spacing: -0.035em;
      font-weight: 800;
      background: linear-gradient(180deg, #ffffff 15%, #cbd5e1 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .hero p.lead {
      font-size: 15.5px;
      color: var(--muted);
      margin: 0 0 28px;
      max-width: 620px;
      line-height: 1.7;
    }
    .cta-row { display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 24px; align-items: center; }
    .btn-primary {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: linear-gradient(135deg, var(--cobalt), #2563eb);
      color: #fff;
      font-weight: 600;
      font-size: 14px;
      padding: 12px 22px;
      border-radius: 9px;
      border: 1px solid rgba(255,255,255,0.18);
      box-shadow: 0 4px 18px var(--cobalt-glow);
      transition: all 0.15s;
    }
    .btn-primary:hover { background: linear-gradient(135deg, #2563eb, #1d4ed8); transform: translateY(-1px); }
    .btn-secondary {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: var(--surface);
      backdrop-filter: blur(12px);
      color: var(--ink);
      font-weight: 600;
      font-size: 14px;
      padding: 12px 20px;
      border-radius: 9px;
      border: 1px solid var(--border);
      transition: all 0.15s;
    }
    .btn-secondary:hover { border-color: var(--border-hover); background: var(--surface-elevated); transform: translateY(-1px); }
    .quick-cli-pill {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: rgba(13, 17, 26, 0.9);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 8px 14px;
      font-family: var(--mono);
      font-size: 12px;
      color: #93c5fd;
      cursor: pointer;
      transition: all 0.15s;
    }
    .quick-cli-pill:hover { border-color: var(--cobalt); color: #fff; background: rgba(22, 29, 44, 0.95); }
    .spec-strip { display: flex; flex-wrap: wrap; gap: 8px; font-family: var(--mono); font-size: 11px; color: #cbd5e1; }
    .spec-pill {
      background: var(--surface);
      border: 1px solid var(--border);
      padding: 5px 11px;
      border-radius: 6px;
      backdrop-filter: blur(8px);
    }

    /* Hero Stage */
    .stage-shell {
      background: var(--surface);
      backdrop-filter: blur(24px) saturate(1.8);
      -webkit-backdrop-filter: blur(24px) saturate(1.8);
      border: 1px solid var(--border);
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 28px 70px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255,255,255,0.06) inset;
    }
    .stage-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 10px;
      padding: 11px 16px;
      background: rgba(11, 15, 23, 0.92);
      border-bottom: 1px solid var(--border);
      flex-wrap: wrap;
    }
    .stage-mac-dots { display: flex; gap: 6px; align-items: center; }
    .stage-mac-dot { width: 10px; height: 10px; border-radius: 50%; }
    .stage-tabs { display: flex; gap: 6px; flex-wrap: wrap; }
    .stage-tab {
      background: transparent;
      border: 1px solid var(--border);
      color: var(--muted);
      font-family: var(--mono);
      font-size: 11px;
      padding: 5px 10px;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.15s;
    }
    .stage-tab:hover { color: var(--ink); border-color: var(--border-strong); }
    .stage-tab.active {
      background: rgba(59, 130, 246, 0.22);
      color: #fff;
      border-color: var(--cobalt);
      box-shadow: 0 0 10px var(--cobalt-glow);
    }
    .stage-viewport { height: 470px; background: #07090e; position: relative; }
    .stage-viewport iframe { width: 100%; height: 100%; border: none; display: block; }
    .stage-foot {
      padding: 10px 16px;
      font-family: var(--mono);
      font-size: 11px;
      color: var(--muted);
      border-top: 1px solid var(--border);
      background: rgba(11, 15, 23, 0.92);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }
    .stage-foot-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      color: var(--emerald);
      font-size: 10.5px;
    }

    /* Sections */
    .section-block { padding: 76px 0; border-bottom: 1px solid var(--border); position: relative; }
    .section-head { margin-bottom: 34px; }
    .eyebrow { font-family: var(--mono); font-size: 11.5px; color: var(--amber); letter-spacing: 0.08em; text-transform: uppercase; font-weight: 600; margin-bottom: 8px; }
    .section-head h2 { font-size: clamp(24px, 3.2vw, 36px); margin: 0 0 10px; letter-spacing: -0.03em; font-weight: 700; }
    .section-head p { margin: 0; color: var(--muted); font-size: 15px; max-width: 760px; line-height: 1.65; }

    /* Bento Grid */
    .bento-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
    }
    @media (max-width: 980px) { .bento-grid { grid-template-columns: 1fr; } }
    .bento-card {
      background: var(--surface);
      backdrop-filter: blur(24px) saturate(1.8);
      -webkit-backdrop-filter: blur(24px) saturate(1.8);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 26px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      position: relative;
      overflow: hidden;
      box-shadow: 0 16px 36px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.03) inset;
      transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.2s ease, box-shadow 0.2s ease;
    }
    .bento-card:hover {
      transform: translateY(-3px);
      border-color: var(--border-hover);
      box-shadow: 0 22px 48px rgba(0,0,0,0.5), 0 0 0 1px rgba(59,130,246,0.3) inset;
    }
    .bento-wide { grid-column: span 2; }
    @media (max-width: 980px) { .bento-wide { grid-column: span 1; } }
    .bento-tall { grid-row: span 2; }
    @media (max-width: 980px) { .bento-tall { grid-row: span 1; } }
    .bento-top { margin-bottom: 20px; }
    .bento-stage-tag { font-family: var(--mono); font-size: 11px; color: var(--amber); margin-bottom: 8px; font-weight: 600; letter-spacing: 0.05em; }
    .bento-card h3 { margin: 0 0 10px; font-size: 19px; line-height: 1.3; font-weight: 700; letter-spacing: -0.02em; }
    .bento-card p { margin: 0; font-size: 14px; color: var(--muted); line-height: 1.65; }
    .bento-badge {
      display: inline-block;
      font-family: var(--mono);
      font-size: 11px;
      padding: 3px 9px;
      border-radius: 5px;
      background: rgba(59, 130, 246, 0.15);
      color: #93c5fd;
      border: 1px solid rgba(59, 130, 246, 0.35);
      width: fit-content;
      margin-top: 14px;
    }
    .bento-details {
      margin-top: 18px;
      padding-top: 14px;
      border-top: 1px solid var(--border);
      display: flex;
      flex-direction: column;
      gap: 7px;
    }
    .bento-detail-item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 12.5px;
      color: #cbd5e1;
      font-family: var(--mono);
    }
    .bento-detail-check { color: var(--emerald); font-weight: 700; font-size: 11px; }

    /* Interactive Terminal Section */
    .terminal-shell {
      background: #090c12;
      border: 1px solid var(--border-strong);
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 28px 70px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05) inset;
    }
    .terminal-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 18px;
      background: rgba(16, 21, 31, 0.95);
      border-bottom: 1px solid var(--border);
      flex-wrap: wrap;
      gap: 10px;
    }
    .terminal-dots { display: flex; gap: 7px; align-items: center; }
    .t-dot { width: 11px; height: 11px; border-radius: 50%; }
    .t-dot-red { background: #ff5f56; }
    .t-dot-yellow { background: #ffbd2e; }
    .t-dot-green { background: #27c93f; }
    .terminal-title { font-family: var(--mono); font-size: 11.5px; color: var(--muted); }
    .terminal-tabs {
      display: flex;
      gap: 6px;
      padding: 10px 18px;
      background: rgba(12, 16, 24, 0.9);
      border-bottom: 1px solid var(--border);
      flex-wrap: wrap;
    }
    .terminal-tab-btn {
      background: transparent;
      border: 1px solid var(--border);
      color: var(--muted);
      font-family: var(--mono);
      font-size: 11.5px;
      padding: 6px 12px;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.15s;
    }
    .terminal-tab-btn:hover { color: var(--ink); border-color: var(--border-strong); }
    .terminal-tab-btn.active {
      background: rgba(59, 130, 246, 0.22);
      color: #fff;
      border-color: var(--cobalt);
      box-shadow: 0 0 8px var(--cobalt-glow);
    }
    .terminal-prompt-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 20px;
      background: rgba(18, 24, 36, 0.6);
      border-bottom: 1px solid var(--border);
      gap: 12px;
      flex-wrap: wrap;
    }
    .terminal-prompt-cmd {
      display: flex;
      align-items: center;
      gap: 8px;
      font-family: var(--mono);
      font-size: 13.5px;
      color: #93c5fd;
      font-weight: 600;
      overflow-x: auto;
    }
    .terminal-prompt-prefix { color: var(--emerald); }
    .btn-copy-cmd {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: var(--surface);
      border: 1px solid var(--border);
      color: var(--ink);
      font-family: var(--mono);
      font-size: 11.5px;
      padding: 5px 11px;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.15s;
    }
    .btn-copy-cmd:hover { border-color: var(--cobalt); color: #fff; }
    .terminal-output {
      padding: 22px 24px;
      font-family: var(--mono);
      font-size: 12.5px;
      line-height: 1.75;
      color: #cbd5e1;
      white-space: pre-wrap;
      overflow-x: auto;
      margin: 0;
      min-height: 150px;
      background: #090c12;
    }
    .terminal-desc-foot {
      padding: 10px 18px;
      background: rgba(12, 16, 24, 0.95);
      border-top: 1px solid var(--border);
      font-size: 12px;
      color: var(--muted);
      font-family: var(--sans);
    }

    /* Template Cards & Gallery */
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(330px, 1fr)); gap: 20px; }
    .tpl-card {
      background: var(--surface);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 22px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      transition: transform 0.18s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.18s ease, box-shadow 0.18s ease;
      box-shadow: 0 12px 30px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.03) inset;
    }
    .tpl-card:hover {
      transform: translateY(-3px);
      border-color: var(--border-hover);
      box-shadow: 0 20px 45px rgba(0,0,0,0.5), 0 0 0 1px rgba(59,130,246,0.3) inset;
    }
    .meta-row { display: flex; justify-content: space-between; align-items: center; font-family: var(--mono); font-size: 11px; color: var(--muted); margin-bottom: 10px; }
    .aspect-badge {
      font-family: var(--mono);
      font-size: 10px;
      font-weight: 700;
      padding: 2px 7px;
      border-radius: 4px;
      letter-spacing: 0.04em;
    }
    .aspect-16-9 { background: rgba(59, 130, 246, 0.18); color: #93c5fd; border: 1px solid rgba(59, 130, 246, 0.35); }
    .aspect-3-4 { background: rgba(245, 158, 11, 0.18); color: #fcd34d; border: 1px solid rgba(245, 158, 11, 0.35); }
    .aspect-4-5 { background: rgba(16, 185, 129, 0.18); color: #6ee7b7; border: 1px solid rgba(16, 185, 129, 0.35); }
    .aspect-9-16 { background: rgba(139, 92, 246, 0.18); color: #c4b5fd; border: 1px solid rgba(139, 92, 246, 0.35); }
    .aspect-1-1 { background: rgba(14, 165, 233, 0.18); color: #7dd3fc; border: 1px solid rgba(14, 165, 233, 0.35); }
    .tpl-card h3 { margin: 0 0 8px; font-size: 17.5px; font-weight: 700; letter-spacing: -0.02em; }
    .tpl-card p { margin: 0 0 16px; font-size: 13.5px; color: var(--muted); line-height: 1.6; }
    .formats { display: flex; flex-wrap: wrap; gap: 6px; margin-top: auto; }
    .fmt-tag { font-family: var(--mono); font-size: 10.5px; padding: 2px 7px; border-radius: 4px; background: var(--bg); border: 1px solid var(--border); color: #cbd5e1; }

    /* Industry Packs */
    .pillars-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(270px, 1fr)); gap: 18px; }
    .pillar-card {
      background: var(--surface);
      backdrop-filter: blur(16px);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 22px;
      transition: all 0.15s;
    }
    .pillar-card:hover { border-color: var(--border-hover); transform: translateY(-2px); }
    .pillar-code { font-family: var(--mono); font-size: 11px; color: var(--amber); margin-bottom: 8px; letter-spacing: 0.05em; font-weight: 600; }
    .pillar-card h3 { margin: 0 0 8px; font-size: 17px; font-weight: 700; }
    .pillar-card p { margin: 0; font-size: 13.5px; color: var(--muted); line-height: 1.6; }

    /* Family */
    .family-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 20px; }
    .family-card {
      background: linear-gradient(180deg, var(--surface), rgba(12, 16, 24, 0.9));
      backdrop-filter: blur(20px);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 26px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      gap: 16px;
      box-shadow: 0 16px 36px rgba(0,0,0,0.35);
      transition: all 0.18s;
    }
    .family-card:hover { border-color: var(--border-hover); transform: translateY(-2px); }
    .family-badge {
      display: inline-block;
      font-family: var(--mono);
      font-size: 11px;
      padding: 3px 9px;
      border-radius: 5px;
      background: rgba(16, 185, 129, 0.14);
      color: var(--emerald);
      border: 1px solid rgba(16, 185, 129, 0.35);
      width: fit-content;
      font-weight: 600;
    }

    /* Footer */
    footer { padding: 42px 0 52px; font-size: 13px; color: var(--muted); border-top: 1px solid var(--border); }
    .footer-inner { display: flex; justify-content: space-between; align-items: center; gap: 16px; flex-wrap: wrap; }
    .footer-links { display: flex; gap: 18px; flex-wrap: wrap; font-size: 13px; }
    .footer-links a:hover { color: var(--ink); }

    /* Toast */
    #site-toast {
      position: fixed;
      bottom: 28px;
      right: 28px;
      background: rgba(15, 23, 42, 0.95);
      backdrop-filter: blur(16px);
      border: 1px solid var(--cobalt);
      color: #fff;
      padding: 10px 18px;
      border-radius: 9px;
      font-size: 12.5px;
      font-family: var(--mono);
      box-shadow: 0 16px 40px rgba(0,0,0,0.6), 0 0 16px var(--cobalt-glow);
      z-index: 100;
      opacity: 0;
      pointer-events: none;
      transform: translateY(12px);
      transition: opacity 0.2s cubic-bezier(0.16, 1, 0.3, 1), transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }
    #site-toast.show {
      opacity: 1;
      pointer-events: auto;
      transform: translateY(0);
    }

    @media (prefers-reduced-motion: reduce) {
      * { transition: none !important; animation: none !important; scroll-behavior: auto !important; }
    }
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
        <a href="/playground/" class="nav-pill-highlight">🚀 ${esc(copy.navPlayground)}</a>
        <a href="/${lang}/#flywheel">${esc(copy.navFlywheel)}</a>
        <a href="/${lang}/#templates">${esc(copy.navTemplates)}</a>
        <a href="/${lang}/#cli">${esc(copy.navCli)}</a>
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
    .map((tpl) => {
      const aspectClass =
        tpl.aspect === '16:9'
          ? 'aspect-16-9'
          : tpl.aspect === '3:4'
          ? 'aspect-3-4'
          : tpl.aspect === '4:5'
          ? 'aspect-4-5'
          : tpl.aspect === '9:16'
          ? 'aspect-9-16'
          : 'aspect-1-1';

      return `
      <div class="tpl-card" data-market-card="true" data-cat="${esc(tpl.category)}" data-aspect="${esc(tpl.aspect)}" data-loc="${esc(tpl.defaultLocale)}" data-search="${esc((tpl.id + ' ' + tpl.name.zh + ' ' + tpl.name.en + ' ' + tpl.styleFamily + ' ' + tpl.tags.join(' ')).toLowerCase())}">
        <div>
          <div class="meta-row">
            <span>#${esc(tpl.id)} · v${esc(tpl.version)}</span>
            <span class="aspect-badge ${aspectClass}">${esc(tpl.aspect)}</span>
          </div>
          <h3><a href="/${lang}/templates/${tpl.id}/">${esc(tpl.name[lang])}</a></h3>
          <p>${esc(tpl.description[lang])}</p>
        </div>
        <div>
          <div class="formats" style="margin-bottom:14px;">
            <span class="fmt-tag" style="color:var(--amber);border-color:rgba(245,158,11,0.4);">${esc(tpl.styleFamily)}</span>
            ${tpl.supportedFormats.slice(0, 4).map((f) => `<span class="fmt-tag">${esc(f.toUpperCase())}</span>`).join('')}
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            <a class="btn-secondary" style="padding:7px 12px;font-size:12.5px;" href="/${lang}/templates/${tpl.id}/">预览 Preview</a>
            <a class="btn-primary" style="padding:7px 12px;font-size:12.5px;" href="aimake://remix?template=${esc(tpl.id)}">一键做同款 Remix</a>
          </div>
        </div>
      </div>`;
    })
    .join('\n');

  const bentoHtml = copy.bentoItems
    .map((item) => {
      const typeClass = item.type === 'wide' ? 'bento-wide' : item.type === 'tall' ? 'bento-tall' : '';
      return `
      <div class="bento-card ${typeClass}">
        <div class="bento-top">
          <div class="bento-stage-tag">${esc(item.stage)}</div>
          <h3>${esc(item.title)}</h3>
          <p>${esc(item.desc)}</p>
          <span class="bento-badge">${esc(item.badge)}</span>
        </div>
        <div class="bento-details">
          ${item.details
            .map(
              (d) =>
                `<div class="bento-detail-item"><span class="bento-detail-check">✓</span><span>${esc(d)}</span></div>`
            )
            .join('')}
        </div>
      </div>`;
    })
    .join('\n');

  const firstScenario = copy.terminalScenarios[0];

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

  <!-- HERO -->
  <header class="hero">
    <div class="container hero-split">
      <div>
        <div class="hero-badge-pill">
          <span class="pulse-dot"></span>
          <span>${esc(copy.heroTag)}</span>
        </div>
        <h1>${esc(copy.heroTitle)}</h1>
        <p class="lead">${esc(copy.heroSub)}</p>
        <div class="cta-row">
          <a class="btn-primary" href="/playground/">${esc(copy.primaryCta)} →</a>
          <a class="btn-secondary" href="#templates">${esc(copy.secondaryCta)}</a>
          <div class="quick-cli-pill" id="hero-quick-cli" title="Click to copy install command" data-copy="${esc(copy.quickInstall)}">
            <span style="color:var(--emerald);">$</span>
            <span>${esc(copy.quickInstall)}</span>
            <span style="font-size:11px;opacity:0.7;">📋</span>
          </div>
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
          <div class="stage-mac-dots">
            <span class="stage-mac-dot t-dot-red"></span>
            <span class="stage-mac-dot t-dot-yellow"></span>
            <span class="stage-mac-dot t-dot-green"></span>
          </div>
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
        <div class="stage-foot">
          <span>${esc(copy.stageCaption)}</span>
          <span class="stage-foot-badge">● 0 外部依赖 · 100% 本地编译</span>
        </div>
      </div>
    </div>
  </header>

  <!-- BENTO GRID SHOWCASE (THE 4-STAGE CREATIVE FLYWHEEL) -->
  <section id="flywheel" class="section-block">
    <div class="container">
      <div class="section-head">
        <div class="eyebrow">THE 4-STAGE CREATIVE FLYWHEEL</div>
        <h2>${esc(copy.flywheelHeading)}</h2>
        <p>${esc(copy.flywheelSub)}</p>
      </div>
      <div class="bento-grid">${bentoHtml}</div>
    </div>
  </section>

  <!-- INTERACTIVE CLI & MCP TERMINAL PREVIEW -->
  <section id="cli" class="section-block">
    <div class="container">
      <div class="section-head">
        <div class="eyebrow">DEVELOPER &amp; POWER USER WORKFLOW</div>
        <h2>${esc(copy.terminalHeading)}</h2>
        <p>${esc(copy.terminalSub)}</p>
      </div>

      <div class="terminal-shell">
        <div class="terminal-head">
          <div class="terminal-dots">
            <span class="t-dot t-dot-red"></span>
            <span class="t-dot t-dot-yellow"></span>
            <span class="t-dot t-dot-green"></span>
          </div>
          <div class="terminal-title">aimake-terminal — zsh (100% local-first)</div>
          <button type="button" class="btn-copy-cmd" id="btn-copy-terminal" data-copy="${esc(firstScenario.cmd)}">
            <span id="copy-icon">📋</span>
            <span id="copy-text">Copy Command</span>
          </button>
        </div>

        <div class="terminal-tabs">
          ${copy.terminalScenarios
            .map(
              (sc, idx) =>
                `<button type="button" class="terminal-tab-btn ${idx === 0 ? 'active' : ''}" data-scenario-id="${esc(sc.id)}">${esc(sc.label)}</button>`
            )
            .join('')}
        </div>

        <div class="terminal-prompt-bar">
          <div class="terminal-prompt-cmd">
            <span class="terminal-prompt-prefix">❯</span>
            <span id="terminal-active-cmd">${esc(firstScenario.cmd)}</span>
          </div>
        </div>

        <pre class="terminal-output" id="terminal-active-output">${esc(firstScenario.output)}</pre>
        <div class="terminal-desc-foot" id="terminal-active-desc">${esc(firstScenario.desc)}</div>
      </div>
    </div>
  </section>

  <!-- TEMPLATE MARKETPLACE & ONE-CLICK REMIX -->
  <section id="templates" class="section-block">
    <div class="container">
      <div class="section-head">
        <div class="eyebrow">TEMPLATE MARKETPLACE &amp; ONE-CLICK REMIX</div>
        <h2>${esc(copy.galleryHeading)}</h2>
        <p>${esc(copy.gallerySub)}</p>
      </div>

      <!-- Filters & Search -->
      <div style="display:flex;gap:12px;flex-wrap:wrap;align-items:center;margin-bottom:24px;">
        <input id="site-market-search" type="search" placeholder="搜索 36 套设计系统 / 平台 / 语种 (Search templates)..." style="flex:1;min-width:240px;background:var(--surface);color:var(--ink);border:1px solid var(--border);border-radius:9px;padding:11px 16px;font-size:14px;outline:none;" />
        <div style="display:flex;gap:6px;flex-wrap:wrap;" id="site-market-filters">
          <button type="button" class="stage-tab active" data-filter-cat="all">全部 (All 36)</button>
          <button type="button" class="stage-tab" data-filter-cat="xiaohongshu">小红书 3:4</button>
          <button type="button" class="stage-tab" data-filter-cat="wechat">微信公众号</button>
          <button type="button" class="stage-tab" data-filter-cat="linkedin">LinkedIn 4:5</button>
          <button type="button" class="stage-tab" data-filter-cat="ppt">PPT 16:9</button>
          <button type="button" class="stage-tab" data-filter-cat="x-japan">日本図解 JA</button>
          <button type="button" class="stage-tab" data-filter-cat="instagram-kr">韩国 카드뉴스</button>
          <button type="button" class="stage-tab" data-filter-cat="video">短视频 9:16</button>
        </div>
      </div>

      <div class="grid" id="site-market-grid">${cardsHtml}</div>

      <div style="margin-top:46px;">
        <div class="eyebrow" style="margin-bottom:12px;">VERSIONED INDUSTRY PACKS (SHA-256 VERIFIED)</div>
        <div class="pillars-grid">${packsHtml}</div>
      </div>
    </div>
  </section>

  <!-- AIMAKE PRODUCT FAMILY -->
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
            <p style="margin:0;color:var(--muted);font-size:14px;">连接本地 Karpathy LLM Wiki、个人风格基因与 36 套四国商业设计系统，在 Claude Code / Codex / WorkBuddy 内一键交付图文、公众号、可编辑 PPTX 与短视频。</p>
          </div>
          <a class="btn-secondary" style="width:fit-content;" href="#templates">${esc(copy.primaryCta)} →</a>
        </div>

        <div class="family-card">
          <div>
            <span class="family-badge">CORE ENGINE · @aimake/engine</span>
            <h3 style="margin:12px 0 8px;font-size:20px;">Aimake Engine · 爱创核心引擎</h3>
            <p style="margin:0;color:var(--muted);font-size:14px;">底层无头音视频渲染内核与 Recipe 执行引擎。支持 Plan/Run 可验证收据、逐场景音频重用、Whisper 词级对齐与本地确定性媒体合成。</p>
          </div>
          <a class="btn-secondary" style="width:fit-content;" href="https://github.com/chicogong/aimake-studio" target="_blank" rel="noopener">浏览 Engine 源码 ↗</a>
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

  <!-- FOOTER -->
  <footer>
    <div class="container footer-inner">
      <div>${esc(copy.footerLine)}</div>
      <div class="footer-links">
        <a href="/zh/">简体中文</a>
        <a href="/en/">English</a>
        <a href="/ja/">日本語</a>
        <a href="/ko/">한국어</a>
        <a href="https://github.com/chicogong/aimake-studio">Aimake Engine</a>
        <a href="/universe/">爱创星球</a>
      </div>
    </div>
  </footer>

  <!-- TOAST -->
  <div id="site-toast"></div>

  <script>
    (function () {
      // Toast notification helper
      var toastEl = document.getElementById('site-toast');
      var toastTimer = null;
      function showToast(text) {
        if (!toastEl) return;
        toastEl.textContent = text;
        toastEl.classList.add('show');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(function () {
          toastEl.classList.remove('show');
        }, 2200);
      }

      // Copy helper
      function copyToClipboard(text, successMsg) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(function () {
            showToast(successMsg || '${esc(copy.cliCopyNotice)}');
          }).catch(function () {
            fallbackCopy(text, successMsg);
          });
        } else {
          fallbackCopy(text, successMsg);
        }
      }
      function fallbackCopy(text, successMsg) {
        var input = document.createElement('textarea');
        input.value = text;
        document.body.appendChild(input);
        input.select();
        try {
          document.execCommand('copy');
          showToast(successMsg || '${esc(copy.cliCopyNotice)}');
        } catch (_) {}
        document.body.removeChild(input);
      }

      // Hero quick CLI copy
      var heroQuickCli = document.getElementById('hero-quick-cli');
      if (heroQuickCli) {
        heroQuickCli.addEventListener('click', function () {
          var cmd = heroQuickCli.getAttribute('data-copy') || 'npm i -g @aimake/cli';
          copyToClipboard(cmd, '${esc(copy.cliCopyNotice)}: ' + cmd);
        });
      }

      // Hero stage iframe tab switcher
      var tabs = document.querySelectorAll('.stage-tab');
      var frame = document.getElementById('hero-stage-frame');
      tabs.forEach(function (btn) {
        btn.addEventListener('click', function () {
          tabs.forEach(function (b) { b.classList.remove('active'); });
          btn.classList.add('active');
          var nextSrc = btn.getAttribute('data-src');
          if (nextSrc && frame && frame.getAttribute('src') !== nextSrc) {
            frame.setAttribute('src', nextSrc);
          }
        });
      });

      // Terminal scenarios interactive tabs
      var scenarios = ${JSON.stringify(copy.terminalScenarios)};
      var scenarioTabBtns = document.querySelectorAll('.terminal-tab-btn');
      var termCmdEl = document.getElementById('terminal-active-cmd');
      var termOutputEl = document.getElementById('terminal-active-output');
      var termDescEl = document.getElementById('terminal-active-desc');
      var btnCopyTerminal = document.getElementById('btn-copy-terminal');

      scenarioTabBtns.forEach(function (btn) {
        btn.addEventListener('click', function () {
          scenarioTabBtns.forEach(function (b) { b.classList.remove('active'); });
          btn.classList.add('active');
          var scId = btn.getAttribute('data-scenario-id');
          var activeSc = scenarios.find(function (s) { return s.id === scId; }) || scenarios[0];
          if (termCmdEl) termCmdEl.textContent = activeSc.cmd;
          if (termOutputEl) termOutputEl.textContent = activeSc.output;
          if (termDescEl) termDescEl.textContent = activeSc.desc;
          if (btnCopyTerminal) btnCopyTerminal.setAttribute('data-copy', activeSc.cmd);
        });
      });

      if (btnCopyTerminal) {
        btnCopyTerminal.addEventListener('click', function () {
          var cmd = btnCopyTerminal.getAttribute('data-copy') || '';
          if (cmd) {
            copyToClipboard(cmd, '${esc(copy.cliCopyNotice)}: ' + cmd);
            var copyText = document.getElementById('copy-text');
            if (copyText) {
              var old = copyText.textContent;
              copyText.textContent = '✓ Copied!';
              setTimeout(function () { copyText.textContent = old; }, 1800);
            }
          }
        });
      }

      // Template Marketplace search & category filter
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
            <span class="aspect-badge aspect-4-5">LIVE · ${esc(p.href.replace('https://', ''))}</span>
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
      <div class="hero-badge-pill">
        <span class="pulse-dot"></span>
        <span>AIMAKE UNIVERSE · 家庭与儿童跨学科探索生态</span>
      </div>
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
        <a href="/">返回 Aimake Studio 旗舰主站</a>
        <a href="https://github.com/chicogong/aimake-studio">Aimake Engine 核心引擎</a>
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
    .preview-box { background: #07090e; border: 1px solid var(--border); border-radius: 14px; overflow: hidden; height: 680px; box-shadow: 0 20px 50px rgba(0,0,0,0.5); }
    .preview-box iframe { width: 100%; height: 100%; border: none; }
    .info-panel { background: var(--surface); backdrop-filter: blur(20px); border: 1px solid var(--border); border-radius: 14px; padding: 26px; height: fit-content; box-shadow: 0 16px 40px rgba(0,0,0,0.4); }
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
      <h1 style="font-size:24px;margin:10px 0 12px;font-weight:700;">${esc(tpl.name[lang])}</h1>
      <p style="color:var(--muted);font-size:14px;line-height:1.65;">${esc(tpl.description[lang])}</p>
      <div style="margin-top:20px;padding-top:16px;border-top:1px solid var(--border);">
        <div style="font-size:12px;color:var(--muted);margin-bottom:8px;">${esc(copy.specLabel)}</div>
        <div style="font-family:var(--mono);font-size:13px;color:#93c5fd;">${tpl.width} × ${tpl.height}px (${esc(tpl.aspect)})</div>
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
      <div style="margin-top:18px;display:flex;flex-direction:column;gap:8px;">
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
  await fs.writeFile(path.join(outDir, 'CNAME'), 'aimake.cc\n', 'utf8');
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
