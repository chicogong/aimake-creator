---
name: aimake
description: Local-first multimodal content creation, Karpathy LLM Wiki, and CapCut video timeline engine skill conforming to HKUDS/CLI-Anything CLI-Hub specifications. Use whenever the host agent wants to discover live trends (Polymarket, Reddit, HN, GitHub), intake research into a grounded Wiki, generate design-grade .deck.md storyboards across 36 parametric templates, or export to 6 native formats (CapCut video draft, PNG cards, WeChat inline HTML, PDF, editable PPTX, MP4).
cli-hub:
  spec_version: "1.0.0"
  standard: "HKUDS/CLI-Anything"
  binary: "aimake"
  version: "2.1.0"
  license: "Apache-2.0"
  runtime: "node>=18"
  flags:
    machine_readable: "--json"
    zero_backend: true
    offline_capable: true
---

# Aimake — Multimodal Creator, LLM Wiki & CapCut Video Engine

Aimake turns your host AI agent (Google Antigravity, OpenAI Codex CLI, Claude Code, Cursor, WorkBuddy) into an end-to-end multimodal publishing and video creation studio—**100% locally with zero cloud backend servers**.

Conforming to the **HKUDS/CLI-Anything CLI-Hub** specification, all operations are deterministic, provide pristine machine-readable `--json` outputs, and follow strict schema contracts.

---

## 1. The 4-Stage Creative Flywheel Pipeline

Every high-leverage piece of content flows through four deterministic, local stages:

```text
① 抓取 Intake  ──>  ② 萃取 Distill  ──>  ③ 创作 Create  ──>  ④ 交付 Publish & Render
 (sources/ & radar)   (wiki/ & briefs/)     (decks/ & studio)      (exports/ & CapCut drafts)
```

1. **Stage ① 抓取 Intake (`aimake intake` / `aimake radar`)**:
   - Ingest live trends with anti-SEO authenticity scoring (Polymarket odds, Reddit comments, GitHub stars, HN points) and parse research URLs, audio transcripts, or CSV metrics.
2. **Stage ② 萃取 Distill (`aimake distill` / `aimake wiki` / `aimake persona`)**:
   - Distills raw facts into grounded Karpathy LLM Wiki cards ($\le 3,000$ tokens budget) and structured briefs in `briefs/` with strict `cite:` coordinates.
3. **Stage ③ 创作 Create (`aimake create` / `aimake studio`)**:
   - Compiles distilled facts into 36 parametric design templates (Bento Grid, Swiss Grid, Risograph, Tech Keynote), with conversational diff iteration and real-time live preview in Studio.
4. **Stage ④ 交付 Publish & Render (`aimake render` / `aimake publish`)**:
   - Compiles `.deck.md` into 6 native formats: **CapCut / 剪映 6-track video drafts**, 3x Retina PNG cards, WeChat inline rich articles, PDF carousels, native editable PPTX, and MP4 video.

---

## 2. Machine-Readable JSON Contract (`--json`)

Every Aimake subcommand supports `--json`. When `--json` is supplied:
- **stdout**: Strictly outputs formatted JSON without log prefixes, ANSI escape sequences, or human chatter.
- **stderr**: Diagnostic warnings or progress bars are directed to stderr without corrupting stdout.
- **Exit Codes**:
  - `0`: Success.
  - `1`: Validation or execution failure (with `{ "ok": false, "error": string }` on stdout/stderr).

---

## 3. Subcommands Specification (CLI-Hub Catalog)

### 3.1 `aimake render <deckPath>`
Compiles a `.deck.md` storyboard into platform deliverables.

**Syntax**:
```bash
aimake render <deckPath> -f <png|wechat|pdf|pptx|mp4|html|capcut> [options] --json
```

**Options**:
- `-f, --format <fmt>`: `capcut` | `png` | `wechat` | `pdf` | `pptx` | `mp4` | `html` (Required)
- `-o, --output <target>`: Output directory (for PNG/CapCut) or output file path.
- `-t, --template <id>`: Override visual template ID.
- `-l, --locale <loc>`: Override typography locale (`zh-CN`, `zh-TW`, `en`, `ja`, `ko`, `es`).
- `--install-local`: Auto-install generated draft directly into local CapCut / JianYing Projects folder (`com.lveditor.draft`).
- `--narrate <provider>`: Synthesize audio narration & SRT for MP4/CapCut (`offline-fixture` | `tencent-tccli`).
- `--fps <n>`: Frames per second (default: 30).
- `--seconds-per-slide <n>`: Slide duration in seconds (default: 5).
- `--json`: Emit machine-readable JSON.

**JSON Output Schema (`-f capcut`)**:
```json
{
  "ok": true,
  "format": "capcut",
  "draftDir": "/path/to/deck-capcut",
  "installedLocal": true,
  "localDraftPath": "/Users/user/Movies/CapCut/User Data/Projects/com.lveditor.draft/deck-slug-uuid",
  "appName": "CapCut Desktop",
  "durationMs": 25000,
  "artifacts": [
    "/path/to/deck-capcut/draft_content.json",
    "/path/to/deck-capcut/draft_meta_info.json",
    "/path/to/deck-capcut/draft_cover.png"
  ]
}
```

