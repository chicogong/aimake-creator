# Aimake 2026 顶级视觉与交互重塑规范
# (Aimake UI/UX Top-Tier Craft & Design System Overhaul 2026)

> **版本**：`v2026.1.0-SPEC`  
> **适用范围**：
> - 官网与营销展廊 (`src/site/site-builder.ts`)
> - Web 在线工作室与试玩台 (`src/site/playground-builder.ts`)
> - 本地与桌面端 Calm Studio (`src/studio/calm-ui/styles.ts`, `src/studio/calm-ui/markup.ts`)
> **对标基准**：Linear · Raycast · Vercel Geist · Apple Human Interface · Figma · Craft · Slidev  
> **责任分工**：
> - 规范制定与审计：`@ui_researcher`
> - 官网与展廊重塑：`@site_designer` (分支 `feat/site-redesign-2026`)
> - Web 在线工作室重塑：`@playground_designer` (分支 `feat/playground-redesign-2026`)
> - Calm Studio 工作台重塑：`@studio_designer` (分支 `feat/studio-redesign-2026`)

---

## 一、 顶尖对标体系与设计哲学 (Design Manifesto & Benchmarking)

Aimake 作为 2026 顶尖的“多模态创作与幻灯片构建引擎”，其界面品质必须完全摆脱“传统开源软件的毛糙感”与“普通 Web 应用的廉价感”，达到 **Linear、Raycast、Apple 与 Figma 级别的工业级克制与高级感**。

### 1.1 核心对标维度与设计解构

| 标杆工具 | 核心工艺特征 | Aimake 汲取与落地标准 |
| :--- | :--- | :--- |
| **Linear** | **Deep Obsidian 微梯度**、**1px 发丝内嵌高光**、**物理弹簧响应** | 彻底根除纯黑（`#000000`），采用 `#090a0f`（底）/ `#11131a`（板）/ `#181b24`（浮层）三阶层级；所有卡片引入双层光学微边框（外发丝 + 内高光）。 |
| **Raycast** | **超高饱和毛玻璃 (Backdrop Blur)**、**极简 Tactile 键盘触感** | 顶栏与悬浮 Dock 采用 `backdrop-filter: blur(24px) saturate(180%)`，按钮点击提供 `scale(0.975)` 物理弹簧回弹。 |
| **Vercel Geist** | **微排印艺术 (Micro-Typography)**、**字间距微缩**、**Tabular 等宽数字** | 全面启用 OpenType 特性 `font-feature-settings: "cv02", "cv03", "cv04", "cv11"`；标题字间距收紧至 `-0.035em`；数字统一启用 `tabular-nums`。 |
| **Apple HIG** | **暖纸灰 (Vellum Paper)**、**空间层次感与光学间距** | 日间浅色模式摒弃刺眼惨白，采用建筑纸灰 `#f5f4ef` 与 `#eceae4`，实现如实体纸张般的舒适阅读手感。 |
| **Figma / Slidev** | **Canvas-First 舞台原则**、**46px 超薄操作条** | 界面控件为内容让路，画布视口占据 85%+ 空间；顶部工具栏压缩至 46px，消除垂直空间冗余。 |

---

## 二、 当前代码库破绽全盘审计 (Comprehensive Codebase Audit)

经全盘代码扫描与视觉渲染审计，当前三大模块存在以下影响“高级感与克制感”的核心破绽：

### 2.1 官网模块 (`src/site/site-builder.ts`) 破绽清单

1. **Hero 渐变过亮断层与光晕失控**：
   - *现状*：`background: linear-gradient(180deg, #ffffff 15%, #cbd5e1 100%)` 在大屏下对比断层生硬；背景多重 radial-gradient 混杂了蓝色、紫色、黄色与绿色，造成视觉噪点，缺乏顶尖开发工具的深邃 Obsidian 质感。
   - *重塑建议*：收敛背景极光为单一温润的 `Creator Violet` 微量发散（5% 不透明度）；文字渐变采用 `#ffffff` 到 `rgba(255,255,255,0.72)`，配合微排印特性。
2. **Bento 网格卡片缺乏层次与发丝高光**：
   - *现状*：卡片仅有常规 `border: 1px solid var(--border)`，在大暗底上视觉扁平；Hover 时阴影过黑、边框直接突变为亮紫色，跳跃感过强。
   - *重塑建议*：卡片加入 `box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08), 0 12px 32px rgba(0, 0, 0, 0.4)`，Hover 采用 `cubic-bezier(0.16, 1, 0.3, 1)` 阻尼升浮。
