---
name: aimake
description: Local-first multimodal content creation & Karpathy LLM Wiki skill. Use whenever the user wants to capture breaking news/URLs/docs into their personal Wiki, extract or apply personal writing Style DNA, or convert notes/weekly reports/ideas into Xiaohongshu 3:4 cards, WeChat inline rich articles, LinkedIn 4:5 PDF carousels, Japanese X Zukai diagrams, Korean Instagram Card News, native editable PowerPoint (.pptx), or 60fps short videos.
---

# Aimake — Multimodal Creator & LLM Wiki Studio

Aimake turns your AI agent (Antigravity, Codex, WorkBuddy, Claude Code, Cursor, dsh) into an end-to-end personal IP & multimodal publishing studio—**100% locally with zero backend servers**.

## The 4-Stage Creative Flywheel Pipeline

Every piece of high-leverage content flows through four deterministic, local stages:

```text
① 抓取 Intake  ──>  ② 萃取 Distill  ──>  ③ 创作 Create  ──>  ④ 发布 Publish
 (sources/)          (wiki/ & briefs/)     (decks/ & studio)      (exports/ & multi-platform)
```

1. **Stage ① 抓取 Intake (`aimake intake` / `aimake radar` / `aimake import`)**:
   - Ingest raw research, URLs, office documents, or markdown into `sources/` and the local knowledge vault.
2. **Stage ② 萃取 Distill (`aimake distill` / `aimake wiki` / `aimake persona`)**:
   - Distills raw facts into grounded Karpathy LLM Wiki cards ($\le 3,000$ tokens budget) and structured briefs in `briefs/` with strict `cite:` coordinates.
3. **Stage ③ 创作 Create (`aimake create` / `aimake deck create` / `aimake studio`)**:
   - Transforms distilled facts into 36 parametric design templates (Bento Grid, Swiss Grid, Risograph, Tech Keynote), with conversational diff iteration in Studio.
4. **Stage ④ 发布 Publish (`aimake publish` / `aimake render`)**:
   - Compiles one `.deck.md` into 5 native deliverables (PNG, WeChat HTML, PDF, PPTX, MP4) and publishes to WeChat, Zhihu, Juejin, Xiaohongshu, while compounding back into `wiki/published.md`.

## Interactive Guided Workflow

Unless the user already specified all inputs in a single prompt, check workspace state via `aimake pipeline` or ask:

1. **Source & Knowledge Grounding**:
   - Where is the source material? (Live trend via `aimake radar` / Grok search, a URL/Office doc via `aimake intake <source>`, or existing notes in `wiki/index.md`?)
2. **Target Market, Platform & Language**:
   - Which deliverable & locale?
     - `zh-CN` / `zh-TW`: Xiaohongshu `3:4` (`xhs-swiss-grid`, `xhs-paper-editorial`, `xhs-neon-tech`), WeChat Greenbook (`wechat-greenbook`), WeChat Official Account (`wechat-editorial-article`), Douyin/Channels `9:16` MP4 (`video-kinetic-reel`), Workplace 16:9 Editable `.pptx` (`ppt-executive-16x9`), or Classroom Flashcards (`edu-flashcard-kids`).
     - `en`: LinkedIn `4:5` PDF Carousel (`linkedin-exec-carousel`) or System Architecture `.pptx` (`ppt-tech-architecture`).
     - `ja`: Japan X `16:9` Zukai Blueprint (`x-zukai-quad` with strict kinsoku line-breaking).
     - `ko`: Korea Instagram `4:5` Card News (`ig-cardnews-kr` with Pretendard `keep-all` phrasing).
3. **Personal Style DNA**:
   - Check `personas/` in the user's Wiki vault. Apply their personal cadence, hook formulas, and run `aimake persona humanize` to strip robotic AI clichés before rendering.

## Core Deterministic CLI Commands

Aimake CLI requires **zero LLM API keys**—your host agent authors the clean `.deck.md` storyboard, and Aimake compiles deterministic visual/media deliverables:

```bash
# 0. Check full pipeline progress at any time
aimake pipeline

# 1. Stage ① [抓取 Intake]: Ingest research URLs, notes, or documents
aimake intake "https://example.com/deepseek-r1-benchmark" -w ./my-workspace
aimake radar --sources hackernews,github --keywords "agent,mcp,tts"

# 2. Stage ② [萃取 Distill]: Distill facts into <=3,000 token wiki cards & briefs
aimake distill "DeepSeek-R1 本地部署评测" -t xhs-neon-tech -w ./my-workspace
aimake wiki lint ./my-workspace/wiki

# 3. Stage ③ [创作 Create]: Generate or conversationally edit visual storyboard
aimake create "DeepSeek-R1 本地部署评测" -t xhs-neon-tech -o ./my-workspace/decks/deepseek.deck.md
aimake studio ./my-workspace/decks/deepseek.deck.md

# 4. Stage ④ [发布 Publish]: Package & cross-post to WeChat, Zhihu, Juejin, Xiaohongshu
aimake publish ./my-workspace/decks/deepseek.deck.md --target wechat,zhihu,juejin,xiaohongshu

# Or render individual native deliverables
aimake render ./my-workspace/decks/deepseek.deck.md -t xhs-neon-tech -f png -o ./out/xhs
aimake render ./my-workspace/decks/deepseek.deck.md -t wechat-editorial-article -f wechat -o ./out/article.html
aimake render ./my-workspace/decks/deepseek.deck.md -t ppt-tech-architecture -f pptx -o ./out/slides.pptx
aimake render ./my-workspace/decks/deepseek.deck.md -t video-kinetic-reel -f mp4 -o ./out/reel.mp4
```

## Privacy-Safe Desensitized Template Sharing

If you helped the user craft or refine a custom `template.html` using internal documents, offer to scrub private metadata before sharing across teams:
```bash
aimake share ./custom-template.html -o ./sanitized-template.html --json
```

See [references/deck-spec.md](references/deck-spec.md) for the complete `.deck.md` storyboard syntax.
