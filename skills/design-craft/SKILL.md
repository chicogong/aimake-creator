---
name: design-craft
description: Authoritative design system and aesthetic craft skill synthesizing Calm Technology, Dieter Rams' principles, Swiss Typographic Style, and modern software craft (Linear, Apple Pro, Pitch). Enforces anti-AI-slop visual discipline, obsidian depth, mathematical grid layouts, quiet elegance, and typographic perfection across UI, web, and presentation storyboards.
version: "1.0.0"
author: Chico Gong & Aimake Core Design
standard: "HKUDS/CLI-Anything"
tags: [design-system, ui-craft, calm-tech, swiss-style, typography, dieter-rams, linear-style, anti-ai]
---

# Design Craft — 静默设计与高阶界面美学工程指南

> **“The best interface is quiet, precise, and respectful of human cognition.”**  
> 优秀的工具如同精心调校的机械腕表或高保真光学镜头：它以极致的准确度放大人类的意图，却从不抢夺用户的注意力。

本规范是 Aimake 创作者操作系统及其派生客户端、演示画布、文档与展示站点的**最高视觉与排印宪章**。它旨在彻底终结当前工业界泛滥的“AI 塑料感”（AI Slop）——浮夸的霓虹紫渐变、闪烁的魔杖 Emoji、虚妄的颠覆式营销黑话、以及廉价的卡片堆叠，转而回归经得起时间考验的**经典设计哲学**与**现代软件手艺（Software Craftsmanship）**。

---

## 1. 核心设计哲学四重奏 (The Four Pillars)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           静默设计哲学四重奏                                │
├──────────────────────┬──────────────────────┬───────────────────────────────┤
│ 1. Calm Technology   │ 2. Dieter Rams 10条  │ 3. 瑞士国际主义排版风格      │
│    Mark Weiser / PARC│    Weniger, aber     │    Josef Müller-Brockmann     │
│    外围感知 · 不抢夺注意 │    besser 少却更好   │    严密网格 · 不对称张力 · 零悬挂 │
├──────────────────────┴──────────────────────┴───────────────────────────────┤
│ 4. 现代工匠级界面 (Modern Studio Craft)                                     │
│    Linear · Apple Pro · Pitch                                               │
│    黑曜石深景深 (Obsidian) · 发丝折射高光 (1px Refraction) · 物理阻尼弹性    │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.1 第一基石：Calm Technology（静默技术）
源自普适计算之父 Mark Weiser 与 Xerox PARC 的经典理论：**技术应当在人的注意力外围运作，仅在需要时优雅地进入中心焦点。**

* **外围意识优先（Peripheral Awareness）**：界面的常规状态必须是静态且宁静的。不要使用持续微动的呼吸灯、旋转图标或未被触发的浮动弹窗来强行证明系统“在思考”。
* **注意力预算（Attention Conservation）**：人类注意力是最稀缺的资源。每一次无谓的视觉刺激（红点、彩色 Badge、弹跳通知）都是对创作者认知带宽的掠夺。
* **物理隐喻与静默反馈**：通过环境光微弱漫反射（5%–8% 不透明度）、发丝边框状态切换或柔和的字符变化传递状态，而非弹出刺眼的 Modal。

