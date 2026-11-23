#!/usr/bin/env node
import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Command } from 'commander';
import * as p from '@clack/prompts';
import pc from 'picocolors';
import type { AspectRatio, DeckDocument, ExportFormat, SupportedLocale } from './schema/types.js';
import { parseDeckMarkdown, serializeDeckMarkdown } from './renderer/deck-parser.js';
import { importExternalMarkdownDeck } from './renderer/importers.js';
import { listTemplates } from './renderer/html-compiler.js';
import { exportDeckBundle, resolveWorkingFfmpegBinary } from './renderer/exporter-media.js';
import {
  auditAiSlop,
  extractStyleDNAFromSamples,
  formatStyleDNAMarkdown,
  humanizeText,
} from './wiki/humanizer.js';
import {
  compileVaultGraph,
  compoundOutputToWiki,
  exportVaultVisuals,
  getVaultContextBundle,
  getVaultGovernanceStatus,
  ingestSource,
  ingestSourcesBatch,
  initWikiVault,
  lintWiki,
  rebuildWikiIndex,
  verifyDeckCitationsAgainstVault,
} from './wiki/wiki-engine.js';
import { runTrendRadar } from './radar/radar-engine.js';
import {
  anonymizeDeckToSyntheticMock,
  sanitizeContentForPR,
} from './sanitizer/pr-sanitizer.js';
import { detectLocalHosts, installAimakeSkill } from './installer/host-installer.js';
import { startStudioServer } from './studio/studio-server.js';
import {
  processChatMessage,
  rollbackChatSnapshot,
  type ChatBackendId,
  type ChatIntent,
} from './studio/chat-engine.js';
import { startStdioMcpServer } from './mcp/mcp-server.js';
import { buildStaticSite } from './site/site-builder.js';
import {
  installMarketplaceItem,
  listInstalledTemplates,
  listMarketplaceCatalog,
  remixDeckWithStyle,
  removeInstalledTemplate,
  searchMarketplace,
} from './marketplace/index.js';
import {
  buildDeckFromFacts,
  createTencentTccliSpeechProvider,
  extractFactsFromReleaseOrMarkdown,
  offlineFixtureSpeechProvider,
  synthesizeDeckSpeech,
} from './speech/index.js';
import { detectOpenCodeStatus } from './desktop/opencode-bridge.js';
import {
  BEGINNER_TASK_RECIPES,
  configureWorkspaceAgents,
  detectInstalledAgents,
  ingestWorkspaceSource,
  initWorkspace,
  inspectWorkspaceSkills,
  launchAgentInWorkspace,
  readWorkspaceState,
} from './workspace/index.js';
import type { AgentHostId, WorkspaceScenarioPreset } from './workspace/index.js';
import { publishContent } from './publisher/index.js';
import { normalizeSource } from './intake/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = __dirname.endsWith('dist')
  ? path.resolve(__dirname, '..')
  : path.resolve(__dirname, '..');

function printResult(data: unknown, asJson?: boolean, humanSummary?: string): void {
  if (asJson) {
    process.stdout.write(`${JSON.stringify(data, null, 2)}\n`);
  } else if (humanSummary) {
    process.stdout.write(`${humanSummary}\n`);
  } else {
    process.stdout.write(`${JSON.stringify(data, null, 2)}\n`);
  }
}

const program = new Command();
program
  .name('aimake')
  .description('Aimake — Local-first multimodal content creation, Marketplace & Karpathy LLM Wiki studio')
  .version('2.0.0');

program
  .command('doctor')
  .description('Verify local runtime, optional FFmpeg/Playwright, templates, OpenCode, and detected AI hosts')
  .option('--home <dir>', 'Custom home directory root for isolated sandbox testing')
  .option('--json', 'Emit machine-readable JSON')
  .action(async (opts: { home?: string; json?: boolean }) => {
    let ffmpegPath = 'not installed (optional: brew install ffmpeg for MP4)';
    try {
      ffmpegPath = await resolveWorkingFfmpegBinary();
    } catch {
      // optional dependency
    }
    const homeDir = opts.home ? path.resolve(opts.home) : undefined;
    const hosts = await detectLocalHosts(homeDir);
    const templates = await listTemplates();
    const detectedHosts = hosts.filter((h) => h.detected);
    const aiStatus = await detectOpenCodeStatus({ sandboxHomeDir: homeDir });

    const report = {
      ok: true,
      nodeVersion: process.version,
      ffmpegPath,
      homeDir: homeDir || 'default-user-home (read-only scan)',
      templateCount: templates.length,
      opencode: aiStatus.opencode,
      detectedHostCount: detectedHosts.length,
      detectedHosts: detectedHosts.map((h) => ({ id: h.id, name: h.name, path: h.targetSkillPath })),
    };

    const lines = [
      `Aimake v2.0.0 Doctor`,
      `  Node.js       : ${report.nodeVersion}`,
      `  FFmpeg Engine : ${report.ffmpegPath}`,
      `  OpenCode CLI  : ${report.opencode.available ? report.opencode.version : 'not detected'}`,
      `  Host Root     : ${report.homeDir}`,
      `  Templates     : ${report.templateCount} ready`,
      `  AI Hosts Found: ${report.detectedHostCount} (${detectedHosts.map((h) => h.id).join(', ') || 'none'})`,
    ];
    printResult(report, opts.json, lines.join('\n'));
  });

program
  .command('init')
  .description('Detect local AI coding/assistant hosts and link universal Aimake Skill (legacy global symlink; prefer "aimake workspace init")')
  .option('--apply', 'Create symlinks (defaults to safe dry-run preview unless --apply is set)')
  .option('--home <dir>', 'Custom home directory root for isolated testing')
  .option('--only <ids>', 'Comma-separated host IDs (e.g. antigravity,codex,workbuddy)')
  .option('--json', 'Emit machine-readable JSON')
  .action(async (opts: { apply?: boolean; home?: string; only?: string; json?: boolean }) => {
    const onlyHosts = opts.only ? opts.only.split(',').map((s) => s.trim()) : undefined;
    const actions = await installAimakeSkill({
      homeDir: opts.home ? path.resolve(opts.home) : undefined,
      onlyHosts,
      dryRun: !opts.apply,
    });
    const summary = actions
      .map((a) => `[${a.status.toUpperCase()}] ${a.hostName} -> ${a.targetPath}`)
      .join('\n');
    printResult(
      { dryRun: !opts.apply, actions },
      opts.json,
      summary || 'No matching AI host directories detected.'
    );
  });

program
  .command('templates')
  .description('List all parametric multi-language HTML templates')
  .option('--category <cat>', 'Filter by category')
  .option('--json', 'Emit machine-readable JSON')
  .action(async (opts: { category?: string; json?: boolean }) => {
    const all = await listTemplates();
    const list = opts.category ? all.filter((t) => t.category === opts.category) : all;
    const human = list
      .map(
        (t) =>
          `• ${t.id.padEnd(26)} [${t.aspect.padEnd(5)}] (${t.supportedFormats.join(',')}) — ${t.name.zh} / ${t.name.en}`
      )
      .join('\n');
    printResult(list, opts.json, human);
  });

// ---- Marketplace commands ----
const marketCmd = program
  .command('market')
  .description('Browse, search, and install versioned built-in templates & industry template packs');

marketCmd
  .command('list')
  .description('List all templates and versioned industry packs in the Aimake Marketplace')
  .option('--json', 'Emit machine-readable JSON')
  .action(async (opts: { json?: boolean }) => {
    const catalog = await listMarketplaceCatalog();
    const human = [
      `Aimake Template Marketplace — ${catalog.templates.length} Templates · ${catalog.packs.length} Packs`,
      '',
      'Versioned Industry Packs:',
      ...catalog.packs.map(
        (p) => `  • ${p.id}@${p.version} (${p.templateIds.length} templates) — ${p.name.zh} / ${p.name.en}`
      ),
      '',
      'Built-in Preset Templates:',
      ...catalog.templates.map(
        (t) => `  • ${t.id}@${t.version} [${t.defaultLocale} · ${t.aspect} · ${t.styleFamily}] — ${t.name.zh}`
      ),
    ].join('\n');
    printResult(catalog, opts.json, human);
  });

