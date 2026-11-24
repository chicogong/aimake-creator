# Aimake Studio · 文档全景索引 (`docs/DOCS_INDEX.md`)

本索引统一维护 `products/aimake` 仓库的架构规范、审计报告、技术提案、开源调研、开发指南与品牌宣传资产。所有公开文档均严格遵守「零内部运维信息泄露」与「正面肯定直叙文风」准则。

---

## 一、 治理、审计与路线图 (Governance, Audit & Roadmap)

| 文档 | 核心内容与用途 | 当前状态 |
| :--- | :--- | :--- |
| [**AGENTS.md**](../AGENTS.md) | 仓库核心架构不变量、MIT 开源安全守则与 `pnpm verify` 门禁指令 | `Active` |
| [**PRODUCT_AUDIT_AND_ARCHITECTURE_2026.md**](./PRODUCT_AUDIT_AND_ARCHITECTURE_2026.md) | **全栈产品审计报告**：P0/P1 代码缺陷定位、模块化债务盘点、开源对标与演进蓝图 | `Active` |
| [**ROADMAP-2.0.md**](./ROADMAP-2.0.md) | 对齐 GitHub 4 大里程碑（`v2.0.1` → `v2.3.0`）的产品演进路线图 | `Active` |
| [**ACCEPTANCE-1.0.md**](./ACCEPTANCE-1.0.md) | Aimake 1.0 基线功能与语音/修订能力验收记录 | `Reference` |

---

## 二、 架构与交互设计规范 (Architecture & UX Design)

| 文档 | 核心内容与用途 | 当前状态 |
| :--- | :--- | :--- |
| [**ARCHITECTURE.md**](./ARCHITECTURE.md) | Aimake Studio 旗舰工坊、核心引擎与 ACP/MCP 协议栈全景架构 | `Active` |
| [**AIMAKE_2_0_CALM_WORKSPACE_DESIGN.md**](./AIMAKE_2_0_CALM_WORKSPACE_DESIGN.md) | 2.0 Calm Studio 沉浸式单窗工作台与工作区预设 Skill 交互设计规范 | `Active` |
| [**INTAKE_ECOSYSTEM_RESEARCH.md**](./INTAKE_ECOSYSTEM_RESEARCH.md) | 多源素材（X、微信、表格、字幕）摄入架构与零凭证抓取技术设计 | `Active` |

---

## 三、 工程规范与协作指南 (Engineering Guides & Standards)

| 文档 | 核心内容与用途 | 当前状态 |
| :--- | :--- | :--- |
| [**guides/DEVELOPMENT_WORKFLOW.md**](./guides/DEVELOPMENT_WORKFLOW.md) | Issue 生命周期、Project #3 看板自动化、分支命名、PR 规范与 `gh` 速查表 | `Active` |
| [**guides/TESTING_AND_ENGINEERING_STANDARDS.md**](./guides/TESTING_AND_ENGINEERING_STANDARDS.md) | 四层测试金字塔（Smoke / Vitest / 黑盒 / E2E）、秘密审计与代码质量准则 | `Active` |

---

## 四、 架构提案与 RFC (Proposals & RFCs)

| 文档 | 核心内容与用途 | 关联 Issue / 状态 |
| :--- | :--- | :--- |
| [**proposals/2026-11-24-rfc-acp-protocol-integration.md**](./proposals/2026-11-24-rfc-acp-protocol-integration.md) | Agent Client Protocol (ACP) 接入架构与双向 IDE 协同规范 | [#9](https://github.com/chicogong/aimake-creator/issues/9) · `Proposed` |

---

## 五、 前沿开源调研报告 (Open-Source Deep-Dive Research)

| 文档 | 调研对象与核心洞察 | 关联 Issue / 状态 |
| :--- | :--- | :--- |
| [**research/2026-11-23-ai-video-motion-landscape.md**](./research/2026-11-23-ai-video-motion-landscape.md) | AI 动效引擎与开源视频合成技术版图调研（Remotion / Motion Canvas 等） | `Reference` |
| [**research/2026-11-24-capcut-draft-and-timeline-engine.md**](./research/2026-11-24-capcut-draft-and-timeline-engine.md) | 剪映 / CapCut `draft_content.json` 多轨草稿工程结构与时间轴引擎设计 | [#10](https://github.com/chicogong/aimake-creator/issues/10) · `In Progress` |
| [**research/2026-11-24-super-individual-creator-wiki-persona-assets.md**](./research/2026-11-24-super-individual-creator-wiki-persona-assets.md) | 超级个体 Knowledge Vault 与风格 DNA (`personas/`) 私有数字资产架构 | [#11](https://github.com/chicogong/aimake-creator/issues/11) · `Proposed` |
| [**research/2026-11-24-autoclip-deep-dive-and-cross-pollination.md**](./research/2026-11-24-autoclip-deep-dive-and-cross-pollination.md) | `zhouxiaoka/autoclip` 架构、MCP 服务与 158 条短视频驱动因素实证拆解 | [#14](https://github.com/chicogong/aimake-creator/issues/14) · `Proposed` |
| [**research/2026-11-24-agent-native-ecosystem-and-tools-research.md**](./research/2026-11-24-agent-native-ecosystem-and-tools-research.md) | `Ghost-Downloader-3`、`last30days-skill` 与港大 `HKUDS/CLI-Anything` 协同方案 | [#15](https://github.com/chicogong/aimake-creator/issues/15) · [#16](https://github.com/chicogong/aimake-creator/issues/16) |

---

## 六、 品牌资产与发布推广 (Brand Kit & Promotions)

| 文档 | 核心内容与用途 |
| :--- | :--- |
| [**brand-kit/BRAND_GUIDELINES.md**](./brand-kit/BRAND_GUIDELINES.md) | Aimake 视觉识别系统、Creator Violet 主色系与规范用法 |
| [**brand-kit/wordmarks/WORDMARKS.md**](./brand-kit/wordmarks/WORDMARKS.md) | Aimake 标志字与多场景组合规范 |
| [**LAUNCH_AND_PROMOTION_KIT.md**](./LAUNCH_AND_PROMOTION_KIT.md) | 全渠道发布物料包（X / 小红书 / 即刻 / 技术社区） |
| [**promotions/wechat-article-launch.md**](./promotions/wechat-article-launch.md) | 微信公众号开源发布深度长文成稿 |
