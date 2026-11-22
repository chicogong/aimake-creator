import fs from 'node:fs/promises';
import path from 'node:path';
import readline from 'node:readline';
import { parseDeckMarkdown } from '../renderer/deck-parser.js';
import { compileDeckToHtml, listTemplates } from '../renderer/html-compiler.js';
import { exportDeckBundle } from '../renderer/exporter-media.js';
import { auditAiSlop, humanizeText } from '../wiki/humanizer.js';
import {
  compileVaultGraph,
  compoundOutputToWiki,
  exportVaultVisuals,
  getVaultContextBundle,
  ingestSource,
  lintWiki,
  verifyDeckCitationsAgainstVault,
} from '../wiki/wiki-engine.js';
import {
  installMarketplaceItem,
  listMarketplaceCatalog,
  remixDeckWithStyle,
  searchMarketplace,
} from '../marketplace/index.js';
import { sanitizeContentForPR } from '../sanitizer/pr-sanitizer.js';
import { publishContent } from '../publisher/index.js';
import { normalizeSource } from '../intake/index.js';
import { ingestWorkspaceSource } from '../workspace/index.js';
import type { ExportFormat, SupportedLocale } from '../schema/types.js';

export interface JsonRpcRequest {
  jsonrpc: '2.0';
  id?: string | number | null;
  method: string;
  params?: Record<string, unknown>;
}

const MCP_APP_PREVIEW_URI = 'ui://aimake/preview';
const MCP_APP_MIME_TYPE = 'text/html;profile=mcp-app';

