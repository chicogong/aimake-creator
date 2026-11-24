# Aimake 2.x — Open-Source Product & Architecture Roadmap

**Aimake Studio (`aimake.cc`)** is an **MIT-licensed, local-first multimodal Creative OS** for solopreneurs, developers, and AI agents. Starting from `v2.0.0` (36 parametric templates across 4 locales, Karpathy LLM Wiki core, 1-to-5 native deliverables, Calm Studio local server, CLI + MCP server, and macOS `Aimake.app` wrapper), the 2.x roadmap aligns strictly with our four active GitHub Milestones on [`chicogong/aimake-creator`](https://github.com/chicogong/aimake-creator/milestones) and **Project #3**.

---

## Strategic Architectural Principles

1. **100% Local-First Sovereignty**: All `.deck.md` decks, Knowledge Vault files (`sources/`, `wiki/`, `briefs/`, `exports/`), and rendered assets live strictly on the creator's device with zero cloud lock-in and zero telemetry.
2. **Protocol-First Interoperability**: Every core capability exposes clean contracts across CLI (`--json`), MCP (`stdio` + SEP-1865 `ui://`), and ACP (Agent Client Protocol) so Zed, JetBrains, Cursor, Claude Code, Codex, and OpenCode act as native authoring brains.
3. **Deterministic Layout & Media Compilation**: Deterministic CSS grid layout, editable OOXML `.pptx`, pure inline WeChat HTML, hardware-accelerated H.264 MP4, and CapCut / JianYing `draft_content.json` multi-track timelines run predictably offline.
4. **Typed, Modular & Automated Quality**: Strictly typed modular UI/engine layers replace giant template strings, backed by Playwright E2E, Vitest conformance suites, secret/privacy audits, and automated GitHub Kanban tracking.

---

## Milestone Sequence (Synchronized with GitHub Milestones)

| Milestone | Due Date | Core Focus | Key Tracked Issues & Exit Criteria |
| :--- | :--- | :--- | :--- |
| **`v2.0.1`** | `2026-12-08` | **Urgent Fixes & Security Hardening** | Repair Swift ↔ WebView `aimakeNative` bridge & `⌘K` shortcut collision; add `Origin` / `Sec-Fetch-Site` CSRF guards to loopback server; expand `audit-secrets.mjs`; fix dynamic radar label (`W47` hardcoded removal); normalize audio loudness toward `-14 LUFS`. |
| **`v2.1.0`** | `2026-12-31` | **Core Stabilization, CapCut Complete, ACP & CLI-Hub** | Complete CapCut exporter with rendered slide PNGs & local path rewriting (#10); fix audio-paced timeline drift (#13); ship ACP adapter (#9); add ACP/SSE/CapCut conformance tests (#12); standardize CLI `--json` for `CLI-Hub` (#16). |
| **`v2.2.0`** | `2027-01-31` | **On-Device Voice, AutoClip Intake, Engagement Radar & Persona Hub** | Integrate Apple Silicon `mlx-audio` / `Qwen3-TTS` voice cloning (#3); bridge `autoclip-mcp` for long-video repurposing intake (#14); upgrade Trend Radar with multi-source engagement weights inspired by `last30days-skill` (#15); ship Local Vault & Persona DNA Hub (#11). |
| **`v2.3.0`** | `2027-03-15` | **Modular Studio UI, Tauri 2 Desktop & CDP Publisher** | Replace 2k+ LOC raw JS string UI with typed modular Vite/TS Calm Studio build (4-locale Studio i18n, undo/redo, slide reorder, async job progress); bundle portable runtime and migrate toward cross-platform signed/notarized Tauri 2 desktop (#5); ship headless Chrome CDP multi-platform draft publisher (#4) & community template hub (#2). |

---

## Subsystem Investment Map

1. **Intake & Radar (`src/intake/`, `src/radar/`)**:
   - Multi-source engagement scoring (Reddit/HN/Polymarket/X/YouTube transcript insights) + AutoClip MCP video highlight extraction + optional `aria2` RPC downloader bridge for protected streams.
2. **Knowledge Vault & Persona (`src/wiki/`, `src/workspace/`)**:
   - Bounded Karpathy LLM Wiki (`<= 3,000 tokens` index) with `cite:` line provenance + 4-locale Style DNA & anti-slop humanizer (`<= 800 tokens` persona profiles).
3. **Calm Studio & Native Desktop (`src/studio/`, `desktop/`)**:
   - Typed modular frontend, bidirectional Canvas ↔ Markdown live sync, Excalidraw spatial sketch embed, and cross-platform native desktop shell with auto-updater and notarization.
4. **Media & Timeline Engine (`src/renderer/`, `src/speech/`)**:
   - Total-duration-reconciled frame pacing, font/image settle barriers before PNG capture, VideoToolbox / NVENC hardware encoding detection, `-14 LUFS` audio normalization, and production-grade 6-track CapCut `draft_content.json` export.
5. **Agent Protocol Stack (`src/mcp/`, `src/cli.ts`, ACP)**:
   - Unified JSON-RPC schema spanning MCP tools, SEP-1865 `ui://aimake/preview`, ACP bidirectional IDE sessions, and CLI-Hub `SKILL.md` packaging.

For concrete file-level audit findings, code metrics, and open-source benchmark references, see [`PRODUCT_AUDIT_AND_ARCHITECTURE_2026.md`](./PRODUCT_AUDIT_AND_ARCHITECTURE_2026.md).
