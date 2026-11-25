import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import crypto from 'node:crypto';
import type {
  AcpInitializeParams,
  AcpInitializeResult,
  AcpPermissionRequestParams,
  AcpPermissionResponseResult,
  AcpServerOptions,
  AcpSession,
  AcpSessionCancelParams,
  AcpSessionNewParams,
  AcpSessionPromptParams,
  AcpSessionUpdateNotification,
  AcpSessionUpdateParams,
  JsonRpcError,
  JsonRpcId,
  JsonRpcNotification,
  JsonRpcRequest,
  JsonRpcResponse,
} from './types.js';
import { JSON_RPC_ERRORS } from './types.js';
import { listTemplates } from '../renderer/html-compiler.js';
import { parseDeckMarkdown, serializeDeckMarkdown } from '../renderer/deck-parser.js';
import { processChatMessage } from '../studio/chat-engine.js';
import type { AspectRatio, DeckDocument, SupportedLocale } from '../schema/types.js';

export const ACP_PROTOCOL_VERSION = '2024-11-05';
export const ACP_SERVER_INFO = {
  name: 'aimake-studio',
  version: '2.0.0',
  description: 'Aimake Studio Multimodal Agent Client Protocol (ACP) Server',
};

function createRpcError(code: number, message: string, data?: unknown): JsonRpcError {
  return { code, message, ...(data !== undefined ? { data } : {}) };
}

function createErrorResponse(
  id: JsonRpcId,
  code: number,
  message: string,
  data?: unknown
): JsonRpcResponse {
  return {
    jsonrpc: '2.0',
    id: id ?? null,
    error: createRpcError(code, message, data),
  };
}

function createSuccessResponse<T>(id: JsonRpcId, result: T): JsonRpcResponse<T> {
  return {
    jsonrpc: '2.0',
    id: id ?? null,
    result,
  };
}

export class AcpServer {
  private sessions = new Map<string, AcpSession>();
  private options: AcpServerOptions;
  private pendingRequests = new Map<
    string | number,
    {
      resolve: (value: unknown) => void;
      reject: (err: unknown) => void;
      timer: NodeJS.Timeout;
    }
  >();
  private nextRequestId = 1;
  private rl?: readline.Interface;
  private isClosed = false;

  constructor(options: AcpServerOptions = {}) {
    this.options = {
      workspace: options.workspace || process.cwd(),
      debug: options.debug ?? false,
      input: options.input,
      output: options.output,
      permissionHandler: options.permissionHandler,
    };
  }

  public getSession(sessionId: string): AcpSession | undefined {
    return this.sessions.get(sessionId);
  }

  public getAllSessions(): AcpSession[] {
    return Array.from(this.sessions.values());
  }

  public logDebug(msg: string, ...args: unknown[]): void {
    if (this.options.debug) {
      process.stderr.write(`[ACP DEBUG] ${msg} ${args.length ? JSON.stringify(args) : ''}\n`);
    }
  }

  public writeLine(obj: unknown): void {
    const json = JSON.stringify(obj);
    const out = this.options.output || process.stdout;
    out.write(`${json}\n`);
    this.logDebug('--> sent:', json);
  }

  public sendNotification<T>(method: string, params: T): void {
    const notification: JsonRpcNotification<T> = {
      jsonrpc: '2.0',
      method,
      params,
    };
    this.writeLine(notification);
  }

  public async requestPermission(params: AcpPermissionRequestParams): Promise<boolean> {
    if (this.options.permissionHandler) {
      return await this.options.permissionHandler(params);
    }

    if (!this.options.output) {
      return false;
    }

    const reqId = this.nextRequestId++;
    return new Promise<boolean>((resolve) => {
      const timer = setTimeout(() => {
        this.pendingRequests.delete(reqId);
        resolve(false);
      }, 5000);

      this.pendingRequests.set(reqId, {
        resolve: (val) => {
          clearTimeout(timer);
          const res = val as AcpPermissionResponseResult | undefined;
          resolve(Boolean(res?.granted));
        },
        reject: () => {
          clearTimeout(timer);
          resolve(false);
        },
        timer,
      });

      this.writeLine({
        jsonrpc: '2.0',
        id: reqId,
        method: 'session/request_permission',
        params,
      });
    });
  }

