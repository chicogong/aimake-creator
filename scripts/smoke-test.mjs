import { execSync } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

async function main() {
  const startTime = Date.now();
  console.log('⚡ [SMOKE TEST] Running fast preflight smoke tests...');

  // 1. Verify CLI output
  const cliPath = path.join(root, 'dist', 'cli.js');
  try {
    const helpOut = execSync(`node "${cliPath}" --help`, { encoding: 'utf8', timeout: 5000 });
    if (!helpOut.includes('aimake') || !helpOut.includes('Options:')) {
      throw new Error('CLI --help output unexpected');
    }
    const versionOut = execSync(`node "${cliPath}" --version`, { encoding: 'utf8', timeout: 5000 }).trim();
    if (!versionOut.startsWith('2.')) {
      throw new Error(`Unexpected CLI version: ${versionOut}`);
    }
    console.log(`  ✓ CLI binary executable: version ${versionOut}`);
  } catch (err) {
    throw new Error(`CLI smoke check failed: ${err.message}`);
  }

  // 2. Verify all 36 templates
  const templatesDir = path.join(root, 'templates');
  const templateFolders = await fs.readdir(templatesDir);
  let templateCount = 0;
  for (const folder of templateFolders) {
    const manifestPath = path.join(templatesDir, folder, 'manifest.json');
    const htmlPath = path.join(templatesDir, folder, 'template.html');
    try {
      const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
      if (manifest.id && (manifest.aspect || manifest.width)) {
        await fs.access(htmlPath);
        templateCount++;
      }
    } catch {
      // ignore non-template items
    }
  }
  if (templateCount < 36) {
    throw new Error(`Expected at least 36 templates, found ${templateCount}`);
  }
  console.log(`  ✓ 36 parametric design templates verified (${templateCount} valid)`);

  // 3. Fast In-Memory Parser & Compiler Check
  const sampleDeck = `---
title: Smoke Test Deck
template: apple-bento-launch
aspect: 16:9
locale: zh-CN
---

<!-- scene: s1 | layout: bento-split | eyebrow: SMOKE -->
# Aimake Smoke Test
## Ultra-fast validation suite

- Latency: <1s
- Status: 100% Operational
`;

  // Dynamically import compiled dist/index.js
  const distEntry = path.join(root, 'dist', 'index.js');
  const engine = await import(`file://${distEntry}`);
  if (typeof engine.parseDeckMarkdown !== 'function' || typeof engine.compileDeckToHtml !== 'function') {
    throw new Error('Engine exports missing parseDeckMarkdown or compileDeckToHtml');
  }

  const parsed = engine.parseDeckMarkdown(sampleDeck);
  if (parsed.frontmatter.title !== 'Smoke Test Deck' || parsed.slides.length !== 1) {
    throw new Error('Parsed deck AST mismatch');
  }

  const compiled = await engine.compileDeckToHtml(parsed, 'apple-bento-launch', { editable: true });
  if (!compiled.html.includes('<!DOCTYPE html>') || !compiled.html.includes('Smoke Test Deck')) {
    throw new Error('Compiled HTML validation failed');
  }
  console.log('  ✓ In-memory Markdown parser & HTML compiler operational');

  // 4. Quick secrets audit check
  const auditScript = path.join(root, 'scripts', 'audit-secrets.mjs');
  execSync(`node "${auditScript}"`, { encoding: 'utf8', timeout: 5000 });
  console.log('  ✓ Source secrets & private path leak audit clean');

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`✅ [SMOKE TEST PASSED] All core smoke checks passed in ${elapsed}s!\n`);
}

main().catch((err) => {
  console.error('❌ [SMOKE TEST FAILED]', err);
  process.exit(1);
});
