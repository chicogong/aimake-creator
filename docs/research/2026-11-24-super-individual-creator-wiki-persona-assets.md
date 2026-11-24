# 超级个体个人 IP 创作系统与知识连贯性技术方案
## （Wiki + Persona + Asset Store）

**文件版本**：v1.0.0  
**制定日期**：2026-11-24  
**责任归属**：Aimake Studio 核心架构设计组 (`@agent_video`)  
**权威索引**：作为 `products/aimake` 与 `aimake-labs/aimake-studio` 关于超级个体数字分身、知识底座与私有资产库演进的直接落地技术规约。

---

## 一、战略背景与超级个体核心痛点

超级个体（Solopreneurs、独立开发者、专家型创作者）在当前 AI 创作浪潮中面临三大结构性困境：

1. **记忆割裂与“失忆式”冷启动**：
   创作者在本地 Obsidian、Logseq 或 Markdown 知识库中沉淀了多年深度思考与案例笔记，但现有的各类 AI 创作工具（如通用 ChatBot、在线 PPT/视频生成器）缺乏上下文粘性，每一次对话都如同与失忆症患者沟通，反复吐出千篇一律的“AI 塑料味套话”（AI Slop），严重稀释创作者独特的思想密度。
2. **虚假繁荣与证据幻觉（Hallucination）**：
   传统 RAG 方案暴力切块向量化，破坏了论点的上下文因果链；且无法区分“不可辩驳的核心事实”与“AI 自行脑补的逻辑推断”，一旦把假数据渲染进 60fps 视频或正式发布稿，对创作者的专业 IP 形象是致命打击。
3. **视觉与语言风格失焦**：
   缺乏统一的品牌设计基因（Brand DNA）与排版规范，生成的卡片东拼西凑；同时，创作者缺少一个集中托管私有出镜人像、实操录屏切片（B-Roll）、专属音效的本地轻量资产中枢（Asset Store），导致每次制作视频或长文仍需大量手动翻找素材。

为此，Aimake Studio 必须在底层打通 **Wiki（知识底座与防幻觉溯源）+ Persona（语言与排版风格 DNA）+ Asset Store（专属多媒体资产库）** 的黄金三元组体系。

---

## 二、模块一：本地私有知识库向数字分身记忆的高效转化

针对创作者海量的本地 Markdown / Obsidian Vault，Aimake 确立 **“分层记忆映射、增量复利反哺、权限严格隔离”** 的三步转化架构：

```
┌────────────────────────────────────────────────────────────────────────┐
│                   创作者本地私有知识库 (Obsidian Vault / 本地目录)          │
│   daily-notes/       concepts/       projects/       archives/        │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ ① aimake wiki intake (增量扫描与图谱解构)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│               Aimake 分层知识中枢 (Bounded Context Memory)               │
│                                                                        │
│   ┌───────────────────────────┐    ┌───────────────────────────────┐   │
│   │  L1 全局认知骨架 (Index)   │    │   L2 原子常青卡片 (Evergreen)  │   │
│   │  wiki/index.md (<=3k tok) │───►│   wiki/*.md (<=800 tok/卡片)  │   │
│   │  掌握实体图谱与主题拓扑   │    │   严密内联事实坐标与因果链条      │   │
│   └───────────────────────────┘    └───────────────────────────────┘   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ ② 驱动创作 (Brief -> Deck -> Video)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   创作者数字分身交付物 (5 Native Deliverables)          │
│   • 小红书卡片 (PNG)     • 微信深度长文 (HTML)    • 领英 Carousel (PDF)   │
│   • 可编辑演说 (PPTX)    • 60fps 动效短视频 (MP4) • 剪映草稿 (CapCut)     │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ ③ 创作即沉淀，发布即复利 (Compounding Loop)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│               知识沉淀反哺 (wiki/log.md + outputs/ + Receipts)          │
│   • 记录成片版本哈希     • 沉淀新增金句与观点     • 提高常引事实权重      │
└────────────────────────────────────────────────────────────────────────┘
```

### 1. 两级分层记忆模型（L1 Index + L2 Evergreen Notes）
- **L1 全局索引（Index）严格限额**：
  保持 `wiki/index.md` 绝对不超 **3,000 Tokens**。它仅承载创作者核心领域定义、关键实体词条映射表、以及主要论点索引。它作为每一次 Agent 交互必须注入的“第一道认知地图”。
- **L2 原子常青卡片（Evergreen Cards）**：
  单篇卡片严格限制在 **800 Tokens** 以内，采用标准的 Wikilink 双向引用（`[[concept]]`）。每张卡片专注于解答一个独立命题，并显式记录该命题的首次沉淀时间与修订历史。

