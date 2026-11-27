import { execFile } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { test, expect } from '@playwright/test';
import { startStudioServer } from '../../src/studio/studio-server.js';
import { initWorkspace } from '../../src/workspace/index.js';

const execFileAsync = promisify(execFile);

test('Aimake 2.0 Calm Workspace E2E: Materialized Preset Skills (0 Symlinks), Visual Gallery One-Click Remix, Intake, Media 206 Range & AI Launcher', async ({
  page,
}) => {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'aimake-calm2-e2e-'));
  const wsDir = path.join(tmpDir, 'launch-ws');
  const registryPath = path.join(tmpDir, 'recent.json');
  const cliPath = path.resolve(process.cwd(), 'dist', 'cli.js');

  await initWorkspace(wsDir, {
    name: '2026 新品发布工作区',
    scenario: 'product-launch',
    locale: 'zh-CN',
    cliPath,
    registryPath,
    registerRecent: true,
  });

  const deckPath = path.join(wsDir, 'decks', 'story.deck.md');
  await fs.copyFile(
    path.resolve(process.cwd(), 'examples/zh-creator-flywheel.deck.md'),
    deckPath
  );

  const studio = await startStudioServer({
    deckPath,
    workspaceDir: wsDir,
    vaultDir: path.join(wsDir, 'wiki'),
    exportBaseDir: path.join(wsDir, 'exports'),
    registryPath,
  });

  try {
    await page.goto(studio.url);
    await expect(page.locator('#workspace-name-label')).toContainText('2026 新品发布工作区');
    await expect(page.locator('#preset-skill-summary')).toContainText('7/7 预设 Skill 就绪');

    // 1. Inspect Preset Skills Modal -> verify zero symlinks & all 7 closed-loop skills!
    await page.locator('#btn-open-skills').click();
    await expect(page.locator('#modal-skills')).toHaveClass(/open/);
    await expect(page.locator('#skills-zero-symlink-note')).toContainText('0 软链接');
    await expect(page.locator('#skills-inspector-list .agent-row')).toHaveCount(7);
    await page.keyboard.press('Escape');

    // 2. Intake source via closed-loop step ① 素材
    await page.locator('[data-loop-step="intake"]').click();
    await expect(page.locator('#drawer-polish')).toHaveClass(/open/);
    const intakeRes = await page.request.post(`${studio.url}/api/workspace/source/ingest`, {
      data: {
        title: '新品发布会实录',
        content: '纯本地端到端闭环工作区，7 大预设 Skill 零全局污染。',
      },
    });
    expect(intakeRes.ok()).toBeTruthy();

    // 3. Open Visual Template Gallery -> Install pack + One-Click Remix (一键做同款)
    await page.locator('#btn-open-gallery').click();
    await expect(page.locator('#drawer-gallery')).toHaveClass(/open/);

    const installRes = await page.request.post(`${studio.url}/api/market/install`, {
      data: { itemId: 'pack-solopreneur-cn@1.0.0' },
    });
    expect(installRes.ok()).toBeTruthy();
    const installJson = await installRes.json();
    expect(installJson.installedRecords.length).toBeGreaterThanOrEqual(5);

    const remixBtn = page.locator('[data-remix-template="xhs-warm-magazine"]').first();
    await expect(remixBtn).toBeVisible();
    await remixBtn.click();
    await expect(page.locator('#toast')).toContainText('xhs-warm-magazine');

    const remixedRaw = await fs.readFile(deckPath, 'utf8');
    expect(remixedRaw).toContain('template: xhs-warm-magazine');
    expect(remixedRaw).toContain('为什么纯本地 LLM Wiki'); // User content preserved!

    // 4. Export Narrated MP4 (offline-fixture) and verify HTTP 206 Range streaming!
    const mp4Res = await page.request.post(`${studio.url}/api/export`, {
      data: { format: 'mp4', narrate: 'offline-fixture' },
    });
    expect(mp4Res.ok()).toBeTruthy();

    const mediaListRes = await page.request.get(`${studio.url}/api/media`);
    const mediaList = await mediaListRes.json();
    const mp4Item = (mediaList.items || []).find((f: { rel: string }) =>
      f.rel.endsWith('.mp4')
    );
    expect(mp4Item).toBeTruthy();

    const rangeRes = await page.request.get(
      `${studio.url}/api/media/file?rel=${encodeURIComponent(mp4Item.rel)}`,
      { headers: { Range: 'bytes=0-31' } }
    );
    expect(rangeRes.status()).toBe(206);
    expect(rangeRes.headers()['accept-ranges']).toBe('bytes');

    // 5. Beginner-Friendly AI Studio & Terminal Picker Popover
    await page.locator('#btn-open-ai').click();
    await expect(page.locator('#popover-ai')).toHaveClass(/open/);
    await expect(page.locator('#ai-recipe-grid .recipe-chip')).toHaveCount(5);
    await expect(page.locator('#terminal-picker-strip .term-pill')).toHaveCount(7);
    await expect(page.locator('#agent-gui-list .agent-row')).toHaveCount(4);
    await expect(page.locator('#agent-cli-list .agent-row')).toHaveCount(3);

    // Click a beginner recipe & pick Terminal
    await page.locator('#ai-recipe-grid .recipe-chip').first().click();
    await expect(page.locator('#ai-recipe-grid .recipe-chip').first()).toHaveClass(/active/);
    await page.locator('[data-pick-terminal="ghostty"]').click();
    await expect(page.locator('[data-pick-terminal="ghostty"]')).toHaveClass(/active/);

    const dryLaunch = await page.request.post(`${studio.url}/api/workspace/agents/launch`, {
      data: { host: 'opencode', terminal: 'ghostty', recipeId: 'xhs-viral', dryRun: true },
    });
    expect(dryLaunch.ok()).toBeTruthy();
    const dryLaunchJson = await dryLaunch.json();
    expect(dryLaunchJson.command).toContain('opencode');
    expect(dryLaunchJson.terminalUsed).toBe('ghostty');

    // Close popover -> test Custom New Deck Modal (Zero window.prompt!) & Stage + Add Slide
    await page.keyboard.press('Escape');
    await page.locator('#btn-new-deck').click();
    await expect(page.locator('#modal-new-deck')).toHaveClass(/open/);
    await page.locator('#new-deck-title').fill('2026 交互体验实测作品');
    await page.locator('[data-new-tpl="apple-bento-launch"]').click();
    await page.locator('#btn-confirm-new-deck').click();
    await expect(page.locator('#toast')).toContainText('2026 交互体验实测作品');

    const initialPills = await page.locator('#slide-pills .slide-pill').count();
    await page.locator('#btn-add-slide').click();
    await expect(page.locator('#slide-pills .slide-pill')).toHaveCount(initialPills + 1);

    // 6. 2026 Trending Showcase Works -> verify 6 timely works & 1-click import!
    await page.locator('#btn-open-trending').click();
    await expect(page.locator('#drawer-gallery')).toHaveClass(/open/);
    await expect(page.locator('#gallery-trending-grid .tpl-card')).toHaveCount(6);
    await page.locator('[data-import-trending="2026-ai-agents-shift"]').click();
    await expect(page.locator('#toast')).toContainText('已导入时事热点作品');

    // 7. Command Palette (⌘K) appearance switching (Light / Dark / System)
    await page.locator('#btn-open-cmdk').click();
    await expect(page.locator('#modal-cmdk')).toHaveClass(/open/);
    await page.locator('#cmdk-input').fill('浅色');
    await page.locator('#cmdk-list .cmdk-item').first().click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');

    // 8. Security guardrail: Reject spoofed Host header
    const spoofedRes = await page.request.get(`${studio.url}/api/state`, {
      headers: { Host: 'evil.example.com' },
    });
    expect(spoofedRes.status()).toBe(400);
  } finally {
    await studio.close();
    await fs.rm(tmpDir, { recursive: true, force: true });
  }
});

