import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  BUILTIN_TEMPLATES,
  getAllTemplates,
  validateTemplateHtml,
  validateTemplateManifest,
} from '../src/templates/index.js';
import { parseDeckMarkdown } from '../src/renderer/deck-parser.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

interface AuditIssue {
  section: 'templates' | 'skills' | 'trending';
  target: string;
  message: string;
  severity: 'error' | 'warning';
}

async function auditTemplates(): Promise<AuditIssue[]> {
  const issues: AuditIssue[] = [];
  const templatesRoot = path.join(root, 'templates');
  const expectedTemplates = getAllTemplates();

  if (expectedTemplates.length !== 36) {
    issues.push({
      section: 'templates',
      target: 'src/templates/index.ts',
      message: `Expected exactly 36 registered templates in src/templates/index.ts, found ${expectedTemplates.length}`,
      severity: 'error',
    });
  }

  const dirs = await fs.readdir(templatesRoot);
  const foundTemplateIds = new Set(dirs.filter((d) => !d.startsWith('.')));

  for (const tpl of expectedTemplates) {
    const id = tpl.manifest.id;
    if (!foundTemplateIds.has(id)) {
      issues.push({
        section: 'templates',
        target: id,
        message: `Template directory templates/${id} missing on filesystem`,
        severity: 'error',
      });
      continue;
    }

    const tplDir = path.join(templatesRoot, id);

    // 1. Audit manifest.json
    const manifestPath = path.join(tplDir, 'manifest.json');
    try {
      const rawManifest = await fs.readFile(manifestPath, 'utf8');
      const manifest = JSON.parse(rawManifest);
      const val = validateTemplateManifest(manifest);
      if (!val.valid) {
        issues.push({
          section: 'templates',
          target: `${id}/manifest.json`,
          message: `Manifest validation failed: ${val.errors.join('; ')}`,
          severity: 'error',
        });
      }
      if (manifest.id !== id) {
        issues.push({
          section: 'templates',
          target: `${id}/manifest.json`,
          message: `Manifest id "${manifest.id}" does not match folder name "${id}"`,
          severity: 'error',
        });
      }
    } catch (err: any) {
      issues.push({
        section: 'templates',
        target: `${id}/manifest.json`,
        message: `Failed to read or parse manifest.json: ${err.message}`,
        severity: 'error',
      });
    }

    // 2. Audit template.html
    const htmlPath = path.join(tplDir, 'template.html');
    try {
      const html = await fs.readFile(htmlPath, 'utf8');
      const val = validateTemplateHtml(html);
      if (!val.valid) {
        issues.push({
          section: 'templates',
          target: `${id}/template.html`,
          message: `Template HTML validation failed: ${val.errors.join('; ')}`,
          severity: 'error',
        });
      }
      if (!html.includes('window.renderDeck')) {
        issues.push({
          section: 'templates',
          target: `${id}/template.html`,
          message: `Missing window.renderDeck contract`,
          severity: 'error',
        });
      }
      if (!html.includes('data-editable')) {
        issues.push({
          section: 'templates',
          target: `${id}/template.html`,
          message: `Missing data-editable annotations`,
          severity: 'error',
        });
      }
      if (!html.includes('fitStage')) {
        issues.push({
          section: 'templates',
          target: `${id}/template.html`,
          message: `Missing fitStage function`,
          severity: 'error',
        });
      }
      if (!html.includes('aimakeSeek')) {
        issues.push({
          section: 'templates',
          target: `${id}/template.html`,
          message: `Missing aimakeSeek video frame-stepping function`,
          severity: 'error',
        });
      }
      if (!html.includes('data-theme="dark"') || !html.includes('data-theme="light"')) {
        issues.push({
          section: 'templates',
          target: `${id}/template.html`,
          message: `Missing explicit data-theme dark and light selector support`,
          severity: 'error',
        });
      }
    } catch (err: any) {
      issues.push({
        section: 'templates',
        target: `${id}/template.html`,
        message: `Failed to read template.html: ${err.message}`,
        severity: 'error',
      });
    }

    // 3. Audit sample.deck.md
    const samplePath = path.join(tplDir, 'sample.deck.md');
    try {
      const sampleMd = await fs.readFile(samplePath, 'utf8');
      const parsedDeck = parseDeckMarkdown(sampleMd);
      if (!parsedDeck.frontmatter.title) {
        issues.push({
          section: 'templates',
          target: `${id}/sample.deck.md`,
          message: `Sample deck missing frontmatter title`,
          severity: 'error',
        });
      }
      if (parsedDeck.frontmatter.template !== id) {
        issues.push({
          section: 'templates',
          target: `${id}/sample.deck.md`,
          message: `Sample deck template "${parsedDeck.frontmatter.template}" does not match "${id}"`,
          severity: 'error',
        });
      }
      if (parsedDeck.slides.length < 2) {
        issues.push({
          section: 'templates',
          target: `${id}/sample.deck.md`,
          message: `Sample deck should have at least 2 slides, found ${parsedDeck.slides.length}`,
          severity: 'warning',
        });
      }
    } catch (err: any) {
      issues.push({
        section: 'templates',
        target: `${id}/sample.deck.md`,
        message: `Failed to parse sample.deck.md: ${err.message}`,
        severity: 'error',
      });
    }

    // 4. Audit preview.png
    const previewPath = path.join(tplDir, 'preview.png');
    try {
      const stat = await fs.stat(previewPath);
      if (stat.size === 0) {
        issues.push({
          section: 'templates',
          target: `${id}/preview.png`,
          message: `preview.png is empty (0 bytes)`,
          severity: 'error',
        });
      }
    } catch {
      issues.push({
        section: 'templates',
        target: `${id}/preview.png`,
        message: `preview.png missing for template ${id}`,
        severity: 'error',
      });
    }
  }

  return issues;
}

