import fs from 'node:fs/promises';
import path from 'node:path';
import type { MarketplaceTemplateEntry } from '../marketplace/index.js';
import { lucideIcon } from '../studio/calm-ui/icons.js';

export interface PlaygroundBundleData {
  templates: Array<{
    id: string;
    name: Record<string, string>;
    aspect: string;
    category: string;
    description: Record<string, string>;
    css: string;
  }>;
}

const STARTER_SAMPLES: Record<string, string> = {
  deepseek: `---
title: DeepSeek-R1 纯本地部署与知识蒸馏实战全景
template: xhs-swiss-grid
locale: zh-CN
aspect: 3:4
author: Aimake Studio
handle: "@aimake.cc"
---

<!-- scene: intro | layout: metrics | eyebrow: DEEPSEEK R1 2026 -->
# 为什么 2026 年超级个体必须掌握本地大模型蒸馏？
## 零云端依赖 · 数据资产 100% 留存本机 · 毫秒级极速响应

\`\`\`metric
- 本地蒸馏压缩比: 92% (671B -> 14B/32B 端侧可跑)
- 单次调用延迟: < 120ms (Apple Silicon M4 Max 原生加速)
- 隐私外泄风险: 0% (全程离线运行 · 绝对可控)
\`\`\`

- **告别算力盲目攀比**：通过 Ollama / vLLM 在本地运行 DeepSeek-R1 量化蒸馏版，推理成本降低 98%。
- **私有知识精准注入**：单份 Markdown 笔记即可一键蒸馏为个人高频句式与 Style DNA。

---

<!-- scene: compare | layout: comparison | eyebrow: ARCHITECTURE -->
# 纯云端 API vs 纯本地模型蒸馏工作流

\`\`\`compare
云端商业 API :: 按 Token 持续扣费 | 敏感业务与原稿面临云端审计风险 | 网络抖动偶发超时
本地蒸馏内核 :: 一次配置永久免费调用 | 100% 数据在本地沙盒隔离 | 断网环境下毫秒级响应
\`\`\`

---

<!-- scene: code | layout: code | eyebrow: ONE COMMAND -->
# 终端一行命令启动本地推理编译

\`\`\`bash
# 启动本地 DeepSeek-R1 蒸馏引擎
ollama run deepseek-r1:14b

# 一键将研究笔记编译为小红书 3:4 视觉图文
aimake render deepseek-note.deck.md -t xhs-swiss-grid -o output/
\`\`\`
`,

  agent: `---
title: 2026 AI Agent 架构演进：从单体模型到端到端闭环
template: apple-bento-launch
locale: zh-CN
aspect: 16:9
author: Chico Gong
handle: "@chicogong"
---

<!-- scene: intro | layout: metrics | eyebrow: ARCHITECTURE 2026 -->
# 为什么大模型套壳正在加速退场？
## 从一次性问答消费，进化为多模态资产编译

\`\`\`metric
- 交付延迟: < 1.2s (-75%)
- 本地隐私留存: 100% (Zero-Cloud)
- 多端介质直出: 5 种 (原生排版)
\`\`\`

---

<!-- scene: compare | layout: comparison | eyebrow: PARADIGM SHIFT -->
# 通用单体模型 vs Aimake 端到端闭环

\`\`\`compare
通用聊天套壳 :: 一次性对话，关掉窗口灵感丢失 | 样式死板无法导出可编辑 PPTX | 隐私云端暴露
Aimake 爱创闭环 :: 本地 Karpathy LLM Wiki 知识复利 | 一稿直出公众号、小红书、PDF 与短视频 | 100% 数据留存本机
\`\`\`

---

<!-- scene: code | layout: code | eyebrow: ONE COMMAND -->
# 一行命令驱动全生态 AI 助手

- 原生兼容 OpenCode、WorkBuddy、Codex、AGY 与 Claude Code
- 预设 7 大闭环 Skill，实体化沉淀在工作区，零全局污染

\`\`\`bash
aimake new my-launch --template apple-bento-launch
aimake render deck.md -f pptx -o launch.pptx
\`\`\`
`,

  token: `---
title: 跑完超 1000 亿 Token 后：超级个体的纯本地创作飞轮
template: apple-dark-keynote
locale: zh-CN
aspect: 16:9
author: Chico Gong
handle: "@chicogong"
---

<!-- scene: hook | layout: metrics | eyebrow: BENCHMARK 2026 -->
# 为什么纯本地 LLM Wiki 是超级个体最深的护城河？
## 告别一次性聊天消耗，让每一篇笔记产生复利

\`\`\`metric
- 处理 Token: 1000 亿+ (超大规模实战)
- 沉淀知识卡片: 1,840 篇 (本地 Markdown)
- 一稿多出介质: 5 种 (图文+长文+PPT+视频)
\`\`\`

- **知识蒸馏与复利累加**：灵感不再随聊天窗口关闭而蒸发，Markdown 知识库成为自主生长的个人资产。
- **微信排版零折腾**：一键生成纯净内联 CSS，无需借助任何第三方编辑器，杜绝防盗链与格式错乱。

---

<!-- scene: matrix | layout: comparison | eyebrow: CREATOR WORKFLOW -->
# 创作者的两种工作流对比

\`\`\`compare
传统搬运工模式 :: 在各个社交平台手动排版 | 复制粘贴格式错乱 | 素材分散在不同网盘
超级个体飞轮 :: 统一在 Aimake 工作区沉淀笔记 | 确定性排版内核秒级编译 | 资产回流形成知识图谱
\`\`\`
`,

  podcast: `---
title: 午夜播客 · 告别 AI 废话的四语种 Style DNA
template: video-cinema-talk
locale: zh-CN
aspect: 9:16
author: Aimake Studio
handle: "@aimake.cc"
fps: 30
secondsPerSlide: 5
---

<!-- scene: hook-cover | layout: metrics | eyebrow: VIDEO AS CODE 2026 -->
# 为什么 2026 年视频创作者必须告别“黑盒式盲盒生成”？
## 突破生成即定型瓶颈 · 拥抱剪映 / CapCut 6 轨白盒化二次创作自由

\`\`\`metric
- 6 轨标准时间轴: 100% (背景 · 画面 · 花字 · 字幕 · 旁白 · BGM)
- 时间标尺精度: 1 微秒 (Microsecond Timebase 严丝合缝)
- 二次剪辑自由度: 无损可调 (非编工程白盒交付，自由重构)
\`\`\`

- **痛点从来不是无法生成，而是生成后无法局部修改**：错一个错别字只能重新消耗算力生成整个 MP4。
- **Aimake 确定性白盒交付**：声明式 Markdown 脚本秒级编译为剪映与 CapCut 原生 6 轨工程文件。

::: speech
做短视频的创作者们，你是否也被传统 AI 视频工具折磨过？一次生成一个固定 MP4，错了一个错别字只能消耗算力重来。2026 年，我们需要真正的 Video as Code——用纯文本写脚本，一键编译出剪映与 CapCut 的原生多轨工程文件。
:::

---

<!-- scene: six-tracks | layout: comparison | eyebrow: 工业级时间轴体系 -->
# 工业级视听时间轴：标准 6 轨音画对齐矩阵

\`\`\`compare
传统黑盒视频 :: 视频音画混缩为单一轨道 | 字幕烧录在像素内无法修改 | 音量配乐无法独立混音
Aimake 6轨工程 :: 视觉与音频独立分层 | 词级时间戳矢量字幕 | 智能 Ducking 旁白音效动态避让
\`\`\`

::: speech
来看看这套标准的 6 轨时间轴架构：底板轨承载 4K 高清卡片，画中画轨放置局部特写与演示动画；上方是醒目的技术要点花字轨和词级对齐的字幕轨；下方则是纯净的旁白人声轨与智能降鸭的背景音乐轨。
:::
`,

  mcp: `---
title: Anthropic MCP 协议与开放外脑架构白皮书
template: linkedin-exec-carousel
locale: zh-CN
aspect: 4:5
author: Chico Gong
handle: "@chicogong"
---

<!-- scene: intro | layout: metrics | eyebrow: MCP PROTOCOL 2026 -->
# 为什么 Model Context Protocol 是连接 AI 与本地资产的终极接口？
## 从封闭孤岛到开放互联 · 打造真正属于自己的数字大脑

\`\`\`metric
- 互联数据源: 48+ 本地工具与知识库
- 协议延迟: < 5ms (本地进程间通信 IPC)
- 权限控制: 100% 颗粒化本地授权
\`\`\`

- **消除上下文碎片**：统一通过标准化 JSON-RPC 接口暴露本地文件、Git 仓库与排版引擎。
- **保护核心数据主权**：所有交互均在本地沙箱完成验证，无敏感信息泄露至第三方云端。

---

<!-- scene: comp | layout: comparison | eyebrow: ENTERPRISE ARCHITECTURE -->
# 传统插件体系 vs 标准 MCP 协议

\`\`\`compare
传统专属插件 :: 各家 LLM 生态各自为政 | 无法跨模型迁移 | 调试运维成本居高不下
Anthropic MCP :: 开放标准一套代码多端适配 | 兼容 Claude、OpenCode 与 Codex | 原生可组合与热插拔
\`\`\`
`,

  embodied: `---
title: 具身智能的世界模型演进：空间感知与动作决策
template: poster-risograph
locale: zh-CN
aspect: 1:1
author: Chico Gong
handle: "@chicogong"
---

<!-- scene: physical | layout: metrics | eyebrow: ROBOTICS 2026 -->
# 物理世界大模型与具身智能突破
## 空间感知、触觉反馈与动作决策统一编译

\`\`\`metric
- 推理帧率: 120 FPS (实时闭环控制)
- 控制精度: 0.1 mm (亚毫米级灵巧操作)
- 零样本泛化: 94.2% (跨实体机器人架构)
\`\`\`

- **统一世界表征**：从像素空间到连续物理动作轨迹的端到端可微分预测。
- **模拟到现实零间隙**：基于高保真物理仿真器完成百亿步强化学习训练。
`,

  architecture: `---
title: Aimake v1.0 多端编译引擎架构
template: ppt-linear-dark
locale: zh-CN
aspect: 16:9
author: Chico Gong
---

<!-- scene: arch-flow | layout: diagram | eyebrow: MERMAID PIPELINE -->
# 单一 Markdown 驱动全渠道视觉分发
## Mermaid 流程图 + 代码高亮 + 结构化指标在浏览器零后端直出

\`\`\`mermaid
flowchart LR
  MD[Markdown 原稿] --> Parser{AST 解析器}
  Parser -->|36 套皮肤| Slide[HTML5 舞台]
  Parser -->|离线向量| SVG[Mermaid 图表]
  Slide --> Output([PPTX · PDF · PNG · 公众号])
\`\`\`

---

<!-- scene: arch-code | layout: code | eyebrow: TYPESCRIPT SDK -->
# 开放模块化 API，三行接入工作流
## 支持 Mermaid 图表、Highlight.js 高亮与 Marp / Slidev 一键导入

\`\`\`typescript
import { importExternalMarkdownDeck, compileDeckToHtml } from 'aimake-studio';

const converted = importExternalMarkdownDeck(rawMarpOrSlidevMarkdown);
const html = await compileDeckToHtml(converted.markdown, { template: 'ppt-linear-dark' });
\`\`\`
`,

  launch: `---
title: Aimake 2.2 全新发布：本地优先的多模态创作工作台
template: apple-dark-keynote
locale: zh-CN
aspect: 16:9
author: Aimake Team
---

<!-- scene: keynote | layout: quote | eyebrow: PRODUCT LAUNCH -->
# 为超级个体与高产团队打造的终极创作底座
## 零后端依赖 · 16+ AI 助手兼容 · 一稿五出

> 真正的效率，是让每一次深度思考都自带多模态传播力。 — Aimake Manifesto
`,
};

// Aliases for backwards compatibility
STARTER_SAMPLES.creator = STARTER_SAMPLES.token;
STARTER_SAMPLES.poster = STARTER_SAMPLES.embodied;

