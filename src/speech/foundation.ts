import { randomUUID } from 'node:crypto';
import { createHash } from 'node:crypto';
import { constants } from 'node:fs';
import { link, lstat, mkdir, open, realpath, unlink } from 'node:fs/promises';
import { dirname, isAbsolute, relative, resolve, sep } from 'node:path';

export const SCHEMA_VERSION = '0.1.0' as const;

export class AimakeError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AimakeError';
  }
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

type JsonPrimitive = null | boolean | number | string;
type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

function canonicalize(value: unknown, path: string): JsonValue {
  if (value === null || typeof value === 'boolean' || typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      throw new TypeError(`${path}: non-finite number`);
    }
    return value;
  }
  if (Array.isArray(value)) {
    return value.map((entry, index) => canonicalize(entry, `${path}[${index}]`));
  }
  if (typeof value === 'object') {
    const output: Record<string, JsonValue> = {};
    for (const key of Object.keys(value as Record<string, unknown>).sort()) {
      const child = (value as Record<string, unknown>)[key];
      if (child === undefined) continue;
      output[key] = canonicalize(child, `${path}.${key}`);
    }
    return output;
  }
  throw new TypeError(`${path}: unsupported ${typeof value}`);
}

export function canonicalJson(value: unknown): string {
  return JSON.stringify(canonicalize(value, '$'));
}

export function sha256Hex(value: string | Uint8Array): string {
  return createHash('sha256').update(value).digest('hex');
}

const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/;

export function assertSafeId(value: string, field = 'id'): void {
  if (!SAFE_ID.test(value) || value === '.' || value === '..') {
    throw new AimakeError('PATH_INVALID', `${field} must be a safe identifier`);
  }
}

export function sanitizeSafeId(value: string, fallback = 'item'): string {
  const cleaned = value
    .replace(/[^A-Za-z0-9._-]+/g, '-')
    .replace(/^[^A-Za-z0-9]+/, '')
    .slice(0, 128);
  return cleaned && SAFE_ID.test(cleaned) ? cleaned : fallback;
}

export function resolveWithinRoot(rootDirectory: string, ...segments: string[]): string {
  for (const segment of segments) {
    if (isAbsolute(segment)) {
      throw new AimakeError('PATH_ESCAPE', 'Absolute paths are not allowed');
    }
  }
  const root = resolve(rootDirectory);
  const target = resolve(root, ...segments);
  const rel = relative(root, target);
  if (rel === '..' || rel.startsWith(`..${sep}`) || isAbsolute(rel)) {
    throw new AimakeError('PATH_ESCAPE', 'Path resolves outside the root directory');
  }
  return target;
}

export async function assertRealParentWithinRoot(
  rootDirectory: string,
  target: string
): Promise<void> {
  const root = await realpath(rootDirectory);
  const parent = await realpath(dirname(target));
  const rel = relative(root, parent);
  if (rel === '..' || rel.startsWith(`..${sep}`) || isAbsolute(rel)) {
    throw new AimakeError('PATH_ESCAPE', 'Path parent resolves outside the root directory');
  }
}

export async function assertRealPathWithinRoot(
  rootDirectory: string,
  target: string
): Promise<void> {
  const root = await realpath(rootDirectory);
  const actual = await realpath(target);
  const rel = relative(root, actual);
  if (rel === '..' || rel.startsWith(`..${sep}`) || isAbsolute(rel)) {
    throw new AimakeError(
      'PATH_ESCAPE',
      'Path resolves outside the root directory through a symbolic link'
    );
  }
}

export function schemaRecord(
  value: unknown,
  path: string,
  code = 'SCHEMA_INVALID'
): Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new AimakeError(code, `${path} must be an object`);
  }
  return value as Record<string, unknown>;
}

export function assertExactKeys(
  value: Record<string, unknown>,
  allowed: readonly string[],
  path: string,
  code = 'SCHEMA_INVALID'
): void {
  const extras = Object.keys(value).filter((key) => !allowed.includes(key));
  if (extras.length > 0) {
    throw new AimakeError(code, `${path} contains unknown fields: ${extras.join(', ')}`);
  }
}

export async function writeExclusive(
  targetPath: string,
  content: string | Uint8Array,
  mode = 0o600
): Promise<void> {
  const temporary = `${targetPath}.${randomUUID()}.tmp`;
  const handle = await open(
    temporary,
    constants.O_CREAT | constants.O_EXCL | constants.O_WRONLY | constants.O_NOFOLLOW,
    mode
  );
  try {
    await handle.writeFile(content);
    await handle.sync();
  } finally {
    await handle.close();
  }
  try {
    await link(temporary, targetPath);
  } finally {
    await unlink(temporary).catch(() => undefined);
  }
}

export async function ensureRootDirectory(directoryPath: string): Promise<string> {
  const target = resolve(directoryPath);
  await mkdir(target, { recursive: true });
  const stats = await lstat(target);
  if (!stats.isDirectory() || stats.isSymbolicLink()) {
    throw new AimakeError('PROJECT_PATH_UNSAFE', 'Target root path must be a real directory');
  }
  return realpath(target);
}

export async function ensureChildDirectory(
  rootDirectory: string,
  ...segments: string[]
): Promise<string> {
  let current = rootDirectory;
  for (const seg of segments) {
    const next = resolveWithinRoot(current, seg);
    await assertRealParentWithinRoot(rootDirectory, next);
    try {
      await mkdir(next);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error;
    }
    await assertRealPathWithinRoot(rootDirectory, next);
    const stats = await lstat(next);
    if (!stats.isDirectory() || stats.isSymbolicLink()) {
      throw new AimakeError('PROJECT_PATH_UNSAFE', 'Artifact path must be a real directory');
    }
    current = next;
  }
  return current;
}
