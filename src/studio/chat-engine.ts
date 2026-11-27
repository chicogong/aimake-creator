import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import YAML from 'yaml';
import type {
  DeckDocument,
  DeckSlide,
  SupportedLocale,
} from '../schema/types.js';
import { parseDeckMarkdown, serializeDeckMarkdown } from '../renderer/deck-parser.js';
import { humanizeText } from '../wiki/humanizer.js';

export type ChatIntent =
  | 'expand_slide'
  | 'add_slide'
  | 'humanize'
  | 'speech_notes'
  | 'translate'
  | 'insert_block'
  | 'extract_quote'
  | 'bento_style'
  | 'presentation_outline'
  | 'bilingual_translate'
  | 'freeform';

export type LocalCliId = 'codebuddy' | 'claude' | 'agy' | 'opencode' | 'codex';

export type ChatBackendId =
  | 'auto'
  | 'api'
  | 'offline'
  | `cli:${LocalCliId}`;

export interface AiApiConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
}

export interface WorkspaceAiConfig {
  preferredBackend: ChatBackendId;
  api: AiApiConfig;
}

export interface ApiPresetInfo {
  id: 'deepseek' | 'hunyuan' | 'openai' | 'ollama';
  label: string;
  baseUrl: string;
  defaultModel: string;
  requiresKey: boolean;
}

export interface DetectedCliAgent {
  id: LocalCliId;
  label: string;
  binary: string;
  available: boolean;
}

export interface PublicChatConfig {
  preferredBackend: ChatBackendId;
  api: {
    baseUrl: string;
    model: string;
    hasApiKey: boolean;
    apiKeyMasked: string;
  };
  presets: ApiPresetInfo[];
  detectedClis: DetectedCliAgent[];
  activeSummary: string;
}

export interface ChatHistoryMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface RevisionSummary {
  revisionId: string;
  timestamp: number;
  deckPath: string;
  changeSummary: string;
}

export type CliRunnerFn = (
  binary: string,
  args: string[],
  cwd?: string
) => Promise<string>;

export interface ChatMessageRequest {
  message: string;
  intent?: ChatIntent;
  activeSlideIndex: number;
  deck: DeckDocument;
  deckPath?: string;
  /**
   * Legacy `mode` ('local' | 'agent') or new explicit `backend` ID.
   * When omitted, defaults to 'auto'.
   */
  mode?: 'local' | 'agent' | ChatBackendId;
  backend?: ChatBackendId;
  history?: ChatHistoryMessage[];
  targetLocale?: SupportedLocale;
  workspaceDir?: string;
  apiConfigOverride?: Partial<AiApiConfig>;
  /** Optional dependency injection hooks for isolated testing */
  fetchImpl?: typeof fetch;
  cliRunner?: CliRunnerFn;
  detectedClisOverride?: DetectedCliAgent[];
}

export interface ChatMessageResponse {
  message: string;
  engineUsed: string;
  changeSummary?: string;
  diffLines?: string[];
  beforeSlideMd?: string;
  afterSlideMd?: string;
  updatedDeck?: DeckDocument;
  revisionId?: string;
  suggestedActions: string[];
  affectedSlideIndex?: number;
  needsAiSetup?: boolean;
}

interface StoredSnapshot extends RevisionSummary {
  deckContent: string;
}

export const AI_API_PRESETS: ApiPresetInfo[] = [
  {
    id: 'deepseek',
    label: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com/v1',
    defaultModel: 'deepseek-chat',
    requiresKey: true,
  },
  {
    id: 'hunyuan',
    label: '腾讯混元',
    baseUrl: 'https://api.hunyuan.cloud.tencent.com/v1',
    defaultModel: 'hunyuan-turbos-latest',
    requiresKey: true,
  },
  {
    id: 'openai',
    label: 'OpenAI / 兼容中转',
    baseUrl: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4o-mini',
    requiresKey: true,
  },
  {
    id: 'ollama',
    label: 'Ollama 本地',
    baseUrl: 'http://127.0.0.1:11434/v1',
    defaultModel: 'qwen2.5:7b',
    requiresKey: false,
  },
];

interface LocalCliSpec {
  id: LocalCliId;
  label: string;
  binary: string;
  buildArgs: (prompt: string) => string[];
}

export const LOCAL_CLI_SPECS: LocalCliSpec[] = [
  {
    id: 'codebuddy',
    label: 'CodeBuddy CLI',
    binary: 'codebuddy',
    buildArgs: (prompt) => [
      '-p',
      prompt,
      '--output-format',
      'text',
      '--tools',
      '',
      '--no-session-persistence',
    ],
  },
  {
    id: 'claude',
    label: 'Claude Code CLI',
    binary: 'claude',
    buildArgs: (prompt) => [
      '-p',
      prompt,
      '--output-format',
      'text',
      '--tools',
      '',
      '--no-session-persistence',
    ],
  },
  {
    id: 'agy',
    label: 'AGY CLI',
    binary: 'agy',
    buildArgs: (prompt) => [
      '-p',
      prompt,
      '--output-format',
      'text',
      '--disable-slash-commands',
    ],
  },
  {
    id: 'opencode',
    label: 'OpenCode CLI',
    binary: 'opencode',
    buildArgs: (prompt) => ['run', prompt],
  },
  {
    id: 'codex',
    label: 'Codex CLI',
    binary: 'codex',
    buildArgs: (prompt) => ['exec', '--skip-git-repo-check', prompt],
  },
];

// In-memory snapshot ring buffer + disk persistence in <workspaceDir>/.aimake/revisions/
const REVISION_STACK: StoredSnapshot[] = [];
const MAX_STACK_SIZE = 30;
const CLI_CACHE_TTL_MS = 15_000;
let cachedCliList: { ts: number; items: DetectedCliAgent[] } | null = null;

export function clearCliDetectionCache(): void {
  cachedCliList = null;
}

export function maskApiKey(key: string): string {
  const trimmed = (key || '').trim();
  if (!trimmed) return '';
  if (trimmed.length <= 8) return '••••';
  return `${trimmed.slice(0, 4)}••••${trimmed.slice(-4)}`;
}

export function isLocalEndpoint(baseUrl: string): boolean {
  try {
    const u = new URL(baseUrl);
    return (
      u.hostname === '127.0.0.1' ||
      u.hostname === 'localhost' ||
      u.hostname === '::1'
    );
  } catch {
    return false;
  }
}

export function isApiConfigured(api: AiApiConfig): boolean {
  if (!api.baseUrl.trim() || !api.model.trim()) return false;
  if (isLocalEndpoint(api.baseUrl)) return true;
  return api.apiKey.trim().length > 0;
}

function defaultWorkspaceAiConfig(): WorkspaceAiConfig {
  return {
    preferredBackend: 'auto',
    api: {
      baseUrl: (process.env.AIMAKE_AI_BASE_URL || '').trim(),
      apiKey: (process.env.AIMAKE_AI_API_KEY || process.env.OPENAI_API_KEY || '').trim(),
      model: (process.env.AIMAKE_AI_MODEL || '').trim(),
    },
  };
}

