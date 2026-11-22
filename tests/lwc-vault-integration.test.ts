import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { parseDeckMarkdown } from '../src/renderer/deck-parser.js';
import {
  compileVaultGraph,
  detectVaultLayout,
  EPISTEMIC_FACTS_HEADING,
  EPISTEMIC_INFERENCES_HEADING,
  EPISTEMIC_UNVERIFIED_HEADING,
  exportVaultVisuals,
  getVaultContextBundle,
  getVaultGovernanceStatus,
  INDEX_TOKEN_BUDGET,
  initWikiVault,
  lintWiki,
  PERSONA_TOKEN_BUDGET,
  reviewAndApplyVaultProposal,
  stageVaultIntakeAndProposal,
  verifyDeckCitationsAgainstVault,
} from '../src/wiki/wiki-engine.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SIBLING_QINGYAN_VAULT = path.resolve(__dirname, '../../open-source/qingyan-vault');

async function isDirectory(target: string): Promise<boolean> {
  try {
    return (await fs.stat(target)).isDirectory();
  } catch {
    return false;
  }
}

describe('@lwc/core & Qingyan Vault Integration', () => {
  it('initializes Overview.base + AGENTS.md idempotently and delegates lint diagnostics to @lwc/core', async () => {
    const tmpVault = await fs.mkdtemp(path.join(os.tmpdir(), 'aimake-lwc-lint-'));
    try {
      await initWikiVault(tmpVault);

      const overviewBase = await fs.readFile(path.join(tmpVault, 'Overview.base'), 'utf8');
      expect(overviewBase).toContain('file.inFolder("wiki")');
      expect(overviewBase).toContain('file.inFolder("知识")');

      const agentsMd = await fs.readFile(path.join(tmpVault, 'AGENTS.md'), 'utf8');
      expect(agentsMd).toContain('R0');
      expect(agentsMd).toContain('R3');
      expect(agentsMd).toContain(EPISTEMIC_FACTS_HEADING);
      expect(agentsMd).toContain(EPISTEMIC_INFERENCES_HEADING);
      expect(agentsMd).toContain(EPISTEMIC_UNVERIFIED_HEADING);

      // Re-init must preserve user edits to Overview.base and AGENTS.md
      const customMarker = '\n<!-- custom-user-note -->\n';
      await fs.appendFile(path.join(tmpVault, 'AGENTS.md'), customMarker, 'utf8');
      await initWikiVault(tmpVault);
      expect(await fs.readFile(path.join(tmpVault, 'AGENTS.md'), 'utf8')).toContain(
        'custom-user-note'
      );

      // Add a broken link, an orphan page without H1/title, duplicate-named notes for ambiguity, and an oversized persona
      await fs.writeFile(
        path.join(tmpVault, 'wiki', 'orphan-untitled.md'),
        'Plain body without a heading or frontmatter title.',
        'utf8'
      );
      await fs.mkdir(path.join(tmpVault, 'wiki', 'a'), { recursive: true });
      await fs.mkdir(path.join(tmpVault, 'wiki', 'b'), { recursive: true });
      await fs.writeFile(path.join(tmpVault, 'wiki', 'a', 'shared.md'), '# Shared\nCopy A.\n', 'utf8');
      await fs.writeFile(path.join(tmpVault, 'wiki', 'b', 'shared.md'), '# Shared\nCopy B.\n', 'utf8');
      await fs.writeFile(
        path.join(tmpVault, 'wiki', 'linker.md'),
        '# Linker\n\nSee [[missing-target]] and [[shared]].\n',
        'utf8'
      );
      await fs.writeFile(
        path.join(tmpVault, 'personas', 'too-big.md'),
        `# Oversized Persona\n\n${'verbose style description '.repeat(400)}`,
        'utf8'
      );

      const lint = await lintWiki(tmpVault);
      expect(lint.valid).toBe(false);
      expect(lint.indexTokens).toBeLessThanOrEqual(INDEX_TOKEN_BUDGET);
      expect(lint.brokenLinks).toContainEqual({
        file: 'wiki/linker.md',
        target: 'missing-target',
      });
      expect(lint.orphanPages).toContain('orphan-untitled');
      expect(lint.missingTitles).toContain('wiki/orphan-untitled.md');
      expect(lint.ambiguousLinks.some((a) => a.file === 'wiki/linker.md' && a.target === 'shared')).toBe(
        true
      );
      expect(lint.oversizedPersonas).toHaveLength(1);
      expect(lint.oversizedPersonas[0].tokens).toBeGreaterThan(PERSONA_TOKEN_BUDGET);
      expect(lint.graphStats.brokenLinks).toBeGreaterThanOrEqual(1);
    } finally {
      await fs.rm(tmpVault, { recursive: true, force: true });
    }
  });

  it('runs the governed intake -> isolated draft -> proposal -> human review -> apply lifecycle via @lwc/core', async () => {
    const tmpVault = await fs.mkdtemp(path.join(os.tmpdir(), 'aimake-lwc-gov-'));
    try {
      await initWikiVault(tmpVault);
      const sourceFile = path.join(tmpVault, 'raw', '2026-11-19-local-first.md');
      await fs.writeFile(
        sourceFile,
        '# Local-First Principle\n\nLocal Markdown files remain readable offline without cloud accounts.\n',
        'utf8'
      );

      // R0 boundary blocks staging
      await expect(
        stageVaultIntakeAndProposal(tmpVault, {
          sourcePath: sourceFile,
          targetPath: 'wiki/local-first-spec.md',
          permissionLevel: 'R0',
          facts: ['Local Markdown remains readable offline.'],
        })
      ).rejects.toThrow(/R0 boundary violation/);

      // Epistemic contract rejects drafts missing Fact/Inference/Unverified sections
      await expect(
        stageVaultIntakeAndProposal(tmpVault, {
          sourcePath: sourceFile,
          targetPath: 'wiki/local-first-spec.md',
          permissionLevel: 'R1',
          draftMarkdown: '# Unstructured Draft\n\nNo epistemic headings here.\n',
        })
      ).rejects.toThrow(/Epistemic contract violation/);

      // R1 stages isolated draft + proposal without writing formal wiki/local-first-spec.md
      const staged = await stageVaultIntakeAndProposal(tmpVault, {
        sourcePath: sourceFile,
        targetPath: 'wiki/local-first-spec.md',
        title: 'Local-First Specification',
        permissionLevel: 'R1',
        tags: ['architecture', 'local-first'],
        staleAfter: '2030-12-31',
        facts: ['Local Markdown files remain readable offline without cloud accounts.'],
        inferences: ['Zero-backend vaults reduce long-term vendor lock-in.'],
        unverified: ['Large vault latency above 50,000 files has not been benchmarked here.'],
        relatedLinks: ['[[index]]'],
      });

      expect(staged.proposal).toBeDefined();
      expect(staged.intake.source.sha256).toHaveLength(64);
      expect(await fs.access(path.join(tmpVault, 'wiki', 'local-first-spec.md')).then(() => true).catch(() => false)).toBe(false);

      const statusBefore = await getVaultGovernanceStatus(tmpVault);
      expect(statusBefore.layout).toBe('aimake');
      expect(statusBefore.draftCounts.proposed).toBe(1);
      expect(statusBefore.proposalCounts.proposed).toBe(1);

      const proposalId = staged.proposal!.id;

      // R1 cannot review or apply formal proposals
      await expect(
        reviewAndApplyVaultProposal(tmpVault, {
          proposalId,
          confirmation: proposalId,
          action: 'review-and-apply',
          reviewer: 'human:editor',
          permissionLevel: 'R1',
        })
      ).rejects.toThrow(/R1 boundary violation/);

      // Autonomous agent identities cannot approve proposals
      await expect(
        reviewAndApplyVaultProposal(tmpVault, {
          proposalId,
          confirmation: proposalId,
          action: 'review-and-apply',
          reviewer: 'agent:aimake',
          permissionLevel: 'R2',
        })
      ).rejects.toThrow(/Human-review boundary violation/);

      // R2 human review + exact proposal-ID confirmation applies the formal note
      const applied = await reviewAndApplyVaultProposal(tmpVault, {
        proposalId,
        confirmation: proposalId,
        action: 'review-and-apply',
        reviewer: 'human:editor',
        note: 'Verified facts against raw source snapshot.',
        permissionLevel: 'R2',
      });

      expect(applied.proposal.status).toBe('applied');
      expect(applied.writtenFiles).toEqual(['wiki/local-first-spec.md']);

      const formalContent = await fs.readFile(
        path.join(tmpVault, 'wiki', 'local-first-spec.md'),
        'utf8'
      );
      expect(formalContent).toContain(EPISTEMIC_FACTS_HEADING);
      expect(formalContent).toContain(EPISTEMIC_INFERENCES_HEADING);
      expect(formalContent).toContain(EPISTEMIC_UNVERIFIED_HEADING);
      expect(formalContent).toContain(staged.intake.source.sha256);

      const statusAfter = await getVaultGovernanceStatus(tmpVault);
      expect(statusAfter.proposalCounts.applied).toBe(1);
    } finally {
      await fs.rm(tmpVault, { recursive: true, force: true });
    }
  });

  it('builds 0–2 hop topology-bounded context bundles with SHA-256 provenance', async () => {
    const tmpVault = await fs.mkdtemp(path.join(os.tmpdir(), 'aimake-lwc-ctx-'));
    try {
      await initWikiVault(tmpVault);
      await fs.writeFile(
        path.join(tmpVault, 'wiki', 'hop-0.md'),
        '# Hop Zero\n\nRoot topic referencing [[hop-1]].\n',
        'utf8'
      );
      await fs.writeFile(
        path.join(tmpVault, 'wiki', 'hop-1.md'),
        '# Hop One\n\nDirect neighbor referencing [[hop-2]].\n',
        'utf8'
      );
      await fs.writeFile(
        path.join(tmpVault, 'wiki', 'hop-2.md'),
        '# Hop Two\n\nSecond-degree neighbor referencing [[hop-3]].\n',
        'utf8'
      );
      await fs.writeFile(
        path.join(tmpVault, 'wiki', 'hop-3.md'),
        '# Hop Three\n\nDistant page outside two-hop radius.\n',
        'utf8'
      );

      const hop0 = await getVaultContextBundle(tmpVault, 'wiki/hop-0.md', {
        depth: 0,
        direction: 'outgoing',
      });
      expect(hop0.bundle.pages.map((p) => p.path)).toEqual(['wiki/hop-0.md']);
      expect(hop0.bundle.pages[0].distance).toBe(0);
      expect(hop0.bundle.pages[0].contentSha256).toMatch(/^[a-f0-9]{64}$/);

      const hop1 = await getVaultContextBundle(tmpVault, 'Hop Zero', {
        depth: 1,
        direction: 'outgoing',
      });
      expect(hop1.bundle.pages.map((p) => p.path)).toEqual(['wiki/hop-0.md', 'wiki/hop-1.md']);
      expect(hop1.bundle.pages.map((p) => p.distance)).toEqual([0, 1]);

      const hop2 = await getVaultContextBundle(tmpVault, 'Hop Zero', {
        depth: 2,
        direction: 'outgoing',
      });
      expect(hop2.bundle.pages.map((p) => p.path)).toEqual([
        'wiki/hop-0.md',
        'wiki/hop-1.md',
        'wiki/hop-2.md',
      ]);
      expect(hop2.bundle.pages.some((p) => p.path === 'wiki/hop-3.md')).toBe(false);
      expect(hop2.markdown).toContain('SHA-256:');
      expect(hop2.markdown).toContain(hop2.bundle.pages[0].contentSha256);
      expect(hop2.estimatedTokens).toBeGreaterThan(0);
    } finally {
      await fs.rm(tmpVault, { recursive: true, force: true });
    }
  });

  it('verifies deck citations against vault nodes for verified, stale, unresolved, and uncited slides', async () => {
    const tmpVault = await fs.mkdtemp(path.join(os.tmpdir(), 'aimake-lwc-cite-'));
    try {
      await initWikiVault(tmpVault);
      const rawSource = path.join(tmpVault, 'raw', 'benchmark-2026.md');
      await fs.writeFile(rawSource, '# Benchmark 2026\n\nMeasured local compile time: 42ms.\n', 'utf8');

      // Stage, review, and apply a human-reviewed fresh note
      const staged = await stageVaultIntakeAndProposal(tmpVault, {
        sourcePath: rawSource,
        targetPath: 'wiki/fresh-benchmark.md',
        title: 'Fresh Benchmark',
        staleAfter: '2030-12-31',
        facts: ['Measured local compile time: 42ms.'],
      });
      await reviewAndApplyVaultProposal(tmpVault, {
        proposalId: staged.proposal!.id,
        confirmation: staged.proposal!.id,
        action: 'review-and-apply',
        reviewer: 'human:editor',
        permissionLevel: 'R2',
      });

      // Add a stale note with an expired stale_after date
      await fs.writeFile(
        path.join(tmpVault, 'wiki', 'legacy-metrics.md'),
        [
          '---',
          'title: "Legacy Metrics"',
          'type: "concept"',
          'status: "stable"',
          'stale_after: "2020-01-01"',
          'sources:',
          '  - resource: "raw/benchmark-2026.md"',
          '---',
          '',
          '# Legacy Metrics',
          '',
          'Historical numbers from 2019.',
          '',
        ].join('\n'),
        'utf8'
      );

      const deck = parseDeckMarkdown(`---
title: Citation Audit Deck
template: xhs-swiss-grid
locale: en
aspect: 3:4
---

<!-- scene: s1 | layout: metrics | cite: wiki/fresh-benchmark.md#facts -->
# Fresh Metric
- 42ms compile time

---

<!-- scene: s2 | layout: bullets | cite: wiki/legacy-metrics.md -->
# Outdated Metric
- Legacy 2019 numbers

---

<!-- scene: s3 | layout: bullets | cite: wiki/nonexistent-note.md -->
# Broken Citation
- Points nowhere

---

<!-- scene: s4 | layout: outro -->
# Closing Slide
- Summary without citation
`);

      const report = await verifyDeckCitationsAgainstVault(deck, tmpVault, {
        now: new Date('2026-11-19T00:00:00.000Z'),
      });

      expect(report.valid).toBe(false);
      expect(report.counts).toEqual({
        verified: 1,
        stale: 1,
        unresolved: 1,
        uncited: 1,
      });

      expect(report.slides[0].status).toBe('verified');
      expect(report.slides[0].matchedNodePath).toBe('wiki/fresh-benchmark.md');
      expect(report.slides[0].anchor).toBe('facts');
      expect(report.slides[0].trustTier).toBe('human-reviewed');
      expect(report.slides[0].sources.length).toBeGreaterThanOrEqual(1);

      expect(report.slides[1].status).toBe('stale');
      expect(report.slides[1].stale).toBe(true);
      expect(report.slides[1].staleAfter).toBe('2020-01-01');

      expect(report.slides[2].status).toBe('unresolved');
      expect(report.slides[2].reason).toContain('not found');

      expect(report.slides[3].status).toBe('uncited');

      const cleanDeck = parseDeckMarkdown(`---
title: Clean Deck
template: xhs-swiss-grid
locale: en
aspect: 3:4
---

<!-- scene: s1 | layout: bullets | cite: [[fresh-benchmark]] -->
# Grounded Slide
- Verified claim
`);
      const cleanReport = await verifyDeckCitationsAgainstVault(cleanDeck, tmpVault, {
        now: new Date('2026-11-19T00:00:00.000Z'),
      });
      expect(cleanReport.valid).toBe(true);
      expect(cleanReport.counts.verified).toBe(1);
    } finally {
      await fs.rm(tmpVault, { recursive: true, force: true });
    }
  });

  it('exports Obsidian .canvas, .excalidraw, Mermaid flowchart LR, and preserves layout on re-export', async () => {
    const tmpVault = await fs.mkdtemp(path.join(os.tmpdir(), 'aimake-lwc-visuals-'));
    const outDir = path.join(tmpVault, 'outputs', 'visuals');
    try {
      await initWikiVault(tmpVault);
      await fs.writeFile(
        path.join(tmpVault, 'wiki', 'architecture.md'),
        '# Architecture\n\nLinks to [[provenance]] and [[index]].\n',
        'utf8'
      );
      await fs.writeFile(
        path.join(tmpVault, 'wiki', 'provenance.md'),
        '# Provenance\n\nSHA-256 verification for local knowledge.\n',
        'utf8'
      );

      const first = await exportVaultVisuals(tmpVault, {
        outDir,
        focusQuery: 'wiki/architecture.md',
        focusDepth: 1,
      });

      expect(first.canvas.nodes.length).toBeGreaterThanOrEqual(2);
      expect(first.canvas.edges.length).toBeGreaterThanOrEqual(1);
      expect(first.excalidraw.type).toBe('excalidraw');
      expect(first.excalidraw.version).toBe(2);
      expect(first.excalidraw.elements.length).toBeGreaterThan(0);
      expect(first.mermaid).toContain('flowchart LR');
      expect(first.mermaid).toContain('Architecture');
      expect(first.overviewBasePath).toBe(path.join(outDir, 'Overview.base'));

      // Verify files actually exist on disk and are valid JSON / Mermaid
      const canvasOnDisk = JSON.parse(await fs.readFile(first.canvasPath, 'utf8'));
      const excalidrawOnDisk = JSON.parse(await fs.readFile(first.excalidrawPath, 'utf8'));
      const mermaidOnDisk = await fs.readFile(first.mermaidPath, 'utf8');
      expect(canvasOnDisk.nodes.length).toBe(first.canvas.nodes.length);
      expect(excalidrawOnDisk.type).toBe('excalidraw');
      expect(mermaidOnDisk).toContain('flowchart LR');

      // Re-export should preserve existing node positions
      const second = await exportVaultVisuals(tmpVault, {
        outDir,
        focusQuery: 'wiki/architecture.md',
        focusDepth: 1,
      });
      expect(second.canvasLayout.preserved).toBeGreaterThan(0);
      expect(second.excalidrawLayout.preserved).toBeGreaterThan(0);
    } finally {
      await fs.rm(tmpVault, { recursive: true, force: true });
    }
  });

  it('passes strictly read-only compatibility checks against sibling qingyan-vault when present', async () => {
    if (!(await isDirectory(SIBLING_QINGYAN_VAULT))) {
      // Gracefully skip when sibling repo is absent (e.g., standalone checkout)
      return;
    }

    const layout = await detectVaultLayout(SIBLING_QINGYAN_VAULT);
    expect(layout).toBe('qingyan');

    const compiled = await compileVaultGraph(SIBLING_QINGYAN_VAULT);
    expect(compiled.layout).toBe('qingyan');
    expect(compiled.entryNode?.path).toBe('Home.md');
    expect(compiled.sourceNodes.length).toBeGreaterThan(0);
    expect(compiled.knowledgeNodes.length).toBeGreaterThan(0);
    expect(compiled.graph.edges.length).toBeGreaterThan(0);
    expect(
      compiled.graph.diagnostics.filter(
        (d) => d.code === 'BROKEN_LINK' && d.path.startsWith('知识/')
      )
    ).toEqual([]);

    const ctx = await getVaultContextBundle(SIBLING_QINGYAN_VAULT, 'Home.md', {
      depth: 1,
      maxPages: 6,
      maxWords: 1200,
    });
    expect(ctx.bundle.pages.length).toBeGreaterThanOrEqual(2);
    expect(ctx.bundle.pages[0].path).toBe('Home.md');
    expect(ctx.bundle.pages.every((p) => /^[a-f0-9]{64}$/.test(p.contentSha256))).toBe(true);

    const gov = await getVaultGovernanceStatus(SIBLING_QINGYAN_VAULT);
    expect(gov.layout).toBe('qingyan');

    const deck = parseDeckMarkdown(`---
title: Qingyan Compatibility Check
template: xhs-swiss-grid
locale: zh-CN
aspect: 3:4
---

<!-- scene: s1 | layout: bullets | cite: 知识/温柔入口降低决策负担.md -->
# 温柔入口
- 降低打开知识库的决策负担
`);
    const citationReport = await verifyDeckCitationsAgainstVault(deck, SIBLING_QINGYAN_VAULT, {
      graph: compiled.graph,
    });
    expect(citationReport.valid).toBe(true);
    expect(citationReport.counts.verified).toBe(1);

    // Export visuals into an isolated temp directory so sibling qingyan-vault is NEVER modified
    const tmpExport = await fs.mkdtemp(path.join(os.tmpdir(), 'aimake-qingyan-export-'));
    try {
      const visuals = await exportVaultVisuals(SIBLING_QINGYAN_VAULT, {
        outDir: tmpExport,
        graph: compiled.graph,
        focusQuery: 'Home.md',
        focusDepth: 1,
      });
      expect(visuals.canvas.nodes.length).toBeGreaterThan(0);
      expect(visuals.excalidraw.type).toBe('excalidraw');
      expect(visuals.mermaid).toContain('flowchart LR');
    } finally {
      await fs.rm(tmpExport, { recursive: true, force: true });
    }
  });
});
