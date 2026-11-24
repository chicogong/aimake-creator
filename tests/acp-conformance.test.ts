import { describe, expect, it } from 'vitest';
import { PassThrough } from 'node:stream';
import readline from 'node:readline';
import {
  AcpServer,
  handleAcpRequest,
  ACP_PROTOCOL_VERSION,
} from '../src/acp/index.js';
import { JSON_RPC_ERRORS } from '../src/acp/types.js';

describe('T-08 / Issue #12: ACP Conformance & Stdio RPC Protocol Suite', () => {
  it('executes client handshake and capability negotiation', async () => {
    const resp = await handleAcpRequest({
      jsonrpc: '2.0',
      id: 'handshake-1',
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        clientInfo: { name: 'zed-acp-client', version: '1.0.0' },
      },
    });

    expect(resp?.id).toBe('handshake-1');
    expect(resp?.error).toBeUndefined();
    const res = resp?.result as any;
    expect(res.protocolVersion).toBe(ACP_PROTOCOL_VERSION);
    expect(res.capabilities.session.prompt).toBe(true);
    expect(res.capabilities.session.update).toBe(true);
    expect(res.capabilities.session.cancel).toBe(true);
    expect(res.capabilities.session.permission).toBe(true);
  });

  it('runs interactive stdio stream simulation with mock client runner', async () => {
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

    // 1. Send ping
    clientIn.write(JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'ping' }) + '\n');
    await new Promise((r) => setTimeout(r, 60));

    expect(responses.some((r) => r.id === 1 && r.result?.pong === true)).toBe(true);

    // 2. Send session/new
    clientIn.write(JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'session/new', params: { cwd: '/workspace' } }) + '\n');
    await new Promise((r) => setTimeout(r, 60));

    const newResp = responses.find((r) => r.id === 2);
    expect(newResp).toBeDefined();
    expect(newResp.result.sessionId).toMatch(/^sess-/);

    // 3. Send session/cancel
    clientIn.write(
      JSON.stringify({
        jsonrpc: '2.0',
        id: 3,
        method: 'session/cancel',
        params: { sessionId: newResp.result.sessionId, reason: 'user_cancelled' },
      }) + '\n'
    );
    await new Promise((r) => setTimeout(r, 60));

    const cancelResp = responses.find((r) => r.id === 3);
    expect(cancelResp).toBeDefined();
    expect(cancelResp.result.status).toBe('cancelled');

    server.close();
    rl.close();
  });

  it('enforces JSON-RPC 2.0 error contract on invalid payloads', async () => {
    // Malformed JSON is handled by stdio parser with -32700
    const invalidVersion = await handleAcpRequest({
      jsonrpc: '1.0',
      id: 99,
      method: 'ping',
    });
    expect(invalidVersion?.error?.code).toBe(JSON_RPC_ERRORS.INVALID_REQUEST);

    const missingMethod = await handleAcpRequest({
      jsonrpc: '2.0',
      id: 100,
    });
    expect(missingMethod?.error?.code).toBe(JSON_RPC_ERRORS.INVALID_REQUEST);

    const unknownMethod = await handleAcpRequest({
      jsonrpc: '2.0',
      id: 101,
      method: 'unknown/action',
    });
    expect(unknownMethod?.error?.code).toBe(JSON_RPC_ERRORS.METHOD_NOT_FOUND);
  });
});
