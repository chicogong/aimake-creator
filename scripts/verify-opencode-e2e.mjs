import { execFile, spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');

async function verifyZeroSymlinks(dirPath) {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dirPath, entry.name);
    const st = await fs.lstat(full);
    if (st.isSymbolicLink()) {
      throw new Error(`Unexpected symlink found inside workspace: ${full}`);
    }
    if (st.isDirectory()) {
      await verifyZeroSymlinks(full);
    }
  }
}

async function main() {
  const cliPath = path.join(REPO_ROOT, 'dist', 'cli.js');
  await fs.access(cliPath);

  const { stdout: ocVer } = await execFileAsync('opencode', ['--version'], { timeout: 5000 });
  console.log(`[OpenCode E2E] Detected binary: ${ocVer.trim()}`);

  const sandboxWs = path.join(REPO_ROOT, '.aimake-tmp', 'opencode-ws-e2e');
  await fs.rm(sandboxWs, { recursive: true, force: true });

  // 1. Initialize an isolated Aimake 2.0 Creator Workspace (ZERO symlinks, ZERO ~/ writes!)
  await execFileAsync('node', [
    cliPath,
    'workspace',
    'init',
    sandboxWs,
    '--name',
    'OpenCode 联动验收工作区',
    '--scenario',
    'product-launch',
    '--json',
  ]);

  // Verify 7 preset skills materialized as REAL files inside .agents/skills/ (0 symlinks!)
  await verifyZeroSymlinks(path.join(sandboxWs, '.agents', 'skills'));
  const skillDirs = await fs.readdir(path.join(sandboxWs, '.agents', 'skills'));
  if (skillDirs.length < 7) {
    throw new Error(`Expected >= 7 materialized preset skills, found ${skillDirs.length}`);
  }
  console.log(`[OpenCode E2E] Verified ${skillDirs.length} materialized workspace skills (0 symlinks).`);

  // Seed our test deck inside workspace/decks/
  const targetDeck = path.join(sandboxWs, 'decks', 'launch-story.deck.md');
  await fs.copyFile(
    path.join(REPO_ROOT, 'examples', 'zh-creator-flywheel.deck.md'),
    targetDeck
  );

  // 2. Boot Aimake 2.0 Studio Server attached to this workspace & listen to SSE live-sync stream!
  const { startStudioServer } = await import(path.join(REPO_ROOT, 'dist', 'index.js'));
  const studio = await startStudioServer({
    deckPath: targetDeck,
    workspaceDir: sandboxWs,
    vaultDir: path.join(sandboxWs, 'wiki'),
    exportBaseDir: path.join(sandboxWs, 'exports'),
    registryPath: path.join(sandboxWs, '.aimake', 'test-recent.json'),
  });

  const sseEvents = [];
  const sseReq = http.get(`${studio.url}/api/events`, (res) => {
    res.on('data', (chunk) => {
      const text = chunk.toString('utf8');
      for (const line of text.split('\n')) {
        if (line.startsWith('data: ')) {
          try {
            sseEvents.push(JSON.parse(line.slice(6)));
          } catch {
            // ignore partial chunk
          }
        }
      }
    });
  });

  try {
    // Wait briefly for SSE connection
    await new Promise((r) => setTimeout(r, 250));

    const prompt = [
      'You are running inside an Aimake 2.0 Creator Workspace where .agents/skills/ and opencode.json were auto-loaded.',
      `Execute these exact workspace end-to-end steps using the local Aimake CLI (${cliPath}):`,
      `1. node "${cliPath}" workspace status . --json`,
      `2. node "${cliPath}" remix xhs-warm-magazine@1.0.0 --deck ./decks/launch-story.deck.md -o ./decks/launch-story.deck.md --humanize --json`,
      `3. node "${cliPath}" render ./decks/launch-story.deck.md -f png -o ./exports/png --json`,
      `4. node "${cliPath}" render ./decks/launch-story.deck.md -t ppt-consulting-matrix -f pptx -o ./exports/launch.pptx --json`,
      'After all 4 commands succeed, reply concisely containing OPENCODE_AIMAKE_2_0_E2E_PASS.',
    ].join('\n');

    console.log('[OpenCode E2E] Launching opencode inside isolated workspace cwd ...');
    const started = Date.now();
    const { code, stdout, stderr } = await new Promise((resolve) => {
      const child = spawn(
        'opencode',
        [
          'run',
          '--standalone',
          '--archived',
          '--auto',
          '--format',
          'json',
          '-m',
          'opencode/hy4-flash-free',
          prompt,
        ],
        { cwd: sandboxWs, stdio: ['ignore', 'pipe', 'pipe'] }
      );
      let out = '';
      let err = '';
      const timer = setTimeout(() => child.kill('SIGTERM'), 120_000);
      child.stdout.on('data', (d) => (out += d.toString('utf8')));
      child.stderr.on('data', (d) => (err += d.toString('utf8')));
      child.on('close', (exitCode) => {
        clearTimeout(timer);
        resolve({ code: exitCode ?? 1, stdout: out, stderr: err });
      });
    });

    const elapsedMs = Date.now() - started;
    if (code !== 0) {
      console.error(`[OpenCode E2E] OpenCode exited with code ${code}\nSTDERR:\n${stderr.slice(-800)}`);
      process.exit(1);
    }

    // Allow SSE debounce to flush
    await new Promise((r) => setTimeout(r, 300));

    // Verify all on-disk closed-loop artifacts!
    const remixedMd = await fs.readFile(targetDeck, 'utf8');
    if (!remixedMd.includes('template: xhs-warm-magazine') || !remixedMd.includes('为什么纯本地 LLM Wiki')) {
      throw new Error('decks/launch-story.deck.md was not remixed with xhs-warm-magazine while preserving copy');
    }

    const pngBuf = await fs.readFile(path.join(sandboxWs, 'exports', 'png', 'slide-01.png'));
    if (pngBuf.subarray(0, 4).toString('hex') !== '89504e47') {
      throw new Error('Invalid PNG header on OpenCode-rendered exports/png/slide-01.png');
    }

    const { stdout: slideXml } = await execFileAsync('unzip', [
      '-p',
      path.join(sandboxWs, 'exports', 'launch.pptx'),
      'ppt/slides/slide1.xml',
    ]);
    if (!slideXml.includes('<a:t>')) {
      throw new Error('OpenCode-rendered exports/launch.pptx missing editable <a:t> XML nodes');
    }

    const liveChangeEvents = sseEvents.filter(
      (ev) => ev.type === 'deck-changed' || ev.type === 'stage-focus' || ev.type === 'workspace-changed'
    );
    if (liveChangeEvents.length === 0) {
      throw new Error('Expected Aimake Studio SSE stream to receive live workspace/deck change events from OpenCode!');
    }

    const report = {
      ok: true,
      opencodeVersion: ocVer.trim(),
      elapsedMs,
      materializedSkillsCount: skillDirs.length,
      zeroSymlinksVerified: true,
      liveSseEventsReceived: liveChangeEvents.length,
      verifiedArtifacts: {
        remixedDeck: 'decks/launch-story.deck.md (xhs-warm-magazine, humanized)',
        pngBytes: pngBuf.length,
        pptxEditableXmlVerified: true,
      },
      markerFound: stdout.includes('OPENCODE_AIMAKE_2_0_E2E_PASS'),
    };
    console.log(JSON.stringify(report, null, 2));
  } finally {
    sseReq.destroy();
    await studio.close();
  }
}

main().catch((err) => {
  console.error('[OpenCode E2E] FAILED:', err);
  process.exit(1);
});
