import type { AspectRatio, DeckDocument, SupportedLocale, TemplateManifest } from '../schema/types.js';
import type { ChatBackendId, ChatIntent } from '../studio/chat-engine.js';

export type JsonRpcId = string | number | null;

export interface JsonRpcRequest {
  jsonrpc: '2.0';
  id?: JsonRpcId;
  method: string;
  params?: Record<string, unknown>;
}

export interface JsonRpcError {
  code: number;
  message: string;
  data?: unknown;
}

export interface JsonRpcResponse<T = unknown> {
  jsonrpc: '2.0';
  id: JsonRpcId;
  result?: T;
  error?: JsonRpcError;
}

export interface JsonRpcNotification<T = unknown> {
  jsonrpc: '2.0';
  method: string;
  params?: T;
}

export const JSON_RPC_ERRORS = {
  PARSE_ERROR: -32700,
  INVALID_REQUEST: -32600,
  METHOD_NOT_FOUND: -32601,
  INVALID_PARAMS: -32602,
  INTERNAL_ERROR: -32603,
} as const;

export interface AcpInitializeParams {
  protocolVersion?: string;
  clientInfo?: {
    name: string;
    version?: string;
  };
  capabilities?: Record<string, unknown>;
}

export interface AcpInitializeResult {
  protocolVersion: string;
  serverInfo: {
    name: string;
    version: string;
    description: string;
  };
  agentInfo: {
    name: string;
    version: string;
    description: string;
  };
  capabilities: {
    session: {
      prompt: boolean;
      update: boolean;
      cancel: boolean;
      permission: boolean;
    };
    streaming: boolean;
    tools: boolean;
    localOnly: boolean;
  };
  templates: TemplateManifest[];
  templatesCount: number;
}

export type AcpSessionStatus = 'ready' | 'running' | 'completed' | 'cancelled' | 'error';

export interface AcpSession {
  sessionId: string;
  cwd: string;
  workspaceDir?: string;
  status: AcpSessionStatus;
  activeDeckPath?: string;
  currentDeck?: DeckDocument;
  createdAt: string;
  updatedAt: string;
  abortController?: AbortController;
  history: Array<{
    role: 'user' | 'agent';
    content: string;
    timestamp: string;
  }>;
}

export interface AcpSessionNewParams {
  sessionId?: string;
  cwd?: string;
  workspaceDir?: string;
  template?: string;
  aspect?: AspectRatio;
  locale?: SupportedLocale;
  initialDeckPath?: string;
}

export interface AcpSessionPromptParams {
  sessionId?: string;
  prompt?: string;
  message?: string;
  text?: string;
  template?: string;
  aspect?: AspectRatio;
  locale?: SupportedLocale;
  deckPath?: string;
  activeSlideIndex?: number;
  intent?: ChatIntent;
  recipe?: string;
  workspaceDir?: string;
  targetDeckPath?: string;
  output?: string;
  backend?: ChatBackendId;
  requestPermission?: boolean;
}

export interface AcpSessionUpdateNotification {
  sessionId: string;
  status: 'analyzing' | 'generating' | 'compiling' | 'completed' | 'cancelled' | 'error';
  progress: number;
  message: string;
  chunk?: string;
  deck?: DeckDocument;
  deckMarkdown?: string;
}

export interface AcpSessionUpdateParams {
  sessionId: string;
  deckPath?: string;
  activeSlideIndex?: number;
  status?: AcpSessionStatus;
  frontmatter?: Record<string, unknown>;
  deck?: DeckDocument;
}

export interface AcpSessionCancelParams {
  sessionId: string;
  reason?: string;
}

export interface AcpPermissionRequestParams {
  sessionId: string;
  permission: string;
  title: string;
  description: string;
}

export interface AcpPermissionResponseResult {
  granted: boolean;
  reason?: string;
}

export interface AcpServerOptions {
  workspace?: string;
  debug?: boolean;
  input?: NodeJS.ReadableStream;
  output?: NodeJS.WritableStream;
  permissionHandler?: (params: AcpPermissionRequestParams) => Promise<boolean>;
}