const MCP_TOOLS = [
  {
    name: 'aimake_list_templates',
    description: 'List all 36 built-in multi-language HTML templates (Xiaohongshu, WeChat, LinkedIn PDF, Japan Zukai/Note, Korea Card News/Lookbook, PPTX, Education, 60fps Video).',
    inputSchema: {
      type: 'object',
      properties: {
        category: { type: 'string', description: 'Optional category filter' },
      },
    },
  },
  {
    name: 'aimake_market_search',
    description: 'Search Aimake Template Marketplace by keyword, locale, category, styleFamily, or aspect ratio; also lists versioned industry template packs.',
    inputSchema: {
      type: 'object',
      properties: {
        q: { type: 'string', description: 'Search keyword' },
        locale: { type: 'string', description: 'Optional locale (zh-CN, en, ja, ko)' },
        category: { type: 'string', description: 'Optional category' },
        styleFamily: { type: 'string', description: 'Optional style family' },
        includePacks: { type: 'boolean', default: true },
      },
    },
  },
  {
    name: 'aimake_market_install',
    description: 'Install a versioned template or industry pack (e.g. pack-solopreneur-cn@1.0.0) into a workspace with SHA-256 verification.',
    inputSchema: {
      type: 'object',
      required: ['itemSpec', 'workspaceDir'],
      properties: {
        itemSpec: { type: 'string', description: 'Template ID or pack ID (optional @version)' },
        workspaceDir: { type: 'string', description: 'Target workspace directory' },
      },
    },
  },
  {
    name: 'aimake_remix_deck',
    description: 'One-Click Remix (一键做同款): clone style, aspect ratio, and layout rhythm from a marketplace template or existing finished .deck.md onto a target .deck.md while preserving user content.',
    _meta: {
      ui: {
        resourceUri: MCP_APP_PREVIEW_URI,
      },
    },
    inputSchema: {
      type: 'object',
      required: ['targetDeckPath'],
      properties: {
        sourceTemplateId: { type: 'string', description: 'Marketplace template ID (e.g. xhs-warm-magazine@1.0.0)' },
        sourceDeckPath: { type: 'string', description: 'Path to a finished reference .deck.md to clone style from' },
        targetDeckPath: { type: 'string', description: 'Path to user .deck.md to remix' },
        outDeckPath: { type: 'string', description: 'Optional output .deck.md path' },
        locale: { type: 'string', description: 'Optional locale override' },
        humanize: { type: 'boolean', description: 'Apply 4-locale Anti-AI-Slop Humanizer' },
      },
    },
  },
  {
    name: 'aimake_wiki_ingest',
    description: 'Ingest a URL, Markdown file, or Office document (.docx/.pptx) into the local Karpathy LLM Wiki.',
    inputSchema: {
      type: 'object',
      required: ['vaultDir', 'source'],
      properties: {
        vaultDir: { type: 'string', description: 'Path to local Wiki vault directory' },
        source: { type: 'string', description: 'URL or local file path' },
        title: { type: 'string', description: 'Optional explicit title' },
      },
    },
  },
  {
    name: 'aimake_wiki_lint',
    description: 'Verify local LLM Wiki health, token budget (<= 3,000 tokens), and @lwc/core graph links.',
    inputSchema: {
      type: 'object',
      required: ['vaultDir'],
      properties: {
        vaultDir: { type: 'string' },
      },
    },
  },
  {
    name: 'aimake_wiki_context',
    description: 'Retrieve a topology-bounded (0-2 hop) Markdown context bundle with SHA-256 provenance from the local Wiki via @lwc/core.',
    inputSchema: {
      type: 'object',
      required: ['vaultDir', 'focus'],
      properties: {
        vaultDir: { type: 'string' },
        focus: { type: 'string', description: 'Node ID, relative path, basename, or title' },
        depth: { type: 'number', default: 1 },
        maxWords: { type: 'number', default: 2000 },
      },
    },
  },
  {
    name: 'aimake_wiki_report',
    description: 'Return @lwc/core graph topology stats and OKF trust diagnostics for a local Wiki vault.',
    inputSchema: {
      type: 'object',
      required: ['vaultDir'],
      properties: {
        vaultDir: { type: 'string' },
      },
    },
  },
  {
    name: 'aimake_wiki_visuals',
    description: 'Generate position-preserving Obsidian .canvas, .excalidraw, Mermaid diagram, and Overview.base from a Wiki vault.',
    inputSchema: {
      type: 'object',
      required: ['vaultDir'],
      properties: {
        vaultDir: { type: 'string' },
        focus: { type: 'string' },
      },
    },
  },
  {
    name: 'aimake_humanize',
    description: 'Audit and strip AI writing slop across zh-CN, en, ja, ko.',
    inputSchema: {
      type: 'object',
      required: ['text'],
      properties: {
        text: { type: 'string' },
        locale: { type: 'string', default: 'zh-CN' },
      },
    },
  },
  {
    name: 'aimake_render_deck',
    description: 'Compile a .deck.md file into PNG cards, WeChat inline HTML, PDF, native editable PPTX, or 60fps MP4.',
    _meta: {
      ui: {
        resourceUri: MCP_APP_PREVIEW_URI,
      },
    },
    inputSchema: {
      type: 'object',
      required: ['deckPath', 'format', 'output'],
      properties: {
        deckPath: { type: 'string', description: 'Path to .deck.md file' },
        format: { type: 'string', enum: ['png', 'wechat', 'pdf', 'pptx', 'mp4', 'html'] },
        output: { type: 'string', description: 'Output directory (for png) or file path' },
        template: { type: 'string', description: 'Optional template ID override' },
        vaultDir: { type: 'string', description: 'Optional Wiki vault dir for automatic compound write-back & citation check' },
      },
    },
  },
  {
    name: 'aimake_sanitize_pr',
    description: 'Scrub secrets, internal domains, emails, and local paths before sharing a template bundle.',
    inputSchema: {
      type: 'object',
      required: ['content'],
      properties: {
        content: { type: 'string' },
      },
    },
  },
  {
    name: 'aimake_workspace_status',
    description: 'Inspect an Aimake 2.0 workspace directory (sources/, wiki/, briefs/, decks/, exports/, .agents/skills/) and return structured end-to-end pipeline status, active decks, and preset skills count.',
    inputSchema: {
      type: 'object',
      required: ['workspaceDir'],
      properties: {
        workspaceDir: { type: 'string', description: 'Path to local Aimake workspace directory' },
      },
    },
  },
  {
    name: 'aimake_stage_focus',
    description: 'Notify a running Aimake Studio desktop instance for a workspace (via .aimake/studio-runtime.json on loopback 127.0.0.1) to focus a deck/slide and show a subtle breath toast.',
    inputSchema: {
      type: 'object',
      required: ['workspaceDir'],
      properties: {
        workspaceDir: { type: 'string', description: 'Path to local Aimake workspace directory' },
        deckRel: { type: 'string', description: 'Optional relative path to deck inside workspace (e.g. decks/launch.deck.md)' },
        slideIndex: { type: 'number', description: 'Optional 0-based slide index to focus' },
        message: { type: 'string', description: 'Optional toast message shown in Aimake Studio (defaults to "AI 已更新第 X 页")' },
      },
    },
  },
  {
    name: 'aimake_publish_content',
    description: 'Package and cross-post Markdown articles or .deck.md storyboards to WeChat, Zhihu, Juejin, Xiaohongshu, or Wechatsync distribution packs.',
    inputSchema: {
      type: 'object',
      required: ['sourceFile'],
      properties: {
        sourceFile: { type: 'string', description: 'Path to Markdown file (.md) or .deck.md storyboard' },
        targets: {
          type: 'array',
          items: { type: 'string', enum: ['wechat', 'zhihu', 'juejin', 'xiaohongshu', 'pack', 'all'] },
          description: 'Target publishing channels',
        },
        draft: { type: 'boolean', default: true, description: 'Keep as draft in platform draft box' },
        browser: { type: 'boolean', default: false, description: 'Attempt automated browser injection via local Chrome port 9222' },
        tags: { type: 'array', items: { type: 'string' }, description: 'Tags for Juejin/Xiaohongshu' },
        topics: { type: 'array', items: { type: 'string' }, description: 'Topics for Zhihu' },
        category: { type: 'string', description: 'Category for Juejin' },
        outDir: { type: 'string', description: 'Custom output directory' },
      },
    },
  },
  {
    name: 'aimake_pipeline_inspect',
    description: 'Inspect the 4-stage creative flywheel pipeline (① 抓取 Intake -> ② 萃取 Distill -> ③ 创作 Create -> ④ 发布 Publish) for an Aimake workspace, returning stage metrics, completion status, and recommended next action.',
    inputSchema: {
      type: 'object',
      required: ['workspaceDir'],
      properties: {
        workspaceDir: { type: 'string', description: 'Path to local Aimake workspace directory' },
      },
    },
  },
  {
    name: 'aimake_intake_source',
    description: 'Ingest raw research materials into an Aimake workspace: supports X (Twitter) status URLs (with metrics & quotes), WeChat/Zhihu articles, web URLs, CSV spreadsheets (auto-extracting Bento metrics), and audio/video transcripts.',
    inputSchema: {
      type: 'object',
      required: ['source'],
      properties: {
        source: { type: 'string', description: 'Web URL, X/Twitter URL, local CSV/TSV table, VTT/SRT transcript, or file path' },
        workspaceDir: { type: 'string', default: '.', description: 'Path to workspace directory' },
        title: { type: 'string', description: 'Optional explicit title' },
        tags: { type: 'array', items: { type: 'string' }, description: 'Tags to attach to the ingested source' },
      },
    },
  },
];

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildMcpAppPreviewHtml(params: {
  deck?: string;
  template?: string;
  title?: string;
  slide?: string;
}): string {
  const initialDeck = params.deck ? escapeHtml(params.deck) : '';
  const initialTemplate = params.template ? escapeHtml(params.template) : 'xhs-swiss-grid';
  const initialTitle = params.title ? escapeHtml(params.title) : 'Aimake Live Deck Preview';
  const initialSlideNum = params.slide && /^\d+$/.test(params.slide) ? Number(params.slide) : 1;

  const deepLinkParams = new URLSearchParams();
  if (params.deck) deepLinkParams.set('deck', params.deck);
  if (params.template) deepLinkParams.set('template', params.template);
  if (params.slide && /^\d+$/.test(params.slide)) deepLinkParams.set('slide', params.slide);
  const deepLinkHref = escapeHtml(
    `aimake://open${deepLinkParams.toString() ? `?${deepLinkParams.toString()}` : ''}`
  );

  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <meta name="color-scheme" content="light dark" />
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline';" />
  <title>Aimake Live Deck Preview Card</title>
  <style>
    :root {
      color-scheme: light dark;
      --bg: #f6f7f9;
      --surface: #ffffff;
      --surface-subtle: #eff1f5;
      --border: rgba(15, 23, 42, 0.10);
      --fg: #14171f;
      --muted: #5c6575;
      --accent: #2563eb;
      --accent-fg: #ffffff;
      --shadow: 0 8px 24px rgba(15, 23, 42, 0.08);
    }
    @media (prefers-color-scheme: dark) {
      :root {
        --bg: #111317;
        --surface: #181b21;
        --surface-subtle: #20242d;
        --border: rgba(255, 255, 255, 0.10);
        --fg: #eceef2;
        --muted: #98a1b2;
        --accent: #3b82f6;
        --accent-fg: #ffffff;
        --shadow: 0 12px 32px rgba(0, 0, 0, 0.35);
      }
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 14px;
      background: var(--bg);
      color: var(--fg);
      font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "PingFang SC", sans-serif;
      font-size: 13px;
      line-height: 1.5;
    }
    .card {
      max-width: 680px;
      margin: 0 auto;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 14px;
      box-shadow: var(--shadow);
      overflow: hidden;
    }
    .topbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      padding: 12px 16px;
      border-bottom: 1px solid var(--border);
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 8px;
      min-width: 0;
    }
    .dot {
      width: 8px;
      height: 8px;
      border-radius: 999px;
      background: var(--accent);
      flex: 0 0 auto;
    }
    .title {
      font-weight: 600;
      font-size: 13px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .badge {
      font-size: 11px;
      padding: 2px 8px;
      border-radius: 999px;
      background: var(--surface-subtle);
      color: var(--muted);
      flex: 0 0 auto;
    }
    .stage {
      padding: 20px 18px;
      min-height: 168px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      gap: 10px;
    }
    .slide-eyebrow {
      font-size: 11px;
      letter-spacing: 0.04em;
      color: var(--muted);
    }
    .slide-heading {
      margin: 0;
      font-size: 18px;
      font-weight: 650;
      line-height: 1.3;
    }
    .slide-body {
      margin: 0;
      color: var(--muted);
      font-size: 13px;
      white-space: pre-wrap;
    }
    .artifacts {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-top: 4px;
    }
    .artifact-chip {
      font-size: 11px;
      padding: 3px 8px;
      border-radius: 6px;
      background: var(--surface-subtle);
      color: var(--fg);
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    }
    .footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      padding: 10px 16px;
      border-top: 1px solid var(--border);
      background: var(--surface-subtle);
    }
    .pager {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .btn {
      appearance: none;
      border: 1px solid var(--border);
      background: var(--surface);
      color: var(--fg);
      border-radius: 8px;
      padding: 5px 10px;
      font-size: 12px;
      cursor: pointer;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .btn-primary {
      background: var(--accent);
      color: var(--accent-fg);
      border-color: transparent;
      font-weight: 500;
    }
    .status {
      font-size: 11px;
      color: var(--muted);
    }
  </style>
</head>
<body>
  <div class="card" id="aimake-mcp-card">
    <div class="topbar">
      <div class="brand">
        <span class="dot"></span>
        <span class="title" id="deck-title">${initialTitle}</span>
      </div>
      <span class="badge" id="template-badge">${initialTemplate}</span>
    </div>
    <div class="stage">
      <div class="slide-eyebrow" id="slide-meta">${initialDeck ? `${initialDeck} · Slide ${initialSlideNum}` : `Slide ${initialSlideNum}`}</div>
      <h2 class="slide-heading" id="slide-heading">${initialTitle}</h2>
      <p class="slide-body" id="slide-body">等待工具结果推送，或直接打开 Aimake 桌面端查看完整视觉舞台与一键同款。</p>
      <div class="artifacts" id="artifacts-list"></div>
    </div>
    <div class="footer">
      <div class="pager">
        <button class="btn" id="prev-slide" type="button">上一页</button>
        <span class="status" id="pager-label">1 / 1</span>
        <button class="btn" id="next-slide" type="button">下一页</button>
      </div>
      <a class="btn btn-primary" id="open-desktop-btn" href="${deepLinkHref}">Open in Aimake Desktop</a>
    </div>
  </div>
  <script>
    (function () {
      var state = {
        title: document.getElementById('deck-title').textContent || 'Aimake Live Deck Preview',
        template: document.getElementById('template-badge').textContent || 'xhs-swiss-grid',
        deckPath: ${JSON.stringify(params.deck || '').replace(/</g, '\\u003c')},
        slides: [{ heading: document.getElementById('slide-heading').textContent, body: document.getElementById('slide-body').textContent }],
        artifacts: [],
        index: 0
      };

      function buildDeepLink() {
        var qs = [];
        if (state.deckPath) qs.push('deck=' + encodeURIComponent(state.deckPath));
        if (state.template) qs.push('template=' + encodeURIComponent(state.template));
        qs.push('slide=' + encodeURIComponent(String(state.index + 1)));
        return 'aimake://open' + (qs.length ? '?' + qs.join('&') : '');
      }

      function render() {
        var current = state.slides[state.index] || state.slides[0];
        document.getElementById('deck-title').textContent = state.title;
        document.getElementById('template-badge').textContent = state.template;
        document.getElementById('slide-meta').textContent = (state.deckPath ? state.deckPath + ' · ' : '') + 'Slide ' + (state.index + 1) + ' / ' + state.slides.length;
        document.getElementById('slide-heading').textContent = current.heading || state.title;
        document.getElementById('slide-body').textContent = current.body || '';
        document.getElementById('pager-label').textContent = (state.index + 1) + ' / ' + state.slides.length;

        var openBtn = document.getElementById('open-desktop-btn');
        openBtn.setAttribute('href', buildDeepLink());

        var artBox = document.getElementById('artifacts-list');
        artBox.textContent = '';
        for (var i = 0; i < state.artifacts.length; i++) {
          var chip = document.createElement('span');
          chip.className = 'artifact-chip';
          chip.textContent = String(state.artifacts[i]);
          artBox.appendChild(chip);
        }
      }

      function applyToolResult(payload) {
        if (!payload || typeof payload !== 'object') return;
        var data = payload;
        if (Array.isArray(payload.content) && payload.content[0] && typeof payload.content[0].text === 'string') {
          try { data = JSON.parse(payload.content[0].text); } catch (e) {}
        }
        if (data.templateId || data.template) state.template = String(data.templateId || data.template);
        if (data.outDeckPath || data.targetDeckPath || data.deckPath) {
          state.deckPath = String(data.outDeckPath || data.targetDeckPath || data.deckPath);
        }
        if (data.title) state.title = String(data.title);
        if (Array.isArray(data.artifacts)) {
          state.artifacts = data.artifacts.slice(0, 8);
        }
        if (Array.isArray(data.slides) && data.slides.length > 0) {
          state.slides = data.slides.map(function (s, idx) {
            return {
              heading: String((s && s.title) || ('Slide ' + (idx + 1))),
              body: String((s && (s.subtitle || s.summary || (Array.isArray(s.bullets) ? s.bullets.join(' · ') : ''))) || '')
            };
          });
          state.index = 0;
        } else {
          var summaryParts = [];
          if (data.sourceTemplateId) summaryParts.push('已应用风格模板: ' + data.sourceTemplateId);
          if (typeof data.slideCount === 'number') summaryParts.push('共 ' + data.slideCount + ' 页');
          if (state.artifacts.length > 0) summaryParts.push('已生成 ' + state.artifacts.length + ' 个交付物');
          state.slides = [{
            heading: state.title,
            body: summaryParts.length ? summaryParts.join(' · ') : '作品已更新，点击右下角在 Aimake 桌面端中继续微调。'
          }];
          state.index = 0;
        }
        render();
      }

      document.getElementById('prev-slide').addEventListener('click', function () {
        if (state.index > 0) { state.index -= 1; render(); }
      });
      document.getElementById('next-slide').addEventListener('click', function () {
        if (state.index < state.slides.length - 1) { state.index += 1; render(); }
      });
      document.getElementById('open-desktop-btn').addEventListener('click', function () {
        if (window.parent && window.parent !== window) {
          window.parent.postMessage({
            jsonrpc: '2.0',
            method: 'ui/open-link',
            params: { url: buildDeepLink() }
          }, '*');
        }
      });

      window.addEventListener('message', function (ev) {
        var msg = ev.data;
        if (!msg || typeof msg !== 'object') return;
        if (msg.method === 'ui/initialize') {
          if (window.parent && window.parent !== window) {
            window.parent.postMessage({
              jsonrpc: '2.0',
              id: msg.id !== undefined ? msg.id : null,
              result: {
                protocolVersion: '2026-01-26',
                appInfo: { name: 'aimake-live-preview', version: '2.0.0' },
                appCapabilities: { openLink: true }
              }
            }, '*');
          }
          return;
        }
        if (msg.method === 'ui/notifications/tool-result') {
          applyToolResult(msg.params || {});
        }
      });

      if (window.parent && window.parent !== window) {
        window.parent.postMessage({
          jsonrpc: '2.0',
          method: 'ui/notifications/initialized',
          params: {}
        }, '*');
      }
      render();
    })();
  </script>
</body>
</html>`;
}

async function listDirFilesSafe(
  dirPath: string,
  options: { recursive?: boolean; suffix?: string } = {}
): Promise<string[]> {
  const results: string[] = [];
  async function walk(currentDir: string, relPrefix: string): Promise<void> {
    let entries;
    try {
      entries = await fs.readdir(currentDir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (entry.name.startsWith('.')) continue;
      const rel = relPrefix ? `${relPrefix}/${entry.name}` : entry.name;
      const full = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        if (options.recursive) {
          await walk(full, rel);
        }
      } else if (entry.isFile()) {
        if (!options.suffix || entry.name.endsWith(options.suffix)) {
          results.push(rel);
        }
      }
    }
  }
  await walk(dirPath, '');
  return results.sort();
}

async function readLoopbackStudioUrl(workspaceDir: string): Promise<string | null> {
  const runtimePath = path.join(workspaceDir, '.aimake', 'studio-runtime.json');
  let rawText: string;
  try {
    rawText = await fs.readFile(runtimePath, 'utf8');
  } catch {
    return null;
  }
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(rawText) as Record<string, unknown>;
  } catch {
    return null;
  }
  const candidate =
    typeof parsed.url === 'string'
      ? parsed.url
      : typeof parsed.origin === 'string'
        ? parsed.origin
        : typeof parsed.port === 'number' && Number.isInteger(parsed.port)
          ? `http://127.0.0.1:${parsed.port}`
          : null;
  if (!candidate) return null;

  try {
    const u = new URL(candidate);
    if (u.protocol !== 'http:') return null;
    if (u.hostname !== '127.0.0.1' && u.hostname !== 'localhost') return null;
    const portNum = Number(u.port);
    if (!Number.isInteger(portNum) || portNum < 1 || portNum > 65535) return null;
    return `${u.protocol}//${u.hostname}:${portNum}`;
  } catch {
    return null;
  }
}

async function inspectWorkspaceStatus(rawWorkspaceDir: string): Promise<Record<string, unknown>> {
  const workspaceDir = path.resolve(rawWorkspaceDir);
  const stat = await fs.stat(workspaceDir).catch(() => null);
  if (!stat || !stat.isDirectory()) {
    throw new Error(`Workspace directory not found: ${workspaceDir}`);
  }

  const [sources, wiki, briefs, deckRelFiles, exportsList] = await Promise.all([
    listDirFilesSafe(path.join(workspaceDir, 'sources'), { recursive: true }),
    listDirFilesSafe(path.join(workspaceDir, 'wiki'), { recursive: true, suffix: '.md' }),
    listDirFilesSafe(path.join(workspaceDir, 'briefs'), { recursive: true, suffix: '.md' }),
    listDirFilesSafe(path.join(workspaceDir, 'decks'), { recursive: true, suffix: '.deck.md' }),
    listDirFilesSafe(path.join(workspaceDir, 'exports'), { recursive: true }),
  ]);

  // Scan preset skills inside .agents/skills/*/SKILL.md
  const presetSkills: string[] = [];
  const skillsRoot = path.join(workspaceDir, '.agents', 'skills');
  try {
    const skillEntries = await fs.readdir(skillsRoot, { withFileTypes: true });
    for (const entry of skillEntries) {
      if (!entry.isDirectory() || entry.name.startsWith('.')) continue;
      const skillMd = path.join(skillsRoot, entry.name, 'SKILL.md');
      const hasSkill = await fs.stat(skillMd).then((s) => s.isFile()).catch(() => false);
      if (hasSkill) presetSkills.push(entry.name);
    }
    presetSkills.sort();
  } catch {
    // .agents/skills not initialized yet
  }

  // Parse active decks metadata best-effort
  const activeDecks: Array<Record<string, unknown>> = [];
  for (const rel of deckRelFiles) {
    const deckRelPath = `decks/${rel}`;
    const fullPath = path.join(workspaceDir, deckRelPath);
    try {
      const raw = await fs.readFile(fullPath, 'utf8');
      const doc = parseDeckMarkdown(raw, fullPath);
      activeDecks.push({
        relPath: deckRelPath,
        title: doc.frontmatter.title || path.basename(rel, '.deck.md'),
        template: doc.frontmatter.template,
        aspect: doc.frontmatter.aspect,
        locale: doc.frontmatter.locale,
        slideCount: doc.slides.length,
      });
    } catch {
      activeDecks.push({
        relPath: deckRelPath,
        title: path.basename(rel, '.deck.md'),
        slideCount: 0,
      });
    }
  }

  // Optional workspace metadata & live Studio runtime check
  let workspaceMeta: Record<string, unknown> | null = null;
  try {
    workspaceMeta = JSON.parse(
      await fs.readFile(path.join(workspaceDir, '.aimake', 'workspace.json'), 'utf8')
    ) as Record<string, unknown>;
  } catch {
    workspaceMeta = null;
  }
  const studioUrl = await readLoopbackStudioUrl(workspaceDir);

  const currentStage =
    exportsList.length > 0
      ? 'deliver'
      : activeDecks.length > 0
        ? 'stage'
        : briefs.length > 0 || wiki.length > 0
          ? 'create'
          : 'intake';

  return {
    workspaceDir,
    name: typeof workspaceMeta?.name === 'string' ? workspaceMeta.name : path.basename(workspaceDir),
    preset: typeof workspaceMeta?.preset === 'string' ? workspaceMeta.preset : undefined,
    currentStage,
    studioConnected: studioUrl !== null,
    studioUrl: studioUrl ?? undefined,
    counts: {
      sources: sources.length,
      wiki: wiki.length,
      briefs: briefs.length,
      decks: activeDecks.length,
      exports: exportsList.length,
      presetSkills: presetSkills.length,
    },
    pipeline: {
      intake: { ready: sources.length > 0, count: sources.length, files: sources },
      wiki: { ready: wiki.length > 0, count: wiki.length, files: wiki },
      brief: { ready: briefs.length > 0, count: briefs.length, files: briefs },
      stage: { ready: activeDecks.length > 0, count: activeDecks.length },
      deliver: { ready: exportsList.length > 0, count: exportsList.length, files: exportsList },
      flywheel: {
        currentStage: activeDecks.length > 0 ? (exportsList.length > 0 ? 'publish' : 'create') : (wiki.length > 0 ? 'distill' : 'intake'),
        stages: [
          { id: 'intake', nameZh: '抓取素材', ready: sources.length > 0, count: sources.length },
          { id: 'distill', nameZh: '萃取知识', ready: wiki.length > 0 || briefs.length > 0, count: wiki.length + briefs.length },
          { id: 'create', nameZh: '创作视觉', ready: activeDecks.length > 0, count: activeDecks.length },
          { id: 'publish', nameZh: '全渠道发布', ready: exportsList.length > 0, count: exportsList.length },
        ],
      },
    },
    activeDecks,
    presetSkillsCount: presetSkills.length,
    presetSkills,
  };
}

async function inspectWorkspacePipeline(workspaceDir: string): Promise<Record<string, unknown>> {
  const ws = path.resolve(workspaceDir);
  const status = await inspectWorkspaceStatus(ws);
  const flywheel = (status.pipeline as any).flywheel as {
    currentStage: string;
    stages: Array<{ id: string; nameZh: string; ready: boolean; count: number }>;
  };

  let recommendedAction = 'Run `aimake intake <source>` to ingest raw notes, files, or URLs';
  if (flywheel.currentStage === 'distill') {
    recommendedAction = 'Run `aimake distill` to distill sources into wiki cards and story briefs';
  } else if (flywheel.currentStage === 'create') {
    recommendedAction = 'Run `aimake create <prompt>` or `aimake studio` to compose storyboard deck';
  } else if (flywheel.currentStage === 'publish') {
    recommendedAction = 'Run `aimake publish <deck>` to render and cross-post to WeChat/Zhihu/Juejin/XHS';
  }

  return {
    workspaceName: status.name,
    workspaceDir: ws,
    currentStage: status.currentStage,
    flywheelStage: flywheel.currentStage,
    flywheel: flywheel.stages,
    counts: status.counts,
    activeDecks: status.activeDecks,
    recommendedAction,
  };
}

async function notifyStudioStageFocus(args: {
  workspaceDir: string;
  deckRel?: string;
  slideIndex?: number;
  message?: string;
}): Promise<Record<string, unknown>> {
  const workspaceDir = path.resolve(args.workspaceDir);
  const slideIndex =
    typeof args.slideIndex === 'number' && Number.isFinite(args.slideIndex)
      ? Math.max(0, Math.floor(args.slideIndex))
      : undefined;
  const message =
    args.message && args.message.trim().length > 0
      ? args.message.trim()
      : slideIndex !== undefined
        ? `AI 已更新第 ${slideIndex + 1} 页`
        : 'AI 已更新当前作品舞台';

  const studioUrl = await readLoopbackStudioUrl(workspaceDir);
  if (!studioUrl) {
    return {
      ok: true,
      notifiedStudio: false,
      reason: 'No valid loopback studio-runtime.json found',
      deckRel: args.deckRel,
      slideIndex,
      message,
    };
  }

  try {
    const res = await fetch(`${studioUrl}/api/stage/focus`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        deckRel: args.deckRel,
        slideIndex,
        message,
        source: 'mcp',
      }),
      signal: AbortSignal.timeout(2000),
    });
    return {
      ok: true,
      notifiedStudio: res.ok,
      studioUrl,
      status: res.status,
      deckRel: args.deckRel,
      slideIndex,
      message,
    };
  } catch (err) {
    return {
      ok: true,
      notifiedStudio: false,
      studioUrl,
      reason: err instanceof Error ? err.message : String(err),
      deckRel: args.deckRel,
      slideIndex,
      message,
    };
  }
}

