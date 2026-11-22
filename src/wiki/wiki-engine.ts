import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import type { DeckDocument, WikiIngestResult, WikiLintReport } from '../schema/types.js';
import {
  compileVaultGraph,
  ensureVaultOverviewBase,
  EPISTEMIC_FACTS_HEADING,
  EPISTEMIC_INFERENCES_HEADING,
  EPISTEMIC_UNVERIFIED_HEADING,
  type Diagnostic,
  type WikiGraph,
} from './lwc-bridge.js';

export {
  buildVaultOverviewBaseYaml,
  compileVaultGraph,
  detectVaultLayout,
  ensureVaultOverviewBase,
  EPISTEMIC_FACTS_HEADING,
  EPISTEMIC_INFERENCES_HEADING,
  EPISTEMIC_UNVERIFIED_HEADING,
  exportVaultVisuals,
  formatEpistemicDraftMarkdown,
  getVaultContextBundle,
  getVaultGovernanceStatus,
  REQUIRED_EPISTEMIC_HEADINGS,
  resolveVaultFocusQuery,
  reviewAndApplyVaultProposal,
  stageVaultIntakeAndProposal,
  validateEpistemicDraftStructure,
  verifyDeckCitationsAgainstVault,
  type CompiledVaultGraph,
  type CompileVaultGraphOptions,
  type DeckCitationVerificationReport,
  type Diagnostic,
  type EpistemicDraftInput,
  type EpistemicSourceRef,
  type ExportedVaultVisuals,
  type ExportVaultVisualsOptions,
  type QingyanPermissionLevel,
  type ReviewAndApplyProposalOptions,
  type ReviewAndApplyProposalResult,
  type SlideCitationStatus,
  type SlideCitationVerification,
  type StagedVaultProposalResult,
  type StageVaultIntakeOptions,
  type VaultContextBundleOptions,
  type VaultContextBundleResult,
  type VaultGovernanceStatus,
  type VaultLayoutKind,
  type WikiGraph,
} from './lwc-bridge.js';

export interface LwcWikiLintReport extends WikiLintReport {
  missingTitles: string[];
  ambiguousLinks: Array<{ file: string; target: string; message: string }>;
  diagnostics: Diagnostic[];
  graphStats: WikiGraph['stats'];
}

const execFileAsync = promisify(execFile);

export const INDEX_TOKEN_BUDGET = 3000;
export const PERSONA_TOKEN_BUDGET = 800;

/**
 * Conservative cross-language token estimator (CJK chars ~0.7-1 token, Latin words ~1.3 tokens).
 */
export function estimateTokens(text: string): number {
  if (!text) return 0;
  let cjkCount = 0;
  for (const ch of text) {
    const code = ch.codePointAt(0) || 0;
    if (
      (code >= 0x4e00 && code <= 0x9fff) ||
      (code >= 0x3040 && code <= 0x30ff) ||
      (code >= 0xac00 && code <= 0xd7af)
    ) {
      cjkCount++;
    }
  }
  const nonCjk = text.replace(/[\u4e00-\u9fff\u3040-\u30ff\uac00-\ud7af]/g, ' ');
  const latinWords = nonCjk.trim().split(/\s+/).filter(Boolean).length;
  return Math.ceil(cjkCount * 0.85 + latinWords * 1.3);
}

