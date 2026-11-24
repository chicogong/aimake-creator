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

## 二、 Sprint 1：`v2.0.1` 紧急阻塞修复与安全加固（已交付并合入 main）

| 任务 ID | Issue | 优先级 | 现状 | 目标文件 / 模块 | 验收标准与验证命令 |
| :--- | :--- | :---: | :---: | :--- | :--- |
| **`T-01`** | [**#17**](https://github.com/chicogong/aimake-creator/issues/17) | `P0` | `Done` | `desktop/macos/AimakeApp.swift:221,232-254,386,930`<br>`src/studio/calm-ui/script.ts:103,1900` | 统一 AppKit 原生桥接通道名称为 `aimakeNative`；释放 `⌘K` 给命令面板并迁移桌面快捷键至 `⇧⌘K`；更新菜单栏项。<br>**验证**：全量单元与端到端测试 100% 通过。 |
| **`T-02`** | [**#18**](https://github.com/chicogong/aimake-creator/issues/18) | `P0` | `Done` | `src/studio/studio-server.ts:1650`<br>`src/renderer/exporter-media.ts:425`<br>`src/renderer/capcut-draft-builder.ts:388,548`<br>`src/mcp/mcp-server.ts:183`<br>`src/cli.ts:925` | 彻底移除 1x1 占位图，强制导出真实幻灯片 PNG；`installLocal` 支持资产路径重写与深层拷贝；MCP 格式支持 `'capcut'`。<br>**验证**：`tests/capcut-draft.test.ts` 6 项测试全绿。 |
| **`T-03`** | [**#19**](https://github.com/chicogong/aimake-creator/issues/19) | `P1` | `Done` | `src/studio/studio-server.ts:758-769`<br>`src/studio/calm-ui/markup.ts:81`<br>`src/renderer/exporter-media.ts:208,245,257` | 为本地 Studio 服务端实装 `Origin` 与 `Sec-Fetch-Site` 严格 CSRF 拦截；边栏灵感雷达动态响应条数；音频接入 -14 LUFS 响度标准化。<br>**验证**：`tests/studio-csrf.test.ts` 10 项测试全绿。 |
| **`T-18`** | [**#23**](https://github.com/chicogong/aimake-creator/issues/23) | `P1` | `Done` | `src/studio/calm-ui/markup.ts:142-160`<br>`src/site/playground-builder.ts` · `src/site/site-builder.ts` | 消除 Studio 顶部悬浮胶囊卡滞；精简底部控制栏为层级 Dock；统一 Playground 与 Studio 模板渲染表现与数字换行；补齐 36 套模板封面。<br>**验证**：全站静态构建与页面渲染全绿。 |

---

## 三、 Sprint 2：`v2.1.0` 核心稳定性、CapCut 完结、ACP 与 CLI-Hub（已交付并合入 main）

| 任务 ID | Issue | 优先级 | 现状 | 目标文件 / 模块 & 规范引用 | 验收标准与验证命令 |
| :--- | :--- | :---: | :---: | :--- | :--- |
| **`T-04`** | [**#10**](https://github.com/chicogong/aimake-creator/issues/10) | `P1` | `Done` | `src/renderer/capcut-draft-builder.ts`<br>规范：[`2026-11-24-capcut-draft-and-timeline-engine.md`](./research/2026-11-24-capcut-draft-and-timeline-engine.md) | 实装 6 轨标准时间线拓扑结构（卡片底轨、画中画、主标题、逐字口播字幕、人声音频、BGM）；实现微秒级整数绝对时间对齐与本地草稿直读。<br>**验证**：剪映草稿规范断言全绿。 |
| **`T-05`** | [**#13**](https://github.com/chicogong/aimake-creator/issues/13) | `P1` | `Done` | `src/renderer/exporter-media.ts:166-182,277-335` | 采用累计时间戳差值法计算各页帧数（`computeCumulativeSlideFrames`），将长视频音画漂移锁定在 0.5 帧内；增加素材与字体预加载门禁；接入 macOS 硬件编码加速探测。<br>**验证**：`tests/video-sync.test.ts` 9 项测试全绿。 |
| **`T-06`** | [**#9**](https://github.com/chicogong/aimake-creator/issues/9) | `P1` | `Done` | `src/acp/`（新建）· `src/cli.ts`<br>规范：[`2026-11-24-rfc-acp-protocol-integration.md`](./proposals/2026-11-24-rfc-acp-protocol-integration.md) | 实现标准 Agent Client Protocol 服务端；支持 Stdio JSON-RPC 2.0 双向流、`initialize`、`session/new`、`session/prompt` 流式推送与会话取消。<br>**验证**：`tests/acp-server.test.ts` 14 项测试全绿。 |
| **`T-07`** | [**#16**](https://github.com/chicogong/aimake-creator/issues/16) | `P1` | `Done` | `src/cli.ts` · `skills/aimake/SKILL.md`<br>调研：[`2026-11-24-agent-native-ecosystem-and-tools-research.md`](./research/2026-11-24-agent-native-ecosystem-and-tools-research.md) | 统一规范 5 级语义化退出码（0/1/2/3/4）；实现全部命令 `--json` 机器可读纯净响应信封；对齐 HKUDS/CLI-Anything 接入标准。<br>**验证**：`tests/cli-hub.test.ts` 25 项测试全绿。 |
| **`T-08`** | [**#12**](https://github.com/chicogong/aimake-creator/issues/12) | `P2` | `Done` | `tests/conformance-contract.test.ts`<br>`tests/acp-conformance.test.ts`<br>`tests/capcut-schema.test.ts` | 落地端到端契约测试集，覆盖 ACP 握手生命周期、Studio SSE 实时推送、CapCut 6 轨微秒级契约与 CLI-Hub 响应规范。<br>**验证**：`npx vitest run tests/conformance-contract.test.ts` 全绿。 |
| **`T-19`** | [**#24**](https://github.com/chicogong/aimake-creator/issues/24) | `P1` | `Done` | `src/renderer/exporter-pptx.ts` · `src/templates/index.ts`<br>蓝图：[`NORTH_STAR_TOP_TIER_BLUEPRINT.md`](./NORTH_STAR_TOP_TIER_BLUEPRINT.md) | 基于 Visual IR 架构重构 PPTX 导出器：对齐全部 36 款模板 CSS 色板；支持 5 种画幅自适应计算；高保真嵌入 3x High-DPI Mermaid 流程图与自适应原生表格。<br>**验证**：`tests/pptx-visual-ir.test.ts` 16 项测试全绿。 |

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