### 1.2 第二基石：Dieter Rams 的好设计十原则 (Less, but better)
* **创新但不做作 (Innovative)**：创新服务于真实的人机交互效率，绝非为了炫耀算法而制造新奇的杂耍式交互。
* **增强实用性 (Useful)**：每一个按钮、每一行字距必须有明确的功能动机。去除一切装饰性空壳元素。
* **极具美感 (Aesthetic)**：朝夕相伴的工作工具，其形式美感直接决定心流体验。美产生于严密的几何比例与细腻的材质处理。
* **清晰可懂 (Understandable)**：界面自述其意。用户看到控件即明白其 affordance（可供性），无需附带一长篇浮夸的引导说明。
* **克制而谦逊 (Unobtrusive)**：软件是创作者思想的画笔，而不是画作本身。界面应退居幕后，让内容成为绝对主角。
* **诚实坦率 (Honest)**：**严禁虚假的“AI 魔法感”**。如果一个操作需要 1.5 秒，显示干净的等宽进度指标，绝不虚构“正在调动全球脑力为你生成”的欺骗性文案。
* **历久弥新 (Long-lasting)**：坚决拒绝短命的视觉流行潮（如 2023 年泛滥的高饱和紫蓝弥散光、厚重磨砂玻璃、黏土拟物风）。追求 10 年后依然耐看的设计。
* **细致入微 (Down to the Last Detail)**：1px 的对齐误差、0.5px 的内高光缺失、中西文混排少了一个半角空格，都会打破整体的精密感。
* **关注生态与认知负荷 (Environmentally Conscious)**：降低界面视觉噪音就是保护创作者的心智生态环境。
* **大道至简 (As Little Design as Possible)**：少，但更好。能用排版解决的不用线框，能用间距解决的不用分割线。

### 1.3 第三基石：瑞士国际主义排版风格 (Swiss Typographic Style)
继承 Josef Müller-Brockmann 与 Emil Ruder 的排版体系：

* **严密数学网格（The Modular Grid）**：
  * 基于 4px / 8px 的绝对垂直基线节律（Baseline Rhythm）。
  * 页面采用经典的 12 栏（12-Column）或 6 栏网格，卡片与图文严格吸附在网格模数上。
* **不对称张力（Asymmetric Tension）**：
  * 拒绝呆板的全部居中对齐。使用极具力量感的左对齐大标题与右侧留白形成张力；
  * 大小反差比控制在黄金比例区间（例如标题 36px 对应正文 14px，对比度 2.57:1）。
* **微观排版铁律（Micro-Typography Guardrails）**：
  * **零悬挂孤字（Zero Orphan Words）**：中文末行禁止只有单字或单个词组成行；标题与正文容器必须强制声明 `text-wrap: balance` 或 `text-wrap: pretty`。
  * **中西文标点与间距规范**：中文与英文/阿拉伯数字混排时保留统一间隙（盘古规范）；标点严格避头尾（Kinsoku Shori），禁止逗号、句号、右括号落于行首。
  * **等宽数字与数据表格**：时间戳、序列号、百分比、财务数字必须启用 `font-variant-numeric: tabular-nums`，确保垂直对齐无抖动。

### 1.4 第四基石：现代工匠级界面 (Linear, Apple & Pitch Craft)
* **黑曜石深景深（Obsidian Optical Darkroom）**：
  * 摒弃刺眼且死板的纯黑 `#000000`。
  * 采用冷黑曜石层级系统（如 `#07080c` 底层 -> `#0e1017` 工作区表面 -> `#141721` 悬浮卡片 -> `#1c202e` 弹出面板），营造如同专业暗房般的温润深邃感。
* **建筑暖纸灰（Atelier Vellum Light Mode）**：
  * 浅色模式严禁苍白刺眼的 `#ffffff` 全屏反光。
  * 采用暖调建筑草图纸质感（`#eceae4` / `#f5f4ef`），搭配深岩灰字形（`#19191d`），带来如同翻阅高档艺术纸画册的触觉质感。
* **1px 发丝折射高光（Hairline Refraction）**：
  * 边框一律使用极细的半透明发丝线：`1px solid rgba(255, 255, 255, 0.08)`（深色）或 `1px solid rgba(0, 0, 0, 0.08)`（浅色）。
  * 搭配顶部 0.5px 的内部透光发丝：`box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06)`，模拟高级机械硬件边缘的金属微倒角反射。
* **弹簧阻尼运动（Spring-Damper Dynamics）**：
  * 严禁卡通式的弹性果冻晃动（Elastic Bounce）。
  * 统一使用 Apple / Linear 标准物理阻尼贝塞尔曲线：`cubic-bezier(0.16, 1, 0.3, 1)`，微交互持续时间控制在 140ms - 220ms 之间，干脆利落。

