/**
 * Aimake Studio v2.1.0 End-to-End Conformance & Contract Test Suite
 * Task: T-08 / Issue #12
 * 
 * Validates cross-cutting architectural contracts across 4 major subsystems:
 * 1. Agent Communication Protocol (ACP) stdio handshake, capabilities, and session lifecycle (#9)
 * 2. Studio SSE (Server-Sent Events) live event stream and focus dispatch contract (#13)
 * 3. CapCut 6-track timeline schema, microsecond precision, and referential integrity (#18)
 * 4. CLI-Hub (HKUDS/CLI-Anything) --json pure formatting envelopes & 5-tier semantic exit codes (#16)
 */

import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import { PassThrough } from 'node:stream';
import readline from 'node:readline';
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

// 1. ACP Subsystem
import {
  AcpServer,
  handleAcpRequest,
  ACP_PROTOCOL_VERSION,
  ACP_SERVER_INFO,
  JSON_RPC_ERRORS,
} from '../src/acp/index.js';

// 2. Studio Subsystem
import { startStudioServer, type StudioServerHandle } from '../src/studio/studio-server.js';

// 3. CapCut Subsystem
import {
  buildCapCutDraft,
  getCanvasDimensions,
  type CapCutDraftContent,
  type CapCutMetaInfo,
} from '../src/renderer/capcut-draft-builder.js';
import type { DeckDocument } from '../src/schema/types.js';

// 4. CLI Subsystem
import { EXIT_CODES } from '../src/cli.js';

const execFileAsync = promisify(execFile);
const REPO_ROOT = path.resolve(__dirname, '..');
const CLI_PATH = path.join(REPO_ROOT, 'dist', 'cli.js');

interface CliResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

