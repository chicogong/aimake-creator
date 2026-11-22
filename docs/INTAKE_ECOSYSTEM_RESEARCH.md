# 全生态多源素材抓取与各环节开源工具调研报告 (Intake & Pipeline Ecosystem Research)

> **调研目标**：广泛梳理在 **抓取 (Intake) → 萃取 (Distill) → 创作 (Create) → 发布 (Publish)** 每一个环节中，业内现存最优秀、最稳定、可直接复用或深度集成的开源工具、API 与生态协议，并在 Aimake 中落地参考范例。

---

## 阶段一：抓取与素材摄入 (Intake & Scrapers)

不同内容平台具备各异的反爬策略、数据格式与渲染逻辑。以下为各主流渠道的最佳现成开源方案与在 Aimake 中的落地架构：

### 1. X (Twitter) 动态、长推与推文串 (Threads)
- **痛点**：X 官方 API 收费高昂（每月 100 美元仅获极少额度），网页端强制登录墙与重度客户端 SPA 渲染，普通 HTTP GET 仅能获取空白壳。
- **现成开源与免登录方案**：
  1. **FxTwitter / FixupX API (`api.fxtwitter.com`)**：
     - *原理*：开源且免费的全球边缘代理（基于 Cloudflare Workers），专为 Discord/Telegram 丰富预览打造。
     - *接口格式*：`GET https://api.fxtwitter.com/<user>/status/<id>`
     - *特性*：**零 Token、零登录凭证**，直出结构化 JSON，包含完整的推文原文、作者昵称/Handle、点赞/转推/浏览量数据、多张高分辨率配图，以及被引用的推文（Quote Tweet）。
     - *落地状态*：Aimake 已在 `src/intake/x-scraper.ts` 中原生集成 FxTwitter 提取引擎。
  2. **Jina Reader (`r.jina.ai`)**：
     - *原理*：在目标推文 URL 前加上 `https://r.jina.ai/https://x.com/...`，Jina 自动调度无头浏览器渲染并剥离周围无关的 Trends/推荐边栏，直出纯净 Markdown。
     - *适用场景*：长推文串（Threads）连续展开与阅读。
  3. **twscrape (Python)**：
     - *原理*：支持轮换多个轻量只读访客账户（Guest Accounts），提取全量搜索与个人主页动态。适合本地批量大抓取。
- **Aimake 落地实操**：
  ```bash
  # 一键抓取 X 上的前沿讨论并结构化沉淀为素材
  aimake intake "https://x.com/karpathy/status/1753123456789012345"
  ```

---

### 2. 微信公众号 (WeChat Official Accounts)
- **痛点**：微信公众号具有防盗链机制（图片使用 `data-src` 且限制 Referer）、搜狗搜索反爬验证码，以及动态 JavaScript 签名。
- **现成开源与可用方案**：
  1. **Jina Reader 代理抓取**：
     - 请求 `https://r.jina.ai/https://mp.weixin.qq.com/s/<article_id>` 可直接突破反爬，完整提取文章主干 `#js_content`、标题、作者与原图。
  2. **`wechat-article-fetcher` / Mozilla Readability 方案**：
     - 基于 Playwright 无头浏览器加载页面后，注入 `@mozilla/readability` 自动定位正文，并将 `<img data-src="...">` 批量正规化为 Markdown 图片语法。
- **Aimake 落地实操**：
  ```bash
  aimake intake "https://mp.weixin.qq.com/s/sample_article_id"
  ```

---

### 3. 数据表格、指标报表与财务研报 (CSV / TSV / Excel)
- **痛点**：业务指标往往保存在 Excel 表格或 CSV 中，传统大模型直接读取易丢失行列对齐关系，导致数值分析幻觉。
- **现成开源与可用方案**：
  1. **Microsoft MarkItDown**：
     - 微软开源的万能 Office 转换器，支持 `.xlsx`、`.csv`、`.pptx`、`.docx` 一键转为 Markdown 表格。
  2. **Aimake Table Scraper (`src/intake/table-scraper.ts`)**：
     - 纯本地原生解析 CSV/TSV，生成 GitHub Flavored Markdown 对齐表格；
     - **智能识别数值列**：自动提取高对比度指标（百分比、美元、倍数），生成 Bento 专用的 ````metric` 语法块，供卡片与幻灯片直接秒用。
- **Aimake 落地实操**：
  ```bash
  aimake intake ./data/financial-report.csv
  ```

---

### 4. 视频字幕与会议录音逐字稿 (Video & Voice Transcripts)
- **痛点**：带时间轴的 WebVTT 或 SRT 字幕文件包含大量冗余行号（`1\n00:00:01.000 --> 00:00:04.000`），直接塞入模型浪费 40% 以上上下文。
- **现成开源与可用方案**：
  1. **`yt-dlp`**：开源视频音频字幕下载利器（`yt-dlp --write-auto-sub --skip-download`）。
  2. **Aimake Transcript Scraper (`src/intake/transcript-scraper.ts`)**：
     - 剥除时间轴毛刺，将零散语句聚类合并为带时间戳锚点（如 `[01:23]`）和发言人标注（如 `[Andrej Karpathy]`）的连贯长段落。
- **Aimake 落地实操**：
  ```bash
  aimake intake ./recordings/keynote.vtt
  ```

---

### 5. 知乎专栏与技术社区 (Zhihu / Juejin / HackerNews)
- **现成方案**：
  1. **Zhihu**：通过 Jina Reader 或 `zhihu-scrapy` 解析专栏 HTML 结构，提取 MathJax/LaTeX 公式与代码块。
  2. **HackerNews**：使用官方免费 Firebase REST API（`https://hacker-news.firebaseio.com/v0/item/<id>.json`），Aimake 的 `aimake radar` 已深度集成。

