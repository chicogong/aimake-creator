import { randomUUID } from 'node:crypto';
import { constants } from 'node:fs';
import { link, open, rename, unlink } from 'node:fs/promises';
import type { FileHandle } from 'node:fs/promises';
import { resolve } from 'node:path';
import type { DeckDocument, SupportedLocale } from '../schema/types.js';
import {
  AimakeError,
  assertExactKeys,
  assertRealParentWithinRoot,
  assertRealPathWithinRoot,
  assertSafeId,
  canonicalJson,
  ensureChildDirectory,
  ensureRootDirectory,
  resolveWithinRoot,
  SCHEMA_VERSION,
  schemaRecord,
  sha256Hex,
} from '../speech/foundation.js';
import { compileDeckSpeechScript } from '../speech/usage-and-approval.js';

// ---------------------------------------------------------------------------
// Run Lease (O_CREAT | O_EXCL, 0o600, RUN_BUSY, stale PID recovery)
// ---------------------------------------------------------------------------

export const LEASE_VERSION = 'aimake.run-lease.v0' as const;
const DEFAULT_STALE_AFTER_MS = 15 * 60 * 1000;

export interface RunLeaseRecord {
  schemaVersion: typeof SCHEMA_VERSION;
  leaseVersion: typeof LEASE_VERSION;
  runId: string;
  ownerId: string;
  pid: number;
  acquiredAt: string;
  heartbeatAt: string;
  staleAfterMs: number;
}

export interface RunLeaseStatus {
  state: 'idle' | 'active' | 'stale';
  lease: RunLeaseRecord | null;
}

export interface RunLease {
  record: RunLeaseRecord;
  heartbeat(): Promise<RunLeaseRecord>;
  release(): Promise<void>;
}

export interface RunLeaseOptions {
  ownerId?: string;
  pid?: number;
  staleAfterMs?: number;
  now?: () => Date;
  isProcessAlive?: (pid: number) => boolean;
}

function parseLease(value: unknown, expectedRunId: string): RunLeaseRecord {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new AimakeError('RUN_LEASE_INVALID', 'Run lease must be an object');
  }
  const lease = value as Record<string, unknown>;
  const valid =
    lease.schemaVersion === SCHEMA_VERSION &&
    lease.leaseVersion === LEASE_VERSION &&
    lease.runId === expectedRunId &&
    typeof lease.ownerId === 'string' &&
    /^[A-Za-z0-9-]{8,128}$/.test(lease.ownerId) &&
    Number.isInteger(lease.pid) &&
    (lease.pid as number) > 0 &&
    typeof lease.acquiredAt === 'string' &&
    !Number.isNaN(Date.parse(lease.acquiredAt)) &&
    typeof lease.heartbeatAt === 'string' &&
    !Number.isNaN(Date.parse(lease.heartbeatAt)) &&
    Number.isInteger(lease.staleAfterMs) &&
    (lease.staleAfterMs as number) >= 1_000;
  if (!valid) {
    throw new AimakeError('RUN_LEASE_INVALID', 'Run lease failed schema validation');
  }
  return lease as unknown as RunLeaseRecord;
}

function leasePath(rootDirectory: string, runId: string): string {
  assertSafeId(runId, 'runId');
  return resolveWithinRoot(rootDirectory, 'runs', runId, 'execution.lock');
}

function isLeaseStale(lease: RunLeaseRecord, now: Date): boolean {
  return now.getTime() - Date.parse(lease.heartbeatAt) > lease.staleAfterMs;
}

async function writeLeaseHandle(handle: FileHandle, value: RunLeaseRecord): Promise<void> {
  const content = Buffer.from(`${JSON.stringify(value, null, 2)}\n`, 'utf8');
  await handle.write(content, 0, content.length, 0);
  await handle.truncate(content.length);
  await handle.sync();
}

async function createLeaseFile(filePath: string, value: RunLeaseRecord): Promise<FileHandle> {
  const handle = await open(
    filePath,
    constants.O_CREAT | constants.O_EXCL | constants.O_WRONLY | constants.O_NOFOLLOW,
    0o600
  );
  try {
    await writeLeaseHandle(handle, value);
    return handle;
  } catch (error) {
    await handle.close();
    await unlink(filePath).catch(() => undefined);
    throw error;
  }
}