async function runCli(
  args: string[],
  options: { cwd?: string; env?: NodeJS.ProcessEnv } = {}
): Promise<CliResult> {
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

function makeMockDeck(aspect: DeckDocument['frontmatter']['aspect'] = '16:9'): DeckDocument {
  return {
    filePath: '/tmp/test.deck.md',
    frontmatter: {
      template: 'apple-dark-keynote',
      title: 'CapCut Conformance Deck',
      aspect,
      locale: 'zh-CN',
      fps: 30,
    },
    slides: [
      {
        id: 's1',
        layout: 'cover',
        title: '产品发布',
        subtitle: '全本地多模态工坊',
        speech: '欢迎体验爱创工坊。',
      },
      {
        id: 's2',
        layout: 'bullets',
        title: '核心架构',
        bullets: ['确定性排版', '六轨时间线', '零网络遥测'],
        speech: '核心技术完全运行在本机。',
      },
    ],
  };
}

// -----------------------------------------------------------------------------
// Suite 1: ACP (Agent Communication Protocol) Stdio & RPC Contract
// -----------------------------------------------------------------------------
describe('T-08 Conformance Suite: ACP Stdio Handshake & Session Lifecycle', () => {
  it('negotiates protocol version and announces full server capabilities', async () => {
    const resp = await handleAcpRequest({
      jsonrpc: '2.0',
      id: 'handshake-init',
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        clientInfo: { name: 'aimake-conformance-tester', version: '2.1.0' },
      },
    });

    expect(resp?.id).toBe('handshake-init');
    expect(resp?.error).toBeUndefined();
    const result = resp?.result as any;
    expect(result.protocolVersion).toBe(ACP_PROTOCOL_VERSION);
    expect(result.serverInfo.name).toBe(ACP_SERVER_INFO.name);
    expect(result.capabilities.session.prompt).toBe(true);
    expect(result.capabilities.session.update).toBe(true);
    expect(result.capabilities.session.cancel).toBe(true);
    expect(result.capabilities.session.permission).toBe(true);
    expect(Array.isArray(result.templates)).toBe(true);
    expect(result.templates.length).toBeGreaterThanOrEqual(36);
  });

  it('orchestrates bidirectional stdio JSON-RPC session flow with streaming updates', async () => {
    const clientIn = new PassThrough();
    const clientOut = new PassThrough();

    const server = new AcpServer({
      input: clientIn,
      output: clientOut,
    });
    server.startStdio();

    const responses: any[] = [];
    const rl = readline.createInterface({ input: clientOut, terminal: false });
    rl.on('line', (line) => {
      try {
        responses.push(JSON.parse(line));
      } catch {
        // ignore
      }
    });

    // 1. Stdio ping
    clientIn.write(JSON.stringify({ jsonrpc: '2.0', id: 10, method: 'ping' }) + '\n');
    await new Promise((r) => setTimeout(r, 60));
    expect(responses.some((r) => r.id === 10 && r.result?.pong === true)).toBe(true);

    // 2. Create session
    clientIn.write(
      JSON.stringify({
        jsonrpc: '2.0',
        id: 11,
        method: 'session/new',
        params: { cwd: '/workspace', template: 'apple-dark-keynote' },
      }) + '\n'
    );
    await new Promise((r) => setTimeout(r, 60));
    const newResp = responses.find((r) => r.id === 11);
    expect(newResp).toBeDefined();
    expect(newResp.result.sessionId).toMatch(/^sess-/);
    const sessionId = newResp.result.sessionId;

    // 3. Prompt session (triggers session/update streaming notifications)
    clientIn.write(
      JSON.stringify({
        jsonrpc: '2.0',
        id: 12,
        method: 'session/prompt',
        params: { sessionId, prompt: 'Generate 2 slides on AI Agents' },
      }) + '\n'
    );
    await new Promise((r) => setTimeout(r, 120));

    // Must receive session/update notification
    const updateNotif = responses.find(
      (r) => r.method === 'session/update' && r.params?.sessionId === sessionId
    );
    expect(updateNotif).toBeDefined();

    // Must receive prompt reply
    const promptResp = responses.find((r) => r.id === 12);
    expect(promptResp).toBeDefined();
    expect(promptResp.result.sessionId).toBe(sessionId);

    // 4. Cancel session
    clientIn.write(
      JSON.stringify({
        jsonrpc: '2.0',
        id: 13,
        method: 'session/cancel',
        params: { sessionId, reason: 'conformance_test_complete' },
      }) + '\n'
    );
    await new Promise((r) => setTimeout(r, 60));
    const cancelResp = responses.find((r) => r.id === 13);
    expect(cancelResp).toBeDefined();
    expect(cancelResp.result.status).toBe('cancelled');

    server.close();
    rl.close();
  });

  it('enforces JSON-RPC 2.0 error contract on invalid payloads and unknown methods', async () => {
    // Malformed JSON handled with Parse Error (-32700)
    const clientIn = new PassThrough();
    const clientOut = new PassThrough();
    const server = new AcpServer({ input: clientIn, output: clientOut });
    server.startStdio();

    const responses: any[] = [];
    const rl = readline.createInterface({ input: clientOut, terminal: false });
    rl.on('line', (line) => {
      try {
        responses.push(JSON.parse(line));
      } catch {}
    });

    clientIn.write('{ malformed json\n');
    await new Promise((r) => setTimeout(r, 50));
    const parseErr = responses.find((r) => r.error?.code === JSON_RPC_ERRORS.PARSE_ERROR);
    expect(parseErr).toBeDefined();
    server.close();
    rl.close();

    // Invalid jsonrpc version -> -32600
    const invVer = await handleAcpRequest({ jsonrpc: '1.0', id: 99, method: 'ping' });
    expect(invVer?.error?.code).toBe(JSON_RPC_ERRORS.INVALID_REQUEST);

    // Missing method -> -32600
    const missMeth = await handleAcpRequest({ jsonrpc: '2.0', id: 100 });
    expect(missMeth?.error?.code).toBe(JSON_RPC_ERRORS.INVALID_REQUEST);

    // Method not found -> -32601
    const unkMeth = await handleAcpRequest({ jsonrpc: '2.0', id: 101, method: 'nonexistent/route' });
    expect(unkMeth?.error?.code).toBe(JSON_RPC_ERRORS.METHOD_NOT_FOUND);

    // Missing required sessionId -> -32602 (INVALID_PARAMS)
    const invParams = await handleAcpRequest({ jsonrpc: '2.0', id: 102, method: 'session/cancel', params: {} });
    expect(invParams?.error?.code).toBe(JSON_RPC_ERRORS.INVALID_PARAMS);
  });
});

