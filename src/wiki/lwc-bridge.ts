import fs from 'node:fs/promises';
import path from 'node:path';
import {
  applyKnowledgeProposal,
  buildGraph,
  buildKnowledgeContext,
  buildWikiReport,
  checkOkfBundle,
  createKnowledgeIntake,
  graphToCanvas,
  graphToExcalidraw,
  graphToMermaid,
  intakeToMarkdown,
  knowledgeContextToMarkdown,
  okfReportToMarkdown,
  parseKnowledgeProposal,
  proposalToMarkdown,
  proposeKnowledgeIntake,
  readDraftInbox,
  readProposalInbox,
  rejectKnowledgeProposal,
  reportToMarkdown,
  resolveFocusNode,
  reviewKnowledgeProposal,
  selectFocusedGraph,
  summarizeCanvasLayout,
  summarizeExcalidrawLayout,
  writeKnowledgeIntakeDraft,
  type CreatedKnowledgeIntake,
  type Diagnostic,
  type DraftInbox,
  type ExcalidrawDocument,
  type FocusDirection,
  type FocusedGraph,
  type JsonCanvas,
  type KnowledgeContextBundle,
  type KnowledgeContextOptions,
  type KnowledgeIntake,
  type KnowledgeProposal,
  type KnowledgeSource,
  type KnowledgeTrust,
  type KnowledgeTrustTier,
  type LayoutSummary,
  type NodeKind,
  type OkfConformanceReport,
  type ProposalInbox,
  type WikiGraph,
  type WikiNode,
  type WikiReport,
} from './lwc-core/index.js';
import type { DeckDocument } from '../schema/types.js';

export type {
  CreatedKnowledgeIntake,
  Diagnostic,
  DraftInbox,
  ExcalidrawDocument,
  FocusDirection,
  FocusedGraph,
  JsonCanvas,
  KnowledgeContextBundle,
  KnowledgeContextOptions,
  KnowledgeIntake,
  KnowledgeProposal,
  KnowledgeSource,
  KnowledgeTrust,
  KnowledgeTrustTier,
  LayoutSummary,
  NodeKind,
  OkfConformanceReport,
  ProposalInbox,
  WikiGraph,
  WikiNode,
  WikiReport,
};

export type VaultLayoutKind = 'aimake' | 'qingyan' | 'lwc';

/**
 * Qingyan Vault R0–R3 Agent permission hierarchy:
 * - R0: Strictly read-only inspection, graph scan, context bundle, citation audit.
 * - R1: Isolated draft & proposal staging only (.lwc/drafts, .lwc/proposals, Agent/草稿/).
 * - R2: Single-target formal knowledge write after explicit human review & confirmation.
 * - R3: Multi-file or structural knowledge apply after explicit human review & confirmation.
 */
export type QingyanPermissionLevel = 'R0' | 'R1' | 'R2' | 'R3';

export const EPISTEMIC_FACTS_HEADING = '## 核心事实 (Facts)';
export const EPISTEMIC_INFERENCES_HEADING = '## 推断 (Inferences)';
export const EPISTEMIC_UNVERIFIED_HEADING = '## 待验证 (Unverified)';

export const REQUIRED_EPISTEMIC_HEADINGS = [
  EPISTEMIC_FACTS_HEADING,
  EPISTEMIC_INFERENCES_HEADING,
  EPISTEMIC_UNVERIFIED_HEADING,
] as const;

export interface CompileVaultGraphOptions {
  now?: Date;
  fixedModifiedAt?: Date;
  topConnected?: number;
  checkOkf?: boolean;
}

export interface CompiledVaultGraph {
  layout: VaultLayoutKind;
  graph: WikiGraph;
  report: WikiReport;
  reportMarkdown: string;
  okf?: OkfConformanceReport;
  okfMarkdown?: string;
  entryNode?: WikiNode;
  sourceNodes: WikiNode[];
  knowledgeNodes: WikiNode[];
}

export interface VaultContextBundleOptions extends KnowledgeContextOptions {
  graph?: WikiGraph;
  now?: Date;
}

export interface VaultContextBundleResult {
  bundle: KnowledgeContextBundle;
  markdown: string;
  estimatedTokens: number;
  graph: WikiGraph;
}

export interface EpistemicSourceRef {
  id?: string;
  resource: string;
  title?: string;
  author?: string;
  lastModified?: string;
}

export interface EpistemicDraftInput {
  title: string;
  type?: string;
  status?: 'draft' | 'stable' | 'deprecated';
  tags?: string[];
  generator?: string;
  createdAt?: Date;
  staleAfter?: string;
  intakeId?: string;
  sourceSha256?: string;
  sources?: EpistemicSourceRef[];
  facts: string[];
  inferences?: string[];
  unverified?: string[];
  relatedLinks?: string[];
}

export interface StageVaultIntakeOptions {
  sourcePath: string;
  targetPath: string;
  title?: string;
  summary?: string;
  generator?: string;
  permissionLevel?: QingyanPermissionLevel;
  draftMarkdown?: string;
  facts?: string[];
  inferences?: string[];
  unverified?: string[];
  relatedLinks?: string[];
  tags?: string[];
  type?: string;
  status?: 'draft' | 'stable' | 'deprecated';
  staleAfter?: string;
  sources?: EpistemicSourceRef[];
  enforceEpistemicTemplate?: boolean;
  propose?: boolean;
  createdAt?: Date;
  proposedAt?: Date;
}

