import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { DeckDocument, SupportedLocale, TemplateManifest } from '../schema/types.js';
import { compileDeckToHtml } from '../renderer/html-compiler.js';
import { listMarketplaceCatalog, type MarketplaceTemplateEntry, type TemplatePack } from '../marketplace/index.js';
import { buildWebPlaygroundHtml, extractTemplatePaletteFromCss } from './playground-builder.js';
import { CURATED_TREND_FIXTURES } from '../radar/radar-engine.js';

export const paletteCache = new Map<string, { bg: string; surface: string; ink: string; accent: string }>();
export function getTemplatePalette(tplId: string): { bg: string; surface: string; ink: string; accent: string } {
  const cached = paletteCache.get(tplId);
  if (cached) return cached;
  let css = '';
  try {
    const html = fsSync.readFileSync(path.join(PACKAGE_ROOT, 'templates', tplId, 'template.html'), 'utf8');
    const m = html.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
    if (m) css = m[1];
  } catch {
    css = '';
  }
  const pal = extractTemplatePaletteFromCss(css);
  paletteCache.set(tplId, pal);
  return pal;
}

export function stripDecorEmoji(text: string): string {
  return text.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '').replace(/\s+/g, ' ').trim();
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function findPackageRoot(): string {
  let cur = __dirname;
  for (let i = 0; i < 5; i++) {
    if (fsSync.existsSync(path.join(cur, 'templates')) && fsSync.existsSync(path.join(cur, 'package.json'))) {
      return cur;
    }
    const parent = path.dirname(cur);
    if (parent === cur) break;
    cur = parent;
  }
  const cwd = process.cwd();
  if (fsSync.existsSync(path.join(cwd, 'templates')) && fsSync.existsSync(path.join(cwd, 'package.json'))) {
    return cwd;
  }
  return path.resolve(__dirname, '..', '..');
}

const PACKAGE_ROOT = findPackageRoot();

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
  illustration?: string;
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
  siteTitle: string;
  navPlayground: string;
  navFlywheel: string;
  navRadar: string;
  navTemplates: string;
  navCli: string;
  navEcosystem: string;
  heroTag: string;
  heroTitle: string;
  heroTitleMain?: string;
  heroTitleAccent?: string;
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
  tplCtaRemix: string;
  tplCtaDetail: string;
  tplCtaDesktop: string;
  detailCtaPlayground: string;
  detailCtaDesktop: string;
  radarCtaRemix: string;
  radarExpandAll: string;
  radarCollapse: string;
  tplExpandAll: string;
  tplCollapse: string;
  ecosystemCards: Array<{ badge: string; title: string; desc: string; cta: string; href: string; isExternal?: boolean }>;
}

const UI_COPY: Record<SiteLang, LangCopy> = {
  zh: {
    htmlLang: 'zh-CN',
    deckLocale: 'zh-CN',
    siteTitle: 'Aimake Studio（爱创工坊）· 超级个体的本地创作外脑 | 从灵感火花到全域多模态出版',
    navPlayground: '在线工坊',
    navFlywheel: '创作飞轮',
    navRadar: '灵感雷达',
    navTemplates: '36 套设计模板',
    navCli: '终端 & MCP',
    navEcosystem: '技术架构',
    heroTag: 'AIMAKE 2.0 · 超级个体创作外脑 · 100% 纯本地优先',
    heroTitle: '超级个体的全域创作外脑：从灵感火花到全模态高定交付',
    heroTitleMain: '超级个体的全域创作外脑',
    heroTitleAccent: '从灵感火花，到全模态高定交付',
    heroSub:
      '素材吸纳、知识蒸馏、私有风格对齐、确定性美学排版。全流程在一个工作区里端到端闭环，一套在本地飞速运转的超级个体个人出版流水线。内置 36 套商业级参数化设计模板与反 AI 废话风格库，零云端依赖，80 毫秒极速直出小红书 3x 超清图卡、微信内联富文本、微软原生可编辑 PPTX 与 60fps 动效短视频。',
    primaryCta: '网页版在线工坊 (开箱即用)',
    secondaryCta: '浏览 36 套设计模板',
    quickInstall: 'npm i -g aimake-studio',
    cliCopyNotice: '已复制终端命令至剪贴板',
    stageCaption: '确定性排版舞台 · 切换标签实时预览多端画布',
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
        illustration: '/brand/illustrations/feature-visual-layout.svg',
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
        illustration: '/brand/illustrations/feature-ai-copilot.svg',
        details: ['index.md <= 3,000 Tokens 预算', '概念卡与实体关系图谱', '严格标注事实来源坐标 cite'],
      },
      {
        stage: 'STAGE 03 · 确定性编译',
        title: '写一份 .deck.md，同步直出五种原生商业交付物',
        desc: '告别重复搬运排版：PPTX 是原生双击可编辑的微软 OOXML 文本框，公众号是 100% 纯内联样式无外部依赖，视频采用精准帧级语音字幕对齐。',
        tag: 'PARAMETRIC COMPILER',
        badge: '1 原稿 · 5 原生介质',
        type: 'wide',
        illustration: '/brand/illustrations/feature-one-source-many-formats.svg',
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
✓ Done! Run 'cd my-workspace && aimake studio' to open canvas.`,
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
    familyHeading: 'Aimake 技术架构与工具链矩阵',
    familySub: '面向超级个体的全套本地优先创作工坊、无头渲染引擎与 Agent 协议栈',
    designerLabel: '设计维护',
    specLabel: '画布规格与导出介质',
    deliverablesLabel: '支持原生导出',
    footerLine: 'Aimake 爱创 · 本地优先多模态创作与知识复利平台 · 数据 100% 留存本机',
    tplCtaRemix: '在线做同款 →',
    tplCtaDetail: '详情',
    tplCtaDesktop: '在 Aimake 桌面端打开做同款',
    detailCtaPlayground: '在在线工坊做同款 →',
    detailCtaDesktop: '在 Aimake 桌面端打开',
    radarCtaRemix: '做同款 ↗',
    radarExpandAll: '展开全部 {count} 条实时热点',
    radarCollapse: '收起实时热点 (仅看精选 {count} 条)',
    tplExpandAll: '展开全部 {total} 套设计系统 (剩余 {rem} 套)',
    tplCollapse: '收起部分设计系统 (保留精选 {count} 套)',
    ecosystemCards: [
      {
        badge: 'WEB STUDIO · aimake.cc',
        title: 'Aimake Web Studio · 在线工坊',
        desc: '零安装、纯前端沙盒安全运行。内置 36 套设计模板、实时参数化排版舞台与四语种去 AI 腔清洗器，开箱即用，支持一键导出与做同款。',
        cta: '打开在线工坊 →',
        href: '/playground/',
      },
      {
        badge: 'CORE ENGINE · @aimake/engine',
        title: 'Aimake Engine · 确定性排版内核',
        desc: '底层无头多模态渲染内核与 CLI 编译器。支持纯本地端到端编译、多介质直出、Karpathy LLM Wiki 知识复利与全渠道自动化分发。',
        cta: '浏览 Engine 源码 ↗',
        href: 'https://github.com/chicogong/aimake-studio',
        isExternal: true,
      },
      {
        badge: 'AGENT PROTOCOLS · ACP & MCP',
        title: 'Aimake Agent Protocols · 智能体协议栈',
        desc: '原生支持 Agent Client Protocol (ACP) 与 Model Context Protocol (MCP)。无缝挂载至 Claude Code、Cursor 与 AGY，赋能智能体双向多模态出版。',
        cta: '探索 Agent 协议规范 ↗',
        href: 'https://github.com/chicogong/aimake-creator',
        isExternal: true,
      },
    ],
  },
  en: {
    htmlLang: 'en',
    deckLocale: 'en',
    siteTitle: 'Aimake Studio — The Local-First Creative OS: From Raw Sparks to Omni-Channel Publishing',
    navPlayground: 'Web Playground',
    navFlywheel: 'Flywheel',
    navRadar: 'Trend Radar',
    navTemplates: '36 Design Systems',
    navCli: 'CLI & MCP',
    navEcosystem: 'Ecosystem',
    heroTag: 'AIMAKE 2.0 · LOCAL-FIRST CREATIVE OS · ZERO-CLOUD PRIVACY',
    heroTitle: 'The Omni-Channel Creative OS: From Raw Sparks to High-End Deliverables',
    heroTitleMain: 'The Omni-Channel Creative OS',
    heroTitleAccent: 'From Raw Sparks to High-End Deliverables',
    heroSub:
      'Lossless intake, Karpathy LLM Wiki distillation, private style alignment, and deterministic typography. An end-to-end publishing pipeline running 100% locally for solopreneurs. Build your flagship personal IP with 36 parametric design systems—compiling Retina 3x PNG cards, inline newsletter HTML, native editable PPTX, and 60fps narrated video in 80ms.',
    primaryCta: 'Try Web Studio (Zero Install)',
    secondaryCta: 'Explore 36 Design Systems',
    quickInstall: 'npm i -g aimake-studio',
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
        illustration: '/brand/illustrations/feature-visual-layout.svg',
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
        illustration: '/brand/illustrations/feature-ai-copilot.svg',
        details: ['index.md <= 3,000 Token Cap', 'Concept & Entity Graph', 'Strict Source Citations (cite:)'],
      },
      {
        stage: 'STAGE 03 · DETERMINISTIC COMPILE',
        title: 'Write one .deck.md, generate five commercial native formats',
        desc: 'No blurry screenshots: PowerPoint exports are genuine editable OOXML text boxes, newsletters are 100% inline HTML, and video is synced per frame.',
        tag: 'PARAMETRIC COMPILER',
        badge: '1 Source · 5 Formats',
        type: 'wide',
        illustration: '/brand/illustrations/feature-one-source-many-formats.svg',
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
✓ Done! Run 'cd my-workspace && aimake studio' to open canvas.`,
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
    familyHeading: 'Aimake Technical Architecture & Toolchain',
    familySub: 'Local-first visual studio, interactive CLI, headless media runtime, and native IDE agent protocols',
    designerLabel: 'Crafted by',
    specLabel: 'Canvas & Output Specs',
    deliverablesLabel: 'Native Deliverables',
    footerLine: 'Aimake.cc · Local-First Multimodal Creator & LLM Wiki Studio · All Rights Reserved',
    tplCtaRemix: 'Use Template →',
    tplCtaDetail: 'Details',
    tplCtaDesktop: 'Open in Aimake Desktop',
    detailCtaPlayground: 'Open in Web Playground →',
    detailCtaDesktop: 'Open in Aimake Desktop',
    radarCtaRemix: 'Remix ↗',
    radarExpandAll: 'Show all {count} trending items',
    radarCollapse: 'Collapse (show {count} curated)',
    tplExpandAll: 'Show all {total} design templates ({rem} more)',
    tplCollapse: 'Collapse templates (keep {count} curated)',
    ecosystemCards: [
      {
        badge: 'WEB STUDIO · aimake.cc',
        title: 'Aimake Web Studio — Online Playground',
        desc: 'Zero installation, client-side sandbox. 36 built-in design templates, real-time parametric stage, multi-language anti-slop refiner, and one-click export.',
        cta: 'Launch Web Studio →',
        href: '/playground/',
      },
      {
        badge: 'CORE ENGINE · @aimake/engine',
        title: 'Aimake Engine — Deterministic Layout Kernel',
        desc: 'Headless multimodal rendering core and CLI compiler. Supports local compilation, multi-format export, Karpathy LLM Wiki compounding, and automated publishing.',
        cta: 'View Engine Source ↗',
        href: 'https://github.com/chicogong/aimake-studio',
        isExternal: true,
      },
      {
        badge: 'AGENT PROTOCOLS · ACP & MCP',
        title: 'Aimake Agent Protocols — ACP & MCP Stack',
        desc: 'Native support for Agent Client Protocol (ACP) and Model Context Protocol (MCP). Seamless integration with Claude Code, Cursor, and AGY for agentic publishing.',
        cta: 'Explore Agent Protocols ↗',
        href: 'https://github.com/chicogong/aimake-creator',
        isExternal: true,
      },
    ],
  },
  ja: {
    htmlLang: 'ja',
    deckLocale: 'ja',
    siteTitle: 'Aimake Studio（アイメイク）· クリエイターのためのローカル創作外脳 | アイデアから全メディア同時出版まで',
    navPlayground: 'Web プレイグラウンド',
    navFlywheel: '制作フライホイール',
    navRadar: 'トレンドレーダー',
    navTemplates: '36 種デザインシステム',
    navCli: 'CLI & MCP',
    navEcosystem: 'エコシステム',
    heroTag: 'AIMAKE 2.0 · スーパー個人の創作OS · 完全ローカル完結',
    heroTitle: 'スーパー個人的な創作OS：着想の火花から、高品質マルチモーダル出版へ',
    heroTitleMain: 'スーパー個人のための創作OS',
    heroTitleAccent: '着想の火花から、高品質マルチモーダル出版へ',
    heroSub:
      '素材の高速摂取、Karpathy 式 LLM Wiki による知識蒸留、独自トーンの同期、そして確定性美学レイアウト。単一ワークスペースで完结するローカル出版パイプライン。36 種のプロ品質デザインシステムを内蔵し、高解像度SNSカード、Webリッチテキスト、編集可能PPTX、60fps動画を80msで一括生成。',
    primaryCta: 'Web版スタジオを体験（インストール不要）',
    secondaryCta: '36種のデザインシステムを見る',
    quickInstall: 'npm i -g aimake-studio',
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
✓ Done! Run 'cd my-workspace && aimake studio' to open canvas.`,
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
    familyHeading: 'Aimake 技術アーキテクチャ & ツールチェーン',
    familySub: 'ローカルファーストのビジュアルスタジオ、ヘッドレスメディアエンジン、ネイティブAgentプロトコル群',
    designerLabel: 'デザイン',
    specLabel: 'キャンバス仕様',
    deliverablesLabel: '対応出力フォーマット',
    footerLine: 'Aimake.cc · ローカルファースト・マルチモーダル制作スタジオ · All Rights Reserved',
    tplCtaRemix: 'この型で作る →',
    tplCtaDetail: '詳細',
    tplCtaDesktop: 'Aimake デスクトップで開く',
    detailCtaPlayground: 'オンライン工房で作る →',
    detailCtaDesktop: 'Aimake デスクトップで開く',
    radarCtaRemix: 'この型で作る ↗',
    radarExpandAll: '全 {count} 件のトレンドを表示',
    radarCollapse: '折りたたむ (おすすめ {count} 件のみ)',
    tplExpandAll: '全 {total} 種のデザインを表示 (残り {rem} 種)',
    tplCollapse: '一部を折りたたむ (厳選 {count} 種を表示)',
    ecosystemCards: [
      {
        badge: 'WEB STUDIO · aimake.cc',
        title: 'Aimake Web Studio · オンライン工房',
        desc: 'インストール不要、ブラウザ完結のセキュアサンドボックス。36種のデザインテンプレート、リアルタイム組版ステージ、ワンクリック出力に対応。',
        cta: 'オンライン工房を開く →',
        href: '/playground/',
      },
      {
        badge: 'CORE ENGINE · @aimake/engine',
        title: 'Aimake Engine · 決定的レイアウトエンジン',
        desc: 'ヘッドレス・マルチモーダルレンダリングコアとCLIコンパイラ。完全ローカルコンパイル、マルチメディア出力、全自動パブリッシングに対応。',
        cta: 'Engine ソースコードを見る ↗',
        href: 'https://github.com/chicogong/aimake-studio',
        isExternal: true,
      },
      {
        badge: 'AGENT PROTOCOLS · ACP & MCP',
        title: 'Aimake Agent Protocols · エージェントプロトコル群',
        desc: 'Agent Client Protocol（ACP）および Model Context Protocol（MCP）にネイティブ対応。Claude Code、Cursor、AGY とシームレスに連携。',
        cta: 'エージェントプロトコル仕様を見る ↗',
        href: 'https://github.com/chicogong/aimake-creator',
        isExternal: true,
      },
    ],
  },
  ko: {
    htmlLang: 'ko',
    deckLocale: 'ko',
    siteTitle: 'Aimake Studio (아이메이크) · 슈퍼 인디비주얼을 위한 로컬 창작 외뇌 | 영감에서 전 채널 출판까지',
    navPlayground: '웹 플레이그라운드',
    navFlywheel: '플라이휠',
    navRadar: '트렌드 레이더',
    navTemplates: '36 종 디자인 시스템',
    navCli: 'CLI & MCP',
    navEcosystem: '에코시스템',
    heroTag: 'AIMAKE 2.0 · 슈퍼 개인 창작 OS · 100% 로컬 완결형',
    heroTitle: '슈퍼 개인을 위한 로컬 창작 OS: 영감의 불꽃에서 고품격 멀티모달 출판까지',
    heroTitleMain: '슈퍼 개인을 위한 로컬 창작 OS',
    heroTitleAccent: '영감의 불꽃에서 고품격 멀티모달 출판까지',
    heroSub:
      '무손실 소재 수집, Karpathy LLM 위키 지식 증류, 고유 스타일 동기화, 결정론적 미학 레이아웃. 로컬에서 즉시 구동되는 올인원 1인 출판 파이프라인. 36종의 파라메트릭 디자인 시스템을 탑재하여 80ms 만에 초고해상도 카드뉴스, 웹 리치 텍스트, 편집형 PPTX, 60fps 모션 비디오를 완벽 컴파일.',
    primaryCta: '웹 스튜디오 체험하기 (설치 불필요)',
    secondaryCta: '36가지 디자인 시스템 보기',
    quickInstall: 'npm i -g aimake-studio',
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
✓ Done! Run 'cd my-workspace && aimake studio' to open canvas.`,
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
    familyHeading: 'Aimake 기술 아키텍처 & 툴체인',
    familySub: '로컬 퍼스트 비주얼 스튜디오, 헤드리스 미디어 런타임 및 네이티브 Agent 프로토콜',
    designerLabel: '디자인',
    specLabel: '캔버스 규격',
    deliverablesLabel: '네이티브 출력 포맷',
    footerLine: 'Aimake.cc · 로컬 퍼스트 멀티모달 제작 & LLM 위키 스튜디오 · All Rights Reserved',
    tplCtaRemix: '템플릿 사용 →',
    tplCtaDetail: '상세보기',
    tplCtaDesktop: 'Aimake 데스크톱에서 열기',
    detailCtaPlayground: '온라인 스튜디오에서 제작 →',
    detailCtaDesktop: 'Aimake 데스크톱에서 열기',
    radarCtaRemix: '제작하기 ↗',
    radarExpandAll: '실시간 트렌드 {count}개 모두 보기',
    radarCollapse: '접기 (주요 {count}개만 보기)',
    tplExpandAll: '전체 {total}개 디자인 보기 ({rem}개 더보기)',
    tplCollapse: '템플릿 접기 (추천 {count}개 유지)',
    ecosystemCards: [
      {
        badge: 'WEB STUDIO · aimake.cc',
        title: 'Aimake Web Studio · 온라인 스튜디오',
        desc: '설치 불필요, 브라우저에서 실행되는 샌드박스. 36가지 디자인 템플릿, 실시간 파라메트릭 스테이지, 원클릭 내보내기 지원.',
        cta: '온라인 스튜디오 열기 →',
        href: '/playground/',
      },
      {
        badge: 'CORE ENGINE · @aimake/engine',
        title: 'Aimake Engine · 결정론적 조판 엔진',
        desc: '헤드리스 멀티모달 렌더링 코어 및 CLI 컴파일러. 로컬 완결형 컴파일, 다중 포맷 출력, 전 채널 자동 배포 지원.',
        cta: 'Engine 소스코드 보기 ↗',
        href: 'https://github.com/chicogong/aimake-studio',
        isExternal: true,
      },
      {
        badge: 'AGENT PROTOCOLS · ACP & MCP',
        title: 'Aimake Agent Protocols · 에이전트 프로토콜 스택',
        desc: 'Agent Client Protocol(ACP) 및 Model Context Protocol(MCP) 기본 지원. Claude Code, Cursor, AGY와 완벽 연동되는 에이전트 출판 체계.',
        cta: '에이전트 프로토콜 규격 보기 ↗',
        href: 'https://github.com/chicogong/aimake-creator',
        isExternal: true,
      },
    ],
  },
};

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
          { label: 'Token 压缩', value: '95%', delta: 'index.md <= 3000t' },
          { label: '端侧隐私', value: '100%', delta: '0 KB 云端上传' },
          { label: '编译延迟', value: '< 80ms', delta: '多端原生直出' },
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
      {
        index: 2,
        id: 'sample-quote',
        layout: 'quote',
        eyebrow: 'STYLE DNA & TYPOGRAPHY',
        title:
          lang === 'zh'
            ? '在 AI 泛滥的时代，真实排版与品味是最坚固的护城河'
            : lang === 'ja'
            ? 'AIの定型句があふれる時代に、真のタイポグラフィと美意識こそが最強の差別化'
            : lang === 'ko'
            ? 'AI 상투어가 넘쳐나는 시대, 진짜 타이포그래피와 고유 문체가 유일한 차별점'
            : 'In the age of AI noise, authentic taste and deterministic typography are the moat',
        quote: {
          text:
            lang === 'zh'
              ? '“写一份纯文本 Markdown 原稿，同步直出小红书 3:4 社交图文、微信公众号 100% 内联富文本、微软原生双击可编辑 PPTX 与 60fps 动态视频。”'
              : lang === 'ja'
              ? '「1つのMarkdown原稿から、X図解・インライン記事・編集可能PPTX・フレーム同期動画を同時出力。」'
              : lang === 'ko'
              ? '「하나의 마크다운 원고로 카드뉴스, 뉴스레터 HTML, 편집형 PPTX, 60fps 영상을 완벽 컴파일.」'
              : '"Author one plain-Markdown storyboard and output 3x Retina social cards, inline newsletter HTML, editable PPTX and 60fps MP4."',
          author: '@aimake-creator',
        },
        bullets: [],
        bodyParagraphs: [],
        metrics: [],
        cite: 'wiki/manifesto.md#L42',
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
    `<meta name="color-scheme" content="dark light" />`,
    `<link rel="icon" href="/brand/icons/favicon.ico" sizes="any" />`,
    `<link rel="icon" href="/brand/icons/icon-192.png" sizes="192x192" type="image/png" />`,
    `<link rel="icon" href="/brand/icon-192.png" sizes="192x192" type="image/png" />`,
    `<link rel="apple-touch-icon" href="/brand/icons/apple-touch-icon.png" />`,
    `<link rel="manifest" href="/brand/icons/site.webmanifest" />`,
    `<meta property="og:image" content="https://aimake.cc/brand/social/og-cover-1200x630.png" />`,
    `<meta name="twitter:image" content="https://aimake.cc/brand/social/og-cover-1200x630.png" />`,
  ].join('\n  ');
}

