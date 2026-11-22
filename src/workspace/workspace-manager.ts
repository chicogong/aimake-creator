import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { parseDeckMarkdown, serializeDeckMarkdown } from '../renderer/deck-parser.js';
import { listTemplates } from '../renderer/html-compiler.js';
import type { AspectRatio, DeckDocument, SupportedLocale } from '../schema/types.js';
import { ingestSource, sha256Hex, slugify } from '../wiki/wiki-engine.js';
import { configureWorkspaceAgents } from './agent-connector.js';
import { inspectWorkspaceSkills, PRESET_SKILL_VERSION } from './preset-skills.js';
import type {
  CreateWorkspaceDeckOptions,
  CreateWorkspaceDeckResult,
  IngestWorkspaceSourceOptions,
  IngestWorkspaceSourceResult,
  InitWorkspaceOptions,
  PipelineStageId,
  RecentWorkspaceEntry,
  ScenarioPresetMetadata,
  WorkspaceBrandKit,
  WorkspaceConfig,
  WorkspaceFileEntry,
  WorkspacePipelineState,
  WorkspaceScenarioPreset,
  WorkspaceSummary,
} from './types.js';

export const WORKSPACE_SCHEMA_VERSION = '2.0';

const TEMPLATE_ASPECT_FALLBACK: Record<string, AspectRatio> = {
  'edu-flashcard-kids': '3:4',
  'edu-lesson-guide': '3:4',
  'en-founder-whiteboard': '4:5',
  'en-substack-digest': '4:5',
  'ig-cardnews-kr': '4:5',
  'ja-note-editorial': '4:5',
  'ko-brand-lookbook': '4:5',
  'linkedin-exec-carousel': '4:5',
  'ppt-consulting-matrix': '16:9',
  'ppt-executive-16x9': '16:9',
  'ppt-tech-architecture': '16:9',
  'video-cinema-talk': '9:16',
  'video-kinetic-reel': '9:16',
  'wechat-editorial-article': '3:4',
  'wechat-greenbook': '3:4',
  'wechat-minimal-brief': '3:4',
  'x-zukai-quad': '16:9',
  'xhs-neon-tech': '3:4',
  'xhs-paper-editorial': '3:4',
  'xhs-pop-sticker': '3:4',
  'xhs-swiss-grid': '3:4',
  'xhs-warm-magazine': '3:4',
};

export interface ScenarioPresetDefinition extends ScenarioPresetMetadata {
  buildStarterDeck: (params: {
    workspaceName: string;
    locale: SupportedLocale;
    author: string;
    handle: string;
  }) => string;
}