  public createSession(params: AcpSessionNewParams = {}): AcpSession {
    const sessionId = params.sessionId || `sess-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    const cwd = params.cwd || this.options.workspace || process.cwd();
    const session: AcpSession = {
      sessionId,
      cwd,
      workspaceDir: params.workspaceDir || cwd,
      status: 'ready',
      activeDeckPath: params.initialDeckPath,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      abortController: new AbortController(),
      history: [],
    };
    this.sessions.set(sessionId, session);
    return session;
  }

  public async handleRequest(raw: unknown): Promise<JsonRpcResponse | null> {
    if (!raw || typeof raw !== 'object') {
      return createErrorResponse(null, JSON_RPC_ERRORS.INVALID_REQUEST, 'Invalid Request: payload must be a JSON object');
    }

    const req = raw as Partial<JsonRpcRequest> & { result?: unknown; error?: unknown };

    // Check if this is a response to an agent request (e.g. session/request_permission)
    if (req.id !== undefined && req.id !== null && (req.result !== undefined || req.error !== undefined)) {
      const pending = this.pendingRequests.get(req.id);
      if (pending) {
        this.pendingRequests.delete(req.id);
        if (req.error) {
          pending.reject(req.error);
        } else {
          pending.resolve(req.result);
        }
        return null;
      }
    }

    // Validate JSON-RPC 2.0 version
    if (req.jsonrpc !== '2.0') {
      return createErrorResponse(
        req.id ?? null,
        JSON_RPC_ERRORS.INVALID_REQUEST,
        'Invalid Request: "jsonrpc" version must be exactly "2.0"'
      );
    }

    // Validate method
    if (typeof req.method !== 'string' || !req.method.trim()) {
      return createErrorResponse(
        req.id ?? null,
        JSON_RPC_ERRORS.INVALID_REQUEST,
        'Invalid Request: "method" must be a non-empty string'
      );
    }

    const isNotification = req.id === undefined;
    const id = req.id ?? null;
    const method = req.method;
    const params = req.params || {};

    try {
      let resp: JsonRpcResponse | null = null;
      switch (method) {
        case 'initialize':
          resp = await this.handleInitialize(id, params as AcpInitializeParams);
          break;

        case 'session/new':
          resp = await this.handleSessionNew(id, params as AcpSessionNewParams);
          break;

        case 'session/prompt':
          resp = await this.handleSessionPrompt(id, params as AcpSessionPromptParams);
          break;

        case 'session/update':
          resp = await this.handleSessionUpdate(id, params as unknown as AcpSessionUpdateParams);
          break;

        case 'session/cancel':
          resp = await this.handleSessionCancel(id, params as unknown as AcpSessionCancelParams);
          break;

        case 'session/list':
          resp = createSuccessResponse(id, {
            sessions: this.getAllSessions().map((s) => ({
              sessionId: s.sessionId,
              status: s.status,
              cwd: s.cwd,
              activeDeckPath: s.activeDeckPath,
              createdAt: s.createdAt,
              updatedAt: s.updatedAt,
            })),
          });
          break;

        case 'session/get': {
          const sId = (params as { sessionId?: string }).sessionId;
          if (!sId) {
            resp = createErrorResponse(id, JSON_RPC_ERRORS.INVALID_PARAMS, 'sessionId is required for session/get');
          } else {
            const session = this.sessions.get(sId);
            if (!session) {
              resp = createErrorResponse(id, JSON_RPC_ERRORS.INVALID_PARAMS, `Session not found: ${sId}`);
            } else {
              resp = createSuccessResponse(id, {
                sessionId: session.sessionId,
                status: session.status,
                cwd: session.cwd,
                workspaceDir: session.workspaceDir,
                activeDeckPath: session.activeDeckPath,
                createdAt: session.createdAt,
                updatedAt: session.updatedAt,
                slideCount: session.currentDeck?.slides.length ?? 0,
              });
            }
          }
          break;
        }

        case 'ping':
          resp = createSuccessResponse(id, { pong: true, timestamp: Date.now() });
          break;

        case 'shutdown':
          this.close();
          resp = createSuccessResponse(id, { ok: true, message: 'ACP Server shutting down' });
          break;

        default:
          resp = createErrorResponse(id, JSON_RPC_ERRORS.METHOD_NOT_FOUND, `Method not found: ${method}`);
          break;
      }

      if (isNotification) {
        return null;
      }
      return resp;
    } catch (err) {
      if (isNotification) {
        this.logDebug('Error executing notification method:', method, err);
        return null;
      }
      this.logDebug('Internal error executing method:', method, err);
      return createErrorResponse(
        id,
        JSON_RPC_ERRORS.INTERNAL_ERROR,
        `Internal error: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  private async handleInitialize(id: JsonRpcId, _params: AcpInitializeParams): Promise<JsonRpcResponse<AcpInitializeResult>> {
    const templates = await listTemplates();
    const result: AcpInitializeResult = {
      protocolVersion: ACP_PROTOCOL_VERSION,
      serverInfo: ACP_SERVER_INFO,
      agentInfo: ACP_SERVER_INFO,
      capabilities: {
        session: {
          prompt: true,
          update: true,
          cancel: true,
          permission: true,
        },
        streaming: true,
        tools: true,
        localOnly: true,
      },
      templates,
      templatesCount: templates.length,
    };

    return createSuccessResponse(id, result);
  }

  private async handleSessionNew(id: JsonRpcId, params: AcpSessionNewParams): Promise<JsonRpcResponse> {
    const session = this.createSession(params);
    return createSuccessResponse(id, {
      sessionId: session.sessionId,
      status: session.status,
      cwd: session.cwd,
      workspaceDir: session.workspaceDir,
      createdAt: session.createdAt,
    });
  }

  private async handleSessionPrompt(id: JsonRpcId, params: AcpSessionPromptParams): Promise<JsonRpcResponse> {
    const promptText = (params.prompt || params.message || params.text || '').trim();
    if (!promptText && !params.recipe) {
      return createErrorResponse(
        id,
        JSON_RPC_ERRORS.INVALID_PARAMS,
        'Invalid params: "prompt", "message", or "recipe" is required'
      );
    }

    let session = params.sessionId ? this.sessions.get(params.sessionId) : undefined;
    if (!session) {
      const derivedWorkspace =
        params.workspaceDir ||
        (params.output ? path.dirname(path.resolve(params.output)) : undefined) ||
        this.options.workspace;
      session = this.createSession({
        sessionId: params.sessionId,
        cwd: derivedWorkspace,
        workspaceDir: derivedWorkspace,
      });
    }

    if (session.status === 'cancelled') {
      return createErrorResponse(
        id,
        JSON_RPC_ERRORS.INTERNAL_ERROR,
        `Session ${session.sessionId} is currently cancelled`
      );
    }

    if (session.status === 'running') {
      return createErrorResponse(
        id,
        JSON_RPC_ERRORS.INVALID_REQUEST,
        `Session ${session.sessionId} is already running a prompt`
      );
    }

    session.status = 'running';
    session.abortController = new AbortController();
    session.updatedAt = new Date().toISOString();
    session.history.push({
      role: 'user',
      content: promptText,
      timestamp: new Date().toISOString(),
    });

    const notifyUpdate = (update: Omit<AcpSessionUpdateNotification, 'sessionId'>) => {
      this.sendNotification('session/update', {
        sessionId: session!.sessionId,
        ...update,
      });
    };

    try {
      // 1. Notify analyzing
      notifyUpdate({
        status: 'analyzing',
        progress: 0.15,
        message: 'Analyzing prompt, design rhythm, and workspace context...',
      });

      // Check cancellation
      if (session.abortController?.signal.aborted || (session.status as string) === 'cancelled') {
        return createErrorResponse(id, JSON_RPC_ERRORS.INTERNAL_ERROR, 'Session prompt cancelled');
      }

      // 2. Resolve working deck with containment verification
      let currentDeck!: DeckDocument;
      const wsRoot = path.resolve(
        session.workspaceDir || this.options.workspace || session.cwd || process.cwd()
      );
      const rawTarget =
        params.targetDeckPath ||
        params.deckPath ||
        session.activeDeckPath ||
        (params.output ? path.resolve(params.output) : undefined);

      let isExistingDeck = false;
      let targetDeckPath: string | undefined;

      if (rawTarget) {
        const resolvedTarget = path.resolve(wsRoot, rawTarget);
        if (resolvedTarget === wsRoot || resolvedTarget.startsWith(wsRoot + path.sep)) {
          targetDeckPath = resolvedTarget;
          if (fsSync.existsSync(resolvedTarget)) {
            try {
              const rawContent = await fs.readFile(resolvedTarget, 'utf8');
              currentDeck = parseDeckMarkdown(rawContent);
              isExistingDeck = true;
            } catch (err) {
              session.status = 'error';
              return createErrorResponse(
                id,
                JSON_RPC_ERRORS.INTERNAL_ERROR,
                `Failed to parse target deck at ${resolvedTarget}: ${err instanceof Error ? err.message : String(err)}`
              );
            }
          }
        } else {
          this.logDebug(`targetDeckPath escapes session.workspaceDir: ${rawTarget}`);
        }
      }

      if (!isExistingDeck) {
        const cleanTitle = promptText
          .replace(/请帮我|生成|写一篇|创作/g, '')
          .trim()
          .slice(0, 30) || '新创作作品';
        const template = params.template || 'xhs-swiss-grid';
        const aspect: AspectRatio = params.aspect || (template.includes('16x9') ? '16:9' : '3:4');
        const locale: SupportedLocale = params.locale || 'zh-CN';

        currentDeck = {
          frontmatter: {
            title: cleanTitle,
            template: template as any,
            aspect,
            locale,
            tags: ['aimake', 'acp-agent'],
            watermark: false,
            fps: 30,
            secondsPerSlide: 4,
          },
          slides: [
            {
              index: 0,
              id: 'slide-1',
              layout: 'bullets',
              eyebrow: 'AIMAKE ACP AGENT',
              title: cleanTitle,
              subtitle: '基于 ACP 协议与 IDE 协同生成',
              bullets: [
                '核心要点 1：本地优先与零外部网络外传',
                '核心要点 2：高保真排版与即时预览',
              ],
              bodyParagraphs: [],
              metrics: [],
            },
          ],
        };
      }

      // 3. Request write permission if requested
      if (params.requestPermission) {
        const granted = await this.requestPermission({
          sessionId: session.sessionId,
          permission: 'fs/write_text_file',
          title: isExistingDeck ? 'Update Storyboard Deck' : 'Create New Storyboard Deck',
          description: `Write changes to deck markdown for "${currentDeck.frontmatter.title || 'Deck'}"`,
        });

        if (!granted) {
          session.status = 'ready';
          return createErrorResponse(
            id,
            JSON_RPC_ERRORS.INTERNAL_ERROR,
            'Operation rejected: User denied permission'
          );
        }
      }

      // 4. Notify generating
      notifyUpdate({
        status: 'generating',
        progress: 0.5,
        message: 'Drafting multi-turn slide layout and applying humanized content...',
        deck: currentDeck,
      });

      if (session.abortController?.signal.aborted || (session.status as string) === 'cancelled') {
        return createErrorResponse(id, JSON_RPC_ERRORS.INTERNAL_ERROR, 'Session prompt cancelled');
      }

      // 5. Process through chat engine
      const activeSlideIndex = params.activeSlideIndex ?? (currentDeck.slides.length > 0 ? 0 : 0);
      const chatRes = await processChatMessage({
        message: promptText,
        intent: params.intent,
        activeSlideIndex,
        deck: currentDeck,
        backend: params.backend || 'offline',
        targetLocale: params.locale || currentDeck.frontmatter.locale,
        workspaceDir: session.workspaceDir || session.cwd,
      });

      if (session.abortController?.signal.aborted || (session.status as string) === 'cancelled') {
        return createErrorResponse(id, JSON_RPC_ERRORS.INTERNAL_ERROR, 'Session prompt cancelled');
      }

      const finalDeck = chatRes.updatedDeck || currentDeck;
      const finalDeckMarkdown = serializeDeckMarkdown(finalDeck);

      // 6. Notify compiling
      notifyUpdate({
        status: 'compiling',
        progress: 0.85,
        message: 'Compiling final markdown and saving storyboard state...',
        deck: finalDeck,
        deckMarkdown: finalDeckMarkdown,
      });

      // 7. Write to target file if destination is known
      let outputPath = targetDeckPath;
      if (!outputPath && (session.workspaceDir || this.options.workspace)) {
        const ws = session.workspaceDir || this.options.workspace!;
        const slug = (finalDeck.frontmatter.title || 'deck')
          .toLowerCase()
          .replace(/[^\w\u4e00-\u9fa5]+/g, '-')
          .replace(/^-+|-+$/g, '')
          .slice(0, 32) || 'deck';
        outputPath = path.join(ws, 'decks', `${slug}.deck.md`);
      }

      if (outputPath) {
        try {
          await fs.mkdir(path.dirname(outputPath), { recursive: true });
          await fs.writeFile(outputPath, finalDeckMarkdown, 'utf8');
        } catch (err) {
          this.logDebug('Warning: failed to persist deck file to disk:', err);
        }
      }

      session.currentDeck = finalDeck;
      if (outputPath) {
        session.activeDeckPath = outputPath;
      }
      session.status = 'completed';
      session.updatedAt = new Date().toISOString();
      session.history.push({
        role: 'agent',
        content: chatRes.message || 'Deck updated successfully.',
        timestamp: new Date().toISOString(),
      });

      // 8. Notify completion
      notifyUpdate({
        status: 'completed',
        progress: 1.0,
        message: chatRes.changeSummary || 'Deck compilation complete.',
        deck: finalDeck,
        deckMarkdown: finalDeckMarkdown,
      });

      return createSuccessResponse(id, {
        sessionId: session.sessionId,
        status: session.status,
        deck: finalDeck,
        deckMarkdown: finalDeckMarkdown,
        outputPath: outputPath ? path.resolve(outputPath) : undefined,
        slideCount: finalDeck.slides.length,
        changeSummary: chatRes.changeSummary || 'Deck updated successfully.',
        engineUsed: chatRes.engineUsed,
        diffLines: chatRes.diffLines,
        suggestedActions: chatRes.suggestedActions,
      });
    } catch (err) {
      session.status = 'error';
      session.updatedAt = new Date().toISOString();
      notifyUpdate({
        status: 'error',
        progress: 1.0,
        message: err instanceof Error ? err.message : String(err),
      });
      throw err;
    }
  }

  private async handleSessionUpdate(id: JsonRpcId, params: AcpSessionUpdateParams): Promise<JsonRpcResponse> {
    if (!params.sessionId) {
      return createErrorResponse(
        id,
        JSON_RPC_ERRORS.INVALID_PARAMS,
        'Invalid params: "sessionId" is required for session/update'
      );
    }

    const session = this.sessions.get(params.sessionId);
    if (!session) {
      return createErrorResponse(
        id,
        JSON_RPC_ERRORS.INVALID_PARAMS,
        `Session not found: ${params.sessionId}`
      );
    }

    if (params.deckPath) {
      session.activeDeckPath = params.deckPath;
      const wsRoot = path.resolve(
        session.workspaceDir || this.options.workspace || session.cwd || process.cwd()
      );
      const resolved = path.resolve(wsRoot, params.deckPath);
      if (resolved === wsRoot || resolved.startsWith(wsRoot + path.sep)) {
        if (fsSync.existsSync(resolved)) {
          try {
            const raw = await fs.readFile(resolved, 'utf8');
            session.currentDeck = parseDeckMarkdown(raw);
          } catch {
            // ignore parse errors
          }
        }
      }
    }

    if (params.deck) {
      session.currentDeck = params.deck;
    }

    if (params.status) {
      session.status = params.status;
    }

    if (params.frontmatter && session.currentDeck) {
      session.currentDeck.frontmatter = {
        ...session.currentDeck.frontmatter,
        ...params.frontmatter,
      };
    }

    session.updatedAt = new Date().toISOString();

    return createSuccessResponse(id, {
      ok: true,
      sessionId: session.sessionId,
      status: session.status,
      activeDeckPath: session.activeDeckPath,
      slideCount: session.currentDeck?.slides.length ?? 0,
    });
  }

  private async handleSessionCancel(id: JsonRpcId, params: AcpSessionCancelParams): Promise<JsonRpcResponse> {
    if (!params.sessionId) {
      return createErrorResponse(
        id,
        JSON_RPC_ERRORS.INVALID_PARAMS,
        'Invalid params: "sessionId" is required for session/cancel'
      );
    }

    const session = this.sessions.get(params.sessionId);
    if (!session) {
      return createErrorResponse(
        id,
        JSON_RPC_ERRORS.INVALID_PARAMS,
        `Session not found: ${params.sessionId}`
      );
    }

    session.status = 'cancelled';
    session.updatedAt = new Date().toISOString();
    session.abortController?.abort();

    this.sendNotification('session/update', {
      sessionId: session.sessionId,
      status: 'cancelled',
      progress: 1.0,
      message: params.reason || 'Session cancelled by client',
    });

    return createSuccessResponse(id, {
      ok: true,
      sessionId: session.sessionId,
      status: 'cancelled',
    });
  }

  public startStdio(): void {
    if (this.rl) return;

    const input = this.options.input || process.stdin;
    this.rl = readline.createInterface({
      input,
      terminal: false,
    });

    this.rl.on('line', async (line) => {
      const trimmed = line.trim();
      if (!trimmed) return;

      this.logDebug('<-- recv:', trimmed);

      let parsed: unknown;
      try {
        parsed = JSON.parse(trimmed);
      } catch (err) {
        this.writeLine(
          createErrorResponse(
            null,
            JSON_RPC_ERRORS.PARSE_ERROR,
            `Parse error: ${err instanceof Error ? err.message : 'Invalid JSON'}`
          )
        );
        return;
      }

      const response = await this.handleRequest(parsed);
      if (response) {
        this.writeLine(response);
      }
    });

    this.rl.on('close', () => {
      this.close();
    });
  }

  public close(): void {
    if (this.isClosed) return;
    this.isClosed = true;

    for (const pending of this.pendingRequests.values()) {
      clearTimeout(pending.timer);
      pending.reject(new Error('ACP Server closed'));
    }
    this.pendingRequests.clear();

    if (this.rl) {
      this.rl.close();
      this.rl = undefined;
    }
  }
}

let defaultAcpServerInstance: AcpServer | null = null;

export async function handleAcpRequest(
  req: JsonRpcRequest | unknown,
  server?: AcpServer
): Promise<JsonRpcResponse | null> {
  const instance = server || (defaultAcpServerInstance ??= new AcpServer());
  return await instance.handleRequest(req);
}

export async function startStdioAcpServer(options?: AcpServerOptions): Promise<AcpServer> {
  const server = new AcpServer(options);
  server.startStdio();
  return server;
}