async function auditSkills(): Promise<AuditIssue[]> {
  const issues: AuditIssue[] = [];

  // 1. Audit core SKILL.md
  const coreSkillPath = path.join(root, 'skills', 'aimake', 'SKILL.md');
  try {
    const text = await fs.readFile(coreSkillPath, 'utf8');
    if (!text.startsWith('---\nname: aimake\ndescription:')) {
      issues.push({
        section: 'skills',
        target: 'skills/aimake/SKILL.md',
        message: 'Core SKILL.md missing required YAML frontmatter (name + description)',
        severity: 'error',
      });
    }
  } catch (err: any) {
    issues.push({
      section: 'skills',
      target: 'skills/aimake/SKILL.md',
      message: `Failed to read core SKILL.md: ${err.message}`,
      severity: 'error',
    });
  }

  // 2. Audit workspace preset skills
  const presetsDir = path.join(root, 'skills', 'workspace-presets');
  try {
    const entries = await fs.readdir(presetsDir, { withFileTypes: true });
    let count = 0;
    for (const entry of entries) {
      if (!entry.isDirectory() || entry.name.startsWith('.')) continue;
      const presetSkillPath = path.join(presetsDir, entry.name, 'SKILL.md');
      try {
        const text = await fs.readFile(presetSkillPath, 'utf8');
        const fmMatch = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
        if (!fmMatch) {
          issues.push({
            section: 'skills',
            target: `skills/workspace-presets/${entry.name}/SKILL.md`,
            message: 'Missing YAML frontmatter',
            severity: 'error',
          });
          continue;
        }
        const fm = fmMatch[1];
        if (!/^name:\s*\S+/m.test(fm) || !/^description:\s*\S+/m.test(fm)) {
          issues.push({
            section: 'skills',
            target: `skills/workspace-presets/${entry.name}/SKILL.md`,
            message: 'Missing name or description in frontmatter',
            severity: 'error',
          });
        }
        count++;
      } catch (err: any) {
        issues.push({
          section: 'skills',
          target: `skills/workspace-presets/${entry.name}/SKILL.md`,
          message: `Failed to read preset skill: ${err.message}`,
          severity: 'error',
        });
      }
    }
    if (count < 7) {
      issues.push({
        section: 'skills',
        target: 'skills/workspace-presets',
        message: `Expected at least 7 workspace preset skills, found ${count}`,
        severity: 'error',
      });
    }
  } catch (err: any) {
    issues.push({
      section: 'skills',
      target: 'skills/workspace-presets',
      message: `Failed to audit workspace presets: ${err.message}`,
      severity: 'error',
    });
  }

  return issues;
}

