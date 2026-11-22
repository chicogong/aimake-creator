---
name: aimake-intake
description: Ingest raw source materials (PDF, DOCX, PPTX, HTML, web URLs, social posts, interview notes, and ideas) into clean, fact-preserving Markdown files under sources/ in an Aimake workspace. Use when the user drops new materials, pastes links, or wants to capture research before writing.
---

# Aimake Intake — Universal Source Capture (`sources/`)

Convert heterogeneous raw inputs into clean, permanent, Markdown-first source snapshots under `sources/` following the `markitdown` + structured provenance paradigm.

## Input & Output Contract

- **Inputs**:
  - Web URLs (articles, docs, social threads, press releases)
  - Local files (`.pdf`, `.docx`, `.pptx`, `.html`, `.md`, `.txt`, transcripts)
  - Raw text or bullet notes pasted directly by the user
- **Outputs**:
  - `sources/YYYY-MM-DD-<slug>.md` with YAML frontmatter provenance
  - Optional immediate Wiki registration via `aimake_wiki_ingest` MCP tool or `aimake wiki ingest`

## Workflow Steps

1. **Normalize Input to Clean Markdown**:
   - For URLs or Office files (`.docx`, `.pptx`, `.html`), prefer calling the Aimake MCP tool `aimake_wiki_ingest` (with `vaultDir: "."`) or CLI `aimake wiki ingest "<source>" --vault .`, AND ensure a clean readable copy is saved in `sources/YYYY-MM-DD-<slug>.md`.
   - For `.pdf` or binary documents, extract full text cleanly (preserving headings, tables, and numerical figures) without summarizing away concrete numbers.
   - For social threads or pasted notes, strip navigation noise, ads, and UI chrome while preserving author handle, publish date, exact quotes, and metrics.

2. **Write Standardized Frontmatter**:
   Every file in `sources/` MUST start with valid YAML frontmatter:

   ```markdown
   ---
   title: "Exact Source Title"
   source_url: "https://example.com/original-article"
   source_type: "web | pdf | docx | pptx | note | social"
   captured_at: "2026-01-01T00:00:00Z"
   tags: ["topic-a", "topic-b"]
   ---

   # Exact Source Title

   ## Core Facts & Data Points
   - Preserve exact percentages, currency figures, dates, versions, and proper nouns.

   ## Full Extracted Content
   ...
   ```

3. **Keep Sources Immutable & Clean**:
   - Never overwrite an earlier distinct source snapshot; append a date or version suffix (`-v2`) if capturing an updated version of the same URL.
   - Never leak private API keys, session cookies, or unrelated machine-local credentials into `sources/`.

## Verification Gate

Before handing off to `aimake-wiki-synth`:
- [ ] File is saved under `sources/` with `.md` extension and valid YAML frontmatter.
- [ ] Every original number, date, product version, and source URL is preserved verbatim (zero paraphrased rounding of metrics).
- [ ] Navigation chrome, cookie banners, and duplicate boilerplate are stripped.
- [ ] Inform the user of the saved `sources/<file>.md` path and suggest running `aimake-wiki-synth` next.
