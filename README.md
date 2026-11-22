# Aimake — Local-First Multimodal Creator Studio & CLI

<p align="center">
  <a href="https://aimake.cc"><img src="./dist-site/brand/icon-192.png" width="80" alt="Aimake Logo" /></a>
</p>

<p align="center">
  <strong>Create once in Markdown. Ship 5 native deliverables with 36 parametric design templates, offline Mermaid SVG diagrams, 7 workspace-preset AI skills, and a built-in AI Co-Pilot — 100% locally.</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/aimake-studio"><img src="https://img.shields.io/npm/v/aimake-studio.svg?style=flat-square&color=blue" alt="npm version" /></a>
  <a href="./LICENSE"><img src="https://img.shields.io/badge/license-MIT-green.svg?style=flat-square" alt="license" /></a>
  <a href="https://nodejs.org"><img src="https://img.shields.io/badge/node-%3E%3D22.0.0-brightgreen.svg?style=flat-square" alt="node version" /></a>
  <a href="https://aimake.cc/playground/"><img src="https://img.shields.io/badge/playground-live%20sandbox-purple.svg?style=flat-square" alt="playground" /></a>
  <a href="#"><img src="https://img.shields.io/badge/templates-36%20built--in-orange.svg?style=flat-square" alt="templates" /></a>
  <a href="#"><img src="https://img.shields.io/badge/privacy-100%25%20local--first-success.svg?style=flat-square" alt="local-first" /></a>
</p>

<p align="center">
  English · <a href="./README.zh-CN.md">简体中文</a> · <a href="./README.ja.md">日本語</a> · <a href="./README.ko.md">한국어</a>
</p>

<p align="center">
  <img src="./docs/assets/studio-canvas.png" width="95%" alt="Aimake Calm Studio Canvas" />
  <br />
  <em>Aimake Studio: Local-first WYSIWYG canvas with glassmorphism status bar, bidirectional keyboard navigation & tactile slide dock</em>
</p>

---

## ⚡️ Install & Run in 10 Seconds

```bash
# Launch the interactive @clack/prompts onboarding wizard
npx aimake-studio

# Or install globally (registers both `aimake` and `aimake-studio` commands)
npm install -g aimake-studio
aimake wizard
```

