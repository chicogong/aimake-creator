#!/usr/bin/env node
/**
 * NPM Package Publication Gate & Tarball Verification Script
 * Ensures zero secret leaks, bundled assets integrity, binary shebang, and execution from any cwd.
 */
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const execFileAsync = promisify(execFile);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

async function main() {
  console.log('📦 [NPM AUDIT] Validating Aimake CLI & package.json for npm release...');

  // 1. Read package.json
  const pkgRaw = await fs.readFile(path.join(ROOT, 'package.json'), 'utf8');
  const pkg = JSON.parse(pkgRaw);

  if (!pkg.name || !pkg.version) {
    throw new Error('package.json missing name or version');
  }
  if (pkg.private === true) {
    throw new Error('package.json must not have "private": true for public npm publication');
  }
  if (pkg.license !== 'MIT') {
    throw new Error(`Expected package.json license "MIT", found "${pkg.license}"`);
  }
  if (pkg.dependencies?.playwright || pkg.dependencies?.['@ffmpeg-installer/ffmpeg']) {
    throw new Error('playwright and @ffmpeg-installer/ffmpeg must be optional peerDependencies/devDependencies so npx aimake-studio stays slim');
  }
  if (!pkg.bin || !pkg.bin.aimake || !pkg.bin['aimake-studio']) {
    throw new Error('package.json missing bin.aimake or bin["aimake-studio"]');
  }
  console.log(`  ✓ Package: ${pkg.name}@${pkg.version} (${pkg.license}, slim runtime deps)`);

  // 2. Verify dist/cli.js exists and has shebang
  const cliPath = path.join(ROOT, 'dist', 'cli.js');
  try {
    const cliStat = await fs.stat(cliPath);
    if (!cliStat.isFile()) throw new Error('dist/cli.js is not a file');
    const cliHead = (await fs.readFile(cliPath, 'utf8')).slice(0, 100);
    if (!cliHead.startsWith('#!/usr/bin/env node')) {
      throw new Error('dist/cli.js must begin with #!/usr/bin/env node');
    }
    // Ensure executable bit
    await fs.chmod(cliPath, 0o755);
    console.log('  ✓ Executable binary: dist/cli.js with #!/usr/bin/env node');
  } catch (err) {
    throw new Error(`dist/cli.js verification failed: ${err.message}`);
  }

  // 3. Run npm pack --dry-run --json to inspect tarball contents
  console.log('  🔍 Inspecting tarball contents via npm pack --dry-run...');
  const { stdout } = await execFileAsync('npm', ['pack', '--dry-run', '--json'], { cwd: ROOT });
  const packInfo = JSON.parse(stdout);
  const entry = packInfo[0];

  console.log(`  ✓ Tarball file count: ${entry.entryCount} files`);
  console.log(`  ✓ Unpacked size: ${(entry.size / 1024 / 1024).toFixed(2)} MB`);

  const filePaths = entry.files.map((f) => f.path);

  // Check forbidden files (secrets, private configs, build cruft)
  const forbiddenPatterns = [
    /\.env/,
    /\.pem$/,
    /\.key$/,
    /\.DS_Store/,
    /\.log$/,
    /^tests\//,
    /^test\//,
    /^\.aimake-tmp\//,
    /^\.local-sandbox-hosts\//,
    /^test-results\//,
    /^playwright-report\//,
    /^dist-site\//,
    /^dist-desktop\//,
    /\.tsbuildinfo$/,
  ];

  for (const p of filePaths) {
    for (const pat of forbiddenPatterns) {
      if (pat.test(p)) {
        throw new Error(`Forbidden file detected in npm tarball: ${p}`);
      }
    }
  }
  console.log('  ✓ Zero private configs, logs, secrets, or dev test-results in tarball');

  // Verify all 36 templates are present in tarball
  const templateManifestFiles = filePaths.filter(
    (p) => p.startsWith('templates/') && p.endsWith('/manifest.json')
  );
  if (templateManifestFiles.length < 36) {
    throw new Error(
      `Expected at least 36 template manifests in tarball, found ${templateManifestFiles.length}`
    );
  }
  console.log(`  ✓ ${templateManifestFiles.length}/36 template manifests verified in tarball`);

  // Verify all 7 preset skills are present in tarball
  const skillFiles = filePaths.filter(
    (p) => p.startsWith('skills/workspace-presets/') && p.endsWith('/SKILL.md')
  );
  if (skillFiles.length < 7) {
    throw new Error(
      `Expected at least 7 workspace preset SKILL.md in tarball, found ${skillFiles.length}`
    );
  }
  console.log(`  ✓ ${skillFiles.length}/7 preset skills verified in tarball`);

  // 4. Verify CLI execution from clean directory
  console.log('  🚀 Testing CLI execution from /tmp...');
  const { stdout: helpOut } = await execFileAsync(cliPath, ['--help'], { cwd: '/tmp' });
  if (!helpOut.includes('aimake [options] [command]')) {
    throw new Error('CLI --help output did not match expected usage');
  }

  const { stdout: tplOut } = await execFileAsync(cliPath, ['templates'], { cwd: '/tmp' });
  if (!tplOut.includes('apple-bento-launch')) {
    throw new Error('CLI templates output missing apple-bento-launch');
  }
  const { stdout: impHelp } = await execFileAsync(cliPath, ['import', '--help'], { cwd: '/tmp' });
  if (!impHelp.includes('Marp')) {
    throw new Error('CLI import --help output missing Marp/Slidev description');
  }
  console.log('  ✓ CLI runs cleanly from external working directory with all templates resolved');

  console.log('✅ [NPM AUDIT PASSED] Package is ready for npm publication.');
}

main().catch((err) => {
  console.error(`❌ [NPM AUDIT FAILED]: ${err.message}`);
  process.exit(1);
});