test('Native macOS Aimake.app binary E2E: codesign verification, system-synced appearance, WKWebView load, NSStatusBar tray, aimake:// deep link & Retina snapshot', async () => {
  if (process.platform !== 'darwin') {
    test.skip();
    return;
  }

  const appDir = path.resolve(process.cwd(), 'dist-desktop', 'Aimake.app');
  const appBin = path.join(appDir, 'Contents', 'MacOS', 'Aimake');
  const cliPath = path.resolve(process.cwd(), 'dist', 'cli.js');

  await fs.access(appBin);
  await execFileAsync('/usr/bin/codesign', ['--verify', '--deep', '--strict', appDir]);
  await execFileAsync('/usr/bin/plutil', ['-lint', path.join(appDir, 'Contents', 'Info.plist')]);

  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'aimake-native-app-e2e-'));
  const deckPath = path.join(tmpDir, 'native.deck.md');
  const reportPath = path.join(tmpDir, 'native-report.json');
  await fs.copyFile(
    path.resolve(process.cwd(), 'examples/zh-creator-flywheel.deck.md'),
    deckPath
  );

  try {
    await execFileAsync(
      appBin,
      [
        '--cli',
        cliPath,
        '--deck',
        deckPath,
        '--workspace',
        tmpDir,
        '--self-test-json',
        reportPath,
      ],
      { timeout: 30_000 }
    );

    const report = JSON.parse(await fs.readFile(reportPath, 'utf8'));
    expect(report.ok).toBe(true);
    expect(report.desktopShell).toBe('appkit-wkwebview');
    expect(report.hasStatusItem).toBe(true);
    expect(report.menuCount).toBeGreaterThanOrEqual(4);
    expect(report.nativeBridgeVerified).toBe(true);
    expect(report.deepLinkTested).toBe(true);
    expect(report.snapshotBytes).toBeGreaterThan(10_000);
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true });
  }
});