export function slugify(input: string): string {
  const cleaned = input
    .trim()
    .toLowerCase()
    .replace(/https?:\/\//g, '')
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
  return cleaned || 'untitled';
}

export function sha256Hex(content: string): string {
  return crypto.createHash('sha256').update(content, 'utf8').digest('hex');
}

export function buildVaultAgentsMarkdown(): string {
  return [
    '# Aimake Knowledge Vault — Agent Protocol (`AGENTS.md`)',
    '',
    'This local-first Markdown vault combines Aimake LLM Wiki budgets, `@lwc/core` proposal governance, and Qingyan Vault epistemic conventions. Humans own intent, source selection, and final acceptance; AI Agents retrieve, draft, and check within explicit permission boundaries.',
    '',
    '## Vault Structure',
    '',
    '- `raw/`: Immutable ingested source snapshots with SHA-256 provenance.',
    '- `wiki/`: Synthesized long-term knowledge pages (`wiki/index.md` <= 3,000 tokens; `wiki/log.md` operations log).',
    '- `personas/`: Compact Style DNA profiles (`<= 800 tokens` per persona).',
    '- `outputs/`: Compounded deliverable records linked back to vault provenance.',
    '- `.lwc/drafts/` & `.lwc/proposals/`: Isolated staging area for source-bound drafts and human-reviewable proposals.',
    '- `Overview.base`: Obsidian Bases table view over vault folders.',
    '',
    '## Permission Hierarchy (R0–R3)',
    '',
    '- **R0 (Read-Only Default)**: Inspect files, compile graph/lint diagnostics, extract 0–2 hop context bundles, and verify citations. Never modify vault files.',
    '- **R1 (Isolated Draft & Proposal Staging)**: Stage source-bound drafts and proposals only under `.lwc/drafts/`, `.lwc/proposals/`, or `Agent/草稿/`. Never write directly to formal `wiki/` knowledge pages.',
    '- **R2 (Single-File Human-Reviewed Write)**: Apply a reviewed proposal affecting one formal knowledge file only after explicit human review (`human:<name>`) and exact proposal-ID confirmation.',
    '- **R3 (Multi-File / Structural Write)**: Apply multi-file or structural knowledge changes only after explicit human review and confirmation.',
    '',
    '## Epistemic Separation Rules',
    '',
    'Every drafted or synthesized knowledge note MUST separate evidence from interpretation using these headings:',
    '',
    `- \`${EPISTEMIC_FACTS_HEADING}\` — Direct, verifiable claims linked to vault sources (\`raw/\` or SHA-256 provenance).`,
    `- \`${EPISTEMIC_INFERENCES_HEADING}\` — Model synthesis or reasoning explicitly tagged \`[推断]\`.`,
    `- \`${EPISTEMIC_UNVERIFIED_HEADING}\` — Open questions or claims lacking source evidence explicitly tagged \`[待验证]\`.`,
    '',
    '## Portability & Hygiene',
    '',
    '- Use relative WikiLinks, standard Markdown, YAML frontmatter, and open JSON Canvas; never write machine-absolute paths or secrets.',
    '- Keep `wiki/index.md <= 3,000 tokens` and `personas/*.md <= 800 tokens`.',
    '- Never auto-approve proposals with autonomous identities (`agent:*`, `bot:*`, `llm:*`, `model:*`, `ai:*`).',
    '',
  ].join('\n');
}

export async function initWikiVault(vaultDir: string): Promise<void> {
  await fs.mkdir(path.join(vaultDir, 'raw'), { recursive: true });
  await fs.mkdir(path.join(vaultDir, 'wiki'), { recursive: true });
  await fs.mkdir(path.join(vaultDir, 'personas'), { recursive: true });
  await fs.mkdir(path.join(vaultDir, 'outputs'), { recursive: true });

  const indexPath = path.join(vaultDir, 'wiki', 'index.md');
  try {
    await fs.access(indexPath);
  } catch {
    await fs.writeFile(
      indexPath,
      [
        '# Aimake LLM Wiki Index',
        '',
        '> Auto-maintained compact knowledge index (strictly bounded <= 3,000 tokens).',
        '',
        '## Active Knowledge Pages',
        '',
      ].join('\n'),
      'utf8'
    );
  }

  const logPath = path.join(vaultDir, 'wiki', 'log.md');
  try {
    await fs.access(logPath);
  } catch {
    await fs.writeFile(logPath, '# Aimake Knowledge Operations Log\n\n', 'utf8');
  }

  await ensureVaultOverviewBase(vaultDir);

  const agentsPath = path.join(vaultDir, 'AGENTS.md');
  try {
    await fs.access(agentsPath);
  } catch {
    await fs.writeFile(agentsPath, buildVaultAgentsMarkdown(), 'utf8');
  }
}

function stripHtmlToMarkdown(html: string): { title: string; markdown: string } {
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? titleMatch[1].replace(/\s+/g, ' ').trim() : 'Web Clip';

  let body = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[\s\S]*?<\/nav>/gi, '')
    .replace(/<footer[\s\S]*?<\/footer>/gi, '')
    .replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, '\n# $1\n')
    .replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, '\n## $1\n')
    .replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, '\n### $1\n')
    .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, '\n- $1')
    .replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, '\n$1\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"');

  body = body
    .split('\n')
    .map((l) => l.trim())
    .filter((l, i, arr) => l !== '' || arr[i - 1] !== '')
    .join('\n')
    .trim();

  return { title, markdown: body };
}

