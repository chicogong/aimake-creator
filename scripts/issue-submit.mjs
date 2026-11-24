#!/usr/bin/env node
/**
 * @file issue-submit.mjs
 * Ergonomic issue creation and project board automation script.
 * Usage:
 *   node scripts/issue-submit.mjs --title "..." --type [feature|bug|test|rfc] --body "..."
 *   pnpm issue:create --title "..." --type [feature|bug|test]
 */

import { execFileSync } from 'node:child_process';
import process from 'node:process';

const DEFAULT_REPO = 'chicogong/aimake-creator';
const DEFAULT_PROJECT_NUMBER = '3';
const DEFAULT_PROJECT_OWNER = 'chicogong';
const DEFAULT_MILESTONE = 'v2.1.0 Local Voice Cloning & Community Template Hub';

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    title: '',
    type: 'feature',
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
    labels: 'enhancement,priority: p1-high,roadmap',
  },
  bug: {
    prefix: '[Bug] ',
    labels: 'bug,priority: p1-high',
  },
  test: {
    prefix: '[Test Suite] ',
    labels: 'enhancement,area: ci-cd,priority: p2-normal',
  },
  rfc: {
    prefix: '[RFC] ',
    labels: 'enhancement,area: mcp,roadmap',
  },
};

function main() {
  const options = parseArgs();

  if (!options.title) {
    console.error(`
Usage:
  node scripts/issue-submit.mjs --title "Title" --type [feature|bug|test|rfc] --body "Description"

Options:
  --title, -t      Issue title (required)
  --type           Type of issue: feature (default), bug, test, rfc
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

  const finalBody = options.body.trim() || `Automated issue tracked for ${options.type}.`;

  console.log(`\x1b[36m🚀 Creating GitHub Issue on ${options.repo}...\x1b[0m`);
  console.log(`   Title: ${finalTitle}`);
  console.log(`   Labels: ${cfg.labels}`);
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
      cfg.labels,
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