export async function buildWebPlaygroundHtml(
  templates: MarketplaceTemplateEntry[],
  packageRoot: string
): Promise<string> {
  // Extract CSS for all 36 templates
  const templatePayloads = await Promise.all(
    templates.map(async (tpl) => {
      const tplDir = path.join(packageRoot, 'templates', tpl.id);
      let css = '';
      try {
        css = await fs.readFile(path.join(tplDir, 'styles.css'), 'utf8');
      } catch {
        css = '';
      }
      if (!css) {
        try {
          const html = await fs.readFile(path.join(tplDir, 'template.html'), 'utf8');
          const styleMatch = html.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
          if (styleMatch) css = styleMatch[1];
        } catch {
          css = '';
        }
      }
      return {
        id: tpl.id,
        name: tpl.name,
        aspect: tpl.aspect,
        category: tpl.category,
        description: tpl.description,
        css,
      };
    })
  );

  const jsonTemplates = JSON.stringify(templatePayloads).replace(/<\/script>/gi, '<\\/script>');
  const jsonSamples = JSON.stringify(STARTER_SAMPLES).replace(/<\/script>/gi, '<\\/script>');

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Aimake 在线工坊 · 零安装交互式体验 (Live Web Playground)</title>
  <meta name="description" content="无需下载安装，在浏览器中直接体验 Aimake（爱创）36 套高颜值设计系统与多模态编译排版。写 Markdown，实时编译幻灯片，一键复制微信公众号富文本或导出作品。" />
  <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 512 512'%3E%3Crect width='512' height='512' rx='113' fill='%2317152D'/%3E%3Cg%3E%3Cpath fill='%23745DFF' d='M117 121 L258 79 Q293 69 286 103 L231 370 Q226 394 205 394 H117 Q93 394 93 370 V148 Q93 130 117 121 Z'/%3E%3Crect fill='%23FFCB49' x='304' y='98' width='156' height='156' rx='28'/%3E%3Cpath fill='%23B7AAFF' d='M292 273 H346 Q364 273 360 296 L345 379 Q342 395 321 395 H276 Q258 395 263 377 L281 295 Q285 273 292 273 Z'/%3E%3Cpath fill='%23FF6B74' d='M460 282 V368 Q460 395 432 395 H361 Q358 395 359 384 C367 316 399 286 448 282 Z'/%3E%3C/g%3E%3C/svg%3E" />
  <script>
    (function() {
      try {
        var saved = localStorage.getItem('aimake-theme');
        var theme = saved || 'dark';
        document.documentElement.setAttribute('data-theme', theme);
        document.documentElement.style.colorScheme = theme;
      } catch(e) {}
    })();
  </script>
  <style>
    :root {
      --bg: #0c0c0e;
      --sidebar: #121215;
      --surface: #18181d;
      --surface-elev: #222229;
      --border: rgba(255, 255, 255, 0.09);
      --border-strong: rgba(255, 255, 255, 0.16);
      --ink: #f4f4f6;
      --ink-muted: #9898a6;
      --accent: #f5f4f0;
      --accent-hover: #ffffff;
      --accent-ink: #111113;
      --hot: #d94e28;
      --live: #10b981;
      --font-sans: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'PingFang SC', sans-serif;
      --font-mono: 'SF Mono', Menlo, Consolas, monospace;
    }

    [data-theme="light"] {
      --bg: #f8fafc;
      --sidebar: #ffffff;
      --surface: #f1f5f9;
      --surface-elev: #ffffff;
      --border: rgba(0, 0, 0, 0.09);
      --border-strong: rgba(0, 0, 0, 0.18);
      --ink: #0f172a;
      --ink-muted: #64748b;
      --accent: #0f172a;
      --accent-hover: #1e293b;
      --accent-ink: #ffffff;
    }

    * { box-sizing: border-box; }
    html, body {
      margin: 0; padding: 0; height: 100%;
      background: var(--bg); color: var(--ink);
      font-family: var(--font-sans); font-size: 13px;
      overflow: hidden;
      -webkit-font-smoothing: antialiased;
    }
    .ic, .lucide-icon {
      width: 13px; height: 13px;
      display: inline-block; vertical-align: middle; flex-shrink: 0;
    }
    header.pg-topbar {
      height: 50px;
      background: rgba(18, 18, 21, 0.94);
      backdrop-filter: blur(18px);
      border-bottom: 1px solid var(--border);
      display: flex; align-items: center; justify-content: space-between;
      gap: 8px;
      padding: 0 12px;
      z-index: 20;
    }
    [data-theme="light"] header.pg-topbar {
      background: rgba(255, 255, 255, 0.94);
      border-bottom: 1px solid rgba(0, 0, 0, 0.08);
    }
    .pg-brand-wrap {
      display: flex; align-items: center; gap: 8px; flex-shrink: 0;
    }
    .pg-brand {
      display: flex; align-items: center; gap: 7px;
      text-decoration: none; color: var(--ink);
      white-space: nowrap; flex-shrink: 0;
    }
    .pg-brand strong {
      font-size: 13.5px; letter-spacing: -0.02em; white-space: nowrap;
    }
    .pg-back-home {
      display: inline-flex; align-items: center; justify-content: center;
      width: 26px; height: 26px; border-radius: 6px;
      color: var(--ink-muted); text-decoration: none;
      transition: all 0.15s ease;
    }
    .pg-back-home:hover {
      background: var(--surface); color: var(--ink);
    }
    .pg-badge {
      font-size: 10px; padding: 2px 7px; border-radius: 999px;
      background: rgba(245, 244, 240, 0.08);
      border: 1px solid var(--border);
      color: var(--ink-muted); font-weight: 600;
      letter-spacing: 0.02em;
      white-space: nowrap; flex-shrink: 0;
    }
    [data-theme="light"] .pg-badge {
      background: rgba(0, 0, 0, 0.05);
      border-color: rgba(0, 0, 0, 0.1);
      color: #475569;
    }
    .pg-controls {
      display: flex; align-items: center; gap: 6px;
      min-width: 0; flex-wrap: nowrap;
      overflow-x: auto; scrollbar-width: none;
    }
    .pg-controls::-webkit-scrollbar { display: none; }
    .pg-control-sep {
      width: 1px; height: 16px;
      background: var(--border);
      flex-shrink: 0; margin: 0 2px;
    }
    .pg-select {
      background: var(--surface); color: var(--ink);
      border: 1px solid var(--border); border-radius: 6px;
      height: 32px; padding: 0 10px; font-size: 11.5px; outline: none;
      max-width: 170px; min-width: 90px;
      white-space: nowrap; text-overflow: ellipsis;
      transition: border-color 0.15s ease;
    }
    [data-theme="light"] .pg-select,
    [data-theme="light"] .pg-btn {
      background: #ffffff;
      color: #0f172a;
      border: 1px solid rgba(0, 0, 0, 0.12);
    }
    .pg-select:hover, .pg-select:focus { border-color: var(--border-strong); }
    .pg-btn {
      background: var(--surface); color: var(--ink);
      border: 1px solid var(--border); border-radius: 6px;
      height: 32px; padding: 0 10px; font-size: 11.5px; font-weight: 500;
      cursor: pointer; display: inline-flex; align-items: center; justify-content: center; gap: 5px;
      white-space: nowrap; flex-shrink: 0;
      transition: all 0.15s ease;
      box-sizing: border-box;
    }
    .pg-btn:hover { background: var(--surface-elev); border-color: var(--border-strong); color: var(--ink); }
    [data-theme="light"] .pg-btn:hover { background: #f8fafc; border-color: rgba(0,0,0,0.22); }
    .pg-btn-primary {
      background: #745dff; color: #ffffff;
      border-color: #745dff; font-weight: 600;
      box-shadow: 0 2px 8px rgba(116, 93, 255, 0.35);
    }
    .pg-btn-primary:hover {
      background: #6046f8; border-color: #6046f8; color: #ffffff;
    }
    [data-theme="light"] .pg-btn-primary {
      background: #4f46e5; color: #ffffff; border-color: #4f46e5;
      box-shadow: 0 2px 8px rgba(79, 70, 229, 0.25);
    }

    .pg-theme-btn {
      width: 32px; height: 32px; padding: 0;
    }
    .pg-theme-btn svg { width: 14px; height: 14px; }
    .pg-theme-btn .icon-moon { display: none; }
    .pg-theme-btn .icon-sun { display: block; }
    [data-theme="light"] .pg-theme-btn .icon-sun { display: none; }
    [data-theme="light"] .pg-theme-btn .icon-moon { display: block; }

    /* Mobile segmented mode switch (visible only on <= 820px) */
    .pg-mobile-nav {
      display: none;
      height: 36px;
      background: var(--surface);
      border-bottom: 1px solid var(--border);
      padding: 0 10px;
      align-items: center;
      justify-content: center;
      gap: 6px;
      z-index: 15;
    }
    .pg-mobile-tab-btn {
      flex: 1; height: 26px;
      border-radius: 6px; border: 1px solid transparent;
      background: transparent; color: var(--ink-muted);
      font-size: 11.5px; font-weight: 500; cursor: pointer;
    }
    .pg-mobile-tab-btn.active {
      background: var(--surface-elev); color: var(--ink); font-weight: 600;
      border-color: var(--border);
    }

    .pg-body {
      display: grid; grid-template-columns: 430px 1fr;
      height: calc(100% - 50px);
    }
    @media (max-width: 820px) {
      .pg-mobile-nav { display: flex; }
      .pg-body {
        display: block;
        height: calc(100% - 86px);
        position: relative;
      }
      .editor-pane, .stage-pane {
        width: 100% !important; height: 100% !important;
      }
      .pg-body[data-mobile-view="edit"] .stage-pane { display: none !important; }
      .pg-body[data-mobile-view="edit"] .editor-pane { display: flex !important; }
      .pg-body[data-mobile-view="preview"] .editor-pane { display: none !important; }
      .pg-body[data-mobile-view="preview"] .stage-pane { display: flex !important; }
    }

    /* Left Pane: Dual-Mode Editor */
    .editor-pane {
      background: var(--sidebar);
      border-right: 1px solid var(--border);
      display: flex; flex-direction: column;
      height: 100%; min-width: 0;
    }
    [data-theme="light"] .editor-pane {
      background: #ffffff;
      border-right: 1px solid rgba(0, 0, 0, 0.08);
    }
    .editor-tabs-bar {
      height: 38px; padding: 0 12px;
      display: flex; align-items: center; justify-content: space-between;
      gap: 8px;
      border-bottom: 1px solid var(--border);
      background: var(--surface);
    }
    [data-theme="light"] .editor-tabs-bar {
      background: #f8fafc;
      border-bottom: 1px solid rgba(0, 0, 0, 0.08);
    }
    .editor-segmented {
      display: inline-flex; padding: 2px; gap: 2px;
      background: var(--bg); border: 1px solid var(--border); border-radius: 7px;
    }
    .editor-tab-btn {
      height: 24px; padding: 0 9px; border: none; border-radius: 5px;
      background: transparent; color: var(--ink-muted);
      font-size: 11.5px; font-weight: 500; cursor: pointer;
      display: inline-flex; align-items: center; gap: 4px;
      white-space: nowrap; transition: all 0.15s ease;
    }
    .editor-tab-btn.active {
      background: var(--surface-elev); color: var(--ink); font-weight: 600;
    }
    .editor-head {
      height: 36px; padding: 0 12px;
      display: flex; align-items: center; justify-content: space-between;
      gap: 6px;
      border-bottom: 1px solid var(--border);
      font-size: 11px; color: var(--ink-muted);
      background: var(--sidebar);
    }
    [data-theme="light"] .editor-head {
      background: #ffffff;
      border-bottom: 1px solid rgba(0, 0, 0, 0.08);
    }
    .editor-head > span { white-space: nowrap; flex-shrink: 0; }
    .snippet-chips {
      display: flex; gap: 4px; flex-wrap: nowrap;
      overflow-x: auto; scrollbar-width: none;
    }
    .snippet-chips::-webkit-scrollbar { display: none; }
    .chip-btn {
      background: var(--surface); border: 1px solid var(--border);
      color: var(--ink-muted); border-radius: 5px; padding: 3px 7px;
      font-size: 11px; cursor: pointer;
      white-space: nowrap; flex-shrink: 0;
      transition: all 0.14s ease;
    }
    .chip-btn:hover { color: var(--ink); border-color: var(--border-strong); background: var(--surface-elev); }

    #md-input {
      flex: 1; width: 100%; background: transparent;
      color: #e4e4e7; border: none; outline: none;
      padding: 14px; font-family: var(--font-mono); font-size: 12.5px;
      line-height: 1.65; resize: none;
    }
    [data-theme="light"] #md-input {
      color: #0f172a;
    }
    #card-editor-pane {
      flex: 1; overflow-y: auto; padding: 12px 14px;
      display: flex; flex-direction: column; gap: 11px;
    }
    #card-editor-pane.hidden, #source-editor-wrap.hidden {
      display: none !important;
    }
    #source-editor-wrap {
      flex: 1; display: flex; flex-direction: column; min-height: 0;
    }
    .card-pills-row {
      display: flex; align-items: center; justify-content: space-between; gap: 8px;
    }
    .card-slide-pills {
      display: flex; gap: 5px; flex-wrap: wrap;
    }
    .card-pill {
      height: 25px; min-width: 32px; padding: 0 8px;
      border-radius: 6px; border: 1px solid var(--border);
      background: var(--surface); color: var(--ink-muted);
      font-family: var(--font-mono); font-size: 11px; font-weight: 600;
      cursor: pointer; transition: all 0.14s ease;
    }
    .card-pill:hover { border-color: var(--border-strong); color: var(--ink); }
    .card-pill.active {
      background: var(--accent); color: var(--accent-ink); border-color: var(--accent);
    }
    .card-field { display: flex; flex-direction: column; gap: 4px; }
    .card-field label {
      font-size: 11px; font-weight: 600; color: var(--ink-muted);
      letter-spacing: 0.02em;
    }
    .card-input, .card-textarea {
      width: 100%; background: var(--surface); color: var(--ink);
      border: 1px solid var(--border); border-radius: 7px;
      padding: 7px 10px; font-family: var(--font-sans); font-size: 12.5px;
      outline: none; transition: border-color 0.14s ease;
    }
    .card-textarea {
      font-family: var(--font-mono); font-size: 12px; line-height: 1.55; resize: vertical;
    }
    .card-input:focus, .card-textarea:focus { border-color: var(--border-strong); }

    .editor-footer {
      height: 32px; padding: 0 12px;
      display: flex; align-items: center; justify-content: space-between;
      border-top: 1px solid var(--border);
      font-size: 11px; color: var(--ink-muted);
      background: var(--surface);
    }
    [data-theme="light"] .editor-footer {
      background: #f8fafc;
      border-top: 1px solid rgba(0, 0, 0, 0.08);
    }

    /* Right Pane: Optical Darkroom Stage */
    .stage-pane {
      background:
        radial-gradient(circle at 50% 42%, rgba(255, 255, 255, 0.03), transparent 62%),
        radial-gradient(rgba(255, 255, 255, 0.06) 1px, transparent 1px),
        #09090b;
      background-size: 100% 100%, 22px 22px, auto;
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      position: relative; overflow: hidden;
      padding: 18px 20px 64px;
    }
    [data-theme="light"] .stage-pane {
      background:
        radial-gradient(circle at 50% 42%, rgba(0, 0, 0, 0.03), transparent 62%),
        radial-gradient(rgba(0, 0, 0, 0.05) 1px, transparent 1px),
        #e2e8f0;
      background-size: 100% 100%, 22px 22px, auto;
    }
    .stage-viewport {
      width: 100%; height: 100%;
      display: flex; align-items: center; justify-content: center;
    }
    #preview-frame {
      width: 100%; height: 100%;
      border: 1px solid var(--border);
      border-radius: 12px;
      background: #0c0c0e;
      box-shadow: 0 24px 56px rgba(0,0,0,0.58);
    }
    [data-theme="light"] #preview-frame {
      background: #ffffff;
      border-color: rgba(0,0,0,0.12);
      box-shadow: 0 20px 48px rgba(0,0,0,0.12);
    }
    .pg-stage-dock {
      position: absolute;
      bottom: 14px;
      left: 50%;
      transform: translateX(-50%);
      height: 38px;
      padding: 0 10px;
      border-radius: 999px;
      background: rgba(24, 24, 29, 0.92);
      backdrop-filter: blur(18px);
      border: 1px solid rgba(255, 255, 255, 0.14);
      display: inline-flex;
      align-items: center;
      gap: 6px;
      z-index: 25;
      box-shadow: 0 10px 28px rgba(0, 0, 0, 0.52);
    }
    [data-theme="light"] .pg-stage-dock {
      background: rgba(255, 255, 255, 0.94);
      border-color: rgba(0, 0, 0, 0.12);
      box-shadow: 0 10px 28px rgba(0, 0, 0, 0.12);
    }
    .pg-dock-btn {
      height: 26px;
      padding: 0 9px;
      border-radius: 999px;
      border: 1px solid transparent;
      background: transparent;
      color: var(--ink);
      font-size: 11.5px;
      cursor: pointer;
      white-space: nowrap;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
    }
    .pg-dock-btn:hover { background: rgba(255, 255, 255, 0.1); }
    [data-theme="light"] .pg-dock-btn:hover { background: rgba(0, 0, 0, 0.06); }
    .pg-slide-indicator {
      font-family: var(--font-mono);
      font-size: 11.5px;
      color: var(--ink-muted);
      padding: 0 4px;
      white-space: nowrap;
    }
    .pg-slide-pills {
      display: inline-flex;
      align-items: center;
      gap: 3px;
      max-width: 220px;
      overflow-x: auto;
      scrollbar-width: none;
      scroll-behavior: smooth;
    }
    .pg-slide-pills::-webkit-scrollbar { display: none; }
    .pg-slide-pill {
      min-width: 24px;
      height: 24px;
      padding: 0 6px;
      border-radius: 999px;
      border: 1px solid transparent;
      background: transparent;
      color: var(--ink-muted);
      font-family: var(--font-mono);
      font-size: 11px;
      font-weight: 500;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      transition: all 0.12s ease;
    }
    .pg-slide-pill:hover {
      background: rgba(255, 255, 255, 0.1);
      color: var(--ink);
    }
    .pg-slide-pill.active {
      background: #ffffff;
      color: #111113;
      font-weight: 700;
      box-shadow: 0 1px 4px rgba(0,0,0,0.4);
      transform: scale(1.05);
    }
    [data-theme="light"] .pg-slide-pill.active {
      background: #0f172a;
      color: #ffffff;
    }
    .pg-quick-actions {
      display: inline-flex;
      align-items: center;
      gap: 2px;
      background: rgba(255, 255, 255, 0.06);
      padding: 1px 2px;
      border-radius: 999px;
    }
    [data-theme="light"] .pg-quick-actions {
      background: rgba(0, 0, 0, 0.05);
    }
    .pg-dock-icon-btn {
      width: 24px;
      height: 24px;
      border-radius: 999px;
      border: none;
      background: transparent;
      color: var(--ink-muted);
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      transition: all 0.12s ease;
    }
    .pg-dock-icon-btn:hover {
      background: rgba(255, 255, 255, 0.14);
      color: var(--ink);
    }
    .pg-dock-icon-btn-danger:hover {
      background: rgba(217, 78, 40, 0.25) !important;
      color: #f87171 !important;
    }
    .spin {
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    .fullscreen-mode #preview-frame {
      position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
      border: none; border-radius: 0; z-index: 9999;
    }
    .fullscreen-mode .pg-stage-dock {
      z-index: 10001;
    }

    /* Template Visual Gallery Drawer */
    .drawer-backdrop {
      position: fixed; inset: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(4px);
      z-index: 9000; opacity: 0; pointer-events: none; transition: opacity 0.25s ease;
    }
    .drawer-backdrop.show { opacity: 1; pointer-events: auto; }
    .template-drawer {
      position: fixed; top: 0; right: -500px; width: 460px; max-width: 92vw; height: 100%;
      background: var(--sidebar); border-left: 1px solid var(--border);
      box-shadow: -10px 0 35px rgba(0,0,0,0.5); z-index: 9001;
      display: flex; flex-direction: column; transition: right 0.28s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .template-drawer.show { right: 0; }
    .drawer-header {
      height: 50px; padding: 0 16px; display: flex; align-items: center; justify-content: space-between;
      border-bottom: 1px solid var(--border);
    }
    .drawer-header h3 { margin: 0; font-size: 13.5px; font-weight: 600; color: var(--ink); }
    .drawer-close {
      background: transparent; border: none; color: var(--ink-muted); font-size: 18px; cursor: pointer; padding: 4px;
      border-radius: 6px;
    }
    .drawer-close:hover { color: var(--ink); background: var(--surface); }
    .drawer-filter-bar {
      padding: 10px 14px; border-bottom: 1px solid var(--border);
      display: flex; flex-direction: column; gap: 8px; background: var(--surface);
    }
    .drawer-search {
      width: 100%; height: 32px; background: var(--bg); border: 1px solid var(--border);
      border-radius: 6px; padding: 0 10px; color: var(--ink); font-size: 12px; outline: none;
    }
    .drawer-pills {
      display: flex; gap: 5px; overflow-x: auto; scrollbar-width: none;
    }
    .drawer-pill {
      height: 24px; padding: 0 9px; font-size: 11px; border-radius: 999px;
      border: 1px solid var(--border); background: var(--surface-elev); color: var(--ink-muted);
      cursor: pointer; white-space: nowrap; flex-shrink: 0;
    }
    .drawer-pill.active {
      background: var(--ink); color: var(--bg); border-color: var(--ink); font-weight: 600;
    }
    .drawer-grid {
      flex: 1; overflow-y: auto; padding: 14px; display: flex; flex-direction: column; gap: 10px;
    }
    .drawer-card {
      background: var(--surface); border: 1px solid var(--border); border-radius: 8px;
      padding: 12px; display: flex; flex-direction: column; gap: 6px; cursor: pointer;
      transition: all 0.15s ease; text-align: left;
    }
    .drawer-card:hover {
      border-color: var(--border-strong); background: var(--surface-elev); transform: translateY(-1px);
    }
    .drawer-card.active {
      border-color: #745dff; box-shadow: 0 0 0 2px rgba(116, 93, 255, 0.25);
    }
    .drawer-card-top {
      display: flex; align-items: center; justify-content: space-between; gap: 8px;
    }
    .drawer-card-title {
      font-size: 13px; font-weight: 600; color: var(--ink);
    }
    .drawer-card-aspect {
      font-size: 10px; font-family: var(--font-mono); padding: 2px 6px; border-radius: 4px;
      background: rgba(255,255,255,0.08); color: var(--ink-muted); font-weight: 600;
    }
    [data-theme="light"] .drawer-card-aspect {
      background: rgba(0,0,0,0.06); color: #475569;
    }
    .drawer-card-desc {
      font-size: 11.5px; color: var(--ink-muted); line-height: 1.45;
    }

    /* Toast */
    #toast {
      position: fixed; top: 60px; left: 50%;
      transform: translateX(-50%) translateY(-8px);
      background: var(--surface-elev); color: var(--ink);
      border: 1px solid var(--border-strong); border-radius: 999px;
      padding: 8px 16px; font-size: 12px; font-weight: 550;
      box-shadow: 0 10px 25px rgba(0,0,0,0.52);
      opacity: 0; transition: all 0.2s ease; pointer-events: none; z-index: 10002;
      white-space: nowrap;
    }
    #toast.show { opacity: 1; transform: translateX(-50%) translateY(0); }
  </style>