3. **8 款代表作品展廊（Multimodal Works Gallery）卡片质感欠缺**：
   - *现状*：卡片内预览视口（`work-preview`）高度仅 118px，排版拥挤；画幅比例标签（`work-aspect-tag`）和格式标签样式突兀，与卡片整体脱节；「做同款」与「在线试玩」按钮层次混乱。
   - *重塑建议*：视口统一为 16:9 / 3:4 黄金视觉比例；比例标签采用磨砂小胶囊（`backdrop-filter: blur(12px)` + 半透明边框）；按钮建立 Clear-Cut 层次：主操作高雅实心，次操作发丝轮廓。
4. **灵感雷达卡片（Radar Cards）排印断裂与标签刺眼**：
   - *现状*：X/Twitter 标签纯黑白反差过大（`#ffffff` 背景或 `rgba(255,255,255,0.1)` 突兀）；热度指标与标题文字缺少优雅的 `line-clamp` 与行高配合，小屏幕极易折行错位。
   - *重塑建议*：X 标签改为精致的微灰发丝底（`rgba(255, 255, 255, 0.06)`）；热度数据使用等宽小胶囊；标题固定 1.4 行高与双行截断。

---

### 2.2 Web Playground (`src/site/playground-builder.ts`) 破绽清单

1. **顶部工具栏（Top Chrome）高度冗余与几何未对齐**：
   - *现状*：高度为 50px，侵占舞台垂直空间；按钮（30px）、选择框（30px）与徽章之间间距、圆角（6px vs 999px）杂乱，未对齐 8px 基础网格系统。
   - *重塑建议*：严格统一定高 **46px**；所有工具按钮高度规范为 **28px**，圆角统一为 **6px** 或 **8px**；Logo、面包屑与当前作品名微米级垂直居中。
2. **画布舞台区域（Live Stage Viewport）底色刺眼与光斑过重**：
   - *现状*：背景使用了 `#08090d` 配合多层 radial-gradient，网格点阵偏亮（`rgba(255, 255, 255, 0.06) 1px`），在暗室环境下闪烁且喧宾夺主。
   - *重塑建议*：采用专业光学暗房（Optical Darkroom）底色 `#090a0f`，点阵对比度降低至 `rgba(255, 255, 255, 0.028)`，间距调至 20px，将 100% 视觉焦点让渡给作品画布。
3. **36 套模板选择抽屉（Template Drawer）动效生硬与卡片粗糙**：
   - *现状*：抽屉滑出使用了普通 `cubic-bezier(0.16, 1, 0.3, 1)`，但阴影仅有左侧硬阴影，缺少全屏遮罩景深感；搜索框与 Category Pills 偏向普通管理后台风；色板小条（3 个点）浮层粗糙。
   - *重塑建议*：滑出采用 240ms 弹簧曲线；分类标签采用 Linear 风格磨砂药丸（激活态带微光晕）；色板条采用极度精致的磨砂小胶囊，微圆点带发丝光环。

---

### 2.3 Calm Studio 工作台 (`src/studio/calm-ui/styles.ts`, `markup.ts`) 破绽清单

1. **底部控制栏 Dock 控件过于拥挤，缺少物理微质感**：
   - *现状*：Dock 内挤入了上一页、下一页、增删复制、画幅、模板、缩放、AI 对话、全屏、命令面板等近 10 个按钮，横向溢出严重；按钮仅有普通 hover 背景，按压缺少反馈。
   - *重塑建议*：重整为 **5 大优雅控件群组**：
     - 群组 A：紧凑页码胶囊（`01 / 06` + 微型上下翻页）；
     - 群组 B：画幅比例小药丸（16:9 / 3:4 切换）；
     - 群组 C：模板/风格快速触发器；
     - 群组 D：自适应缩放与全屏演示；
     - 群组 E：AI 创作副驾驶胶囊（带柔和脉冲指示灯）。
     - 其余次要操作一律收纳进上下文或快捷键。
2. **浮动状态条（Stage Status Bar）缺少光学融合度**：
   - *现状*：胶囊高度 32px，阴影较弱，文字排版混排断行，绿点脉冲动画过于刺眼。
   - *重塑建议*：高度定为 30px，使用发丝内嵌高光；绿点采用物理呼吸动效（opacity: 0.6 -> 1.0）；状态信息（作品名、比例、隐私徽章）使用极细发丝分隔符（`rgba(255,255,255,0.08)`）。
