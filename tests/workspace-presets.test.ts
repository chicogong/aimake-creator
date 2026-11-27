import fs from 'node:fs/promises';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  AGENT_HOST_PRIORITY,
  BEGINNER_TASK_RECIPES,
  buildAgentLaunchInfo,
  CANONICAL_PRESET_SKILL_ORDER,
  configureWorkspaceAgents,
  createWorkspaceDeck,
  detectInstalledAgents,
  detectInstalledTerminals,
  ingestWorkspaceSource,
  initWorkspace,
  inspectWorkspaceSkills,
  launchAgentInWorkspace,
  listPresetSkills,
  listRecentWorkspaces,
  materializeWorkspaceSkills,
  readWorkspaceState,
  registerRecentWorkspace,
  SCENARIO_PRESETS,
  TERMINAL_APP_PRIORITY,
  type WorkspaceScenarioPreset,
} from '../src/workspace/index.js';

let tmpRoot = '';
let isolatedRegistryPath = '';

beforeAll(async () => {
  tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'aimake-ws-test-'));
  isolatedRegistryPath = path.join(tmpRoot, 'isolated-recent-workspaces.json');
});

afterAll(async () => {
  if (tmpRoot) {
    await fs.rm(tmpRoot, { recursive: true, force: true });
  }
});

async function assertNoSymlinksRecursive(dirPath: string): Promise<number> {
  let fileCount = 0;
  const st = await fs.lstat(dirPath);
  expect(st.isSymbolicLink()).toBe(false);
  if (!st.isDirectory()) return 1;

  const entries = await fs.readdir(dirPath);
  for (const entry of entries) {
    const full = path.join(dirPath, entry);
    const childStat = await fs.lstat(full);
    expect(childStat.isSymbolicLink(), `Unexpected symlink at ${full}`).toBe(false);
    if (childStat.isDirectory()) {
      fileCount += await assertNoSymlinksRecursive(full);
    } else if (childStat.isFile()) {
      fileCount++;
    }
  }
  return fileCount;
}

