import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';
import type {
  MaterializeResult,
  MaterializeSkillsOptions,
  PresetSkillDefinition,
  PresetSkillFile,
  SkillManifest,
  SkillSyncStatus,
  WorkspaceScenarioPreset,
  WorkspaceSkillInspection,
  WorkspaceSkillStatusItem,
} from './types.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const PRESET_SKILL_VERSION = '2.0.0';
export const SKILL_MANIFEST_SCHEMA_VERSION = '2.0';

export const CANONICAL_PRESET_SKILL_ORDER = [
  'aimake-workspace-pilot',
  'aimake-intake',
  'aimake-wiki-synth',
  'aimake-brief-architect',
  'aimake-deck-composer',
  'aimake-humanizer',
  'aimake-deliver-narrator',
] as const;

const SCENARIO_GUIDANCE: Record<
  WorkspaceScenarioPreset,
  { label: string; defaultTemplate: string; voiceRule: string }
> = {
  'creator-growth': {
    label: 'Creator Growth & Social Publishing (自媒体爆款增长)',
    defaultTemplate: 'xhs-swiss-grid',
    voiceRule:
      'Sharp hook within the first 2 seconds, concrete data over empty slogans, scannable cards with zero AI clichés.',
  },
  'executive-ppt': {
    label: 'Executive Strategy Briefing (高管战略 PPT)',
    defaultTemplate: 'ppt-consulting-matrix',
    voiceRule:
      'Pyramid Principle action titles, quantified KPI matrices, strict source citations on every claim, zero fluff.',
  },
  'product-launch': {
    label: 'Product Launch Campaign (产品发布全案)',
    defaultTemplate: 'xhs-neon-tech',
    voiceRule:
      'Problem-to-proof storytelling, crisp benchmark comparisons, cohesive multi-channel remixing across PNG, PPTX, and MP4.',
  },
  'educator-course': {
    label: 'Educator & Course Prep (课程教研备课)',
    defaultTemplate: 'edu-lesson-guide',
    voiceRule:
      'Progressive scaffolding, crystal-clear concept definitions, printable flashcards and structured review takeaways.',
  },
};

export function resolvePackageRoot(): string {
  let current = __dirname;
  for (let depth = 0; depth < 6; depth++) {
    const candidate = path.join(current, 'skills', 'workspace-presets');
    if (fsSync.existsSync(candidate)) {
      return current;
    }
    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }
  // Fallback heuristics for dist/ or src/workspace/
  return __dirname.endsWith('dist')
    ? path.resolve(__dirname, '..')
    : path.resolve(__dirname, '../..');
}

export function getPresetSkillsRootDir(): string {
  return path.join(resolvePackageRoot(), 'skills', 'workspace-presets');
}

function sha256Buffer(content: Buffer | string): string {
  return crypto.createHash('sha256').update(content).digest('hex');
}

function toPosixPath(p: string): string {
  return p.split(path.sep).join('/');
}

function parseSkillFrontmatter(markdown: string, fallbackName: string): {
  name: string;
  description: string;
} {
  const match = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) {
    return { name: fallbackName, description: '' };
  }
  try {
    const parsed = YAML.parse(match[1]) as Record<string, unknown> | null;
    const name =
      typeof parsed?.name === 'string' && parsed.name.trim()
        ? parsed.name.trim()
        : fallbackName;
    const description =
      typeof parsed?.description === 'string' ? parsed.description.trim() : '';
    return { name, description };
  } catch {
    return { name: fallbackName, description: '' };
  }
}

async function collectFilesRecursive(
  baseDir: string,
  currentDir = baseDir
): Promise<PresetSkillFile[]> {
  const entries = await fs.readdir(currentDir, { withFileTypes: true });
  const collected: PresetSkillFile[] = [];

  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue;
    const fullPath = path.join(currentDir, entry.name);
    if (entry.isDirectory()) {
      const nested = await collectFilesRecursive(baseDir, fullPath);
      collected.push(...nested);
    } else if (entry.isFile()) {
      const buf = await fs.readFile(fullPath);
      collected.push({
        relativePath: toPosixPath(path.relative(baseDir, fullPath)),
        absolutePath: fullPath,
        sha256: sha256Buffer(buf),
        size: buf.byteLength,
      });
    }
  }

  return collected.sort((a, b) => a.relativePath.localeCompare(b.relativePath));
}

