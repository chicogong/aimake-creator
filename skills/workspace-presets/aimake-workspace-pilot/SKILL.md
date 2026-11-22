---
name: aimake-workspace-pilot
description: End-to-end closed-loop creator pipeline router for Aimake 2.0 workspaces. Use whenever the user asks to create Xiaohongshu carousels, WeChat articles, executive PPTX decks, LinkedIn PDFs, Japanese Zukai, Korean Card News, or short-form videos from workspace materials, or wants to know what step comes next in this workspace.
---

# Aimake Workspace Pilot — Closed-Loop Router

You are the orchestrator of an Aimake 2.0 local-first creator workspace. Every folder in this workspace represents a deterministic stage of the 4-stage creative flywheel pipeline:

```text
① 抓取 Intake  ──>  ② 萃取 Distill  ──>  ③ 创作 Create  ──>  ④ 发布 Publish
  (sources/)           (wiki/ & briefs/)     (decks/ & studio)      (exports/ & wiki/published.md)
      |                       |                     |                      |
[aimake-intake]     [aimake-wiki-synth]    [aimake-brief-architect]  [aimake-deliver-narrator]
                    [aimake-humanizer]     [aimake-deck-composer]    (aimake publish)
```

## Input & Output Contract

- **Inputs read**:
  - `.aimake/workspace.json` (workspace name, scenario preset, default locale & template)
  - `.aimake/brand-kit.json` (author, handle, voice tone, primary color, favorite templates)
  - Directory listing of `sources/`, `wiki/`, `briefs/`, `decks/`, `exports/`
- **Output**:
  - Clear status announcement showing the current pipeline stage (`aimake pipeline`)
  - Routed execution across skills `1 -> 6` without skipping mandatory gates

## Workflow Steps

1. **Inspect Workspace State First**:
   - Check `.aimake/workspace.json` and `.aimake/brand-kit.json` if present.
   - Scan `sources/`, `wiki/index.md`, `briefs/`, `decks/`, and `exports/`.
   - Tell the user in 2-3 crisp lines what artifacts already exist and which step you are starting from.

2. **Route Across the 4-Stage Creative Flywheel Skills**:
   | Flywheel Stage | Workspace Signal | Route To Skill | Required Artifact |
   | :--- | :--- | :--- | :--- |
   | **Stage ① 抓取 Intake** | Raw notes, URLs, PDFs, or files exist outside `sources/` | `aimake-intake` | Normalized `sources/*.md` with exact facts & URLs (`aimake intake`) |
   | **Stage ② 萃取 Distill** | New/updated `sources/*.md` not yet distilled into `wiki/` | `aimake-wiki-synth` | Grounded `wiki/*.md` entity cards + updated `wiki/index.md` (`<= 3,000` tokens) |
   | **Stage ② 萃取 Distill** | Audience & slide plan needed for content | `aimake-brief-architect` | `briefs/<slug>.brief.md` (hook, thesis, slide plan, template choice) |
   | **Stage ③ 创作 Create** | Brief ready, or edit / One-Click Remix existing deck | `aimake-deck-composer` | Valid `decks/<slug>.deck.md` synced live to Aimake Studio (`aimake create`) |
   | **Stage ③ 创作 Create** | Draft `.deck.md` needs pre-delivery anti-AI polish | `aimake-humanizer` | Humanized & density-checked `decks/<slug>.deck.md` |
   | **Stage ④ 发布 Publish** | Approved deck ready for multimodal delivery & publishing | `aimake-deliver-narrator` | Deliverables in `exports/`, multi-platform posting (`aimake publish`), & `wiki/published.md` |

3. **Respect Fast-Path Requests Without Breaking Quality Gates**:
   - If the user asks to **One-Click Remix** an existing deck into a new platform or template, jump directly to `aimake-deck-composer` -> `aimake-humanizer` -> `aimake-deliver-narrator`.
   - If the user asks to **fix one slide** in an existing deck, edit `decks/<slug>.deck.md` directly (following `aimake-deck-composer` syntax) and run a quick overflow check from `aimake-humanizer`.
   - Never fabricate statistics, quotes, or URLs. If evidence is missing from `sources/` and `wiki/`, ask the user or mark it `[待验证]` / `[UNVERIFIED]`.

## Verification Gate

Before concluding any routed task, verify:
- [ ] Every factual claim in `decks/` traces back to `sources/` or `wiki/` via `cite:` coordinates (or was explicitly provided by the user).
- [ ] `briefs/<slug>.brief.md` exists before writing a brand-new multi-slide deck.
- [ ] `decks/<slug>.deck.md` passed `aimake-humanizer` (zero robotic clichés, zero visual text overflow).
- [ ] All generated files live strictly inside this workspace (`sources/`, `wiki/`, `briefs/`, `decks/`, `exports/`).
- [ ] User receives a concise summary of created/updated files and the exact next optional step.