export const SCENARIO_PRESETS: Record<WorkspaceScenarioPreset, ScenarioPresetDefinition> = {
  'creator-growth': {
    id: 'creator-growth',
    nameZh: '自媒体爆款增长',
    nameEn: 'Creator Growth & Social',
    descriptionZh: '面向小红书图文、公众号深度文与个人 IP 周更的一站式创作工作区。',
    descriptionEn: 'End-to-end social growth studio for Xiaohongshu carousels, WeChat articles, and personal IP.',
    defaultTemplate: 'xhs-swiss-grid',
    defaultAspect: '3:4',
    defaultLocale: 'zh-CN',
    recommendedTemplates: [
      'xhs-swiss-grid',
      'xhs-warm-magazine',
      'xhs-pop-sticker',
      'wechat-greenbook',
      'wechat-editorial-article',
    ],
    primaryColor: '#D94126',
    brandVoiceHintZh: '开门见山抛结论、用真实数据替代空洞形容词、每张卡片控制在 2 秒内扫读完毕。',
    brandVoiceHintEn: 'Lead with a sharp hook in 2 seconds, back claims with numbers, zero AI fluff.',
    starterDeckSlug: '01-creator-growth-starter',
    starterDeckTitleZh: '从素材到爆款图文：4 步跑通个人创作闭环',
    starterDeckTitleEn: 'From Raw Notes to Viral Carousels in 4 Steps',
    buildStarterDeck: ({ workspaceName, locale, author, handle }) => {
      const isEn = locale === 'en';
      return serializeDeckMarkdown({
        frontmatter: {
          title: isEn
            ? `${workspaceName}: 4-Step Creator Flywheel`
            : `${workspaceName}：从灵感到成品的 4 步闭环`,
          template: 'xhs-swiss-grid',
          locale,
          aspect: '3:4',
          author,
          handle,
          accentColor: '#D94126',
          watermark: true,
          fps: 30,
          secondsPerSlide: 4,
          tags: ['creator-growth', 'aimake-2.0'],
        },
        slides: [
          {
            index: 0,
            id: 'cover',
            layout: 'cover',
            eyebrow: isEn ? 'CREATOR WORKSPACE' : '工作区起步指南',
            title: isEn
              ? 'Turn Raw Notes Into 5 Native Formats'
              : '一个工作区，跑通素材到多平台成品',
            subtitle: isEn
              ? 'Local-first Wiki + Workspace Preset Skills + Live Visual Stage'
              : '素材沉淀 · 外脑 AI 协同 · 实时视觉舞台 · 一键多格式交付',
            bullets: [],
            bodyParagraphs: [],
            metrics: [],
            speech: isEn
              ? 'Welcome to your Aimake creator workspace. Drop notes into sources, compose with your favorite AI host, and refine live on stage.'
              : '欢迎来到你的 Aimake 创作工作区。把素材放进 sources，唤起你的 AI 工具协同写作，再在视觉舞台即时微调与交付。',
          },
          {
            index: 1,
            id: 'workflow',
            layout: 'bullets',
            eyebrow: isEn ? 'CLOSED LOOP' : '端到端闭环',
            title: isEn ? '4 Folders Drive the Whole Pipeline' : '4 个清晰步骤，不再东拼西凑',
            bullets: isEn
              ? [
                  'Intake: Drop PDFs, URLs, or rough notes into sources/',
                  'Brief: Lock audience, hook, and template in briefs/',
                  'Compose & Humanize: Author clean .deck.md in decks/',
                  'Deliver: Export PNG, WeChat HTML, PDF, PPTX, or MP4 to exports/',
                ]
              : [
                  '① 收集素材：把网页、文档或灵感笔记丢进 sources/',
                  '② 协同创作：用 OpenCode / Claude / Codex 读取预设 Skill 写 briefs/ 与 decks/',
                  '③ 舞台微调：Aimake 毫秒级热更新预览，一键切换 22 套模板同款',
                  '④ 五维交付：一键导出高清图、公众号、PDF、PPTX 或口播视频至 exports/',
                ],
            bodyParagraphs: [],
            metrics: [],
          },
          {
            index: 2,
            id: 'metrics',
            layout: 'metrics',
            eyebrow: isEn ? 'EFFICIENCY' : '创作效率',
            title: isEn ? 'One Deck, Zero Rework' : '一份源稿，五维复用',
            bullets: [],
            bodyParagraphs: [],
            metrics: [
              { label: isEn ? 'Built-in Styles' : '内置专业模板', value: '22', delta: 'zh / en / ja / ko' },
              { label: isEn ? 'Export Formats' : '多模态交付', value: '5', delta: 'PNG · WeChat · PDF · PPTX · MP4' },
              { label: isEn ? 'Global Pollution' : '全局配置污染', value: '0', delta: isEn ? 'Workspace-only skills' : '工作区实体隔离' },
            ],
          },
        ],
      });
    },
  },

  'executive-ppt': {
    id: 'executive-ppt',
    nameZh: '高管战略 PPT',
    nameEn: 'Executive Strategy PPT',
    descriptionZh: '面向周报述职、管理咨询方案与季度复盘的 16:9 真可编辑 PPTX 汇报工作区。',
    descriptionEn: 'Boardroom 16:9 strategy workspace generating native editable PowerPoint (.pptx) decks.',
    defaultTemplate: 'ppt-consulting-matrix',
    defaultAspect: '16:9',
    defaultLocale: 'zh-CN',
    recommendedTemplates: [
      'ppt-consulting-matrix',
      'ppt-executive-16x9',
      'ppt-tech-architecture',
      'wechat-minimal-brief',
    ],
    primaryColor: '#1B365D',
    brandVoiceHintZh: '结论先行（金字塔原理），每页一个可验证行动标题，关键 KPI 必须标注数据出处。',
    brandVoiceHintEn: 'Pyramid Principle action titles, quantified KPI matrices, and strict source attribution.',
    starterDeckSlug: '01-executive-briefing-starter',
    starterDeckTitleZh: '季度业务复盘与下阶段战略路线图',
    starterDeckTitleEn: 'Quarterly Strategy Review & Action Roadmap',
    buildStarterDeck: ({ workspaceName, locale, author, handle }) => {
      const isEn = locale === 'en';
      return serializeDeckMarkdown({
        frontmatter: {
          title: isEn ? `${workspaceName} — Executive Briefing` : `${workspaceName} · 战略汇报简报`,
          template: 'ppt-consulting-matrix',
          locale,
          aspect: '16:9',
          author,
          handle,
          accentColor: '#1B365D',
          watermark: false,
          fps: 30,
          secondsPerSlide: 5,
          tags: ['executive-ppt', 'strategy'],
        },
        slides: [
          {
            index: 0,
            id: 'cover',
            layout: 'cover',
            eyebrow: isEn ? 'EXECUTIVE STRATEGY' : '管理层战略简报',
            title: isEn
              ? 'Quarterly Performance & Execution Priorities'
              : '季度核心指标复盘与下一阶段增长抓手',
            subtitle: isEn
              ? 'Source-grounded narrative compiled directly into editable .pptx'
              : '基于工作区原始研报与业务数据生成 · 支持一键导出原生可编辑 .pptx',
            bullets: [],
            bodyParagraphs: [],
            metrics: [],
          },
          {
            index: 1,
            id: 'kpis',
            layout: 'metrics',
            eyebrow: isEn ? 'HEADLINE KPIS' : '关键业绩指标',
            title: isEn
              ? 'Core Delivery Velocity Improved Across All Key Tracks'
              : '核心交付效率稳步提升，成本结构持续优化',
            bullets: [],
            bodyParagraphs: [],
            metrics: [
              { label: isEn ? 'Deck Turnaround' : '汇报成稿耗时', value: '-72%', delta: isEn ? 'vs manual slides' : '对比手工排板' },
              { label: isEn ? 'Source Traceability' : '数据可溯源率', value: '100%', delta: 'wiki/ citations' },
              { label: isEn ? 'PPTX Editability' : 'PPTX 原生可编辑', value: '100%', delta: 'Native XML text' },
            ],
          },
          {
            index: 2,
            id: 'comparison',
            layout: 'comparison',
            eyebrow: isEn ? 'OPERATING MODEL' : '工作方式对比',
            title: isEn ? 'From Scattered Docs to Governed Briefings' : '从零散文档到可复利汇报体系',
            bullets: [],
            bodyParagraphs: [],
            metrics: [],
            comparison: {
              leftTitle: isEn ? 'Traditional Slide Making' : '传统手工做 PPT',
              leftItems: isEn
                ? ['Copy-pasting metrics across docs', 'Hours lost aligning boxes', 'No link back to raw evidence']
                : ['多份文档来回复制粘贴数据', '大量时间消耗在对齐色块字体', '汇报完资料散落无法复用'],
              rightTitle: isEn ? 'Aimake Workspace Flow' : 'Aimake 2.0 闭环汇报',
              rightItems: isEn
                ? ['Raw reports indexed in wiki/', 'AI drafts structured brief first', 'Live visual review + 1-click .pptx']
                : ['原始周报与研报统一沉淀至 wiki/', 'AI 先定简报大纲再写分页结论', '舞台微调后一键导出可编辑 .pptx'],
            },
          },
        ],
      });
    },
  },

  'product-launch': {
    id: 'product-launch',
    nameZh: '产品发布全案',
    nameEn: 'Product Launch Campaign',
    descriptionZh: '围绕一次新产品/大版本发布，同步产出小红书测评卡、发布会 PPT、LinkedIn 卡与 60 秒短片。',
    descriptionEn: 'Unified launch room shipping social cards, launch keynotes, LinkedIn PDFs, and 60s reels from one truth.',
    defaultTemplate: 'xhs-neon-tech',
    defaultAspect: '3:4',
    defaultLocale: 'zh-CN',
    recommendedTemplates: [
      'xhs-neon-tech',
      'ppt-tech-architecture',
      'linkedin-exec-carousel',
      'video-kinetic-reel',
      'video-cinema-talk',
    ],
    primaryColor: '#2B6BE6',
    brandVoiceHintZh: '痛点直击、用跑分和真实对比说话，同一份核心发布文案一键同款适配全渠道。',
    brandVoiceHintEn: 'Crisp problem-to-proof arc, concrete benchmarks, and one-click cross-channel remixing.',
    starterDeckSlug: '01-product-launch-starter',
    starterDeckTitleZh: '新品首发全案：核心亮点与架构评测',
    starterDeckTitleEn: 'Product Launch: Core Highlights & Benchmarks',
    buildStarterDeck: ({ workspaceName, locale, author, handle }) => {
      const isEn = locale === 'en';
      return serializeDeckMarkdown({
        frontmatter: {
          title: isEn ? `${workspaceName} — Launch Deck` : `${workspaceName} · 新品首发亮点`,
          template: 'xhs-neon-tech',
          locale,
          aspect: '3:4',
          author,
          handle,
          accentColor: '#2B6BE6',
          watermark: true,
          fps: 30,
          secondsPerSlide: 4,
          tags: ['product-launch', 'release'],
        },
        slides: [
          {
            index: 0,
            id: 'hero',
            layout: 'cover',
            eyebrow: isEn ? 'LAUNCH BRIEF' : '新品首发',
            title: isEn
              ? `${workspaceName}: Built for Real-World Speed`
              : `${workspaceName}：重新定义本地优先创作体验`,
            subtitle: isEn
              ? 'One source of truth remixed into Social Cards, Keynote PPTX & 60s Video'
              : '一套核心产品资料，一键同款生成社媒卡片、发布会 PPT 与 60 秒短视频',
            bullets: [],
            bodyParagraphs: [],
            metrics: [],
            speech: isEn
              ? `Introducing ${workspaceName}. Ship launch visuals across every channel from a single Markdown storyboard.`
              : `正式介绍 ${workspaceName}。一份源稿即可同步驱动社媒图文、发布会幻灯片和口播短视频。`,
          },
          {
            index: 1,
            id: 'benchmarks',
            layout: 'metrics',
            eyebrow: isEn ? 'BENCHMARKS' : '实测数据',
            title: isEn ? 'Measured Launch Impact' : '实测关键指标一览',
            bullets: [],
            bodyParagraphs: [],
            metrics: [
              { label: isEn ? 'Live Preview Sync' : '舞台实时同步', value: '<100ms', delta: 'fs.watch + SSE' },
              { label: isEn ? 'Channels Covered' : '首发渠道覆盖', value: '5x', delta: 'XHS · WeChat · LinkedIn · PPT · Video' },
            ],
          },
          {
            index: 2,
            id: 'cta',
            layout: 'outro',
            eyebrow: isEn ? 'NEXT STEP' : '立即开始',
            title: isEn ? 'Drop Your Release Notes Into sources/' : '把你的产品白皮书拖入 sources/',
            bullets: isEn
              ? ['Add release notes or PRDs in sources/', 'Ask your AI host to remix across 3:4, 16:9, and 9:16']
              : ['将发版说明或产品文档放入 sources/', '点击右上角在 AI 中创作，一键产出全渠道发布物料'],
            bodyParagraphs: [],
            metrics: [],
          },
        ],
      });
    },
  },

  'educator-course': {
    id: 'educator-course',
    nameZh: '课程教研备课',
    nameEn: 'Educator & Course Prep',
    descriptionZh: '面向老师备课、双语闪卡、课堂导学案与知识专栏拆解的教研工作区。',
    descriptionEn: 'Structured teaching workspace for printable flashcards, classroom lesson guides, and study notes.',
    defaultTemplate: 'edu-lesson-guide',
    defaultAspect: '3:4',
    defaultLocale: 'zh-CN',
    recommendedTemplates: [
      'edu-lesson-guide',
      'edu-flashcard-kids',
      'xhs-paper-editorial',
      'ppt-executive-16x9',
    ],
    primaryColor: '#216E4E',
    brandVoiceHintZh: '概念拆解循序渐进、每页聚焦 1 个核心知识点，附带课堂互动提问与课后复盘要点。',
    brandVoiceHintEn: 'Clear pedagogical scaffolding, one core concept per card, and structured review takeaways.',
    starterDeckSlug: '01-lesson-guide-starter',
    starterDeckTitleZh: '本课核心知识点导学与复盘卡',
    starterDeckTitleEn: 'Lesson Guide: Core Concepts & Review Cards',
    buildStarterDeck: ({ workspaceName, locale, author, handle }) => {
      const isEn = locale === 'en';
      return serializeDeckMarkdown({
        frontmatter: {
          title: isEn ? `${workspaceName} — Lesson Guide` : `${workspaceName} · 课堂导学卡`,
          template: 'edu-lesson-guide',
          locale,
          aspect: '3:4',
          author,
          handle,
          accentColor: '#216E4E',
          watermark: false,
          fps: 30,
          secondsPerSlide: 5,
          tags: ['education', 'lesson-guide'],
        },
        slides: [
          {
            index: 0,
            id: 'cover',
            layout: 'cover',
            eyebrow: isEn ? 'CLASSROOM GUIDE' : '教研导学单',
            title: isEn ? 'Core Concept Breakdown & Study Cards' : '核心概念拆解与可打印学习闪卡',
            subtitle: isEn
              ? 'Built from your curriculum notes — print-ready PDF, PNG & editable slides'
              : '基于教案资料自动梳理考点，支持打印级 PDF、高清图卡与课堂 PPT',
            bullets: [],
            bodyParagraphs: [],
            metrics: [],
          },
          {
            index: 1,
            id: 'takeaways',
            layout: 'bullets',
            eyebrow: isEn ? 'LEARNING GOALS' : '本节核心考点',
            title: isEn ? '3 Things Students Should Master Today' : '本节课 3 个必掌握知识点',
            bullets: isEn
              ? [
                  'Core Definition: Explain the concept in one plain sentence',
                  'Concrete Example: Connect abstract theory to daily life',
                  'Self-Check Question: Verify understanding in 60 seconds',
                ]
              : [
                  '核心定义：用一句大白话讲清概念本质',
                  '生活案例：结合真实场景理解应用场景',
                  '随堂自测：用 1 道微练习巩固记忆闭环',
                ],
            bodyParagraphs: [],
            metrics: [],
          },
          {
            index: 2,
            id: 'review',
            layout: 'outro',
            eyebrow: isEn ? 'REVIEW STRIP' : '课后复盘',
            title: isEn ? 'Ready for Printable Flashcards' : '一键切换双语闪卡，直接打印分发',
            bullets: isEn
              ? ['Switch template to edu-flashcard-kids for bilingual study cards', 'Export high-DPI PDF directly to exports/']
              : ['在底部画廊切换 edu-flashcard-kids 即可生成双语闪卡', '点击右上角导出高清 PDF 存入 exports/'],
            bodyParagraphs: [],
            metrics: [],
          },
        ],
      });
    },
  },
};