// -----------------------------------------------------------------------------
// Suite 2: Studio SSE (Server-Sent Events) Live Stream Contract
// -----------------------------------------------------------------------------
describe('T-08 Conformance Suite: Studio SSE Live Stream & Focus Broadcast', () => {
  let tmpDir: string;
  let sampleDeck: string;
  let studio: StudioServerHandle;

  beforeAll(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'aimake-sse-conformance-'));
    sampleDeck = path.join(tmpDir, 'stage.deck.md');
    await fs.writeFile(
      sampleDeck,
      `---
title: SSE Conformance Deck
template: apple-dark-keynote
aspect: 16:9
locale: zh-CN
---
## Slide 1
Content 1
`,
      'utf8'
    );

    studio = await startStudioServer({
      deckPath: sampleDeck,
      workspaceDir: tmpDir,
      exportBaseDir: path.join(tmpDir, 'exports'),
      registryPath: path.join(tmpDir, 'recent.json'),
    });
  });

  afterAll(async () => {
    if (studio) {
      await studio.close();
    }
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it('serves valid SSE headers and streams live connection and stage-focus events', async () => {
    const sseUrl = `${studio.url}/api/events`;

    const receivedEvents: any[] = [];
    let sseReq: http.ClientRequest;

    const ssePromise = new Promise<void>((resolve, reject) => {
      sseReq = http.get(sseUrl, (res) => {
        // 1. Verify headers
        expect(res.statusCode).toBe(200);
        expect(res.headers['content-type']).toContain('text/event-stream');
        expect(res.headers['cache-control']).toContain('no-cache');

        res.setEncoding('utf8');
        let buffer = '';

        res.on('data', (chunk) => {
          buffer += chunk;
          const lines = buffer.split('\n\n');
          // keep the last incomplete chunk in buffer
          buffer = lines.pop() || '';

          for (const block of lines) {
            const dataLine = block
              .split('\n')
              .find((line) => line.startsWith('data: '));
            if (dataLine) {
              try {
                const parsed = JSON.parse(dataLine.slice(6));
                receivedEvents.push(parsed);
                // When we have received both 'connected' and 'stage-focus', resolve
                if (receivedEvents.some((e) => e.type === 'stage-focus')) {
                  resolve();
                }
              } catch {
                // ignore
              }
            }
          }
        });

        res.on('error', reject);
      });
      sseReq.on('error', reject);
    });

    // Wait 100ms for connection to establish and initial 'connected' event
    await new Promise((r) => setTimeout(r, 150));

    expect(receivedEvents.some((e) => e.type === 'connected')).toBe(true);

    // Trigger stage focus broadcast via POST /api/stage/focus
    const postRes = await fetch(`${studio.url}/api/stage/focus`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        deckRel: 'stage.deck.md',
        slideIndex: 1,
        message: 'AI agent focused on slide 2',
      }),
    });
    expect(postRes.status).toBe(200);

    // Wait for the event to be received by the SSE stream
    await ssePromise;

    const focusEvent = receivedEvents.find((e) => e.type === 'stage-focus');
    expect(focusEvent).toBeDefined();
    expect(focusEvent.slideIndex).toBe(1);
    expect(focusEvent.message).toBe('AI agent focused on slide 2');
    expect(typeof focusEvent.ts).toBe('number');

    // Cleanly abort SSE client
    sseReq!.destroy();
  });
});

