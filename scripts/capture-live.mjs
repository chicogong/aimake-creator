import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

async function main() {
  const outDir = path.resolve('test-results/live-screenshots');
  await fs.mkdir(outDir, { recursive: true });

  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });

  const page = await context.newPage();
  
  // 1. Landing Page (Default: Dark Mode)
  console.log('Navigating to https://aimake.cc/ ...');
  await page.goto('https://aimake.cc/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(outDir, '01-landing-hero-dark.png'), clip: { x: 0, y: 0, width: 1440, height: 1100 } });
  
  // Works Gallery (Dark)
  const worksSection = page.locator('#works');
  if (await worksSection.count() > 0) {
    await worksSection.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await worksSection.screenshot({ path: path.join(outDir, '02-works-gallery-dark.png') });
  }

  // Radar Section (Dark)
  const radarSection = page.locator('#radar');
  if (await radarSection.count() > 0) {
    await radarSection.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await radarSection.screenshot({ path: path.join(outDir, '03-radar-dark.png') });
  }

  // 2. Switch to Light Mode
  const themeBtn = page.locator('#theme-toggle-btn');
  if (await themeBtn.count() > 0) {
    await themeBtn.click();
    await page.waitForTimeout(500);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(outDir, '04-landing-hero-light.png'), clip: { x: 0, y: 0, width: 1440, height: 1100 } });
    
    // Works Gallery (Light)
    await worksSection.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await worksSection.screenshot({ path: path.join(outDir, '05-works-gallery-light.png') });
  }

  // 3. Playground
  console.log('Navigating to https://aimake.cc/playground/ ...');
  await page.goto('https://aimake.cc/playground/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(outDir, '05-playground.png'), clip: { x: 0, y: 0, width: 1440, height: 900 } });

  await browser.close();
  console.log('All live screenshots captured to:', outDir);
}

main().catch(console.error);
