# Third-Party Notices

Aimake (`aimake.cc`) CLI & core runtime is licensed under the MIT License (`MIT`).
Aimake integrates and adapts portions of the following open-source projects and conventions in accordance with their respective license terms.

---

## 1. LLM Wiki Canvas (`llm-wiki-canvas` / `@lwc/core`)

- **Project**: LLM Wiki Canvas (`llm-wiki-canvas`)
- **Version**: 0.2.0
- **Source**: https://github.com/chicogong/llm-wiki-canvas
- **License**: Apache License, Version 2.0 (`Apache-2.0`)
- **Used in**: `src/wiki/lwc-bridge.ts`, `src/wiki/wiki-engine.ts` (Markdown graph compilation, structural diagnostics, OKF v0.2 trust and conformance checks, 0–2 hop topology-bounded context extraction with SHA-256 provenance, governed intake/draft/proposal/review/apply lifecycle, and JSON Canvas / Excalidraw / Mermaid visual export).

### Upstream `NOTICE`

```text
LLM Wiki Canvas
Copyright 2026 chicogong

This product is licensed under the Apache License, Version 2.0.
```

### Apache License, Version 2.0 Notice

Licensed under the Apache License, Version 2.0 (the "License"); you may not use the `llm-wiki-canvas` (`@lwc/core`) software except in compliance with the License. You may obtain a copy of the License at:

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.

Aimake adapts `@lwc/core` via `src/wiki/lwc-bridge.ts` and `src/wiki/wiki-engine.ts` to combine `@lwc/core` graph diagnostics, context bundling, governed proposal workflows, and visual exports with Aimake's local-first LLM Wiki engine and `.deck.md` citation verification.

---

## 2. Qingyan Vault (`qingyan-vault`) Vault Conventions

- **Project**: Qingyan Vault (`qingyan-vault`)
- **Source**: https://github.com/chicogong/qingyan-vault
- **License**: MIT License (`MIT`)
- **Adapted in**: `src/wiki/lwc-bridge.ts`, `src/wiki/wiki-engine.ts` (R0–R3 Agent permission hierarchy, Fact / Inference / Unverified epistemic structure, Obsidian Bases `Overview.base` table convention inspired by `知识总览.base`, vault-level `AGENTS.md` protocol, and read-only layout compatibility for Qingyan Vault directories).

### MIT License

```text
MIT License

Copyright (c) 2026 Qingyan Vault contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 3. UI Icons, Terminal UX, Syntax Highlighting & Diagram Ecosystem

- **Lucide Icons (`lucide`)** — License: ISC (`https://lucide.dev`). Crisp 24x24 `1.5px` stroke vector SVG icon patterns adapted in `src/studio/calm-ui/icons.ts` and the Web Playground.
- **`@clack/prompts`** — License: MIT (`https://github.com/bombshell-dev/clack`). Interactive CLI setup wizard (`aimake wizard`).
- **`picocolors`** — License: ISC (`https://github.com/alexeyraspopov/picocolors`). Zero-overhead ANSI terminal styling.
- **`highlight.js`** — License: BSD-3-Clause (`https://highlightjs.org`). Offline code syntax highlighting inside compiled slides (`src/renderer/html-compiler.ts`).
- **Mermaid (`mermaid`) & Marp / Slidev Syntax Conventions** — License: MIT (`https://mermaid.js.org`, `https://marp.app`, `https://sli.dev`). Flowchart diagram notation (` ```mermaid `) and Markdown slide import compatibility (`src/renderer/importers.ts`, `src/renderer/mermaid-svg.ts`).
