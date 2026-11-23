# Aimake Studio · Development & Contribution Workflow

This document defines the development workflow, issue triage, Pull Request lifecycle, automated Kanban board transitions, and quality standards for **Aimake Studio** (`products/aimake`).

It adopts best practices from high-velocity developer tooling and production open-source teams.

---

## 1. Tooling & Ecosystem Overview

| Tool | Purpose | Location / Link |
| :--- | :--- | :--- |
| **Issues** | Feature proposals, bug reports, template RFCs, tasks | [GitHub Issues](https://github.com/chicogong/aimake-creator/issues) |
| **Project Board** | Automated Kanban (Todo → In Progress → In Review → Done) | [Aimake Studio 看板 (Project #3)](https://github.com/users/chicogong/projects/3) |
| **Pull Requests** | Code review, automated quality gate, delivery tracking | [Pull Requests](https://github.com/chicogong/aimake-creator/pulls) |
| **Milestones** | Version roadmap & release tracking (`v2.0.0`, `v2.1.0`) | [Milestones](https://github.com/chicogong/aimake-creator/milestones) |
| **Discussions** | Design systems RFC, showcase sharing, Q&A | [Discussions](https://github.com/chicogong/aimake-creator/discussions) |

---

## 2. Issue Lifecycle & Structured Templates

When reporting issues or proposing enhancements, use the structured templates in `.github/ISSUE_TEMPLATE/`:

| Template | Prefix | Labels | Purpose |
| :--- | :--- | :--- | :--- |
| **Bug Report** | `fix: ` | `bug` | Unexpected behavior, rendering bugs, export failures |
| **Feature Proposal** | `feat: ` | `enhancement` | New engine capability, export format, CLI workflow, or MCP tool |
| **Template Request** | `template: ` | `area: templates`, `community: template-submission` | New 3:4, 16:9, 4:5, or 9:16 parametric slide design system |
| **Task / Maintenance** | `chore: ` | `enhancement` | Refactor, dependency bump, CI/CD, documentation, test suite |

### Label Taxonomy

Labels are categorized into four standard dimensions:

1. **Subsystem / Area (`area: <name>`)**:
   - `area: intake`: Material ingestion, web scrapers (X/Twitter, WeChat, CSV, SRT)
   - `area: distill`: Knowledge distillation, persona, wiki generation
   - `area: create`: Calm Studio canvas, composer, storyboard compiler
   - `area: publish`: Omni-channel exporters (PNG, PPTX, PDF, HTML, MP4, WeChat MP)
   - `area: templates`: 36 design templates, CSS tokens, layout systems
   - `area: mcp`: Model Context Protocol server & AI agent tools
   - `area: desktop`: macOS Swift native app wrapper & DMG packaging
   - `area: ci-cd`: GitHub Actions workflows & automated release pipelines
2. **Priority (`priority: <level>`)**:
   - `priority: p0-urgent`: Critical blocker, regression, or security leak
   - `priority: p1-high`: Important feature for current milestone
   - `priority: p2-normal`: Standard backlog enhancement
3. **Status (`status: <state>`)**:
   - `status: in-progress`: Actively being worked on
   - `status: needs-review`: PR submitted, awaiting review or test verification
4. **Special Flags**:
   - `roadmap`: Pinned 2026 strategic milestones
   - `community: template-submission`: Designer-contributed deck templates
   - `good first issue` / `help wanted`: Suitable for new contributors

---

## 3. Automated Kanban Board & State Transitions

Aimake Studio utilizes **GitHub Project #3** (`Aimake Studio · 旗舰工坊产品研发与经营看板`) with automated state transitions orchestrated by `.github/workflows/project-automation.yml`:

```mermaid
flowchart LR
    Open["Issue Opened"] -->|Auto-Added| Todo["Todo"]
    Todo -->|Assigned| InProgress["In Progress"]
    PROpen["PR Opened (Closes #N)"] -->|Auto-Trigger| InReview["In Review (PR)"]
    InReview -.->|Linked Issue| InProgress
    PRMerge["PR Merged (Squash)"] -->|Auto-Trigger| Done["Done (PR & Issue)"]
```

### Column Definitions

| Column | Trigger Event | Description |
| :--- | :--- | :--- |
| **Todo** | Issue or PR opened | Backlog and triaged work scheduled for development |
| **In Progress** | Issue assigned, or branch PR created | Actively being developed |
| **In Review** | PR opened against `main` | Code review and CI Quality Gate verification |
| **Done** | PR merged into `main` | Shipped, verified, and closed |

### Automatic Linkage via PR Description

To enable automatic issue closure and state progression, always reference the issue in your PR body:

```markdown
## Summary
- Implemented Twitter/X and WeChat intake parser
- Added unit tests for zero-auth scraping

Closes #12
```

When this PR merges, **Issue #12** automatically closes and both move to the **Done** column on the Kanban board.

---

## 4. Git & Branching Strategy

To keep the git history clean and bisect-friendly, Aimake enforces a **Squash-and-Merge** policy with a single linear history on `main`.

### Branch Naming Conventions

Always branch from the latest `origin/main`:

```bash
git checkout main
git pull origin main
git checkout -b <type>/<short-description>
```

| Prefix | Usage | Example |
| :--- | :--- | :--- |
| `feat/` | New product feature or capability | `feat/wechat-cdp-publisher` |
| `fix/` | Bug fix or regression patch | `fix/pptx-shape-offset` |
| `template/` | New parametric design template | `template/editorial-magazine-3x4` |
| `refactor/` | Code refactoring without behavior changes | `refactor/composer-ast-parser` |
| `chore/` | Build scripts, dependencies, CI/CD | `chore/update-vitest-v3` |
| `docs/` | Documentation, branding, guides | `docs/development-workflow` |

### Commit Message Format

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <short description>
```

- Allowed types: `feat`, `fix`, `docs`, `refactor`, `perf`, `test`, `chore`.
- Scopes correspond to subsystem areas: `(cli)`, `(studio)`, `(templates)`, `(publisher)`, `(intake)`, `(mcp)`, `(desktop)`.
- Example: `feat(publisher): add headless Chrome CDP publisher for WeChat MP drafts`

---

## 5. Local Development & Verification Preflight

Before committing code or submitting a PR, run the local quality checks:

```bash
# 1. Typecheck TypeScript
pnpm typecheck

# 2. Run unit & integration test suites
pnpm test

# 3. Run Playwright E2E browser tests
pnpm test:e2e

# 4. Run secret & private path audit (Ensures 0 leaks)
pnpm audit:secrets

# 5. Run full preflight verification
pnpm verify
```

### Local-First & Zero-Telemetry Contract

All contributions must adhere to the **Local-First Contract**:
1. **Zero External Tracking**: Never introduce analytics scripts, telemetry beacons, or unauthorized remote phone-home calls.
2. **100% Offline Capability**: Core editing, template rendering, and export to PNG, PPTX, PDF, and HTML must work entirely without an internet connection.
3. **Local Data Sovereignty**: All user workspace files, decks, research sources, and generated media remain in the user's local directory.

---

## 6. GitHub CLI (`gh`) Cheat Sheet

For contributors preferring the command line:

```bash
# 1. List active issues on Project Board
gh issue list --repo chicogong/aimake-creator

# 2. Create a new Feature Issue and assign to self
gh issue create \
  --repo chicogong/aimake-creator \
  --title "feat(publisher): support Zhihu column markdown export" \
  --label "enhancement,area: publish" \
  --assignee "@me"

# 3. Open a Pull Request linking the issue
gh pr create \
  --repo chicogong/aimake-creator \
  --title "feat(publisher): add Zhihu column exporter" \
  --body "Closes #15"

# 4. View Project #3 Kanban Board items
gh project item-list 3 --owner chicogong

# 5. Merge PR with squash merge and delete feature branch
gh pr merge <pr-number> --squash --delete-branch
```
