import crypto from 'node:crypto';
import http from 'node:http';
import fsSync from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type {
  AspectRatio,
  DeckDocument,
  SupportedLocale,
  TemplateCategory,
} from '../schema/types.js';
import {
  applyEditablePatch,
  parseDeckMarkdown,
  serializeDeckMarkdown,
} from '../renderer/deck-parser.js';
import { compileDeckToHtml, listTemplates } from '../renderer/html-compiler.js';
import { renderWeChatInlineHtml } from '../renderer/wechat-inliner.js';
import { exportDeckBundle, exportDeckToPngs } from '../renderer/exporter-media.js';
import {
  compoundOutputToWiki,
  ingestSource,
  initWikiVault,
  lintWiki,
  rebuildWikiIndex,
  slugify,
} from '../wiki/wiki-engine.js';
import {
  compileVaultGraph,
  exportVaultVisuals,
  getVaultGovernanceStatus,
  verifyDeckCitationsAgainstVault,
} from '../wiki/lwc-bridge.js';
import { auditAiSlop, humanizeText } from '../wiki/humanizer.js';
import {
  installMarketplaceItem,
  listInstalledTemplates,
  listMarketplaceCatalog,
  remixDeckWithStyle,
  searchMarketplace,
} from '../marketplace/index.js';
import {
  offlineFixtureSpeechProvider,
  synthesizeDeckSpeech,
} from '../speech/index.js';
import {
  CURATED_TREND_FIXTURES,
  generateDeckFromRadarItem,
  runTrendRadar,
} from '../radar/radar-engine.js';
import {
  detectOpenCodeStatus,
  runOpenCodeTask,
} from '../desktop/opencode-bridge.js';
import {
  buildCapCutDraft,
  detectLocalDraftDirectories,
} from '../renderer/capcut-draft-builder.js';
import {
  ALL_TASK_RECIPES,
  BEGINNER_TASK_RECIPES,
  COPILOT_TASK_RECIPES,
  buildAgentLaunchInfo,
  configureWorkspaceAgents,
  createWorkspaceDeck,
  detectInstalledAgents,
  detectInstalledTerminals,
  ingestWorkspaceSource,
  initWorkspace,
  inspectWorkspaceSkills,
  launchAgentInWorkspace,
  listRecentWorkspaces,
  readWorkspaceState,
  registerRecentWorkspace,
} from '../workspace/index.js';
import type {
  AgentHostId,
  TerminalAppId,
  WorkspaceScenarioPreset,
} from '../workspace/index.js';
import {
  getPublicChatConfig,
  listRevisions,
  processChatMessage,
  recordSnapshotPersistent,
  rollbackChatSnapshot,
  saveWorkspaceAiConfig,
  type ChatBackendId,
  type ChatHistoryMessage,
  type ChatIntent,
} from './chat-engine.js';
import { buildStudioShellHtml } from './studio-ui.js';

export const MAX_JSON_BODY_BYTES = 512 * 1024;

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function findPackageRoot(): string {
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
  return path.resolve(__dirname, '..');
}

const PACKAGE_ROOT = findPackageRoot();

export interface StudioServerOptions {
  deckPath: string;
  port?: number;
  exportBaseDir?: string;
  vaultDir?: string;
  workspaceDir?: string;
  registryPath?: string;
}

export interface StudioServerHandle {
  url: string;
  port: number;
  close: () => Promise<void>;
}

class HttpError extends Error {
  readonly statusCode: number;
  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}

interface MediaItem {
  rel: string;
  name: string;
  absPath: string;
  format: 'png' | 'mp4' | 'pdf' | 'pptx' | 'wechat.html' | 'srt' | 'wav';
  size: number;
  mtime: string;
  url: string;
}

function applySecurityHeaders(res: http.ServerResponse): void {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
  res.setHeader('Cache-Control', 'no-store');
}

function sendJson(res: http.ServerResponse, statusCode: number, payload: unknown): void {
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload));
}

export function isAllowedHostHeader(hostHeader: string | undefined, port: number): boolean {
  if (!hostHeader) return false;
  const normalized = hostHeader.trim().toLowerCase();
  return normalized === `127.0.0.1:${port}` || normalized === `localhost:${port}`;
}

export function isAllowedOriginHeader(originHeader: string | undefined, port: number): boolean {
  if (!originHeader) return true;
  try {
    const parsed = new URL(originHeader.trim());
    const hostWithPort = parsed.host.toLowerCase();
    const expected1 = `127.0.0.1:${port}`;
    const expected2 = `localhost:${port}`;
    return (
      (parsed.protocol === 'http:' || parsed.protocol === 'https:') &&
      (hostWithPort === expected1 || hostWithPort === expected2)
    );
  } catch {
    return false;
  }
}

export function isAllowedRefererHeader(refererHeader: string | undefined, port: number): boolean {
  if (!refererHeader) return true;
  try {
    const parsed = new URL(refererHeader.trim());
    const hostWithPort = parsed.host.toLowerCase();
    const expected1 = `127.0.0.1:${port}`;
    const expected2 = `localhost:${port}`;
    return (
      (parsed.protocol === 'http:' || parsed.protocol === 'https:') &&
      (hostWithPort === expected1 || hostWithPort === expected2)
    );
  } catch {
    return false;
  }
}

export function isForbiddenSystemPath(targetPath: string): boolean {
  const resolved = path.resolve(targetPath);
  const root = path.parse(resolved).root;
  if (resolved === root) return true;
  const lower = resolved.toLowerCase();
  const forbiddenPrefixes = [
    '/etc',
    '/var',
    '/usr',
    '/bin',
    '/sbin',
    '/sys',
    '/proc',
    '/dev',
    '/System',
    '/Library',
    '/private',
  ];
  return forbiddenPrefixes.some(
    (prefix) => lower === prefix.toLowerCase() || lower.startsWith(prefix.toLowerCase() + path.sep)
  );
}

export function getCurrentWeekString(d = new Date()): string {
  const target = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  target.setUTCDate(target.getUTCDate() + 4 - (target.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((target.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `W${weekNo}`;
}

async function readJsonBody(req: http.IncomingMessage): Promise<Record<string, unknown>> {
  const contentLengthHeader = req.headers['content-length'];
  if (contentLengthHeader !== undefined) {
    const declared = Number(contentLengthHeader);
    if (Number.isFinite(declared) && declared > MAX_JSON_BODY_BYTES) {
      throw new HttpError(413, `JSON body exceeds maximum size of ${MAX_JSON_BODY_BYTES} bytes`);
    }
  }

  const chunks: Buffer[] = [];
  let totalBytes = 0;
  for await (const chunk of req) {
    const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    totalBytes += buf.length;
    if (totalBytes > MAX_JSON_BODY_BYTES) {
      throw new HttpError(413, `JSON body exceeds maximum size of ${MAX_JSON_BODY_BYTES} bytes`);
    }
    chunks.push(buf);
  }

  const str = Buffer.concat(chunks).toString('utf8');
  if (!str.trim()) return {};
  try {
    const parsed = JSON.parse(str) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new HttpError(400, 'JSON body must be an object');
    }
    return parsed as Record<string, unknown>;
  } catch (err) {
    if (err instanceof HttpError) throw err;
    throw new HttpError(400, 'Invalid JSON body');
  }
}

function assertLexicalContainment(rootDir: string, relativeSubPath: string): string {
  if (!relativeSubPath || relativeSubPath.includes('\0')) {
    throw new HttpError(403, 'Invalid path');
  }
  if (path.isAbsolute(relativeSubPath) || relativeSubPath.startsWith('\\')) {
    throw new HttpError(403, 'Absolute paths are forbidden');
  }
  const segments = relativeSubPath.split(/[\\/]+/);
  if (segments.some((seg) => seg === '..')) {
    throw new HttpError(403, 'Path traversal is forbidden');
  }

  const absRoot = path.resolve(rootDir);
  const resolved = path.resolve(absRoot, relativeSubPath);
  if (resolved !== absRoot && !resolved.startsWith(absRoot + path.sep)) {
    throw new HttpError(403, 'Path escapes allowed root');
  }
  return resolved;
}

async function resolveContainedExistingFile(rootDir: string, relativeSubPath: string): Promise<string> {
  const candidate = assertLexicalContainment(rootDir, relativeSubPath);
  const absRoot = path.resolve(rootDir);

  let realRoot: string;
  try {
    realRoot = await fs.realpath(absRoot);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new HttpError(404, 'File not found');
    }
    throw err;
  }

  let realTarget: string;
  try {
    realTarget = await fs.realpath(candidate);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new HttpError(404, 'File not found');
    }
    throw err;
  }

  if (realTarget !== realRoot && !realTarget.startsWith(realRoot + path.sep)) {
    throw new HttpError(403, 'Symlink escapes allowed root');
  }

  const stat = await fs.stat(realTarget);
  if (!stat.isFile()) {
    throw new HttpError(404, 'Requested path is not a file');
  }
  return realTarget;
}

async function resolveContainedWriteTarget(rootDir: string, relativeSubPath: string): Promise<string> {
  const candidate = assertLexicalContainment(rootDir, relativeSubPath);
  const absRoot = path.resolve(rootDir);
  await fs.mkdir(absRoot, { recursive: true });
  const realRoot = await fs.realpath(absRoot);

  const parentDir = path.dirname(candidate);
  await fs.mkdir(parentDir, { recursive: true });
  const realParent = await fs.realpath(parentDir);

  if (realParent !== realRoot && !realParent.startsWith(realRoot + path.sep)) {
    throw new HttpError(403, 'Target directory symlink escapes allowed root');
  }

  try {
    const existingLstat = await fs.lstat(candidate);
    if (existingLstat.isSymbolicLink()) {
      const realExisting = await fs.realpath(candidate);
      if (realExisting !== realRoot && !realExisting.startsWith(realRoot + path.sep)) {
        throw new HttpError(403, 'Target symlink escapes allowed root');
      }
    }
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw err;
    }
  }

  return path.join(realParent, path.basename(candidate));
}