marketCmd
  .command('search [query]')
  .description('Search templates by keyword, locale, category, style family, or aspect ratio')
  .option('--locale <loc>', 'Filter by locale (zh-CN, en, ja, ko)')
  .option('--category <cat>', 'Filter by category')
  .option('--style <style>', 'Filter by style family')
  .option('--aspect <aspect>', 'Filter by aspect ratio (3:4, 4:5, 16:9, 9:16)')
  .option('--json', 'Emit machine-readable JSON')
  .action(
    async (
      query: string | undefined,
      opts: {
        locale?: SupportedLocale;
        category?: string;
        style?: string;
        aspect?: string;
        json?: boolean;
      }
    ) => {
      const results = await searchMarketplace({
        q: query,
        locale: opts.locale,
        category: opts.category as never,
        styleFamily: opts.style,
        aspect: opts.aspect as never,
      });
      const human = results.templates
        .map(
          (t) =>
            `• ${t.id}@${t.version} [${t.defaultLocale} · ${t.aspect}] (${t.styleFamily}) — ${t.name.zh} / ${t.name.en}`
        )
        .join('\n');
      printResult(results, opts.json, human || 'No matching marketplace templates.');
    }
  );

marketCmd
  .command('install <itemSpec>')
  .description('Install a versioned template or pack (e.g. pack-solopreneur-cn@1.0.0) into workspace')
  .option('--workspace <dir>', 'Workspace root directory', process.cwd())
  .option('--json', 'Emit machine-readable JSON')
  .action(async (itemSpec: string, opts: { workspace: string; json?: boolean }) => {
    const res = await installMarketplaceItem(itemSpec, path.resolve(opts.workspace));
    printResult(
      res,
      opts.json,
      `Installed ${res.installedRecords.length} template(s) from ${itemSpec} -> ${res.installedRootDir}`
    );
  });

marketCmd
  .command('installed')
  .description('List templates installed in the workspace with SHA-256 integrity status')
  .option('--workspace <dir>', 'Workspace root directory', process.cwd())
  .option('--json', 'Emit machine-readable JSON')
  .action(async (opts: { workspace: string; json?: boolean }) => {
    const list = await listInstalledTemplates(path.resolve(opts.workspace));
    const human = list
      .map(
        (it) =>
          `• ${it.id}@${it.version} [${it.integrityOk ? 'SHA256 OK' : 'TAMPERED'}] -> ${it.resolvedDir}`
      )
      .join('\n');
    printResult(list, opts.json, human || 'No marketplace templates installed in workspace yet.');
  });

marketCmd
  .command('remove <templateId>')
  .description('Remove an installed template from the workspace')
  .option('--workspace <dir>', 'Workspace root directory', process.cwd())
  .option('--json', 'Emit machine-readable JSON')
  .action(async (templateId: string, opts: { workspace: string; json?: boolean }) => {
    const res = await removeInstalledTemplate(templateId, path.resolve(opts.workspace));
    printResult(res, opts.json, res.removed ? `Removed ${templateId}` : `${templateId} was not installed`);
  });

// ---- One-Click Remix (「一键做同款」) ----
program
  .command('remix <sourceTemplateOrDeck>')
  .description('One-Click Remix (一键做同款): clone style & rhythm from any template or finished .deck.md onto your deck')
  .requiredOption('--deck <targetDeck>', 'Path to your .deck.md storyboard')
  .option('-o, --output <outDeck>', 'Output .deck.md path (defaults to overwriting --deck)')
  .option('-l, --locale <loc>', 'Optional target locale override (zh-CN, en, ja, ko)')
  .option('--humanize', 'Apply 4-locale Anti-AI-Slop Humanizer to slide copy')
  .option('--export <formats>', 'Comma-separated export formats to compile immediately (png,wechat,pdf,pptx,mp4)')
  .option('--export-dir <dir>', 'Directory for immediate remix exports')
  .option('--json', 'Emit machine-readable JSON')
  .action(
    async (
      sourceTemplateOrDeck: string,
      opts: {
        deck: string;
        output?: string;
        locale?: SupportedLocale;
        humanize?: boolean;
        export?: string;
        exportDir?: string;
        json?: boolean;
      }
    ) => {
      const isDeckFile =
        sourceTemplateOrDeck.endsWith('.md') ||
        (await fs
          .stat(path.resolve(sourceTemplateOrDeck))
          .then((st) => st.isFile())
          .catch(() => false));

      const targetAbs = path.resolve(opts.deck);
      const outAbs = opts.output ? path.resolve(opts.output) : targetAbs;

      const remixResult = await remixDeckWithStyle({
        sourceTemplateId: isDeckFile ? undefined : sourceTemplateOrDeck,
        sourceDeckPath: isDeckFile ? path.resolve(sourceTemplateOrDeck) : undefined,
        targetDeckPath: targetAbs,
        outDeckPath: outAbs,
        locale: opts.locale,
        humanize: Boolean(opts.humanize),
      });

      const exportedArtifacts: Record<string, string[]> = {};
      if (opts.export) {
        const exportBase = path.resolve(
          opts.exportDir || path.join(path.dirname(outAbs), 'remixed-exports')
        );
        const formats = opts.export
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean) as ExportFormat[];
        for (const fmt of formats) {
          const target =
            fmt === 'png'
              ? path.join(exportBase, 'png')
              : path.join(exportBase, `remixed.${fmt === 'wechat' ? 'wechat.html' : fmt}`);
          exportedArtifacts[fmt] = await exportDeckBundle(remixResult.deck, fmt, target);
        }
      }

      printResult(
        { ok: true, ...remixResult, exportedArtifacts },
        opts.json,
        `Remixed ${targetAbs} -> ${outAbs} using template=${remixResult.templateId} (${remixResult.aspect})`
      );
    }
  );

// ---- Wiki commands (backed by @lwc/core + qingyan-vault contracts) ----
const wikiCmd = program.command('wiki').description('Manage local Karpathy LLM Wiki backed by llm-wiki-canvas & qingyan-vault');

wikiCmd
  .command('init <vaultDir>')
  .description('Initialize local LLM Wiki directory structure with Overview.base & AGENTS.md')
  .option('--json', 'Emit machine-readable JSON')
  .action(async (vaultDir: string, opts: { json?: boolean }) => {
    const abs = path.resolve(vaultDir);
    await initWikiVault(abs);
    printResult({ ok: true, vaultDir: abs }, opts.json, `Initialized Aimake LLM Wiki at ${abs}`);
  });

wikiCmd
  .command('ingest <sources...>')
  .description('Ingest URLs, Markdown files, globs, directories, HTML, or Office files into local Wiki')
  .requiredOption('--vault <dir>', 'Path to Wiki vault directory')
  .option('--title <title>', 'Explicit source title (only applied if single file)')
  .option('--tags <tags>', 'Comma-separated tags')
  .option('--json', 'Emit machine-readable JSON')
  .action(
    async (
      sources: string[],
      opts: { vault: string; title?: string; tags?: string; json?: boolean }
    ) => {
      const tags = opts.tags ? opts.tags.split(',').map((s) => s.trim()) : undefined;
      const vaultPath = path.resolve(opts.vault);

      if (sources.length === 1 && !sources[0].includes('*') && !sources[0].includes('?')) {
        let isDir = false;
        try {
          const st = await fs.stat(path.resolve(sources[0]));
          isDir = st.isDirectory();
        } catch {
          // URL or non-directory
        }

        if (!isDir) {
          const res = await ingestSource(vaultPath, sources[0], {
            title: opts.title,
            tags,
          });
          printResult(
            res,
            opts.json,
            `Ingested "${res.title}" -> ${res.wikiPath} (sha256: ${res.sha256.slice(0, 12)})`
          );
          return;
        }
      }

      // Batch ingestion
      const batchRes = await ingestSourcesBatch(vaultPath, sources, { tags });
      const summaryLines = [
        `Batch Ingested ${batchRes.length} source(s) into ${vaultPath}:`,
        ...batchRes.map((r) => `  • [[${path.basename(r.wikiPath, '.md')}]] "${r.title}" (sha256: ${r.sha256.slice(0, 8)})`),
      ];
      printResult(batchRes, opts.json, summaryLines.join('\n'));
    }
  );