3. **侧边栏大色块视觉污染与抽屉景深过浅**：
   - *现状*：侧边栏头部带有大面积高亮 Promotion 块（`HOT` / `RADAR`），破坏了 Atelier 的温润克制基调；抽屉面板阴影过浅，无法明确分离图层。
   - *重塑建议*：Promotion 块改为极简单色发丝边框微卡片；抽屉阴影升级为超宽景深 `0 24px 64px -12px rgba(0, 0, 0, 0.65)`。

---

## 三、 统一设计代币契约 2026 (Unified CSS Design Tokens 2026)

三大端必须严格统一使用以下 CSS 变量与设计代币：

```css
:root {
  /* ==========================================================================
     1. Brand & Core Accent Tokens (Creator Violet Hierarchy)
     ========================================================================== */
  --am-violet: #6951ff;
  --am-violet-hover: #553af5;
  --am-violet-active: #472be6;
  --am-violet-glow: rgba(105, 81, 255, 0.28);
  --am-violet-soft: rgba(105, 81, 255, 0.10);
  --am-violet-hairline: rgba(105, 81, 255, 0.35);

  --am-emerald: #10b981;
  --am-emerald-soft: rgba(16, 185, 129, 0.12);
  --am-amber: #f59e0b;
  --am-amber-soft: rgba(245, 158, 11, 0.12);
  --am-coral: #ff6b74;

  /* ==========================================================================
     2. Typography & Micro-Features (Geist & Apple Aligned)
     ========================================================================== */
  --font-sans: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text',
               'Inter', 'PingFang SC', 'Hiragino Sans', 'Pretendard', sans-serif;
  --font-mono: 'SF Mono', 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace;

  /* High-End OpenType Flags */
  --font-features-base: "cv02", "cv03", "cv04", "cv11", "ss01";
  --font-features-numbers: "tnum", "cv02", "cv03", "cv04", "cv11";

  --tracking-tighter: -0.035em;
  --tracking-tight: -0.02em;
  --tracking-normal: 0em;
  --tracking-wide: 0.04em;

  /* ==========================================================================
     3. Hairline Borders & Inset Lighting (Linear Micro-Refraction)
     ========================================================================== */
  --hairline-dark: 1px solid rgba(255, 255, 255, 0.08);
  --hairline-dark-strong: 1px solid rgba(255, 255, 255, 0.14);
  --hairline-dark-hover: 1px solid rgba(255, 255, 255, 0.22);
  --hairline-violet: 1px solid rgba(105, 81, 255, 0.45);

  --inset-highlight: inset 0 1px 0 rgba(255, 255, 255, 0.06);
  --inset-highlight-strong: inset 0 1px 0 rgba(255, 255, 255, 0.12);
  --inset-highlight-button: inset 0 1px 0 rgba(255, 255, 255, 0.20), inset 0 -1px 0 rgba(0, 0, 0, 0.20);

  /* ==========================================================================
     4. Physics Spring & Micro-Interactions (Raycast 240ms Damping)
     ========================================================================== */
  --ease-spring: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-spring-snappy: cubic-bezier(0.2, 0.9, 0.2, 1);
  --duration-fast: 140ms;
  --duration-normal: 240ms;
  --duration-smooth: 320ms;

  --press-scale: scale(0.975);

  /* ==========================================================================
     5. Deep Obsidian Grayscale (Dark Mode / Showcase / Optical Darkroom)
     ========================================================================== */
  --bg-obsidian-deep: #090a0f;       /* Stage & page canvas base */
  --bg-obsidian-surface: #11131a;    /* Topbar, sidebar, secondary cards */
  --bg-obsidian-elevated: #181b24;   /* Flyout drawers, modals, floating pills */
  --bg-obsidian-subtle: #1f232f;     /* Active pill, hover states */

  --ink-primary: #f4f5f8;
  --ink-secondary: #9da1b2;
  --ink-muted: #65697b;

  --shadow-obsidian-card: 0 16px 36px -8px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.06);
  --shadow-obsidian-hover: 0 24px 48px -10px rgba(0, 0, 0, 0.65), 0 0 0 1px rgba(105, 81, 255, 0.25) inset;
  --shadow-obsidian-dock: 0 16px 40px -6px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.1);
  --shadow-obsidian-drawer: -16px 0 48px -8px rgba(0, 0, 0, 0.65);
}

/* ==========================================================================
   6. Atelier Vellum Grayscale (Light Mode / Studio & Docs)
   ========================================================================== */
[data-theme="light"],
:root[data-surface="atelier"]:not([data-theme="dark"]) {
  --bg-obsidian-deep: #eceae4;       /* Warm architectural paper */
  --bg-obsidian-surface: #f5f4ef;    /* Vellum panel background */
  --bg-obsidian-elevated: #ffffff;   /* Pure white card surface */
  --bg-obsidian-subtle: #e3e1da;     /* Subtle divider / hover */

  --hairline-dark: 1px solid rgba(20, 20, 19, 0.08);
  --hairline-dark-strong: 1px solid rgba(20, 20, 19, 0.15);
  --hairline-dark-hover: 1px solid rgba(20, 20, 19, 0.26);

  --inset-highlight: inset 0 1px 0 rgba(255, 255, 255, 0.85);
  --inset-highlight-strong: inset 0 1px 0 #ffffff;

  --ink-primary: #141413;
  --ink-secondary: #57554f;
  --ink-muted: #8c887f;

  --shadow-obsidian-card: 0 8px 24px -4px rgba(20, 20, 19, 0.07), inset 0 1px 0 rgba(255, 255, 255, 0.9);
  --shadow-obsidian-hover: 0 16px 36px -6px rgba(20, 20, 19, 0.12), 0 0 0 1px rgba(85, 58, 245, 0.2) inset;
  --shadow-obsidian-dock: 0 12px 32px -4px rgba(20, 20, 19, 0.14), inset 0 1px 0 rgba(255, 255, 255, 0.9);
  --shadow-obsidian-drawer: -12px 0 40px -6px rgba(20, 20, 19, 0.15);
}
```

