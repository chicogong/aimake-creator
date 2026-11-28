# Aimake Studio 产品介绍视觉标准

2026-11-28，chico 定稿本目录三张图，作为 Aimake Studio（爱创工坊）介绍与推广的视觉标准。对外介绍产品时沿用这组构图、色板与文案。

本目录收录已导出 PNG 与可复现的 HTML/CSS 源文件。官方 OpenGraph / GitHub 社交图仍在 [`assets/brand/social/`](../../../assets/brand/social/)，本组图不替代那两张。

## 成图

| 文件 | 尺寸 | 用途 |
| :--- | :--- | :--- |
| [cover-16x9.png](./cover-16x9.png) | 3840×2160 | 16:9 封面 |
| [flow-diagram.png](./flow-diagram.png) | 3840×2160 | 一份 Markdown 原稿 → 五种导出 |
| [share-star-cocreate.png](./share-star-cocreate.png) | 2160×2160 | Star / 共创分享卡 |

## 视觉规则

- **画布**：官方浅紫画布 `#F1EEFF`、页面底 `#FCFAFF`；品牌紫 `#6951FF`；墨色 `#17152D`。
- **标识**：只用官方四色几何 A 标 [`assets/brand/logos/symbol-color.svg`](../../../assets/brand/logos/symbol-color.svg)（`#6951FF` / `#FFCB49` / `#B7AAFF` / `#FF6B74`）。锁头文案用 Inter / Noto Sans CJK SC 排出「Aimake Studio 爱创工坊」。
- **字体**：拉丁用 Inter，中文用 Noto Sans CJK SC。标题字重 700、大标题字距约 `-0.055em`，与 [`assets/brand/tokens/components.css`](../../../assets/brand/tokens/components.css) 一致。汉字与标志一律真实排版，图像模型不手写中文、不自造 Logo。
- **流程图出口**：抽象色块图标（山形 / 文稿线 / 叠卡片 / 文档 / 播放三角）。图卡 `#FFCB49`、公众号 `#B7AAFF`、PPTX `#6951FF`、PDF `#FF6B74`、视频 `#26C7E8`。不使用微信、Office、Adobe 商标，不绘制假产品界面。

## 封面文案

封面主标题固定为 **「从写稿到出片」**，副标题为「一份原稿，在本地导出图卡、PPTX、PDF 和视频」。

官方 OG 口号「一次创作，多种表达」只用于 [`assets/brand/social/`](../../../assets/brand/social/) 的仓库封面与 OpenGraph 图，本组介绍图沿用「从写稿到出片」。

## 从源文件重建

提交的 PNG 即为定稿。若需按同一套 HTML 再导出：

1. 图形标走仓库官方文件 [`assets/brand/logos/symbol-color.svg`](../../../assets/brand/logos/symbol-color.svg)，不要在本目录再复制一份 Logo。分享卡上的 GitHub 标使用本目录 [`github-mark.svg`](./github-mark.svg)（Primer octicons `mark-github-24`）。
2. 安装 Inter Variable 与 Noto Sans CJK SC Regular / Bold。`shared.css` 会优先 `local()` 系统字体；若需强制指定文件，将字体链到本目录 `fonts/`（`Inter-Variable.ttf`、`NotoSansCJK-Regular.ttc`、`NotoSansCJK-Bold.ttc`），**不要提交字体二进制**。
3. 使用本机 Chrome 与 `puppeteer-core` 运行导出脚本（`deviceScaleFactor: 2`）。不要在本目录生成 `node_modules/` 或 `package-lock`：

```bash
cd docs/promotions/aimake-studio-intro
# 如 Chrome 不在默认路径，先 export CHROME_PATH=/path/to/chrome
npx --yes -p puppeteer-core node export.mjs
```

源文件：`cover.html`、`flow.html`、`share.html`、`shared.css`、`export.mjs`。导出记录见 [`manifest.txt`](./manifest.txt)。
