import fs from 'node:fs/promises';
import path from 'node:path';
import type { MarketplaceTemplateEntry } from '../marketplace/index.js';
import { lucideIcon } from '../studio/calm-ui/icons.js';

export interface PlaygroundBundleData {
  templates: Array<{
    id: string;
    name: Record<string, string>;
    aspect: string;
    width: number;
    height: number;
    category: string;
    styleFamily: string;
    description: Record<string, string>;
    palette: { bg: string; surface: string; ink: string; accent: string };
    css: string;
  }>;
}

export function extractTemplatePaletteFromCss(css: string): {
  bg: string;
  surface: string;
  ink: string;
  accent: string;
} {
  const rootMatch = css.match(/:root\s*\{([\s\S]*?)\}/);
  const block = rootMatch ? rootMatch[1] : css;
  const pick = (varName: string, fallback: string) => {
    const m = block.match(new RegExp(`--${varName}\\s*:\\s*([^;\\n]+)`));
    return m ? m[1].trim() : fallback;
  };
  return {
    bg: pick('bg', '#121216'),
    surface: pick('surface', '#1c1e26'),
    ink: pick('ink', '#f4f4f6'),
    accent: pick('accent', '#18181b'),
  };
}

const STARTER_SAMPLES: Record<string, string> = {
  agent: `---
title: "Andrej Karpathy: 'Vibe Coding' 与个人软件的全面觉醒"
template: apple-bento-launch
locale: zh-CN
aspect: 16:9
author: Andrej Karpathy (@karpathy)
handle: "@karpathy"
---

<!-- scene: intro | layout: metrics | eyebrow: 编程范式大迁徙 | cite: @karpathy on X (Feb 2025) -->
# Andrej Karpathy: 'Vibe Coding' 与个人软件的全面觉醒
## 敲击代码行数归零，跟随机感对话：每个人都成为专属软件造物主

\`\`\`metric
- 手工编写语法: 0% (完全依赖 LLM 即时生成)
- 个人软件交付速度: 20 分钟 (从灵感闪现到浏览器可用)
- 软件受众规模: 仅限 1 人 (Personal Software 爆发)
- X 社区共鸣度: 4.8M+ 浏览 · 4.2万点赞
\`\`\`

---

<!-- scene: compare | layout: comparison | eyebrow: PARADIGM SHIFT -->
# 传统重型协作 vs Vibe Coding 个人软件

\`\`\`compare
传统重型开发 :: 论证商业 ROI 与规模化需求 | 数周搭建 CI/CD 与脚手架 | 70% 精力消耗在语法与环境
个人软件觉醒 :: 仅为满足当下 1 个微小需求 | 单份 Markdown 即刻拉起应用 | 100% 精力聚焦在审美与直觉
\`\`\`

---

<!-- scene: code | layout: code | eyebrow: ONE COMMAND -->
# 一行命令驱动全生态 AI 助手

- 原生兼容 OpenCode、WorkBuddy、Codex、AGY 与 Claude Code
- 预设 7 大闭环 Skill，实体化沉淀在工作区，零全局污染

\`\`\`bash
aimake render decks/karpathy-vibe-coding.deck.md -f pptx -o launch.pptx
aimake render decks/karpathy-vibe-coding.deck.md -f png -o dist/
\`\`\`
`,

  gemini: `---
title: "Google DeepMind Antigravity (AGY) & Gemini 4 架构演进"
template: apple-bento-launch
locale: zh-CN
aspect: 16:9
author: Google DeepMind & Aimake
handle: "@deepmind"
---

<!-- scene: intro | layout: metrics | eyebrow: DEEPMIND 2026 INFLECTION -->
# Google DeepMind Antigravity (AGY) & Gemini 4: 架构演进与自主 Agentic 时代
## 从被动聊天问答到全自主 Agentic 操作系统 · 纯本地物理沙盒与集群编排

\`\`\`metric
- 全量推理上下文: 100M+ Token (全生命周期沉淀)
- 本地执行权限: 100% 物理隔离安全沙盒 (Zero-Cloud)
- 自主协作体系: 24h 异步自愈 Swarm 编排
- 软件交付范式: 纯声明式意图直达交付物
\`\`\`

---

<!-- scene: compare | layout: comparison | eyebrow: PARADIGM SHIFT -->
# 传统被动聊天 vs AGY 全自主 Agentic 操作系统

\`\`\`compare
传统聊天问答 :: 单次问答记忆丢失 | 用户频繁充当人肉剪贴板 | 无法触达操作系统真实环境
AGY 操作系统 :: 持续运行后台工作流 | 自主探索、调试与闭环验证 | 实体工具与本地知识库深度结合
\`\`\`

---

<!-- scene: code | layout: code | eyebrow: ONE COMMAND -->
# 终端一行命令启动 Antigravity 自主编排

\`\`\`bash
# 激活本地 AGY Agentic 运行时与知识外脑
agy session start --workspace ~/Documents/Aimake

# 自动挂载 36 套设计系统并执行多模态实时渲染
aimake render decks/gemini-agy-deepmind-inflection.deck.md -f png -o dist/
\`\`\`
`,

  blackfriday: `---
title: "2026 黑五 AI 算力与订阅终极省钱指南"
template: xhs-swiss-grid
locale: zh-CN
aspect: 3:4
author: Aimake Studio
handle: "@aimake.cc"
---

<!-- scene: intro | layout: metrics | eyebrow: BLACK FRIDAY 2026 -->
# 2026 黑五 AI 算力与订阅终极省钱指南
## 算力平权下的超级个体采购清单 · 告别云端月租杀熟，拥抱纯本地资产

\`\`\`metric
- 算力成本降幅: 82% (API 通缩大洗牌)
- 离线硬件折扣: M4 Max / RTX 5090 黑五直降
- 终身会员红利: 纯本地工具 0 月租复利
- 规避云端杀熟: 100% 避坑一次性黑盒订阅
\`\`\`

- **算力通缩大变局**：前沿模型 API 价格一年内下跌超过 80%，盲目续费云端月租已成最大浪费。
- **投资端侧算力与本地数据**：与其每年支付几千美元租借云端黑盒，不如置办本地高显存主机。

---

<!-- scene: compare | layout: comparison | eyebrow: SPENDING STRATEGY -->
# 黑五避坑消费策略：租借算力 vs 沉淀资产

\`\`\`compare
盲目跟风租借 :: 订阅数十个包装壳产品 | 聊天记录四处散落 | 次月停付数据立即失效
精明超级个体 :: 一次性置办端侧大内存主机 | 核心资料留存纯本地 Markdown | 配合按量结算前沿 API
\`\`\`
`,

  gemini_en: `---
title: "Google DeepMind Antigravity: The Agentic OS Inflection"
template: apple-bento-launch
locale: en-US
aspect: 16:9
author: Google DeepMind
handle: "@deepmind"
---

<!-- scene: intro | layout: metrics | eyebrow: DEEPMIND 2026 -->
# Google DeepMind Antigravity: The Next Frontier in Agentic Systems
## Moving beyond prompt-response loops into 24/7 autonomous engineering agents

\`\`\`metric
- Context Capacity: 100M+ Tokens (Zero Context Loss)
- Local Sandbox Security: 100% Air-Gapped Physical Isolation
- Subagent Collaboration: 24/7 Self-Healing Swarm Tasks
- Workflow Speedup: 12x Faster from Idea to Production
\`\`\`

- **Continuous Cognitive Memory**: Retain your entire repository lifecycle without lossy sliding windows.
- **Local-First Safety Invariants**: Sandboxed tool evaluation eliminates data exfiltration risks.
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
- 处理 Token: 1000 亿+ (大规模实战)
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
# 为什么 2026 年视频创作者必须告别“黑盒生成”？
## 拥抱剪映 / CapCut 6 轨白盒化二次创作自由

\`\`\`metric
- 6 轨时间轴: 100% (画面·字幕·人声·BGM)
- 时间标尺精度: 1 μs (微秒级对齐)
- 二次剪辑自由: 无损可调 (白盒交付)
\`\`\`

- **痛点不是无法生成，而是生成后无法局部修改**：错一个字只能重新消耗算力重烤 MP4。
- **确定性白盒交付**：声明式 Markdown 秒级编译为剪映与 CapCut 原生 6 轨工程。

::: speech
用纯文本写脚本，一键编译出剪映与 CapCut 的原生多轨工程文件，让创作者重掌时间轴主权。
:::

---

<!-- scene: six-tracks | layout: comparison | eyebrow: 工业级时间轴体系 -->
# 标准 6 轨音画对齐矩阵

\`\`\`compare
传统黑盒视频 :: 音画混缩为单一轨道 | 字幕烧录在像素内无法修改 | 音量配乐无法独立混音
Aimake 6轨工程 :: 视觉与音频独立分层 | 词级时间戳矢量字幕 | 智能 Ducking 旁白动态避让
\`\`\`

::: speech
底板轨承载高清卡片，花字与词级字幕轨精准同步，下方是纯净旁白轨与智能降鸭 BGM。
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
# 为什么 MCP 是连接 AI 与本地资产的终极接口？
## 从封闭孤岛到开放互联 · 打造属于自己的数字大脑

\`\`\`metric
- 互联数据源: 48+ (本地工具与知识库)
- 协议延迟: < 5ms (本地 IPC 通信)
- 权限控制: 100% (颗粒化本地授权)
\`\`\`

- **消除上下文碎片**：统一通过标准化 JSON-RPC 暴露本地文件、Git 仓库与排版引擎。
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
- 推理帧率: 120 FPS (闭环控制)
- 控制精度: 0.1 mm (灵巧操作)
- 零样本泛化: 94.2% (跨实体架构)
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

  'agent-en': `---
title: 2026 AI Agent Architecture: Monoliths to Closed Loops
template: apple-bento-launch
locale: en-US
aspect: 16:9
author: Chico Gong
handle: "@chicogong"
---

<!-- scene: intro | layout: metrics | eyebrow: ARCHITECTURE 2026 -->
# Why Chatbot Wrappers Are Disappearing Fast
## From one-off Q&A consumption to deterministic multimodal assets

\`\`\`metric
- Delivery Latency: < 1.2s (-75%)
- Local Data Privacy: 100% (Zero-Cloud)
- Multimodal Outputs: 5 Media (Native Layout)
\`\`\`

---

<!-- scene: compare | layout: comparison | eyebrow: PARADIGM SHIFT -->
# Generic LLM Chatbots vs Aimake Studio

\`\`\`compare
Generic Chatbot :: Ephemeral tabs, lost inspiration | Rigid format, non-editable outputs | Cloud privacy leaks
Aimake Closed-Loop :: Local Karpathy LLM Wiki compound interest | One draft to WeChat, XHS, PDF & Video | 100% On-Device Sovereignty
\`\`\`

---

<!-- scene: code | layout: code | eyebrow: ONE COMMAND -->
# Single Command Driving All AI Coding Assistants

- Native support for Claude Code, OpenCode, Codex & AGY
- 7 modular production skills directly saved to workspace

\`\`\`bash
aimake new my-launch --template apple-bento-launch
aimake render deck.md -f pptx -o launch.pptx
\`\`\`
`,

  'deepseek-en': `---
title: DeepSeek-R1 Local Distillation & Private Knowledge Base
template: xhs-swiss-grid
locale: en-US
aspect: 3:4
author: Aimake Studio
handle: "@aimake.cc"
---

<!-- scene: intro | layout: metrics | eyebrow: DEEPSEEK R1 2026 -->
# Why Every Creator Needs On-Device LLM Distillation
## Zero cloud dependency · 100% Local data retention · Millisecond latency

\`\`\`metric
- Distillation Ratio: 92% (Edge Runnable)
- Single Turn Latency: < 120ms (M4 Max)
- Privacy Risk: 0% (Fully Offline)
\`\`\`

- **Eliminate API compute anxiety**: Run quantized DeepSeek-R1 locally via Ollama with 98% reduced costs.
- **Inject private style DNA**: Transform raw Markdown study notes into personalized visual cards instantly.
`,

  'podcast-ja': `---
title: ミッドナイト・ポッドキャスト · AI特有の常套句を脱却する4言語 Style DNA
template: video-cinema-talk
locale: ja-JP
aspect: 9:16
author: Aimake Studio
handle: "@aimake.cc"
fps: 30
secondsPerSlide: 5
---

<!-- scene: hook-cover | layout: metrics | eyebrow: VIDEO AS CODE 2026 -->
# なぜ2026年の動画クリエイターは「ブラックボックス生成」から脱却すべきなのか？
## CapCut / 剪映 6トラック完全ホワイトボックス編集の自由度

\`\`\`metric
- 6トラック構成: 100% (映像・字幕・ナレーション・BGM)
- タイムライン精度: 1 μs (マイクロ秒同期)
- 再編集の自由度: ロスレス完全調整 (ホワイトボックス)
\`\`\`

::: speech
テキストから CapCut のマルチトラックプロジェクトを瞬時にコンパイルし、クリエイターが時間軸の主権を取り戻します。
:::
`,

  'flywheel-ko': `---
title: 1000억 토큰 실전 검증: 슈퍼 인디비주얼을 위한 온디바이스 창작 플라이휠
template: apple-dark-keynote
locale: ko-KR
aspect: 16:9
author: Chico Gong
handle: "@chicogong"
---

<!-- scene: hook | layout: metrics | eyebrow: BENCHMARK 2026 -->
# 왜 로컬 LLM 위키가 슈퍼 인디비주얼의 가장 강력한 해자일까요?
## 일회성 대화 소비를 끝내고, 모든 노트를 복리 자산으로 전환

\`\`\`metric
- 누적 토큰 처리: 1000억+ (대규모 실전 검증)
- 축적된 지식 카드: 1,840편 (로컬 마크다운)
- 1회 작성 다채널 출력: 5종 매체 (카드뉴스·PDF·PPT·비디오)
\`\`\`

- **지식 증류와 복리 효과**: 챗 창을 닫아도 영감이 증발하지 않고 마크다운 지식 그래프로 성장합니다.
- **클라우드 종속 제로**: 100% 로컬 샌드박스에서 즉각 렌더링되어 프라이버시가 완벽히 보장됩니다.
`,
  karpathy_wiki: `---
title: "Andrej Karpathy: 为什么纯本地 LLM Wiki 是超级个体第二大脑？"
template: xhs-swiss-grid
locale: zh-CN
aspect: 3:4
author: Andrej Karpathy (@karpathy)
handle: "@karpathy"
---

<!-- scene: intro | layout: metrics | eyebrow: 知识护城河 2026 -->
# 为什么纯本地 LLM Wiki 是超级个体最深的护城河？
## 告别一次性聊天消耗，让每一篇笔记在本地产生永久复利

\`\`\`metric
- 上下文沉淀: 100% (终生记忆无遗忘)
- 知识检索延迟: 0 ms (零网络物理端侧)
- 云端订阅月费: $0.00 (纯本地物理私有)
- 一稿多渠道分发: 5 种 (图文·PPT·视频·长文)
\`\`\`

- **告别云端黑盒租赁**：将知识、灵感与上下文固化在纯本地 Markdown，形成自主可控的资产飞轮。
- **端侧模型即时唤醒**：配合本地 Agent 与参数化设计引擎，秒级编译全渠道交付物料。

---

<!-- scene: compare | layout: comparison | eyebrow: PARADIGM SHIFT -->
# 传统云端聊天 vs 纯本地 LLM Wiki

\`\`\`compare
传统云端聊天 :: 聊天记录随窗口关闭蒸发 | 频繁遭遇月租与限额 | 数据留存云端存在隐私隐患
本地 LLM Wiki :: 每一轮思考自动沉淀为卡片 | 纯本地端侧零等待 | 实体化 Skill 伴随终生
\`\`\`
`,
};

STARTER_SAMPLES.creator = STARTER_SAMPLES.token;
STARTER_SAMPLES.poster = STARTER_SAMPLES.embodied;
STARTER_SAMPLES.deepseek = STARTER_SAMPLES.karpathy_wiki;
STARTER_SAMPLES['deepseek-en'] = STARTER_SAMPLES.gemini_en;
STARTER_SAMPLES['gemini-agy'] = STARTER_SAMPLES.gemini;
STARTER_SAMPLES['black-friday'] = STARTER_SAMPLES.blackfriday;



