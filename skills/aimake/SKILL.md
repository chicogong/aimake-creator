---
name: aimake
description: Local-first multimodal content creation, Karpathy LLM Wiki, and CapCut video timeline engine skill conforming to HKUDS/CLI-Anything CLI-Hub specifications. Use whenever the host agent wants to discover live trends (Polymarket, Reddit, HN, GitHub), intake research into a grounded Wiki, generate design-grade .deck.md storyboards across 36 parametric templates, or export to 6 native formats (CapCut video draft, PNG cards, WeChat inline HTML, PDF, editable PPTX, MP4).
cli-hub:
  spec_version: "1.0.0"
  standard: "HKUDS/CLI-Anything"
  binary: "aimake"
  version: "2.1.0"
  license: "MIT"
  runtime: "node>=18"
  flags:
    machine_readable: "--json"
    zero_backend: true
    offline_capable: true
---

# Aimake — Multimodal Creator, LLM Wiki & CapCut Video Engine

Aimake turns your host AI agent (Google Antigravity, OpenAI Codex CLI, Claude Code, Cursor, WorkBuddy) into an end-to-end multimodal publishing and video creation studio—**100% locally with zero cloud backend servers**.

Conforming to the **HKUDS/CLI-Anything CLI-Hub** (`clianything.cc`) specification, all operations are deterministic, provide pristine machine-readable `--json` outputs, and strictly honor standardized semantic exit codes and structured schema contracts.

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
3. **Stage ③ 创作 Create (`aimake create` / `aimake new` / `aimake studio`)**:
   - Compiles distilled facts into 36 parametric design templates (Bento Grid, Swiss Grid, Risograph, Tech Keynote), with conversational diff iteration and real-time live preview in Studio.
4. **Stage ④ 交付 Publish & Render (`aimake render` / `aimake publish` / `aimake share`)**:
   - Compiles `.deck.md` into 6 native formats: **CapCut / 剪映 6-track video drafts**, 3x Retina PNG cards, WeChat inline rich articles, PDF carousels, native editable PPTX, and MP4 video.

---

## 2. Machine-Readable JSON Contract & Exit Codes (`--json`)

Every Aimake subcommand supports `--json`. When `--json` is supplied:
- **stdout**: Strictly outputs formatted, valid JSON without log prefixes, chalk colors, ANSI escape sequences, or human chatter.
- **stderr**: Silenced or reserved for low-level system alerts without corrupting stdout.
- **Standard Exit Codes**:
  - `0 (SUCCESS)`: Command executed successfully.
  - `1 (GENERAL_ERROR)`: General runtime error, uncaught exception, or lint rule violation.
  - `2 (INVALID_ARGUMENTS / SCHEMA_ERROR)`: Missing required argument, unrecognized command/option, or invalid option value (e.g. unsupported format or aspect ratio).
  - `3 (ENV_OR_AUTH_ERROR)`: Missing environment variable or authentication credential, permission denied, or missing required runtime environment.
  - `4 (NOT_FOUND)`: Target `.deck.md` storyboard, source file, template ID, or workspace/vault directory does not exist.

### Standard Response Envelopes

**Success Envelope**:
```json
{
  "ok": true,
  "...": "Subcommand-specific payload"
}
```

**Error Envelope**:
```json
{
  "ok": false,
  "error": "Descriptive error message explaining the failure",
  "code": 4,
  "details": {}
}
```

---

## 3. Subcommands Specification (CLI-Hub Catalog)

### 3.1 `aimake render <deckPath>`
Compiles a `.deck.md` storyboard into production deliverables.

**Syntax**:
```bash
aimake render <deckPath> -f <png|wechat|pdf|pptx|mp4|html|capcut> [options] --json
```