describe('Aimake 2.0 Workspace Presets & Agent Engine', () => {
  it('discovers all 7 bundled closed-loop preset skills with valid frontmatter', async () => {
    const skills = await listPresetSkills();
    expect(skills.map((s) => s.name)).toEqual([...CANONICAL_PRESET_SKILL_ORDER]);
    expect(skills).toHaveLength(7);

    for (const skill of skills) {
      expect(skill.description.length).toBeGreaterThan(20);
      expect(skill.files.some((f) => f.relativePath === 'SKILL.md')).toBe(true);
    }

    const composer = skills.find((s) => s.name === 'aimake-deck-composer');
    expect(composer?.files.some((f) => f.relativePath === 'references/templates.md')).toBe(true);
  });

  it('initializes workspaces across all 4 scenario presets with real files (zero symlinks) and isolated recent registry', async () => {
    const scenarios: WorkspaceScenarioPreset[] = [
      'creator-growth',
      'executive-ppt',
      'product-launch',
      'educator-course',
    ];

    for (const scenario of scenarios) {
      const wsDir = path.join(tmpRoot, `ws-${scenario}`);
      const summary = await initWorkspace(wsDir, {
        name: `Test ${scenario}`,
        scenario,
        registryPath: isolatedRegistryPath,
        cliPath: '/tmp/fake-aimake-cli.js',
      });

      expect(summary.config.scenario).toBe(scenario);
      expect(summary.config.defaultTemplate).toBe(SCENARIO_PRESETS[scenario].defaultTemplate);
      expect(summary.decks.length).toBe(1);
      expect(summary.decks[0].template).toBe(SCENARIO_PRESETS[scenario].defaultTemplate);
      expect(summary.decks[0].slideCount).toBeGreaterThanOrEqual(3);
      expect(summary.skillsStatus.totalPresetSkills).toBe(7);
      expect(summary.skillsStatus.allSynced).toBe(true);
      expect(summary.skillsStatus.zeroSymlinks).toBe(true);

      // Verify both .agents/skills and .claude/skills contain real files, NEVER symlinks
      const agentsFileCount = await assertNoSymlinksRecursive(path.join(wsDir, '.agents', 'skills'));
      const claudeFileCount = await assertNoSymlinksRecursive(path.join(wsDir, '.claude', 'skills'));
      expect(agentsFileCount).toBeGreaterThanOrEqual(8); // 7 SKILL.md + references/templates.md
      expect(claudeFileCount).toBe(agentsFileCount);

      for (const skillName of CANONICAL_PRESET_SKILL_ORDER) {
        const agentSkillMd = path.join(wsDir, '.agents', 'skills', skillName, 'SKILL.md');
        const claudeSkillMd = path.join(wsDir, '.claude', 'skills', skillName, 'SKILL.md');
        expect((await fs.lstat(agentSkillMd)).isSymbolicLink()).toBe(false);
        expect((await fs.lstat(claudeSkillMd)).isSymbolicLink()).toBe(false);
      }
    }

    const recents = await listRecentWorkspaces(isolatedRegistryPath);
    expect(recents).toHaveLength(4);
    expect(recents[0].scenario).toBe('educator-course');
  });

  it('preserves user-customized skill files on non-destructive upgrade via SHA-256 manifest', async () => {
    const wsDir = path.join(tmpRoot, 'ws-safe-upgrade');
    await initWorkspace(wsDir, {
      name: 'Safe Upgrade Lab',
      scenario: 'creator-growth',
      cliPath: '/tmp/aimake-cli.js',
    });

    const humanizerPath = path.join(wsDir, '.agents', 'skills', 'aimake-humanizer', 'SKILL.md');
    const customRule = '\n## Custom Brand Rule\n- Never use exclamation marks in headlines.\n';
    const originalContent = await fs.readFile(humanizerPath, 'utf8');
    await fs.writeFile(humanizerPath, `${originalContent}${customRule}`, 'utf8');

    // Re-materialize without force -> must preserve user's edited skill!
    const rerun = await materializeWorkspaceSkills(wsDir, {
      includeClaude: true,
      scenario: 'creator-growth',
      workspaceName: 'Safe Upgrade Lab',
    });

    expect(rerun.preservedCustomFiles).toContain('.agents/skills/aimake-humanizer/SKILL.md');
    expect(rerun.writtenFiles).not.toContain('.agents/skills/aimake-humanizer/SKILL.md');
    expect(rerun.skippedUnchanged).toContain('.agents/skills/aimake-workspace-pilot/SKILL.md');

    const afterDisk = await fs.readFile(humanizerPath, 'utf8');
    expect(afterDisk).toContain('Custom Brand Rule');

    // Inspect reports customized for aimake-humanizer and synced for the other 6
    const inspection = await inspectWorkspaceSkills(wsDir);
    expect(inspection.zeroSymlinks).toBe(true);
    expect(inspection.allSynced).toBe(false);
    const humanizerStatus = inspection.skills.find((s) => s.name === 'aimake-humanizer');
    expect(humanizerStatus?.status).toBe('customized');
    expect(humanizerStatus?.customizedFiles).toContain('.agents/skills/aimake-humanizer/SKILL.md');
    const pilotStatus = inspection.skills.find((s) => s.name === 'aimake-workspace-pilot');
    expect(pilotStatus?.status).toBe('synced');

    // Simulate an unmodified outdated skill (disk matches recorded manifest hash, differs from bundled source)
    const intakeRel = '.agents/skills/aimake-intake/SKILL.md';
    const intakeAbs = path.join(wsDir, ...intakeRel.split('/'));
    const oldVersionText = '---\nname: aimake-intake\ndescription: Old v1\n---\nOld content\n';
    await fs.writeFile(intakeAbs, oldVersionText, 'utf8');
    const manifestPath = path.join(wsDir, '.aimake', 'skill-manifest.json');
    const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
    const crypto = await import('node:crypto');
    manifest.files[intakeRel].sha256 = crypto
      .createHash('sha256')
      .update(oldVersionText, 'utf8')
      .digest('hex');
    await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');

    const outdatedInspect = await inspectWorkspaceSkills(wsDir);
    expect(outdatedInspect.skills.find((s) => s.name === 'aimake-intake')?.status).toBe('outdated');

    const upgraded = await materializeWorkspaceSkills(wsDir, {
      includeClaude: true,
      scenario: 'creator-growth',
      workspaceName: 'Safe Upgrade Lab',
    });
    expect(upgraded.writtenFiles).toContain(intakeRel);
    expect(upgraded.preservedCustomFiles).toContain('.agents/skills/aimake-humanizer/SKILL.md');

    // Force mode resets customized file cleanly
    const forced = await materializeWorkspaceSkills(wsDir, {
      includeClaude: true,
      force: true,
      scenario: 'creator-growth',
      workspaceName: 'Safe Upgrade Lab',
    });
    expect(forced.writtenFiles).toContain('.agents/skills/aimake-humanizer/SKILL.md');
    expect(forced.preservedCustomFiles).toHaveLength(0);
    expect((await inspectWorkspaceSkills(wsDir)).allSynced).toBe(true);
  });

  it('generates all 5 workspace-local agent MCP configs, OpenCode plugin, AGENTS.md, and CLAUDE.md', async () => {
    const wsDir = path.join(tmpRoot, 'ws-agent-configs');
    const cliPath = '/tmp/aimake-test-dist-cli.js';
    const configured = await configureWorkspaceAgents(wsDir, {
      cliPath,
      scenario: 'product-launch',
      workspaceName: 'Launch Room',
    });

    expect(configured.writtenConfigs).toEqual(
      expect.arrayContaining([
        'opencode.json',
        '.opencode/plugin/aimake-live-sync.js',
        '.mcp.json',
        '.codex/config.toml',
        '.workbuddy/mcp.json',
        '.agents/mcp_config.json',
      ])
    );

    const opencodeJson = JSON.parse(await fs.readFile(path.join(wsDir, 'opencode.json'), 'utf8'));
    expect(opencodeJson.mcp.aimake.command).toEqual(['node', cliPath, 'mcp']);
    expect(opencodeJson.skills).toEqual(['.agents/skills']);
    expect(opencodeJson.permission.skill).toEqual({ '*': 'allow' });

    const claudeMcp = JSON.parse(await fs.readFile(path.join(wsDir, '.mcp.json'), 'utf8'));
    expect(claudeMcp.mcpServers.aimake.args).toEqual([cliPath, 'mcp']);

    const workbuddyMcp = JSON.parse(
      await fs.readFile(path.join(wsDir, '.workbuddy', 'mcp.json'), 'utf8')
    );
    expect(workbuddyMcp.mcpServers.aimake.command).toBe('node');

    const agyMcp = JSON.parse(
      await fs.readFile(path.join(wsDir, '.agents', 'mcp_config.json'), 'utf8')
    );
    expect(agyMcp.mcpServers.aimake.args).toEqual([cliPath, 'mcp']);

    const codexToml = await fs.readFile(path.join(wsDir, '.codex', 'config.toml'), 'utf8');
    expect(codexToml).toContain('[mcp_servers.aimake]');
    expect(codexToml).toContain(`args = ["${cliPath}", "mcp"]`);

    const agentsMd = await fs.readFile(path.join(wsDir, 'AGENTS.md'), 'utf8');
    expect(agentsMd).toContain('Launch Room');
    expect(agentsMd).toContain('aimake-workspace-pilot');

    const claudeMd = await fs.readFile(path.join(wsDir, 'CLAUDE.md'), 'utf8');
    expect(claudeMd).toContain('@AGENTS.md');
    expect(claudeMd.trim().split('\n').length).toBeLessThanOrEqual(4);

    // OpenCode plugin must be copied as a real file (not symlink)
    const pluginStat = await fs.lstat(path.join(wsDir, '.opencode', 'plugin', 'aimake-live-sync.js'));
    expect(pluginStat.isSymbolicLink()).toBe(false);
    expect(pluginStat.isFile()).toBe(true);
  });

  it('supports readWorkspaceState, createWorkspaceDeck, ingestWorkspaceSource, and recent registry updates', async () => {
    const wsDir = path.join(tmpRoot, 'ws-end-to-end');
    await initWorkspace(wsDir, {
      name: 'E2E Pipeline Studio',
      scenario: 'product-launch',
      seedStarterDeck: false,
      cliPath: '/tmp/aimake-cli.js',
    });

    const initial = await readWorkspaceState(wsDir);
    expect(initial.decks).toHaveLength(0);
    expect(initial.pipeline.currentStage).toBe('intake');

    // 1. Ingest a source -> writes sources/*.md and indexes into wiki/
    const ingested = await ingestWorkspaceSource(wsDir, {
      title: 'Aimake 2.0 Architecture Notes',
      content: 'Aimake 2.0 runs 100% locally with <100ms live stage sync and 22 built-in templates.',
      sourceUrl: 'https://aimake.cc/architecture',
      tags: ['architecture', 'local-first'],
    });
    expect(ingested.relativeSourcePath).toMatch(/^sources\/.*\.md$/);
    const savedSource = await fs.readFile(ingested.sourcePath, 'utf8');
    expect(savedSource).toContain('https://aimake.cc/architecture');
    expect(await fs.readFile(ingested.wikiIngest.wikiPath, 'utf8')).toContain('<100ms live stage sync');

    // 2. Create a new deck -> auto-detects 16:9 aspect for ppt-consulting-matrix
    const created = await createWorkspaceDeck(wsDir, {
      title: 'Q4 Product Architecture Review',
      template: 'ppt-consulting-matrix',
      locale: 'zh-CN',
    });
    expect(created.relativePath).toBe('decks/q4-product-architecture-review.deck.md');
    expect(created.deck.frontmatter.aspect).toBe('16:9');
    expect(created.deck.slides).toHaveLength(3);

    // 3. Re-read workspace state and verify pipeline progression
    const afterDeck = await readWorkspaceState(wsDir);
    expect(afterDeck.sources.length).toBe(1);
    expect(afterDeck.wikiPages.length).toBeGreaterThanOrEqual(1); // ingested wiki card
    expect(afterDeck.decks.length).toBe(1);
    expect(afterDeck.decks[0].title).toBe('Q4 Product Architecture Review');
    expect(afterDeck.decks[0].aspect).toBe('16:9');
    expect(afterDeck.pipeline.currentStage).toBe('stage');
    expect(afterDeck.pipeline.flywheelStage).toBe('create');
    expect(afterDeck.pipeline.create?.count).toBe(1);

    // 4. Add an export file -> pipeline moves to deliver (flywheel: publish)
    await fs.writeFile(path.join(wsDir, 'exports', 'q4-review.pptx'), 'stub-pptx', 'utf8');
    const afterExport = await readWorkspaceState(wsDir);
    expect(afterExport.exports).toHaveLength(1);
    expect(afterExport.exports[0].format).toBe('pptx');
    expect(afterExport.pipeline.currentStage).toBe('deliver');
    expect(afterExport.pipeline.flywheelStage).toBe('publish');
    expect(afterExport.pipeline.publish?.count).toBe(1);
    expect(afterExport.pipeline.flywheel).toHaveLength(4);

    // 5. Register recent workspace in isolated registry
    const updatedRecents = await registerRecentWorkspace(
      wsDir,
      'E2E Pipeline Studio',
      isolatedRegistryPath,
      'product-launch'
    );
    expect(updatedRecents[0].path).toBe(path.resolve(wsDir));
    expect(updatedRecents[0].name).toBe('E2E Pipeline Studio');
  });

  it('detects installed agents in canonical priority order and builds accurate launch instructions', async () => {
    const detected = await detectInstalledAgents();
    expect(detected.map((d) => d.id)).toEqual([...AGENT_HOST_PRIORITY]);

    // Verify GUI vs terminal-cli launchMode separation and plain Chinese beginner hints (no .agents/skills jargon)
    const byId = new Map(detected.map((d) => [d.id, d]));
    expect(byId.get('workbuddy')?.launchMode).toBe('gui-app');
    expect(byId.get('agy')?.launchMode).toBe('gui-app');
    expect(byId.get('cursor')?.launchMode).toBe('gui-app');
    expect(byId.get('claude-desktop')?.launchMode).toBe('gui-app');
    expect(byId.get('opencode')?.launchMode).toBe('terminal-cli');
    expect(byId.get('claude')?.launchMode).toBe('terminal-cli');
    expect(byId.get('codex')?.launchMode).toBe('terminal-cli');
    for (const host of detected) {
      expect(host.beginnerHintZh.length).toBeGreaterThan(8);
      expect(host.beginnerHintZh).not.toContain('.agents/skills');
    }

    const wsDir = path.join(tmpRoot, 'ws-launch');
    const launchInfo = buildAgentLaunchInfo(wsDir, 'opencode', {
      activeDeckRel: 'decks/launch.deck.md',
    });
    expect(launchInfo.host).toBe('opencode');
    expect(launchInfo.launchMode).toBe('terminal-cli');
    expect(launchInfo.command).toContain(`cd "${path.resolve(wsDir)}" && opencode`);
    expect(launchInfo.starterPromptZh).toContain('decks/launch.deck.md');
    expect(launchInfo.starterPromptZh).toContain('aimake-workspace-pilot');
    expect(launchInfo.starterPromptEn).toContain('decks/launch.deck.md');

    const dryRun = await launchAgentInWorkspace(wsDir, 'claude', { dryRun: true });
    expect(dryRun.dryRun).toBe(true);
    expect(dryRun.launched).toBe(false);
    expect(dryRun.launchMode).toBe('terminal-cli');
    expect(dryRun.copiedPrompt).toBe(false);
    expect(dryRun.info.command).toContain('claude');
  });

  it('detects macOS terminals, exposes 4 beginner task recipes, and supports multi-terminal + GUI dry-run launches', async () => {
    // 1. Default terminal detection returns all 7 terminals in priority order
    const terminals = await detectInstalledTerminals();
    expect(terminals.map((t) => t.id)).toEqual([...TERMINAL_APP_PRIORITY]);
    expect(terminals).toHaveLength(7);
    if (process.platform === 'darwin') {
      const systemTerminal = terminals.find((t) => t.id === 'terminal');
      expect(systemTerminal?.installed).toBe(true);
      expect(systemTerminal?.appPath).toContain('Terminal.app');
    }

    // 2. Isolated mock Applications directory detection (never touches real ~/)
    const mockAppsDir = path.join(tmpRoot, 'mock-applications');
    await fs.mkdir(path.join(mockAppsDir, 'Ghostty.app'), { recursive: true });
    await fs.mkdir(path.join(mockAppsDir, 'Warp.app'), { recursive: true });
    const mockTerminals = await detectInstalledTerminals({ applicationsDir: mockAppsDir });
    if (process.platform === 'darwin') {
      expect(mockTerminals.find((t) => t.id === 'ghostty')?.installed).toBe(true);
      expect(mockTerminals.find((t) => t.id === 'warp')?.installed).toBe(true);
      expect(mockTerminals.find((t) => t.id === 'kitty')?.installed).toBe(false);
    }

    // 3. Verify 5 beginner task recipes
    expect(BEGINNER_TASK_RECIPES.map((r) => r.id)).toEqual([
      'xhs-viral',
      'apple-bento-ppt',
      'short-video-polish',
      'trending-wechat',
      'operations-recap',
    ]);
    for (const recipe of BEGINNER_TASK_RECIPES) {
      expect(recipe.titleZh.length).toBeGreaterThan(6);
      expect(recipe.subtitleZh.length).toBeGreaterThan(8);
      expect(recipe.badgeZh.length).toBeGreaterThan(1);
      expect(recipe.promptZh.length).toBeGreaterThan(20);
      expect(recipe.recommendedTemplate.length).toBeGreaterThan(3);
    }

    // 4. Multi-terminal CLI dry-run launch with Ghostty + xhs-viral recipe
    const wsDir = path.join(tmpRoot, 'ws-ghostty-launch');
    const ghosttyDryRun = await launchAgentInWorkspace(wsDir, 'opencode', {
      terminal: 'ghostty',
      recipeId: 'xhs-viral',
      dryRun: true,
    });
    expect(ghosttyDryRun.dryRun).toBe(true);
    expect(ghosttyDryRun.launched).toBe(false);
    expect(ghosttyDryRun.launchMode).toBe('terminal-cli');
    expect(ghosttyDryRun.terminalUsed).toBe('ghostty');
    expect(ghosttyDryRun.copiedPrompt).toBe(false);
    expect(ghosttyDryRun.info.terminal).toBe('ghostty');
    expect(ghosttyDryRun.info.recipeId).toBe('xhs-viral');
    expect(ghosttyDryRun.info.terminalLaunchHint).toContain('Ghostty');
    expect(ghosttyDryRun.info.starterPromptZh).toContain('把素材变成 6 页爆款小红书图文');
    expect(ghosttyDryRun.info.starterPromptZh).toContain('xhs-swiss-grid');

    // 5. GUI desktop AI app dry-run launch (no terminal needed)
    const guiDryRun = await launchAgentInWorkspace(wsDir, 'agy', {
      recipeId: 'apple-bento-ppt',
      dryRun: true,
    });
    expect(guiDryRun.dryRun).toBe(true);
    expect(guiDryRun.launchMode).toBe('gui-app');
    expect(guiDryRun.terminalUsed).toBeUndefined();
    expect(guiDryRun.copiedPrompt).toBe(false);
    expect(guiDryRun.info.terminalLaunchHint).toContain('open -a "Antigravity"');
    expect(guiDryRun.info.starterPromptZh).toContain('一键改写成 16:9 苹果便当盒 PPT');
  });

  it('OpenCode live sync plugin fails silently when Studio is closed and posts loopback event when Studio is running', async () => {
    const pluginModule = await import('../integrations/opencode-plugin/aimake-live-sync.js');
    const wsDir = path.join(tmpRoot, 'ws-plugin-sync');
    await fs.mkdir(path.join(wsDir, '.aimake'), { recursive: true });

    // 1. Studio closed (no studio-runtime.json) -> returns false cleanly without throwing
    const closedResult = await pluginModule.notifyAimakeStudio(wsDir, {
      type: 'deck:updated',
      deckPath: 'decks/demo.deck.md',
    });
    expect(closedResult).toBe(false);

    // 2. Spin up local loopback server simulating Aimake Studio
    const received: Array<Record<string, unknown>> = [];
    const server = http.createServer((req, res) => {
      if (req.method === 'POST' && req.url === '/api/events/notify') {
        let body = '';
        req.on('data', (chunk) => (body += chunk.toString('utf8')));
        req.on('end', () => {
          received.push(JSON.parse(body));
          res.writeHead(200, { 'content-type': 'application/json' });
          res.end(JSON.stringify({ ok: true }));
        });
        return;
      }
      res.writeHead(404);
      res.end();
    });

    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    const addr = server.address();
    const port = typeof addr === 'object' && addr ? addr.port : 0;

    try {
      await fs.writeFile(
        path.join(wsDir, '.aimake', 'studio-runtime.json'),
        JSON.stringify({ port, workspaceDir: wsDir }),
        'utf8'
      );

      const hooks = await pluginModule.AimakeLiveSyncPlugin({ directory: wsDir });
      await hooks['tool.execute.after'](
        {
          tool: 'edit',
          args: { filePath: path.join(wsDir, 'decks', 'launch.deck.md'), slideIndex: 2 },
        },
        {}
      );

      // Give fire-and-forget loopback fetch a moment to complete
      await new Promise((r) => setTimeout(r, 120));
      expect(received.length).toBe(1);
      expect(received[0].type).toBe('deck:updated');
      expect(received[0].deckPath).toBe('decks/launch.deck.md');
      expect(received[0].slideIndex).toBe(2);
      expect(received[0].source).toBe('opencode-plugin');
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });
});