// -----------------------------------------------------------------------------
// Suite 3: CapCut 6-Track Timeline Schema & Referential Integrity Contract
// -----------------------------------------------------------------------------
describe('T-08 Conformance Suite: CapCut 6-Track Schema & Referential Integrity', () => {
  it('validates canvas resolutions and aspect ratios for all 5 target formats', () => {
    const dimensions = [
      { aspect: '16:9' as const, w: 1920, h: 1080 },
      { aspect: '9:16' as const, w: 1080, h: 1920 },
      { aspect: '3:4' as const, w: 1080, h: 1440 },
      { aspect: '4:5' as const, w: 1080, h: 1350 },
      { aspect: '1:1' as const, w: 1080, h: 1080 },
    ];

    for (const d of dimensions) {
      const dim = getCanvasDimensions(d.aspect);
      expect(dim.width).toBe(d.w);
      expect(dim.height).toBe(d.h);
      expect(dim.ratio).toBe(d.aspect);
    }
  });

  it('generates fully compliant draft_content.json with exact 6 tracks and microsecond precision', async () => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'aimake-capcut-contract-'));
    const slide1 = path.join(tmpDir, 's1.png');
    const slide2 = path.join(tmpDir, 's2.png');
    await fs.writeFile(slide1, Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    await fs.writeFile(slide2, Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));

    const deck = makeMockDeck('16:9');
    const draftOut = path.join(tmpDir, 'draft_output');

    const result = await buildCapCutDraft(deck, {
      outputDir: draftOut,
      fps: 30,
      slideImages: [slide1, slide2],
      slideDurationsMs: [3000, 4000],
    });

    const contentRaw = await fs.readFile(result.contentPath, 'utf8');
    const content: CapCutDraftContent = JSON.parse(contentRaw);

    // 1. Duration and FPS
    expect(Number.isInteger(content.duration)).toBe(true);
    expect(content.duration).toBeGreaterThan(0);
    expect(content.fps).toBe(30);

    // 2. Exactly 6 tracks in order: video (cards), video (pip), text (titles), text (subtitles), audio (voice), audio (bgm)
    expect(content.tracks).toHaveLength(6);
    expect(content.tracks[0].type).toBe('video');
    expect(content.tracks[1].type).toBe('video');
    expect(content.tracks[2].type).toBe('text');
    expect(content.tracks[3].type).toBe('text');
    expect(content.tracks[4].type).toBe('audio');
    expect(content.tracks[5].type).toBe('audio');

    // 3. Referential integrity
    const videoMatIds = new Set(content.materials.videos.map((v) => v.id));
    const textMatIds = new Set(content.materials.texts.map((t) => t.id));
    const audioMatIds = new Set(content.materials.audios.map((a) => a.id));

    // Video tracks refer to valid videos
    for (const seg of content.tracks[0].segments) {
      expect(videoMatIds.has(seg.material_id)).toBe(true);
      expect(Number.isInteger(seg.target_timerange.start)).toBe(true);
      expect(Number.isInteger(seg.target_timerange.duration)).toBe(true);
      expect(seg.target_timerange.start).toBeGreaterThanOrEqual(0);
      expect(seg.target_timerange.duration).toBeGreaterThan(0);
    }

    // Text tracks refer to valid texts
    for (const seg of [...content.tracks[2].segments, ...content.tracks[3].segments]) {
      expect(textMatIds.has(seg.material_id)).toBe(true);
    }

    // Audio track references
    for (const seg of [...content.tracks[4].segments, ...content.tracks[5].segments]) {
      expect(audioMatIds.has(seg.material_id)).toBe(true);
    }

    // 4. Draft meta info
    const metaRaw = await fs.readFile(result.metaPath, 'utf8');
    const meta: CapCutMetaInfo = JSON.parse(metaRaw);
    expect(meta.draft_name).toBe('CapCut Conformance Deck');
    expect(meta.duration).toBe(content.duration);
    expect(path.isAbsolute(meta.draft_root_path)).toBe(true);
    expect(path.isAbsolute(meta.draft_cover_path)).toBe(true);

    await fs.rm(tmpDir, { recursive: true, force: true });
  });
});