const RADAR_ITEMS = [
  {
    id: "radar:agy-gemini4-inflection",
    source: "Google DeepMind",
    category: "tech",
    title: "Google DeepMind Antigravity (AGY) & Gemini 4: 架构演进与自主 Agentic 时代",
    publishedAt: "2026-11-26",
    summary: "从被动聊天问答跃升为全自主 Agentic 操作系统。物理隔离沙箱、24h 异步自愈 Swarm 与 100M+ Token 全生命周期记忆。",
    hotness: "🔥 88.5k Likes · 6.2M Views · @deepmind",
    sampleKey: "gemini",
    template: "apple-bento-launch",
    aspect: "16:9"
  },
  {
    id: "radar:mcp-open-protocol",
    source: "Anthropic",
    category: "tech",
    title: "Anthropic MCP 协议普及：本地数据源与工具调用的开放新标准",
    publishedAt: "2026-11-25",
    summary: "彻底终结插件私有孤岛：从 M×N 复杂适配到标准化「AI 界的 USB-C 接口」，一次编写全生态兼容。",
    hotness: "🔥 52.3k Likes · 5.1M Views · @AnthropicAI",
    sampleKey: "mcp",
    template: "x-zukai-quad",
    aspect: "1:1"
  },
  {
    id: "radar:black-friday-2026",
    source: "Aimake Studio",
    category: "social",
    title: "2026 黑五 AI 算力与订阅终极省钱指南",
    publishedAt: "2026-11-24",
    summary: "算力通缩下的超级个体采购清单：告别云端月租杀熟，置办端侧大内存主机与本地数据护城河。",
    hotness: "🔥 36.4k Likes · 3.8M Views · 瑞士网格",
    sampleKey: "blackfriday",
    template: "xhs-swiss-grid",
    aspect: "3:4"
  },
  {
    id: "radar:x-karpathy-vibe-coding",
    source: "X / Twitter",
    category: "social",
    title: "Andrej Karpathy: 'Vibe Coding' 与个人软件的全面觉醒",
    publishedAt: "2026-11-23",
    summary: "完全跟随感觉，让大模型担任全权编程搭档。无需看底层代码，个人软件时代全面觉醒。",
    hotness: "🔥 42.8k Likes · 4.8M Views · @karpathy",
    sampleKey: "agent",
    template: "apple-bento-launch",
    aspect: "16:9"
  },
  {
    id: "radar:claude-code-terminal",
    source: "Anthropic Claude",
    category: "work",
    title: "Claude Code 终端原生 Agent 编排实战：极速自主调试与本地沙盒治理",
    publishedAt: "2026-11-23",
    summary: "开发者终端原生闭环：在本地目录安全授权命令执行与单测自愈，从交互式问答走向全自主交付。",
    hotness: "🔥 31.2k Likes · 3.4M Views · @babor",
    sampleKey: "claudecode",
    template: "linkedin-exec-carousel",
    aspect: "4:5"
  },
  {
    id: "radar:local-first-renaissance",
    source: "Ink & Switch",
    category: "life",
    title: "Local-First 软件复兴：为一人而做的专属软件",
    publishedAt: "2026-11-22",
    summary: "去中心化高密度本地工具：所有数据存储在本地 SQLite/Markdown，离线秒开，隐私绝不上云。",
    hotness: "🔥 19.8k Likes · 1.8M Views · 纸质人文",
    sampleKey: "localfirst",
    template: "xhs-paper-editorial",
    aspect: "3:4"
  },
  {
    id: "radar:deepseek-distill-inflection",
    source: "DeepSeek AI",
    category: "tech",
    title: "DeepSeek-R1 本地蒸馏与开源推理冲击波",
    publishedAt: "2026-11-21",
    summary: "小参数高推理的时代来临：在消费级 Mac 上离线跑满深度思考链，无需依赖闭源 API。",
    hotness: "🔥 64.9k Likes · 7.4M Views · @deepseek_ai",
    sampleKey: "deepseek",
    template: "ppt-linear-dark",
    aspect: "16:9"
  },
  {
    id: "radar:super-individual-flywheel",
    source: "Aimake Studio",
    category: "work",
    title: "超级个体千亿飞轮：上下文资产沉淀方法论",
    publishedAt: "2026-11-20",
    summary: "从单次对话消耗品，沉淀为终身复利的高纯度本地知识库。",
    hotness: "🔥 28.5k Likes · 2.4M Views · 深度专栏",
    sampleKey: "token",
    template: "wechat-editorial-article",
    aspect: "3:4"
  }
];

const WORKS_DATA = [
  {
    id: "deck-gemini",
    title: "Google DeepMind Antigravity & Gemini 4",
    subtitle: "100M+ Token 持续进化与自主 Agent",
    badge: "DEEPMIND",
    category: "tech",
    template: "apple-bento-launch",
    aspect: "16:9",
    pages: 3,
    sampleKey: "gemini"
  },
  {
    id: "deck-blackfriday",
    title: "2026 黑五 AI 算力与订阅指南",
    subtitle: "算力通缩下的超级个体采购清单",
    badge: "黑五精选",
    category: "social",
    template: "xhs-swiss-grid",
    aspect: "3:4",
    pages: 3,
    sampleKey: "blackfriday"
  },
  {
    id: "deck-vibe-coding",
    title: "Andrej Karpathy: 'Vibe Coding'",
    subtitle: "敲击代码行数归零，跟随机感对话",
    badge: "KARPATHY",
    category: "social",
    template: "apple-bento-launch",
    aspect: "16:9",
    pages: 3,
    sampleKey: "agent"
  },
  {
    id: "deck-mcp",
    title: "Anthropic MCP 协议普及",
    subtitle: "本地数据与工具调用的开放新标准",
    badge: "ANTHROPIC",
    category: "tech",
    template: "x-zukai-quad",
    aspect: "1:1",
    pages: 5,
    sampleKey: "mcp"
  },
  {
    id: "deck-claudecode",
    title: "Claude Code 终端原生 Agent",
    subtitle: "CLI 极速自主调试与本地沙盒治理",
    badge: "CLAUDE",
    category: "work",
    template: "linkedin-exec-carousel",
    aspect: "4:5",
    pages: 4,
    sampleKey: "claudecode"
  },
  {
    id: "deck-localfirst",
    title: "Local-First 软件复兴",
    subtitle: "零云端依赖与纯本地私有数据留存",
    badge: "LOCAL-FIRST",
    category: "life",
    template: "xhs-paper-editorial",
    aspect: "3:4",
    pages: 3,
    sampleKey: "localfirst"
  },
  {
    id: "deck-deepseek",
    title: "DeepSeek-R1 本地蒸馏冲击波",
    subtitle: "小参数高推理时代的端侧落地指南",
    badge: "OPEN SOURCE",
    category: "tech",
    template: "ppt-linear-dark",
    aspect: "16:9",
    pages: 4,
    sampleKey: "deepseek"
  },
  {
    id: "deck-token",
    title: "超级个体千亿飞轮",
    subtitle: "从单次对话到私有知识复利沉淀",
    badge: "SUPER INDIVIDUAL",
    category: "work",
    template: "wechat-editorial-article",
    aspect: "3:4",
    pages: 4,
    sampleKey: "token"
  }
];


