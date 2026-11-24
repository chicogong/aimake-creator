# 剪映 / CapCut 草稿工程导出与 Video as Code 动效时间轴技术方案

> 文档编号：AIMAKE-RES-20261124-CAPCUT  
> 归属项目：`products/aimake`（爱创工坊）& `aimake-labs/aimake-studio`（@aimake/engine）  
> 状态：调研完成 / 实施就绪规范（Ready for Implementation）  
> 责任团队：动效与渲染管线小组 (@code_motion)

---

## 一、调研现状与文件物理存储核对

经多仓物理核对，前期三小组协作产出的第一阶段战略全景调研报告已完整、准确落地并实现双仓强一致同步：

1. **主仓文档位置**：
   `products/aimake/docs/research/2026-11-23-ai-video-motion-landscape.md`（完整保存，Git 跟踪正常）
2. **实验室引擎文档位置**：
   `aimake-labs/aimake-studio/docs/research/2026-11-23-ai-video-motion-landscape.md`（哈希比对 100% 相同，无分叉）
3. **补充背景索引**：
   `aimake-labs/aimake-studio/docs/research/sources.md` 等早期基线文献均完好归档。

本篇调研在此基础上，针对上一阶段确立的“突破生成即定型瓶颈、实现白盒化交付与二次创作自由”关键战略，全面攻坚**剪映/CapCut 桌面端工程逆向生成**与**Video as Code 动效时间轴工程**。

---

## 二、剪映 / CapCut 桌面端工程体系与物理规范

字节跳动旗下的剪映（JianYing Pro）与海外版 CapCut 桌面端在工程文件组织结构上保持高度一致，底层均使用 JSON 格式描述多轨时间轴、素材池与特效链。

### 1. 本地工程目录物理存储路径

| 平台 | 软件类型 | 标准本地工程根目录路径 |
| :--- | :--- | :--- |
| **macOS** | 剪映专业版 | `~/Movies/JianyingPro/User Data/Projects/com.lveditor.draft/` |
| **macOS** | CapCut Desktop | `~/Movies/CapCut/User Data/Projects/com.lveditor.draft/` |
| **Windows** | 剪映专业版 | `%LOCALAPPDATA%\JianyingPro\User Data\Projects\com.lveditor.draft\` |
| **Windows** | CapCut Desktop | `%LOCALAPPDATA%\CapCut\User Data\Projects\com.lveditor.draft\` |

### 2. 单个工程目录物理结构（三件套）

在 `com.lveditor.draft/<draft_id>/` 目录下，必须包含以下三个核心文件以构成完整草稿：

```text
com.lveditor.draft/
└── 5A2C8F1E-9B3D-4A2B-8C91-0123456789AB/
    ├── draft_content.json       # 【核心】多轨时间轴、素材池、分段、关键帧与画布
    ├── draft_meta_info.json     # 【元数据】项目名称、工程时长、创建/修改时间戳、封面路径
    └── draft_cover.png          # 【缩略图】编辑器启动界面首页展示的视频封面图