---

## 2. 去“AI 化”语言与视觉禁令 (Anti-AI-Hype Directive)

任何带有“廉价 AI 生成感”的词汇与视觉元素，都会瞬间拉低产品档次。必须执行无条件替换与拦截：

### 2.1 词汇重塑矩阵 (Terminology Transmutation)

| 禁用的 AI 塑料黑话 (Banned AI Slop) | 强制替换的专业工程/工艺词汇 (Sanctioned Craft) | 替换原由与语境 |
| :--- | :--- | :--- |
| ❌ **AI 颠覆 / 革命性变革 / 拐点已来** | ✅ **架构重构 / 算法突破 / 性能跨越** | 拒绝宏大叙事与贩卖焦虑，使用具体客观的技术词 |
| ❌ **AI 废话 / 一键生成爆款 / 神仙神器** | ✅ **结构化排版 / 模板编排 / 语义提炼** | 工具不是算命魔法，而是确定性的创作者工作流 |
| ❌ **AI 赋能 / 抓手 / 闭环 / 深度下沉** | ✅ **支持 / 协作 / 交付 / 管道集成** | 剔除互联网互联网八股文，回归朴实直接的行动动词 |
| ❌ **智能神仙脑 / 宇宙最强 AI** | ✅ **推理模型 / 本地切片器 / 语法编译器** | 坦诚交代软件构件的真实本质，保留专业信任感 |
| ❌ **在 AI 中创作 / AI 对话框** | ✅ **协同创作 / 分镜助手 / 结构修稿** | 消除 AI 标签的喧宾夺主，凸显创作者本体地位 |
| ❌ **Delve into / Tapestry / In today's fast-paced world** | ✅ **Explore / Architecture / Specifically** | 剔除英文 LLM 高频机械套话，采用短促有力的盎格鲁-撒克逊动词 |
| ❌ **言うまでもなく / 革新的な AI パラダイム** | ✅ **アーキテクチャの刷新 / 構造化エディタ** | 日文去除机械翻译腔，标题采用利落的“体言止め” |
| ❌ **혁신적인 AI 솔루션 / 놀라운 기적** | ✅ **로컬 워크플로우 / 정밀 조판 엔진** | 韩文去除浮夸形容词，使用自然的工程师语言 |

### 2.2 视觉黑名单 (Visual Redlines)

1. **绝对禁止“霓虹彩虹色”（Rainbow Neon Gradients）**：
   * 严禁紫色、青色、桃红色（Purple-Cyan-Magenta）的刺眼渐变边框和文字。
   * 强调色全界面面积占比**严禁超过 5%**。绝大部分界面由层次丰富的单色黑白灰与极微的色温构成。
2. **绝对禁止“滥用魔法星星”（The Sparkle Epidemic）**：
   * 严禁在普通按钮、输入框、标题旁边随意添加 `✨`、`🪄`、`🔮`、`🚀`、`🔥`。
   * 界面图标统一采用精确的 1.25px / 1.5px 线条几何图标（如 Radix Icons, Lucide, SF Symbols 风格）。
3. **绝对禁止“浮夸的 AI 标识徽章”（Tacky AI Badges）**：
   * 严禁出现带有发光投影的彩色小药丸胶囊 `[AI ULTRA]`、`[AI INSIGHT]`。
   * 如需标识数据来源，使用低调的等宽微型标签（例如：`· 本地优先 · 16:9 · 8 栏网格`）。
4. **绝对禁止“无意义的磨砂半透明堆砌”（Muddled Glassmorphism）**：
   * 背景模糊（Backdrop Filter Blur）必须搭配明确的背景底色不透明度（如 85%–90%），禁止多层低不透明度叠加导致的界面泥泞感与内容不可读。

---

## 3. 设计代币规范 (Design Token Contracts)