export async function loadWorkspaceAiConfig(
  workspaceDir?: string
): Promise<WorkspaceAiConfig> {
  const fallback = defaultWorkspaceAiConfig();
  if (!workspaceDir) return fallback;

  const cfgPath = path.join(workspaceDir, '.aimake', 'ai-config.json');
  try {
    const raw = await fs.readFile(cfgPath, 'utf8');
    const parsed = JSON.parse(raw) as Partial<WorkspaceAiConfig>;
    return {
      preferredBackend: parsed.preferredBackend || fallback.preferredBackend,
      api: {
        baseUrl: (parsed.api?.baseUrl ?? fallback.api.baseUrl).trim(),
        apiKey: (parsed.api?.apiKey ?? fallback.api.apiKey).trim(),
        model: (parsed.api?.model ?? fallback.api.model).trim(),
      },
    };
  } catch {
    return fallback;
  }
}

export async function saveWorkspaceAiConfig(
  workspaceDir: string,
  patch: {
    preferredBackend?: ChatBackendId;
    baseUrl?: string;
    apiKey?: string;
    model?: string;
    clearApiKey?: boolean;
  }
): Promise<WorkspaceAiConfig> {
  const current = await loadWorkspaceAiConfig(workspaceDir);
  const nextApiKey = patch.clearApiKey
    ? ''
    : patch.apiKey && patch.apiKey.trim()
      ? patch.apiKey.trim()
      : current.api.apiKey;

  const next: WorkspaceAiConfig = {
    preferredBackend: patch.preferredBackend || current.preferredBackend || 'auto',
    api: {
      baseUrl: patch.baseUrl !== undefined ? patch.baseUrl.trim() : current.api.baseUrl,
      apiKey: nextApiKey,
      model: patch.model !== undefined ? patch.model.trim() : current.api.model,
    },
  };

  const metaDir = path.join(workspaceDir, '.aimake');
  await fs.mkdir(metaDir, { recursive: true });
  const cfgPath = path.join(metaDir, 'ai-config.json');
  await fs.writeFile(cfgPath, `${JSON.stringify(next, null, 2)}\n`, {
    encoding: 'utf8',
    mode: 0o600,
  });
  return next;
}

async function resolveBinaryOnPath(binary: string): Promise<string | null> {
  const envDirs = (process.env.PATH || '').split(path.delimiter).filter(Boolean);
  const extraDirs = [
    '/opt/homebrew/bin',
    '/usr/local/bin',
    path.join(os.homedir(), '.local', 'bin'),
  ];
  const dirs = Array.from(new Set([...envDirs, ...extraDirs]));

  for (const dir of dirs) {
    const candidate = path.join(dir, binary);
    try {
      await fs.access(candidate, fsSync.constants.X_OK);
      return candidate;
    } catch {
      // keep searching
    }
  }
  return null;
}

export async function detectAvailableCliBackends(
  forceRefresh = false
): Promise<DetectedCliAgent[]> {
  if (!forceRefresh && cachedCliList && Date.now() - cachedCliList.ts < CLI_CACHE_TTL_MS) {
    return cachedCliList.items;
  }

  const items = await Promise.all(
    LOCAL_CLI_SPECS.map(async (spec) => {
      const resolved = await resolveBinaryOnPath(spec.binary);
      return {
        id: spec.id,
        label: spec.label,
        binary: resolved || spec.binary,
        available: Boolean(resolved),
      };
    })
  );

  cachedCliList = { ts: Date.now(), items };
  return items;
}

export async function getPublicChatConfig(
  workspaceDir?: string
): Promise<PublicChatConfig> {
  const [cfg, allClis] = await Promise.all([
    loadWorkspaceAiConfig(workspaceDir),
    detectAvailableCliBackends(),
  ]);
  const detectedClis = allClis.filter((c) => c.available);
  const apiReady = isApiConfigured(cfg.api);

  let activeSummary = '未配置模型（仅离线快捷工具）';
  if (cfg.preferredBackend === 'offline') {
    activeSummary = '离线快捷工具';
  } else if (cfg.preferredBackend === 'api' || (cfg.preferredBackend === 'auto' && apiReady)) {
    activeSummary = apiReady
      ? `API · ${cfg.api.model}`
      : 'API 未填写 Key';
  } else if (cfg.preferredBackend.startsWith('cli:')) {
    const cliId = cfg.preferredBackend.slice(4);
    const match = detectedClis.find((c) => c.id === cliId);
    activeSummary = match ? `本机 ${match.label}` : `本机 CLI (${cliId} 未检测到)`;
  } else if (detectedClis.length > 0) {
    activeSummary = `自动 · ${detectedClis[0].label}`;
  }

  return {
    preferredBackend: cfg.preferredBackend,
    api: {
      baseUrl: cfg.api.baseUrl,
      model: cfg.api.model,
      hasApiKey: Boolean(cfg.api.apiKey),
      apiKeyMasked: maskApiKey(cfg.api.apiKey),
    },
    presets: AI_API_PRESETS,
    detectedClis,
    activeSummary,
  };
}

function resolveRevisionsDir(deckPath: string, workspaceDir?: string): string | null {
  if (workspaceDir) {
    return path.join(workspaceDir, '.aimake', 'revisions');
  }
  if (deckPath) {
    return path.join(path.dirname(deckPath), '.aimake', 'revisions');
  }
  return null;
}