### 2. 创作复利闭环（The Compounding Flywheel）
- **创作即沉淀**：当创作者使用 `aimake create` 完成一份 `.deck.md` 或视频脚本时，其中产生的新提炼论据，经由提示词提示自动归档为新的 L2 卡片候选。
- **发布即归档（Outputs Registry）**：当运行 `aimake publish`，成品的元数据（SHA-256、所用模板、引用坐标、发布平台）被自动写入 `outputs/` 并登记在 `wiki/log.md`，使得数字分身能够清晰知晓“哪些观点已经在哪些平台讲过”，避免重复倒嚼甘蔗。

### 3. R0–R3 权限分级隔离机制（防御 AI 破坏主库）
严格遵守 `@lwc/core` 既定的安全沙箱原则：
- **R0（只读默认）**：读取解析 Obsidian / Markdown 文件，生成图谱拓扑；
- **R1（草稿提案隔离）**：AI Agent 提炼的新认知只能写入 `.lwc/drafts/` 或 `.lwc/proposals/`，绝不能直接覆写正式笔记；
- **R2 / R3（人类核准合入）**：必须经由创作者在 Studio 界面中点击“一键采纳”或在 CLI 确认后，才执行合流。

---

## 三、模块二：Grounded Knowledge 检索与防幻觉机制

结合 **WorkBuddy 网盘挂载知识库** 与 **Andrej Karpathy LLM Wiki** 的实战精髓，设计一套确定性的事实溯源框架：

### 1. 挂载与检索架构：拒绝全量向量化，拥抱“图谱+行号坐标”
传统通用 RAG 将几十万字切成段落存入向量数据库，极易在召回时拼装出前言不搭后语的“缝合怪”。Aimake 借鉴 WorkBuddy 的挂载机制与 Karpathy 理念：
- **虚拟挂载与文件指纹**：通过本地路径（或微盘/网盘同步目录）挂载 Vault，对每个输入文件计算 SHA-256 指纹；
- **2-Hop 确定性拓扑召回**：以目标选题为中心，在 `wiki/index.md` 匹配关键词后，沿双向链接仅向外扩展 **0~2 跳（0-2 Hops）**，截取相关度最高的紧凑子图，严格约束在 3,000 Token 上下文预算内，从物理层面杜绝上下文拥挤导致注意力稀释。

### 2. 显式坐标溯源（Strict Coordinate Citation）
在 Aimake 生成的 `.deck.md` 每一页前置或后置 YAML 元数据中，均强制绑定精确坐标：

```yaml
---
id: slide-03
title: 核心推理算力拐点
template: apple-bento-launch
cite:
  source: "raw/2026-financial-report.md#L45-L62"
  sha256: "9f83ac21...4e81"
  status: "verified"
---
```

**四态坐标检验引擎（Audit Engine）**：
- `verified`：引用行号内的文本与源文件哈希内容 100% 对应；
- `stale`：源文件已被创作者编辑，行号对应内容已失效，提示重新核验；
- `unresolved`：源文件路径被移动或删除；
- `uncited`：卡片包含核心推论或数据，但未提供任何来源，触发高风险警示。

### 3. 认知三层分离（The Epistemic Triad）
在所有知识萃取与分镜生成流程中，强制执行三层分离规范：

| 层级 | 标识 | 定义 | Agent 生成纪律 |
| :--- | :--- | :--- | :--- |
| **① 核心事实 (Facts)** | `## 核心事实 (Facts)` | 有可查证行号引用的客观数据、历史事实、实验结果 | 必须附带 `file#Lxx` 坐标，禁止篡改数字与语境 |
| **② 推断 (Inferences)** | `[推断]` | 基于核心事实由 AI 进行的趋势预测、商业逻辑衍生 | 必须显式标记 `[推断]`，禁止使用“事实证明”、“毫无疑问” |
| **③ 待验证 (Unverified)** | `[待验证]` | 存疑推测、未经求证的市场传言、第三方单方面表态 | 强制加注黄色醒目标识，提示创作者手动核验 |

---

## 四、模块三：创作者风格 DNA（Persona）与专属数字资产库

### 1. Persona 风格 DNA 提炼与固化引擎

每个超级个体都有不可替代的语言指纹与视觉调性。Aimake 的 Persona 是一个包含**语言韵律、钩子公式、视觉参数、废话黑名单**的紧凑配置文件（$\le 800$ Tokens）：

```
personas/
└── chico-gong.json (与 chico-gong.md 镜像)
```

