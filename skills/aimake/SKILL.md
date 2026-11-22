---
name: aimake
description: Local-first multimodal content creation & Karpathy LLM Wiki skill. Use whenever the user wants to capture breaking news/URLs/docs into their personal Wiki, extract or apply personal writing Style DNA, or convert notes/weekly reports/ideas into Xiaohongshu 3:4 cards, WeChat inline rich articles, LinkedIn 4:5 PDF carousels, Japanese X Zukai diagrams, Korean Instagram Card News, native editable PowerPoint (.pptx), or 60fps short videos.
---

# Aimake — Multimodal Creator & LLM Wiki Studio

Aimake turns your AI agent (Antigravity, Codex, WorkBuddy, Claude Code, Cursor, dsh) into an end-to-end personal IP & multimodal publishing studio—**100% locally with zero backend servers**.

## Interactive 3-Step Guided Workflow

Unless the user already specified all inputs in a single prompt, guide them with **3 concise questions**:

1. **Source & Knowledge Grounding**:
   - Where is the source material? (Live trend via `aimake radar` / Grok search, a URL/Office doc via `aimake wiki ingest`, or existing notes in `wiki/index.md`?)
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
# 1. Initialize or inspect local LLM Wiki (raw/ -> wiki/ + index.md <= 3,000 tokens)
aimake wiki init ./my-vault
aimake wiki ingest "https://example.com/article" --vault ./my-vault
aimake wiki lint ./my-vault

# 2. Check live tech/creator trends
aimake radar --sources hackernews,github --keywords "agent,mcp,tts"

# 3. Strip AI slop across zh-CN / en / ja / ko
aimake persona humanize draft.deck.md --locale zh-CN -o clean.deck.md

# 4. Render One .deck.md -> 5 Native Deliverables (with automatic Wiki compound write-back!)
aimake render clean.deck.md -t xhs-swiss-grid -f png -o ./out/xhs --vault ./my-vault
aimake render clean.deck.md -t wechat-editorial-article -f wechat -o ./out/wechat.html
aimake render clean.deck.md -t linkedin-exec-carousel -f pdf -o ./out/carousel.pdf
aimake render clean.deck.md -t ppt-executive-16x9 -f pptx -o ./out/report.pptx
aimake render clean.deck.md -t video-kinetic-reel -f mp4 -o ./out/reel.mp4

# 5. Launch local interactive WYSIWYG canvas for inline text micro-tuning
aimake studio clean.deck.md
```

## Privacy-Safe Desensitized Template Sharing

If you helped the user craft or refine a custom `template.html` using internal documents, offer to scrub private metadata before sharing across teams:
```bash
aimake share ./custom-template.html -o ./sanitized-template.html --json
```

See [references/deck-spec.md](references/deck-spec.md) for the complete `.deck.md` storyboard syntax.