function toPosixPath(p: string): string {
  return p.split(path.sep).join('/');
}

async function fileExists(targetPath: string): Promise<boolean> {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function readJsonSafe<T>(filePath: string): Promise<T | null> {
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

async function resolveAspectForTemplate(templateId: string): Promise<AspectRatio> {
  if (TEMPLATE_ASPECT_FALLBACK[templateId]) {
    return TEMPLATE_ASPECT_FALLBACK[templateId];
  }
  try {
    const templates = await listTemplates();
    const match = templates.find((t) => t.id === templateId);
    if (match) return match.aspect;
  } catch {
    // fallback below
  }
  return '3:4';
}

export function resolveRecentRegistryPath(customRegistryPath?: string): string {
  if (customRegistryPath && customRegistryPath.trim()) {
    return path.resolve(customRegistryPath.trim());
  }
  if (process.env.AIMAKE_REGISTRY_PATH && process.env.AIMAKE_REGISTRY_PATH.trim()) {
    return path.resolve(process.env.AIMAKE_REGISTRY_PATH.trim());
  }
  return path.join(os.homedir(), '.aimake', 'recent-workspaces.json');
}

/**
 * Lists recent Aimake workspaces from a configurable registry JSON path.
 * Honors explicit registryPath argument or AIMAKE_REGISTRY_PATH env var so tests
 * never touch the user's real ~/.aimake/ directory.
 */
export async function listRecentWorkspaces(
  registryPath?: string
): Promise<RecentWorkspaceEntry[]> {
  const filePath = resolveRecentRegistryPath(registryPath);
  const parsed = await readJsonSafe<{ workspaces?: RecentWorkspaceEntry[] } | RecentWorkspaceEntry[]>(
    filePath
  );
  if (!parsed) return [];
  const list = Array.isArray(parsed)
    ? parsed
    : Array.isArray(parsed.workspaces)
      ? parsed.workspaces
      : [];
  return list
    .filter((item) => item && typeof item.path === 'string' && typeof item.name === 'string')
    .sort((a, b) => (b.lastOpenedAt || '').localeCompare(a.lastOpenedAt || ''));
}

/**
 * Registers or updates a workspace entry in the recent workspaces registry.
 */
export async function registerRecentWorkspace(
  workspaceDir: string,
  name: string,
  registryPath?: string,
  scenario?: WorkspaceScenarioPreset
): Promise<RecentWorkspaceEntry[]> {
  const filePath = resolveRecentRegistryPath(registryPath);
  const absWorkspace = path.resolve(workspaceDir);
  const existing = await listRecentWorkspaces(filePath);
  const nowIso = new Date().toISOString();

  const filtered = existing.filter((entry) => path.resolve(entry.path) !== absWorkspace);
  const next: RecentWorkspaceEntry[] = [
    {
      path: absWorkspace,
      name: name.trim() || path.basename(absWorkspace),
      scenario,
      lastOpenedAt: nowIso,
    },
    ...filtered,
  ].slice(0, 20);

  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(
    filePath,
    `${JSON.stringify({ schemaVersion: WORKSPACE_SCHEMA_VERSION, workspaces: next }, null, 2)}\n`,
    'utf8'
  );
  return next;
}

/**
 * Initializes an Aimake 2.0 end-to-end creator workspace with standard state-machine folders,
 * metadata, starter deck, materialized preset skills (zero symlinks), and workspace-local AI configs.
 */
export async function initWorkspace(
  workspaceDir: string,
  options: InitWorkspaceOptions = {}
): Promise<WorkspaceSummary> {
  const absWorkspace = path.resolve(workspaceDir);
  const scenario: WorkspaceScenarioPreset = options.scenario ?? 'creator-growth';
  const preset = SCENARIO_PRESETS[scenario];
  const locale: SupportedLocale = options.locale ?? preset.defaultLocale;
  const workspaceName = options.name?.trim() || path.basename(absWorkspace);
  const includeClaude = options.includeClaude ?? true;
  const nowIso = new Date().toISOString();

  // 1. Create standard closed-loop directory layout
  const subdirs = ['sources', 'wiki', 'briefs', 'decks', 'exports', '.aimake'];
  await Promise.all(subdirs.map((d) => fs.mkdir(path.join(absWorkspace, d), { recursive: true })));

  // 2. Initialize .aimake/brand-kit.json if missing
  const brandKitPath = path.join(absWorkspace, '.aimake', 'brand-kit.json');
  const existingBrand = await readJsonSafe<WorkspaceBrandKit>(brandKitPath);
  const brandKit: WorkspaceBrandKit = existingBrand ?? {
    brandName: workspaceName,
    author: options.author?.trim() || workspaceName,
    handle: options.handle?.trim() || `@${slugify(workspaceName)}`,
    voiceTone: locale === 'en' ? preset.brandVoiceHintEn : preset.brandVoiceHintZh,
    primaryColor: preset.primaryColor,
    favoriteTemplates: [...preset.recommendedTemplates],
    defaultLocale: locale,
    watermark: scenario !== 'executive-ppt' && scenario !== 'educator-course',
  };
  if (!existingBrand) {
    await fs.writeFile(brandKitPath, `${JSON.stringify(brandKit, null, 2)}\n`, 'utf8');
  }

  // 3. Initialize .aimake/run-history.json if missing
  const runHistoryPath = path.join(absWorkspace, '.aimake', 'run-history.json');
  if (!(await fileExists(runHistoryPath))) {
    await fs.writeFile(
      runHistoryPath,
      `${JSON.stringify({ schemaVersion: WORKSPACE_SCHEMA_VERSION, runs: [] }, null, 2)}\n`,
      'utf8'
    );
  }

  // 4. Initialize wiki/index.md & wiki/published.md if missing
  const wikiIndexPath = path.join(absWorkspace, 'wiki', 'index.md');
  if (!(await fileExists(wikiIndexPath))) {
    await fs.writeFile(
      wikiIndexPath,
      [
        `# ${workspaceName} — Wiki Index`,
        '',
        '> Token-bounded workspace knowledge map (`<= 3,000 tokens`). Drop raw materials into `sources/` and distill grounded entity cards here.',
        '',
        '## Active Knowledge Pages',
        '',
        '- [[published|Published Deliverables Log]] — Compounding record of finished exports in this workspace.',
        '',
      ].join('\n'),
      'utf8'
    );
  }

  const wikiPublishedPath = path.join(absWorkspace, 'wiki', 'published.md');
  if (!(await fileExists(wikiPublishedPath))) {
    await fs.writeFile(
      wikiPublishedPath,
      [
        '# Published Deliverables & Compounding Log',
        '',
        '> Automatically records finished decks and exports so each release compounds future creations.',
        '',
      ].join('\n'),
      'utf8'
    );
  }

  // 5. Seed starter deck if decks/ has no .deck.md files and seedStarterDeck !== false
  const decksDir = path.join(absWorkspace, 'decks');
  const existingDecks = (await fs.readdir(decksDir)).filter((f) => f.endsWith('.deck.md'));
  let activeDeckRel: string | undefined = existingDecks[0] ? `decks/${existingDecks[0]}` : undefined;

  if (existingDecks.length === 0 && options.seedStarterDeck !== false) {
    const starterFilename = `${preset.starterDeckSlug}.deck.md`;
    const starterPath = path.join(decksDir, starterFilename);
    const starterMd = preset.buildStarterDeck({
      workspaceName,
      locale,
      author: brandKit.author,
      handle: brandKit.handle,
    });
    await fs.writeFile(starterPath, starterMd, 'utf8');
    activeDeckRel = `decks/${starterFilename}`;
  }

  // 6. Write / merge .aimake/workspace.json
  const configPath = path.join(absWorkspace, '.aimake', 'workspace.json');
  const existingConfig = await readJsonSafe<WorkspaceConfig>(configPath);
  const config: WorkspaceConfig = {
    schemaVersion: WORKSPACE_SCHEMA_VERSION,
    id: existingConfig?.id || `ws-${crypto.createHash('sha256').update(absWorkspace).digest('hex').slice(0, 10)}`,
    name: existingConfig?.name || workspaceName,
    scenario: existingConfig?.scenario || scenario,
    locale: existingConfig?.locale || locale,
    defaultTemplate: existingConfig?.defaultTemplate || preset.defaultTemplate,
    createdAt: existingConfig?.createdAt || nowIso,
    updatedAt: nowIso,
    presetSkillVersion: PRESET_SKILL_VERSION,
    includeClaudeSkills: includeClaude,
    activeDeckRel: existingConfig?.activeDeckRel || activeDeckRel,
  };
  await fs.writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`, 'utf8');

  // 7. Materialize all 7 preset skills + write workspace-local AI host configs (ZERO symlinks, ZERO ~/ writes)
  await configureWorkspaceAgents(absWorkspace, {
    cliPath: options.cliPath,
    includeClaude,
    scenario: config.scenario,
    workspaceName: config.name,
  });

  // 8. Register recent workspace ONLY when explicitly requested or isolated registryPath is passed
  if (options.registerRecent || options.registryPath) {
    await registerRecentWorkspace(absWorkspace, config.name, options.registryPath, config.scenario);
  }

  return readWorkspaceState(absWorkspace);
}

async function scanDirectoryFiles(
  workspaceDir: string,
  subDir: string,
  kind: WorkspaceFileEntry['kind'],
  filterFn: (name: string, relPath: string) => boolean
): Promise<WorkspaceFileEntry[]> {
  const dirAbs = path.join(workspaceDir, subDir);
  const results: WorkspaceFileEntry[] = [];

  async function walk(currentDir: string): Promise<void> {
    let entries;
    try {
      entries = await fs.readdir(currentDir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      if (entry.name.startsWith('.')) continue;
      const fullPath = path.join(currentDir, entry.name);
      const relPath = toPosixPath(path.relative(workspaceDir, fullPath));
      if (entry.isDirectory()) {
        await walk(fullPath);
      } else if (entry.isFile() && filterFn(entry.name, relPath)) {
        const st = await fs.stat(fullPath);
        const item: WorkspaceFileEntry = {
          name: entry.name,
          relativePath: relPath,
          absolutePath: fullPath,
          size: st.size,
          mtimeMs: st.mtimeMs,
          updatedAt: new Date(st.mtimeMs).toISOString(),
          kind,
        };

        if (kind === 'deck' && entry.name.endsWith('.deck.md')) {
          try {
            const md = await fs.readFile(fullPath, 'utf8');
            const parsed = parseDeckMarkdown(md, fullPath);
            item.title = parsed.frontmatter.title;
            item.template = parsed.frontmatter.template;
            item.locale = parsed.frontmatter.locale;
            item.aspect = parsed.frontmatter.aspect;
            item.slideCount = parsed.slides.length;
          } catch {
            item.title = path.basename(entry.name, '.deck.md');
          }
        } else if (kind === 'export') {
          item.format = path.extname(entry.name).replace(/^\./, '').toLowerCase() || 'file';
        } else if (entry.name.endsWith('.md')) {
          try {
            const md = await fs.readFile(fullPath, 'utf8');
            const heading = md.match(/^#\s+(.+)$/m);
            item.title = heading ? heading[1].trim() : path.basename(entry.name, '.md');
          } catch {
            item.title = path.basename(entry.name, '.md');
          }
        }

        results.push(item);
      }
    }
  }

  await walk(dirAbs);
  return results.sort((a, b) => b.mtimeMs - a.mtimeMs || a.relativePath.localeCompare(b.relativePath));
}

function computePipelineState(counts: {
  sources: number;
  wikiPages: number;
  briefs: number;
  decks: number;
  exports: number;
}): WorkspacePipelineState {
  const intakeCount = counts.sources + counts.wikiPages;
  const authorCount = counts.briefs + counts.decks;
  const stageCount = counts.decks;
  const deliverCount = counts.exports;

  let currentStage: PipelineStageId = 'intake';
  if (deliverCount > 0) {
    currentStage = 'deliver';
  } else if (stageCount > 0) {
    currentStage = 'stage';
  } else if (counts.briefs > 0 || intakeCount > 0) {
    currentStage = 'author';
  }

  return {
    currentStage,
    intake: {
      id: 'intake',
      count: intakeCount,
      status: intakeCount > 0 ? 'ready' : currentStage === 'intake' ? 'active' : 'empty',
      detail: `${counts.sources} sources · ${counts.wikiPages} wiki cards`,
    },
    author: {
      id: 'author',
      count: authorCount,
      status:
        counts.briefs > 0 || counts.decks > 0
          ? 'ready'
          : currentStage === 'author'
            ? 'active'
            : 'empty',
      detail: `${counts.briefs} briefs · ${counts.decks} decks`,
    },
    stage: {
      id: 'stage',
      count: stageCount,
      status: stageCount > 0 ? 'ready' : currentStage === 'stage' ? 'active' : 'empty',
      detail: `${counts.decks} active decks`,
    },
    deliver: {
      id: 'deliver',
      count: deliverCount,
      status: deliverCount > 0 ? 'ready' : currentStage === 'deliver' ? 'active' : 'empty',
      detail: `${counts.exports} exported artifacts`,
    },
  };
}

/**
 * Scans workspace folders, parses deck metadata, computes pipeline state,
 * reads workspace.json + brand-kit.json, and inspects preset skills.
 */
export async function readWorkspaceState(workspaceDir: string): Promise<WorkspaceSummary> {
  const absWorkspace = path.resolve(workspaceDir);
  const nowIso = new Date().toISOString();

  const [rawConfig, rawBrand, sources, wikiPages, briefs, decks, exportsList, skillsStatus] =
    await Promise.all([
      readJsonSafe<WorkspaceConfig>(path.join(absWorkspace, '.aimake', 'workspace.json')),
      readJsonSafe<WorkspaceBrandKit>(path.join(absWorkspace, '.aimake', 'brand-kit.json')),
      scanDirectoryFiles(absWorkspace, 'sources', 'source', () => true),
      scanDirectoryFiles(
        absWorkspace,
        'wiki',
        'wiki',
        (name) =>
          name.endsWith('.md') &&
          name !== 'index.md' &&
          name !== 'log.md' &&
          name !== 'archive-index.md' &&
          name !== 'published.md'
      ),
      scanDirectoryFiles(absWorkspace, 'briefs', 'brief', (name) => name.endsWith('.md')),
      scanDirectoryFiles(absWorkspace, 'decks', 'deck', (name) => name.endsWith('.deck.md')),
      scanDirectoryFiles(absWorkspace, 'exports', 'export', () => true),
      inspectWorkspaceSkills(absWorkspace),
    ]);

  const fallbackName = path.basename(absWorkspace);
  const config: WorkspaceConfig = rawConfig ?? {
    schemaVersion: WORKSPACE_SCHEMA_VERSION,
    id: `ws-${crypto.createHash('sha256').update(absWorkspace).digest('hex').slice(0, 10)}`,
    name: fallbackName,
    scenario: 'creator-growth',
    locale: 'zh-CN',
    defaultTemplate: 'xhs-swiss-grid',
    createdAt: nowIso,
    updatedAt: nowIso,
    presetSkillVersion: PRESET_SKILL_VERSION,
    includeClaudeSkills: true,
    activeDeckRel: decks[0]?.relativePath,
  };

  if (!config.activeDeckRel && decks[0]) {
    config.activeDeckRel = decks[0].relativePath;
  }

  const preset = SCENARIO_PRESETS[config.scenario] ?? SCENARIO_PRESETS['creator-growth'];
  const brandKit: WorkspaceBrandKit = rawBrand ?? {
    brandName: config.name,
    author: config.name,
    handle: `@${slugify(config.name)}`,
    voiceTone: preset.brandVoiceHintZh,
    primaryColor: preset.primaryColor,
    favoriteTemplates: [...preset.recommendedTemplates],
    defaultLocale: config.locale,
    watermark: true,
  };

  const pipeline = computePipelineState({
    sources: sources.length,
    wikiPages: wikiPages.length,
    briefs: briefs.length,
    decks: decks.length,
    exports: exportsList.length,
  });

  return {
    workspaceDir: absWorkspace,
    config,
    brandKit,
    pipeline,
    decks,
    sources,
    wikiPages,
    briefs,
    exports: exportsList,
    skillsStatus,
  };
}

/**
 * Creates a clean new .deck.md storyboard inside <workspace>/decks/.
 */
export async function createWorkspaceDeck(
  workspaceDir: string,
  options: CreateWorkspaceDeckOptions
): Promise<CreateWorkspaceDeckResult> {
  const absWorkspace = path.resolve(workspaceDir);
  const decksDir = path.join(absWorkspace, 'decks');
  await fs.mkdir(decksDir, { recursive: true });

  const config = await readJsonSafe<WorkspaceConfig>(
    path.join(absWorkspace, '.aimake', 'workspace.json')
  );
  const brandKit = await readJsonSafe<WorkspaceBrandKit>(
    path.join(absWorkspace, '.aimake', 'brand-kit.json')
  );

  const template = options.template || config?.defaultTemplate || 'xhs-swiss-grid';
  const locale: SupportedLocale = options.locale || config?.locale || 'zh-CN';
  const aspect: AspectRatio = options.aspect || (await resolveAspectForTemplate(template));
  const author = options.author || brandKit?.author || config?.name || 'Creator';
  const handle = options.handle || brandKit?.handle || `@${slugify(author)}`;

  const baseSlug = slugify(options.slug || options.title);
  let finalSlug = baseSlug;
  let counter = 2;
  while (await fileExists(path.join(decksDir, `${finalSlug}.deck.md`))) {
    finalSlug = `${baseSlug}-${counter}`;
    counter++;
  }

  const isEn = locale === 'en';
  const deck: DeckDocument = {
    frontmatter: {
      title: options.title.trim(),
      template,
      locale,
      aspect,
      author,
      handle,
      accentColor: brandKit?.primaryColor,
      watermark: brandKit?.watermark ?? true,
      fps: 30,
      secondsPerSlide: 4,
      tags: [config?.scenario || 'workspace'],
    },
    slides: [
      {
        index: 0,
        id: 'cover',
        layout: 'cover',
        eyebrow: isEn ? 'NEW DECK' : '新建作品',
        title: options.title.trim(),
        subtitle: isEn
          ? 'Drafted inside Aimake 2.0 Workspace'
          : '创建于 Aimake 2.0 端到端创作工作区',
        bullets: [],
        bodyParagraphs: [],
        metrics: [],
      },
      {
        index: 1,
        id: 'key-points',
        layout: 'bullets',
        eyebrow: isEn ? 'KEY POINTS' : '核心要点',
        title: isEn ? 'Core Structure & Evidence' : '核心论点与事实支撑',
        bullets: isEn
          ? [
              'Point 1: Ground with concrete evidence from wiki/',
              'Point 2: Keep every card crisp and scannable',
              'Point 3: Run aimake-humanizer before exporting',
            ]
          : [
              '要点一：结合 sources/ 与 wiki/ 中的真实数据支撑观点',
              '要点二：每页聚焦单一核心结论，避免大段文字堆砌',
              '要点三：导出前用 aimake-humanizer 去 AI 味并校验版面密度',
            ],
        bodyParagraphs: [],
        metrics: [],
      },
      {
        index: 2,
        id: 'outro',
        layout: 'outro',
        eyebrow: isEn ? 'WRAP UP' : '总结与行动',
        title: isEn ? 'Ready for Live Stage & Export' : '实时舞台微调，一键多格式交付',
        bullets: isEn
          ? ['Preview and edit inline on Aimake Studio stage', 'Export to PNG, WeChat, PDF, PPTX, or MP4']
          : ['在 Aimake 舞台直接点字微调或切换同款风格', '一键输出高清图、公众号、PDF、PPTX 或口播视频'],
        bodyParagraphs: [],
        metrics: [],
      },
    ],
  };

  const deckPath = path.join(decksDir, `${finalSlug}.deck.md`);
  const relativePath = `decks/${finalSlug}.deck.md`;
  await fs.writeFile(deckPath, serializeDeckMarkdown(deck), 'utf8');

  if (config) {
    config.activeDeckRel = relativePath;
    config.updatedAt = new Date().toISOString();
    await fs.writeFile(
      path.join(absWorkspace, '.aimake', 'workspace.json'),
      `${JSON.stringify(config, null, 2)}\n`,
      'utf8'
    );
  }

  return {
    deckPath,
    relativePath,
    slug: finalSlug,
    deck: { ...deck, sourcePath: deckPath },
  };
}

/**
 * Saves clean Markdown source material into <workspace>/sources/ and indexes it
 * into the workspace's LLM Wiki via ingestSource().
 */
export async function ingestWorkspaceSource(
  workspaceDir: string,
  options: IngestWorkspaceSourceOptions
): Promise<IngestWorkspaceSourceResult> {
  const absWorkspace = path.resolve(workspaceDir);
  const sourcesDir = path.join(absWorkspace, 'sources');
  await fs.mkdir(sourcesDir, { recursive: true });

  const nowIso = new Date().toISOString();
  const datePrefix = nowIso.slice(0, 10);
  const rawName = options.filename?.trim()
    ? options.filename.trim().replace(/\.md$/i, '')
    : `${datePrefix}-${slugify(options.title)}`;
  const safeBaseName = slugify(rawName);
  const filename = `${safeBaseName}.md`;
  const sourcePath = path.join(sourcesDir, filename);
  const relativeSourcePath = `sources/${filename}`;

  const contentHash = sha256Hex(options.content);
  const metaItems = [
    options.sourceUrl ? `Source: ${options.sourceUrl}` : null,
    `Captured: ${nowIso.slice(0, 10)}`,
    options.tags && options.tags.length > 0 ? `Tags: ${options.tags.join(', ')}` : null,
    `SHA-256: ${contentHash.slice(0, 12)}`,
  ].filter(Boolean);

  const sourceMarkdown = [
    `# ${options.title.trim()}`,
    '',
    options.content.trim(),
    '',
    '---',
    `> ${metaItems.join(' · ')}`,
    '',
  ].join('\n');

  await fs.writeFile(sourcePath, sourceMarkdown, 'utf8');

  const wikiIngest = await ingestSource(absWorkspace, sourcePath, {
    title: options.title,
    tags: options.tags,
  });

  return {
    sourcePath,
    relativeSourcePath,
    wikiIngest,
  };
}
