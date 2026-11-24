# AGENTS.md — Aimake Studio Repository Instructions

**Aimake (`aimake.cc`)** (`aimake-studio` on npm, [`chicogong/aimake-creator`](https://github.com/chicogong/aimake-creator) on GitHub) is an **MIT-licensed, open-source, zero-backend, local-first multimodal content creation & Karpathy LLM Wiki studio** powered by a deterministic AST layout compiler and 36 built-in parametric design templates.

## Architectural & Content Invariants

1. **Zero-Backend Purity & Local Privacy**: Keep core editing, Knowledge Vault workflows (`raw/` / `sources/`, `wiki/`, `personas/`, `exports/`), and `.deck.md` rendering 100% local-first with zero mandatory cloud accounts or telemetry.
2. **Deterministic CLI & Protocol Core**: `aimake` CLI and MCP server remain deterministic without hardcoding paid third-party LLM SDK keys—enabling 16+ AI hosts (`Antigravity`, `Codex`, `WorkBuddy`, `Claude Code`, `Cursor`, `OpenCode`, `Zed`) to author `.deck.md` and compile via CLI/MCP/ACP.
3. **Public / Internal Governance Isolation**:
   - Never include internal repository maintenance statuses, legacy child-app paths (`aimake-labs/*`), private server commands, hostnames (`VM-*`), internal corporate URLs, API credentials, or personal paths (`/Users/<name>/`) anywhere in source code, issues, websites (`aimake.cc`), or public docs.
   - Use `pnpm audit:secrets` before every commit/PR to enforce zero leaks.
4. **Copywriting & Documentation Tone Standard**:
   - State product value, technical design, and behaviors affirmatively and directly in Chinese and English documentation and UI copy.
   - Use affirmative, direct assertions across docs, templates, and UI copy; avoid negative-contrast transitions ('not X, but Y').
5. **Isolated Host Testing Policy**: During development and CI, do NOT run `aimake init --apply` against the developer's real `~/` home directory unless explicitly instructed. Always pass `--home ./.local-sandbox-hosts` to test host auto-discovery and symlink linking in isolation.
6. **Resilient Media Tooling**:
   - Browser rendering uses `launchSmartBrowser()` (reuses local Chrome/Edge if Playwright Chromium is not cached).
   - Video encoding uses `resolveWorkingFfmpegBinary()` (verifies system `ffmpeg` execution and automatically falls back to `@ffmpeg-installer/ffmpeg` static binary).
7. **Strict Context & Privacy Guardrails**:
   - `wiki/index.md` stays bounded `<= 3,000 tokens`.
   - `personas/<id>.md` stays bounded `<= 800 tokens`.
   - Shared template bundles must pass `aimake share` (`pr-sanitizer`) and `pnpm audit:secrets`.

## Verification Gate (Run Before Every Release/Commit)

```bash
pnpm verify
```

`pnpm verify` executes the full 11-step quality pipeline defined in `package.json`:
1. `pnpm typecheck` (`tsc --noEmit`)
2. `pnpm build` (`tsup` ESM + `.d.ts` bundle)
3. `pnpm test:smoke` (`scripts/smoke-test.mjs`)
4. `pnpm test` (Vitest unit & integration suite across all 10 test files)
5. `pnpm validate:skill` (validates `SKILL.md`, host manifests, and all 36 templates)
6. `pnpm audit:skills` (`scripts/audit-skills.ts`)
7. `pnpm audit:secrets` (scans repo for API keys, internal infra patterns, and private local paths)
8. `pnpm pack:check` (`scripts/prepare-npm.mjs`)
9. `pnpm site:build` (builds 4-language static showcase & playground for `aimake.cc`)
10. `pnpm desktop:build` (builds & strict-verifies macOS `Aimake.app` bundle on darwin)
11. `pnpm test:e2e` (Playwright browser Studio + Playground + 5-format export verification)

See [`docs/DOCS_INDEX.md`](./docs/DOCS_INDEX.md), [`docs/guides/DEVELOPMENT_WORKFLOW.md`](./docs/guides/DEVELOPMENT_WORKFLOW.md), and [`docs/PRODUCT_AUDIT_AND_ARCHITECTURE_2026.md`](./docs/PRODUCT_AUDIT_AND_ARCHITECTURE_2026.md) for engineering standards, roadmap milestones, and Project #3 Kanban automation.