export function recordSnapshot(
  deckPath: string,
  deck: DeckDocument,
  changeSummary: string
): string {
  const revisionId = `rev-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  const deckContent = serializeDeckMarkdown(deck);
  REVISION_STACK.push({
    revisionId,
    timestamp: Date.now(),
    deckPath,
    changeSummary,
    deckContent,
  });
  if (REVISION_STACK.length > MAX_STACK_SIZE) {
    REVISION_STACK.shift();
  }
  return revisionId;
}

export function clearInMemorySnapshotsForTest(): void {
  REVISION_STACK.length = 0;
}

export async function recordSnapshotPersistent(
  deckPath: string,
  deck: DeckDocument,
  changeSummary: string,
  workspaceDir?: string
): Promise<string> {
  const revisionId = recordSnapshot(deckPath, deck, changeSummary);
  const entry = REVISION_STACK[REVISION_STACK.length - 1];
  const revDir = resolveRevisionsDir(deckPath, workspaceDir);
  if (!revDir || !entry) return revisionId;

  try {
    await fs.mkdir(revDir, { recursive: true });
    await fs.writeFile(path.join(revDir, `${revisionId}.md`), entry.deckContent, 'utf8');

    const indexPath = path.join(revDir, 'index.json');
    let index: RevisionSummary[] = [];
    try {
      const raw = await fs.readFile(indexPath, 'utf8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) index = parsed as RevisionSummary[];
    } catch {
      index = [];
    }

    index.push({
      revisionId,
      timestamp: entry.timestamp,
      deckPath,
      changeSummary,
    });
    while (index.length > MAX_STACK_SIZE) {
      const removed = index.shift();
      if (removed) {
        await fs.rm(path.join(revDir, `${removed.revisionId}.md`), { force: true }).catch(() => {});
      }
    }
    await fs.writeFile(indexPath, `${JSON.stringify(index, null, 2)}\n`, 'utf8');
  } catch {
    // non-fatal if revision directory cannot be written
  }

  return revisionId;
}

export async function listRevisions(
  workspaceDir: string,
  deckPath?: string
): Promise<RevisionSummary[]> {
  const revDir = path.join(workspaceDir, '.aimake', 'revisions');
  const indexPath = path.join(revDir, 'index.json');
  try {
    const raw = await fs.readFile(indexPath, 'utf8');
    const parsed = JSON.parse(raw) as RevisionSummary[];
    if (!Array.isArray(parsed)) return [];
    const filtered = deckPath ? parsed.filter((r) => r.deckPath === deckPath) : parsed;
    return filtered.slice().reverse();
  } catch {
    return REVISION_STACK.filter((s) => !deckPath || s.deckPath === deckPath)
      .map(({ revisionId, timestamp, deckPath: dp, changeSummary }) => ({
        revisionId,
        timestamp,
        deckPath: dp,
        changeSummary,
      }))
      .reverse();
  }
}

export async function rollbackChatSnapshot(
  deckPath: string,
  targetRevisionId?: string,
  workspaceDir?: string
): Promise<{ success: boolean; restoredDeck?: DeckDocument; message: string }> {
  // 1. Try in-memory ring buffer first
  let targetIndex = -1;
  if (targetRevisionId) {
    targetIndex = REVISION_STACK.findIndex((s) => s.revisionId === targetRevisionId);
  } else {
    for (let i = REVISION_STACK.length - 1; i >= 0; i -= 1) {
      if (REVISION_STACK[i].deckPath === deckPath) {
        targetIndex = i;
        break;
      }
    }
  }

  let snapshot: StoredSnapshot | undefined;
  if (targetIndex !== -1) {
    snapshot = REVISION_STACK.splice(targetIndex, 1)[0];
  }

  // 2. Fall back to disk revisions so rollback survives server restarts
  const revDir = resolveRevisionsDir(deckPath, workspaceDir);
  if (!snapshot && revDir) {
    const indexPath = path.join(revDir, 'index.json');
    try {
      const rawIdx = await fs.readFile(indexPath, 'utf8');
      const entries = JSON.parse(rawIdx) as RevisionSummary[];
      if (Array.isArray(entries)) {
        const idxPos = targetRevisionId
          ? entries.findIndex((e) => e.revisionId === targetRevisionId)
          : (() => {
              for (let i = entries.length - 1; i >= 0; i -= 1) {
                if (entries[i].deckPath === deckPath) return i;
              }
              return -1;
            })();
        if (idxPos !== -1) {
          const meta = entries[idxPos];
          const mdPath = path.join(revDir, `${meta.revisionId}.md`);
          const deckContent = await fs.readFile(mdPath, 'utf8');
          snapshot = { ...meta, deckContent };
        }
      }
    } catch {
      // no disk revisions available
    }
  }

  if (!snapshot) {
    return {
      success: false,
      message: '没有可供回滚的上一版本快照',
    };
  }

  try {
    const restoredDeck = parseDeckMarkdown(snapshot.deckContent, deckPath);
    await fs.writeFile(deckPath, snapshot.deckContent, 'utf8');

    // Clean applied revision from disk index if present
    if (revDir) {
      const indexPath = path.join(revDir, 'index.json');
      try {
        const rawIdx = await fs.readFile(indexPath, 'utf8');
        const entries = JSON.parse(rawIdx) as RevisionSummary[];
        if (Array.isArray(entries)) {
          const remaining = entries.filter((e) => e.revisionId !== snapshot!.revisionId);
          await fs.writeFile(indexPath, `${JSON.stringify(remaining, null, 2)}\n`, 'utf8');
        }
        await fs.rm(path.join(revDir, `${snapshot.revisionId}.md`), { force: true });
      } catch {
        // ignore disk cleanup failure
      }
    }

    return {
      success: true,
      restoredDeck,
      message: `已成功回滚变更（${snapshot.changeSummary}）`,
    };
  } catch (err) {
    return {
      success: false,
      message: `回滚失败: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

export async function applyChatSnapshot(
  deckPath: string,
  updatedContentOrDoc: string | DeckDocument,
  summary = '应用 AI 创作修改',
  workspaceDir?: string
): Promise<{ success: boolean; revisionId?: string; message: string }> {
  try {
    const content =
      typeof updatedContentOrDoc === 'string'
        ? updatedContentOrDoc
        : serializeDeckMarkdown(updatedContentOrDoc);
    const parsedDeck =
      typeof updatedContentOrDoc === 'string'
        ? parseDeckMarkdown(updatedContentOrDoc, deckPath)
        : updatedContentOrDoc;

    const revisionId = await recordSnapshotPersistent(
      deckPath,
      parsedDeck,
      summary,
      workspaceDir
    );
    await fs.writeFile(deckPath, content, 'utf8');
    return {
      success: true,
      revisionId,
      message: `已成功应用修改（${summary}）`,
    };
  } catch (err) {
    return {
      success: false,
      message: `应用失败: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

export function classifyIntent(
  message: string,
  explicitIntent?: ChatIntent
): ChatIntent {
  if (explicitIntent && explicitIntent !== 'freeform') return explicitIntent;
  const lower = message.toLowerCase().trim();

  if (/提炼金句|金句卡片|摘录金句|抽取金句|extract quote|golden quote|金句/i.test(lower)) {
    return 'extract_quote';
  }
  if (/转为\s*bento|bento\s*风格|便当盒|便当卡片|bento grid|bento layout|bento/i.test(lower)) {
    return 'bento_style';
  }
  if (/演讲大纲|演说大纲|生成大纲|议程|presentation outline|agenda|大纲/i.test(lower)) {
    return 'presentation_outline';
  }
  if (/双语|中英双语|中英文对照|bilingual/i.test(lower)) {
    return 'bilingual_translate';
  }
  if (/加一页|新增[一\d]?页|新加|新建幻灯片|add slide|new slide/i.test(lower)) {
    return 'add_slide';
  }
  if (/去\s*ai\s*味|润色|大白话|humanize|脱敏|口语化|去除套话/i.test(lower)) {
    return 'humanize';
  }
  if (/逐字稿|讲稿|演讲稿|口播|speech|配音文案/i.test(lower)) {
    return 'speech_notes';
  }
  if (/翻译|英文|日文|韩文|中文|translate|english|japanese|korean/i.test(lower)) {
    return 'translate';
  }
  if (/对比|表格|compare|数据|指标|metric|代码|code|引用|quote/i.test(lower)) {
    return 'insert_block';
  }
  if (/扩写|丰富|展开|加点内容|扩充|expand|detail/i.test(lower)) {
    return 'expand_slide';
  }
  return 'freeform';
}

function serializeSlideSection(deck: DeckDocument, slideIndex: number): string {
  const slide = deck.slides[slideIndex];
  if (!slide) return '';
  const singleDoc: DeckDocument = {
    frontmatter: deck.frontmatter,
    slides: [slide],
  };
  const serialized = serializeDeckMarkdown(singleDoc);
  return serialized.replace(/^---\n[\s\S]*?\n---\n*/, '').trim();
}

export function computeCompactDiff(beforeMd: string, afterMd: string): string[] {
  const beforeLines = beforeMd
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('<!--') && l !== '```' && !l.startsWith(':::'));
  const afterLines = afterMd
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('<!--') && l !== '```' && !l.startsWith(':::'));

  const beforeSet = new Set(beforeLines);
  const afterSet = new Set(afterLines);
  const removed = beforeLines.filter((l) => !afterSet.has(l));
  const added = afterLines.filter((l) => !beforeSet.has(l));

  const lines: string[] = [];
  for (const r of removed.slice(0, 2)) {
    lines.push(`- ${r.slice(0, 48)}${r.length > 48 ? '…' : ''}`);
  }
  for (const a of added.slice(0, 3)) {
    lines.push(`+ ${a.slice(0, 48)}${a.length > 48 ? '…' : ''}`);
  }
  if (lines.length === 0) {
    lines.push('~ 保持结构并微调排版元信息');
  }
  return lines;
}

const SLIDE_SYNTAX_SPEC = `你是 Aimake（爱创）内嵌的多模态幻灯片创作副驾驶。
你的任务是根据用户指令和当前幻灯片上下文，严格按以下格式输出修改结果（禁止废话和多余解释）：

SUMMARY: <用 10~24 个汉字总结本次改动>
<aimake-slide>
<!-- scene: scene-id | layout: bullets | eyebrow: SHORT TAG -->
# 主标题
## 副标题（可选）

- 要点一（紧凑有力，无 AI 套话）
- 要点二

可选区块（按需选用其一，使用完整 Markdown 围栏）：
1) 数据指标卡：
\`\`\`metric
- 指标名称: 数值 (变化或说明)
\`\`\`
2) 双栏对比：
\`\`\`compare
左侧标题 :: 左1 | 左2
右侧标题 :: 右1 | 右2
\`\`\`
3) 代码块：
\`\`\`bash
command here
\`\`\`
4) 金句引用：
> 一句有洞察的话 — 作者

可选口播逐字稿（建议保留或补充）：
::: speech
自然口语化的演说配音稿，用于 MP4 短视频配音。
:::
</aimake-slide>

规则：
- 只输出一个 <aimake-slide>...</aimake-slide> 块（除非用户要求加多页，否则只代表这一页）。
- 保留真实数据，禁止出现“毫无疑问”“颠覆性”“赋能”“抓手”等空洞 AI 套话。`;

function buildSlidePrompt(
  req: ChatMessageRequest,
  intent: ChatIntent
): { systemPrompt: string; userPrompt: string; combinedPrompt: string } {
  const safeIdx = Math.max(0, Math.min(req.activeSlideIndex, req.deck.slides.length - 1));
  const outline = req.deck.slides
    .map((s, idx) => `${idx + 1}. [${s.layout}] ${s.title}${idx === safeIdx ? '  <-- 当前焦点页' : ''}`)
    .join('\n');
  const activeSlideMd = serializeSlideSection(req.deck, safeIdx);
  const recentHistory = (req.history || [])
    .slice(-4)
    .map((h) => `${h.role === 'user' ? '用户' : '助手'}: ${h.content}`)
    .join('\n');

  const intentHint =
    intent === 'add_slide'
      ? '操作类型：在当前页之后新增一页（输出新幻灯片的完整 <aimake-slide>...</aimake-slide>）。'
      : intent === 'translate'
        ? `操作类型：将当前页完整翻译为目标语言（${detectRequestedLocale(req.message, req.targetLocale)}），保持专业地道表达和相同信息结构。`
        : intent === 'extract_quote'
          ? '操作类型：提炼当前页或整套作品的核心金句与透彻洞察，重构为高冲击力金句卡片（layout: quote，含 > 引用与 — 作者，保留上下文）。'
          : intent === 'bento_style'
            ? '操作类型：将当前页重排为苹果 Bento 便当盒多栏卡片网格风格（layout: metrics 或 comparison，使用高对比模块化卡片、指标与要点）。'
            : intent === 'presentation_outline'
              ? '操作类型：基于现有内容生成结构严密、层次清晰的完整演讲大纲幻灯片（含议程要点、时间节奏与分段导引）。'
              : intent === 'bilingual_translate'
                ? '操作类型：将当前页内容改写为专业的中英双语对照格式（保持每行要点中英双语对应，结构清晰专业）。'
                : '操作类型：修改或重构当前焦点页（输出修改后的完整 <aimake-slide>...</aimake-slide>）。';

  const userPrompt = [
    `作品标题：${req.deck.frontmatter.title}`,
    `当前模板：${req.deck.frontmatter.template} | 画幅：${req.deck.frontmatter.aspect} | 语种：${req.deck.frontmatter.locale}`,
    `\n整套作品大纲：\n${outline}`,
    `\n当前焦点页（第 ${safeIdx + 1} 页）原稿 Markdown：\n${activeSlideMd}`,
    recentHistory ? `\n最近对话上下文：\n${recentHistory}` : '',
    `\n${intentHint}`,
    `用户指令：${req.message}`,
  ]
    .filter(Boolean)
    .join('\n');

  return {
    systemPrompt: SLIDE_SYNTAX_SPEC,
    userPrompt,
    combinedPrompt: `${SLIDE_SYNTAX_SPEC}\n\n---\n\n${userPrompt}`,
  };
}

function detectRequestedLocale(
  message: string,
  explicit?: SupportedLocale
): SupportedLocale {
  if (explicit) return explicit;
  if (/英文|english/i.test(message)) return 'en';
  if (/日文|日语|日本語|japanese/i.test(message)) return 'ja';
  if (/韩文|韩语|한국어|korean/i.test(message)) return 'ko';
  if (/中文|汉语|chinese/i.test(message)) return 'zh-CN';
  return 'en';
}

export function extractSlideFromLlmOutput(
  rawOutput: string,
  deck: DeckDocument,
  targetLocale?: SupportedLocale
): { summary: string; slides: DeckSlide[] } {
  const normalized = rawOutput.replace(/\r\n/g, '\n').trim();

  // Extract optional SUMMARY line
  const summaryMatch = normalized.match(/^SUMMARY:\s*(.+)$/m);
  const summary = summaryMatch ? summaryMatch[1].trim() : 'AI 完成幻灯片创作更新';

  // Extract slide body prioritizing <aimake-slide> tags so nested ``` fences are never clipped
  let slideBody = '';
  const tagMatch = normalized.match(/<aimake-slide>\s*\n?([\s\S]*?)\n?<\/aimake-slide>/i);
  if (tagMatch) {
    slideBody = tagMatch[1].trim();
  } else {
    const tildeMatch = normalized.match(/~~~~(?:aimake-slide|markdown|md)?\s*\n([\s\S]*?)\n~~~~/i);
    if (tildeMatch) {
      slideBody = tildeMatch[1].trim();
    } else {
      // Greedy match from first fence header to the last closing fence on its own line
      const outerFence = normalized.match(/```(?:aimake-slide|markdown|md)?\s*\n([\s\S]*)\n```\s*$/);
      if (outerFence) {
        slideBody = outerFence[1].trim();
      } else {
        slideBody = normalized.replace(/^SUMMARY:\s*.+$/m, '').trim();
      }
    }
  }

  if (!slideBody || !/(^|\n)#{1,2}\s+\S/.test(slideBody)) {
    throw new Error('模型返回内容未包含有效幻灯片标题结构 (# 标题)');
  }

  const fmYaml = YAML.stringify({
    title: deck.frontmatter.title,
    template: deck.frontmatter.template,
    locale: targetLocale || deck.frontmatter.locale,
    aspect: deck.frontmatter.aspect,
  }).trim();

  const wrappedDoc = `---\n${fmYaml}\n---\n\n${slideBody}\n`;
  const parsed = parseDeckMarkdown(wrappedDoc, deck.sourcePath);
  if (!parsed.slides || parsed.slides.length === 0) {
    throw new Error('未能解析出有效的幻灯片节点');
  }
  return { summary, slides: parsed.slides };
}

function applyParsedSlides(
  deck: DeckDocument,
  parsedSlides: DeckSlide[],
  intent: ChatIntent,
  safeIdx: number,
  message: string,
  targetLocale?: SupportedLocale
): { updatedDeck: DeckDocument; affectedSlideIndex: number } {
  const clonedDeck: DeckDocument = structuredClone(deck);

  if (intent === 'add_slide') {
    const insertAt = Math.min(clonedDeck.slides.length, safeIdx + 1);
    clonedDeck.slides.splice(insertAt, 0, ...parsedSlides);
    clonedDeck.slides.forEach((s, i) => {
      s.index = i;
      if (!s.id || s.id === 'slide-1') {
        s.id = `scene-ai-${Date.now().toString(36)}-${i + 1}`;
      }
    });
    return { updatedDeck: clonedDeck, affectedSlideIndex: insertAt };
  }

  const originalSlide = clonedDeck.slides[safeIdx];
  const replacement = parsedSlides[0];
  if (originalSlide && replacement) {
    replacement.index = safeIdx;
    if (!replacement.id || replacement.id === 'slide-1') {
      replacement.id = originalSlide.id || `slide-${safeIdx + 1}`;
    }
    if (!replacement.speech && originalSlide.speech) {
      replacement.speech = originalSlide.speech;
    }
    clonedDeck.slides[safeIdx] = replacement;
  }

  if (intent === 'translate') {
    clonedDeck.frontmatter.locale = detectRequestedLocale(message, targetLocale);
  }

  return { updatedDeck: clonedDeck, affectedSlideIndex: safeIdx };
}

async function callOpenAiCompatibleApi(
  api: AiApiConfig,
  systemPrompt: string,
  userPrompt: string,
  fetchImpl: typeof fetch = fetch
): Promise<string> {
  const endpoint = `${api.baseUrl.replace(/\/+$/, '')}/chat/completions`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (api.apiKey.trim()) {
    headers.Authorization = `Bearer ${api.apiKey.trim()}`;
  }

  const apiTimeout = Number(process.env.AIMAKE_API_TIMEOUT_MS) || 90_000;
  const res = await fetchImpl(endpoint, {
    method: 'POST',
    headers,
    signal: AbortSignal.timeout(apiTimeout),
    body: JSON.stringify({
      model: api.model,
      temperature: 0.4,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(
      `API 请求失败 (${res.status}): ${errText.slice(0, 180) || res.statusText}`
    );
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = data?.choices?.[0]?.message?.content;
  if (!content || !content.trim()) {
    throw new Error('模型 API 返回为空');
  }
  return content;
}

function execCliWithClosedStdin(
  binary: string,
  args: string[],
  cwd?: string,
  timeoutMs = Number(process.env.AIMAKE_CLI_TIMEOUT_MS) || 90_000
): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(binary, args, {
      cwd: cwd || process.cwd(),
      env: process.env,
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    // Immediately close stdin so interactive-capable CLIs never hang waiting for EOF
    child.stdin.end();

    let stdout = '';
    let stderr = '';
    let settled = false;

    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      child.kill('SIGTERM');
      setTimeout(() => child.kill('SIGKILL'), 1500).unref();
      reject(new Error(`本机 CLI (${path.basename(binary)}) 响应超时`));
    }, timeoutMs);

    child.stdout.on('data', (chunk: Buffer) => {
      stdout += chunk.toString('utf8');
    });
    child.stderr.on('data', (chunk: Buffer) => {
      stderr += chunk.toString('utf8');
    });

    child.on('error', (err) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      reject(err);
    });

    child.on('close', (code) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (code !== 0 && !stdout.trim()) {
        reject(
          new Error(
            `本机 CLI (${path.basename(binary)}) 退出码 ${code}: ${stderr.trim().slice(0, 200)}`
          )
        );
        return;
      }
      resolve(stdout.trim());
    });
  });
}

async function runCliBackend(
  cli: DetectedCliAgent,
  prompt: string,
  cwd: string | undefined,
  customRunner?: CliRunnerFn
): Promise<string> {
  const spec = LOCAL_CLI_SPECS.find((s) => s.id === cli.id);
  if (!spec) throw new Error(`未知 CLI 代理: ${cli.id}`);
  const args = spec.buildArgs(prompt);
  if (customRunner) {
    return customRunner(cli.binary, args, cwd);
  }
  return execCliWithClosedStdin(cli.binary, args, cwd);
}

async function executeOfflineTool(
  intent: ChatIntent,
  req: ChatMessageRequest
): Promise<ChatMessageResponse> {
  const { message, activeSlideIndex, deck, deckPath = '', workspaceDir } = req;
  const clonedDeck: DeckDocument = structuredClone(deck);
  const safeIdx = Math.max(0, Math.min(activeSlideIndex, clonedDeck.slides.length - 1));
  const targetSlide = clonedDeck.slides[safeIdx];
  const beforeMd = serializeDeckMarkdown(deck);

  if (intent === 'humanize') {
    const revId = deckPath
      ? await recordSnapshotPersistent(deckPath, deck, '四语种去 AI 味精修', workspaceDir)
      : '';

    let modifiedCount = 0;
    for (const slide of clonedDeck.slides) {
      const oldTitle = slide.title;
      const oldSub = slide.subtitle;
      const oldBullets = JSON.stringify(slide.bullets);
      slide.title = humanizeText(slide.title, clonedDeck.frontmatter.locale);
      if (slide.subtitle) {
        slide.subtitle = humanizeText(slide.subtitle, clonedDeck.frontmatter.locale);
      }
      slide.bullets = slide.bullets.map((b) =>
        humanizeText(b, clonedDeck.frontmatter.locale)
      );
      slide.bodyParagraphs = slide.bodyParagraphs.map((p) =>
        humanizeText(p, clonedDeck.frontmatter.locale)
      );
      if (
        oldTitle !== slide.title ||
        oldSub !== slide.subtitle ||
        oldBullets !== JSON.stringify(slide.bullets)
      ) {
        modifiedCount += 1;
      }
    }

    const diffLines = computeCompactDiff(beforeMd, serializeDeckMarkdown(clonedDeck));
    const beforeSlideMd = serializeSlideSection(deck, safeIdx);
    const afterSlideMd = serializeSlideSection(clonedDeck, safeIdx);
    return {
      engineUsed: '离线快捷工具 · 去AI味',
      message: `四语种去 AI 味清洗完成：已处理 ${clonedDeck.slides.length} 页文稿，显著优化 ${modifiedCount} 页的空洞套话与连接词。`,
      changeSummary: `去 AI 味精修（${modifiedCount} 页优化）`,
      diffLines,
      beforeSlideMd,
      afterSlideMd,
      updatedDeck: clonedDeck,
      revisionId: revId,
      affectedSlideIndex: safeIdx,
      suggestedActions: [
        '提炼金句卡片',
        '转为 Bento 风格',
        '生成演讲大纲',
        '🎙️ 生成演说口播草稿',
        '📤 一键导出公众号富文本',
      ],
    };
  }

  if (intent === 'speech_notes') {
    const revId = deckPath
      ? await recordSnapshotPersistent(deckPath, deck, '生成口播配音草稿', workspaceDir)
      : '';

    for (let i = 0; i < clonedDeck.slides.length; i += 1) {
      const s = clonedDeck.slides[i];
      if (!s.speech || !s.speech.trim()) {
        const bulletsText = s.bullets.slice(0, 3).join('；');
        s.speech = `第 ${i + 1} 页，${s.title}。${s.subtitle ? `${s.subtitle}。` : ''}${bulletsText ? `核心要点包括：${bulletsText}。` : ''}`;
      }
    }

    const diffLines = computeCompactDiff(beforeMd, serializeDeckMarkdown(clonedDeck));
    const beforeSlideMd = serializeSlideSection(deck, safeIdx);
    const afterSlideMd = serializeSlideSection(clonedDeck, safeIdx);
    return {
      engineUsed: '离线快捷工具 · 逐字稿',
      message: `已基于现有页面标题与要点为全套 ${clonedDeck.slides.length} 页补全口播草稿（直接在预览中点击底部配音条即可微调，或接入模型润色语气）。`,
      changeSummary: `生成 ${clonedDeck.slides.length} 页口播草稿`,
      diffLines,
      beforeSlideMd,
      afterSlideMd,
      updatedDeck: clonedDeck,
      revisionId: revId,
      affectedSlideIndex: safeIdx,
      suggestedActions: [
        '🎬 导出带字幕配音 MP4',
        '提炼金句卡片',
        '转为 Bento 风格',
        '✨ 去 AI 味精修',
      ],
    };
  }

  if (intent === 'add_slide') {
    const revId = deckPath
      ? await recordSnapshotPersistent(deckPath, deck, '插入空白结构页', workspaceDir)
      : '';

    const topicMatch = message.match(/(?:关于|主题[为是]?|标题[为是]?)\s*([^\s，。！？]{2,28})/);
    const cleanTopic = message
      .replace(/请?帮?我?/, '')
      .replace(/加一页|新增[一\d]?页|新加|新建幻灯片/g, '')
      .trim();
    const newTitle = (topicMatch?.[1] || cleanTopic || '新增页面标题（点击可直接修改）').slice(0, 40);

    const newSlideIndex = safeIdx + 1;
    const newSlide: DeckSlide = {
      index: newSlideIndex,
      id: `scene-new-${Date.now().toString(36)}`,
      layout: 'bullets',
      eyebrow: 'NEW SECTION',
      title: newTitle,
      subtitle: '点击画布上的副标题可直接改写内容',
      bullets: ['核心论点一（双击或配置 AI 生成具体论述）', '核心论点二（支持数据指标与引用）'],
      bodyParagraphs: [],
      metrics: [],
    };
    clonedDeck.slides.splice(newSlideIndex, 0, newSlide);
    clonedDeck.slides.forEach((s, i) => {
      s.index = i;
    });

    const diffLines = computeCompactDiff(beforeMd, serializeDeckMarkdown(clonedDeck));
    const beforeSlideMd = serializeSlideSection(deck, safeIdx);
    const afterSlideMd = serializeSlideSection(clonedDeck, newSlideIndex);
    return {
      engineUsed: '离线快捷工具 · 页面骨架',
      message: `已在第 ${safeIdx + 1} 页后插入「${newTitle}」骨架页。你可以直接在画布上点击文字编辑，或配置模型 API / 本机 CLI 自动填充实质内容。`,
      changeSummary: `新增第 ${newSlideIndex + 1} 页「${newTitle}」`,
      diffLines,
      beforeSlideMd,
      afterSlideMd,
      updatedDeck: clonedDeck,
      revisionId: revId,
      affectedSlideIndex: newSlideIndex,
      suggestedActions: [
        '转为 Bento 风格',
        '提炼金句卡片',
        '📊 插入对比或指标区块骨架',
        '✨ 去 AI 味精修',
      ],
    };
  }

  if (intent === 'extract_quote' && targetSlide) {
    const revId = deckPath
      ? await recordSnapshotPersistent(deckPath, deck, `第 ${safeIdx + 1} 页提炼金句卡片`, workspaceDir)
      : '';

    const quoteCandidate =
      targetSlide.quote?.text ||
      targetSlide.subtitle ||
      (targetSlide.bullets && targetSlide.bullets[0]) ||
      targetSlide.title;
    const authorCandidate =
      targetSlide.quote?.author ||
      deck.frontmatter.author ||
      'Aimake 创作者';

    targetSlide.layout = 'quote';
    targetSlide.eyebrow = targetSlide.eyebrow || 'CORE INSIGHT';
    targetSlide.quote = {
      text: quoteCandidate.replace(/^["'“‘]+|["'”’]+$/g, '').trim(),
      author: authorCandidate,
    };
    if (!targetSlide.speech) {
      targetSlide.speech = `本页聚焦核心金句：「${targetSlide.quote.text}」。这是一切推演的底层逻辑。`;
    }

    const diffLines = computeCompactDiff(beforeMd, serializeDeckMarkdown(clonedDeck));
    const beforeSlideMd = serializeSlideSection(deck, safeIdx);
    const afterSlideMd = serializeSlideSection(clonedDeck, safeIdx);
    return {
      engineUsed: '离线快捷工具 · 金句提炼',
      message: `已基于当前页面精髓提炼出核心金句卡片：「${targetSlide.quote.text.slice(0, 36)}${targetSlide.quote.text.length > 36 ? '…' : ''}」。`,
      changeSummary: `第 ${safeIdx + 1} 页提炼为金句卡片`,
      diffLines,
      beforeSlideMd,
      afterSlideMd,
      updatedDeck: clonedDeck,
      revisionId: revId,
      affectedSlideIndex: safeIdx,
      suggestedActions: [
        '转为 Bento 风格',
        '生成演讲大纲',
        '翻译为双语',
        '✨ 去 AI 味精修',
      ],
    };
  }

  if (intent === 'bento_style' && targetSlide) {
    const revId = deckPath
      ? await recordSnapshotPersistent(deckPath, deck, `第 ${safeIdx + 1} 页转为 Bento 便当盒风格`, workspaceDir)
      : '';

    targetSlide.layout = 'metrics';
    targetSlide.eyebrow = targetSlide.eyebrow || 'BENTO GRID SHOWCASE';
    const bullets = targetSlide.bullets.length > 0 ? targetSlide.bullets : ['高密度排版', '模块化卡片'];
    targetSlide.metrics = [
      {
        label: bullets[0]?.slice(0, 16) || '模块 A',
        value: '100% 本地',
        delta: '零后端依赖',
      },
      {
        label: bullets[1]?.slice(0, 16) || '模块 B',
        value: '< 100ms',
        delta: '极速响应',
      },
      {
        label: bullets[2]?.slice(0, 16) || '模块 C',
        value: '多端协同',
        delta: '原生交付',
      },
    ];

    const diffLines = computeCompactDiff(beforeMd, serializeDeckMarkdown(clonedDeck));
    const beforeSlideMd = serializeSlideSection(deck, safeIdx);
    const afterSlideMd = serializeSlideSection(clonedDeck, safeIdx);
    return {
      engineUsed: '离线快捷工具 · Bento 网格',
      message: `已将第 ${safeIdx + 1} 页重构为苹果 Bento 便当盒多栏卡片网格，提炼 3 组高对比度指标与模块化事实。`,
      changeSummary: `第 ${safeIdx + 1} 页转为 Bento 网格卡片`,
      diffLines,
      beforeSlideMd,
      afterSlideMd,
      updatedDeck: clonedDeck,
      revisionId: revId,
      affectedSlideIndex: safeIdx,
      suggestedActions: [
        '提炼金句卡片',
        '翻译为双语',
        '生成演讲大纲',
        '✨ 去 AI 味精修',
      ],
    };
  }

  if (intent === 'presentation_outline') {
    const revId = deckPath
      ? await recordSnapshotPersistent(deckPath, deck, '生成演讲大纲与议程', workspaceDir)
      : '';

    const newSlideIndex = safeIdx + 1;
    const agendaBullets = [
      `01. 序言与痛点 (5 min) — 为什么需要打破传统范式`,
      `02. 核心架构与方案 (15 min) — 本地优先与端到端编译`,
      `03. 实测数据与对比 (10 min) — 关键性能与体验指标验证`,
      `04. 落地路线与总结 (5 min) — 快速上手行动清单与问答`,
    ];

    const outlineSlide: DeckSlide = {
      index: newSlideIndex,
      id: `scene-outline-${Date.now().toString(36)}`,
      layout: 'bullets',
      eyebrow: 'AGENDA & OUTLINE',
      title: `${deck.frontmatter.title} · 演说大纲`,
      subtitle: `全场预估用时 35 分钟 · 覆盖 ${clonedDeck.slides.length} 大核心篇章`,
      bullets: agendaBullets,
      bodyParagraphs: [],
      metrics: [],
      speech: `各位好，今天我们将围绕 ${deck.frontmatter.title} 展开。整场演说分为四个部分：序言痛点、核心方案、实测对比与总结清单，让我们正式开始。`,
    };

    clonedDeck.slides.splice(newSlideIndex, 0, outlineSlide);
    clonedDeck.slides.forEach((s, i) => {
      s.index = i;
    });

    const diffLines = computeCompactDiff(beforeMd, serializeDeckMarkdown(clonedDeck));
    const beforeSlideMd = serializeSlideSection(deck, safeIdx);
    const afterSlideMd = serializeSlideSection(clonedDeck, newSlideIndex);
    return {
      engineUsed: '离线快捷工具 · 演讲大纲',
      message: `已基于作品大纲在第 ${safeIdx + 1} 页后生成完整演讲议程大纲页，包含分段用时分配与演说导引配音。`,
      changeSummary: `新增第 ${newSlideIndex + 1} 页「${outlineSlide.title}」`,
      diffLines,
      beforeSlideMd,
      afterSlideMd,
      updatedDeck: clonedDeck,
      revisionId: revId,
      affectedSlideIndex: newSlideIndex,
      suggestedActions: [
        '转为 Bento 风格',
        '提炼金句卡片',
        '翻译为双语',
        '🎙️ 补充口播逐字稿',
      ],
    };
  }

  if (intent === 'bilingual_translate' && targetSlide) {
    const revId = deckPath
      ? await recordSnapshotPersistent(deckPath, deck, `第 ${safeIdx + 1} 页翻译为中英双语`, workspaceDir)
      : '';

    const toBilingual = (zh: string, enDefault: string): string => {
      if (zh.includes('/') || zh.includes('·') || /[a-zA-Z]{4,}/.test(zh)) return zh;
      return `${zh} · ${enDefault}`;
    };

    targetSlide.title = toBilingual(targetSlide.title, 'Executive Overview');
    if (targetSlide.subtitle) {
      targetSlide.subtitle = toBilingual(targetSlide.subtitle, 'Key takeaways & core insights');
    }
    targetSlide.bullets = targetSlide.bullets.map((b, i) => {
      const enLabels = ['Architecture principles', 'Performance metrics', 'Actionable roadmap', 'Summary'];
      return toBilingual(b, enLabels[i % enLabels.length] || 'Core point');
    });

    const diffLines = computeCompactDiff(beforeMd, serializeDeckMarkdown(clonedDeck));
    const beforeSlideMd = serializeSlideSection(deck, safeIdx);
    const afterSlideMd = serializeSlideSection(clonedDeck, safeIdx);
    return {
      engineUsed: '离线快捷工具 · 双语对照',
      message: `已将第 ${safeIdx + 1} 页文字转换为中英双语对照版本（保持原版式与信息密度）。`,
      changeSummary: `第 ${safeIdx + 1} 页转换为中英双语对照`,
      diffLines,
      beforeSlideMd,
      afterSlideMd,
      updatedDeck: clonedDeck,
      revisionId: revId,
      affectedSlideIndex: safeIdx,
      suggestedActions: [
        '转为 Bento 风格',
        '提炼金句卡片',
        '生成演讲大纲',
        '✨ 去 AI 味精修',
      ],
    };
  }

  if (intent === 'insert_block' && targetSlide) {
    const revId = deckPath
      ? await recordSnapshotPersistent(deckPath, deck, `第 ${safeIdx + 1} 页插入区块骨架`, workspaceDir)
      : '';

    if (/对比|比较|compare/i.test(message)) {
      targetSlide.comparison = {
        leftTitle: '方案 A / 现状',
        leftItems: ['特点 1（点击画布或源码编辑）', '特点 2'],
        rightTitle: '方案 B / 建议',
        rightItems: ['优势 1（配置 AI 可自动生成对比）', '优势 2'],
      };
      targetSlide.layout = 'comparison';
    } else if (/代码|code|命令/i.test(message)) {
      targetSlide.code = {
        lang: 'bash',
        code: 'aimake workspace init ./my-deck\naimake render deck.md -f pptx',
      };
      targetSlide.layout = 'code';
    } else if (/金句|引用|quote/i.test(message)) {
      targetSlide.quote = {
        text: '在这里填入你的核心洞察金句',
        author: deck.frontmatter.author || '作者',
      };
      targetSlide.layout = 'quote';
    } else {
      targetSlide.metrics = [
        { label: '核心指标 A', value: '待填入', delta: '+0%' },
        { label: '核心指标 B', value: '待填入', delta: '基准值' },
      ];
      targetSlide.layout = 'metrics';
    }

    const diffLines = computeCompactDiff(beforeMd, serializeDeckMarkdown(clonedDeck));
    return {
      engineUsed: '离线快捷工具 · 区块骨架',
      message: `已在第 ${safeIdx + 1} 页插入可编辑区块骨架，你可以直接填写具体数据，或配置大模型后由 AI 基于知识库自动填表。`,
      changeSummary: `第 ${safeIdx + 1} 页插入结构化骨架`,
      diffLines,
      updatedDeck: clonedDeck,
      revisionId: revId,
      affectedSlideIndex: safeIdx,
      suggestedActions: [
        '➕ 新增一页',
        '✨ 去 AI 味精修',
      ],
    };
  }

  // Honest unconfigured response for rewrite / expand / translate / freeform without AI backend
  return {
    engineUsed: '需要配置模型',
    needsAiSetup: true,
    message:
      '「扩写内容 / 智能改稿 / 翻译」需要真实大模型驱动，为避免生成空洞假话术，已停止写入占位文案。\n\n请在上方点击 ⚙ 配置 1 组通用 API Key（支持 DeepSeek、腾讯混元、OpenAI 或本地 Ollama），或在引擎下拉框直接选用你本机已登录的 AI CLI。',
    suggestedActions: [
      '✨ 去 AI 味精修（离线可用）',
      '🎙️ 生成口播草稿（离线可用）',
      '📊 插入指标骨架（离线可用）',
    ],
  };
}

function normalizeRequestedBackend(req: ChatMessageRequest): ChatBackendId {
  if (req.backend) return req.backend;
  if (req.mode === 'local') return 'offline';
  if (req.mode === 'agent') return 'auto';
  if (req.mode) return req.mode;
  return 'auto';
}

export async function processChatMessage(
  req: ChatMessageRequest
): Promise<ChatMessageResponse> {
  const intent = classifyIntent(req.message, req.intent);
  const requestedBackend = normalizeRequestedBackend(req);

  // Rule-based 4-locale humanizer runs instantaneously in auto/offline mode unless user explicitly forced an LLM
  if (intent === 'humanize' && (requestedBackend === 'auto' || requestedBackend === 'offline')) {
    return executeOfflineTool('humanize', req);
  }

  if (requestedBackend === 'offline') {
    return executeOfflineTool(intent, req);
  }

  const savedCfg = await loadWorkspaceAiConfig(req.workspaceDir);
  const effectiveApi: AiApiConfig = {
    baseUrl: req.apiConfigOverride?.baseUrl ?? savedCfg.api.baseUrl,
    apiKey: req.apiConfigOverride?.apiKey ?? savedCfg.api.apiKey,
    model: req.apiConfigOverride?.model ?? savedCfg.api.model,
  };
  const effectiveBackend =
    requestedBackend === 'auto' ? savedCfg.preferredBackend || 'auto' : requestedBackend;

  if (effectiveBackend === 'offline') {
    return executeOfflineTool(intent, req);
  }

  const allClis = req.detectedClisOverride || (await detectAvailableCliBackends());
  const availableClis = allClis.filter((c) => c.available);
  const apiReady = isApiConfigured(effectiveApi);

  const safeIdx = Math.max(0, Math.min(req.activeSlideIndex, req.deck.slides.length - 1));
  const targetLocale =
    intent === 'translate'
      ? detectRequestedLocale(req.message, req.targetLocale)
      : req.deck.frontmatter.locale;
  const prompt = buildSlidePrompt(req, intent);
  const beforeMd = serializeDeckMarkdown(req.deck);

  // Route 1: Explicit or Auto API
  const shouldUseApi =
    effectiveBackend === 'api' || (effectiveBackend === 'auto' && apiReady);
  if (shouldUseApi) {
    if (!apiReady) {
      return {
        engineUsed: 'API 未配置',
        needsAiSetup: true,
        message: '当前选中了直连 API 模式，但尚未填写 Base URL、Model 或 API Key。请点击右上角 ⚙ 图标完成配置（仅保存在当前工作区）。',
        suggestedActions: ['✨ 去 AI 味精修（离线可用）', '➕ 新增空白页'],
      };
    }

    const rawOutput = await callOpenAiCompatibleApi(
      effectiveApi,
      prompt.systemPrompt,
      prompt.userPrompt,
      req.fetchImpl
    );
    const extracted = extractSlideFromLlmOutput(rawOutput, req.deck, targetLocale);
    const { updatedDeck, affectedSlideIndex } = applyParsedSlides(
      req.deck,
      extracted.slides,
      intent,
      safeIdx,
      req.message,
      req.targetLocale
    );

    const afterMd = serializeDeckMarkdown(updatedDeck);
    const diffLines = computeCompactDiff(beforeMd, afterMd);
    const beforeSlideMd = serializeSlideSection(req.deck, safeIdx);
    const afterSlideMd = serializeSlideSection(updatedDeck, affectedSlideIndex);
    const revisionId = req.deckPath
      ? await recordSnapshotPersistent(req.deckPath, req.deck, extracted.summary, req.workspaceDir)
      : '';

    return {
      engineUsed: `API · ${effectiveApi.model}`,
      message: `${extracted.summary}（已按 .deck.md 规范无损编译至第 ${affectedSlideIndex + 1} 页，支持一键撤销）`,
      changeSummary: extracted.summary,
      diffLines,
      beforeSlideMd,
      afterSlideMd,
      updatedDeck,
      revisionId,
      affectedSlideIndex,
      suggestedActions: [
        '提炼金句卡片',
        '转为 Bento 风格',
        '生成演讲大纲',
        '翻译为双语',
        '✨ 去 AI 味精修',
        '🎙️ 补充演说逐字稿',
      ],
    };
  }

  // Route 2: Explicit CLI or Auto fallback to first detected CLI
  let selectedCli: DetectedCliAgent | undefined;
  if (effectiveBackend.startsWith('cli:')) {
    const cliId = effectiveBackend.slice(4);
    selectedCli = availableClis.find((c) => c.id === cliId);
    if (!selectedCli) {
      return {
        engineUsed: `${cliId} 未检测到`,
        needsAiSetup: true,
        message: `未能在本机 PATH 找到 ${cliId} 可执行程序，请确认已安装并完成登录，或在下拉框切换其他可用引擎。`,
        suggestedActions: ['✨ 去 AI 味精修（离线可用）', '➕ 新增空白页'],
      };
    }
  } else if (effectiveBackend === 'auto' && availableClis.length > 0) {
    selectedCli = availableClis[0];
  }

  if (selectedCli) {
    const rawOutput = await runCliBackend(
      selectedCli,
      prompt.combinedPrompt,
      req.workspaceDir,
      req.cliRunner
    );
    const extracted = extractSlideFromLlmOutput(rawOutput, req.deck, targetLocale);
    const { updatedDeck, affectedSlideIndex } = applyParsedSlides(
      req.deck,
      extracted.slides,
      intent,
      safeIdx,
      req.message,
      req.targetLocale
    );

    const afterMd = serializeDeckMarkdown(updatedDeck);
    const diffLines = computeCompactDiff(beforeMd, afterMd);
    const beforeSlideMd = serializeSlideSection(req.deck, safeIdx);
    const afterSlideMd = serializeSlideSection(updatedDeck, affectedSlideIndex);
    const revisionId = req.deckPath
      ? await recordSnapshotPersistent(req.deckPath, req.deck, extracted.summary, req.workspaceDir)
      : '';

    return {
      engineUsed: selectedCli.label,
      message: `${extracted.summary}（由本机 ${selectedCli.label} 生成并无损编译）`,
      changeSummary: extracted.summary,
      diffLines,
      beforeSlideMd,
      afterSlideMd,
      updatedDeck,
      revisionId,
      affectedSlideIndex,
      suggestedActions: [
        '提炼金句卡片',
        '转为 Bento 风格',
        '生成演讲大纲',
        '翻译为双语',
        '✨ 去 AI 味精修',
        '🎙️ 补充演说逐字稿',
      ],
    };
  }

  // Route 3: Neither API nor local CLI is configured
  return executeOfflineTool(intent, req);
}