以下代币已固化为 Aimake 体系的系统标准，任何新页面与组件均需严格遵守此变量映射：

### 3.1 颜色系统代币 (Color Palette Tokens)

```css
:root {
  /* ========== 深色模式：Deep Obsidian (光学暗房) ========== */
  --bg-deep-void: #050608;             /* 极深背景基底，底图遮罩 */
  --bg-obsidian-base: #090a0f;         /* 视窗全局画布主色 */
  --bg-obsidian-surface: #0e1017;      /* 侧边栏、工具条、容器主表面 */
  --bg-obsidian-card: #141721;         /* 内容卡片、分镜单元 */
  --bg-obsidian-hover: #1c202e;        /* 悬浮交互层 */
  --bg-obsidian-active: #23283a;       /* 选中按下态 */

  /* 前景色与排印对比度阶梯 (WCAG AAA 级对齐) */
  --text-primary: #f2f3f5;             /* 纯净前景色（并非刺眼 #fff） */
  --text-secondary: #9ba1b0;           /* 次级说明文案，柔和自然 */
  --text-muted: #5e6475;               /* 占位符、注释、微辅助信息 */
  --text-tertiary: #3e4453;            /* 极弱提示符、未激活线索 */

  /* 发丝线条与微折射高光 */
  --border-hairline: rgba(255, 255, 255, 0.08);       /* 1px 发丝边框 */
  --border-subtle: rgba(255, 255, 255, 0.12);         /* 聚焦与可交互边框 */
  --border-highlight: rgba(255, 255, 255, 0.18);      /* 活动元素边界 */
  --inner-specular: inset 0 1px 0 rgba(255, 255, 255, 0.06); /* 顶部 0.5px 金属高光 */

  /* 极为克制的强调色 (严格控制在总面积 3%-5% 之内) */
  --accent-creator-violet: #6366f1;    /* 创作主色（沉稳的靛青紫） */
  --accent-calm-teal: #14b8a6;         /* 成功 / 就绪 / 静默运行 */
  --accent-amber-focus: #f59e0b;       /* 警示 / 需要人工介入 */
  --accent-crimson-error: #ef4444;     /* 拦截 / 语法断言失败 */
}

/* ========== 浅色模式：Atelier Vellum (建筑暖纸灰) ========== */
[data-theme="light"], .theme-light {
  --bg-deep-void: #e4e2dc;
  --bg-obsidian-base: #eceae4;         /* 温暖羊皮纸建筑底色 */
  --bg-obsidian-surface: #f5f4ef;      /* 工作台主面板 */
  --bg-obsidian-card: #ffffff;         /* 白净凸起卡片 */
  --bg-obsidian-hover: #f0eee8;
  --bg-obsidian-active: #e6e3da;

  --text-primary: #121316;             /* 深曜黑主文本 */
  --text-secondary: #575c69;           /* 炭灰色副文本 */
  --text-muted: #8c92a1;
  --text-tertiary: #b9bec9;

  --border-hairline: rgba(0, 0, 0, 0.08);
  --border-subtle: rgba(0, 0, 0, 0.14);
  --border-highlight: rgba(0, 0, 0, 0.22);
  --inner-specular: inset 0 1px 0 rgba(255, 255, 255, 0.6);
}
```

### 3.2 排印代币与比例缩放 (Typography Scales)

Aimake 采用系统原生与现代无衬线字体栈（Geist Sans, Inter, SF Pro Display, PingFang SC, Hiragino Sans, Pretendard）。排印阶梯严格遵循模块化比例：