async function readLease(root: string, runId: string): Promise<RunLeaseRecord> {
  const filePath = leasePath(root, runId);
  await assertRealParentWithinRoot(root, filePath);
  const handle = await open(filePath, constants.O_RDONLY | constants.O_NOFOLLOW);
  try {
    const stats = await handle.stat();
    if (!stats.isFile()) {
      throw new AimakeError('RUN_LEASE_INVALID', 'Run lease must be a regular file');
    }
    return parseLease(JSON.parse(await handle.readFile('utf8')) as unknown, runId);
  } finally {
    await handle.close();
  }
}

function processAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return (error as NodeJS.ErrnoException).code !== 'ESRCH';
  }
}

async function heartbeatOwnedLease(
  root: string,
  handle: FileHandle,
  record: RunLeaseRecord
): Promise<RunLeaseRecord> {
  const current = await readLease(root, record.runId);
  if (current.ownerId !== record.ownerId) {
    throw new AimakeError('RUN_LEASE_LOST', 'Run lease is now owned by another process');
  }
  await writeLeaseHandle(handle, record);
  return record;
}

export async function getRunLeaseStatus(
  rootDirectory: string,
  runId: string,
  now = new Date()
): Promise<RunLeaseStatus> {
  const root = resolve(rootDirectory);
  try {
    const lease = await readLease(root, runId);
    return { state: isLeaseStale(lease, now) ? 'stale' : 'active', lease };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return { state: 'idle', lease: null };
    }
    throw error;
  }
}

export async function acquireRunLease(
  rootDirectory: string,
  runId: string,
  options: RunLeaseOptions = {}
): Promise<RunLease> {
  assertSafeId(runId, 'runId');
  const root = await ensureRootDirectory(rootDirectory);
  await ensureChildDirectory(root, 'runs', runId);
  const filePath = leasePath(root, runId);
  await assertRealParentWithinRoot(root, filePath);

  const now = options.now ?? (() => new Date());
  const isProcessAlive = options.isProcessAlive ?? processAlive;
  const staleAfterMs = options.staleAfterMs ?? DEFAULT_STALE_AFTER_MS;
  if (!Number.isInteger(staleAfterMs) || staleAfterMs < 1_000) {
    throw new AimakeError(
      'RUN_LEASE_INVALID',
      'staleAfterMs must be an integer of at least 1000 milliseconds'
    );
  }

  const ownerId = options.ownerId ?? randomUUID();
  const acquiredAt = now().toISOString();
  let record: RunLeaseRecord = {
    schemaVersion: SCHEMA_VERSION,
    leaseVersion: LEASE_VERSION,
    runId,
    ownerId,
    pid: options.pid ?? process.pid,
    acquiredAt,
    heartbeatAt: acquiredAt,
    staleAfterMs,
  };
  let handle: FileHandle | undefined;

  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      handle = await createLeaseFile(filePath, record);
      break;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error;
      const existing = await readLease(root, runId);
      const ownerProcessAlive = isProcessAlive(existing.pid);
      if (!isLeaseStale(existing, now()) || ownerProcessAlive) {
        throw new AimakeError('RUN_BUSY', 'Another process is already executing this run', {
          runId,
          heartbeatAt: existing.heartbeatAt,
          staleAfterMs: existing.staleAfterMs,
          ownerProcessAlive,
        });
      }
      const stalePath = `${filePath}.stale-${randomUUID()}`;
      try {
        await rename(filePath, stalePath);
        await unlink(stalePath);
      } catch (recoveryError) {
        if ((recoveryError as NodeJS.ErrnoException).code !== 'ENOENT') throw recoveryError;
      }
      if (attempt === 3) {
        throw new AimakeError('RUN_BUSY', 'Could not recover the stale run lease');
      }
    }
  }

  if (!handle) {
    throw new AimakeError('RUN_BUSY', 'Could not acquire the run lease');
  }

  let released = false;
  const leaseHandle = handle;
  return {
    get record() {
      return record;
    },
    async heartbeat() {
      if (released) {
        throw new AimakeError('RUN_LEASE_LOST', 'Cannot heartbeat a released run lease');
      }
      record = await heartbeatOwnedLease(root, leaseHandle, {
        ...record,
        heartbeatAt: now().toISOString(),
      });
      return record;
    },
    async release() {
      if (released) return;
      try {
        const current = await readLease(root, runId);
        if (current.ownerId !== record.ownerId) {
          throw new AimakeError(
            'RUN_LEASE_LOST',
            'Cannot release a run lease owned by another process'
          );
        }
        await unlink(filePath);
        released = true;
      } finally {
        await leaseHandle.close();
      }
    },
  };
}