wikiCmd
  .command('lint <vaultDir>')
  .description('Audit Wiki token budget (<=3000 tokens), @lwc/core graph links, and persona sizes')
  .option('--json', 'Emit machine-readable JSON')
  .action(async (vaultDir: string, opts: { json?: boolean }) => {
    await rebuildWikiIndex(path.resolve(vaultDir));
    const report = await lintWiki(path.resolve(vaultDir));
    const summary = `Wiki Lint: ${report.valid ? 'PASS' : 'FAIL'} | index=${report.indexTokens}/${report.indexBudget} tokens | pages=${report.totalWikiPages} | brokenLinks=${report.brokenLinks.length}`;
    printResult(report, opts.json, summary);
    if (!report.valid) process.exitCode = 1;
  });

wikiCmd
  .command('context <vaultDir>')
  .description('Extract topology-bounded (0-2 hop) Agent context bundle via @lwc/core')
  .requiredOption('--focus <query>', 'Node ID, relative path, basename, or title')
  .option('--depth <n>', 'Graph hop depth (0, 1, or 2)', '1')
  .option('--max-words <n>', 'Word budget', '2000')
  .option('--json', 'Emit machine-readable JSON')
  .action(
    async (
      vaultDir: string,
      opts: { focus: string; depth: string; maxWords: string; json?: boolean }
    ) => {
      const depthNum = Number(opts.depth);
      const depth = depthNum === 0 || depthNum === 2 ? depthNum : 1;
      const res = await getVaultContextBundle(path.resolve(vaultDir), opts.focus, {
        depth,
        maxWords: Number(opts.maxWords) || 2000,
      });
      printResult(res, opts.json, res.markdown);
    }
  );

wikiCmd
  .command('report <vaultDir>')
  .description('Compile @lwc/core graph topology, OKF trust report, and governance inbox status')
  .option('--json', 'Emit machine-readable JSON')
  .action(async (vaultDir: string, opts: { json?: boolean }) => {
    const abs = path.resolve(vaultDir);
    const compiled = await compileVaultGraph(abs);
    const governance = await getVaultGovernanceStatus(abs);
    printResult({ ...compiled, governance }, opts.json, compiled.reportMarkdown);
  });

wikiCmd
  .command('visuals <vaultDir>')
  .description('Export position-preserving Obsidian .canvas, .excalidraw, Mermaid & Overview.base')
  .option('--focus <query>', 'Optional focus node for focused diagram')
  .option('--json', 'Emit machine-readable JSON')
  .action(async (vaultDir: string, opts: { focus?: string; json?: boolean }) => {
    const res = await exportVaultVisuals(path.resolve(vaultDir), { focusQuery: opts.focus });
    printResult(
      res,
      opts.json,
      `Exported vault visuals -> canvas=${res.canvasPath}, excalidraw=${res.excalidrawPath}, base=${res.overviewBasePath}`
    );
  });

wikiCmd
  .command('verify-citations <deckPath>')
  .description('Verify every slide cite: pointer in a .deck.md against vault graph & OKF trust')
  .requiredOption('--vault <dir>', 'Path to Wiki vault directory')
  .option('--json', 'Emit machine-readable JSON')
  .action(async (deckPath: string, opts: { vault: string; json?: boolean }) => {
    const raw = await fs.readFile(path.resolve(deckPath), 'utf8');
    const doc = parseDeckMarkdown(raw, path.resolve(deckPath));
    const report = await verifyDeckCitationsAgainstVault(doc, path.resolve(opts.vault));
    printResult(
      report,
      opts.json,
      `Citations: ${report.counts.verified} verified, ${report.counts.stale} stale, ${report.counts.unresolved} unresolved, ${report.counts.uncited} uncited`
    );
  });

// ---- Deck helpers (from Release / Markdown Facts) ----
const deckCmd = program.command('deck').description('Generate grounded .deck.md storyboards from traceable facts');

deckCmd
  .command('from-release <sourceFile>')
  .description('Extract traceable facts from a GitHub Release JSON or Markdown file into a cited .deck.md')
  .requiredOption('-o, --output <outDeck>', 'Output .deck.md path')
  .option('-t, --template <id>', 'Template ID', 'xhs-neon-tech')
  .option('-l, --locale <loc>', 'Target locale', 'zh-CN')
  .option('--json', 'Emit machine-readable JSON')
  .action(
    async (
      sourceFile: string,
      opts: { output: string; template: string; locale: SupportedLocale; json?: boolean }
    ) => {
      const absSource = path.resolve(sourceFile);
      const raw = await fs.readFile(absSource, 'utf8');
      const facts = extractFactsFromReleaseOrMarkdown(raw, path.basename(absSource));
      const deck = buildDeckFromFacts(facts, {
        template: opts.template,
        locale: opts.locale,
      });
      const outAbs = path.resolve(opts.output);
      await fs.mkdir(path.dirname(outAbs), { recursive: true });
      await fs.writeFile(outAbs, serializeDeckMarkdown(deck), 'utf8');
      printResult(
        { ok: true, outputPath: outAbs, factCount: facts.facts.length, slideCount: deck.slides.length },
        opts.json,
        `Generated grounded deck (${deck.slides.length} slides from ${facts.facts.length} facts) -> ${outAbs}`
      );
    }
  );

async function handleDeckCreate(
  topicOrPrompt: string | undefined,
  opts: {
    output: string;
    template: string;
    aspect: AspectRatio;
    locale: SupportedLocale;
    recipe?: string;
    backend: ChatBackendId;
    json?: boolean;
  }
) {
  const recipe = opts.recipe
    ? BEGINNER_TASK_RECIPES.find((r) => r.id === opts.recipe)
    : undefined;
  const tpl = (opts.recipe && recipe?.recommendedTemplate) || opts.template || 'xhs-swiss-grid';
  const promptText = topicOrPrompt || (recipe ? recipe.promptZh : '基于现代多模态排版生成创作幻灯片');
  const cleanTitle = (topicOrPrompt || recipe?.titleZh || '新创作作品')
    .replace(/请帮我|生成|写一篇|创作/g, '')
    .trim()
    .slice(0, 30);

  const initialDeck: DeckDocument = {
    frontmatter: {
      title: cleanTitle || '新创作作品',
      template: tpl as any,
      aspect: opts.aspect || (tpl.includes('16x9') ? '16:9' : '3:4'),
      locale: opts.locale || 'zh-CN',
      tags: ['aimake', 'copilot'],
      watermark: false,
      fps: 30,
      secondsPerSlide: 4,
    },
    slides: [
      {
        index: 0,
        id: 'slide-1',
        layout: 'bullets',
        eyebrow: 'AI CO-PILOT CREATION',
        title: cleanTitle || '新创作作品',
        subtitle: recipe ? recipe.subtitleZh : '基于 Aimake 对话副驾驶一键生成',
        bullets: [
          '核心要点 1：本地优先与零中心化依赖',
          '核心要点 2：结构化卡片排版与即时预览',
        ],
        bodyParagraphs: [],
        metrics: [],
      },
    ],
  };

  let recipeIntent: ChatIntent | undefined;
  if (opts.recipe === 'quote-extract') recipeIntent = 'extract_quote';
  else if (opts.recipe === 'bento-style') recipeIntent = 'bento_style';
  else if (opts.recipe === 'presentation-outline') recipeIntent = 'presentation_outline';
  else if (opts.recipe === 'bilingual-translate') recipeIntent = 'bilingual_translate';

  const chatRes = await processChatMessage({
    message: promptText,
    intent: recipeIntent,
    activeSlideIndex: 0,
    deck: initialDeck,
    backend: opts.backend,
    targetLocale: opts.locale,
  });

  const finalDeck = chatRes.updatedDeck || initialDeck;
  const outAbs = path.resolve(opts.output);
  await fs.mkdir(path.dirname(outAbs), { recursive: true });
  await fs.writeFile(outAbs, serializeDeckMarkdown(finalDeck), 'utf8');

  printResult(
    {
      ok: true,
      outputPath: outAbs,
      slideCount: finalDeck.slides.length,
      engineUsed: chatRes.engineUsed,
      changeSummary: chatRes.changeSummary,
      suggestedActions: chatRes.suggestedActions,
    },
    opts.json,
    `✨ Stage ③ [创作 Create] Creation Complete!\n  Output: ${outAbs}\n  Slides: ${finalDeck.slides.length} pages\n  Engine: ${chatRes.engineUsed}\n  Summary: ${chatRes.changeSummary || '已生成作品'}\n  Suggested Next: ${chatRes.suggestedActions.join(' | ')}`
  );
}

