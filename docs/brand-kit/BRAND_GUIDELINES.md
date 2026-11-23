# Aimake Studio · 品牌设计系统与资产规范 (Brand Guidelines)

> **设计基调**：主推方向 **02 创作画布 (Creator Canvas)**。  
> 融合 **Local-First**（本地优先与严苛隐私保护）与 **超级个体全媒体飞轮** 的创作理念。

---

## 1. 核心设计代币 (Design Tokens)

基于现代高对比度、呼吸感微光与触感深度的设计语言，适用于 Web 端、macOS 桌面客户端、CLI 终端及全媒体导出模版。

```css
:root {
  /* 主品牌与交互色 */
  --am-violet: #6951ff;          /* 旗舰主色、主要交互按钮、焦点态 */
  --am-violet-hover: #5236f3;    /* 悬停与激活态 */
  --am-yellow: #ffcb49;          /* 灵感迸发、积极反馈、关键指标高亮 */
  --am-coral: #ff6b74;           /* 创作重点标记、删除/告警、强调 */
  --am-lavender: #b7aaff;        /* 中性平衡色、柔光轮廓、副标题 */

  /* 表面与背景 */
  --am-ink: #17152d;             /* 深色主文本、深色背景基础 */
  --am-canvas: #f1eeff;          /* 创作画布浅色基底 */
  --am-page: #fcfaff;            /* 浅色页面底色 */
  --am-muted: #6a6483;           /* 辅助弱化文本、注脚说明 */

  /* 边框与阴影 */
  --am-border: rgba(80, 66, 125, 0.13);     /* 1px 精致微光边框 */
  --am-radius: 24px;                        /* 卡片大圆角 */
  --am-radius-sm: 12px;                     /* 按钮/标签圆角 */
  --am-shadow: 0 16px 60px rgba(50, 34, 125, 0.10);  /* 柔和扩散投影 */
  --am-shadow-glow: 0 0 30px rgba(105, 81, 255, 0.25); /* 霓虹极光微光 */
}
```

---

## 2. 品牌标识与 Logo 矩阵

所有矢量素材均收录于 [assets/brand/logos/](../../assets/brand/logos/)：

| 标识类型 | 文件路径 | 用途推荐 |
| :--- | :--- | :--- |
| **彩色图形标** | `symbol-color.svg` | 顶部导航栏、卡片左上角、个人头像 |
| **浅色图形标** | `symbol-white.svg` | 深色 Obsidian 页面、暗色终端、黑色背景 |
| **深色图形标** | `symbol-black.svg` | 白色印刷品、浅色报表导出 |
| **横版 Logo（轮廓转曲）** | `logo-horizontal-outlined-dark.svg` / `-light.svg` | 官方主页页眉、文档封面、免字体现成渲染 |
| **上下堆叠 Logo** | `logo-stacked-dark.svg` / `-light.svg` | 移动端开屏、方形展架、软件安装包说明 |
| **原生应用图标** | `app-icon-dark.svg` / `app-icon-light.svg` | macOS 原生 App、PWA 桌面图标、GitHub 项目头像 |

---

## 3. 前端与界面素材库

### 3.1 3D 视觉插画 (Hero)
- **文件**：`assets/brand/hero/hero-creator-3d-transparent.webp` 与 `.png`
- **定位**：官网首屏、桌面客户端欢迎屏。体现多模态创作（Markdown、幻灯片、音频波形、代码、视频交融）。

### 3.2 核心特性矢量插画 (Illustrations)
- `feature-one-source-many-formats.svg`：一稿编译 5 种媒介（PNG、PPTX、PDF、MP4、HTML）。
- `feature-visual-layout.svg`：36 套设计模板自由切换与画布可视化微调。
- `feature-ai-copilot.svg`：本地/API 大模型智能对话辅助与一键 Diff 回滚。

### 3.3 背景与极光氛围 (Backgrounds & Aura)
- `aurora-glow.svg`：首屏顶部柔和极光发散。
- `dot-grid.svg` / `soft-grid.svg`：精细的网格坐标纸质感，强化 Studio 的工具属性。
- `hero-wave.svg`：平滑声画波动底纹。

### 3.4 14 枚线性 UI 矢量图标 (UI Icons)
收录于 `assets/brand/ui-icons/`，统一采用 `currentColor` 属性，支持 CSS 实时换色：
`ai-spark.svg`, `code.svg`, `document.svg`, `download.svg`, `grid.svg`, `image.svg`, `local.svg`, `markdown.svg`, `privacy.svg`, `slides.svg`, `template.svg`, `terminal.svg`, `video.svg`, `web.svg`。

---

## 4. 社交媒体与对外分享 (Social & OpenGraph)

- **GitHub 仓库封面**：`assets/brand/social/github-social-1280x640.png` (1280×640)
- **OpenGraph & Twitter Card 封面**：`assets/brand/social/og-cover-1200x630.png` (1200×630)
- **Favicon 与 PWA 图标**：`assets/brand/icons/favicon.ico`, `apple-touch-icon.png`, `site.webmanifest`
