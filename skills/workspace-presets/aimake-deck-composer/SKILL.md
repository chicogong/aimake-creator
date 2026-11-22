---
name: aimake-deck-composer
description: Author, refine, and One-Click Remix Aimake .deck.md storyboards across all 22 built-in visual templates using strict YAML 1.2 frontmatter and slide syntax, syncing edits live to the Aimake Studio visual stage. Use when drafting decks/<slug>.deck.md from a brief, updating slide copy/layouts, or remixing an existing deck into another style or platform.
---

# Aimake Deck Composer — `.deck.md` Authoring & One-Click Remix (`decks/`)

Compile creative briefs (or remix existing decks) into clean, deterministic `decks/<slug>.deck.md` files that render across all 22 built-in Aimake templates and live-reload Aimake Studio in `<100ms`.

## Input & Output Contract

- **Inputs**:
  - `briefs/<slug>.brief.md` (for new decks), OR an existing `decks/<existing>.deck.md` (for edits / One-Click Remix)
  - `.aimake/brand-kit.json` (author, handle, watermark, primaryColor)
  - Progressive-disclosure template catalog: read [references/templates.md](references/templates.md) whenever you need exact template IDs, aspect ratios, pixel sizes, or supported formats
- **Outputs**:
  - Valid `decks/<slug>.deck.md` following YAML 1.2 frontmatter + Aimake slide syntax
  - Live stage sync (automatically triggered when writing `decks/*.deck.md`, or explicitly via Aimake MCP tools)

## `.deck.md` Authoring Rules (YAML 1.2 Strict)

1. **YAML Frontmatter (Top of File)**:
   - Quote any string containing `:`, `@`, `#`, `%`, or leading symbols (e.g., `handle: "@creator"`, `title: "AI Agent: 3x Faster"`).
   - Match `aspect` strictly to the chosen template's native ratio (`3:4`, `4:5`, `16:9`, or `9:16`).

   ```yaml
   ---
   title: "Your Deck Title"
   template: xhs-swiss-grid
   locale: zh-CN
   aspect: "3:4"
   author: "Creator Name"
   handle: "@handle"
   watermark: true
   fps: 30
   secondsPerSlide: 4
   tags:
     - strategy
     - workflow
   ---
   ```

2. **Slide Dividers & Scene Metadata**:
   - Separate slides with `---` on its own line (outside fenced code blocks).
   - Start each slide with a structured HTML comment:
     `<!-- scene: hook | layout: cover | eyebrow: INSIGHT 01 | cite: wiki/topic.md#L12 -->`
   - Valid `layout` values: `cover`, `bullets`, `metrics`, `code`, `comparison`, `quote`, `quad`, `flashcard`, `outro`.

3. **Structured Visual Blocks (Use Native Aimake Syntax)**:
   - **Metric KPI Cards** (`layout: metrics`):
     ````markdown
     ```metric
     - Context Savings: 95% (-28k tokens)
     - Local Cost: $0.00 (Zero-Backend)
     ```
     ````
   - **Two-Column Comparison** (`layout: comparison`):
     ````markdown
     ```compare
     Old Workflow :: Scattered docs | Robotic AI tone | Manual layout rework
     Aimake 2.0 :: Grounded local Wiki | Workspace preset skills | 1 deck -> 5 formats
     ```
     ````
   - **Code Stage** (`layout: code`): standard fenced code block with optional line focus ```` ```ts {1-3} ````.
   - **Pull Quote** (`layout: quote`): `> Memorable insight sentence — Attribution`.
   - **Voiceover Narration**:
     ```markdown
     ::: speech
     Natural spoken narration for this slide (used for TTS & MP4 export).
     :::
     ```

4. **One-Click Remix (Cross-Platform & Cross-Style)**:
   - To remix an existing deck into another template/platform while keeping the user's grounded ideas intact:
     - Prefer calling MCP tool `aimake_remix_deck` (`sourceTemplateId`, `targetDeckPath`, `outDeckPath`, `locale`, `humanize: true`) or CLI `aimake remix <templateId> --deck decks/<src>.deck.md -o decks/<dst>.deck.md --humanize`.
     - If manually adapting across aspect ratios (e.g., `3:4` Xiaohongshu -> `16:9` `ppt-consulting-matrix` or `9:16` `video-kinetic-reel`), adjust slide density and add `::: speech :::` blocks for video templates.

5. **Live Stage Synchronization**:
   - Saving directly to `decks/<slug>.deck.md` triggers Aimake Studio's `fs.watch` + SSE hot reload (and OpenCode's `.opencode/plugin/aimake-live-sync.js` if active) so the user sees the updated slide immediately.
   - Keep edits atomic: write complete, syntactically valid `.deck.md` files rather than half-finished fragments.

## Verification Gate

Before handing off to `aimake-humanizer`:
- [ ] YAML 1.2 frontmatter parses cleanly (colons/handles quoted; `template` is one of the 22 valid IDs in `references/templates.md`; `aspect` matches the template).
- [ ] Every slide has `<!-- scene: ... | layout: ... -->`, a crisp `# Title`, and balanced visual rhythm (avoid repeating identical layouts 4 times in a row).
- [ ] All numerical claims carry `cite: wiki/...#Lxx` coordinates.
- [ ] File is written to `decks/<slug>.deck.md` and ready for `aimake-humanizer`.
