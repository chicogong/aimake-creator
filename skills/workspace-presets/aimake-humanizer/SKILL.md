---
name: aimake-humanizer
description: Four-locale (zh-CN, en, ja, ko) anti-AI-slop and visual text-density overflow gate for Aimake .deck.md files. Use after drafting or remixing any deck to strip robotic LLM clichés, enforce authentic brand voice, and guarantee every slide fits cleanly inside its aspect ratio without text clipping.
---

# Aimake Humanizer — 4-Locale Anti-AI-Slop & Visual Density Gate

Act as a ruthless senior editor before anything reaches the user's audience. Remove mechanical AI phrasing across `zh-CN`, `en`, `ja`, and `ko`, and enforce strict per-slide text-density budgets so rendered cards and slides never overflow.

## Input & Output Contract

- **Inputs**:
  - Draft `decks/<slug>.deck.md`
  - `.aimake/brand-kit.json` (voice tone & persona guardrails)
  - Optional Aimake MCP tool `aimake_humanize` (`text`, `locale`) or CLI `aimake persona humanize`
- **Outputs**:
  - Polished, human-sounding `decks/<slug>.deck.md` (edited in place)
  - Short audit report summarizing removed clichés and tightened slides

## Workflow Steps

1. **Run Automated Slop Audit (If MCP/CLI Available)**:
   - Call `aimake_humanize` (with the deck's `locale`) or run `aimake persona humanize decks/<slug>.deck.md --locale <locale>` to catch high-frequency LLM fillers automatically.

2. **Strip Locale-Specific AI Clichés Manually**:
   - **`zh-CN`**: Eliminate hollow transitions and inflated verbs — e.g. `总而言之`, `值得注意的是`, `不仅…而且…`, `赋能`, `抓手`, `闭环` (when buzzwordy), `颠覆性`, `毫无疑问`, `随着…的快速发展`, `让我们一起探索`. Replace with concrete verbs, real numbers, and direct spoken rhythm.
   - **`en`**: Eliminate synthetic prose — e.g. `delve into`, `in today's fast-paced world`, `game-changer`, `unlock the power of`, `tapestry`, `it's worth noting`, `leverage`, `seamlessly`, `revolutionize`. Prefer short Anglo-Saxon verbs and concrete nouns.
   - **`ja`**: Eliminate unnatural translationese and stiff boilerplate — e.g. `言うまでもなく`, `革新的な`, `飛躍的に向上`, `本記事では…を徹底解説します`, excessive `〜することができます`. Keep natural Japanese cadence and crisp `体言止め` headlines suitable for strict kinsoku line-breaking.
   - **`ko`**: Eliminate stiff AI translation tone — e.g. `결론적으로 말씀드리면`, `혁신적인 패러다임`, `주목할 점은`, `다양한 측면에서`, awkward `~하는 것이 가능합니다`. Keep punchy, natural Korean phrasing compatible with `word-break: keep-all`.

3. **Enforce Visual Text-Density & Overflow Budgets**:
   Check every slide against its canvas aspect ratio:

   | Aspect Ratio | Title Max | Subtitle Max | Bullets Max | Words / CJK Chars per Bullet | Total Slide Body Ceiling |
   | :---: | :---: | :---: | :---: | :---: | :---: |
   | `3:4` (`xhs-*`, `wechat-*`, `edu-*`) | 18 CJK / 9 EN words | 28 CJK / 14 EN words | `<= 4` items | `<= 28` CJK / `<= 14` EN words | `<= 160` CJK / `<= 80` EN words |
   | `4:5` (`linkedin-*`, `en-*`, `ig-*`, `ja-note-*`, `ko-*`) | 18 CJK / 8 EN words | 26 CJK / 13 EN words | `<= 4` items | `<= 26` CJK / `<= 13` EN words | `<= 150` CJK / `<= 75` EN words |
   | `16:9` (`ppt-*`, `x-zukai-quad`) | 24 CJK / 12 EN words | 36 CJK / 18 EN words | `<= 5` items | `<= 32` CJK / `<= 16` EN words | `<= 220` CJK / `<= 110` EN words |
   | `9:16` (`video-*`) | 14 CJK / 7 EN words | 20 CJK / 10 EN words | `<= 3` items | `<= 18` CJK / `<= 9` EN words | `<= 90` CJK / `<= 45` EN words (put detail in `::: speech :::`) |

   If a slide exceeds its ceiling, **split it into two cleaner slides** or compress redundant modifiers — never shrink ideas into unreadable walls of text.

4. **Preserve Provenance & Structure**:
   - Keep YAML frontmatter, `<!-- scene: ... | layout: ... | cite: ... -->` comments, `metric`/`compare` fences, and `::: speech :::` markers 100% intact.
   - Never alter verified numbers, dates, or source URLs while rewriting prose.

## Verification Gate

Before handing off to `aimake-deliver-narrator` (or returning to the user):
- [ ] Zero banned AI clichés remain for the deck's target locale (`zh-CN` / `en` / `ja` / `ko`).
- [ ] Every slide passes the visual text-density table above (no likely overflow).
- [ ] Every `cite:` coordinate and factual metric survived untouched.
- [ ] Output a 3-line summary: clichés stripped, slides tightened/split, and readiness for visual review or export.