```css
/* 字体族栈定义 */
--font-sans: "Geist Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
--font-mono: "Geist Mono", SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;

/* 阶梯缩放标尺 */
--text-display-2xl: 48px;  line-height: 1.08; letter-spacing: -0.04em; font-weight: 700;
--text-title-xl:    32px;  line-height: 1.15; letter-spacing: -0.03em; font-weight: 600;
--text-headline-lg: 24px;  line-height: 1.25; letter-spacing: -0.02em; font-weight: 600;
--text-subhead-md:  18px;  line-height: 1.35; letter-spacing: -0.01em; font-weight: 500;
--text-body-base:   14px;  line-height: 1.55; letter-spacing: -0.005em; font-weight: 400;
--text-caption-sm:  12px;  line-height: 1.45; letter-spacing: 0em; font-weight: 400;
--text-mono-code:   12px;  line-height: 1.40; letter-spacing: -0.01em; font-weight: 450;
```

### 3.3 空间网格与圆角系统 (Spacing & Radius)

```css
/* 空间网格步进 */
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-6: 24px;
--space-8: 32px;
--space-12: 48px;
--space-16: 64px;

/* 精工微圆角体系 */
--radius-xs: 4px;      /* 极微标签、徽章 */
--radius-sm: 6px;      /* 内部按钮、输入框单元 */
--radius-md: 8px;      /* 弹窗小卡片、下拉菜单 */
--radius-lg: 12px;     /* 标准内容卡片、画布分镜面板 */
--radius-xl: 16px;     /* 主工作区外容器、模态视窗 */
--radius-pill: 9999px; /* 状态胶囊、浮动导航药丸 */
```

### 3.4 弥散阴影与高斯景深 (Multi-Tier Shadows)

严禁单层生硬死黑的 `box-shadow: 0 4px 10px #000`。采用多层物理光圈衰减：

```css
/* 低悬浮阴影 (普通交互卡片) */
--shadow-elevation-1: 
  0 1px 2px rgba(0, 0, 0, 0.3),
  0 4px 12px rgba(0, 0, 0, 0.15);

/* 中悬浮阴影 (工作台浮动 Dock、下拉菜单) */
--shadow-elevation-2: 
  0 2px 4px rgba(0, 0, 0, 0.4),
  0 8px 24px -4px rgba(0, 0, 0, 0.35),
  inset 0 1px 0 rgba(255, 255, 255, 0.08);

/* 高悬浮景深 (全屏大图预览、模态浮层) */
--shadow-elevation-3: 
  0 8px 16px rgba(0, 0, 0, 0.45),
  0 24px 64px -12px rgba(0, 0, 0, 0.65),
  inset 0 1px 0 rgba(255, 255, 255, 0.1);
```

---

## 4. 黄金排版规范与分镜架构 (Markdown & Deck Craft)

在 Aimake 生成 `.deck.md` 或文档页面时，必须体现严密的瑞士网格与模块化便当盒（Bento Box）比例。

### 4.1 模态比例与排版预算 (Aspect Ratio & Text Density Budgets)

绝不允许文字撑破卡片。每一张幻灯片必须在字符数量与留白之间保持绝对的呼吸感：

```text
┌───────────────────────────────┬───────────────────────────────┐
│ 16:9 Keynote / Apple Bento    │ 3:4 Swiss Grid Editorial      │
│ · 适合技术架构与深度演示      │ · 适合小红书/社交长图与专栏   │
│ · 标题 <= 22 字 (负字距)      │ · 标题 <= 16 字 (强烈视觉冲击)│
│ · 单页卡片 3 - 4 个模数       │ · 留白占比 >= 40%             │
├───────────────────────────────┼───────────────────────────────┤
│ 4:5 Executive Brief           │ 1:1 Zukai (図解) Quad         │
│ · 适合商业白皮书与领英专栏    │ · 适合四象限思维模型与因果链  │
│ · 严谨双栏不对称比例 (6:4)    │ · 严格四象限等比十字分割      │
└───────────────────────────────┴───────────────────────────────┘
```

### 4.2 模范排版范例 (The Exemplary Markdown Storyboard)

这是一个完全符合 **design-craft** 规范的 `.deck.md` 页面示范：

