---
name: aimake-brief-architect
description: Superpowers-style brief-before-draft planning gate that turns workspace wiki knowledge and brand-kit preferences into a structured creative brief in briefs/<slug>.brief.md before writing any .deck.md. Use before drafting any new Xiaohongshu carousel, WeChat article, PPTX deck, LinkedIn PDF, Zukai diagram, Card News, or short video.
---

# Aimake Brief Architect — Plan Before You Draft (`briefs/`)

Never jump straight into writing slides from a vague prompt. Lock the audience, hook, narrative arc, citation map, and visual template in `briefs/<slug>.brief.md` first.

## Input & Output Contract

- **Inputs**:
  - User goal / topic / target platform
  - `wiki/index.md` + relevant `wiki/*.md` cards (or `aimake_wiki_context` MCP tool)
  - `.aimake/brand-kit.json` and `.aimake/workspace.json`
  - Template catalog from `aimake-deck-composer/references/templates.md` (or `aimake_list_templates` MCP tool)
- **Output**:
  - `briefs/<slug>.brief.md`

## Workflow Steps

1. **Gather Context With Minimal Token Spend**:
   - Read `.aimake/workspace.json`, `.aimake/brand-kit.json`, and `wiki/index.md`.
   - Read only the 1-3 `wiki/*.md` pages directly relevant to the user's topic.

2. **Select the Optimal Built-In Template (from the 22 Built-Ins)**:
   Match platform, locale, and tone:
   - **Xiaohongshu (`3:4`, `zh-CN`)**: `xhs-swiss-grid` (method/breakdown), `xhs-paper-editorial` (essays/books), `xhs-neon-tech` (AI/dev benchmarks), `xhs-warm-magazine` (brand/lifestyle), `xhs-pop-sticker` (playful tips/checklists)
   - **WeChat (`3:4`, `zh-CN`)**: `wechat-editorial-article` (long-form inline HTML), `wechat-greenbook` (swipeable insight cards), `wechat-minimal-brief` (executive whitepaper digest)
   - **Executive / Tech PPT (`16:9`)**: `ppt-consulting-matrix` (McKinsey/BCG action-title + KPI), `ppt-executive-16x9` (boardroom briefing), `ppt-tech-architecture` (dark engineering review)
   - **Global / LinkedIn (`4:5`, `en`)**: `linkedin-exec-carousel`, `en-founder-whiteboard`, `en-substack-digest`
   - **Japan (`ja`)**: `x-zukai-quad` (`16:9` Zukai diagram), `ja-note-editorial` (`4:5` Note.com washi)
   - **Korea (`ko`, `4:5`)**: `ig-cardnews-kr` (IG Card News), `ko-brand-lookbook` (Seoul studio lookbook)
   - **Education (`3:4`)**: `edu-flashcard-kids` (bilingual flashcards), `edu-lesson-guide` (chalkboard lesson guide)
   - **Short Video (`9:16`)**: `video-kinetic-reel` (60fps kinetic motion), `video-cinema-talk` (cinema gold commentary)

3. **Write `briefs/<slug>.brief.md`**:
   Use this crisp structure:

   ```markdown
   ---
   slug: "<slug>"
   title: "Working Deck Title"
   platform: "xiaohongshu | wechat | pptx | linkedin | x-zukai | ig-cardnews | short-video | education"
   locale: "zh-CN | en | ja | ko"
   template: "<one-of-22-built-in-template-ids>"
   aspect: "3:4 | 4:5 | 16:9 | 9:16"
   slide_count: 6
   target_formats: ["png", "pdf"]
   ---

   # Creative Brief: <Title>

   ## 1. Audience & Core Pain Point
   - **Who**: Specific reader persona
   - **Pain / Tension**: What problem or misconception stops them today
   - **Desired Action**: Save / share / approve budget / follow

   ## 2. Cover Hook & Angle
   - **Hook Formula**: Counter-intuitive data / Before-vs-After / 3-step blueprint
   - **Headline Candidate**: Short, punchy, scannable in < 2 seconds

   ## 3. Slide-by-Slide Plan & Provenance
   | Slide | Layout | Key Message (1 line) | Visual Element | Cite Coordinate |
   | :--- | :--- | :--- | :--- | :--- |
   | 01 | `cover` | Bold promise + concrete outcome | Eyebrow + title | `wiki/<file>.md#L10` |
   | 02 | `metrics` | 2-3 hard numbers proving why now | `metric` block | `wiki/<file>.md#L18` |
   | 03 | `comparison` | Old broken way vs new method | `compare` block | `wiki/<file>.md#L25` |
   | 04 | `bullets` | 3 actionable execution steps | 3 tight bullets | `wiki/<file>.md#L33` |
   | 05 | `quote` | Memorable core principle | Pull quote | — |
   | 06 | `outro` | Clear CTA + workspace takeaway | Summary + CTA | — |

   ## 4. Tone & Guardrails
   - Brand voice from `.aimake/brand-kit.json`
   - Zero AI clichés; keep every slide comfortably within visual density limits
   ```

## Verification Gate

Before handing off to `aimake-deck-composer`:
- [ ] `briefs/<slug>.brief.md` exists with exact template ID from the 22 built-ins and matching `aspect` ratio.
- [ ] Slide count fits the platform (e.g., 4-8 cards for Xiaohongshu/LinkedIn/IG, 6-12 slides for PPTX, 4-6 scenes for 60s short video).
- [ ] Every data slide maps to a real `wiki/` or `sources/` citation (or explicitly noted user input).
- [ ] If the user requested an interactive check-in, present the 1-page brief summary for quick confirmation before drafting; otherwise proceed directly to `aimake-deck-composer`.
