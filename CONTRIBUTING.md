# Contributing to Aimake Studio

Thank you for your interest in contributing to **Aimake Studio**! We are building the local-first multimodal creation engine for the AI era — turning ideas, research, spreadsheets, and notes into grounded, design-grade content delivered across every channel.

For an exhaustive guide covering the automated Kanban board, issue forms, branch policies, and GitHub CLI workflows, see the **[Development & Contribution Workflow Guide](docs/guides/DEVELOPMENT_WORKFLOW.md)**.

---

## 🧭 Code of Conduct

This project adheres to the [Contributor Covenant (Code of Conduct)](./CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

---

## 🛠️ Quickstart Development Setup

Aimake requires **Node.js >= 22.0.0** and **pnpm >= 9**.

```bash
# 1. Clone the repository
git clone https://github.com/chicogong/aimake-creator.git
cd aimake-creator

# 2. Install dependencies
pnpm install

# 3. Run typecheck and tests
pnpm typecheck
pnpm test

# 4. Launch development CLI or Studio
pnpm aimake --help
pnpm aimake studio --demo
```

---

## 🔄 Development & PR Workflow

Aimake enforces a **Squash-and-Merge** policy with a single linear history on `main`:

```bash
# 1. Start from an Issue (e.g. #12), branch from main
git checkout main && git pull origin main
git checkout -b feat/my-feature

# 2. Develop, test, and commit with Conventional Commits
git commit -m "feat(publisher): implement Zhihu draft CDP publisher"

# 3. Verify locally before opening PR
pnpm typecheck
pnpm test
pnpm audit:secrets

# 4. Push and create PR referencing the issue
git push origin feat/my-feature
gh pr create --title "feat(publisher): implement Zhihu draft publisher" --body "Closes #12"
```

### Automated Kanban Board Transitions

Our GitHub Actions automation (`.github/workflows/project-automation.yml`) automatically synchronizes state with **[Aimake Project Board #3](https://github.com/users/chicogong/projects/3)**:

| Action | Resulting Board State |
| :--- | :--- |
| Issue created | Added to **Todo** |
| Issue assigned | Moved to **In Progress** |
| PR opened (with `Closes #N`) | PR moved to **In Review**; Issue moved to **In Progress** |
| PR merged (squash) | PR and linked Issue automatically moved to **Done** |

---

## 🎨 Adding a New Design Template

Aimake ships with 36 parametric design systems in `templates/`. Every template adheres to the **Aimake Design Contract**:

1. **Folder Structure**:
   ```
   templates/<template-slug>/
   ├── manifest.json       # Metadata, name, aspect ratio, supported styles
   ├── template.html       # Parametric HTML/CSS template with window.renderDeck
   ├── sample.deck.md      # Self-contained sample deck for instant preview
   └── preview.png         # High-resolution thumbnail for Studio & Web Gallery
   ```
2. **Contract Requirements**:
   - Must implement `:root[data-theme="dark"]` and `:root[data-theme="light"]`.
   - Must expose standard CSS variables: `--bg`, `--surface`, `--ink`, `--muted`, `--accent`, `--border`, `--card-shadow`, `--code-bg`.
   - Must integrate `data-editable` markers for WYSIWYG editing.
   - Must support offline Mermaid diagrams and syntax highlighting.
3. **Verify Compliance**:
   ```bash
   pnpm audit:skills
   pnpm validate:skill
   ```

---

## 🤖 Extending AI Co-Pilot & Workspace Skills

Aimake workspaces use **materialized, isolated preset skills** (`skills/workspace-presets/`):
- Never create global symlinks in `~/` or `~/.claude/skills/`.
- Preserve user-customized skill files via SHA-256 manifests.
- When adding quick action chips or external AI recipes, update `src/workspace/agent-connector.ts` and `src/studio/calm-ui/script.ts`.

---

## 🛡️ Quality Gate & Verification

Before submitting a Pull Request, run the full verification pipeline:

```bash
pnpm verify
```

This automated gate runs:
- `pnpm typecheck` (TypeScript 0 errors)
- `pnpm test` (All Vitest test suites)
- `pnpm test:e2e` (Playwright browser suites)
- `pnpm build` (tsup ESM & DTS bundle)
- `pnpm validate:skill` & `pnpm audit:skills`
- `pnpm audit:secrets` (ensures 0 private credentials or personal paths)
- `pnpm pack:check` (dry-run npm packaging)
- `pnpm site:build` (static showcase build)
- `pnpm desktop:build` (macOS native app build)

---

## 📜 Pull Request Checklist

When submitting a PR, ensure the template is completed:
- [ ] Description contains `Closes #N` or `Fixes #N`
- [ ] Appropriate labels assigned (`area:*`, `type:*`)
- [ ] Local-first & offline capability preserved (zero telemetry)
- [ ] All tests pass cleanly (`pnpm test`, `pnpm test:e2e`)
- [ ] No private paths or secrets leaked (`pnpm audit:secrets`)