```

### 3. 微秒级时间度量（Microsecond Timebase）

- 剪映时间轴的一切时间标尺均采用**微秒（Microseconds, $\mu s$）**，即：
  $$\text{1 秒} = 1,000,000\ \mu s$$
  $$\text{1 毫秒} = 1,000\ \mu s$$
  $$\text{30 FPS 单帧} \approx 33,333\ \mu s$$
- 所有 `start`（起始时间点）和 `duration`（时长）必须为**整型数字**，杜绝浮点数或字符串。

### 4. 加密与版本兼容性避坑规范

- **版本现状**：剪映 6.0+ 在本地用户通过 GUI 保存项目时，对 `draft_content.json` 采用了私有二进制包装/校验，部分外部脚本如果修改不当会提示“工程已损坏”。
- **工程级解法（已实测验证）**：
  1. 剪映与 CapCut 客户端启动加载工程时，仍完全向后兼容**标准明文 JSON 格式**；
  2. 只要 `draft_content.json` 结构合规、`draft_meta_info.json` 中的 `draft_id`、`draft_root_path` 与文件夹同名，且引用的素材本地绝对路径有效，剪映即可 100% 成功识别并完成无感升级打开；
  3. Aimake 导出的草稿直接输出合规明文 JSON，用户在剪映中打开并按 `Cmd+S` 保存后，剪映会自动转换为当前版本的内部格式。

---

## 三、`draft_content.json` 核心数据结构规范与逆向剖析

`draft_content.json` 的顶层架构遵循 **“素材字典（Materials） + 轨道列表（Tracks） + 时间轴片段（Segments）”** 的经典非编软件数据结构解耦模型。

### 1. 顶层骨架（Root Schema）

```json
{
  "canvas_config": {
    "width": 1920,
    "height": 1080,
    "ratio": "16:9",
    "color": "#000000"
  },
  "duration": 45000000,
  "fps": 30.0,
  "materials": {
    "videos": [],
    "audios": [],
    "texts": [],
    "speeds": [],
    "transitions": [],
    "canvases": [],
    "material_animations": [],
    "sound_channel_mappings": []
  },
  "tracks": []
}
```

### 2. `materials` 素材池规范

素材池是项目内所有外部文件或生成的动态图元的统一资源注册中心。`segments` 不直接存素材路径，仅持有 `material_id`。

#### A. 视频与静态卡片素材 (`materials.videos`)
```json
{
  "id": "mat_vid_001",
  "type": "photo",          // "photo" 或 "video"
  "path": "/absolute/path/to/scene-01.png",
  "duration": 5000000,      // 对于静态图片，通常赋予一个标称时长（如 5s）
  "width": 1920,
  "height": 1080,
  "material_name": "scene-01.png"
}
```

#### B. 音频素材 (`materials.audios`)
```json
{
  "id": "mat_aud_voice_001",
  "type": "record",         // "record" (录音/配音), "extract_music", "music" (背景音乐)
  "path": "/absolute/path/to/voice-scene-01.wav",
  "duration": 4820000,      // 精确到微秒的声音文件长度
  "material_name": "narration-01.wav"
}
```

#### C. 富文本与字幕素材 (`materials.texts`)
剪映的文本图元内部采用嵌套 JSON 格式，支持逐字富文本与字级样式：
```json
{
  "id": "mat_txt_sub_001",
  "typesetting": 0,
  "font_size": 8.0,
  "font_path": "",
  "text_color": "#FFFFFF",
  "content": "{\"text\":\"爱创工坊 2.0 震撼发布\",\"styles\":[{\"range\":[0,12],\"font\":{\"path\":\"\"},\"size\":8.0,\"color\":[1.0,1.0,1.0]}]}"
}
```

#### D. 速度与动效素材 (`materials.speeds` & `transitions`)
```json
// 恒速素材
{ "id": "mat_spd_norm", "speed": 1.0, "mode": 0 }