export interface StagedVaultProposalResult {
  intake: KnowledgeIntake;
  manifestPath: string;
  draftPath: string;
  sourceSnapshotPath: string;
  draftHash: string;
  intakeMarkdown: string;
  proposal?: KnowledgeProposal;
  proposalPath?: string;
  proposalMarkdown?: string;
}

export interface ReviewAndApplyProposalOptions {
  proposalId: string;
  confirmation: string;
  action: 'review' | 'reject' | 'apply' | 'review-and-apply';
  reviewer?: string;
  note?: string;
  reason?: string;
  permissionLevel?: QingyanPermissionLevel;
  proposalPath?: string;
  reviewedAt?: Date;
  appliedAt?: Date;
  rejectedAt?: Date;
}

export interface ReviewAndApplyProposalResult {
  proposal: KnowledgeProposal;
  proposalPath: string;
  proposalMarkdown: string;
  writtenFiles: string[];
}

export interface VaultGovernanceStatus {
  layout: VaultLayoutKind;
  draftInbox: DraftInbox;
  proposalInbox: ProposalInbox;
  agentDraftFiles: string[];
  draftCounts: {
    total: number;
    ready: number;
    needsDraft: number;
    proposed: number;
    blocked: number;
  };
  proposalCounts: {
    total: number;
    proposed: number;
    reviewed: number;
    applied: number;
    rejected: number;
  };
  issues: Array<{ file: string; message: string }>;
}

export type SlideCitationStatus = 'verified' | 'stale' | 'unresolved' | 'uncited';

export interface SlideCitationVerification {
  slideIndex: number;
  slideId: string;
  slideTitle: string;
  cite?: string;
  anchor?: string;
  status: SlideCitationStatus;
  matchedNodeId?: string;
  matchedNodePath?: string;
  matchedNodeTitle?: string;
  trustTier?: KnowledgeTrustTier;
  stale: boolean;
  staleAfter?: string;
  sources: KnowledgeSource[];
  reason?: string;
}

export interface DeckCitationVerificationReport {
  deckTitle: string;
  vaultRootName: string;
  valid: boolean;
  counts: Record<SlideCitationStatus, number>;
  slides: SlideCitationVerification[];
}

export interface ExportVaultVisualsOptions {
  outDir?: string;
  graph?: WikiGraph;
  now?: Date;
  canvasFileName?: string;
  excalidrawFileName?: string;
  mermaidFileName?: string;
  overviewBaseFileName?: string;
  focusQuery?: string;
  focusDepth?: 1 | 2;
  focusDirection?: FocusDirection;
  focusKinds?: NodeKind[];
  writeOverviewBase?: boolean;
  overwriteOverviewBase?: boolean;
}

export interface ExportedVaultVisuals {
  graph: WikiGraph;
  canvasPath: string;
  canvas: JsonCanvas;
  canvasLayout: LayoutSummary;
  excalidrawPath: string;
  excalidraw: ExcalidrawDocument;
  excalidrawLayout: LayoutSummary;
  mermaidPath: string;
  mermaid: string;
  focusedGraph?: FocusedGraph;
  overviewBasePath?: string;
}

