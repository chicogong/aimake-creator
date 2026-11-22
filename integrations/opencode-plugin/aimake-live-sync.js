/**
 * Aimake 2.0 Live Stage Sync Plugin for OpenCode (@opencode/plugin-compatible ESM).
 *
 * Detects edits to decks/*.deck.md, briefs/*.md, sources/*, wiki/*.md, or Aimake MCP
 * tool calls and posts a lightweight, non-blocking loopback notification to the running
 * Aimake Studio server (discovered via .aimake/studio-runtime.json) so the visual stage
 * focuses the edited deck/slide in <100ms. Fails silently if Aimake Studio is closed.
 */

import fs from 'node:fs/promises';
import path from 'node:path';

const WATCHED_PREFIXES = ['decks/', 'briefs/', 'sources/', 'wiki/', 'exports/'];
const FILE_MUTATION_TOOLS = new Set([
  'edit',
  'write',
  'multiedit',
  'patch',
  'apply_patch',
  'write_file',
  'edit_file',
]);

function toPosixRelative(workspaceDir, candidatePath) {
  if (!candidatePath || typeof candidatePath !== 'string') return null;
  const abs = path.isAbsolute(candidatePath)
    ? candidatePath
    : path.resolve(workspaceDir, candidatePath);
  const rel = path.relative(workspaceDir, abs).split(path.sep).join('/');
  if (!rel || rel.startsWith('..')) return null;
  return rel;
}

function isWorkspaceContentPath(relPath) {
  if (!relPath) return false;
  if (relPath.endsWith('.deck.md')) return true;
  return WATCHED_PREFIXES.some((prefix) => relPath.startsWith(prefix));
}

function extractCandidatePaths(obj) {
  if (!obj || typeof obj !== 'object') return [];
  const candidates = [];
  for (const key of [
    'filePath',
    'file_path',
    'path',
    'deckPath',
    'targetDeckPath',
    'outDeckPath',
    'output',
    'file',
  ]) {
    if (typeof obj[key] === 'string' && obj[key].trim()) {
      candidates.push(obj[key].trim());
    }
  }
  return candidates;
}

function extractSlideIndex(obj) {
  if (!obj || typeof obj !== 'object') return undefined;
  for (const key of ['slideIndex', 'slide_index', 'slide']) {
    const val = obj[key];
    if (typeof val === 'number' && Number.isInteger(val) && val >= 0) {
      return val;
    }
  }
  return undefined;
}

async function readStudioRuntimePort(workspaceDir) {
  try {
    const runtimePath = path.join(workspaceDir, '.aimake', 'studio-runtime.json');
    const raw = await fs.readFile(runtimePath, 'utf8');
    const data = JSON.parse(raw);
    if (typeof data.port === 'number' && data.port > 0 && data.port < 65536) {
      return data.port;
    }
    if (typeof data.url === 'string') {
      const parsed = new URL(data.url);
      if (
        (parsed.hostname === '127.0.0.1' || parsed.hostname === 'localhost') &&
        parsed.port
      ) {
        const port = Number(parsed.port);
        if (port > 0 && port < 65536) return port;
      }
    }
  } catch {
    // Aimake Studio not running or runtime metadata absent — fail silently.
  }
  return null;
}

/**
 * Post a non-blocking loopback notification to Aimake Studio.
 * Never throws; resolves quickly even if Studio is closed.
 */
export async function notifyAimakeStudio(workspaceDir, payload) {
  try {
    const port = await readStudioRuntimePort(workspaceDir);
    if (!port) return false;

    const endpoint = `http://127.0.0.1:${port}/api/events/notify`;
    const body = JSON.stringify({
      source: 'opencode-plugin',
      workspaceDir,
      timestamp: new Date().toISOString(),
      ...payload,
    });

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 350);
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body,
        signal: controller.signal,
      });
      return res.ok;
    } finally {
      clearTimeout(timer);
    }
  } catch {
    return false;
  }
}

export async function AimakeLiveSyncPlugin(ctx = {}) {
  const workspaceDir = ctx.directory || ctx.worktree || process.cwd();

  return {
    'tool.execute.after': async (input, output) => {
      try {
        const toolName = String(input?.tool || '').toLowerCase();
        const isAimakeTool = toolName.includes('aimake');
        const isFileTool = FILE_MUTATION_TOOLS.has(toolName);
        if (!isAimakeTool && !isFileTool) return;

        const args = input?.args || output?.metadata || {};
        const paths = [
          ...extractCandidatePaths(args),
          ...extractCandidatePaths(output?.metadata),
        ]
          .map((p) => toPosixRelative(workspaceDir, p))
          .filter(Boolean);

        const matchedPath = paths.find((rel) => isWorkspaceContentPath(rel)) || null;
        if (!isAimakeTool && !matchedPath) return;

        const deckPath =
          paths.find((rel) => rel.endsWith('.deck.md')) ||
          (matchedPath && matchedPath.endsWith('.deck.md') ? matchedPath : undefined);

        const eventType = deckPath
          ? 'deck:updated'
          : matchedPath?.startsWith('briefs/')
            ? 'brief:updated'
            : matchedPath?.startsWith('sources/')
              ? 'source:updated'
              : matchedPath?.startsWith('wiki/')
                ? 'wiki:updated'
                : 'workspace:tool';

        // Fire-and-forget so OpenCode tool execution never stalls waiting for Studio.
        void notifyAimakeStudio(workspaceDir, {
          type: eventType,
          tool: input?.tool || toolName,
          path: matchedPath || undefined,
          deckPath,
          slideIndex: extractSlideIndex(args) ?? extractSlideIndex(output?.metadata),
        });
      } catch {
        // Silent failure by design
      }
    },

    event: async ({ event } = {}) => {
      try {
        const eventType = event?.type || '';
        if (eventType !== 'file.edited' && eventType !== 'file.watcher.updated') {
          return;
        }
        const fileCandidate = event?.properties?.file || event?.properties?.path;
        const relPath = toPosixRelative(workspaceDir, fileCandidate);
        if (!isWorkspaceContentPath(relPath)) return;

        void notifyAimakeStudio(workspaceDir, {
          type: relPath.endsWith('.deck.md') ? 'deck:updated' : 'workspace:file',
          path: relPath,
          deckPath: relPath.endsWith('.deck.md') ? relPath : undefined,
        });
      } catch {
        // Silent failure by design
      }
    },
  };
}

export default AimakeLiveSyncPlugin;
