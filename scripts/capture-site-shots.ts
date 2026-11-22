import fs from 'node:fs/promises';
import path from 'node:path';
import { launchSmartBrowser } from '../src/renderer/exporter-media.js';

async function main() {
  const outDir = path.resolve(process.cwd(), 'test-results/screenshots');
  await fs.mkdir(outDir, { recursive: true });

  const browser = await launchSmartBrowser();
  const context = await browser.newContext({ viewport: { width: 1440, height: 960 } });
  const page = await context.newPage();

  const siteFile = path.resolve(process.cwd(), 'dist-site/index.html');
  await page.goto('file://' + siteFile);
  await page.waitForSelector('.hero h1');
  await page.waitForTimeout(1000);

  // 1. Website Hero & Compiler Stage
  const heroShot = path.join(outDir, 'website-hero-overhaul.png');
  await page.screenshot({ path: heroShot, fullPage: false });
  console.log('Hero shot captured:', heroShot);

  // 2. Bento Grid Flywheel
  await page.locator('#flywheel').scrollIntoViewIfNeeded();
  await page.waitForTimeout(600);
  const bentoShot = path.join(outDir, 'website-bento-flywheel.png');
  await page.screenshot({ path: bentoShot, fullPage: false });
  console.log('Bento shot captured:', bentoShot);

  // 3. Interactive CLI Terminal Preview
  await page.locator('#cli').scrollIntoViewIfNeeded();
  await page.waitForTimeout(600);
  const cliShot = path.join(outDir, 'website-cli-terminal.png');
  await page.screenshot({ path: cliShot, fullPage: false });
  console.log('CLI shot captured:', cliShot);

  // 4. Also refresh studio shots
  await browser.close();
  console.log('All website overhaul shots captured cleanly.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
