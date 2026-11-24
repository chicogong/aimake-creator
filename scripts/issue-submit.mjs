#!/usr/bin/env node
/**
 * @file issue-submit.mjs
 * Ergonomic issue creation and project board automation script.
 * Usage:
 *   node scripts/issue-submit.mjs --title "..." --type [feature|bug|test|rfc] --area [intake,video,...] --priority [p0|p1|p2] --body "..."
 *   pnpm issue:create --title "..." --type [feature|bug|test|rfc] --area desktop --priority p0
 */

import { execFileSync } from 'node:child_process';
import process from 'node:process';

const DEFAULT_REPO = 'chicogong/aimake-creator';
const DEFAULT_PROJECT_NUMBER = '3';
const DEFAULT_PROJECT_OWNER = 'chicogong';
const DEFAULT_MILESTONE = 'v2.1.0 Core Stabilization, CapCut Complete, ACP & CLI-Hub';

const VALID_AREAS = new Set([
  'intake',
  'distill',
  'create',
  'publish',
  'templates',
  'mcp',
  'desktop',
  'ci-cd',
  'security',
  'video',
  'site',
]);

const PRIORITY_MAP = {
  p0: 'priority: p0-urgent',
  'p0-urgent': 'priority: p0-urgent',
  p1: 'priority: p1-high',
  'p1-high': 'priority: p1-high',
  p2: 'priority: p2-normal',
  'p2-normal': 'priority: p2-normal',
};

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    title: '',
    type: 'feature',
    area: '',
    priority: '',
    body: '',
    repo: DEFAULT_REPO,
    milestone: DEFAULT_MILESTONE,
    project: DEFAULT_PROJECT_NUMBER,
    owner: DEFAULT_PROJECT_OWNER,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--title' || arg === '-t') {
      options.title = args[++i] || '';
    } else if (arg === '--type') {
      options.type = args[++i] || 'feature';
    } else if (arg === '--area' || arg === '-a') {
      options.area = args[++i] || '';
    } else if (arg === '--priority' || arg === '-p') {
      options.priority = (args[++i] || '').toLowerCase();
    } else if (arg === '--body' || arg === '-b') {
      options.body = args[++i] || '';
    } else if (arg === '--milestone' || arg === '-m') {
      options.milestone = args[++i] || DEFAULT_MILESTONE;
    } else if (arg === '--repo' || arg === '-r') {
      options.repo = args[++i] || DEFAULT_REPO;
    }
  }

  return options;
}

const TYPE_CONFIGS = {
  feature: {
    prefix: '[Feature Proposal] ',
    baseLabels: ['enhancement', 'roadmap'],
    defaultPriority: 'priority: p1-high',
  },
  bug: {
    prefix: '[Bug] ',
    baseLabels: ['bug'],
    defaultPriority: 'priority: p1-high',
  },
  test: {
    prefix: '[Test Suite] ',
    baseLabels: ['enhancement', 'area: ci-cd'],
    defaultPriority: 'priority: p2-normal',
  },
  rfc: {
    prefix: '[RFC] ',
    baseLabels: ['enhancement', 'area: mcp', 'roadmap'],
    defaultPriority: 'priority: p1-high',
  },
  security: {
    prefix: '[Security] ',
    baseLabels: ['bug', 'area: security'],
    defaultPriority: 'priority: p1-high',
  },
  architecture: {
    prefix: '[Architecture] ',
    baseLabels: ['enhancement', 'roadmap'],
    defaultPriority: 'priority: p1-high',
  },
};

function buildLabels(options, cfg) {
  const labels = new Set(cfg.baseLabels);

  if (options.priority) {
    const mapped = PRIORITY_MAP[options.priority];
    if (!mapped) {
      throw new Error(`Invalid --priority "${options.priority}". Use: p0, p1, p2.`);
    }
    labels.add(mapped);
  } else {
    labels.add(cfg.defaultPriority);
  }

  if (options.area) {
    for (const raw of options.area.split(',')) {
      const a = raw.trim().toLowerCase().replace(/^area:\s*/, '');
      if (!a) continue;
      if (!VALID_AREAS.has(a)) {
        throw new Error(`Invalid --area "${a}". Valid areas: ${Array.from(VALID_AREAS).join(', ')}`);
      }
      labels.add(`area: ${a}`);
    }
  }

  return Array.from(labels).join(',');
}

function main() {
  const options = parseArgs();

  if (!options.title) {
    console.error(`
Usage:
  node scripts/issue-submit.mjs --title "Title" --type [feature|bug|test|rfc|security|architecture] --area <area[,area]> --priority [p0|p1|p2] --body "Description"

Options:
  --title, -t      Issue title (required)
  --type           Type of issue: feature (default), bug, test, rfc, security, architecture
  --area, -a       Subsystem area(s), comma-separated: ${Array.from(VALID_AREAS).join(', ')}
  --priority, -p   Priority level: p0, p1, p2
  --body, -b       Issue description / markdown body
  --milestone, -m  Milestone title (default: ${DEFAULT_MILESTONE})
  --repo, -r       GitHub repository (default: ${DEFAULT_REPO})
`);
    process.exit(1);
  }

  const cfg = TYPE_CONFIGS[options.type] || TYPE_CONFIGS.feature;
  let finalTitle = options.title.trim();
  if (!finalTitle.startsWith('[') && cfg.prefix) {
    finalTitle = cfg.prefix + finalTitle;
  }

  const labels = buildLabels(options, cfg);
  const finalBody = options.body.trim() || `Automated issue tracked for ${options.type}.`;

  console.log(`\x1b[36m🚀 Creating GitHub Issue on ${options.repo}...\x1b[0m`);
  console.log(`   Title: ${finalTitle}`);
  console.log(`   Labels: ${labels}`);
  console.log(`   Milestone: ${options.milestone}`);

  try {
    const createArgs = [
      'issue',
      'create',
      '--repo',
      options.repo,
      '--title',
      finalTitle,
      '--label',
      labels,
      '--milestone',
      options.milestone,
      '--body',
      finalBody,
    ];

    const issueUrl = execFileSync('gh', createArgs, { encoding: 'utf8' }).trim();
    console.log(`\x1b[32m✔ Issue created:\x1b[0m ${issueUrl}`);

    console.log(`\x1b[36m📌 Linking to Project #${options.project} (${options.owner})...\x1b[0m`);
    const projectArgs = [
      'project',
      'item-add',
      options.project,
      '--owner',
      options.owner,
      '--url',
      issueUrl,
    ];
    execFileSync('gh', projectArgs, { encoding: 'utf8' });
    console.log(`\x1b[32m✔ Successfully attached to Kanban Board!\x1b[0m`);
  } catch (err) {
    console.error(`\x1b[31m✖ Error submitting issue:\x1b[0m`, err?.message || err);
    process.exit(1);
  }
}

main();
