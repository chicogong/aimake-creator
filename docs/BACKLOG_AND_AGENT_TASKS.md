# Aimake Studio · Agent 可认领任务总看板 (`BACKLOG_AND_AGENT_TASKS.md`)

> **适用对象**：协作 Agent（Antigravity / Claude Code / Codex / OpenCode / Cursor）及人类贡献者  
> **实时看板**：[GitHub Project #3](https://github.com/users/chicogong/projects/3) · [Milestones](https://github.com/chicogong/aimake-creator/milestones)  
> **配套规范**：[`NORTH_STAR_TOP_TIER_BLUEPRINT.md`](./NORTH_STAR_TOP_TIER_BLUEPRINT.md) · [`AGENTS.md`](../AGENTS.md) · [`PRODUCT_AUDIT_AND_ARCHITECTURE_2026.md`](./PRODUCT_AUDIT_AND_ARCHITECTURE_2026.md) · [`UI_DESIGN_SYSTEM.md`](./design/UI_DESIGN_SYSTEM.md) · [`DEVELOPMENT_WORKFLOW.md`](./guides/DEVELOPMENT_WORKFLOW.md)

---

## 一、 多 Agent 认领与交付协议（Claiming Protocol）

任一协作者或子会话认领任务前，按以下 5 步标准协议推进：

1. **防并发冲突**：先检查目标任务当前在 Project #3 是否仍为 `Todo`（或无人认领评论），再认领：
   ```bash
   gh issue comment <ISSUE_NUM> --repo chicogong/aimake-creator --body "Claiming task T-XX in branch <branch-name>."
   ```
2. **创建独立分支**：从最新 `origin/main` 拉出语义化分支（如 `fix/swift-bridge-17` 或 `feat/capcut-png-18`）。
3. **遵守仓库硬红线**：
   - 本地优先与零遥测（核心功能 100% 离线可用，严禁隐私外传）；
   - 中文文档与 UI 文案采用正面肯定直叙表达，保持简洁克制；
   - 严格区分公开开源内容与内部治理文档，运行 `pnpm audit:secrets` 保持 0 警告。
4. **验证门禁**：在最后一次修改后运行完整检查命令（如任务声明的 `pnpm verify` 或 `pnpm typecheck && pnpm test`），记录实际运行结果。
5. **关联闭环**：PR 描述中写明 `Closes #<ISSUE_NUM>`，合并后 `project-automation.yml` 自动流转看板卡片至 `Done`。

---

## 二、 Sprint 1：`v2.0.1` 紧急阻塞修复与安全加固（截止 `2026-12-07`）

| 任务 ID | Issue | 优先级 | 现状 | 目标文件 / 模块 | 验收标准与验证命令 |
| :--- | :--- | :---: | :---: | :--- | :--- |
| **`T-01`** | [**#17**](https://github.com/chicogong/aimake-creator/issues/17) | `P0` | `Ready` | `desktop/macos/AimakeApp.swift:221,232-254,386,930`<br>`src/studio/calm-ui/script.ts:103,1900` | 对齐 Swift `aimakeNative` 通道与前端调用；将 Quick Clip 热键改至 `⇧⌘K` 释放 `⌘K`；更新 `View`/`Export` 菜单。<br>**验证**：`pnpm typecheck && pnpm test && pnpm desktop:build` |
| **`T-02`** | [**#18**](https://github.com/chicogong/aimake-creator/issues/18) | `P0` | `Ready` | `src/studio/studio-server.ts:1650`<br>`src/renderer/exporter-media.ts:425`<br>`src/renderer/capcut-draft-builder.ts:388,548`<br>`src/mcp/mcp-server.ts:183`<br>`src/cli.ts:925` | 导出前先渲染真实 `slideImages` 传入 `buildCapCutDraft`（彻底移除 1x1 占位图）；`installLocal` 重写音视频资产路径并拷贝音频；MCP 支持 `'capcut'`；新增 `tests/capcut-draft.test.ts`。<br>**验证**：`pnpm typecheck && pnpm test` |
| **`T-03`** | [**#19**](https://github.com/chicogong/aimake-creator/issues/19) | `P1` | `Ready` | `src/studio/studio-server.ts:758-769`<br>`src/studio/calm-ui/markup.ts:81`<br>`src/renderer/exporter-media.ts:208,245,257` | 非 `GET/HEAD` 请求增加 `Origin` 与 `Sec-Fetch-Site` CSRF 拦截并配单测；边栏灵感雷达动态渲染条数与周期；视频渲染等待 `document.fonts.ready` 并升级 `-14 LUFS` 默认门禁。<br>**验证**：`pnpm typecheck && pnpm test && pnpm test:smoke` |
| **`T-18`** | [**#23**](https://github.com/chicogong/aimake-creator/issues/23) | `P1` | `Ready` | `src/studio/calm-ui/markup.ts:142-160`<br>`src/site/playground-builder.ts` · `src/site/site-builder.ts` | 修复 Studio 顶部悬浮胶囊滞后及冗余 Emoji、精简底栏 Dock 至 5–6 控件；统一 Playground 与 Studio 同源渲染与 KPI 防断行；为 Playground 36 套模板抽屉加上视觉封面缩略图与色板条。<br>**验证**：`pnpm site:build && pnpm test && pnpm test:e2e` |

---

## 三、 Sprint 2：`v2.1.0` 核心稳定性、CapCut 完结、ACP 与 CLI-Hub（截止 `2026-12-31`）

| 任务 ID | Issue | 优先级 | 现状 | 目标文件 / 模块 & 规范引用 | 验收标准与验证命令 |
| :--- | :--- | :---: | :---: | :--- | :--- |
| **`T-04`** | [**#10**](https://github.com/chicogong/aimake-creator/issues/10) | `P1` | `In Progress` | `src/renderer/capcut-draft-builder.ts`<br>规范：[`2026-11-24-capcut-draft-and-timeline-engine.md`](./research/2026-11-24-capcut-draft-and-timeline-engine.md) | 依赖 `T-02` 解决后收口：实现 6 轨完整场景动画、精确音频对齐与剪映专业版打开实测验收，确保本地草稿直接可播可剪。 |
| **`T-05`** | [**#13**](https://github.com/chicogong/aimake-creator/issues/13) | `P1` | `Ready` | `src/renderer/exporter-media.ts:166-182,277-335` | 改用累计时间戳差值法算帧 (`endFrame - prevEndFrame`) 消除长视频音画漂移；增加静态素材预加载兜底；探测 `h264_videotoolbox` 硬件加速。<br>**验证**：`pnpm test` 补长视频分帧计算单测 |
| **`T-06`** | [**#9**](https://github.com/chicogong/aimake-creator/issues/9) | `P1` | `Ready` | `src/acp/`（新建）· `src/cli.ts`<br>规范：[`2026-11-24-rfc-acp-protocol-integration.md`](./proposals/2026-11-24-rfc-acp-protocol-integration.md) | 实现 `aimake acp`（Stdio JSON-RPC 2.0 双向流）；打通 `initialize`、`session/prompt`、`session/update`；Zed / JetBrains 可直连会话创作 `.deck.md`。<br>**验证**：`pnpm test` 含 mock stdio 握手回归 |
| **`T-07`** | [**#16**](https://github.com/chicogong/aimake-creator/issues/16) | `P1` | `Ready` | `src/cli.ts` · `skills/aimake/SKILL.md`<br>调研：[`2026-11-24-agent-native-ecosystem-and-tools-research.md`](./research/2026-11-24-agent-native-ecosystem-and-tools-research.md) | 全量 CLI 子命令统一补齐 `--json` 机器可读响应结构（含退出码契约），备齐 CLI-Hub (`clianything.cc`) 注册清单。<br>**验证**：`pnpm test:smoke && pnpm validate:skill` |
| **`T-08`** | [**#12**](https://github.com/chicogong/aimake-creator/issues/12) | `P2` | `Ready` | `tests/`（与 `T-04`/`T-05`/`T-06` 协同收口） | 补齐 ACP 握手时序、Calm Studio SSE 推送与 CapCut `draft_content.json` Schema 端到端契约测试集。<br>**验证**：`pnpm test && pnpm test:e2e` |
| **`T-19`** | [**#24**](https://github.com/chicogong/aimake-creator/issues/24) | `P1` | `Ready` | `src/renderer/exporter-pptx.ts` · `src/templates/index.ts`<br>蓝图：[`NORTH_STAR_TOP_TIER_BLUEPRINT.md`](./NORTH_STAR_TOP_TIER_BLUEPRINT.md) | 基于共享 Visual IR 升级 PPTX 导出器：还原 36 套模板真实色板、自适应 `aspect` 多画幅、高 DPI 嵌入 Mermaid/图表、支持原生表格 `addTable` 与动态排版。<br>**验证**：`pnpm typecheck && pnpm test` |

---

## 四、 Sprint 3：`v2.2.0` 端侧语音、AutoClip、互动雷达与知识中枢（截止 `2027-01-31`）

| 任务 ID | Issue | 优先级 | 现状 | 目标文件 / 模块 & 规范引用 | 验收标准与验证命令 |
| :--- | :--- | :---: | :---: | :--- | :--- |
| **`T-09`** | [**#3**](https://github.com/chicogong/aimake-creator/issues/3) | `P1` | `Ready` | `src/speech/providers.ts` · `src/speech/synthesize-deck.ts`<br>规范：[`2026-11-24-rfc-local-voice-cloning-tts.md`](./proposals/2026-11-24-rfc-local-voice-cloning-tts.md) | 新增 `mlxAudioSpeechProvider`（`Kokoro-82M`/`Qwen3-TTS`/`CosyVoice 2`）+ `glossary.yaml` 映射 + BGM `-22dB` Ducking；保留分片 SHA-256 缓存复用。<br>**验证**：`tests/speech-and-revision.test.ts` 全绿 |
| **`T-10`** | [**#14**](https://github.com/chicogong/aimake-creator/issues/14) | `P1` | `Ready` | `src/intake/` · `src/cli.ts`<br>调研：[`2026-11-24-autoclip-deep-dive-and-cross-pollination.md`](./research/2026-11-24-autoclip-deep-dive-and-cross-pollination.md) | 通过 MCP 桥接本机 `autoclip-mcp`，实现长视频 URL → 高光切片字幕入库 `sources/` → 编译图文/PPTX/Bento 卡端到端串联；吸收前 1.5s 峰值与两行具名标题规范。 |
| **`T-11`** | [**#22**](https://github.com/chicogong/aimake-creator/issues/22) | `P2` | `Ready` | `src/intake/` · `src/cli.ts` | 新增可选 `Aria2RpcDownloader`（对接 Ghost-Downloader-3 兼容 JSON-RPC）以支持 M3U8/B站高码率流媒体稳定摄入；带离线 mock 单测。 |
| **`T-12`** | [**#15**](https://github.com/chicogong/aimake-creator/issues/15) | `P1` | `Ready` | `src/radar/radar-engine.ts`<br>调研：[`2026-11-24-agent-native-ecosystem-and-tools-research.md`](./research/2026-11-24-agent-native-ecosystem-and-tools-research.md) | 为 Trend Radar 引入多源真实互动与预测加权（Reddit/HN/Polymarket/GitHub/YouTube 逐字稿），彻底剔除 SEO 内容，并在单测中防外网超时波动。 |
| **`T-13`** | [**#11**](https://github.com/chicogong/aimake-creator/issues/11) | `P1` | `Ready` | `src/wiki/` · `src/workspace/` · `src/sanitizer/`<br>规范：[`2026-11-24-rfc-knowledge-vault-connectors.md`](./proposals/2026-11-24-rfc-knowledge-vault-connectors.md) & [`2026-11-24-super-individual-creator-wiki-persona-assets.md`](./research/2026-11-24-super-individual-creator-wiki-persona-assets.md) | 落地 Obsidian 零拷贝连接、飞书/Notion/Readwise 单向增量拉取（含受管区域）+ Persona 风格 DNA (`<=800 tokens`) 克隆引擎。 |
| **`T-20`** | [**#25**](https://github.com/chicogong/aimake-creator/issues/25) | `P1` | `Ready` | `src/renderer/deck-parser.ts` · `src/renderer/html-compiler.ts`<br>蓝图：[`NORTH_STAR_TOP_TIER_BLUEPRINT.md`](./NORTH_STAR_TOP_TIER_BLUEPRINT.md) | 升级 **Deck AST v2**：原生图文/生图槽位 (`gen://`)、GFM 表格、确定性离线 SVG 图表 (`chart`)、多栏网格 (`grid`/`steps`/`timeline`)、Excalidraw 矢量嵌入及 `aimake lint` 布局溢出质检器。 |

---

## 五、 Sprint 4：`v2.3.0` Studio 前端模块化、Tauri 2 桌面端与 CDP 发布（截止 `2027-03-14`）

| 任务 ID | Issue | 优先级 | 现状 | 目标文件 / 模块 & 规范引用 | 验收标准与验证命令 |
| :--- | :--- | :---: | :---: | :--- | :--- |
| **`T-14`** | [**#20**](https://github.com/chicogong/aimake-creator/issues/20) | `P1` | `Ready` | `src/studio/calm-ui/` · `src/studio/studio-server.ts` · `src/site/`<br>规范：[`UI_DESIGN_SYSTEM.md`](./design/UI_DESIGN_SYSTEM.md) | 抽取 `tokens.css` 与模块化 TypeScript Calm Studio UI 消除内联字符串盲区；Playground 复用核心编译器；补齐 Studio 四语种 UI、Undo/Redo、幻灯片拖拽重排、异步导出 `progress/eta/cancel`；按域拆分 2k+ LOC 大文件。 |
| **`T-15`** | [**#5**](https://github.com/chicogong/aimake-creator/issues/5) & [**#21**](https://github.com/chicogong/aimake-creator/issues/21) | `P1` | `In Progress` (`#5`) | `desktop/` · `scripts/build-macos-*.mjs` · `.github/workflows/desktop.yml` | 短期实现 macOS 内置便携 Node 运行时与 Developer ID 公证支持；中期完成 Tauri 2 (Rust + Sidecar + updater) 跨平台（macOS/Windows/Linux）原型验证与切换评审。 |
| **`T-16`** | [**#4**](https://github.com/chicogong/aimake-creator/issues/4) | `P1` | `Ready` | `src/publisher/browser-publisher.ts`<br>规范：[`2026-11-24-rfc-cdp-draft-publisher.md`](./proposals/2026-11-24-rfc-cdp-draft-publisher.md) | 拆分为多平台 `PlatformDraftAdapter`（公众号/小红书/知乎/掘金/X/LinkedIn），仅填充本机已登录草稿并强制 `pr-sanitizer` 前检，附带离线 Mock DOM E2E。 |
| **`T-17`** | [**#2**](https://github.com/chicogong/aimake-creator/issues/2) | `P2` | `Ready` | `templates/` · `src/marketplace/` | 开放社区设计模板提交通道与 `aimake share` SHA-256 验签清单自动化验证流水线。 |

---

## 六、 推荐并行启动批次（Zero File Conflict）

如需立即开启 3 个并行子会话或 Agent 推进 `v2.0.1` 紧急修复，以下三项互不修改同一文件，可**安全零冲突并行**：
- **Agent A → `T-01` (#17)**：`desktop/macos/AimakeApp.swift` + `src/studio/calm-ui/script.ts`（Swift 桥接与菜单修复）
- **Agent B → `T-02` (#18)**：`src/renderer/capcut-draft-builder.ts` + `src/renderer/exporter-media.ts` + `src/mcp/mcp-server.ts` + `tests/capcut-draft.test.ts`
- **Agent C → `T-03` (#19)**：`src/studio/studio-server.ts`（CSRF 防护）+ `src/studio/calm-ui/markup.ts`（去除硬编码 `W47`）