async function auditTrendingWorks(): Promise<AuditIssue[]> {
  const issues: AuditIssue[] = [];
  const trendingRoot = path.join(root, 'examples', 'trending');

  try {
    const manifestRaw = await fs.readFile(path.join(trendingRoot, 'manifest.json'), 'utf8');
    const manifest = JSON.parse(manifestRaw);

    if (!Array.isArray(manifest.works) || manifest.works.length === 0) {
      issues.push({
        section: 'trending',
        target: 'examples/trending/manifest.json',
        message: 'manifest.json missing works array',
        severity: 'error',
      });
      return issues;
    }

    const workIds = new Set(manifest.works.map((w: any) => w.id));

    // Verify key 2026 trending design and content patterns
    const requiredPatterns = [
      { id: '2026-ai-agents-shift', topic: 'Bento Grid Showcase & Agent Shift' },
      { id: '2026-physical-ai-robotics', topic: 'Physical AI & Embodied Intelligence' },
      { id: '2026-deepseek-openweights-benchmark', topic: 'DeepSeek / OpenWeights Benchmark Deck' },
      { id: '2026-swiss-typography-grid', topic: 'Minimalist Swiss Typography' },
    ];

    for (const pat of requiredPatterns) {
      if (!workIds.has(pat.id)) {
        issues.push({
          section: 'trending',
          target: `examples/trending/manifest.json`,
          message: `Missing required 2026 trending work: ${pat.id} (${pat.topic})`,
          severity: 'error',
        });
      }
    }

    for (const work of manifest.works) {
      const deckFile = path.resolve(root, work.deckFile);
      try {
        const md = await fs.readFile(deckFile, 'utf8');
        const parsed = parseDeckMarkdown(md);
        if (!parsed.frontmatter.title) {
          issues.push({
            section: 'trending',
            target: work.deckFile,
            message: `Deck missing title in frontmatter`,
            severity: 'error',
          });
        }
      } catch (err: any) {
        issues.push({
          section: 'trending',
          target: work.deckFile,
          message: `Failed to read or parse trending deck: ${err.message}`,
          severity: 'error',
        });
      }

      if (work.previewImage) {
        const previewFile = path.resolve(root, work.previewImage);
        try {
          const stat = await fs.stat(previewFile);
          if (stat.size === 0) {
            issues.push({
              section: 'trending',
              target: work.previewImage,
              message: `Preview image is empty`,
              severity: 'error',
            });
          }
        } catch {
          issues.push({
            section: 'trending',
            target: work.previewImage,
            message: `Preview image missing: ${work.previewImage}`,
            severity: 'warning',
          });
        }
      }
    }
  } catch (err: any) {
    issues.push({
      section: 'trending',
      target: 'examples/trending/manifest.json',
      message: `Failed to audit trending works: ${err.message}`,
      severity: 'error',
    });
  }

  return issues;
}

async function main() {
  console.log('🔍 Auditing Aimake templates, skills, and 2026 trending content...\n');

  const [tplIssues, skillIssues, trendingIssues] = await Promise.all([
    auditTemplates(),
    auditSkills(),
    auditTrendingWorks(),
  ]);

  const allIssues = [...tplIssues, ...skillIssues, ...trendingIssues];
  const errors = allIssues.filter((i) => i.severity === 'error');
  const warnings = allIssues.filter((i) => i.severity === 'warning');

  if (warnings.length > 0) {
    console.log(`⚠️  ${warnings.length} Warning(s):`);
    for (const w of warnings) {
      console.log(`  [${w.section}] ${w.target}: ${w.message}`);
    }
    console.log('');
  }

  if (errors.length > 0) {
    console.error(`❌ Audit Failed with ${errors.length} Error(s):`);
    for (const e of errors) {
      console.error(`  [${e.section}] ${e.target}: ${e.message}`);
    }
    process.exit(1);
  }

  console.log('✅ Audit Passed Cleanly:');
  console.log(`  - All 36 templates compliant with schema & dark/light theme contract`);
  console.log(`  - Every template has manifest.json, template.html, and sample.deck.md`);
  console.log(`  - All 7 workspace preset skills and core SKILL.md validated`);
  console.log(`  - 2026 Trending works (Bento Grid, Physical AI, DeepSeek benchmark, Swiss Grid) verified`);
}

main().catch((err) => {
  console.error('Fatal audit failure:', err);
  process.exit(1);
});
