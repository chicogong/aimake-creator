---
name: aimake-wiki-synth
description: Distill raw files from sources/ into grounded entity and concept cards in wiki/*.md and maintain a compact token-bounded wiki/index.md with exact cite coordinates. Use after adding new sources or when consolidating workspace knowledge before drafting.
---

# Aimake Wiki Synth — Grounded Knowledge Distillation (`wiki/`)

Transform raw snapshots in `sources/` into compounding, citation-ready knowledge pages inside `wiki/` while keeping `wiki/index.md` strictly compact (`<= 3,000 tokens`).

## Input & Output Contract

- **Inputs**:
  - `sources/*.md` (normalized source files)
  - Existing `wiki/index.md` and `wiki/*.md` (for "extend, don't overwrite" synthesis)
- **Outputs**:
  - Entity / concept / benchmark cards in `wiki/<slug>.md`
  - Updated compact index in `wiki/index.md` (`<= 3,000 tokens`)
  - Verified health check via `aimake_wiki_lint` MCP tool (if available)

## Workflow Steps

1. **Read Current Index First (Progressive Disclosure)**:
   - Read `wiki/index.md` before reading individual wiki pages so you extend existing concept cards instead of creating duplicates.
   - Read the newly added or modified `sources/*.md` files.

2. **Synthesize Grounded Wiki Cards (`wiki/<slug>.md`)**:
   - Organize by durable concept, entity, framework, or case study (not by date alone).
   - Enforce **Epistemic Separation** so downstream decks never confuse verified facts with speculation:

   ```markdown
   # Concept or Entity Title

   > Concise 1-sentence synthesis grounded in workspace sources.

   ## Facts (Verified Evidence)
   - Concrete metric or statement with exact number/date. (source: `sources/2026-01-01-report.md`)

   ## Inferences [推断]
   - Analytical takeaway or cross-source pattern explicitly tagged `[推断]`.

   ## Open Questions [待验证]
   - Unconfirmed details needing follow-up explicitly tagged `[待验证]`.
   ```

3. **Assign Stable Citation Coordinates**:
   - Keep each factual bullet on its own single line inside `wiki/<slug>.md` so downstream `.deck.md` slides can reference exact coordinates:
     `cite: wiki/<slug>.md#L12`
   - Prefer relative WikiLinks (`[[other-concept]]`) between related wiki pages.

4. **Update Compact `wiki/index.md`**:
   - List active knowledge pages with 1-line summaries (title, key angle, date).
   - Keep `wiki/index.md` strictly **under 3,000 tokens** so any AI host can load the entire workspace knowledge map in one lightweight read.
   - If Aimake MCP is connected, run `aimake_wiki_lint` (with `vaultDir: "."`) to confirm zero broken links and valid token budget.

## Verification Gate

Before handing off to `aimake-brief-architect`:
- [ ] Every new `sources/*.md` fact is distilled into at least one `wiki/<slug>.md` card.
- [ ] Facts, Inferences (`[推断]`), and Unverified items (`[待验证]`) are clearly separated.
- [ ] `wiki/index.md` links to every active `wiki/*.md` card and stays `<= 3,000 tokens`.
- [ ] No fabricated citations, no dead WikiLinks, and no secrets or absolute machine paths.