function sharedSiteCss(): string {
  return `
    :root {
      /* ==========================================================================
         1. Brand & Core Accent Tokens (Creator Violet Hierarchy)
         ========================================================================== */
      --am-violet: #6951ff;
      --am-violet-hover: #553af5;
      --am-violet-active: #472be6;
      --am-violet-glow: rgba(105, 81, 255, 0.28);
      --am-violet-soft: rgba(105, 81, 255, 0.10);
      --am-violet-hairline: rgba(105, 81, 255, 0.35);

      --am-emerald: #10b981;
      --am-emerald-soft: rgba(16, 185, 129, 0.12);
      --am-amber: #f59e0b;
      --am-amber-soft: rgba(245, 158, 11, 0.12);
      --am-coral: #ff6b74;
      --am-yellow: #ffcb49;
      --am-lavender: #b7aaff;
      --indigo: #6366f1;
      --violet: #8b5cf6;
      --amber: #f59e0b;
      --emerald: #10b981;
      --rose: #f43f5e;
      --code-ink: #93c5fd;

      /* ==========================================================================
         2. Typography & Micro-Features (Geist & Apple Aligned)
         ========================================================================== */
      --sans: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text',
                   'Inter', 'PingFang SC', 'Hiragino Sans', 'Pretendard', sans-serif;
      --mono: 'JetBrains Mono', 'SF Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;

      --font-sans: var(--sans);
      --font-mono: var(--mono);

      /* High-End OpenType Flags */
      --font-features-base: "cv02", "cv03", "cv04", "cv11", "ss01";
      --font-features-numbers: "tnum", "cv02", "cv03", "cv04", "cv11";

      --tracking-tighter: -0.035em;
      --tracking-tight: -0.02em;
      --tracking-normal: 0em;
      --tracking-wide: 0.04em;

      /* ==========================================================================
         3. Hairline Borders & Inset Lighting (Linear Micro-Refraction)
         ========================================================================== */
      --hairline-dark: 1px solid rgba(255, 255, 255, 0.08);
      --hairline-dark-strong: 1px solid rgba(255, 255, 255, 0.14);
      --hairline-dark-hover: 1px solid rgba(255, 255, 255, 0.22);
      --hairline-violet: 1px solid rgba(105, 81, 255, 0.45);

      --inset-highlight: inset 0 1px 0 rgba(255, 255, 255, 0.06);
      --inset-highlight-strong: inset 0 1px 0 rgba(255, 255, 255, 0.12);
      --inset-highlight-button: inset 0 1px 0 rgba(255, 255, 255, 0.20), inset 0 -1px 0 rgba(0, 0, 0, 0.20);

      /* ==========================================================================
         4. Physics Spring & Micro-Interactions (Raycast 240ms Damping)
         ========================================================================== */
      --ease-spring: cubic-bezier(0.16, 1, 0.3, 1);
      --ease-spring-snappy: cubic-bezier(0.2, 0.9, 0.2, 1);
      --duration-fast: 140ms;
      --duration-normal: 240ms;
      --duration-smooth: 320ms;

      --press-scale: scale(0.975);

      /* ==========================================================================
         5. Deep Obsidian Grayscale (Dark Mode / Showcase / Optical Darkroom)
         ========================================================================== */
      --bg-obsidian-deep: #07080c;       /* Stage & page canvas base */
      --bg-obsidian-surface: #0e1017;    /* Topbar, sidebar, secondary cards */
      --bg-obsidian-elevated: #151821;   /* Flyout drawers, modals, floating pills */
      --bg-obsidian-subtle: #1c202c;     /* Active pill, hover states */

      --bg: #07080c;
      --bg-alt: #0e1017;
      --surface: rgba(14, 16, 23, 0.76);
      --surface-elevated: rgba(21, 24, 33, 0.88);
      --border: rgba(255, 255, 255, 0.08);
      --border-strong: rgba(255, 255, 255, 0.14);
      --border-hover: rgba(255, 255, 255, 0.22);
      --cobalt: var(--am-violet);
      --cobalt-glow: var(--am-violet-glow);

      --ink: #f4f5f8;
      --muted: #9da1b2;
      --dim: #65697b;

      --pill-bg: rgba(105, 81, 255, 0.12);
      --pill-ink: #c4b5fd;
      --pill-border: rgba(105, 81, 255, 0.32);

      --shadow-obsidian-card: 0 16px 36px -8px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.06);
      --shadow-obsidian-hover: 0 24px 48px -10px rgba(0, 0, 0, 0.65), 0 0 0 1px rgba(105, 81, 255, 0.25) inset;
      --shadow-obsidian-dock: 0 16px 40px -6px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.1);
      --shadow-stage: 0 24px 64px -12px rgba(0, 0, 0, 0.65), inset 0 1px 0 rgba(255, 255, 255, 0.06);
    }

    [data-theme="light"] {
      --bg-obsidian-deep: #eceae4;       /* Warm architectural paper */
      --bg-obsidian-surface: #f5f4ef;    /* Vellum panel background */
      --bg-obsidian-elevated: #ffffff;   /* Pure white card surface */
      --bg-obsidian-subtle: #e3e1da;     /* Subtle divider / hover */

      --bg: #eceae4;
      --bg-alt: #f5f4ef;
      --surface: rgba(255, 255, 255, 0.92);
      --surface-elevated: #ffffff;

      --hairline-dark: 1px solid rgba(20, 20, 19, 0.08);
      --hairline-dark-strong: 1px solid rgba(20, 20, 19, 0.15);
      --hairline-dark-hover: 1px solid rgba(20, 20, 19, 0.26);

      --inset-highlight: inset 0 1px 0 rgba(255, 255, 255, 0.85);
      --inset-highlight-strong: inset 0 1px 0 #ffffff;

      --border: rgba(20, 20, 19, 0.08);
      --border-strong: rgba(20, 20, 19, 0.15);
      --border-hover: rgba(85, 58, 245, 0.45);

      --ink: #141413;
      --muted: #57554f;
      --dim: #8c887f;

      --cobalt: #553af5;
      --cobalt-glow: rgba(85, 58, 245, 0.2);
      --code-ink: #1d4ed8;

      --pill-bg: #eef2ff;
      --pill-ink: #4338ca;
      --pill-border: #c7d2fe;

      --shadow-obsidian-card: 0 8px 24px -4px rgba(20, 20, 19, 0.07), inset 0 1px 0 rgba(255, 255, 255, 0.9);
      --shadow-obsidian-hover: 0 16px 36px -6px rgba(20, 20, 19, 0.12), 0 0 0 1px rgba(85, 58, 245, 0.2) inset;
      --shadow-stage: 0 20px 48px rgba(20, 20, 19, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.8);
    }

    /* Light mode specific element styling */
    [data-theme="light"] body {
      background-color: var(--bg);
      background-image:
        radial-gradient(ellipse 80% 50% at 50% -10%, rgba(105, 81, 255, 0.05), transparent 70%),
        radial-gradient(circle 600px at 90% 20%, rgba(20, 20, 19, 0.03), transparent 60%);
      color: var(--ink);
    }
    [data-theme="light"] nav.topbar {
      background: rgba(245, 244, 239, 0.9);
      border-bottom-color: var(--border);
    }
    [data-theme="light"] .hero h1 {
      background: linear-gradient(180deg, #141413 30%, #3f3d37 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    [data-theme="light"] .hero {
      background-image:
        radial-gradient(ellipse 70% 45% at 50% -8%, rgba(105, 81, 255, 0.06), transparent 70%),
        radial-gradient(circle 500px at 85% 15%, rgba(255, 203, 73, 0.04), transparent 60%);
    }
    [data-theme="light"] .hero-badge-pill {
      background: #ecfdf5;
      border-color: #a7f3d0;
      color: #047857;
    }
    [data-theme="light"] .btn-secondary {
      background: #ffffff;
      color: #141413;
      border-color: var(--border-strong);
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05), var(--inset-highlight);
    }
    [data-theme="light"] .btn-secondary:hover {
      background: #fdfdfc;
      border-color: var(--cobalt);
    }
    [data-theme="light"] .quick-cli-pill {
      background: #ffffff;
      border-color: var(--border-strong);
      color: var(--cobalt);
    }
    [data-theme="light"] .spec-pill {
      background: #ffffff;
      border-color: var(--border);
      color: var(--muted);
    }
    [data-theme="light"] .bento-card,
    [data-theme="light"] .feature-card,
    [data-theme="light"] .pillar-card,
    [data-theme="light"] .scenario-box,
    [data-theme="light"] .preset-card,
    [data-theme="light"] .radar-card,
    [data-theme="light"] .radar-api-banner {
      background: #ffffff;
      box-shadow: var(--shadow-obsidian-card);
      border-color: var(--border);
    }
    [data-theme="light"] .bento-detail-item {
      color: #334155;
    }
    [data-theme="light"] .bento-art {
      background: #eceae4;
    }
    [data-theme="light"] .stage-shell {
      background: #0f1118;
      border-color: rgba(0, 0, 0, 0.14);
      box-shadow: 0 20px 48px rgba(15, 23, 42, 0.16);
    }
    [data-theme="light"] .stage-bar {
      background: #141822;
      border-bottom-color: rgba(255, 255, 255, 0.08);
    }
    [data-theme="light"] .stage-foot {
      background: #141822;
      border-top-color: rgba(255, 255, 255, 0.08);
      color: #94a3b8;
    }
    [data-theme="light"] .stage-viewport {
      background: #07080c;
    }
    [data-theme="light"] .stage-shell .stage-tab {
      color: #94a3b8;
    }
    [data-theme="light"] .stage-shell .stage-tab:hover {
      color: #ffffff;
    }
    [data-theme="light"] .stage-shell .stage-tab.active {
      background: rgba(255, 255, 255, 0.16);
      color: #ffffff;
      border-color: rgba(255, 255, 255, 0.2);
    }
    [data-theme="light"] .nav-pill-highlight {
      color: #4338ca !important;
      background: #eef2ff;
      border-color: #c7d2fe;
    }
    [data-theme="light"] .nav-pill-highlight:hover {
      background: #4f46e5;
      border-color: #4f46e5;
      color: #ffffff !important;
    }
    [data-theme="light"] .mobile-nav-pill-highlight {
      color: #4338ca !important;
      background: #eef2ff;
      border-color: #c7d2fe;
    }
    [data-theme="light"] .work-card,
    [data-theme="light"] .tpl-card,
    [data-theme="light"] .family-card,
    [data-theme="light"] .info-panel {
      background: #ffffff;
      border-color: var(--border);
      box-shadow: var(--shadow-obsidian-card);
    }
    [data-theme="light"] .family-badge,
    [data-theme="light"] .radar-method-badge,
    [data-theme="light"] .flywheel-vault-pill {
      background: #ecfdf5;
      color: #047857;
      border-color: #a7f3d0;
    }
    [data-theme="light"] .stage-foot-badge { color: #047857; }
    [data-theme="light"] .stage-shell .stage-foot-badge { color: #34d399; }
    [data-theme="light"] .fmt-tag {
      background: #f5f4ef;
      border-color: rgba(20, 20, 19, 0.1);
      color: #334155;
    }
    [data-theme="light"] .fmt-tag-family {
      background: #fffbeb;
      color: #b45309;
      border-color: #fde68a;
    }
    [data-theme="light"] .aspect-16-9 { background: #eff6ff; color: #1d4ed8; border-color: #bfdbfe; }
    [data-theme="light"] .aspect-3-4 { background: #fffbeb; color: #b45309; border-color: #fde68a; }
    [data-theme="light"] .aspect-4-5 { background: #ecfdf5; color: #047857; border-color: #a7f3d0; }
    [data-theme="light"] .aspect-9-16 { background: #f5f3ff; color: #6d28d9; border-color: #ddd6fe; }
    [data-theme="light"] .aspect-1-1 { background: #f0f9ff; color: #0369a1; border-color: #bae6fd; }
    [data-theme="light"] .aspect-flow { background: #fdf2f8; color: #be185d; border-color: #fbcfe8; }
    [data-theme="light"] .work-preview-bento {
      background: radial-gradient(circle at 80% 10%, rgba(105, 81, 255, 0.12), transparent 60%), #f8f7f4;
      color: #0f172a;
      border-color: rgba(20, 20, 19, 0.12);
    }
    [data-theme="light"] .wp-bento-tile {
      background: #ffffff;
      border: 1px solid rgba(20, 20, 19, 0.1);
      box-shadow: 0 1px 3px rgba(0,0,0,0.04);
    }
    [data-theme="light"] .wp-bento-tile strong {
      color: #0f172a !important;
    }
    [data-theme="light"] .work-preview-linear {
      background: radial-gradient(circle at 80% 0%, rgba(105,81,255,0.14), transparent 60%), #f8fafc;
      color: #0f172a;
      border-color: rgba(20, 20, 19, 0.12);
    }
    [data-theme="light"] .work-preview-linear .wp-headline {
      color: #0f172a;
    }
    [data-theme="light"] .work-preview-linear .wp-chip {
      background: #ffffff;
      border-color: rgba(20, 20, 19, 0.12);
      color: #334155;
    }
    [data-theme="light"] .work-preview-wechat {
      background: linear-gradient(135deg, #f8fafc 0%, #edf2f7 100%);
      color: #0f172a;
      border-color: rgba(20, 20, 19, 0.12);
    }
    [data-theme="light"] .work-preview-wechat .wp-headline {
      color: #0f172a;
    }
    [data-theme="light"] .work-preview-wechat .wp-chip {
      background: #ffffff;
      border-color: rgba(20, 20, 19, 0.12);
      color: #334155;
    }
    [data-theme="light"] .work-preview-video {
      background: linear-gradient(160deg, #f5f3ff 0%, #ede9fe 100%);
      color: #0f172a;
      border-color: rgba(105, 81, 255, 0.2);
    }
    [data-theme="light"] .work-preview-video .wp-headline {
      color: #0f172a;
    }
    [data-theme="light"] .work-preview-video .wp-track {
      color: #64748b;
    }
    [data-theme="light"] .work-preview-video .wp-track-bar {
      background: rgba(105, 81, 255, 0.1);
    }
    [data-theme="light"] .work-btn,
    [data-theme="light"] .work-btn-sub {
      background: #f5f4ef;
      color: #141413;
      border-color: var(--border-strong);
    }
    [data-theme="light"] .work-btn-sub:hover {
      background: #eae8e1;
      color: #000;
    }
    [data-theme="light"] .work-btn-main {
      background: var(--cobalt);
      color: #ffffff;
      border-color: var(--cobalt);
    }
    [data-theme="light"] .deliverables-badge {
      background: #ffffff;
      border-color: var(--border);
      color: #334155;
    }
    [data-theme="light"] .bento-badge {
      background: #eef2ff;
      color: #4338ca;
      border-color: #c7d2fe;
    }
    [data-theme="light"] .radar-hotness {
      color: #b45309;
    }
    [data-theme="light"] .eyebrow {
      color: #b45309;
    }
    [data-theme="light"] footer {
      background: #f5f4ef;
      border-top-color: var(--border);
    }

    /* Dedicated Section Filter Chips (Dark & Light High Contrast) */
    .filter-chip {
      background: var(--surface);
      border: var(--hairline-dark);
      box-shadow: var(--inset-highlight);
      color: var(--muted);
      font-size: 12.5px;
      font-weight: 500;
      padding: 6px 13px;
      border-radius: 999px;
      cursor: pointer;
      font-family: var(--sans);
      white-space: nowrap;
      transition: all var(--duration-fast) var(--ease-spring);
    }
    .filter-chip:hover {
      color: var(--ink);
      border-color: var(--hairline-dark-hover);
      background: var(--surface-elevated);
      transform: translateY(-1px);
    }
    .filter-chip.active {
      background: #18181b;
      color: #ffffff;
      border-color: rgba(255, 255, 255, 0.28);
      font-weight: 600;
      box-shadow: var(--inset-highlight-button), 0 2px 8px rgba(0, 0, 0, 0.35);
    }
    [data-theme="light"] .filter-chip {
      background: #ffffff;
      color: #57554f;
      border-color: rgba(20, 20, 19, 0.12);
      box-shadow: var(--inset-highlight);
    }
    [data-theme="light"] .filter-chip:hover {
      color: #141413;
      border-color: rgba(20, 20, 19, 0.28);
    }
    [data-theme="light"] .filter-chip.active {
      background: #141413;
      color: #ffffff;
      border-color: #141413;
      box-shadow: 0 2px 8px rgba(20, 20, 19, 0.18);
    }
    .is-collapsed-extra { display: none !important; }
    .section-expand-wrap {
      display: flex;
      justify-content: center;
      margin-top: 26px;
    }
    .btn-expand-more {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      height: 40px;
      padding: 0 22px;
      border-radius: 999px;
      background: var(--surface);
      border: var(--hairline-dark);
      box-shadow: var(--inset-highlight);
      color: var(--ink);
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: all var(--duration-fast) var(--ease-spring);
    }
    .btn-expand-more:hover {
      border-color: var(--hairline-dark-hover);
      color: var(--am-violet);
      transform: translateY(-1px);
    }
    * { box-sizing: border-box; }
    html {
      scroll-behavior: smooth;
      background-color: var(--bg-obsidian-deep);
      color-scheme: dark light;
    }
    html[data-theme="light"] {
      background-color: #eceae4;
    }
    body.is-loading * {
      transition: none !important;
      animation: none !important;
    }
    body {
      margin: 0;
      background-color: var(--bg);
      background-image:
        radial-gradient(ellipse 80% 50% at 50% -10%, rgba(105, 81, 255, 0.07), transparent 70%),
        radial-gradient(circle 600px at 90% 20%, rgba(59, 130, 246, 0.035), transparent 60%),
        radial-gradient(circle 500px at 10% 50%, rgba(16, 185, 129, 0.025), transparent 60%);
      color: var(--ink);
      font-family: var(--sans);
      font-feature-settings: var(--font-features-base);
      letter-spacing: var(--tracking-normal);
      line-height: 1.62;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      overflow-x: hidden;
    }
    a { color: inherit; text-decoration: none; }
    a:focus-visible, button:focus-visible { outline: 2px solid var(--cobalt); outline-offset: 2px; }
    .container { max-width: 1240px; margin: 0 auto; padding: 0 24px; }

    /* Topbar */
    nav.topbar {
      border-bottom: var(--hairline-dark);
      padding: 12px 0;
      background: rgba(7, 8, 12, 0.84);
      position: sticky;
      top: 0;
      z-index: 40;
      backdrop-filter: blur(24px) saturate(1.8);
      -webkit-backdrop-filter: blur(24px) saturate(1.8);
      box-shadow: 0 1px 0 rgba(255, 255, 255, 0.04);
    }
    .nav-inner { display: flex; justify-content: space-between; align-items: center; gap: 16px; flex-wrap: wrap; }
    .nav-brand-group { display: flex; align-items: center; gap: 12px; }
    .logo { font-weight: 800; font-size: 17.5px; display: inline-flex; align-items: center; gap: 10px; letter-spacing: var(--tracking-tight); }
    .logo-badge {
      background: linear-gradient(135deg, var(--am-violet), #553af5);
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
    .logo-sub { font-size: 12px; font-weight: 500; color: var(--muted); padding-left: 10px; border-left: var(--hairline-dark); }
    .nav-links { display: flex; align-items: center; gap: 22px; font-size: 13.5px; color: var(--muted); font-weight: 500; }
    .nav-links a { transition: color var(--duration-fast); }
    .nav-links a:hover { color: var(--ink); }
    .nav-pill-highlight {
      color: #c4b5fd !important;
      background: rgba(105, 81, 255, 0.12);
      border: 1px solid rgba(105, 81, 255, 0.35);
      padding: 4px 12px;
      border-radius: 999px;
      font-weight: 600;
      display: inline-flex;
      align-items: center;
      gap: 5px;
      box-shadow: var(--inset-highlight);
      transition: all var(--duration-fast) var(--ease-spring) !important;
    }
    .nav-pill-highlight:hover { background: rgba(105, 81, 255, 0.24); border-color: var(--am-violet); color: #fff !important; transform: translateY(-0.5px); }
    .nav-actions {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .nav-cta-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      height: 32px;
      padding: 0 14px;
      background: #18181b;
      color: #ffffff !important;
      font-size: 12.5px;
      font-weight: 600;
      border-radius: 8px;
      border: 1px solid rgba(255, 255, 255, 0.18);
      text-decoration: none;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.35);
      transition: all var(--duration-fast) var(--ease-spring);
      white-space: nowrap;
    }
    .nav-cta-btn:hover {
      background: #27272a;
      border-color: rgba(255, 255, 255, 0.32);
      transform: translateY(-1px);
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.45);
    }
    [data-theme="light"] .nav-cta-btn {
      background: #18181b;
      border-color: #18181b;
      color: #ffffff !important;
      box-shadow: 0 2px 8px rgba(24, 24, 27, 0.18);
    }
    [data-theme="light"] .nav-cta-btn:hover {
      background: #27272a;
      border-color: #27272a;
    }
    .theme-toggle-btn {
      background: var(--surface);
      border: var(--hairline-dark);
      color: var(--muted);
      border-radius: 8px;
      width: 32px;
      height: 32px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0;
      box-shadow: var(--inset-highlight);
      transition: all var(--duration-fast) var(--ease-spring);
      flex-shrink: 0;
    }
    .theme-toggle-btn:hover {
      border-color: var(--hairline-dark-hover);
      color: var(--ink);
      background: var(--surface-elevated);
      transform: translateY(-0.5px);
    }
    .theme-toggle-btn svg {
      transition: transform var(--duration-normal) var(--ease-spring);
    }
    .theme-toggle-btn:hover svg {
      transform: rotate(15deg);
    }
    .theme-toggle-btn .icon-moon { display: none; }
    .theme-toggle-btn .icon-sun { display: block; }
    [data-theme="light"] .theme-toggle-btn .icon-sun { display: none; }
    [data-theme="light"] .theme-toggle-btn .icon-moon { display: block; }

    /* Language Switcher Dropdown */
    .lang-dropdown {
      position: relative;
    }
    .lang-trigger {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: var(--surface);
      border: var(--hairline-dark);
      color: var(--muted);
      border-radius: 8px;
      padding: 0 10px;
      height: 32px;
      font-size: 12.5px;
      font-family: var(--sans);
      font-weight: 500;
      cursor: pointer;
      box-shadow: var(--inset-highlight);
      transition: all var(--duration-fast) var(--ease-spring);
      line-height: 1;
    }
    .lang-trigger:hover,
    .lang-dropdown:hover .lang-trigger,
    .lang-dropdown.open .lang-trigger,
    .lang-dropdown:focus-within .lang-trigger {
      border-color: var(--hairline-dark-hover);
      color: var(--ink);
      background: var(--surface-elevated);
    }
    .lang-chevron {
      transition: transform var(--duration-fast) ease;
      opacity: 0.6;
    }
    .lang-dropdown:hover .lang-chevron,
    .lang-dropdown.open .lang-chevron,
    .lang-dropdown:focus-within .lang-chevron {
      transform: rotate(180deg);
      opacity: 1;
    }
    .lang-menu {
      position: absolute;
      top: calc(100% + 6px);
      right: 0;
      min-width: 140px;
      background: rgba(14, 16, 23, 0.96);
      backdrop-filter: blur(24px);
      -webkit-backdrop-filter: blur(24px);
      border: var(--hairline-dark);
      border-radius: 10px;
      padding: 5px;
      box-shadow: 0 16px 36px rgba(0, 0, 0, 0.5), var(--inset-highlight);
      opacity: 0;
      pointer-events: none;
      transform: translateY(-4px) scale(0.98);
      transition: opacity var(--duration-fast) ease, transform var(--duration-fast) ease;
      z-index: 100;
    }
    [data-theme="light"] .lang-menu {
      background: rgba(255, 255, 255, 0.98);
      box-shadow: 0 16px 36px rgba(20, 20, 19, 0.1), var(--inset-highlight);
    }
    .lang-dropdown:hover .lang-menu,
    .lang-dropdown.open .lang-menu,
    .lang-dropdown:focus-within .lang-menu {
      opacity: 1;
      pointer-events: auto;
      transform: translateY(0) scale(1);
    }
    .lang-menu-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 7px 10px;
      border-radius: 6px;
      font-size: 12.5px;
      font-family: var(--sans);
      color: var(--muted);
      text-decoration: none;
      transition: all 0.12s ease;
    }
    .lang-menu-item:hover {
      background: rgba(255, 255, 255, 0.08);
      color: var(--ink);
    }
    [data-theme="light"] .lang-menu-item:hover {
      background: rgba(20, 20, 19, 0.05);
    }
    .lang-menu-item.active {
      color: #fff;
      font-weight: 600;
      background: var(--am-violet-soft);
    }
    [data-theme="light"] .lang-menu-item.active {
      color: var(--cobalt);
      background: rgba(85, 58, 245, 0.08);
    }

    /* Hero */
    .hero {
      padding: 84px 0 72px;
      border-bottom: var(--hairline-dark);
      position: relative;
      background-color: var(--bg-obsidian-deep);
      background-image:
        radial-gradient(ellipse 70% 45% at 50% -8%, rgba(105, 81, 255, 0.09), transparent 70%),
        radial-gradient(circle 600px at 85% 15%, rgba(59, 130, 246, 0.035), transparent 60%);
    }
    .hero-split { display: grid; grid-template-columns: 1.05fr 0.95fr; gap: 44px; align-items: center; }
    @media (max-width: 980px) { .hero-split { grid-template-columns: 1fr; } .logo-sub { display: none; } }
    .hero-badge-pill {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      padding: 4px 12px;
      border-radius: 999px;
      background: var(--am-emerald-soft);
      border: 1px solid rgba(16, 185, 129, 0.28);
      color: var(--am-emerald);
      font-family: var(--mono);
      font-size: 11px;
      font-weight: 600;
      letter-spacing: var(--tracking-wide);
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08);
      margin-bottom: 18px;
    }
    .pulse-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: var(--am-emerald);
      box-shadow: 0 0 6px var(--am-emerald);
      animation: am-breathe 2.4s ease-in-out infinite;
    }
    @keyframes am-breathe {
      0%, 100% { opacity: 0.6; transform: scale(0.95); }
      50% { opacity: 1; transform: scale(1.05); }
    }
    .hero-headline {
      margin: 0 0 20px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .hero-headline-main {
      font-family: var(--font-sans);
      font-feature-settings: var(--font-features-base);
      font-size: clamp(32px, 4.3vw, 54px);
      line-height: 1.15;
      letter-spacing: var(--tracking-tighter);
      font-weight: 800;
      background: linear-gradient(180deg, #ffffff 40%, rgba(255, 255, 255, 0.78) 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      display: block;
    }
    .hero-headline-accent {
      font-family: var(--font-sans);
      font-feature-settings: var(--font-features-base);
      font-size: clamp(28px, 3.8vw, 46px);
      line-height: 1.18;
      letter-spacing: -0.03em;
      font-weight: 800;
      background: linear-gradient(135deg, #c4b5fd 0%, #a78bfa 35%, #f472b6 70%, #38bdf8 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      display: block;
    }
    [data-theme="light"] .hero-headline-main {
      background: linear-gradient(180deg, #0f172a 40%, #1e293b 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    [data-theme="light"] .hero-headline-accent {
      background: linear-gradient(135deg, #6951ff 0%, #db2777 60%, #0284c7 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .hero p.lead {
      font-size: 15.5px;
      color: var(--muted);
      margin: 0 0 24px;
      max-width: 620px;
      line-height: 1.68;
      letter-spacing: var(--tracking-tight);
    }
    .hero-cta-group {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-bottom: 22px;
    }
    .cta-row { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; }
    .hero-cli-row { display: flex; align-items: center; }
    .btn-primary {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      height: 42px;
      background: #18181b;
      color: #fff !important;
      font-weight: 600;
      font-size: 13.5px;
      padding: 0 20px;
      border-radius: 9px;
      border: 1px solid rgba(255, 255, 255, 0.18);
      box-shadow: var(--inset-highlight-button), 0 2px 10px rgba(0, 0, 0, 0.35);
      transition: transform var(--duration-fast) var(--ease-spring),
                  background var(--duration-fast) ease,
                  box-shadow var(--duration-fast) ease;
      white-space: nowrap;
      text-decoration: none;
      box-sizing: border-box;
      cursor: pointer;
    }
    .btn-primary:hover {
      background: #27272a;
      border-color: rgba(255, 255, 255, 0.32);
      transform: translateY(-1px);
      box-shadow: var(--inset-highlight-button), 0 4px 16px rgba(0, 0, 0, 0.45);
    }
    .btn-primary:active { transform: var(--press-scale); }
    [data-theme="light"] .btn-primary {
      background: #18181b;
      border-color: #18181b;
      color: #fff !important;
      box-shadow: 0 2px 8px rgba(24, 24, 27, 0.16);
    }
    [data-theme="light"] .btn-primary:hover {
      background: #27272a;
      border-color: #27272a;
    }
    .btn-secondary {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      height: 42px;
      background: var(--surface);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      color: var(--ink);
      font-weight: 600;
      font-size: 13.5px;
      padding: 0 16px;
      border-radius: 9px;
      border: var(--hairline-dark);
      box-shadow: var(--inset-highlight);
      transition: transform var(--duration-fast) var(--ease-spring),
                  border-color var(--duration-fast) ease,
                  background var(--duration-fast) ease,
                  box-shadow var(--duration-fast) ease;
      white-space: nowrap;
      text-decoration: none;
      box-sizing: border-box;
      cursor: pointer;
    }
    .btn-secondary:hover {
      border-color: var(--hairline-dark-hover);
      background: var(--surface-elevated);
      transform: translateY(-1px);
      box-shadow: var(--inset-highlight-strong), 0 6px 20px rgba(0, 0, 0, 0.25);
    }
    .btn-secondary:active { transform: var(--press-scale); }
    .quick-cli-pill {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      height: 38px;
      background: rgba(14, 16, 23, 0.85);
      border: 1px solid rgba(255, 255, 255, 0.1);
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06);
      border-radius: 8px;
      padding: 0 13px;
      font-family: var(--mono);
      font-size: 12px;
      color: #93c5fd;
      cursor: pointer;
      transition: all var(--duration-fast) var(--ease-spring);
      box-sizing: border-box;
      white-space: nowrap;
    }
    .quick-cli-pill:hover {
      border-color: var(--am-violet-hairline);
      color: #fff;
      background: rgba(21, 24, 33, 0.95);
      transform: translateY(-1px);
      box-shadow: 0 4px 14px -2px rgba(105, 81, 255, 0.25);
    }
    .cli-prompt-symbol { color: var(--am-emerald); font-weight: 700; }
    .cli-copy-hint {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 11px;
      color: var(--muted);
      padding: 2px 6px;
      background: rgba(255, 255, 255, 0.06);
      border-radius: 4px;
      margin-left: 6px;
    }
    .deliverables-strip { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; font-size: 12px; color: var(--muted); margin-top: 14px; }
    .deliverables-label { font-size: 11.5px; font-weight: 600; color: var(--dim); margin-right: 2px; }
    .deliverables-badge {
      display: inline-flex;
      align-items: center;
      background: var(--surface);
      border: var(--hairline-dark);
      box-shadow: var(--inset-highlight);
      padding: 3px 9px;
      border-radius: 6px;
      font-family: var(--mono);
      font-feature-settings: var(--font-features-numbers);
      font-size: 11px;
      color: var(--ink);
      backdrop-filter: blur(8px);
    }
    .badge-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      display: inline-block;
      margin-right: 6px;
      flex-shrink: 0;
    }
    .spec-strip { display: flex; flex-wrap: wrap; gap: 8px; font-family: var(--mono); font-size: 11px; color: #cbd5e1; }
    .spec-pill {
      background: var(--surface);
      border: var(--hairline-dark);
      padding: 5px 11px;
      border-radius: 6px;
      backdrop-filter: blur(8px);
    }

    /* Hero Stage */
    .stage-shell {
      background: #08090e;
      border: var(--hairline-dark);
      border-radius: 14px;
      overflow: hidden;
      box-shadow: var(--shadow-stage);
    }
    .stage-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      padding: 9px 14px;
      background: #0f1118;
      border-bottom: var(--hairline-dark);
      box-shadow: var(--inset-highlight);
      flex-wrap: nowrap;
    }
    .stage-mac-dots { display: flex; gap: 7px; align-items: center; flex-shrink: 0; }
    .stage-mac-dot { width: 11px; height: 11px; border-radius: 50%; box-shadow: inset 0 1px 1px rgba(0,0,0,0.35); }
    .stage-tabs {
      display: flex;
      align-items: center;
      gap: 3px;
      overflow-x: auto;
      white-space: nowrap;
      scrollbar-width: none;
      -webkit-overflow-scrolling: touch;
      padding: 2.5px;
      background: rgba(0, 0, 0, 0.4);
      border-radius: 8px;
      border: 1px solid rgba(255, 255, 255, 0.06);
    }
    .stage-tabs::-webkit-scrollbar { display: none; }
    .stage-tab {
      background: transparent;
      border: 1px solid transparent;
      color: var(--muted);
      font-family: var(--sans);
      font-size: 11.5px;
      font-weight: 500;
      padding: 4px 10px;
      border-radius: 6px;
      cursor: pointer;
      transition: all var(--duration-fast) var(--ease-spring);
      white-space: nowrap;
      flex-shrink: 0;
    }
    .stage-tab:hover { color: var(--ink); background: rgba(255, 255, 255, 0.06); }
    .stage-tab.active {
      background: rgba(255, 255, 255, 0.12);
      color: #fff;
      border-color: rgba(255, 255, 255, 0.14);
      font-weight: 600;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.35), var(--inset-highlight);
    }
    .stage-viewport {
      height: 490px;
      background: #07080c;
      position: relative;
      overflow: hidden;
    }
    .stage-viewport iframe { width: 100%; height: 100%; border: none; display: block; }
    .stage-foot {
      padding: 9px 14px;
      font-family: var(--mono);
      font-feature-settings: var(--font-features-numbers);
      font-size: 11px;
      color: var(--muted);
      border-top: var(--hairline-dark);
      background: #0f1118;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      white-space: nowrap;
    }
    .stage-foot > span:first-child {
      overflow: hidden;
      text-overflow: ellipsis;
      min-width: 0;
    }
    .stage-foot-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      color: var(--am-emerald);
      font-size: 10.5px;
      flex-shrink: 0;
    }

    /* Hero Stage Slides (High-DPI Vector Masterpieces) */
    .hero-stage-slide {
      position: absolute;
      inset: 0;
      opacity: 0;
      pointer-events: none;
      transform: scale(0.985);
      transition: opacity 220ms var(--ease-spring), transform 220ms var(--ease-spring);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      box-sizing: border-box;
      padding: 24px;
    }
    .hero-stage-slide.active {
      opacity: 1;
      pointer-events: auto;
      transform: scale(1);
    }
    .stage-remix-btn {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 5px 12px;
      border-radius: 6px;
      background: var(--am-violet);
      color: #fff !important;
      font-size: 11.5px;
      font-weight: 600;
      text-decoration: none;
      box-shadow: 0 2px 10px rgba(105, 81, 255, 0.35);
      transition: all var(--duration-fast) var(--ease-spring);
      white-space: nowrap;
    }
    .stage-remix-btn:hover {
      background: var(--am-violet-hover);
      transform: translateY(-1px);
    }
    .stage-remix-btn-dark {
      background: #0f172a;
      border: 1px solid rgba(15, 23, 42, 0.2);
      color: #fff !important;
    }
    .stage-remix-btn-dark:hover {
      background: #1e293b;
    }
    .hss-foot-action {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 12px;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      font-size: 11.5px;
      color: #94a3b8;
    }

    /* Masterpiece 1: Apple Keynote Bento */
    .hss-bento {
      background: radial-gradient(circle at 85% 15%, rgba(105, 81, 255, 0.22), transparent 60%),
                  radial-gradient(circle at 15% 90%, rgba(56, 189, 248, 0.15), transparent 50%),
                  #080a12;
      color: #f8fafc;
      justify-content: space-between;
    }
    .hss-bento-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-family: var(--mono);
      font-size: 11px;
      color: #94a3b8;
      letter-spacing: 0.05em;
    }
    .hss-bento-title {
      font-size: clamp(19px, 2.3vw, 24px);
      font-weight: 700;
      letter-spacing: -0.025em;
      margin: 10px 0 14px;
      color: #ffffff;
      line-height: 1.3;
    }
    .hss-bento-flow {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 14px;
      background: rgba(255, 255, 255, 0.035);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 9px;
      font-size: 11.5px;
      font-family: var(--mono);
      margin-bottom: 16px;
      overflow-x: auto;
    }
    .hss-bento-node {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: rgba(105, 81, 255, 0.18);
      border: 1px solid rgba(105, 81, 255, 0.4);
      color: #c4b5fd;
      padding: 5px 10px;
      border-radius: 6px;
      white-space: nowrap;
      font-weight: 500;
    }
    .hss-bento-node-icon {
      width: 14px;
      height: 14px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .hss-bento-arrow { color: #64748b; font-weight: bold; font-size: 13px; }
    .hss-bento-metrics {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
      margin-bottom: 16px;
    }
    .hss-bento-tile {
      background: rgba(255, 255, 255, 0.035);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 10px;
      padding: 14px;
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06);
      position: relative;
      overflow: hidden;
    }
    .hss-bento-val {
      font-size: 28px;
      font-weight: 800;
      font-family: var(--mono);
      letter-spacing: -0.03em;
      line-height: 1.1;
      margin-bottom: 4px;
      display: flex;
      align-items: baseline;
      justify-content: space-between;
    }
    .hss-bento-label {
      font-size: 12px;
      font-weight: 600;
      color: #e2e8f0;
      margin-bottom: 2px;
    }
    .hss-bento-sub {
      font-size: 10.5px;
      font-family: var(--mono);
      color: #94a3b8;
    }

    /* Masterpiece 2: Swiss Grid (Cream / Crimson / Black) */
    .hss-swiss {
      background: #faf8f2;
      color: #0f172a;
      justify-content: space-between;
      border-top: 5px solid #e11d48;
      background-image: radial-gradient(#cbd5e1 1.2px, transparent 1.2px);
      background-size: 18px 18px;
    }
    .hss-swiss .hss-foot-action {
      border-top-color: rgba(15, 23, 42, 0.12);
      color: #475569;
    }
    .hss-swiss-grid-wrap {
      display: grid;
      grid-template-columns: 88px 1fr;
      gap: 20px;
      height: 100%;
    }
    .hss-swiss-num-col {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      border-right: 2px solid #0f172a;
      padding-right: 14px;
    }
    .hss-swiss-num {
      font-size: 72px;
      font-weight: 900;
      line-height: 0.85;
      color: #e11d48;
      font-family: var(--sans);
      letter-spacing: -0.06em;
    }
    .hss-swiss-vert-tag {
      writing-mode: vertical-rl;
      font-family: var(--mono);
      font-size: 9.5px;
      letter-spacing: 0.15em;
      color: #64748b;
      font-weight: 700;
      text-transform: uppercase;
      transform: rotate(180deg);
    }
    .hss-swiss-main {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .hss-swiss-title {
      font-size: clamp(19px, 2.3vw, 24px);
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.03em;
      line-height: 1.25;
      margin: 0 0 12px;
    }
    .hss-swiss-table {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      background: #ffffff;
      padding: 14px;
      border-radius: 8px;
      border: 1.5px solid #0f172a;
      box-shadow: 3px 3px 0 #0f172a;
    }
    .hss-swiss-cell { font-size: 11.5px; line-height: 1.5; color: #334155; }
    .hss-swiss-cell strong { color: #0f172a; display: block; font-size: 13px; font-weight: 700; }

    /* Masterpiece 3: Linear Geek Dark (IDE + Compiled Split) */
    .hss-linear {
      background: #090b11;
      color: #f1f5f9;
      justify-content: space-between;
    }
    .hss-linear-split {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      flex: 1;
      margin-bottom: 12px;
      min-height: 0;
    }
    .hss-code-win {
      background: #0d1017;
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 10px;
      padding: 12px 14px;
      font-family: var(--mono);
      font-size: 11px;
      line-height: 1.6;
      color: #94a3b8;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }
    .hss-code-win-bar {
      display: flex;
      align-items: center;
      gap: 8px;
      padding-bottom: 8px;
      margin-bottom: 8px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);
      font-size: 10.5px;
      color: #64748b;
    }
    .hss-code-win .kw { color: #f472b6; }
    .hss-code-win .str { color: #34d399; }
    .hss-code-win .prop { color: #38bdf8; }
    .hss-code-win .heading { color: #fbbf24; font-weight: bold; }
    .hss-preview-win {
      background: radial-gradient(circle at 75% 25%, rgba(105, 81, 255, 0.25), transparent 70%), #111422;
      border: 1px solid rgba(105, 81, 255, 0.35);
      border-radius: 10px;
      padding: 14px 16px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
    }
    .hss-preview-card-item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 11.5px;
      padding: 6px 10px;
      border-radius: 6px;
      border: 1px solid rgba(255, 255, 255, 0.06);
    }

    /* Masterpiece 4: WeChat In-Depth Editorial (Phone Mockup) */
    .hss-wechat {
      background: #090b12;
      color: #f3f4f6;
      justify-content: space-between;
    }
    .hss-phone-frame {
      max-width: 440px;
      width: 100%;
      margin: 0 auto;
      background: #11131d;
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 18px;
      padding: 14px 18px;
      box-shadow: 0 20px 48px rgba(0, 0, 0, 0.65), inset 0 1px 0 rgba(255, 255, 255, 0.1);
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      margin-bottom: 12px;
      position: relative;
    }
    .hss-phone-island {
      width: 80px;
      height: 18px;
      background: #000000;
      border-radius: 10px;
      margin: 0 auto 10px;
      display: flex;
      align-items: center;
      justify-content: flex-end;
      padding: 0 6px;
    }
    .hss-phone-island-cam {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #1e1b4b;
      border: 1px solid #312e81;
    }
    .hss-quote-callout {
      border-left: 3px solid #f59e0b;
      padding: 8px 12px;
      background: rgba(245, 158, 11, 0.08);
      border-radius: 0 6px 6px 0;
      font-size: 12px;
      line-height: 1.6;
      color: #fde68a;
      font-style: italic;
      margin: 8px 0;
    }
    .hss-wechat-stats {
      display: flex;
      gap: 12px;
      font-family: var(--mono);
      font-size: 11px;
      color: #94a3b8;
      padding-top: 8px;
      border-top: 1px solid rgba(255, 255, 255, 0.06);
    }

    /* Masterpiece 5: Cinema 9:16 Video + CapCut 4-Track Timeline */
    .hss-video {
      background: #080910;
      color: #f8fafc;
      justify-content: space-between;
    }
    .hss-video-top {
      display: flex;
      gap: 18px;
      align-items: center;
      flex: 1;
      margin-bottom: 12px;
      min-height: 0;
    }
    .hss-video-canvas {
      width: 124px;
      height: 196px;
      background: linear-gradient(180deg, #1e1b4b 0%, #0c0e17 100%);
      border: 1px solid rgba(167, 139, 250, 0.45);
      border-radius: 12px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 10px;
      position: relative;
      overflow: hidden;
      box-shadow: 0 10px 28px rgba(0, 0, 0, 0.6);
      flex-shrink: 0;
    }
    .hss-video-eq-wrap {
      display: flex;
      align-items: flex-end;
      gap: 3px;
      height: 24px;
      justify-content: center;
      margin: 4px 0;
    }
    .hss-eq-bar {
      width: 3px;
      border-radius: 1.5px;
      background: #a78bfa;
      animation: hss-eq-bounce 1s ease-in-out infinite alternate;
    }
    .hss-eq-bar:nth-child(1) { height: 8px; animation-delay: 0.1s; }
    .hss-eq-bar:nth-child(2) { height: 16px; animation-delay: 0.25s; }
    .hss-eq-bar:nth-child(3) { height: 22px; animation-delay: 0.4s; }
    .hss-eq-bar:nth-child(4) { height: 12px; animation-delay: 0.15s; }
    .hss-eq-bar:nth-child(5) { height: 18px; animation-delay: 0.3s; }
    .hss-eq-bar:nth-child(6) { height: 24px; animation-delay: 0.5s; }
    .hss-eq-bar:nth-child(7) { height: 14px; animation-delay: 0.2s; }
    .hss-eq-bar:nth-child(8) { height: 9px; animation-delay: 0.35s; }
    @keyframes hss-eq-bounce {
      0% { transform: scaleY(0.35); }
      100% { transform: scaleY(1); }
    }
    .hss-timeline-box {
      flex: 1;
      background: #0d0f18;
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 10px;
      padding: 14px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }

    /* Sections */
    .section-block { padding: 76px 0; border-bottom: var(--hairline-dark); position: relative; }
    .section-head { margin-bottom: 34px; }
    .eyebrow { font-family: var(--mono); font-size: 11.5px; color: var(--am-amber); letter-spacing: 0.08em; text-transform: uppercase; font-weight: 600; margin-bottom: 8px; }
    .section-head h2 { font-size: clamp(24px, 3.2vw, 36px); margin: 0 0 10px; letter-spacing: var(--tracking-tight); font-weight: 700; line-height: 1.25; }
    .section-head p { margin: 0; color: var(--muted); font-size: 15px; max-width: 780px; line-height: 1.65; }

    /* Symmetrical 2x2 Architectural Flywheel Bento Grid */
    .bento-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
    }
    @media (max-width: 860px) { .bento-grid { grid-template-columns: 1fr; } }
    .bento-card {
      background: var(--bg-obsidian-surface);
      backdrop-filter: blur(24px) saturate(160%);
      -webkit-backdrop-filter: blur(24px) saturate(160%);
      border: var(--hairline-dark);
      border-radius: 16px;
      padding: 26px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      gap: 16px;
      position: relative;
      overflow: hidden;
      box-shadow: var(--shadow-obsidian-card);
      transition: transform var(--duration-normal) var(--ease-spring),
                  border-color var(--duration-normal) ease,
                  box-shadow var(--duration-normal) ease;
    }
    .bento-card:hover {
      transform: translateY(-2.5px);
      border-color: var(--hairline-dark-hover);
      box-shadow: var(--shadow-obsidian-hover);
    }
    .bento-card-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      margin-bottom: 10px;
    }
    .bento-stage-tag { font-family: var(--mono); font-size: 11px; color: var(--am-amber); font-weight: 700; letter-spacing: 0.06em; }
    [data-theme="light"] .bento-stage-tag { color: #b45309; }
    .bento-card h3 { margin: 0 0 8px; font-size: 18px; line-height: 1.35; font-weight: 700; letter-spacing: var(--tracking-tight); color: var(--ink); }
    .bento-card p { margin: 0; font-size: 13.5px; color: var(--muted); line-height: 1.6; }
    .bento-badge {
      display: inline-flex;
      align-items: center;
      font-family: var(--mono);
      font-size: 10.5px;
      font-weight: 600;
      padding: 2px 8px;
      border-radius: 5px;
      background: var(--pill-bg);
      color: var(--pill-ink);
      border: 1px solid var(--pill-border);
      white-space: nowrap;
      flex-shrink: 0;
    }
    .flywheel-micro-ui {
      background: rgba(7, 8, 12, 0.75);
      border: var(--hairline-dark);
      border-radius: 10px;
      padding: 13px 15px;
      font-family: var(--mono);
      font-feature-settings: var(--font-features-numbers);
      font-size: 11.5px;
      color: #cbd5e1;
      display: flex;
      flex-direction: column;
      gap: 9px;
      box-shadow: var(--inset-highlight);
    }
    [data-theme="light"] .flywheel-micro-ui {
      background: #fdfdfc;
      border-color: rgba(20, 20, 19, 0.1);
      color: #334155;
    }
    .micro-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      flex-wrap: wrap;
    }
    .micro-pill {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 3px 8px;
      border-radius: 5px;
      background: rgba(255, 255, 255, 0.05);
      border: var(--hairline-dark);
      box-shadow: var(--inset-highlight);
      font-size: 11px;
      color: #e2e8f0;
    }
    [data-theme="light"] .micro-pill {
      background: #ffffff;
      border-color: rgba(20, 20, 19, 0.12);
      color: #1e293b;
    }
    .micro-meter-track {
      width: 100%;
      height: 6px;
      border-radius: 999px;
      background: rgba(127, 127, 127, 0.18);
      overflow: hidden;
    }
    .micro-meter-fill {
      height: 100%;
      border-radius: 999px;
      background: linear-gradient(90deg, #10b981, #6366f1);
    }
    .bento-details {
      padding-top: 12px;
      border-top: var(--hairline-dark);
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 6px 12px;
    }
    @media (max-width: 560px) { .bento-details { grid-template-columns: 1fr; } }
    .bento-detail-item {
      display: flex;
      align-items: center;
      gap: 7px;
      font-size: 12px;
      color: #cbd5e1;
      font-family: var(--mono);
    }
    .bento-detail-check { color: var(--am-emerald); font-weight: 700; font-size: 11px; flex-shrink: 0; }
    .flywheel-vault-banner {
      margin-top: 22px;
      background: var(--bg-obsidian-surface);
      border: var(--hairline-dark);
      border-radius: 14px;
      padding: 18px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 18px;
      flex-wrap: wrap;
      box-shadow: var(--shadow-obsidian-card);
    }
    [data-theme="light"] .flywheel-vault-banner {
      background: #ffffff;
      box-shadow: 0 4px 18px rgba(20, 20, 19, 0.04);
    }
    .flywheel-vault-pills {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
      font-family: var(--mono);
      font-size: 11.5px;
      color: var(--muted);
    }
    .flywheel-vault-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      border-radius: 6px;
      background: rgba(16, 185, 129, 0.08);
      border: 1px solid rgba(16, 185, 129, 0.24);
      color: var(--am-emerald);
      font-weight: 600;
    }

    /* Interactive Terminal Section */
    .terminal-shell {
      background: #08090e;
      border: var(--hairline-dark);
      border-radius: 16px;
      overflow: hidden;
      box-shadow: var(--shadow-stage);
    }
    .terminal-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 18px;
      background: #0e1118;
      border-bottom: var(--hairline-dark);
      box-shadow: var(--inset-highlight);
      flex-wrap: wrap;
      gap: 10px;
    }
    .terminal-dots { display: flex; gap: 7px; align-items: center; }
    .t-dot { width: 11px; height: 11px; border-radius: 50%; box-shadow: inset 0 1px 1px rgba(0,0,0,0.35); }
    .t-dot-red { background: #ff5f56; }
    .t-dot-yellow { background: #ffbd2e; }
    .t-dot-green { background: #27c93f; }
    .terminal-title { font-family: var(--mono); font-size: 11.5px; color: var(--muted); }
    .terminal-tabs {
      display: flex;
      gap: 6px;
      padding: 10px 18px;
      background: #0a0d14;
      border-bottom: var(--hairline-dark);
      flex-wrap: wrap;
    }
    .terminal-tab-btn {
      background: rgba(255, 255, 255, 0.03);
      border: var(--hairline-dark);
      color: var(--muted);
      font-family: var(--mono);
      font-size: 11.5px;
      padding: 6px 12px;
      border-radius: 6px;
      cursor: pointer;
      box-shadow: var(--inset-highlight);
      transition: all var(--duration-fast) var(--ease-spring);
    }
    .terminal-tab-btn:hover { color: #ffffff; border-color: var(--hairline-dark-hover); background: rgba(255, 255, 255, 0.06); }
    .terminal-tab-btn.active {
      background: var(--am-violet-soft);
      color: #ffffff;
      border-color: var(--am-violet-hairline);
      box-shadow: 0 0 10px var(--am-violet-glow), var(--inset-highlight);
    }
    .terminal-prompt-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 20px;
      background: rgba(14, 17, 24, 0.85);
      border-bottom: var(--hairline-dark);
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
    .terminal-prompt-prefix { color: var(--am-emerald); }
    .btn-copy-cmd {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: rgba(255, 255, 255, 0.05);
      border: var(--hairline-dark);
      box-shadow: var(--inset-highlight);
      color: var(--ink-secondary);
      font-family: var(--mono);
      font-size: 11.5px;
      padding: 5px 11px;
      border-radius: 6px;
      cursor: pointer;
      transition: all var(--duration-fast) var(--ease-spring);
    }
    .btn-copy-cmd:hover { border-color: var(--am-violet-hairline); color: #ffffff; background: var(--am-violet-soft); }
    .terminal-output {
      padding: 20px 24px;
      font-family: var(--mono);
      font-feature-settings: var(--font-features-numbers);
      font-size: 12.5px;
      line-height: 1.75;
      color: #cbd5e1;
      white-space: pre-wrap;
      overflow-x: auto;
      margin: 0;
      min-height: 144px;
      background: #08090e;
    }
    .terminal-desc-foot {
      padding: 10px 18px;
      background: #0b0d14;
      border-top: var(--hairline-dark);
      font-size: 12px;
      color: var(--muted);
      font-family: var(--sans);
    }

    /* Template Cards & Gallery */
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 320px), 1fr)); gap: 20px; }
    .tpl-card {
      background: var(--bg-obsidian-surface);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: var(--hairline-dark);
      border-radius: 14px;
      padding: 22px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      transition: transform var(--duration-normal) var(--ease-spring),
                  border-color var(--duration-normal) ease,
                  box-shadow var(--duration-normal) ease;
      box-shadow: var(--shadow-obsidian-card);
    }
    .tpl-card:hover {
      transform: translateY(-2.5px);
      border-color: var(--hairline-dark-hover);
      box-shadow: var(--shadow-obsidian-hover);
    }
    .meta-row { display: flex; justify-content: space-between; align-items: center; font-family: var(--mono); font-feature-settings: var(--font-features-numbers); font-size: 11px; color: var(--muted); margin-bottom: 10px; }
    .aspect-badge {
      font-family: var(--mono);
      font-feature-settings: var(--font-features-numbers);
      font-size: 10px;
      font-weight: 700;
      padding: 2px 7px;
      border-radius: 999px;
      letter-spacing: 0.04em;
      border: var(--hairline-dark);
      box-shadow: var(--inset-highlight);
    }
    .aspect-16-9 { background: rgba(59, 130, 246, 0.12); color: #93c5fd; border: 1px solid rgba(59, 130, 246, 0.3); }
    .aspect-3-4 { background: rgba(245, 158, 11, 0.12); color: #fcd34d; border: 1px solid rgba(245, 158, 11, 0.3); }
    .aspect-4-5 { background: rgba(16, 185, 129, 0.12); color: #6ee7b7; border: 1px solid rgba(16, 185, 129, 0.3); }
    .aspect-9-16 { background: rgba(139, 92, 246, 0.12); color: #c4b5fd; border: 1px solid rgba(139, 92, 246, 0.3); }
    .aspect-1-1 { background: rgba(14, 165, 233, 0.12); color: #7dd3fc; border: 1px solid rgba(14, 165, 233, 0.3); }
    .aspect-flow { background: rgba(236, 72, 153, 0.12); color: #f472b6; border: 1px solid rgba(236, 72, 153, 0.3); }
    .tpl-card h3 { margin: 0 0 8px; font-size: 16.5px; font-weight: 700; letter-spacing: var(--tracking-tight); line-height: 1.35; }
    .tpl-card p { margin: 0 0 14px; font-size: 13px; color: var(--muted); line-height: 1.55; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    .tpl-swatch {
      height: 64px;
      border-radius: 9px;
      padding: 10px 12px;
      margin-bottom: 14px;
      position: relative;
      overflow: hidden;
      border: 1px solid rgba(127, 127, 127, 0.2);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .tpl-swatch-bar { position: absolute; top: 0; left: 0; right: 0; height: 3px; }
    .tpl-swatch-lines { display: flex; flex-direction: column; gap: 4px; }
    .tpl-swatch-h { height: 7px; width: 62%; border-radius: 3px; opacity: 0.85; }
    .tpl-swatch-s { height: 4px; width: 42%; border-radius: 2px; opacity: 0.35; }
    .tpl-swatch-cards { display: flex; gap: 6px; }
    .tpl-swatch-card { flex: 1; height: 18px; border-radius: 4px; border: 1px solid rgba(127, 127, 127, 0.2); }
    .tpl-thumb-box {
      display: block;
      position: relative;
      height: 128px;
      border-radius: 10px;
      overflow: hidden;
      margin-bottom: 14px;
      border: var(--hairline-dark);
      box-shadow: var(--inset-highlight);
    }
    .tpl-thumb-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: center 18%;
      display: block;
      transition: transform var(--duration-normal) var(--ease-spring);
    }
    .tpl-card:hover .tpl-thumb-img { transform: scale(1.03); }
    .tpl-palette-pill {
      position: absolute;
      bottom: 8px;
      right: 8px;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 3px 6px;
      border-radius: 999px;
      background: rgba(9, 10, 15, 0.78);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      border: var(--hairline-dark);
      box-shadow: var(--inset-highlight);
      z-index: 2;
    }
    .tpl-palette-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      border: 1px solid rgba(255, 255, 255, 0.35);
    }
    .fmt-tag-family { color: var(--am-amber); border-color: rgba(245, 158, 11, 0.35); }
    .tpl-cta-row { display: flex; gap: 7px; align-items: center; margin-top: 14px; }
    .tpl-cta-main { flex: 1; height: 34px; padding: 0 12px; font-size: 12px; justify-content: center; }
    .tpl-cta-sub { height: 34px; padding: 0 11px; font-size: 12px; justify-content: center; }
    .tpl-cta-icon { width: 34px; height: 34px; padding: 0; justify-content: center; flex-shrink: 0; }
    .formats { display: flex; flex-wrap: nowrap; overflow: hidden; gap: 6px; margin-top: auto; }
    .fmt-tag { font-family: var(--mono); font-size: 10.5px; padding: 2px 7px; border-radius: 4px; background: var(--bg); border: var(--hairline-dark); color: #cbd5e1; white-space: nowrap; flex-shrink: 0; }

    /* Industry Packs */
    .pillars-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 270px), 1fr)); gap: 18px; }
    .pillar-card {
      background: var(--bg-obsidian-surface);
      backdrop-filter: blur(16px);
      border: var(--hairline-dark);
      border-radius: 12px;
      padding: 22px;
      box-shadow: var(--shadow-obsidian-card);
      transition: all var(--duration-fast) var(--ease-spring);
    }
    .pillar-card:hover { border-color: var(--hairline-dark-hover); transform: translateY(-2px); box-shadow: var(--shadow-obsidian-hover); }
    .pillar-code { font-family: var(--mono); font-size: 11px; color: var(--am-amber); margin-bottom: 8px; letter-spacing: 0.05em; font-weight: 600; }
    [data-theme="light"] .pillar-code { color: #b45309; }
    .pillar-card h3 { margin: 0 0 8px; font-size: 17px; font-weight: 700; letter-spacing: var(--tracking-tight); }
    .pillar-card p { margin: 0; font-size: 13.5px; color: var(--muted); line-height: 1.6; }
    .pack-cmd-box {
      font-family: var(--mono);
      font-size: 11.5px;
      color: var(--code-ink);
      background: var(--bg);
      padding: 8px 10px;
      border-radius: 6px;
      border: var(--hairline-dark);
      box-shadow: var(--inset-highlight);
      overflow-x: auto;
      white-space: nowrap;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      transition: border-color var(--duration-fast) ease;
    }
    .pack-cmd-box:hover { border-color: var(--am-violet-hairline); }

    /* Family */
    .family-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 300px), 1fr)); gap: 20px; }
    .family-card {
      background: var(--bg-obsidian-surface);
      backdrop-filter: blur(20px);
      border: var(--hairline-dark);
      border-radius: 16px;
      padding: 26px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      gap: 16px;
      box-shadow: var(--shadow-obsidian-card);
      transition: all var(--duration-normal) var(--ease-spring);
    }
    .family-card:hover { border-color: var(--hairline-dark-hover); transform: translateY(-2px); box-shadow: var(--shadow-obsidian-hover); }
    .family-badge {
      display: inline-block;
      font-family: var(--mono);
      font-size: 11px;
      padding: 3px 9px;
      border-radius: 5px;
      background: var(--am-emerald-soft);
      color: var(--am-emerald);
      border: 1px solid rgba(16, 185, 129, 0.3);
      box-shadow: var(--inset-highlight);
      width: fit-content;
      font-weight: 600;
    }

    /* Multimodal Works Section */
    .works-section { padding: 76px 0 64px; border-bottom: var(--hairline-dark); }
    .works-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 20px;
      margin-top: 26px;
    }
    @media (max-width: 1200px) { .works-grid { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 680px) { .works-grid { grid-template-columns: 1fr; } }
    .work-card {
      background: var(--bg-obsidian-surface);
      border: var(--hairline-dark);
      border-radius: 16px;
      padding: 18px 20px 20px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      gap: 14px;
      backdrop-filter: blur(20px);
      box-shadow: var(--shadow-obsidian-card);
      transition: transform var(--duration-normal) var(--ease-spring),
                  border-color var(--duration-normal) ease,
                  box-shadow var(--duration-normal) ease;
    }
    .work-card:hover {
      transform: translateY(-2.5px);
      border-color: var(--hairline-dark-hover);
      box-shadow: var(--shadow-obsidian-hover);
    }
    .work-preview {
      height: 184px;
      border-radius: 12px;
      padding: 16px 18px;
      margin-bottom: 14px;
      position: relative;
      overflow: hidden;
      border: var(--hairline-dark);
      box-shadow: var(--inset-highlight);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      transition: transform var(--duration-fast) var(--ease-spring), box-shadow var(--duration-fast) var(--ease-spring);
    }
    .work-card:hover .work-preview {
      transform: translateY(-2px);
      box-shadow: 0 12px 28px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(105, 81, 255, 0.4);
    }
    .work-preview-swiss {
      background: #faf8f2;
      color: #111111;
      background-image: radial-gradient(rgba(17,17,17,0.12) 1px, transparent 1px);
      background-size: 16px 16px;
    }
    .work-preview-swiss::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: #e11d48;
    }
    .wp-swiss-specs {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 4px;
      background: #ffffff;
      border: 1px solid #111111;
      padding: 6px 8px;
      border-radius: 4px;
      font-size: 9.5px;
      line-height: 1.35;
      color: #334155;
    }
    .wp-swiss-specs strong { color: #111111; display: block; font-size: 10.5px; }
    .work-preview-linear {
      background: radial-gradient(circle at 80% 0%, rgba(105,81,255,0.32), transparent 60%), #0a0d14;
      color: #f8fafc;
    }
    .wp-linear-flow {
      display: flex;
      align-items: center;
      gap: 5px;
      font-family: var(--mono);
      font-size: 9.5px;
      padding: 4px 6px;
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 5px;
    }
    .wp-linear-node {
      background: rgba(105, 81, 255, 0.25);
      border: 1px solid rgba(105, 81, 255, 0.4);
      color: #c4b5fd;
      padding: 2px 6px;
      border-radius: 4px;
    }
    .work-preview-bento {
      background: radial-gradient(circle at 80% 10%, rgba(105, 81, 255, 0.22), transparent 60%), #0c0e16;
      color: #f8fafc;
    }
    .wp-bento-mini-grid {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 6px;
      margin-top: 4px;
    }
    .wp-bento-tile {
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 6px;
      padding: 5px 6px;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .work-preview-wechat {
      background: linear-gradient(135deg, #141720 0%, #0d1017 100%);
      color: #f1f5f9;
    }
    .wp-wechat-quote-bar {
      border-left: 2px solid #f59e0b;
      padding: 4px 8px;
      background: rgba(245, 158, 11, 0.08);
      font-size: 10.5px;
      line-height: 1.45;
      color: #fde68a;
      font-style: italic;
      border-radius: 0 4px 4px 0;
      margin: 4px 0;
    }
    .work-preview-video {
      background: linear-gradient(160deg, #161028 0%, #090b12 100%);
      color: #f8fafc;
    }
    .work-preview-zukai {
      background: #f0f7fc;
      color: #0369a1;
      border: 1px solid rgba(2, 132, 199, 0.2);
    }
    .wp-zukai-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 4px;
      margin-top: 4px;
    }
    .wp-zukai-cell {
      background: #ffffff;
      border: 1px solid rgba(2, 132, 199, 0.18);
      border-radius: 5px;
      padding: 4px 6px;
      font-size: 9.5px;
      line-height: 1.3;
    }
    .work-preview-linkedin {
      background: linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%);
      color: #0f172a;
    }
    .wp-linkedin-steps {
      display: flex;
      flex-direction: column;
      gap: 3px;
      margin: 4px 0;
    }
    .wp-linkedin-step-item {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 9.5px;
      color: #334155;
      font-family: var(--mono);
      background: rgba(29, 78, 216, 0.06);
      padding: 3px 6px;
      border-radius: 4px;
    }
    .work-preview-riso {
      background: #f4efe6;
      color: #1d4ed8;
      background-image: radial-gradient(rgba(29, 78, 216, 0.15) 1px, transparent 1px);
      background-size: 12px 12px;
    }
    .wp-eyebrow {
      font-family: var(--mono);
      font-size: 9.5px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      opacity: 0.8;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .wp-headline {
      font-size: 13.5px;
      font-weight: 800;
      line-height: 1.25;
      letter-spacing: var(--tracking-tight);
    }
    .wp-chips {
      display: flex;
      gap: 6px;
      align-items: center;
      font-family: var(--mono);
      font-size: 9.5px;
    }
    .wp-chip {
      padding: 2px 7px;
      border-radius: 4px;
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.14);
    }
    .wp-chip-light {
      padding: 2px 7px;
      border-radius: 4px;
      background: rgba(15, 23, 42, 0.06);
      border: 1px solid rgba(15, 23, 42, 0.12);
      color: #1e293b;
    }
    .wp-timeline { display: flex; flex-direction: column; gap: 4px; margin-top: 4px; }
    .wp-track { display: flex; align-items: center; gap: 6px; font-family: var(--mono); font-size: 8.5px; color: #94a3b8; }
    .wp-track-bar { height: 7px; border-radius: 3px; flex: 1; background: rgba(255, 255, 255, 0.08); overflow: hidden; display: flex; gap: 3px; }
    .radar-cta-btn { height: 30px; padding: 0 11px; font-size: 11.5px; border-radius: 7px; flex-shrink: 0; white-space: nowrap; }
    .micro-pill-accent { background: var(--pill-bg); border-color: var(--pill-border); color: var(--pill-ink); font-weight: 600; }
    .micro-pill-ok { background: var(--am-emerald-soft); border-color: rgba(16, 185, 129, 0.3); color: #6ee7b7; font-weight: 600; }
    [data-theme="light"] .micro-pill-ok { background: #ecfdf5; border-color: #a7f3d0; color: #047857; }
    .work-card-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 8px;
      margin-bottom: 10px;
    }
    .work-aspect-tag {
      font-family: var(--mono);
      font-feature-settings: var(--font-features-numbers);
      font-size: 10.5px;
      font-weight: 600;
      padding: 3px 9px;
      border-radius: 999px;
      border: var(--hairline-dark);
      color: var(--ink-secondary);
      backdrop-filter: blur(8px);
      box-shadow: var(--inset-highlight);
      white-space: nowrap;
      flex-shrink: 0;
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }
    .work-format-tag {
      font-family: var(--mono);
      font-size: 10.5px;
      padding: 3px 8px;
      border-radius: 5px;
      background: rgba(127, 127, 127, 0.08);
      border: var(--hairline-dark);
      color: var(--muted);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .work-title {
      font-size: 15.5px;
      font-weight: 700;
      line-height: 1.42;
      margin: 0 0 8px;
      color: var(--ink);
      letter-spacing: var(--tracking-tight);
    }
    .work-desc {
      font-size: 13px;
      color: var(--muted);
      line-height: 1.58;
      margin: 0;
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .work-foot {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 10px;
      padding-top: 13px;
      border-top: var(--hairline-dark);
      font-size: 12px;
      flex-wrap: nowrap;
    }
    .work-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 11px;
      color: var(--dim);
      font-family: var(--mono);
      font-feature-settings: var(--font-features-numbers);
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .work-btn {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      font-size: 12px;
      font-weight: 600;
      padding: 6px 12px;
      border-radius: 8px;
      background: var(--surface-elevated);
      border: var(--hairline-dark-strong);
      color: var(--ink);
      text-decoration: none;
      white-space: nowrap;
      flex-shrink: 0;
      box-shadow: var(--inset-highlight);
      transition: all var(--duration-fast) var(--ease-spring);
    }
    .work-btn:hover {
      background: #18181b;
      border-color: rgba(255, 255, 255, 0.28);
      color: #fff;
      transform: translateY(-1px);
      box-shadow: var(--inset-highlight-button), 0 4px 12px rgba(0, 0, 0, 0.35);
    }
    .work-btn:active { transform: var(--press-scale); }
    .work-btn-main {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      font-size: 12px;
      font-weight: 600;
      padding: 6px 13px;
      border-radius: 8px;
      background: #18181b;
      border: 1px solid rgba(255, 255, 255, 0.2);
      color: #ffffff;
      text-decoration: none;
      white-space: nowrap;
      box-shadow: var(--inset-highlight-button), 0 2px 8px rgba(0, 0, 0, 0.35);
      transition: all var(--duration-fast) var(--ease-spring);
    }
    .work-btn-main:hover {
      background: #27272a;
      border-color: rgba(255, 255, 255, 0.32);
      transform: translateY(-1px);
      box-shadow: var(--inset-highlight-button), 0 4px 14px rgba(0, 0, 0, 0.45);
    }
    .work-btn-main:active { transform: var(--press-scale); }
    .work-btn-sub {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      font-size: 12px;
      font-weight: 500;
      padding: 6px 11px;
      border-radius: 8px;
      background: rgba(255, 255, 255, 0.05);
      border: var(--hairline-dark);
      color: var(--ink-secondary);
      text-decoration: none;
      white-space: nowrap;
      backdrop-filter: blur(8px);
      box-shadow: var(--inset-highlight);
      transition: all var(--duration-fast) var(--ease-spring);
    }
    .work-btn-sub:hover {
      background: rgba(255, 255, 255, 0.09);
      border-color: var(--hairline-dark-hover);
      color: var(--ink);
      transform: translateY(-1px);
    }
    .work-btn-sub:active { transform: var(--press-scale); }

    /* Modern 4-Column Software Footer */
    footer {
      background: var(--bg-alt);
      border-top: var(--hairline-dark);
      padding: 56px 0 32px;
      margin-top: 60px;
    }
    .footer-cols {
      display: grid;
      grid-template-columns: 1.6fr 1fr 1fr 1fr;
      gap: 36px;
      margin-bottom: 40px;
    }
    @media (max-width: 860px) {
      .footer-cols { grid-template-columns: repeat(2, 1fr); gap: 28px; }
    }
    @media (max-width: 520px) {
      .footer-cols { grid-template-columns: 1fr; gap: 24px; }
    }
    .footer-col h4 {
      font-size: 12.5px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--ink);
      margin: 0 0 14px;
    }
    .footer-col ul {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: 9px;
    }
    .footer-col a {
      color: var(--muted);
      text-decoration: none;
      font-size: 13px;
      transition: color var(--duration-fast) ease;
    }
    .footer-col a:hover {
      color: var(--ink);
    }
    .footer-bottom-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-top: 22px;
      border-top: var(--hairline-dark);
      font-size: 12px;
      color: var(--dim);
      flex-wrap: wrap;
      gap: 12px;
    }

    /* Radar Section Styling */
    .radar-api-banner {
      background: var(--bg-obsidian-surface);
      border: var(--hairline-dark);
      border-radius: 12px;
      padding: 16px 20px;
      margin-bottom: 24px;
      backdrop-filter: blur(16px);
      box-shadow: var(--shadow-obsidian-card);
    }
    .radar-method-badge {
      font-family: var(--mono);
      font-size: 11px;
      font-weight: 700;
      padding: 2px 7px;
      border-radius: 4px;
      background: var(--am-emerald-soft);
      border: 1px solid rgba(16, 185, 129, 0.35);
      color: var(--am-emerald);
      box-shadow: var(--inset-highlight);
    }
    .radar-api-url {
      font-family: var(--mono);
      font-size: 13px;
      color: var(--ink);
      font-weight: 500;
      word-break: break-all;
    }
    .radar-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 18px;
      margin-top: 20px;
    }
    @media (max-width: 1040px) { .radar-grid { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 680px) { .radar-grid { grid-template-columns: 1fr; } }
    .radar-card {
      background: var(--bg-obsidian-surface);
      backdrop-filter: blur(20px);
      border: var(--hairline-dark);
      border-radius: 14px;
      padding: 20px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      gap: 14px;
      box-shadow: var(--shadow-obsidian-card);
      transition: transform var(--duration-normal) var(--ease-spring),
                  border-color var(--duration-normal) ease,
                  box-shadow var(--duration-normal) ease;
    }
    .radar-card:hover {
      transform: translateY(-2px);
      border-color: var(--hairline-dark-hover);
      box-shadow: var(--shadow-obsidian-hover);
    }
    .radar-card-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 8px;
      flex-wrap: nowrap;
    }
    .radar-source-tag {
      font-family: var(--mono);
      font-size: 11px;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 4px;
      background: var(--pill-bg);
      color: var(--pill-ink);
      border: 1px solid var(--pill-border);
      white-space: nowrap;
      flex-shrink: 0;
    }
    .radar-source-tag.x-tag {
      background: rgba(255, 255, 255, 0.05);
      color: var(--ink);
      border: var(--hairline-dark);
      box-shadow: var(--inset-highlight);
    }
    [data-theme="light"] .radar-source-tag.x-tag {
      background: rgba(20, 20, 19, 0.06);
      color: #141413;
      border-color: rgba(20, 20, 19, 0.18);
    }
    .radar-hotness {
      font-family: var(--mono);
      font-feature-settings: var(--font-features-numbers);
      font-size: 11px;
      color: var(--am-amber);
      font-weight: 600;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      text-align: right;
    }
    .radar-title {
      font-size: 15px;
      font-weight: 700;
      line-height: 1.42;
      margin: 0 0 6px;
      color: var(--ink);
      letter-spacing: var(--tracking-tight);
    }
    .radar-summary {
      font-size: 13px;
      color: var(--muted);
      line-height: 1.58;
      margin: 0;
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .radar-foot {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 10px;
      padding-top: 12px;
      border-top: var(--hairline-dark);
      font-size: 12px;
      flex-wrap: nowrap;
    }
    .radar-foot-meta {
      display: flex;
      align-items: center;
      gap: 5px;
      font-family: var(--mono);
      font-feature-settings: var(--font-features-numbers);
      color: var(--dim);
      font-size: 11px;
      min-width: 0;
      overflow: hidden;
      white-space: nowrap;
    }
    .radar-foot-meta span:last-child {
      overflow: hidden;
      text-overflow: ellipsis;
    }

    /* Mobile Nav Strip */
    .mobile-nav-strip {
      display: none;
      border-top: var(--hairline-dark);
      background: rgba(7, 8, 12, 0.95);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
    }
    [data-theme="light"] .mobile-nav-strip {
      background: rgba(245, 244, 239, 0.96);
    }
    .mobile-nav-scroll {
      display: flex;
      align-items: center;
      gap: 10px;
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
      scrollbar-width: none;
      padding: 8px 16px;
      white-space: nowrap;
    }
    .mobile-nav-scroll::-webkit-scrollbar { display: none; }
    .mobile-nav-scroll a {
      font-size: 13px;
      color: var(--muted);
      padding: 4px 8px;
      border-radius: 6px;
      flex-shrink: 0;
      transition: color var(--duration-fast);
    }
    .mobile-nav-scroll a:hover {
      color: var(--ink);
    }
    .mobile-nav-pill-highlight {
      color: #c4b5fd !important;
      background: rgba(105, 81, 255, 0.14);
      border: 1px solid rgba(105, 81, 255, 0.35);
      font-weight: 600;
    }

    /* Responsive Overhaul */
    @media (max-width: 860px) {
      .nav-links { display: none; }
      .mobile-nav-strip { display: block; }
      .logo-sub { display: none; }
      .hero { padding: 48px 0 36px; }
      .hero h1 { font-size: clamp(26px, 6.2vw, 38px); line-height: 1.22; }
      .stage-mac-dots { display: none; }
      .stage-tabs {
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
        scrollbar-width: none;
        flex-wrap: nowrap;
      }
      .stage-tabs::-webkit-scrollbar { display: none; }
      .stage-tab { flex-shrink: 0; }
      .stage-viewport { height: 400px; }
      .stage-foot { flex-direction: column; align-items: flex-start; gap: 8px; }
      .cta-row { flex-direction: column; align-items: stretch; }
      .cta-row > * { width: 100%; justify-content: center; text-align: center; }
      .radar-api-banner { flex-direction: column; align-items: stretch; gap: 14px; }
    }
    .grid > *, .radar-grid > *, .pillars-grid > *, .family-grid > *, .works-grid > *, .bento-grid > * {
      min-width: 0;
      max-width: 100%;
    }
    .pack-cmd-box > span {
      min-width: 0;
      overflow-x: auto;
      scrollbar-width: none;
    }
    .pack-cmd-box > span::-webkit-scrollbar { display: none; }
    @media (max-width: 640px) {
      .container { padding: 0 16px; }
      .grid { grid-template-columns: minmax(0, 1fr); }
      .radar-grid { grid-template-columns: minmax(0, 1fr); }
      .pillars-grid { grid-template-columns: minmax(0, 1fr); }
      .family-grid { grid-template-columns: minmax(0, 1fr); }
      .works-grid { grid-template-columns: minmax(0, 1fr); }
      .bento-grid { grid-template-columns: minmax(0, 1fr); }
      .stage-viewport { height: 350px; }
    }

    /* Toast */
    #site-toast {
      position: fixed;
      bottom: 28px;
      right: 28px;
      background: rgba(14, 16, 23, 0.96);
      backdrop-filter: blur(20px);
      border: var(--hairline-violet);
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

function themeHeadScript(): string {
  return `<script>
(function() {
  try {
    var saved = localStorage.getItem('aimake-theme');
    var theme = saved || 'dark';
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.style.colorScheme = theme;
  } catch(e) {}
})();
function toggleAimakeTheme() {
  var cur = document.documentElement.getAttribute('data-theme') || 'dark';
  var next = cur === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  document.documentElement.style.colorScheme = next;
  try { localStorage.setItem('aimake-theme', next); } catch(e) {}
}
</script>`;
}

function renderTopNav(lang: SiteLang, activeSuffix = ''): string {
  const copy = UI_COPY[lang];
  const langNames: Record<SiteLang, string> = {
    zh: '简体中文',
    en: 'English',
    ja: '日本語',
    ko: '한국어',
  };
  const currentLangLabel: Record<SiteLang, string> = {
    zh: '中文',
    en: 'EN',
    ja: '日本語',
    ko: '한국어',
  };
  const langs: SiteLang[] = ['zh', 'en', 'ja', 'ko'];
  return `
  <nav class="topbar">
    <div class="container nav-inner">
      <div class="nav-brand-group">
        <a class="logo" href="/${lang}/">
          <img src="/brand/logos/symbol-color.svg" width="28" height="28" style="vertical-align:middle;display:inline-block;border-radius:6px;" alt="Aimake Studio Logo" />
          <span>Aimake Studio</span>
        </a>
        <span class="logo-sub">爱创工坊 · Local-First Multimodal Studio</span>
      </div>
      <div class="nav-links">
        <a href="/${lang}/#radar">${esc(copy.navRadar)}</a>
        <a href="/${lang}/#flywheel">${esc(copy.navFlywheel)}</a>
        <a href="/${lang}/#templates">${esc(copy.navTemplates)}</a>
        <a href="/${lang}/#cli">${esc(copy.navCli)}</a>
        <a href="/${lang}/#ecosystem">${esc(copy.navEcosystem)}</a>
        <a href="https://github.com/chicogong/aimake-creator/releases/tag/v2.0.0" target="_blank" rel="noopener">macOS</a>
      </div>
      <div class="nav-actions">
        <a href="/playground/" class="nav-cta-btn">
          <span>${esc(copy.navPlayground)}</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </a>
        <div class="lang-dropdown">
          <button type="button" class="lang-trigger" id="lang-trigger-btn" aria-haspopup="true" aria-expanded="false" aria-label="Select language">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20M2 12h20"></path>
            </svg>
            <span>${currentLangLabel[lang]}</span>
            <svg class="lang-chevron" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="m6 9 6 6 6-6"></path>
            </svg>
          </button>
          <div class="lang-menu" role="menu">
            ${langs
              .map(
                (l) => `
              <a href="/${l}/${activeSuffix}" class="lang-menu-item ${l === lang ? 'active' : ''}" role="menuitem">
                <span>${langNames[l]}</span>
                ${l === lang ? `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"></path></svg>` : ''}
              </a>`
              )
              .join('')}
          </div>
        </div>
        <button type="button" id="theme-toggle-btn" class="theme-toggle-btn" onclick="toggleAimakeTheme()" aria-label="Toggle color theme" title="切换浅色 / 深色模式">
          <svg class="icon-sun" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="4"></circle>
            <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"></path>
          </svg>
          <svg class="icon-moon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path>
          </svg>
        </button>
      </div>
    </div>
    <div class="mobile-nav-strip">
      <div class="container mobile-nav-scroll">
        <a href="/playground/" class="mobile-nav-pill-highlight">${esc(copy.navPlayground)}</a>
        <a href="https://github.com/chicogong/aimake-creator/releases/tag/v2.0.0" target="_blank" rel="noopener">macOS</a>
        <a href="/${lang}/#radar">${esc(copy.navRadar)}</a>
        <a href="/${lang}/#flywheel">${esc(copy.navFlywheel)}</a>
        <a href="/${lang}/#templates">${esc(copy.navTemplates)}</a>
        <a href="/${lang}/#cli">${esc(copy.navCli)}</a>
        <a href="/${lang}/#ecosystem">${esc(copy.navEcosystem)}</a>
      </div>
    </div>
  </nav>
  <script>
    (function() {
      var trigger = document.getElementById('lang-trigger-btn');
      if (!trigger) return;
      var dropdown = trigger.closest('.lang-dropdown');
      if (!dropdown) return;
      trigger.addEventListener('click', function(e) {
        e.stopPropagation();
        var isOpen = dropdown.classList.toggle('open');
        trigger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      });
      document.addEventListener('click', function(e) {
        if (!dropdown.contains(e.target)) {
          dropdown.classList.remove('open');
          trigger.setAttribute('aria-expanded', 'false');
        }
      });
    })();
  </script>`;
}

function renderLandingHtml(
  lang: SiteLang,
  templates: MarketplaceTemplateEntry[],
  packs: TemplatePack[],
  canonicalUrl: string
): string {
  const copy = UI_COPY[lang];
  const langs: SiteLang[] = ['zh', 'en', 'ja', 'ko'];

  const stagePresets: Array<{ label: string; tplId: string; stageKey: string }> = [
    { label: '16:9 苹果发布会 · Bento', tplId: 'apple-bento-launch', stageKey: 'bento' },
    { label: '3:4 小红书 · 瑞士网格', tplId: 'xhs-swiss-grid', stageKey: 'swiss' },
    { label: '16:9 极客黑 · 架构演示', tplId: 'ppt-linear-dark', stageKey: 'linear' },
    { label: '微信深度长文 · 流式', tplId: 'wechat-clean-editorial', stageKey: 'wechat' },
    { label: '9:16 短视频 · 剪映工程', tplId: 'video-cinema-talk', stageKey: 'video' },
  ];

  const packsHtml = packs
    .map((p) => {
      const installCmd = `aimake market install ${p.id}@${p.version}`;
      return `
      <div class="pillar-card" style="display:flex;flex-direction:column;justify-content:space-between;gap:12px;">
        <div>
          <div class="pillar-code">${esc(p.id)} · v${esc(p.version)} · ${p.templateIds.length} templates</div>
          <h3>${esc(p.name[lang])}</h3>
          <p>${esc(p.description[lang])}</p>
        </div>
        <div class="pack-cmd-box" data-copy="${esc(installCmd)}" title="Click to copy command">
          <span>${esc(installCmd)}</span>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;opacity:0.65;"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
        </div>
      </div>`;
    })
    .join('\n');

  const INITIAL_VISIBLE_TEMPLATES = 9;
  const tplCategoryCounts: Record<string, number> = {};
  for (const t of templates) {
    tplCategoryCounts[t.category] = (tplCategoryCounts[t.category] || 0) + 1;
  }

  const cardsHtml = templates
    .map((tpl, idx) => {
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

      const pal = getTemplatePalette(tpl.id);
      const isExtra = idx >= INITIAL_VISIBLE_TEMPLATES;
      const hasPreviewImg = fsSync.existsSync(path.join(PACKAGE_ROOT, 'templates', tpl.id, 'preview.png'));
      const visualHeaderHtml = hasPreviewImg
        ? `<a href="/playground/?template=${esc(tpl.id)}" class="tpl-thumb-box" style="background:${esc(pal.bg)};" aria-label="Open ${esc(tpl.name[lang])} in Web Playground">
            <img src="/templates/${esc(tpl.id)}/preview.png" alt="${esc(tpl.name[lang])} visual preview" class="tpl-thumb-img" loading="lazy" />
            <span class="tpl-palette-pill" aria-hidden="true">
              <span class="tpl-palette-dot" style="background:${esc(pal.bg)};"></span>
              <span class="tpl-palette-dot" style="background:${esc(pal.surface)};"></span>
              <span class="tpl-palette-dot" style="background:${esc(pal.accent)};"></span>
            </span>
          </a>`
        : `<a href="/playground/?template=${esc(tpl.id)}" class="tpl-swatch" style="background:${esc(pal.bg)};color:${esc(pal.ink)};" aria-label="Open ${esc(tpl.name[lang])} in Web Playground">
            <span class="tpl-swatch-bar" style="background:${esc(pal.accent)};"></span>
            <div class="tpl-swatch-lines">
              <div class="tpl-swatch-h" style="background:${esc(pal.ink)};"></div>
              <div class="tpl-swatch-s" style="background:${esc(pal.ink)};"></div>
            </div>
            <div class="tpl-swatch-cards">
              <div class="tpl-swatch-card" style="background:${esc(pal.surface)};"></div>
              <div class="tpl-swatch-card" style="background:${esc(pal.surface)};"></div>
              <div class="tpl-swatch-card" style="background:${esc(pal.accent)};opacity:0.35;"></div>
            </div>
          </a>`;

      return `
      <div class="tpl-card${isExtra ? ' is-collapsed-extra' : ''}" data-market-card="true"${isExtra ? ' data-extra-tpl="true"' : ''} data-cat="${esc(tpl.category)}" data-aspect="${esc(tpl.aspect)}" data-loc="${esc(tpl.defaultLocale)}" data-search="${esc((tpl.id + ' ' + tpl.name.zh + ' ' + tpl.name.en + ' ' + tpl.styleFamily + ' ' + tpl.tags.join(' ')).toLowerCase())}">
        <div>
          ${visualHeaderHtml}
          <div class="meta-row">
            <span style="min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">#${esc(tpl.id)} · v${esc(tpl.version)}</span>
            <span class="aspect-badge ${aspectClass}">${esc(tpl.aspect)}</span>
          </div>
          <h3><a href="/${lang}/templates/${tpl.id}/">${esc(tpl.name[lang])}</a></h3>
          <p>${esc(tpl.description[lang])}</p>
        </div>
        <div>
          <div class="formats">
            <span class="fmt-tag fmt-tag-family">${esc(tpl.styleFamily)}</span>
            ${tpl.supportedFormats.slice(0, 3).map((f) => `<span class="fmt-tag">${esc(f.toUpperCase())}</span>`).join('')}
          </div>
          <div class="tpl-cta-row">
            <a class="btn-primary tpl-cta-main" href="/playground/?template=${esc(tpl.id)}">${esc(copy.tplCtaRemix)}</a>
            <a class="btn-secondary tpl-cta-sub" href="/${lang}/templates/${tpl.id}/">${esc(copy.tplCtaDetail)}</a>
            <a class="btn-secondary tpl-cta-icon" href="aimake://remix?template=${esc(tpl.id)}" title="${esc(copy.tplCtaDesktop)}" aria-label="${esc(copy.tplCtaDesktop)}">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
            </a>
          </div>
        </div>
      </div>`;
    })
    .join('\n');

  const INITIAL_VISIBLE_RADAR = 6;
  const radarItems = CURATED_TREND_FIXTURES.slice(0, 16);
  const radarCatCounts: Record<string, number> = {};
  let radarXCount = 0;
  for (const r of radarItems) {
    const c = r.category || 'ai-tech';
    radarCatCounts[c] = (radarCatCounts[c] || 0) + 1;
    if ((r.source || '').includes('X') || (r.source || '').includes('Twitter')) radarXCount++;
  }

  const radarCardsHtml = radarItems
    .map((item, idx) => {
      const isX = (item.source || '').includes('X') || (item.source || '').includes('Twitter');
      const authorText = item.author ? esc(item.author) : '@aimake-creator';
      const playgroundLink = `/playground/?template=${encodeURIComponent(item.suggestedTemplate || 'apple-bento-launch')}&title=${encodeURIComponent(item.title)}`;
      const cleanHotness = stripDecorEmoji(item.hotness || '高关注');
      const isExtra = idx >= INITIAL_VISIBLE_RADAR;
      const sourceDisplay = isX
        ? item.source.trim().startsWith('X')
          ? `𝕏${item.source.trim().slice(1)}`
          : `𝕏 ${item.source}`
        : item.source;
      return `
      <div class="radar-card${isExtra ? ' is-collapsed-extra' : ''}"${isExtra ? ' data-extra-radar="true"' : ''} data-radar-cat="${esc(item.category || 'ai-tech')}" data-radar-source="${isX ? 'x' : 'other'}">
        <div>
          <div class="radar-card-head" style="margin-bottom:10px;">
            <span class="radar-source-tag ${isX ? 'x-tag' : ''}">${esc(sourceDisplay)}</span>
            <span class="radar-hotness">${esc(cleanHotness)}</span>
          </div>
          <h4 class="radar-title">${esc(item.title)}</h4>
          <p class="radar-summary">${esc(item.summary || '')}</p>
        </div>
        <div class="radar-foot">
          <div class="radar-foot-meta">
            <span>${authorText}</span>
            <span>·</span>
            <span style="color:var(--cobalt);font-weight:600;">#${esc(item.suggestedTemplate || 'bento')}</span>
          </div>
          <a href="${playgroundLink}" class="btn-primary radar-cta-btn">${esc(copy.radarCtaRemix)}</a>
        </div>
      </div>`;
    })
    .join('\n');

  const flywheelMicroUiList = [
    `<div class="flywheel-micro-ui">
      <div class="micro-row">
        <div style="display:flex;gap:6px;flex-wrap:wrap;">
          <span class="micro-pill">X Thread</span>
          <span class="micro-pill">WeChat</span>
          <span class="micro-pill">CSV</span>
          <span class="micro-pill">SRT/VTT</span>
        </div>
        <span class="micro-pill micro-pill-ok">→ sources/raw.md</span>
      </div>
      <div class="micro-row" style="font-size:10.5px;color:var(--dim);">
        <span>0 凭证提取 · 防盗链清洗 · 事实坐标留存</span>
        <span style="color:var(--emerald);font-weight:600;">100% Lossless</span>
      </div>
    </div>`,
    `<div class="flywheel-micro-ui">
      <div class="micro-row">
        <span>wiki/index.md · 预算控制</span>
        <span class="micro-pill micro-pill-ok">2,480 / 3,000 tokens</span>
      </div>
      <div class="micro-meter-track"><div class="micro-meter-fill" style="width:82%;"></div></div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;">
        <span class="micro-pill micro-pill-accent">[[style-dna]]</span>
        <span class="micro-pill">[[llm-wiki]]</span>
        <span class="micro-pill">cite:L18</span>
      </div>
    </div>`,
    `<div class="flywheel-micro-ui">
      <div class="micro-row">
        <span class="micro-pill micro-pill-accent">storyboard.deck.md</span>
        <span style="color:var(--emerald);font-weight:600;">74ms 编译直出</span>
      </div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;">
        <span class="micro-pill">3x PNG</span>
        <span class="micro-pill">WeChat HTML</span>
        <span class="micro-pill">PDF</span>
        <span class="micro-pill">OOXML PPTX</span>
        <span class="micro-pill">60fps MP4</span>
      </div>
    </div>`,
    `<div class="flywheel-micro-ui">
      <div class="micro-row">
        <span>WeChat 草稿箱 · 小红书 3:4 · 知乎专栏</span>
        <span class="micro-pill micro-pill-ok">Synced</span>
      </div>
      <div class="micro-row" style="font-size:10.5px;">
        <span style="color:var(--dim);">wiki/published.md</span>
        <span class="micro-pill micro-pill-accent">Compound Leverage +1</span>
      </div>
    </div>`,
  ];

  const flywheelStages = copy.bentoItems.slice(0, 4);
  const privacyItem = copy.bentoItems[4];

  const bentoHtml = flywheelStages
    .map((item, idx) => {
      return `
      <div class="bento-card">
        <div>
          <div class="bento-card-head">
            <div class="bento-stage-tag">${esc(item.stage)}</div>
            <span class="bento-badge">${esc(item.badge)}</span>
          </div>
          <h3>${esc(item.title)}</h3>
          <p>${esc(item.desc)}</p>
        </div>
        ${flywheelMicroUiList[idx] || ''}
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

  const vaultBannerHtml = privacyItem
    ? `
      <div class="flywheel-vault-banner">
        <div style="display:flex;align-items:flex-start;gap:14px;flex:1 1 400px;min-width:0;">
          <div style="width:38px;height:38px;border-radius:10px;background:rgba(16,185,129,0.12);border:1px solid rgba(16,185,129,0.3);color:var(--emerald);display:flex;align-items:center;justify-content:center;flex-shrink:0;" aria-hidden="true">
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>
          </div>
          <div>
            <div class="bento-stage-tag" style="margin-bottom:4px;">${esc(privacyItem.stage)}</div>
            <h3 style="margin:0 0 5px;font-size:17px;font-weight:700;letter-spacing:-0.02em;color:var(--ink);">${esc(privacyItem.title)}</h3>
            <p style="margin:0;font-size:13px;color:var(--muted);line-height:1.58;">${esc(privacyItem.desc)}</p>
          </div>
        </div>
        <div class="flywheel-vault-pills">
          ${privacyItem.details
            .map((d) => `<span class="flywheel-vault-pill">✓ ${esc(d)}</span>`)
            .join('')}
        </div>
      </div>`
    : '';

  const multimodalWorks = [
    {
      id: 'work-vibe-coding',
      sampleKey: 'agent',
      aspect: '16:9',
      format: '原生 OOXML .pptx',
      platform: '苹果发布会',
      template: 'apple-bento-launch',
      title: '《Andrej Karpathy: \'Vibe Coding\' 与个人软件的全面觉醒》',
      summary:
        '前特斯拉 AI 总监引爆全网：代码语法敲击归零，跟随直觉机感对话。从灵感闪现到 20 分钟交付专属微应用，软件受众第一次变成「仅限自己一人」。',
      badge: '4.8M 浏览 · @karpathy',
      tplId: 'apple-bento-launch',
      previewHtml: `
        <div class="work-preview work-preview-bento">
          <div class="wp-eyebrow"><span style="color:#a5b4fc;">BENTO LAUNCH · 16:9</span><span style="color:#38bdf8;">@karpathy on X</span></div>
          <div class="wp-headline">Karpathy: Vibe Coding 与个人软件觉醒</div>
          <div class="wp-bento-mini-grid">
            <div class="wp-bento-tile">
              <span style="color:#94a3b8;font-size:9px;">手写语法</span>
              <strong style="font-size:13px;color:#34d399;">0% 归零</strong>
            </div>
            <div class="wp-bento-tile">
              <span style="color:#94a3b8;font-size:9px;">交付周期</span>
              <strong style="font-size:13px;color:#38bdf8;">20 分钟</strong>
            </div>
            <div class="wp-bento-tile">
              <span style="color:#94a3b8;font-size:9px;">受众规模</span>
              <strong style="font-size:12px;color:#c4b5fd;">仅限 1 人</strong>
            </div>
          </div>
          <div class="wp-chips">
            <span class="wp-chip">Audience of One</span>
            <span class="wp-chip" style="color:#38bdf8;">4.8M Views · 42K 点赞</span>
          </div>
        </div>`,
    },
    {
      id: 'work-llm-wiki',
      sampleKey: 'deepseek',
      aspect: '3:4',
      format: '3x Retina PNG',
      platform: '小红书图文',
      template: 'xhs-swiss-grid',
      title: '《Andrej Karpathy: 为什么纯本地「LLM Wiki」构建永续第二大脑》',
      summary:
        '瑞士国际网格排版系统。抛弃黑盒向量数据库与盲目 RAG：以版本化双向链接 Markdown 为基底，恒定上下文预算约束（<= 3,000t），实现 100% 隐私零幻觉。',
      badge: '2.4M 收藏 · @karpathy',
      tplId: 'xhs-swiss-grid',
      previewHtml: `
        <div class="work-preview work-preview-swiss">
          <div class="wp-eyebrow"><span>SWISS GRID · 3:4</span><span style="color:#e11d48;font-weight:700;">01 / 04</span></div>
          <div class="wp-headline">Karpathy: 纯本地 LLM Wiki 知识架构</div>
          <div class="wp-swiss-specs">
            <div><strong>恒定预算</strong>index.md &lt;= 3,000t</div>
            <div><strong>双向链接</strong>版本化 Markdown</div>
            <div><strong>100% 纯离线</strong>0 KB 数据外泄</div>
            <div><strong>Style DNA</strong>反 AI 假大空</div>
          </div>
          <div class="wp-chips">
            <span class="wp-chip-light" style="color:#0f172a;font-weight:700;">CH-8001</span>
            <span class="wp-chip-light" style="color:#e11d48;border-color:rgba(225,29,72,0.3);">2.4M 收藏 · 3x PNG</span>
          </div>
        </div>`,
    },
    {
      id: 'work-deepseek-r1',
      sampleKey: 'agent',
      aspect: '16:9',
      format: '原生 OOXML .pptx',
      platform: '商业演示',
      template: 'ppt-linear-dark',
      title: '《DeepSeek-R1: 纯强化学习与开源权重瓦解硅谷算力霸权》',
      summary:
        '极客黑几何科技排版。无冷启动 SFT 纯 RL 推理激发的 Aha Moment，671B MoE 开源权重在本地 Apple Silicon / Ollama 极速狂飙，双击原生可编辑。',
      badge: '12M 轰动 · @deepseek_ai',
      tplId: 'ppt-linear-dark',
      previewHtml: `
        <div class="work-preview work-preview-linear">
          <div class="wp-eyebrow"><span style="color:#a5b4fc;">LINEAR DARK · 16:9</span><span style="color:#6ee7b7;">12M X VIEWS</span></div>
          <div class="wp-headline">DeepSeek-R1 纯 RL 与开源权重</div>
          <div class="wp-linear-flow">
            <span class="wp-linear-node">Pure RL (No SFT)</span>
            <span style="color:#64748b;">➔</span>
            <span class="wp-linear-node" style="background:rgba(56,189,248,0.25);border-color:rgba(56,189,248,0.4);color:#7dd3fc;">671B MoE (37B Act)</span>
            <span style="color:#64748b;">➔</span>
            <span class="wp-linear-node" style="background:rgba(16,185,129,0.25);border-color:rgba(16,185,129,0.4);color:#6ee7b7;">112 tok/s Local</span>
          </div>
          <div class="wp-chips">
            <span class="wp-chip" style="border-color:rgba(105,81,255,0.5);color:#c4b5fd;">双击可编辑文本框</span>
            <span class="wp-chip" style="color:#6ee7b7;">Apple Silicon 端侧</span>
          </div>
        </div>`,
    },
    {
      id: 'work-claude-code',
      sampleKey: 'mcp',
      aspect: '4:5',
      format: 'Retina PNG / PDF',
      platform: '领英专栏',
      template: 'linkedin-exec-carousel',
      title: '《Claude Code: 终端原生 Agent 与软件工程全权委托新范式》',
      summary:
        '高管级横滑卡片与方法论骨架。Anthropic 官方终端 Agent 实战全景：深潜代码树、终端沙盒执行与 Git Diff 零损安全回滚，重新定义资深工程师的控制台。',
      badge: '3.2M 讨论 · @AnthropicAI',
      tplId: 'linkedin-exec-carousel',
      previewHtml: `
        <div class="work-preview work-preview-linkedin">
          <div class="wp-eyebrow" style="color:#1d4ed8;"><span>EXECUTIVE CAROUSEL · 4:5</span><span>@AnthropicAI on X</span></div>
          <div class="wp-headline" style="color:#0f172a;">Claude Code 终端原生 Agent 新范式</div>
          <div class="wp-linkedin-steps">
            <div class="wp-linkedin-step-item"><span style="color:#1d4ed8;font-weight:700;">01</span> <span>Git 树上下文深度理解</span></div>
            <div class="wp-linkedin-step-item"><span style="color:#1d4ed8;font-weight:700;">02</span> <span>终端沙盒执行与测试验证</span></div>
            <div class="wp-linkedin-step-item"><span style="color:#1d4ed8;font-weight:700;">03</span> <span>Git Diff 审查与零损安全回滚</span></div>
          </div>
          <div class="wp-chips">
            <span class="wp-chip-light" style="color:#1d4ed8;">3.2M 讨论 · @AnthropicAI</span>
            <span class="wp-chip-light">Vector PDF Ready</span>
          </div>
        </div>`,
    },
    {
      id: 'work-local-first',
      sampleKey: 'podcast',
      aspect: '9:16',
      format: '60fps MP4 / 剪映',
      platform: '短视频口播',
      template: 'video-cinema-talk',
      title: '《Local-First 软件复兴: 严肃创作者逃离云端 SaaS 订阅陷阱》',
      summary:
        '电影级对谈播客排版。Ink & Switch 与独立黑客的尊严反叛：你拥有你的数据，哪怕云端灰飞烟灭；0ms 极致交互响应，告别月付租金勒索。',
      badge: '1.8M 关注 · @inkandswitch',
      tplId: 'video-cinema-talk',
      previewHtml: `
        <div class="work-preview work-preview-video">
          <div class="wp-eyebrow"><span style="color:#c4b5fd;">CINEMA 9:16 · 60FPS</span><span style="color:#34d399;">@inkandswitch on X</span></div>
          <div class="wp-headline">Local-First 软件复兴 · 逃离订阅陷阱</div>
          <div class="wp-timeline">
            <div class="wp-track"><span style="width:16px;">V1</span><div class="wp-track-bar"><span style="width:45%;background:#6951ff;"></span><span style="width:52%;background:#8b5cf6;"></span></div></div>
            <div class="wp-track"><span style="width:16px;">T1</span><div class="wp-track-bar"><span style="width:30%;background:#f59e0b;"></span><span style="width:35%;background:#fbbf24;"></span><span style="width:30%;background:#f59e0b;"></span></div></div>
            <div class="wp-track"><span style="width:16px;">A1</span><div class="wp-track-bar"><span style="width:94%;background:#10b981;"></span></div></div>
          </div>
          <div class="wp-chips">
            <span class="wp-chip" style="color:#34d399;">1.8M 关注 · Ink &amp; Switch</span>
            <span class="wp-chip">0ms 交互延迟</span>
          </div>
        </div>`,
    },
    {
      id: 'work-mcp-protocol',
      sampleKey: 'strategy',
      aspect: '1:1',
      format: '矢量 SVG / 3x PNG',
      platform: '日本図解',
      template: 'x-zukai-quad',
      title: '《Anthropic MCP 协议: 本地数据与工具调用的通用 USB-C 架构》',
      summary:
        '日系结构化图解模型。彻底终结每个 Agent 自写 API 适配器的混乱，以开放 JSON-RPC 协议标准联通本地文件系统、数据库与私有工作流。',
      badge: '2.9M 采纳 · @modelcontextprotocol',
      tplId: 'x-zukai-quad',
      previewHtml: `
        <div class="work-preview work-preview-zukai">
          <div class="wp-eyebrow" style="color:#0284c7;"><span>ZUKAI QUAD · 1:1</span><span>OPEN STANDARD</span></div>
          <div class="wp-headline" style="color:#0369a1;">Anthropic MCP · 本地外脑 USB-C</div>
          <div class="wp-zukai-grid">
            <div class="wp-zukai-cell"><span style="color:#0369a1;font-weight:700;">协议</span><br/><span style="font-size:9px;color:#475569;">JSON-RPC</span></div>
            <div class="wp-zukai-cell"><span style="color:#0369a1;font-weight:700;">本地</span><br/><span style="font-size:9px;color:#475569;">文件系统</span></div>
            <div class="wp-zukai-cell"><span style="color:#0369a1;font-weight:700;">数据</span><br/><span style="font-size:9px;color:#475569;">SQLite/DB</span></div>
            <div class="wp-zukai-cell" style="background:#e0f2fe;"><span style="color:#0284c7;font-weight:700;">生态</span><br/><span style="font-size:9px;color:#0369a1;">通用互通</span></div>
          </div>
          <div class="wp-chips">
            <span class="wp-chip-light" style="color:#0284c7;">2.9M 开发者采纳</span>
            <span class="wp-chip-light">1:1 矢量 SVG</span>
          </div>
        </div>`,
    },
    {
      id: 'work-wechat-ft',
      sampleKey: 'token',
      aspect: '流式长文',
      format: '100% 内联 HTML',
      platform: '微信公众号',
      template: 'apple-dark-keynote',
      title: '《金融时报 FT 深度调查: 为什么企业正在从通用公有云大模型全面撤退》',
      summary:
        '极简暗黑杂志美学。零外部样式表与脚本依赖，在微信公众号后台直接 Cmd+V 粘贴即可无损呈现，数据安全与合规审计三重重压下的反思。',
      badge: '10w+ 深度调查 · 零错位',
      tplId: 'apple-dark-keynote',
      previewHtml: `
        <div class="work-preview work-preview-wechat">
          <div class="wp-eyebrow"><span style="color:#fbbf24;">EDITORIAL · INLINE CSS</span><span>阅读 8 分钟</span></div>
          <div class="wp-headline">FT 调查: 企业从公有云大模型全面撤退</div>
          <div class="wp-wechat-quote-bar">
            “私有化蒸馏与本地优先架构，正在重新夺回企业数据的尊严。”
          </div>
          <div class="wp-chips">
            <span class="wp-chip" style="color:#fbbf24;">❤️ 10w+ 深度</span>
            <span class="wp-chip">100% 纯内联样式</span>
          </div>
        </div>`,
    },
    {
      id: 'work-memo-reflection',
      sampleKey: 'embodied',
      aspect: '3:4',
      format: '3x Retina PNG',
      platform: '苹果备忘录手记',
      template: 'xhs-apple-notes',
      title: '《硅谷超级个体的 10 条反共识创作铁律：拒绝在 AI 泡沫中迷失》',
      summary:
        'Apple Notes 真诚手记质感。品味优于算力、本地资产胜过云端订阅、真实问题压倒技术虚荣。写给严肃创作者的安静指南。',
      badge: '真诚反共识手记 · 零废话',
      tplId: 'xhs-apple-notes',
      previewHtml: `
        <div class="work-preview work-preview-riso" style="background:#fffbeb;border-color:rgba(217,119,6,0.2);">
          <div class="wp-eyebrow" style="color:#d97706;"><span>APPLE NOTES · 3:4</span><span>CREATOR MANIFESTO</span></div>
          <div class="wp-headline" style="color:#78350f;font-size:14.5px;letter-spacing:-0.03em;">硅谷超级个体 10 条反共识创作铁律<br/><span style="color:#b45309;font-size:11px;font-weight:500;">拒绝在技术虚荣与 AI 泡沫中迷失</span></div>
          <div style="font-family:var(--font);font-size:11px;color:#92400e;display:flex;flex-direction:column;gap:3px;padding:4px 0;border-top:1px dashed rgba(217,119,6,0.3);border-bottom:1px dashed rgba(217,119,6,0.3);">
            <span>• 品味与审美是唯一的不可替代编译器</span>
            <span>• 本地私有资产永远胜过第三方云端订阅</span>
          </div>
          <div class="wp-chips">
            <span class="wp-chip-light" style="border-color:rgba(217,119,6,0.3);color:#b45309;">真诚手记质感</span>
            <span class="wp-chip-light" style="color:#78350f;">3x Retina PNG</span>
          </div>
        </div>`,
    },
  ];

  const worksCardsHtml = multimodalWorks
    .map((w) => {
      const playgroundLink = `/playground/?sample=${encodeURIComponent(w.sampleKey)}&template=${encodeURIComponent(w.tplId)}&title=${encodeURIComponent(w.title)}`;
      const aspectClass =
        w.aspect === '16:9'
          ? 'aspect-16-9'
          : w.aspect === '3:4'
          ? 'aspect-3-4'
          : w.aspect === '4:5'
          ? 'aspect-4-5'
          : w.aspect === '9:16'
          ? 'aspect-9-16'
          : w.aspect === '1:1'
          ? 'aspect-1-1'
          : 'aspect-flow';
      return `
      <div class="work-card" data-work-id="${esc(w.id)}">
        <div>
          <a href="${playgroundLink}" style="display:block;text-decoration:none;" aria-label="在工坊打开 ${esc(w.title)}">${w.previewHtml}</a>
          <div class="work-card-head">
            <span class="work-aspect-tag ${aspectClass}">
              <span>${esc(w.aspect)}</span>
              <span>·</span>
              <span>${esc(w.platform)}</span>
            </span>
            <span class="work-format-tag">${esc(w.format)}</span>
          </div>
          <h3 class="work-title">${esc(w.title)}</h3>
          <p class="work-desc">${esc(w.summary)}</p>
        </div>
        <div class="work-foot">
          <div class="work-badge">
            <span class="pulse-dot" style="flex-shrink:0;"></span>
            <span>${esc(w.badge)}</span>
          </div>
          <div style="display:flex;align-items:center;gap:6px;flex-shrink:0;">
            <a href="${playgroundLink}&mode=play" class="work-btn-sub" title="在工坊即时试玩">试玩</a>
            <a href="${playgroundLink}" class="work-btn-main" title="基于本款模态快速生成">
              <span>做同款</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </a>
          </div>
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
  <title>${esc(copy.siteTitle)}</title>
  <meta name="description" content="${esc(copy.heroSub)}" />
  ${verificationMetaTags()}
  ${themeHeadScript()}
  <link rel="canonical" href="${canonicalUrl}" />
  <link rel="alternate" hreflang="x-default" href="https://aimake.cc/" />
  ${langs.map((l) => `<link rel="alternate" hreflang="${UI_COPY[l].htmlLang}" href="https://aimake.cc/${l}/" />`).join('\n  ')}
  <meta property="og:title" content="${esc(copy.siteTitle)}" />
  <meta property="og:description" content="${esc(copy.heroSub)}" />
  <meta property="og:url" content="${canonicalUrl}" />
  <meta property="og:site_name" content="Aimake" />
  <meta property="og:type" content="website" />
  <style>${sharedSiteCss()}</style>
</head>
<body class="is-loading">
  ${renderTopNav(lang)}

  <!-- HERO -->
  <header class="hero">
    <div class="container hero-split">
      <div>
        <h1 class="hero-headline">
          <span class="hero-headline-main">${esc(copy.heroTitleMain || copy.heroTitle)}</span>
          <span class="hero-headline-accent">${esc(copy.heroTitleAccent || '')}</span>
        </h1>
        <p class="lead">${esc(copy.heroSub)}</p>
        <div class="hero-cta-group">
          <div class="cta-row">
            <a class="btn-primary" href="/playground/">
              <span>${esc(copy.primaryCta)}</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </a>
            <a class="btn-secondary" href="https://github.com/chicogong/aimake-creator/releases/download/v2.0.0/Aimake-v2.0.0-macOS.dmg" title="下载 macOS 桌面端安装包 (.dmg)">
              <svg width="14" height="14" viewBox="0 0 170 170" fill="currentColor"><path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.69-3.04-7.67-7.81-11.96-14.34-6.3-9.78-11.05-20.98-14.25-33.61-3.21-12.63-4.82-24.31-4.82-35.04 0-14.46 3.69-26.47 11.08-36.03 7.39-9.57 16.63-14.46 27.72-14.68 4.58 0 9.88 1.25 15.91 3.75 6.02 2.5 10.22 3.79 12.6 3.86 1.85 0 6.13-1.32 12.84-3.97 6.71-2.65 12.04-3.83 15.99-3.53 12.3.82 22.04 5.37 29.23 13.66-10.76 6.53-16.03 15.54-15.82 27.05.22 9.03 3.63 16.63 10.23 22.82 6.6 6.19 14.48 9.68 23.63 10.49-2.5 7.4-5.39 14.8-8.67 22.2zM119.22 31.84c0-7.39 2.66-14.34 7.98-20.85 5.32-6.52 11.92-10.51 19.8-11.99.33 1.1.5 2.1.5 3 0 7.28-2.77 14.3-8.31 21.05-5.54 6.75-12.29 10.7-20.25 11.85-.22-.98-.32-1.98-.32-3.06z"/></svg>
              <span>macOS (.dmg)</span>
            </a>
            <a class="btn-secondary" href="#templates">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>
              <span>${esc(copy.secondaryCta)}</span>
            </a>
          </div>
          <div class="hero-cli-row">
            <div class="quick-cli-pill" id="hero-quick-cli" title="Click to copy install command" data-copy="${esc(copy.quickInstall)}">
              <span class="cli-prompt-symbol">$</span>
              <span class="cli-cmd-text">${esc(copy.quickInstall)}</span>
              <span class="cli-copy-hint">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                <span>复制</span>
              </span>
            </div>
          </div>
        </div>
        <div class="deliverables-strip">
          <span class="deliverables-label">支持原生直出：</span>
          <span class="deliverables-badge"><span class="badge-dot" style="background:#a78bfa;"></span>3x Retina PNG</span>
          <span class="deliverables-badge"><span class="badge-dot" style="background:#10b981;"></span>微信公众号内联富文本</span>
          <span class="deliverables-badge"><span class="badge-dot" style="background:#38bdf8;"></span>微软原生 PPTX</span>
          <span class="deliverables-badge"><span class="badge-dot" style="background:#f59e0b;"></span>矢量 PDF</span>
          <span class="deliverables-badge"><span class="badge-dot" style="background:#f43f5e;"></span>60fps H.264 视频</span>
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
                  `<button type="button" class="stage-tab ${idx === 0 ? 'active' : ''}" data-stage="${preset.stageKey}" data-src="/${lang}/templates/${preset.tplId}/preview.html">${esc(preset.label)}</button>`
              )
              .join('')}
          </div>
        </div>
        <div class="stage-viewport">
          <!-- Slide 1: Apple Keynote Bento -->
          <div class="hero-stage-slide hss-bento active" data-slide="bento">
            <div>
              <div class="hss-bento-head">
                <span style="display:inline-flex;align-items:center;gap:6px;"><span class="pulse-dot"></span>PRESENTATION · KEYNOTE BENTO</span>
                <span style="color:#a78bfa;">@karpathy on X · 4.8M VIEWS · SLIDE 01 / 04</span>
              </div>
              <div class="hss-bento-title">Andrej Karpathy: 'Vibe Coding' 与个人软件的全面觉醒</div>
              <div class="hss-bento-flow">
                <span class="hss-bento-node">
                  <span class="hss-bento-node-icon"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12h-6l-2 3h-4l-2-3H2"/></svg></span>
                  敲击语法归零
                </span>
                <span class="hss-bento-arrow">→</span>
                <span class="hss-bento-node" style="background:rgba(56,189,248,0.18);border-color:rgba(56,189,248,0.4);color:#7dd3fc;">
                  <span class="hss-bento-node-icon"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg></span>
                  跟随直觉机感对话
                </span>
                <span class="hss-bento-arrow">→</span>
                <span class="hss-bento-node" style="background:rgba(16,185,129,0.18);border-color:rgba(16,185,129,0.4);color:#6ee7b7;">
                  <span class="hss-bento-node-icon"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg></span>
                  20 分钟专属微软件交付
                </span>
              </div>
              <div class="hss-bento-metrics">
                <div class="hss-bento-tile">
                  <div class="hss-bento-val" style="color:#34d399;">
                    <span>0%</span>
                    <svg width="28" height="16" viewBox="0 0 28 16" fill="none"><path d="M1 14L8 10L16 12L27 2" stroke="#34d399" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                  </div>
                  <div class="hss-bento-label">手写语法负担</div>
                  <div class="hss-bento-sub">完全由 LLM 即时编译生成</div>
                </div>
                <div class="hss-bento-tile">
                  <div class="hss-bento-val" style="color:#c4b5fd;">
                    <span>20 min</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#c4b5fd" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>
                  </div>
                  <div class="hss-bento-label">个人软件交付</div>
                  <div class="hss-bento-sub">从灵感到浏览器即刻可用</div>
                </div>
                <div class="hss-bento-tile">
                  <div class="hss-bento-val" style="color:#38bdf8;">
                    <span>1 人</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                  </div>
                  <div class="hss-bento-label">受众规模</div>
                  <div class="hss-bento-sub">Audience of One · 专属定制</div>
                </div>
              </div>
            </div>
            <div class="hss-foot-action">
              <span style="display:inline-flex;align-items:center;gap:8px;">
                <kbd style="background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.14);border-radius:4px;padding:1px 5px;font-family:var(--mono);font-size:10px;color:#cbd5e1;">Apple Keynote / OOXML .pptx</kbd>
                确定性排版内核 · 双击原生可编辑文本框与矢量形状
              </span>
              <a href="/playground/?sample=agent&template=apple-bento-launch&title=Andrej%20Karpathy%3A%20%27Vibe%20Coding%27%20%E4%B8%8E%E4%B8%AA%E4%BA%BA%E8%BD%AF%E4%BB%B6%E7%9A%84%E5%85%A8%E9%9D%A2%E8%A7%89%E9%86%92" class="stage-remix-btn">做同款作品 ↗</a>
            </div>
          </div>

          <!-- Slide 2: Swiss Grid (Cream / Crimson / Black) -->
          <div class="hero-stage-slide hss-swiss" data-slide="swiss">
            <div>
              <div style="display:flex;justify-content:space-between;font-family:var(--mono);font-size:11px;color:#64748b;margin-bottom:8px;">
                <span style="font-weight:700;">NEUE GRAFIK · ZÜRICH ISSUE 26</span>
                <span style="color:#e11d48;font-weight:700;">@karpathy on X · 2.4M 收藏 · 3:4 SWISS GRID</span>
              </div>
              <div class="hss-swiss-grid-wrap">
                <div class="hss-swiss-num-col">
                  <div class="hss-swiss-num">01</div>
                  <div class="hss-swiss-vert-tag">EST. 1958 · DIE NEUE GRAPHIK</div>
                </div>
                <div class="hss-swiss-main">
                  <div class="hss-swiss-title">为什么纯本地「LLM Wiki」<br/>是超级个体的永续第二大脑</div>
                  <div class="hss-swiss-table">
                    <div class="hss-swiss-cell"><strong>恒定预算 &lt;= 3000t</strong>index.md 物理级上下文约束</div>
                    <div class="hss-swiss-cell"><strong>版本化 Markdown</strong>替代黑盒向量数据库与盲目 RAG</div>
                    <div class="hss-swiss-cell"><strong>100% 纯离线端侧</strong>0 KB 数据外泄 · 零云端依赖</div>
                    <div class="hss-swiss-cell"><strong>反 AI 假大空 Style DNA</strong>注入个人高频句式与批判性思维</div>
                  </div>
                </div>
              </div>
            </div>
            <div class="hss-foot-action">
              <span style="display:inline-flex;align-items:center;gap:8px;">
                <span style="font-family:var(--mono);background:#0f172a;color:#fff;padding:1px 6px;border-radius:3px;font-size:10px;">CH-8001</span>
                瑞士国际主义网格 · 严谨排版无孤字断行 · 3x Retina PNG
              </span>
              <a href="/playground/?sample=karpathy_wiki&template=xhs-swiss-grid&aspect=3:4&title=Andrej%20Karpathy%3A%20%E4%B8%BA%E4%BB%80%E4%B9%88%E7%BA%AF%E6%9C%AC%E5%9C%B0%E3%80%8CLM%20Wiki%E3%80%8D%E6%9E%84%E5%BB%BA%E7%AC%AC%E4%BA%8C%E5%A4%A7%E8%84%91" class="stage-remix-btn stage-remix-btn-dark">做同款图文 ↗</a>
            </div>
          </div>

          <!-- Slide 3: Linear Geek Dark -->
          <div class="hero-stage-slide hss-linear" data-slide="linear">
            <div style="display:flex;flex-direction:column;flex:1;min-height:0;">
              <div style="display:flex;justify-content:space-between;font-family:var(--mono);font-size:11px;color:#94a3b8;margin-bottom:10px;">
                <span>MARKDOWN AST ➔ NATIVE OOXML PPTX</span>
                <span style="color:#818cf8;">@deepseek_ai on X · 12M VIEWS · 16:9 LINEAR</span>
              </div>
              <div class="hss-linear-split">
                <div class="hss-code-win">
                  <div class="hss-code-win-bar">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                    <span>decks/deepseek-r1.deck.md</span>
                  </div>
                  <div><span class="kw">---</span></div>
                  <div><span class="prop">title</span>: <span class="str">"DeepSeek-R1 纯强化学习革命"</span></div>
                  <div><span class="prop">template</span>: <span class="str">"ppt-linear-dark"</span></div>
                  <div><span class="prop">aspect</span>: <span class="str">"16:9"</span></div>
                  <div><span class="kw">---</span></div>
                  <div style="margin-top:4px;"><span class="heading"># 纯 RL 推理与开源蒸馏瓦解算力霸权</span></div>
                  <div>- 纯强化学习无需冷启动 SFT</div>
                  <div>- 671B MoE / 37B 激活开源权重</div>
                  <div>- Apple Silicon 112 tok/s 满血推理</div>
                </div>
                <div class="hss-preview-win">
                  <div>
                    <div style="font-size:10.5px;font-family:var(--mono);color:#a78bfa;margin-bottom:4px;">OUTPUT DELIVERABLE</div>
                    <div style="font-size:14px;font-weight:700;color:#f8fafc;letter-spacing:-0.02em;">DeepSeek-R1 纯 RL 与开源权重</div>
                  </div>
                  <div style="display:flex;flex-direction:column;gap:6px;margin:8px 0;">
                    <div class="hss-preview-card-item" style="color:#c4b5fd;background:rgba(105,81,255,0.18);border-color:rgba(105,81,255,0.35);">
                      <span>✓</span><span>纯强化学习无需冷启动 SFT</span>
                    </div>
                    <div class="hss-preview-card-item" style="color:#6ee7b7;background:rgba(16,185,129,0.18);border-color:rgba(16,185,129,0.35);">
                      <span>✓</span><span>本地 Ollama / vLLM 离线推理</span>
                    </div>
                    <div class="hss-preview-card-item" style="color:#7dd3fc;background:rgba(56,189,248,0.18);border-color:rgba(56,189,248,0.35);">
                      <span>✓</span><span>微软 OOXML .pptx 原生文本框</span>
                    </div>
                  </div>
                  <div style="font-size:10.5px;font-family:var(--mono);color:#94a3b8;display:flex;align-items:center;gap:6px;">
                    <span class="pulse-dot" style="background:#818cf8;"></span>
                    <span>100% 离线隐私留存 · 零云端依赖</span>
                  </div>
                </div>
              </div>
            </div>
            <div class="hss-foot-action">
              <span>Linear 极客黑 · 几何网格与原生矢量 · 微软 OOXML .pptx</span>
              <a href="/playground/?sample=agent&template=ppt-linear-dark&title=DeepSeek-R1%3A%20%E7%BA%AF%E5%BC%BA%E5%8C%96%E5%AD%A6%E4%B9%A0%E4%B8%8E%E5%BC%80%E6%BA%90%E6%9D%83%E9%87%8D%E7%93%A6%E8%A7%A3%E7%AE%97%E5%8A%9B%E9%9C%B8%E6%9D%83" class="stage-remix-btn">做同款幻灯片 ↗</a>
            </div>
          </div>

          <!-- Slide 4: WeChat In-Depth Editorial -->
          <div class="hero-stage-slide hss-wechat" data-slide="wechat">
            <div class="hss-phone-frame">
              <div>
                <div class="hss-phone-island">
                  <div class="hss-phone-island-cam"></div>
                </div>
                <div style="display:flex;justify-content:space-between;align-items:center;font-size:11px;color:#94a3b8;font-family:var(--mono);margin-bottom:6px;">
                  <span>@AnthropicAI on X</span>
                  <span style="color:#34d399;">3.2M 浏览 · 阅读 6 分钟</span>
                </div>
                <div style="font-size:15px;font-weight:700;color:#f8fafc;margin:6px 0 8px;line-height:1.35;">Claude Code: 终端原生 Agent 与软件工程全权委托新范式</div>
                <div class="hss-quote-callout">
                  “终端是 AI Agent 唯一真正的操作系统：理解 Git 树、执行本地命令、直接验证测试用例。”
                </div>
                <div style="font-size:11px;color:#94a3b8;line-height:1.5;margin-bottom:8px;">
                  深度拆解 Anthropic 官方终端 Agent：深潜代码树、终端沙盒执行与 Git Diff 零损安全回滚。
                </div>
              </div>
              <div>
                <div class="hss-wechat-stats">
                  <span>❤️ 18.4k 赞</span>
                  <span>🌟 8,420 收藏</span>
                  <span>💬 2,140 讨论</span>
                  <span>在看 3,890</span>
                </div>
                <div style="display:flex;gap:6px;font-family:var(--mono);font-size:10px;color:#cbd5e1;margin-top:8px;">
                  <span style="background:rgba(255,255,255,0.06);padding:2px 6px;border-radius:4px;">100% 纯内联样式</span>
                  <span style="background:rgba(16,185,129,0.15);color:#6ee7b7;padding:2px 6px;border-radius:4px;">一键粘贴公众号无损</span>
                </div>
              </div>
            </div>
            <div class="hss-foot-action">
              <span>微信公众号纯内联富文本 · 样式零丢失 · 告别第三方排版工具</span>
              <a href="/playground/?sample=token&template=wechat-clean-editorial&title=Claude%20Code%3A%20%E7%BB%88%E7%AB%AF%E5%8E%9F%E7%94%9F%20Agent%20%E4%B8%8E%E8%BD%AF%E4%BB%B6%E5%B7%A5%E7%A8%8B%E6%96%B0%E8%8C%83%E5%BC%8F" class="stage-remix-btn">做同款长文 ↗</a>
            </div>
          </div>

          <!-- Slide 5: Cinema 9:16 Video + CapCut 4-Track Timeline -->
          <div class="hero-stage-slide hss-video" data-slide="video">
            <div style="display:flex;flex-direction:column;flex:1;min-height:0;">
              <div style="display:flex;justify-content:space-between;font-family:var(--mono);font-size:11px;color:#94a3b8;margin-bottom:8px;">
                <span>@inkandswitch on X · 1.8M VIEWS</span>
                <span style="color:#34d399;">60FPS CINEMA · -14 LUFS</span>
              </div>
              <div class="hss-video-top">
                <div class="hss-video-canvas">
                  <div style="font-size:9.5px;font-family:var(--mono);color:#c4b5fd;">9:16 CINEMA</div>
                  <div style="display:flex;flex-direction:column;align-items:center;gap:4px;">
                    <div style="width:34px;height:34px;border-radius:50%;background:rgba(105,81,255,0.3);border:1px solid rgba(167,139,250,0.6);display:flex;align-items:center;justify-content:center;">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="#a78bfa"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                    </div>
                    <div class="hss-video-eq-wrap">
                      <span class="hss-eq-bar"></span><span class="hss-eq-bar"></span><span class="hss-eq-bar"></span><span class="hss-eq-bar"></span>
                      <span class="hss-eq-bar"></span><span class="hss-eq-bar"></span><span class="hss-eq-bar"></span><span class="hss-eq-bar"></span>
                    </div>
                    <div style="font-size:9.5px;text-align:center;font-weight:600;color:#fff;">Local-First 软件复兴</div>
                  </div>
                  <div style="font-size:8.5px;background:rgba(0,0,0,0.6);padding:2px 4px;border-radius:3px;color:#34d399;text-align:center;">微秒级音画同步</div>
                </div>
                <div class="hss-timeline-box">
                  <div>
                    <div style="font-size:11px;font-family:var(--mono);color:#94a3b8;margin-bottom:6px;display:flex;justify-content:space-between;">
                      <span>CapCut 4-Track Timeline</span>
                      <span style="color:#818cf8;">00:01:24.08 / 60.00 fps</span>
                    </div>
                    <div style="display:flex;flex-direction:column;gap:5px;">
                      <div style="display:flex;align-items:center;gap:8px;font-size:10px;font-family:var(--mono);">
                        <span style="width:20px;color:#a78bfa;">V1</span>
                        <div style="flex:1;height:14px;background:#1e1b4b;border-radius:3px;display:flex;overflow:hidden;gap:2px;">
                          <span style="width:25%;background:#6951ff;"></span><span style="width:25%;background:#8b5cf6;"></span><span style="width:25%;background:#6951ff;"></span><span style="width:25%;background:#8b5cf6;"></span>
                        </div>
                      </div>
                      <div style="display:flex;align-items:center;gap:8px;font-size:10px;font-family:var(--mono);">
                        <span style="width:20px;color:#fbbf24;">T1</span>
                        <div style="flex:1;height:14px;background:#451a03;border-radius:3px;display:flex;overflow:hidden;gap:2px;">
                          <span style="width:30%;background:#f59e0b;"></span><span style="width:35%;background:#fbbf24;"></span><span style="width:30%;background:#f59e0b;"></span>
                        </div>
                      </div>
                      <div style="display:flex;align-items:center;gap:8px;font-size:10px;font-family:var(--mono);">
                        <span style="width:20px;color:#34d399;">A1</span>
                        <div style="flex:1;height:14px;background:#064e3b;border-radius:3px;display:flex;overflow:hidden;position:relative;">
                          <span style="width:96%;background:#10b981;"></span>
                        </div>
                      </div>
                      <div style="display:flex;align-items:center;gap:8px;font-size:10px;font-family:var(--mono);">
                        <span style="width:20px;color:#38bdf8;">BGM</span>
                        <div style="flex:1;height:14px;background:#082f49;border-radius:3px;display:flex;overflow:hidden;">
                          <span style="width:100%;background:#0284c7;"></span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div style="font-size:10.5px;color:#94a3b8;font-family:var(--mono);margin-top:6px;">
                    零时间轴累积漂移 · 原生剪映 draft_content.json
                  </div>
                </div>
              </div>
            </div>
            <div class="hss-foot-action">
              <span>直接导出 60fps MP4 或一键导入剪映草稿</span>
              <a href="/playground/?sample=podcast&template=video-cinema-talk&title=Local-First%20%E8%BD%AF%E4%BB%B6%E5%A4%8D%E5%85%B4%3A%20%E9%80%83%E7%A6%BB%E4%BA%91%E7%AB%AF%20SaaS%20%E8%AE%A2%E9%98%85%E9%99%B7%E9%98%B1" class="stage-remix-btn">做同款短视频 ↗</a>
            </div>
          </div>

          <!-- Hidden legacy iframe for fallback and automated testing compatibility -->
          <iframe id="hero-stage-frame" src="/${lang}/templates/${stagePresets[0].tplId}/preview.html" title="Aimake live template preview" loading="eager" style="display:none;" allowtransparency="true"></iframe>
        </div>
        <div class="stage-foot">
          <span id="stage-foot-caption" style="display:inline-flex;align-items:center;gap:6px;"><span class="pulse-dot"></span>${esc(copy.stageCaption)}</span>
          <span class="stage-foot-badge">0 外部依赖 · 100% 本地编译</span>
        </div>
      </div>
    </div>
  </header>

  <!-- MULTIMODAL REAL-WORLD WORKS SHOWCASE -->
  <section id="works" class="section-block works-section">
    <div class="container">
      <div class="section-head">
        <div class="eyebrow">2026 MULTIMODAL REAL-WORLD SHOWCASE</div>
        <h2>从前沿风向到全域出版 · 2026 代表作品全模态实战展廊</h2>
        <p>告别跨平台低效重复搬运：同一份 Markdown 原稿，精准直出 8 种主流媒介的高定级商业交付物。</p>
      </div>
      <div class="works-grid">
        ${worksCardsHtml}
      </div>
    </div>
  </section>

  <!-- SYMMETRICAL 2x2 FLYWHEEL + PRIVACY VAULT -->
  <section id="flywheel" class="section-block">
    <div class="container">
      <div class="section-head">
        <div class="eyebrow">THE 4-STAGE CREATIVE FLYWHEEL</div>
        <h2>${esc(copy.flywheelHeading)}</h2>
        <p>${esc(copy.flywheelSub)}</p>
      </div>
      <div class="bento-grid">${bentoHtml}</div>
      ${vaultBannerHtml}
    </div>
  </section>

  <!-- LIVE TREND RADAR & OPEN API SHOWCASE -->
  <section id="radar" class="section-block">
    <div class="container">
      <div class="section-head">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;flex-wrap:wrap;">
          <span class="eyebrow" style="margin:0;">WEEKLY TREND RADAR · 2026 第 47 周</span>
          <span class="stage-foot-badge" style="background:rgba(16,185,129,0.12);padding:3px 9px;border-radius:5px;font-family:var(--mono);font-size:11px;">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            <span>每周一 08:00 自动更新</span>
          </span>
        </div>
        <h2>全网创作灵感雷达 · 前沿风向与开放 API</h2>
        <p>每周一自动聚合 Polymarket 预测赔率、Reddit 深度社区、𝕏 (Twitter) 硅谷前沿、Hacker News 与 GitHub Trending 实时风向。零鉴权开放静态 API，无论在桌面端、Web 工坊还是第三方智能体中，均可一键开箱创作。</p>
      </div>

      <div class="radar-api-banner">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;">
          <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
            <span class="radar-method-badge">GET</span>
            <span class="radar-api-url">https://aimake.cc/api/radar.json</span>
            <span class="stage-foot-badge" style="font-size:11px;">200 OK · 全球 CDN 毫秒分发 · 零鉴权</span>
          </div>
          <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;">
            <a href="/api/radar.json" target="_blank" rel="noopener" class="btn-secondary" style="font-size:12px;padding:6px 14px;height:34px;display:inline-flex;align-items:center;gap:6px;">
              <span>查看实时 JSON 接口</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3"/></svg>
            </a>
            <a href="/playground/" class="btn-primary" style="font-size:12px;padding:6px 14px;height:34px;display:inline-flex;align-items:center;gap:6px;">
              <span>在工坊一键做同款</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </a>
          </div>
        </div>
      </div>

      <!-- Filters & Chips -->
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:18px;" id="landing-radar-filters">
        <button type="button" class="filter-chip active" data-filter-radar="all">全部热点 (${radarItems.length})</button>
        ${radarXCount > 0 ? `<button type="button" class="filter-chip" data-filter-radar="x">𝕏 硅谷前沿 (${radarXCount})</button>` : ''}
        ${radarCatCounts['ai-tech'] ? `<button type="button" class="filter-chip" data-filter-radar="ai-tech">AI &amp; 科技 (${radarCatCounts['ai-tech']})</button>` : ''}
        ${radarCatCounts['prediction'] ? `<button type="button" class="filter-chip" data-filter-radar="prediction">预测市场 (${radarCatCounts['prediction']})</button>` : ''}
        ${radarCatCounts['real-discussion'] ? `<button type="button" class="filter-chip" data-filter-radar="real-discussion">硬核社区 (${radarCatCounts['real-discussion']})</button>` : ''}
        ${radarCatCounts['creative'] ? `<button type="button" class="filter-chip" data-filter-radar="creative">创作者经济 (${radarCatCounts['creative']})</button>` : ''}
        ${radarCatCounts['dev'] ? `<button type="button" class="filter-chip" data-filter-radar="dev">开源与工程 (${radarCatCounts['dev']})</button>` : ''}
        ${radarCatCounts['social'] ? `<button type="button" class="filter-chip" data-filter-radar="social">深度热榜 (${radarCatCounts['social']})</button>` : ''}
      </div>

      <div class="radar-grid" id="landing-radar-grid">
        ${radarCardsHtml}
      </div>
      ${
        radarItems.length > INITIAL_VISIBLE_RADAR
          ? `<div class="section-expand-wrap" id="radar-expand-wrap">
        <button type="button" class="btn-expand-more" id="btn-expand-radar" data-expanded="false" data-total="${radarItems.length}" data-initial="${INITIAL_VISIBLE_RADAR}" data-txt-open="${esc(copy.radarExpandAll.replace('{count}', String(radarItems.length)))}" data-txt-close="${esc(copy.radarCollapse.replace('{count}', String(INITIAL_VISIBLE_RADAR)))}">
          <span>${esc(copy.radarExpandAll.replace('{count}', String(radarItems.length)))}</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
        </button>
      </div>`
          : ''
      }
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
            <svg id="copy-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
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
      <div style="display:flex;gap:12px;flex-wrap:wrap;align-items:center;margin-bottom:22px;">
        <input id="site-market-search" type="search" placeholder="搜索 ${templates.length} 套设计系统 / 平台 / 语种 (Search templates)..." style="flex:1;min-width:240px;background:var(--surface);color:var(--ink);border:1px solid var(--border-strong);border-radius:9px;padding:10px 15px;font-size:13.5px;outline:none;" />
        <div style="display:flex;gap:7px;flex-wrap:wrap;" id="site-market-filters">
          <button type="button" class="filter-chip active" data-filter-cat="all">全部 (${templates.length})</button>
          ${tplCategoryCounts['xiaohongshu'] ? `<button type="button" class="filter-chip" data-filter-cat="xiaohongshu">小红书 3:4 (${tplCategoryCounts['xiaohongshu']})</button>` : ''}
          ${tplCategoryCounts['presentation'] ? `<button type="button" class="filter-chip" data-filter-cat="presentation">PPT 16:9 (${tplCategoryCounts['presentation']})</button>` : ''}
          ${tplCategoryCounts['wechat'] ? `<button type="button" class="filter-chip" data-filter-cat="wechat">微信公众号 (${tplCategoryCounts['wechat']})</button>` : ''}
          ${tplCategoryCounts['linkedin'] ? `<button type="button" class="filter-chip" data-filter-cat="linkedin">LinkedIn 4:5 (${tplCategoryCounts['linkedin']})</button>` : ''}
          ${tplCategoryCounts['short-video'] ? `<button type="button" class="filter-chip" data-filter-cat="short-video">短视频 9:16 (${tplCategoryCounts['short-video']})</button>` : ''}
          ${tplCategoryCounts['zukai'] ? `<button type="button" class="filter-chip" data-filter-cat="zukai">日本図解 (${tplCategoryCounts['zukai']})</button>` : ''}
          ${tplCategoryCounts['cardnews'] ? `<button type="button" class="filter-chip" data-filter-cat="cardnews">韩国卡片 (${tplCategoryCounts['cardnews']})</button>` : ''}
          ${tplCategoryCounts['education'] ? `<button type="button" class="filter-chip" data-filter-cat="education">教学知识 (${tplCategoryCounts['education']})</button>` : ''}
        </div>
      </div>

      <div class="grid" id="site-market-grid">${cardsHtml}</div>
      ${
        templates.length > INITIAL_VISIBLE_TEMPLATES
          ? `<div class="section-expand-wrap" id="templates-expand-wrap">
        <button type="button" class="btn-expand-more" id="btn-expand-templates" data-expanded="false" data-total="${templates.length}" data-initial="${INITIAL_VISIBLE_TEMPLATES}" data-txt-open="${esc(copy.tplExpandAll.replace('{total}', String(templates.length)).replace('{rem}', String(templates.length - INITIAL_VISIBLE_TEMPLATES)))}" data-txt-close="${esc(copy.tplCollapse.replace('{count}', String(INITIAL_VISIBLE_TEMPLATES)))}">
          <span>${esc(copy.tplExpandAll.replace('{total}', String(templates.length)).replace('{rem}', String(templates.length - INITIAL_VISIBLE_TEMPLATES)))}</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
        </button>
      </div>`
          : ''
      }

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
        ${copy.ecosystemCards
          .map(
            (card) => `
        <div class="family-card">
          <div>
            <span class="family-badge">${esc(card.badge)}</span>
            <h3 style="margin:12px 0 8px;font-size:18px;">${esc(card.title)}</h3>
            <p style="margin:0;color:var(--muted);font-size:13.5px;line-height:1.6;">${esc(card.desc)}</p>
          </div>
          <a class="btn-secondary" style="width:fit-content;height:36px;" href="${esc(card.href)}"${card.isExternal ? ' target="_blank" rel="noopener"' : ''}>${esc(card.cta)}</a>
        </div>`
          )
          .join('\n')}
      </div>
    </div>
  </section>

  <!-- FOOTER -->
  <footer>
    <div class="container">
      <div class="footer-cols">
        <div class="footer-col">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
            <img src="/brand/logos/symbol-color.svg" width="22" height="22" style="vertical-align:middle;display:inline-block;border-radius:5px;" alt="Aimake Studio Logo" />
            <strong style="font-size:15px;color:var(--ink);">Aimake Studio</strong>
          </div>
          <p style="font-size:13px;line-height:1.6;color:var(--muted);margin:0 0 16px;">
            超级个体的本地创作外脑：从灵感火花到全域多模态出版。素材吸纳、知识蒸馏、私有风格对齐、确定性美学排版。
          </p>
          <div style="display:inline-flex;align-items:center;gap:6px;font-family:var(--mono);font-size:11px;padding:4px 9px;border-radius:6px;background:rgba(16,185,129,0.1);border:1px solid rgba(16,185,129,0.25);color:var(--emerald);">
            <span class="pulse-dot"></span>
            <span>100% 纯本地优先 · 零云端隐私回传</span>
          </div>
        </div>

        <div class="footer-col">
          <h4>产品与工坊</h4>
          <ul>
            <li><a href="/playground/">在线工坊 (Web Studio)</a></li>
            <li><a href="https://github.com/chicogong/aimake-creator/releases/download/v2.0.0/Aimake-v2.0.0-macOS.dmg">macOS 客户端 (.dmg)</a></li>
            <li><a href="/${lang}/#radar">创作灵感雷达 API</a></li>
            <li><a href="/${lang}/#templates">36 套设计模板</a></li>
            <li><a href="/${lang}/#works">全模态时事爆款实战</a></li>
          </ul>
        </div>

        <div class="footer-col">
          <h4>架构与协议</h4>
          <ul>
            <li><a href="https://github.com/chicogong/aimake-studio" target="_blank" rel="noopener">Aimake Engine 核心</a></li>
            <li><a href="/${lang}/#cli">CLI 终端工作流</a></li>
            <li><a href="/${lang}/#cli">MCP 智能体协议</a></li>
            <li><a href="/api/radar.json" target="_blank" rel="noopener">开放 REST API</a></li>
            <li><a href="https://github.com/chicogong/aimake-creator" target="_blank" rel="noopener">剪映 / CapCut 协议</a></li>
          </ul>
        </div>

        <div class="footer-col">
          <h4>国际化与开源</h4>
          <ul>
            <li><a href="/zh/">简体中文 (zh-CN)</a></li>
            <li><a href="/en/">English (en)</a></li>
            <li><a href="/ja/">日本語 (ja)</a></li>
            <li><a href="/ko/">한국어 (ko)</a></li>
            <li><a href="https://github.com/chicogong/aimake-creator" target="_blank" rel="noopener">GitHub 开源仓库</a></li>
          </ul>
        </div>
      </div>

      <div class="footer-bottom-bar">
        <div>© 2026 Aimake Studio. 本地优先，数据 100% 留存本机。All systems local.</div>
        <div style="display:flex;gap:16px;align-items:center;font-family:var(--mono);font-size:11px;">
          <span>v2.1.0-release</span>
          <span>·</span>
          <span>Zero-Telemetry</span>
          <span>·</span>
          <span>Local-First OS</span>
        </div>
      </div>
    </div>
  </footer>

  <!-- TOAST -->
  <div id="site-toast"></div>

  <script>
    (function () {
      requestAnimationFrame(function () {
        document.body.classList.remove('is-loading');
      });

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

      // Hero quick CLI copy & Industry Pack command boxes
      var heroQuickCli = document.getElementById('hero-quick-cli');
      if (heroQuickCli) {
        heroQuickCli.addEventListener('click', function () {
          var cmd = heroQuickCli.getAttribute('data-copy') || 'npm i -g aimake-studio';
          copyToClipboard(cmd, '${esc(copy.cliCopyNotice)}: ' + cmd);
        });
      }
      document.querySelectorAll('.pack-cmd-box[data-copy]').forEach(function (box) {
        box.addEventListener('click', function () {
          var cmd = box.getAttribute('data-copy') || '';
          if (cmd) copyToClipboard(cmd, '${esc(copy.cliCopyNotice)}: ' + cmd);
        });
      });

      // Hero stage tab switcher (crossfades native masterpiece slides & updates iframe)
      var stageTabs = document.querySelectorAll('.stage-tabs .stage-tab');
      var stageSlides = document.querySelectorAll('.hero-stage-slide');
      var frame = document.getElementById('hero-stage-frame');
      stageTabs.forEach(function (btn) {
        btn.addEventListener('click', function () {
          stageTabs.forEach(function (b) { b.classList.remove('active'); });
          btn.classList.add('active');

          var targetStage = btn.getAttribute('data-stage') || '';
          if (targetStage) {
            stageSlides.forEach(function (slide) {
              if (slide.getAttribute('data-slide') === targetStage) {
                slide.classList.add('active');
              } else {
                slide.classList.remove('active');
              }
            });
          }

          var nextSrc = btn.getAttribute('data-src');
          if (nextSrc && frame) {
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

      // Template Marketplace search, category filter & expand/collapse
      var searchEl = document.getElementById('site-market-search');
      var filterBtns = document.querySelectorAll('#site-market-filters [data-filter-cat]');
      var cards = document.querySelectorAll('[data-market-card]');
      var btnExpandTpl = document.getElementById('btn-expand-templates');
      var tplExpandWrap = document.getElementById('templates-expand-wrap');
      var activeCat = 'all';
      var tplExpanded = false;

      function applyMarketFilter() {
        var q = searchEl ? searchEl.value.trim().toLowerCase() : '';
        var isFiltering = activeCat !== 'all' || q.length > 0;
        cards.forEach(function (card) {
          var cat = card.getAttribute('data-cat') || '';
          var hay = card.getAttribute('data-search') || '';
          var okCat = activeCat === 'all' || cat === activeCat;
          var okQ = !q || hay.indexOf(q) !== -1;
          var isExtra = card.getAttribute('data-extra-tpl') === 'true';
          if (okCat && okQ) {
            card.style.display = 'flex';
            if (isExtra) {
              if (isFiltering || tplExpanded) {
                card.classList.remove('is-collapsed-extra');
              } else {
                card.classList.add('is-collapsed-extra');
              }
            }
          } else {
            card.style.display = 'none';
          }
        });
        if (tplExpandWrap) {
          tplExpandWrap.style.display = isFiltering ? 'none' : 'flex';
        }
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
      if (btnExpandTpl) {
        btnExpandTpl.addEventListener('click', function () {
          tplExpanded = !tplExpanded;
          var total = btnExpandTpl.getAttribute('data-total') || '36';
          var initial = parseInt(btnExpandTpl.getAttribute('data-initial') || '9', 10);
          var rem = Math.max(0, parseInt(total, 10) - initial);
          btnExpandTpl.setAttribute('data-expanded', String(tplExpanded));
          var labelSpan = btnExpandTpl.querySelector('span');
          var iconSvg = btnExpandTpl.querySelector('svg');
          var txtOpen = btnExpandTpl.getAttribute('data-txt-open') || ('展开全部 ' + total + ' 套设计系统 (剩余 ' + rem + ' 套)');
          var txtClose = btnExpandTpl.getAttribute('data-txt-close') || ('收起部分设计系统 (保留精选 ' + initial + ' 套)');
          if (labelSpan) {
            labelSpan.textContent = tplExpanded ? txtClose : txtOpen;
          }
          if (iconSvg) iconSvg.style.transform = tplExpanded ? 'rotate(180deg)' : '';
          applyMarketFilter();
        });
      }

      // Radar category filter & expand/collapse
      var radarChips = document.querySelectorAll('#landing-radar-filters [data-filter-radar]');
      var radarCards = document.querySelectorAll('#landing-radar-grid .radar-card');
      var btnExpandRadar = document.getElementById('btn-expand-radar');
      var radarExpandWrap = document.getElementById('radar-expand-wrap');
      var activeRadarFilter = 'all';
      var radarExpanded = false;

      function applyRadarFilter() {
        var isFiltering = activeRadarFilter !== 'all';
        radarCards.forEach(function (card) {
          var matches = false;
          if (activeRadarFilter === 'all') {
            matches = true;
          } else if (activeRadarFilter === 'x') {
            matches = card.getAttribute('data-radar-source') === 'x';
          } else {
            matches = card.getAttribute('data-radar-cat') === activeRadarFilter;
          }
          var isExtra = card.getAttribute('data-extra-radar') === 'true';
          if (matches) {
            card.style.display = 'flex';
            if (isExtra) {
              if (isFiltering || radarExpanded) {
                card.classList.remove('is-collapsed-extra');
              } else {
                card.classList.add('is-collapsed-extra');
              }
            }
          } else {
            card.style.display = 'none';
          }
        });
        if (radarExpandWrap) {
          radarExpandWrap.style.display = isFiltering ? 'none' : 'flex';
        }
      }

      radarChips.forEach(function (chip) {
        chip.addEventListener('click', function () {
          radarChips.forEach(function (c) { c.classList.remove('active'); });
          chip.classList.add('active');
          activeRadarFilter = chip.getAttribute('data-filter-radar') || 'all';
          applyRadarFilter();
        });
      });
      if (btnExpandRadar) {
        btnExpandRadar.addEventListener('click', function () {
          radarExpanded = !radarExpanded;
          var total = btnExpandRadar.getAttribute('data-total') || '14';
          var initial = btnExpandRadar.getAttribute('data-initial') || '6';
          btnExpandRadar.setAttribute('data-expanded', String(radarExpanded));
          var labelSpan = btnExpandRadar.querySelector('span');
          var iconSvg = btnExpandRadar.querySelector('svg');
          var txtOpen = btnExpandRadar.getAttribute('data-txt-open') || ('展开全部 ' + total + ' 条实时热点');
          var txtClose = btnExpandRadar.getAttribute('data-txt-close') || ('收起实时热点 (仅看精选 ' + initial + ' 条)');
          if (labelSpan) {
            labelSpan.textContent = radarExpanded ? txtClose : txtOpen;
          }
          if (iconSvg) iconSvg.style.transform = radarExpanded ? 'rotate(180deg)' : '';
          applyRadarFilter();
        });
      }
    })();
  </script>
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

  // Copy comprehensive official brand assets from assets/brand
  const brandSrc = path.resolve(PACKAGE_ROOT, 'assets/brand');
  try {
    await fs.cp(brandSrc, path.join(outDir, 'brand'), { recursive: true });
    // Also copy icons/icon-192.png to brand/icon-192.png for backwards compatibility
    await fs.copyFile(
      path.join(brandSrc, 'icons/icon-192.png'),
      path.join(outDir, 'brand/icon-192.png')
    );
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

  // Copy template preview thumbnails for Playground 36-template drawer
  for (const tpl of templates) {
    const srcPreview = path.join(PACKAGE_ROOT, 'templates', tpl.id, 'preview.png');
    if (fsSync.existsSync(srcPreview)) {
      const destSiteDir = path.join(outDir, 'templates', tpl.id);
      await fs.mkdir(destSiteDir, { recursive: true });
      await fs.copyFile(srcPreview, path.join(destSiteDir, 'preview.png'));
      const destPgDir = path.join(playgroundDir, 'templates', tpl.id);
      await fs.mkdir(destPgDir, { recursive: true });
      await fs.copyFile(srcPreview, path.join(destPgDir, 'preview.png'));
    }
  }

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

      const detailCliCmd = `aimake remix ${tpl.id} --deck my.deck.md`;
      const seoPage = `<!DOCTYPE html>
<html lang="${copy.htmlLang}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${esc(tpl.name[lang])} — Aimake #${esc(tpl.id)}</title>
  <meta name="description" content="${esc(tpl.description[lang])}" />
  ${verificationMetaTags()}
  ${themeHeadScript()}
  <link rel="canonical" href="https://aimake.cc/${lang}/templates/${tpl.id}/" />
  ${langs.map((l) => `<link rel="alternate" hreflang="${UI_COPY[l].htmlLang}" href="https://aimake.cc/${l}/templates/${tpl.id}/" />`).join('\n  ')}
  <style>${sharedSiteCss()}
    .detail-layout { display: grid; grid-template-columns: minmax(0, 1fr) 360px; gap: 28px; padding: 36px 0 72px; }
    .detail-layout > * { min-width: 0; max-width: 100%; }
    @media (max-width: 900px) {
      .detail-layout { grid-template-columns: minmax(0, 1fr); gap: 20px; padding: 20px 0 48px; }
      .preview-box { height: 460px; }
    }
    .preview-box { background: var(--bg-obsidian-deep); border: var(--hairline-dark); border-radius: 14px; overflow: hidden; height: 680px; box-shadow: var(--shadow-stage); width: 100%; }
    .preview-box iframe { width: 100%; height: 100%; border: none; display: block; }
    .info-panel { background: var(--surface); backdrop-filter: blur(20px); border: 1px solid var(--border); border-radius: 14px; padding: 24px; height: fit-content; box-shadow: 0 16px 40px rgba(0,0,0,0.35); width: 100%; }
    .detail-cli-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      margin: 0;
      background: var(--bg);
      padding: 9px 11px;
      border-radius: 8px;
      border: 1px solid var(--border-strong);
      font-family: var(--mono);
      font-size: 11.5px;
      color: var(--code-ink);
      cursor: pointer;
      width: 100%;
      text-align: left;
      transition: border-color 0.15s ease;
    }
    .detail-cli-row:hover { border-color: var(--cobalt); }
    .detail-cli-code { min-width: 0; overflow-x: auto; white-space: nowrap; scrollbar-width: none; }
    .detail-cli-code::-webkit-scrollbar { display: none; }
    .detail-formats { display: flex; flex-wrap: wrap; gap: 6px; }
  </style>
</head>
<body>
  ${renderTopNav(lang, `templates/${tpl.id}/`)}
  <main class="container detail-layout">
    <div class="preview-box">
      <iframe src="./preview.html" title="${esc(tpl.name[lang])}" style="background-color:#07090e;" allowtransparency="true"></iframe>
    </div>
    <aside class="info-panel">
      <div class="eyebrow">#${esc(tpl.id)} · ${esc(tpl.aspect)}</div>
      <h1 style="font-size:23px;margin:10px 0 12px;font-weight:700;line-height:1.3;">${esc(tpl.name[lang])}</h1>
      <p style="color:var(--muted);font-size:14px;line-height:1.65;margin:0;">${esc(tpl.description[lang])}</p>
      <div style="margin-top:20px;padding-top:16px;border-top:1px solid var(--border);">
        <div style="font-size:12px;color:var(--muted);margin-bottom:6px;">${esc(copy.specLabel)}</div>
        <div style="font-family:var(--mono);font-size:13px;font-weight:600;color:var(--code-ink);">${tpl.width} × ${tpl.height}px (${esc(tpl.aspect)})</div>
      </div>
      <div style="margin-top:18px;padding-top:16px;border-top:1px solid var(--border);">
        <div style="font-size:12px;color:var(--muted);margin-bottom:8px;">${esc(copy.deliverablesLabel)}</div>
        <div class="detail-formats">
          ${tpl.supportedFormats.map((f) => `<span class="fmt-tag">${esc(f.toUpperCase())}</span>`).join('')}
        </div>
      </div>
      <div style="margin-top:18px;padding-top:16px;border-top:1px solid var(--border);font-size:13px;">
        <span style="color:var(--muted);">${esc(copy.designerLabel)}:</span>
        <strong> ${esc(tpl.contributor.name)}</strong>
        <span style="color:var(--muted);font-family:var(--mono);font-size:11px;"> · v${esc(tpl.version)}</span>
      </div>
      <div style="margin-top:20px;display:flex;flex-direction:column;gap:9px;">
        <a class="btn-primary" style="width:100%;justify-content:center;" href="/playground/?template=${esc(tpl.id)}">${esc(copy.detailCtaPlayground)}</a>
        <a class="btn-secondary" style="width:100%;justify-content:center;" href="aimake://remix?template=${esc(tpl.id)}">${esc(copy.detailCtaDesktop)}</a>
        <button type="button" class="detail-cli-row" id="detail-cli-copy" data-copy="${esc(detailCliCmd)}" title="Click to copy CLI command">
          <span class="detail-cli-code">${esc(detailCliCmd)}</span>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;opacity:0.7;"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
        </button>
        <a class="btn-secondary" style="width:100%;justify-content:center;" href="/${lang}/#templates">← ${esc(copy.navTemplates)}</a>
      </div>
    </aside>
  </main>
  <div id="site-toast"></div>
  <script>
    (function () {
      var btn = document.getElementById('detail-cli-copy');
      var toast = document.getElementById('site-toast');
      if (!btn) return;
      btn.addEventListener('click', function () {
        var cmd = btn.getAttribute('data-copy') || '';
        if (!cmd) return;
        var done = function () {
          if (!toast) return;
          toast.textContent = '${esc(copy.cliCopyNotice)}: ' + cmd;
          toast.classList.add('show');
          setTimeout(function () { toast.classList.remove('show'); }, 2200);
        };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(cmd).then(done).catch(done);
        } else {
          done();
        }
      });
    })();
  </script>
</body>
</html>`;

      await fs.writeFile(path.join(tplSlugDir, 'index.html'), seoPage, 'utf8');
      urls.push(`https://aimake.cc/${lang}/templates/${tpl.id}/`);
      pagesWritten += 2;
    }
  }

  // Generate public static remote radar API (https://aimake.cc/api/radar.json)
  const apiDir = path.join(outDir, 'api');
  await fs.mkdir(apiDir, { recursive: true });
  const radarApiDir = path.join(apiDir, 'radar');
  await fs.mkdir(radarApiDir, { recursive: true });

  const radarPayload = {
    status: 'ok',
    updatedAt: new Date().toISOString(),
    source: 'Aimake Creative Trend Radar Remote API',
    homepage: 'https://aimake.cc',
    endpoints: {
      radar: 'https://aimake.cc/api/radar.json',
      health: 'https://aimake.cc/api/health.json',
    },
    total: CURATED_TREND_FIXTURES.length,
    items: CURATED_TREND_FIXTURES,
  };
  const radarJson = JSON.stringify(radarPayload, null, 2);
  await fs.writeFile(path.join(apiDir, 'radar.json'), radarJson, 'utf8');
  await fs.writeFile(path.join(radarApiDir, 'index.json'), radarJson, 'utf8');
  await fs.writeFile(
    path.join(apiDir, 'health.json'),
    JSON.stringify({ status: 'ok', service: 'aimake-radar-api', timestamp: Date.now() }, null, 2),
    'utf8'
  );
  urls.push('https://aimake.cc/api/radar.json');

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