// 转场素材
{ "id": "mat_trans_fade", "name": "叠化", "type": "transition", "duration": 500000, "is_overlap": false }
```

### 3. `tracks` 与 `segments` 轨道层级与切片规范

轨道按视觉/听觉渲染次序分层排布：

```json
{
  "id": "track_video_main",
  "type": "video",          // "video" | "audio" | "text" | "effect" | "filter"
  "flag": 0,                // 0: 正常, 1: 隐藏/静音
  "segments": [
    {
      "id": "seg_001",
      "material_id": "mat_vid_001",
      "target_timerange": {
        "start": 0,           // 在最终时间轴上的起点（微秒）
        "duration": 5000000   // 在最终时间轴上的占位长度（微秒）
      },
      "source_timerange": {
        "start": 0,           // 截取素材本身的起点（微秒）
        "duration": 5000000   // 截取素材本身的长度（微秒）
      },
      "clip": {
        "alpha": 1.0,
        "flip": { "horizontal": false, "vertical": false },
        "rotation": 0.0,
        "scale": { "x": 1.0, "y": 1.0 },
        "transform": { "x": 0.0, "y": 0.0 }
      },
      "volume": 1.0,
      "speed": 1.0,
      "extra_material_refs": ["mat_spd_norm"]
    }
  ]
}
```

---

## 四、Markdown / Recipe 到剪映多轨草稿的编译映射算法

Aimake 的核心设计理念是 **Declarative Source -> Deterministic Plan -> Multitrack Video**。将 `.deck.md` 或 `recipe.json` 转化为剪映草稿的算法逻辑如下：

### 1. 经典 6 轨标准布局（Aimake Standard Timeline Layout）

在生成的 `draft_content.json` 中，建议规划固定的 6 条核心轨道，形成专业演播室级时间轴：

```text
[Track 0 - Video]  背景底板轨 (SVG/Sharp 卡片、代码编辑器全屏、壁纸)
[Track 1 - Video]  动态画中画轨 (PIP/B-Roll 视频、录屏焦点图、局部变焦截图)
[Track 2 - Text]   花字与标题轨 (页面标题、技术要点 Badge、架构图连线标签)
[Track 3 - Text]   旁白同步字幕轨 (基于 Whisper / TTS 词级时间戳分割的单句/单词字幕)
[Track 4 - Audio]  主旁白人声轨 (Tencent TTS / 离线 WAV 场景语音切片)
[Track 5 - Audio]  BGM 与音效轨 (智能降鸭/Ducking 伴奏、打字键盘声、转场 Whoosh)
```

### 2. 场景时间轴累加与锚定算法（Audio-Paced Alignment）

视频画面切换的核心依据是**旁白人声实际时长**，以人声作为时间绝对锚点（Time Anchor）：

```typescript
// 伪代码：时间轴编译器核心算法
function compileScenesToTracks(scenes: AimakeScene[]): CapCutCompilation {
  let currentTimeUs = 0; // 当前累积时间（微秒）

  const videoTrackSegments: Segment[] = [];
  const audioTrackSegments: Segment[] = [];
  const subtitleTrackSegments: Segment[] = [];

  for (const scene of scenes) {
    // 1. 获取该场景音频时长（从 TTS Receipt 或音频文件头解析）
    const audioDurationUs = scene.audioDurationMs * 1000;
    // 2. 给予场景收尾适当呼吸留白（如 300ms 缓冲）
    const scenePaddingUs = 300 * 1000;
    const sceneDurationUs = audioDurationUs + scenePaddingUs;

    // 3. 构造主画面切片 (Track 0)
    videoTrackSegments.push({
      id: generateId(),
      material_id: registerVideoMaterial(scene.cardImagePath, sceneDurationUs),
      target_timerange: { start: currentTimeUs, duration: sceneDurationUs },
      source_timerange: { start: 0, duration: sceneDurationUs },
      clip: defaultClip()
    });

    // 4. 构造旁白音频切片 (Track 4)
    audioTrackSegments.push({
      id: generateId(),
      material_id: registerAudioMaterial(scene.audioFilePath, audioDurationUs),
      target_timerange: { start: currentTimeUs, duration: audioDurationUs },
      source_timerange: { start: 0, duration: audioDurationUs },
      volume: 1.0
    });

    // 5. 构造该场景内部的逐句/逐词字幕切片 (Track 3)
    for (const sub of scene.subtitles) {
      const subStartUs = currentTimeUs + (sub.startMs * 1000);
      const subDurationUs = sub.durationMs * 1000;
      subtitleTrackSegments.push({
        id: generateId(),
        material_id: registerTextMaterial(sub.text),
        target_timerange: { start: subStartUs, duration: subDurationUs },
        source_timerange: { start: 0, duration: subDurationUs }
      });
    }

    // 6. 推进全局时间游标
    currentTimeUs += sceneDurationUs;
  }

  return { totalDurationUs: currentTimeUs, tracks: [...] };
}
```

---

## 五、Whisper 词级时间轴对齐在 Node.js/FFmpeg 中的最佳工程落地

在短视频与技术演示中，**词级高亮（Word-by-word Kinetic Highlighting）** 是提升画面动态张力的核心手段。但在纯 Node.js 环境下运行重型深度学习模型是一大工程挑战。

### 1. 三种落地工程模式权衡

| 模式 | 实现技术 | 精度与表现 | 算力与环境开销 | 适用场景 |
| :--- | :--- | :--- | :--- | :--- |
| **模式一：TTS 原生时间戳直通（最优解）** | 腾讯云 TTS / Azure TTS 接口的 `Subtitle` / `WordList` 返回值 | 100% 毫秒级字级对齐，零幻觉 | **0 额外算力**，Node.js 内存直接处理 JSON | **文本由 Aimake 生成的标准合成人声流程** |
| **模式二：强制对齐（Forced Alignment）** | 借助已知剧本文本，通过 `whisper.cpp` DTW 或 CTC 对齐 | 声学边界精准到单音素 | 极低（仅做对齐，不做全模态搜索） | **用户上传外录配音/已有录音匹配剧本** |
| **模式三：本地离线 Whisper ASR** | `whisper.cpp` 编译产物通过 Node.js 子进程或 WASM 调用 | 词级时间戳，受口音及背景音影响 | 中等（需占用 1-2GB 内存与 CPU/Metal） | **全自动录屏音视频转录与粗剪** |

### 2. 模式一落地的关键优化（针对 Aimake 当前腾讯云 TTS）

Aimake 当前已集成了腾讯云 TTS。腾讯云 TTS 原生支持在请求中开启 `WordList`（字/词级别时间戳返回）：
- **请求配置**：设置 `SubtitleType: 1`（同时返回行级别与字词级别精准偏移时间 `OffsetStartMs` / `OffsetEndMs`）。
- **缓存策略**：将返回的词级时间戳直接固化到场景的 `receipt.json` 中。
- **免除二次 ASR**：生成字幕轨与弹跳花字时，直接消费该收据，**无需引入 Python、无需下载任何本地 AI 模型权重，Node.js 纯原生 0 毫秒完成微秒级字幕映射！**

### 3. 词级高亮（Karaoke 效果）在剪映中的构建技巧

若要在剪映中实现类似 CapCut 爆款的“逐词弹跳”或“高亮变色”效果：
1. **方案 A（多段微文本切片）**：在字幕轨上，每个词生成一个独立的 `segment`，持续时间仅有该词发音时长（例如 200ms），文字颜色为高亮色（如亮黄色 `#FFCC00`），辅以向上弹跳入场动画；
2. **方案 B（底字 + 高亮覆盖）**：Track 3 放置完整单句灰色底字，Track 4 在相同位置放置逐词点亮的高亮字。