/**
 * Discovers all bundled Aimake 2.0 closed-loop preset skills under skills/workspace-presets/.
 */
export async function listPresetSkills(customRootDir?: string): Promise<PresetSkillDefinition[]> {
  const rootDir = customRootDir || getPresetSkillsRootDir();
  const entries = await fs.readdir(rootDir, { withFileTypes: true });
  const skills: PresetSkillDefinition[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name.startsWith('.')) continue;
    const skillDir = path.join(rootDir, entry.name);
    const skillMdPath = path.join(skillDir, 'SKILL.md');
    try {
      const skillMdText = await fs.readFile(skillMdPath, 'utf8');
      const { name, description } = parseSkillFrontmatter(skillMdText, entry.name);
      const files = await collectFilesRecursive(skillDir);
      skills.push({
        name,
        description,
        sourceDir: skillDir,
        files,
      });
    } catch {
      // Ignore directories without a valid SKILL.md
    }
  }

  const orderIndex = new Map<string, number>(
    CANONICAL_PRESET_SKILL_ORDER.map((name, idx) => [name, idx])
  );

  return skills.sort((a, b) => {
    const ai = orderIndex.get(a.name) ?? 999;
    const bi = orderIndex.get(b.name) ?? 999;
    if (ai !== bi) return ai - bi;
    return a.name.localeCompare(b.name);
  });
}

export function buildWorkspaceAgentsMarkdown(options: {
  workspaceName: string;
  scenario: WorkspaceScenarioPreset;
}): string {
  const guidance = SCENARIO_GUIDANCE[options.scenario] || SCENARIO_GUIDANCE['creator-growth'];
  return [
    `# ${options.workspaceName} — Aimake 2.0 Workspace Rules (\`AGENTS.md\`)`,
    '',
    `> Scenario Preset: **${guidance.label}** · Default Template: \`${guidance.defaultTemplate}\``,
    '',
    'This folder is a self-contained, local-first **Aimake 2.0 End-to-End Creator Workspace**.',
    'All preset skills in `.agents/skills/` (and `.claude/skills/`) are materialized local copies with zero symlinks and zero global `~/` side effects.',
    '',
    '## Closed-Loop Pipeline State Machine',
    '',
    '1. `sources/` — Immutable captured raw materials (Markdown snapshots from web/PDF/DOCX/notes).',
    '2. `wiki/` — Grounded entity & concept cards (`wiki/*.md`), compact `wiki/index.md` (`<= 3,000 tokens`), and `wiki/published.md` compounding log.',
    '3. `briefs/` — Brief-before-draft creative plans (`briefs/<slug>.brief.md`) locking audience, hook, template, and slide plan.',
    '4. `decks/` — Deterministic `.deck.md` storyboards synced live (`<100ms`) to the Aimake Studio visual stage.',
    '5. `exports/` — Final multimodal deliverables (PNG cards, WeChat HTML, PDF, editable PPTX, 60fps MP4).',
    '6. `.aimake/` — Workspace config (`workspace.json`, `brand-kit.json`, `skill-manifest.json`, `run-history.json`).',
    '',
    '## Installed Workspace Preset Skills (Progressive Disclosure)',
    '',
    '- `aimake-workspace-pilot` — End-to-end closed-loop router (start here for full-pipeline tasks).',
    '- `aimake-intake` — Capture URLs, docs, and notes into fact-preserving `sources/*.md`.',
    '- `aimake-wiki-synth` — Distill `sources/` into grounded `wiki/*.md` + `wiki/index.md` with `cite:` coordinates.',
    '- `aimake-brief-architect` — Brief-before-draft gate producing `briefs/<slug>.brief.md`.',
    '- `aimake-deck-composer` — Author and One-Click Remix `decks/*.deck.md` across all 36 built-in templates.',
    '- `aimake-humanizer` — 4-locale (`zh-CN`/`en`/`ja`/`ko`) anti-AI-slop & visual text-density overflow gate.',
    '- `aimake-deliver-narrator` — Narration pacing, 5-format export to `exports/`, and compounding into `wiki/published.md`.',
    '',
    '## Scenario Brand & Quality Discipline',
    '',
    `- **Voice Guidance**: ${guidance.voiceRule}`,
    '- **Evidence First**: Never invent numbers or quotes; ground factual slides with `cite: wiki/<slug>.md#L<line>`.',
    '- **Brief Before Draft**: Write `briefs/<slug>.brief.md` before drafting a brand-new multi-slide deck.',
    '- **Humanize Before Export**: Run `aimake-humanizer` on every `.deck.md` before delivery.',
    '- **Workspace Isolation**: Keep all reads, writes, and exports inside this workspace folder.',
    '',
  ].join('\n');
}