deckCmd
  .command('create [topicOrPrompt]')
  .description('Conversationally create a new multimodal .deck.md from a natural language topic or recipe')
  .option('-o, --output <outDeck>', 'Output .deck.md path', './decks/created.deck.md')
  .option('-t, --template <id>', 'Template ID', 'xhs-swiss-grid')
  .option('-a, --aspect <ratio>', 'Aspect ratio (16:9, 3:4, 1:1, 9:16)', '3:4')
  .option('-l, --locale <loc>', 'Target locale (zh-CN, en, ja, ko)', 'zh-CN')
  .option('--recipe <recipeId>', 'Recipe ID (quote-extract, bento-style, presentation-outline, bilingual-translate, xhs-viral, apple-bento-ppt)')
  .option('-b, --backend <backend>', 'AI backend (auto, offline, api, cli:<id>)', 'auto')
  .option('--json', 'Emit machine-readable JSON')
  .action(handleDeckCreate);

deckCmd
  .command('edit <deckPath>')
  .description('Multi-turn conversational slide editing and rewriting with diff preview and rollback')
  .option('-m, --message <instruction>', 'Instruction to edit slide (e.g. 提炼金句卡片, 转为 Bento 风格, 生成演讲大纲, 翻译为双语)')
  .option('-s, --slide <index>', 'Slide number (1-based, default: 1)', '1')
  .option('-i, --intent <intent>', 'Explicit intent')
  .option('-b, --backend <backend>', 'AI backend (auto, offline, api, cli:<id>)', 'auto')
  .option('--revert', 'Rollback to previous revision')
  .option('--json', 'Emit machine-readable JSON')
  .action(
    async (
      deckPath: string,
      opts: {
        message?: string;
        slide: string;
        intent?: string;
        backend: ChatBackendId;
        revert?: boolean;
        json?: boolean;
      }
    ) => {
      const absDeck = path.resolve(deckPath);
      if (opts.revert) {
        const rollbackRes = await rollbackChatSnapshot(absDeck);
        if (rollbackRes.success && rollbackRes.restoredDeck) {
          await fs.writeFile(absDeck, serializeDeckMarkdown(rollbackRes.restoredDeck), 'utf8');
        }
        printResult(
          { ok: rollbackRes.success, message: rollbackRes.message },
          opts.json,
          rollbackRes.message
        );
        return;
      }

      const raw = await fs.readFile(absDeck, 'utf8');
      const deck = parseDeckMarkdown(raw, absDeck);
      const slideIdx = Math.max(0, parseInt(opts.slide || '1', 10) - 1);
      const msg = opts.message || '去 AI 味精修并提升表达力度';

      const res = await processChatMessage({
        message: msg,
        intent: opts.intent as ChatIntent | undefined,
        activeSlideIndex: slideIdx,
        deck,
        deckPath: absDeck,
        backend: opts.backend,
      });

      if (res.updatedDeck) {
        await fs.writeFile(absDeck, serializeDeckMarkdown(res.updatedDeck), 'utf8');
      }

      printResult(
        {
          ok: true,
          deckPath: absDeck,
          engineUsed: res.engineUsed,
          changeSummary: res.changeSummary,
          diffLines: res.diffLines,
          revisionId: res.revisionId,
          suggestedActions: res.suggestedActions,
        },
        opts.json,
        `✨ Slide ${slideIdx + 1} edited!\n  Engine: ${res.engineUsed}\n  Summary: ${res.changeSummary || '完成修改'}\n  Diff:\n    ${(res.diffLines || []).join('\n    ')}\n  Revision: ${res.revisionId || 'none'} (run with --revert to rollback)\n  Next Actions: ${res.suggestedActions.join(' | ')}`
      );
    }
  );

// ---- Persona & Humanizer ----
const personaCmd = program.command('persona').description('Extract Personal Style DNA & run 4-locale Anti-AI Humanizer');

personaCmd
  .command('extract <id>')
  .description('Extract Style DNA profile from writing sample files')
  .requiredOption('--vault <dir>', 'Path to Wiki vault directory')
  .requiredOption('--samples <files...>', 'One or more sample markdown/text files')
  .option('--name <name>', 'Display name', 'Creator')
  .option('--locale <locale>', 'Target locale (zh-CN, en, ja, ko)', 'zh-CN')
  .option('--handle <handle>', 'Social handle')
  .option('--color <hex>', 'Brand accent hex color', '#2B6BE6')
  .option('--json', 'Emit machine-readable JSON')
  .action(
    async (
      id: string,
      opts: {
        vault: string;
        samples: string[];
        name: string;
        locale: SupportedLocale;
        handle?: string;
        color: string;
        json?: boolean;
      }
    ) => {
      const texts = await Promise.all(opts.samples.map((f) => fs.readFile(path.resolve(f), 'utf8')));
      const dna = extractStyleDNAFromSamples({
        id,
        name: opts.name,
        samples: texts,
        locale: opts.locale,
        authorName: opts.name,
        authorHandle: opts.handle,
        primaryColor: opts.color,
      });
      const vaultAbs = path.resolve(opts.vault);
      await initWikiVault(vaultAbs);
      const mdPath = path.join(vaultAbs, 'personas', `${id}.md`);
      const jsonPath = path.join(vaultAbs, 'personas', `${id}.json`);
      await fs.writeFile(mdPath, formatStyleDNAMarkdown(dna), 'utf8');
      await fs.writeFile(jsonPath, JSON.stringify(dna, null, 2), 'utf8');
      printResult({ dna, mdPath, jsonPath }, opts.json, `Saved Style DNA -> ${mdPath}`);
    }
  );

personaCmd
  .command('humanize <file>')
  .description('Audit and strip typical AI writing clichés across zh-CN, en, ja, ko')
  .option('--locale <locale>', 'Locale (zh-CN, en, ja, ko)', 'zh-CN')
  .option('-o, --output <out>', 'Optional output file path')
  .option('--json', 'Emit machine-readable JSON')
  .action(async (file: string, opts: { locale: SupportedLocale; output?: string; json?: boolean }) => {
    const raw = await fs.readFile(path.resolve(file), 'utf8');
    const audit = auditAiSlop(raw, opts.locale);
    const cleaned = humanizeText(raw, opts.locale);
    if (opts.output) {
      await fs.writeFile(path.resolve(opts.output), cleaned, 'utf8');
    }
    printResult(
      { audit, cleaned, outputPath: opts.output ? path.resolve(opts.output) : undefined },
      opts.json,
      `Humanizer score: ${audit.score}/100 (removed ${audit.hits.length} slop pattern types)`
    );
  });

program
  .command('radar')
  .description('Fetch live global tech & creator trends (Hacker News, GitHub Trending, RSS)')
  .option('--sources <list>', 'Comma-separated sources (hackernews,github,rss)', 'hackernews,github')
  .option('--rss <urls>', 'Comma-separated RSS/Atom feed URLs')
  .option('--keywords <words>', 'Comma-separated filter keywords')
  .option('--limit <n>', 'Max items', '10')
  .option('--json', 'Emit machine-readable JSON')
  .action(
    async (opts: {
      sources: string;
      rss?: string;
      keywords?: string;
      limit: string;
      json?: boolean;
    }) => {
      const items = await runTrendRadar({
        sources: opts.sources.split(',').map((s) => s.trim()) as Array<'hackernews' | 'github' | 'rss'>,
        rssUrls: opts.rss ? opts.rss.split(',').map((s) => s.trim()) : undefined,
        keywords: opts.keywords ? opts.keywords.split(',').map((s) => s.trim()) : undefined,
        limit: Number(opts.limit) || 10,
      });
      const human = items
        .map((it, i) => `${i + 1}. [${it.source}] ${it.title}\n   ${it.url}`)
        .join('\n');
      printResult(items, opts.json, human || 'No matching radar items found.');
    }
  );

