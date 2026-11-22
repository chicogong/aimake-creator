# Aimake — ローカル完結・マルチモーダル制作スタジオ & CLI

[English](./README.md) · [简体中文](./README.zh-CN.md) · **日本語** · [한국어](./README.ko.md)

**36種類のデザインテンプレート・オフラインMermaid SVG図解・Highlight.js・7種類のプリセットAIスキルを内蔵。1つのMarkdownから、Xの「図解（Zukai）」・LinkedInカルーセルPDF・編集可能なPowerPoint (`.pptx`)・60fps動画 (`MP4`) をローカルで一括生成します。**

Webプレイグラウンド: **[https://aimake.cc/playground/](https://aimake.cc/playground/)**

```bash
# インタラクティブウィザードを起動（グローバルインストール後は `aimake` / `aimake-studio` 両対応）
npx aimake-studio

# ワークスペース初期化・Studio起動・Marp/Slidevインポート・出力
aimake workspace init ./my-space
aimake studio --demo
aimake import ./slides.md -o ./converted.deck.md
aimake render examples/ja-zukai-blueprint.deck.md -f png -o ./out/zukai
```

[MIT License](./LICENSE) © 2026 Aimake Labs / Chico Gong.
