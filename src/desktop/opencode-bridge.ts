import { execFile, spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';
import type { DeckDocument, SupportedLocale } from '../schema/types.js';
import { parseDeckMarkdown, serializeDeckMarkdown } from '../renderer/deck-parser.js';
import { auditAiSlop, humanizeText } from '../wiki/humanizer.js';
import { detectLocalHosts, getSkillSourceDir } from '../installer/host-installer.js';

const execFileAsync = promisify(execFile);

export interface AgentBinaryStatus {
  id: string;
  available: boolean;
  version?: string;
}

export interface OpenCodeBridgeStatus {
  opencode: AgentBinaryStatus;
  peerClis: AgentBinaryStatus[];
  detectedHostCount: number;
  detectedHostIds: string[];
  recommendedModel: string;
  mcpConfigSnippet: Record<string, unknown>;
}

export interface OpenCodeRunEvent {
  type: string;
  text?: string;
  toolName?: string;
  sessionID?: string;
}

export interface OpenCodeTaskResult {
  ok: boolean;
  driver: 'opencode' | 'deterministic';
  model: string;
  durationMs: number;
  exitCode: number;
  sessionID?: string;
  outputText: string;
  suggestedDeckMarkdown?: string;
  slopAudit: ReturnType<typeof auditAiSlop>;
  toolCalls: string[];
  stderr?: string;
}

async function probeBinary(cmd: string, args = ['--version']): Promise<AgentBinaryStatus> {
  try {
    const { stdout, stderr } = await execFileAsync(cmd, args, { timeout: 4000 });
    const raw = (stdout || stderr || '').trim().split('\n')[0]?.trim();
    return { id: cmd, available: true, version: raw || 'installed' };
  } catch {
    return { id: cmd, available: false };
  }
}

export async function detectOpenCodeStatus(options?: {
  sandboxHomeDir?: string;
  cliEntryPath?: string;
}): Promise<OpenCodeBridgeStatus> {
  const [opencode, claude, codex, dsh] = await Promise.all([
    probeBinary('opencode', ['--version']),
    probeBinary('claude', ['--version']),
    probeBinary('codex', ['--version']),
    probeBinary('dsh', ['--version']),
  ]);

  const hosts = await detectLocalHosts(options?.sandboxHomeDir);
  const detected = hosts.filter((h) => h.detected);
  const cliPath = options?.cliEntryPath || './dist/cli.js';

  return {
    opencode,
    peerClis: [claude, codex, dsh],
    detectedHostCount: detected.length,
    detectedHostIds: detected.map((h) => h.id),
    recommendedModel: 'opencode/hy4-flash-free',
    mcpConfigSnippet: {
      mcp: {
        aimake: {
          type: 'local',
          command: ['node', cliPath, 'mcp'],
          enabled: true,
        },
      },
    },
  };
}

export function parseOpenCodeNdjson(stdout: string): {
  outputText: string;
  toolCalls: string[];
  sessionID?: string;
  events: OpenCodeRunEvent[];
} {
  const events: OpenCodeRunEvent[] = [];
  const textParts: string[] = [];
  const toolCalls: string[] = [];
  let sessionID: string | undefined;

  for (const rawLine of stdout.split('\n')) {
    const line = rawLine.trim();
    if (!line.startsWith('{')) continue;
    try {
      const obj = JSON.parse(line) as {
        type?: string;
        sessionID?: string;
        part?: {
          type?: string;
          text?: string;
          tool?: string;
          name?: string;
        };
      };
      if (obj.sessionID && !sessionID) sessionID = obj.sessionID;
      const evtType = String(obj.type || obj.part?.type || 'unknown');
      const evt: OpenCodeRunEvent = { type: evtType, sessionID: obj.sessionID };
      if (evtType === 'text' && typeof obj.part?.text === 'string') {
        textParts.push(obj.part.text);
        evt.text = obj.part.text;
      }
      if (evtType === 'tool_use' || obj.part?.type === 'tool') {
        const name = String(obj.part?.tool || obj.part?.name || 'tool');
        toolCalls.push(name);
        evt.toolName = name;
      }
      events.push(evt);
    } catch {
      // ignore non-JSON diagnostic lines
    }
  }

  return {
    outputText: textParts.join('').trim() || stdout.trim(),
    toolCalls,
    sessionID,
    events,
  };
}

export async function createIsolatedOpenCodeWorkspace(
  workspaceDir: string,
  options: { cliEntryPath: string; vaultDir?: string }
): Promise<{
  workspaceDir: string;
  configPath: string;
  skillLinkPath: string;
  agentsMdPath: string;
}> {
  const absDir = path.resolve(workspaceDir);
  const absCli = path.resolve(options.cliEntryPath);
  await fs.mkdir(path.join(absDir, '.opencode', 'skills'), { recursive: true });

  const skillSource = getSkillSourceDir();
  const skillLinkPath = path.join(absDir, '.opencode', 'skills', 'aimake');
  try {
    await fs.lstat(skillLinkPath);
  } catch {
    await fs.symlink(skillSource, skillLinkPath, 'dir');
  }

  const configPath = path.join(absDir, 'opencode.json');
  const opencodeConfig = {
    $schema: 'https://opencode.ai/config.json',
    mcp: {
      aimake: {
        type: 'local',
        command: ['node', absCli, 'mcp'],
        enabled: true,
      },
    },
  };
  await fs.writeFile(configPath, `${JSON.stringify(opencodeConfig, null, 2)}\n`, 'utf8');

  const agentsMdPath = path.join(absDir, 'AGENTS.md');
  const agentsMd = [
    '# Aimake Sandbox Test Workspace',
    '',
    `CLI binary: \`node ${absCli}\``,
    options.vaultDir ? `Vault directory: \`${path.resolve(options.vaultDir)}\`` : '',
    '',
    'Use the Aimake CLI or MCP server to inspect Wiki context, lint citations, humanize drafts, and render `.deck.md` deliverables.',
  ]
    .filter(Boolean)
    .join('\n');
  await fs.writeFile(agentsMdPath, `${agentsMd}\n`, 'utf8');

  return { workspaceDir: absDir, configPath, skillLinkPath, agentsMdPath };
}

function synthesizeDeterministicRefinement(
  prompt: string,
  currentDeckRaw: string | undefined,
  locale: SupportedLocale,
  wikiContext?: string
): { outputText: string; suggestedDeckMarkdown: string } {
  const baseDeck: DeckDocument = currentDeckRaw
    ? parseDeckMarkdown(currentDeckRaw)
    : {
        frontmatter: {
          title: prompt.slice(0, 48) || 'Aimake Storyboard',
          template: 'xhs-swiss-grid',
          locale,
          aspect: '3:4',
          author: 'Aimake Studio',
          handle: '@aimake',
          watermark: true,
          fps: 24,
          secondsPerSlide: 3,
          tags: ['aimake', 'local-first'],
        },
        slides: [
          {
            index: 0,
            id: 'slide-1',
            layout: 'cover',
            eyebrow: 'LOCAL-FIRST BRIEF',
            title: humanizeText(prompt || 'Aimake Local Multimodal Workflow', locale),
            subtitle: 'Compiled deterministically from verified local Wiki notes.',
            bullets: [],
            bodyParagraphs: [],
            metrics: [],
          },
        ],
      };

  const updated: DeckDocument = structuredClone(baseDeck);
  updated.slides = updated.slides.map((slide) => ({
    ...slide,
    title: humanizeText(slide.title, locale),
    subtitle: slide.subtitle ? humanizeText(slide.subtitle, locale) : undefined,
    bullets: slide.bullets.map((b) => humanizeText(b, locale)),
    speech: slide.speech ? humanizeText(slide.speech, locale) : undefined,
  }));

  if (wikiContext && wikiContext.trim().length > 0 && updated.slides.length > 0) {
    const firstCitation = wikiContext.match(/([a-zA-Z0-9_/-]+\.md)/)?.[1];
    if (firstCitation && !updated.slides[0].cite) {
      updated.slides[0].cite = firstCitation;
    }
  }

  const serialized = serializeDeckMarkdown(updated);
  const summary =
    `Deterministic Aimake Bridge refined ${updated.slides.length} slide(s) ` +
    `for locale=${locale} using local Humanizer & Wiki grounding` +
    (prompt ? ` (goal: "${prompt.slice(0, 80)}")` : '') +
    '.';

  return { outputText: summary, suggestedDeckMarkdown: serialized };
}

export async function runOpenCodeTask(options: {
  prompt: string;
  cwd: string;
  driver?: 'opencode' | 'deterministic';
  model?: string;
  locale?: SupportedLocale;
  currentDeckRaw?: string;
  wikiContext?: string;
  timeoutMs?: number;
}): Promise<OpenCodeTaskResult> {
  const started = Date.now();
  const locale = options.locale || 'zh-CN';
  const model = options.model || 'opencode/hy4-flash-free';
  const requestedDriver =
    options.driver ||
    (process.env.AIMAKE_AI_DRIVER === 'deterministic' ? 'deterministic' : 'opencode');

  if (requestedDriver === 'deterministic') {
    const res = synthesizeDeterministicRefinement(
      options.prompt,
      options.currentDeckRaw,
      locale,
      options.wikiContext
    );
    return {
      ok: true,
      driver: 'deterministic',
      model: 'aimake-deterministic-local',
      durationMs: Date.now() - started,
      exitCode: 0,
      outputText: res.outputText,
      suggestedDeckMarkdown: res.suggestedDeckMarkdown,
      slopAudit: auditAiSlop(res.suggestedDeckMarkdown, locale),
      toolCalls: [],
    };
  }

  const composedPrompt = [
    options.wikiContext ? `Verified Local Wiki Context:\n${options.wikiContext.slice(0, 4000)}\n` : '',
    options.currentDeckRaw ? `Active .deck.md:\n${options.currentDeckRaw.slice(0, 4000)}\n` : '',
    `Task:\n${options.prompt}`,
  ]
    .filter(Boolean)
    .join('\n');

  const args = [
    'run',
    '--standalone',
    '--archived',
    '--auto',
    '--format',
    'json',
    '-m',
    model,
    composedPrompt,
  ];

  const timeoutMs = options.timeoutMs ?? 60_000;

  return new Promise<OpenCodeTaskResult>((resolve) => {
    const child = spawn('opencode', args, {
      cwd: path.resolve(options.cwd),
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    let timedOut = false;

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill('SIGTERM');
    }, timeoutMs);

    child.stdout.on('data', (chunk: Buffer) => {
      stdout += chunk.toString('utf8');
    });
    child.stderr.on('data', (chunk: Buffer) => {
      stderr += chunk.toString('utf8');
    });

    child.on('error', (err) => {
      clearTimeout(timer);
      const fallback = synthesizeDeterministicRefinement(
        options.prompt,
        options.currentDeckRaw,
        locale,
        options.wikiContext
      );
      resolve({
        ok: false,
        driver: 'opencode',
        model,
        durationMs: Date.now() - started,
        exitCode: -1,
        outputText: `Failed to spawn opencode: ${err.message}`,
        suggestedDeckMarkdown: fallback.suggestedDeckMarkdown,
        slopAudit: auditAiSlop(fallback.suggestedDeckMarkdown, locale),
        toolCalls: [],
        stderr: err.message,
      });
    });

    child.on('close', (code) => {
      clearTimeout(timer);
      const parsed = parseOpenCodeNdjson(stdout);
      const fenceMatch = parsed.outputText.match(/```(?:markdown|md|deck)?\n([\s\S]*?---[\s\S]*?)```/i);
      const suggestedDeckMarkdown = fenceMatch ? fenceMatch[1].trim() : undefined;
      resolve({
        ok: !timedOut && code === 0,
        driver: 'opencode',
        model,
        durationMs: Date.now() - started,
        exitCode: timedOut ? 124 : code ?? 1,
        sessionID: parsed.sessionID,
        outputText: timedOut ? `OpenCode task timed out after ${timeoutMs}ms.` : parsed.outputText,
        suggestedDeckMarkdown,
        slopAudit: auditAiSlop(suggestedDeckMarkdown || parsed.outputText, locale),
        toolCalls: parsed.toolCalls,
        stderr: stderr.trim() || undefined,
      });
    });
  });
}
