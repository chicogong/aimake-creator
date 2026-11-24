import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const IGNORE_DIRS = new Set([
  'node_modules',
  '.git',
  'dist',
  'dist-site',
  'dist-desktop',
  'dist-exports',
  'dist-promotions',
  '.aimake-tmp',
  '.aimake',
  '.local-sandbox-hosts',
  '.vercel',
  'out',
  'coverage',
  'test-results',
  'playwright-report',
]);

const FORBIDDEN = [
  {
    label: 'API Secret Key',
    re: /\b(?:sk-[a-zA-Z0-9]{20,}|sk-ant-[a-zA-Z0-9_-]{20,}|ghp_[a-zA-Z0-9]{24,}|gho_[a-zA-Z0-9]{24,}|github_pat_[a-zA-Z0-9_]{20,}|AKIA[0-9A-Z]{16}|AKID[a-zA-Z0-9]{20,})\b/,
  },
  {
    label: 'Internal Hostname or Infrastructure Path',
    re: /\bVM-\d+-\d+-[a-z0-9-]+\b|\/data\/webdocs\/|\/usr\/local\/qqwebsrv\/|\.webdev\.com\b/,
  },
  {
    label: 'Personal macOS/Linux home directory path',
    re: /\/(?:Users|home)\/(?!(?:alice|bob|example|user|runner|ubuntu)\b)[a-zA-Z0-9._-]{2,}\//,
  },
];

async function walk(dir, out = []) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    if (IGNORE_DIRS.has(e.name)) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      await walk(full, out);
    } else if (/\.(ts|js|mjs|swift|json|md|html|yaml|yml)$/.test(e.name)) {
      out.push(full);
    }
  }
  return out;
}

async function main() {
  const files = await walk(root);
  const violations = [];

  for (const file of files) {
    if (file.endsWith('audit-secrets.mjs') || file.includes('pr-sanitizer.test.ts')) continue;
    const text = await fs.readFile(file, 'utf8');
    for (const rule of FORBIDDEN) {
      if (rule.re.test(text)) {
        violations.push(`${path.relative(root, file)}: matched ${rule.label}`);
      }
    }
  }

  if (violations.length > 0) {
    console.error('Secret/Path audit failed:\n' + violations.join('\n'));
    process.exit(1);
  }
  console.log(`Audited ${files.length} source files: 0 secret or private path leaks.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