#### A. 语言韵律模型（Sentence Cadence & Rhythm）
- **平均句长与断句率**：通过统计创作者代表作，自动拟合最优句长（如短句流平均 22 字，长句流平均 45 字）；
- **语气特征指纹（Voice Fingerprint）**：沉淀为结构化标签，如 `[冷静克制, 第一人称实践者, 拒绝情绪煽动, 强数据佐证]`；
- **签名钩子库（Signature Hook Patterns）**：提炼开头 3 秒爆款抓人逻辑，例如：
  - *“大家都以为 X，但在真实工程中我们踩掉的坑是 Y”*（反常识认知差）；
  - *“用 3 个数字复盘过去 90 天我们在 XX 上的失败尝试”*（硬核自剖）。

#### B. 4-Locale 强力反 AI 废话拦截器（Anti-AI Slop Guardrails）
内置严苛的跨语种清洗正则，对大模型生成的文字进行实时脱敏清洗：

```typescript
export const SLOP_DICTIONARY = {
  'zh-CN': [
    '不可否认', '值得注意的是', '在这个数字化/快节奏的时代', '毋庸置疑',
    '综上所述', '总而言之', '正如古人所云', '赋能', '抓手', '打通闭环',
    '如同一把双刃剑', '画卷徐徐展开', '底座与护城河'
  ],
  'en': [
    'delve into', 'it is important to remember', 'testament to',
    'a tapestry of', 'moreover', 'in conclusion', 'beacon of',
    'game-changer', 'revolutionize', 'paradigm shift', 'breathtaking'
  ],
  'ja': [
    '言うまでもなく', '注目に値する', 'デジタル時代において',
    '〜の波が押し寄せている', '一言で言えば', '総括すると'
  ],
  'ko': [
    '부인할 수 없는', '주목할 만한 것은', '디지털 시대에',
    '요약하자면', '결론적으로 말하면', '양날의 검'
  ]
};
```

#### C. 排版与配色基因固化（Design DNA）
与 Aimake 的 36 套前沿参数化模板无缝对接，锁定创作者偏好：
- **主色与强调色**：`brandTokens.primaryColor`（如 `#2B6BE6` 极客蓝）、`accentColor`（如 `#F95738` 柿红）；
- **底色倾向**：`paper`（棉纸微暖）、`linear-dark`（深空极简）、`swiss-mono`（黑白高对比）；
- **字体与排版层级**：严格执行 CJK 避头尾（kinsoku）与韩文单词不断行（`keep-all`）法则。

---

### 2. 专属数字资产库（Creator Asset Store）管理机制

超级个体在视频化、图文化创作中，需要极其便捷地调用个人高频媒体资产。Aimake 在本地工作区中建立标准的 `assets/` 拓扑与元数据清单：

```
my-workspace/
├── assets/
│   ├── avatar/                  # 创作者形象库
│   │   ├── host-transparent.png # 4K 透明底免抠出镜人像 (全身/半身)
│   │   ├── emoji-surprised.webp # 拟人表情贴纸 / 专属卡通 Avatar
│   │   └── avatar-speaking.mp4  # 循环呼吸态数字人口播切片 (带 Alpha 通道)
│   ├── broll/                   # 专属真实工作流视频与插图
│   │   ├── terminal-coding.mp4  # 敲击命令行/代码滚屏 4K 循环切片
│   │   ├── studio-desk.jpg      # 真实工作台全景背景
│   │   └── hardware-rig.mp4     # 硬件设备实拍特写
│   ├── audio/                   # 听觉品牌资产
│   │   ├── intro-woosh.wav      # 专属片头转场音效 (SFX)
│   │   ├── lofi-bgm-steady.mp3  # 专属低扰度背景衬乐 (带电平增益建议)
│   │   └── voice-ref-sample.wav # 创作者 15 秒高清声音参考切片 (供 TTS 克隆)
│   └── manifest.json            # 资产清单与语义检索索引
```

#### 资产清单元数据契约 (`assets/manifest.json`)

```json
{
  "version": "1.0.0",
  "creatorId": "chico",
  "assets": [
    {
      "id": "broll-terminal-fast",
      "type": "video",
      "path": "assets/broll/terminal-coding.mp4",
      "durationMs": 8500,
      "aspectRatio": "16:9",
      "tags": ["coding", "terminal", "deep-work", "geek"],
      "mood": "focused",
      "recommendedTemplates": ["xhs-neon-tech", "ppt-tech-architecture", "video-kinetic-reel"]
    },
    {
      "id": "avatar-thinking",
      "type": "image",
      "path": "assets/avatar/host-thinking.webp",
      "hasAlpha": true,
      "tags": ["host", "portrait", "reflection", "question"],
      "slot": "right-bottom-card"
    },
    {
      "id": "voice-cloned-profile",
      "type": "audio-profile",
      "path": "assets/audio/voice-ref-sample.wav",
      "engine": "CosyVoice-300M",
      "sampleRate": 24000,
      "speakerName": "Chico-Deep"
    }
  ]
}
```