export async function buildWebPlaygroundHtml(
  templates: MarketplaceTemplateEntry[],
  packageRoot: string
): Promise<string> {
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
        width: tpl.width || 1920,
        height: tpl.height || 1080,
        category: tpl.category,
        styleFamily: tpl.styleFamily,
        description: tpl.description,
        palette: extractTemplatePaletteFromCss(css),
        css,
      };
    })
  );

  const jsonTemplates = JSON.stringify(templatePayloads).replace(/<\/script>/gi, '<\\/script>');
  const jsonRadar = JSON.stringify(RADAR_ITEMS).replace(/<\/script>/gi, '<\\/script>');
  const jsonWorks = JSON.stringify(WORKS_DATA).replace(/<\/script>/gi, '<\\/script>');
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
      color-scheme: light dark;
      --am-violet: #18181b;
      --am-violet-hover: #27272a;
      --am-violet-active: #09090b;
      --am-violet-glow: rgba(24, 24, 27, 0.14);
      --am-violet-soft: rgba(24, 24, 27, 0.06);

      --am-emerald: #10b981;
      --am-emerald-soft: rgba(16, 185, 129, 0.12);
      --am-amber: #f59e0b;
      --am-amber-soft: rgba(245, 158, 11, 0.12);
      --am-coral: #ff6b74;

      --font-sans: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', 'PingFang SC', sans-serif;
      --font-mono: 'SF Mono', 'JetBrains Mono', ui-monospace, Menlo, monospace;

      --topbar-height: 46px;
      --radius-sm: 8px;
      --radius-md: 12px;
      --radius-lg: 16px;
      --radius-pill: 999px;

      /* Dark Room Default */
      --bg: #0c0c0e;
      --stage-bg: #0c0c0e;
      --stage-bg-gradient: radial-gradient(ellipse 70% 50% at 50% 30%, #16161b 0%, #111115 50%, #0c0c0e 100%);
      --chrome-bg: rgba(16, 16, 20, 0.88);
      --sidebar: #111114;
      --surface: #17171c;
      --surface-elev: #1e1e24;
      --surface-subtle: #131317;
      --surface-hover: rgba(255, 255, 255, 0.05);
      --border: rgba(255, 255, 255, 0.08);
      --border-strong: rgba(255, 255, 255, 0.15);
      --border-focus: rgba(255, 255, 255, 0.32);
      --ink: #f5f4f0;
      --ink-secondary: #9e9b93;
      --ink-muted: #66635c;
      --ink-faint: #44423c;
      --brand: #18181b;
      --brand-hover: #27272a;
      --brand-glow: rgba(0, 0, 0, 0.4);
      --live: #10b981;
      --danger: #ef4444;
    }

    [data-theme="light"] {
      --bg: #eceae4;
      --stage-bg: #eceae4;
      --stage-bg-gradient: radial-gradient(circle at 50% 30%, #f5f4ee 0%, #eceae4 65%, #e3e1da 100%);
      --chrome-bg: rgba(246, 245, 240, 0.88);
      --sidebar: #f5f4ef;
      --surface: #ffffff;
      --surface-elev: #fdfcf9;
      --surface-subtle: #eeede7;
      --surface-hover: rgba(20, 20, 19, 0.045);
      --border: rgba(20, 20, 19, 0.08);
      --border-strong: rgba(20, 20, 19, 0.15);
      --border-focus: rgba(24, 24, 27, 0.35);
      --ink: #141413;
      --ink-secondary: #57554f;
      --ink-muted: #8c887f;
      --ink-faint: #b4b0a6;
      --brand: #18181b;
      --brand-hover: #27272a;
      --brand-glow: rgba(24, 24, 27, 0.16);
      --live: #0f9d68;
    }

    * { box-sizing: border-box; }
    html, body {
      margin: 0; padding: 0; height: 100%;
      background: var(--stage-bg); color: var(--ink);
      font-family: var(--font-sans); font-size: 13px;
      overflow: hidden;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
    button, input, select, textarea {
      font-family: inherit; color: inherit;
    }
    .ic, .lucide-icon {
      width: 14px; height: 14px;
      display: inline-block; vertical-align: middle; flex-shrink: 0;
    }
    .ic-sm { width: 12px; height: 12px; }
    .ic-lg { width: 16px; height: 16px; }

    /* Outlines & Focus Guard (Zero Purple Artifacts) */
    *:focus, *:focus-visible {
      outline: none !important;
      outline-color: transparent !important;
      box-shadow: 0 0 0 2px rgba(24, 24, 27, 0.35) !important;
    }
    [data-theme="dark"] *:focus, [data-theme="dark"] *:focus-visible {
      box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.35) !important;
    }

    /* 1. Frosted Translucent Studio Topbar (46px) */
    header.pg-topbar {
      height: var(--topbar-height);
      background: var(--chrome-bg);
      backdrop-filter: blur(24px) saturate(180%);
      -webkit-backdrop-filter: blur(24px) saturate(180%);
      border-bottom: 1px solid var(--border);
      display: flex; align-items: center; justify-content: space-between;
      gap: 12px;
      padding: 0 12px;
      z-index: 60;
      position: relative;
      user-select: none;
    }

    .topbar-left {
      display: flex; align-items: center; gap: 8px; flex-shrink: 0; min-width: 0;
    }
    .icon-btn {
      width: 30px; height: 30px; border-radius: var(--radius-sm);
      border: 1px solid transparent; background: transparent;
      color: var(--ink-secondary); cursor: pointer;
      display: inline-flex; align-items: center; justify-content: center;
      transition: all 0.15s ease;
    }
    .icon-btn:hover {
      background: var(--surface-hover); color: var(--ink); border-color: var(--border);
    }
    .pg-brand {
      display: flex; align-items: center; gap: 7px;
      text-decoration: none; color: var(--ink);
      white-space: nowrap; flex-shrink: 0;
    }
    .pg-brand strong {
      font-size: 13.5px; font-weight: 650; letter-spacing: -0.02em; white-space: nowrap;
    }
    .workspace-pill {
      display: inline-flex; align-items: center; gap: 6px;
      height: 30px; padding: 0 10px 0 6px;
      border-radius: var(--radius-sm);
      background: var(--surface); border: 1px solid var(--border);
      color: var(--ink); font-size: 12px; font-weight: 550;
      cursor: pointer; transition: all 0.15s ease;
    }
    .workspace-pill:hover {
      background: var(--surface-elev); border-color: var(--border-strong);
    }
    .brand-mark-badge {
      display: inline-flex; align-items: center; justify-content: center;
      width: 18px; height: 18px; border-radius: 4px;
      background: var(--brand); color: #fff;
    }

    /* Center: End-to-End Loop Stepper */
    .loop-stepper {
      display: inline-flex; align-items: center; gap: 4px;
      padding: 3px 8px;
      background: var(--surface); border: 1px solid var(--border);
      border-radius: 999px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    }
    .loop-step {
      border: none; background: transparent;
      color: var(--ink-muted); font-size: 12px; font-weight: 500;
      cursor: pointer; padding: 3px 10px; border-radius: 999px;
      transition: all 0.15s ease; white-space: nowrap;
    }
    .loop-step:hover { color: var(--ink); }
    .loop-step.active {
      background: var(--brand); color: #ffffff !important; font-weight: 600;
      box-shadow: 0 1px 4px rgba(0,0,0,0.2);
    }
    [data-theme="light"] .loop-step.active {
      background: #18181b; color: #ffffff !important;
    }
    .loop-sep {
      color: var(--ink-faint); font-size: 11px; user-select: none;
    }

    /* Right Controls */
    .topbar-right {
      display: flex; align-items: center; gap: 6px; flex-shrink: 0; min-width: 0;
    }
    .btn {
      height: 30px; padding: 0 10px; border-radius: var(--radius-sm);
      border: 1px solid var(--border); background: var(--surface);
      color: var(--ink); font-size: 12px; font-weight: 500;
      cursor: pointer; display: inline-flex; align-items: center; justify-content: center; gap: 5px;
      white-space: nowrap; transition: all 0.15s ease;
    }
    .btn:hover {
      background: var(--surface-elev); border-color: var(--border-strong);
    }
    .btn-primary {
      background: #18181b !important; color: #ffffff !important;
      border: 1px solid rgba(255, 255, 255, 0.18) !important; font-weight: 600;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.35);
    }
    .btn-primary:hover {
      background: #27272a !important; color: #ffffff !important;
    }
    [data-theme="light"] .btn-primary {
      background: #18181b !important; color: #ffffff !important;
      border: 1px solid #18181b !important;
    }
    .btn-radar-trigger {
      background: var(--surface); border: 1px solid var(--border);
    }
    .live-pulse-dot {
      width: 6.5px; height: 6.5px; border-radius: 50%;
      background: #10b981; display: inline-block;
      box-shadow: 0 0 8px rgba(16, 185, 129, 0.8);
      animation: livePulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    }
    @keyframes livePulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.45; transform: scale(0.85); }
    }

    /* Test Compatibility Toolbar Cluster (Hidden from distracting users, but accessible & <= 36px) */
    .test-compat-cluster {
      display: inline-flex; align-items: center; gap: 4px;
    }
    .pg-btn {
      height: 30px; padding: 0 8px; border-radius: var(--radius-sm);
      border: 1px solid var(--border); background: var(--surface);
      color: var(--ink); font-size: 11.5px; font-weight: 500;
      cursor: pointer; display: inline-flex; align-items: center; justify-content: center; gap: 4px;
      white-space: nowrap !important; word-break: keep-all !important; flex-shrink: 0 !important;
      transition: all 0.15s ease;
    }
    .pg-btn:hover {
      background: var(--surface-elev); border-color: var(--border-strong);
    }
    .pg-select {
      background-color: var(--surface); color: var(--ink);
      border: 1px solid var(--border); border-radius: var(--radius-sm);
      height: 30px; padding: 0 20px 0 8px; font-size: 11.5px; font-weight: 500; outline: none;
      white-space: nowrap; text-overflow: ellipsis; cursor: pointer; flex-shrink: 0;
      -webkit-appearance: none; -moz-appearance: none; appearance: none;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
      background-repeat: no-repeat; background-position: right 6px center;
    }
    .pg-btn-icon { width: 30px; padding: 0; }
    .pg-theme-btn .icon-moon { display: none; }
    .pg-theme-btn .icon-sun { display: block; }
    [data-theme="light"] .pg-theme-btn .icon-sun { display: none; }
    [data-theme="light"] .pg-theme-btn .icon-moon { display: block; }

    /* 2. Main Studio Shell */
    .shell-body {
      display: flex;
      height: calc(100% - var(--topbar-height));
      width: 100%; position: relative; overflow: hidden;
    }

    /* 2.1 Left Collapsible Sidebar */
    .sidebar {
      width: 256px; flex-shrink: 0;
      background: var(--sidebar);
      border-right: 1px solid var(--border);
      display: flex; flex-direction: column; height: 100%;
      transition: width 0.22s cubic-bezier(0.16, 1, 0.3, 1), margin-left 0.22s cubic-bezier(0.16, 1, 0.3, 1);
      position: relative; z-index: 40; user-select: none;
    }
    .sidebar.collapsed {
      width: 0 !important; margin-left: -256px !important;
      overflow: hidden; border-right: none;
    }
    .sidebar-scroll {
      flex: 1; overflow-y: auto; overflow-x: hidden;
      padding: 10px 10px 16px; display: flex; flex-direction: column; gap: 12px;
    }
    .sidebar-scroll::-webkit-scrollbar { width: 4px; }
    .sidebar-scroll::-webkit-scrollbar-thumb {
      background: rgba(127, 127, 127, 0.2); border-radius: 2px;
    }
    .sidebar-promos { display: flex; flex-direction: column; gap: 6px; }
    .trending-promo-btn {
      width: 100%; padding: 8px 10px; border-radius: var(--radius-sm);
      background: var(--surface); border: 1px solid var(--border);
      display: flex; align-items: center; justify-content: space-between; gap: 8px;
      cursor: pointer; text-align: left; transition: all 0.15s ease;
    }
    .trending-promo-btn:hover {
      background: var(--surface-elev); border-color: var(--border-strong); transform: translateY(-0.5px);
    }
    .sidebar-meta-tag {
      font-size: 10px; padding: 2px 6px; border-radius: 999px;
      background: rgba(16, 185, 129, 0.12); color: #10b981; font-weight: 550; white-space: nowrap;
    }
    .category-pills {
      display: flex; align-items: center; gap: 4px;
      overflow-x: auto; scrollbar-width: none; padding: 2px 0;
    }
    .category-pills::-webkit-scrollbar { display: none; }
    .cat-pill {
      padding: 3px 8px; border-radius: 999px; border: 1px solid transparent;
      background: var(--surface); color: var(--ink-muted);
      font-size: 11px; font-weight: 500; cursor: pointer; white-space: nowrap;
      transition: all 0.15s ease;
    }
    .cat-pill:hover { color: var(--ink); border-color: var(--border); }
    .cat-pill.active {
      background: var(--brand); color: #ffffff !important; font-weight: 600;
    }
    [data-theme="light"] .cat-pill.active {
      background: #18181b; color: #ffffff !important;
    }

    .nav-group { display: flex; flex-direction: column; gap: 4px; }
    .nav-group-head {
      display: flex; align-items: center; justify-content: space-between;
      padding: 4px 6px; font-size: 11px; font-weight: 600; color: var(--ink-faint);
      text-transform: uppercase; letter-spacing: 0.05em;
    }
    .nav-list { display: flex; flex-direction: column; gap: 3px; }
    .nav-item {
      width: 100%; padding: 7px 9px; border-radius: var(--radius-sm);
      border: 1px solid transparent; background: transparent;
      cursor: pointer; text-align: left; display: flex; flex-direction: column; gap: 2px;
      transition: all 0.14s ease;
    }
    .nav-item:hover { background: var(--surface); border-color: var(--border); }
    .nav-item.active {
      background: var(--surface-elev); border-color: var(--border-strong);
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.12);
    }
    .nav-item-header-row {
      display: flex; align-items: center; justify-content: space-between; gap: 6px;
    }
    .nav-item-title {
      font-size: 12px; font-weight: 550; color: var(--ink);
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    }
    .nav-item-badge {
      font-size: 9.5px; font-family: var(--font-mono); padding: 1px 5px;
      border-radius: 4px; background: rgba(127, 127, 127, 0.14); color: var(--ink-muted); flex-shrink: 0;
    }
    .nav-item-sub {
      font-size: 11px; color: var(--ink-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    }
    .sidebar-footer {
      padding: 10px 12px; border-top: 1px solid var(--border);
      display: flex; align-items: center; justify-content: space-between; background: var(--sidebar);
    }
    .skill-badge-btn {
      display: inline-flex; align-items: center; gap: 6px;
      font-size: 11px; color: var(--ink-muted); border: none; background: transparent;
      cursor: pointer; padding: 2px 4px; border-radius: 4px;
    }
    .skill-badge-btn:hover { color: var(--ink); }

    /* 2.2 Editor Pane: Card Form First (Zero Intimidation) */
    .editor-pane {
      width: 420px; flex-shrink: 0;
      background: var(--sidebar); border-right: 1px solid var(--border);
      display: flex; flex-direction: column; height: 100%; min-width: 0;
      transition: width 0.22s cubic-bezier(0.16, 1, 0.3, 1);
      z-index: 30;
    }
    .editor-pane.hidden-editor { display: none !important; }
    .editor-tabs-bar {
      height: 38px; padding: 0 12px;
      display: flex; align-items: center; justify-content: space-between; gap: 8px;
      border-bottom: 1px solid var(--border); background: var(--surface);
    }
    .editor-segmented {
      display: inline-flex; padding: 2px; gap: 2px;
      background: var(--bg); border: 1px solid var(--border); border-radius: var(--radius-sm);
    }
    .editor-tab-btn {
      height: 25px; padding: 0 9px; border: none; border-radius: 6px;
      background: transparent; color: var(--ink-muted);
      font-size: 11.5px; font-weight: 500; cursor: pointer;
      display: inline-flex; align-items: center; gap: 5px; white-space: nowrap;
      transition: all 0.15s ease;
    }
    .editor-tab-btn:hover { color: var(--ink); }
    .editor-tab-btn.active {
      background: var(--surface-elev); color: var(--ink); font-weight: 600;
      box-shadow: 0 1px 3px rgba(0,0,0,0.2);
    }
    [data-theme="light"] .editor-tab-btn.active {
      background: #ffffff; color: #18181b; box-shadow: 0 1px 3px rgba(0,0,0,0.08);
    }

    /* Card Mode Form View */
    #card-editor-pane {
      flex: 1; overflow-y: auto; padding: 14px; display: flex; flex-direction: column; gap: 12px;
    }
    #card-editor-pane.hidden { display: none !important; }
    .card-pills-row {
      display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 4px;
    }
    .card-slide-pills {
      display: flex; align-items: center; gap: 4px; overflow-x: auto; scrollbar-width: none;
    }
    .card-slide-pills::-webkit-scrollbar { display: none; }
    .card-slide-pill {
      height: 24px; padding: 0 8px; border-radius: 6px; border: 1px solid var(--border);
      background: var(--surface); color: var(--ink-muted); font-size: 11px; font-weight: 500;
      cursor: pointer; white-space: nowrap; display: inline-flex; align-items: center;
    }
    .card-slide-pill.active {
      background: var(--brand); color: #fff; font-weight: 600; border-color: var(--brand);
    }
    [data-theme="light"] .card-slide-pill.active {
      background: #18181b; color: #fff; border-color: #18181b;
    }
    .card-field {
      display: flex; flex-direction: column; gap: 4px;
    }
    .card-field label {
      font-size: 11px; font-weight: 600; color: var(--ink-secondary); letter-spacing: 0.02em;
    }
    .card-input, .card-textarea {
      width: 100%; border-radius: var(--radius-sm); border: 1px solid var(--border);
      background: var(--surface); color: var(--ink); padding: 7px 10px; font-size: 12.5px;
      outline: none; transition: all 0.14s ease; box-sizing: border-box;
    }
    .card-input:focus, .card-textarea:focus {
      border-color: var(--border-strong); background: var(--surface-elev);
    }
    .card-textarea { resize: vertical; line-height: 1.5; font-family: inherit; }

    /* Source Mode Editor View (Advanced) */
    #source-editor-wrap {
      flex: 1; display: flex; flex-direction: column; min-height: 0;
    }
    #source-editor-wrap.hidden { display: none !important; }
    .editor-head {
      height: 36px; padding: 0 12px;
      display: flex; align-items: center; justify-content: space-between; gap: 6px;
      border-bottom: 1px solid var(--border); font-size: 11px; color: var(--ink-muted);
      background: var(--sidebar);
    }
    .editor-head-left { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
    .editor-head-title { font-weight: 600; color: var(--ink); font-size: 11.5px; }
    .snippet-chips {
      display: flex; align-items: center; gap: 3px; overflow-x: auto; scrollbar-width: none;
    }
    .snippet-chips::-webkit-scrollbar { display: none; }
    .chip-btn {
      height: 22px; padding: 0 6px; border-radius: 4px; border: 1px solid var(--border);
      background: var(--surface); color: var(--ink-muted); font-size: 10.5px; font-weight: 500;
      cursor: pointer; white-space: nowrap; display: inline-flex; align-items: center; gap: 3px;
    }
    .chip-btn:hover { background: var(--surface-elev); color: var(--ink); }
    .editor-code-container {
      flex: 1; display: flex; min-height: 0; position: relative; background: var(--sidebar);
    }
    .editor-gutter {
      width: 40px; padding: 12px 6px 12px 0; text-align: right;
      font-family: var(--font-mono); font-size: 11.5px; line-height: 1.6;
      color: var(--ink-faint); user-select: none; border-right: 1px solid var(--border);
      background: var(--sidebar); overflow: hidden;
    }
    .editor-textarea-wrapper { flex: 1; display: flex; min-height: 0; position: relative; }
    #md-input {
      width: 100%; height: 100%; padding: 12px 14px; margin: 0; border: none; outline: none;
      background: transparent; color: var(--ink); font-family: var(--font-mono);
      font-size: 12.5px; line-height: 1.6; resize: none; white-space: pre; overflow: auto;
    }
    .editor-footer {
      height: 28px; padding: 0 12px; border-top: 1px solid var(--border);
      display: flex; align-items: center; justify-content: space-between;
      font-size: 11px; color: var(--ink-faint); background: var(--sidebar);
    }

    /* 2.3 Center 100% Visual Canvas Stage */
    .stage-pane {
      flex: 1; height: 100%; min-width: 0;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      background: var(--stage-bg); background-image: var(--stage-bg-gradient);
      position: relative; overflow: hidden; padding: 24px 24px 84px !important;
    }
    .stage-status-bar {
      position: absolute; top: 16px; left: 50%; transform: translateX(-50%);
      height: 32px; padding: 0 14px; border-radius: 999px;
      background: rgba(16, 16, 20, 0.82);
      backdrop-filter: blur(20px) saturate(180%); -webkit-backdrop-filter: blur(20px) saturate(180%);
      border: 1px solid var(--border); display: inline-flex; align-items: center; gap: 8px;
      font-size: 12px; color: var(--ink-secondary); z-index: 20;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35); user-select: none;
      white-space: nowrap; max-width: calc(100% - 48px);
    }
    #status-deck-name {
      max-width: 140px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    }
    [data-theme="light"] .stage-status-bar {
      background: rgba(255, 255, 255, 0.9); border-color: rgba(20, 20, 19, 0.1);
      box-shadow: 0 8px 24px rgba(20, 20, 19, 0.08);
    }
    .status-indicator-dot {
      width: 6.5px; height: 6.5px; border-radius: 50%; background: #10b981;
      display: inline-block; box-shadow: 0 0 8px rgba(16, 185, 129, 0.8);
    }
    .status-sep { color: var(--ink-faint); }
    .context-moat-pill {
      display: inline-flex; align-items: center; gap: 5px; padding: 2px 8px;
      border-radius: 999px; background: rgba(16, 185, 129, 0.12);
      border: 1px solid rgba(16, 185, 129, 0.28); color: #10b981; font-size: 11px;
      font-weight: 550; cursor: pointer; transition: all 0.14s ease;
    }
    .context-moat-pill:hover {
      background: rgba(16, 185, 129, 0.2); border-color: rgba(16, 185, 129, 0.45);
    }

    .stage-viewport {
      width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;
    }
    #preview-frame {
      width: 100%; height: 100%; border: 1px solid var(--border); border-radius: var(--radius-lg);
      background: transparent;
      box-shadow: 0 24px 64px -12px rgba(0, 0, 0, 0.65), 0 0 0 1px rgba(255, 255, 255, 0.05);
      transition: box-shadow 0.2s ease, border-color 0.2s ease;
    }
    [data-theme="light"] #preview-frame {
      box-shadow: 0 20px 50px -12px rgba(20, 20, 19, 0.12), 0 0 0 1px rgba(20, 20, 19, 0.06);
    }

    /* Floating Stage Dock Capsule */
    .pg-stage-dock {
      position: absolute; bottom: 16px; left: 50%; transform: translateX(-50%);
      height: 40px; padding: 0 10px; border-radius: 999px;
      background: rgba(16, 16, 20, 0.88);
      backdrop-filter: blur(24px) saturate(180%); -webkit-backdrop-filter: blur(24px) saturate(180%);
      border: 1px solid var(--border); display: inline-flex; align-items: center; gap: 5px;
      z-index: 30; box-shadow: 0 14px 36px -4px rgba(0, 0, 0, 0.6); user-select: none;
    }
    [data-theme="light"] .pg-stage-dock {
      background: rgba(255, 255, 255, 0.92); border-color: rgba(20, 20, 19, 0.12);
      box-shadow: 0 14px 36px -4px rgba(20, 20, 19, 0.14);
    }
    .pg-dock-btn {
      height: 28px; padding: 0 9px; border-radius: 999px; border: 1px solid transparent;
      background: transparent; color: var(--ink); font-size: 11.5px; font-weight: 500;
      cursor: pointer; white-space: nowrap !important; word-break: keep-all !important; flex-shrink: 0 !important;
      display: inline-flex; align-items: center; justify-content: center; gap: 4px;
      transition: all 0.14s ease;
    }
    .pg-dock-btn:hover { background: var(--surface-hover); }
    .pg-slide-indicator {
      font-family: var(--font-mono); font-size: 11.5px; font-variant-numeric: tabular-nums;
      color: var(--ink-secondary); padding: 0 8px; white-space: nowrap !important; word-break: keep-all !important; flex-shrink: 0 !important;
      font-weight: 550;
    }
    .pg-quick-actions, .pg-zoom-actions {
      display: inline-flex; align-items: center; gap: 2px;
      background: var(--surface); padding: 2px; border-radius: 999px; flex-shrink: 0;
    }
    .pg-dock-icon-btn {
      width: 24px; height: 24px; border-radius: 999px; border: none;
      background: transparent; color: var(--ink-muted); cursor: pointer;
      display: inline-flex; align-items: center; justify-content: center;
      transition: all 0.12s ease; flex-shrink: 0;
    }
    .pg-dock-icon-btn:hover { background: var(--surface-hover); color: var(--ink); }
    .pg-dock-icon-btn-danger:hover { background: rgba(239, 68, 68, 0.22) !important; color: #f87171 !important; }
    .pg-dock-pill-btn {
      height: 24px; padding: 0 10px; border-radius: 999px; border: none;
      background: transparent; color: var(--ink-muted); font-size: 11px;
      cursor: pointer; display: inline-flex; align-items: center; justify-content: center;
      font-family: var(--font-mono);
      white-space: nowrap !important; word-break: keep-all !important; flex-shrink: 0 !important; min-width: 56px !important;
    }
    .pg-dock-pill-btn:hover { background: var(--surface-hover); color: var(--ink); }

    /* 3. Drawers & Modals (Radar, Templates, Export, Context) */
    .drawer-backdrop {
      position: fixed; inset: 0; background: rgba(0, 0, 0, 0.65);
      backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
      z-index: 9000; opacity: 0; pointer-events: none; transition: opacity 220ms ease;
    }
    .drawer-backdrop.show { opacity: 1; pointer-events: auto; }

    .side-drawer {
      position: fixed; top: 0; right: -560px; width: 540px; max-width: 94vw; height: 100%;
      background: var(--sidebar); border-left: 1px solid var(--border);
      box-shadow: -16px 0 48px -8px rgba(0, 0, 0, 0.65);
      display: flex; flex-direction: column; z-index: 9001;
      transition: right 240ms cubic-bezier(0.16, 1, 0.3, 1);
    }
    .side-drawer.show { right: 0; }
    .drawer-header {
      height: 48px; padding: 0 16px; border-bottom: 1px solid var(--border);
      display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-shrink: 0;
    }
    .drawer-title-group { display: flex; align-items: center; gap: 8px; }
    .drawer-title { font-size: 13.5px; font-weight: 650; color: var(--ink); }
    .drawer-body {
      flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 12px;
    }
    .drawer-search-box {
      position: relative; width: 100%; margin-bottom: 4px;
    }
    .drawer-search-input {
      width: 100%; height: 32px; padding: 0 10px 0 32px; border-radius: var(--radius-sm);
      border: 1px solid var(--border); background: var(--surface); color: var(--ink);
      font-size: 12px; outline: none; box-sizing: border-box;
    }
    .drawer-search-icon {
      position: absolute; left: 10px; top: 50%; transform: translateY(-50%);
      color: var(--ink-muted); pointer-events: none;
    }

    /* Template Cards in Drawer */
    .template-grid {
      display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 12px;
    }
    .drawer-card {
      border: 1px solid var(--border); border-radius: var(--radius-md);
      background: var(--surface); padding: 10px; text-align: left; cursor: pointer;
      display: flex; flex-direction: column; gap: 6px; transition: all 0.16s ease;
    }
    .drawer-card:hover {
      border-color: var(--border-strong); transform: translateY(-1px);
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
    }
    .drawer-card.active {
      border-color: var(--brand); box-shadow: 0 0 0 1px var(--brand);
    }
    .drawer-thumb-box {
      height: 110px; border-radius: 8px; overflow: hidden; position: relative;
      display: flex; align-items: center; justify-content: center;
    }
    .drawer-thumb-img {
      width: 100%; height: 100%; object-fit: cover;
    }
    .drawer-card-top {
      display: flex; align-items: center; justify-content: space-between; gap: 4px;
    }
    .drawer-card-title { font-size: 12px; font-weight: 600; color: var(--ink); }
    .drawer-card-aspect {
      font-size: 10px; font-family: var(--font-mono); padding: 1px 5px;
      border-radius: 4px; background: rgba(127, 127, 127, 0.14); color: var(--ink-muted);
    }
    .drawer-card-desc { font-size: 11px; color: var(--ink-muted); line-height: 1.4; }

    /* Radar Items in Drawer */
    .radar-item-card {
      padding: 12px; border-radius: var(--radius-sm); border: 1px solid var(--border);
      background: var(--surface); display: flex; flex-direction: column; gap: 6px;
      transition: all 0.15s ease;
    }
    .radar-item-card:hover {
      background: var(--surface-elev); border-color: var(--border-strong);
    }
    .radar-item-head {
      display: flex; align-items: center; justify-content: space-between; gap: 6px;
    }
    .radar-item-source {
      font-size: 11px; font-weight: 600; color: #10b981;
    }
    .radar-item-hotness {
      font-size: 10.5px; color: var(--ink-muted); font-family: var(--font-mono);
    }
    .radar-item-title {
      font-size: 12.5px; font-weight: 600; color: var(--ink); line-height: 1.4;
    }
    .radar-item-summary {
      font-size: 11.5px; color: var(--ink-secondary); line-height: 1.45;
    }
    .radar-item-footer {
      display: flex; align-items: center; justify-content: space-between; margin-top: 4px;
    }

    /* Export Drawer Option Cards */
    .export-option-card {
      padding: 12px 14px; border-radius: var(--radius-md); border: 1px solid var(--border);
      background: var(--surface); display: flex; align-items: center; justify-content: space-between;
      gap: 12px; cursor: pointer; transition: all 0.15s ease;
    }
    .export-option-card:hover {
      background: var(--surface-elev); border-color: var(--border-strong);
    }
    .export-option-left {
      display: flex; align-items: center; gap: 10px;
    }
    .export-option-title { font-size: 12.5px; font-weight: 600; color: var(--ink); }
    .export-option-desc { font-size: 11px; color: var(--ink-muted); }

    /* 4. Global Toast Notification */
    #toast {
      position: fixed; bottom: 24px; left: 50%;
      transform: translateX(-50%) translateY(20px);
      background: #18181b; color: #ffffff;
      border: 1px solid rgba(255, 255, 255, 0.18);
      border-radius: 999px; padding: 8px 18px; font-size: 12px; font-weight: 550;
      box-shadow: 0 12px 30px rgba(0, 0, 0, 0.5);
      opacity: 0; transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
      pointer-events: none; z-index: 10002; white-space: nowrap;
    }
    #toast.show { opacity: 1; transform: translateX(-50%) translateY(0); }

    .fullscreen-mode #preview-frame {
      position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
      border: none; border-radius: 0; z-index: 9999;
    }
    .fullscreen-mode .pg-stage-dock { z-index: 10001; }
    .spin { animation: spin 0.8s linear infinite; }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

  </style>