---

## 四、 官网模块重构指引 (`@site_designer`)

在独立工作树 `/private/tmp/aimake-worktrees/site-redesign` (分支 `feat/site-redesign-2026`) 中对 `src/site/site-builder.ts` 进行重构：

### 4.1 Hero 区域高雅重构

```css
/* 1. Hero 容器与背景 */
.hero {
  padding: 84px 0 72px;
  border-bottom: var(--hairline-dark);
  position: relative;
  background-color: var(--bg-obsidian-deep);
  background-image:
    radial-gradient(ellipse 70% 45% at 50% -8%, rgba(105, 81, 255, 0.14), transparent 70%),
    radial-gradient(circle 600px at 85% 15%, rgba(255, 203, 73, 0.035), transparent 60%);
}

/* 2. 状态胶囊 */
.hero-badge-pill {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 4px 12px;
  border-radius: 999px;
  background: var(--am-emerald-soft);
  border: 1px solid rgba(16, 185, 129, 0.28);
  color: var(--am-emerald);
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: var(--tracking-wide);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08);
}

/* 3. 标题与微排印 */
.hero h1 {
  font-family: var(--font-sans);
  font-feature-settings: var(--font-features-base);
  font-size: clamp(34px, 4.4vw, 56px);
  line-height: 1.12;
  margin: 0 0 18px;
  letter-spacing: var(--tracking-tighter);
  font-weight: 800;
  background: linear-gradient(180deg, #ffffff 30%, rgba(255, 255, 255, 0.7) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

/* 4. 按钮物理触感 */
.btn-primary {
  height: 42px;
  padding: 0 20px;
  border-radius: 9px;
  background: var(--am-violet);
  color: #ffffff;
  font-size: 13.5px;
  font-weight: 600;
  border: 1px solid rgba(255, 255, 255, 0.18);
  box-shadow: var(--inset-highlight-button), 0 4px 18px var(--am-violet-glow);
  transition: transform var(--duration-fast) var(--ease-spring),
              background var(--duration-fast) ease,
              box-shadow var(--duration-fast) ease;
}
.btn-primary:hover {
  background: var(--am-violet-hover);
  transform: translateY(-1px);
  box-shadow: var(--inset-highlight-button), 0 6px 24px rgba(105, 81, 255, 0.42);
}
.btn-primary:active {
  transform: var(--press-scale);
}
```

### 4.2 Bento 卡片与成品展廊重构