export async function handleMcpRequest(req: JsonRpcRequest): Promise<Record<string, unknown> | null> {
  if (req.method === 'notifications/initialized') {
    return null;
  }

  if (req.method === 'initialize') {
    return {
      jsonrpc: '2.0',
      id: req.id ?? null,
      result: {
        protocolVersion: '2024-11-05',
        capabilities: {
          tools: {},
          resources: {
            listChanged: false,
          },
        },
        serverInfo: {
          name: 'aimake-mcp',
          version: '2.0.0',
        },
      },
    };
  }

  if (req.method === 'tools/list') {
    return {
      jsonrpc: '2.0',
      id: req.id ?? null,
      result: { tools: MCP_TOOLS },
    };
  }

  if (req.method === 'resources/list') {
    return {
      jsonrpc: '2.0',
      id: req.id ?? null,
      result: {
        resources: [
          {
            uri: MCP_APP_PREVIEW_URI,
            name: 'Aimake Live Deck Preview Card',
            description:
              'Interactive sandboxed deck preview card rendered inside MCP Apps-capable AI clients',
            mimeType: MCP_APP_MIME_TYPE,
          },
        ],
      },
    };
  }

  if (req.method === 'resources/read') {
    const rawUri = String(req.params?.uri ?? MCP_APP_PREVIEW_URI);
    let parsedUri: URL;
    try {
      parsedUri = new URL(rawUri);
    } catch {
      return {
        jsonrpc: '2.0',
        id: req.id ?? null,
        error: { code: -32602, message: `Invalid resource URI: ${rawUri}` },
      };
    }

    const baseUri = `${parsedUri.protocol}//${parsedUri.host}${parsedUri.pathname}`;
    if (baseUri !== MCP_APP_PREVIEW_URI) {
      return {
        jsonrpc: '2.0',
        id: req.id ?? null,
        error: { code: -32602, message: `Unknown resource URI: ${rawUri}` },
      };
    }

    const html = buildMcpAppPreviewHtml({
      deck: parsedUri.searchParams.get('deck') ?? undefined,
      template: parsedUri.searchParams.get('template') ?? undefined,
      title: parsedUri.searchParams.get('title') ?? undefined,
      slide: parsedUri.searchParams.get('slide') ?? undefined,
    });

    return {
      jsonrpc: '2.0',
      id: req.id ?? null,
      result: {
        contents: [
          {
            uri: rawUri,
            mimeType: MCP_APP_MIME_TYPE,
            text: html,
          },
        ],
      },
    };
  }

  if (req.method === 'tools/call') {
    const params = req.params || {};
    const toolName = String(params.name || '');
    const args = (params.arguments || {}) as Record<string, unknown>;

    try {
      if (toolName === 'aimake_list_templates') {
        const all = await listTemplates();
        const filtered = args.category
          ? all.filter((t) => t.category === String(args.category))
          : all;
        return okTool(req.id, filtered);
      }

      if (toolName === 'aimake_market_search') {
        const matches = await searchMarketplace({
          q: args.q ? String(args.q) : undefined,
          locale: args.locale ? (String(args.locale) as SupportedLocale) : undefined,
          category: args.category ? (String(args.category) as never) : undefined,
          styleFamily: args.styleFamily ? String(args.styleFamily) : undefined,
        });
        const catalog = args.includePacks !== false ? await listMarketplaceCatalog() : undefined;
        return okTool(req.id, {
          templates: matches,
          packs: catalog?.packs ?? [],
        });
      }

      if (toolName === 'aimake_market_install') {
        const res = await installMarketplaceItem(
          String(args.itemSpec),
          path.resolve(String(args.workspaceDir))
        );
        return okTool(req.id, res);
      }

      if (toolName === 'aimake_remix_deck') {
        const res = await remixDeckWithStyle({
          sourceTemplateId: args.sourceTemplateId ? String(args.sourceTemplateId) : undefined,
          sourceDeckPath: args.sourceDeckPath ? path.resolve(String(args.sourceDeckPath)) : undefined,
          targetDeckPath: path.resolve(String(args.targetDeckPath)),
          outDeckPath: args.outDeckPath ? path.resolve(String(args.outDeckPath)) : undefined,
          locale: args.locale ? (String(args.locale) as SupportedLocale) : undefined,
          humanize: Boolean(args.humanize),
        });
        return okTool(req.id, res);
      }

      if (toolName === 'aimake_wiki_ingest') {
        const res = await ingestSource(String(args.vaultDir), String(args.source), {
          title: args.title ? String(args.title) : undefined,
        });
        return okTool(req.id, res);
      }

      if (toolName === 'aimake_wiki_lint') {
        const report = await lintWiki(String(args.vaultDir));
        return okTool(req.id, report);
      }

      if (toolName === 'aimake_wiki_context') {
        const d = Number(args.depth ?? 1);
        const depth = d === 0 || d === 2 ? d : 1;
        const bundle = await getVaultContextBundle(String(args.vaultDir), String(args.focus), {
          depth,
          maxWords: Number(args.maxWords ?? 2000),
        });
        return okTool(req.id, bundle);
      }

      if (toolName === 'aimake_wiki_report') {
        const report = await compileVaultGraph(String(args.vaultDir));
        return okTool(req.id, {
          nodeCount: report.graph.nodes.length,
          edgeCount: report.graph.edges.length,
          diagnostics: report.graph.diagnostics,
          reportMarkdown: report.reportMarkdown,
        });
      }

      if (toolName === 'aimake_wiki_visuals') {
        const visuals = await exportVaultVisuals(String(args.vaultDir), {
          focusQuery: args.focus ? String(args.focus) : undefined,
        });
        return okTool(req.id, visuals);
      }

      if (toolName === 'aimake_humanize') {
        const locale = (args.locale ? String(args.locale) : 'zh-CN') as SupportedLocale;
        const text = String(args.text || '');
        const audit = auditAiSlop(text, locale);
        const cleaned = humanizeText(text, locale);
        return okTool(req.id, { audit, cleaned });
      }

      if (toolName === 'aimake_render_deck') {
        const raw = await fs.readFile(String(args.deckPath), 'utf8');
        const doc = parseDeckMarkdown(raw, String(args.deckPath));
        if (args.template) doc.frontmatter.template = String(args.template);
        const format = String(args.format) as ExportFormat;
        const artifacts = await exportDeckBundle(doc, format, String(args.output));
        let compoundedPath: string | undefined;
        let citationReport: unknown;
        if (args.vaultDir) {
          compoundedPath = await compoundOutputToWiki(String(args.vaultDir), doc, artifacts);
          citationReport = await verifyDeckCitationsAgainstVault(doc, String(args.vaultDir));
        }
        const previewHtml =
          format === 'html'
            ? undefined
            : (await compileDeckToHtml(doc, { editable: false })).html.slice(0, 200);
        return okTool(req.id, {
          artifacts,
          compoundedPath,
          citationReport,
          previewSnippet: previewHtml,
        });
      }

      if (toolName === 'aimake_sanitize_pr') {
        const report = sanitizeContentForPR(String(args.content || ''));
        return okTool(req.id, report);
      }

      if (toolName === 'aimake_workspace_status') {
        if (!args.workspaceDir || typeof args.workspaceDir !== 'string') {
          throw new Error('workspaceDir is required');
        }
        const status = await inspectWorkspaceStatus(args.workspaceDir);
        return okTool(req.id, status);
      }

      if (toolName === 'aimake_stage_focus') {
        if (!args.workspaceDir || typeof args.workspaceDir !== 'string') {
          throw new Error('workspaceDir is required');
        }
        const focusRes = await notifyStudioStageFocus({
          workspaceDir: args.workspaceDir,
          deckRel: typeof args.deckRel === 'string' ? args.deckRel : undefined,
          slideIndex: typeof args.slideIndex === 'number' ? args.slideIndex : undefined,
          message: typeof args.message === 'string' ? args.message : undefined,
        });
        return okTool(req.id, focusRes);
      }

      if (toolName === 'aimake_publish_content') {
        if (!args.sourceFile || typeof args.sourceFile !== 'string') {
          throw new Error('sourceFile is required');
        }
        const res = await publishContent(path.resolve(String(args.sourceFile)), {
          targets: Array.isArray(args.targets) ? (args.targets as any) : undefined,
          draft: args.draft !== false,
          browser: Boolean(args.browser),
          tags: Array.isArray(args.tags) ? args.tags.map(String) : undefined,
          topics: Array.isArray(args.topics) ? args.topics.map(String) : undefined,
          category: args.category ? String(args.category) : undefined,
          outDir: args.outDir ? path.resolve(String(args.outDir)) : undefined,
        });
        return okTool(req.id, res);
      }

      if (toolName === 'aimake_pipeline_inspect') {
        if (!args.workspaceDir || typeof args.workspaceDir !== 'string') {
          throw new Error('workspaceDir is required');
        }
        const pipeRes = await inspectWorkspacePipeline(args.workspaceDir);
        return okTool(req.id, pipeRes);
      }

      if (toolName === 'aimake_intake_source') {
        if (!args.source || typeof args.source !== 'string') {
          throw new Error('source is required');
        }
        const sourceStr = String(args.source);
        const wsDir = path.resolve(String(args.workspaceDir || '.'));
        const normalized = await normalizeSource(sourceStr, {
          title: args.title ? String(args.title) : undefined,
          tags: Array.isArray(args.tags) ? args.tags.map(String) : undefined,
        });
        const ingested = await ingestWorkspaceSource(wsDir, {
          title: normalized.title,
          content: normalized.markdown,
          sourceUrl: normalized.sourceUrl,
          tags: normalized.tags,
        });
        return okTool(req.id, {
          source: sourceStr,
          sourceType: normalized.sourceType,
          title: normalized.title,
          metrics: normalized.metrics,
          ingestedPath: ingested.relativeSourcePath,
          wikiCardPath: ingested.wikiIngest?.wikiPath,
        });
      }

      return {
        jsonrpc: '2.0',
        id: req.id ?? null,
        error: { code: -32601, message: `Unknown tool: ${toolName}` },
      };
    } catch (err) {
      return {
        jsonrpc: '2.0',
        id: req.id ?? null,
        result: {
          isError: true,
          content: [{ type: 'text', text: err instanceof Error ? err.message : String(err) }],
        },
      };
    }
  }

  return {
    jsonrpc: '2.0',
    id: req.id ?? null,
    error: { code: -32601, message: `Method not found: ${req.method}` },
  };
}

function okTool(id: string | number | null | undefined, data: unknown): Record<string, unknown> {
  return {
    jsonrpc: '2.0',
    id: id ?? null,
    result: {
      content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
    },
  };
}

export async function startStdioMcpServer(): Promise<void> {
  const rl = readline.createInterface({
    input: process.stdin,
    terminal: false,
  });

  rl.on('line', async (line) => {
    const trimmed = line.trim();
    if (!trimmed) return;
    try {
      const req = JSON.parse(trimmed) as JsonRpcRequest;
      const resp = await handleMcpRequest(req);
      if (resp) {
        process.stdout.write(`${JSON.stringify(resp)}\n`);
      }
    } catch (err) {
      process.stdout.write(
        `${JSON.stringify({
          jsonrpc: '2.0',
          id: null,
          error: { code: -32700, message: err instanceof Error ? err.message : 'Parse error' },
        })}\n`
      );
    }
  });
}