export function buildWorkspaceClaudeMarkdown(): string {
  return [
    '# CLAUDE.md — Aimake Workspace Entry',
    '',
    'Follow all workspace pipeline rules, brand guidelines, and skill routing defined in `@AGENTS.md` and `.claude/skills/`.',
    '',
  ].join('\n');
}

async function readSkillManifest(manifestPath: string): Promise<SkillManifest | null> {
  try {
    const raw = await fs.readFile(manifestPath, 'utf8');
    const parsed = JSON.parse(raw) as SkillManifest;
    if (parsed && typeof parsed === 'object' && parsed.files && typeof parsed.files === 'object') {
      return parsed;
    }
  } catch {
    // Missing or invalid manifest
  }
  return null;
}

async function safeWriteMaterializedFile(params: {
  workspaceDir: string;
  relKey: string;
  content: Buffer;
  sourceHash: string;
  skillName: string;
  targetRoot: '.agents/skills' | '.claude/skills' | 'root';
  manifest: SkillManifest;
  force: boolean;
  nowIso: string;
}): Promise<'written' | 'unchanged' | 'preserved'> {
  const { workspaceDir, relKey, content, sourceHash, skillName, targetRoot, manifest, force, nowIso } =
    params;
  const targetPath = path.join(workspaceDir, ...relKey.split('/'));
  await fs.mkdir(path.dirname(targetPath), { recursive: true });

  let existingStat: fsSync.Stats | null = null;
  try {
    existingStat = await fs.lstat(targetPath);
  } catch {
    existingStat = null;
  }

  if (existingStat) {
    if (existingStat.isSymbolicLink()) {
      if (!force) {
        return 'preserved';
      }
      await fs.unlink(targetPath);
    } else if (existingStat.isFile()) {
      const currentContent = await fs.readFile(targetPath);
      const currentHash = sha256Buffer(currentContent);
      if (currentHash === sourceHash) {
        manifest.files[relKey] = {
          relativePath: relKey,
          sha256: sourceHash,
          version: PRESET_SKILL_VERSION,
          updatedAt: nowIso,
          skillName,
          targetRoot,
        };
        return 'unchanged';
      }

      const recorded = manifest.files[relKey];
      const matchesRecordedBaseline = Boolean(recorded && currentHash === recorded.sha256);

      if (!force && !matchesRecordedBaseline) {
        // User manually customized this file — never overwrite!
        return 'preserved';
      }
    }
  }

  // Always write an independent real file (NEVER fs.symlink).
  await fs.writeFile(targetPath, content);
  manifest.files[relKey] = {
    relativePath: relKey,
    sha256: sourceHash,
    version: PRESET_SKILL_VERSION,
    updatedAt: nowIso,
    skillName,
    targetRoot,
  };
  return 'written';
}

/**
 * Materializes all 7 preset skills into <workspace>/.agents/skills/ (and optionally
 * <workspace>/.claude/skills/) as real independent files (ZERO symlinks!), generates
 * AGENTS.md + CLAUDE.md, and records SHA-256 checksums in .aimake/skill-manifest.json
 * to protect user customizations during future upgrades.
 */
