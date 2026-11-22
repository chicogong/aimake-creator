# AGENTS.md — Aimake Repository Instructions

Aimake (`aimake.cc`) is a **closed-source proprietary, zero-backend, local-first multimodal content creation & Karpathy LLM Wiki studio** (`UNLICENSED` / All Rights Reserved). Never push this repository to a public remote or publish source packages to public npm registries.

## Architectural Invariants

1. **Zero-Backend Purity & Local Privacy**: Do not introduce mandatory cloud accounts, backend databases, or telemetry. Local Markdown (`raw/`, `wiki/`, `personas/`, `outputs/`) and `.deck.md` files are the sole source of truth on the user's device.
2. **Deterministic CLI Core**: `aimake` CLI must remain 100% deterministic without hardcoding third-party LLM SDKs—allowing 16+ AI coding/assistant hosts (`Antigravity`, `Codex`, `WorkBuddy`, `Claude Code`, `Cursor`, `dsh`, etc.) to author `.deck.md` files using their own subscriptions and invoke `aimake` for compilation.
3. **Isolated Host Testing Policy**: During development and CI, do NOT run `aimake init --apply` against the developer's real `~/` home directory unless explicitly instructed. Always pass `--home ./.local-sandbox-hosts` to test host auto-discovery and symlink linking in isolation.
4. **Resilient Media Tooling**:
   - Browser rendering uses `launchSmartBrowser()` (reuses local Chrome/Edge if Playwright Chromium is not cached).
   - Video encoding uses `resolveWorkingFfmpegBinary()` (verifies system `ffmpeg` execution and automatically falls back to `@ffmpeg-installer/ffmpeg` static binary).
5. **Strict Context & Privacy Guardrails**:
   - `wiki/index.md` is strictly bounded `<= 3,000 tokens`.
   - `personas/<id>.md` is strictly bounded `<= 800 tokens`.
   - Shared template bundles must pass `aimake share` (`pr-sanitizer`) and `pnpm audit:secrets`.

## Verification Gate (Run Before Every Release/Commit)

```bash
pnpm verify
```

`pnpm verify` executes:
1. `pnpm typecheck` (`tsc --noEmit`)
2. `pnpm test` (Vitest unit & integration suite)
3. `pnpm build` (`tsup` ESM bundle `< 5MB`)
4. `pnpm validate:skill` (validates `SKILL.md`, Codex/Claude/WorkBuddy manifests, and all 12 templates)
5. `pnpm audit:secrets` (verifies zero leaked API keys or user paths)
6. `pnpm site:build` (builds 4-language static showcase & SEO URLs for `aimake.cc`)
7. `pnpm test:e2e` (Playwright browser Studio WYSIWYG sync + 5-format binary export verification)