---

## 阶段二：萃取与知识库 (Distillation & Grounding)

| 需求环节 | 现成优秀开源项目 | Aimake 架构实现与复用 |
| :--- | :--- | :--- |
| **知识蒸馏与复利** | **Andrej Karpathy LLM Wiki** | `aimake distill`：强制 $\le 3000$ Token 单篇预算，避免上下文溢出；自动生成 `briefs/<slug>.brief.md`。 |
| **杜绝事实幻觉** | **Citation Grounding** (RAG/Perplexity 模式) | 全流程引入 `cite: file#L12-L34` 行级溯源锚点，在卡片右上角或底图标注真实出处。 |
| **去 AI 味润色** | **Humanizer / Prompt Sanitizers** | `aimake persona humanize`：内置 4 语种（中/英/日/韩）空洞废话与公文套话黑名单清洗器。 |

---

## 阶段三：参数化创作与设计 (Composition & Studio)

| 需求环节 | 现成优秀开源项目 | Aimake 架构实现与复用 |
| :--- | :--- | :--- |
| **Markdown 幻灯片** | **Marp** / **Slidev** / **Reveal.js** | 继承 Markdown 源码作为唯一事实源，提供 `aimake import` 兼容 Marp/Slidev 历史幻灯片。 |
| **矢量流程图表** | **Mermaid.js** | 纯离线 SVG 编译，不依赖任何第三方 CDN 或云端图床。 |
| **代码语法高亮** | **Highlight.js** / **Shiki** | 编译期完成多语言代码高亮，零前端额外请求。 |
| **微交互与质感** | **Linear** / **Vercel Geist** / **Apple Bento** | 采用 1px 发丝边框、负字距排印（`-0.035em`）、多层景深与拟态毛玻璃。 |
| **Diff 与版本控制** | **Monaco Diff / Git Snapshot** | Studio 对话面板内置并排（Side-by-side）与内联（Inline）差异对比，支持跨会话无损回滚。 |

---

## 阶段四：全渠道多模态原生分发 (Omni-Channel Distribution)

| 交付介质 | 现成开源方案 / 行业标准 | Aimake 交付能力 |
| :--- | :--- | :--- |
| **小红书 / Instagram** | 3:4 视网膜渲染器 | `aimake render -f png`：Playwright 无头浏览器直出 3x 极清图组。 |
| **微信公众号** | **Wechatsync (微信同步助手)** / OpenWrite | `aimake render -f wechat`：零外部依赖的 100% 内联 CSS 富文本，剪贴板写入 `text/html` + `text/plain` 双格式，微信后台直粘贴。 |
| **高管汇报 PPT** | **PptxGenJS** | `aimake render -f pptx`：拒绝截图拼贴，生成包含原生可编辑 OOXML 文本框、矢量形状与表格的 PPTX。 |
| **专业白皮书** | Chrome Print to PDF / PDFKit | `aimake render -f pdf`：生成 4:5 或 16:9 高保真矢量 PDF。 |
| **动效口播短视频** | **FFmpeg** / Remotion | `aimake render -f mp4`：基于确定性逐帧步进与时间轴同步，直出 60fps H.264 视频与字幕。 |
| **知乎 / 掘金 / 跨平台分发** | **PostBot** / **Wechatsync Manifest** | `aimake publish`：自动打包全平台专栏稿件与 `manifest.json`，支持 Chrome CDP (端口 9222) 自动化写入草稿箱。 |

---

## 真实范例资产沉淀 (Examples in `examples/sources/`)

在项目中已内置真实的可复现素材范例：
1. **X (Twitter) 前沿讨论串**：[`examples/sources/x-karpathy-ai-agents.md`](../examples/sources/x-karpathy-ai-agents.md)
   - 演示完整的推文原文、互动指标（Likes/Retweets）、作者画像与引用卡片。
2. **企业评测数据报表**：[`examples/sources/deepseek-benchmark-table.csv`](../examples/sources/deepseek-benchmark-table.csv)
   - 演示从 CSV 数据表中自动提炼 Bento 核心数值指标（`metric`）并转为对比演示页。
3. **行业深度微信研报**：[`examples/sources/wechat-ai-report.md`](../examples/sources/wechat-ai-report.md)
   - 演示结构化长文的层级章节与信源标定。
4. **视频播客录音逐字稿**：[`examples/sources/keynote-transcript.vtt`](../examples/sources/keynote-transcript.vtt)
   - 演示去除冗余时间轴代码、聚类为带 `[01:23]` 锚点的演讲文本。
