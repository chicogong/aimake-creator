<!--
Aimake Studio Pull Request Template
Please fill in the sections below to ensure rapid review and automated Kanban board progression.
-->

## Summary

<!-- 1-3 concise bullets describing what changed and why. -->
- 

<!-- Crucial for automated board progression and closing issues: -->
Closes #

---

## Scope & Category

- [ ] 🎨 **Template**: New or updated parametric design template (`templates/<slug>/`)
- [ ] 🛠️ **CLI / Engine**: Core parser, compiler, or command line interface
- [ ] 🖥️ **Studio Canvas**: Calm UI, live preview, or WYSIWYG editor
- [ ] 📦 **Omni-Channel Exporters**: Multi-modal delivery (PNG, SVG, PPTX, PDF, WeChat HTML, MP4)
- [ ] 🤖 **AI Co-Pilot / MCP**: Model Context Protocol tools, workspace skills, or recipes
- [ ] 🌐 **Web & Docs**: Official site, documentation, brand assets, or examples
- [ ] ⚙️ **CI/CD & Infra**: Automation workflows, packaging, or release pipelines

---

## Local-First & Deliverable Impact

<!-- Check applicable impacts to ensure zero regressions across Aimake's core principles -->
- [ ] **Zero Telemetry / Offline Integrity**: No third-party tracking or cloud dependencies added; fully functional offline.
- [ ] **Multi-Format Verification** (check if exporters or templates were modified):
  - [ ] Web Canvas (`aimake studio`)
  - [ ] Images (`aimake render -f png`)
  - [ ] Keynote / Slides (`aimake render -f pptx`)
  - [ ] Print / Document (`aimake render -f pdf`)
  - [ ] WeChat Article (`aimake render -f wechat-html`)
  - [ ] Dynamic Video (`aimake render -f mp4`)
  - [ ] CapCut / 剪映 Draft (`aimake render -f capcut`)
- [ ] **Dual Theme Check**: Validated across both `:root[data-theme="dark"]` and `:root[data-theme="light"]`.
- [ ] **Backward Compatibility**: Existing `.deck.md` files continue to parse and render correctly.

---

## Quality Assurance Checklist

- [ ] `pnpm typecheck` passes with 0 errors
- [ ] `pnpm test` passes cleanly (Vitest suites)
- [ ] `pnpm test:e2e` passes (Playwright E2E suites)
- [ ] `pnpm audit:secrets` passes with 0 leaked credentials or personal home paths
- [ ] Public docs & UI copy verified for zero internal leaks and affirmative phrasing
- [ ] `pnpm verify` passes all release preflight checks

---

## Visual Evidence / Verification Output

<!-- Paste terminal output, Playwright test artifact, or before/after screenshots here -->
```bash
$ pnpm test
```

---

## Notes & Tradeoffs

<!-- Optional: Design choices, alternatives evaluated, or future follow-ups -->