```css
/* Bento 2x2 对称卡片 */
.bento-card {
  background: var(--bg-obsidian-surface);
  backdrop-filter: blur(24px) saturate(160%);
  -webkit-backdrop-filter: blur(24px) saturate(160%);
  border: var(--hairline-dark);
  border-radius: 16px;
  padding: 26px;
  box-shadow: var(--shadow-obsidian-card);
  transition: transform var(--duration-normal) var(--ease-spring),
              border-color var(--duration-normal) ease,
              box-shadow var(--duration-normal) ease;
}
.bento-card:hover {
  transform: translateY(-2px);
  border-color: var(--hairline-dark-hover);
  box-shadow: var(--shadow-obsidian-hover);
}

/* 展廊作品卡片与比例磨砂胶囊 */
.work-card {
  background: var(--bg-obsidian-surface);
  border: var(--hairline-dark);
  border-radius: 16px;
  padding: 20px;
  box-shadow: var(--shadow-obsidian-card);
  transition: transform var(--duration-normal) var(--ease-spring),
              border-color var(--duration-normal) ease,
              box-shadow var(--duration-normal) ease;
}
.work-aspect-tag {
  font-family: var(--font-mono);
  font-feature-settings: var(--font-features-numbers);
  font-size: 10.5px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.06);
  border: var(--hairline-dark);
  color: var(--ink-secondary);
  backdrop-filter: blur(8px);
}
```

---

## 五、 Web Playground 重构指引 (`@playground_designer`)

在独立工作树 `/private/tmp/aimake-worktrees/playground-redesign` (分支 `feat/playground-redesign-2026`) 中对 `src/site/playground-builder.ts` 进行重构：

### 5.1 顶部 46px 紧凑操作条 (Top Chrome)

```css
header.pg-topbar {
  height: 46px;
  background: rgba(17, 19, 26, 0.92);
  backdrop-filter: blur(24px) saturate(180%);
  -webkit-backdrop-filter: blur(24px) saturate(180%);
  border-bottom: var(--hairline-dark);
  box-shadow: var(--inset-highlight);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 0 12px;
  z-index: 40;
}

/* 工具栏按钮统一尺寸与几何 */
.pg-btn {
  height: 28px;
  padding: 0 9px;
  font-size: 11.5px;
  font-weight: 500;
  border-radius: 6px;
  border: var(--hairline-dark);
  background: var(--bg-obsidian-elevated);
  color: var(--ink-primary);
  box-shadow: var(--inset-highlight);
  transition: transform var(--duration-fast) var(--ease-spring),
              background var(--duration-fast) ease,
              border-color var(--duration-fast) ease;
}
.pg-btn:hover {
  background: var(--bg-obsidian-subtle);
  border-color: var(--hairline-dark-hover);
}
.pg-btn:active {
  transform: var(--press-scale);
}
```

### 5.2 舞台与 36 套模板选择抽屉

```css
/* 光学暗房舞台背景 */
.stage-pane {
  background:
    radial-gradient(circle at 50% 40%, rgba(105, 81, 255, 0.04), transparent 60%),
    radial-gradient(rgba(255, 255, 255, 0.028) 1px, transparent 1px),
    var(--bg-obsidian-deep);
  background-size: 100% 100%, 20px 20px, auto;
}

/* 抽屉 240ms 弹簧阻尼 */
.template-drawer {
  position: fixed;
  top: 0;
  right: -540px;
  width: 520px;
  max-width: 94vw;
  height: 100%;
  background: var(--bg-obsidian-surface);
  border-left: var(--hairline-dark);
  box-shadow: var(--shadow-obsidian-drawer);
  z-index: 9001;
  display: flex;
  flex-direction: column;
  transition: right var(--duration-normal) var(--ease-spring);
}
.template-drawer.show {
  right: 0;
}

/* 抽屉内分类药丸与 3 色板条 */
.drawer-pill {
  height: 26px;
  padding: 0 11px;
  font-size: 11px;
  border-radius: 999px;
  border: var(--hairline-dark);
  background: var(--bg-obsidian-elevated);
  color: var(--ink-secondary);
  transition: all var(--duration-fast) var(--ease-spring);
}
.drawer-pill.active {
  background: var(--ink-primary);
  color: var(--bg-obsidian-deep);
  border-color: var(--ink-primary);
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(255, 255, 255, 0.15);
}

.drawer-palette-strip {
  position: absolute;
  bottom: 6px;
  right: 6px;
  display: inline-flex;
  align-items: center;
  gap: 3.5px;
  padding: 2px 5px;
  border-radius: 999px;
  background: rgba(9, 10, 15, 0.78);
  backdrop-filter: blur(8px);
  border: var(--hairline-dark);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
}
.palette-swatch-dot {
  width: 7.5px;
  height: 7.5px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.35);
}
```