function classifyMediaFormat(fileName: string): MediaItem['format'] | null {
  const lower = fileName.toLowerCase();
  if (lower.endsWith('.wechat.html') || lower.endsWith('.html')) return 'wechat.html';
  if (lower.endsWith('.png')) return 'png';
  if (lower.endsWith('.mp4')) return 'mp4';
  if (lower.endsWith('.pdf')) return 'pdf';
  if (lower.endsWith('.pptx')) return 'pptx';
  if (lower.endsWith('.srt')) return 'srt';
  if (lower.endsWith('.wav')) return 'wav';
  return null;
}

function mimeTypeForFile(filePath: string): string {
  const lower = filePath.toLowerCase();
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.mp4')) return 'video/mp4';
  if (lower.endsWith('.pdf')) return 'application/pdf';
  if (lower.endsWith('.pptx')) {
    return 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
  }
  if (lower.endsWith('.html')) return 'text/html; charset=utf-8';
  if (lower.endsWith('.srt')) return 'text/plain; charset=utf-8';
  if (lower.endsWith('.wav')) return 'audio/wav';
  return 'application/octet-stream';
}

async function listMediaFilesRecursive(exportBase: string): Promise<MediaItem[]> {
  let realRoot: string;
  try {
    realRoot = await fs.realpath(exportBase);
  } catch {
    return [];
  }

  const items: MediaItem[] = [];

  async function walk(dirPath: string): Promise<void> {
    let entries: fsSync.Dirent[];
    try {
      entries = await fs.readdir(dirPath, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      const full = path.join(dirPath, entry.name);
      let realEntry: string;
      try {
        realEntry = await fs.realpath(full);
      } catch {
        continue;
      }
      if (realEntry !== realRoot && !realEntry.startsWith(realRoot + path.sep)) {
        continue;
      }

      let stat: fsSync.Stats;
      try {
        stat = await fs.stat(realEntry);
      } catch {
        continue;
      }

      if (stat.isDirectory()) {
        await walk(realEntry);
      } else if (stat.isFile()) {
        const format = classifyMediaFormat(entry.name);
        if (!format) continue;
        const rel = path.relative(realRoot, realEntry).split(path.sep).join('/');
        items.push({
          rel,
          name: entry.name,
          absPath: realEntry,
          format,
          size: stat.size,
          mtime: stat.mtime.toISOString(),
          url: `/api/media/file?rel=${encodeURIComponent(rel)}`,
        });
      }
    }
  }

  await walk(realRoot);
  items.sort((a, b) => b.mtime.localeCompare(a.mtime) || a.rel.localeCompare(b.rel));
  return items;
}

function parseSingleByteRange(
  rangeHeader: string,
  fileSize: number
): { start: number; end: number } | null {
  const match = /^bytes=(\d*)-(\d*)$/.exec(rangeHeader.trim());
  if (!match) return null;

  const [, startStr, endStr] = match;
  if (!startStr && !endStr) return null;
  if (fileSize <= 0) return null;

  if (!startStr) {
    const suffixLength = Number(endStr);
    if (!Number.isInteger(suffixLength) || suffixLength <= 0) return null;
    const start = Math.max(0, fileSize - suffixLength);
    return { start, end: fileSize - 1 };
  }

  const start = Number(startStr);
  const end = endStr ? Number(endStr) : fileSize - 1;
  if (
    !Number.isInteger(start) ||
    !Number.isInteger(end) ||
    start < 0 ||
    start >= fileSize ||
    end < start
  ) {
    return null;
  }

  return { start, end: Math.min(end, fileSize - 1) };
}

function collectDeckProse(deck: DeckDocument): string {
  const parts: string[] = [deck.frontmatter.title];
  for (const slide of deck.slides) {
    parts.push(slide.title);
    if (slide.subtitle) parts.push(slide.subtitle);
    if (slide.eyebrow) parts.push(slide.eyebrow);
    if (slide.bullets.length > 0) parts.push(...slide.bullets);
    if (slide.bodyParagraphs.length > 0) parts.push(...slide.bodyParagraphs);
    if (slide.quote?.text) parts.push(slide.quote.text);
    if (slide.speech) parts.push(slide.speech);
    if (slide.comparison) {
      parts.push(
        slide.comparison.leftTitle,
        ...slide.comparison.leftItems,
        slide.comparison.rightTitle,
        ...slide.comparison.rightItems
      );
    }
  }
  return parts.join('\n');
}

function humanizeDeckDocument(deck: DeckDocument, locale: SupportedLocale): DeckDocument {
  const cleaned: DeckDocument = structuredClone(deck);
  cleaned.frontmatter.title = humanizeText(cleaned.frontmatter.title, locale);
  cleaned.slides = cleaned.slides.map((slide) => ({
    ...slide,
    title: humanizeText(slide.title, locale),
    subtitle: slide.subtitle ? humanizeText(slide.subtitle, locale) : undefined,
    eyebrow: slide.eyebrow ? humanizeText(slide.eyebrow, locale) : undefined,
    bullets: slide.bullets.map((b) => humanizeText(b, locale)),
    bodyParagraphs: slide.bodyParagraphs.map((p) => humanizeText(p, locale)),
    quote: slide.quote
      ? {
          ...slide.quote,
          text: humanizeText(slide.quote.text, locale),
        }
      : undefined,
    speech: slide.speech ? humanizeText(slide.speech, locale) : undefined,
    comparison: slide.comparison
      ? {
          leftTitle: humanizeText(slide.comparison.leftTitle, locale),
          leftItems: slide.comparison.leftItems.map((it) => humanizeText(it, locale)),
          rightTitle: humanizeText(slide.comparison.rightTitle, locale),
          rightItems: slide.comparison.rightItems.map((it) => humanizeText(it, locale)),
        }
      : undefined,
  }));
  return cleaned;
}

function resolveTemplatesRoot(): string {
  const direct = path.join(PACKAGE_ROOT, 'templates');
  if (fsSync.existsSync(direct)) return direct;
  const fallback = path.resolve(process.cwd(), 'templates');
  return fallback;
}

function resolveTrendingRoot(): string {
  const direct = path.join(PACKAGE_ROOT, 'examples', 'trending');
  if (fsSync.existsSync(direct)) return direct;
  return path.resolve(process.cwd(), 'examples', 'trending');
}

function resolveCliPath(): string {
  const distCli = path.join(PACKAGE_ROOT, 'dist', 'cli.js');
  if (fsSync.existsSync(distCli)) return distCli;
  return path.resolve(process.cwd(), 'dist', 'cli.js');
}

function toRelPosix(rootDir: string, absPath: string): string {
  return path.relative(rootDir, absPath).split(path.sep).join('/');
}

async function buildNormalizedWorkspacePayload(
  workspaceDir: string,
  activeDeckPath: string
): Promise<Record<string, unknown>> {
  const summary = await readWorkspaceState(workspaceDir);

  // Include activeDeckPath in decks list even if it sits at workspace root (e.g. single-file mode)
  const decks = summary.decks.map((d) => ({
    rel: d.relativePath,
    name: d.name,
    title: d.title || d.name,
    template: d.template,
    slideCount: d.slideCount,
    updatedAt: d.updatedAt,
  }));
  const activeRel = toRelPosix(workspaceDir, activeDeckPath);
  if (!decks.some((d) => d.rel === activeRel) && fsSync.existsSync(activeDeckPath)) {
    try {
      const raw = await fs.readFile(activeDeckPath, 'utf8');
      const parsed = parseDeckMarkdown(raw, activeDeckPath);
      decks.unshift({
        rel: activeRel,
        name: path.basename(activeDeckPath),
        title: parsed.frontmatter.title || path.basename(activeDeckPath),
        template: parsed.frontmatter.template,
        slideCount: parsed.slides.length,
        updatedAt: new Date().toISOString(),
      });
    } catch {
      // ignore parse fallback
    }
  }

  return {
    workspaceDir: summary.workspaceDir,
    config: summary.config,
    brandKit: summary.brandKit,
    pipeline: {
      currentStage: summary.pipeline.currentStage,
      sourceCount: summary.sources.length,
      wikiCount: summary.wikiPages.length,
      briefCount: summary.briefs.length,
      deckCount: decks.length,
      exportCount: summary.exports.length,
      stages: summary.pipeline,
    },
    decks,
    sources: summary.sources.map((s) => ({
      rel: s.relativePath,
      name: s.name,
      size: s.size,
      updatedAt: s.updatedAt,
    })),
    briefs: summary.briefs.map((b) => ({
      rel: b.relativePath,
      name: b.name,
      updatedAt: b.updatedAt,
    })),
  };
}

export async function startStudioServer(
  options: StudioServerOptions
): Promise<StudioServerHandle> {
  let absDeckPath = path.resolve(options.deckPath);
  let workspaceDir = options.workspaceDir
    ? path.resolve(options.workspaceDir)
    : path.dirname(absDeckPath);
  let exportBase = options.exportBaseDir
    ? path.resolve(options.exportBaseDir)
    : fsSync.existsSync(path.join(workspaceDir, 'exports'))
      ? path.join(workspaceDir, 'exports')
      : path.join(path.dirname(absDeckPath), 'dist-exports');
  let vaultDir = options.vaultDir
    ? path.resolve(options.vaultDir)
    : fsSync.existsSync(path.join(workspaceDir, 'wiki'))
      ? path.join(workspaceDir, 'wiki')
      : path.join(workspaceDir, 'vault');

  const explicitExportBase = Boolean(options.exportBaseDir);
  const explicitVaultDir = Boolean(options.vaultDir);
  const registryPath = options.registryPath;

  let actualPort = options.port ?? 0;

  // =========================================================================
  // LIVE FILE WATCHER + SSE BROADCAST ENGINE (<100ms Stage Hot Reload)
  // =========================================================================
  const sseClients = new Set<http.ServerResponse>();
  let watchers: fsSync.FSWatcher[] = [];
  let watchDebounceTimer: ReturnType<typeof setTimeout> | null = null;
  let lastSelfWriteHash = '';

  function sha256Text(text: string): string {
    return crypto.createHash('sha256').update(text, 'utf8').digest('hex');
  }

  async function writeDeckFileInternally(content: string): Promise<void> {
    lastSelfWriteHash = sha256Text(content);
    await fs.writeFile(absDeckPath, content, 'utf8');
  }

  function broadcastSse(payload: Record<string, unknown>): void {
    const wire = `data: ${JSON.stringify(payload)}\n\n`;
    for (const client of sseClients) {
      try {
        if (!client.writableEnded && !client.destroyed) {
          client.write(wire, (err) => {
            if (err) sseClients.delete(client);
          });
        } else {
          sseClients.delete(client);
        }
      } catch {
        sseClients.delete(client);
      }
    }
  }

  function closeWatchers(): void {
    for (const w of watchers) {
      try {
        w.close();
      } catch {
        // ignore close errors
      }
    }
    watchers = [];
    if (watchDebounceTimer) {
      clearTimeout(watchDebounceTimer);
      watchDebounceTimer = null;
    }
  }

  function syncLastWriteHashFromDisk(): void {
    try {
      const current = fsSync.readFileSync(absDeckPath, 'utf8');
      lastSelfWriteHash = sha256Text(current);
    } catch {
      lastSelfWriteHash = '';
    }
  }

  function setupWatchers(): void {
    closeWatchers();
    syncLastWriteHashFromDisk();
    const dirsToWatch = new Set<string>([
      path.dirname(absDeckPath),
      path.join(workspaceDir, 'decks'),
      path.join(workspaceDir, 'sources'),
      path.join(workspaceDir, 'briefs'),
      exportBase,
    ]);

    for (const dir of dirsToWatch) {
      if (!fsSync.existsSync(dir)) continue;
      try {
        const w = fsSync.watch(dir, { persistent: false }, (_eventType, filename) => {
          const name = filename ? String(filename) : '';
          if (name.startsWith('.') && !name.endsWith('.deck.md')) return;
          if (watchDebounceTimer) clearTimeout(watchDebounceTimer);
          watchDebounceTimer = setTimeout(async () => {
            const isDeck =
              name.endsWith('.deck.md') ||
              (path.resolve(dir, name) === absDeckPath);
            if (isDeck) {
              try {
                const currentDisk = await fs.readFile(absDeckPath, 'utf8');
                const diskHash = sha256Text(currentDisk);
                if (diskHash === lastSelfWriteHash) {
                  return;
                }
                lastSelfWriteHash = diskHash;
              } catch {
                // fall through and broadcast
              }
            }
            broadcastSse({
              type: isDeck ? 'deck-changed' : 'workspace-changed',
              file: name,
              rel: toRelPosix(workspaceDir, absDeckPath),
              message: isDeck ? `检测到作品 ${name || path.basename(absDeckPath)} 已更新` : '工作区文件已更新',
              ts: Date.now(),
            });
          }, 110);
        });
        w.on('error', () => {
          // ignore transient watcher errors
        });
        watchers.push(w);
      } catch {
        // directory may not support fs.watch on some filesystems
      }
    }
  }

  async function writeRuntimeDiscoveryFile(): Promise<void> {
    if (!actualPort) return;
    try {
      const aimakeMetaDir = path.join(workspaceDir, '.aimake');
      await fs.mkdir(aimakeMetaDir, { recursive: true });
      const runtimePath = path.join(aimakeMetaDir, 'studio-runtime.json');
      await fs.writeFile(
        runtimePath,
        `${JSON.stringify(
          {
            url: `http://127.0.0.1:${actualPort}`,
            port: actualPort,
            pid: process.pid,
            workspaceDir,
            activeDeckPath: absDeckPath,
            updatedAt: new Date().toISOString(),
          },
          null,
          2
        )}\n`,
        'utf8'
      );
    } catch {
      // non-fatal if workspace is read-only
    }
  }

  async function removeRuntimeDiscoveryFile(dir: string): Promise<void> {
    try {
      const runtimePath = path.join(dir, '.aimake', 'studio-runtime.json');
      const raw = await fs.readFile(runtimePath, 'utf8');
      const parsed = JSON.parse(raw) as { pid?: number; port?: number };
      if (parsed.pid === process.pid || parsed.port === actualPort) {
        await fs.rm(runtimePath, { force: true });
      }
    } catch {
      // ignore if missing
    }
  }

  async function switchActiveWorkspace(
    nextWorkspaceDir: string,
    nextDeckPath?: string
  ): Promise<void> {
    const prevDir = workspaceDir;
    const resolvedWs = path.resolve(nextWorkspaceDir);
    if (prevDir !== resolvedWs) {
      await removeRuntimeDiscoveryFile(prevDir);
    }
    workspaceDir = resolvedWs;
    if (!explicitExportBase) {
      exportBase = path.join(workspaceDir, 'exports');
    }
    if (!explicitVaultDir) {
      vaultDir = fsSync.existsSync(path.join(workspaceDir, 'wiki'))
        ? path.join(workspaceDir, 'wiki')
        : path.join(workspaceDir, 'vault');
    }

    if (nextDeckPath) {
      absDeckPath = path.resolve(nextDeckPath);
    } else {
      const summary = await readWorkspaceState(workspaceDir);
      if (summary.decks.length > 0) {
        absDeckPath = summary.decks[0].absolutePath;
      } else {
        const created = await createWorkspaceDeck(workspaceDir, {
          title: `${summary.config.name} · 首发分镜`,
          template: summary.config.defaultTemplate,
          locale: summary.config.locale,
        });
        absDeckPath = created.deckPath;
      }
    }

    setupWatchers();
    await writeRuntimeDiscoveryFile();
    broadcastSse({
      type: 'deck-changed',
      rel: toRelPosix(workspaceDir, absDeckPath),
      message: '已切换工作区',
      ts: Date.now(),
    });
  }

  const server = http.createServer(async (req, res) => {
    applySecurityHeaders(res);

    try {
      // 1. Block DNS rebinding by validating Host header strictly against bound loopback port
      if (!isAllowedHostHeader(req.headers.host, actualPort)) {
        sendJson(res, 400, { error: 'Invalid Host header' });
        return;
      }

      // 2. Anti-CSRF: Validate Sec-Fetch-Site, Origin, and Referer for non-GET/HEAD mutating requests
      if (req.method !== 'GET' && req.method !== 'HEAD') {
        const secFetchSite = Array.isArray(req.headers['sec-fetch-site'])
          ? req.headers['sec-fetch-site'][0]
          : req.headers['sec-fetch-site'];
        if (secFetchSite && secFetchSite.trim().toLowerCase() === 'cross-site') {
          sendJson(res, 403, { error: 'Cross-site requests forbidden (Sec-Fetch-Site)' });
          return;
        }

        const origin = Array.isArray(req.headers.origin)
          ? req.headers.origin[0]
          : req.headers.origin;
        if (origin) {
          if (!isAllowedOriginHeader(origin, actualPort)) {
            sendJson(res, 403, { error: 'Cross-site or invalid Origin forbidden' });
            return;
          }
        } else {
          // If Origin is absent, validate Referer against loopback
          const referer = Array.isArray(req.headers.referer)
            ? req.headers.referer[0]
            : req.headers.referer;
          if (referer && !isAllowedRefererHeader(referer, actualPort)) {
            sendJson(res, 403, { error: 'Cross-site or invalid Referer forbidden' });
            return;
          }
        }
      }

      const url = new URL(req.url || '/', `http://127.0.0.1:${actualPort}`);

      // =======================================================================
      // LIVE SSE STREAM & EXTERNAL AI STAGE FOCUS NOTIFICATIONS
      // =======================================================================
      if (req.method === 'GET' && url.pathname === '/api/events') {
        res.writeHead(200, {
          'Content-Type': 'text/event-stream; charset=utf-8',
          'Cache-Control': 'no-cache, no-transform',
          Connection: 'keep-alive',
        });
        res.write(`data: ${JSON.stringify({ type: 'connected', ts: Date.now() })}\n\n`);
        sseClients.add(res);
        const cleanup = () => {
          sseClients.delete(res);
        };
        res.on('close', cleanup);
        res.on('finish', cleanup);
        res.on('error', cleanup);
        req.on('close', cleanup);
        return;
      }

      if (
        req.method === 'POST' &&
        (url.pathname === '/api/stage/focus' || url.pathname === '/api/events/notify')
      ) {
        const body = await readJsonBody(req);
        const deckRel = body.deckRel ? String(body.deckRel).trim() : '';
        if (deckRel) {
          try {
            const candidate = await resolveContainedExistingFile(workspaceDir, deckRel);
            if (candidate.endsWith('.deck.md')) {
              absDeckPath = candidate;
              setupWatchers();
              await writeRuntimeDiscoveryFile();
            }
          } catch {
            // keep current active deck if deckRel wasn't found
          }
        }
        const slideIndex =
          typeof body.slideIndex === 'number' && Number.isFinite(body.slideIndex)
            ? body.slideIndex
            : undefined;
        const message = body.message
          ? String(body.message)
          : slideIndex !== undefined
            ? `AI 已更新第 ${slideIndex + 1} 页`
            : 'AI 已实时更新工作区作品';
        broadcastSse({
          type: 'stage-focus',
          rel: toRelPosix(workspaceDir, absDeckPath),
          slideIndex,
          message,
          ts: Date.now(),
        });
        sendJson(res, 200, { ok: true, clients: sseClients.size });
        return;
      }

      // =======================================================================
      // TEMPLATE PREVIEW COVER THUMBNAILS (Cacheable static PNG assets with SVG fallback)
      // =======================================================================
      if (req.method === 'GET' && url.pathname.startsWith('/api/templates/thumb/')) {
        const rawName = decodeURIComponent(url.pathname.slice('/api/templates/thumb/'.length));
        const match = /^([a-z0-9-]+)\.(png|svg)$/i.exec(rawName);
        if (!match) {
          throw new HttpError(400, 'Invalid template thumbnail id');
        }
        const tplId = match[1];
        try {
          const tplRoot = resolveTemplatesRoot();
          const thumbPath = await resolveContainedExistingFile(tplRoot, `${tplId}/preview.png`);
          const stat = await fs.stat(thumbPath);
          res.writeHead(200, {
            'Content-Type': 'image/png',
            'Content-Length': String(stat.size),
            'Cache-Control': 'public, max-age=3600',
          });
          fsSync.createReadStream(thumbPath).pipe(res);
          return;
        } catch {
          const label = tplId.replace(/[-_]+/g, ' ').toUpperCase();
          const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480" viewBox="0 0 640 480" fill="none">
            <rect width="640" height="480" fill="#131722"/>
            <rect x="20" y="20" width="600" height="440" rx="16" fill="#1A1F2E" stroke="#2B3347" stroke-width="2"/>
            <circle cx="320" cy="200" r="44" fill="#6951FF" fill-opacity="0.18" stroke="#6951FF" stroke-width="2"/>
            <polygon points="310,185 338,200 310,215" fill="#6951FF"/>
            <text x="320" y="285" fill="#F8FAFC" font-size="19" font-family="-apple-system,BlinkMacSystemFont,sans-serif" font-weight="600" text-anchor="middle">${label}</text>
            <text x="320" y="315" fill="#94A3B8" font-size="13" font-family="-apple-system,BlinkMacSystemFont,sans-serif" text-anchor="middle">Aimake Parametric Design System</text>
          </svg>`;
          res.writeHead(200, {
            'Content-Type': 'image/svg+xml; charset=utf-8',
            'Cache-Control': 'public, max-age=3600',
          });
          res.end(svg);
          return;
        }
      }

      // =======================================================================
      // TRENDING 2026 CURRENT-NEWS SHOWCASE WORKS (紧跟时事范例库)
      // =======================================================================
      if (req.method === 'GET' && url.pathname === '/api/trending') {
        const trendingRoot = resolveTrendingRoot();
        try {
          const manifestRaw = await fs.readFile(path.join(trendingRoot, 'manifest.json'), 'utf8');
          const parsed = JSON.parse(manifestRaw) as
            | { works?: Array<Record<string, unknown>>; items?: Array<Record<string, unknown>> }
            | Array<Record<string, unknown>>;
          const list = Array.isArray(parsed) ? parsed : (parsed.works || parsed.items || []);
          const items = list.map((item) => ({
            ...item,
            previewUrl: `/api/trending/thumb/${encodeURIComponent(String(item.id || ''))}.png`,
          }));
          sendJson(res, 200, { ok: true, items });
        } catch {
          sendJson(res, 200, { ok: true, items: [] });
        }
        return;
      }

      if (req.method === 'GET' && url.pathname.startsWith('/api/trending/thumb/')) {
        const rawName = decodeURIComponent(url.pathname.slice('/api/trending/thumb/'.length));
        const match = /^([a-z0-9-]+)\.png$/i.exec(rawName);
        if (!match) {
          throw new HttpError(400, 'Invalid trending thumbnail id');
        }
        try {
          const trendingRoot = resolveTrendingRoot();
          const thumbPath = await resolveContainedExistingFile(trendingRoot, `${match[1]}.preview.png`);
          const stat = await fs.stat(thumbPath);
          res.writeHead(200, {
            'Content-Type': 'image/png',
            'Content-Length': String(stat.size),
            'Cache-Control': 'public, max-age=3600',
          });
          fsSync.createReadStream(thumbPath).pipe(res);
          return;
        } catch {
          const label = match[1].replace(/[-_]+/g, ' ').toUpperCase();
          const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480" viewBox="0 0 640 480" fill="none">
            <rect width="640" height="480" fill="#131722"/>
            <rect x="20" y="20" width="600" height="440" rx="16" fill="#1A1F2E" stroke="#FFCB49" stroke-width="2"/>
            <circle cx="320" cy="200" r="44" fill="#FFCB49" fill-opacity="0.18" stroke="#FFCB49" stroke-width="2"/>
            <polygon points="310,185 338,200 310,215" fill="#FFCB49"/>
            <text x="320" y="285" fill="#F8FAFC" font-size="18" font-family="-apple-system,BlinkMacSystemFont,sans-serif" font-weight="600" text-anchor="middle">${label}</text>
            <text x="320" y="315" fill="#94A3B8" font-size="13" font-family="-apple-system,BlinkMacSystemFont,sans-serif" text-anchor="middle">2026 Aimake Trending Showcase Work</text>
          </svg>`;
          res.writeHead(200, {
            'Content-Type': 'image/svg+xml; charset=utf-8',
            'Cache-Control': 'public, max-age=3600',
          });
          res.end(svg);
          return;
        }
      }

      if (req.method === 'POST' && url.pathname === '/api/trending/import') {
        const body = await readJsonBody(req);
        const itemId = String(body.id || '').trim();
        if (!/^[a-z0-9-]+$/i.test(itemId)) {
          throw new HttpError(400, 'Invalid trending item id');
        }
        const trendingRoot = resolveTrendingRoot();
        const manifestRaw = await fs.readFile(path.join(trendingRoot, 'manifest.json'), 'utf8');
        const parsed = JSON.parse(manifestRaw) as
          | {
              works?: Array<{ id: string; deckFile: string; title?: string }>;
              items?: Array<{ id: string; deckFile: string; title?: string }>;
            }
          | Array<{ id: string; deckFile: string; title?: string }>;
        const list = Array.isArray(parsed) ? parsed : (parsed.works || parsed.items || []);
        const entry = list.find((it) => it.id === itemId);
        if (!entry || !entry.deckFile) {
          throw new HttpError(404, `Trending work not found: ${itemId}`);
        }
        const srcDeckPath = await resolveContainedExistingFile(
          trendingRoot,
          path.basename(entry.deckFile)
        );
        const mode = String(body.mode || 'import');
        if (mode === 'remix') {
          const result = await remixDeckWithStyle({
            sourceDeckPath: srcDeckPath,
            targetDeckPath: absDeckPath,
            outDeckPath: absDeckPath,
            humanize: Boolean(body.humanize),
          });
          syncLastWriteHashFromDisk();
          sendJson(res, 200, { ok: true, ...result, importMode: 'remix' });
          return;
        }
        const decksDir = path.join(workspaceDir, 'decks');
        await fs.mkdir(decksDir, { recursive: true });
        const destFile = `${itemId}-${Date.now().toString(36).slice(-4)}.deck.md`;
        const destPath = await resolveContainedWriteTarget(decksDir, destFile);
        const rawContent = await fs.readFile(srcDeckPath, 'utf8');
        await fs.writeFile(destPath, rawContent, 'utf8');
        absDeckPath = destPath;
        setupWatchers();
        await writeRuntimeDiscoveryFile();
        sendJson(res, 200, {
          ok: true,
          mode: 'import',
          rel: toRelPosix(workspaceDir, destPath),
          title: entry.title || itemId,
        });
        return;
      }

      // =======================================================================
      // AIMAKE RADAR API: REAL-TIME TRENDS & 1-CLICK DECK CREATION
      // =======================================================================
      if (req.method === 'GET' && url.pathname === '/api/radar') {
        const category = url.searchParams.get('category') || 'all';
        const limit = Number(url.searchParams.get('limit')) || 12;
        const week = getCurrentWeekString();
        try {
          const items = await runTrendRadar({
            category,
            limit,
          });
          sendJson(res, 200, { ok: true, week, count: items.length, items });
        } catch {
          const items = CURATED_TREND_FIXTURES.slice(0, limit);
          sendJson(res, 200, { ok: true, week, count: items.length, items });
        }
        return;
      }

      if (req.method === 'POST' && url.pathname === '/api/radar/make') {
        const body = await readJsonBody(req);
        const itemId = String(body.id || '').trim();
        const customTemplate = body.template ? String(body.template).trim() : undefined;
        const customAspect = body.aspectRatio ? String(body.aspectRatio).trim() : undefined;

        const items = await runTrendRadar({ limit: 50 });
        const targetItem = items.find((it) => it.id === itemId) || items[0] || CURATED_TREND_FIXTURES[0];

        const { deckMarkdown, template, aspectRatio, title } = generateDeckFromRadarItem(targetItem, {
          template: customTemplate,
          aspectRatio: customAspect as '3:4' | '16:9' | undefined,
        });

        const slug = slugify(title).slice(0, 36) || `radar-${Date.now().toString(36).slice(-4)}`;
        const decksDir = path.join(workspaceDir, 'decks');
        await fs.mkdir(decksDir, { recursive: true });
        const targetPath = await resolveContainedWriteTarget(decksDir, `${slug}.deck.md`);
        await fs.writeFile(targetPath, deckMarkdown, 'utf8');

        absDeckPath = targetPath;
        setupWatchers();
        await writeRuntimeDiscoveryFile();

        broadcastSse({
          type: 'stage-focus',
          rel: toRelPosix(workspaceDir, absDeckPath),
          slideIndex: 0,
          message: `已基于「${title.slice(0, 18)}」一键生成作品`,
          ts: Date.now(),
        });

        sendJson(res, 200, {
          ok: true,
          rel: toRelPosix(workspaceDir, absDeckPath),
          title,
          template,
          aspectRatio,
        });
        return;
      }

      // =======================================================================
      // STAGE SLIDE OPERATIONS (+ 加页 / 复制页 / 删除页)
      // =======================================================================
      if (req.method === 'POST' && url.pathname === '/api/slides/add') {
        const body = await readJsonBody(req);
        const rawMarkdown = await fs.readFile(absDeckPath, 'utf8');
        const deck = parseDeckMarkdown(rawMarkdown, absDeckPath);
        const afterIndex =
          typeof body.afterIndex === 'number' && Number.isFinite(body.afterIndex)
            ? Math.max(0, Math.min(deck.slides.length - 1, body.afterIndex))
            : deck.slides.length - 1;
        const insertAt = deck.slides.length === 0 ? 0 : afterIndex + 1;
        const newSlide = {
          index: insertAt,
          id: `slide-${Date.now().toString(36)}`,
          layout: 'bullets' as const,
          eyebrow: 'NEW SECTION',
          title: String(body.title || `第 ${deck.slides.length + 1} 页核心观点`),
          subtitle: '点击画布上的任意文字即可直接编辑修改',
          bullets: [
            '第一条核心论据或行动建议',
            '第二条真实数据或案例支撑',
            '第三条给读者的清晰收获',
          ],
          bodyParagraphs: [],
          metrics: [],
        };
        deck.slides.splice(insertAt, 0, newSlide);
        deck.slides.forEach((s, i) => {
          s.index = i;
        });
        await writeDeckFileInternally(serializeDeckMarkdown(deck));
        sendJson(res, 200, { ok: true, slideIndex: insertAt, slideCount: deck.slides.length });
        return;
      }

      if (req.method === 'POST' && url.pathname === '/api/slides/duplicate') {
        const body = await readJsonBody(req);
        const rawMarkdown = await fs.readFile(absDeckPath, 'utf8');
        const deck = parseDeckMarkdown(rawMarkdown, absDeckPath);
        const idx = Math.max(0, Math.min(deck.slides.length - 1, Number(body.slideIndex || 0)));
        if (deck.slides.length === 0) throw new HttpError(400, 'No slide to duplicate');
        const clone = structuredClone(deck.slides[idx]);
        clone.id = `slide-${Date.now().toString(36)}`;
        deck.slides.splice(idx + 1, 0, clone);
        await writeDeckFileInternally(serializeDeckMarkdown(deck));
        sendJson(res, 200, { ok: true, slideIndex: idx + 1, slideCount: deck.slides.length });
        return;
      }

      if (req.method === 'POST' && url.pathname === '/api/slides/delete') {
        const body = await readJsonBody(req);
        const rawMarkdown = await fs.readFile(absDeckPath, 'utf8');
        const deck = parseDeckMarkdown(rawMarkdown, absDeckPath);
        if (deck.slides.length <= 1) {
          throw new HttpError(400, '至少需要保留 1 页内容');
        }
        const idx = Math.max(0, Math.min(deck.slides.length - 1, Number(body.slideIndex || 0)));
        deck.slides.splice(idx, 1);
        await writeDeckFileInternally(serializeDeckMarkdown(deck));
        sendJson(res, 200, {
          ok: true,
          slideIndex: Math.max(0, idx - 1),
          slideCount: deck.slides.length,
        });
        return;
      }

      // =======================================================================
      // CONVERSATIONAL CREATION & STAGE CONTROLS ("1+1" Real AI + Disk Rollback)
      // =======================================================================
      if (req.method === 'GET' && url.pathname === '/api/chat/config') {
        const cfg = await getPublicChatConfig(workspaceDir);
        sendJson(res, 200, { ok: true, ...cfg });
        return;
      }

      if (req.method === 'POST' && url.pathname === '/api/chat/config') {
        const body = await readJsonBody(req);
        await saveWorkspaceAiConfig(workspaceDir, {
          preferredBackend: body.preferredBackend
            ? (String(body.preferredBackend) as ChatBackendId)
            : undefined,
          baseUrl: body.baseUrl !== undefined ? String(body.baseUrl) : undefined,
          apiKey: body.apiKey !== undefined ? String(body.apiKey) : undefined,
          model: body.model !== undefined ? String(body.model) : undefined,
          clearApiKey: Boolean(body.clearApiKey),
        });
        const cfg = await getPublicChatConfig(workspaceDir);
        sendJson(res, 200, { ok: true, ...cfg });
        return;
      }

      if (req.method === 'GET' && url.pathname === '/api/chat/revisions') {
        const revisions = await listRevisions(workspaceDir, absDeckPath);
        sendJson(res, 200, { ok: true, revisions });
        return;
      }

      if (req.method === 'POST' && url.pathname === '/api/chat') {
        const body = await readJsonBody(req);
        const rawMarkdown = await fs.readFile(absDeckPath, 'utf8');
        const deck = parseDeckMarkdown(rawMarkdown, absDeckPath);
        const rawBackend = body.backend ?? body.mode ?? 'auto';
        const backend: ChatBackendId =
          rawBackend === 'local'
            ? 'offline'
            : rawBackend === 'agent'
              ? 'auto'
              : (String(rawBackend) as ChatBackendId);

        const history: ChatHistoryMessage[] | undefined = Array.isArray(body.history)
          ? body.history
              .slice(-6)
              .filter(
                (h): h is ChatHistoryMessage =>
                  Boolean(h) &&
                  (h.role === 'user' || h.role === 'assistant') &&
                  typeof h.content === 'string'
              )
          : undefined;

        const chatReq = {
          message: String(body.message || '').trim(),
          intent: (body.intent || undefined) as ChatIntent | undefined,
          activeSlideIndex: Number(body.activeSlideIndex || 0),
          deck,
          deckPath: absDeckPath,
          backend,
          history,
          targetLocale: body.targetLocale as SupportedLocale | undefined,
          workspaceDir,
        };

        const result = await processChatMessage(chatReq);
        if (result.updatedDeck) {
          const serialized = serializeDeckMarkdown(result.updatedDeck);
          await writeDeckFileInternally(serialized);
          broadcastSse({
            type: 'chat_update',
            message: result.message,
            engineUsed: result.engineUsed,
            changeSummary: result.changeSummary,
            diffLines: result.diffLines,
            revisionId: result.revisionId,
            slideIndex: result.affectedSlideIndex ?? chatReq.activeSlideIndex,
          });
        }

        sendJson(res, 200, {
          ok: true,
          message: result.message,
          engineUsed: result.engineUsed,
          changeSummary: result.changeSummary,
          diffLines: result.diffLines,
          beforeSlideMd: result.beforeSlideMd,
          afterSlideMd: result.afterSlideMd,
          revisionId: result.revisionId,
          suggestedActions: result.suggestedActions,
          affectedSlideIndex: result.affectedSlideIndex,
          needsAiSetup: result.needsAiSetup,
        });
        return;
      }

      if (req.method === 'POST' && url.pathname === '/api/chat/apply') {
        const body = await readJsonBody(req);
        const serialized = body.content ? String(body.content) : undefined;
        const summary = body.summary ? String(body.summary) : '应用 AI 创作修改';
        if (serialized) {
          await writeDeckFileInternally(serialized);
          const revId = await recordSnapshotPersistent(
            absDeckPath,
            parseDeckMarkdown(serialized, absDeckPath),
            summary,
            workspaceDir
          );
          broadcastSse({
            type: 'chat_apply',
            message: summary,
            revisionId: revId,
          });
          sendJson(res, 200, { ok: true, revisionId: revId, message: '已成功应用修改' });
          return;
        }
        sendJson(res, 200, { ok: true, message: '已确认应用当前版本' });
        return;
      }

      if (req.method === 'POST' && url.pathname === '/api/chat/rollback') {
        const body = await readJsonBody(req);
        const targetRevisionId = body.revisionId ? String(body.revisionId) : undefined;
        const rollbackRes = await rollbackChatSnapshot(absDeckPath, targetRevisionId, workspaceDir);
        if (rollbackRes.success) {
          syncLastWriteHashFromDisk();
          broadcastSse({
            type: 'chat_rollback',
            message: rollbackRes.message,
          });
        }
        sendJson(res, rollbackRes.success ? 200 : 400, rollbackRes);
        return;
      }

      if (req.method === 'POST' && url.pathname === '/api/stage/aspect') {
        const body = await readJsonBody(req);
        const rawMarkdown = await fs.readFile(absDeckPath, 'utf8');
        const deck = parseDeckMarkdown(rawMarkdown, absDeckPath);
        const aspect = String(body.aspect || '16:9') as AspectRatio;
        deck.frontmatter.aspect = aspect;
        await writeDeckFileInternally(serializeDeckMarkdown(deck));
        broadcastSse({
          type: 'aspect_update',
          aspect,
        });
        sendJson(res, 200, { ok: true, aspect });
        return;
      }

      // =======================================================================
      // WORKSPACE 2.0 ENDPOINTS (Multi-Workspace, Preset Skills, 5-Agent Launch)
      // =======================================================================
      if (req.method === 'GET' && url.pathname === '/api/workspace') {
        const [workspace, recentEntries, skillsReport, detectedAgents, detectedTerminals] =
          await Promise.all([
            buildNormalizedWorkspacePayload(workspaceDir, absDeckPath),
            listRecentWorkspaces(registryPath).catch(() => []),
            inspectWorkspaceSkills(workspaceDir).catch(() => null),
            detectInstalledAgents().catch(() => []),
            detectInstalledTerminals().catch(() => []),
          ]);

        sendJson(res, 200, {
          ok: true,
          workspace,
          recentWorkspaces: recentEntries.map((r) => ({
            dir: r.path,
            name: r.name,
            scenario: r.scenario,
            lastOpenedAt: r.lastOpenedAt,
          })),
          skills: skillsReport
            ? {
                presetVersion: skillsReport.presetVersion,
                totalPresetSkills: skillsReport.totalPresetSkills,
                allSynced: skillsReport.allSynced,
                hasSymlinks: !skillsReport.zeroSymlinks,
                skills: skillsReport.skills,
              }
            : null,
          agents: detectedAgents.map((a) => ({
            id: a.id,
            label: a.displayName,
            installed: a.installed,
            launchMode: a.launchMode,
            beginnerHintZh: a.beginnerHintZh,
            discoveryNote: a.beginnerHintZh,
          })),
          terminals: detectedTerminals.map((t) => ({
            id: t.id,
            name: t.name,
            displayName: t.displayName,
            installed: t.installed,
            descriptionZh: t.descriptionZh,
          })),
          recipes: BEGINNER_TASK_RECIPES,
          allRecipes: ALL_TASK_RECIPES,
          copilotRecipes: COPILOT_TASK_RECIPES,
        });
        return;
      }

      if (req.method === 'POST' && url.pathname === '/api/workspace/create') {
        const body = await readJsonBody(req);
        const name = String(body.name || '').trim() || '新建创作工作区';
        const scenarioRaw = String(body.scenario || 'creator-growth');
        const validScenarios: WorkspaceScenarioPreset[] = [
          'creator-growth',
          'executive-ppt',
          'product-launch',
          'educator-course',
        ];
        const scenario: WorkspaceScenarioPreset = validScenarios.includes(
          scenarioRaw as WorkspaceScenarioPreset
        )
          ? (scenarioRaw as WorkspaceScenarioPreset)
          : 'creator-growth';
        const targetDir = body.workspaceDir
          ? path.resolve(String(body.workspaceDir))
          : path.join(path.dirname(workspaceDir), slugify(name) || `aimake-ws-${Date.now()}`);

        const initialized = await initWorkspace(targetDir, {
          name,
          scenario,
          locale: body.locale ? (String(body.locale) as SupportedLocale) : 'zh-CN',
          cliPath: resolveCliPath(),
          registryPath,
          registerRecent: Boolean(registryPath),
        });
        await switchActiveWorkspace(targetDir, initialized.decks[0]?.absolutePath);
        sendJson(res, 200, {
          ok: true,
          workspaceDir: targetDir,
          activeDeckRel: toRelPosix(targetDir, absDeckPath),
          skillCount: initialized.skillsStatus.totalPresetSkills,
        });
        return;
      }

      if (req.method === 'POST' && url.pathname === '/api/workspace/switch') {
        const body = await readJsonBody(req);
        const targetDir = String(body.workspaceDir || '').trim();
        if (!targetDir) {
          throw new HttpError(400, 'workspaceDir is required');
        }
        const resolved = path.resolve(targetDir);
        if (isForbiddenSystemPath(resolved)) {
          throw new HttpError(403, 'Switching to root or system directories is forbidden');
        }
        const hasConfig = fsSync.existsSync(path.join(resolved, '.aimake', 'workspace.json'));
        if (!hasConfig && body.initIfMissing !== false) {
          await initWorkspace(resolved, {
            name: path.basename(resolved),
            cliPath: resolveCliPath(),
            registryPath,
            registerRecent: Boolean(registryPath),
          });
        } else if (registryPath) {
          await registerRecentWorkspace(resolved, path.basename(resolved), registryPath).catch(
            () => {}
          );
        }
        await switchActiveWorkspace(resolved);
        sendJson(res, 200, {
          ok: true,
          workspaceDir: resolved,
          activeDeckRel: toRelPosix(resolved, absDeckPath),
        });
        return;
      }

      if (req.method === 'POST' && url.pathname === '/api/workspace/deck/create') {
        const body = await readJsonBody(req);
        const title = String(body.title || '').trim();
        if (!title) throw new HttpError(400, 'title is required');
        const created = await createWorkspaceDeck(workspaceDir, {
          title,
          template: body.template ? String(body.template) : undefined,
          locale: body.locale ? (String(body.locale) as SupportedLocale) : undefined,
        });
        absDeckPath = created.deckPath;
        setupWatchers();
        await writeRuntimeDiscoveryFile();
        sendJson(res, 200, {
          ok: true,
          title,
          rel: created.relativePath,
          deckPath: created.deckPath,
        });
        return;
      }

      if (req.method === 'POST' && url.pathname === '/api/workspace/deck/select') {
        const body = await readJsonBody(req);
        const rel = String(body.rel || '').trim();
        if (!rel) throw new HttpError(400, 'rel is required');
        const target = await resolveContainedExistingFile(workspaceDir, rel);
        absDeckPath = target;
        setupWatchers();
        await writeRuntimeDiscoveryFile();
        sendJson(res, 200, { ok: true, rel: toRelPosix(workspaceDir, absDeckPath) });
        return;
      }

      if (req.method === 'POST' && url.pathname === '/api/workspace/source/ingest') {
        const body = await readJsonBody(req);
        const content = String(body.content || '').trim();
        if (!content) throw new HttpError(400, 'content is required');
        const title = String(body.title || '').trim() || '工作区素材';
        const sourceUrl = body.sourceUrl ? String(body.sourceUrl).trim() : undefined;
        const result = await ingestWorkspaceSource(workspaceDir, {
          title,
          content,
          sourceUrl,
        });
        broadcastSse({ type: 'workspace-changed', message: `已收入素材：${title}`, ts: Date.now() });
        sendJson(res, 200, { ok: true, ...result });
        return;
      }

      if (req.method === 'POST' && url.pathname === '/api/workspace/agents/configure') {
        const body = await readJsonBody(req);
        const configured = await configureWorkspaceAgents(workspaceDir, {
          cliPath: resolveCliPath(),
          includeClaude: body.includeClaude !== false,
          force: Boolean(body.force),
        });
        sendJson(res, 200, {
          ok: true,
          writtenConfigs: configured.writtenConfigs,
          skillNames: configured.materializedSkills.skillNames,
          preservedCustomFiles: configured.materializedSkills.preservedCustomFiles,
          opencodePluginPath: configured.opencodePluginPath,
        });
        return;
      }

      if (req.method === 'POST' && url.pathname === '/api/workspace/agents/launch') {
        const body = await readJsonBody(req);
        const host = String(body.host || 'opencode') as AgentHostId;
        const validHosts: AgentHostId[] = [
          'opencode',
          'workbuddy',
          'codex',
          'agy',
          'claude',
          'claude-desktop',
          'cursor',
        ];
        if (!validHosts.includes(host)) {
          throw new HttpError(400, `Unsupported agent host: ${host}`);
        }
        const terminalRaw = body.terminal ? String(body.terminal) : undefined;
        const validTerminals: TerminalAppId[] = [
          'ghostty',
          'warp',
          'iterm',
          'cmux',
          'wezterm',
          'kitty',
          'terminal',
        ];
        const terminal =
          terminalRaw && validTerminals.includes(terminalRaw as TerminalAppId)
            ? (terminalRaw as TerminalAppId)
            : undefined;
        const recipeId = body.recipeId ? String(body.recipeId).trim() : undefined;
        const goal = body.goal ? String(body.goal).trim() : undefined;

        // Ensure workspace-local preset skills & configs are materialized before launching!
        await configureWorkspaceAgents(workspaceDir, { cliPath: resolveCliPath() }).catch(() => {});

        const activeDeckRel = toRelPosix(workspaceDir, absDeckPath);
        if (body.dryRun) {
          const info = buildAgentLaunchInfo(workspaceDir, host, {
            activeDeckRel,
            terminal,
            recipeId,
            goal,
          });
          sendJson(res, 200, {
            ok: true,
            launched: false,
            launchMode: info.launchMode,
            terminalUsed: info.terminal,
            copiedPrompt: false,
            label: info.hostName,
            command: info.command,
            readyToRunCommand: info.readyToRunCommand,
            richPromptContext: info.richPromptContext,
            starterPrompt: info.starterPromptZh,
            info,
          });
          return;
        }
        const launched = await launchAgentInWorkspace(workspaceDir, host, {
          activeDeckRel,
          terminal,
          recipeId,
          goal,
        });
        sendJson(res, 200, {
          ok: true,
          launched: launched.launched,
          launchMode: launched.launchMode,
          terminalUsed: launched.terminalUsed,
          copiedPrompt: launched.copiedPrompt,
          label: launched.info.hostName,
          command: launched.info.command,
          readyToRunCommand: launched.info.readyToRunCommand,
          richPromptContext: launched.info.richPromptContext,
          starterPrompt: launched.info.starterPromptZh,
          message: launched.message,
          info: launched.info,
        });
        return;
      }

      // =======================================================================
      // CORE / BACKWARD-COMPATIBLE ROUTES
      // =======================================================================
      if (req.method === 'GET' && url.pathname === '/favicon.ico') {
        res.writeHead(204);
        res.end();
        return;
      }

      if (req.method === 'GET' && url.pathname === '/') {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(buildStudioShellHtml());
        return;
      }

      if (req.method === 'GET' && url.pathname === '/api/state') {
        const rawMarkdown = await fs.readFile(absDeckPath, 'utf8');
        const deck = parseDeckMarkdown(rawMarkdown, absDeckPath);
        const templates = await listTemplates();
        const { manifest } = await compileDeckToHtml(deck, { editable: true });
        const workspace = await buildNormalizedWorkspacePayload(workspaceDir, absDeckPath).catch(
          () => undefined
        );
        sendJson(res, 200, {
          rawMarkdown,
          deck,
          templates,
          activeManifest: manifest,
          workspaceDir,
          vaultDir,
          exportBaseDir: exportBase,
          activeDeckRel: toRelPosix(workspaceDir, absDeckPath),
          workspace,
        });
        return;
      }

      if (req.method === 'GET' && url.pathname === '/api/preview') {
        const rawMarkdown = await fs.readFile(absDeckPath, 'utf8');
        const deck = parseDeckMarkdown(rawMarkdown, absDeckPath);
        const { html } = await compileDeckToHtml(deck, { editable: true });
        const calmStageStyle = `<style>html,body{background:transparent!important;padding:24px 0 36px!important;scroll-behavior:smooth!important;min-height:100%!important;}#aimake-deck-root{display:flex!important;flex-direction:column!important;align-items:center!important;gap:32px!important;}.aimake-slide{box-shadow:0 12px 36px rgba(15,23,42,0.14)!important;border-radius:12px!important;transition:box-shadow 0.2s ease, transform 0.2s ease!important;}.aimake-slide.aimake-active-focus{box-shadow:0 0 0 3px rgba(24,24,27,0.22),0 20px 48px rgba(15,23,42,0.24)!important;}#aimake-deck-root.isolate-active-slide .aimake-slide:not(.aimake-active-focus){display:none!important;}#aimake-deck-root.isolate-active-slide{min-height:100%!important;justify-content:center!important;gap:0!important;padding:0!important;}@media(prefers-color-scheme:dark){.aimake-slide{box-shadow:0 16px 44px rgba(0,0,0,0.5)!important;}.aimake-slide.aimake-active-focus{box-shadow:0 0 0 3px rgba(255,255,255,0.28),0 24px 54px rgba(0,0,0,0.65)!important;}}</style>`;
        const patchedHtml = html.includes('</head>')
          ? html.replace('</head>', `${calmStageStyle}</head>`)
          : `${calmStageStyle}${html}`;
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(patchedHtml);
        return;
      }

      if (req.method === 'GET' && url.pathname === '/api/wechat') {
        const rawMarkdown = await fs.readFile(absDeckPath, 'utf8');
        const deck = parseDeckMarkdown(rawMarkdown, absDeckPath);
        const html = renderWeChatInlineHtml(deck);
        sendJson(res, 200, { html });
        return;
      }

      if (req.method === 'POST' && url.pathname === '/api/edit') {
        const body = await readJsonBody(req);
        const rawMarkdown = await fs.readFile(absDeckPath, 'utf8');
        const deck = parseDeckMarkdown(rawMarkdown, absDeckPath);
        const updated = applyEditablePatch(
          deck,
          Number(body.slideIndex || 0),
          String(body.field || ''),
          String(body.value || '')
        );
        await writeDeckFileInternally(serializeDeckMarkdown(updated));
        sendJson(res, 200, { ok: true });
        return;
      }

      if (req.method === 'POST' && url.pathname === '/api/meta') {
        const body = await readJsonBody(req);
        const rawMarkdown = await fs.readFile(absDeckPath, 'utf8');
        const deck = parseDeckMarkdown(rawMarkdown, absDeckPath);
        if (body.template) deck.frontmatter.template = String(body.template);
        if (body.locale) deck.frontmatter.locale = String(body.locale) as SupportedLocale;
        await writeDeckFileInternally(serializeDeckMarkdown(deck));
        sendJson(res, 200, { ok: true });
        return;
      }

      if (req.method === 'POST' && url.pathname === '/api/markdown') {
        const body = await readJsonBody(req);
        await writeDeckFileInternally(String(body.rawMarkdown || ''));
        sendJson(res, 200, { ok: true });
        return;
      }

      if (req.method === 'GET' && url.pathname === '/api/export/capcut-status') {
        const localPaths = detectLocalDraftDirectories();
        const hasJianying = Boolean(localPaths.jianying && fsSync.existsSync(localPaths.jianying));
        const hasCapcut = Boolean(localPaths.capcut && fsSync.existsSync(localPaths.capcut));
        const installed = hasJianying || hasCapcut;
        const appType = hasJianying ? 'jianying' : hasCapcut ? 'capcut' : 'none';
        const appName = hasJianying ? '剪映专业版' : hasCapcut ? 'CapCut Desktop' : '未检测到剪映/CapCut';
        sendJson(res, 200, {
          ok: true,
          installed,
          appType,
          appName,
          draftRoot: localPaths.preferred || null,
        });
        return;
      }

      if (req.method === 'POST' && url.pathname === '/api/export') {
        const body = await readJsonBody(req);
        const format = String(body.format || 'png') as
          | 'png'
          | 'pdf'
          | 'pptx'
          | 'mp4'
          | 'wechat'
          | 'html'
          | 'capcut';
        const rawMarkdown = await fs.readFile(absDeckPath, 'utf8');
        const deck = parseDeckMarkdown(rawMarkdown, absDeckPath);
        const fps = typeof body.fps === 'number' && Number.isFinite(body.fps) ? body.fps : undefined;
        const secondsPerSlide =
          typeof body.secondsPerSlide === 'number' && Number.isFinite(body.secondsPerSlide)
            ? body.secondsPerSlide
            : undefined;

        if (format === 'capcut') {
          const capcutOutDir = path.join(exportBase, 'capcut-draft');
          const pngOutDir = path.join(exportBase, 'capcut-slides');
          const slideImages = await exportDeckToPngs(deck, pngOutDir);
          const installLocal = Boolean(body.installLocal);
          const result = await buildCapCutDraft(deck, {
            outputDir: capcutOutDir,
            installLocal,
            fps,
            slideImages,
          });
          const localPaths = detectLocalDraftDirectories();
          const appName = localPaths.jianying ? '剪映专业版' : localPaths.capcut ? 'CapCut Desktop' : '剪映 / CapCut';
          const artifacts = [result.contentPath, result.metaPath, result.coverPath];
          if (result.localDraftPath) {
            artifacts.push(result.localDraftPath);
          }
          sendJson(res, 200, {
            ok: true,
            format: 'capcut',
            draftDir: result.draftDir,
            installedLocal: result.installedLocal,
            localDraftPath: result.localDraftPath,
            appName,
            durationMs: result.durationMs,
            artifacts,
          });
          return;
        }

        if (format === 'mp4' && body.narrate === 'offline-fixture') {
          const speechRunDir = path.join(exportBase, 'speech', `run-${Date.now()}`);
          const speechRes = await synthesizeDeckSpeech(deck, speechRunDir, {
            provider: offlineFixtureSpeechProvider(),
          });
          const fallbackMs = Math.round(
            (secondsPerSlide ?? deck.frontmatter.secondsPerSlide ?? 2) * 1000
          );
          const slideDurationsMs = deck.slides.map(
            (slide) => speechRes.slideDurationsMs[slide.id] ?? fallbackMs
          );
          const target = path.join(exportBase, 'deck-narrated.mp4');
          const artifacts = await exportDeckBundle(deck, 'mp4', target, {
            fps,
            secondsPerSlide,
            audioTrackPath: speechRes.audioPath,
            subtitlesSrtPath: speechRes.srtPath,
            slideDurationsMs,
          });
          sendJson(res, 200, {
            ok: true,
            narrated: true,
            artifacts: [...artifacts, speechRes.audioPath, speechRes.srtPath],
            mp4Path: artifacts[0],
            audioPath: speechRes.audioPath,
            srtPath: speechRes.srtPath,
            slideDurationsMs,
            totalDurationMs: speechRes.totalDurationMs,
          });
          return;
        }

        const target =
          format === 'png'
            ? path.join(exportBase, 'png')
            : path.join(exportBase, `deck.${format === 'wechat' ? 'wechat.html' : format}`);
        const artifacts = await exportDeckBundle(deck, format, target, {
          fps,
          secondsPerSlide,
        });
        sendJson(res, 200, { ok: true, artifacts });
        return;
      }

      // =======================================================================
      // KNOWLEDGE WIKI & LWC GOVERNANCE
      // =======================================================================
      if (req.method === 'GET' && url.pathname === '/api/wiki/overview') {
        await initWikiVault(vaultDir);
        const rawMarkdown = await fs.readFile(absDeckPath, 'utf8');
        const deck = parseDeckMarkdown(rawMarkdown, absDeckPath);

        const [compiled, lint, governance, citations] = await Promise.all([
          compileVaultGraph(vaultDir),
          lintWiki(vaultDir),
          getVaultGovernanceStatus(vaultDir),
          verifyDeckCitationsAgainstVault(deck, vaultDir),
        ]);

        sendJson(res, 200, {
          ok: true,
          vaultDir,
          layout: compiled.layout,
          lint,
          governance: {
            layout: governance.layout,
            draftCounts: governance.draftCounts,
            proposalCounts: governance.proposalCounts,
            agentDraftFiles: governance.agentDraftFiles,
            issues: governance.issues,
          },
          graph: {
            stats: compiled.graph.stats,
            nodeCount: compiled.graph.nodes.length,
            edgeCount: compiled.graph.edges.length,
            sourceCount: compiled.sourceNodes.length,
            knowledgeCount: compiled.knowledgeNodes.length,
            nodes: compiled.graph.nodes.slice(0, 50).map((n) => ({
              id: n.id,
              path: n.path,
              title: n.title,
              kind: n.kind,
            })),
          },
          citations,
        });
        return;
      }

      if (req.method === 'POST' && url.pathname === '/api/wiki/quick-clip') {
        const body = await readJsonBody(req);
        const content = String(body.content ?? body.text ?? '').trim();
        if (!content) {
          throw new HttpError(400, 'content is required');
        }
        const firstLine = content
          .split('\n')
          .map((l) => l.replace(/^#+\s*/, '').trim())
          .find(Boolean);
        const title =
          String(body.title ?? '').trim() || (firstLine ? firstLine.slice(0, 60) : 'Quick Clip');
        const source = body.source ? String(body.source).trim() : '';
        const tags = Array.isArray(body.tags)
          ? body.tags.map((t) => String(t).trim()).filter(Boolean)
          : ['quick-clip'];

        await initWikiVault(vaultDir);
        const datePrefix = new Date().toISOString().slice(0, 10);
        const fileName = `${datePrefix}-${slugify(title)}.md`;
        const clipPath = await resolveContainedWriteTarget(path.join(vaultDir, 'raw'), fileName);
        const noteBody = source ? `> Source: ${source}\n\n${content}\n` : `${content}\n`;
        await fs.writeFile(clipPath, noteBody, 'utf8');

        const ingested = await ingestSource(vaultDir, clipPath, { title, tags });
        const indexPath = await rebuildWikiIndex(vaultDir);
        sendJson(res, 200, {
          ok: true,
          ...ingested,
          indexPath,
        });
        return;
      }

      if (req.method === 'POST' && url.pathname === '/api/wiki/visuals') {
        const body = await readJsonBody(req);
        await initWikiVault(vaultDir);
        const focusQuery = body.focusQuery ? String(body.focusQuery).trim() : undefined;
        const visuals = await exportVaultVisuals(vaultDir, {
          outDir: vaultDir,
          focusQuery: focusQuery || undefined,
        });
        sendJson(res, 200, {
          ok: true,
          canvasPath: visuals.canvasPath,
          excalidrawPath: visuals.excalidrawPath,
          mermaidPath: visuals.mermaidPath,
          overviewBasePath: visuals.overviewBasePath,
          canvasLayout: visuals.canvasLayout,
          excalidrawLayout: visuals.excalidrawLayout,
          mermaidPreview: visuals.mermaid.slice(0, 2000),
        });
        return;
      }

      if (req.method === 'POST' && url.pathname === '/api/wiki/humanize') {
        const body = await readJsonBody(req);
        const rawMarkdown = await fs.readFile(absDeckPath, 'utf8');
        const deck = parseDeckMarkdown(rawMarkdown, absDeckPath);
        const locale = (
          body.locale ? String(body.locale) : deck.frontmatter.locale
        ) as SupportedLocale;

        const beforeAudit = auditAiSlop(collectDeckProse(deck), locale);
        const cleanedDeck = humanizeDeckDocument(deck, locale);
        const afterAudit = auditAiSlop(collectDeckProse(cleanedDeck), locale);
        const cleanedMarkdown = serializeDeckMarkdown(cleanedDeck);
        const applied = Boolean(body.apply);

        if (applied) {
          await writeDeckFileInternally(cleanedMarkdown);
        }

        sendJson(res, 200, {
          ok: true,
          applied,
          locale,
          beforeAudit,
          afterAudit,
          cleanedMarkdown,
          deck: cleanedDeck,
        });
        return;
      }

      // =======================================================================
      // TEMPLATE MARKETPLACE & ONE-CLICK REMIX (一键做同款)
      // =======================================================================
      if (req.method === 'GET' && url.pathname === '/api/market') {
        const q = url.searchParams.get('q') || undefined;
        const locale = (url.searchParams.get('locale') || undefined) as SupportedLocale | undefined;
        const category = (url.searchParams.get('category') || undefined) as
          | TemplateCategory
          | undefined;
        const aspect = (url.searchParams.get('aspect') || undefined) as AspectRatio | undefined;
        const packId = url.searchParams.get('packId') || undefined;

        const hasFilters = Boolean(q || locale || category || aspect || packId);
        const [catalogOrSearch, installed] = await Promise.all([
          hasFilters
            ? searchMarketplace({ q, locale, category, aspect, packId })
            : listMarketplaceCatalog().then((cat) => ({
                templates: cat.templates,
                packs: cat.packs,
                totalTemplates: cat.templateCount,
                totalPacks: cat.packCount,
              })),
          listInstalledTemplates(workspaceDir),
        ]);

        sendJson(res, 200, {
          ok: true,
          templates: catalogOrSearch.templates,
          packs: catalogOrSearch.packs,
          totalTemplates: catalogOrSearch.totalTemplates,
          totalPacks: catalogOrSearch.totalPacks,
          installed,
          installedIds: installed.map((item) => item.id),
        });
        return;
      }

      if (req.method === 'POST' && url.pathname === '/api/market/install') {
        const body = await readJsonBody(req);
        const itemId = String(body.itemId ?? body.spec ?? '').trim();
        if (!itemId) {
          throw new HttpError(400, 'itemId is required');
        }
        const result = await installMarketplaceItem(itemId, workspaceDir);
        sendJson(res, 200, { ok: true, ...result });
        return;
      }

      if (req.method === 'POST' && url.pathname === '/api/remix') {
        const body = await readJsonBody(req);
        const sourceTemplateId = body.sourceTemplateId
          ? String(body.sourceTemplateId).trim()
          : undefined;
        let sourceDeckPath: string | undefined;
        if (body.sourceDeckPath) {
          sourceDeckPath = await resolveContainedExistingFile(
            workspaceDir,
            String(body.sourceDeckPath)
          );
        }
        if (!sourceTemplateId && !sourceDeckPath) {
          throw new HttpError(400, 'sourceTemplateId or sourceDeckPath is required');
        }

        const result = await remixDeckWithStyle({
          sourceTemplateId,
          sourceDeckPath,
          targetDeckPath: absDeckPath,
          outDeckPath: absDeckPath,
          locale: body.locale ? (String(body.locale) as SupportedLocale) : undefined,
          humanize: Boolean(body.humanize),
        });
        syncLastWriteHashFromDisk();

        sendJson(res, 200, { ok: true, ...result });
        return;
      }

      // =======================================================================
      // MEDIA REVIEW & HTTP 206 RANGE STREAMING
      // =======================================================================
      if (req.method === 'GET' && url.pathname === '/api/media') {
        const items = await listMediaFilesRecursive(exportBase);
        sendJson(res, 200, {
          ok: true,
          exportBaseDir: exportBase,
          items,
        });
        return;
      }

      if ((req.method === 'GET' || req.method === 'HEAD') && url.pathname === '/api/media/file') {
        const rel = url.searchParams.get('rel') || '';
        const realFilePath = await resolveContainedExistingFile(exportBase, rel);
        const stat = await fs.stat(realFilePath);
        const fileSize = stat.size;
        const mimeType = mimeTypeForFile(realFilePath);
        const rangeHeader = req.headers.range;

        if (rangeHeader) {
          const parsedRange = parseSingleByteRange(rangeHeader, fileSize);
          if (!parsedRange) {
            res.writeHead(416, {
              'Content-Range': `bytes */${fileSize}`,
              'Accept-Ranges': 'bytes',
            });
            res.end();
            return;
          }

          const { start, end } = parsedRange;
          const chunkSize = end - start + 1;
          res.writeHead(206, {
            'Content-Type': mimeType,
            'Accept-Ranges': 'bytes',
            'Content-Range': `bytes ${start}-${end}/${fileSize}`,
            'Content-Length': String(chunkSize),
          });
          if (req.method === 'HEAD') {
            res.end();
            return;
          }
          const stream = fsSync.createReadStream(realFilePath, { start, end });
          stream.on('error', () => {
            if (!res.headersSent) res.writeHead(500);
            res.end();
          });
          stream.pipe(res);
          return;
        }

        res.writeHead(200, {
          'Content-Type': mimeType,
          'Accept-Ranges': 'bytes',
          'Content-Length': String(fileSize),
        });
        if (req.method === 'HEAD') {
          res.end();
          return;
        }
        const stream = fsSync.createReadStream(realFilePath);
        stream.on('error', () => {
          if (!res.headersSent) res.writeHead(500);
          res.end();
        });
        stream.pipe(res);
        return;
      }

      if (req.method === 'POST' && url.pathname === '/api/media/compound') {
        const body = await readJsonBody(req);
        const rawMarkdown = await fs.readFile(absDeckPath, 'utf8');
        const deck = parseDeckMarkdown(rawMarkdown, absDeckPath);
        let artifactPaths: string[];
        if (Array.isArray(body.artifacts) && body.artifacts.length > 0) {
          artifactPaths = body.artifacts.map((a) => String(a));
        } else {
          const items = await listMediaFilesRecursive(exportBase);
          artifactPaths = items.map((it) => it.absPath);
        }
        const outputPath = await compoundOutputToWiki(vaultDir, deck, artifactPaths);
        sendJson(res, 200, {
          ok: true,
          outputPath,
          artifactCount: artifactPaths.length,
        });
        return;
      }

      // =======================================================================
      // AI STATUS & OPTIONAL DIRECT RUNNER (Backward Compatible)
      // =======================================================================
      if (req.method === 'GET' && url.pathname === '/api/ai/status') {
        const status = await detectOpenCodeStatus({
          sandboxHomeDir: path.join(workspaceDir, '.sandbox-hosts'),
        });
        sendJson(res, 200, { ok: true, ...status });
        return;
      }

      if (req.method === 'POST' && url.pathname === '/api/ai/run') {
        const body = await readJsonBody(req);
        const prompt = String(body.prompt ?? '').trim();
        if (!prompt) {
          throw new HttpError(400, 'prompt is required');
        }
        const currentDeckRaw = await fs.readFile(absDeckPath, 'utf8');
        const driverRaw = body.driver ? String(body.driver) : undefined;
        const driver =
          driverRaw === 'deterministic' || driverRaw === 'opencode' ? driverRaw : undefined;
        const model = body.model ? String(body.model).trim() : undefined;
        const locale = body.locale ? (String(body.locale) as SupportedLocale) : undefined;

        let wikiContext: string | undefined;
        if (body.wikiContext !== undefined) {
          wikiContext = String(body.wikiContext);
        } else if (body.includeWikiContext !== false) {
          try {
            const indexFile = await resolveContainedExistingFile(vaultDir, 'wiki/index.md');
            wikiContext = await fs.readFile(indexFile, 'utf8');
          } catch {
            wikiContext = undefined;
          }
        }

        const result = await runOpenCodeTask({
          prompt,
          cwd: workspaceDir,
          driver,
          model,
          locale,
          currentDeckRaw,
          wikiContext,
        });
        sendJson(res, 200, result);
        return;
      }

      sendJson(res, 404, { error: 'Not found' });
    } catch (err) {
      if (err instanceof HttpError) {
        sendJson(res, err.statusCode, { error: err.message });
        return;
      }
      sendJson(res, 500, { error: err instanceof Error ? err.message : String(err) });
    }
  });

  await new Promise<void>((resolve) => {
    server.listen(options.port ?? 0, '127.0.0.1', () => {
      const addr = server.address();
      actualPort = typeof addr === 'object' && addr ? addr.port : options.port ?? 4310;
      resolve();
    });
  });

  setupWatchers();
  await writeRuntimeDiscoveryFile();

  return {
    url: `http://127.0.0.1:${actualPort}`,
    port: actualPort,
    close: async () => {
      closeWatchers();
      for (const client of sseClients) {
        try {
          client.end();
        } catch {
          // ignore
        }
      }
      sseClients.clear();
      await removeRuntimeDiscoveryFile(workspaceDir);
      await new Promise<void>((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve()));
        if (typeof server.closeAllConnections === 'function') {
          server.closeAllConnections();
        }
      });
    },
  };
}