export async function withRunLease<T>(
  rootDirectory: string,
  runId: string,
  action: (lease: RunLease) => Promise<T>,
  options: RunLeaseOptions = {}
): Promise<T> {
  const lease = await acquireRunLease(rootDirectory, runId, options);
  try {
    const result = await action(lease);
    await lease.release();
    return result;
  } catch (error) {
    await lease.release().catch(() => undefined);
    throw error;
  }
}

// ---------------------------------------------------------------------------
// Deck Draft Revision (Optimistic CAS, Atomic 0o600 Persist, Impact Analysis)
// ---------------------------------------------------------------------------

export const DECK_REVISION_CONTRACT_VERSION = 'aimake.deck-draft-revision.v0' as const;

export interface DeckDraftSlide {
  slideId: string;
  index: number;
  title: string;
  baseNarration: string;
  narration: string;
  cite?: string;
}

export interface DeckDraftRevisionBody {
  schemaVersion: typeof SCHEMA_VERSION;
  contractVersion: typeof DECK_REVISION_CONTRACT_VERSION;
  revisionId: string;
  baseRunId: string;
  deckTitle: string;
  locale: SupportedLocale;
  inputHash: string;
  baseScriptHash: string;
  version: number;
  createdAt: string;
  updatedAt: string;
  slides: DeckDraftSlide[];
}

export interface DeckDraftRevision extends DeckDraftRevisionBody {
  revisionHash: string;
}

export interface UpdateDeckDraftSlideInput {
  expectedRevisionHash: string;
  slideId: string;
  narration: string;
  title?: string;
}

export interface DeckRevisionImpact {
  changedSlideIds: string[];
  reusedSlideIds: string[];
  invalidatedSteps: Array<'speech' | 'subtitles' | 'slide-render' | 'media-export'>;
  requiresPaidProviderCall: boolean;
  baseCharacters: number;
  billableCharacters: number;
  changedCharacters: number;
  characterDelta: number;
}

const VALID_LOCALES: ReadonlySet<string> = new Set([
  'zh-CN',
  'zh-TW',
  'en',
  'ja',
  'ko',
  'es',
]);

function requireText(value: unknown, fieldPath: string, maximum = 10_000): string {
  if (
    typeof value !== 'string' ||
    value.length === 0 ||
    [...value].length > maximum ||
    value.includes('\0')
  ) {
    throw new AimakeError('REVISION_INTEGRITY_FAILED', `${fieldPath} is invalid`);
  }
  return value;
}

function parseDeckDraftSlide(value: unknown, index: number): DeckDraftSlide {
  const slide = schemaRecord(value, `revision.slides[${index}]`, 'REVISION_INTEGRITY_FAILED');
  assertExactKeys(
    slide,
    ['slideId', 'index', 'title', 'baseNarration', 'narration', 'cite'],
    `revision.slides[${index}]`,
    'REVISION_INTEGRITY_FAILED'
  );
  if (!Number.isInteger(slide.index) || (slide.index as number) < 0) {
    throw new AimakeError('REVISION_INTEGRITY_FAILED', `revision.slides[${index}].index is invalid`);
  }
  if (
    slide.cite !== undefined &&
    (typeof slide.cite !== 'string' || slide.cite.length === 0 || slide.cite.includes('\0'))
  ) {
    throw new AimakeError('REVISION_INTEGRITY_FAILED', `revision.slides[${index}].cite is invalid`);
  }
  return {
    slideId: requireText(slide.slideId, `revision.slides[${index}].slideId`, 256),
    index: slide.index as number,
    title: requireText(slide.title, `revision.slides[${index}].title`, 500),
    baseNarration: requireText(slide.baseNarration, `revision.slides[${index}].baseNarration`, 2_000),
    narration: requireText(slide.narration, `revision.slides[${index}].narration`, 2_000),
    ...(typeof slide.cite === 'string' ? { cite: slide.cite } : {}),
  };
}