async function extractOfficeDocumentText(filePath: string): Promise<string> {
  const ext = path.extname(filePath).toLowerCase();
  // Use system unzip -p on macOS/Linux to extract XML text cleanly from .docx / .pptx / .xlsx without Python dependency!
  try {
    if (ext === '.docx') {
      const { stdout } = await execFileAsync('unzip', ['-p', filePath, 'word/document.xml']);
      return stdout
        .replace(/<\/w:p>/g, '\n\n')
        .replace(/<[^>]+>/g, '')
        .trim();
    }
    if (ext === '.pptx') {
      const { stdout: listOut } = await execFileAsync('unzip', ['-Z1', filePath]);
      const slideFiles = listOut
        .split('\n')
        .filter((f) => /^ppt\/slides\/slide\d+\.xml$/.test(f.trim()))
        .sort();
      const slidesText: string[] = [];
      for (const sf of slideFiles) {
        const { stdout } = await execFileAsync('unzip', ['-p', filePath, sf]);
        const txt = stdout
          .replace(/<\/a:p>/g, '\n')
          .replace(/<[^>]+>/g, '')
          .trim();
        if (txt) slidesText.push(`## ${path.basename(sf, '.xml')}\n${txt}`);
      }
      return slidesText.join('\n\n');
    }
  } catch {
    // Fallback to raw utf8 read if unzip fails
  }
  return fs.readFile(filePath, 'utf8');
}

export async function ingestSource(
  vaultDir: string,
  sourceInput: string,
  options?: { title?: string; tags?: string[] }
): Promise<WikiIngestResult> {
  await initWikiVault(vaultDir);

  let rawTitle = options?.title || '';
  let contentMd = '';
  let originUri = sourceInput;

  if (/^https?:\/\//i.test(sourceInput)) {
    const res = await fetch(sourceInput, {
      headers: { 'User-Agent': 'Aimake-Wiki-Ingestor/1.0 (+https://aimake.cc)' },
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch URL (${res.status}): ${sourceInput}`);
    }
    const contentType = res.headers.get('content-type') || '';
    const text = await res.text();
    if (contentType.includes('text/html') || text.trim().startsWith('<')) {
      const parsed = stripHtmlToMarkdown(text);
      rawTitle = rawTitle || parsed.title;
      contentMd = parsed.markdown;
    } else {
      rawTitle = rawTitle || new URL(sourceInput).pathname.split('/').pop() || 'Remote Note';
      contentMd = text;
    }
  } else {
    const absPath = path.resolve(sourceInput);
    originUri = absPath;
    const ext = path.extname(absPath).toLowerCase();
    rawTitle = rawTitle || path.basename(absPath, ext);
    if (ext === '.docx' || ext === '.pptx') {
      contentMd = await extractOfficeDocumentText(absPath);
    } else if (ext === '.html' || ext === '.htm') {
      const html = await fs.readFile(absPath, 'utf8');
      const parsed = stripHtmlToMarkdown(html);
      rawTitle = options?.title || parsed.title || rawTitle;
      contentMd = parsed.markdown;
    } else {
      contentMd = await fs.readFile(absPath, 'utf8');
    }
  }

  const hash = sha256Hex(contentMd);
  const datePrefix = new Date().toISOString().slice(0, 10);
  const slug = slugify(rawTitle);

  const rawFileName = `${datePrefix}-${slug}.md`;
  const rawPath = path.join(vaultDir, 'raw', rawFileName);
  const rawRecord = [
    '---',
    `title: "${rawTitle.replace(/"/g, '\\"')}"`,
    `origin: "${originUri.replace(/"/g, '\\"')}"`,
    `sha256: "${hash}"`,
    `ingested_at: "${new Date().toISOString()}"`,
    `tags: [${(options?.tags || []).map((t) => `"${t}"`).join(', ')}]`,
    '---',
    '',
    `# ${rawTitle}`,
    '',
    contentMd.trim(),
    '',
  ].join('\n');
  await fs.writeFile(rawPath, rawRecord, 'utf8');

  // Synthesize or extend structured wiki concept note (Karpathy "Extend, don't overwrite")
  const wikiPath = path.join(vaultDir, 'wiki', `${slug}.md`);
  const summaryLines = contentMd
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 12 && !l.startsWith('#') && !l.startsWith('---'))
    .slice(0, 5);

  const excerptBlock = [
    `### Source Snapshot (${datePrefix})`,
    `- **Origin**: \`${originUri}\``,
    `- **SHA-256**: \`${hash.slice(0, 16)}\` · Raw: [[../raw/${rawFileName}|${rawFileName}]]`,
    ...summaryLines.map((s) => `- ${s.slice(0, 180)}`),
    '',
  ].join('\n');

  try {
    const existing = await fs.readFile(wikiPath, 'utf8');
    if (!existing.includes(hash.slice(0, 16))) {
      await fs.writeFile(wikiPath, `${existing.trim()}\n\n${excerptBlock}\n`, 'utf8');
    }
  } catch {
    const initialWiki = [
      `# ${rawTitle}`,
      '',
      `> Synthesized concept page maintained by Aimake LLM Wiki.`,
      '',
      '## Key Evidence & Provenance',
      '',
      excerptBlock,
    ].join('\n');
    await fs.writeFile(wikiPath, initialWiki, 'utf8');
  }

  const indexPath = await rebuildWikiIndex(vaultDir);
  await fs.appendFile(
    path.join(vaultDir, 'wiki', 'log.md'),
    `- \`${new Date().toISOString()}\` **INGEST** [[${slug}]] from \`${originUri}\` (\`sha256:${hash.slice(0, 12)}\`)\n`,
    'utf8'
  );

  return {
    rawPath,
    wikiPath,
    indexPath,
    sha256: hash,
    title: rawTitle,
    estimatedTokens: estimateTokens(contentMd),
  };
}