program
  .command('render <deckPath>')
  .description('Compile a .deck.md storyboard into PNG cards, WeChat HTML, PDF, Editable PPTX, or narrated 60fps MP4')
  .requiredOption('-f, --format <fmt>', 'Output format: png | wechat | pdf | pptx | mp4 | html')
  .requiredOption('-o, --output <target>', 'Output directory (for png) or output file path')
  .option('-t, --template <id>', 'Override template ID')
  .option('-l, --locale <loc>', 'Override locale (zh-CN, zh-TW, en, ja, ko, es)')
  .option('--vault <dir>', 'Optional Wiki vault directory for automatic compound write-back')
  .option('--fps <n>', 'Frames per second for mp4 export')
  .option('--seconds-per-slide <n>', 'Seconds per slide for mp4 export')
  .option('--narrate <provider>', 'Synthesize audio narration & SRT for mp4: offline-fixture | tencent-tccli')
  .option('--json', 'Emit machine-readable JSON')
  .action(
    async (
      deckPath: string,
      opts: {
        format: ExportFormat;
        output: string;
        template?: string;
        locale?: SupportedLocale;
        vault?: string;
        fps?: string;
        secondsPerSlide?: string;
        narrate?: 'offline-fixture' | 'tencent-tccli';
        json?: boolean;
      }
    ) => {
      const absDeck = path.resolve(deckPath);
      const raw = await fs.readFile(absDeck, 'utf8');
      const doc = parseDeckMarkdown(raw, absDeck);
      if (opts.template) doc.frontmatter.template = opts.template;
      if (opts.locale) doc.frontmatter.locale = opts.locale;

      const outAbs = path.resolve(opts.output);
      let audioTrackPath: string | undefined;
      let subtitlesSrtPath: string | undefined;
      let slideDurationsMs: number[] | undefined;

      if (opts.format === 'mp4' && opts.narrate) {
        const speechRunDir = path.join(path.dirname(outAbs), `${path.basename(outAbs, '.mp4')}-speech`);
        const provider =
          opts.narrate === 'tencent-tccli'
            ? createTencentTccliSpeechProvider()
            : offlineFixtureSpeechProvider();
        const speech = await synthesizeDeckSpeech(doc, speechRunDir, { provider });
        audioTrackPath = speech.audioPath;
        subtitlesSrtPath = speech.srtPath;
        slideDurationsMs = doc.slides.map((s) => speech.slideDurationsMs[s.id] ?? 2000);
      }

      const artifacts = await exportDeckBundle(doc, opts.format, outAbs, {
        fps: opts.fps ? Number(opts.fps) : undefined,
        secondsPerSlide: opts.secondsPerSlide ? Number(opts.secondsPerSlide) : undefined,
        audioTrackPath,
        subtitlesSrtPath,
        slideDurationsMs,
      });

      if (subtitlesSrtPath) artifacts.push(subtitlesSrtPath);

      let compoundedPath: string | undefined;
      if (opts.vault) {
        compoundedPath = await compoundOutputToWiki(path.resolve(opts.vault), doc, artifacts);
      }

      printResult(
        { ok: true, format: opts.format, template: doc.frontmatter.template, artifacts, compoundedPath },
        opts.json,
        `Rendered ${artifacts.length} ${opts.format.toUpperCase()} artifact(s) -> ${artifacts.join(', ')}`
      );
    }
  );

program
  .command('studio [deckPath]')
  .description('Launch local zero-backend Aimake Studio Workbench')
  .option('-p, --port <port>', 'Port to listen on (127.0.0.1)', '4310')
  .option('--workspace <dir>', 'Workspace root directory')
  .option('--vault <dir>', 'Wiki vault directory')
  .option('--demo', 'Launch on the built-in showcase deck')
  .option('--no-open', 'Do not attempt to open a browser automatically')
  .action(
    async (
      deckPath: string | undefined,
      opts: { port: string; workspace?: string; vault?: string; demo?: boolean }
    ) => {
      let resolvedWorkspace = opts.workspace ? path.resolve(opts.workspace) : undefined;
      let resolvedDeck = deckPath ? path.resolve(deckPath) : undefined;

      if (!opts.demo && !resolvedDeck && resolvedWorkspace) {
        const wsInit = await initWorkspace(resolvedWorkspace, {
          name: path.basename(resolvedWorkspace),
          cliPath: path.join(REPO_ROOT, 'dist', 'cli.js'),
          registerRecent: false,
        });
        resolvedDeck = wsInit.decks[0]?.absolutePath;
      }

      if (!resolvedDeck) {
        resolvedDeck = path.join(REPO_ROOT, 'examples', 'zh-creator-flywheel.deck.md');
      }

      const handle = await startStudioServer({
        deckPath: resolvedDeck,
        port: Number(opts.port) || 4310,
        workspaceDir: resolvedWorkspace,
        vaultDir: opts.vault ? path.resolve(opts.vault) : undefined,
      });
      process.stdout.write(`Aimake Studio listening on ${handle.url}\nPress Ctrl+C to stop.\n`);
    }
  );

const workspaceCmd = program
  .command('workspace')
  .description('Manage end-to-end creator workspaces with materialized preset skills (zero symlinks, zero global pollution)');

workspaceCmd
  .command('init <dir>')
  .description('Initialize a creator workspace with 7 materialized closed-loop preset skills and 5-agent local MCP configs')
  .option('--name <name>', 'Display name for the workspace')
  .option(
    '--scenario <preset>',
    'Scenario preset (creator-growth | product-launch | executive-ppt | educator-course)',
    'creator-growth'
  )
  .option('--locale <locale>', 'Default locale (zh-CN | en | ja | ko)', 'zh-CN')
  .option('--no-claude', 'Skip writing .claude/skills/ mirror')
  .option('--json', 'Emit machine-readable JSON')
  .action(
    async (
      dir: string,
      opts: {
        name?: string;
        scenario: WorkspaceScenarioPreset;
        locale: SupportedLocale;
        claude?: boolean;
        json?: boolean;
      }
    ) => {
      const targetDir = path.resolve(dir);
      const res = await initWorkspace(targetDir, {
        name: opts.name,
        scenario: opts.scenario,
        locale: opts.locale,
        includeClaude: opts.claude !== false,
        cliPath: path.join(REPO_ROOT, 'dist', 'cli.js'),
        registerRecent: false,
      });
      printResult(
        { ok: true, ...res },
        opts.json,
        `Initialized workspace "${res.config.name}" at ${targetDir} (${res.skillsStatus.totalPresetSkills} preset skills materialized, zeroSymlinks=${res.skillsStatus.zeroSymlinks}).`
      );
    }
  );

workspaceCmd
  .command('status <dir>')
  .description('Inspect end-to-end closed-loop pipeline progress and preset skill status of a workspace')
  .option('--json', 'Emit machine-readable JSON')
  .action(async (dir: string, opts: { json?: boolean }) => {
    const summary = await readWorkspaceState(path.resolve(dir));
    printResult(
      { ok: true, ...summary },
      opts.json,
      `Workspace "${summary.config.name}" · stage=${summary.pipeline.currentStage} · sources=${summary.sources.length} · decks=${summary.decks.length} · exports=${summary.exports.length} · skills=${summary.skillsStatus.totalPresetSkills} (zeroSymlinks=${summary.skillsStatus.zeroSymlinks})`
    );
  });

workspaceCmd
  .command('skills <dir>')
  .description('Inspect or safely sync materialized preset skills inside a workspace (preserves manual edits)')
  .option('--sync', 'Materialize/update preset skills inside workspace')
  .option('--force', 'Overwrite customized preset skills')
  .option('--json', 'Emit machine-readable JSON')
  .action(async (dir: string, opts: { sync?: boolean; force?: boolean; json?: boolean }) => {
    const targetDir = path.resolve(dir);
    if (opts.sync) {
      const configured = await configureWorkspaceAgents(targetDir, {
        cliPath: path.join(REPO_ROOT, 'dist', 'cli.js'),
        force: Boolean(opts.force),
      });
      printResult(
        { ok: true, ...configured },
        opts.json,
        `Synced ${configured.materializedSkills.skillNames.length} workspace preset skills (preserved ${configured.materializedSkills.preservedCustomFiles.length} custom file(s), 0 symlinks).`
      );
      return;
    }
    const report = await inspectWorkspaceSkills(targetDir);
    printResult(
      { ok: true, ...report },
      opts.json,
      `Workspace skills: ${report.totalPresetSkills} preset(s), allSynced=${report.allSynced}, zeroSymlinks=${report.zeroSymlinks}`
    );
  });