#### Agent 自动化资产智能编排调度（Intelligent Asset Slotting）
当创作者命令 Agent：`"将这篇文章生成一份 9:16 的深度技术复盘短视频"` 时：
1. **视觉分镜匹配**：Agent 识别到第 2 页为“排查 Memory Leak 命令行”，自动从 `manifest.json` 检索 `tags: ["terminal", "coding"]` 的 B-Roll，作为背景循环层；
2. **音效与转场**：在各分镜切换点（`---`），自动插入 `intro-woosh.wav`；
3. **数字人像占位**：在总结页右下角自动挂载带透明通道的 `host-thinking.webp`；
4. **声音与配音**：直接调度 `voice-ref-sample.wav` 触发本地克隆语音合成，彻底告别机械公网配音。

---

## 五、技术落地与代码架构草案（针对主产品落地）

为使本方案在 `products/aimake` 中平滑落地，制定如下代码实现规划：

### 1. 核心数据结构与契约拓展 (`src/schema/types.ts`)

```typescript
// 创作者数字资产条目
export interface CreatorAssetItem {
  id: string;
  type: 'image' | 'video' | 'audio' | 'audio-profile';
  path: string;
  hasAlpha?: boolean;
  durationMs?: number;
  aspectRatio?: '16:9' | '9:16' | '1:1' | '3:4';
  tags: string[];
  mood?: string;
  recommendedTemplates?: string[];
}

// 创作者资产库清单
export interface CreatorAssetManifest {
  version: string;
  creatorId: string;
  updatedAt: string;
  assets: CreatorAssetItem[];
}

// 增强型 Persona 契约
export interface CreatorPersonaProfile extends StyleDNA {
  bio: string;
  assetManifestPath?: string;
  defaultTemplates: {
    socialCarousel: string; // 如 "xhs-swiss-grid"
    videoReel: string;      // 如 "video-kinetic-reel"
    longArticle: string;    // 如 "wechat-deep-report"
    keynote: string;        // 如 "apple-bento-launch"
  };
  audioPreset?: {
    sfxTransition?: string;
    bgmLoop?: string;
    voiceRefSample?: string;
  };
}
```

### 2. 新增与扩展 CLI 命令规范

| 命令 | 参数与选项 | 说明 |
| :--- | :--- | :--- |
| `aimake wiki ground <deck.md>` | `--vault <dir> [--strict]` | 执行卡片事实坐标强校验，若存在 `uncited` 或 `stale` 则标黄并输出定位报告 |
| `aimake persona calibrate <id>` | `--samples <dir> --rules <rules>` | 重新校准创作者语气节奏，提炼句长模型与爆款钩子，更新 `personas/<id>.json` |
| `aimake assets list` | `[--type <type>] [--json]` | 浏览与检索当前 Vault 内注册的数字资产（B-Roll、人像、音效） |
| `aimake assets ingest <file>` | `--tags <tags...> --type <type>` | 将本地新素材（如工作录屏或新头像）结构化登记入 `manifest.json` |
| `aimake render <deck.md>` | `-f capcut -o ./out` | 结合 Persona 资产库，一键将分镜、字幕轨、素材轨编译为剪映工程草稿 |

### 3. 分阶段推进路线图（Implementation Roadmap）

- **第一阶段（基线固化 · 即刻执行）**：
  - 完善 `src/wiki/wiki-engine.ts` 的 `auditVaultCitations()`，使坐标溯源检查支持 CLI 直接输出色彩高亮报告；
  - 在 `src/wiki/humanizer.ts` 中补齐 `SLOP_DICTIONARY` 4 语言全量词库并强化正则。
- **第二阶段（资产中枢与 Persona 升级）**：
  - 在 `src/workspace/` 中新增 `asset-manager.ts`，支持 `assets/manifest.json` 的自动扫描、元数据解析与标签索引；
  - 升级 Calm Studio 前端面板，在设置抽屉中提供“个人数字资产库”预览与 1-Click 引用注入。
- **第三阶段（全自动动效与剪映白盒交付）**：
  - 将 Persona 绑定的专属人像、B-Roll 与音效，直接桥接至 Revideo/Canvas 动效渲染层与剪映 `draft_content.json` 导出器中，实现“一人即顶尖影视工作室”的终极愿景。

---

*本文档已同步归档至 `products/aimake/docs/research/` 与 `aimake-labs/aimake-studio/docs/research/`，作为后续功能迭代的验收标准。*
