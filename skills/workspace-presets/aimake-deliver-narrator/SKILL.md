---
name: aimake-deliver-narrator
description: "Prepare spoken narration pacing (speech blocks and SRT timing), export finished Aimake .deck.md decks into PNG, WeChat inline HTML, PDF, native editable PPTX, or 60fps MP4 inside exports/, and compound a publishing summary back into wiki/published.md to close the creator loop."
---

# Aimake Deliver & Narrator — Multimodal Export & Asset Compounding (`exports/` -> `wiki/`)

Turn an approved, humanized `decks/<slug>.deck.md` into ready-to-publish deliverables across 5 native formats inside `exports/`, then write the publishing record back into `wiki/published.md` so every finished piece compounds the workspace's long-term knowledge.

## Input & Output Contract

- **Inputs**:
  - Approved `decks/<slug>.deck.md`
  - Desired export format(s): `png`, `wechat`, `pdf`, `pptx`, `mp4` (and optional template override)
- **Outputs**:
  - Narration-paced `decks/<slug>.deck.md` (with `::: speech :::` blocks when exporting `mp4` or presentation speaker notes)
  - Rendered artifacts in `exports/<YYYY-MM-DD>-<slug>/` (or `exports/<slug>.<ext>`)
  - Updated `wiki/published.md` (and `wiki/index.md` if needed) closing the workspace loop

## Workflow Steps

1. **Author or Pace Spoken Narration (`::: speech :::`)**:
   - Required for `mp4` short videos (`video-kinetic-reel`, `video-cinema-talk`) and recommended for `pptx` speaker notes.
   - Match natural spoken cadence to `secondsPerSlide` (default `4-6s` per card):
     - `zh-CN`: ~3.8–4.5 characters/sec (15–26 chars per 4–6s slide; ~220–260 chars/min)
     - `en`: ~2.3–2.8 words/sec (10–16 words per 4–6s slide; ~140–165 wpm)
     - `ja`: ~4.5–5.5 characters/sec (20–30 chars per 4–6s slide)
     - `ko`: ~3.5–4.2 syllables/sec (15–24 chars per 4–6s slide)
   - Write conversational sentences with natural breath pauses (commas/periods) so TTS synthesis and auto-generated SRT captions align cleanly without cramped 3-line subtitle wraps.

2. **Compile Deliverables to `exports/`**:
   Use Aimake MCP `aimake_render_deck` (preferred) or deterministic Aimake CLI (`aimake render`):

   - **PNG Card Set** (Xiaohongshu / Greenbook / IG / Zukai):
     `aimake_render_deck({ deckPath: "decks/<slug>.deck.md", format: "png", output: "exports/<slug>-png", vaultDir: "." })`
   - **WeChat Inline HTML** (100% inline-CSS copy-paste):
     `aimake_render_deck({ deckPath: "decks/<slug>.deck.md", format: "wechat", output: "exports/<slug>-wechat.html", vaultDir: "." })`
   - **Multi-Page Vector PDF** (LinkedIn 4:5 Carousel / Printable Flashcards):
     `aimake_render_deck({ deckPath: "decks/<slug>.deck.md", format: "pdf", output: "exports/<slug>.pdf", vaultDir: "." })`
   - **Native Editable PowerPoint (`.pptx`)**:
     `aimake_render_deck({ deckPath: "decks/<slug>.deck.md", format: "pptx", output: "exports/<slug>.pptx", vaultDir: "." })`
   - **60fps Short Video (`.mp4`)**:
     `aimake_render_deck({ deckPath: "decks/<slug>.deck.md", format: "mp4", output: "exports/<slug>.mp4", vaultDir: "." })`

3. **Verify Export Artifacts On Disk**:
   - Confirm every expected output file exists inside `exports/` and has non-zero file size.
   - If exporting multiple formats from the same `.deck.md`, list each produced path clearly.

4. **Compound Back Into `wiki/published.md` (Close the Loop)**:
   Append a structured entry to `wiki/published.md` (create the file with `# Published Deliverables & Compounding Log` if absent):

   ```markdown
   ## YYYY-MM-DD — <Deck Title>
   - **Deck**: `decks/<slug>.deck.md` (`<template>`, `<locale>`, `<slideCount>` slides)
   - **Exports**: `exports/...`
   - **Core Thesis / Hook**: 1-sentence summary of the angle that shipped
   - **Reusable Assets / Remix Ideas**: e.g. Remix into `ppt-consulting-matrix` or `video-kinetic-reel`
   ```

## Verification Gate

Before reporting completion to the user:
- [ ] If `mp4` was requested, every slide has paced `::: speech :::` narration matching the locale cadence.
- [ ] Every requested deliverable exists in `exports/` with verified non-zero size.
- [ ] `wiki/published.md` has been updated with the new publishing record (completing the end-to-end closed loop).
- [ ] Present exact file paths in `exports/` and suggest one high-leverage One-Click Remix format if useful.