Try the instant zero-install browser sandbox: **[https://aimake.cc/playground/](https://aimake.cc/playground/)**

---

## 🌟 Why Aimake?

Existing presentation and content generation tools suffer from vendor lock-in, bloated Electron memory footprints, generic AI hallucinations ("AI slop"), and opaque cloud telemetry. 

**Aimake** rethinks digital publishing for AI agents and solopreneurs:

- **Plain Markdown as Single Source of Truth**: Author simple, standard `.deck.md` files with YAML frontmatter.
- **1 Source → 5 Native Formats**: One file renders into Retina 3x PNG cards, WeChat inline-CSS HTML, LinkedIn 4:5 vector PDF, native editable PowerPoint PPTX (shapes, tables, textboxes), and 60fps MP4 video with synchronized subtitles.
- **100% Local-First & Zero Telemetry**: Every operation runs on your machine. No telemetry, no cloud accounts required, and zero global `~/` or `~/.claude` pollution.
- **Unified 36-Template Design Engine**: Handcrafted parametric typography, golden ratios, strict CJK line breaking (`keep-all` / `strict`), and full dark/light dual theme switching.
- **Deep Conversational AI Co-Pilot**: Interactive chat with prompt suggestion chips, toggleable side-by-side & inline diff cards, 1-click apply & snapshot rollback, and pre-wired CLI launch recipes.

---

## 🔄 The Creative Flywheel: Beyond Just Markdown

Aimake is **not** just another Markdown-to-slide converter. It is an **End-to-End Multimodal Knowledge Distillation & Omni-Channel Distribution Engine**. 

True high-leverage content creation rarely starts with a blank slide. It begins with raw sparks—a sudden inspiration, an automated industry research scan, a spreadsheet of benchmark numbers, or historical project archives. Aimake transforms this fragmented intake into grounded, authoritative visual assets distributed across five native media formats:

```mermaid
flowchart TD
    subgraph Phase1["1. Intake & Multi-Source Research"]
        A1["aimake radar<br/>(HN, Tech Trends, RSS, arXiv)"]
        A2["Web URLs & Deep Articles"]
        A3["Data Tables, Metrics & CSV Spreadsheets"]
        A4["Meeting Transcripts, Voice Memos & Notes"]
        A5["aimake import<br/>(Marp, Slidev, Legacy Decks)"]
    end

    subgraph Phase2["2. Grounded Karpathy LLM Wiki"]
        B1["aimake wiki<br/>(Recursive Knowledge Distillation)"]
        B2["Bounded Context Budget<br/>(<= 3000 Tokens Per Artifact)"]
        B3["Strict Citation Tracking<br/>(cite: file#line coordinates)"]
        B4["aimake persona<br/>(Anti-AI Slop Humanizer & Style DNA)"]
    end

    subgraph Phase3["3. Parametric Design Studio & Co-Pilot"]
        C1["36 Parametric Design Templates<br/>(Bento Grid, Swiss, Risograph, Tech)"]
        C2["Calm Studio Local Canvas<br/>(Full Keyboard Nav, Tactile Pill Strip)"]
        C3["Conversational AI Co-Pilot<br/>(Visual Diffs, 1-Click Apply & Rollback)"]
    end

    subgraph Phase4["4. Omni-Channel Multi-Modal Distribution"]
        D1["Xiaohongshu & Instagram<br/>(3x Ultra-Sharp Retina PNGs)"]
        D2["WeChat Official Accounts<br/>(Inline CSS Rich HTML, Clipboard Dual-MIME)"]
        D3["LinkedIn & Executive Feeds<br/>(High-Density Vector PDF Carousel)"]
        D4["Keynote & Enterprise Pitches<br/>(Native Editable PPTX Shapes & Text)"]
        D5["Short Video & Reels<br/>(60fps Kinetic MP4 & Subtitles)"]
    end

    Phase1 --> Phase2
    Phase2 --> Phase3
    Phase3 --> Phase4
    Phase4 -.->|"Compounding Knowledge Vault"| Phase2
```

### The 4 Flywheel Stages:
1. **Intake & Multi-Source Research (`aimake radar` & `aimake import`)**:
   - Ingest raw inspiration from RSS feeds, HackerNews tech trends, arXiv abstracts, or competitor announcements.
   - Import structured tables (CSV financial figures, benchmark numbers) and unstructured notes (voice transcripts, interview memos, Obsidian vaults).
   - Effortlessly migrate existing slide decks from Marp and Slidev into Aimake format via `aimake import`.
2. **Grounded Local Knowledge Base (`aimake wiki` & `aimake persona`)**:
   - Compiles research into a local Karpathy-inspired LLM Wiki with bounded token budgets ($\le 3000$ tokens per index) to guarantee speed and context precision.
   - Enforces strict `cite: [source#L12-L34]` coordinates on every factual card, eliminating hallucinations.
   - Runs the Anti-AI Humanizer across 4 locales (EN, ZH, JA, KO) to prune synthetic clichés and preserve distinct personal voice.
3. **Parametric Studio & Conversational Co-Pilot (`aimake studio` & `aimake deck`)**:
   - Instantly applies 36 handcrafted design systems without manual Figma/Canva pixel pushing.
   - Co-pilot chat features prompt suggestion chips, toggleable side-by-side diff cards, and non-destructive snapshot rollback.
4. **Omni-Channel Multi-Modal Distribution (`aimake render`)**:
   - Compiles one single `.deck.md` into 5 native deliverables (PNG, WeChat HTML, PDF, PPTX, MP4).
   - Completed presentations compound back into the local Wiki repository, continually growing your creative asset vault.

---

## 📸 Product Features & Visual Showcase

### 1. 2026 Trending Styles & Benchmark Decks

Aimake ships with ready-to-use 2026 trending design systems:

<p align="center">
  <img src="./docs/assets/trending-bento.png" width="48%" alt="Apple Bento Launch" />
  <img src="./docs/assets/trending-deepseek.png" width="48%" alt="DeepSeek Benchmark Deck" />
</p>
<p align="center">
  <img src="./docs/assets/trending-swiss.png" width="48%" alt="Swiss Typography Grid" />
  <img src="./docs/assets/trending-risograph.png" width="48%" alt="Risograph Embodied Robotics" />
</p>

- **Apple Bento Launch (`apple-bento-launch`)**: Obsidian cards, tabular metrics, subtle lighting, and modular tiles for product keynotes.
- **DeepSeek-R1 OpenWeights Benchmark (`xhs-neon-tech`)**: High-contrast dark geek visual system for technical benchmarks, code blocks, and model comparisons.
- **Minimalist Swiss Grid (`xhs-swiss-grid`)**: High information density, hairline dividers, vermilion accent markers, and authoritative editorial layout.
- **Physical AI & Embodied Intelligence (`poster-risograph`)**: Retro dual-tone coral red × cobalt blue Risograph print aesthetic for tech fliers and posters.

---

### 2. Multi-Modal Deliverable Drawer & Web Playground

<p align="center">
  <img src="./docs/assets/studio-export.png" width="48%" alt="Multi-Modal Export Drawer" />
  <img src="./docs/assets/web-playground.png" width="48%" alt="Aimake Web Playground" />
</p>

- **Multi-Modal Export Drawer**: 1-click generation of ultra-sharp 3x PNGs, compliant dual MIME WeChat clipboard payload (`text/html` + `text/plain`), vector PDF, native editable PPTX, and frame-deterministic MP4.
- **Web Playground (`aimake.cc/playground/`)**: Instant browser-only editor with Markdown source toggle, real-time live preview, and zero server uploads.

---

## 🚀 CLI Cheatsheet

```bash
# 1. Inspect environment & browse templates
aimake doctor                                    # Verify system health, Node.js, and media binaries
aimake templates                                 # List all 36 design templates & aspect ratios
aimake market list                               # Inspect downloadable template packs

# 2. Automated Trend Research & Multimodal Intake
aimake radar --topic "embodied-ai"               # Scan HackerNews, arXiv & tech feeds for fresh angles
aimake wiki init ./vault                         # Initialize a Karpathy-style local LLM Wiki
aimake wiki distill ./vault/sources -o ./vault   # Recursively distill articles/tables into bounded notes
aimake persona extract ./my-writings             # Extract personal tone DNA & calibrate Anti-AI Humanizer

# 3. Scaffolding & Conversational Creation
aimake workspace init ./my-space                 # Scaffold workspace with 7 preset skills (0 symlinks)
aimake deck create "2026 AI Agent Revolution"   # Conversationally draft a new deck with local AI
aimake deck edit ./my-space/decks/story.deck.md  # Multi-turn conversational slide editing

# 4. Launch Local Calm Studio
aimake studio --demo                             # Launch instant demo workspace
aimake studio ./my-space/decks/story.deck.md     # Launch Studio on a specific deck

# 5. Migrate Existing Decks
aimake import ./legacy-slides.md -o ./deck.md    # Convert Marp / Slidev / Markdown slides

# 6. One-Click Native Multi-Format Rendering
aimake render ./deck.md -f png -o ./out/cards    # 3x Ultra-sharp Retina PNG cards (XHS / IG)
aimake render ./deck.md -f wechat -o ./out.html  # WeChat official account inline-styled HTML
aimake render ./deck.md -f pdf -o ./out/deck.pdf # High-density vector PDF (LinkedIn Carousel)
aimake render ./deck.md -t ppt-executive-16x9 -f pptx -o ./out/deck.pptx   # Native editable PPTX
aimake render ./deck.md -t video-kinetic-reel -f mp4 -o ./out/reel.mp4     # 60fps kinetic MP4
```

> **Note on optional dependencies**: `aimake-studio` keeps CLI install size under 3.5 MB by leaving heavy headless browsers and FFmpeg binaries optional. When rendering PNG, PDF, or MP4, Aimake automatically uses your existing system Chrome/Chromium/Playwright and FFmpeg, or you can run `npm i playwright @ffmpeg-installer/ffmpeg`.

---

## 🎨 36 Parametric Templates Matrix

Aimake features 36 meticulously engineered design systems covering all key creator channels:

| Category | Templates | Aspect Ratios | Visual Style |
|:---|:---|:---|:---|
| **2026 Trending** | `apple-bento-launch`, `xhs-neon-tech`, `xhs-swiss-grid`, `poster-risograph` | `16:9`, `3:4`, `4:5` | Apple Bento grid cards, DeepSeek benchmark dark mode, Swiss typography, Risograph print |
| **Social Media & Feeds** | `xhs-bold-headline`, `xhs-apple-notes`, `xhs-morandi-cream`, `xhs-liquid-glass`, `xhs-quote-card`, `xhs-pro-vs-con` | `3:4`, `1:1` | Xiaohongshu viral headlines, Apple Notes memo, Morandi editorial, liquid glassmorphism |
| **Global Publishing** | `linkedin-exec-carousel`, `ig-cardnews-kr`, `ja-note-editorial`, `en-substack-digest`, `en-founder-whiteboard` | `4:5`, `1:1` | LinkedIn founder carousels, Korean Instagram 카드뉴스 (`keep-all`), Japanese Note 余白 (`strict`), Substack digests |
| **Keynote & Executive** | `ppt-executive-16x9`, `ppt-tech-architecture`, `ppt-linear-dark`, `ppt-bauhaus-bold`, `ppt-consulting-matrix` | `16:9` | Clean corporate decks, system architectures, Linear dark theme, Bauhaus geometric, 2x2 matrix |
| **WeChat Longform** | `wechat-deep-report`, `wechat-editorial-article`, `wechat-frontpage-news`, `wechat-greenbook`, `wechat-minimal-brief` | Responsive | Inline-CSS rich text, dual MIME clipboard payload, mobile typography |
| **Education & Diagrams**| `edu-flashcard-kids`, `edu-lesson-guide`, `x-zukai-quad` | `3:4`, `1:1` | Visual study flashcards, syllabus guides, Japanese 4-quadrant 図解 diagrams |
| **Kinetic Video** | `video-kinetic-reel`, `video-podcast-wave`, `video-cinema-talk` | `9:16`, `16:9` | High-tempo kinetic reels, podcast audiograms, cinematic 16:9 documentaries |

Every template complies with the **Aimake Design Contract**:
- Full **Dark / Light dual theme switching** (`:root[data-theme="dark/light"]` and `theme: dark/light` in frontmatter).
- Consistent CSS variables (`--bg`, `--surface`, `--ink`, `--muted`, `--accent`, `--border`, `--card-shadow`, `--code-bg`).
- Built-in offline **Mermaid SVG rendering** and syntax highlighting via Highlight.js.
- Standalone `sample.deck.md` included for every template.

---

## 🖥️ Aimake Studio: Calm Visual Workspace

Running `aimake studio` launches a local, distraction-free visual environment:

- **Seamless Keyboard Navigation**: 
  - `←` / `→` / `Space`: Previous / Next slide
  - `PageUp` / `PageDown`: Fast slide browsing
  - `F`: Toggle full-screen presenter mode
  - `Esc`: Exit presenter mode or close open modals / drawers
  - `⌘K`: Quick command palette (appearance switching, template jumping, export actions)
- **Tactile Slide Dock**: Auto-scrolling filmstrip pill bar with 1-click **Add (+)**, **Duplicate**, and **Delete** actions.
- **Glassmorphism Status Bar**: Real-time status displaying deck title, aspect ratio badge, slide counter, and **Zero-Cloud Local Privacy Shield**.
- **Instant Export Feedback**: One-click WeChat HTML copy with dual MIME payload (`text/html` + `text/plain`) and 3x PNG export with animated feedback.

---

## 🤖 Conversational AI Co-Pilot & 1-Click External Recipes

Aimake bridges the gap between raw LLMs and deterministic visual layouts:

1. **Quick Action Chips**: Instant 1-click suggestions in the Studio chat pane:
   - `提炼金句卡片` (Quote Card Extraction)
   - `转为 Bento 风格` (Transform into Apple Bento Grid)
   - `生成演讲大纲` (Generate Presentation Outline)
   - `翻译为双语` (Bilingual Localization)
   - `去 AI 味` (Anti-AI Slop Humanizer)
2. **Side-by-Side & Inline Diff Cards**: Preview AI suggestions before saving. Accept with **一键应用 (Apply)** or roll back safely with **还原 (Revert)**.
3. **1-Click External AI Recipes**: Generate ready-to-run CLI commands packed with structured workspace context:
   - **Claude Code CLI**: `claude -p '...'`
   - **OpenAI Codex CLI**: `codex exec --skip-git-repo-check '...'`
   - **Google Antigravity (AGY)**: `agy -p '...'`
   - **Tencent CodeBuddy CLI**: `codebuddy -p '...'`

---

## 📁 Repository Structure

```
products/aimake/
├── src/
│   ├── cli.ts                   # Universal CLI entrypoint (aimake & aimake-studio)
│   ├── index.ts                 # Programmatic TypeScript API exports
│   ├── studio/                  # Calm Studio server, UI markup, styles & script
│   ├── renderer/                # HTML compiler, PPTX generator, Puppeteer/Playwright media renderer
│   ├── workspace/               # Local workspace management & AI agent connectors
│   └── templates/               # Built-in template registry & schema validators
├── templates/                   # 36 parametric design templates (HTML, CSS, manifests, samples)
├── examples/                    # Showcase decks (Bento, DeepSeek benchmarks, Swiss grid, Risograph)
├── skills/                      # 7 workspace preset AI skills (zero symlinks, zero ~/ pollution)
├── scripts/                     # Validation, build, test, and release verification scripts
└── tests/                       # Vitest unit suites & Playwright E2E suites
```

---

## 🛡️ Verification & Quality Assurance

Aimake enforces rigorous automated quality gates:

```bash
# Run the full release verification pipeline
pnpm verify
```

- **Type Safety**: Full `tsc --noEmit` pass with zero errors.
- **Unit & Integration Tests**: 8 Vitest suites (`61/61 tests`) passing in ~2.7s.
- **E2E Playwright Tests**: 6 end-to-end tests validating Studio chat, live diff/rollback, 0-symlink skills, 5-format exports, and macOS desktop launch.
- **Zero Secrets / Leaks Audit**: `audit:secrets` scans 237 source files to guarantee 0 credential or private path leaks.
- **Template & Skills Audit**: `audit:skills` guarantees all 36 templates conform to dark/light theme contracts.
- **Isolated Package Verification**: `pack:check` validates an unpacked size of ~3.2 MB and executes cleanly from `/tmp`.

---

## 🏛️ Prior Art & Open-Source Inspirations

Aimake stands on the shoulders of remarkable open-source projects, design philosophies, and developer tooling:

- **[Marp](https://marp.app/) & [Slidev](https://sli.dev/)**: Pioneered Markdown-driven slide presentations. Aimake honors this lineage while expanding beyond single-slide decks into omni-channel multimodal formats (PNG, WeChat, PDF, editable PPTX, and kinetic MP4) and strict local-first design contracts.
- **[Reveal.js](https://revealjs.com/)**: Laid the technical groundwork for modern web-based presentations.
- **[Andrej Karpathy's LLM Wiki Concept](https://gist.github.com/karpathy)**: Inspired Aimake's local wiki distillation engine (`aimake wiki`)—enforcing bounded token contexts ($\le 3000$ tokens) and verifiable citation coordinates to anchor AI generation in fact.
- **[Obsidian](https://obsidian.md/)**: Exemplified the compounding value of local-first Markdown vaults and durable, user-owned knowledge.
- **Apple Keynote & Bento Grid**: The gold standard in visual restraint, modular grid hierarchy, and keynote storytelling.
- **[Linear](https://linear.app/) & [Vercel Geist](https://vercel.com/font)**: Inspired Aimake Calm Studio's dark aesthetic, micro-interactions, and relentless typography discipline.
- **CLI AI Agent Ecosystem**: Seamless integration with [Claude Code](https://github.com/anthropics/claude-code), [OpenAI Codex](https://github.com/openai/codex), [Google Antigravity (AGY)](https://github.com/google), and [Tencent CodeBuddy](https://github.com/tencent).
- **Underlying Rendering Engines**: [Mermaid.js](https://mermaid.js.org/) for offline SVG diagrams, [Highlight.js](https://highlightjs.org/) for code syntax, and [PptxGenJS](https://gitbrent.github.io/PptxGenJS/) for native PowerPoint generation.

---

## 📄 Documentation & Policies

- [Architecture & Acceptance Report](./docs/ACCEPTANCE-1.0.md)
- [Aimake 2.0 Calm Workspace Design](./docs/AIMAKE_2_0_CALM_WORKSPACE_DESIGN.md)
- [Evolution Roadmap](./docs/ROADMAP-2.0.md)
- [Contributing Guide](./CONTRIBUTING.md)
- [Code of Conduct](./CODE_OF_CONDUCT.md)
- [Security & Local-First Privacy Policy](./SECURITY.md)
- [Third-Party Notices & Licenses](./THIRD_PARTY_NOTICES.md)

---

## 🤝 Contributing & Community

Contributions are warmly welcomed! Please feel free to submit issues, open pull requests, or propose new design templates.

1. Review our [Contributing Guide](./CONTRIBUTING.md) and [Code of Conduct](./CODE_OF_CONDUCT.md).
2. Fork the repository and create your feature branch: `git checkout -b feature/my-new-template`.
3. Verify test suites and audits pass: `pnpm verify`.
4. Commit your changes: `git commit -am 'feat: add my new template'`.
5. Push to your branch and submit a Pull Request.

---

## 📜 License

[MIT License](./LICENSE) © 2026 Aimake Labs / Chico Gong.
