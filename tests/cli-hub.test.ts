import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { EXIT_CODES, isJsonRequested, CliError } from '../src/cli.js';

const execFileAsync = promisify(execFile);
const REPO_ROOT = path.resolve(__dirname, '..');
const CLI_PATH = path.join(REPO_ROOT, 'dist', 'cli.js');

interface CliRunResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

async function runCli(args: string[], options: { cwd?: string; env?: NodeJS.ProcessEnv } = {}): Promise<CliRunResult> {
  try {
    const { stdout, stderr } = await execFileAsync('node', [CLI_PATH, ...args], {
      cwd: options.cwd || REPO_ROOT,
      env: {
        ...process.env,
        VITEST: undefined,
        NODE_ENV: 'production',
        AIMAKE_CLI_DIRECT_RUN: '1',
        ...options.env,
      },
      timeout: 15000,
    });
    return { stdout, stderr, exitCode: 0 };
  } catch (err: any) {
    return {
      stdout: err.stdout || '',
      stderr: err.stderr || '',
      exitCode: typeof err.status === 'number' ? err.status : typeof err.code === 'number' ? err.code : 1,
    };
  }
}

describe('T-07 / Issue #16: CLI-Hub & Agent-Native Standardization (HKUDS/CLI-Anything Spec)', () => {
  let tmpDir: string;
  let sampleDeckPath: string;

  beforeAll(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'aimake-cli-hub-test-'));
    sampleDeckPath = path.join(tmpDir, 'test-sample.deck.md');
    const sampleContent = `---
title: "CLI Hub Test Storyboard"
template: "xhs-swiss-grid"
aspect: "3:4"
locale: "zh-CN"
---

## 瑞士网格核心要点
- 本地优先零中心化
- 确定性 AST 编译排版
`;
    await fs.writeFile(sampleDeckPath, sampleContent, 'utf8');
  });

  afterAll(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  describe('Exit Codes & Error Hierarchy Contracts', () => {
    it('defines standard exit codes corresponding to CLI-Hub conventions', () => {
      expect(EXIT_CODES.SUCCESS).toBe(0);
      expect(EXIT_CODES.GENERAL_ERROR).toBe(1);
      expect(EXIT_CODES.INVALID_ARGUMENTS).toBe(2);
      expect(EXIT_CODES.ENV_OR_AUTH_ERROR).toBe(3);
      expect(EXIT_CODES.NOT_FOUND).toBe(4);
    });

    it('instantiates CliError with appropriate exit code and details', () => {
      const err = new CliError('Resource missing', EXIT_CODES.NOT_FOUND, { path: '/missing.deck.md' });
      expect(err.name).toBe('CliError');
      expect(err.message).toBe('Resource missing');
      expect(err.exitCode).toBe(4);
      expect(err.details).toEqual({ path: '/missing.deck.md' });
    });

    it('detects json request from options or argv', () => {
      expect(isJsonRequested({ json: true })).toBe(true);
      expect(isJsonRequested({ json: false })).toBe(false);
    });
  });

  describe('Subcommand --json Pure Formatting & Zero ANSI Noise', () => {
    it('outputs pure JSON with exit code 0 on --version --json', async () => {
      const res = await runCli(['--version']);
      expect(res.exitCode).toBe(EXIT_CODES.SUCCESS);
      expect(res.stdout.trim()).toMatch(/^2\.\d+\.\d+/);
    });

    it('outputs clean help text with exit code 0 on --help', async () => {
      const res = await runCli(['--help']);
      expect(res.exitCode).toBe(EXIT_CODES.SUCCESS);
      expect(res.stdout).toContain('aimake');
      expect(res.stdout).toContain('--json');
    });

    it('emits pristine JSON on "aimake doctor --json"', async () => {
      const res = await runCli(['doctor', '--json']);
      expect(res.exitCode).toBe(EXIT_CODES.SUCCESS);
      expect(res.stdout).not.toMatch(/\u001b\[/);

      const parsed = JSON.parse(res.stdout);
      expect(parsed.ok).toBe(true);
      expect(parsed.templateCount).toBe(36);
      expect(typeof parsed.nodeVersion).toBe('string');
      expect(Array.isArray(parsed.detectedHosts)).toBe(true);
    });

    it('emits pristine JSON array on "aimake templates --json"', async () => {
      const res = await runCli(['templates', '--json']);
      expect(res.exitCode).toBe(EXIT_CODES.SUCCESS);

      const list = JSON.parse(res.stdout);
      expect(Array.isArray(list)).toBe(true);
      expect(list.length).toBeGreaterThanOrEqual(36);
      expect(list[0]).toHaveProperty('id');
      expect(list[0]).toHaveProperty('aspect');
      expect(list[0]).toHaveProperty('supportedFormats');
    });

    it('emits pristine JSON on "aimake status [dir] --json"', async () => {
      const res = await runCli(['status', '.', '--json']);
      expect(res.exitCode).toBe(EXIT_CODES.SUCCESS);

      const parsed = JSON.parse(res.stdout);
      expect(parsed.ok).toBe(true);
      expect(parsed.pipeline).toBeDefined();
      expect(parsed.skillsStatus.totalPresetSkills).toBe(7);
      expect(parsed.skillsStatus.zeroSymlinks).toBe(true);
    });

    it('emits pristine JSON on "aimake workspace status [dir] --json"', async () => {
      const res = await runCli(['workspace', 'status', '.', '--json']);
      expect(res.exitCode).toBe(EXIT_CODES.SUCCESS);

      const parsed = JSON.parse(res.stdout);
      expect(parsed.ok).toBe(true);
      expect(parsed.workspaceDir).toBeDefined();
    });

    it('emits pristine JSON array on "aimake radar --json"', async () => {
      const res = await runCli(['radar', '--limit', '2', '--json']);
      expect(res.exitCode).toBe(EXIT_CODES.SUCCESS);

      const items = JSON.parse(res.stdout);
      expect(Array.isArray(items)).toBe(true);
      expect(items.length).toBeLessThanOrEqual(2);
      if (items.length > 0) {
        expect(items[0]).toHaveProperty('id');
        expect(items[0]).toHaveProperty('source');
        expect(items[0]).toHaveProperty('title');
      }
    });

    it('emits pristine JSON on "aimake market list --json" and "aimake marketplace list --json"', async () => {
      const res = await runCli(['marketplace', 'list', '--json']);
      expect(res.exitCode).toBe(EXIT_CODES.SUCCESS);

      const parsed = JSON.parse(res.stdout);
      expect(parsed).toHaveProperty('templates');
      expect(parsed).toHaveProperty('packs');
      expect(Array.isArray(parsed.templates)).toBe(true);
      expect(Array.isArray(parsed.packs)).toBe(true);
    });
  });

  describe('Core Storyboard Creation & Rendering Pipeline with --json', () => {
    it('creates a new deck via "aimake new [topic] --json"', async () => {
      const outPath = path.join(tmpDir, 'created-new.deck.md');
      const res = await runCli(['new', 'CLI-Hub Architecture', '-b', 'offline', '-t', 'xhs-swiss-grid', '-o', outPath, '--json']);
      expect(res.exitCode).toBe(EXIT_CODES.SUCCESS);

      const parsed = JSON.parse(res.stdout);
      expect(parsed.ok).toBe(true);
      expect(parsed.outputPath).toBe(outPath);
      expect(parsed.slideCount).toBeGreaterThanOrEqual(1);

      const fileContent = await fs.readFile(outPath, 'utf8');
      expect(fileContent).toContain('xhs-swiss-grid');
    }, 20000);

    it('compiles storyboard to WeChat HTML via "aimake render -f wechat --json"', async () => {
      const outPath = path.join(tmpDir, 'wechat-rendered.html');
      const res = await runCli(['render', sampleDeckPath, '-f', 'wechat', '-o', outPath, '--json']);
      expect(res.exitCode).toBe(EXIT_CODES.SUCCESS);

      const parsed = JSON.parse(res.stdout);
      expect(parsed.ok).toBe(true);
      expect(parsed.format).toBe('wechat');
      expect(parsed.artifacts).toContain(outPath);

      const exists = await fs.stat(outPath).then((st) => st.isFile()).catch(() => false);
      expect(exists).toBe(true);
    });

    it('supports "aimake export" alias identically to "aimake render"', async () => {
      const outPath = path.join(tmpDir, 'export-alias.html');
      const res = await runCli(['export', sampleDeckPath, '-f', 'wechat', '-o', outPath, '--json']);
      expect(res.exitCode).toBe(EXIT_CODES.SUCCESS);

      const parsed = JSON.parse(res.stdout);
      expect(parsed.ok).toBe(true);
      expect(parsed.format).toBe('wechat');
    });

    it('sanitizes deck for sharing via "aimake share --json"', async () => {
      const outPath = path.join(tmpDir, 'sanitized.deck.md');
      const res = await runCli(['share', sampleDeckPath, '-o', outPath, '--json']);
      expect(res.exitCode).toBe(EXIT_CODES.SUCCESS);

      const parsed = JSON.parse(res.stdout);
      expect(parsed.ok).toBe(true);
      expect(parsed.clean).toBe(true);
      expect(parsed.redactedCount).toBe(0);
      expect(parsed.outputPath).toBe(outPath);

      const exists = await fs.stat(outPath).then((st) => st.isFile()).catch(() => false);
      expect(exists).toBe(true);
    });
  });

  describe('Standardized Semantic Exit Codes & Error Envelopes', () => {
    it('returns structured JSON with code 4 (NOT_FOUND) when deck does not exist', async () => {
      const missingDeck = path.join(tmpDir, 'nonexistent-deck.deck.md');
      const res = await runCli(['render', missingDeck, '-f', 'wechat', '--json']);
      expect(res.exitCode).toBe(EXIT_CODES.NOT_FOUND);

      const parsed = JSON.parse(res.stdout);
      expect(parsed.ok).toBe(false);
      expect(parsed.code).toBe(EXIT_CODES.NOT_FOUND);
      expect(parsed.error).toContain('Deck file not found');
    });

    it('returns structured JSON with code 4 (NOT_FOUND) on export alias when file does not exist', async () => {
      const res = await runCli(['export', '/non/existent/deck.md', '-f', 'wechat', '--json']);
      expect(res.exitCode).toBe(EXIT_CODES.NOT_FOUND);

      const parsed = JSON.parse(res.stdout);
      expect(parsed.ok).toBe(false);
      expect(parsed.code).toBe(EXIT_CODES.NOT_FOUND);
      expect(parsed.error).toContain('Deck file not found');
    });

    it('returns structured JSON with code 4 (NOT_FOUND) on share when file does not exist', async () => {
      const missingFile = path.join(tmpDir, 'ghost-file.md');
      const res = await runCli(['share', missingFile, '--json']);
      expect(res.exitCode).toBe(EXIT_CODES.NOT_FOUND);

      const parsed = JSON.parse(res.stdout);
      expect(parsed.ok).toBe(false);
      expect(parsed.code).toBe(EXIT_CODES.NOT_FOUND);
      expect(parsed.error).toContain('Target file not found');
    });

    it('returns structured JSON with code 4 (NOT_FOUND) on status when directory does not exist', async () => {
      const missingDir = path.join(tmpDir, 'nonexistent-workspace-dir');
      const res = await runCli(['status', missingDir, '--json']);
      expect(res.exitCode).toBe(EXIT_CODES.NOT_FOUND);

      const parsed = JSON.parse(res.stdout);
      expect(parsed.ok).toBe(false);
      expect(parsed.code).toBe(EXIT_CODES.NOT_FOUND);
      expect(parsed.error).toContain('Workspace directory not found');
    });

    it('returns structured JSON with code 2 (INVALID_ARGUMENTS) when required format option is missing', async () => {
      const res = await runCli(['render', sampleDeckPath, '--json']);
      expect(res.exitCode).toBe(EXIT_CODES.INVALID_ARGUMENTS);

      const parsed = JSON.parse(res.stdout);
      expect(parsed.ok).toBe(false);
      expect(parsed.code).toBe(EXIT_CODES.INVALID_ARGUMENTS);
      expect(parsed.error).toContain("required option '-f, --format <fmt>' not specified");
    });

    it('returns structured JSON with code 2 (INVALID_ARGUMENTS) when export format is invalid', async () => {
      const res = await runCli(['export', sampleDeckPath, '-f', 'invalid_fmt', '--json']);
      expect(res.exitCode).toBe(EXIT_CODES.INVALID_ARGUMENTS);

      const parsed = JSON.parse(res.stdout);
      expect(parsed.ok).toBe(false);
      expect(parsed.code).toBe(EXIT_CODES.INVALID_ARGUMENTS);
      expect(parsed.error).toContain('Invalid format "invalid_fmt"');
    });

    it('returns structured JSON with code 2 (INVALID_ARGUMENTS) on radar with invalid min-authenticity score', async () => {
      const res = await runCli(['radar', '--min-authenticity', '999', '--json']);
      expect(res.exitCode).toBe(EXIT_CODES.INVALID_ARGUMENTS);

      const parsed = JSON.parse(res.stdout);
      expect(parsed.ok).toBe(false);
      expect(parsed.code).toBe(EXIT_CODES.INVALID_ARGUMENTS);
      expect(parsed.error).toContain('Invalid min-authenticity');
    });

    it('returns structured JSON with code 2 (INVALID_ARGUMENTS) on unknown option with --json', async () => {
      const res = await runCli(['--unknown-flag', '--json']);
      expect(res.exitCode).toBe(EXIT_CODES.INVALID_ARGUMENTS);

      const parsed = JSON.parse(res.stdout);
      expect(parsed.ok).toBe(false);
      expect(parsed.code).toBe(EXIT_CODES.INVALID_ARGUMENTS);
      expect(parsed.error).toContain('unknown option');
    });

    it('returns structured JSON with code 2 (INVALID_ARGUMENTS) when unknown subcommand is passed', async () => {
      const res = await runCli(['unknown-subcommand-xyz', '--json']);
      expect(res.exitCode).toBe(EXIT_CODES.INVALID_ARGUMENTS);

      const parsed = JSON.parse(res.stdout);
      expect(parsed.ok).toBe(false);
      expect(parsed.code).toBe(EXIT_CODES.INVALID_ARGUMENTS);
      expect(parsed.error).toContain("unknown command 'unknown-subcommand-xyz'");
    });

    it('outputs colored error to stderr without JSON when --json is omitted', async () => {
      const missingDeck = path.join(tmpDir, 'no-json-test.deck.md');
      const res = await runCli(['render', missingDeck, '-f', 'wechat']);
      expect(res.exitCode).toBe(EXIT_CODES.NOT_FOUND);
      expect(res.stderr).toContain('Error: Deck file not found');
      expect(res.stdout).toBe('');
    });
  });
});
