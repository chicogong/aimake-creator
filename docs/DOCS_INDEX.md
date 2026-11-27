# Aimake Studio 文档索引

## 桌面端与样稿

- [桌面端快速上手](../README.zh-CN.md#开始使用)说明安装方式、工作区和导出依赖。
- [Open Bench 样稿](../examples/open-bench/README.md)包含演示文稿、竖版借用卡、封面素材和来源笔记。
- [桌面端体验讨论](https://github.com/chicogong/aimake-creator/discussions/47)汇总桌面实测与原生窗口截图。
- [采集与分发方案](https://github.com/chicogong/aimake-creator/discussions/58)跟踪定时采集、分平台草稿与发布回执的规划。[项目看板](https://github.com/users/chicogong/projects/3)

## 一、 治理、审计与任务看板 (Governance, Audit & Backlog)

| 文档 | 核心内容与用途 | 当前状态 |
| :--- | :--- | :--- |
| [**NORTH_STAR_TOP_TIER_BLUEPRINT.md**](./NORTH_STAR_TOP_TIER_BLUEPRINT.md) | **顶流项目北极星蓝图**：UI 视觉工艺实测复盘、Deck AST v2、Visual IR 与平台化架构 | `Active` |
| [**AGENTS.md**](../AGENTS.md) | 仓库核心架构不变量、MIT 开源安全守则与 `pnpm verify` 验证流程 | `Active` |
| [**PRODUCT_AUDIT_AND_ARCHITECTURE_2026.md**](./PRODUCT_AUDIT_AND_ARCHITECTURE_2026.md) | **全栈产品审计报告**：P0/P1 代码缺陷定位、模块化债务盘点、开源对标与演进蓝图 | `Active` |
| [**BACKLOG_AND_AGENT_TASKS.md**](./BACKLOG_AND_AGENT_TASKS.md) | **多 Agent 可认领任务总看板**：按 `v2.0.1`–`v2.3.0` 分排的 TODO、精确目标文件与验收命令 | `Active` |
| [**ROADMAP-2.0.md**](./ROADMAP-2.0.md) | 对齐 GitHub 4 大里程碑（`v2.0.1` → `v2.3.0`）的开源演进路线图 | `Active` |
| [**ACCEPTANCE-1.0.md**](./ACCEPTANCE-1.0.md) | Aimake 1.0 基线功能与语音/修订能力验收记录 | `Reference` |

---

## 二、 设计系统与架构规范 (Design System & Architecture)

| 文档 | 核心内容与用途 | 当前状态 |
| :--- | :--- | :--- |
| [**design/UI_DESIGN_SYSTEM.md**](./design/UI_DESIGN_SYSTEM.md) | **四端统一 UI 设计系统**：Showcase/Atelier 双面色板、CSS Tokens、四语种断行、快捷键与增量组件 | `Active` |
| [**ARCHITECTURE.md**](./ARCHITECTURE.md) | Aimake Studio 旗舰工坊、核心引擎与 ACP/MCP 协议栈全景架构 | `Active` |
| [**AIMAKE_2_0_CALM_WORKSPACE_DESIGN.md**](./AIMAKE_2_0_CALM_WORKSPACE_DESIGN.md) | 2.0 Calm Studio 沉浸式单窗工作台与工作区 7 大预设 Skill 交互设计规范 | `Active` |
| [**INTAKE_ECOSYSTEM_RESEARCH.md**](./INTAKE_ECOSYSTEM_RESEARCH.md) | 多源素材（X、微信、表格、字幕）摄入架构与零凭证抓取技术设计 | `Active` |

---

## 三、 工程规范与协作指南 (Engineering Guides & Standards)

| 文档 | 核心内容与用途 | 当前状态 |
| :--- | :--- | :--- |
| [**guides/DEVELOPMENT_WORKFLOW.md**](./guides/DEVELOPMENT_WORKFLOW.md) · [**中文版**](./guides/DEVELOPMENT_WORKFLOW.zh-CN.md) | Issue 生命周期、Project #3 看板自动化、Git Worktree 隔离机制、`pnpm issue:create` 用法与分支/PR 规范 | `Active` |
| [**guides/TESTING_AND_ENGINEERING_STANDARDS.md**](./guides/TESTING_AND_ENGINEERING_STANDARDS.md) | 四层测试金字塔（Smoke / Vitest / 黑盒 / E2E）、秘密审计与代码质量准则 | `Active` |

---

## 四、 架构提案与 RFC (Proposals & RFCs)

| 文档 | 核心内容与用途 | 关联 Issue / 状态 |
| :--- | :--- | :--- |
| [**proposals/2026-11-24-rfc-acp-protocol-integration.md**](./proposals/2026-11-24-rfc-acp-protocol-integration.md) | Agent Client Protocol (ACP) 接入架构与双向 IDE（Zed / JetBrains / Cursor）协同规范 | [#9](https://github.com/chicogong/aimake-creator/issues/9) · `Proposed` |
| [**proposals/2026-11-24-rfc-local-voice-cloning-tts.md**](./proposals/2026-11-24-rfc-local-voice-cloning-tts.md) | Apple Silicon 端侧语音克隆与 TTS 合成引擎（`mlx-audio` / `Kokoro-82M` / `Qwen3-TTS` / `CosyVoice 2`） | [#3](https://github.com/chicogong/aimake-creator/issues/3) · `Proposed` |
| [**proposals/2026-11-24-rfc-cdp-draft-publisher.md**](./proposals/2026-11-24-rfc-cdp-draft-publisher.md) | 多平台无头 Chrome CDP 草稿填充架构（Human-in-the-Loop Draft Only 安全边界） | [#4](https://github.com/chicogong/aimake-creator/issues/4) · `Proposed` |
| [**proposals/2026-11-24-rfc-knowledge-vault-connectors.md**](./proposals/2026-11-24-rfc-knowledge-vault-connectors.md) | Obsidian / 飞书 (`lark-mcp`) / Notion / Readwise 知识库增量连接器与脱敏门禁规范 | [#11](https://github.com/chicogong/aimake-creator/issues/11) · `Proposed` |

---

## 五、 前沿开源调研报告 (Open-Source Deep-Dive Research)

| 文档 | 调研对象与核心洞察 | 关联 Issue / 状态 |
| :--- | :--- | :--- |
| [**research/2026-11-23-ai-video-motion-landscape.md**](./research/2026-11-23-ai-video-motion-landscape.md) | AI 动效引擎与开源视频合成技术版图调研（Remotion / Motion Canvas 等） | `Reference` |
| [**research/2026-11-24-capcut-draft-and-timeline-engine.md**](./research/2026-11-24-capcut-draft-and-timeline-engine.md) | 剪映 / CapCut `draft_content.json` 多轨草稿工程结构与时间轴引擎设计 | [#10](https://github.com/chicogong/aimake-creator/issues/10) · `Reference` |
| [**research/2026-11-24-super-individual-creator-wiki-persona-assets.md**](./research/2026-11-24-super-individual-creator-wiki-persona-assets.md) | 超级个体 Knowledge Vault 与风格 DNA (`personas/`) 私有数字资产架构 | [#11](https://github.com/chicogong/aimake-creator/issues/11) · `Proposed` |
| [**research/2026-11-24-autoclip-deep-dive-and-cross-pollination.md**](./research/2026-11-24-autoclip-deep-dive-and-cross-pollination.md) | `zhouxiaoka/autoclip` 架构、MCP 服务与 158 条短视频驱动因素实证拆解 | [#14](https://github.com/chicogong/aimake-creator/issues/14) · `Proposed` |
| [**research/2026-11-24-agent-native-ecosystem-and-tools-research.md**](./research/2026-11-24-agent-native-ecosystem-and-tools-research.md) | `Ghost-Downloader-3`、`last30days-skill` 与港大 `HKUDS/CLI-Anything` 协同方案 | [#15](https://github.com/chicogong/aimake-creator/issues/15) · [#16](https://github.com/chicogong/aimake-creator/issues/16) · [#22](https://github.com/chicogong/aimake-creator/issues/22) |

---

## 六、 品牌资产与发布推广 (Brand Kit & Promotions)

| 文档 | 核心内容与用途 |
| :--- | :--- |
| [**brand-kit/BRAND_GUIDELINES.md**](./brand-kit/BRAND_GUIDELINES.md) | Aimake 视觉识别系统、Creator Violet 主色系与矢量资产说明 |
| [**brand-kit/wordmarks/WORDMARKS.md**](./brand-kit/wordmarks/WORDMARKS.md) | Aimake 标志字与多场景组合规范 |
| [**LAUNCH_AND_PROMOTION_KIT.md**](./LAUNCH_AND_PROMOTION_KIT.md) | 全渠道发布物料包（X / 小红书 / 即刻 / 技术社区） |
| [**promotions/wechat-article-launch.md**](./promotions/wechat-article-launch.md) | 微信公众号开源发布深度长文成稿 |
