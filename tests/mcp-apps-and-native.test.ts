import fs from 'node:fs/promises';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { handleMcpRequest } from '../src/mcp/mcp-server.js';

describe('MCP Server 2.0: SEP-1865 MCP Apps & Workspace Sync Tools', () => {
  it('advertises tools and resources.listChanged=false on initialize', async () => {
    const resp = (await handleMcpRequest({
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
    })) as {
      result: {
        protocolVersion: string;
        capabilities: { tools: Record<string, unknown>; resources: { listChanged: boolean } };
        serverInfo: { name: string; version: string };
      };
    };

    expect(resp.result.serverInfo.name).toBe('aimake-mcp');
    expect(resp.result.serverInfo.version).toBe('2.0.0');
    expect(resp.result.capabilities.tools).toBeDefined();
    expect(resp.result.capabilities.resources).toEqual({ listChanged: false });
  });

  it('lists all legacy tools plus new workspace tools and attaches SEP-1865 _meta.ui metadata', async () => {
    const resp = (await handleMcpRequest({
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/list',
    })) as {
      result: {
        tools: Array<{
          name: string;
          _meta?: { ui?: { resourceUri?: string } };
        }>;
      };
    };

    const tools = resp.result.tools;
    const names = tools.map((t) => t.name);

    expect(tools.length).toBeGreaterThanOrEqual(14);
    expect(names).toContain('aimake_list_templates');
    expect(names).toContain('aimake_remix_deck');
    expect(names).toContain('aimake_render_deck');
    expect(names).toContain('aimake_workspace_status');
    expect(names).toContain('aimake_stage_focus');

    const remixTool = tools.find((t) => t.name === 'aimake_remix_deck');
    const renderTool = tools.find((t) => t.name === 'aimake_render_deck');
    expect(remixTool?._meta?.ui?.resourceUri).toBe('ui://aimake/preview');
    expect(renderTool?._meta?.ui?.resourceUri).toBe('ui://aimake/preview');
  });

  it('lists and reads SEP-1865 ui://aimake/preview interactive MCP App resource safely', async () => {
    const listResp = (await handleMcpRequest({
      jsonrpc: '2.0',
      id: 3,
      method: 'resources/list',
    })) as {
      result: {
        resources: Array<{ uri: string; name: string; description: string; mimeType: string }>;
      };
    };

    expect(listResp.result.resources).toHaveLength(1);
    const previewResource = listResp.result.resources[0];
    expect(previewResource.uri).toBe('ui://aimake/preview');
    expect(previewResource.mimeType).toBe('text/html;profile=mcp-app');
    expect(previewResource.name).toBe('Aimake Live Deck Preview Card');
    expect(previewResource.description).toContain('MCP Apps');

    const readResp = (await handleMcpRequest({
      jsonrpc: '2.0',
      id: 4,
      method: 'resources/read',
      params: {
        uri: 'ui://aimake/preview?deck=decks/launch.deck.md&template=xhs-swiss-grid',
      },
    })) as {
      result: {
        contents: Array<{ uri: string; mimeType: string; text: string }>;
      };
    };

    expect(readResp.result.contents).toHaveLength(1);
    const content = readResp.result.contents[0];
    expect(content.mimeType).toBe('text/html;profile=mcp-app');
    expect(content.uri).toBe(
      'ui://aimake/preview?deck=decks/launch.deck.md&template=xhs-swiss-grid'
    );
    expect(content.text).toContain('ui/initialize');
    expect(content.text).toContain('ui/notifications/tool-result');
    expect(content.text).toContain('Open in Aimake Desktop');
    expect(content.text).toContain('aimake://open');
    expect(content.text).toContain('xhs-swiss-grid');
    expect(content.text).toContain('decks/launch.deck.md');

    // Verify XSS escaping for untrusted query params
    const xssResp = (await handleMcpRequest({
      jsonrpc: '2.0',
      id: 5,
      method: 'resources/read',
      params: {
        uri: 'ui://aimake/preview?deck=%3C/script%3E%3Cimg%20onerror=alert(1)%3E&template=%3Cb%3Ebad%3C/b%3E',
      },
    })) as {
      result: { contents: Array<{ text: string }> };
    };
    expect(xssResp.result.contents[0].text).not.toContain('</script><img');
    expect(xssResp.result.contents[0].text).not.toContain('<b>bad</b>');
  });

  it('scans workspace end-to-end pipeline status via aimake_workspace_status', async () => {
    const tmpWorkspace = await fs.mkdtemp(path.join(os.tmpdir(), 'aimake-ws-mcp-'));
    try {
      await fs.mkdir(path.join(tmpWorkspace, 'sources'), { recursive: true });
      await fs.mkdir(path.join(tmpWorkspace, 'wiki'), { recursive: true });
      await fs.mkdir(path.join(tmpWorkspace, 'briefs'), { recursive: true });
      await fs.mkdir(path.join(tmpWorkspace, 'decks'), { recursive: true });
      await fs.mkdir(path.join(tmpWorkspace, 'exports'), { recursive: true });
      await fs.mkdir(path.join(tmpWorkspace, '.agents', 'skills', 'aimake-workspace-pilot'), {
        recursive: true,
      });
      await fs.mkdir(path.join(tmpWorkspace, '.agents', 'skills', 'aimake-deck-composer'), {
        recursive: true,
      });
      await fs.mkdir(path.join(tmpWorkspace, '.aimake'), { recursive: true });

      await fs.writeFile(path.join(tmpWorkspace, 'sources', 'briefing.md'), '# Source\nData', 'utf8');
      await fs.writeFile(path.join(tmpWorkspace, 'wiki', 'index.md'), '# Index\n', 'utf8');
      await fs.writeFile(
        path.join(tmpWorkspace, 'briefs', 'launch.brief.md'),
        '# Launch Brief\n',
        'utf8'
      );
      await fs.writeFile(
        path.join(tmpWorkspace, 'decks', 'launch.deck.md'),
        `---
title: 新品发布会小红书
template: xhs-swiss-grid
locale: zh-CN
aspect: 3:4
---

# 第一页：核心亮点
- 端到端闭环

---

# 第二页：工作区实体预设
- 零全局污染
`,
        'utf8'
      );
      await fs.writeFile(path.join(tmpWorkspace, 'exports', 'slide-01.png'), 'png', 'utf8');
      await fs.writeFile(
        path.join(tmpWorkspace, '.agents', 'skills', 'aimake-workspace-pilot', 'SKILL.md'),
        '---\nname: aimake-workspace-pilot\ndescription: Pilot\n---\n',
        'utf8'
      );
      await fs.writeFile(
        path.join(tmpWorkspace, '.agents', 'skills', 'aimake-deck-composer', 'SKILL.md'),
        '---\nname: aimake-deck-composer\ndescription: Composer\n---\n',
        'utf8'
      );
      await fs.writeFile(
        path.join(tmpWorkspace, '.aimake', 'workspace.json'),
        JSON.stringify({ name: '新品发布会工作区', preset: 'product-launch' }),
        'utf8'
      );

      const resp = (await handleMcpRequest({
        jsonrpc: '2.0',
        id: 6,
        method: 'tools/call',
        params: {
          name: 'aimake_workspace_status',
          arguments: { workspaceDir: tmpWorkspace },
        },
      })) as { result: { content: Array<{ text: string }> } };

      const payload = JSON.parse(resp.result.content[0].text) as {
        name: string;
        currentStage: string;
        counts: Record<string, number>;
        activeDecks: Array<{ relPath: string; title: string; template: string; slideCount: number }>;
        presetSkillsCount: number;
        presetSkills: string[];
      };

      expect(payload.name).toBe('新品发布会工作区');
      expect(payload.currentStage).toBe('deliver');
      expect(payload.counts).toEqual({
        sources: 1,
        wiki: 1,
        briefs: 1,
        decks: 1,
        exports: 1,
        presetSkills: 2,
      });
      expect(payload.presetSkillsCount).toBe(2);
      expect(payload.presetSkills).toEqual(['aimake-deck-composer', 'aimake-workspace-pilot']);
      expect(payload.activeDecks).toHaveLength(1);
      expect(payload.activeDecks[0]).toMatchObject({
        relPath: 'decks/launch.deck.md',
        title: '新品发布会小红书',
        template: 'xhs-swiss-grid',
        slideCount: 2,
      });
    } finally {
      await fs.rm(tmpWorkspace, { recursive: true, force: true });
    }
  });

  it('notifies loopback Studio server on aimake_stage_focus and rejects non-loopback URLs', async () => {
    const tmpWorkspace = await fs.mkdtemp(path.join(os.tmpdir(), 'aimake-focus-mcp-'));
    let server: http.Server | null = null;
    try {
      // 1. Without studio-runtime.json -> graceful notifiedStudio: false
      const offlineResp = (await handleMcpRequest({
        jsonrpc: '2.0',
        id: 7,
        method: 'tools/call',
        params: {
          name: 'aimake_stage_focus',
          arguments: { workspaceDir: tmpWorkspace, deckRel: 'decks/launch.deck.md', slideIndex: 1 },
        },
      })) as { result: { content: Array<{ text: string }> } };
      const offlineData = JSON.parse(offlineResp.result.content[0].text) as {
        ok: boolean;
        notifiedStudio: boolean;
        message: string;
      };
      expect(offlineData.ok).toBe(true);
      expect(offlineData.notifiedStudio).toBe(false);
      expect(offlineData.message).toBe('AI 已更新第 2 页');

      // 2. Non-loopback URL in studio-runtime.json -> refused safely
      await fs.mkdir(path.join(tmpWorkspace, '.aimake'), { recursive: true });
      await fs.writeFile(
        path.join(tmpWorkspace, '.aimake', 'studio-runtime.json'),
        JSON.stringify({ url: 'http://evil.example.com:4310' }),
        'utf8'
      );
      const ssrfResp = (await handleMcpRequest({
        jsonrpc: '2.0',
        id: 8,
        method: 'tools/call',
        params: {
          name: 'aimake_stage_focus',
          arguments: { workspaceDir: tmpWorkspace, slideIndex: 0 },
        },
      })) as { result: { content: Array<{ text: string }> } };
      const ssrfData = JSON.parse(ssrfResp.result.content[0].text) as {
        ok: boolean;
        notifiedStudio: boolean;
      };
      expect(ssrfData.ok).toBe(true);
      expect(ssrfData.notifiedStudio).toBe(false);

      // 3. Valid loopback server receives POST /api/stage/focus
      let receivedBody: Record<string, unknown> | null = null;
      server = http.createServer((req, res) => {
        if (req.method === 'POST' && req.url === '/api/stage/focus') {
          let raw = '';
          req.on('data', (chunk) => {
            raw += chunk;
          });
          req.on('end', () => {
            receivedBody = JSON.parse(raw) as Record<string, unknown>;
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ ok: true }));
          });
          return;
        }
        res.writeHead(404);
        res.end();
      });

      await new Promise<void>((resolve) => {
        server!.listen(0, '127.0.0.1', () => resolve());
      });
      const address = server.address();
      if (!address || typeof address === 'string') {
        throw new Error('Failed to bind ephemeral loopback server');
      }

      await fs.writeFile(
        path.join(tmpWorkspace, '.aimake', 'studio-runtime.json'),
        JSON.stringify({ url: `http://127.0.0.1:${address.port}` }),
        'utf8'
      );

      const liveResp = (await handleMcpRequest({
        jsonrpc: '2.0',
        id: 9,
        method: 'tools/call',
        params: {
          name: 'aimake_stage_focus',
          arguments: {
            workspaceDir: tmpWorkspace,
            deckRel: 'decks/launch.deck.md',
            slideIndex: 2,
            message: 'AI 已更新第 3 页',
          },
        },
      })) as { result: { content: Array<{ text: string }> } };

      const liveData = JSON.parse(liveResp.result.content[0].text) as {
        ok: boolean;
        notifiedStudio: boolean;
      };
      expect(liveData.ok).toBe(true);
      expect(liveData.notifiedStudio).toBe(true);
      expect(receivedBody).toEqual({
        deckRel: 'decks/launch.deck.md',
        slideIndex: 2,
        message: 'AI 已更新第 3 页',
        source: 'mcp',
      });
    } finally {
      if (server) {
        await new Promise<void>((resolve) => server!.close(() => resolve()));
      }
      await fs.rm(tmpWorkspace, { recursive: true, force: true });
    }
  });
});

