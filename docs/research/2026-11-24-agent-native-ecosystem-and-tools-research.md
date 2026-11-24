# 2026 Agent-Native 生态技术调研与多仓协同报告

> **调研批次**：2026-11-24 专题调研  
> **归属工程**：`products/aimake`（Aimake Studio）& chicogong 跨仓技术底座  
> **核心对象**：
> 1. `XiaoYouChR/Ghost-Downloader-3`（全协议高速下载与嗅探器）
> 2. `mvanhorn/last30days-skill`（社区第一手热度与事实调研 Agent Skill）
> 3. `zhouxiaoka/autoclip`（长视频高光切片与内容重塑桌面工坊）
> 4. `HKUDS/CLI-Anything`（香港大学全软件 Agent-Native 化框架与 CLI-Hub）

---

## 一、 调研对象矩阵与核心指标概览

| 项目 / 工具 | GitHub Stars | 核心定位 | 核心架构与协议 | 对 Aimake 的核心借鉴价值 |
| :--- | :--- | :--- | :--- | :--- |
| **[Ghost-Downloader-3](https://github.com/XiaoYouChR/Ghost-Downloader-3)** | 16,875 ⭐ | 全协议全平台下载管理器与媒体嗅探器 | PySide6 / Qt + Python + TypeScript，HTTP/3、QUIC、M3U8、aria2 RPC | 补充 Stage 1 复杂流媒体（B站高码率、M3U8直播）的零凭证高抗封下载底座 |
| **[last30days-skill](https://github.com/mvanhorn/last30days-skill)** | 73,763 ⭐ | 过去 30 天跨社媒平台真实热度挖掘 Agent Skill | Python，跨 Reddit、X、HN、Polymarket、YouTube 转写并行搜索，Agent Skills 规范 | 升级 Aimake Trend Radar 灵感雷达，引入真实投票/押注加权与 YouTube 逐字稿挖掘 |
| **[autoclip](https://github.com/zhouxiaoka/autoclip)** | 活跃开源 | 长视频高光切片、AI 包装与全平台重塑桌面工具 | Tauri + FastAPI + FFmpeg + Faster-Whisper，PyPI `autoclip-mcp` | 建立长视频切片与 Aimake 1-to-5 多介质编译器的端到端串联；吸收 -14 LUFS 响度门禁 |
| **[CLI-Anything](https://github.com/HKUDS/CLI-Anything)** | 64,174 ⭐ | 将全球所有软件封装为 Agent-Native CLI 的框架 | Python (Click) + 7 阶段自动化流水线 + CLI-Hub 注册表 (`clianything.cc`) | 验证并坚定了 Aimake CLI-First 架构；指导 Aimake 接入 CLI-Hub 官方标准注册表 |

---

## 二、 各开源项目深度拆解与协同方案

### 1. XiaoYouChR/Ghost-Downloader-3：下载器的集大成者
- **核心能力**：
  - **多协议全覆盖**：支持 HTTP/HTTPS、BitTorrent/磁力链接、FTP、M3U8（含直播实时录制）、MPEG-DASH、eD2k；
  - **平台专属深度解析**：原生支持 Bilibili 与 YouTube 的画质选择、分集、音视频合并及字幕解析，支持 GitHub / HuggingFace 镜像加速；
  - **防封禁与无缝嗅探**：自带浏览器扩展嗅探网页音视频流，自动携带 Cookie 与请求头，底层采用真实浏览器 TLS 指纹模拟，有效突破反爬限制；
  - **开放 RPC 协议**：提供与 `aria2` 兼容的 JSON-RPC 接口，允许外部程序完全掌控下载任务。
- **与 Aimake 协同点**：
  - Aimake 的 `Stage 1 Intake` 目前以 X、微信网页与纯文本为主。针对带签名保护的 B 站长视频或多音轨视频，可桥接 Ghost-Downloader 的 aria2 RPC 服务作为外部素材下载引擎。

---

### 2. mvanhorn/last30days-skill：基于真实人类行为的 Agent 检索标杆
- **核心理念**：
  - 传统搜索引擎聚合的是编辑排版的网页（SEO 污染严重），`/last30days` 聚合的是**真实人类用点赞、真金白银押注（Polymarket）与代码提交（GitHub）投票的内容**。
- **数据源拓扑**：
  - **零配置开箱即用源**：Reddit（发帖与高赞讨论）、Hacker News、Polymarket（真实真金白银预测胜率）、GitHub（PR 合并速率与 Issue 活跃度）；
  - **多模态扩展源**：YouTube（通过 `yt-dlp` 抓取自动字幕提炼原话）、X (Twitter)、TikTok、Instagram Reels、Bluesky、arXiv 最新论文；
  - **分发生态**：已上架 Claude Code 官方插件市场（`/plugin install last30days`），同时支持 50+ 宿主环境通过 `npx skills add mvanhorn/last30days-skill -g` 全局装配。
- **与 Aimake 协同点**：
  - **灵感雷达（Trend Radar）算法升级**：Aimake 目前的雷达聚焦于技术热点。我们可将 `last30days` 的权重逻辑（点赞率过滤、真金白银预测数据加权、排除陈旧信息）直接引入 Aimake 的 `aimake radar` 引擎；
  - **素材原稿溯源增强**：借鉴其通过 YouTube 逐字稿直接抽取嘉宾可争论断言的技术，直接沉淀为 Aimake Karpathy LLM Wiki 中的概念卡片。

---

### 3. HKUDS/CLI-Anything：让全球软件具备 Agent 原生能力
- **核心理念**：
  - “Today's Software Serves Humans. Tomorrow's Users will be Agents.”
  - 坚决放弃脆弱、易跑偏的屏幕像素点击与 OCR 识别方案，主张将所有 GUI 软件、工业工具和云端 API 重构为结构化、确定性的命令行接口（CLI）。
- **7 阶段 Agent-Native 生成管线**：
  1. **Analyze**：分析目标软件的源码与功能映射；
  2. **Design**：设计清晰的命令组、子命令、状态机与输入输出契约；
  3. **Implement**：采用 Click 构建支持 REPL 交互与 `--json` 结构化输出的 CLI；
  4. **Plan Tests & Write Tests**：建立真实端到端产物断言（如验证生成的 3D 模型、PDF 或切片是否符合预期）；
  5. **Document & SKILL.md**：自动生成 `SKILL.md`，使 AI Agent 一秒掌握调用方式并发布到 `clianything.cc`。
- **与 Aimake 协同点**：
  - Aimake 从创立之初便坚持 **CLI-First** 与 **确定性编译（Deterministic AST Compiler）**，与港大 CLI-Anything 的核心哲学完全同频。
  - Aimake 将按照 CLI-Anything 规范，将 `aimake` 注册进 CLI-Hub，使全球使用 Claude Code、Cursor、OpenClaw 的开发者能够通过 `cli-hub install aimake` 瞬间调用 Aimake 的 36 套设计系统与 5 维编译能力。

---

## 三、 协同落地路线图

1. **[素材摄入层]** 结合 `Ghost-Downloader-3` 的嗅探与 RPC 架构，增强 Aimake 对复杂防盗链媒体流的抓取鲁棒性；
2. **[热度感知层]** 借鉴 `last30days-skill` 的多源真金白银与社区互动评分体系，赋能 Aimake 灵感雷达；
3. **[协议标准化]** 遵循 `HKUDS/CLI-Anything` 与 `autoclip` 的 Agent 规范，将 Aimake 的全套原子能力无缝开放至全球 Agent 宿主。