---

### 3.2 `aimake radar [idOrIndex]`
Multi-source real-world engagement radar & 1-click deck generator inspired by `mvanhorn/last30days-skill`. Filters out AI slop and SEO spam by prioritizing skin-in-the-game consensus and genuine human discussion.

**Syntax**:
```bash
aimake radar [idOrIndex] [options] --json
```

**Options**:
- `-c, --category <cat>`: `all` | `real-discussion` | `prediction` | `x` | `ai-tech` | `social` | `creative` | `dev`.
- `--sources <list>`: Comma-separated sources (`polymarket`, `reddit`, `hackernews`, `github`, `dailyhot`, `x`, `rss`).
- `--min-authenticity <score>`: Filter out SEO spam by minimum authenticity score (0-100).
- `--keywords <words>`: Comma-separated search terms.
- `--limit <n>`: Max items returned (default: 10).
- `-m, --make`: Generate `.deck.md` from the specified item.
- `-t, --template <name>`: Template override (e.g. `apple-bento-launch`).
- `-a, --aspect <ratio>`: Target aspect ratio (`3:4` | `16:9` | `4:5` | `9:16`).
- `-o, --out <path>`: Destination path for generated `.deck.md`.
- `--json`: Emit machine-readable JSON.

**JSON Output Schema (Query list)**:
```json
[
  {
    "id": "radar:polymarket-agi-timeline-2026",
    "source": "Polymarket 预测市场",
    "sourceKind": "polymarket",
    "category": "prediction",
    "title": "Polymarket: 2026 年实现 AGI 预测胜率攀升至 68%",
    "url": "https://polymarket.com/event/agi-by-2026",
    "publishedAt": "2026-11-24T18:00:00.000Z",
    "polymarketOdds": 68,
    "score": 4500000,
    "authenticityScore": 96,
    "hotness": "📈 68% 胜率 · $4.5M 预测池",
    "suggestedTemplate": "apple-bento-launch",
    "suggestedAspectRatio": "3:4"
  }
]
```

---

### 3.3 `aimake intake <source>`
Normalizes any input (URL, research paper, table CSV, WebVTT transcript) into local Markdown and Bento metrics.

**Syntax**:
```bash
aimake intake "https://x.com/karpathy/status/1880000000000000000" -w ./workspace --json
```

**JSON Output Schema**:
```json
{
  "sourceType": "x-twitter",
  "title": "Andrej Karpathy Grounded LLM Wiki",
  "author": "@karpathy",
  "metrics": [],
  "savedPath": "sources/karpathy.md"
}
```

---

### 3.4 `aimake distill <topic>`
Synthesizes research into $\le 3,000$ token Karpathy Wiki cards and structured creative briefs.

**Syntax**:
```bash
aimake distill "DeepSeek V3 MLA Architecture" -t ppt-tech-architecture -w ./workspace --json
```

---

### 3.5 `aimake create <topic>`
Compiles distilled facts into a structured `.deck.md` storyboard ready for editing or rendering.

**Syntax**:
```bash
aimake create "2026 Video Creator Handbook" -t video-cinema-talk -a 9:16 -o ./decks/handbook.deck.md --json
```

---

### 3.6 `aimake pipeline`
Audits the current status of all 4 stages in the active workspace.

**Syntax**:
```bash
aimake pipeline -w ./workspace --json
```

**JSON Output Schema**:
```json
{
  "workspace": "./workspace",
  "counts": {
    "sources": 12,
    "wiki": 8,
    "briefs": 4,
    "decks": 6,
    "exports": 18
  },
  "stageCompletion": {
    "intake": true,
    "distill": true,
    "create": true,
    "publish": true
  }
}
```

---

## 4. Agent Prompting Recipes

### Recipe A: Trend-to-CapCut Autonomous Flow
When the user asks: *"发现最新的真实讨论趋势，并做成一个可以直接在剪映打开剪辑的视频项目"*

```bash
# 1. Fetch high-authenticity human discussion from Reddit / Polymarket
aimake radar --category real-discussion --min-authenticity 90 --limit 5 --json

# 2. Pick top item (e.g. index 1) and generate video storyboard
aimake radar 1 -t video-cinema-talk -a 9:16 -o ./decks/trend-video.deck.md --json

# 3. Export to CapCut draft and install into local desktop editor
aimake render ./decks/trend-video.deck.md -f capcut --install-local --json
```

### Recipe B: Research-to-OmniChannel Publishing Flow
When the user asks: *"将这篇论文/文章整理并输出为小红书卡片和公众号格式"*

```bash
# 1. Intake source
aimake intake "https://example.com/research-paper" -w . --json

# 2. Distill into LLM Wiki card
aimake distill "Research Analysis" -t xhs-paper-editorial --json

# 3. Render 3x Retina PNG cards for Xiaohongshu
aimake render ./decks/research.deck.md -f png -o ./dist/xhs --json

# 4. Render inline CSS rich HTML for WeChat Official Account
aimake render ./decks/research.deck.md -f wechat -o ./dist/wechat.html --json
```
