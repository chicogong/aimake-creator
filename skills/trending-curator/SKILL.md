---
name: trending-curator
description: "Distills real trending discussions from X (Twitter), GitHub Trending, and arXiv into high-signal, anti-slop executive briefs, storyboards, and multi-format slide decks."
version: 1.0.0
author: Aimake Studio
tags:
  - x-curation
  - tech-news
  - anti-slop
  - content-strategy
  - deck-synthesis
---

# Trending Tech Curator & Storyboard Synthesizer

> A battle-tested design & editorial skill for extracting primary-source engineering breakthroughs on X (Twitter), GitHub, and arXiv, stripping away marketing hype, and formatting them into commercial-grade slide decks and executive briefs.

---

## 1. Core Mental Model: Signal vs. Slop

Modern social feeds (especially tech X and LinkedIn) are overwhelmed with synthetic AI fluff and engagement farming. High-taste curators operate under strict signal criteria:

### The Signal Filter (Include)
- **Primary Source Authorship**: Authored by the creator, maintainer, or core engineer (e.g. `@karpathy`, `@AnthropicAI`, `@deepseek_ai`, `@geoffreylitt`, `@simonw`).
- **Verifiable Hard Metrics**: Latency numbers (`112 tok/s`), model parameter counts (`671B MoE / 37B active`), reproducible training budgets (`$6M`), or concrete benchmarks (SWE-bench, OSWorld).
- **Paradigm Shifts**: Fundamental shifts in developer ergonomics or cognitive workflows (e.g. *Vibe Coding*, *LLM Wiki vs RAG*, *Local-First SQLite*, *Model Context Protocol*).
- **Actionable Takeaways**: Architectural lessons that an engineer or creator can implement today in their own workspace.

### The Anti-Slop Dictionary (Strictly Reject)
- Reject generic clickbait titles: *"10 AI Tools That Will Blow Your Mind"*, *"AI 颠覆一切"*, *"一键暴富的神器"*.
- Replace buzzwords with engineering reality:
  - Instead of *"颠覆传统软件"* ➔ Specify *"交付周期从数周缩短至 20 分钟个人软件"*.
  - Instead of *"终极第二大脑"* ➔ Specify *"恒定上下文约束 (index.md <= 3,000t) 的纯本地 Markdown 知识库"*.
  - Instead of *"算力霸权瓦解"* ➔ Specify *"无冷启动 SFT 纯强化学习，消费级 Apple Silicon 离线量化推理"*.

---

## 2. The 4-Stage Curation Pipeline

```
[Raw X Tweet / arXiv / GitHub]
            │
            ▼ Stage 1: Fact Ingestion & Attribution
   (Verify handle, view counts, paper ID, commit diff)
            │
            ▼ Stage 2: Signal Distillation & Anti-Slop Cleanse
   (Extract 3 core metrics, 1 counter-intuitive insight, 1 architectural quote)
            │
            ▼ Stage 3: Parametric Template Pairing
   (Map content density to Bento, Swiss, Linear, or Editorial)
            │
            ▼ Stage 4: Multi-Deliverable Compilation
   (Generate .deck.md for PPTX, Retina PNG, WeChat Inline, and 60fps MP4)
```

---

## 3. Parametric Design Pairing Rules

When mapping a trending topic to an Aimake design system, apply these typography and layout rules:

| Content Characteristic | Recommended Template | Aspect Ratio | Visual Persona | Key Artifact |
| :--- | :--- | :--- | :--- | :--- |
| **Product Launch & Viral Trend** | `apple-bento-launch` | 16:9 | Apple Cupertino Keynote, frosted glass, 3-metric bento | Commercial PPTX |
| **High-Density Technical Review** | `xhs-swiss-grid` | 3:4 | Josef Müller-Brockmann, strict grid, crimson accents | 3x Retina PNG |
| **CLI, Agent Runtime & Code** | `ppt-linear-dark` | 16:9 | Linear obsidian, monospace syntax, vector cards | Editable Keynote |
| **Deep Cultural / Systems Essay** | `en-substack-digest` | 4:5 | New Yorker editorial, serif drop cap, elegant pullquote | Vector PDF |
| **Punchy Spoken-Word Breakdown** | `video-cinema-talk` | 9:16 | 60fps motion, -14 LUFS audio sync, CapCut timeline | 60fps MP4 |
| **Protocol & Systems Architecture** | `x-zukai-quad` | 1:1 | Japanese 図解 4-quadrant structured clarity | Vector SVG / PNG |

---

## 4. Deck Markdown Syntax Standard

Every curated deck MUST adhere to the Aimake AST specification:

```markdown
---
title: "Andrej Karpathy: 'Vibe Coding' 与个人软件的全面觉醒"
template: apple-bento-launch
locale: zh-CN
aspect: 16:9
author: Andrej Karpathy (@karpathy)
handle: "@karpathy"
---

<!-- scene: hook | layout: metrics | eyebrow: 编程范式大迁徙 | cite: @karpathy on X (Feb 2025) -->

# Andrej Karpathy: 'Vibe Coding' 与个人软件的全面觉醒

## 敲击代码行数归零，跟随机感对话：编程终结，抑或每个人都成为数字造物主？

\`\`\`metric
- 手工编写语法: 0% (完全依赖 LLM 即时生成)
- 个人软件交付速度: 20 分钟 (从灵感闪现到浏览器可用)
- 软件受众规模: 仅限 1 人 (Personal Software 爆发)
- X 社区共鸣度: 4.8M+ 浏览 · 4.2万点赞
\`\`\`

---

<!-- scene: compare | layout: comparison | eyebrow: 范式对比 -->

# 传统重型协作 vs Vibe Coding 个人软件

\`\`\`compare
传统重型开发 :: 论证商业 ROI 与规模化需求 | 数周搭建 CI/CD 与脚手架 | 70% 精力消耗在语法与环境
个人软件觉醒 :: 仅为满足当下 1 个微小需求 | 单份 Markdown 即刻拉起应用 | 100% 精力聚焦在审美与直觉
\`\`\`
```

---

## 5. Verification Checklist

Before publishing any curated piece:
1. **Attribution**: Are author handle, original platform, and publication context cited accurately?
2. **Zero-Slop**: Is every claim supported by numbers or concrete user experience?
3. **Typography**: Are line breaks intentional? (No orphan single words on new lines).
4. **Local-First**: Is all data stored as plain text `.deck.md` with zero cloud lock-in?
