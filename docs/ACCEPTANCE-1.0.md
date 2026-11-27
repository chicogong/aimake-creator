# Aimake v1.0.0+ — Full-Stack Architecture & End-to-End Acceptance Report

**Release Version**: `2.0.0` (Full Desktop, Marketplace, Remix, Feed Scheduler & Radar Edition)  
**Verification Date**: `2026-11-27`  
**Distribution & License**: `Open-Source MIT License (Copyright (c) 2026 Chico Gong / Aimake Labs)`  
**Architecture Mode**: `100% Zero-Backend · Local-First Privacy`

---

## 1. Delivered Capabilities & Existing Asset Reuse Matrix

| Subsystem | Module Path | Reused Existing Assets | Status | Verified Capabilities |
| :--- | :--- | :--- | :---: | :--- |
| **Native macOS Desktop App** | `desktop/macos/AimakeApp.swift`, `scripts/build-macos-app.mjs` | Local `swiftc 6.4.2`, AppKit, WebKit, `codesign`, `plutil`, `iconutil` | ✅ | `dist-desktop/Aimake.app` (arm64 binary + `AppIcon.icns`, ad-hoc signed & verified), `NSWindow` (`1440×920`), `aimake://` deep links, `WKWebView` Retina snapshot |
| **Calm Desktop Studio** | `src/studio/studio-server.ts`, `src/studio/calm-ui/*` | `aimake-studio` calm aesthetic model (Obsidian Black, no-shadow physics, CSRF guard) | ✅ | Dual-view Markdown / Card editor, 36-template drawer, RSS/HN intake scheduler, one-click draft from source (#44), export doctor (#53) |
| **Knowledge Wiki & Governance** | `src/wiki/lwc-bridge.ts`, `src/wiki/wiki-engine.ts` | `products/open-source/llm-wiki-canvas` (`@lwc/core`), `products/open-source/qingyan-vault` | ✅ | Recursive graph & OKF v0.2 trust, 0–2 hop topology context, Obsidian `.canvas` / `.excalidraw` / Mermaid / `Overview.base`, `index.md <= 3,000t` |
| **Speech, Facts & Revisions** | `src/speech/*`, `src/revision/index.ts`, `src/renderer/exporter-media.ts` | `aimake-labs/aimake-studio` core (`tccli`, `offline-fixture`, SRT, `RunLease`, `DraftRevision`) | ✅ | Per-slide narration synthesis, SHA-256 receipt reuse for unchanged slides, frame-cached narrated MP4 with `mov_text` subtitles, `REVISION_STALE` optimistic CAS |
| **36 Multi-Style Built-in Templates** | `scripts/build-templates.mjs`, `templates/*` | Parameterized single-file HTML contract (`window.renderDeck`, `fitStage`, `aimakeSeek`) | ✅ | 36 distinct visually audited styles across `zh-CN` (Xiaohongshu ×8, WeChat ×6), `en` (LinkedIn/Whiteboard/Substack ×6), `ja` (`line-break: strict` ×4), `ko` (`Pretendard keep-all` ×4), PPT `16:9` (×5), Education (×3), Short Video `9:16` (×4) |
| **Versioned Template Marketplace** | `src/marketplace/registry.ts` | SHA-256 verified local registry | ✅ | 36 templates + 7 versioned industry packs, multi-facet search & tamper-checked workspace installation |
| **One-Click Remix (一键做同款)** | `src/marketplace/registry.ts`, `src/cli.ts`, `src/mcp/mcp-server.ts` | `deck-parser.ts`, `humanizer.ts`, `exporter-media.ts` | ✅ | End-to-end style & layout cloning from any template or finished `.deck.md` onto user's `.deck.md` preserving 100% of user copy (CLI + Studio UI + MCP + `aimake://remix` deep link) |
| **4-Lang Flagship Site (`aimake.cc`)** | `src/site/site-builder.ts` | Official aimake.cc static generator | ✅ | `295` static HTML pages & `152` sitemap URLs across `zh/en/ja/ko` with interactive 36-template live web playground, 7 versioned packs, One-Click Remix links |

---

## 2. Full Regression & Independent OpenCode Acceptance Evidence

- **`pnpm typecheck` (`tsc --noEmit`)**: `PASS` (0 errors)
- **`pnpm test` (`vitest run`)**: `PASS` (**4/4 files, 31/31 tests green in 1.34s**)
- **`pnpm build` (`tsup`)**: `PASS` (`497 KB` ESM bundle, `"private": true`, `@lwc/core` bundled cleanly)
- **`pnpm validate:skill`**: `PASS` (`SKILL.md`, Codex, Claude, WorkBuddy manifests, and all **36 templates**)
- **`pnpm audit:secrets`**: `PASS` (**0 secret or private path leaks**)
- **`pnpm site:build`**: `PASS` (**183 HTML pages, 94 sitemap URLs**)
- **`pnpm desktop:build`**: `PASS` (**`dist-desktop/Aimake.app` signed & `plutil`/`codesign` verified**)
- **`pnpm test:e2e` (`playwright test`)**: `PASS` (**4/4 full-stack E2E specs in 25.9s**, including 1.0 five-deliverables regression, 1.0 Studio inline edit regression, 5-pane Desktop Studio Marketplace/Remix/HTTP 206 MP4/Wiki/AI Bridge E2E, and real `Aimake.app` macOS binary launch)
- **`pnpm test:opencode` (Independent `opencode v2.3.0` Sandbox E2E)**: `PASS` (`41.4s`, `--standalone --archived --auto` inside isolated `.aimake-tmp/opencode-e2e/`, verified 8 installed pack templates, `xhs-warm-magazine` One-Click Remix, `277 KB` PNG, native editable `<a:t>` PPTX, and Obsidian `Wiki.canvas` + `Wiki.excalidraw`; real user `~/` 100% untouched)
