# Aimake（爱创）— 纯本地多模态创作工作室与 CLI

<p align="center">
  <a href="https://aimake.cc"><img src="./dist-site/brand/icon-192.png" width="80" alt="Aimake Logo" /></a>
</p>

<p align="center">
  <strong>一份 Markdown 原稿，100% 纯本地直出 5 种原生交付格式。内置 36 套商业级参数化设计模板、Mermaid 离线矢量流程图、Highlight.js 代码高亮、7 大工作区闭环 AI Skill 与内置 AI Co-Pilot 副驾驶。</strong>
</p>

<p align="center">
  <a href="https://github.com/chicogong/aimake-creator/actions/workflows/ci.yml"><img src="https://github.com/chicogong/aimake-creator/actions/workflows/ci.yml/badge.svg" alt="CI 质量门禁" /></a>
  <a href="https://www.npmjs.com/package/aimake-studio"><img src="https://img.shields.io/npm/v/aimake-studio.svg?style=flat-square&color=blue" alt="npm version" /></a>
  <a href="./LICENSE"><img src="https://img.shields.io/badge/license-MIT-green.svg?style=flat-square" alt="license" /></a>
  <a href="https://nodejs.org"><img src="https://img.shields.io/badge/node-%3E%3D22.0.0-brightgreen.svg?style=flat-square" alt="node version" /></a>
  <a href="https://aimake.cc"><img src="https://img.shields.io/badge/官网-aimake.cc-0284c7.svg?style=flat-square" alt="website" /></a>
  <a href="https://github.com/chicogong/aimake-creator/projects"><img src="https://img.shields.io/badge/项目看板-经营与路线图-purple.svg?style=flat-square" alt="project board" /></a>
  <a href="https://aimake.cc/playground/"><img src="https://img.shields.io/badge/在线工坊-零安装秒开-purple.svg?style=flat-square" alt="playground" /></a>
  <a href="#"><img src="https://img.shields.io/badge/内置模板-36套商业体系-orange.svg?style=flat-square" alt="templates" /></a>
  <a href="#"><img src="https://img.shields.io/badge/数据隐私-100%25纯本地-success.svg?style=flat-square" alt="local-first" /></a>
</p>

<p align="center">
  <a href="./README.md">English</a> · <strong>简体中文</strong> · <a href="./README.ja.md">日本語</a> · <a href="./README.ko.md">한국어</a>
</p>

<p align="center">
  <img src="./docs/assets/studio-canvas.png" width="95%" alt="Aimake Calm Studio 可视化创作舞台" />
  <br />
  <em>Aimake Studio：纯本地所见即所得画板，悬浮毛玻璃状态条、双向全键盘漫游与触感幻灯片胶囊 Dock</em>
</p>

---

## ⚡️ 10 秒上手 CLI 与交互向导

```bash
# 直接拉起 @clack/prompts 交互式创作向导（无需繁琐配置）
npx aimake-studio

# 或全局安装（同时注册 `aimake` 与 `aimake-studio` 命令）
npm install -g aimake-studio
aimake wizard
```