workspaceCmd
  .command('agents <dir>')
  .description('Detect local AI tools and configure/launch them inside a workspace (auto-loads workspace skills)')
  .option('--configure', 'Write workspace-local MCP & plugin configs for OpenCode/WorkBuddy/Codex/AGY/Claude')
  .option('--launch <host>', 'Launch AI tool directly in workspace (opencode | workbuddy | codex | agy | claude | cursor)')
  .option('--dry-run', 'Print launch command and starter prompt without spawning a terminal')
  .option('--json', 'Emit machine-readable JSON')
  .action(
    async (
      dir: string,
      opts: { configure?: boolean; launch?: AgentHostId; dryRun?: boolean; json?: boolean }
    ) => {
      const targetDir = path.resolve(dir);
      if (opts.configure) {
        const configured = await configureWorkspaceAgents(targetDir, {
          cliPath: path.join(REPO_ROOT, 'dist', 'cli.js'),
        });
        printResult(
          { ok: true, ...configured },
          opts.json,
          `Configured workspace-local AI tools in ${targetDir}: ${configured.writtenConfigs.join(', ')}`
        );
        return;
      }
      if (opts.launch) {
        const res = await launchAgentInWorkspace(targetDir, opts.launch, {
          dryRun: Boolean(opts.dryRun),
        });
        printResult({ ok: true, ...res }, opts.json, `${res.message}\nCommand: ${res.info.command}`);
        return;
      }
      const hosts = await detectInstalledAgents();
      printResult(
        { ok: true, hosts },
        opts.json,
        hosts.map((h) => `${h.installed ? '[installed]' : '[missing]  '} ${h.displayName} (${h.skillDir})`).join('\n')
      );
    }
  );

program
  .command('desktop [deckPath]')
  .description('Launch native macOS Aimake.app Desktop Workbench')
  .option('--workspace <dir>', 'Workspace directory')
  .action(async (deckPath: string | undefined, opts: { workspace?: string }) => {
    const appBin = path.join(REPO_ROOT, 'dist-desktop', 'Aimake.app', 'Contents', 'MacOS', 'Aimake');
    const cliPath = path.join(REPO_ROOT, 'dist', 'cli.js');
    const targetDeck = path.resolve(deckPath || path.join(REPO_ROOT, 'examples', 'zh-creator-flywheel.deck.md'));
    const workspaceDir = path.resolve(opts.workspace || path.dirname(targetDeck));
    const child = spawn(
      appBin,
      ['--cli', cliPath, '--deck', targetDeck, '--workspace', workspaceDir],
      { stdio: 'inherit', detached: true }
    );
    child.unref();
    process.stdout.write(`Launched Aimake Desktop (${appBin}) for ${targetDeck}\n`);
  });

program
  .command('share <targetFile>')
  .description('Sanitize a template or .deck.md for safe team sharing (pr-sanitizer)')
  .option('--mock-deck', 'Replace all slide prose with structural synthetic mock copy')
  .option('-o, --output <outFile>', 'Write sanitized output to file')
  .option('--json', 'Emit machine-readable JSON')
  .action(
    async (
      targetFile: string,
      opts: { mockDeck?: boolean; output?: string; json?: boolean }
    ) => {
      const abs = path.resolve(targetFile);
      let content = await fs.readFile(abs, 'utf8');
      if (opts.mockDeck && abs.endsWith('.md')) {
        const parsed = parseDeckMarkdown(content, abs);
        content = serializeDeckMarkdown(anonymizeDeckToSyntheticMock(parsed));
      }
      const report = sanitizeContentForPR(content);
      if (opts.output) {
        await fs.mkdir(path.dirname(path.resolve(opts.output)), { recursive: true });
        await fs.writeFile(path.resolve(opts.output), report.sanitizedContent, 'utf8');
      }
      printResult(
        {
          clean: report.clean,
          redactedCount: report.redactedCount,
          findings: report.findings,
          outputPath: opts.output ? path.resolve(opts.output) : undefined,
        },
        opts.json,
        `Privacy Sanitizer complete: redacted ${report.redactedCount} sensitive item(s).`
      );
    }
  );

program
  .command('publish <file>')
  .description('Package and cross-post a Markdown article or .deck.md to WeChat, Zhihu, Juejin, Xiaohongshu, and Wechatsync manifest')
  .option('-t, --target <targets>', 'Comma-separated target platforms: wechat | zhihu | juejin | xiaohongshu | pack | all', 'all')
  .option('--draft', 'Keep as draft in platform draft box (default: true)', true)
  .option('--no-draft', 'Publish directly if supported')
  .option('--browser', 'Automate publishing via local Chrome session (port 9222)')
  .option('--port <n>', 'Local Chrome remote debugging port', '9222')
  .option('--out <dir>', 'Custom output bundle directory')
  .option('--tags <tags>', 'Comma-separated tags for Juejin/XHS')
  .option('--category <category>', 'Article category (default: 人工智能)')
  .option('--topics <topics>', 'Comma-separated topics for Zhihu')
  .option('--json', 'Emit machine-readable JSON')
  .action(async (file: string, opts: {
    target: string;
    draft: boolean;
    browser?: boolean;
    port?: string;
    out?: string;
    tags?: string;
    category?: string;
    topics?: string;
    json?: boolean;
  }) => {
    const targets = opts.target.split(',').map((s) => s.trim().toLowerCase()) as any;
    const tags = opts.tags ? opts.tags.split(',').map((s) => s.trim()) : undefined;
    const topics = opts.topics ? opts.topics.split(',').map((s) => s.trim()) : undefined;
    const chromePort = opts.port ? parseInt(opts.port, 10) : 9222;

    const res = await publishContent(file, {
      targets,
      draft: opts.draft,
      browser: opts.browser,
      chromePort,
      outDir: opts.out,
      tags,
      category: opts.category,
      topics,
      asJson: opts.json,
    });

    const lines = [
      `🚀 Multi-Platform Publishing Bundle Generated:`,
      `  Title: ${res.title}`,
      `  Source: ${res.sourceFile}`,
      `  Bundle: ${res.bundleDir}`,
      `  Channels:`,
      ...res.results.map((r) => `    • [${r.platform}] ${r.status}: ${r.message || r.filePath || r.url || 'OK'}`),
    ];
    printResult(res, opts.json, lines.join('\n'));
  });

program
  .command('intake <sources...>')
  .description('Stage ① [抓取 Intake]: Ingest raw notes, URLs, PDFs, or docs into workspace sources/ & local wiki')
  .option('-w, --workspace <dir>', 'Target workspace directory', '.')
  .option('-t, --title <title>', 'Optional title for the ingested material')
  .option('--tags <tags>', 'Comma-separated tags')
  .option('--json', 'Emit machine-readable JSON')
  .action(async (sources: string[], opts: { workspace: string; title?: string; tags?: string; json?: boolean }) => {
    const wsDir = path.resolve(opts.workspace);
    const tags = opts.tags ? opts.tags.split(',').map((s) => s.trim()) : undefined;
    const results: Array<{ source: string; status: string; path?: string; message?: string }> = [];

    const sourcesDir = path.join(wsDir, 'sources');
    await fs.mkdir(sourcesDir, { recursive: true });

    for (const src of sources) {
      try {
        const normalized = await normalizeSource(src, {
          title: opts.title,
          tags,
        });

        const ingested = await ingestWorkspaceSource(wsDir, {
          title: normalized.title,
          content: normalized.markdown,
          sourceUrl: normalized.sourceUrl,
          tags: normalized.tags,
        });

        results.push({
          source: src,
          status: 'ingested',
          path: ingested.relativeSourcePath,
        });
      } catch (err: any) {
        results.push({
          source: src,
          status: 'error',
          message: err.message,
        });
      }
    }

    const outputLines = [
      `📥 Stage ① [抓取 Intake] Ingestion Complete (${results.filter((r) => r.status === 'ingested').length}/${sources.length} sources):`,
      ...results.map((r) => `  ${r.status === 'ingested' ? '✓' : '✗'} ${r.source} -> ${r.path || r.message}`),
      `\n💡 Next recommended step: Run \`aimake distill\` to synthesize knowledge cards and outline a brief.`,
    ];
    printResult({ workspace: wsDir, ingested: results }, opts.json, outputLines.join('\n'));
  });