export async function rebuildWikiIndex(vaultDir: string): Promise<string> {
  const wikiDir = path.join(vaultDir, 'wiki');
  const entries = await fs.readdir(wikiDir);
  const pageFiles = entries
    .filter((f) => f.endsWith('.md') && f !== 'index.md' && f !== 'log.md' && f !== 'archive-index.md')
    .sort();

  const items: Array<{ file: string; mtimeMs: number; line: string }> = [];
  for (const file of pageFiles) {
    const full = path.join(wikiDir, file);
    const stat = await fs.stat(full);
    const content = await fs.readFile(full, 'utf8');
    const headingMatch = content.match(/^#\s+(.+)$/m);
    const title = headingMatch ? headingMatch[1].trim() : path.basename(file, '.md');
    const firstBullet = content
      .split('\n')
      .map((l) => l.trim())
      .find((l) => l.startsWith('- ') && !l.includes('**Origin**') && !l.includes('**SHA-256**'));
    const snippet = firstBullet ? firstBullet.slice(2, 90) : 'Structured concept entry';
    const slug = path.basename(file, '.md');
    items.push({
      file,
      mtimeMs: stat.mtimeMs,
      line: `- [[${slug}|${title}]] — ${snippet} *(${new Date(stat.mtimeMs).toISOString().slice(0, 10)})*`,
    });
  }

  // Most recent first so active entries stay in index.md within token budget
  items.sort((a, b) => b.mtimeMs - a.mtimeMs);

  const header = [
    '# Aimake LLM Wiki Index',
    '',
    `> Token-bounded index (budget <= ${INDEX_TOKEN_BUDGET} tokens). Updated ${new Date().toISOString().slice(0, 10)}.`,
    '',
    '## Active Knowledge Pages',
    '',
  ].join('\n');

  const activeLines: string[] = [];
  const archivedLines: string[] = [];
  let runningText = header;

  for (const item of items) {
    const candidate = `${runningText}${item.line}\n`;
    if (estimateTokens(candidate) <= INDEX_TOKEN_BUDGET - 80) {
      activeLines.push(item.line);
      runningText = candidate;
    } else {
      archivedLines.push(item.line);
    }
  }

  if (archivedLines.length > 0) {
    const archivePath = path.join(wikiDir, 'archive-index.md');
    await fs.writeFile(
      archivePath,
      `# Archived Wiki Index\n\n${archivedLines.join('\n')}\n`,
      'utf8'
    );
    activeLines.push('', `- Older ${archivedLines.length} entries archived in [[archive-index]]`);
  }

  const indexPath = path.join(wikiDir, 'index.md');
  await fs.writeFile(indexPath, `${header}${activeLines.join('\n')}\n`, 'utf8');
  return indexPath;
}

export async function compoundOutputToWiki(
  vaultDir: string,
  deck: DeckDocument,
  exportedArtifacts: string[]
): Promise<string> {
  await initWikiVault(vaultDir);
  const datePrefix = new Date().toISOString().slice(0, 10);
  const slug = slugify(deck.frontmatter.title);
  const outPath = path.join(vaultDir, 'outputs', `${datePrefix}-${slug}.md`);

  const summary = [
    '---',
    `title: "${deck.frontmatter.title.replace(/"/g, '\\"')}"`,
    `template: "${deck.frontmatter.template}"`,
    `locale: "${deck.frontmatter.locale}"`,
    `created_at: "${new Date().toISOString()}"`,
    '---',
    '',
    `# Deliverable Record: ${deck.frontmatter.title}`,
    '',
    '## Key Synthesized Points',
    ...deck.slides.map((s) => `- **${s.title}**${s.cite ? ` (cite: \`${s.cite}\`)` : ''}`),
    '',
    '## Exported Artifacts',
    ...exportedArtifacts.map((a) => `- \`${a}\``),
    '',
  ].join('\n');

  await fs.writeFile(outPath, summary, 'utf8');
  await fs.appendFile(
    path.join(vaultDir, 'wiki', 'log.md'),
    `- \`${new Date().toISOString()}\` **COMPOUND** [[../outputs/${path.basename(outPath)}|${deck.frontmatter.title}]] (${deck.slides.length} slides, locale \`${deck.frontmatter.locale}\`)\n`,
    'utf8'
  );
  return outPath;
}

export async function lintWiki(vaultDir: string): Promise<LwcWikiLintReport> {
  await initWikiVault(vaultDir);
  const wikiDir = path.join(vaultDir, 'wiki');
  const rawDir = path.join(vaultDir, 'raw');
  const personaDir = path.join(vaultDir, 'personas');

  const [rawFiles, wikiFiles, indexContent, compiled] = await Promise.all([
    fs.readdir(rawDir).then((entries) => entries.filter((f) => f.endsWith('.md'))),
    fs.readdir(wikiDir).then((entries) => entries.filter((f) => f.endsWith('.md'))),
    fs.readFile(path.join(wikiDir, 'index.md'), 'utf8'),
    compileVaultGraph(vaultDir),
  ]);

  const indexTokens = estimateTokens(indexContent);
  const diagnostics = compiled.graph.diagnostics;

  const brokenLinks = diagnostics
    .filter((d) => d.code === 'BROKEN_LINK')
    .map((d) => ({ file: d.path, target: d.target ?? '' }));

  const ambiguousLinks = diagnostics
    .filter((d) => d.code === 'AMBIGUOUS_LINK')
    .map((d) => ({ file: d.path, target: d.target ?? '', message: d.message }));

  const missingTitles = diagnostics
    .filter((d) => d.code === 'MISSING_TITLE')
    .map((d) => d.path);

  const reservedWikiNames = new Set(['index.md', 'log.md', 'archive-index.md']);
  const knowledgePathSet = new Set(compiled.knowledgeNodes.map((n) => n.path));
  const orphanPages = diagnostics
    .filter((d) => {
      if (d.code !== 'ORPHAN_PAGE') return false;
      if (compiled.layout === 'aimake') {
        if (!d.path.startsWith('wiki/')) return false;
        return !reservedWikiNames.has(path.posix.basename(d.path));
      }
      return knowledgePathSet.has(d.path);
    })
    .map((d) => {
      if (d.path.startsWith('wiki/') && path.posix.dirname(d.path) === 'wiki') {
        return path.posix.basename(d.path, '.md');
      }
      return d.path.replace(/\.md$/i, '');
    });

  const oversizedPersonas: Array<{ file: string; tokens: number }> = [];
  const pEntries = await fs.readdir(personaDir);
  for (const pf of pEntries.filter((f) => f.endsWith('.md'))) {
    const pText = await fs.readFile(path.join(personaDir, pf), 'utf8');
    const t = estimateTokens(pText);
    if (t > PERSONA_TOKEN_BUDGET) {
      oversizedPersonas.push({ file: `personas/${pf}`, tokens: t });
    }
  }

  return {
    valid: indexTokens <= INDEX_TOKEN_BUDGET && brokenLinks.length === 0 && oversizedPersonas.length === 0,
    indexTokens,
    indexBudget: INDEX_TOKEN_BUDGET,
    totalRawFiles: rawFiles.length,
    totalWikiPages: wikiFiles.filter((f) => !reservedWikiNames.has(f)).length,
    brokenLinks,
    orphanPages,
    oversizedPersonas,
    missingTitles,
    ambiguousLinks,
    diagnostics,
    graphStats: compiled.graph.stats,
  };
}