免安装在线体验浏览器沙盒：**[https://aimake.cc/playground/](https://aimake.cc/playground/)**

---

## 🌟 为什么选择 Aimake？

市面上的演示工具与 AI 生成产品往往存在诸多痛点：云端排队绑死、内存膨胀卡顿、千篇一律的空洞 AI 营销套话（AI Slop）、格式导出无法二次编辑、隐私数据上传云端等。

**Aimake 为超级个体、独立创作者与 AI Agent 重新定义内容研发与交付流程：**

- **纯 Markdown 作为唯一事实源**：以结构轻盈、版本受控的 `.deck.md` 为核心，告别复杂的排版软件工程文件。
- **一稿五出 · 原生格式直出**：一份原稿直接渲染出 **3x 视网膜超清图组**（小红书/朋友圈/IG）、**公众号内联样式富文本 HTML**（直粘微信后台）、**高密度矢量 PDF**（LinkedIn 轮播）、**原生可编辑 PPTX**（文本框/形状可再调整）以及 **60fps 口播字幕短视频**。
- **100% 纯本地运行 · 零云端隐私回传**：所有解析、排版、AI 改稿与导出全部在本地计算机执行。绝不回传数据，绝不创建全局软链接，绝不触碰或污染系统 `~/` 与 `~/.claude` 目录。
- **36 套参数化商业设计系统**：严格遵守 CJK 排版准则（日文 `strict` 禁则、韩文 `keep-all` 语节断行），每一套模板均完整支持**深色 / 浅色双主题无缝切换**。
- **深层 AI Copilot 对话改稿副驾驶**：内置 Quick Action 意图胶囊、并排与内联双重视图 Diff 对比、一键应用与快照跨会话回滚，并为 Claude Code、OpenAI Codex、Google Antigravity (AGY)、Tencent CodeBuddy 提供即跑命令配方。

---

## 🔄 核心飞轮：不只是 Markdown，而是端到端创作流

Aimake **绝不仅是**又一个 Markdown 转 PPT 的转换器，而是一个**端到端的多模态知识蒸馏与全渠道分发引擎**。

真正有穿透力的高杠杆创作，绝非从一张空白幻灯片开始。它始于灵感的闪现、自动化的技术雷达调研、业务指标与报表表格、或是团队历史沉淀的草稿。Aimake 将这些碎片化的输入，淬炼为严谨可信的视觉资产，并一键分发到五大多模态交付渠道：

```mermaid
flowchart TD
    subgraph Phase1["1. 多源摄入与自动化调研"]
        A1["aimake radar<br/>(HackerNews, 科技前沿, RSS, arXiv 自动雷达)"]
        A2["网页链接、长文与研报导入"]
        A3["业务数据、指标卡与 CSV 表格数据"]
        A4["会议纪要、访谈录音逐字稿与碎片灵感"]
        A5["aimake import<br/>(Marp, Slidev 与历史幻灯片资产平滑迁移)"]
    end

    subgraph Phase2["2. 可信本地知识库 (Karpathy Wiki)"]
        B1["aimake wiki<br/>(递归知识蒸馏与结构化梳理)"]
        B2["严格约束上下文预算<br/>(<= 3000 Token 知识索引)"]
        B3["精准信源标定<br/>(cite: 源码行级坐标锚点，杜绝虚假幻觉)"]
        B4["aimake persona<br/>(去 AI 味 Humanizer 润色与风格 DNA)"]
    end

    subgraph Phase3["3. 参数化设计工作台 & AI 协同"]
        C1["36 套参数化商业设计模板<br/>(Bento 便当盒、瑞士网格、孔版印刷、暗黑极客)"]
        C2["Calm Studio 本地沉浸画板<br/>(双向键盘漫游、触感胶囊 Dock、即时反馈)"]
        C3["对话式 AI 副驾驶<br/>(Diff 视图对比、一键无损应用与快照回滚)"]
    end

    subgraph Phase4["4. 全渠道多模态原生分发"]
        D1["小红书 / 朋友圈 / Instagram<br/>(3x 视网膜超清卡片图组)"]
        D2["微信公众号后台<br/>(内联样式富文本 HTML，双 MIME 格式直粘)"]
        D3["领英 / 知识星球 / 官方白皮书<br/>(高密度矢量 PDF 轮播册)"]
        D4["Keynote / 商业路演与汇报<br/>(原生可编辑 PPTX 矢量图形与文本框)"]
        D5["短视频 / 视频号 / Reels<br/>(60fps 动效字幕口播短视频)"]
    end

    Phase1 --> Phase2
    Phase2 --> Phase3
    Phase3 --> Phase4
    Phase4 -.->|"持续沉淀为本地知识资产"| Phase2
```

### 飞轮四大演进阶段：
1. **多源摄入与自动化调研 (`aimake radar` & `aimake import` & `aimake intake`)**：
   - 自动扫描技术前沿、RSS 订阅源与社区热门话题，提取灵感线索。
   - 导入结构化表格（CSV 财务数据、评测跑分表）与非结构化素材（语音转录、Obsidian 笔记）。
   - 通过 `aimake import` 一键迁移 Marp、Slidev 等历史演示文稿。
2. **可信本地知识库 (`aimake wiki` & `aimake persona` & `aimake distill`)**：
   - 遵循 Andrej Karpathy LLM Wiki 思想，单篇知识卡片严格控制在 $\le 3000$ Token 上下文预算内，保障模型注意力聚焦。
   - 引入 `cite: [source#L12-L34]` 行级信源锚点，从根本上杜绝 AI 事实幻觉。
   - 搭载 4 语言（中/英/日/韩）去 AI 味润色引擎，剔除公文套话，保留作者最真实独特的语气。
3. **参数化设计工坊与 AI 协同 (`aimake studio` & `aimake create` & `aimake deck`)**：
   - 告别在 Figma/Canva 中反复对齐像素的繁琐手工，36 套大师级参数化模板自动适配字距与版式。
   - Studio 内置对话改稿，支持一键并排 Diff 审查，改坏随时一键回滚。
4. **全渠道多模态分发 (`aimake render` & `aimake publish`)**：
   - 一份源文件直接编译为 5 种原生交付产物（超清图组、公众号直粘代码、矢量 PDF、可编辑 PPTX、60fps MP4）。
   - 交付的内容自动归档回本地知识库，形成越写越厚的个人知识壁垒与复利资产。

---

## 🧩 架构分层解耦：CLI、Agent Skills 与 MCP 的职责划分

参考现代自动化流水线设计模式，Aimake 确立了**「确定性计算下沉到 CLI / 认知推理上浮到 Skill / 外部互联收敛到 MCP」**的解耦原则：

```
                ┌─────────────────────────────────────────────────┐
                │          AI Agents & IDE 宿主 (Claude, Cursor, AGY)│
                └───────────────────────┬─────────────────────────┘
                                        │ (JSON-RPC)
                                        ▼
             ┌────────────────────────────────────────────────────────┐
             │  MCP 服务层 (src/mcp/mcp-server.ts - 16 大原子工具)     │
             │  aimake_publish_content, aimake_pipeline_inspect ...   │
             └──────────────────────────┬─────────────────────────────┘
                                        │
           ┌────────────────────────────┴─────────────────────────────┐
           ▼                                                          ▼
┌───────────────────────────┐                            ┌───────────────────────────┐
│     Agent Skills 认知层    │                            │     Core CLI 确定性引擎   │
│ (skills/workspace-presets)│                            │        (src/cli.ts)       │
├───────────────────────────┤                            ├───────────────────────────┤
│ ① aimake-intake           │ ─── 提示词引导/意图分类 ──►│ ① aimake intake <sources> │
│ ② aimake-wiki-synth       │ ─── 递归提炼/去AI味 ────►│ ② aimake distill [topic]  │
│ ③ aimake-deck-composer    │ ─── 版式编排/Diff对比 ───►│ ③ aimake create / studio   │
│ ④ aimake-deliver-narrator │ ─── 口播配音/分发文案 ───►│ ④ aimake render / publish │
└───────────────────────────┘                            ├───────────────────────────┤
                                                         │ 🔄 aimake pipeline (看板) │
                                                         └───────────────────────────┘
```

### 1. 抓取 (Intake)
- **Core CLI 职责**：`aimake intake <sources...>` 执行高吞吐文件 I/O、本地 PDF/Office 格式正规化提取、多源网络抓取与 SHA-256 唯一指纹哈希校验。
  - **X (Twitter) 动态与长推**：基于全球边缘 API（`api.fxtwitter.com`）实现**零 API Key / 零登录凭证**直出结构化数据，提取推文全文、作者画像、点赞/转推/浏览互动指标、多张高清配图与引用推文（Quote Tweet）；配合 Jina Reader 自动展开长推文串。
  - **微信公众号文章 (`mp.weixin.qq.com`)**：突破图片防盗链限制，将微信动态 `<img data-src="...">` 懒加载图片正规化为 Markdown 图片标准语法。
  - **数据表格 (CSV/TSV/Excel)**：原生解析行列结构，自动探测高对比度核心数值指标，秒级提炼为 Bento 网格卡片专用的 ````metric` 语法块。
  - **音视频字幕 (VTT/SRT)**：剥离冗余微秒时间轴代码与行号，按发言人与 `[01:23]` 时间戳锚点聚类为连贯语义段落。
  - **全生态调研报告**：详细开源方案比对参见 [docs/INTAKE_ECOSYSTEM_RESEARCH.md](./docs/INTAKE_ECOSYSTEM_RESEARCH.md)。
- **Agent Skill 职责**：`aimake-intake` 分析杂乱非结构化草稿，剔除无关排版噪声，结构化保留核心数据指标、结论与溯源依据。

### 2. 萃取 (Distill)
- **Core CLI 职责**：`aimake distill [topic]` 校验上下文 Token 计数（$\le 3000$ tokens 边界预算）、自动生成 `briefs/<slug>.brief.md`，维护图谱引用索引。
- **Agent Skill 职责**：`aimake-wiki-synth` 与 `aimake-humanizer` 进行多步思维链知识蒸馏、4 语种去 AI 味校准、作者风格基因（Style DNA）匹配与 `cite:` 溯源坐标绑定。

### 3. 创作 (Create)
- **Core CLI 职责**：`aimake create [prompt]`、`aimake studio` 启动 Calm Studio 本地画板，编译 Mermaid 离线矢量 SVG 图表，处理 SSE 热重载与时间旅行快照无损回滚。
- **Agent Skill 职责**：`aimake-deck-composer` 与 `aimake-brief-architect` 负责多轮对话交互改稿、36 套模板按受众风格智能选型与并排 Diff 审查。

### 4. 发布 (Publish)
- **Core CLI 职责**：`aimake render` 多模态转码（Retina PNG、原生 PPTX、矢量 PDF、60fps MP4）以及 `aimake publish` 批量打包微信公众号内联 HTML、知乎 Markdown、掘金专栏、小红书速记卡与 Wechatsync 清单，自动追加归档至 `wiki/published.md`。
- **Agent Skill 职责**：`aimake-deliver-narrator` 生成针对不同平台的引流钩子文案、口播分镜脚本与 SEO 标签策略。

---

## 📸 核心产品功能与视觉实测

### 1. 2026 趋势美学与前沿评测范例

Aimake 开箱即带 2026 年最具穿透力的商业设计体系：

<p align="center">
  <img src="./docs/assets/trending-bento.png" width="48%" alt="苹果发布会 Bento 便当盒" />
  <img src="./docs/assets/trending-deepseek.png" width="48%" alt="DeepSeek 跑分与开源权重评测" />
</p>
<p align="center">
  <img src="./docs/assets/trending-swiss.png" width="48%" alt="瑞士国际主义极简网格" />
  <img src="./docs/assets/trending-risograph.png" width="48%" alt="物理具身智能复古孔版海报" />
</p>

- **苹果发布会 Bento 便当盒 (`apple-bento-launch`)**：曜石黑卡片、非对称瓷砖、微妙影棚光晕与超大对比数字，尽显发布会旗舰张力。
- **DeepSeek 开源权重实测卡 (`xhs-neon-tech`)**：暗黑极客代码与跑分卡，专为硬核模型对比、Token 成本核算与命令行部署打造。
- **瑞士国际主义极简网格 (`xhs-swiss-grid`)**：极高信息密度、极细发丝分界线与朱砂红索引标，构建无法被忽视的技术权威感。
- **物理具身智能复古海报 (`poster-risograph`)**：Risograph 珊瑚红 × 钴蓝双色叠印艺术质感，专为前沿科技研报与沙龙海报设计。

---

### 2. 多模态交付抽屉与免安装 Web 工坊

<p align="center">
  <img src="./docs/assets/studio-export.png" width="48%" alt="多模态交付抽屉" />
  <img src="./docs/assets/web-playground.png" width="48%" alt="Aimake 在线沙盒工坊" />
</p>

- **多模态交付抽屉**：一键导出 3x 视网膜超清图组、一键写入微信公众号（`text/html` + `text/plain` 双格式后台直粘）、生成矢量 PDF、可编辑 PPTX 以及带时间轴字幕与配音的 60fps MP4。
- **Web 在线工坊 (`aimake.cc/playground/`)**：纯前端静态沙盒，左侧支持 Markdown 源码与可视化卡片无缝切换，完全在浏览器本地编译预览。

---

## 🚀 常用命令速查

```bash
# 1. 环境自检与模板浏览
aimake doctor                                    # 检测系统环境、Node.js 与媒体工具就绪状态
aimake templates                                 # 查看 36 套内置设计风格及其适用画幅
aimake market list                               # 查看在线扩展风格包与预设套件

# 2. 闭环工作区与 4 阶段创作飞轮流水线
aimake workspace init ./my-space                 # 初始化自包含工作区（实体预设 7 大 Skill，零软链接）
aimake pipeline                                  # 查看当前工作区飞轮状态与推荐下一步动作
aimake intake https://example.com/rep.html       # ① 抓取：将网页、PDF、文档摄入 sources/ 与 wiki
aimake distill "2026 AI Agent 大变革"            # ② 萃取：递归蒸馏事实卡片 (<=3000 tokens) 与大纲
aimake create "2026 AI Agent 大变革"             # ③ 创作：对话式生成视觉卡片原稿并开启 Studio 舞台
aimake publish ./decks/agent.deck.md             # ④ 发布：全渠道直出微信、知乎、掘金、小红书与同步包

# 3. 自动化科技雷达与知识库
aimake radar --topic "embodied-ai"               # 自动扫描 HackerNews、arXiv 与行业前沿动态
aimake wiki init ./vault                         # 初始化 Karpathy 风格本地 LLM 知识库
aimake wiki distill ./vault/sources -o ./vault   # 递归蒸馏长文/表格为定界上下文知识卡
aimake persona extract ./my-writings             # 提取个人行文 DNA 并校准去 AI 味润色引擎

# 4. 启动本地沉浸式工作室 (Calm Studio)
aimake studio --demo                             # 快速打开预设示例工作区
aimake studio ./my-space/decks/story.deck.md     # 针对指定作品启动本地可视化创作舞台

# 5. 迁移现有演示文档
aimake import ./legacy-slides.md -o ./deck.md    # 将 Marp / Slidev / 通用 Markdown 转为规范 .deck.md

# 6. 一键多模态原生交付
aimake render ./deck.md -f png -o ./out/cards    # 导出 3x 超高清图组（小红书 3:4 / 方形 1:1）
aimake render ./deck.md -f wechat -o ./out.html  # 导出微信公众号富文本（内联 CSS，一键直粘）
aimake render ./deck.md -f pdf -o ./out/deck.pdf # 导出高清晰度矢量 PDF（LinkedIn 4:5 轮播）
aimake render ./deck.md -t ppt-executive-16x9 -f pptx -o ./out/deck.pptx   # 导出原生可编辑 PPTX
aimake render ./deck.md -t video-kinetic-reel -f mp4 -o ./out/reel.mp4     # 导出 60fps 动效短视频
```

> **轻量化安装说明**：`aimake-studio` 安装包精简至 3.5 MB 以内，默认不绑定笨重的无头浏览器与 FFmpeg 二进制。渲染 PNG、PDF 或 MP4 时，Aimake 会自动复用本机已有的 Chrome/Chromium/Playwright 与 FFmpeg，亦可随时按需安装可选对等依赖：`npm i playwright @ffmpeg-installer/ffmpeg`。

---

## 🎨 36 套参数化模板矩阵

Aimake 体系化覆盖了从主流社交平台、商业路演到出海全球化的全场景排版需求：

| 分类体系 | 代表模板 | 画幅比例 | 视觉美学核心与适用场景 |
|:---|:---|:---|:---|
| **2026 热点趋势** | `apple-bento-launch`<br>`xhs-neon-tech`<br>`xhs-swiss-grid`<br>`poster-risograph` | `16:9`<br>`3:4`<br>`4:5` | 苹果发布会 Bento 便当盒瓷砖网格、DeepSeek 开源权重评测跑分黑客风、瑞士国际主义理性网格、Risograph 复古孔版叠印海报 |
| **爆款社交媒体** | `xhs-bold-headline`<br>`xhs-apple-notes`<br>`xhs-morandi-cream`<br>`xhs-liquid-glass`<br>`xhs-quote-card`<br>`xhs-pro-vs-con` | `3:4`<br>`1:1` | 黄黑大字报、苹果备忘录拟物、莫兰迪高级奶油质感、拟态液态玻璃、独立金句卡、双栏优缺点 PK 对比 |
| **出海全球化专栏** | `linkedin-exec-carousel`<br>`ig-cardnews-kr`<br>`ja-note-editorial`<br>`en-substack-digest`<br>`en-founder-whiteboard` | `4:5`<br>`1:1` | 领英创始人滑动卡、韩国 IG 现代几何卡片新闻（严格支持 `keep-all`）、日本 Note 余白美学（严格日文禁则）、Substack 纽约客专栏卡、科技极客白板蓝图 |
| **路演汇报与 PPT** | `ppt-executive-16x9`<br>`ppt-tech-architecture`<br>`ppt-linear-dark`<br>`ppt-bauhaus-bold`<br>`ppt-consulting-matrix` | `16:9` | 商业计划书主视觉、技术系统架构蓝图、Linear 工程师暗黑风、包豪斯重构设计、麦肯锡 2x2 咨询矩阵 |
| **公众号长文专栏** | `wechat-deep-report`<br>`wechat-editorial-article`<br>`wechat-frontpage-news`<br>`wechat-greenbook`<br>`wechat-minimal-brief` | 自适应 | 深度行业分析白皮书、人文专栏特稿、头条新闻大字报、绿色商业绿皮书、极简工作汇报 |
| **教学互动与图解** | `edu-flashcard-kids`<br>`edu-lesson-guide`<br>`x-zukai-quad` | `3:4`<br>`1:1` | 儿童双语认知与生字识字卡、黑板绿课堂导学讲义、X 日本四象限「図解」思考模型卡 |
| **动效口播视频** | `video-kinetic-reel`<br>`video-podcast-wave`<br>`video-cinema-talk` | `9:16`<br>`16:9` | 竖屏快节奏动效字幕短视频、播客电台音频波形卡、电影感 16:9 纪录片访谈 |

**统一模板规范（Aimake Design Contract）**：
- 全模板支持**深色 / 浅色双外观**（页面 `:root[data-theme="dark/light"]` 与 frontmatter `theme: dark/light`）。
- 统一规范 CSS 变量（`--bg`, `--surface`, `--ink`, `--muted`, `--accent`, `--border`, `--card-shadow`, `--code-bg`）。
- 全模板内置离线矢量 **Mermaid 图表** 与 Highlight.js 多语言代码语法高亮。
- 每一个模板均配有独立的 `sample.deck.md` 范例卡片。

---

## 🖥️ 沉浸式 Studio 工作室体验

执行 `aimake studio` 即可启动本地沉浸式无干扰画板：

- **全键盘流畅漫游**：
  - `←` / `→` / `Space`：上一页 / 下一页切换
  - `PageUp` / `PageDown`：快速翻页
  - `F`：切换全屏演说家模式（Presenter Mode）
  - `Esc`：一键退出全屏演示或关闭弹窗面板
  - `⌘K`：呼出指令浮层（快速切换浅色/深色外观、切换作品、执行导出）
- **触感底部胶囊栏（Filmstrip）**：当前焦点页平滑自动居中，支持一键在当前位置**新增 (+)**、**复制**与**删除**幻灯片。
- **毛玻璃画布状态条**：实时清晰显示当前作品名、画幅比例胶囊、页码状态，以及纯本地运行的 **Zero-Cloud 隐私盾牌标识**。
- **即时交付动效反馈**：微信公众号富文本复制具备标准的 `text/html` + `text/plain` 双格式写入后台，PNG 导出具备即时 Loading 旋转与成功打勾动效。

---

## 🤖 AI Copilot 对话改稿与主流 AI 启动配方

Aimake 在底层打通了非确定性的大语言模型与确定性的高保真排版：

1. **Quick Action 意图推荐胶囊**：在 Studio 对话面板中提供高频一键操作：
   - 💬 **提炼金句卡片**：自动提炼核心洞察，生成独立高质感金句卡。
   - 🍱 **转为 Bento 风格**：重排为苹果 Bento 便当盒多栏卡片网格。
   - 📋 **生成演讲大纲**：梳理各节议程、预估用时与核心结论。
   - 🌐 **翻译为双语**：保持地道术语与原格式的中英双语对照。
   - ✨ **去 AI 味精修**：针对中英日韩 4 语种消除空洞排比与营销腔。
2. **前后 Diff 对比卡片**：AI 改稿后生成直观的并排（Side-by-side）与内联（Inline）差异对比，支持**一键应用（Apply）**或安全**还原（Revert）**。
3. **主流 AI 终端 1-Click 配方**：为外部 AI 工具自动生成内置工作区完整上下文与提示词的即跑指令：
   - **Claude Code CLI**：`claude -p '...'`
   - **OpenAI Codex CLI**：`codex exec --skip-git-repo-check '...'`
   - **Google Antigravity (AGY)**：`agy -p '...'`
   - **Tencent CodeBuddy CLI**：`codebuddy -p '...'`

---

## 🔌 平台生态与多 AI 宿主接入 (WorkBuddy / Claude / Cursor / Codex / AGY)

Aimake 采用**「一套内核，全平台生态互通」**的插件化与 MCP 架构，支持主流 AI 客户端与 IDE 宿主免配置集成：

### 1. 腾讯 WorkBuddy (CodeBuddy) 企微企业级接入
- **已打包集成配置**：位于 [`integrations/workbuddy/`](./integrations/workbuddy/)
  - `connector-meta.json`：定义 WorkBuddy 标准 Connector 扩展元数据与多语种介绍；
  - `mcp.json`：配置基于 stdio 的 MCP 服务 `{"command": "npx", "args": ["-y", "aimake", "mcp"]}`；
  - `expert/aimake-producer.md`：预置「爱创总制片（Aimake Producer）」专家角色，自动按素材水源、发布平台与文风基因编排作品。
- **上架与使用**：在 WorkBuddy 中导入自定义插件目录，或在团队企业知识库中挂载，即可在聊天对话中直接调度 Aimake 16 大 MCP 工具完成文档转 PPT 与全渠道分发。

### 2. Claude Desktop & Claude Code
- **官方插件标准支持**：维护顶级 [`plugin.json`](./plugin.json) 与 [`.claude-plugin/plugin.json`](./.claude-plugin/plugin.json)。
- **Claude Desktop MCP 配置**：在 `~/Library/Application Support/Claude/claude_desktop_config.json` 中添加：
  ```json
  {
    "mcpServers": {
      "aimake": {
        "command": "npx",
        "args": ["-y", "aimake", "mcp"]
      }
    }
  }
  ```

### 3. Cursor & VSCode
- 在 Cursor **Settings -> Features -> MCP** 中新增服务器：
  - **Name**: `aimake`
  - **Type**: `command`
  - **Command**: `npx -y aimake mcp`
- 即可在 Cursor Composer 中直接调用 16 个 Aimake 原子工具（如 `aimake_publish_content`、`aimake_pipeline_inspect`、`aimake_wiki_ingest`）。

### 4. OpenAI Codex CLI & Google Antigravity (AGY)
- **通用 Agent Skill 规范**：位于 [`skills/aimake/SKILL.md`](./skills/aimake/SKILL.md)，严格符合标准 Agent Frontmatter 规范。
- **1-Click 启动配方**：在 Aimake Studio 中点击 AI Launcher，自动生成带完整工作区上下文的即跑命令：
  - Codex: `codex exec --skip-git-repo-check '...'`
  - AGY: `agy -p '...'`

---

## 📁 仓库代码架构

```
products/aimake/
├── src/
│   ├── cli.ts                   # Universal CLI 核心入口 (aimake & aimake-studio)
│   ├── index.ts                 # Programmatic TypeScript API 导出
│   ├── studio/                  # Calm Studio 服务器、UI 模板、样式与交互脚本
│   ├── renderer/                # HTML 编译器、PPTX 生成器与多模态渲染流水线
│   ├── workspace/               # 本地工作区管理与外部 AI 运行时连接器
│   └── templates/               # 内置 36 套模板元数据注册与架构验证
├── templates/                   # 36 套商业设计模板（HTML、CSS、manifest、sample）
├── examples/                    # 示例作品库（Bento 便当盒、DeepSeek 评测、瑞士网格、海报）
├── skills/                      # 7 大工作区闭环预设 Skill（零软链接，零全局污染）
├── scripts/                     # 自动化审计、构建与发版验证脚本
└── tests/                       # Vitest 单元/集成测试与 Playwright E2E 测试集
```

---

## 🛡️ 质量保障与自动化流水线

Aimake 严格执行工程级质量闸门：

```bash
# 执行完整发版前综合验收流水线
pnpm verify
```

- **类型健全**：`tsc --noEmit` 静态类型检查 0 错误。
- **单元与集成测试**：8 个测试套件、**61/61 个测试全部通过**（运行时间仅约 2.7 秒）。
- **Playwright E2E 端到端**：6 大真实端到端场景全绿（涵盖 API 对话、Diff 回滚、零软链接、画廊同款制作与交付导出）。
- **零隐私泄露审计**：`audit:secrets` 扫描 237 个源文件，确保 0 密钥、0 私有路径泄露。
- **模板与技能审计**：`audit:skills` 确保所有 36 套模板均符合结构规范与双色外观契约。
- **发布包完整性验证**：`pack:check` 验证 npm 打包体积约为 3.2 MB，并在隔离 `/tmp` 目录验证 CLI 启动与执行无缺损。

---

## 🏛️ 开源生态致敬与前序艺术

Aimake 的诞生与演进，深受以下开源项目、设计哲学与前沿开发工具的启发：

- **[Marp](https://marp.app/) & [Slidev](https://sli.dev/)**：开创了以 Markdown 编写幻灯片的现代工作流。Aimake 在此基础上突破了单一演示场景，拓展出全渠道多模态原生交付（超清图组、公众号、PDF、可编辑 PPTX、口播短视频）与参数化设计系统。
- **[Reveal.js](https://revealjs.com/)**：现代 Web 演示技术的基石。
- **[Andrej Karpathy's LLM Wiki 理念](https://gist.github.com/karpathy)**：启发了 Aimake 本地可信知识库（`aimake wiki`）的严谨设计——强制 $\le 3000$ Token 定界预算与行级信源溯源标定，彻底规避 AI 幻觉。
- **[Obsidian](https://obsidian.md/)**：展现了纯本地 Markdown 双链知识库的长青复利价值。
- **Apple Keynote & Bento Grid**：提供了顶级视觉克制感、模块化网格编排与产品叙事教科书级的典范。
- **[Linear](https://linear.app/) & [Vercel Geist](https://vercel.com/font)**：启发了 Aimake Calm Studio 的暗黑极客质感、微交互细节与严谨的排版美学。
- **主流 CLI Agent 生态**：开箱无缝兼容 [Claude Code](https://github.com/anthropics/claude-code)、[OpenAI Codex](https://github.com/openai/codex)、[Google Antigravity (AGY)](https://github.com/google) 与 [Tencent CodeBuddy](https://github.com/tencent)。
- **核心底层渲染引擎**：[Mermaid.js](https://mermaid.js.org/) 提供离线矢量图表，[Highlight.js](https://highlightjs.org/) 提供代码高亮，[PptxGenJS](https://gitbrent.github.io/PptxGenJS/) 提供原生可编辑 PPTX 渲染。

---

## 📄 文档与规范索引

- [1.0 架构与验收测试报告](./docs/ACCEPTANCE-1.0.md)
- [Aimake 2.0 沉浸式工作区设计白皮书](./docs/AIMAKE_2_0_CALM_WORKSPACE_DESIGN.md)
- [全生态多源素材抓取与各环节开源工具调研报告](./docs/INTAKE_ECOSYSTEM_RESEARCH.md)
- [全渠道宣发与开源推广媒体套件 (Launch & Promotion Kit)](./docs/LAUNCH_AND_PROMOTION_KIT.md)
- [演进路线图](./docs/ROADMAP-2.0.md)
- [开发者贡献指南](./CONTRIBUTING.md)
- [社区行为准则](./CODE_OF_CONDUCT.md)
- [安全策略与本地隐私保护声明](./SECURITY.md)
- [第三方开源协议声明](./THIRD_PARTY_NOTICES.md)

---

## 🤝 参与贡献

我们热烈欢迎开源社区参与贡献！无论是提交 Issue、发起 Pull Request 还是为 Aimake 贡献新的视觉模板：

1. 查阅我们的 [贡献指南](./CONTRIBUTING.md) 与 [行为准则](./CODE_OF_CONDUCT.md)。
2. Fork 本仓库并创建特性分支：`git checkout -b feature/my-new-template`。
3. 运行本地完整检验：`pnpm verify`。
4. 提交更改：`git commit -am 'feat: add my new template'`。
5. 推送到分支并创建 Pull Request。

---

## 📜 开源协议

[MIT License](./LICENSE) © 2026 Aimake Labs / Chico Gong.