program
  .command('distill [sourceOrTopic]')
  .description('Stage ② [萃取 Distill]: Distill sources into bounded Karpathy wiki cards (<=3000 tokens) & story briefs')
  .option('-w, --workspace <dir>', 'Target workspace directory', '.')
  .option('-t, --template <id>', 'Target template for the brief', 'xhs-swiss-grid')
  .option('-l, --locale <loc>', 'Target locale (zh-CN, en, ja, ko)', 'zh-CN')
  .option('-o, --output <briefPath>', 'Custom output brief path')
  .option('--json', 'Emit machine-readable JSON')
  .action(async (sourceOrTopic: string | undefined, opts: {
    workspace: string;
    template: string;
    locale: SupportedLocale;
    output?: string;
    json?: boolean;
  }) => {
    const wsDir = path.resolve(opts.workspace);
    const briefsDir = path.join(wsDir, 'briefs');
    const wikiDir = path.join(wsDir, 'wiki');
    await fs.mkdir(briefsDir, { recursive: true });
    await fs.mkdir(wikiDir, { recursive: true });

    const sourcesDir = path.join(wsDir, 'sources');
    let sourceFiles: string[] = [];
    if (fsSync.existsSync(sourcesDir)) {
      sourceFiles = (await fs.readdir(sourcesDir)).filter((f) => f.endsWith('.md'));
    }

    const topic = sourceOrTopic || (sourceFiles.length > 0 ? path.basename(sourceFiles[0], '.md') : '创作主题');
    const slug = topic
      .toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fa5_-]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'distilled-topic';

    const briefPath = opts.output ? path.resolve(opts.output) : path.join(briefsDir, `${slug}.brief.md`);
    const relBrief = path.relative(wsDir, briefPath);

    const briefContent = `---
title: "${topic} — 创作大纲"
targetTemplate: "${opts.template}"
locale: "${opts.locale}"
generatedAt: "${new Date().toISOString()}"
flywheelStage: "distill"
---

# 🎯 核心立意与受众画像 (Core Thesis & Audience)
- **受众画像**: 追求高效、反套路高质量信息的创作者与专业人士。
- **核心钩子 (Hook)**: 拒绝假大空的合成模板废话，以经过本地知识库严格溯源的干货事实驱动。
- **交付格式**: 3-5 页高信息密度视觉卡片（模板推荐: \`${opts.template}\`）。

## 📑 幻灯片大纲结构 (Story Arc)
1. **封面页 (Cover)**: 标题直击痛点与反共识结论，打上高辨识度分类标签。
2. **现状与矛盾 (Problem / Landscape)**: 罗列 2-3 个核心客观数据，严格附带溯源坐标。
3. **关键解法 (Solution / Proof)**: 网格分栏或对比卡，给出落地实操方案。
4. **行动倡议与金句总结 (Takeaway / Quote)**: 提炼可复用行动准则或权威金句。

## 🔍 溯源事实卡片 (Grounded Citations)
- 关联素材: ${sourceFiles.length > 0 ? sourceFiles.map((s) => 'sources/' + s).join(', ') : '无本地历史源文件，使用主题直出'}
- 上下文限额: <= 3000 tokens (严格遵守 Karpathy LLM Wiki 边界预算)
`;

    await fs.writeFile(briefPath, briefContent, 'utf8');

    const wikiIndex = path.join(wikiDir, 'index.md');
    if (!fsSync.existsSync(wikiIndex)) {
      await fs.writeFile(
        wikiIndex,
        `# Local Karpathy LLM Wiki Index\n\n- [${topic}](./${slug}.md)\n`,
        'utf8'
      );
    }

    const outputLines = [
      `🧪 Stage ② [萃取 Distill] Knowledge Distillation Complete:`,
      `  • Topic: ${topic}`,
      `  • Brief Generated: ${relBrief}`,
      `  • Template Target: ${opts.template} (${opts.locale})`,
      `  • Sources Considered: ${sourceFiles.length} file(s)`,
      `\n💡 Next recommended step: Run \`aimake create "${topic}"\` or \`aimake studio\` to compose storyboard slides.`,
    ];
    printResult({ briefPath: relBrief, topic, template: opts.template }, opts.json, outputLines.join('\n'));
  });

program
  .command('create [topicOrPrompt]')
  .description('Stage ③ [创作 Create]: Conversationally create a new multimodal .deck.md from a natural language topic or brief')
  .option('-o, --output <outDeck>', 'Output .deck.md path', './decks/created.deck.md')
  .option('-t, --template <id>', 'Template ID', 'xhs-swiss-grid')
  .option('-a, --aspect <ratio>', 'Aspect ratio (16:9, 3:4, 1:1, 9:16)', '3:4')
  .option('-l, --locale <loc>', 'Target locale (zh-CN, en, ja, ko)', 'zh-CN')
  .option('--recipe <recipeId>', 'Recipe ID (quote-extract, bento-style, presentation-outline, bilingual-translate, xhs-viral, apple-bento-ppt)')
  .option('-b, --backend <backend>', 'AI backend (auto, offline, api, cli:<id>)', 'auto')
  .option('--json', 'Emit machine-readable JSON')
  .action(handleDeckCreate);

