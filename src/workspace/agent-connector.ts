import { execFile, spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';
import { promisify } from 'node:util';
import { materializeWorkspaceSkills, resolvePackageRoot } from './preset-skills.js';
import type {
  AgentConfigureResult,
  AgentHostId,
  AgentLaunchInfo,
  AgentLaunchMode,
  AgentLaunchResult,
  BeginnerTaskRecipe,
  ConfigureWorkspaceAgentsOptions,
  DetectedAgentHost,
  DetectedTerminalApp,
  LaunchAgentOptions,
  TerminalAppId,
} from './types.js';

const execFileAsync = promisify(execFile);

export const AGENT_HOST_PRIORITY: readonly AgentHostId[] = [
  'opencode',
  'workbuddy',
  'codex',
  'agy',
  'claude',
  'cursor',
  'claude-desktop',
] as const;

export const TERMINAL_APP_PRIORITY: readonly TerminalAppId[] = [
  'ghostty',
  'warp',
  'iterm',
  'cmux',
  'wezterm',
  'kitty',
  'terminal',
] as const;

export const BEGINNER_TASK_RECIPES: BeginnerTaskRecipe[] = [
  {
    id: 'xhs-viral',
    titleZh: '把素材变成 6 页爆款小红书图文',
    subtitleZh: '自动提炼核心干货与吸睛金句，排成 3:4 封面 + 5 页干货卡片并去 AI 味',
    badgeZh: '小红书 3:4',
    recommendedTemplate: 'xhs-swiss-grid',
    promptZh:
      '请先阅读本工作区里已放入的参考素材（sources/ 与 wiki/），把核心观点整理成一篇 6 页 3:4 爆款小红书图文（使用 xhs-swiss-grid 模板）：第 1 页做高点击封面与副标题，中间 4 页每页讲清 1 个具体方法并配数据或金句，第 6 页给可直接收藏的行动清单；写完后做一遍去 AI 味精修，并同步到 Aimake 舞台预览。',
  },
  {
    id: 'apple-bento-ppt',
    titleZh: '一键改写成 16:9 苹果便当盒 PPT',
    subtitleZh: '把零散笔记重排成汇报级宽屏演示，保留高对比核心数字与模块化卡片',
    badgeZh: '宽屏 PPT',
    recommendedTemplate: 'ppt-executive-16x9',
    promptZh:
      '请读取本工作区的素材与当前作品，帮我一键改写成一套高视觉密度的 16:9 苹果便当盒风格演示 PPT（使用 ppt-executive-16x9 模板）：按「核心结论 → 关键数据对比 → 方案拆解 → 行动路线图」组织 6~8 页，每页精简文字、突出关键指标，并实时同步到 Aimake 舞台方便导出 PPTX 与 PDF。',
  },
  {
    id: 'short-video-polish',
    titleZh: '去 AI 味精修 + 生成 60 秒口播短视频',
    subtitleZh: '删掉生硬书面腔，改成自然口播人话并切分动态字幕分镜，准备导出 MP4',
    badgeZh: '60 秒口播',
    recommendedTemplate: 'video-kinetic-reel',
    promptZh:
      '请先对本工作区当前作品做深度去 AI 味精修（删掉空洞套话、改用自然口语和真实细节），再改编成一份 60 秒 9:16 节奏明快的口播短视频分镜（使用 video-kinetic-reel 模板）：前 3 秒给出强钩子，每页配醒目大字字幕与口播台词，同步到 Aimake 舞台以便直接导出 MP4。',
  },
  {
    id: 'trending-wechat',
    titleZh: '结合时事热点写一篇深度公众号拆解',
    subtitleZh: '把近期行业热点与你的私有素材结合，生成适合微信阅读的深度长文',
    badgeZh: '公众号拆解',
    recommendedTemplate: 'wechat-editorial-article',
    promptZh:
      '请结合本工作区的知识库素材与当前行业热点，先梳理独特切入点与逻辑主线，再写成一篇扎实有温度的公众号深度拆解（使用 wechat-editorial-article 模板）：包含引人入胜的开篇案例、3 个递进式拆解小节与可落地建议，全程去 AI 味精修并同步到 Aimake 舞台。',
  },
];

export const COPILOT_TASK_RECIPES: BeginnerTaskRecipe[] = [
  {
    id: 'quote-extract',
    titleZh: '提炼金句卡片',
    subtitleZh: '深度提炼最具穿透力的核心论点与金句，排版为高质感独立金句卡片',
    badgeZh: '金句卡片',
    recommendedTemplate: 'xhs-swiss-grid',
    promptZh:
      '请阅读本工作区素材与当前作品，提炼最具穿透力的 1~2 句核心洞察金句，排版为独立金句卡片（layout: quote，含 > 引用与 — 作者），配上精炼上下文背景，去 AI 味精修并同步至 Aimake 舞台。',
  },
  {
    id: 'bento-style',
    titleZh: '转为 Bento 便当盒风格',
    subtitleZh: '重构为苹果 Bento 风格多栏模块化卡片网格，突出核心指标与数据对比',
    badgeZh: 'Bento 网格',
    recommendedTemplate: 'ppt-executive-16x9',
    promptZh:
      '请将当前作品改写或重排为高视觉密度的苹果 Bento 便当盒多栏卡片网格风格（使用 ppt-executive-16x9 或 bento 模板）：采用 metrics / comparison 模块化卡片，突出高对比数字与事实依据，同步到 Aimake 舞台。',
  },
  {
    id: 'presentation-outline',
    titleZh: '生成演讲大纲',
    subtitleZh: '自动梳理严谨起承转合的演说议程、各节用时与核心结论大纲',
    badgeZh: '演讲大纲',
    recommendedTemplate: 'ppt-executive-16x9',
    promptZh:
      '请基于当前工作区素材与作品，生成一份专业严密的演说演讲大纲（包含分段议程、预估用时、每一部分的核心主张与转折点），去 AI 味精修并同步至 Aimake 舞台。',
  },
  {
    id: 'bilingual-translate',
    titleZh: '翻译为中英双语',
    subtitleZh: '保持专业术语地道性，保留原格式排版，生成中英文双语对照版本',
    badgeZh: '双语对照',
    recommendedTemplate: 'xhs-swiss-grid',
    promptZh:
      '请将当前作品逐页转化为地道的中英双语对照版本：保留标题、副标题与每条核心要点的中英双语对照（中文 / English），术语地道自然，去除套话并同步至 Aimake 舞台。',
  },
];

export const ALL_TASK_RECIPES: BeginnerTaskRecipe[] = [
  ...BEGINNER_TASK_RECIPES,
  ...COPILOT_TASK_RECIPES,
];

interface AgentHostSpec {
  id: AgentHostId;
  name: string;
  displayName: string;
  cliBins: string[];
  macApps: string[];
  skillDir: string;
  mcpConfigFile: string;
  launchCliCommand: string;
  macOpenAppName?: string;
  launchMode: AgentLaunchMode;
  beginnerHintZh: string;
}

const AGENT_SPECS: Record<AgentHostId, AgentHostSpec> = {
  opencode: {
    id: 'opencode',
    name: 'OpenCode',
    displayName: 'OpenCode CLI',
    cliBins: ['opencode'],
    macApps: ['OpenCode.app'],
    skillDir: '.agents/skills',
    mcpConfigFile: 'opencode.json',
    launchCliCommand: 'opencode',
    launchMode: 'terminal-cli',
    beginnerHintZh: '自动在你选的终端里启动会话并加载创作技能，改稿实时同步上屏',
  },
  workbuddy: {
    id: 'workbuddy',
    name: 'WorkBuddy',
    displayName: 'Tencent WorkBuddy',
    cliBins: ['workbuddy'],
    macApps: ['WorkBuddy.app'],
    skillDir: '.agents/skills',
    mcpConfigFile: '.workbuddy/mcp.json',
    launchCliCommand: 'workbuddy',
    macOpenAppName: 'WorkBuddy',
    launchMode: 'gui-app',
    beginnerHintZh: '图形窗口直接打开本工作区，无需敲命令，粘贴指令即可开聊',
  },
  codebuddy: {
    id: 'codebuddy',
    name: 'CodeBuddy',
    displayName: 'Tencent CodeBuddy CLI',
    cliBins: ['codebuddy'],
    macApps: [],
    skillDir: '.agents/skills',
    mcpConfigFile: '.codebuddy/mcp.json',
    launchCliCommand: 'codebuddy',
    launchMode: 'terminal-cli',
    beginnerHintZh: '在终端启动 CodeBuddy 对话，自动读取工作区创作技能并执行任务',
  },
  codex: {
    id: 'codex',
    name: 'Codex',
    displayName: 'OpenAI Codex CLI',
    cliBins: ['codex'],
    macApps: ['Codex.app'],
    skillDir: '.agents/skills',
    mcpConfigFile: '.codex/config.toml',
    launchCliCommand: 'codex',
    launchMode: 'terminal-cli',
    beginnerHintZh: '自动在你选的终端里启动 Codex 会话，直接读素材写作品',
  },
  agy: {
    id: 'agy',
    name: 'Antigravity',
    displayName: 'Google Antigravity (AGY)',
    cliBins: ['agy', 'antigravity'],
    macApps: ['Antigravity.app'],
    skillDir: '.agents/skills',
    mcpConfigFile: '.agents/mcp_config.json',
    launchCliCommand: 'agy',
    macOpenAppName: 'Antigravity',
    launchMode: 'gui-app',
    beginnerHintZh: '图形窗口直接打开本工作区，免终端一键协同创作',
  },
  claude: {
    id: 'claude',
    name: 'Claude Code',
    displayName: 'Claude Code',
    cliBins: ['claude'],
    macApps: [],
    skillDir: '.claude/skills',
    mcpConfigFile: '.mcp.json',
    launchCliCommand: 'claude',
    launchMode: 'terminal-cli',
    beginnerHintZh: '自动在你选的终端里启动 Claude Code 会话并加载创作技能',
  },
  cursor: {
    id: 'cursor',
    name: 'Cursor',
    displayName: 'Cursor IDE',
    cliBins: ['cursor'],
    macApps: ['Cursor.app'],
    skillDir: '.agents/skills',
    mcpConfigFile: '.mcp.json',
    launchCliCommand: 'cursor .',
    macOpenAppName: 'Cursor',
    launchMode: 'gui-app',
    beginnerHintZh: '图形窗口直接打开本工作区，无需敲命令，直接粘贴指令创作',
  },
  'claude-desktop': {
    id: 'claude-desktop',
    name: 'Claude Desktop',
    displayName: 'Claude 桌面版',
    cliBins: [],
    macApps: ['Claude.app'],
    skillDir: '.claude/skills',
    mcpConfigFile: '.mcp.json',
    launchCliCommand: 'open -a "Claude"',
    macOpenAppName: 'Claude',
    launchMode: 'gui-app',
    beginnerHintZh: '直接打开 Claude 桌面窗口，创作指令已自动复制，粘贴发送即可',
  },
};

interface TerminalAppSpec {
  id: TerminalAppId;
  name: string;
  displayName: string;
  macAppName: string;
  appBundleName: string;
  isSystemUtility?: boolean;
  descriptionZh: string;
}

const TERMINAL_SPECS: Record<TerminalAppId, TerminalAppSpec> = {
  ghostty: {
    id: 'ghostty',
    name: 'Ghostty',
    displayName: 'Ghostty',
    macAppName: 'Ghostty',
    appBundleName: 'Ghostty.app',
    descriptionZh: '轻量原生 GPU 加速终端，直接在新窗口启动 AI 会话',
  },
  warp: {
    id: 'warp',
    name: 'Warp',
    displayName: 'Warp',
    macAppName: 'Warp',
    appBundleName: 'Warp.app',
    descriptionZh: '现代化智能终端，打开工作区目录并自动复制指令到剪贴板',
  },
  iterm: {
    id: 'iterm',
    name: 'iTerm2',
    displayName: 'iTerm2',
    macAppName: 'iTerm',
    appBundleName: 'iTerm.app',
    descriptionZh: '经典专业终端，自动新开窗口定位工作区并启动 AI 会话',
  },
  cmux: {
    id: 'cmux',
    name: 'cmux',
    displayName: 'cmux',
    macAppName: 'cmux',
    appBundleName: 'cmux.app',
    descriptionZh: '多会话原生终端工作区，打开当前目录并复制创作指令',
  },
  wezterm: {
    id: 'wezterm',
    name: 'WezTerm',
    displayName: 'WezTerm',
    macAppName: 'WezTerm',
    appBundleName: 'WezTerm.app',
    descriptionZh: '跨平台高性能终端，直接以工作区目录启动 AI 会话',
  },
  kitty: {
    id: 'kitty',
    name: 'kitty',
    displayName: 'kitty',
    macAppName: 'kitty',
    appBundleName: 'kitty.app',
    descriptionZh: '快速 GPU 终端，自动切入工作区目录启动 AI 会话',
  },
  terminal: {
    id: 'terminal',
    name: 'Terminal',
    displayName: 'macOS 终端 (Terminal)',
    macAppName: 'Terminal',
    appBundleName: 'Terminal.app',
    isSystemUtility: true,
    descriptionZh: 'macOS 系统自带终端，开箱即用，自动定位目录并启动 AI 会话',
  },
};

function getSearchBinDirs(envPath?: string): string[] {
  const raw = envPath ?? process.env.PATH ?? '';
  const parts = raw.split(path.delimiter).filter(Boolean);
  const extras = ['/opt/homebrew/bin', '/usr/local/bin', '/usr/bin'];
  const seen = new Set<string>();
  const ordered: string[] = [];
  for (const dir of [...parts, ...extras]) {
    if (!seen.has(dir)) {
      seen.add(dir);
      ordered.push(dir);
    }
  }
  return ordered;
}

async function findExecutableInDirs(binNames: string[], dirs: string[]): Promise<string | undefined> {
  for (const bin of binNames) {
    for (const dir of dirs) {
      const candidate = path.join(dir, bin);
      try {
        await fs.access(candidate, fsSync.constants.X_OK);
        const st = await fs.stat(candidate);
        if (st.isFile()) return candidate;
      } catch {
        // continue
      }
    }
  }
  return undefined;
}

async function findMacApp(appNames: string[], applicationsDir = '/Applications'): Promise<string | undefined> {
  if (process.platform !== 'darwin') return undefined;
  for (const appName of appNames) {
    const candidate = path.join(applicationsDir, appName);
    try {
      const st = await fs.stat(candidate);
      if (st.isDirectory()) return candidate;
    } catch {
      // continue
    }
  }
  return undefined;
}

/**
 * Fast, non-hanging detection of installed AI agent hosts on the local machine.
 * Checks PATH + /opt/homebrew/bin + /usr/local/bin + macOS /Applications/*.app.
 * Returns hosts in canonical priority order.
 */
export async function detectInstalledAgents(options?: {
  envPath?: string;
  applicationsDir?: string;
}): Promise<DetectedAgentHost[]> {
  const binDirs = getSearchBinDirs(options?.envPath);
  const appsDir = options?.applicationsDir ?? '/Applications';

  const checks = AGENT_HOST_PRIORITY.map(async (id, priority): Promise<DetectedAgentHost> => {
    const spec = AGENT_SPECS[id];
    const [binaryPath, appPath] = await Promise.all([
      findExecutableInDirs(spec.cliBins, binDirs),
      findMacApp(spec.macApps, appsDir),
    ]);

    return {
      id: spec.id,
      name: spec.name,
      displayName: spec.displayName,
      installed: Boolean(binaryPath || appPath),
      binaryPath,
      appPath,
      skillDir: spec.skillDir,
      mcpConfigFile: spec.mcpConfigFile,
      priority,
      launchMode: spec.launchMode,
      beginnerHintZh: spec.beginnerHintZh,
    };
  });

  return Promise.all(checks);
}

/**
 * Fast, non-hanging detection of installed macOS terminal applications.
 * Probes Ghostty, Warp, iTerm2, cmux, WezTerm, kitty, and macOS Terminal.app.
 */
export async function detectInstalledTerminals(options?: {
  applicationsDir?: string;
  systemUtilitiesDir?: string;
}): Promise<DetectedTerminalApp[]> {
  const appsDir = options?.applicationsDir ?? '/Applications';
  const sysUtilDir = options?.systemUtilitiesDir ?? '/System/Applications/Utilities';

  const checks = TERMINAL_APP_PRIORITY.map(async (id): Promise<DetectedTerminalApp> => {
    const spec = TERMINAL_SPECS[id];
    if (spec.isSystemUtility) {
      const detected = await findMacApp([spec.appBundleName], sysUtilDir);
      const isDarwin = process.platform === 'darwin';
      const appPath = detected ?? (isDarwin ? path.join(sysUtilDir, spec.appBundleName) : undefined);
      return {
        id: spec.id,
        name: spec.name,
        displayName: spec.displayName,
        installed: isDarwin ? true : Boolean(detected),
        appPath,
        descriptionZh: spec.descriptionZh,
      };
    }

    const appPath = await findMacApp([spec.appBundleName], appsDir);
    return {
      id: spec.id,
      name: spec.name,
      displayName: spec.displayName,
      installed: Boolean(appPath),
      appPath,
      descriptionZh: spec.descriptionZh,
    };
  });

  return Promise.all(checks);
}

export function resolveAimakeCliPath(customCliPath?: string): string {
  if (customCliPath && customCliPath.trim()) {
    return path.resolve(customCliPath.trim());
  }
  const pkgRoot = resolvePackageRoot();
  const distCli = path.join(pkgRoot, 'dist', 'cli.js');
  if (fsSync.existsSync(distCli)) {
    return distCli;
  }
  return distCli;
}

function escapeTomlString(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function buildCodexConfigToml(cliPath: string): string {
  const escapedCli = escapeTomlString(cliPath);
  return [
    '# Aimake 2.0 Workspace-Local Codex MCP Configuration',
    '# Generated inside this workspace only (never modifies ~/.codex).',
    '',
    '[mcp_servers.aimake]',
    'command = "node"',
    `args = ["${escapedCli}", "mcp"]`,
    '',
  ].join('\n');
}

function buildStandardMcpJson(cliPath: string): string {
  return `${JSON.stringify(
    {
      mcpServers: {
        aimake: {
          command: 'node',
          args: [cliPath, 'mcp'],
        },
      },
    },
    null,
    2
  )}\n`;
}

function buildOpenCodeJson(cliPath: string): string {
  return `${JSON.stringify(
    {
      $schema: 'https://opencode.ai/config.json',
      mcp: {
        aimake: {
          type: 'local',
          command: ['node', cliPath, 'mcp'],
          enabled: true,
        },
      },
      skills: ['.agents/skills'],
      permission: {
        skill: {
          '*': 'allow',
        },
      },
    },
    null,
    2
  )}\n`;
}

/**
 * Writes workspace-local ONLY MCP & OpenCode plugin configs inside workspaceDir
 * and materializes all 7 preset skills as independent real files (ZERO symlinks,
 * ZERO writes to the user's real ~/ home directory).
 */
export async function configureWorkspaceAgents(
  workspaceDir: string,
  options: ConfigureWorkspaceAgentsOptions = {}
): Promise<AgentConfigureResult> {
  const absWorkspace = path.resolve(workspaceDir);
  await fs.mkdir(absWorkspace, { recursive: true });

  const cliPath = resolveAimakeCliPath(options.cliPath);
  const hosts = new Set<AgentHostId>(options.hosts ?? AGENT_HOST_PRIORITY);
  const includeClaude =
    options.includeClaude ??
    (hosts.has('claude') || hosts.has('claude-desktop') || options.hosts === undefined);

  // 1. Materialize all 7 preset skills as real independent files (NO symlinks)
  const materializedSkills = await materializeWorkspaceSkills(absWorkspace, {
    includeClaude,
    force: options.force,
    scenario: options.scenario,
    workspaceName: options.workspaceName,
  });

  const writtenConfigs: string[] = [];
  let opencodePluginPath: string | undefined;

  // 2. OpenCode workspace config + real-file live sync plugin
  if (hosts.has('opencode')) {
    const ocConfigRel = 'opencode.json';
    await fs.writeFile(path.join(absWorkspace, ocConfigRel), buildOpenCodeJson(cliPath), 'utf8');
    writtenConfigs.push(ocConfigRel);

    const pluginSource = path.join(
      resolvePackageRoot(),
      'integrations',
      'opencode-plugin',
      'aimake-live-sync.js'
    );
    const pluginTargetRel = '.opencode/plugin/aimake-live-sync.js';
    const pluginTargetAbs = path.join(absWorkspace, ...pluginTargetRel.split('/'));
    await fs.mkdir(path.dirname(pluginTargetAbs), { recursive: true });
    try {
      const pluginBuf = await fs.readFile(pluginSource);
      await fs.writeFile(pluginTargetAbs, pluginBuf);
      opencodePluginPath = pluginTargetAbs;
      writtenConfigs.push(pluginTargetRel);
    } catch {
      // Plugin source missing in minimal package layout; ignore gracefully
    }
  }

  // 3. Claude Code / Claude Desktop / Cursor workspace .mcp.json
  if (hosts.has('claude') || hosts.has('cursor') || hosts.has('claude-desktop')) {
    const mcpJsonRel = '.mcp.json';
    await fs.writeFile(path.join(absWorkspace, mcpJsonRel), buildStandardMcpJson(cliPath), 'utf8');
    writtenConfigs.push(mcpJsonRel);
  }

  // 4. Codex workspace .codex/config.toml
  if (hosts.has('codex')) {
    const codexRel = '.codex/config.toml';
    const codexAbs = path.join(absWorkspace, ...codexRel.split('/'));
    await fs.mkdir(path.dirname(codexAbs), { recursive: true });
    await fs.writeFile(codexAbs, buildCodexConfigToml(cliPath), 'utf8');
    writtenConfigs.push(codexRel);
  }

  // 5. WorkBuddy workspace .workbuddy/mcp.json
  if (hosts.has('workbuddy')) {
    const wbRel = '.workbuddy/mcp.json';
    const wbAbs = path.join(absWorkspace, ...wbRel.split('/'));
    await fs.mkdir(path.dirname(wbAbs), { recursive: true });
    await fs.writeFile(wbAbs, buildStandardMcpJson(cliPath), 'utf8');
    writtenConfigs.push(wbRel);
  }

  // 6. Antigravity (AGY) workspace .agents/mcp_config.json
  if (hosts.has('agy')) {
    const agyRel = '.agents/mcp_config.json';
    const agyAbs = path.join(absWorkspace, ...agyRel.split('/'));
    await fs.mkdir(path.dirname(agyAbs), { recursive: true });
    await fs.writeFile(agyAbs, buildStandardMcpJson(cliPath), 'utf8');
    writtenConfigs.push(agyRel);
  }

  return {
    workspaceDir: absWorkspace,
    cliPath,
    writtenConfigs,
    materializedSkills,
    opencodePluginPath,
  };
}

function shellDoubleQuote(value: string): string {
  return `"${value.replace(/(["\\$`])/g, '\\$1')}"`;
}