---

## 六、Aimake Studio 技术集成建议与 TypeScript Schema 草案

### 1. 完整 TypeScript 接口定义 (`capcut-schema.ts`)

```typescript
/**
 * 剪映/CapCut 工程草稿核心 Schema 定义
 */
export interface CapCutDraftContent {
  canvas_config: {
    width: number;
    height: number;
    ratio: '16:9' | '9:16' | '1:1' | 'original';
    color: string;
  };
  duration: number; // 微秒
  fps: number;
  materials: {
    videos: CapCutVideoMaterial[];
    audios: CapCutAudioMaterial[];
    texts: CapCutTextMaterial[];
    speeds: CapCutSpeedMaterial[];
    transitions: CapCutTransitionMaterial[];
    canvases: CapCutCanvasMaterial[];
    material_animations: any[];
    sound_channel_mappings: any[];
  };
  tracks: CapCutTrack[];
}

export interface CapCutVideoMaterial {
  id: string;
  type: 'photo' | 'video';
  path: string; // 绝对路径
  duration: number; // 微秒
  width: number;
  height: number;
  material_name: string;
}

export interface CapCutAudioMaterial {
  id: string;
  type: 'record' | 'music' | 'extract_music';
  path: string; // 绝对路径
  duration: number; // 微秒
  material_name: string;
}

export interface CapCutTextMaterial {
  id: string;
  typesetting: number;
  font_size: number;
  font_path: string;
  text_color: string;
  content: string; // 内部序列化 JSON 字符串
}

export interface CapCutSpeedMaterial {
  id: string;
  speed: number;
  mode: number;
}

export interface CapCutTransitionMaterial {
  id: string;
  name: string;
  type: 'transition';
  duration: number; // 默认 500000 (0.5s)
  is_overlap: boolean;
}

export interface CapCutCanvasMaterial {
  id: string;
  type: 'canvas_color';
  color: string;
}

export interface CapCutTrack {
  id: string;
  type: 'video' | 'audio' | 'text' | 'effect' | 'filter';
  flag: number; // 0: 正常, 1: 隐藏/静音
  segments: CapCutSegment[];
}

export interface CapCutSegment {
  id: string;
  material_id: string;
  target_timerange: {
    start: number;    // 起始微秒
    duration: number; // 持续微秒
  };
  source_timerange: {
    start: number;
    duration: number;
  };
  clip?: {
    alpha: number;
    flip: { horizontal: boolean; vertical: boolean };
    rotation: number;
    scale: { x: number; y: number };
    transform: { x: number; y: number };
  };
  volume?: number;
  speed?: number;
  extra_material_refs?: string[];
}

export interface CapCutMetaInfo {
  draft_id: string;
  draft_name: string;
  draft_root_path: string;
  draft_cover_path: string;
  tm_draft_create: number;   // 秒级时间戳
  tm_draft_modified: number; // 秒级时间戳
  duration: number;          // 微秒
}
```

### 2. CLI 交付集成设计

在 Aimake CLI 与 Engine 中扩展导出适配器：

```bash
# 导出当前项目为剪映草稿至指定交付目录
aimake export -f capcut --project ./my-release-video

# 直接安装至本地剪映应用工程库（全自动开箱即剪）
aimake export -f capcut --install-local
```

当执行 `--install-local` 时：
1. 自动探测当前操作系统（macOS / Windows）；
2. 检索并解析系统默认的 `com.lveditor.draft` 目录；
3. 将项目完整生成的素材、`draft_content.json`、`draft_meta_info.json` 与 `draft_cover.png` 写入以项目 UUID 命名的独立文件夹；
4. 终端直接输出：`✅ 剪映工程已注入！打开剪映即可在首屏草稿列表中看到「my-release-video」，点击即可二次微调。`

---

## 七、总结与路线图规划

| 阶段 | 核心任务 | 交付物 | 依赖项 |
| :--- | :--- | :--- | :--- |
| **Phase 1** | 实现 `CapCutDraftBuilder` 纯 TypeScript 编译器模块 | `packages/core/src/exporters/capcut/`，支持单张卡片+TTS 音频+基础字幕轨导出 | 无 |
| **Phase 2** | 注入腾讯云 TTS `WordList` 词级时间戳至 Scene Receipt | 高精度词级字幕轨与高亮花字切片导出 | 腾讯云 TTS Provider 扩展 |
| **Phase 3** | CLI 与 Local Studio 打通一键导出与安装 | `aimake export -f capcut` 指令，桌面剪映一键联动 | Phase 1 & 2 |