export async function materializeWorkspaceSkills(
  workspaceDir: string,
  options: MaterializeSkillsOptions = {}
): Promise<MaterializeResult> {
  const absWorkspace = path.resolve(workspaceDir);
  const includeClaude = options.includeClaude ?? true;
  const force = options.force ?? false;
  const scenario: WorkspaceScenarioPreset = options.scenario ?? 'creator-growth';
  const workspaceName = options.workspaceName?.trim() || path.basename(absWorkspace);

  const aimakeDir = path.join(absWorkspace, '.aimake');
  await fs.mkdir(aimakeDir, { recursive: true });

  const manifestPath = path.join(aimakeDir, 'skill-manifest.json');
  const existingManifest = await readSkillManifest(manifestPath);
  const nowIso = new Date().toISOString();

  const manifest: SkillManifest = {
    schemaVersion: SKILL_MANIFEST_SCHEMA_VERSION,
    presetVersion: PRESET_SKILL_VERSION,
    updatedAt: nowIso,
    files: existingManifest ? { ...existingManifest.files } : {},
  };

  const presetSkills = await listPresetSkills();
  const writtenFiles: string[] = [];
  const skippedUnchanged: string[] = [];
  const preservedCustomFiles: string[] = [];
  const generatedRootFiles: string[] = [];

  const targetRoots: Array<'.agents/skills' | '.claude/skills'> = includeClaude
    ? ['.agents/skills', '.claude/skills']
    : ['.agents/skills'];

  for (const skill of presetSkills) {
    for (const file of skill.files) {
      const sourceBuf = await fs.readFile(file.absolutePath);
      const sourceHash = sha256Buffer(sourceBuf);

      for (const targetRoot of targetRoots) {
        const relKey = `${targetRoot}/${skill.name}/${file.relativePath}`;
        const outcome = await safeWriteMaterializedFile({
          workspaceDir: absWorkspace,
          relKey,
          content: sourceBuf,
          sourceHash,
          skillName: skill.name,
          targetRoot,
          manifest,
          force,
          nowIso,
        });

        if (outcome === 'written') {
          writtenFiles.push(relKey);
        } else if (outcome === 'unchanged') {
          skippedUnchanged.push(relKey);
        } else {
          preservedCustomFiles.push(relKey);
        }
      }
    }
  }

  // Generate workspace root AGENTS.md & CLAUDE.md (also protected by manifest SHA-256)
  const agentsContent = Buffer.from(
    buildWorkspaceAgentsMarkdown({ workspaceName, scenario }),
    'utf8'
  );
  const agentsOutcome = await safeWriteMaterializedFile({
    workspaceDir: absWorkspace,
    relKey: 'AGENTS.md',
    content: agentsContent,
    sourceHash: sha256Buffer(agentsContent),
    skillName: '_workspace_root',
    targetRoot: 'root',
    manifest,
    force,
    nowIso,
  });
  if (agentsOutcome === 'written') generatedRootFiles.push('AGENTS.md');
  else if (agentsOutcome === 'unchanged') skippedUnchanged.push('AGENTS.md');
  else preservedCustomFiles.push('AGENTS.md');

  const claudeContent = Buffer.from(buildWorkspaceClaudeMarkdown(), 'utf8');
  const claudeOutcome = await safeWriteMaterializedFile({
    workspaceDir: absWorkspace,
    relKey: 'CLAUDE.md',
    content: claudeContent,
    sourceHash: sha256Buffer(claudeContent),
    skillName: '_workspace_root',
    targetRoot: 'root',
    manifest,
    force,
    nowIso,
  });
  if (claudeOutcome === 'written') generatedRootFiles.push('CLAUDE.md');
  else if (claudeOutcome === 'unchanged') skippedUnchanged.push('CLAUDE.md');
  else preservedCustomFiles.push('CLAUDE.md');

  manifest.updatedAt = nowIso;
  await fs.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

  return {
    workspaceDir: absWorkspace,
    presetVersion: PRESET_SKILL_VERSION,
    skillNames: presetSkills.map((s) => s.name),
    writtenFiles,
    skippedUnchanged,
    preservedCustomFiles,
    generatedRootFiles,
    manifestPath,
    includeClaude,
  };
}