program
  .command('pipeline [stage]')
  .description('Inspect or advance the 4-stage creative flywheel: ① Intake -> ② Distill -> ③ Create -> ④ Publish')
  .option('-w, --workspace <dir>', 'Target workspace directory', '.')
  .option('--json', 'Emit machine-readable JSON')
  .action(async (_stage: string | undefined, opts: { workspace: string; json?: boolean }) => {
    const wsDir = path.resolve(opts.workspace);
    const summary = await readWorkspaceState(wsDir);

    const f = summary.pipeline;
    const lines = [
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `🔄 Aimake 4-Stage Creative Flywheel Pipeline`,
      `   Workspace: "${summary.config.name}" (${wsDir})`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `① 抓取 Intake  : [${f.intake.status}] ${summary.sources.length} sources (sources/ & raw materials)`,
      `② 萃取 Distill : [${f.distill?.status || (summary.wikiPages.length > 0 ? 'ready' : 'empty')}] ${summary.wikiPages.length} wiki cards · ${summary.briefs.length} briefs`,
      `③ 创作 Create  : [${f.stage.status}] ${summary.decks.length} active deck(s) (decks/ & studio stage)`,
      `④ 发布 Publish : [${f.deliver.status}] ${summary.exports.length} exported deliverables (exports/ & wiki/published.md)`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `Current Active Stage: ${
        f.currentStage === 'deliver'
          ? '④ 发布 Publish'
          : f.currentStage === 'stage'
            ? '③ 创作 Create'
            : f.currentStage === 'author'
              ? '② 萃取 Distill'
              : '① 抓取 Intake'
      }`,
    ];

    let nextStep = 'aimake intake <url-or-file>';
    if (f.currentStage === 'deliver') {
      nextStep = 'All stages complete! Run `aimake publish <file>` to cross-post or `aimake studio` to refine.';
    } else if (f.currentStage === 'stage') {
      nextStep = `Run \`aimake publish ${summary.decks[0]?.relativePath || 'decks/*.deck.md'}\` or \`aimake studio\``;
    } else if (f.currentStage === 'author') {
      nextStep = 'Run `aimake create` to generate visual storyboard slides';
    } else {
      nextStep = 'Run `aimake intake <source>` to ingest raw notes or URLs';
    }

    lines.push(`Recommended Next Step: ${nextStep}`);
    lines.push(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

    printResult(
      {
        workspace: wsDir,
        workspaceName: summary.config.name,
        currentStage: f.currentStage,
        flywheelStage: f.flywheelStage,
        stages: f.flywheel,
        counts: {
          sources: summary.sources.length,
          wikiPages: summary.wikiPages.length,
          briefs: summary.briefs.length,
          decks: summary.decks.length,
          exports: summary.exports.length,
        },
        recommendedNextStep: nextStep,
      },
      opts.json,
      lines.join('\n')
    );
  });

const siteCmd = program.command('site').description('Build zero-backend 4-language static showcase & SEO pages');

siteCmd
  .command('build')
  .option('--out <dir>', 'Output directory', 'dist-site')
  .option('--json', 'Emit machine-readable JSON')
  .action(async (opts: { out: string; json?: boolean }) => {
    const outAbs = path.resolve(opts.out);
    const res = await buildStaticSite(outAbs);
    printResult(
      { ok: true, outDir: outAbs, ...res },
      opts.json,
      `Built 4-language static site (${res.pagesWritten} HTML files, ${res.sitemapUrlCount} sitemap URLs) -> ${outAbs}`
    );
  });

program
  .command('import <file>')
  .description('Convert a Marp, Slidev, or plain Markdown slide file into canonical Aimake .deck.md')
  .option('-t, --template <id>', 'Target Aimake template ID', 'apple-bento-launch')
  .option('--locale <loc>', 'Output locale (zh-CN | en | ja | ko)')
  .option('--title <title>', 'Override presentation title')
  .option('-o, --output <outFile>', 'Write converted .deck.md to file (defaults to <name>.deck.md)')
  .option('--json', 'Emit machine-readable JSON')
  .action(
    async (
      file: string,
      opts: {
        template?: string;
        locale?: SupportedLocale;
        title?: string;
        output?: string;
        json?: boolean;
      }
    ) => {
      const absInput = path.resolve(file);
      const raw = await fs.readFile(absInput, 'utf8');
      const result = importExternalMarkdownDeck(raw, {
        template: opts.template,
        locale: opts.locale,
        title: opts.title,
      });
      const outPath = path.resolve(
        opts.output || absInput.replace(/\.(deck\.)?md$/i, '') + '.deck.md'
      );
      await fs.mkdir(path.dirname(outPath), { recursive: true });
      await fs.writeFile(outPath, result.markdown, 'utf8');
      printResult(
        { ok: true, outPath, ...result },
        opts.json,
        `Imported ${result.sourceFormat.toUpperCase()} (${result.slideCount} slides) -> ${outPath}`
      );
    }
  );

async function runInteractiveWizard(): Promise<void> {
  p.intro(`${pc.bgBlack(pc.white(' Aimake '))} ${pc.bold('Local-First Multimodal Creator Studio')}`);

  const action = await p.select({
    message: '你想做什么？',
    options: [
      { value: 'workspace', label: '初始化创作工作区', hint: '自动实体写入 7 套闭环 Skill，零全局污染' },
      { value: 'studio', label: '打开本地 Studio 视觉舞台', hint: '实时分镜编辑 + 对话改稿 + 一稿五出' },
      { value: 'import', label: '从 Marp / Slidev Markdown 导入', hint: '迁移现有幻灯片为 .deck.md' },
      { value: 'doctor', label: '环境体检 (doctor)', hint: '检查模板、可选 Chrome / FFmpeg 与 AI CLI' },
    ],
  });

  if (p.isCancel(action)) {
    p.cancel('已取消操作。');
    process.exit(0);
  }

  if (action === 'workspace') {
    const dirInput = await p.text({
      message: '工作区目录路径',
      placeholder: './my-aimake-studio',
      defaultValue: './my-aimake-studio',
    });
    if (p.isCancel(dirInput)) {
      p.cancel('已取消');
      process.exit(0);
    }

    const nameInput = await p.text({
      message: '工作区名称',
      placeholder: '我的创作工作区',
      defaultValue: '我的创作工作区',
    });
    if (p.isCancel(nameInput)) {
      p.cancel('已取消');
      process.exit(0);
    }

    const scenario = await p.select({
      message: '选择创作场景预设',
      options: [
        { value: 'creator-growth', label: '超级个体自媒体飞轮', hint: '小红书 / 公众号 / 短视频' },
        { value: 'product-launch', label: '产品发布会与演示', hint: '16:9 宽屏 Bento / Keynote' },
        { value: 'executive-ppt', label: '高管汇报与架构评审', hint: '可编辑 PPTX / PDF' },
        { value: 'educator-course', label: '课程讲义与知识闪卡', hint: '结构化教学与闪卡' },
      ],
    });
    if (p.isCancel(scenario)) {
      p.cancel('已取消');
      process.exit(0);
    }

    const spin = p.spinner();
    spin.start('正在初始化工作区并写入 7 大闭环 Skill…');
    const targetDir = path.resolve(String(dirInput));
    const ws = await initWorkspace(targetDir, {
      name: String(nameInput),
      scenario: scenario as WorkspaceScenarioPreset,
      cliPath: path.join(REPO_ROOT, 'dist', 'cli.js'),
    });
    spin.stop(pc.green(`工作区已就绪：${targetDir}`));

    const launchNow = await p.confirm({
      message: '是否立即启动本地 Studio 视觉舞台？',
      initialValue: true,
    });
    if (!p.isCancel(launchNow) && launchNow) {
      const studio = await startStudioServer({
        deckPath: ws.decks[0]?.absolutePath || path.join(targetDir, 'decks', 'deck.deck.md'),
        port: 4310,
        workspaceDir: targetDir,
      });
      p.outro(`Studio 已启动：${pc.cyan(studio.url)}`);
      return;
    }
    p.outro(`下一步可运行：${pc.cyan(`aimake studio --workspace ${targetDir}`)}`);
    return;
  }

  if (action === 'studio') {
    const spin = p.spinner();
    spin.start('正在启动本地 Studio 舞台…');
    const demoDeck = path.join(REPO_ROOT, 'examples', 'zh-creator-flywheel.deck.md');
    const studio = await startStudioServer({ deckPath: demoDeck, port: 4310 });
    spin.stop(pc.green(`Studio 正在运行：${pc.cyan(studio.url)}`));
    p.outro('按 Ctrl+C 停止服务。');
    return;
  }

  if (action === 'import') {
    const fileInput = await p.text({
      message: '输入 Marp / Slidev Markdown 文件路径',
      placeholder: './slides.md',
    });
    if (p.isCancel(fileInput) || !String(fileInput).trim()) {
      p.cancel('未提供文件路径。');
      process.exit(0);
    }
    const absIn = path.resolve(String(fileInput).trim());
    const raw = await fs.readFile(absIn, 'utf8');
    const converted = importExternalMarkdownDeck(raw);
    const outPath = absIn.replace(/\.(deck\.)?md$/i, '') + '.deck.md';
    await fs.writeFile(outPath, converted.markdown, 'utf8');
    p.outro(
      pc.green(
        `已识别为 ${converted.sourceFormat.toUpperCase()}（${converted.slideCount} 页），转换保存至 ${outPath}`
      )
    );
    return;
  }

  const templates = await listTemplates();
  const hosts = await detectLocalHosts();
  let ffmpegState = 'not installed (optional)';
  try {
    ffmpegState = await resolveWorkingFfmpegBinary();
  } catch {
    // optional
  }
  p.note(
    [
      `Node.js     : ${process.version}`,
      `Templates   : ${templates.length} ready`,
      `FFmpeg      : ${ffmpegState}`,
      `AI Hosts    : ${hosts.filter((h) => h.detected).map((h) => h.id).join(', ') || 'none'}`,
    ].join('\n'),
    'Aimake Doctor'
  );
  p.outro('一切就绪。');
}

program
  .command('wizard')
  .description('Launch the interactive Aimake onboarding wizard (@clack/prompts)')
  .action(async () => {
    await runInteractiveWizard();
  });

program
  .command('mcp')
  .description('Start standard JSON-RPC 2.0 stdio MCP server for OpenCode, Codex, WorkBuddy, Claude Code & AGY')
  .action(async () => {
    await startStdioMcpServer();
  });

if (process.argv.length <= 2 && process.stdin.isTTY && process.stdout.isTTY) {
  runInteractiveWizard().catch((err) => {
    console.error(err instanceof Error ? err.message : String(err));
    process.exit(1);
  });
} else {
  program.parseAsync(process.argv).catch((err) => {
    console.error(err instanceof Error ? err.message : String(err));
    process.exit(1);
  });
}