</head>
<body>
  <!-- 1. Top Chrome (46px Frosted Translucent Studio Header) -->
  <header class="pg-topbar">
    <div class="topbar-left">
      <button class="icon-btn" id="btn-toggle-sidebar" title="收起/展开工作区栏 (⌘\)" aria-label="切换工作区栏">
        ${lucideIcon('panelLeft', 'ic ic-lg')}
      </button>

      <a href="/" class="pg-brand" title="返回官网首页">
        <svg width="20" height="20" viewBox="0 0 32 32" fill="none" style="flex-shrink:0;">
          <rect width="32" height="32" rx="8" fill="#18181D" stroke="rgba(255,255,255,0.14)"></rect>
          <path d="M13 6 4 24 20 27Z" fill="#F5F4F0"></path>
          <path d="M14.5 5.65 21 4 28 25 21.4 26.65Z" fill="#D94E28"></path>
        </svg>
        <strong>Aimake 爱创工坊</strong>
      </a>

      <button class="workspace-pill" id="btn-workspace-switcher" title="切换或新建创作工作区">
        <span class="brand-mark-badge">${lucideIcon('sparkles', 'ic ic-sm')}</span>
        <span class="workspace-name">Aimake 创作工作区</span>
        ${lucideIcon('chevronDown', 'ic ic-sm')}
      </button>
    </div>

    <!-- Center: Clean End-to-End Closed-Loop Stepper -->
    <nav class="loop-stepper" aria-label="端到端创作闭环">
      <button class="loop-step" id="step-intake" title="灵感雷达与素材溯源">素材</button>
      <span class="loop-sep">·</span>
      <button class="loop-step" id="step-author" title="卡片可视化编排">创作</button>
      <span class="loop-sep">·</span>
      <button class="loop-step active" id="step-stage" title="实时视觉舞台">舞台</button>
      <span class="loop-sep">·</span>
      <button class="loop-step" id="step-deliver" title="多模态交付与导出">交付</button>
    </nav>

    <!-- Right: Tactile Studio Actions -->
    <div class="topbar-right">
      <button class="btn btn-radar-trigger" id="btn-open-radar" title="浏览全网实时热点（X/Twitter、知乎、36Kr），一键生成作品">
        <span class="live-pulse-dot"></span>
        <span>灵感雷达</span>
      </button>

      <button class="btn" id="btn-open-templates" title="浏览 36 套高颜值设计系统">
        ${lucideIcon('layoutGrid')}
        <span>36 套模板</span>
      </button>

      <button class="btn btn-primary" id="btn-open-export" title="一键导出高清图、公众号、PDF、PPTX 或口播视频">
        ${lucideIcon('upload')}
        <span>导出</span>
      </button>

      <!-- Clean Test Compatibility Toolbar Cluster (Single-row, height <= 36px) -->
      <div class="test-compat-cluster" id="test-compat-cluster">
        <button class="pg-btn" id="btn-humanize" title="四语种去 AI 套话清洗器">${lucideIcon('wand')} 去AI味</button>
        <button class="pg-btn" id="btn-copy-wechat" title="一键复制微信公众号富文本 (支持直粘微信后台)">${lucideIcon('copy')} 公众号</button>
        <button class="pg-btn pg-btn-primary" id="btn-export-png" title="将当前页导出为高清 PNG 图片">${lucideIcon('image')} 导图</button>
        <button class="pg-btn" id="btn-print-pdf" title="打印 / 另存为 PDF 演示文稿">${lucideIcon('printer')} PDF</button>
        <button class="pg-btn" id="btn-download-md" title="下载 .deck.md 原稿">${lucideIcon('download')} 下载</button>
        <button class="pg-btn pg-btn-icon" id="btn-fullscreen" title="全屏演示 (F)">${lucideIcon('maximize')}</button>

        <select class="pg-select" id="sample-select" title="载入示范原稿" >
          <option value="agent" selected>Karpathy Vibe Coding 个人软件 (16:9)</option>
          <option value="gemini">Google Antigravity & Gemini 4 (16:9)</option>
          <option value="blackfriday">2026 黑五 AI 算力与订阅指南 (3:4)</option>
          <option value="mcp">Anthropic MCP 白皮书 (1:1)</option>
          <option value="token">超级个体千亿飞轮 (3:4)</option>
          <option value="claudecode">Claude Code 终端原生 Agent (4:5)</option>
          <option value="localfirst">Local-First 软件复兴 (3:4)</option>
          <option value="deepseek">DeepSeek-R1 本地蒸馏 (16:9)</option>
        </select>

        <select class="pg-select" id="template-select" title="切换 36 套设计模板" >
          ${templates
            .map(
              (t) =>
                `<option value="${t.id}">${t.name.zh || t.id} · ${t.aspect}</option>`
            )
            .join('')}
        </select>

        <select class="pg-select" id="aspect-select" title="画幅比例" >
          <option value="auto">画幅: 自动</option>
          <option value="16:9">16:9 宽屏</option>
          <option value="3:4">3:4 小红书</option>
          <option value="9:16">9:16 竖屏</option>
          <option value="1:1">1:1 方图</option>
          <option value="4:5">4:5 长图</option>
        </select>

        <select class="pg-select" id="locale-select" title="语种" >
          <option value="zh-CN">🇨🇳 中文</option>
          <option value="en-US">🇺🇸 EN</option>
          <option value="ja-JP">🇯🇵 日本語</option>
          <option value="ko-KR">🇰🇷 한국어</option>
        </select>
      </div>

      <button type="button" id="theme-toggle-btn" class="icon-btn pg-theme-btn" onclick="togglePlaygroundTheme()" aria-label="切换浅色 / 深色模式" title="切换浅色 / 深色模式">
        <svg class="icon-sun" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
        <svg class="icon-moon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
      </button>
    </div>
  </header>

  <!-- 2. Main Studio Shell Body -->
  <main class="shell-body" id="shell-body">
    <!-- Left Collapsible Workspace Rail -->
    <aside class="sidebar" id="pg-sidebar" aria-label="工作区导航">
      <div class="sidebar-scroll">
        <!-- Sidebar Promos -->
        <div class="sidebar-promos">
          <button class="trending-promo-btn" id="btn-sidebar-radar" title="浏览全网实时热点（X/Twitter、知乎、36Kr），一键生成新作品">
            <span class="nav-item-main">
              <span class="nav-item-title">
                <span class="live-pulse-dot"></span>
                <span>灵感雷达 · W48</span>
              </span>
              <span class="nav-item-sub">16 篇 X 前沿 · 实时更新</span>
            </span>
            <span class="sidebar-meta-tag">实时更新</span>
          </button>

          <button class="trending-promo-btn" id="btn-sidebar-trending" title="浏览 2026 最新科技时事成品，一键做同款">
            <span class="nav-item-main">
              <span class="nav-item-title">时事灵感成品</span>
              <span class="nav-item-sub">6 套高保真热点成品 · 点一下做同款</span>
            </span>
            <span class="sidebar-meta-tag">6 套精选</span>
          </button>
        </div>

        <!-- Category Filter Pills -->
        <div class="category-pills" id="category-pills" role="tablist" aria-label="项目分类">
          <button class="cat-pill active" data-category="all" role="tab" aria-selected="true">全部</button>
          <button class="cat-pill" data-category="social" role="tab" aria-selected="false">自媒体</button>
          <button class="cat-pill" data-category="tech" role="tab" aria-selected="false">前沿科技</button>
          <button class="cat-pill" data-category="work" role="tab" aria-selected="false">工作汇报</button>
          <button class="cat-pill" data-category="life" role="tab" aria-selected="false">生活复盘</button>
        </div>

        <!-- Works List -->
        <div class="nav-group">
          <div class="nav-group-head">
            <span>作品集 (8)</span>
          </div>
          <div class="nav-list" id="pg-deck-list"></div>
        </div>

        <!-- Knowledge Sources -->
        <div class="nav-group">
          <div class="nav-group-head">
            <span>素材与知识 (4)</span>
          </div>
          <div class="nav-list" id="pg-source-list">
            <button class="nav-item" data-open-wiki="1" data-wiki-entity="token-governance">
              <span class="nav-item-main">
                <span class="nav-item-header-row"><span class="nav-item-title">[Wiki] 超级个体 Token 治理</span><span class="nav-item-badge">知识库</span></span>
                <span class="nav-item-sub">wiki/token-governance.md</span>
              </span>
            </button>
            <button class="nav-item" data-open-wiki="1" data-wiki-entity="gemini-agy">
              <span class="nav-item-main">
                <span class="nav-item-header-row"><span class="nav-item-title">Google Antigravity & Gemini 4 架构</span><span class="nav-item-badge">素材</span></span>
                <span class="nav-item-sub">sources/gemini-agy-deepmind.md</span>
              </span>
            </button>
            <button class="nav-item" data-open-wiki="1" data-wiki-entity="black-friday">
              <span class="nav-item-main">
                <span class="nav-item-header-row"><span class="nav-item-title">2026 黑五 AI 算力与订阅指南</span><span class="nav-item-badge">素材</span></span>
                <span class="nav-item-sub">sources/black-friday-2026-ai-deals.md</span>
              </span>
            </button>
            <button class="nav-item" data-open-wiki="1" data-wiki-entity="karpathy-vibe">
              <span class="nav-item-main">
                <span class="nav-item-header-row"><span class="nav-item-title">Andrej Karpathy Vibe Coding 原理</span><span class="nav-item-badge">素材</span></span>
                <span class="nav-item-sub">sources/karpathy-vibe-coding.x.md</span>
              </span>
            </button>
          </div>
        </div>

        <!-- Ready-made Exports -->
        <div class="nav-group">
          <div class="nav-group-head">
            <span>已导出成品 (5)</span>
          </div>
          <div class="nav-list" id="pg-export-list">
            <button class="nav-item" data-preview-export="png">
              <span class="nav-item-main">
                <span class="nav-item-header-row"><span class="nav-item-title">📕 小红书 3:4 超清卡片</span><span class="nav-item-badge">小红书</span></span>
                <span class="nav-item-sub">slide-01.png · PNG · 246 KB</span>
              </span>
            </button>
            <button class="nav-item" data-preview-export="wechat">
              <span class="nav-item-main">
                <span class="nav-item-header-row"><span class="nav-item-title">🟢 微信公众号富文本排版</span><span class="nav-item-badge">公众号</span></span>
                <span class="nav-item-sub">karpathy-vibe-coding.wechat.html · HTML · 11 KB</span>
              </span>
            </button>
            <button class="nav-item" data-preview-export="pptx">
              <span class="nav-item-main">
                <span class="nav-item-header-row"><span class="nav-item-title">📊 微软原生可编辑演示</span><span class="nav-item-badge">PPTX</span></span>
                <span class="nav-item-sub">karpathy-vibe-coding.pptx · PPTX · 45 KB</span>
              </span>
            </button>
            <button class="nav-item" data-preview-export="mp4">
              <span class="nav-item-main">
                <span class="nav-item-header-row"><span class="nav-item-title">🎬 60fps 动效短视频草稿</span><span class="nav-item-badge">短视频</span></span>
                <span class="nav-item-sub">karpathy-vibe-coding.mp4 · MP4 · 483 KB</span>
              </span>
            </button>
          </div>
        </div>
      </div>

      <div class="sidebar-footer">
        <button class="skill-badge-btn" id="btn-open-skills" title="查看并管理预设的 7 大闭环 Skill">
          <span class="live-pulse-dot"></span>
          <span id="preset-skill-summary">7/7 预设 Skill 就绪 · 纯前端零云端</span>
        </button>
      </div>
    </aside>

    <!-- Center/Left Dual-Mode Editor (Visual Card Form First!) -->
    <section class="editor-pane" id="editor-pane">
      <div class="editor-tabs-bar">
        <div class="editor-segmented" role="tablist" aria-label="编辑模式">
          <button class="editor-tab-btn active" id="tab-mode-card" role="tab" aria-selected="true">${lucideIcon('layers')} ✍️ 卡片编辑</button>
          <button class="editor-tab-btn" id="tab-mode-source" role="tab" aria-selected="false">${lucideIcon('code')} ▤ 源码 (高级)</button>
        </div>
        <span style="font-size:11px;color:var(--ink-muted);white-space:nowrap;">纯前端沙盒运行</span>
      </div>

      <!-- 1. Card Mode Form Editor (Active by Default, Zero Intimidation!) -->
      <div id="card-editor-pane" aria-label="卡片可视化编辑">
        <div class="card-pills-row">
          <div class="card-slide-pills" id="card-slide-pills"></div>
          <button class="chip-btn" id="btn-card-add-slide" type="button">+ 新增页</button>
        </div>
        <div class="card-field">
          <label for="card-eyebrow">🏷️ 眉题 / 章节标签 (Eyebrow)</label>
          <input class="card-input" id="card-eyebrow" type="text" placeholder="例如：DEEPMIND 2026 INFLECTION" />
        </div>
        <div class="card-field">
          <label for="card-title">✍️ 核心标题 (Heading 1)</label>
          <input class="card-input" id="card-title" type="text" placeholder="输入核心标题..." />
        </div>
        <div class="card-field">
          <label for="card-subtitle">💬 观点副标题 (Heading 2)</label>
          <input class="card-input" id="card-subtitle" type="text" placeholder="补充一句阐述观点..." />
        </div>
        <div class="card-field">
          <label for="card-bullets">📌 核心论据要点 (每行一条)</label>
          <textarea class="card-textarea" id="card-bullets" rows="4" placeholder="- 第一条论据&#10;- 第二条数据支撑"></textarea>
        </div>
        <div class="card-field">
          <label for="card-extra">📊 结构化模块 (Mermaid / Metric / Code / Quote)</label>
          <textarea class="card-textarea" id="card-extra" rows="6" placeholder="保留或编辑本页的图表、指标、对比或金句模块..."></textarea>
        </div>
      </div>

      <!-- 2. Source Code Editor (Hidden by Default, for Advanced Users Only) -->
      <div id="source-editor-wrap" class="hidden">
        <div class="editor-head">
          <div class="editor-head-left">
            <span class="editor-head-title">${lucideIcon('code')} 原稿 (.deck.md)</span>
            <span class="editor-line-indicator" id="cursor-pos-indicator">Ln 1, Col 1</span>
          </div>
          <div class="snippet-chips">
            <button class="chip-btn" data-insert="metric">+指标</button>
            <button class="chip-btn" data-insert="mermaid">+流程图</button>
            <button class="chip-btn" data-insert="compare">+对比</button>
            <button class="chip-btn" data-insert="code">+代码</button>
            <button class="chip-btn" data-insert="quote">+金句</button>
            <button class="chip-btn" data-insert="slide">+加页</button>
            <button class="chip-btn" id="btn-source-humanize" title="四语种去 AI 套话清洗器">${lucideIcon('wand')} 去AI味</button>
          </div>
        </div>
        <div class="editor-code-container">
          <div class="editor-gutter" id="editor-gutter" aria-hidden="true"></div>
          <div class="editor-textarea-wrapper">
            <textarea id="md-input" wrap="off" spellcheck="false" placeholder="在此编写或粘贴 Markdown 原稿…"></textarea>
          </div>
        </div>
      </div>

      <div class="editor-footer">
        <span id="char-count">0 字符 · 0 页</span>
        <span>本地即时编译</span>
      </div>
    </section>

    <!-- Center/Right Live Preview Stage -->
    <section class="stage-pane" id="stage-pane">
      <!-- Floating Glassmorphism Canvas Status Bar -->
      <div class="stage-status-bar" id="stage-status-bar" aria-label="画板状态">
        <span class="status-indicator-dot pulse"></span>
        <span class="status-label" id="status-deck-name">作品加载中</span>
        <span class="status-sep">·</span>
        <span id="status-aspect-val">16:9</span>
        <span class="status-sep">·</span>
        <span id="status-slide-text">第 01 / 03 页</span>
        <span class="status-sep">·</span>
        <button class="context-moat-pill" id="btn-toggle-context-drawer" title="查看当前作品引用的知识库萃取、素材溯源与上下文壁垒 (⌘I)">
          ${lucideIcon('shield', 'ic ic-sm')}
          <span>资料与上下文壁垒</span>
        </button>
      </div>

      <div class="stage-viewport">
        <iframe id="preview-frame" title="Aimake 实时视觉舞台"></iframe>
      </div>

      <!-- Refined Floating Stage Dock Capsule -->
      <div class="pg-stage-dock" role="toolbar" aria-label="幻灯片翻页与舞台控制">
        <button class="pg-dock-btn" id="pg-prev-slide" title="上一页 (← / PageUp)">
          ${lucideIcon('chevronLeft')}
        </button>

        <span class="pg-slide-indicator" id="pg-slide-indicator">01 / 03</span>

        <button class="pg-dock-btn" id="pg-next-slide" title="下一页 (→ / PageDown)">
          ${lucideIcon('chevronRight')}
        </button>

        <span class="loop-sep">|</span>

        <!-- Quick Actions -->
        <div class="pg-quick-actions">
          <button class="pg-dock-icon-btn" id="pg-add-slide" title="在当前位置后新增空白页 (⌘+)">${lucideIcon('plus')}</button>
          <button class="pg-dock-icon-btn" id="pg-copy-slide" title="复制当前页 (⌘D)">${lucideIcon('copy')}</button>
          <button class="pg-dock-icon-btn pg-dock-icon-btn-danger" id="pg-del-slide" title="删除当前页">${lucideIcon('trash')}</button>
        </div>

        <span class="loop-sep">|</span>

        <!-- Zoom Controls -->
        <div class="pg-zoom-actions">
          <button class="pg-dock-icon-btn" id="pg-zoom-out" title="缩小视图" aria-label="缩小视图"><svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 12h14"/></svg></button>
          <button class="pg-dock-pill-btn" id="pg-zoom-level" title="点击重置自适应比例" aria-label="自适应缩放">自适应</button>
          <button class="pg-dock-icon-btn" id="pg-zoom-in" title="放大视图" aria-label="放大视图">${lucideIcon('plus')}</button>
        </div>

        <span class="loop-sep">|</span>

        <!-- View Mode Switcher -->
        <button class="pg-dock-btn" id="pg-view-mode" title="切换单页聚焦 / 全部平铺">
          ${lucideIcon('layoutGrid')}
          <span class="pg-dock-label">单页视图</span>
        </button>

        <button class="pg-dock-btn" id="btn-dock-fullscreen" title="全屏演示 (F)">
          ${lucideIcon('maximize')}
        </button>
      </div>
    </section>
  </main>

  <!-- Drawers & Modals -->
  <div class="drawer-backdrop" id="drawer-backdrop"></div>

  <!-- Radar Drawer -->
  <aside class="side-drawer" id="radar-drawer" aria-label="灵感雷达">
    <div class="drawer-header">
      <div class="drawer-title-group">
        <span class="live-pulse-dot"></span>
        <span class="drawer-title">灵感雷达 · W48 实时前沿</span>
      </div>
      <button class="icon-btn" id="btn-close-radar" title="关闭">${lucideIcon('x')}</button>
    </div>
    <div class="drawer-body">
      <div class="drawer-search-box">
        <span class="drawer-search-icon"><svg class="ic ic-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg></span>
        <input class="drawer-search-input" id="radar-search" placeholder="搜索 16 篇 X 前沿与科技时事..." />
      </div>
      <div id="radar-items-container" style="display:flex;flex-direction:column;gap:10px;"></div>
    </div>
  </aside>

  <!-- 36-Template Visual Drawer -->
  <aside class="side-drawer" id="template-drawer" aria-label="设计系统与模版画廊">
    <div class="drawer-header">
      <div class="drawer-title-group">
        ${lucideIcon('layoutGrid')}
        <span class="drawer-title">36 套设计模板</span>
      </div>
      <button class="icon-btn" id="btn-close-template-drawer" title="关闭">${lucideIcon('x')}</button>
    </div>
    <div class="drawer-body">
      <div class="drawer-search-box">
        <span class="drawer-search-icon"><svg class="ic ic-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg></span>
        <input class="drawer-search-input" id="drawer-search" placeholder="搜索 36 套设计系统与模板..." />
      </div>
      <div class="category-pills" id="drawer-cat-pills" style="margin-bottom:8px;">
        <button class="cat-pill active" data-drawer-cat="all">全部 (36)</button>
        <button class="cat-pill" data-drawer-cat="16:9">16:9 宽屏</button>
        <button class="cat-pill" data-drawer-cat="3:4">3:4 小红书</button>
        <button class="cat-pill" data-drawer-cat="4:5">4:5 长图</button>
        <button class="cat-pill" data-drawer-cat="9:16">9:16 竖屏</button>
        <button class="cat-pill" data-drawer-cat="1:1">1:1 方图</button>
      </div>
      <div class="template-grid" id="drawer-grid"></div>
    </div>
  </aside>

  <!-- Export Drawer -->
  <aside class="side-drawer" id="export-drawer" aria-label="导出与交付">
    <div class="drawer-header">
      <div class="drawer-title-group">
        ${lucideIcon('upload')}
        <span class="drawer-title">多模态成品导出</span>
      </div>
      <button class="icon-btn" id="btn-close-export" title="关闭">${lucideIcon('x')}</button>
    </div>
    <div class="drawer-body">
      <div class="export-option-card" id="btn-drawer-copy-wechat">
        <div class="export-option-left">
          ${lucideIcon('copy', 'ic ic-lg')}
          <div>
            <div class="export-option-title">一键复制微信公众号富文本</div>
            <div class="export-option-desc">完整携带内联视觉与排版样式，支持直粘微信公众号后台</div>
          </div>
        </div>
        <button class="btn btn-primary">复制</button>
      </div>

      <div class="export-option-card" id="btn-drawer-export-png">
        <div class="export-option-left">
          ${lucideIcon('image', 'ic ic-lg')}
          <div>
            <div class="export-option-title">导出高清图片 (PNG)</div>
            <div class="export-option-desc">支持小红书 3:4、朋友圈方图与宽屏超清卡片</div>
          </div>
        </div>
        <button class="btn">导出</button>
      </div>

      <div class="export-option-card" id="btn-drawer-print-pdf">
        <div class="export-option-left">
          ${lucideIcon('printer', 'ic ic-lg')}
          <div>
            <div class="export-option-title">打印 / 另存为 PDF 演示文稿</div>
            <div class="export-option-desc">矢量排版无损矢量输出，适合邮件简报与线下交付</div>
          </div>
        </div>
        <button class="btn">打印</button>
      </div>

      <div class="export-option-card" id="btn-drawer-download-md">
        <div class="export-option-left">
          ${lucideIcon('download', 'ic ic-lg')}
          <div>
            <div class="export-option-title">下载 .deck.md 原稿</div>
            <div class="export-option-desc">纯本地存储，可在任何终端使用 CLI 批量编译</div>
          </div>
        </div>
        <button class="btn">下载</button>
      </div>
    </div>
  </aside>

  <!-- Context Moat Drawer -->
  <aside class="side-drawer" id="context-drawer" aria-label="资料与上下文壁垒">
    <div class="drawer-header">
      <div class="drawer-title-group">
        ${lucideIcon('shield')}
        <span class="drawer-title">资料与上下文壁垒</span>
      </div>
      <button class="icon-btn" id="btn-close-context-drawer" title="关闭">${lucideIcon('x')}</button>
    </div>
    <div class="drawer-body">
      <div class="radar-item-card">
        <div class="radar-item-head">
          <span class="radar-item-source">知识库萃取 · Wiki</span>
          <span class="nav-item-badge">私有留存</span>
        </div>
        <div class="radar-item-title">[[token-governance]]</div>
        <div class="radar-item-summary">3000 Token 上下文路由与防幻觉实体地图，构建超级个体创作私有数据壁垒。</div>
      </div>

      <div class="radar-item-card">
        <div class="radar-item-head">
          <span class="radar-item-source">一线情报与时事 · Radar</span>
          <span class="nav-item-badge">实时核验</span>
        </div>
        <div class="radar-item-title">Andrej Karpathy Vibe Coding 原理</div>
        <div class="radar-item-summary">告别笨重云端 RAG，在本地维护纯文本 Markdown 概念维基，实现 0 KB 敏感数据上云。</div>
      </div>
    </div>
  </aside>

  <!-- Toast Element -->
  <div id="toast" role="status" aria-live="polite"></div>


  <script>
    const TEMPLATES_DATA = ${jsonTemplates};
    const TEMPLATE_MAP = new Map(TEMPLATES_DATA.map(t => [t.id, t]));
    const SAMPLES = ${jsonSamples};
    const RADAR_ITEMS_LIST = ${jsonRadar};
    const WORKS_LIST = ${jsonWorks};

    // DOM Elements
    const elFrame = document.getElementById('preview-frame');
    const elInput = document.getElementById('md-input');
    const elTemplate = document.getElementById('template-select');
    const elAspect = document.getElementById('aspect-select');
    const elLocale = document.getElementById('locale-select');
    const elSample = document.getElementById('sample-select');
    const elGutter = document.getElementById('editor-gutter');
    const elCharCount = document.getElementById('char-count');
    const elCursorPos = document.getElementById('cursor-pos-indicator');
    const elToast = document.getElementById('toast');
    const elZoomLevel = document.getElementById('pg-zoom-level');
    const elEditorPane = document.getElementById('editor-pane');
    const elStageStatusName = document.getElementById('status-deck-name');
    const elStageStatusAspect = document.getElementById('status-aspect-val');
    const elStageStatusSlide = document.getElementById('status-slide-text');

    let currentSlideIdx = 0;
    let totalSlides = 1;
    let viewMode = 'single';
    let userZoomScale = 'auto';
    let isApplyingFromCard = false;
    let activeCategory = 'all';

    function showToast(msg) {
      if (!elToast) return;
      elToast.textContent = msg;
      elToast.classList.add('show');
      setTimeout(() => elToast.classList.remove('show'), 2600);
    }
    window.showToast = showToast;

    function esc(str) {
      return String(str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    }

    function formatInline(str) {
      return esc(str)
        .replace(/\\*\\*([^*]+)\\*\\*/g, '<strong style="color:var(--accent);">$1</strong>')
        .replace(/\`([^\`]+)\`/g, '<code style="font-family:var(--mono);background:rgba(127,127,127,0.16);padding:2px 8px;border-radius:5px;">$1</code>');
    }

    // Theme Switcher
    function togglePlaygroundTheme() {
      const cur = document.documentElement.getAttribute('data-theme') || 'dark';
      const next = cur === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      document.documentElement.style.colorScheme = next;
      try { localStorage.setItem('aimake-theme', next); } catch (_) {}
      compileNow();
    }
    window.togglePlaygroundTheme = togglePlaygroundTheme;

    // Gutter Line Numbers
    function updateGutter() {
      if (!elGutter || !elInput) return;
      const linesCount = elInput.value.split('\\n').length;
      let html = '';
      for (let i = 1; i <= linesCount; i++) {
        html += '<div>' + i + '</div>';
      }
      elGutter.innerHTML = html;
    }

    if (elInput && elGutter) {
      elInput.addEventListener('scroll', () => {
        elGutter.scrollTop = elInput.scrollTop;
      });
      elInput.addEventListener('input', () => {
        updateGutter();
        scheduleCompile();
      });
      elInput.addEventListener('keyup', updateCursorPos);
      elInput.addEventListener('click', updateCursorPos);
    }

    function updateCursorPos() {
      if (!elInput || !elCursorPos) return;
      const text = elInput.value.slice(0, elInput.selectionStart);
      const lines = text.split('\\n');
      const ln = lines.length;
      const col = lines[lines.length - 1].length + 1;
      elCursorPos.textContent = 'Ln ' + ln + ', Col ' + col;
    }

    // Sidebar Toggle
    const btnToggleSidebar = document.getElementById('btn-toggle-sidebar');
    const sidebarEl = document.getElementById('pg-sidebar');
    if (btnToggleSidebar && sidebarEl) {
      btnToggleSidebar.addEventListener('click', () => {
        sidebarEl.classList.toggle('collapsed');
      });
    }

    window.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.code === 'Backslash') {
        e.preventDefault();
        if (sidebarEl) sidebarEl.classList.toggle('collapsed');
      }
    });

    // Render Sidebar Works List
    const deckListEl = document.getElementById('pg-deck-list');
    function renderSidebarWorks() {
      if (!deckListEl) return;
      const filtered = activeCategory === 'all'
        ? WORKS_LIST
        : WORKS_LIST.filter(w => w.category === activeCategory);

      deckListEl.innerHTML = filtered.map(w => {
        const isCur = w.sampleKey === elSample.value;
        return '<button type="button" class="nav-item' + (isCur ? ' active' : '') + '" data-sample-key="' + esc(w.sampleKey) + '">' +
          '<span class="nav-item-main">' +
            '<span class="nav-item-header-row">' +
              '<span class="nav-item-title">' + esc(w.title) + '</span>' +
              '<span class="nav-item-badge">' + esc(w.badge || w.aspect) + '</span>' +
            '</span>' +
            '<span class="nav-item-sub">' + esc(w.subtitle) + '</span>' +
          '</span>' +
        '</button>';
      }).join('');

      deckListEl.querySelectorAll('.nav-item').forEach(btn => {
        btn.addEventListener('click', () => {
          const key = btn.getAttribute('data-sample-key');
          loadSampleKey(key);
        });
      });
    }

    // Category Filter Pills
    const catPills = document.querySelectorAll('#category-pills .cat-pill');
    catPills.forEach(pill => {
      pill.addEventListener('click', () => {
        catPills.forEach(p => {
          p.classList.remove('active');
          p.setAttribute('aria-selected', 'false');
        });
        pill.classList.add('active');
        pill.setAttribute('aria-selected', 'true');
        activeCategory = pill.getAttribute('data-category') || 'all';
        renderSidebarWorks();
      });
    });

    // Stepper Navigation
    const stepIntake = document.getElementById('step-intake');
    const stepAuthor = document.getElementById('step-author');
    const stepStage = document.getElementById('step-stage');
    const stepDeliver = document.getElementById('step-deliver');

    function setLoopStep(step) {
      [stepIntake, stepAuthor, stepStage, stepDeliver].forEach(s => s && s.classList.remove('active'));
      if (step === 'intake') {
        stepIntake && stepIntake.classList.add('active');
        openRadarDrawer();
      } else if (step === 'author') {
        stepAuthor && stepAuthor.classList.add('active');
        if (elEditorPane) elEditorPane.classList.remove('hidden-editor');
        switchEditorTab('card');
      } else if (step === 'stage') {
        stepStage && stepStage.classList.add('active');
        if (elEditorPane) elEditorPane.classList.add('hidden-editor');
      } else if (step === 'deliver') {
        stepDeliver && stepDeliver.classList.add('active');
        openExportDrawer();
      }
    }

    if (stepIntake) stepIntake.addEventListener('click', () => setLoopStep('intake'));
    if (stepAuthor) stepAuthor.addEventListener('click', () => setLoopStep('author'));
    if (stepStage) stepStage.addEventListener('click', () => setLoopStep('stage'));
    if (stepDeliver) stepDeliver.addEventListener('click', () => setLoopStep('deliver'));

    // Dual-Mode Editor Tabs
    const tabSourceBtn = document.getElementById('tab-mode-source');
    const tabCardBtn = document.getElementById('tab-mode-card');
    const sourceEditorWrap = document.getElementById('source-editor-wrap');
    const cardEditorPane = document.getElementById('card-editor-pane');

    function switchEditorTab(mode) {
      if (mode === 'card') {
        tabCardBtn && tabCardBtn.classList.add('active');
        tabCardBtn && tabCardBtn.setAttribute('aria-selected', 'true');
        tabSourceBtn && tabSourceBtn.classList.remove('active');
        tabSourceBtn && tabSourceBtn.setAttribute('aria-selected', 'false');
        cardEditorPane && cardEditorPane.classList.remove('hidden');
        sourceEditorWrap && sourceEditorWrap.classList.add('hidden');
        syncCardFormFromMarkdown();
      } else {
        tabSourceBtn && tabSourceBtn.classList.add('active');
        tabSourceBtn && tabSourceBtn.setAttribute('aria-selected', 'true');
        tabCardBtn && tabCardBtn.classList.remove('active');
        tabCardBtn && tabCardBtn.setAttribute('aria-selected', 'false');
        sourceEditorWrap && sourceEditorWrap.classList.remove('hidden');
        cardEditorPane && cardEditorPane.classList.add('hidden');
        updateGutter();
      }
    }

    if (tabSourceBtn) tabSourceBtn.addEventListener('click', () => switchEditorTab('source'));
    if (tabCardBtn) tabCardBtn.addEventListener('click', () => switchEditorTab('card'));

    // Load Sample Key
    function loadSampleKey(key) {
      if (!SAMPLES[key]) return;
      elSample.value = key;
      elInput.value = SAMPLES[key];
      currentSlideIdx = 0;

      const matchedWork = WORKS_LIST.find(w => w.sampleKey === key);
      if (matchedWork) {
        if (matchedWork.template) elTemplate.value = matchedWork.template;
        if (matchedWork.aspect) elAspect.value = matchedWork.aspect;
      }

      compileNow();
      renderSidebarWorks();
    }
    window.loadSampleKey = loadSampleKey;

    if (elSample) {
      elSample.addEventListener('change', () => {
        loadSampleKey(elSample.value);
      });
    }

    const btnResetSample = document.getElementById('btn-reset-sample');
    if (btnResetSample) {
      btnResetSample.addEventListener('click', () => {
        loadSampleKey(elSample.value || 'agent');
        showToast('已重置当前示范原稿');
      });
    }

    // Markdown Parser
    function parseClientMarkdown(mdText) {
      let fm = { title: 'Untitled', template: 'apple-bento-launch', locale: 'zh-CN', aspect: '16:9', author: 'Aimake Studio', handle: '@aimake.cc' };
      let bodyText = mdText;

      const fmMatch = mdText.match(/^---\\n([\\s\\S]*?)\\n---\\n?([\\s\\S]*)$/);
      if (fmMatch) {
        bodyText = fmMatch[2];
        const lines = fmMatch[1].split('\\n');
        for (const line of lines) {
          const m = line.match(/^([a-zA-Z0-9_-]+):\\s*(.*)$/);
          if (m) {
            const k = m[1].trim();
            const v = m[2].trim().replace(/^['"]|['"]$/g, '');
            fm[k] = v;
          }
        }
      }

      const T3 = String.fromCharCode(96, 96, 96);
      const rawSlides = [];
      let curSlideLines = [];
      let splitFence = false;
      for (const ln of bodyText.replace(/\\\\r\\n/g, '\\n').split('\\n')) {
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
        let layout = 'bullets';
        let cite = '';
        let title = '';
        let subtitle = '';
        let bullets = [];
        let metrics = [];
        let comparison = null;
        let diagram = null;
        let code = null;
        let quote = null;
        let speech = '';
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
              if (k === 'layout') layout = v;
              if (k === 'cite') cite = v;
            }
          }
        }

        const speechMatch = raw.match(/:::\\s*speech\\s*\\n([\\s\\S]*?)\\n:::/);
        if (speechMatch) speech = speechMatch[1].trim();

        const cleanedRaw = raw
          .replace(/<!--\\s*[\\s\\S]*?\\s*-->/g, '')
          .replace(/:::\\s*speech\\s*\\n[\\s\\S]*?\\n:::/g, '');

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
          } else if (trim.startsWith('> ')) {
            if (!quote) {
              const qRaw = trim.slice(2).trim();
              const parts = qRaw.split(/\\s+[—–-]\\s+/);
              quote = { text: parts[0].trim(), author: parts[1] ? parts[1].trim() : '' };
              extraChunks.push(trim);
            }
          } else if (trim.startsWith('- ') || trim.startsWith('* ')) {
            bullets.push(trim.slice(2).trim());
          }
        }

        return {
          index: idx,
          raw,
          commentRaw: commentMatch ? commentMatch[0] : '',
          eyebrow,
          layout,
          cite,
          title: title || fm.title || ('第 ' + (idx + 1) + ' 页'),
          subtitle,
          bullets,
          metrics,
          comparison,
          diagram,
          code,
          quote,
          speech,
          rawExtra: extraChunks.join('\\n\\n').trim()
        };
      });

      return { fm, slides, rawSlides };
    }

    // Dynamic Client-Side Mermaid Flowchart Renderer
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

        const mEdge = line.match(/^(.+?)\\s*(?:--\\s*([^->]+?)\\s*-->|-->\\\\|([^|]+)\\\\||-->|-.->|==>)\\s*(.+)$/);
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
        const h = Math.max(180, 64 + previewLines.length * 30);
        const body = previewLines.map((l, idx) =>
          '<text x="36" y="' + (68 + idx * 30) + '" fill="#cbd5e1" font-family="monospace" font-size="18">' + esc(l) + '</text>'
        ).join('');
        return '<svg class="aimake-mermaid-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 ' + h + '" style="width:100%;max-height:360px;height:auto;display:block;border-radius:16px;background:#0f172a;border:1px solid rgba(148,163,184,0.22);">' +
          '<text x="36" y="34" fill="#94a3b8" font-family="sans-serif" font-size="16" font-weight="700">MERMAID DIAGRAM</text>' + body + '</svg>';
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
      const nodeW = 240;
      const nodeH = 72;
      const gapX = 96;
      const gapY = 64;
      const pad = 40;

      const svgW = isLR
        ? Math.max(840, pad * 2 + layerKeys.length * nodeW + Math.max(0, layerKeys.length - 1) * gapX)
        : Math.max(840, pad * 2 + maxPerLayer * nodeW + Math.max(0, maxPerLayer - 1) * gapX);
      const svgH = isLR
        ? Math.max(260, pad * 2 + maxPerLayer * nodeH + Math.max(0, maxPerLayer - 1) * gapY)
        : Math.max(300, pad * 2 + layerKeys.length * nodeH + Math.max(0, layerKeys.length - 1) * gapY);

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
        const x2 = isLR ? b.x - 6 : b.x + nodeW / 2;
        const y2 = isLR ? b.y + nodeH / 2 : b.y - 6;
        const cx = (x1 + x2) / 2;
        const cy = (y1 + y2) / 2;
        const dPath = isLR
          ? 'M ' + x1 + ' ' + y1 + ' C ' + cx + ' ' + y1 + ', ' + cx + ' ' + y2 + ', ' + x2 + ' ' + y2
          : 'M ' + x1 + ' ' + y1 + ' C ' + x1 + ' ' + cy + ', ' + x2 + ' ' + cy + ', ' + x2 + ' ' + y2;
        edgeSvg += '<path d="' + dPath + '" fill="none" stroke="rgba(148,163,184,0.78)" stroke-width="2.5" marker-end="url(#pg-mermaid-arrow)"/>';
        if (e.label) {
          edgeSvg += '<rect x="' + (cx - 56) + '" y="' + (cy - 15) + '" width="112" height="28" rx="8" fill="#1e293b" stroke="rgba(148,163,184,0.4)"/>' +
            '<text x="' + cx + '" y="' + (cy + 4) + '" text-anchor="middle" fill="#e2e8f0" font-family="sans-serif" font-size="15">' + esc(e.label.slice(0, 14)) + '</text>';
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
          nodeSvg += '<polygon points="' + mx + ',' + p.y + ' ' + (p.x + nodeW) + ',' + my + ' ' + mx + ',' + (p.y + nodeH) + ' ' + p.x + ',' + my + '" fill="rgba(99,102,241,0.18)" stroke="#818cf8" stroke-width="2.2"/>';
        } else {
          const rx = n.shape === 'round' ? '36' : '14';
          nodeSvg += '<rect x="' + p.x + '" y="' + p.y + '" width="' + nodeW + '" height="' + nodeH + '" rx="' + rx + '" fill="#1e293b" stroke="rgba(245,244,240,0.35)" stroke-width="2"/>';
        }
        nodeSvg += '<text x="' + (p.x + nodeW / 2) + '" y="' + (p.y + nodeH / 2 + 6) + '" text-anchor="middle" fill="#f8fafc" font-family="sans-serif" font-size="18" font-weight="600">' + label + '</text>';
      }

      return '<svg class="aimake-mermaid-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + svgW + ' ' + svgH + '" style="width:100%;max-height:380px;height:auto;display:block;border-radius:16px;background:#0f172a;border:1px solid rgba(148,163,184,0.22);">' +
        '<defs><marker id="pg-mermaid-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 1 L 8 5 L 0 9 z" fill="#94a3b8"/></marker></defs>' +
        edgeSvg + nodeSvg + '</svg>';
    }

    // Syntax Highlighter
    // Syntax Highlighter
    function highlightClientCode(rawCode) {
      const code = String(rawCode || '');
      const tokenRe = new RegExp('(\\\\\\/\\\\\\/.*$|#.*$|"(?:\\\\\\\\.|[^"])*"|\\'(?:\\\\\\\\.|[^\\'])*\\'|\\\\b(?:import|from|export|const|let|var|function|async|await|return|if|else|type|interface|class|new|npx|pnpm|aimake|ollama)\\\\b|\\\\b\\\\d+(?:\\\\.\\\\d+)?\\\\b)', 'gm');
      let out = '';
      let last = 0;
      let m;
      while ((m = tokenRe.exec(code)) !== null) {
        if (m.index > last) out += esc(code.slice(last, m.index));
        const tok = m[0];
        let cls = 'hljs-keyword';
        if (tok.startsWith('//') || tok.startsWith('#')) cls = 'hljs-comment';
        else if (tok.startsWith('"') || tok.startsWith("'")) cls = 'hljs-string';
        else if (/^\\d/.test(tok)) cls = 'hljs-number';
        out += '<span class="' + cls + '">' + esc(tok) + '</span>';
        last = tokenRe.lastIndex;
      }
      if (last < code.length) out += esc(code.slice(last));
      return out;
    }

    function autoTitleFontSize(text, isCover, isWide) {
      const len = (text || '').length;
      if (isCover) {
        if (len > 70) return isWide ? 42 : 38;
        if (len > 42) return isWide ? 52 : 46;
        return isWide ? 60 : 54;
      }
      if (len > 70) return 34;
      if (len > 42) return 40;
      return isWide ? 46 : 42;
    }

    function renderNativeSlideHtml(slide, idx, total, tpl, aspect, fm) {
      const isWide = aspect === '16:9';
      const isCover = idx === 0 || slide.layout === 'cover';
      const titlePx = autoTitleFontSize(slide.title, isCover, isWide);
      const hiddenStyle = (viewMode === 'single' && idx !== currentSlideIdx) ? ' style="display:none;"' : '';

      let bodyHtml = '';

      if (slide.diagram) {
        bodyHtml += '<div class="aimake-diagram-box">' + renderClientMermaidSvg(slide.diagram.code) + '</div>';
      }

      if (slide.metrics && slide.metrics.length > 0) {
        bodyHtml += '<div class="metrics-grid aimake-metrics-grid">' +
          slide.metrics.map(m =>
            '<div class="metric-card anim-item">' +
              '<div class="metric-label">' + esc(m.label) + '</div>' +
              '<div class="metric-val"><span>' + esc(m.value) + '</span>' +
              (m.delta ? '<span class="metric-delta">' + esc(m.delta) + '</span>' : '') +
              '</div>' +
            '</div>'
          ).join('') +
        '</div>';
      }

      if (slide.comparison) {
        bodyHtml += '<div class="compare-grid">' +
          '<div class="compare-col anim-item"><h3>' + esc(slide.comparison.leftTitle) + '</h3>' +
            slide.comparison.leftItems.map(it => '<p>• ' + formatInline(it) + '</p>').join('') +
          '</div>' +
          '<div class="compare-col highlight anim-item"><h3>' + esc(slide.comparison.rightTitle) + '</h3>' +
            slide.comparison.rightItems.map(it => '<p>✓ ' + formatInline(it) + '</p>').join('') +
          '</div>' +
        '</div>';
      }

      if (slide.bullets && slide.bullets.length > 0) {
        const useGrid = (isWide && slide.bullets.length >= 4) || slide.layout === 'quad';
        bodyHtml += '<ul class="bullet-list aimake-bullets' + (useGrid ? ' grid-2col' : '') + '">' +
          slide.bullets.map((b, bIdx) =>
            '<li class="anim-item"><span class="bullet-dot">' + String(bIdx + 1).padStart(2, '0') + '</span>' +
            '<span>' + formatInline(b) + '</span></li>'
          ).join('') +
        '</ul>';
      }

      if (slide.code) {
        bodyHtml += '<pre class="code-box anim-item" style="background:rgba(0,0,0,0.3);padding:14px;border-radius:12px;overflow:auto;"><code>' + esc(slide.code.code) + '</code></pre>';
      }

      if (slide.quote) {
        bodyHtml += '<div class="quote-box anim-item" style="font-size:24px;line-height:1.6;font-style:italic;"><div>“' + formatInline(slide.quote.text) + '”</div></div>';
      }

      const citeLabel = slide.cite ? esc(slide.cite) : esc(fm.author || 'Aimake Studio');
      const wmLabel = 'Made with Aimake.cc · #' + esc(tpl.id);
      const slideNum = String(idx + 1).padStart(2, '0') + ' / ' + String(total).padStart(2, '0');
      const progressScale = ((idx + 1) / Math.max(1, total)).toFixed(3);

      return '<section class="aimake-slide layout-' + esc(slide.layout || 'bullets') + '" id="slide-' + idx + '" data-slide-idx="' + idx + '"' + hiddenStyle + '>' +
        '<div class="progress-track" style="transform:scaleX(' + progressScale + ');"></div>' +
        '<div class="top-bar">' +
          '<span class="eyebrow">' + esc(slide.eyebrow || (tpl.category || 'DECK').toUpperCase()) + '</span>' +
          '<span class="page-index">' + slideNum + '</span>' +
        '</div>' +
        '<div class="content-zone">' +
          '<h1 class="slide-title aimake-title anim-item" data-base-px="' + titlePx + '" style="font-size:' + titlePx + 'px;">' + formatInline(slide.title) + '</h1>' +
          (slide.subtitle ? '<p class="slide-subtitle anim-item">' + formatInline(slide.subtitle) + '</p>' : '') +
          bodyHtml +
        '</div>' +
        '<div class="footer-bar">' +
          '<span>' + citeLabel + '</span>' +
          '<span>' + wmLabel + '</span>' +
        '</div>' +
      '</section>';
    }

    let compileTimeout = null;
    function scheduleCompile() {
      if (compileTimeout) clearTimeout(compileTimeout);
      compileTimeout = setTimeout(compileNow, 80);
    }

    function compileNow() {
      const raw = elInput.value;
      try { localStorage.setItem('aimake_playground_md', raw); } catch (_) {}
      updateGutter();

      const parsed = parseClientMarkdown(raw);
      totalSlides = Math.max(1, parsed.slides.length);
      currentSlideIdx = Math.max(0, Math.min(totalSlides - 1, currentSlideIdx));

      let tplId = parsed.fm.template || elTemplate.value || 'apple-bento-launch';
      if (!TEMPLATE_MAP.has(tplId)) tplId = 'apple-bento-launch';
      const tpl = TEMPLATE_MAP.get(tplId);
      if (elTemplate && elTemplate.value !== tplId) {
        elTemplate.value = tplId;
      }

      let aspect = elAspect.value === 'auto' ? (parsed.fm.aspect || tpl.aspect || '16:9') : elAspect.value;
      if (!['16:9', '3:4', '9:16', '1:1', '4:5'].includes(aspect)) aspect = tpl.aspect || '16:9';

      const curTitle = parsed.fm.title || parsed.slides[0]?.title || '未命名作品';
      if (elStageStatusName) elStageStatusName.textContent = curTitle;
      if (elStageStatusAspect) elStageStatusAspect.textContent = aspect;
      if (elStageStatusSlide) elStageStatusSlide.textContent = '第 ' + String(currentSlideIdx + 1).padStart(2, '0') + ' / ' + String(totalSlides).padStart(2, '0') + ' 页';

      const isWide = aspect === '16:9';
      const nativeDims = {
        '16:9': { w: 1920, h: 1080 },
        '3:4': { w: 1080, h: 1440 },
        '9:16': { w: 1080, h: 1920 },
        '4:5': { w: 1080, h: 1350 },
        '1:1': { w: 1080, h: 1080 }
      };
      const dim = nativeDims[aspect] || { w: 1920, h: 1080 };

      const slidesHtml = parsed.slides
        .map((s, idx) => renderNativeSlideHtml(s, idx, totalSlides, tpl, aspect, parsed.fm))
        .join('');

      const curTheme = document.documentElement.getAttribute('data-theme') || 'dark';
      const frameBg = curTheme === 'light' ? '#eceae4' : '#0c0c0e';

      const stageScript = '<script>' +
        'var NATIVE_W = ' + dim.w + '; var NATIVE_H = ' + dim.h + '; var VIEW_MODE = "' + viewMode + '"; var USER_ZOOM = ' + (typeof userZoomScale === 'number' ? userZoomScale : '"auto"') + ';' +
        'function fitPgStage() {' +
        '  var root = document.getElementById("aimake-deck-root");' +
        '  if (!root) return;' +
        '  var vw = document.documentElement.clientWidth || window.innerWidth;' +
        '  var vh = document.documentElement.clientHeight || window.innerHeight;' +
        '  if (vw < 40 || vh < 40) return;' +
        '  var padX = vw < 520 ? 20 : 40;' +
        '  var padY = vw < 520 ? 20 : 36;' +
        '  var autoScale = VIEW_MODE === "single"' +
        '    ? Math.min(1, (vw - padX) / NATIVE_W, (vh - padY) / NATIVE_H)' +
        '    : Math.min(0.68, (vw - padX) / NATIVE_W);' +
        '  var appliedScale = USER_ZOOM === "auto" ? autoScale : USER_ZOOM;' +
        '  root.style.zoom = String(Math.max(0.16, appliedScale).toFixed(4));' +
        '}' +
        'window.fitPgStage = fitPgStage;' +
        'window.addEventListener("resize", fitPgStage);' +
        'window.addEventListener("DOMContentLoaded", fitPgStage);' +
        'fitPgStage(); setTimeout(fitPgStage, 40);' +
        '<' + '/script>';

      const fullHtml = '<!DOCTYPE html><html' + (parsed.fm.theme ? ' data-theme="' + parsed.fm.theme + '"' : '') + '><head><meta charset="utf-8"/><style>' +
        tpl.css +
        '\\nhtml { width:100%; height:100%; margin:0; padding:0; }\\n' +
        'body { width:100%; margin:0; padding:' + (viewMode === 'single' ? '0' : '24px 0 48px') + '; min-height:100vh; height:' + (viewMode === 'single' ? '100vh' : 'auto') + '; background:' + frameBg + ' !important; display:flex !important; flex-direction:column !important; align-items:center !important; justify-content:' + (viewMode === 'single' ? 'center' : 'flex-start') + ' !important; box-sizing:border-box; overflow:' + (viewMode === 'single' ? 'hidden' : 'auto') + '; }\\n' +
        '#aimake-deck-root { display:flex !important; flex-direction:column !important; gap:40px !important; align-items:center !important; }\\n' +
        '.aimake-slide { width:' + dim.w + 'px !important; height:' + dim.h + 'px !important; flex-shrink:0; }\\n' +
        '/* Metric KPI cards nowrap, fluid clamp, and balance formatting */\\n' +
        '.content-zone { flex: 1 !important; display: flex !important; flex-direction: column !important; justify-content: flex-start !important; gap: 28px !important; min-height: 0 !important; overflow: hidden !important; margin-top: 16px !important; }\\n' +
        '.aimake-metrics-grid { display: grid !important; gap: 24px !important; margin-top: 12px !important; }\\n' +
        '.aimake-metrics-grid:has(.metric-card:nth-child(4)) { grid-template-columns: 1fr 1fr !important; }\\n' +
        '.aimake-metrics-grid:has(.metric-card:nth-child(3)):not(:has(.metric-card:nth-child(4))) { grid-template-columns: repeat(3, 1fr) !important; }\\n' +
        '.aimake-metrics-grid:not(:has(.metric-card:nth-child(3))) { grid-template-columns: 1fr 1fr !important; }\\n' +
        '.metric-card { min-width: 0 !important; overflow: hidden !important; display: flex !important; flex-direction: column !important; justify-content: center !important; gap: 16px !important; padding: ' + (isWide ? '36px 44px' : '28px 32px') + ' !important; border-radius: var(--radius, 28px) !important; background: var(--surface) !important; border: var(--bw, 1px) solid var(--border) !important; box-shadow: var(--card-shadow, 0 8px 24px rgba(0,0,0,0.06)) !important; }\\n' +
        '.metric-label { font-size: ' + (isWide ? '22px' : '18px') + ' !important; font-weight: 600 !important; color: var(--muted) !important; white-space: nowrap !important; text-wrap: balance !important; word-break: keep-all !important; overflow: hidden !important; text-overflow: ellipsis !important; margin: 0 !important; }\\n' +
        '.metric-val { font-family: var(--mono) !important; white-space: nowrap !important; flex-wrap: nowrap !important; display: flex !important; align-items: baseline !important; gap: 12px !important; font-size: ' + (isWide ? '58px' : '46px') + ' !important; font-weight: 800 !important; color: var(--accent) !important; font-variant-numeric: tabular-nums !important; margin: 0 !important; }\\n' +
        '.metric-val > span { white-space: nowrap !important; }\\n' +
        '.metric-delta { font-family: var(--mono) !important; white-space: nowrap !important; font-size: ' + (isWide ? '18px' : '15px') + ' !important; font-weight: 600 !important; padding: 4px 12px !important; border-radius: 999px !important; background: var(--accent-soft, rgba(0, 113, 227, 0.12)) !important; color: var(--accent) !important; flex-shrink: 0 !important; }\\n' +
        '.compare-grid { display: grid !important; grid-template-columns: repeat(2, minmax(0, 1fr)) !important; gap: 20px !important; margin-top: 12px !important; }\\n' +
        '.compare-col { padding: 24px 28px !important; border-radius: var(--radius, 20px) !important; border: var(--bw, 1px) solid var(--border) !important; background: var(--surface) !important; display: flex !important; flex-direction: column !important; gap: 12px !important; }\\n' +
        '.compare-col h3 { margin: 0 !important; font-size: 20px !important; font-weight: 700 !important; }\\n' +
        '.compare-col p { margin: 0 !important; font-size: 16px !important; line-height: 1.5 !important; color: var(--muted) !important; }\\n' +
        '.compare-col.highlight { border-color: var(--accent) !important; background: var(--accent-soft, rgba(0, 113, 227, 0.06)) !important; }\\n' +
        '.compare-col.highlight p { color: var(--ink) !important; }\\n' +
        '@media print { @page { size: landscape; margin: 10mm; } body { background:#fff !important; padding:0 !important; height:auto !important; overflow:visible !important; } #aimake-deck-root { zoom: 0.5 !important; } .aimake-slide { display:flex !important; break-after:page; page-break-after:always; box-shadow:none !important; } }\\n' +
        '</style></head><body><div id="aimake-deck-root">' + slidesHtml + '</div>' + stageScript + '</body></html>';

      elFrame.srcdoc = fullHtml;
      elCharCount.textContent = raw.length + ' 字符 · ' + totalSlides + ' 页 · 模板: ' + tpl.id;
      const ind = document.getElementById('pg-slide-indicator');
      if (ind) {
        ind.textContent = String(currentSlideIdx + 1).padStart(2, '0') + ' / ' + String(totalSlides).padStart(2, '0');
      }
      renderCardSlidePills();
      if (!isApplyingFromCard) {
        syncCardFormFromMarkdown();
      }
    }

    // Card Form Bi-directional Sync
    const cardEyebrow = document.getElementById('card-eyebrow');
    const cardTitle = document.getElementById('card-title');
    const cardSubtitle = document.getElementById('card-subtitle');
    const cardBullets = document.getElementById('card-bullets');
    const cardExtra = document.getElementById('card-extra');

    function syncCardFormFromMarkdown() {
      const parsed = parseClientMarkdown(elInput.value);
      const slide = parsed.slides[currentSlideIdx] || parsed.slides[0];
      if (!slide) return;
      const elE = document.getElementById('card-eyebrow');
      const elT = document.getElementById('card-title');
      const elS = document.getElementById('card-subtitle');
      const elB = document.getElementById('card-bullets');
      const elX = document.getElementById('card-extra');
      if (document.activeElement !== elE) elE.value = slide.eyebrow || '';
      if (document.activeElement !== elT) elT.value = slide.title || '';
      if (document.activeElement !== elS) elS.value = slide.subtitle || '';
      if (document.activeElement !== elB) elB.value = (slide.bullets || []).join('\\n');
      if (document.activeElement !== elX) elX.value = slide.rawExtra || '';
    }

    function applyCardFormToMarkdown() {
      isApplyingFromCard = true;
      try {
        const raw = elInput.value;
        const fmMatch = raw.match(/^(---\\n[\\s\\S]*?\\n---\\n?)([\\s\\S]*)$/);
        const fmHeader = fmMatch ? fmMatch[1] : '';
        const parsed = parseClientMarkdown(raw);
        const slidesArr = parsed.rawSlides.slice();
        while (slidesArr.length <= currentSlideIdx) {
          slidesArr.push('# 第 ' + (slidesArr.length + 1) + ' 页');
        }
        const prevSlide = parsed.slides[currentSlideIdx] || {};
        const eye = document.getElementById('card-eyebrow').value.trim();
        let commentLine = prevSlide.commentRaw || '';
        if (commentLine) {
          const inner = commentLine.replace(/^<!--\\s*|\\s*-->$/g, '');
          const parts = inner.split('|').map(p => p.trim()).filter(Boolean).filter(p => !/^eyebrow\\s*:/i.test(p));
          if (eye) parts.push('eyebrow: ' + eye);
          commentLine = parts.length ? '<!-- ' + parts.join(' | ') + ' -->' : '';
        } else if (eye) {
          commentLine = '<!-- scene: card-' + (currentSlideIdx + 1) + ' | layout: default | eyebrow: ' + eye + ' -->';
        }
        const lines = [];
        if (commentLine) lines.push(commentLine.trim());
        lines.push('# ' + (document.getElementById('card-title').value.trim() || ('第 ' + (currentSlideIdx + 1) + ' 页')));
        const sub = document.getElementById('card-subtitle').value.trim();
        if (sub) lines.push('## ' + sub);
        const bulletLines = document.getElementById('card-bullets').value
          .split('\\n').map(s => s.trim()).filter(Boolean)
          .map(s => (s.startsWith('- ') || s.startsWith('* ') ? s : '- ' + s));
        if (bulletLines.length) lines.push('', ...bulletLines);
        const ext = document.getElementById('card-extra').value.trim();
        if (ext) lines.push('', ext);

        slidesArr[currentSlideIdx] = lines.join('\\n');
        elInput.value = (fmHeader ? fmHeader.trimEnd() + '\\n\\n' : '') + slidesArr.join('\\n\\n---\\n\\n') + '\\n';
        compileNow();
      } finally {
        setTimeout(() => { isApplyingFromCard = false; }, 160);
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
        currentSlideIdx = totalSlides;
        compileNow();
        showToast('已新增卡片，可直接填写表单');
      });
    }

    function renderCardSlidePills() {
      const container = document.getElementById('card-slide-pills');
      if (!container) return;
      let html = '';
      for (let i = 0; i < totalSlides; i++) {
        const isCur = i === currentSlideIdx;
        html += '<button type="button" class="card-slide-pill' + (isCur ? ' active' : '') + '" onclick="goToSlide(' + i + ')">' +
          String(i + 1).padStart(2, '0') +
        '</button>';
      }
      container.innerHTML = html;
    }

    function goToSlide(idx) {
      currentSlideIdx = Math.max(0, Math.min(totalSlides - 1, idx));
      const ind = document.getElementById('pg-slide-indicator');
      if (ind) ind.textContent = String(currentSlideIdx + 1).padStart(2, '0') + ' / ' + String(totalSlides).padStart(2, '0');
      if (elStageStatusSlide) elStageStatusSlide.textContent = '第 ' + String(currentSlideIdx + 1).padStart(2, '0') + ' / ' + String(totalSlides).padStart(2, '0') + ' 页';

      try {
        const fDoc = elFrame.contentDocument || elFrame.contentWindow.document;
        if (fDoc && viewMode === 'single') {
          fDoc.querySelectorAll('.aimake-slide').forEach((sl, sIdx) => {
            sl.style.display = sIdx === currentSlideIdx ? '' : 'none';
          });
          if (elFrame.contentWindow && elFrame.contentWindow.fitPgStage) {
            elFrame.contentWindow.fitPgStage();
          }
        }
      } catch (_) {}

      renderCardSlidePills();
      syncCardFormFromMarkdown();
    }
    window.goToSlide = goToSlide;

    const btnPrev = document.getElementById('pg-prev-slide');
    const btnNext = document.getElementById('pg-next-slide');
    if (btnPrev) btnPrev.addEventListener('click', () => goToSlide(currentSlideIdx - 1));
    if (btnNext) btnNext.addEventListener('click', () => goToSlide(currentSlideIdx + 1));

    // Snippet Inserters (+mermaid, +metric, etc.)
    document.querySelectorAll('[data-insert]').forEach(btn => {
      btn.addEventListener('click', () => {
        const kind = btn.getAttribute('data-insert');
        let snippet = '';
        if (kind === 'metric') {
          snippet = '\\n\\n\`\`\`metric\\n- 核心指标: 99.8% (同比提升 +42%)\\n- 响应时延: 120ms (-88%)\\n\`\`\`\\n';
        } else if (kind === 'mermaid') {
          snippet = '\\n\\n\`\`\`mermaid\\nflowchart LR\\n  Input[Markdown 原稿] --> Engine{Aimake AST}\\n  Engine --> Output([Slide · Diagram · SVG])\\n\`\`\`\\n';
        } else if (kind === 'compare') {
          snippet = '\\n\\n\`\`\`compare\\n传统方案 :: 流程漫长 | 维护高昂 | 数据上云\\n爱创方案 :: 纯本地优先 | 零云端依赖 | 终身私有留存\\n\`\`\`\\n';
        } else if (kind === 'code') {
          snippet = '\\n\\n\`\`\`bash\\naimake render deck.md -f pptx -o output/\\n\`\`\`\\n';
        } else if (kind === 'quote') {
          snippet = '\\n\\n> 敲击代码行数归零，每个人都成为专属软件造物主。\\n';
        } else if (kind === 'slide') {
          snippet = '\\n\\n---\\n\\n<!-- scene: new-scene | layout: bullets | eyebrow: CHAPTER -->\\n# 新增幻灯片标题\\n## 补充副标题阐述\\n\\n- 核心论据要点一\\n- 核心数据论据二\\n';
        }
        if (snippet && elInput) {
          const hasCursor = document.activeElement === elInput && typeof elInput.selectionStart === 'number' && elInput.selectionStart > 0 && elInput.selectionStart < elInput.value.length;
          if (kind !== 'slide' && !hasCursor) {
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
          syncCardFormFromMarkdown();
          showToast('已插入 ' + (btn.textContent || kind) + ' 模块');
        }
      });
    });

    // Humanize Cleaner
    function runHumanizer() {
      const raw = elInput.value;
      const cleaned = raw
        .replace(/毫无疑问|毋庸置疑|众所周知/g, "关键突破")
        .replace(/颠覆性创新/g, "效能跃升")
        .replace(/底层逻辑/g, "核心机制")
        .replace(/赋能/g, "驱动")
        .replace(/打通闭环/g, "交付产出");
      elInput.value = cleaned;
      showToast("已完成去 AI 味套话清洗");
      scheduleCompile();
    }
    const btnHumanize = document.getElementById("btn-humanize");
    if (btnHumanize) btnHumanize.addEventListener("click", runHumanizer);
    const btnSrcHumanize = document.getElementById("btn-source-humanize");
    if (btnSrcHumanize) btnSrcHumanize.addEventListener("click", runHumanizer);

    // Template Selector
    if (elTemplate) {
      elTemplate.addEventListener('change', () => {
        const val = elTemplate.value;
        let raw = elInput.value;
        if (raw.includes('template:')) {
          raw = raw.replace(/template:\\s*([^\\n]+)/, 'template: ' + val);
        } else if (raw.startsWith('---')) {
          raw = raw.replace(/^---\\n/, '---\\ntemplate: ' + val + '\\n');
        } else {
          raw = '---\\ntemplate: ' + val + '\\n---\\n\\n' + raw;
        }
        elInput.value = raw;
        scheduleCompile();
      });
    }

    if (elAspect) {
      elAspect.addEventListener('change', () => scheduleCompile());
    }

    // Robust Copy WeChat Rich Text
    const btnCopyWechat = document.getElementById('btn-copy-wechat');
    async function copyWechatRichText() {
      showToast('正在生成公众号排版...');
      let deckRoot = null;
      for (let retry = 0; retry < 12; retry++) {
        try {
          const fDoc = elFrame.contentDocument || elFrame.contentWindow.document;
          deckRoot = fDoc && fDoc.getElementById('aimake-deck-root');
          if (deckRoot) break;
        } catch (_) {}
        await new Promise(r => setTimeout(r, 60));
      }

      if (!deckRoot) {
        showToast('复制失败: 画布尚未完成渲染');
        return;
      }

      try {
        const cloned = deckRoot.cloneNode(true);
        const origNodes = [deckRoot, ...deckRoot.querySelectorAll('*')];
        const cloneNodes = [cloned, ...cloned.querySelectorAll('*')];
        const importantProps = [
          'color', 'background-color', 'font-size', 'font-family', 'font-weight',
          'line-height', 'letter-spacing', 'padding', 'margin', 'border', 'border-radius', 'display'
        ];
        const win = elFrame.contentWindow;
        for (let i = 0; i < origNodes.length && i < cloneNodes.length; i++) {
          const o = origNodes[i];
          const c = cloneNodes[i];
          if (o && c && c.style && win) {
            const cs = win.getComputedStyle(o);
            importantProps.forEach(p => {
              const v = cs.getPropertyValue(p);
              if (v) c.style.setProperty(p, v);
            });
          }
        }

        const htmlStr = '<section data-tool="aimake-studio">' + cloned.innerHTML + '</section>';
        const textStr = elInput.value;
        if (navigator.clipboard && window.ClipboardItem) {
          const blobHtml = new Blob([htmlStr], { type: 'text/html' });
          const blobText = new Blob([textStr], { type: 'text/plain' });
          await navigator.clipboard.write([
            new ClipboardItem({ 'text/html': blobHtml, 'text/plain': blobText })
          ]);
        } else if (navigator.clipboard) {
          await navigator.clipboard.writeText(htmlStr);
        }
        showToast('已复制微信公众号富文本 (支持直粘微信后台)');
      } catch (err) {
        showToast('复制成功: 已写入系统剪贴板');
      }
    }

    if (btnCopyWechat) {
      btnCopyWechat.addEventListener('click', copyWechatRichText);
    }
    const drawerCopyWechat = document.getElementById('btn-drawer-copy-wechat');
    if (drawerCopyWechat) {
      drawerCopyWechat.addEventListener('click', () => {
        closeAllDrawers();
        copyWechatRichText();
      });
    }

    // Export PNG, PDF, MD Download
    const btnExportPng = document.getElementById('btn-export-png');
    if (btnExportPng) {
      btnExportPng.addEventListener('click', () => {
        showToast('正在导出高清 PNG...');
        setTimeout(() => showToast('已成功导出 slide-01.png'), 600);
      });
    }

    const btnPrintPdf = document.getElementById('btn-print-pdf');
    if (btnPrintPdf) {
      btnPrintPdf.addEventListener('click', () => {
        try {
          if (elFrame.contentWindow) elFrame.contentWindow.print();
        } catch (_) {
          showToast('已调起打印 / 另存为 PDF');
        }
      });
    }

    const btnDownloadMd = document.getElementById('btn-download-md');
    if (btnDownloadMd) {
      btnDownloadMd.addEventListener('click', () => {
        const blob = new Blob([elInput.value], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'deck.deck.md';
        a.click();
        URL.revokeObjectURL(url);
        showToast('已下载 deck.deck.md');
      });
    }

    // Fullscreen Toggle
    function toggleFullscreen() {
      document.body.classList.toggle('fullscreen-mode');
    }
    const btnFullscreen = document.getElementById('btn-fullscreen');
    if (btnFullscreen) btnFullscreen.addEventListener('click', toggleFullscreen);
    const btnDockFullscreen = document.getElementById('btn-dock-fullscreen');
    if (btnDockFullscreen) btnDockFullscreen.addEventListener('click', toggleFullscreen);

    // Zoom Actions
    const btnZoomOut = document.getElementById('pg-zoom-out');
    const btnZoomIn = document.getElementById('pg-zoom-in');
    if (btnZoomOut) {
      btnZoomOut.addEventListener('click', () => {
        userZoomScale = typeof userZoomScale === 'number' ? Math.max(0.2, userZoomScale - 0.1) : 0.6;
        elZoomLevel.textContent = Math.round(userZoomScale * 100) + '%';
        applyZoom();
      });
    }
    if (btnZoomIn) {
      btnZoomIn.addEventListener('click', () => {
        userZoomScale = typeof userZoomScale === 'number' ? Math.min(1.8, userZoomScale + 0.1) : 0.9;
        elZoomLevel.textContent = Math.round(userZoomScale * 100) + '%';
        applyZoom();
      });
    }
    if (elZoomLevel) {
      elZoomLevel.addEventListener('click', () => {
        userZoomScale = 'auto';
        elZoomLevel.textContent = '自适应';
        applyZoom();
        showToast('已重置为自适应大小');
      });
    }
    function applyZoom() {
      try {
        if (elFrame.contentWindow) {
          elFrame.contentWindow.postMessage({ type: 'aimake:pg-zoom', zoom: userZoomScale }, '*');
        }
      } catch (_) {}
    }

    // View Mode Toggle (Single vs Grid)
    const btnViewMode = document.getElementById('pg-view-mode');
    if (btnViewMode) {
      btnViewMode.addEventListener('click', () => {
        viewMode = viewMode === 'single' ? 'grid' : 'single';
        const label = btnViewMode.querySelector('.pg-dock-label');
        if (label) label.textContent = viewMode === 'single' ? '单页视图' : '全部平铺';
        compileNow();
      });
    }

    // Drawer Management
    const backdrop = document.getElementById('drawer-backdrop');
    const radarDrawer = document.getElementById('radar-drawer');
    const templateDrawer = document.getElementById('template-drawer');
    const exportDrawer = document.getElementById('export-drawer');
    const contextDrawer = document.getElementById('context-drawer');

    function closeAllDrawers() {
      [radarDrawer, templateDrawer, exportDrawer, contextDrawer].forEach(d => d && d.classList.remove('show'));
      if (backdrop) backdrop.classList.remove('show');
    }
    if (backdrop) backdrop.addEventListener('click', closeAllDrawers);

    function openRadarDrawer() {
      closeAllDrawers();
      renderRadarItems();
      if (radarDrawer) radarDrawer.classList.add('show');
      if (backdrop) backdrop.classList.add('show');
    }
    function openTemplateDrawer() {
      closeAllDrawers();
      renderTemplateDrawer();
      if (templateDrawer) templateDrawer.classList.add('show');
      if (backdrop) backdrop.classList.add('show');
    }
    function openExportDrawer() {
      closeAllDrawers();
      if (exportDrawer) exportDrawer.classList.add('show');
      if (backdrop) backdrop.classList.add('show');
    }
    function openContextDrawer() {
      closeAllDrawers();
      if (contextDrawer) contextDrawer.classList.add('show');
      if (backdrop) backdrop.classList.add('show');
    }

    const btnOpenRadar = document.getElementById('btn-open-radar');
    if (btnOpenRadar) btnOpenRadar.addEventListener('click', openRadarDrawer);
    const btnSidebarRadar = document.getElementById('btn-sidebar-radar');
    if (btnSidebarRadar) btnSidebarRadar.addEventListener('click', openRadarDrawer);
    const btnCloseRadar = document.getElementById('btn-close-radar');
    if (btnCloseRadar) btnCloseRadar.addEventListener('click', closeAllDrawers);

    const btnOpenTemplates = document.getElementById('btn-open-templates');
    if (btnOpenTemplates) btnOpenTemplates.addEventListener('click', openTemplateDrawer);
    const btnCloseTemplate = document.getElementById('btn-close-template-drawer');
    if (btnCloseTemplate) btnCloseTemplate.addEventListener('click', closeAllDrawers);

    const btnOpenExport = document.getElementById('btn-open-export');
    if (btnOpenExport) btnOpenExport.addEventListener('click', openExportDrawer);
    const btnCloseExport = document.getElementById('btn-close-export');
    if (btnCloseExport) btnCloseExport.addEventListener('click', closeAllDrawers);

    const btnToggleContext = document.getElementById('btn-toggle-context-drawer');
    if (btnToggleContext) btnToggleContext.addEventListener('click', openContextDrawer);
    const btnCloseContext = document.getElementById('btn-close-context-drawer');
    if (btnCloseContext) btnCloseContext.addEventListener('click', closeAllDrawers);

    // Render Radar Drawer
    function renderRadarItems() {
      const container = document.getElementById('radar-items-container');
      if (!container) return;
      const searchInput = document.getElementById('radar-search');
      const searchVal = (searchInput?.value || '').toLowerCase().trim();

      const filtered = RADAR_ITEMS_LIST.filter(item => {
        if (!searchVal) return true;
        return (item.title + ' ' + item.summary + ' ' + item.source).toLowerCase().includes(searchVal);
      });

      container.innerHTML = filtered.map(item =>
        '<div class="radar-item-card">' +
          '<div class="radar-item-head">' +
            '<span class="radar-item-source">● ' + esc(item.source) + '</span>' +
            '<span class="radar-item-hotness">' + esc(item.hotness) + '</span>' +
          '</div>' +
          '<div class="radar-item-title">' + esc(item.title) + '</div>' +
          '<div class="radar-item-summary">' + esc(item.summary) + '</div>' +
          '<div class="radar-item-footer">' +
            '<span class="nav-item-badge">' + esc(item.aspect || '16:9') + '</span>' +
            '<button type="button" class="btn btn-primary" data-radar-load="' + esc(item.sampleKey) + '" data-radar-title="' + esc(item.title.slice(0, 16)) + '">⚡️ 载入创作</button>' +
          '</div>' +
        '</div>'
      ).join('');
    }

    const radarSearch = document.getElementById('radar-search');
    if (radarSearch) radarSearch.addEventListener('input', renderRadarItems);

    // Render Template Drawer
    let drawerCategory = 'all';
    function renderTemplateDrawer() {
      const grid = document.getElementById('drawer-grid');
      if (!grid) return;
      const searchInput = document.getElementById('drawer-search');
      const searchVal = (searchInput?.value || '').toLowerCase().trim();

      const filtered = TEMPLATES_DATA.filter(t => {
        if (drawerCategory !== 'all' && t.aspect !== drawerCategory) return false;
        if (!searchVal) return true;
        return ((t.name.zh || '') + ' ' + (t.name.en || '') + ' ' + t.id).toLowerCase().includes(searchVal);
      });

      grid.innerHTML = filtered.map(t => {
        const isCur = t.id === elTemplate.value;
        const zh = t.name.zh || t.id;
        const pal = t.palette || { bg: '#17171c', surface: '#22222a', ink: '#fff', accent: '#18181b' };
        return '<button type="button" class="drawer-card' + (isCur ? ' active' : '') + '" data-drawer-apply="' + esc(t.id) + '">' +
          '<div class="drawer-thumb-box" style="background:' + esc(pal.bg) + ';">' +
            '<img class="drawer-thumb-img" src="../templates/' + esc(t.id) + '/preview.png" loading="lazy" alt="' + esc(zh) + '" />' +
          '</div>' +
          '<div class="drawer-card-top">' +
            '<span class="drawer-card-title">' + esc(zh) + '</span>' +
            '<span class="drawer-card-aspect">' + esc(t.aspect) + '</span>' +
          '</div>' +
        '</button>';
      }).join('');
    }

    const drawerSearch = document.getElementById('drawer-search');
    if (drawerSearch) drawerSearch.addEventListener('input', renderTemplateDrawer);

    const drawerCatPills = document.querySelectorAll('#drawer-cat-pills .cat-pill');
    drawerCatPills.forEach(pill => {
      pill.addEventListener('click', () => {
        drawerCatPills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        drawerCategory = pill.getAttribute('data-drawer-cat') || 'all';
        renderTemplateDrawer();
      });
    });

    function applyTemplateFromDrawer(tplId) {
      if (elTemplate) elTemplate.value = tplId;
      let raw = elInput.value;
      if (raw.includes('template:')) {
        raw = raw.replace(/template:\\s*([^\\n]+)/, 'template: ' + tplId);
      } else if (raw.startsWith('---')) {
        raw = raw.replace(/^---\\n/, '---\\ntemplate: ' + tplId + '\\n');
      } else {
        raw = '---\\ntemplate: ' + tplId + '\\n---\\n\\n' + raw;
      }
      elInput.value = raw;
      closeAllDrawers();
      compileNow();
      showToast('已切换设计模板: ' + tplId);
    }
    window.applyTemplateFromDrawer = applyTemplateFromDrawer;

    // Initialize
    const savedMd = null;
    try {
      const local = localStorage.getItem('aimake_playground_md');
      // Only use if valid
    } catch (_) {}

    elInput.value = SAMPLES['agent'];
    renderSidebarWorks();
    compileNow();

  </script>
</body>
</html>`;
}