async function detectAnySymlinkInSubtree(targetPath: string): Promise<boolean> {
  try {
    const st = await fs.lstat(targetPath);
    if (st.isSymbolicLink()) return true;
    if (!st.isDirectory()) return false;
    const entries = await fs.readdir(targetPath);
    for (const entry of entries) {
      if (await detectAnySymlinkInSubtree(path.join(targetPath, entry))) {
        return true;
      }
    }
  } catch {
    return false;
  }
  return false;
}

/**
 * Inspects all 7 preset skills inside a workspace, returning sync status
 * ('synced' | 'customized' | 'missing' | 'outdated') and verifying zero symlinks.
 */
export async function inspectWorkspaceSkills(
  workspaceDir: string
): Promise<WorkspaceSkillInspection> {
  const absWorkspace = path.resolve(workspaceDir);
  const presetSkills = await listPresetSkills();
  const manifestPath = path.join(absWorkspace, '.aimake', 'skill-manifest.json');
  const manifest = await readSkillManifest(manifestPath);

  let checkClaude = false;
  try {
    const st = await fs.lstat(path.join(absWorkspace, '.claude', 'skills'));
    checkClaude = st.isDirectory() || st.isSymbolicLink();
  } catch {
    checkClaude = false;
  }

  const targetRoots: Array<'.agents/skills' | '.claude/skills'> = checkClaude
    ? ['.agents/skills', '.claude/skills']
    : ['.agents/skills'];

  const skills: WorkspaceSkillStatusItem[] = [];
  let zeroSymlinks = true;

  // Also check top-level skill container dirs themselves are not symlinks
  for (const rootRel of targetRoots) {
    const rootAbs = path.join(absWorkspace, ...rootRel.split('/'));
    try {
      const st = await fs.lstat(rootAbs);
      if (st.isSymbolicLink()) zeroSymlinks = false;
    } catch {
      // missing dir handled below
    }
  }

  for (const skill of presetSkills) {
    const customizedFiles: string[] = [];
    const missingFiles: string[] = [];
    const outdatedFiles: string[] = [];
    let hasSymlink = false;

    for (const rootRel of targetRoots) {
      const skillDirAbs = path.join(absWorkspace, ...rootRel.split('/'), skill.name);
      if (await detectAnySymlinkInSubtree(skillDirAbs)) {
        hasSymlink = true;
        zeroSymlinks = false;
      }

      for (const file of skill.files) {
        const relKey = `${rootRel}/${skill.name}/${file.relativePath}`;
        const fileAbs = path.join(absWorkspace, ...relKey.split('/'));
        try {
          const st = await fs.lstat(fileAbs);
          if (st.isSymbolicLink()) {
            hasSymlink = true;
            zeroSymlinks = false;
          }
          const diskBuf = await fs.readFile(fileAbs);
          const diskHash = sha256Buffer(diskBuf);
          if (diskHash !== file.sha256) {
            const recorded = manifest?.files[relKey];
            if (recorded && diskHash === recorded.sha256) {
              outdatedFiles.push(relKey);
            } else {
              customizedFiles.push(relKey);
            }
          }
        } catch {
          missingFiles.push(relKey);
        }
      }
    }

    let status: SkillSyncStatus = 'synced';
    if (missingFiles.length > 0) {
      status = 'missing';
    } else if (customizedFiles.length > 0) {
      status = 'customized';
    } else if (outdatedFiles.length > 0) {
      status = 'outdated';
    }

    skills.push({
      name: skill.name,
      description: skill.description,
      status,
      agentsPath: path.join(absWorkspace, '.agents', 'skills', skill.name),
      claudePath: checkClaude
        ? path.join(absWorkspace, '.claude', 'skills', skill.name)
        : undefined,
      fileCount: skill.files.length,
      customizedFiles,
      missingFiles,
      outdatedFiles,
      hasSymlink,
    });
  }

  return {
    workspaceDir: absWorkspace,
    presetVersion: PRESET_SKILL_VERSION,
    totalPresetSkills: presetSkills.length,
    allSynced: skills.every((s) => s.status === 'synced') && zeroSymlinks,
    zeroSymlinks,
    skills,
  };
}