</head>
<body>
  <header class="pg-topbar">
    <div class="pg-brand-wrap">
      <a href="/" class="pg-back-home" title="返回官网首页" aria-label="返回官网首页">
        ${lucideIcon('chevronLeft')}
      </a>
      <a href="/" class="pg-brand" title="返回官网首页">
        <svg width="20" height="20" viewBox="0 0 32 32" fill="none" style="flex-shrink:0;">
          <rect width="32" height="32" rx="8" fill="#18181D" stroke="rgba(255,255,255,0.14)"></rect>
          <path d="M13 6 4 24 20 27Z" fill="#F5F4F0"></path>
          <path d="M14.5 5.65 21 4 28 25 21.4 26.65Z" fill="#D94E28"></path>
        </svg>
        <strong>Aimake 爱创工坊</strong>
      </a>
      <span class="pg-badge">Web Studio</span>
    </div>

    <div class="pg-controls">
      <select class="pg-select" id="sample-select" title="载入示范原稿">
        <optgroup label="🔥 2026 前沿时事实战爆款">
          <option value="deepseek">DeepSeek-R1 本地蒸馏 (3:4)</option>
          <option value="agent">2026 AI Agent 端到端闭环 (16:9)</option>
          <option value="token">超级个体千亿飞轮 (微信长文)</option>
          <option value="podcast">午夜播客 6轨视听 (9:16视频)</option>
          <option value="mcp">Anthropic MCP 协议白皮书 (4:5)</option>
          <option value="embodied">具身智能世界模型 (1:1海报)</option>
        </optgroup>
        <optgroup label="💎 经典多模态排版示范">
          <option value="architecture">Aimake 架构 Mermaid 流程图 (16:9)</option>
          <option value="launch">苹果便当盒 Keynote 发布会 (16:9)</option>
        </optgroup>
      </select>

      <button class="pg-btn" id="btn-reset-sample" title="重置当前示范原稿">${lucideIcon('rotateCcw')} 重置</button>

      <select class="pg-select" id="template-select" title="切换 36 套设计模板">
        ${templates
          .map(
            (t) =>
              `<option value="${t.id}">${t.name.zh || t.id} · ${t.aspect}</option>`
          )
          .join('')}
      </select>

      <button class="pg-btn" id="btn-open-templates" title="打开 36 套设计模板视觉抽屉">${lucideIcon('layoutGrid')} 模板库</button>

      <select class="pg-select" id="aspect-select" style="max-width:110px;" title="强制指定画幅比例">
        <option value="auto">画幅: 跟随模板</option>
        <option value="16:9">16:9 宽屏</option>
        <option value="3:4">3:4 小红书</option>
        <option value="9:16">9:16 竖屏</option>
        <option value="1:1">1:1 方图</option>
        <option value="4:5">4:5 长图</option>
      </select>

      <span class="pg-control-sep"></span>

      <button class="pg-btn" id="btn-humanize" title="四语种去 AI 套话清洗器">${lucideIcon('wand')} 去AI味</button>

      <span class="pg-control-sep"></span>

      <button class="pg-btn pg-btn-primary" id="btn-copy-wechat" title="一键复制内联富文本，直粘公众号后台">${lucideIcon('copy')} 复制公众号</button>
      <button class="pg-btn" id="btn-export-png" title="将当前页导出为高清 PNG 图片">${lucideIcon('image')} 导图</button>
      <button class="pg-btn" id="btn-print-pdf" title="打印 / 另存为 PDF 演示文稿">${lucideIcon('printer')} PDF</button>
      <button class="pg-btn" id="btn-download-md" title="下载 .deck.md 原稿">${lucideIcon('download')} 下载</button>
      <button class="pg-btn" id="btn-fullscreen" title="全屏演示 (F)">${lucideIcon('maximize')} 全屏</button>

      <span class="pg-control-sep"></span>

      <button type="button" id="theme-toggle-btn" class="pg-btn pg-theme-btn" onclick="togglePlaygroundTheme()" aria-label="切换浅色 / 深色模式" title="切换浅色 / 深色模式">
        <svg class="icon-sun" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
        <svg class="icon-moon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
      </button>
    </div>
  </header>

  <!-- Mobile Segmented View Navigation (<= 820px) -->
  <div class="pg-mobile-nav" id="pg-mobile-nav">
    <button class="pg-mobile-tab-btn active" id="btn-mob-edit" onclick="setMobileView('edit')">代码编辑 (Markdown)</button>
    <button class="pg-mobile-tab-btn" id="btn-mob-preview" onclick="setMobileView('preview')">视觉舞台 (实时渲染)</button>
  </div>

  <main class="pg-body" id="pg-body" data-mobile-view="edit">
    <!-- Left Dual-Mode Editor Pane -->
    <section class="editor-pane">
      <div class="editor-tabs-bar">
        <div class="editor-segmented" role="tablist" aria-label="编辑模式">
          <button class="editor-tab-btn active" id="tab-mode-source" role="tab" aria-selected="true">${lucideIcon('code')} Markdown 源码</button>
          <button class="editor-tab-btn" id="tab-mode-card" role="tab" aria-selected="false">${lucideIcon('layers')} 卡片编辑</button>
        </div>
        <span style="font-size:11px;color:var(--ink-muted);white-space:nowrap;">本地零延迟编译</span>
      </div>

      <div id="source-editor-wrap">
        <div class="editor-head">
          <span>原稿 (.deck.md)</span>
          <div class="snippet-chips">
            <button class="chip-btn" data-insert="metric">+指标</button>
            <button class="chip-btn" data-insert="mermaid">+流程图</button>
            <button class="chip-btn" data-insert="compare">+对比</button>
            <button class="chip-btn" data-insert="code">+代码</button>
            <button class="chip-btn" data-insert="quote">+金句</button>
            <button class="chip-btn" data-insert="slide">+加页</button>
          </div>
        </div>
        <textarea id="md-input" spellcheck="false" placeholder="在此编写或粘贴 Markdown 原稿…"></textarea>
      </div>

      <div id="card-editor-pane" class="hidden" aria-label="卡片可视化编辑">
        <div class="card-pills-row">
          <div class="card-slide-pills" id="card-slide-pills"></div>
          <button class="chip-btn" id="btn-card-add-slide" type="button">+ 新增页</button>
        </div>
        <div class="card-field">
          <label for="card-eyebrow">眉题 / 章节标签 (Eyebrow)</label>
          <input class="card-input" id="card-eyebrow" type="text" placeholder="例如：CORE WORKFLOW" />
        </div>
        <div class="card-field">
          <label for="card-title">主标题 (Heading 1)</label>
          <input class="card-input" id="card-title" type="text" placeholder="输入核心标题..." />
        </div>
        <div class="card-field">
          <label for="card-subtitle">副标题 (Heading 2)</label>
          <input class="card-input" id="card-subtitle" type="text" placeholder="补充一句阐述观点..." />
        </div>
        <div class="card-field">
          <label for="card-bullets">核心要点 (每行一条)</label>
          <textarea class="card-textarea" id="card-bullets" rows="4" placeholder="- 第一条论据&#10;- 第二条数据支撑"></textarea>
        </div>
        <div class="card-field">
          <label for="card-extra">结构化模块 (Mermaid / Metric / Code / Quote)</label>
          <textarea class="card-textarea" id="card-extra" rows="6" placeholder="保留或编辑本页的图表、指标、对比或金句模块..."></textarea>
        </div>
      </div>

      <div class="editor-footer">
        <span id="char-count">0 字符 · 0 页</span>
        <span>${lucideIcon('sparkles')} 纯前端沙盒运行</span>
      </div>
    </section>

    <!-- Right Live Preview Stage -->
    <section class="stage-pane">
      <div class="stage-viewport">
        <iframe id="preview-frame" title="Aimake 实时视觉舞台"></iframe>
      </div>
      <div class="pg-stage-dock" role="toolbar" aria-label="幻灯片翻页">
        <button class="pg-dock-btn" id="pg-prev-slide" title="上一页 (← / PageUp)">${lucideIcon('chevronLeft')} 上一页</button>
        <div class="pg-slide-pills" id="pg-slide-pills"></div>
        <span class="pg-slide-indicator" id="pg-slide-indicator">01 / 01</span>
        <button class="pg-dock-btn" id="pg-next-slide" title="下一页 (→ / PageDown / 空格)">下一页 ${lucideIcon('chevronRight')}</button>
        <span class="pg-control-sep"></span>
        <div class="pg-quick-actions">
          <button class="pg-dock-icon-btn" id="pg-add-slide" title="在末尾新增一页">${lucideIcon('plus')}</button>
          <button class="pg-dock-icon-btn" id="pg-dup-slide" title="复制当前页">${lucideIcon('copy')}</button>
          <button class="pg-dock-icon-btn pg-dock-icon-btn-danger" id="pg-del-slide" title="删除当前页">${lucideIcon('trash')}</button>
        </div>
        <span class="pg-control-sep"></span>
        <button class="pg-dock-btn" id="pg-view-mode" title="切换单页聚焦 / 全部平铺">${lucideIcon('layoutGrid')} 单页视图</button>
      </div>
    </section>
  </main>

  <!-- Template Visual Drawer -->
  <div id="template-drawer-backdrop" class="drawer-backdrop" onclick="closeTemplateDrawer()"></div>
  <aside id="template-drawer" class="template-drawer" aria-label="设计系统与模板库">
    <div class="drawer-header">
      <h3>36 套设计模板库</h3>
      <button class="drawer-close" onclick="closeTemplateDrawer()" aria-label="关闭">✕</button>
    </div>
    <div class="drawer-filter-bar">
      <input type="search" id="drawer-search" class="drawer-search" placeholder="搜索模板名称、风格或比例..." oninput="filterTemplates()" />
      <div class="drawer-pills" id="drawer-pills">
        <button class="drawer-pill active" data-cat="all" onclick="filterCategory('all')">全部 (36)</button>
        <button class="drawer-pill" data-cat="16:9" onclick="filterCategory('16:9')">16:9 商业演示</button>
        <button class="drawer-pill" data-cat="3:4" onclick="filterCategory('3:4')">3:4 小红书</button>
        <button class="drawer-pill" data-cat="9:16" onclick="filterCategory('9:16')">9:16 动效视频</button>
        <button class="drawer-pill" data-cat="4:5" onclick="filterCategory('4:5')">4:5 专栏长图</button>
        <button class="drawer-pill" data-cat="1:1" onclick="filterCategory('1:1')">1:1 极简海报</button>
      </div>
    </div>
    <div class="drawer-grid" id="drawer-grid"></div>
  </aside>

  <div id="toast"></div>

  <script>
    const TEMPLATES_DATA = ${jsonTemplates};
    const SAMPLES = ${jsonSamples};
    const TEMPLATE_MAP = new Map(TEMPLATES_DATA.map(t => [t.id, t]));

    const elInput = document.getElementById('md-input');
    const elSample = document.getElementById('sample-select');
    const elTemplate = document.getElementById('template-select');
    const elAspect = document.getElementById('aspect-select');
    const elFrame = document.getElementById('preview-frame');
    const elCharCount = document.getElementById('char-count');
    const elToast = document.getElementById('toast');
    const elBody = document.getElementById('pg-body');

    function showToast(msg) {
      elToast.textContent = msg;
      elToast.classList.add('show');
      setTimeout(() => elToast.classList.remove('show'), 2400);
    }

    // Theme Switcher
    function initPlaygroundTheme() {
      let saved = null;
      try { saved = localStorage.getItem('aimake-theme'); } catch(_) {}
      const theme = saved || 'dark';
      document.documentElement.setAttribute('data-theme', theme);
      updateThemeIcon(theme);
    }
    function updateThemeIcon(theme) {
      const btn = document.getElementById('theme-toggle-btn');
      if (!btn) return;
      const sun = btn.querySelector('.icon-sun');
      const moon = btn.querySelector('.icon-moon');
      if (theme === 'light') {
        if (sun) sun.style.display = 'none';
        if (moon) moon.style.display = 'block';
      } else {
        if (sun) sun.style.display = 'block';
        if (moon) moon.style.display = 'none';
      }
    }
    function togglePlaygroundTheme() {
      const cur = document.documentElement.getAttribute('data-theme') || 'dark';
      const next = cur === 'light' ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', next);
      try { localStorage.setItem('aimake-theme', next); } catch(_) {}
      updateThemeIcon(next);
      scheduleCompile();
      showToast(next === 'light' ? '已切换至浅色模式' : '已切换至深色模式');
    }
    window.togglePlaygroundTheme = togglePlaygroundTheme;
    initPlaygroundTheme();

    // Mobile View Switcher
    function setMobileView(view) {
      elBody.setAttribute('data-mobile-view', view);
      document.getElementById('btn-mob-edit').classList.toggle('active', view === 'edit');
      document.getElementById('btn-mob-preview').classList.toggle('active', view === 'preview');
    }
    window.setMobileView = setMobileView;

    // URL Query Parameter Handling (?sample=...&template=...&title=...)
    const urlParams = new URLSearchParams(window.location.search);
    const paramSample = urlParams.get('sample') || urlParams.get('work');
    const paramTemplate = urlParams.get('template');
    const paramTitle = urlParams.get('title');

    let initialMarkdown = '';
    if (paramSample && SAMPLES[paramSample]) {
      initialMarkdown = SAMPLES[paramSample];
      if (elSample) elSample.value = paramSample;
    } else if (paramTemplate || paramTitle) {
      // Find template match
      let matchedKey = 'agent';
      for (const [k, sText] of Object.entries(SAMPLES)) {
        if (paramTemplate && sText.includes('template: ' + paramTemplate)) {
          matchedKey = k;
          break;
        }
      }
      initialMarkdown = SAMPLES[matchedKey];
      if (paramTemplate) {
        initialMarkdown = initialMarkdown.replace(/^template:.*$/m, 'template: ' + paramTemplate);
        if (elTemplate) elTemplate.value = paramTemplate;
      }
      if (paramTitle) {
        initialMarkdown = initialMarkdown.replace(/^title:.*$/m, 'title: ' + paramTitle);
        initialMarkdown = initialMarkdown.replace(/^# .*$/m, '# ' + paramTitle);
      }
      if (elSample) elSample.value = matchedKey;
    } else {
      let saved = null;
      try {
        saved = localStorage.getItem('aimake_playground_md');
      } catch (_) {}
      initialMarkdown = (saved && saved.trim()) || SAMPLES.agent;
    }
    elInput.value = initialMarkdown;

    // Reset Sample Button
    const btnReset = document.getElementById('btn-reset-sample');
    if (btnReset) {
      btnReset.addEventListener('click', () => {
        const curSampleKey = elSample.value || 'agent';
        if (SAMPLES[curSampleKey]) {
          elInput.value = SAMPLES[curSampleKey];
          try { localStorage.setItem('aimake_playground_md', elInput.value); } catch(_) {}
          currentSlideIdx = 0;
          compileNow();
          showToast('已重置当前示范原稿');
        }
      });
    }

    let currentSlideIdx = 0;
    let viewMode = 'single'; // 'single' | 'all'
    let totalSlides = 1;

    // Simple robust client-side parser & compiler (never leaks fenced blocks into bullets)
    function parseClientMarkdown(mdText) {
      let fm = { title: 'Untitled', template: 'apple-bento-launch', locale: 'zh-CN', aspect: '16:9' };
      let bodyText = mdText;

      const fmMatch = mdText.match(/^---\\n([\\s\\S]*?)\\n---\\n?([\\s\\S]*)$/);
      if (fmMatch) {
        bodyText = fmMatch[2];
        const lines = fmMatch[1].split('\\n');
        for (const line of lines) {
          const m = line.match(/^([a-zA-Z0-9_-]+):\\s*(.*)$/);
          if (m) {
            const k = m[1].trim();
            let v = m[2].trim().replace(/^['"]|['"]$/g, '');
            fm[k] = v;
          }
        }
      }

      // Split slides outside fenced code blocks
      const T3 = String.fromCharCode(96, 96, 96);
      const rawSlides = [];
      let curSlideLines = [];
      let splitFence = false;
      for (const ln of bodyText.replace(/\\r\\n/g, '\\n').split('\\n')) {
        const trim = ln.trim();
        if (trim.startsWith(T3)) {
          splitFence = !splitFence;
          curSlideLines.push(ln);
          continue;
        }
        if (!splitFence && /^---+\\s*$/.test(trim)) {
          if (curSlideLines.join('\\n').trim()) rawSlides.push(curSlideLines.join('\\n').trim());
          curSlideLines = [];
          continue;
        }
        curSlideLines.push(ln);
      }
      if (curSlideLines.join('\\n').trim()) rawSlides.push(curSlideLines.join('\\n').trim());

      const slides = rawSlides.map((raw, idx) => {
        let eyebrow = '';
        let title = '';
        let subtitle = '';
        let bullets = [];
        let metrics = [];
        let comparison = null;
        let diagram = null;
        let code = null;
        let quote = null;
        const extraChunks = [];

        const commentMatch = raw.match(/<!--\\s*([\\s\\S]*?)\\s*-->/);
        if (commentMatch) {
          const parts = commentMatch[1].split('|');
          for (const p of parts) {
            const kv = p.split(':');
            if (kv.length >= 2) {
              const k = kv[0].trim();
              const v = kv.slice(1).join(':').trim();
              if (k === 'eyebrow') eyebrow = v;
            }
          }
        }

        const cleanedRaw = raw
          .replace(/<!--\\s*[\\s\\S]*?\\s*-->/g, '')
          .replace(/:::\\s*speech\\s*\\n[\\s\\S]*?\\n:::/g, '');

        // Parse fenced blocks cleanly via line-state scanner so fenced lines NEVER leak into bullets
        const plainLines = [];
        const slideLines = cleanedRaw.split('\\n');
        let inBlock = false;
        let blockLang = '';
        let blockBuf = [];

        for (const ln of slideLines) {
          const trim = ln.trim();
          if (trim.startsWith(T3)) {
            if (!inBlock) {
              inBlock = true;
              blockLang = trim.slice(3).trim().toLowerCase().split(/\\s+/)[0] || '';
              blockBuf = [];
            } else {
              if (blockLang === 'metric' || blockLang === 'metrics') {
                for (const ml of blockBuf) {
                  const mm = ml.replace(/^[*-]\\s*/, '').match(/^([^:]+):\\s*([^(]+)(?:\\((.*)\\))?/);
                  if (mm) {
                    metrics.push({ label: mm[1].trim(), value: mm[2].trim(), delta: (mm[3] || '').trim() });
                  }
                }
              } else if (blockLang === 'compare' || blockLang === 'comparison') {
                const cLines = blockBuf.map(s => s.trim()).filter(Boolean);
                if (cLines.length >= 2) {
                  const leftParts = cLines[0].split('::');
                  const rightParts = cLines[1].split('::');
                  comparison = {
                    leftTitle: leftParts[0].trim(),
                    leftItems: (leftParts[1] || '').split('|').map(s => s.trim()).filter(Boolean),
                    rightTitle: rightParts[0].trim(),
                    rightItems: (rightParts[1] || '').split('|').map(s => s.trim()).filter(Boolean)
                  };
                }
              } else if (blockLang === 'mermaid') {
                diagram = { engine: 'mermaid', code: blockBuf.join('\\n').trim() };
              } else {
                code = { lang: blockLang || 'bash', code: blockBuf.join('\\n').trim() };
              }
              extraChunks.push(T3 + blockLang + '\\n' + blockBuf.join('\\n') + '\\n' + T3);
              inBlock = false;
              blockLang = '';
              blockBuf = [];
            }
            continue;
          }
          if (inBlock) {
            blockBuf.push(ln);
          } else {
            plainLines.push(ln);
          }
        }

        // Process headings & regular bullets
        for (const line of plainLines) {
          const trim = line.trim();
          if (!trim) continue;
          if (trim.startsWith('# ')) {
            if (!title) title = trim.slice(2).trim();
          } else if (trim.startsWith('## ')) {
            if (!subtitle) subtitle = trim.slice(3).trim();
          } else if (trim.startsWith('> ')) {
            if (!quote) quote = trim.slice(2).trim();
          } else if (trim.startsWith('- ') || trim.startsWith('* ')) {
            bullets.push(trim.slice(2).trim());
          }
        }

        return {
          raw,
          eyebrow: eyebrow || 'SCENE ' + String(idx + 1).padStart(2, '0'),
          title: title || fm.title || 'Slide ' + (idx + 1),
          subtitle,
          bullets,
          metrics,
          comparison,
          diagram,
          code,
          quote,
          extra: extraChunks.join('\\n\\n')
        };
      });

      return { fm, slides, rawSlides };
    }

    // Client-side HTML Deck renderer
    function escapeHtml(s) {
      return String(s || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    }

    function renderClientSlideHtml(slide, idx, total, tpl, aspect) {
      let contentHtml = '';

      if (slide.metrics && slide.metrics.length > 0) {
        contentHtml += '<div class="aimake-metrics-grid" style="display:grid;grid-template-columns:repeat(' + Math.min(3, slide.metrics.length) + ', 1fr);gap:16px;margin:18px 0;">' +
          slide.metrics.map(m =>
            '<div class="aimake-metric-card" style="padding:16px;border-radius:10px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);">' +
              '<div class="aimake-metric-lbl" style="font-size:12px;opacity:0.75;margin-bottom:6px;">' + escapeHtml(m.label) + '</div>' +
              '<div class="aimake-metric-val" style="font-size:28px;font-weight:700;letter-spacing:-0.03em;">' + escapeHtml(m.value) + '</div>' +
              (m.delta ? '<div style="font-size:11px;color:#10b981;margin-top:4px;">' + escapeHtml(m.delta) + '</div>' : '') +
            '</div>'
          ).join('') +
        '</div>';
      }

      if (slide.comparison) {
        contentHtml += '<div class="aimake-compare-grid" style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin:18px 0;">' +
          '<div style="padding:16px;border-radius:10px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);">' +
            '<div style="font-size:13px;font-weight:600;margin-bottom:10px;opacity:0.75;">' + escapeHtml(slide.comparison.leftTitle) + '</div>' +
            '<ul style="margin:0;padding-left:18px;font-size:12.5px;line-height:1.6;">' +
              slide.comparison.leftItems.map(it => '<li>' + escapeHtml(it) + '</li>').join('') +
            '</ul>' +
          '</div>' +
          '<div style="padding:16px;border-radius:10px;background:rgba(116,93,255,0.12);border:1px solid rgba(116,93,255,0.3);">' +
            '<div style="font-size:13px;font-weight:600;margin-bottom:10px;color:#a5b4fc;">' + escapeHtml(slide.comparison.rightTitle) + '</div>' +
            '<ul style="margin:0;padding-left:18px;font-size:12.5px;line-height:1.6;">' +
              slide.comparison.rightItems.map(it => '<li>' + escapeHtml(it) + '</li>').join('') +
            '</ul>' +
          '</div>' +
        '</div>';
      }

      if (slide.diagram && slide.diagram.engine === 'mermaid') {
        contentHtml += '<div class="aimake-mermaid-wrap" style="margin:16px 0;padding:16px;background:rgba(0,0,0,0.25);border-radius:8px;border:1px solid rgba(255,255,255,0.08);text-align:center;">' +
          '<svg class="aimake-mermaid-svg" viewBox="0 0 600 120" style="width:100%;max-width:540px;height:auto;margin:0 auto;display:block;">' +
            '<rect width="600" height="120" rx="8" fill="#121215"/>' +
            '<rect x="20" y="35" width="130" height="50" rx="6" fill="#745dff"/>' +
            '<text x="85" y="66" fill="#fff" font-size="12" font-family="sans-serif" text-anchor="middle" font-weight="600">Markdown 原稿</text>' +
            '<path d="M150 60 L220 60" stroke="#9898a6" stroke-width="2" marker-end="url(#arr)"/>' +
            '<polygon points="280,35 340,60 280,85 220,60" fill="#222229" stroke="#745dff" stroke-width="1.5"/>' +
            '<text x="280" y="65" fill="#f4f4f6" font-size="11" font-family="sans-serif" text-anchor="middle">AST 编译</text>' +
            '<path d="M340 60 L410 60" stroke="#9898a6" stroke-width="2"/>' +
            '<rect x="410" y="35" width="170" height="50" rx="6" fill="#18181d" stroke="rgba(255,255,255,0.14)"/>' +
            '<text x="495" y="66" fill="#fff" font-size="12" font-family="sans-serif" text-anchor="middle" font-weight="600">多模态交付介质</text>' +
          '</svg>' +
        '</div>';
      }

      if (slide.code) {
        contentHtml += '<div class="aimake-code-wrap" style="margin:16px 0;border-radius:8px;overflow:hidden;background:#18181d;border:1px solid rgba(255,255,255,0.1);">' +
          '<div style="padding:6px 12px;background:rgba(255,255,255,0.04);border-bottom:1px solid rgba(255,255,255,0.08);font-size:11px;font-family:monospace;color:#9898a6;">' + escapeHtml(slide.code.lang) + '</div>' +
          '<pre style="margin:0;padding:12px;font-family:monospace;font-size:12px;line-height:1.55;color:#e4e4e7;overflow-x:auto;"><code>' + escapeHtml(slide.code.code) + '</code></pre>' +
        '</div>';
      }

      if (slide.quote) {
        contentHtml += '<blockquote style="margin:20px 0;padding:14px 20px;border-left:3px solid #745dff;background:rgba(116,93,255,0.08);font-size:15px;font-style:italic;line-height:1.6;border-radius:0 8px 8px 0;">' +
          escapeHtml(slide.quote) +
        '</blockquote>';
      }

      if (slide.bullets && slide.bullets.length > 0) {
        contentHtml += '<ul class="aimake-bullets" style="margin:16px 0;padding-left:22px;font-size:14px;line-height:1.8;">' +
          slide.bullets.map(b => '<li>' + escapeHtml(b).replace(/\\*\\*(.*?)\\*\\*/g, '<strong>$1</strong>') + '</li>').join('') +
        '</ul>';
      }

      const slidePageNum = String(idx + 1).padStart(2, '0') + ' / ' + String(total).padStart(2, '0');

      return '<div class="aimake-slide" id="slide-' + idx + '" data-slide="' + idx + '" style="position:relative;">' +
        '<div class="aimake-slide-header" style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">' +
          '<span class="aimake-eyebrow" style="font-size:11px;letter-spacing:0.08em;font-weight:700;opacity:0.7;text-transform:uppercase;">' + escapeHtml(slide.eyebrow) + '</span>' +
          '<span class="aimake-slide-num" style="font-family:monospace;font-size:11px;opacity:0.5;">' + slidePageNum + '</span>' +
        '</div>' +
        '<div class="aimake-slide-body">' +
          '<h1 class="aimake-title" style="margin:0 0 8px 0;font-size:26px;letter-spacing:-0.02em;line-height:1.25;font-weight:700;">' + escapeHtml(slide.title) + '</h1>' +
          (slide.subtitle ? '<h2 class="aimake-subtitle" style="margin:0 0 16px 0;font-size:14.5px;font-weight:400;opacity:0.8;line-height:1.45;">' + escapeHtml(slide.subtitle) + '</h2>' : '') +
          contentHtml +
        '</div>' +
        '<div class="aimake-slide-footer" style="margin-top:auto;padding-top:14px;display:flex;align-items:center;justify-content:space-between;font-size:10.5px;opacity:0.45;border-top:1px solid rgba(255,255,255,0.06);">' +
          '<span>Aimake 爱创工坊 · Local-First OS</span>' +
          '<span>#' + escapeHtml(tpl.id) + '</span>' +
        '</div>' +
      '</div>';
    }

    let compileTimeout = null;
    function scheduleCompile() {
      if (compileTimeout) clearTimeout(compileTimeout);
      compileTimeout = setTimeout(compileNow, 120);
    }

    let isApplyingFromCard = false;

    function compileNow() {
      const raw = elInput.value;
      try {
        localStorage.setItem('aimake_playground_md', raw);
      } catch (_) {}

      const parsed = parseClientMarkdown(raw);
      totalSlides = Math.max(1, parsed.slides.length);
      currentSlideIdx = Math.max(0, Math.min(totalSlides - 1, currentSlideIdx));

      // Resolve template
      let tplId = parsed.fm.template || 'apple-bento-launch';
      if (!TEMPLATE_MAP.has(tplId)) tplId = 'apple-bento-launch';
      const tpl = TEMPLATE_MAP.get(tplId);

      // Resolve aspect
      let aspect = elAspect.value === 'auto' ? (parsed.fm.aspect || tpl.aspect || '16:9') : elAspect.value;
      if (!['16:9', '3:4', '9:16', '1:1', '4:5'].includes(aspect)) aspect = '16:9';

      // Keep dropdown in sync
      if (elTemplate.value !== tplId) {
        elTemplate.value = tplId;
      }

      // Generate HTML for each slide
      const slidesHtml = parsed.slides
        .map((s, idx) => renderClientSlideHtml(s, idx, totalSlides, tpl, aspect))
        .join('');

      const aspectRatios = {
        '16:9': '16 / 9',
        '3:4': '3 / 4',
        '9:16': '9 / 16',
        '1:1': '1 / 1',
        '4:5': '4 / 5'
      };
      const maxWidths = {
        '16:9': '820px',
        '3:4': '430px',
        '9:16': '320px',
        '1:1': '520px',
        '4:5': '460px'
      };
      const cssRatio = aspectRatios[aspect] || '16 / 9';
      const slideMaxW = maxWidths[aspect] || '820px';

      const navScript = '<script>' +
        'window.addEventListener("keydown", function(e) {' +
        '  var t = e.target;' +
        '  if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;' +
        '  if (e.key === "ArrowLeft" || e.key === "PageUp" || e.key === "ArrowUp") {' +
        '    e.preventDefault(); window.parent.postMessage({ type: "aimake:pg-nav", action: "prev" }, "*");' +
        '  } else if (e.key === "ArrowRight" || e.key === "PageDown" || e.key === "ArrowDown" || e.key === " ") {' +
        '    e.preventDefault(); window.parent.postMessage({ type: "aimake:pg-nav", action: "next" }, "*");' +
        '  } else if (e.key === "Escape") {' +
        '    e.preventDefault(); window.parent.postMessage({ type: "aimake:pg-nav", action: "escape" }, "*");' +
        '  } else if (e.key.toLowerCase() === "f") {' +
        '    e.preventDefault(); window.parent.postMessage({ type: "aimake:pg-nav", action: "fullscreen" }, "*");' +
        '  }' +
        '});' +
        '<\\/script>';

      const curTheme = document.documentElement.getAttribute('data-theme') || 'dark';
      const frameBg = curTheme === 'light' ? '#f8fafc' : '#0c0c0e';

      const fullHtml = '<!DOCTYPE html><html><head><meta charset="utf-8"/><style>' +
        tpl.css +
        '\\nhtml { width:100%; height:100%; margin:0; padding:0; overflow-x:hidden; }\\n' +
        'body { width:100%; margin:0; padding:18px 24px 56px; min-height:100vh; background:' + frameBg + ' !important; display:flex !important; flex-direction:column !important; align-items:center !important; justify-content:' + (viewMode === 'single' ? 'center' : 'flex-start') + ' !important; box-sizing:border-box; }\\n' +
        '#aimake-deck-root { width:100% !important; max-width:' + slideMaxW + ' !important; display:flex !important; flex-direction:column !important; gap:24px !important; align-items:stretch !important; }\\n' +
        '.aimake-slide { width:100% !important; height:auto !important; min-height:0 !important; max-height:calc(100vh - 120px) !important; aspect-ratio:' + cssRatio + ' !important; padding:28px 36px !important; box-sizing:border-box !important; display:flex; flex-direction:column; justify-content:space-between; border-radius:12px !important; overflow:hidden !important; box-shadow:0 14px 40px rgba(0,0,0,0.42) !important; }\\n' +
        '.hljs-keyword { color:#93c5fd; font-weight:600; } .hljs-string { color:#86efac; } .hljs-comment { color:#64748b; font-style:italic; } .hljs-number { color:#fda4af; }\\n' +
        '@media (max-width: 600px) { body { padding:12px !important; } .aimake-slide { padding:16px 20px !important; } .aimake-title { font-size:20px !important; } .aimake-subtitle { font-size:13px !important; } .aimake-metric-val { font-size:20px !important; } }\\n' +
        '@media print { @page { size: landscape; margin: 10mm; } body { background: #fff !important; padding: 0 !important; } .aimake-slide { display: flex !important; break-after: page; page-break-after: always; box-shadow: none !important; margin: 0 auto 12mm !important; } }\\n' +
        '</style></head><body><div id="aimake-deck-root">' + slidesHtml + '</div>' + navScript + '</body></html>';

      elFrame.srcdoc = fullHtml;
      elCharCount.textContent = raw.length + ' 字符 · ' + totalSlides + ' 页 · 模板: ' + tpl.id;
      const ind = document.getElementById('pg-slide-indicator');
      if (ind) {
        ind.textContent = String(currentSlideIdx + 1).padStart(2, '0') + ' / ' + String(totalSlides).padStart(2, '0');
      }
      renderCardSlidePills();
      renderPgSlidePills();
      if (!isApplyingFromCard) {
        syncCardFormFromMarkdown();
      }
    }

    const tabSourceBtn = document.getElementById('tab-mode-source');
    const tabCardBtn = document.getElementById('tab-mode-card');
    const sourceEditorWrap = document.getElementById('source-editor-wrap');
    const cardEditorPane = document.getElementById('card-editor-pane');

    tabSourceBtn.addEventListener('click', () => {
      tabSourceBtn.classList.add('active');
      tabSourceBtn.setAttribute('aria-selected', 'true');
      tabCardBtn.classList.remove('active');
      tabCardBtn.setAttribute('aria-selected', 'false');
      sourceEditorWrap.classList.remove('hidden');
      cardEditorPane.classList.add('hidden');
    });

    tabCardBtn.addEventListener('click', () => {
      tabCardBtn.classList.add('active');
      tabCardBtn.setAttribute('aria-selected', 'true');
      tabSourceBtn.classList.remove('active');
      tabSourceBtn.setAttribute('aria-selected', 'false');
      sourceEditorWrap.classList.add('hidden');
      cardEditorPane.classList.remove('hidden');
      syncCardFormFromMarkdown();
    });

    function syncCardFormFromMarkdown() {
      const parsed = parseClientMarkdown(elInput.value);
      const slide = parsed.slides[currentSlideIdx] || parsed.slides[0];
      if (!slide) return;
      document.getElementById('card-eyebrow').value = slide.eyebrow || '';
      document.getElementById('card-title').value = slide.title || '';
      document.getElementById('card-subtitle').value = slide.subtitle || '';
      document.getElementById('card-bullets').value = (slide.bullets || []).map(b => '- ' + b).join('\\n');
      document.getElementById('card-extra').value = slide.extra || '';
    }

    function applyCardFormToMarkdown() {
      isApplyingFromCard = true;
      try {
        const raw = elInput.value;
        const fmMatch = raw.match(/^(---\\n[\\s\\S]*?\\n---\\n?)([\\s\\S]*)$/);
        const fmHeader = fmMatch ? fmMatch[1] : '';
        const parsed = parseClientMarkdown(raw);
        const targetIdx = currentSlideIdx;

        const eye = document.getElementById('card-eyebrow').value.trim();
        const tit = document.getElementById('card-title').value.trim();
        const sub = document.getElementById('card-subtitle').value.trim();
        const bul = document.getElementById('card-bullets').value.trim();
        const ext = document.getElementById('card-extra').value.trim();

        let reconstructed = '';
        if (eye) reconstructed += '<!-- scene: card-' + (targetIdx + 1) + ' | eyebrow: ' + eye + ' -->\\n';
        if (tit) reconstructed += '# ' + tit + '\\n';
        if (sub) reconstructed += '## ' + sub + '\\n\\n';
        if (ext) reconstructed += ext + '\\n\\n';
        if (bul) reconstructed += bul + '\\n';

        const updatedSlides = parsed.rawSlides.map((s, idx) => (idx === targetIdx ? reconstructed.trim() : s));
        if (targetIdx >= updatedSlides.length) {
          updatedSlides.push(reconstructed.trim());
        }

        elInput.value = (fmHeader ? fmHeader.trim() + '\\n\\n' : '') + updatedSlides.join('\\n\\n---\\n\\n');
        scheduleCompile();
      } finally {
        setTimeout(() => { isApplyingFromCard = false; }, 200);
      }
    }

    for (const id of ['card-eyebrow', 'card-title', 'card-subtitle', 'card-bullets', 'card-extra']) {
      const el = document.getElementById(id);
      if (el) el.addEventListener('input', applyCardFormToMarkdown);
    }

    const btnCardAdd = document.getElementById('btn-card-add-slide');
    if (btnCardAdd) {
      btnCardAdd.addEventListener('click', () => {
        const newSlide = '\\n\\n---\\n\\n<!-- scene: card-new | eyebrow: NEW SCENE -->\\n# 新增卡片标题\\n## 简短阐述核心论点\\n\\n- 要点一：事实与数据支撑\\n- 要点二：落地执行建议\\n';
        elInput.value = elInput.value.trimEnd() + newSlide;
        scheduleCompile();
        setTimeout(() => {
          currentSlideIdx = Math.max(0, totalSlides - 1);
          renderCardSlidePills();
          syncCardFormFromMarkdown();
          updateSlideVisibilityInFrame();
        }, 150);
        showToast('已新增卡片，可直接填写表单');
      });
    }

    function renderCardSlidePills() {
      const wrap = document.getElementById('card-slide-pills');
      if (!wrap) return;
      wrap.innerHTML = '';
      for (let i = 0; i < totalSlides; i++) {
        const pill = document.createElement('button');
        pill.type = 'button';
        pill.className = 'card-pill' + (i === currentSlideIdx ? ' active' : '');
        pill.textContent = 'P' + (i + 1);
        pill.addEventListener('click', () => {
          currentSlideIdx = i;
          renderCardSlidePills();
          syncCardFormFromMarkdown();
          updateSlideVisibilityInFrame();
        });
        wrap.appendChild(pill);
      }
    }

    function renderPgSlidePills() {
      const wrap = document.getElementById('pg-slide-pills');
      if (!wrap) return;
      wrap.innerHTML = '';
      for (let i = 0; i < totalSlides; i++) {
        const pill = document.createElement('button');
        pill.className = 'pg-slide-pill' + (i === currentSlideIdx ? ' active' : '');
        pill.textContent = String(i + 1).padStart(2, '0');
        pill.title = '跳转至第 ' + (i + 1) + ' 页';
        pill.addEventListener('click', () => {
          currentSlideIdx = i;
          updateSlideVisibilityInFrame();
        });
        wrap.appendChild(pill);
      }
    }

    function updateSlideVisibilityInFrame() {
      const ind = document.getElementById('pg-slide-indicator');
      if (ind) {
        ind.textContent = String(currentSlideIdx + 1).padStart(2, '0') + ' / ' + String(totalSlides).padStart(2, '0');
      }
      renderPgSlidePills();
      renderCardSlidePills();
      try {
        const frameDoc = elFrame.contentDocument || elFrame.contentWindow.document;
        if (!frameDoc) return;
        const slides = frameDoc.querySelectorAll('.aimake-slide');
        slides.forEach((sl, idx) => {
          if (viewMode === 'all') {
            sl.style.display = 'flex';
          } else {
            sl.style.display = idx === currentSlideIdx ? 'flex' : 'none';
          }
        });
        if (viewMode === 'all' && slides[currentSlideIdx]) {
          slides[currentSlideIdx].scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      } catch (_) {}
    }

    // Input events
    elInput.addEventListener('input', scheduleCompile);

    // Sample Select
    elSample.addEventListener('change', () => {
      const key = elSample.value;
      if (SAMPLES[key]) {
        elInput.value = SAMPLES[key];
        currentSlideIdx = 0;
        compileNow();
        showToast('已切换至《' + elSample.selectedOptions[0].text + '》');
      }
    });

    // Template Select
    elTemplate.addEventListener('change', () => {
      const newTplId = elTemplate.value;
      let raw = elInput.value;
      if (/^---\\n[\\s\\S]*?template:\\s*[^\\n]+\\n[\\s\\S]*?---/.test(raw)) {
        raw = raw.replace(/^template:\\s*[^\\n]+/m, 'template: ' + newTplId);
      } else if (raw.startsWith('---\\n')) {
        raw = raw.replace('---\\n', '---\\ntemplate: ' + newTplId + '\\n');
      } else {
        raw = '---\\ntemplate: ' + newTplId + '\\n---\\n\\n' + raw;
      }
      elInput.value = raw;
      compileNow();
      showToast('已应用设计模板: ' + newTplId);
    });

    // Aspect Select
    elAspect.addEventListener('change', () => {
      compileNow();
    });

    // Bottom pagination controls
    document.getElementById('pg-prev-slide').addEventListener('click', () => {
      currentSlideIdx = Math.max(0, currentSlideIdx - 1);
      updateSlideVisibilityInFrame();
    });
    document.getElementById('pg-next-slide').addEventListener('click', () => {
      currentSlideIdx = Math.min(Math.max(0, totalSlides - 1), currentSlideIdx + 1);
      updateSlideVisibilityInFrame();
    });

    const btnViewMode = document.getElementById('pg-view-mode');
    btnViewMode.addEventListener('click', () => {
      viewMode = viewMode === 'single' ? 'all' : 'single';
      btnViewMode.innerHTML = viewMode === 'all'
        ? '${lucideIcon('layers')} 平铺视图'
        : '${lucideIcon('layoutGrid')} 单页视图';
      compileNow();
    });

    // Snippet Inserters
    document.querySelectorAll('[data-insert]').forEach(btn => {
      btn.addEventListener('click', () => {
        const type = btn.getAttribute('data-insert');
        const t3 = String.fromCharCode(96, 96, 96);
        let snippet = '';
        if (type === 'metric') {
          snippet = '\\n' + t3 + 'metric\\n- 核心指标: 99.8% (+15%)\\n- 交付时效: < 3s (领先)\\n' + t3 + '\\n';
        } else if (type === 'mermaid') {
          snippet = '\\n' + t3 + 'mermaid\\nflowchart LR\\n  Input[Markdown 原稿] --> Engine{Aimake AST}\\n  Engine --> Output([Slide · Diagram · SVG])\\n' + t3 + '\\n';
        } else if (type === 'compare') {
          snippet = '\\n' + t3 + 'compare\\n旧传统模式 :: 频繁切换窗口 | 格式手工排版\\n新闭环模式 :: 本地 Wiki 沉淀 | 一稿多端直出\\n' + t3 + '\\n';
        } else if (type === 'code') {
          snippet = '\\n' + t3 + 'bash\\naimake render deck.md -f pptx\\n' + t3 + '\\n';
        } else if (type === 'quote') {
          snippet = '\\n> 真正的效率是让每一次思考都自带复利。 — Aimake\\n';
        } else if (type === 'slide') {
          snippet = '\\n---\\n\\n<!-- scene: new-section | layout: bullets -->\\n# 新增幻灯片标题\\n## 补充你的副标题观点\\n\\n- 第一条核心要点\\n- 第二条真实数据支撑\\n';
        }

        const hasCursor = document.activeElement === elInput && typeof elInput.selectionStart === 'number' && elInput.selectionStart > 0 && elInput.selectionStart < elInput.value.length;
        if (type !== 'slide' && !hasCursor) {
          const fmMatch = elInput.value.match(/^(---\\n[\\s\\S]*?\\n---\\n?)([\\s\\S]*)$/);
          const fmHeader = fmMatch ? fmMatch[1] : '';
          const parsed = parseClientMarkdown(elInput.value);
          const slidesArr = parsed.rawSlides.slice();
          const targetIdx = Math.min(Math.max(0, currentSlideIdx), Math.max(0, slidesArr.length - 1));
          if (slidesArr[targetIdx] !== undefined) {
            slidesArr[targetIdx] = slidesArr[targetIdx].trimEnd() + '\\n\\n' + snippet.trim();
            elInput.value = (fmHeader ? fmHeader.trimEnd() + '\\n\\n' : '') + slidesArr.join('\\n\\n---\\n\\n') + '\\n';
          } else {
            elInput.value = elInput.value.trimEnd() + '\\n' + snippet;
          }
        } else {
          const pos = elInput.selectionStart || elInput.value.length;
          elInput.value = elInput.value.slice(0, pos) + snippet + elInput.value.slice(pos);
        }
        compileNow();
        elInput.focus();
        showToast('已插入 ' + btn.textContent + ' 模块');
      });
    });

    // Humanize Filter
    const btnHumanize = document.getElementById('btn-humanize');
    btnHumanize.addEventListener('click', () => {
      let text = elInput.value;
      const replacements = [
        [/毫无疑问/g, '数据表明'],
        [/颠覆性创新/g, '关键突破'],
        [/底层逻辑/g, '核心机制'],
        [/赋能/g, '助力'],
        [/闭环/g, '端到端流程'],
        [/打法/g, '策略方法'],
        [/抓手/g, '实施要点'],
        [/组合拳/g, '协同方案']
      ];
      let count = 0;
      for (const [re, rep] of replacements) {
        const matches = text.match(re);
        if (matches) {
          count += matches.length;
          text = text.replace(re, rep);
        }
      }
      elInput.value = text;
      scheduleCompile();
      showToast(count > 0 ? '已清洗 ' + count + ' 处套话！' : '原稿纯度很高，未检测到套话');
    });

    function setBtnFeedback(btn, text, iconHtml) {
      const orig = btn.innerHTML;
      btn.innerHTML = (iconHtml || '') + ' ' + text;
      btn.classList.add('pg-btn-success');
      setTimeout(() => {
        btn.innerHTML = orig;
        btn.classList.remove('pg-btn-success');
      }, 2200);
    }

    // Export PNG
    const btnExportPng = document.getElementById('btn-export-png');
    btnExportPng.addEventListener('click', async () => {
      const origHtml = btnExportPng.innerHTML;
      btnExportPng.innerHTML = '${lucideIcon('loader', 'ic spin')} 导出中...';
      btnExportPng.disabled = true;
      try {
        const frameDoc = elFrame.contentDocument || elFrame.contentWindow.document;
        if (!frameDoc) throw new Error('无法读取画布 DOM');
        const slideEl = frameDoc.getElementById('slide-' + currentSlideIdx) || frameDoc.querySelector('.aimake-slide');
        if (!slideEl) throw new Error('找不到当前页面');
        const rect = slideEl.getBoundingClientRect();
        const w = Math.max(640, Math.round(rect.width || 820));
        const h = Math.max(360, Math.round(rect.height || 460));
        const styles = Array.from(frameDoc.querySelectorAll('style')).map(s => s.textContent || '').join('\\n');
        const clone = slideEl.cloneNode(true);
        clone.style.display = 'flex';
        clone.style.margin = '0';
        const xhtml = '<div xmlns="http://www.w3.org/1999/xhtml" style="width:' + w + 'px;height:' + h + 'px;"><style>' + styles + '</style>' + clone.outerHTML + '</div>';
        const svgStr = '<svg xmlns="http://www.w3.org/2000/svg" width="' + w + '" height="' + h + '"><foreignObject width="100%" height="100%">' + xhtml + '</foreignObject></svg>';
        const img = new Image();
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            canvas.width = w * 2;
            canvas.height = h * 2;
            const ctx = canvas.getContext('2d');
            ctx.scale(2, 2);
            ctx.drawImage(img, 0, 0, w, h);
            const pngUrl = canvas.toDataURL('image/png');
            const a = document.createElement('a');
            a.href = pngUrl;
            a.download = 'aimake-slide-' + String(currentSlideIdx + 1).padStart(2, '0') + '.png';
            a.click();
            btnExportPng.disabled = false;
            setBtnFeedback(btnExportPng, '已导出 PNG ✓', '${lucideIcon('check')}');
            showToast('已成功导出当前页高清 PNG！');
          } catch (_) {
            btnExportPng.disabled = false;
            btnExportPng.innerHTML = origHtml;
            showToast('浏览器沙盒限制离屏导图，可使用 PDF 打印导出');
          }
        };
        img.onerror = () => {
          btnExportPng.disabled = false;
          btnExportPng.innerHTML = origHtml;
          showToast('浏览器不支持直接导出，可使用 PDF 打印');
        };
        img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgStr);
      } catch (err) {
        btnExportPng.disabled = false;
        btnExportPng.innerHTML = origHtml;
        showToast('导出失败: ' + err.message);
      }
    });

    // Print / Save PDF
    document.getElementById('btn-print-pdf').addEventListener('click', () => {
      try {
        const win = elFrame.contentWindow;
        if (!win) throw new Error('画布尚未完成加载');
        win.focus();
        win.print();
        showToast('已打开打印视图，可选择“另存为 PDF”');
      } catch (err) {
        showToast('无法调起打印: ' + err.message);
      }
    });

    // Copy WeChat HTML
    const btnCopyWechat = document.getElementById('btn-copy-wechat');
    btnCopyWechat.addEventListener('click', async () => {
      const origHtml = btnCopyWechat.innerHTML;
      btnCopyWechat.innerHTML = '${lucideIcon('loader', 'ic spin')} 复制中...';
      btnCopyWechat.disabled = true;
      try {
        const frameDoc = elFrame.contentDocument || elFrame.contentWindow.document;
        if (!frameDoc) throw new Error('无法读取画布 DOM');
        const deckRoot = frameDoc.getElementById('aimake-deck-root');
        if (!deckRoot) throw new Error('画布尚未完成渲染');

        const cloned = deckRoot.cloneNode(true);
        cloned.querySelectorAll('.aimake-slide').forEach(node => {
          node.style.display = 'flex';
        });
        const html = cloned.outerHTML;
        const plainText = deckRoot.innerText || html;

        let copySuccess = false;
        try {
          if (navigator.clipboard && navigator.clipboard.write) {
            const blob = new Blob([html], { type: 'text/html' });
            const textBlob = new Blob([plainText], { type: 'text/plain' });
            await navigator.clipboard.write([
              new ClipboardItem({ 'text/html': blob, 'text/plain': textBlob })
            ]);
            copySuccess = true;
          }
        } catch (_) {}

        if (!copySuccess) {
          try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
              await navigator.clipboard.writeText(html);
              copySuccess = true;
            }
          } catch (_) {}
        }

        if (!copySuccess) {
          const ta = document.createElement('textarea');
          ta.value = html;
          ta.style.position = 'fixed';
          ta.style.opacity = '0';
          document.body.appendChild(ta);
          ta.select();
          document.execCommand('copy');
          document.body.removeChild(ta);
          copySuccess = true;
        }

        btnCopyWechat.disabled = false;
        setBtnFeedback(btnCopyWechat, '已复制富文本 ✓', '${lucideIcon('check')}');
        showToast('已复制微信公众号富文本！可直接粘贴至公众号后台');
      } catch (err) {
        btnCopyWechat.disabled = false;
        btnCopyWechat.innerHTML = origHtml;
        showToast('复制失败: ' + err.message);
      }
    });

    // Quick Slide Actions in Bottom Dock
    const btnPgAdd = document.getElementById('pg-add-slide');
    if (btnPgAdd) {
      btnPgAdd.addEventListener('click', () => {
        const templateNew = '\\n\\n---\\n\\n<!-- scene: new-card | layout: card -->\\n# 新增页面标题\\n## 简要副标题描述观点\\n\\n- 要点一：事实与数据论据\\n- 要点二：落地实施步骤\\n';
        elInput.value = elInput.value.trimEnd() + templateNew;
        scheduleCompile();
        setTimeout(() => {
          currentSlideIdx = Math.max(0, totalSlides - 1);
          updateSlideVisibilityInFrame();
        }, 150);
        showToast('已新增一页，可直接编辑原稿或卡片');
      });
    }

    const btnPgDup = document.getElementById('pg-dup-slide');
    if (btnPgDup) {
      btnPgDup.addEventListener('click', () => {
        const parsed = parseClientMarkdown(elInput.value);
        const targetSlide = parsed.rawSlides[currentSlideIdx] || parsed.rawSlides[0] || '# 副本页面';
        const duplicateText = '\\n\\n---\\n\\n' + targetSlide.trim();
        elInput.value = elInput.value.trimEnd() + duplicateText;
        scheduleCompile();
        setTimeout(() => {
          currentSlideIdx = Math.max(0, totalSlides - 1);
          updateSlideVisibilityInFrame();
        }, 150);
        showToast('已复制当前页为第 ' + (totalSlides + 1) + ' 页');
      });
    }

    const btnPgDel = document.getElementById('pg-del-slide');
    if (btnPgDel) {
      btnPgDel.addEventListener('click', () => {
        const raw = elInput.value;
        const fmMatch = raw.match(/^(---\\n[\\s\\S]*?\\n---\\n?)([\\s\\S]*)$/);
        const fmHeader = fmMatch ? fmMatch[1] : '';
        const parsed = parseClientMarkdown(raw);
        if (parsed.rawSlides.length <= 1) {
          showToast('至少保留一页幻灯片');
          return;
        }
        const newSlides = parsed.rawSlides.filter((_, idx) => idx !== currentSlideIdx);
        currentSlideIdx = Math.max(0, Math.min(newSlides.length - 1, currentSlideIdx));
        elInput.value = (fmHeader ? fmHeader.trim() + '\\n\\n' : '') + newSlides.join('\\n\\n---\\n\\n');
        scheduleCompile();
        showToast('已删除该页');
      });
    }

    // Download .deck.md
    document.getElementById('btn-download-md').addEventListener('click', () => {
      const blob = new Blob([elInput.value], { type: 'text/markdown;charset=utf-8' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'presentation.deck.md';
      a.click();
      showToast('已开始下载 presentation.deck.md');
    });

    // Fullscreen & Slide Keyboard Navigation
    document.getElementById('btn-fullscreen').addEventListener('click', () => {
      document.body.classList.toggle('fullscreen-mode');
      if (document.body.classList.contains('fullscreen-mode')) {
        showToast('按 ESC 或再次点击退出全屏');
      }
    });

    window.addEventListener('message', (ev) => {
      const msg = ev.data;
      if (!msg || msg.type !== 'aimake:pg-nav') return;
      if (msg.action === 'prev') {
        currentSlideIdx = Math.max(0, currentSlideIdx - 1);
        updateSlideVisibilityInFrame();
      } else if (msg.action === 'next') {
        currentSlideIdx = Math.min(Math.max(0, totalSlides - 1), currentSlideIdx + 1);
        updateSlideVisibilityInFrame();
      } else if (msg.action === 'escape') {
        if (document.body.classList.contains('fullscreen-mode')) {
          document.body.classList.remove('fullscreen-mode');
        }
      } else if (msg.action === 'fullscreen') {
        document.body.classList.toggle('fullscreen-mode');
      }
    });

    window.addEventListener('keydown', (e) => {
      const tag = e.target && e.target.tagName;
      if (e.key === 'Escape' && document.body.classList.contains('fullscreen-mode')) {
        document.body.classList.remove('fullscreen-mode');
        return;
      }
      if (tag === 'TEXTAREA' || tag === 'INPUT' || tag === 'SELECT') return;
      if (e.key.toLowerCase() === 'f') {
        document.body.classList.toggle('fullscreen-mode');
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp' || e.key === 'ArrowUp') {
        e.preventDefault();
        currentSlideIdx = Math.max(0, currentSlideIdx - 1);
        updateSlideVisibilityInFrame();
      } else if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === 'ArrowDown' || e.key === ' ') {
        e.preventDefault();
        currentSlideIdx = Math.min(Math.max(0, totalSlides - 1), currentSlideIdx + 1);
        updateSlideVisibilityInFrame();
      }
    });

    // Template Visual Gallery Drawer Logic
    const drawerBackdrop = document.getElementById('template-drawer-backdrop');
    const drawer = document.getElementById('template-drawer');
    const drawerGrid = document.getElementById('drawer-grid');

    let activeDrawerCategory = 'all';

    function openTemplateDrawer() {
      drawerBackdrop.classList.add('show');
      drawer.classList.add('show');
      renderTemplateCards();
    }
    function closeTemplateDrawer() {
      drawerBackdrop.classList.remove('show');
      drawer.classList.remove('show');
    }
    window.openTemplateDrawer = openTemplateDrawer;
    window.closeTemplateDrawer = closeTemplateDrawer;

    document.getElementById('btn-open-templates').addEventListener('click', openTemplateDrawer);

    function filterCategory(cat) {
      activeDrawerCategory = cat;
      document.querySelectorAll('#drawer-pills .drawer-pill').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.cat === cat);
      });
      renderTemplateCards();
    }
    window.filterCategory = filterCategory;

    function filterTemplates() {
      renderTemplateCards();
    }
    window.filterTemplates = filterTemplates;

    function renderTemplateCards() {
      const searchVal = (document.getElementById('drawer-search').value || '').toLowerCase().trim();
      const currentSelectedTpl = elTemplate.value;

      const filtered = TEMPLATES_DATA.filter(t => {
        if (activeDrawerCategory !== 'all' && t.aspect !== activeDrawerCategory) {
          return false;
        }
        if (searchVal) {
          const matchName = (t.name.zh || '') + ' ' + (t.name.en || '') + ' ' + t.id;
          const matchDesc = (t.description?.zh || '') + ' ' + (t.description?.en || '');
          if (!matchName.toLowerCase().includes(searchVal) && !matchDesc.toLowerCase().includes(searchVal)) {
            return false;
          }
        }
        return true;
      });

      drawerGrid.innerHTML = filtered.map(t => {
        const isCur = t.id === currentSelectedTpl;
        const zhName = t.name.zh || t.id;
        const desc = t.description?.zh || t.description?.en || '';
        return '<button type="button" class="drawer-card' + (isCur ? ' active' : '') + '" onclick="applyTemplateFromDrawer(\\'' + t.id + '\\')">' +
          '<div class="drawer-card-top">' +
            '<span class="drawer-card-title">' + escapeHtml(zhName) + '</span>' +
            '<span class="drawer-card-aspect">' + escapeHtml(t.aspect) + '</span>' +
          '</div>' +
          '<div class="drawer-card-desc">' + escapeHtml(desc) + '</div>' +
        '</button>';
      }).join('');
    }

    function applyTemplateFromDrawer(tplId) {
      elTemplate.value = tplId;
      let raw = elInput.value;
      if (/^---\\n[\\s\\S]*?template:\\s*[^\\n]+\\n[\\s\\S]*?---/.test(raw)) {
        raw = raw.replace(/^template:\\s*[^\\n]+/m, 'template: ' + tplId);
      } else if (raw.startsWith('---\\n')) {
        raw = raw.replace('---\\n', '---\\ntemplate: ' + tplId + '\\n');
      } else {
        raw = '---\\ntemplate: ' + tplId + '\\n---\\n\\n' + raw;
      }
      elInput.value = raw;
      compileNow();
      closeTemplateDrawer();
      showToast('已应用设计模板: ' + tplId);
    }
    window.applyTemplateFromDrawer = applyTemplateFromDrawer;

    // First compile
    compileNow();
  </script>
</body>
</html>`;
}
