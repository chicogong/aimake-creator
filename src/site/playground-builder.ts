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
  creator: `---
title: 跑完超 1000 亿 Token 后：超级个体的纯本地创作飞轮
template: xhs-swiss-grid
locale: zh-CN
aspect: 3:4
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

---

<!-- scene: matrix | layout: comparison | eyebrow: CREATOR WORKFLOW -->
# 创作者的两种工作流对比

\`\`\`compare
传统搬运工模式 :: 在各个社交平台手动排版 | 复制粘贴格式错乱 | 素材分散在不同网盘
超级个体飞轮 :: 统一在 Aimake 工作区沉淀笔记 | 确定性排版内核秒级编译 | 资产回流形成知识图谱
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
  poster: `---
title: 物理世界大模型与具身智能突破
template: poster-risograph
locale: zh-CN
aspect: 1:1
author: Chico Gong
---

<!-- scene: physical | layout: metrics | eyebrow: ROBOTICS 2026 -->
# 具身智能的世界模型演进
## 空间感知、触觉反馈与动作决策统一编译

\`\`\`metric
- 推理帧率: 120 FPS
- 控制精度: 0.1 mm
- 零样本泛化: 94.2%
\`\`\`
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
};

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
    .pg-brand-wrap {
      display: flex; align-items: center; gap: 8px; flex-shrink: 0;
    }
    .pg-brand {
      display: flex; align-items: center; gap: 8px;
      text-decoration: none; color: var(--ink);
      white-space: nowrap; flex-shrink: 0;
    }
    .pg-brand strong {
      font-size: 13.5px; letter-spacing: -0.02em; white-space: nowrap;
    }
    .pg-badge {
      font-size: 10px; padding: 2px 7px; border-radius: 999px;
      background: rgba(245, 244, 240, 0.08);
      border: 1px solid var(--border);
      color: var(--ink-muted); font-weight: 600;
      letter-spacing: 0.02em;
      white-space: nowrap; flex-shrink: 0;
    }
    .pg-controls {
      display: flex; align-items: center; gap: 6px;
      min-width: 0; flex-wrap: nowrap;
      overflow-x: auto; scrollbar-width: none;
    }
    .pg-controls::-webkit-scrollbar { display: none; }
    .pg-select {
      background: var(--surface); color: var(--ink);
      border: 1px solid var(--border); border-radius: 7px;
      height: 30px; padding: 0 8px; font-size: 11.5px; outline: none;
      max-width: 152px; min-width: 88px;
      white-space: nowrap; text-overflow: ellipsis;
    }
    .pg-select:hover, .pg-select:focus { border-color: var(--border-strong); }
    .pg-btn {
      background: var(--surface); color: var(--ink);
      border: 1px solid var(--border); border-radius: 7px;
      height: 30px; padding: 0 9px; font-size: 11.5px; font-weight: 500;
      cursor: pointer; display: inline-flex; align-items: center; gap: 5px;
      white-space: nowrap; flex-shrink: 0;
      transition: all 0.15s ease;
    }
    .pg-btn:hover { background: var(--surface-elev); border-color: var(--border-strong); color: var(--ink); }
    .pg-btn-primary {
      background: var(--accent); color: var(--accent-ink);
      border-color: var(--accent); font-weight: 600;
    }
    .pg-btn-primary:hover {
      background: var(--accent-hover); color: var(--accent-ink); border-color: var(--accent-hover);
    }

    .pg-body {
      display: grid; grid-template-columns: 410px 1fr;
      height: calc(100% - 50px);
    }
    @media (max-width: 900px) {
      .pg-body { grid-template-columns: 1fr; grid-template-rows: 1fr 1fr; }
    }

    /* Left Pane: Dual-Mode Editor */
    .editor-pane {
      background: var(--sidebar);
      border-right: 1px solid var(--border);
      display: flex; flex-direction: column;
      height: 100%; min-width: 0;
    }
    .editor-tabs-bar {
      height: 38px; padding: 0 12px;
      display: flex; align-items: center; justify-content: space-between;
      gap: 8px;
      border-bottom: 1px solid var(--border);
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
    .pg-quick-actions {
      display: inline-flex;
      align-items: center;
      gap: 2px;
      background: rgba(255, 255, 255, 0.06);
      padding: 1px 2px;
      border-radius: 999px;
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
    .pg-btn-success {
      background: #10b981 !important;
      color: #ffffff !important;
      border-color: #10b981 !important;
      box-shadow: 0 0 12px rgba(16, 185, 129, 0.45) !important;
      transform: scale(1.02);
      transition: all 0.18s ease !important;
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

    /* Toast */
    #toast {
      position: fixed; top: 60px; left: 50%;
      transform: translateX(-50%) translateY(-8px);
      background: var(--surface-elev); color: var(--ink);
      border: 1px solid rgba(255,255,255,0.18); border-radius: 999px;
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
      <a href="/" class="pg-brand">
        <svg width="22" height="22" viewBox="0 0 32 32" fill="none" style="flex-shrink:0;">
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
        <option value="agent">2026 AI Agent 架构 (16:9)</option>
        <option value="architecture">Aimake 架构 Mermaid 流程图 (16:9)</option>
        <option value="creator">千亿 Token 创作飞轮 (3:4)</option>
        <option value="launch">苹果便当盒发布会 (16:9)</option>
        <option value="poster">孔版印刷海报 (1:1)</option>
      </select>

      <select class="pg-select" id="template-select" title="切换 36 套设计模板">
        ${templates
          .map(
            (t) =>
              `<option value="${t.id}">${t.name.zh || t.id} · ${t.aspect}</option>`
          )
          .join('')}
      </select>

      <select class="pg-select" id="aspect-select" style="max-width:110px;" title="强制指定画幅比例">
        <option value="auto">画幅: 跟随模板</option>
        <option value="16:9">16:9 宽屏</option>
        <option value="3:4">3:4 小红书</option>
        <option value="9:16">9:16 竖屏</option>
        <option value="1:1">1:1 方图</option>
        <option value="4:5">4:5 长图</option>
      </select>

      <button class="pg-btn" id="btn-humanize" title="四语种去 AI 套话清洗器">${lucideIcon('wand')} 去AI味</button>
      <button class="pg-btn pg-btn-primary" id="btn-copy-wechat" title="一键复制内联富文本，直粘公众号后台">${lucideIcon('copy')} 复制公众号</button>
      <button class="pg-btn" id="btn-export-png" title="将当前页导出为高清 PNG 图片">${lucideIcon('image')} 导图</button>
      <button class="pg-btn" id="btn-print-pdf" title="打印 / 另存为 PDF 演示文稿">${lucideIcon('printer')} PDF</button>
      <button class="pg-btn" id="btn-download-md" title="下载 .deck.md 原稿">${lucideIcon('download')} 下载</button>
      <button class="pg-btn" id="btn-fullscreen" title="全屏演示 (F)">${lucideIcon('maximize')} 全屏</button>
    </div>
  </header>

  <main class="pg-body">
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
        <button class="pg-dock-btn" id="pg-next-slide" title="下一页 (→ / Space / PageDown)">下一页 ${lucideIcon('chevronRight')}</button>
        <span style="width:1px;height:14px;background:rgba(255,255,255,0.16);"></span>
        <div class="pg-quick-actions" role="group" aria-label="页面增删复制">
          <button class="pg-dock-icon-btn" id="pg-add-slide" title="在当前页后新增一页 (+)">${lucideIcon('plus')}</button>
          <button class="pg-dock-icon-btn" id="pg-dup-slide" title="复制当前页">${lucideIcon('copy')}</button>
          <button class="pg-dock-icon-btn pg-dock-icon-btn-danger" id="pg-del-slide" title="删除当前页">${lucideIcon('trash')}</button>
        </div>
        <span style="width:1px;height:14px;background:rgba(255,255,255,0.16);"></span>
        <button class="pg-dock-btn" id="pg-view-mode" title="切换单页聚焦 / 全部平铺">${lucideIcon('layoutGrid')} 单页视图</button>
      </div>
    </section>
  </main>

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

    function showToast(msg) {
      elToast.textContent = msg;
      elToast.classList.add('show');
      setTimeout(() => elToast.classList.remove('show'), 2400);
    }

    // Load initial content from localStorage or sample
    let saved = null;
    try {
      saved = localStorage.getItem('aimake_playground_md');
    } catch (_) {}
    elInput.value = (saved && saved.trim()) || SAMPLES.agent;

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

        for (const line of plainLines) {
          const trim = line.trim();
          if (!trim) continue;
          if (trim.startsWith('# ')) {
            if (!title) title = trim.slice(2).trim();
          } else if (trim.startsWith('## ')) {
            if (!subtitle) subtitle = trim.slice(3).trim();
          } else if (trim.startsWith('- ') || trim.startsWith('* ')) {
            bullets.push(trim.slice(2).trim());
          } else if (trim.startsWith('> ')) {
            quote = { text: trim.slice(2).trim() };
            extraChunks.push(trim);
          }
        }

        return {
          index: idx,
          eyebrow,
          commentRaw: commentMatch ? commentMatch[0] : '',
          title: title || ('第 ' + (idx + 1) + ' 页'),
          subtitle,
          bullets,
          metrics,
          comparison,
          diagram,
          code,
          quote,
          rawExtra: extraChunks.join('\\n\\n').trim()
        };
      });

      return { frontmatter: fm, slides, rawSlides };
    }

    function parseClientNodeToken(tok) {
      const t = String(tok || '').trim();
      const roundPill = t.match(/^([A-Za-z0-9_-]+)\\(\\[([^\\]]+)\\]\\)$/);
      if (roundPill) return { id: roundPill[1], label: roundPill[2].trim(), shape: 'round' };
      const paren = t.match(/^([A-Za-z0-9_-]+)\\(([^)]+)\\)$/);
      if (paren) return { id: paren[1], label: paren[2].trim(), shape: 'round' };
      const brace = t.match(/^([A-Za-z0-9_-]+)\\{([^}]+)\\}$/);
      if (brace) return { id: brace[1], label: brace[2].trim(), shape: 'diamond' };
      const bracket = t.match(/^([A-Za-z0-9_-]+)\\[([^\\]]+)\\]$/);
      if (bracket) return { id: bracket[1], label: bracket[2].trim(), shape: 'rect' };
      const bare = t.match(/^([A-Za-z0-9_-]+)/);
      const id = bare ? bare[1] : t.replace(/\\W+/g, '_') || 'node';
      return { id, label: t, shape: 'rect' };
    }

    function renderClientMermaidSvg(rawCode) {
      const code = String(rawCode || '').trim();
      const lines = code.split(/[\\n;]+/).map(l => l.trim()).filter(Boolean);
      const isLR = /\\b(LR|RL)\\b/i.test(lines[0] || '');
      const nodes = new Map();
      const edges = [];

      const upsert = (spec) => {
        if (!spec || !spec.id) return;
        const prev = nodes.get(spec.id);
        if (!prev || (prev.label === prev.id && spec.label !== spec.id)) {
          nodes.set(spec.id, spec);
        }
      };

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (i === 0 && /^(flowchart|graph)\\b/i.test(line)) continue;
        if (/^(subgraph|end|classDef|style|linkStyle)\\b/i.test(line)) continue;

        const mEdge = line.match(/^(.+?)\\s*(?:--\\s*([^->]+?)\\s*-->|-->\\|([^|]+)\\||-->|-.->|==>)\\s*(.+)$/);
        if (mEdge) {
          const from = parseClientNodeToken(mEdge[1]);
          const label = (mEdge[2] || mEdge[3] || '').trim();
          const to = parseClientNodeToken(mEdge[4]);
          upsert(from);
          upsert(to);
          edges.push({ from: from.id, to: to.id, label });
        } else if (/^([A-Za-z0-9_-]+)[\\[({]/.test(line)) {
          upsert(parseClientNodeToken(line));
        }
      }

      if (nodes.size === 0) {
        const previewLines = lines.slice(0, 5);
        const h = Math.max(110, 44 + previewLines.length * 22);
        const body = previewLines.map((l, idx) =>
          '<text x="24" y="' + (48 + idx * 22) + '" fill="#cbd5e1" font-family="monospace" font-size="12">' + esc(l) + '</text>'
        ).join('');
        return '<svg class="aimake-mermaid-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 ' + h + '" style="width:100%;max-height:230px;height:auto;display:block;border-radius:10px;background:#0f172a;border:1px solid rgba(148,163,184,0.22);margin:10px 0;">' +
          '<text x="24" y="24" fill="#94a3b8" font-family="sans-serif" font-size="11" font-weight="700">MERMAID DIAGRAM</text>' + body + '</svg>';
      }

      const ids = Array.from(nodes.keys());
      const depth = new Map(ids.map(id => [id, 0]));
      for (let pass = 0; pass < ids.length; pass++) {
        for (const e of edges) {
          const next = (depth.get(e.from) || 0) + 1;
          if (next > (depth.get(e.to) || 0)) depth.set(e.to, Math.min(next, ids.length));
        }
      }

      const layers = new Map();
      for (const id of ids) {
        const d = depth.get(id) || 0;
        if (!layers.has(d)) layers.set(d, []);
        layers.get(d).push(nodes.get(id));
      }

      const layerKeys = Array.from(layers.keys()).sort((a, b) => a - b);
      const maxPerLayer = Math.max(1, ...layerKeys.map(k => layers.get(k).length));
      const nodeW = 148;
      const nodeH = 44;
      const gapX = 56;
      const gapY = 44;
      const pad = 24;

      const svgW = isLR
        ? Math.max(520, pad * 2 + layerKeys.length * nodeW + Math.max(0, layerKeys.length - 1) * gapX)
        : Math.max(520, pad * 2 + maxPerLayer * nodeW + Math.max(0, maxPerLayer - 1) * gapX);
      const svgH = isLR
        ? Math.max(180, pad * 2 + maxPerLayer * nodeH + Math.max(0, maxPerLayer - 1) * gapY)
        : Math.max(200, pad * 2 + layerKeys.length * nodeH + Math.max(0, layerKeys.length - 1) * gapY);

      const pos = new Map();
      layerKeys.forEach((lk, lIdx) => {
        const group = layers.get(lk);
        group.forEach((n, i) => {
          if (isLR) {
            const totalH = group.length * nodeH + (group.length - 1) * gapY;
            const startY = (svgH - totalH) / 2;
            pos.set(n.id, { x: pad + lIdx * (nodeW + gapX), y: startY + i * (nodeH + gapY) });
          } else {
            const totalW = group.length * nodeW + (group.length - 1) * gapX;
            const startX = (svgW - totalW) / 2;
            pos.set(n.id, { x: startX + i * (nodeW + gapX), y: pad + lIdx * (nodeH + gapY) });
          }
        });
      });

      let edgeSvg = '';
      for (const e of edges) {
        const a = pos.get(e.from);
        const b = pos.get(e.to);
        if (!a || !b) continue;
        const x1 = isLR ? a.x + nodeW : a.x + nodeW / 2;
        const y1 = isLR ? a.y + nodeH / 2 : a.y + nodeH;
        const x2 = isLR ? b.x - 4 : b.x + nodeW / 2;
        const y2 = isLR ? b.y + nodeH / 2 : b.y - 4;
        const cx = (x1 + x2) / 2;
        const cy = (y1 + y2) / 2;
        const dPath = isLR
          ? 'M ' + x1 + ' ' + y1 + ' C ' + cx + ' ' + y1 + ', ' + cx + ' ' + y2 + ', ' + x2 + ' ' + y2
          : 'M ' + x1 + ' ' + y1 + ' C ' + x1 + ' ' + cy + ', ' + x2 + ' ' + cy + ', ' + x2 + ' ' + y2;
        edgeSvg += '<path d="' + dPath + '" fill="none" stroke="rgba(148,163,184,0.72)" stroke-width="1.6" marker-end="url(#pg-mermaid-arrow)"/>';
        if (e.label) {
          edgeSvg += '<rect x="' + (cx - 34) + '" y="' + (cy - 10) + '" width="68" height="18" rx="5" fill="#1e293b" stroke="rgba(148,163,184,0.35)"/>' +
            '<text x="' + cx + '" y="' + (cy + 3) + '" text-anchor="middle" fill="#cbd5e1" font-family="sans-serif" font-size="10.5">' + esc(e.label.slice(0, 12)) + '</text>';
        }
      }

      let nodeSvg = '';
      for (const n of nodes.values()) {
        const p = pos.get(n.id);
        if (!p) continue;
        const label = esc(n.label.length > 18 ? n.label.slice(0, 17) + '…' : n.label);
        if (n.shape === 'diamond') {
          const mx = p.x + nodeW / 2;
          const my = p.y + nodeH / 2;
          nodeSvg += '<polygon points="' + mx + ',' + p.y + ' ' + (p.x + nodeW) + ',' + my + ' ' + mx + ',' + (p.y + nodeH) + ' ' + p.x + ',' + my + '" fill="rgba(217,78,40,0.16)" stroke="#f97316" stroke-width="1.5"/>';
        } else {
          const rx = n.shape === 'round' ? '22' : '8';
          nodeSvg += '<rect x="' + p.x + '" y="' + p.y + '" width="' + nodeW + '" height="' + nodeH + '" rx="' + rx + '" fill="#1e293b" stroke="rgba(245,244,240,0.35)" stroke-width="1.4"/>';
        }
        nodeSvg += '<text x="' + (p.x + nodeW / 2) + '" y="' + (p.y + nodeH / 2 + 4) + '" text-anchor="middle" fill="#f8fafc" font-family="sans-serif" font-size="11.5" font-weight="600">' + label + '</text>';
      }

      return '<svg class="aimake-mermaid-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + svgW + ' ' + svgH + '" style="width:100%;max-height:230px;height:auto;display:block;border-radius:10px;background:#0f172a;border:1px solid rgba(148,163,184,0.22);margin:10px 0;">' +
        '<defs><marker id="pg-mermaid-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 1 L 8 5 L 0 9 z" fill="#94a3b8"/></marker></defs>' +
        edgeSvg + nodeSvg + '</svg>';
    }

    function highlightClientCode(rawCode) {
      const tokenRe = /(\\/\\/.*$|#.*$|"(?:\\\\.|[^"])*"|'(?:\\\\.|[^'])*'|\\b(?:import|from|export|const|let|var|function|async|await|return|if|else|type|interface|class|new|npx|pnpm|aimake)\\b|\\b\\d+(?:\\.\\d+)?\\b)/gm;
      let out = '';
      let last = 0;
      let m;
      while ((m = tokenRe.exec(rawCode)) !== null) {
        if (m.index > last) out += esc(rawCode.slice(last, m.index));
        const tok = m[0];
        let cls = 'hljs-keyword';
        if (tok.startsWith('//') || tok.startsWith('#')) cls = 'hljs-comment';
        else if (tok.startsWith('"') || tok.startsWith("'")) cls = 'hljs-string';
        else if (/^\\d/.test(tok)) cls = 'hljs-number';
        out += '<span class="' + cls + '">' + esc(tok) + '</span>';
        last = tokenRe.lastIndex;
      }
      if (last < rawCode.length) out += esc(rawCode.slice(last));
      return out;
    }

    function renderSlideHtml(slide, idx) {
      let blocksHtml = '';

      if (slide.diagram) {
        blocksHtml += '<div class="aimake-diagram-box">' + renderClientMermaidSvg(slide.diagram.code) + '</div>';
      }

      if (slide.metrics && slide.metrics.length > 0) {
        blocksHtml += '<div class="aimake-metrics-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:12px;margin:12px 0;">' +
          slide.metrics.map(m =>
            '<div class="aimake-metric-card" style="padding:12px 14px;background:rgba(125,135,160,0.08);border:1px solid rgba(125,135,160,0.18);border-radius:10px;">' +
            '<div class="aimake-metric-label" style="font-size:11.5px;opacity:0.75;margin-bottom:3px;">' + esc(m.label) + '</div>' +
            '<div class="aimake-metric-value" style="font-size:22px;font-weight:750;letter-spacing:-0.4px;">' + esc(m.value) + '</div>' +
            (m.delta ? '<div class="aimake-metric-delta" style="font-size:11px;color:#10b981;margin-top:3px;">' + esc(m.delta) + '</div>' : '') +
            '</div>'
          ).join('') +
          '</div>';
      }

      if (slide.comparison) {
        blocksHtml += '<div class="aimake-compare-grid" style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin:14px 0;">' +
          '<div style="padding:16px;background:rgba(125,135,160,0.06);border:1px solid rgba(125,135,160,0.15);border-radius:10px;">' +
          '<h4 style="margin:0 0 8px;font-size:13.5px;opacity:0.8;">' + esc(slide.comparison.leftTitle) + '</h4>' +
          '<ul style="margin:0;padding-left:18px;line-height:1.55;font-size:13px;">' + slide.comparison.leftItems.map(it => '<li>' + esc(it) + '</li>').join('') + '</ul>' +
          '</div>' +
          '<div style="padding:16px;background:rgba(59,130,246,0.08);border:1px solid rgba(59,130,246,0.3);border-radius:10px;">' +
          '<h4 style="margin:0 0 8px;font-size:13.5px;color:#3b82f6;">' + esc(slide.comparison.rightTitle) + '</h4>' +
          '<ul style="margin:0;padding-left:18px;line-height:1.55;font-size:13px;">' + slide.comparison.rightItems.map(it => '<li>' + esc(it) + '</li>').join('') + '</ul>' +
          '</div>' +
          '</div>';
      }

      if (slide.code) {
        blocksHtml += '<pre class="aimake-code-pre" style="background:#0f172a;color:#e2e8f0;padding:14px;border-radius:8px;font-family:monospace;font-size:12px;overflow-x:auto;margin:12px 0;border:1px solid rgba(148,163,184,0.2);"><code>' + highlightClientCode(slide.code.code) + '</code></pre>';
      }

      if (slide.quote) {
        blocksHtml += '<blockquote style="margin:14px 0;padding:12px 16px;border-left:3px solid var(--accent, #3b82f6);background:rgba(125,135,160,0.07);font-style:italic;font-size:14px;line-height:1.6;">' + esc(slide.quote.text) + '</blockquote>';
      }

      const bulletsHtml = slide.bullets && slide.bullets.length > 0
        ? '<ul class="aimake-bullets" style="margin:12px 0;padding-left:20px;line-height:1.7;font-size:14px;">' + slide.bullets.map(b => '<li>' + esc(b) + '</li>').join('') + '</ul>'
        : '';

      const hideStyle = viewMode === 'single' && idx !== currentSlideIdx ? 'display:none !important;' : '';

      return '<div class="aimake-slide" id="slide-' + idx + '" style="' + hideStyle + '">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;opacity:0.72;font-size:11px;font-family:monospace;">' +
        '<span>' + esc(slide.eyebrow || '') + '</span>' +
        '<span>' + String(idx + 1).padStart(2, '0') + ' / ' + String(totalSlides).padStart(2, '0') + '</span>' +
        '</div>' +
        '<div style="flex:1;display:flex;flex-direction:column;justify-content:center;min-height:0;">' +
        '<h1 class="aimake-title" style="margin:0 0 6px;font-size:25px;font-weight:750;line-height:1.22;letter-spacing:-0.4px;">' + esc(slide.title) + '</h1>' +
        (slide.subtitle ? '<h2 class="aimake-subtitle" style="margin:0 0 10px;font-size:14.5px;font-weight:450;opacity:0.82;line-height:1.45;">' + esc(slide.subtitle) + '</h2>' : '') +
        bulletsHtml +
        blocksHtml +
        '</div>' +
        '</div>';
    }

    function esc(s) {
      return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    function updateSlideVisibilityInFrame() {
      try {
        const frameDoc = elFrame.contentDocument || (elFrame.contentWindow && elFrame.contentWindow.document);
        if (frameDoc) {
          const nodes = frameDoc.querySelectorAll('.aimake-slide');
          nodes.forEach((node, idx) => {
            if (viewMode === 'all') {
              node.style.removeProperty('display');
            } else {
              node.style.setProperty('display', idx === currentSlideIdx ? 'flex' : 'none', 'important');
            }
          });
        }
      } catch (_) {}
      const ind = document.getElementById('pg-slide-indicator');
      if (ind) {
        ind.textContent = String(currentSlideIdx + 1).padStart(2, '0') + ' / ' + String(Math.max(1, totalSlides)).padStart(2, '0');
      }
      renderCardSlidePills();
      renderPgSlidePills();
      syncCardFormFromMarkdown();
    }

    const elPgPills = document.getElementById('pg-slide-pills');
    function renderPgSlidePills() {
      if (!elPgPills) return;
      elPgPills.innerHTML = Array.from({ length: Math.max(1, totalSlides) }, (_, idx) =>
        '<button type="button" class="pg-slide-pill' + (idx === currentSlideIdx ? ' active' : '') + '" data-pg-slide="' + idx + '" title="第 ' + (idx + 1) + ' 页">' +
        String(idx + 1).padStart(2, '0') + '</button>'
      ).join('');
      elPgPills.querySelectorAll('[data-pg-slide]').forEach(btn => {
        btn.addEventListener('click', () => {
          currentSlideIdx = Number(btn.getAttribute('data-pg-slide')) || 0;
          updateSlideVisibilityInFrame();
        });
      });
      const activePill = elPgPills.querySelector('.pg-slide-pill.active');
      if (activePill && typeof activePill.scrollIntoView === 'function') {
        activePill.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    }

    let compileTimer = null;
    let isApplyingFromCard = false;
    function scheduleCompile() {
      clearTimeout(compileTimer);
      compileTimer = setTimeout(compileNow, 120);
    }

    const elCardEyebrow = document.getElementById('card-eyebrow');
    const elCardTitle = document.getElementById('card-title');
    const elCardSubtitle = document.getElementById('card-subtitle');
    const elCardBullets = document.getElementById('card-bullets');
    const elCardExtra = document.getElementById('card-extra');
    const elCardPills = document.getElementById('card-slide-pills');

    function renderCardSlidePills() {
      if (!elCardPills) return;
      elCardPills.innerHTML = Array.from({ length: Math.max(1, totalSlides) }, (_, idx) =>
        '<button type="button" class="card-pill' + (idx === currentSlideIdx ? ' active' : '') + '" data-card-slide="' + idx + '">' +
        String(idx + 1).padStart(2, '0') + '</button>'
      ).join('');
      elCardPills.querySelectorAll('[data-card-slide]').forEach(btn => {
        btn.addEventListener('click', () => {
          currentSlideIdx = Number(btn.getAttribute('data-card-slide')) || 0;
          updateSlideVisibilityInFrame();
        });
      });
    }

    function syncCardFormFromMarkdown() {
      const parsed = parseClientMarkdown(elInput.value);
      const slide = parsed.slides[currentSlideIdx] || parsed.slides[0];
      if (!slide) return;
      if (document.activeElement !== elCardEyebrow) elCardEyebrow.value = slide.eyebrow || '';
      if (document.activeElement !== elCardTitle) elCardTitle.value = slide.title || '';
      if (document.activeElement !== elCardSubtitle) elCardSubtitle.value = slide.subtitle || '';
      if (document.activeElement !== elCardBullets) elCardBullets.value = (slide.bullets || []).join('\\n');
      if (document.activeElement !== elCardExtra) elCardExtra.value = slide.rawExtra || '';
    }

    function applyCardFormToMarkdown() {
      const raw = elInput.value;
      const fmMatch = raw.match(/^(---\\n[\\s\\S]*?\\n---\\n?)([\\s\\S]*)$/);
      const fmHeader = fmMatch ? fmMatch[1] : '';
      const parsed = parseClientMarkdown(raw);
      const slidesArr = parsed.rawSlides.slice();
      while (slidesArr.length <= currentSlideIdx) {
        slidesArr.push('# 第 ' + (slidesArr.length + 1) + ' 页');
      }
      const prevSlide = parsed.slides[currentSlideIdx] || {};
      const eyebrow = elCardEyebrow.value.trim();
      let commentLine = prevSlide.commentRaw || '';
      if (commentLine) {
        const inner = commentLine.replace(/^<!--\\s*|\\s*-->$/g, '');
        const parts = inner.split('|').map(p => p.trim()).filter(Boolean).filter(p => !/^eyebrow\\s*:/i.test(p));
        if (eyebrow) parts.push('eyebrow: ' + eyebrow);
        commentLine = parts.length ? '<!-- ' + parts.join(' | ') + ' -->' : '';
      } else if (eyebrow) {
        commentLine = '<!-- scene: card-' + (currentSlideIdx + 1) + ' | layout: default | eyebrow: ' + eyebrow + ' -->';
      }
      const lines = [];
      if (commentLine) lines.push(commentLine.trim());
      lines.push('# ' + (elCardTitle.value.trim() || ('第 ' + (currentSlideIdx + 1) + ' 页')));
      if (elCardSubtitle.value.trim()) lines.push('## ' + elCardSubtitle.value.trim());
      const bulletLines = elCardBullets.value
        .split('\\n')
        .map(s => s.trim())
        .filter(Boolean)
        .map(s => (s.startsWith('- ') || s.startsWith('* ') ? s : '- ' + s));
      if (bulletLines.length) lines.push('', ...bulletLines);
      const extraText = elCardExtra.value.trim();
      if (extraText) lines.push('', extraText);

      slidesArr[currentSlideIdx] = lines.join('\\n');
      const nextMd = (fmHeader ? fmHeader.trimEnd() + '\\n\\n' : '') + slidesArr.join('\\n\\n---\\n\\n') + '\\n';
      elInput.value = nextMd;
      isApplyingFromCard = true;
      compileNow();
      isApplyingFromCard = false;
    }

    function compileNow() {
      const raw = elInput.value;
      try {
        localStorage.setItem('aimake_playground_md', raw);
      } catch (_) {}

      const parsed = parseClientMarkdown(raw);
      totalSlides = Math.max(1, parsed.slides.length);
      if (currentSlideIdx >= totalSlides) currentSlideIdx = totalSlides - 1;

      let tplId = parsed.frontmatter.template || elTemplate.value || 'apple-bento-launch';
      let tpl = TEMPLATE_MAP.get(tplId) || TEMPLATE_MAP.get('apple-bento-launch') || TEMPLATES_DATA[0];

      if (elTemplate.value !== tpl.id) {
        elTemplate.value = tpl.id;
      }

      let aspect = elAspect.value === 'auto' ? (parsed.frontmatter.aspect || tpl.aspect || '16:9') : elAspect.value;

      const slidesHtml = parsed.slides.map((s, idx) => renderSlideHtml(s, idx)).join('');

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

      const fullHtml = '<!DOCTYPE html><html><head><meta charset="utf-8"/><style>' +
        tpl.css +
        '\\nhtml { width:100%; height:100%; margin:0; padding:0; }\\n' +
        'body { width:100%; margin:0; padding:18px 24px 56px; min-height:100vh; background:#0c0c0e !important; display:flex !important; flex-direction:column !important; align-items:center !important; justify-content:' + (viewMode === 'single' ? 'center' : 'flex-start') + ' !important; box-sizing:border-box; }\\n' +
        '#aimake-deck-root { width:100% !important; max-width:' + slideMaxW + ' !important; display:flex !important; flex-direction:column !important; gap:24px !important; align-items:stretch !important; }\\n' +
        '.aimake-slide { width:100% !important; height:auto !important; min-height:0 !important; max-height:calc(100vh - 120px) !important; aspect-ratio:' + cssRatio + ' !important; padding:28px 36px !important; box-sizing:border-box !important; display:flex; flex-direction:column; justify-content:space-between; border-radius:12px !important; overflow:hidden !important; box-shadow:0 14px 40px rgba(0,0,0,0.42) !important; }\\n' +
        '.hljs-keyword { color:#93c5fd; font-weight:600; } .hljs-string { color:#86efac; } .hljs-comment { color:#64748b; font-style:italic; } .hljs-number { color:#fda4af; }\\n' +
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
      cardEditorPane.classList.remove('hidden');
      sourceEditorWrap.classList.add('hidden');
      renderCardSlidePills();
      syncCardFormFromMarkdown();
    });

    [elCardEyebrow, elCardTitle, elCardSubtitle, elCardBullets, elCardExtra].forEach(el => {
      el.addEventListener('input', applyCardFormToMarkdown);
    });

    document.getElementById('btn-card-add-slide').addEventListener('click', () => {
      const nextNum = totalSlides + 1;
      elInput.value = elInput.value.trimEnd() + '\\n\\n---\\n\\n<!-- scene: card-' + nextNum + ' | layout: bullets -->\\n# 新增第 ' + nextNum + ' 页标题\\n## 补充你的核心观点\\n\\n- 要点一\\n- 要点二\\n';
      currentSlideIdx = nextNum - 1;
      compileNow();
      showToast('已新增第 ' + nextNum + ' 页');
    });

    document.getElementById('pg-prev-slide').addEventListener('click', () => {
      currentSlideIdx = Math.max(0, currentSlideIdx - 1);
      updateSlideVisibilityInFrame();
    });
    document.getElementById('pg-next-slide').addEventListener('click', () => {
      currentSlideIdx = Math.min(Math.max(0, totalSlides - 1), currentSlideIdx + 1);
      updateSlideVisibilityInFrame();
    });
    const VIEW_ICON_HTML = '${lucideIcon('layoutGrid')}';
    document.getElementById('pg-view-mode').addEventListener('click', () => {
      viewMode = viewMode === 'single' ? 'all' : 'single';
      document.getElementById('pg-view-mode').innerHTML = VIEW_ICON_HTML + (viewMode === 'single' ? ' 单页视图' : ' 全部平铺');
      compileNow();
    });

    elInput.addEventListener('input', scheduleCompile);

    elSample.addEventListener('change', () => {
      const key = elSample.value;
      if (SAMPLES[key]) {
        currentSlideIdx = 0;
        elInput.value = SAMPLES[key];
        scheduleCompile();
        showToast('已载入示范原稿：' + elSample.options[elSample.selectedIndex].text);
      }
    });

    elTemplate.addEventListener('change', () => {
      const tplId = elTemplate.value;
      if (/^template:\\s*.*$/m.test(elInput.value)) {
        elInput.value = elInput.value.replace(/^template:\\s*.*$/m, 'template: ' + tplId);
      } else if (elInput.value.startsWith('---')) {
        elInput.value = elInput.value.replace(/^---\\n/, '---\\ntemplate: ' + tplId + '\\n');
      } else {
        elInput.value = '---\\ntemplate: ' + tplId + '\\n---\\n\\n' + elInput.value;
      }
      scheduleCompile();
      showToast('已切换至模板：' + tplId);
    });

    elAspect.addEventListener('change', () => {
      scheduleCompile();
    });

    // Snippet Chips
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
      });
    });

    // Humanizer
    const BANNED_AI_WORDS = [
      ['总而言之，', ''], ['总而言之', '归根结底'],
      ['不仅如此，', '更进一步，'], ['毫无疑问，', ''],
      ['毫无疑问', '显然'], ['颠覆性创新', '关键突破'],
      ['赋能', '驱动'], ['底层逻辑', '核心机制'],
      ['抓手', '切入点']
    ];
    document.getElementById('btn-humanize').addEventListener('click', () => {
      let text = elInput.value;
      let count = 0;
      for (const [w, rep] of BANNED_AI_WORDS) {
        if (text.includes(w)) {
          text = text.split(w).join(rep);
          count++;
        }
      }
      elInput.value = text;
      scheduleCompile();
      showToast('去 AI 味完成！清洗了 ' + count + ' 处套路化词汇');
    });

    function setBtnFeedback(btn, tempText, tempIcon) {
      if (!btn) return;
      const originalHtml = btn.innerHTML;
      btn.classList.add('pg-btn-success');
      btn.innerHTML = (tempIcon || '') + ' ' + tempText;
      btn.disabled = true;
      setTimeout(() => {
        btn.classList.remove('pg-btn-success');
        btn.innerHTML = originalHtml;
        btn.disabled = false;
      }, 2000);
    }

    // Export Current Slide PNG (Client foreignObject SVG -> Canvas)
    const btnExportPng = document.getElementById('btn-export-png');
    btnExportPng.addEventListener('click', () => {
      const origHtml = btnExportPng.innerHTML;
      btnExportPng.innerHTML = '${lucideIcon('loader', 'ic spin')} 导图中...';
      btnExportPng.disabled = true;
      showToast('正在生成当前页高清 PNG 图片…');
      try {
        const frameDoc = elFrame.contentDocument || (elFrame.contentWindow && elFrame.contentWindow.document);
        if (!frameDoc) throw new Error('画布尚未初始化');
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

    // Copy WeChat HTML (all slides even in single-slide focus view)
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

    // First compile
    compileNow();
  </script>
</body>
</html>`;
}
