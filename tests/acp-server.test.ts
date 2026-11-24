import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { PassThrough } from 'node:stream';
import readline from 'node:readline';
import { describe, expect, it } from 'vitest';
import {
  AcpServer,
  handleAcpRequest,
  startStdioAcpServer,
  ACP_PROTOCOL_VERSION,
  ACP_SERVER_INFO,
} from '../src/acp/index.js';
import { JSON_RPC_ERRORS } from '../src/acp/types.js';

describe('Agent Client Protocol (ACP) Server 2.0 (RFC-2026-001)', () => {
  describe('Protocol Handshake & Capabilities (initialize)', () => {
    it('returns protocol version, server/agent info, capabilities and template catalog', async () => {
      const resp = await handleAcpRequest({
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          clientInfo: { name: 'zed-editor', version: '0.140.0' },
          capabilities: { streaming: true },
        },
      });

      expect(resp).toBeDefined();
      expect(resp?.jsonrpc).toBe('2.0');
      expect(resp?.id).toBe(1);
      expect(resp?.error).toBeUndefined();

      const result = resp?.result as any;
      expect(result.protocolVersion).toBe(ACP_PROTOCOL_VERSION);
      expect(result.serverInfo.name).toBe(ACP_SERVER_INFO.name);
      expect(result.serverInfo.version).toBe(ACP_SERVER_INFO.version);
      expect(result.agentInfo.name).toBe(ACP_SERVER_INFO.name);

      // Verify capabilities
      expect(result.capabilities.session.prompt).toBe(true);
      expect(result.capabilities.session.update).toBe(true);
      expect(result.capabilities.session.cancel).toBe(true);
      expect(result.capabilities.session.permission).toBe(true);
      expect(result.capabilities.streaming).toBe(true);
      expect(result.capabilities.localOnly).toBe(true);

      // Verify template catalog contains all 36 templates
      expect(result.templatesCount).toBeGreaterThanOrEqual(36);
      expect(Array.isArray(result.templates)).toBe(true);
      expect(result.templates.length).toBe(result.templatesCount);

      const templateIds = result.templates.map((t: any) => t.id);
      expect(templateIds).toContain('xhs-swiss-grid');
      expect(templateIds).toContain('ppt-linear-dark');
      expect(templateIds).toContain('apple-bento-launch');
      expect(templateIds).toContain('wechat-deep-report');
    });
  });

  describe('Session Lifecycle & State Transitions', () => {
    it('creates an isolated session with session/new and tracks status', async () => {
      const server = new AcpServer();
      const newResp = await server.handleRequest({
        jsonrpc: '2.0',
        id: 10,
        method: 'session/new',
        params: {
          cwd: '/tmp/test-acp-cwd',
        },
      });

      expect(newResp?.id).toBe(10);
      expect(newResp?.error).toBeUndefined();
      const res = newResp?.result as any;
      expect(res.sessionId).toMatch(/^sess-/);
      expect(res.status).toBe('ready');
      expect(res.cwd).toBe('/tmp/test-acp-cwd');

      // Verify session can be retrieved via session/get
      const getResp = await server.handleRequest({
        jsonrpc: '2.0',
        id: 11,
        method: 'session/get',
        params: { sessionId: res.sessionId },
      });
      expect(getResp?.result).toEqual(
        expect.objectContaining({
          sessionId: res.sessionId,
          status: 'ready',
          cwd: '/tmp/test-acp-cwd',
        })
      );

      // Verify session/list contains this session
      const listResp = await server.handleRequest({
        jsonrpc: '2.0',
        id: 12,
        method: 'session/list',
      });
      const listRes = listResp?.result as any;
      expect(listRes.sessions.some((s: any) => s.sessionId === res.sessionId)).toBe(true);
    });

    it('generates a new deck via session/prompt and streams notifications', async () => {
      const outStream = new PassThrough();
      const server = new AcpServer({ output: outStream });

      const notifications: any[] = [];
      const rl = readline.createInterface({ input: outStream, terminal: false });
      rl.on('line', (line) => {
        try {
          const parsed = JSON.parse(line);
          if (parsed.method === 'session/update') {
            notifications.push(parsed.params);
          }
        } catch {
          // ignore non-json
        }
      });

      const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'aimake-acp-prompt-'));
      const promptResp = await server.handleRequest({
        jsonrpc: '2.0',
        id: 20,
        method: 'session/prompt',
        params: {
          prompt: '打造一个关于端侧大模型协同的极简深色演讲',
          template: 'ppt-linear-dark',
          aspect: '16:9',
          workspaceDir: tmpDir,
          output: path.join(tmpDir, 'decks', 'edge-ai.deck.md'),
        },
      });

      expect(promptResp?.id).toBe(20);
      expect(promptResp?.error).toBeUndefined();
      const res = promptResp?.result as any;
      expect(res.status).toBe('completed');
      expect(res.deck).toBeDefined();
      expect(res.deck.frontmatter.title).toContain('端侧大模型');
      expect(res.deck.frontmatter.aspect).toBe('16:9');
      expect(res.deckMarkdown).toContain('ppt-linear-dark');
      expect(res.outputPath).toBe(path.join(tmpDir, 'decks', 'edge-ai.deck.md'));

      // Verify deck file was written to disk
      const savedContent = await fs.readFile(res.outputPath, 'utf8');
      expect(savedContent).toBe(res.deckMarkdown);

      // Verify progress notifications were emitted
      expect(notifications.length).toBeGreaterThanOrEqual(4);
      const statuses = notifications.map((n) => n.status);
      expect(statuses).toContain('analyzing');
      expect(statuses).toContain('generating');
      expect(statuses).toContain('compiling');
      expect(statuses).toContain('completed');

      // Verify last notification has progress === 1.0
      expect(notifications[notifications.length - 1].progress).toBe(1.0);

      rl.close();
      await fs.rm(tmpDir, { recursive: true, force: true });
    });

    it('updates session parameters via session/update', async () => {
      const server = new AcpServer();
      const newSession = server.createSession();

      const updateResp = await server.handleRequest({
        jsonrpc: '2.0',
        id: 30,
        method: 'session/update',
        params: {
          sessionId: newSession.sessionId,
          status: 'ready',
          deckPath: '/path/to/custom.deck.md',
        },
      });

      expect(updateResp?.id).toBe(30);
      expect(updateResp?.error).toBeUndefined();
      const res = updateResp?.result as any;
      expect(res.ok).toBe(true);
      expect(res.sessionId).toBe(newSession.sessionId);
      expect(res.activeDeckPath).toBe('/path/to/custom.deck.md');

      const updated = server.getSession(newSession.sessionId);
      expect(updated?.activeDeckPath).toBe('/path/to/custom.deck.md');
    });

    it('cancels active session via session/cancel and blocks further actions', async () => {
      const outStream = new PassThrough();
      const server = new AcpServer({ output: outStream });
      const session = server.createSession();

      const notifications: any[] = [];
      const rl = readline.createInterface({ input: outStream, terminal: false });
      rl.on('line', (line) => {
        try {
          const parsed = JSON.parse(line);
          if (parsed.method === 'session/update') {
            notifications.push(parsed.params);
          }
        } catch {}
      });

      const cancelResp = await server.handleRequest({
        jsonrpc: '2.0',
        id: 40,
        method: 'session/cancel',
        params: {
          sessionId: session.sessionId,
          reason: 'User cancelled turn in IDE agent panel',
        },
      });

      expect(cancelResp?.id).toBe(40);
      expect(cancelResp?.error).toBeUndefined();
      const res = cancelResp?.result as any;
      expect(res.ok).toBe(true);
      expect(res.status).toBe('cancelled');

      expect(session.status).toBe('cancelled');
      expect(session.abortController?.signal.aborted).toBe(true);

      // Verify cancellation notification
      expect(notifications.some((n) => n.status === 'cancelled')).toBe(true);

      // Further prompt on cancelled session should fail
      const retryResp = await server.handleRequest({
        jsonrpc: '2.0',
        id: 41,
        method: 'session/prompt',
        params: {
          sessionId: session.sessionId,
          prompt: '尝试继续生成',
        },
      });

      expect(retryResp?.error?.code).toBe(JSON_RPC_ERRORS.INTERNAL_ERROR);
      expect(retryResp?.error?.message).toContain('cancelled');

      rl.close();
    });
  });

  describe('Standard JSON-RPC 2.0 Error Codes (-32700, -32600, -32601, -32602, -32603)', () => {
    it('returns -32600 (Invalid Request) when jsonrpc is missing or not "2.0"', async () => {
      const resp = await handleAcpRequest({
        id: 50,
        method: 'initialize',
      });

      expect(resp?.id).toBe(50);
      expect(resp?.error?.code).toBe(JSON_RPC_ERRORS.INVALID_REQUEST);
      expect(resp?.error?.message).toContain('must be exactly "2.0"');
    });

    it('returns -32600 (Invalid Request) when method is missing or not a string', async () => {
      const respNoMethod = await handleAcpRequest({
        jsonrpc: '2.0',
        id: 51,
      });

      expect(respNoMethod?.id).toBe(51);
      expect(respNoMethod?.error?.code).toBe(JSON_RPC_ERRORS.INVALID_REQUEST);
      expect(respNoMethod?.error?.message).toContain('"method" must be a non-empty string');

      const respNumberMethod = await handleAcpRequest({
        jsonrpc: '2.0',
        id: 52,
        method: 999 as any,
      });

      expect(respNumberMethod?.id).toBe(52);
      expect(respNumberMethod?.error?.code).toBe(JSON_RPC_ERRORS.INVALID_REQUEST);
    });

    it('returns -32600 (Invalid Request) when payload is not an object', async () => {
      const resp = await handleAcpRequest('invalid string request');
      expect(resp?.id).toBeNull();
      expect(resp?.error?.code).toBe(JSON_RPC_ERRORS.INVALID_REQUEST);
    });

    it('returns -32601 (Method not found) when method does not exist', async () => {
      const resp = await handleAcpRequest({
        jsonrpc: '2.0',
        id: 53,
        method: 'non_existent_method_xyz',
      });

      expect(resp?.id).toBe(53);
      expect(resp?.error?.code).toBe(JSON_RPC_ERRORS.METHOD_NOT_FOUND);
      expect(resp?.error?.message).toContain('Method not found: non_existent_method_xyz');
    });

    it('returns -32602 (Invalid params) when required parameters are missing', async () => {
      const cancelResp = await handleAcpRequest({
        jsonrpc: '2.0',
        id: 54,
        method: 'session/cancel',
        params: {},
      });

      expect(cancelResp?.id).toBe(54);
      expect(cancelResp?.error?.code).toBe(JSON_RPC_ERRORS.INVALID_PARAMS);
      expect(cancelResp?.error?.message).toContain('sessionId');

      const promptResp = await handleAcpRequest({
        jsonrpc: '2.0',
        id: 55,
        method: 'session/prompt',
        params: {},
      });

      expect(promptResp?.id).toBe(55);
      expect(promptResp?.error?.code).toBe(JSON_RPC_ERRORS.INVALID_PARAMS);
      expect(promptResp?.error?.message).toContain('prompt');
    });

    it('handles -32603 (Internal error) gracefully on unexpected errors', async () => {
      const server = new AcpServer();
      const resp = await server.handleRequest({
        jsonrpc: '2.0',
        id: 56,
        method: 'session/prompt',
        params: {
          prompt: 'test prompt',
          targetDeckPath: '/invalid/forbidden/root/path/deck.md',
        },
      });

      // When targetDeckPath points to a non-existent file, it falls back to creating a new deck
      // But if an internal exception is triggered:
      const brokenServer = new AcpServer();
      // Force an unexpected internal throw
      (brokenServer as any).handleInitialize = async () => {
        throw new Error('Database disk image is malformed simulated crash');
      };

      const crashResp = await brokenServer.handleRequest({
        jsonrpc: '2.0',
        id: 57,
        method: 'initialize',
      });

      expect(crashResp?.id).toBe(57);
      expect(crashResp?.error?.code).toBe(JSON_RPC_ERRORS.INTERNAL_ERROR);
      expect(crashResp?.error?.message).toContain('Database disk image is malformed simulated crash');
    });
  });

  describe('Interactive IDE Permission Flow (session/request_permission)', () => {
    it('requests write permission and proceeds when granted', async () => {
      let permissionRequested = false;
      const server = new AcpServer({
        permissionHandler: async (params) => {
          permissionRequested = true;
          expect(params.permission).toBe('fs/write_text_file');
          expect(params.title).toContain('Storyboard');
          return true;
        },
      });

      const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'aimake-acp-perm-'));
      const resp = await server.handleRequest({
        jsonrpc: '2.0',
        id: 60,
        method: 'session/prompt',
        params: {
          prompt: '生成测试演示文稿',
          requestPermission: true,
          output: path.join(tmpDir, 'test.deck.md'),
        },
      });

      expect(permissionRequested).toBe(true);
      expect(resp?.error).toBeUndefined();
      expect(resp?.result).toBeDefined();

      await fs.rm(tmpDir, { recursive: true, force: true });
    });

    it('rejects deck writing when permission is denied by user', async () => {
      const server = new AcpServer({
        permissionHandler: async () => false,
      });

      const resp = await server.handleRequest({
        jsonrpc: '2.0',
        id: 61,
        method: 'session/prompt',
        params: {
          prompt: '生成测试演示文稿',
          requestPermission: true,
        },
      });

      expect(resp?.error?.code).toBe(JSON_RPC_ERRORS.INTERNAL_ERROR);
      expect(resp?.error?.message).toContain('User denied permission');
    });
  });

  describe('Stdio Handshake & Stream Regression', () => {
    it('handles line-delimited stream with parse error (-32700) and handshake flow', async () => {
      const inputStream = new PassThrough();
      const outputStream = new PassThrough();

      const server = await startStdioAcpServer({
        input: inputStream,
        output: outputStream,
      });

      const receivedLines: any[] = [];
      const rl = readline.createInterface({ input: outputStream, terminal: false });
      rl.on('line', (line) => {
        try {
          receivedLines.push(JSON.parse(line));
        } catch {
          // ignore
        }
      });

      // 1. Send malformed JSON -> Expect -32700 Parse error
      inputStream.write('{ broken json line ...\n');
      await new Promise((r) => setTimeout(r, 20));

      expect(receivedLines).toHaveLength(1);
      expect(receivedLines[0].error.code).toBe(JSON_RPC_ERRORS.PARSE_ERROR);
      expect(receivedLines[0].id).toBeNull();

      // 2. Send ping -> Expect pong
      inputStream.write(JSON.stringify({ jsonrpc: '2.0', id: 70, method: 'ping' }) + '\n');
      await new Promise((r) => setTimeout(r, 20));

      expect(receivedLines).toHaveLength(2);
      expect(receivedLines[1].id).toBe(70);
      expect(receivedLines[1].result.pong).toBe(true);

      // 3. Send initialize -> Expect full ACP handshake
      inputStream.write(
        JSON.stringify({
          jsonrpc: '2.0',
          id: 71,
          method: 'initialize',
          params: { clientInfo: { name: 'cursor-agent' } },
        }) + '\n'
      );
      await new Promise((r) => setTimeout(r, 50));

      expect(receivedLines).toHaveLength(3);
      expect(receivedLines[2].id).toBe(71);
      expect(receivedLines[2].result.protocolVersion).toBe(ACP_PROTOCOL_VERSION);
      expect(receivedLines[2].result.templatesCount).toBeGreaterThanOrEqual(36);

      rl.close();
      server.close();
    });
  });
});