describe('macOS Native Shell (AimakeApp.swift) System Appearance & Workspace Bridge', () => {
  it('syncs system appearance by default and implements setAppearance, pickFolder, launchAgent & self-test contract', async () => {
    const swiftPath = path.resolve(process.cwd(), 'desktop', 'macos', 'AimakeApp.swift');
    const source = await fs.readFile(swiftPath, 'utf8');

    // System-synced appearance by default (no forced darkAqua at startup)
    expect(source).toContain('NSApp.appearance = nil');
    expect(source).toContain('win.appearance = nil');
    expect(source).not.toContain('NSApp.appearance = NSAppearance(named: .darkAqua)');
    expect(source).not.toContain('win.appearance = NSAppearance(named: .darkAqua)');
    expect(source).toContain('win.backgroundColor = NSColor.windowBackgroundColor');
    expect(source).toContain('win.titlebarAppearsTransparent = true');
    expect(source).toContain('Aimake — 端到端多模态创作工作台');

    // Version & shell identifier
    expect(source).toContain('private static let desktopShellId = "appkit-wkwebview"');
    expect(source).toContain('private static let desktopVersion = "2.0.0"');

    // New native JS bridge actions
    expect(source).toContain('case "setAppearance":');
    expect(source).toContain('case "pickFolder":');
    expect(source).toContain('panel.canChooseDirectories = true');
    expect(source).toContain('panel.canChooseFiles = false');
    expect(source).toContain('panel.canCreateDirectories = true');
    expect(source).toContain('case "launchAgent":');

    // Multi-terminal & native NSPasteboard prompt support in launchAgent
    expect(source).toContain('payload["terminal"] as? String');
    expect(source).toContain('payload["prompt"] as? String');
    expect(source).toContain('NSPasteboard.general');
    expect(source).toContain('"ghostty"');
    expect(source).toContain('"warp"');
    expect(source).toContain('"iterm"');
    expect(source).toContain('"cmux"');
    expect(source).toContain('"wezterm"');
    expect(source).toContain('"kitty"');
    expect(source).toContain('"copiedPrompt"');

    // Preserved legacy actions & self-test JSON contract
    expect(source).toContain('case "getNativeState":');
    expect(source).toContain('case "revealInFinder":');
    expect(source).toContain('"desktopShell":');
    expect(source).toContain('"hasStatusItem":');
    expect(source).toContain('"menuCount":');
    expect(source).toContain('"nativeBridgeVerified":');
    expect(source).toContain('"deepLinkTested":');
    expect(source).toContain('"snapshotBytes":');
  });

  it('supports AppIconMaster.png with sips + iconutil squircle build and procedural fallback in build-macos-app.mjs', async () => {
    const buildScriptPath = path.resolve(process.cwd(), 'scripts', 'build-macos-app.mjs');
    const scriptSource = await fs.readFile(buildScriptPath, 'utf8');

    expect(scriptSource).toContain('AppIconMaster.png');
    expect(scriptSource).toContain('/usr/bin/sips');
    expect(scriptSource).toContain('/usr/bin/iconutil');
    expect(scriptSource).toContain('renderAimakeMasterIconPng');
    expect(scriptSource).toContain('squirclePath');
  });
});