function shellSingleQuote(value: string): string {
  return `'${value.replace(/'/g, `'\\''`)}'`;
}

function escapeAppleScriptString(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function findBeginnerRecipe(recipeId?: string): BeginnerTaskRecipe | undefined {
  if (!recipeId) return undefined;
  return ALL_TASK_RECIPES.find((recipe) => recipe.id === recipeId);
}

function formatTerminalLaunchHint(
  spec: AgentHostSpec,
  absWorkspace: string,
  command: string,
  terminal?: TerminalAppId
): string {
  const quotedDir = shellDoubleQuote(absWorkspace);
  if (spec.launchMode === 'gui-app' && spec.macOpenAppName) {
    return `open -a ${shellDoubleQuote(spec.macOpenAppName)} ${quotedDir}`;
  }
  const termId = terminal ?? 'terminal';
  const termSpec = TERMINAL_SPECS[termId] ?? TERMINAL_SPECS.terminal;
  switch (termId) {
    case 'ghostty':
      return `/usr/bin/open -na Ghostty --args --working-directory=${quotedDir} -e /bin/zsh -lc ${shellDoubleQuote(command)}`;
    case 'warp':
      return `open -a Warp ${quotedDir} (then run: ${spec.launchCliCommand})`;
    case 'iterm':
      return `Open iTerm2 at ${absWorkspace} and run: ${spec.launchCliCommand}`;
    case 'cmux':
      return `open -a cmux ${quotedDir} (then run: ${spec.launchCliCommand})`;
    case 'wezterm':
      return `wezterm start --cwd ${quotedDir} -- /bin/zsh -lc ${shellDoubleQuote(command)}`;
    case 'kitty':
      return `open -na kitty --args --directory ${quotedDir} /bin/zsh -lc ${shellDoubleQuote(command)}`;
    default:
      return `Open ${termSpec.displayName} at ${absWorkspace} and run: ${spec.launchCliCommand}`;
  }
}

/**
 * Builds the exact shell command, macOS launch instruction, and bilingual starter prompts
 * tailored to the current workspace's sources/, wiki/, active deck, recipe, and terminal.
 */
export function buildAgentLaunchInfo(
  workspaceDir: string,
  host: AgentHostId,
  options?: {
    activeDeckRel?: string;
    goal?: string;
    recipeId?: string;
    terminal?: TerminalAppId;
  }
): AgentLaunchInfo {
  const absWorkspace = path.resolve(workspaceDir);
  const spec = AGENT_SPECS[host];
  const quotedDir = shellDoubleQuote(absWorkspace);
  const command = `cd ${quotedDir} && ${spec.launchCliCommand}`;
  const recipe = findBeginnerRecipe(options?.recipeId);
  const terminal = spec.launchMode === 'terminal-cli' ? options?.terminal : undefined;

  const terminalLaunchHint = formatTerminalLaunchHint(spec, absWorkspace, command, terminal);

  const deckRefZh = options?.activeDeckRel
    ? `当前聚焦作品为 \`${options.activeDeckRel}\``
    : '可基于 `decks/` 中的作品或新建 `.deck.md`';
  const deckRefEn = options?.activeDeckRel
    ? `Current active deck: \`${options.activeDeckRel}\``
    : 'Work with decks in `decks/` or create a new `.deck.md`';

  const customGoal = options?.goal?.trim();
  const goalZh = recipe
    ? customGoal
      ? `${recipe.promptZh} 补充要求：${customGoal}`
      : recipe.promptZh
    : customGoal ||
      '请先调用 aimake-workspace-pilot 扫描本工作区的 sources/ 与 wiki/，先在 briefs/ 产出创作简报，再编写并去 AI 味精修 decks/ 作品，实时同步至 Aimake 舞台。';

  const goalEn =
    customGoal ||
    (recipe
      ? `Execute recipe "${recipe.id}" (${recipe.recommendedTemplate}): ${recipe.titleZh}`
      : 'Start with aimake-workspace-pilot to scan sources/ and wiki/, write a brief in briefs/, compose and humanize the deck in decks/ for live Aimake stage sync.');

  const starterPromptZh = recipe
    ? `我已进入 Aimake 创作工作区（${path.basename(absWorkspace)}）。${deckRefZh}。任务目标（${recipe.titleZh}）：${goalZh}`
    : `我已进入 Aimake 工作区（${path.basename(absWorkspace)}）。${deckRefZh}。请读取工作区预设 Skill（.agents/skills/）与 AGENTS.md：${goalZh}`;
  const starterPromptEn = `I am inside the Aimake workspace (${path.basename(absWorkspace)}). ${deckRefEn}. Follow AGENTS.md and the workspace preset skills: ${goalEn}`;

  const richPromptContext = [
    `【工作区】${path.basename(absWorkspace)} (${absWorkspace})`,
    deckRefZh,
    `【任务目标】${recipe ? `${recipe.titleZh} (${recipe.recommendedTemplate})` : 'AI 协同改稿创作'}`,
    `【执行指令】${goalZh}`,
    '【创作规范】遵循 .deck.md 语法，去除空洞 AI 套话，无损写回作品，Aimake 舞台实时毫秒级热重载。',
  ].join('\n');

  const escapedPrompt = `'${starterPromptZh.replace(/'/g, `'\\''`)}'`;
  let readyToRunCommand = command;
  switch (host) {
    case 'claude':
      readyToRunCommand = `cd ${quotedDir} && claude -p ${escapedPrompt}`;
      break;
    case 'codex':
      readyToRunCommand = `cd ${quotedDir} && codex exec --skip-git-repo-check ${escapedPrompt}`;
      break;
    case 'agy':
      readyToRunCommand = `cd ${quotedDir} && agy -p ${escapedPrompt}`;
      break;
    case 'codebuddy':
      readyToRunCommand = `cd ${quotedDir} && codebuddy -p ${escapedPrompt}`;
      break;
    case 'opencode':
      readyToRunCommand = `cd ${quotedDir} && opencode run ${escapedPrompt}`;
      break;
    case 'workbuddy':
      readyToRunCommand = `cd ${quotedDir} && workbuddy ${escapedPrompt}`;
      break;
    case 'cursor':
      readyToRunCommand = `cd ${quotedDir} && cursor .`;
      break;
    case 'claude-desktop':
      readyToRunCommand = `open -a "Claude"`;
      break;
  }

  return {
    host,
    hostName: spec.displayName,
    workspaceDir: absWorkspace,
    command,
    readyToRunCommand,
    terminalLaunchHint,
    starterPromptZh,
    starterPromptEn,
    richPromptContext,
    launchMode: spec.launchMode,
    terminal,
    recipeId: recipe?.id,
  };
}

async function copyToMacClipboard(text: string): Promise<boolean> {
  if (process.platform !== 'darwin' || !text) return false;
  return new Promise((resolve) => {
    try {
      const child = spawn('/usr/bin/pbcopy', [], { stdio: ['pipe', 'ignore', 'ignore'] });
      let settled = false;
      const finish = (ok: boolean) => {
        if (!settled) {
          settled = true;
          resolve(ok);
        }
      };
      const timer = setTimeout(() => {
        try {
          child.kill();
        } catch {
          // ignore
        }
        finish(false);
      }, 2000);
      child.on('error', () => {
        clearTimeout(timer);
        finish(false);
      });
      child.on('close', (code) => {
        clearTimeout(timer);
        finish(code === 0);
      });
      child.stdin.end(text, 'utf8');
    } catch {
      resolve(false);
    }
  });
}

async function resolvePreferredTerminal(
  requested?: TerminalAppId,
  dryRun = false
): Promise<{ terminalId: TerminalAppId; appPath?: string }> {
  const terminals = await detectInstalledTerminals();
  if (requested && TERMINAL_SPECS[requested]) {
    const matched = terminals.find((t) => t.id === requested);
    if (dryRun || matched?.installed) {
      return { terminalId: requested, appPath: matched?.appPath };
    }
  }
  const firstInstalled = terminals.find((t) => t.installed);
  if (firstInstalled) {
    return { terminalId: firstInstalled.id, appPath: firstInstalled.appPath };
  }
  return { terminalId: 'terminal', appPath: '/System/Applications/Utilities/Terminal.app' };
}

async function runTerminalAppleScript(appName: 'Terminal' | 'iTerm', shellCommand: string): Promise<void> {
  const escaped = escapeAppleScriptString(shellCommand);
  const scriptLines =
    appName === 'iTerm'
      ? [
          'tell application "iTerm"',
          'activate',
          `create window with default profile command "${escaped}"`,
          'end tell',
        ]
      : [
          'tell application "Terminal"',
          'activate',
          `do script "${escaped}"`,
          'end tell',
        ];

  const args: string[] = [];
  for (const line of scriptLines) {
    args.push('-e', line);
  }
  await execFileAsync('/usr/bin/osascript', args, { timeout: 5000 });
}

async function launchTerminalSession(
  terminalId: TerminalAppId,
  appPath: string | undefined,
  workspaceDir: string,
  cliCommand: string
): Promise<TerminalAppId> {
  const shellCommand = `cd ${shellSingleQuote(workspaceDir)} && ${cliCommand}`;
  const shellInteractive = `${shellCommand}; exec /bin/zsh -l`;

  try {
    switch (terminalId) {
      case 'terminal':
        await runTerminalAppleScript('Terminal', shellCommand);
        return 'terminal';

      case 'iterm':
        await runTerminalAppleScript('iTerm', shellCommand);
        return 'iterm';

      case 'ghostty': {
        const target = appPath ?? 'Ghostty';
        try {
          await execFileAsync(
            '/usr/bin/open',
            [
              '-na',
              target,
              '--args',
              `--working-directory=${workspaceDir}`,
              '-e',
              '/bin/zsh',
              '-lc',
              shellInteractive,
            ],
            { timeout: 5000 }
          );
        } catch {
          await execFileAsync('/usr/bin/open', ['-a', target, workspaceDir], { timeout: 5000 });
        }
        return 'ghostty';
      }

      case 'warp': {
        const target = appPath ?? 'Warp';
        await execFileAsync('/usr/bin/open', ['-a', target, workspaceDir], { timeout: 5000 });
        return 'warp';
      }

      case 'cmux': {
        const target = appPath ?? 'cmux';
        await execFileAsync('/usr/bin/open', ['-a', target, workspaceDir], { timeout: 5000 });
        return 'cmux';
      }

      case 'wezterm': {
        const weztermBin = appPath ? path.join(appPath, 'Contents', 'MacOS', 'wezterm') : '';
        if (weztermBin && fsSync.existsSync(weztermBin)) {
          const child = spawn(
            weztermBin,
            ['start', '--cwd', workspaceDir, '--', '/bin/zsh', '-lc', shellInteractive],
            { cwd: workspaceDir, detached: true, stdio: 'ignore' }
          );
          child.unref();
        } else {
          await execFileAsync('/usr/bin/open', ['-a', appPath ?? 'WezTerm', workspaceDir], {
            timeout: 5000,
          });
        }
        return 'wezterm';
      }

      case 'kitty': {
        const target = appPath ?? 'kitty';
        try {
          await execFileAsync(
            '/usr/bin/open',
            ['-na', target, '--args', '--directory', workspaceDir, '/bin/zsh', '-lc', shellInteractive],
            { timeout: 5000 }
          );
        } catch {
          await execFileAsync('/usr/bin/open', ['-a', target, workspaceDir], { timeout: 5000 });
        }
        return 'kitty';
      }
    }
  } catch {
    if (terminalId !== 'terminal') {
      await runTerminalAppleScript('Terminal', shellCommand);
      return 'terminal';
    }
    throw new Error(`Failed to launch ${terminalId} for ${workspaceDir}`);
  }
}

/**
 * Opens the selected AI agent host directly inside workspaceDir on macOS,
 * supporting both beginner-friendly GUI AI apps and multi-terminal CLI sessions,
 * with automatic clipboard prompt copy (skipped on dryRun).
 */
export async function launchAgentInWorkspace(
  workspaceDir: string,
  host: AgentHostId,
  options?: LaunchAgentOptions
): Promise<AgentLaunchResult> {
  const spec = AGENT_SPECS[host];
  const resolvedTerminal =
    spec.launchMode === 'terminal-cli'
      ? await resolvePreferredTerminal(options?.terminal, Boolean(options?.dryRun))
      : undefined;

  const info = buildAgentLaunchInfo(workspaceDir, host, {
    activeDeckRel: options?.activeDeckRel,
    goal: options?.goal,
    recipeId: options?.recipeId,
    terminal: resolvedTerminal?.terminalId,
  });

  if (options?.dryRun) {
    const termLabel = resolvedTerminal ? TERMINAL_SPECS[resolvedTerminal.terminalId].displayName : '';
    const message =
      spec.launchMode === 'gui-app'
        ? `演练模式：将直接打开 ${spec.displayName} 窗口定位到工作区并复制创作指令（${info.terminalLaunchHint}）`
        : `演练模式：将在 ${termLabel} 启动 ${spec.displayName}（命令：${info.command}）`;
    return {
      launched: false,
      dryRun: true,
      info,
      launchMode: spec.launchMode,
      terminalUsed: resolvedTerminal?.terminalId,
      copiedPrompt: false,
      message,
    };
  }

  if (process.platform !== 'darwin') {
    return {
      launched: false,
      dryRun: false,
      info,
      launchMode: spec.launchMode,
      terminalUsed: resolvedTerminal?.terminalId,
      copiedPrompt: false,
      message: `请在终端手动执行：${info.command}`,
    };
  }

  // Copy starter prompt to macOS clipboard so the creator only needs to press ⌘V
  const copiedPrompt = await copyToMacClipboard(info.starterPromptZh);

  // 1. GUI Desktop AI Apps (WorkBuddy / Antigravity / Cursor / Claude Desktop)
  if (spec.launchMode === 'gui-app' && spec.macOpenAppName) {
    const appPath = await findMacApp(spec.macApps);
    const appTarget = appPath ?? spec.macOpenAppName;
    await execFileAsync('/usr/bin/open', ['-a', appTarget, info.workspaceDir], { timeout: 5000 });
    return {
      launched: true,
      dryRun: false,
      info,
      launchMode: 'gui-app',
      copiedPrompt,
      message: copiedPrompt
        ? `已打开 ${spec.displayName} 并定位到当前工作区，创作指令已复制到剪贴板，直接 ⌘V 粘贴发送即可`
        : `已打开 ${spec.displayName} 并定位到当前工作区`,
    };
  }

  // 2. Terminal CLI AI Agents (OpenCode / Claude Code / Codex)
  const chosenTerminal = resolvedTerminal?.terminalId ?? 'terminal';
  const actualTerminal = await launchTerminalSession(
    chosenTerminal,
    resolvedTerminal?.appPath,
    info.workspaceDir,
    spec.launchCliCommand
  );
  const actualSpec = TERMINAL_SPECS[actualTerminal];
  const needsManualCli = actualTerminal === 'warp' || actualTerminal === 'cmux';

  const message = needsManualCli
    ? copiedPrompt
      ? `已在 ${actualSpec.displayName} 打开工作区，输入 ${spec.launchCliCommand} 启动后直接 ⌘V 粘贴已复制的创作指令即可`
      : `已在 ${actualSpec.displayName} 打开工作区，请输入 ${spec.launchCliCommand} 启动会话`
    : copiedPrompt
      ? `已在 ${actualSpec.displayName} 启动 ${spec.displayName}，创作指令已复制到剪贴板，直接 ⌘V 粘贴发送即可`
      : `已在 ${actualSpec.displayName} 启动 ${spec.displayName}`;

  return {
    launched: true,
    dryRun: false,
    info: {
      ...info,
      terminal: actualTerminal,
    },
    launchMode: 'terminal-cli',
    terminalUsed: actualTerminal,
    copiedPrompt,
    message,
  };
}
