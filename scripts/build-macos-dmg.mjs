#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

async function main() {
  if (process.platform !== 'darwin') {
    throw new Error(`Aimake DMG installer build requires macOS (current platform: ${process.platform})`);
  }

  const pkgJsonPath = path.join(repoRoot, 'package.json');
  const pkg = JSON.parse(await fs.readFile(pkgJsonPath, 'utf8'));
  const version = String(pkg.version || '2.0.0');

  const outDir = path.join(repoRoot, 'dist-desktop');
  const appPath = path.join(outDir, 'Aimake.app');
  const dmgRoot = path.join(outDir, 'dmg-staging');
  const dmgFile = path.join(outDir, `Aimake-v${version}-macOS.dmg`);
  const zipFile = path.join(outDir, `Aimake-v${version}-macOS.zip`);

  process.stdout.write(`Step 1: Building native Aimake.app bundle...\n`);
  execFileSync(process.execPath, [path.join(__dirname, 'build-macos-app.mjs')], {
    stdio: 'inherit',
    cwd: repoRoot,
  });

  process.stdout.write(`\nStep 2: Preparing DMG staging environment...\n`);
  await fs.rm(dmgRoot, { recursive: true, force: true });
  await fs.mkdir(dmgRoot, { recursive: true });

  // Copy Aimake.app
  execFileSync('/bin/cp', ['-R', appPath, dmgRoot]);

  // Create Applications symlink for drag-and-drop installer
  const appSymlink = path.join(dmgRoot, 'Applications');
  try {
    await fs.symlink('/Applications', appSymlink);
  } catch (err) {
    execFileSync('/bin/ln', ['-s', '/Applications', appSymlink]);
  }

  process.stdout.write(`\nStep 3: Creating compressed UDZO Disk Image (DMG)...\n`);
  await fs.rm(dmgFile, { force: true });
  execFileSync(
    '/usr/bin/hdiutil',
    [
      'create',
      '-volname',
      `Aimake Studio v${version}`,
      '-srcfolder',
      dmgRoot,
      '-ov',
      '-format',
      'UDZO',
      dmgFile,
    ],
    { stdio: 'inherit' }
  );

  // Clean staging
  await fs.rm(dmgRoot, { recursive: true, force: true });

  // Step 4: Also create standard zip archive for portable use
  process.stdout.write(`\nStep 4: Creating standalone ZIP archive...\n`);
  await fs.rm(zipFile, { force: true });
  execFileSync('/usr/bin/ditto', ['-c', '-k', '--keepParent', appPath, zipFile]);

  const dmgStat = await fs.stat(dmgFile);
  const zipStat = await fs.stat(zipFile);

  process.stdout.write(
    [
      `\n✅ Aimake macOS Installer Package Ready:`,
      `  DMG Installer : ${dmgFile} (${(dmgStat.size / (1024 * 1024)).toFixed(2)} MB)`,
      `  ZIP Archive   : ${zipFile} (${(zipStat.size / (1024 * 1024)).toFixed(2)} MB)`,
      `  Drag-and-Drop : Enabled (/Applications symlink included)`,
    ].join('\n') + '\n'
  );
}

main().catch((err) => {
  process.stderr.write(`DMG build failed: ${err instanceof Error ? err.message : String(err)}\n`);
  process.exit(1);
});