export function parseDeckDraftRevision(value: unknown): DeckDraftRevision {
  const revision = schemaRecord(value, 'revision', 'REVISION_INTEGRITY_FAILED');
  assertExactKeys(
    revision,
    [
      'schemaVersion',
      'contractVersion',
      'revisionId',
      'baseRunId',
      'deckTitle',
      'locale',
      'inputHash',
      'baseScriptHash',
      'version',
      'createdAt',
      'updatedAt',
      'slides',
      'revisionHash',
    ],
    'revision',
    'REVISION_INTEGRITY_FAILED'
  );

  const valid =
    revision.schemaVersion === SCHEMA_VERSION &&
    revision.contractVersion === DECK_REVISION_CONTRACT_VERSION &&
    typeof revision.baseRunId === 'string' &&
    typeof revision.revisionId === 'string' &&
    revision.revisionId === `draft:${revision.baseRunId}` &&
    typeof revision.deckTitle === 'string' &&
    revision.deckTitle.length > 0 &&
    typeof revision.locale === 'string' &&
    VALID_LOCALES.has(revision.locale) &&
    typeof revision.inputHash === 'string' &&
    /^[a-f0-9]{64}$/.test(revision.inputHash) &&
    typeof revision.baseScriptHash === 'string' &&
    /^[a-f0-9]{64}$/.test(revision.baseScriptHash) &&
    Number.isInteger(revision.version) &&
    (revision.version as number) >= 1 &&
    typeof revision.createdAt === 'string' &&
    !Number.isNaN(Date.parse(revision.createdAt)) &&
    typeof revision.updatedAt === 'string' &&
    !Number.isNaN(Date.parse(revision.updatedAt)) &&
    Date.parse(revision.updatedAt) >= Date.parse(revision.createdAt) &&
    Array.isArray(revision.slides) &&
    revision.slides.length > 0 &&
    typeof revision.revisionHash === 'string' &&
    /^[a-f0-9]{64}$/.test(revision.revisionHash);

  if (!valid) {
    throw new AimakeError('REVISION_INTEGRITY_FAILED', 'Deck draft revision failed schema validation');
  }

  assertSafeId(revision.baseRunId as string, 'baseRunId');
  const slides = (revision.slides as unknown[]).map(parseDeckDraftSlide);
  if (new Set(slides.map((slide) => slide.slideId)).size !== slides.length) {
    throw new AimakeError('REVISION_INTEGRITY_FAILED', 'Revision slide IDs must be unique');
  }

  const parsed: DeckDraftRevision = {
    schemaVersion: SCHEMA_VERSION,
    contractVersion: DECK_REVISION_CONTRACT_VERSION,
    revisionId: revision.revisionId as string,
    baseRunId: revision.baseRunId as string,
    deckTitle: revision.deckTitle as string,
    locale: revision.locale as SupportedLocale,
    inputHash: revision.inputHash as string,
    baseScriptHash: revision.baseScriptHash as string,
    version: revision.version as number,
    createdAt: revision.createdAt as string,
    updatedAt: revision.updatedAt as string,
    slides,
    revisionHash: revision.revisionHash as string,
  };

  const { revisionHash, ...body } = parsed;
  if (sha256Hex(canonicalJson(body)) !== revisionHash) {
    throw new AimakeError(
      'REVISION_INTEGRITY_FAILED',
      'Deck draft revision hash does not match its canonical content'
    );
  }
  return parsed;
}

function withRevisionHash(body: DeckDraftRevisionBody): DeckDraftRevision {
  return { ...body, revisionHash: sha256Hex(canonicalJson(body)) };
}

export function revisionRunId(revisionHash: string): string {
  if (!/^[a-f0-9]{64}$/.test(revisionHash)) {
    throw new AimakeError('REVISION_HASH_INVALID', 'Revision hash must be a SHA-256 digest');
  }
  return `revision-${revisionHash.slice(0, 20)}`;
}

export function compileDeckDraftRevision(
  baseRunId: string,
  deck: DeckDocument,
  options?: { inputHash?: string; now?: Date }
): DeckDraftRevision {
  assertSafeId(baseRunId, 'baseRunId');
  const script = compileDeckSpeechScript(deck, { inputHash: options?.inputHash });
  const timestamp = (options?.now ?? new Date()).toISOString();

  return withRevisionHash({
    schemaVersion: SCHEMA_VERSION,
    contractVersion: DECK_REVISION_CONTRACT_VERSION,
    revisionId: `draft:${baseRunId}`,
    baseRunId,
    deckTitle: deck.frontmatter.title,
    locale: deck.frontmatter.locale,
    inputHash: script.inputHash,
    baseScriptHash: sha256Hex(canonicalJson(script)),
    version: 1,
    createdAt: timestamp,
    updatedAt: timestamp,
    slides: script.slides.map((scriptSlide, idx) => {
      const sourceSlide = deck.slides[idx]!;
      return {
        slideId: scriptSlide.slideId,
        index: scriptSlide.index,
        title: sourceSlide.title || `Slide ${idx + 1}`,
        baseNarration: scriptSlide.narration,
        narration: scriptSlide.narration,
        ...(scriptSlide.cite ? { cite: scriptSlide.cite } : {}),
      };
    }),
  });
}