// -----------------------------------------------------------------------------
// Suite 4: CLI-Hub (HKUDS/CLI-Anything) --json Pure Envelopes & Semantic Exit Codes
// -----------------------------------------------------------------------------
describe('T-08 Conformance Suite: CLI-Hub --json Pure Formatting & Semantic Exit Codes', () => {
  let tmpDir: string;
  let sampleDeckPath: string;

  beforeAll(async () => {
    // Ensure dist/cli.js exists before testing compiled CLI binaries
    try {
      await fs.access(CLI_PATH);
    } catch {
      await execFileAsync('pnpm', ['build'], { cwd: REPO_ROOT, timeout: 45000 });
    }

    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'aimake-cli-conformance-'));
    sampleDeckPath = path.join(tmpDir, 'sample.deck.md');
    await fs.writeFile(
      sampleDeckPath,
      `---
title: CLI Conformance Deck
template: apple-dark-keynote
aspect: 16:9
locale: zh-CN
---
## Slide 1
Content 1
`,
      'utf8'
    );
  });

  afterAll(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it('outputs 100% parseable JSON with zero ANSI color escape noise on --json', async () => {
    // 1. aimake templates --json
    const tplRes = await runCli(['templates', '--json']);
    expect(tplRes.exitCode).toBe(EXIT_CODES.SUCCESS);
    expect(tplRes.stdout).not.toMatch(/\u001b\[/);
    const tplJson = JSON.parse(tplRes.stdout.trim());
    expect(Array.isArray(tplJson)).toBe(true);
    expect(tplJson.length).toBeGreaterThanOrEqual(36);

    // 2. aimake doctor --json
    const docRes = await runCli(['doctor', '--json']);
    expect(docRes.exitCode).toBe(EXIT_CODES.SUCCESS);
    expect(docRes.stdout).not.toMatch(/\u001b\[/);
    const docJson = JSON.parse(docRes.stdout.trim());
    expect(docJson.ok).toBe(true);
    expect(docJson.templateCount).toBeGreaterThanOrEqual(36);
  }, 20000);

  it('conforms to 5-tier semantic exit codes and structured error envelope schema', async () => {
    // Exit Code 2: INVALID_ARGUMENTS (invalid export format on existing deck)
    const invRes = await runCli(['render', sampleDeckPath, '-f', 'unsupported_format_xyz', '--json']);
    expect(invRes.exitCode).toBe(EXIT_CODES.INVALID_ARGUMENTS);
    expect(invRes.stdout).not.toMatch(/\u001b\[/);
    const invJson = JSON.parse(invRes.stdout.trim());
    expect(invJson.ok).toBe(false);
    expect(invJson.code).toBe(EXIT_CODES.INVALID_ARGUMENTS);
    expect(typeof invJson.error).toBe('string');

    // Exit Code 2: INVALID_ARGUMENTS on unknown option
    const unkOptRes = await runCli(['--unknown-flag-xyz', '--json']);
    expect(unkOptRes.exitCode).toBe(EXIT_CODES.INVALID_ARGUMENTS);
    const unkJson = JSON.parse(unkOptRes.stdout.trim());
    expect(unkJson.ok).toBe(false);
    expect(unkJson.code).toBe(EXIT_CODES.INVALID_ARGUMENTS);

    // Exit Code 4: NOT_FOUND (non-existent deck)
    const notFoundRes = await runCli(['render', '/tmp/nonexistent-path-987654.deck.md', '-f', 'wechat', '--json']);
    expect(notFoundRes.exitCode).toBe(EXIT_CODES.NOT_FOUND);
    expect(notFoundRes.stdout).not.toMatch(/\u001b\[/);
    const nfJson = JSON.parse(notFoundRes.stdout.trim());
    expect(nfJson.ok).toBe(false);
    expect(nfJson.code).toBe(EXIT_CODES.NOT_FOUND);

    // Non-JSON invocation writes error to stderr with color
    const rawRes = await runCli(['render', '/tmp/nonexistent-path-987654.deck.md', '-f', 'wechat']);
    expect(rawRes.exitCode).toBe(EXIT_CODES.NOT_FOUND);
    expect(rawRes.stderr.length).toBeGreaterThan(0);
  });
});
