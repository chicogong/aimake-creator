# Contributing to Aimake

Thank you for your interest in contributing to **Aimake**! We are building the local-first multimodal creation engine for the AI era — turning ideas, research, spreadsheets, and notes into grounded, design-grade content delivered across every channel.

---

## 🧭 Code of Conduct

This project adheres to the [Contributor Covenant (Code of Conduct)](./CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

---

## 🛠️ Development Setup

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

# 4. Launch development CLI
pnpm aimake --help
pnpm aimake studio --demo
```

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

Before opening a pull request, run the full verification pipeline:

```bash
pnpm verify
```

This runs:
- `pnpm typecheck` (TypeScript 0 errors)
- `pnpm test` (Vitest suites)
- `pnpm build` (tsup ESM & DTS)
- `pnpm validate:skill` & `pnpm audit:skills`
- `pnpm audit:secrets` (ensures 0 private credentials/paths)
- `pnpm pack:check` (dry-run npm packaging)
- `pnpm site:build` (static showcase build)
- `pnpm desktop:build` (macOS native app build)
- `pnpm test:e2e` (Playwright end-to-end tests)

---

## 📜 Pull Request Process

1. Fork the repo and create your branch from `main`: `git checkout -b feature/amazing-feature`.
2. Follow Conventional Commits: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`.
3. Open a Pull Request referencing any related issues.
4. Aimake maintainers will review your PR promptly!