function estimateTokensLocal(text: string): number {
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

async function pathExists(target: string): Promise<boolean> {
  try {
    await fs.access(target);
    return true;
  } catch {
    return false;
  }
}

async function writeJsonFile(target: string, data: unknown): Promise<void> {
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

function normalizeLookupKey(value: string): string {
  return value
    .replaceAll('\\', '/')
    .replace(/^\.\//, '')
    .replace(/^\/+/, '')
    .replace(/\.md$/i, '')
    .trim()
    .toLocaleLowerCase();
}

export async function detectVaultLayout(vaultDir: string): Promise<VaultLayoutKind> {
  const abs = path.resolve(vaultDir);
  const [hasQingyanSources, hasQingyanKnowledge, hasQingyanHome, hasAimakeWiki, hasAimakeRaw] =
    await Promise.all([
      pathExists(path.join(abs, '来源')),
      pathExists(path.join(abs, '知识')),
      pathExists(path.join(abs, 'Home.md')),
      pathExists(path.join(abs, 'wiki')),
      pathExists(path.join(abs, 'raw')),
    ]);

  if (hasQingyanSources || hasQingyanKnowledge || (hasQingyanHome && !hasAimakeWiki)) {
    return 'qingyan';
  }
  if (hasAimakeWiki || hasAimakeRaw) {
    return 'aimake';
  }
  return 'lwc';
}

function isSourceNode(node: WikiNode): boolean {
  if (node.kind === 'source') return true;
  const p = node.path.toLocaleLowerCase();
  return p.startsWith('raw/') || p.startsWith('来源/') || p.startsWith('sources/') || p.startsWith('references/');
}

function isReservedOrAuxiliaryNode(node: WikiNode): boolean {
  const p = node.path.toLocaleLowerCase();
  const base = path.posix.basename(p);
  if (['index.md', 'home.md', 'readme.md', 'log.md', 'archive-index.md'].includes(base)) {
    return true;
  }
  return (
    p.startsWith('raw/') ||
    p.startsWith('来源/') ||
    p.startsWith('sources/') ||
    p.startsWith('personas/') ||
    p.startsWith('outputs/') ||
    p.startsWith('agent/草稿/') ||
    p.startsWith('模板/') ||
    p.startsWith('维护/') ||
    p.startsWith('指南/')
  );
}

/**
 * Resolves a focus query against an LWC WikiGraph.
 * Uses `@lwc/core` `resolveFocusNode` first; if an Aimake `raw/` snapshot or `Agent/草稿/` draft
 * shares the exact same title with a canonical knowledge note, disambiguates in favor of the
 * canonical note while preserving genuine ambiguity errors.
 */
export function resolveVaultFocusQuery(graph: WikiGraph, focusQuery: string): string {
  try {
    return resolveFocusNode(graph, focusQuery).path;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (!msg.startsWith('Focus page is ambiguous:')) {
      throw err;
    }
    const wanted = normalizeLookupKey(focusQuery);
    const matching = graph.nodes.filter((node) => {
      const keys = [
        node.id,
        node.path,
        path.posix.basename(node.path),
        node.title,
      ].map(normalizeLookupKey);
      return keys.includes(wanted);
    });
    const canonical = matching.filter(
      (n) =>
        !n.path.toLocaleLowerCase().startsWith('raw/') &&
        !n.path.toLocaleLowerCase().startsWith('agent/草稿/')
    );
    if (canonical.length === 1) {
      return canonical[0].path;
    }
    throw err;
  }
}

/**
 * Compiles any Aimake, LWC/OKF, or Qingyan Vault (`来源/`, `知识/`, `Home.md`) into an
 * `@lwc/core` WikiGraph + WikiReport + optional OKF v0.2 conformance report (strictly R0 read-only).
 */
export async function compileVaultGraph(
  vaultDir: string,
  opts?: CompileVaultGraphOptions
): Promise<CompiledVaultGraph> {
  const absRoot = path.resolve(vaultDir);
  const layout = await detectVaultLayout(absRoot);
  const graph = await buildGraph(absRoot, opts?.now ?? new Date(), opts?.fixedModifiedAt);
  const report = buildWikiReport(graph, opts?.topConnected ?? 5);
  const reportMarkdown = reportToMarkdown(report);

  let okf: OkfConformanceReport | undefined;
  let okfMarkdown: string | undefined;
  if (opts?.checkOkf || graph.okf !== undefined) {
    okf = await checkOkfBundle(absRoot);
    okfMarkdown = okfReportToMarkdown(okf);
  }

  const entryCandidates = ['wiki/index.md', 'home.md', 'index.md'];
  const entryNode = entryCandidates
    .map((candidate) => graph.nodes.find((n) => n.path.toLocaleLowerCase() === candidate))
    .find(Boolean);

  const sourceNodes = graph.nodes.filter(isSourceNode);
  const knowledgeNodes = graph.nodes.filter((n) => !isReservedOrAuxiliaryNode(n));

  return {
    layout,
    graph,
    report,
    reportMarkdown,
    okf,
    okfMarkdown,
    entryNode,
    sourceNodes,
    knowledgeNodes,
  };
}

/**
 * Builds a 0–2 hop topology-bounded, SHA-256 cited Markdown context bundle via `@lwc/core`
 * for grounding `.deck.md` generation without scanning an entire vault.
 */
export async function getVaultContextBundle(
  vaultDir: string,
  focusQuery: string,
  opts?: VaultContextBundleOptions
): Promise<VaultContextBundleResult> {
  const absRoot = path.resolve(vaultDir);
  const graph = opts?.graph ?? (await buildGraph(absRoot, opts?.now ?? new Date()));
  const resolvedFocus = resolveVaultFocusQuery(graph, focusQuery);

  const bundle = await buildKnowledgeContext(absRoot, graph, resolvedFocus, {
    depth: opts?.depth ?? 1,
    direction: opts?.direction ?? 'both',
    kinds: opts?.kinds,
    maxPages: opts?.maxPages ?? 8,
    maxWords: opts?.maxWords ?? 2000,
  });
  const markdown = knowledgeContextToMarkdown(bundle);

  return {
    bundle,
    markdown,
    estimatedTokens: estimateTokensLocal(markdown),
    graph,
  };
}

/**
 * Validates that a draft separates Facts, Inferences, and Unverified items per Qingyan epistemic rules.
 */
export function validateEpistemicDraftStructure(markdown: string): {
  valid: boolean;
  missingHeadings: string[];
} {
  const missingHeadings = REQUIRED_EPISTEMIC_HEADINGS.filter(
    (heading) => !markdown.includes(heading)
  );
  return {
    valid: missingHeadings.length === 0,
    missingHeadings,
  };
}

/**
 * Formats an OKF v0.2 & Qingyan-compliant Markdown draft enforcing explicit separation of
 * `## 核心事实 (Facts)`, `## 推断 (Inferences)`, and `## 待验证 (Unverified)`.
 */
export function formatEpistemicDraftMarkdown(input: EpistemicDraftInput): string {
  const createdAtIso = (input.createdAt ?? new Date()).toISOString();
  const generator = input.generator?.trim() || 'agent:aimake';
  const docType = input.type?.trim() || 'concept';
  const status = input.status ?? 'draft';
  const tags = input.tags ?? [];

  const yamlLines: string[] = [
    '---',
    `title: ${JSON.stringify(input.title.trim())}`,
    `type: ${JSON.stringify(docType)}`,
    `status: ${JSON.stringify(status)}`,
  ];

  if (tags.length > 0) {
    yamlLines.push(`tags: [${tags.map((t) => JSON.stringify(t)).join(', ')}]`);
  } else {
    yamlLines.push('tags: []');
  }

  yamlLines.push('generated:', `  by: ${JSON.stringify(generator)}`, `  at: ${JSON.stringify(createdAtIso)}`);

  if (input.staleAfter) {
    yamlLines.push(`stale_after: ${JSON.stringify(input.staleAfter)}`);
  }

  if (input.intakeId) {
    yamlLines.push(`source: ${JSON.stringify(`intake:${input.intakeId}`)}`);
  }
  if (input.sourceSha256) {
    yamlLines.push(`source_sha256: ${JSON.stringify(input.sourceSha256)}`);
  }

  if (input.sources && input.sources.length > 0) {
    yamlLines.push('sources:');
    for (const src of input.sources) {
      yamlLines.push(`  - resource: ${JSON.stringify(src.resource)}`);
      if (src.id) yamlLines.push(`    id: ${JSON.stringify(src.id)}`);
      if (src.title) yamlLines.push(`    title: ${JSON.stringify(src.title)}`);
      if (src.author) yamlLines.push(`    author: ${JSON.stringify(src.author)}`);
      if (src.lastModified) yamlLines.push(`    last_modified: ${JSON.stringify(src.lastModified)}`);
    }
  }

  yamlLines.push('---');

  const factLines =
    input.facts.length > 0
      ? input.facts.map((f) => `- ${f.trim()}`)
      : ['- （尚无已确认来源事实 / No confirmed source facts recorded yet）'];

  const inferenceLines =
    input.inferences && input.inferences.length > 0
      ? input.inferences.map((inf) => `- [推断] ${inf.trim()}`)
      : ['- [推断] （暂无额外模型归纳 / No additional model inferences）'];

  const unverifiedLines =
    input.unverified && input.unverified.length > 0
      ? input.unverified.map((u) => `- [待验证] ${u.trim()}`)
      : ['- [待验证] （暂无待核实项 / None pending verification）'];

  const bodyLines: string[] = [
    ...yamlLines,
    '',
    `# ${input.title.trim()}`,
    '',
    EPISTEMIC_FACTS_HEADING,
    '',
    ...factLines,
    '',
    EPISTEMIC_INFERENCES_HEADING,
    '',
    ...inferenceLines,
    '',
    EPISTEMIC_UNVERIFIED_HEADING,
    '',
    ...unverifiedLines,
  ];

  if (input.relatedLinks && input.relatedLinks.length > 0) {
    bodyLines.push('', '## 关联节点 (Connections)', '', ...input.relatedLinks.map((l) => `- ${l.trim()}`));
  }

  bodyLines.push('');
  return bodyLines.join('\n');
}

function assertNotAutonomousAgentReviewer(reviewer: string): void {
  const trimmed = reviewer.trim();
  if (!trimmed) {
    throw new Error('Human-review boundary violation: a non-empty human reviewer identifier is required.');
  }
  if (/^(?:agent|bot|llm|model|ai):/i.test(trimmed)) {
    throw new Error(
      `Human-review boundary violation: autonomous actor "${trimmed}" cannot approve formal knowledge proposals; require a human reviewer (e.g. "human:editor").`
    );
  }
}

/**
 * Stages a source-bound intake draft and optional reviewable proposal under `.lwc/`
 * (Qingyan R1 draft isolation + Fact/Inference/Unverified epistemic structure),
 * without modifying any formal Markdown file in the vault.
 */
export async function stageVaultIntakeAndProposal(
  vaultDir: string,
  opts: StageVaultIntakeOptions
): Promise<StagedVaultProposalResult> {
  const level = opts.permissionLevel ?? 'R1';
  if (level === 'R0') {
    throw new Error(
      'Qingyan R0 boundary violation: read-only (R0) callers cannot stage drafts or proposals; R1+ required.'
    );
  }

  const absRoot = path.resolve(vaultDir);
  const absSource = path.resolve(opts.sourcePath);
  const enforceEpistemic = opts.enforceEpistemicTemplate !== false;

  if (opts.draftMarkdown !== undefined && enforceEpistemic) {
    const check = validateEpistemicDraftStructure(opts.draftMarkdown);
    if (!check.valid) {
      throw new Error(
        `Epistemic contract violation: draft is missing required section(s): ${check.missingHeadings.join(', ')}`
      );
    }
  }

  const createdAt = opts.createdAt ?? new Date();
  const generator = opts.generator?.trim() || 'agent:aimake';
  const created = await createKnowledgeIntake(
    absRoot,
    absSource,
    opts.targetPath,
    generator,
    createdAt
  );

  let draftContent: string;
  try {
    if (opts.draftMarkdown !== undefined) {
      draftContent = opts.draftMarkdown;
    } else {
      const relSource = path.relative(absRoot, absSource).split(path.sep).join('/');
      const portableSourceResource =
        relSource && !relSource.startsWith('..') && !path.isAbsolute(relSource)
          ? relSource
          : path.basename(absSource);
      const inferredTitle =
        opts.title?.trim() ||
        path.posix.basename(created.intake.draft.path, '.md').replace(/[-_]+/g, ' ').trim() ||
        'Knowledge Note';

      draftContent = formatEpistemicDraftMarkdown({
        title: inferredTitle,
        type: opts.type ?? 'concept',
        status: opts.status ?? 'draft',
        tags: opts.tags,
        generator,
        createdAt,
        staleAfter: opts.staleAfter,
        intakeId: created.intake.id,
        sourceSha256: created.intake.source.sha256,
        sources: opts.sources ?? [
          {
            id: 'primary-source',
            resource: portableSourceResource,
            title: path.basename(absSource, path.extname(absSource)),
          },
        ],
        facts: opts.facts ?? [],
        inferences: opts.inferences,
        unverified: opts.unverified,
        relatedLinks: opts.relatedLinks,
      });
    }

    if (enforceEpistemic) {
      const check = validateEpistemicDraftStructure(draftContent);
      if (!check.valid) {
        throw new Error(
          `Epistemic contract violation: draft is missing required section(s): ${check.missingHeadings.join(', ')}`
        );
      }
    }

    const written = await writeKnowledgeIntakeDraft(absRoot, created.manifestPath, draftContent);

    if (opts.propose === false) {
      return {
        intake: written.intake,
        manifestPath: created.manifestPath,
        draftPath: written.draftPath,
        sourceSnapshotPath: created.sourceSnapshotPath,
        draftHash: written.contentHash,
        intakeMarkdown: intakeToMarkdown(written.intake),
      };
    }

    const summary =
      opts.summary?.trim() ||
      `Source-grounded synthesis for ${created.intake.draft.path} from ${created.intake.source.name}`;
    const proposed = await proposeKnowledgeIntake(
      absRoot,
      created.manifestPath,
      summary,
      opts.proposedAt ?? new Date()
    );

    const proposalRelFile =
      proposed.intake.proposal?.file ?? `.lwc/proposals/${proposed.proposal.id}.json`;
    const proposalPath = path.join(absRoot, ...proposalRelFile.split('/'));
    await writeJsonFile(proposalPath, proposed.proposal);
    await writeJsonFile(created.manifestPath, proposed.intake);

    return {
      intake: proposed.intake,
      manifestPath: created.manifestPath,
      draftPath: written.draftPath,
      sourceSnapshotPath: created.sourceSnapshotPath,
      draftHash: written.contentHash,
      intakeMarkdown: intakeToMarkdown(proposed.intake),
      proposal: proposed.proposal,
      proposalPath,
      proposalMarkdown: proposalToMarkdown(proposed.proposal),
    };
  } catch (err) {
    // Clean up isolated draft folder if staging failed prior to proposal persistence
    await fs.rm(path.dirname(created.manifestPath), { recursive: true, force: true }).catch(() => undefined);
    throw err;
  }
}

/**
 * Reviews, rejects, or applies a staged `@lwc/core` KnowledgeProposal while strictly enforcing
 * Qingyan Vault's R2/R3 human-review gate and exact proposal-ID confirmation.
 */
export async function reviewAndApplyVaultProposal(
  vaultDir: string,
  opts: ReviewAndApplyProposalOptions
): Promise<ReviewAndApplyProposalResult> {
  const level = opts.permissionLevel ?? 'R2';
  if (level === 'R0' || level === 'R1') {
    throw new Error(
      `Qingyan ${level} boundary violation: formal proposal review/apply requires R2 (single-file) or R3 (multi-file) human authorization.`
    );
  }

  const absRoot = path.resolve(vaultDir);
  const proposalPath =
    opts.proposalPath !== undefined
      ? path.resolve(opts.proposalPath)
      : path.join(absRoot, '.lwc', 'proposals', `${opts.proposalId}.json`);

  const rawJson = await fs.readFile(proposalPath, 'utf8');
  let current = parseKnowledgeProposal(JSON.parse(rawJson));

  if (current.changes.length > 1 && level !== 'R3') {
    throw new Error(
      `Qingyan R2 boundary violation: proposal ${current.id} modifies ${current.changes.length} files and requires R3 structural permission.`
    );
  }

  if (opts.action === 'reject') {
    const rejected = rejectKnowledgeProposal(
      current,
      opts.confirmation,
      opts.reason ?? 'Rejected by human reviewer',
      opts.rejectedAt ?? new Date()
    );
    await writeJsonFile(proposalPath, rejected);
    return {
      proposal: rejected,
      proposalPath,
      proposalMarkdown: proposalToMarkdown(rejected),
      writtenFiles: [],
    };
  }

  if (opts.action === 'review' || opts.action === 'review-and-apply') {
    const reviewer = opts.reviewer ?? '';
    assertNotAutonomousAgentReviewer(reviewer);
    current = reviewKnowledgeProposal(
      current,
      opts.confirmation,
      reviewer,
      opts.note,
      opts.reviewedAt ?? new Date()
    );
    await writeJsonFile(proposalPath, current);
    if (opts.action === 'review') {
      return {
        proposal: current,
        proposalPath,
        proposalMarkdown: proposalToMarkdown(current),
        writtenFiles: [],
      };
    }
  }

  if (current.review) {
    assertNotAutonomousAgentReviewer(current.review.reviewer);
  }

  const applied = await applyKnowledgeProposal(
    absRoot,
    current,
    opts.confirmation,
    opts.appliedAt ?? new Date()
  );
  await writeJsonFile(proposalPath, applied);

  return {
    proposal: applied,
    proposalPath,
    proposalMarkdown: proposalToMarkdown(applied),
    writtenFiles: applied.changes.map((c) => c.path),
  };
}

/**
 * Inspects draft & proposal governance queues via `@lwc/core` `readDraftInbox` + `readProposalInbox`
 * alongside Qingyan `Agent/草稿/` files (strictly R0 read-only).
 */
export async function getVaultGovernanceStatus(vaultDir: string): Promise<VaultGovernanceStatus> {
  const absRoot = path.resolve(vaultDir);
  const [layout, draftInbox, proposalInbox] = await Promise.all([
    detectVaultLayout(absRoot),
    readDraftInbox(absRoot),
    readProposalInbox(absRoot),
  ]);

  const agentDraftDir = path.join(absRoot, 'Agent', '草稿');
  let agentDraftFiles: string[] = [];
  if (await pathExists(agentDraftDir)) {
    const entries = await fs.readdir(agentDraftDir);
    agentDraftFiles = entries
      .filter((f) => f.endsWith('.md') && f.toLocaleLowerCase() !== 'readme.md')
      .sort()
      .map((f) => `Agent/草稿/${f}`);
  }

  const draftCounts = {
    total: draftInbox.drafts.length,
    ready: draftInbox.drafts.filter((d) => d.state === 'ready').length,
    needsDraft: draftInbox.drafts.filter((d) => d.state === 'needs-draft').length,
    proposed: draftInbox.drafts.filter((d) => d.state === 'proposed').length,
    blocked: draftInbox.drafts.filter((d) => d.state === 'blocked').length,
  };

  const proposalCounts = {
    total: proposalInbox.proposals.length,
    proposed: proposalInbox.proposals.filter((p) => p.status === 'proposed').length,
    reviewed: proposalInbox.proposals.filter((p) => p.status === 'reviewed').length,
    applied: proposalInbox.proposals.filter((p) => p.status === 'applied').length,
    rejected: proposalInbox.proposals.filter((p) => p.status === 'rejected').length,
  };

  return {
    layout,
    draftInbox,
    proposalInbox,
    agentDraftFiles,
    draftCounts,
    proposalCounts,
    issues: [...draftInbox.issues, ...proposalInbox.issues],
  };
}

function parseSlideCitationString(rawCite: string): { target: string; anchor?: string } {
  let cleaned = rawCite.trim();
  const wikiMatch = cleaned.match(/^\[\[([^\]|#]+)(?:#([^\]|]+))?(?:\|[^\]]+)?\]\]$/);
  if (wikiMatch) {
    return {
      target: wikiMatch[1].trim(),
      anchor: wikiMatch[2]?.trim() || undefined,
    };
  }
  const hashIdx = cleaned.indexOf('#');
  if (hashIdx >= 0) {
    return {
      target: cleaned.slice(0, hashIdx).trim(),
      anchor: cleaned.slice(hashIdx + 1).trim() || undefined,
    };
  }
  return { target: cleaned };
}

function resolveNodeForCitation(graph: WikiGraph, target: string): {
  node?: WikiNode;
  ambiguousPaths?: string[];
} {
  const key = normalizeLookupKey(target);
  if (!key) return {};

  // 1. Exact relative path match
  const exactPathMatches = graph.nodes.filter((n) => normalizeLookupKey(n.path) === key);
  if (exactPathMatches.length === 1) {
    return { node: exactPathMatches[0] };
  }

  // 2. Basename, title, or stable node ID match
  const broadMatches = graph.nodes.filter((n) => {
    const keys = [
      n.id.toLocaleLowerCase(),
      normalizeLookupKey(n.path),
      normalizeLookupKey(path.posix.basename(n.path)),
      normalizeLookupKey(n.title),
    ];
    return keys.includes(key);
  });

  if (broadMatches.length === 0) return {};
  if (broadMatches.length === 1) return { node: broadMatches[0] };

  const nonRaw = broadMatches.filter(
    (n) =>
      !n.path.toLocaleLowerCase().startsWith('raw/') &&
      !n.path.toLocaleLowerCase().startsWith('agent/草稿/')
  );
  if (nonRaw.length === 1) {
    return { node: nonRaw[0] };
  }
  return { ambiguousPaths: broadMatches.map((n) => n.path) };
}

/**
 * Cross-checks every `slide.cite` in a `DeckDocument` against `@lwc/core` `buildGraph(vaultDir)`
 * nodes, OKF `node.trust` (`tier`, `stale`, `sources`), and applied human-reviewed proposals.
 */
export async function verifyDeckCitationsAgainstVault(
  deck: DeckDocument,
  vaultDir: string,
  opts?: { now?: Date; graph?: WikiGraph }
): Promise<DeckCitationVerificationReport> {
  const absRoot = path.resolve(vaultDir);
  const [graph, proposalInbox] = await Promise.all([
    opts?.graph ? Promise.resolve(opts.graph) : buildGraph(absRoot, opts?.now ?? new Date()),
    readProposalInbox(absRoot),
  ]);

  const humanReviewedPaths = new Set<string>();
  for (const prop of proposalInbox.proposals) {
    if (
      prop.status === 'applied' &&
      prop.review?.reviewer &&
      prop.review.reviewer.toLocaleLowerCase().startsWith('human:')
    ) {
      for (const ch of prop.changes) {
        if (ch.targetState === 'matches-proposal') {
          humanReviewedPaths.add(ch.path);
        }
      }
    }
  }

  const slides: SlideCitationVerification[] = deck.slides.map((slide) => {
    if (!slide.cite || !slide.cite.trim()) {
      return {
        slideIndex: slide.index,
        slideId: slide.id,
        slideTitle: slide.title,
        status: 'uncited',
        stale: false,
        sources: [],
      };
    }

    const { target, anchor } = parseSlideCitationString(slide.cite);
    const resolved = resolveNodeForCitation(graph, target);

    if (!resolved.node) {
      return {
        slideIndex: slide.index,
        slideId: slide.id,
        slideTitle: slide.title,
        cite: slide.cite,
        anchor,
        status: 'unresolved',
        stale: false,
        sources: [],
        reason: resolved.ambiguousPaths
          ? `Ambiguous citation matches multiple vault nodes: ${resolved.ambiguousPaths.join(', ')}`
          : `Cited target not found in vault graph: ${target}`,
      };
    }

    const node = resolved.node;
    const trust = node.trust;
    const isStale = Boolean(trust?.stale || trust?.status === 'deprecated');
    const derivedTier: KnowledgeTrustTier =
      trust?.tier === 'human-reviewed' || humanReviewedPaths.has(node.path)
        ? 'human-reviewed'
        : trust?.tier ?? 'unverified';

    const sources: KnowledgeSource[] =
      trust?.sources && trust.sources.length > 0
        ? trust.sources
        : node.source
          ? [{ resource: node.source }]
          : [];

    return {
      slideIndex: slide.index,
      slideId: slide.id,
      slideTitle: slide.title,
      cite: slide.cite,
      anchor,
      status: isStale ? 'stale' : 'verified',
      matchedNodeId: node.id,
      matchedNodePath: node.path,
      matchedNodeTitle: node.title,
      trustTier: derivedTier,
      stale: isStale,
      staleAfter: trust?.staleAfter,
      sources,
      reason: isStale
        ? trust?.status === 'deprecated'
          ? `Node ${node.path} is marked deprecated`
          : `Node ${node.path} passed stale_after date (${trust?.staleAfter ?? 'expired'})`
        : undefined,
    };
  });

  const counts: Record<SlideCitationStatus, number> = {
    verified: slides.filter((s) => s.status === 'verified').length,
    stale: slides.filter((s) => s.status === 'stale').length,
    unresolved: slides.filter((s) => s.status === 'unresolved').length,
    uncited: slides.filter((s) => s.status === 'uncited').length,
  };

  return {
    deckTitle: deck.frontmatter.title,
    vaultRootName: graph.rootName,
    valid: counts.unresolved === 0 && counts.stale === 0,
    counts,
    slides,
  };
}

/**
 * Builds an Obsidian Bases `.base` configuration inspired by `qingyan-vault/知识总览.base`,
 * covering both Aimake (`wiki/`, `raw/`, `outputs/`, `personas/`) and Qingyan (`知识/`, `来源/`, `项目/`, `收件箱/`) folders.
 */
export function buildVaultOverviewBaseYaml(): string {
  return [
    'filters:',
    '  and:',
    '    - file.ext == "md"',
    '    - file.name != "log"',
    '    - file.name != "README"',
    '    - file.name != "AGENTS"',
    '    - file.name != "CLAUDE"',
    '    - or:',
    '        - file.inFolder("wiki")',
    '        - file.inFolder("raw")',
    '        - file.inFolder("outputs")',
    '        - file.inFolder("personas")',
    '        - file.inFolder("收件箱")',
    '        - file.inFolder("来源")',
    '        - file.inFolder("知识")',
    '        - file.inFolder("项目")',
    '        - file.inFolder("知识地图")',
    'properties:',
    '  file.name:',
    '    displayName: 标题 / Title',
    '  note.type:',
    '    displayName: 类型 / Type',
    '  note.status:',
    '    displayName: 状态 / Status',
    '  note.stale_after:',
    '    displayName: 有效期 / Fresh Until',
    '  file.tags:',
    '    displayName: 标签 / Tags',
    'views:',
    '  - type: table',
    '    name: 全部知识 (All Knowledge)',
    '    order:',
    '      - file.name',
    '      - type',
    '      - status',
    '      - stale_after',
    '      - file.tags',
    '  - type: table',
    '    name: 长期知识 (Active Wiki)',
    '    filters:',
    '      or:',
    '        - file.inFolder("wiki")',
    '        - file.inFolder("知识")',
    '    order:',
    '      - file.name',
    '      - status',
    '      - stale_after',
    '      - file.tags',
    '  - type: table',
    '    name: 来源架 (Sources)',
    '    filters:',
    '      or:',
    '        - file.inFolder("raw")',
    '        - file.inFolder("来源")',
    '    order:',
    '      - file.name',
    '      - file.tags',
    '  - type: table',
    '    name: 交付产物 (Outputs)',
    '    filters:',
    '      and:',
    '        - file.inFolder("outputs")',
    '    order:',
    '      - file.name',
    '      - file.tags',
    '',
  ].join('\n');
}

export async function ensureVaultOverviewBase(
  targetDir: string,
  fileName = 'Overview.base',
  overwrite = false
): Promise<string> {
  const basePath = path.join(path.resolve(targetDir), fileName);
  if (overwrite || !(await pathExists(basePath))) {
    await fs.mkdir(path.dirname(basePath), { recursive: true });
    await fs.writeFile(basePath, buildVaultOverviewBaseYaml(), 'utf8');
  }
  return basePath;
}

async function readOptionalJson<T>(filePath: string): Promise<T | undefined> {
  try {
    const text = await fs.readFile(filePath, 'utf8');
    return JSON.parse(text) as T;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      return undefined;
    }
    throw err;
  }
}

/**
 * Exports Obsidian JSON Canvas (`.canvas`, preserving manual coordinates & annotations),
 * Excalidraw (`.excalidraw`, preserving manual coordinates & annotations), and Mermaid (`flowchart LR`
 * with optional 1–2 hop `selectFocusedGraph` focus) directly via `@lwc/core`.
 */
export async function exportVaultVisuals(
  vaultDir: string,
  opts?: ExportVaultVisualsOptions
): Promise<ExportedVaultVisuals> {
  const absVault = path.resolve(vaultDir);
  const absOut = opts?.outDir ? path.resolve(opts.outDir) : absVault;
  const graph = opts?.graph ?? (await buildGraph(absVault, opts?.now ?? new Date()));

  const canvasPath = path.join(absOut, opts?.canvasFileName ?? 'Wiki.canvas');
  const excalidrawPath = path.join(absOut, opts?.excalidrawFileName ?? 'Wiki.excalidraw');
  const mermaidPath = path.join(absOut, opts?.mermaidFileName ?? 'Wiki.mmd');

  const [previousCanvas, previousExcalidraw] = await Promise.all([
    readOptionalJson<JsonCanvas>(canvasPath),
    readOptionalJson<ExcalidrawDocument>(excalidrawPath),
  ]);

  let focusedGraph: FocusedGraph | undefined;
  if (opts?.focusQuery) {
    const resolvedFocus = resolveVaultFocusQuery(graph, opts.focusQuery);
    focusedGraph = selectFocusedGraph(graph, resolvedFocus, {
      depth: opts.focusDepth ?? 1,
      direction: opts.focusDirection ?? 'both',
      kinds: opts.focusKinds,
    });
  }

  const canvasLayout = summarizeCanvasLayout(graph, previousCanvas);
  const canvas = graphToCanvas(graph, previousCanvas);

  const excalidrawLayout = summarizeExcalidrawLayout(graph, previousExcalidraw);
  const excalidraw = graphToExcalidraw(graph, {
    focusId: focusedGraph?.focus.id,
    previous: previousExcalidraw,
  });

  const mermaid = focusedGraph
    ? graphToMermaid(focusedGraph.graph, focusedGraph.focus)
    : graphToMermaid(graph);

  await Promise.all([
    writeJsonFile(canvasPath, canvas),
    writeJsonFile(excalidrawPath, excalidraw),
    fs.mkdir(path.dirname(mermaidPath), { recursive: true }).then(() =>
      fs.writeFile(mermaidPath, mermaid, 'utf8')
    ),
  ]);

  let overviewBasePath: string | undefined;
  if (opts?.writeOverviewBase !== false) {
    overviewBasePath = await ensureVaultOverviewBase(
      absOut,
      opts?.overviewBaseFileName ?? 'Overview.base',
      Boolean(opts?.overwriteOverviewBase)
    );
  }

  return {
    graph,
    canvasPath,
    canvas,
    canvasLayout,
    excalidrawPath,
    excalidraw,
    excalidrawLayout,
    mermaidPath,
    mermaid,
    focusedGraph,
    overviewBasePath,
  };
}