---

## 六、 Calm Studio 工作台重构指引 (`@studio_designer`)

在独立工作树 `/private/tmp/aimake-worktrees/studio-redesign` (分支 `feat/studio-redesign-2026`) 中对 `src/studio/calm-ui/styles.ts` 与 `markup.ts` 进行重构：

### 6.1 底部 5 大核心控件 Dock 极致精雕

在 `markup.ts` 中精炼 Dock DOM 结构，剔除非高频冗余控件，保留 5 大核心群组：
1. **群组 1 (页码导航)**：上一页 + `01 / 06` 紧凑药丸 + 下一页；
2. **群组 2 (画幅选择)**：画幅比例小胶囊（16:9 / 9:16 / 3:4）；
3. **群组 3 (风格/模板)**：36 风格触发器；
4. **群组 4 (自适应/全屏)**：自适应缩放 + 全屏演示 (F)；
5. **群组 5 (AI 创作副驾驶)**：AI 对话胶囊（带微光晕指示灯）。

在 `styles.ts` 中升级 Dock 样式：
```css
.stage-dock {
  position: absolute;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
  height: 42px;
  padding: 0 8px;
  border-radius: 999px;
  background: var(--chrome-bg);
  backdrop-filter: blur(24px) saturate(180%);
  -webkit-backdrop-filter: blur(24px) saturate(180%);
  border: var(--hairline-dark);
  box-shadow: var(--shadow-obsidian-dock);
  display: inline-flex;
  align-items: center;
  gap: 4px;
  z-index: 30;
  transition: transform var(--duration-fast) var(--ease-spring),
              opacity var(--duration-fast) ease;
}

.dock-chip {
  height: 28px;
  padding: 0 10px;
  border-radius: 999px;
  border: 1px solid transparent;
  background: transparent;
  color: var(--ink);
  font-size: 11.5px;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-spring);
}
.dock-chip:hover {
  background: var(--surface-hover);
  border-color: var(--hairline-dark);
}
.dock-chip:active {
  transform: var(--press-scale);
}

.dock-icon-btn {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 1px solid transparent;
  background: transparent;
  color: var(--ink-secondary);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-spring);
}
.dock-icon-btn:hover {
  background: var(--surface-hover);
  color: var(--ink);
}
.dock-icon-btn:active {
  transform: var(--press-scale);
}
```

### 6.2 浮动状态条 (Stage Status Bar) 精致化

```css
.stage-status-bar {
  position: absolute;
  top: 14px;
  left: 20px;
  height: 30px;
  padding: 0 12px;
  border-radius: 999px;
  background: var(--chrome-bg);
  backdrop-filter: blur(24px) saturate(160%);
  -webkit-backdrop-filter: blur(24px) saturate(160%);
  border: var(--hairline-dark);
  box-shadow: var(--shadow-sm), var(--inset-highlight);
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  color: var(--ink-secondary);
  font-feature-settings: var(--font-features-numbers);
  z-index: 20;
}
.status-indicator-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--live);
  box-shadow: 0 0 6px var(--live);
  animation: am-breathe 2.4s ease-in-out infinite;
}
@keyframes am-breathe {
  0%, 100% { opacity: 0.6; transform: scale(0.95); }
  50% { opacity: 1; transform: scale(1.05); }
}
```

---

## 七、 质量验证与门禁检查 (Quality Gates & Verification)

每个执行 Designer 在完成独占文件的重构后，必须在各自独立工作树中执行以下门禁自测：

1. **静态类型与代码契约**：
   ```bash
   pnpm typecheck
   ```
   要求：严格 0 error。
2. **构建与渲染测试**：
   - `@site_designer` & `@playground_designer`：
     ```bash
     pnpm site:build
     ```
   - `@studio_designer`：
     ```bash
     pnpm desktop:build
     ```
3. **单元与集成测试全量验证**：
   ```bash
   pnpm test
   ```
   要求：全量测试文件 100% PASS。

自测全绿后提交分支代码，并在群板 @coordinator 汇报。