```markdown
---
title: 本地优先创作引擎架构
template: apple-bento-16-9
locale: zh-CN
aspect: 16:9
author: Chico Gong
handle: "@chicogong"
watermark: false
theme: obsidian
---

<!-- scene: hook | layout: bento-3-cell | eyebrow: 架构演进 · 2026 -->
# 为什么严肃创作者正在逃离云端黑盒？
## 将排版精度与状态机完全收敛于本地端侧，消除网络抖动与审美降级。

::: grid cols-3 gap-6
::: card col-span-2 surface-elevated
#### 确定性排版流水线
采用纯本地 AST 解析器，将 Markdown 语意实时映射为 SVG 矢量节点与原生 CSS 栅格。

```metric
- 端侧冷启动: 12ms (零云端网络往返)
- 内存常驻: 42MB (极简 Rust/TS 核心)
- 矢量缩放: 100% 无损对齐
```
:::

::: card col-span-1 surface-card
#### 静默状态感知
无需繁杂弹窗，所有编排进度通过终端状态胶囊与微暗房背光无缝传递。

- 零侵入外围提示
- 纯本地 Git 历史追踪
- 四语种标点避头尾引擎
:::
:::

::: speech
真正专业的工具从不喧闹。我们将复杂的视觉编排化为一组离散、确定的本地命令，让创作回归纯粹的思考。
:::
```

---

## 5. 十项设计精工验收门禁 (The 10-Point Craft Gate)

在提交任何 UI 组件、页面代码或生成的故事板之前，执行严格的**十项军规审查**：

- [ ] **1. 无 AI 塑料感 (No AI Slop)**：文本中绝对不含“AI 颠覆/神器/一键暴富/赋能/闭环”等词汇；界面无紫色荧光弥散、无随意点缀的 `✨` 星星。
- [ ] **2. 严密网格对齐 (Strict 8pt Grid)**：所有外边距、内衬 Padding、间距 Gap 全部为 4 或 8 的整数倍，容器边缘严丝合缝。
- [ ] **3. 零孤字悬挂 (Zero Widows & Orphans)**：检查所有中文段落末行，绝无单字独占一行；标题容器开启 `text-wrap: balance`。
- [ ] **4. 色彩极度克制 (Color Discipline)**：彩色（强调色）出现面积严格控制在全屏 5% 以内，其余部分皆由细腻的灰度与景深构建。
- [ ] **5. 发丝边框精密 (Hairline Refraction)**：卡片边框采用 1px 半透明线条配合顶部 0.5px 内发丝高光，层次分明，绝不使用死黑边框。
- [ ] **6. 字体层级有序 (Typographic Hierarchy)**：Display、Headline、Body、Caption 之间字号与字重阶梯明确，行高随字号增大而收紧（1.1 -> 1.55）。
- [ ] **7. 数据与度量等宽 (Tabular Metrics)**：数字、百分比、时间戳均配置 `font-variant-numeric: tabular-nums`，无位移跳动。
- [ ] **8. 物理阻尼微动 (Tactile Motion)**：动效曲线统一为 `cubic-bezier(0.16, 1, 0.3, 1)`，耗时在 140ms-220ms 之间，无弹性乱颤。
- [ ] **9. 外围静默状态 (Calm Peripheral State)**：状态反馈低调优雅（呼吸微光、微型状态胶囊），无突兀阻断型模态框。
- [ ] **10. 双模式完美适配 (Dual-Mode Fidelity)**：深色模式具备黑曜石暗房深景深；浅色模式具备建筑暖纸灰质感，绝非生硬黑白反转。

---

## 6. 工具与自动化校验脚本 (Tooling & Automated Verification)

本技能附带结构化数据代币与校验词典，可直接被 CI 门禁或 CLI 命令消费：

* `references/tokens.json`：定义深色与浅色模式的完整 CSS/JSON 代币树。
* `references/anti-slop-dictionary.json`：四语种（zh-CN, en, ja, ko）违禁词与替换词映射表。
* `examples/calm-obsidian-showcase.deck.md`：官方高精度演示分镜参考。
