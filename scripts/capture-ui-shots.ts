import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { launchSmartBrowser } from '../src/renderer/exporter-media.js';
import { startStudioServer } from '../src/studio/studio-server.js';

async function main() {
  const phase = process.argv[2] || 'before';
  const outDir = path.resolve(process.cwd(), 'test-results/screenshots');
  await fs.mkdir(outDir, { recursive: true });

  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'aimake-shot-'));
  const deckPath = path.join(tmpDir, 'deck.md');
  const srcExample = path.resolve(process.cwd(), 'examples/zh-creator-flywheel.deck.md');
  await fs.copyFile(srcExample, deckPath);

  const studio = await startStudioServer({
    deckPath,
    workspaceDir: tmpDir,
    registryPath: path.join(tmpDir, 'recent-workspaces.json'),
  });

  const browser = await launchSmartBrowser();
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });

  try {
    // 1. Studio Canvas
    const page = await context.newPage();
    await page.goto(studio.url);
    await page.waitForSelector('#workspace-name-label');
    await page.waitForTimeout(1000);
    const studioShot = path.join(outDir, `studio-${phase}.png`);
    await page.screenshot({ path: studioShot, fullPage: false });
    console.log(`Studio shot captured: ${studioShot}`);

    // 2. Studio Export Drawer
    await page.locator('#btn-open-export').click();
    await page.waitForTimeout(500);
    const studioExportShot = path.join(outDir, `studio-export-${phase}.png`);
    await page.screenshot({ path: studioExportShot, fullPage: false });
    console.log(`Studio export shot captured: ${studioExportShot}`);

    // 3. Web Playground
    const playgroundPage = await context.newPage();
    const playgroundFile = path.resolve(process.cwd(), 'dist-site/playground/index.html');
    await playgroundPage.goto(`file://${playgroundFile}`);
    await playgroundPage.waitForSelector('.pg-brand strong');
    await playgroundPage.waitForTimeout(1000);
    const playgroundShot = path.join(outDir, `playground-${phase}.png`);
    await playgroundPage.screenshot({ path: playgroundShot, fullPage: false });
    console.log(`Playground shot captured: ${playgroundShot}`);
  } finally {
    await browser.close();
    await studio.close();
    await fs.rm(tmpDir, { recursive: true, force: true });
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