**Options**:
- `-f, --format <fmt>`: `png` | `wechat` | `pdf` | `pptx` | `mp4` | `html` | `capcut` (Required)
- `-o, --output <target>`: Output directory (for PNG/CapCut) or output file path.
- `-t, --template <id>`: Override visual template ID (e.g. `apple-bento-launch`, `xhs-swiss-grid`).
- `-l, --locale <loc>`: Override typography locale (`zh-CN`, `zh-TW`, `en`, `ja`, `ko`, `es`).
- `--vault <dir>`: Optional Wiki vault directory for automatic compound write-back.
- `--install-local`: Auto-install generated draft directly into local CapCut / JianYing Projects folder (`com.lveditor.draft`).
- `--target-app <app>`: Target app for local draft install (`capcut` | `jianying` | `auto`).
- `--narrate <provider>`: Synthesize audio narration & SRT for MP4/CapCut (`offline-fixture` | `tencent-tccli`).
- `--fps <n>`: Frames per second for video rendering (default: 30).
- `--seconds-per-slide <n>`: Slide duration in seconds (default: 5).
- `--json`: Emit machine-readable JSON.

**Exit Codes**: `0` on success; `2` on invalid format/arguments; `4` if `deckPath` not found.

**JSON Output Schema (`-f capcut`)**:
```json
{
  "ok": true,
  "format": "capcut",
  "template": "video-cinema-talk",
  "draftDir": "/path/to/deck-capcut",
  "artifacts": [
    "/path/to/deck-capcut/draft_content.json",
    "/path/to/deck-capcut/draft_meta_info.json",
    "/path/to/deck-capcut/draft_cover.png"
  ]
}
```

