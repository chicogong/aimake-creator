# Aimake 全渠道宣发与开源推广媒体套件 (Launch & Promotion Kit)

> **发布代号**：`Aimake 2.0 "Calm Flywheel"`  
> **开源协议**：Apache-2.0 · 100% Local-First & Zero-Cloud Telemetry  
> **官方主页**：[https://aimake.cc](https://aimake.cc)  
> **代码仓库**：[https://github.com/chicogong/aimake-creator](https://github.com/chicogong/aimake-creator)  

---

## 目录索引
1. [品牌定位与一句话 Slogan](#1-品牌定位与一句话-slogan)
2. [GitHub Release 官方发布公告 (v2.0.0)](#2-github-release-官方发布公告-v200)
3. [X (Twitter) 连击发布串 (Launch Thread)](#3-x-twitter-连击发布串-launch-thread)
4. [微信公众号深度宣发长文 (Editorial Article)](#4-微信公众号深度宣发长文-editorial-article)
5. [小红书 & 即刻 3:4 视觉图文速记卡文案](#5-小红书--即刻-34-视觉图文速记卡文案)
6. [开发者技术社区发布稿 (V2EX / 掘金 / 知乎专栏)](#6-开发者技术社区发布稿-v2ex--掘金--知乎专栏)
7. [海外产品榜发布 (Hacker News Show HN & Product Hunt)](#7-海外产品榜发布-hacker-news-show-hn--product-hunt)

---

## 1. 品牌定位与一句话 Slogan

### 核心主张
**拒绝云端订阅绑架、拒绝千篇一律的 AI 腔调、拒绝不可编辑的拼贴死图。**  
Aimake 是一套将**「素材抓取 (Intake) → 知识萃取 (Distill) → 参数化创作 (Create) → 全域分发 (Publish)」**闭环收敛于本地的创作者引擎。

### 一句话 Slogan
- **中文（开发者/创作者视角）**：
  > 跑完超 1000 亿 Token 后，我把超级个体的全套创作飞轮开源了：一个 100% 运行在本地的多模态工坊与 CLI。
- **中文（产品功效视角）**：
  > 从 X 推文、微信文章与数据表格，到公众号富文本、原生可编辑 PPTX 与 3x 超清图组，只需 80ms 确定性编译。
- **英文 (Global Tagline)**：
  > Aimake — The Local-First Multimodal Creative Flywheel. Distilling 100B+ tokens of real-world research into WeChat HTML, native editable PPTX, and 3x Retina decks in 80ms.

---

## 2. GitHub Release 官方发布公告 (v2.0.0)

```markdown
# Release v2.0.0: The Calm Flywheel — Local-First Multimodal Creation Engine & Universal Intake

We are thrilled to officially open-source **Aimake 2.0**! 

Aimake started as an internal creative system used to distill over 100 Billion (1000 亿+) real-world LLM tokens into high-impact presentation decks, technical reports, and viral social cards. Today, we're giving the entire engine to the open-source community under Apache-2.0.

### 🌟 What's New in v2.0.0

1. **Universal Multi-Platform Intake Engine (`src/intake/`)**:
   - **X (Twitter) Zero-Auth Ingestion**: Ingest tweets, author profiles, likes/retweets metrics, and quote tweets with 0 API keys via global Edge API (`api.fxtwitter.com`) with Jina Reader fallback.
   - **WeChat Official Accounts (`mp.weixin.qq.com`)**: Bypass anti-hotlinking by normalizing dynamic `data-src` images into standard Markdown.
   - **CSV/Excel Spreadsheets to Bento Metrics**: Auto-extract high-contrast numeric metrics (`value`, `label`, `delta`) into ````metric` blocks for instant presentation slides.
   - **Video/Voice Transcripts (VTT/SRT)**: Strip microsecond timestamp clutter and cluster speech into coherent paragraphs anchored by time coordinates (`[01:23]`).

2. **The 4-Stage Creative Flywheel (`aimake pipeline`)**:
   - `aimake intake <sources...>`: Stage ① Intake & Scrapers
   - `aimake distill [topic]`: Stage ② Karpathy LLM Wiki Bounded Distillation (<= 3000 tokens)
   - `aimake create [prompt]`: Stage ③ Storyboard Composition with 36 2026 Trending Templates
   - `aimake publish <file>`: Stage ④ Omni-Channel Packaging (WeChat, Zhihu, Juejin, Xiaohongshu)

3. **1-Source to 5-Native Deliverables Compiler**:
   - **WeChat HTML**: 100% inline CSS, text/html + text/plain dual-MIME clipboard.
   - **PowerPoint (PPTX)**: Real editable Microsoft OOXML text boxes and vector shapes (powered by PptxGenJS).
   - **Social Graphics**: 3x Retina PNGs (16:9, 3:4, 1:1, 9:16).
   - **High-Density PDF**: Vector executive briefs.
   - **Motion Video**: 60fps frame-accurate MP4 with subtitles and speech audio.

4. **16 Atomic MCP Tools & Native IDE Integrations**:
   - Full MCP Server (`aimake mcp`) for Claude Desktop, Claude Code, Cursor, Google Antigravity (AGY), and Tencent WorkBuddy (CodeBuddy).
   - 7 materialized preset skills with zero symlinks and zero global directory pollution.

5. **100% Local-First & Zero-Cloud Telemetry**:
   - 127.0.0.1 sandbox execution.
   - Complete offline compilation support.
   - Private Ollama / LM Studio plug-and-play.

### 🚀 Quick Start

```bash
# Launch interactive onboarding wizard
npx aimake wizard

# Or install globally
npm install -g aimake
aimake studio
```
```

---

## 3. X (Twitter) 连击发布串 (Launch Thread)

### [Tweet 1: The Hook 🪝]
市面上的 AI 创作工具都在逼你做三件事：
1. 把你的未公开点子与笔记上传到他们的云端数据库；
2. 每月支付 $30 订阅费，换来充满「不仅如此、值得注意的是」的 AI 废话腔；
3. 导出拼贴在一起的「死图」，错了一个标点就得全盘推倒。

今天，我们正式开源 **Aimake (爱创)** —— 跑完超 1000 亿 Token 后沉淀的「纯本地端到端创作飞轮」。

100% 开源 / 本地优先 / 零凭证抓取 / 80ms 确定性编译 🧵👇

---

### [Tweet 2: 架构解耦 🧩]
为什么大多数 AI 生成幻灯片既慢又难用？
因为他们把「排版计算」和「逻辑推理」混在一起塞给了大模型。

Aimake 确立了三层解耦架构：
⚙️ **确定性计算下沉到 CLI**：毫秒级文件 I/O、图片转码、矢量编译、PPTX 生成；
🧠 **认知推理上浮到 Agent Skill**：结构化提炼、去 AI 味校准、多轮改稿；
🔌 **外部互联收敛到 MCP**：16 大原子工具，为 Claude、Cursor、AGY 即插即用。

---

### [Tweet 3: 零凭证素材摄入 (Stage 1 Intake) 📥]
创作不是凭空捏造，而是事实重组。
传统的抓取痛点：X API 收费离谱、微信公众号图片防盗链、Excel 表格丢结构。

Aimake 内置多源抓取引擎：
• **X (Twitter)**：利用边缘 API，零 Key / 零登录提取推文全文、高赞转推数据、超清配图与引用推文；
• **微信公众号**：自动清洗 `data-src` 懒加载图片；
• **CSV/Excel**：自动探测关键指标，秒级转为 Bento Grid 数值卡片；
• **字幕/录音 (VTT/SRT)**：剥离时间戳噪点，聚类为带时间锚点的发言人段落。

```bash
aimake intake "https://x.com/karpathy/status/1753123456789012345"
```

---

### [Tweet 4: 知识复利与去 AI 味 (Stage 2 Distill) 🧪]
写得越多，AI 越聪明，而不是上下文越臃肿。

Aimake 深度复刻 Andrej Karpathy LLM Wiki 架构：
1. 强制 $\le 3000$ Token 单篇预算，杜绝模型注意力涣散；
2. 引入 `cite: file#L12` 行级真实出处锚点，卡片角标可溯源，彻底消除事实幻觉；
3. 内置中/英/日/韩 4 语种 Humanizer，剔除 120+ 常见 AI 公文废话与套话。

---

### [Tweet 5: 2026 趋势美学与沉浸工坊 (Stage 3 Create) 🎨]
告别千篇一律的模板：
• 36 套参数化前沿模板（Apple 极简 Bento、瑞士网格排印、赛博霓虹、复古 Risograph）；
• 1px 发丝微边框、`-0.035em` 负字距微排印、多层景深与深色暗夜拟态；
• Studio 对话面板内置并排（Side-by-side）与内联（Inline）差异对比，修改一键应用，改坏一键秒级快照回滚。

---

### [Tweet 6: 一份原稿，五种原生交付物 (Stage 4 Publish) 🚀]
写一份纯文本 `.deck.md`，80ms 内同步直出：
1. **微信公众号**：100% 内嵌 CSS 富文本，剪贴板同时写入 `text/html` + `text/plain`，微信后台秒贴；
2. **商业演示 PPTX**：使用 PptxGenJS，生成双击可编辑的微软原生 OOXML 矢量形状与文本框（拒绝截图拼贴！）；
3. **小红书 / Instagram**：3x 视网膜高清图组（3:4 / 16:9 / 1:1）；
4. **决策白皮书**：矢量超清 PDF；
5. **动效短视频**：60fps 逐帧动画 H.264 MP4，自带口播旁白与字幕。

---

### [Tweet 7: 多宿主生态与零全局污染 🛡️]
无论你用什么工具，Aimake 都能无缝融入：
• **Tencent WorkBuddy (CodeBuddy)**：企业微信与内部 IDE 零配置适配；
• **Claude Desktop & Claude Code**：原生插件清单与 Slash 命令支持；
• **Cursor / VSCode / Google AGY**：标准 stdio MCP 协议，16 大原子工具即开即用；
• **物理自包含**：所有 7 大预设 Skill 实体化置于项目目录，绝不在全局 `~/.` 留下软链接垃圾。

---

### [Tweet 8: 100% 离线与数据主权 🔒]
你的灵感、草稿和未发布产品方案，属于你一个人。
• 默认监听 `127.0.0.1` 本地回环；
• 零外部数据回传、零遥测埋点；
• 拔掉网线，所有排版、编译与图片导出功能照常运转；
• 原生支持私有化 Ollama / LM Studio 本地大模型。

---

### [Tweet 9: 立即体验 🌟]
项目完全开源，采用 Apache-2.0 协议：

🔗 官网直达（含在线工坊与交互终端）：https://aimake.cc  
📦 GitHub 源码：https://github.com/chicogong/aimake-creator  

一行命令立即拉起交互式向导：
```bash
npx aimake wizard
```

如果对你的独立创作或团队内容工作流有启发，欢迎给个 Star ⭐️ 支持！

---

## 4. 微信公众号深度宣发长文 (Editorial Article)

### 备选标题
- 《跑完超 1000 亿 Token 后：超级个体的纯本地创作飞轮（全套开源）》
- 《告别排版内耗：为什么我不推荐你再用 Figma 或云端 AI 做 PPT？》
- 《80 毫秒生成原生 PPTX 与公众号排版：我们开源了 Aimake》

### 导语设计
> “创作最大的阻力，从来不是缺少灵感，而是从零碎点子到最终发布之间那道令人精疲力竭的排版与搬运深渊。”

### 文章核心大纲与金句提炼
1. **困境：云端 AI 工具为什么越用越累？**
   - 隐私顾虑：未公开的业务数据不敢往网页端塞；
   - 格式壁垒：导出的 PPT 全是一张张无法二次编辑的死图片；
   - 语气失真：生成的文章充满大模型浓重的公文翻译腔。
2. **破局：确定性计算与认知推理的彻底解耦**
   - 算力的归算力，推理的归推理；
   - 为什么让 LLM 算 CSS 像素是对 Token 最大的浪费？
   - Aimake 架构全景图展示（CLI + Skill + MCP）。
3. **实录：四步走完一个爆款选题的生命周期**
   - **Step 1：素材无感摄入**（展示抓取 X 推文、微信研报与 CSV 跑分表的截图）；
   - **Step 2：Karpathy Wiki 蒸馏**（展示 $\le 3000$ Token 上下文控限与 `cite:` 溯源坐标）；
   - **Step 3：Bento 风格交互排版**（展示 1px 发丝边框、负字距排版与 Diff 改稿对比）；
   - **Step 4：全域一键分发**（展示微信后台秒贴效果、PPTX 双击编辑文字效果）。
4. **极客与商业的交集：100% 本地优先**
   - 离线可跑、私有模型兼容、零云端遥测；
   - 支持 Claude Code、Cursor、WorkBuddy 协同。
5. **开源与获取方式**
   - 提供 GitHub 链接、官网直达方式与快速体验命令。

---

## 5. 小红书 & 即刻 3:4 视觉图文速记卡文案

### 推荐视觉规格
- 宽高比：`3:4`（小红书黄金排版比例）
- 推荐模版：`templates/xhs-swiss-grid` 或 `templates/apple-bento-launch`

### 卡片轮播编排 (5 张图结构)
- **Cover (第 1 张 · 封面卡)**：
  - 眉标：`OPEN SOURCE 2026`
  - 主标题：**超级个体的纯本地创作飞轮**
  - 副标题：跑完超 1000 亿 Token 后，我把自用的全套排版与分发工具开源了
  - 核心标签：`100% Local-First` · `80ms 原生编译` · `0 云端数据外泄`
- **Slide 2 (第 2 张 · 痛点与解法)**：
  - 标题：**为什么拒绝传统 AI 创作工具？**
  - 左右对比（````compare`）：
    - 传统云端工具：死图导出不可改 / 每月高昂订阅 / 浓重 AI 腔调 / 数据上传云端
    - Aimake 本地飞轮：双击可编辑 PPTX / 纯本地免费开源 / 4 语种去 AI 味 / 断网亦可编译
- **Slide 3 (第 3 张 · 飞轮四步法)**：
  - 标题：**四步闭环：从碎片素材到全网发布**
  - 四格 Bento 卡片：
    - ① 零凭证抓取：X 动态 / 微信长文 / CSV 表格 / 语音字幕
    - ② Karpathy 蒸馏：$\le 3000$ Token 预算，`cite:` 出处溯源
    - ③ 2026 美学排版：36 套大厂模版，苹果 Bento 视觉，Diff 无损改稿
    - ④ 1 稿 5 投：微信公众号 / 3x 超清图组 / 矢量 PPTX / 60fps 短视频
- **Slide 4 (第 4 张 · 核心特性矩阵)**：
  - 标题：**极客细节：给创作者的极致尊重**
  - 列表项：
    - ⚡️ 80ms 极速冷启动
    - 🛡️ 7 大专属 Agent Skills 自包含，绝不污染全局目录
    - 🔌 完美兼容 Cursor / Claude Code / WorkBuddy / AGY
    - 🔒 127.0.0.1 本地回环，支持本地私有模型 Ollama
- **Slide 5 (第 5 张 · 结尾与行动呼吁)**：
  - 标题：**开源发布 · 现已开放**
  - 交互提示：
    - 官网体验：`aimake.cc`
    - GitHub：`github.com/chicogong/aimake-creator`
    - 终端尝鲜：`npx aimake wizard`

### 社交平台文案与标签
```text
做自媒体和技术创作最痛苦的，不是没有选题，而是排版搬运整整耗费半天！
今天把我们团队自用的全套本地创作引擎 Aimake 正式开源了。

从 X 大佬推文、微信长文、业务表格一键提取，自动用 2026 趋势 Bento 风格排版，
80 毫秒直出微信公众号富文本、双击可编辑的微软 PPTX 和 3x 视网膜高清图！
全程跑在自己电脑上，断网也能用，彻底杜绝数据隐私泄露。

代码全部开源，欢迎自取～

#开源项目 #独立开发 #自媒体运营 #生产力工具 #PPT排版 #排版设计 #Claude #Cursor #副业搞钱 #工作效率提升
```

---

## 6. 开发者技术社区发布稿 (V2EX / 掘金 / 知乎专栏)

### 帖子标题
`[开源] Aimake 2.0: 跑完超 1000 亿 Token 后，我们开源了纯本地多模态创作工坊与 CLI`

### 技术细节亮点
- **拒绝大模型算 CSS**：排版是一门确定性的视觉数学，字阶比、行距、发丝边框与安全间距应当交给经过验证的参数化模板，LLM 仅负责意图理解与提炼；
- **Zero-Global-Pollution（零全局污染）**：绝不通过全局 symlink 把文件扔进 `~/.agents`，所有工作区 Skill 物理实体化并由版本控制纳管；
- **真实可编辑 PPTX 生成引擎**：不依赖已废弃的无头 Office，纯 TypeScript 驱动 PptxGenJS 构建符合 ECMA-376 标准的微软 OOXML 矢量流；
- **标准 MCP 协议支持**：16 大原子工具，完整支持 JSON-RPC 2.0，为 Agent 带来真实的本地工作区操作手脚。

---

## 7. 海外产品榜发布 (Hacker News Show HN & Product Hunt)

### Show HN
**Title**: `Show HN: Aimake – Local-first multimodal creative engine from X/CSVs to PPTX & HTML`

**Post Body**:
```text
Hey HN,

We built and just open-sourced Aimake (https://github.com/chicogong/aimake-creator), a local-first creative flywheel designed for builders, researchers, and technical creators.

Existing tools often require uploading unpublished drafts to cloud databases, lock you into subscriptions, and export static, uneditable flat images.

Aimake decouples cognitive distillation from deterministic layout:
1. Universal Intake: Zero-auth edge scrapers for X (Twitter) threads, clean Markdown parsers for web articles, and automatic Bento metric extraction for CSV/Excel tables.
2. Grounded Distillation: Follows Andrej Karpathy's LLM Wiki philosophy, keeping single-card budgets <= 3,000 tokens with cite: [file#line] line-level coordinates to eradicate hallucinations.
3. Parametric Design: 36 built-in templates (Apple Bento, Swiss Typography, Neon Tech) compiling to real editable Microsoft PowerPoint (PPTX) with OOXML vector text boxes, 3x Retina PNG cards, clean inline HTML, and 60fps MP4 video in ~80ms.
4. Extensibility: 16 atomic Model Context Protocol (MCP) tools for Claude Code, Cursor, and AGY.

Zero cloud telemetry, runs at 127.0.0.1, offline-ready.

We'd love your feedback!
```

### Product Hunt
- **Product Name**: Aimake 2.0
- **Tagline**: The Local-First Multimodal Creative Flywheel
- **Pricing**: Free & Open Source (Apache-2.0)
- **First Comment**: Introduces the journey, the frustration with cloud subscription tools, and highlights the zero-cloud local-first privacy commitment.
