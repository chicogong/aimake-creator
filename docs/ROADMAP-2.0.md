# Aimake 2.x — Open-Source Product & Architecture Roadmap

**Aimake Studio (`aimake.cc`)** is an **MIT-licensed, local-first multimodal Creative OS** for solopreneurs, developers, and AI agents. Starting from `v2.0.0` (36 parametric templates across 4 locales, Karpathy LLM Wiki core, 1-to-5 native deliverables, Calm Studio local server, CLI + MCP server, and macOS `Aimake.app` wrapper), the 2.x roadmap aligns strictly with our active GitHub Milestones on [`chicogong/aimake-creator`](https://github.com/chicogong/aimake-creator/milestones), **Project #3**, and the architectural consensus documented in **[Discussion #63](https://github.com/chicogong/aimake-creator/discussions/63)** and **[Discussion #58](https://github.com/chicogong/aimake-creator/discussions/58)**.

---

## Strategic Architectural Principles

1. **100% Local-First Sovereignty (Zero-Cloud)**: All user content strictly resides under `~/Documents/Aimake/` (containing `.aimake/` configuration, `.agents/` inter-agent contracts, `wiki/` knowledge vault, `sources/` intake materials, `projects/` creative collections, and `deliverables/` multi-format outputs).
2. **Protocol-First Interoperability (.agents Standard)**: Every capability is exposed through clean, structured contracts across CLI (`--json`), MCP (`stdio` + SEP-1865 `ui://`), and ACP (Agent Client Protocol) so Claude Code, Cursor, Codex, OpenCode, and Google Antigravity (AGY) act as frictionless co-pilots.
3. **Deterministic Layout & Multi-Channel Delivery**: Visual IR layout calculations, editable OOXML `.pptx`, safe inline WeChat HTML (with rasterized/SVG Mermaid diagrams), hardware-accelerated H.264 MP4, and CapCut multi-track timelines run 100% predictably offline.
4. **Draft-Only Platform Syndication**: Adheres to the principle of "Draft Box Delivery + Editable Receipt Link", never publishing directly without author review.
5. **Anti-Hallucination Citation Compounding**: Every generated insight maintains a cryptographic citation anchor back to `wiki/` or `sources/`, compounding the creator's irreplaceable local context moat.

---

## Active Issue Priority Matrix (P0 / P1 / P2)

| Level | Issue / Topic | Impact Domain | Delivery Target & Acceptance Criteria |
| :---: | :--- | :--- | :--- |
| **P0** | **[#54](https://github.com/chicogong/aimake-creator/issues/54) Cross-Workspace Draft Isolation** | Data Integrity | `POST /api/markdown` carries explicit `workspaceId`/path confirmation. Prevents cross-workspace file overwriting; prompts 3-way diff on mtime conflict. |
| **P0** | **[#55](https://github.com/chicogong/aimake-creator/issues/55) WeChat HTML Mermaid Loss Fix** | Delivery Fidelity | Pre-render Mermaid diagrams into inline SVGs or crisp Base64 PNGs in `wechat-inliner.ts` with structured fallback cards. No silent drops. |
| **P1** | **[#52](https://github.com/chicogong/aimake-creator/issues/52) Citation Verification Grounding** | Truth & Verifiability | Bind context drawer badges directly to `/api/wiki/overview`, distinguishing `已核验`, `待核验`, and `失效出处`. |
| **P1** | **[#56](https://github.com/chicogong/aimake-creator/issues/56) Co-Pilot Timeout Retry & Draft Save** | Studio UX & Resilience | Task state machine with timeout (45s) detection, in-flight cancel, in-place retry, and real-time prompt draft persistence. |
| **P1** | **[#53](https://github.com/chicogong/aimake-creator/issues/53) Headless Dependency Self-Healing** | Zero-Config Setup | Implement `aimake doctor` diagnostic and drawer status badge. Provide on-demand binary download to `~/.aimake/bin/` for Playwright Chromium & FFmpeg. |
| **P1** | **[#59](https://github.com/chicogong/aimake-creator/issues/59) Real-Source Intake & Auto-Catchup** | Intelligence Feed | Background scheduler for Hacker News & RSS with URL normalization, deduplication, offline tolerance, and restart catch-up. |
| **P2** | **[#44](https://github.com/chicogong/aimake-creator/issues/44) One-Click Slide Generation from Source** | Productivity | Select any raw intake entry and auto-generate a structured 3:4 or 16:9 draft with verified citation anchors. |
| **P2** | **[#60](https://github.com/chicogong/aimake-creator/issues/60) GitHub Project Sync Error Handling** | CI/CD Quality | Fail loudly with actionable diagnostics when Project automation fails to add issue cards. |

---

## Phased Execution Roadmap

```
Phase 1: Stability & Anti-Loss (Current · 1-2 Days)
  ├── #54 Workspace isolation & conflict prevention
  ├── #55 WeChat Mermaid SVG/PNG inline rasterization
  ├── #52 Context drawer live citation audit
  └── #56 Studio AI co-pilot timeout retry & draft retention

Phase 2: Live Intelligence Radar & Self-Healing Setup (Next · 3-5 Days)
  ├── #59 Cron-based RSS / Hacker News intake scheduler
  ├── #53 Headless Playwright / FFmpeg runtime self-healing
  ├── #44 One-click creation from live source entries
  └── #43 / #39 Export concurrency lock and queue hardening

Phase 3: Multi-Platform Draft Syndication & Knowledge Flywheel (1-2 Weeks)
  ├── Discussion #58 Draft Box Syndication (WeChat, Zhihu, Juejin, Xiaohongshu, Feishu Bot)
  ├── Sparkle 2.x automated delta updates for macOS desktop app
  └── Local LLM Wiki auto-distillation flywheel
```

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