**JSON Output Schema (`-f png`)**:
```json
{
  "ok": true,
  "format": "png",
  "template": "xhs-swiss-grid",
  "artifacts": [
    "/path/to/slide-01.png",
    "/path/to/slide-02.png"
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

**Exit Codes**: `0` on success; `2` on invalid authenticity/arguments; `4` if item not found.

**JSON Output Schema (Query list)**:
```json
[
  {
    "id": "polymarket:16263",
    "source": "Polymarket 预测市场",
    "sourceKind": "polymarket",
    "category": "prediction",
    "title": "Macron out by...?",
    "url": "https://polymarket.com/event/16263",
    "publishedAt": "2026-11-24T18:00:00.000Z",
    "polymarketOdds": 50,
    "score": 2260111,
    "authenticityScore": 99,
    "hotness": "📈 50% 胜率 · $2260k",
    "suggestedTemplate": "xhs-swiss-grid",
    "suggestedAspectRatio": "3:4"
  }
]
```

**JSON Output Schema (Make 1-Click Deck)**:
```json
{
  "ok": true,
  "generated": true,
  "title": "Macron out by...?",
  "source": "Polymarket 预测市场",
  "url": "https://polymarket.com/event/16263",
  "template": "xhs-swiss-grid",
  "aspectRatio": "3:4",
  "path": "macron-out-by.deck.md"
}
```

---

### 3.3 `aimake status [dir]`
Inspects end-to-end closed-loop pipeline progress, active stages, material counts, and preset skills status in the target workspace.

**Syntax**:
```bash
aimake status [dir] --json
```

**Options**:
- `dir`: Workspace root directory path (defaults to current directory `.`).
- `--json`: Emit machine-readable JSON.

**Exit Codes**: `0` on success; `4` if workspace directory does not exist.

**JSON Output Schema**:
```json
{
  "ok": true,
  "workspaceDir": "/path/to/workspace",
  "config": {
    "name": "my-creator-studio",
    "scenario": "creator-growth",
    "locale": "zh-CN",
    "defaultTemplate": "xhs-swiss-grid"
  },
  "pipeline": {
    "currentStage": "intake",
    "intake": { "status": "active", "count": 2 },
    "distill": { "status": "empty", "count": 0 },
    "create": { "status": "empty", "count": 0 },
    "publish": { "status": "empty", "count": 0 }
  },
  "decks": [],
  "sources": [],
  "skillsStatus": {
    "totalPresetSkills": 7,
    "zeroSymlinks": true
  }
}
```

---

### 3.4 `aimake new [topicOrPrompt]` / `aimake create [topicOrPrompt]`
Creates a new grounded multimodal `.deck.md` storyboard from a natural language topic, prompt, or recipe.

**Syntax**:
```bash
aimake new [topicOrPrompt] [options] --json
# or
aimake create [topicOrPrompt] [options] --json
```

**Options**:
- `-w, --workspace <dir>`: Target workspace directory.
- `-o, --output <outDeck>`: Destination `.deck.md` file path.
- `-t, --template <id>`: Template ID (default: `xhs-swiss-grid`).
- `-a, --aspect <ratio>`: Aspect ratio (`16:9`, `3:4`, `1:1`, `9:16`, `4:5`) (default: `3:4`).
- `-l, --locale <loc>`: Target locale (`zh-CN`, `en`, `ja`, `ko`) (default: `zh-CN`).
- `--recipe <recipeId>`: Recipe preset (`quote-extract`, `bento-style`, `presentation-outline`, `bilingual-translate`, `xhs-viral`, `apple-bento-ppt`).
- `-b, --backend <backend>`: AI backend (`auto`, `offline`, `api`, `cli:<id>`) (default: `auto`).
- `--json`: Emit machine-readable JSON.

**Exit Codes**: `0` on success; `2` on invalid aspect ratio or arguments.

**JSON Output Schema**:
```json
{
  "ok": true,
  "outputPath": "/path/to/decks/created.deck.md",
  "slideCount": 3,
  "engineUsed": "Deterministic Layout Engine",
  "changeSummary": "精简要点措辞并补充短视频口播逐字稿",
  "suggestedActions": [
    "提炼金句卡片",
    "转为 Bento 风格",
    "生成演讲大纲"
  ]
}
```

---

### 3.5 `aimake share <targetFile>`
Audits and sanitizes a template or `.deck.md` storyboard for safe public or team sharing (`pr-sanitizer`), removing private file paths, secrets, and internal infra markers.

**Syntax**:
```bash
aimake share <targetFile> [options] --json
```

**Options**:
- `--mock-deck`: Replace all slide prose with structural synthetic mock copy.
- `-o, --output <outFile>`: Write sanitized output to destination file.
- `--json`: Emit machine-readable JSON.

**Exit Codes**: `0` on success; `4` if `targetFile` not found.

**JSON Output Schema**:
```json
{
  "ok": true,
  "clean": true,
  "redactedCount": 0,
  "findings": [],
  "outputPath": "/path/to/sanitized.deck.md"
}
```

---

### 3.6 `aimake intake <sources...>`
Normalizes raw URLs, research papers, CSV metrics, or local files into structured, fact-preserving Markdown under `sources/`.

**Syntax**:
```bash
aimake intake "https://x.com/karpathy/status/1880000000000000000" -w ./workspace --json
```

**Options**:
- `-w, --workspace <dir>`: Workspace directory (default: `.`).
- `-t, --title <title>`: Optional custom title.
- `--tags <tags>`: Comma-separated tags.
- `--json`: Emit machine-readable JSON.

**JSON Output Schema**:
```json
{
  "workspace": "/path/to/workspace",
  "ingested": [
    {
      "source": "https://x.com/karpathy/status/1880000000000000000",
      "status": "ingested",
      "path": "sources/karpathy.md"
    }
  ]
}
```

---

### 3.7 `aimake distill [sourceOrTopic]`
Synthesizes research into bounded Karpathy LLM Wiki cards ($\le 3,000$ tokens) and structured story briefs in `briefs/`.

**Syntax**:
```bash
aimake distill "DeepSeek V3 Architecture" -t ppt-tech-architecture -w ./workspace --json
```

**Options**:
- `-w, --workspace <dir>`: Target workspace directory (default: `.`).
- `-t, --template <id>`: Target template ID (default: `xhs-swiss-grid`).
- `-l, --locale <loc>`: Target locale (`zh-CN`, `en`, `ja`, `ko`).
- `-o, --output <briefPath>`: Custom output brief path.
- `--json`: Emit machine-readable JSON.

**JSON Output Schema**:
```json
{
  "briefPath": "briefs/deepseek-v3-architecture.brief.md",
  "topic": "DeepSeek V3 Architecture",
  "template": "ppt-tech-architecture"
}
```

---

### 3.8 `aimake pipeline [stage]`
Audits the current status of all 4 stages in the active workspace and recommends next actions.

**Syntax**:
```bash
aimake pipeline -w ./workspace --json
```

**JSON Output Schema**:
```json
{
  "workspace": "/path/to/workspace",
  "workspaceName": "my-studio",
  "currentStage": "intake",
  "flywheelStage": "intake"
}
```

---

### 3.9 `aimake doctor`
Inspects runtime Node.js version, FFmpeg hardware acceleration, Playwright smart browser, OpenCode, and local AI host symlinks.

**Syntax**:
```bash
aimake doctor [options] --json
```

**Options**:
- `--home <dir>`: Custom home directory root for isolated sandbox testing.
- `--json`: Emit machine-readable JSON.

**Exit Codes**: `0` on success.

**JSON Output Schema**:
```json
{
  "ok": true,
  "nodeVersion": "v22.14.0",
  "ffmpegPath": "/usr/local/bin/ffmpeg",
  "homeDir": "default-user-home (read-only scan)",
  "templateCount": 36,
  "opencode": { "id": "opencode", "available": true, "version": "opencode v2.3.0" },
  "detectedHostCount": 11,
  "detectedHosts": []
}
```

---

### 3.10 `aimake templates`
Lists all 36 built-in parametric design templates across 5 supported formats and aspect ratios.

**Syntax**:
```bash
aimake templates [--category <cat>] --json
```

**JSON Output Schema**:
```json
[
  {
    "id": "xhs-swiss-grid",
    "name": { "zh": "小红书 · 瑞士国际主义网格", "en": "Swiss International Grid" },
    "aspect": "3:4",
    "category": "xiaohongshu",
    "supportedFormats": ["png", "wechat", "pdf", "html"]
  }
]
```

---

### 3.11 `aimake market <subcommand>`
Template marketplace for discovering, installing, and remixing templates.

- `aimake market list --json`: List all official templates and industry packs.
- `aimake market search [query] --json`: Search templates by keyword, locale, category, style, or aspect.
- `aimake market install <itemSpec> --workspace <dir> --json`: Install template pack into workspace.
- `aimake market installed --workspace <dir> --json`: Check installed templates with SHA-256 integrity.
- `aimake market remove <templateId> --workspace <dir> --json`: Remove installed template.
- `aimake remix <sourceTemplateOrDeck> --deck <targetDeck> --json`: One-Click Remix (一键做同款).

---

### 3.12 `aimake wiki <subcommand>`
Manages the grounded Karpathy LLM Wiki knowledge vault backed by `@lwc/core`.

- `aimake wiki init <vaultDir> --json`: Initialize Wiki vault structure with AGENTS.md.
- `aimake wiki ingest <sources...> --vault <dir> --json`: Ingest documents/URLs into Wiki cards.
- `aimake wiki lint <vaultDir> --json`: Verify token budget ($\le 3,000$ tokens) and link graph.
- `aimake wiki context <vaultDir> --focus <node> --depth <0|1|2> --json`: Extract bounded context bundle.
- `aimake wiki report <vaultDir> --json`: Compile vault graph and OKF trust report.
- `aimake wiki visuals <vaultDir> --json`: Export Obsidian `.canvas`, Excalidraw, and Mermaid diagrams.
- `aimake wiki verify-citations <deckPath> --vault <dir> --json`: Verify `cite:` pointers against Wiki facts.

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

### Recipe C: Automated Privacy Check Before Sharing
When the user asks: *"检查并脱敏我的幻灯片，准备分享给外部团队"*

```bash
# Sanitize deck and create synthetic mock copy
aimake share ./decks/internal-strategy.deck.md --mock-deck -o ./decks/shared.deck.md --json
```
