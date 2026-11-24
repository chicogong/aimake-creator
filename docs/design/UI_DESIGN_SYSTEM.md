# Aimake Studio · 统一 UI 与双端视觉设计系统 (`UI_DESIGN_SYSTEM.md`)

> **版本基线**：`v2.0` → `v2.3` 模块化统一规范  
> **适用范围**：官网与 Playground (`aimake.cc`) · Calm Studio 工作台 (`src/studio/calm-ui/`) · macOS/Tauri 原生壳体 (`desktop/`)  
> **关联文档**：[`BRAND_GUIDELINES.md`](../brand-kit/BRAND_GUIDELINES.md) · [`AIMAKE_2_0_CALM_WORKSPACE_DESIGN.md`](../AIMAKE_2_0_CALM_WORKSPACE_DESIGN.md) · [#20](https://github.com/chicogong/aimake-creator/issues/20)

---

## 一、 双面统一设计哲学（Dual-Surface Architecture）

Aimake 将界面划分为定位清晰的两大表现层，共享同一组**Creator Violet 品牌基因**与**几何图标语言**，同时依据使用场景精确调控视觉对比度：

| 维度 | Showcase 表现层 (`aimake.cc` 官网 & Playground) | Atelier 表现层 (Calm Studio 工作台 & 原生桌面端) |
| :--- | :--- | :--- |
| **核心场景** | 品牌首印象、36 套模板展廊、在线极速试用 | 长时间深度创作、画布微调、知识沉淀、导出交付 |
| **视觉基调** | **Deep Abyss** 深海暗色 + 极光微光 (`Aurora Mesh`)，强化科技冲击力与传播感 | **Atelier Vellum** 暖建筑纸灰（浅） / **Optical Darkroom** 光学暗房（深），最大化让位给用户作品画布（85%+ 视口占比） |
| **主交互强调色** | **Creator Violet (`#6951ff`)** 主按钮 + 悬停极光扩散阴影 | 中性墨黑/米白主按钮保持画面纯净；**Creator Violet (`#6951ff`)** 统一承载**品牌标、焦点环、AI 实时同步脉冲点、闭环步骤高亮与选中外框** |
| **外观跟随机制** | `localStorage` + 默认深色切换（消除首屏主题闪烁） | 默认跟随系统 `prefers-color-scheme` + macOS 标题栏融合，支持手动覆盖并桥接至原生壳体 (`aimakeNative`) |

---

## 二、 统一设计代币契约（Unified CSS Token Contract）

面向 `v2.3.0` Calm Studio 前端模块化迁移，以下代币将抽取为唯一权威样式源文件 `tokens.css`：

```css
:root {
  /* 1. Brand Identity (Shared Across Web, Studio, Desktop & Exports) */
  --am-violet: #6951ff;
  --am-violet-hover: #5236f3;
  --am-violet-soft: rgba(105, 81, 255, 0.12);
  --am-violet-glow: rgba(105, 81, 255, 0.28);
  --am-yellow: #ffcb49;
  --am-coral: #ff6b74;
  --am-lavender: #b7aaff;

  /* 2. Semantic Status Tokens */
  --am-live: #0f9d68;
  --am-live-soft: rgba(15, 157, 104, 0.13);
  --am-hot: #d94e28;
  --am-hot-soft: rgba(217, 78, 40, 0.10);

  /* 3. Typography & CJK Locale Safety */
  --font-sans: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', 'PingFang SC', 'Hiragino Sans', 'Pretendard', sans-serif;
  --font-mono: 'SF Mono', 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;

  /* 4. 4px Spatial Scale, Radius & Elevation */
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-pill: 999px;
  --motion-fast: 150ms cubic-bezier(0.22, 1, 0.36, 1);
  --motion-drawer: 240ms cubic-bezier(0.22, 1, 0.36, 1);
}

/* Atelier Light: Warm Architectural Mat (Studio Default Light) */
:root[data-surface="atelier"],
:root[data-surface="atelier"][data-theme="light"] {
  --stage-bg: #eceae4;
  --stage-dot: rgba(20, 20, 19, 0.055);
  --chrome-bg: rgba(248, 247, 243, 0.90);
  --sidebar-bg: #f5f4ef;
  --surface: #ffffff;
  --surface-elev: #ffffff;
  --surface-subtle: #eeede8;
  --border: rgba(20, 20, 19, 0.085);
  --border-strong: rgba(20, 20, 19, 0.145);
  --ink: #141413;
  --ink-secondary: #57554f;
  --ink-muted: #8c887f;
  --accent: #18181b;
  --accent-ink: #fafaf9;
  --focus-ring: 0 0 0 2px var(--am-violet-glow), 0 0 0 1px var(--am-violet);
}

/* Atelier Dark: Optical Darkroom */
@media (prefers-color-scheme: dark) {
  :root[data-surface="atelier"]:not([data-theme="light"]) {
    --stage-bg: #0c0c0e;
    --stage-dot: rgba(255, 255, 255, 0.036);
    --chrome-bg: rgba(18, 18, 21, 0.90);
    --sidebar-bg: #121215;
    --surface: #1a1a1f;
    --surface-elev: #222228;
    --surface-subtle: #151519;
    --border: rgba(255, 255, 255, 0.088);
    --border-strong: rgba(255, 255, 255, 0.16);
    --ink: #f5f4f0;
    --ink-secondary: #a3a098;
    --ink-muted: #6c6a63;
    --accent: #f5f4f0;
    --accent-ink: #111113;
    --am-live: #34d399;
    --am-hot: #f97316;
  }
}

/* Showcase Dark: Deep Abyss (aimake.cc & Playground Default) */
:root[data-surface="showcase"] {
  --bg: #07090e;
  --bg-alt: #0d111a;
  --surface: rgba(18, 24, 35, 0.75);
  --surface-elevated: rgba(26, 34, 49, 0.85);
  --ink: #f8fafc;
  --muted: #94a3b8;
  --accent: var(--am-violet);
}
```

### 四语种排版与无障碍硬规约
1. **语言级断行安全**：
   - `zh-CN`：遵循标点避头尾规则，正文字号 $\ge 13\text{px}$，行高 `1.55–1.65`。
   - `ja`：渲染模板强制启用 `line-break: strict` 与 JIS 禁则边界保护。
   - `ko`：渲染模板强制启用 `word-break: keep-all` 防止韩文单词半截断行。
   - `en`：数字指标与徽章开启 `font-variant-numeric: tabular-nums`。
2. **动态降级与无障碍**：
   - 支持 `@media (prefers-reduced-motion: reduce)` 自动关闭脉冲与抽屉平移动画；
   - 所有纯图标按钮必须声明 `aria-label` 与中文/本地化 `title`（含快捷键提示）。

---

## 三、 Calm Studio 空间布局与核心组件规范

```text
+----------------------------------------------------------------------------------+
| 46px Translucent Top Bar                                                         |
| [SidebarToggle] [Aimake Mark + Workspace Pill▾] | 素材·创作·●舞台·交付 | AI·雷达·风格·导出|
+----------------------------------------------------------------------------------+
| 252px Left Rail  |                                                               |
| (Collapsible)    |              85%+ Center Visual Stage                         |
| - 灵感雷达动态卡 |       +-----------------------------------------------+       |
| - 2026 时事热点  |       | Floating Glass Status Bar (Title·Aspect·Page) |       |
| - 作品集 (decks) |       +-----------------------------------------------+       |
| - 素材与知识     |       |                                               |       |
| - 已导出成品     |       |        Interactive Slide Canvas (.deck.md)    |       |
| - 7/7 预设Skill  |       |                                               |       |
|                  |       +-----------------------------------------------+       |
|                  |       |   Bottom Filmstrip Dock (Nav·Edit·Copy·Zoom)  |       |
+----------------------------------------------------------------------------------+
```

### 增量组件设计蓝图（对应 `v2.0.1` → `v2.3.0`）
1. **动态灵感雷达入口卡**（修复 #19）：消除硬编码周数，由 `/api/radar` 动态绑定最近抓取时间戳与真实条目数量（如 `灵感雷达 · 16 条实时热点`）。
2. **异步导出进度横幅与取消控件**（对应 #20，吸收 AutoClip 状态契约）：
   - 当执行 `mp4` 渲染、多页 `png` 截图或 `mlx-audio` 语音克隆时，导出抽屉展示统一进度条：`stage`（当前阶段文案）+ `progress`（`0–100%`）+ `eta`（预计剩余秒数）+ **`取消任务`** 按钮。
3. **CapCut 6 轨草稿导出卡**（对应 #10 & #18）：
   - 实时检测本机 `剪映专业版` / `CapCut Desktop` 草稿目录是否存在；提供「一键注入剪映本地草稿库」与「导出独立草稿文件夹」双按钮，展示场景数与精确总时长。
4. **幻灯片底栏拖拽排序与画布 Undo/Redo**（对应 #20）：
   - 胶片条缩略药丸支持指针拖拽换序并即时写回 `.deck.md`；内容区行内微调接入至少 20 步撤销历史栈。
5. **全界面四语种 i18n**（对应 #20）：
   - Calm Studio UI 抽取 `studioCopy[locale]` 字典，与官网 `zh / en / ja / ko` 保持一致体验。

---

## 四、 统一键盘快捷键矩阵（无原生冲突规范）

| 快捷键 | 作用域 | 绑定动作 | 说明（修正 #17 冲突） |
| :--- | :--- | :--- | :--- |
| `⌘ K` | 全局 Studio / Web | 打开线性命令面板（切换模板、改主题、导图、切源码） | AppKit 原生菜单让出 `⌘K` |
| `⇧ ⌘ K` | macOS 原生壳体 | 全局快速收入剪贴板至当前工作区 `sources/` | 原绑定 `⌘K` 调整为此组合 |
| `⌘ \` | 全局 Studio | 收起 / 展开左侧工作区导航栏 | 专注纯画布预览 |
| `⌘ J` | 全局 Studio | 展开 / 收起右侧 AI 对话创作副驾驶 | 支持多轮 Diff 审校 |
| `⌘ E` | 全局 Studio | 滑出 / 收起 `.deck.md` 源码分屏编辑器 | 即改即热重载 |
| `⌘ Z` / `⇧ ⌘ Z` | 画布编辑态 | 撤销 / 重做上一次文本微调或页面顺序变更 | `v2.3.0` 模块化接入 |
| `←` `→` / `F` | 舞台聚焦态 | 上一页 / 下一页 / 全屏演示模式 | 配合幻灯片快捷键 |
