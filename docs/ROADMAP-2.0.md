# Aimake 2.0 — Closed-Source Product & Architecture Roadmap

With **Aimake 1.0** delivering the **Proprietary Zero-Backend Local Core** (`Karpathy LLM Wiki` + `4-Locale Style DNA` + `16+ AI Host Skill & MCP` + `12 Commercial Parametric Templates` + `One-Deck-to-5-Deliverables` + `Local WYSIWYG Studio` + `Live aimake.cc Flagship Site & universe.aimake.cc Cutover`), **Aimake 2.0** evolves along the **Obsidian / Raycast / Screen Studio** paradigm: **closed-source precision engineering paired with 100% local-first Markdown data ownership**.

---

## Pillar 1: Signed Native Tauri 2.0 Desktop App (`Aimake.app` · ~15MB)

Package the proprietary Aimake compiler and Studio into signed cross-platform native installers (`macOS Apple-Notarized Universal .dmg`, `Windows Signed .msi`, distributed via `aimake.cc` + `tauri-plugin-updater` without exposing TypeScript source code):

1. **Menu Bar Trend & Thought Catcher**:
   - System tray widget with global shortcut (`Option + Space`) to clip active browser URLs, screenshots, or voice memos straight into local `raw/` and surface high-signal `aimake radar` alerts.
2. **Multi-Account Native Draft Pusher (Human-in-the-Loop Safe Distribution)**:
   - Persistent isolated WebView / Chrome profile sessions reusing the user's residential login state for **Xiaohongshu, WeChat Official Account / Greenbook, Douyin, WeChat Channels, LinkedIn, X, Note.com, and Instagram**—auto-filling exported PNGs/MP4s/inline HTML into platform draft boxes while strictly requiring a human click on final **Publish** (never bypassing platform CAPTCHAs or anti-bot gates).
3. **Deep Link Protocol (`aimake://`) & Drag-and-Drop Canvas**:
   - Jump directly from any MCP App chat preview (`ui://aimake/preview`) into the local slide editor; drag local charts and screenshots straight onto `[data-editable]` slots.

---

## Pillar 2: On-Device Multimodal Synthesis Pack (Voice Cloning & Image Slots)

Keep cloud APIs optional by unlocking hardware-accelerated local generation with zero per-minute platform markup:

1. **Apple Silicon Zero-Shot Voice Cloning (`mlx-audio` Managed Pack)**:
   - One-click managed runtime for M1–M5 Macs running **`Kokoro-82M`** (instant narration) and **`Qwen3-TTS` / `CosyVoice`** (3–5s reference audio local voice cloning) + **`mlx-whisper`** word-level subtitle alignment, plus optional BYOK connectors (`Tencent Cloud TTS via tccli`, `ElevenLabs`, `OpenAI Audio`).
   - Automatic terminology pronunciation remapping (`glossary.yaml`) + FFmpeg sidechain BGM ducking (`-22dB` during speech) and `-16 LUFS` loudness normalization.
2. **Declarative Visual Generation Slots (`data-aimake-gen`)**:
   - Native resolution of `![prompt](gen://...)` image/video slots in `.deck.md` via pluggable local/BYOK providers (**Ollama / ComfyUI local**, **OpenRouter**, **Flux**, **Seedream / Kling**), caching content-addressed assets in `.aimake/cache/`.

---

## Pillar 3: Interactive MCP Apps (`SEP-1865`) & Enterprise Knowledge Bridges

1. **Bidirectional In-Chat Canvas (`@modelcontextprotocol/ext-apps`)**:
   - Upgrade `ui://aimake/preview` into an interactive JSON-RPC `postMessage` widget inside **Codex Desktop, Claude Desktop, WorkBuddy, and Cursor**, supporting instant template switching, aspect-ratio toggling, and slide scrubbing directly in chat.
2. **Incremental Workspace Connectors (Feishu / Notion / Obsidian / Google Drive)**:
   - Sync designated Feishu weekly-report folders (`lark-openapi-mcp`), Notion pages, Obsidian vaults, or Google Drive directories into `raw/` with a **Local Enterprise Redaction Linter** (`pr-sanitizer` v2) that flags internal codenames, employee IDs, and confidential metrics *before* external content compilation.

---

## Pillar 4: Zero-Backend Commercial Licensing & Curated Design Store (`aimake.cc`)

1. **Ed25519 Offline License Verification (`Zero Auth Server Cost`)**:
   - Maintain **$0/month backend infrastructure** using offline-verifiable cryptographic license keys (`Polar.sh` / `LemonSqueezy` / WeChat Pay static fulfillment):
     - **Starter (Free Trial)**: Core `.deck.md` workflow, local Markdown Wiki, standard PNG/PDF preview.
     - **Aimake Pro (Solopreneur Annual / Buy-Once Pass)**: Unlocks all 12+ Pro Global Design Systems, 100% Inline-CSS WeChat Export, Native Editable `.pptx` Engine, 60fps MP4 Video Compiler, 4-Locale Style DNA Extractor, and 16+ AI Host Skill/MCP Bridge.
     - **Aimake Team / Enterprise**: Custom corporate design token compiler, pre-flight confidential data redaction policies, and internal desensitized template bundle sharing (`aimake share`).
2. **Official Curated Template Packs**:
   - Deliver signed, versioned industry template packs (Executive Strategy, Developer Release Notes, Bilingual Educator Cards, Creator Reels) installable directly into `~/.aimake/templates/` via licensed `aimake` desktop/CLI updates.

---

## 2.0 Milestone Sequence

| Release | Target Focus | Acceptance Gate |
| :--- | :--- | :--- |
| **`v1.5`** | Interactive MCP Apps (`SEP-1865`) widget + Incremental Feishu/Obsidian connectors + Pro Ed25519 offline license verifier | Bidirectional in-chat preview in Codex/Claude + offline license activation `< 5ms` |
| **`v2.0-beta`** | **Signed Tauri 2.0 Native Desktop App** (Menu bar radar + drag-drop WYSIWYG + human-in-the-loop social draft filler) | Apple-notarized macOS `.dmg` & signed Windows `.msi` `< 20MB` (requires local `rustup` toolchain) |
| **`v2.0-GA`** | **On-Device Voice Cloning (`mlx-audio` Qwen3-TTS)** + `gen://` Image Slots + Enterprise Redaction Pack | End-to-end offline voice-cloned 60fps reel on Apple Silicon with `$0` cloud API spend |