function normalizeSlideNarration(value: string): string {
  if (typeof value !== 'string') {
    throw new AimakeError('REVISION_NARRATION_INVALID', 'Narration must be text');
  }
  const narration = value.replaceAll('\r\n', '\n').trim();
  if (narration.length === 0 || [...narration].length > 2_000 || narration.includes('\0')) {
    throw new AimakeError(
      'REVISION_NARRATION_INVALID',
      'Narration must contain 1 to 2000 characters'
    );
  }
  return narration;
}

export function reviseDeckDraftSlide(
  revisionValue: unknown,
  input: UpdateDeckDraftSlideInput,
  now = new Date()
): DeckDraftRevision {
  const revision = parseDeckDraftRevision(revisionValue);
  if (
    !/^[a-f0-9]{64}$/.test(input.expectedRevisionHash) ||
    input.expectedRevisionHash !== revision.revisionHash
  ) {
    throw new AimakeError(
      'REVISION_STALE',
      'Draft changed in another session; reload before saving',
      {
        expectedRevisionHash: input.expectedRevisionHash,
        currentRevisionHash: revision.revisionHash,
      }
    );
  }

  const targetIndex = revision.slides.findIndex((slide) => slide.slideId === input.slideId);
  if (targetIndex < 0) {
    throw new AimakeError(
      'REVISION_SLIDE_NOT_FOUND',
      `Draft slide '${input.slideId}' does not exist`
    );
  }

  const narration = normalizeSlideNarration(input.narration);
  const currentSlide = revision.slides[targetIndex]!;
  const nextTitle =
    input.title !== undefined ? requireText(input.title.trim(), 'input.title', 500) : currentSlide.title;

  if (currentSlide.narration === narration && currentSlide.title === nextTitle) {
    return revision;
  }

  const slides = revision.slides.map((slide, idx) =>
    idx === targetIndex ? { ...slide, title: nextTitle, narration } : { ...slide }
  );

  const { revisionHash: _discarded, ...body } = revision;
  const updatedMs = Math.max(now.getTime(), Date.parse(revision.createdAt));
  return withRevisionHash({
    ...body,
    version: revision.version + 1,
    updatedAt: new Date(updatedMs).toISOString(),
    slides,
  });
}

export function assessDeckRevisionImpact(revisionValue: unknown): DeckRevisionImpact {
  const revision = parseDeckDraftRevision(revisionValue);
  const changedSlideIds: string[] = [];
  const reusedSlideIds: string[] = [];
  let baseCharacters = 0;
  let billableCharacters = 0;
  let changedCharacters = 0;

  for (const slide of revision.slides) {
    const baseLen = [...slide.baseNarration].length;
    const currentLen = [...slide.narration].length;
    baseCharacters += baseLen;
    billableCharacters += currentLen;
    if (slide.narration !== slide.baseNarration) {
      changedSlideIds.push(slide.slideId);
      changedCharacters += currentLen;
    } else {
      reusedSlideIds.push(slide.slideId);
    }
  }

  return {
    changedSlideIds,
    reusedSlideIds,
    invalidatedSteps:
      changedSlideIds.length === 0 ? [] : ['speech', 'subtitles', 'slide-render', 'media-export'],
    requiresPaidProviderCall: changedSlideIds.length > 0,
    baseCharacters,
    billableCharacters,
    changedCharacters,
    characterDelta: billableCharacters - baseCharacters,
  };
}

export function applyDraftRevisionToDeck(
  deck: DeckDocument,
  revisionValue: unknown
): DeckDocument {
  const revision = parseDeckDraftRevision(revisionValue);
  const bySlideId = new Map(revision.slides.map((slide) => [slide.slideId, slide]));

  return {
    ...deck,
    frontmatter: { ...deck.frontmatter, tags: [...deck.frontmatter.tags] },
    slides: deck.slides.map((slide, idx) => {
      const slideId = slide.id && slide.id.trim() ? slide.id.trim() : `slide-${idx + 1}`;
      const revised = bySlideId.get(slideId);
      if (!revised) return { ...slide };
      return {
        ...slide,
        title: revised.title,
        speech: revised.narration,
      };
    }),
  };
}

function deckRevisionFilePath(root: string, baseRunId: string): string {
  assertSafeId(baseRunId, 'baseRunId');
  return resolveWithinRoot(root, 'revisions', baseRunId, 'draft.json');
}

async function writeRevisionExclusive(filePath: string, value: DeckDraftRevision): Promise<void> {
  const temporary = `${filePath}.${randomUUID()}.tmp`;
  const handle = await open(
    temporary,
    constants.O_CREAT | constants.O_EXCL | constants.O_WRONLY | constants.O_NOFOLLOW,
    0o600
  );
  try {
    await handle.writeFile(`${JSON.stringify(value, null, 2)}\n`, 'utf8');
    await handle.sync();
  } finally {
    await handle.close();
  }
  try {
    await link(temporary, filePath);
  } finally {
    await unlink(temporary).catch(() => undefined);
  }
}

async function replaceRevisionAtomic(filePath: string, value: DeckDraftRevision): Promise<void> {
  const temporary = `${filePath}.${randomUUID()}.tmp`;
  const handle = await open(
    temporary,
    constants.O_CREAT | constants.O_EXCL | constants.O_WRONLY | constants.O_NOFOLLOW,
    0o600
  );
  try {
    await handle.writeFile(`${JSON.stringify(value, null, 2)}\n`, 'utf8');
    await handle.sync();
  } finally {
    await handle.close();
  }
  try {
    await rename(temporary, filePath);
  } finally {
    await unlink(temporary).catch(() => undefined);
  }
}

export async function readDeckDraftRevision(
  rootDirectory: string,
  baseRunId: string
): Promise<DeckDraftRevision | null> {
  const root = resolve(rootDirectory);
  const filePath = deckRevisionFilePath(root, baseRunId);
  try {
    await assertRealPathWithinRoot(root, filePath);
    const handle = await open(filePath, constants.O_RDONLY | constants.O_NOFOLLOW);
    try {
      if (!(await handle.stat()).isFile()) {
        throw new AimakeError('REVISION_INTEGRITY_FAILED', 'Revision must be a regular file');
      }
      return parseDeckDraftRevision(JSON.parse(await handle.readFile('utf8')) as unknown);
    } finally {
      await handle.close();
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
    throw error;
  }
}

export async function createDeckDraftRevision(
  rootDirectory: string,
  baseRunId: string,
  deck: DeckDocument,
  options?: { inputHash?: string; now?: Date; leaseOptions?: RunLeaseOptions }
): Promise<DeckDraftRevision> {
  assertSafeId(baseRunId, 'baseRunId');
  const root = await ensureRootDirectory(rootDirectory);
  return withRunLease(
    root,
    baseRunId,
    async () => {
      const script = compileDeckSpeechScript(deck, { inputHash: options?.inputHash });
      const baseScriptHash = sha256Hex(canonicalJson(script));
      const existing = await readDeckDraftRevision(root, baseRunId);
      if (existing) {
        if (existing.inputHash !== script.inputHash || existing.baseScriptHash !== baseScriptHash) {
          throw new AimakeError(
            'REVISION_BASE_INVALID',
            'Existing Draft Revision does not match the current base deck'
          );
        }
        return existing;
      }

      const revision = compileDeckDraftRevision(baseRunId, deck, {
        inputHash: options?.inputHash,
        now: options?.now,
      });
      await ensureChildDirectory(root, 'revisions', baseRunId);
      await writeRevisionExclusive(deckRevisionFilePath(root, baseRunId), revision);
      return revision;
    },
    options?.leaseOptions
  );
}

export async function updateDeckDraftSlide(
  rootDirectory: string,
  baseRunId: string,
  input: UpdateDeckDraftSlideInput,
  options?: { now?: Date; leaseOptions?: RunLeaseOptions }
): Promise<DeckDraftRevision> {
  assertSafeId(baseRunId, 'baseRunId');
  const root = await ensureRootDirectory(rootDirectory);
  return withRunLease(
    root,
    baseRunId,
    async () => {
      const current = await readDeckDraftRevision(root, baseRunId);
      if (!current) {
        throw new AimakeError(
          'REVISION_NOT_FOUND',
          'Create a Draft Revision before editing slides'
        );
      }
      const revised = reviseDeckDraftSlide(current, input, options?.now ?? new Date());
      if (revised.revisionHash === current.revisionHash) {
        return current;
      }
      await replaceRevisionAtomic(deckRevisionFilePath(root, baseRunId), revised);
      return revised;
    },
    options?.leaseOptions
  );
}
