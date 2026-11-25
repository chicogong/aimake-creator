import crypto from 'node:crypto';
import fsSync from 'node:fs';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import type { AspectRatio, DeckDocument, DeckSlide } from '../schema/types.js';
import { parsePcmWav } from '../speech/wav.js';

/**
 * Microsecond timebase constants (1 second = 1,000,000 us).
 */
export const US_PER_SECOND = 1_000_000;
export const US_PER_MS = 1_000;

export interface CapCutCanvasConfig {
  width: number;
  height: number;
  ratio: '16:9' | '9:16' | '1:1' | '3:4' | '4:5' | 'original';
  color: string;
}

export interface CapCutVideoMaterial {
  id: string;
  type: 'photo' | 'video';
  path: string;
  duration: number; // microsecond
  width: number;
  height: number;
  material_name: string;
}

export interface CapCutAudioMaterial {
  id: string;
  type: 'record' | 'music' | 'extract_music';
  path: string;
  duration: number; // microsecond
  material_name: string;
}

export interface CapCutTextMaterial {
  id: string;
  typesetting: number;
  font_size: number;
  font_path: string;
  text_color: string;
  content: string; // JSON string with text and character styles
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
  duration: number;
  is_overlap: boolean;
}

export interface CapCutCanvasMaterial {
  id: string;
  type: 'canvas_color';
  color: string;
}

export interface CapCutSegment {
  id: string;
  material_id: string;
  target_timerange: {
    start: number; // microsecond
    duration: number; // microsecond
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

export interface CapCutTrack {
  id: string;
  type: 'video' | 'audio' | 'text' | 'effect' | 'filter';
  flag: number; // 0: normal, 1: hidden/muted
  segments: CapCutSegment[];
}

export interface CapCutDraftContent {
  canvas_config: CapCutCanvasConfig;
  duration: number; // microsecond
  fps: number;
  materials: {
    videos: CapCutVideoMaterial[];
    audios: CapCutAudioMaterial[];
    texts: CapCutTextMaterial[];
    speeds: CapCutSpeedMaterial[];
    transitions: CapCutTransitionMaterial[];
    canvases: CapCutCanvasMaterial[];
    material_animations: unknown[];
    sound_channel_mappings: unknown[];
  };
  tracks: CapCutTrack[];
}

export interface CapCutMetaInfo {
  draft_id: string;
  draft_name: string;
  draft_root_path: string;
  draft_fold_path?: string;
  draft_cover_path: string;
  tm_draft_create: number; // epoch seconds
  tm_draft_modified: number;
  duration: number; // microsecond
  draft_timeline_duration?: number;
  tm_duration?: number;
}

export interface CapCutLocalPaths {
  jianying?: string;
  capcut?: string;
  preferred?: string;
  platform: NodeJS.Platform;
}

export interface BuildCapCutDraftOptions {
  outputDir?: string;
  installLocal?: boolean;
  targetApp?: 'capcut' | 'jianying' | 'auto';
  audioTrackPath?: string;
  slideDurationsMs?: number[];
  slideImages?: string[];
  fps?: number;
  localProjectsDir?: string;
}

export interface BuildCapCutDraftResult {
  draftId: string;
  draftName: string;
  draftDir: string;
  contentPath: string;
  metaPath: string;
  coverPath: string;
  durationUs: number;
  durationMs: number;
  installedLocal: boolean;
  localDraftPath?: string;
  content: CapCutDraftContent;
  meta: CapCutMetaInfo;
}

/**
 * Detect local CapCut and JianYing Pro user project draft directories.
 */
export function detectLocalDraftDirectories(customRoot?: string): CapCutLocalPaths {
  const home = os.homedir();
  const platform = process.platform;
  let jianying: string | undefined;
  let capcut: string | undefined;

  const envRoot = process.env.AIMAKE_LOCAL_DRAFT_ROOT;
  const root = customRoot || envRoot;
  if (root) {
    const resolvedRoot = path.resolve(root);
    return {
      jianying: path.join(resolvedRoot, 'JianyingPro', 'User Data', 'Projects', 'com.lveditor.draft'),
      capcut: path.join(resolvedRoot, 'CapCut', 'User Data', 'Projects', 'com.lveditor.draft'),
      preferred: resolvedRoot,
      platform,
    };
  }

  if (platform === 'darwin') {
    const jyCandidate = path.join(
      home,
      'Movies',
      'JianyingPro',
      'User Data',
      'Projects',
      'com.lveditor.draft'
    );
    const ccCandidate = path.join(
      home,
      'Movies',
      'CapCut',
      'User Data',
      'Projects',
      'com.lveditor.draft'
    );

    if (fsSync.existsSync(path.dirname(jyCandidate)) || fsSync.existsSync(jyCandidate)) {
      jianying = jyCandidate;
    }
    if (fsSync.existsSync(path.dirname(ccCandidate)) || fsSync.existsSync(ccCandidate)) {
      capcut = ccCandidate;
    }
  } else if (platform === 'win32') {
    const localAppData = process.env.LOCALAPPDATA || path.join(home, 'AppData', 'Local');
    const jyCandidate = path.join(
      localAppData,
      'JianyingPro',
      'User Data',
      'Projects',
      'com.lveditor.draft'
    );
    const ccCandidate = path.join(
      localAppData,
      'CapCut',
      'User Data',
      'Projects',
      'com.lveditor.draft'
    );

    if (fsSync.existsSync(path.dirname(jyCandidate)) || fsSync.existsSync(jyCandidate)) {
      jianying = jyCandidate;
    }
    if (fsSync.existsSync(path.dirname(ccCandidate)) || fsSync.existsSync(ccCandidate)) {
      capcut = ccCandidate;
    }
  }

  const preferred = jianying || capcut || (platform === 'darwin'
    ? path.join(home, 'Movies', 'JianyingPro', 'User Data', 'Projects', 'com.lveditor.draft')
    : undefined);

  return {
    jianying,
    capcut,
    preferred,
    platform,
  };
}

/**
 * Map aspect ratio to standard canvas resolution and CapCut ratio token.
 */
export function getCanvasDimensions(aspect?: AspectRatio): CapCutCanvasConfig {
  switch (aspect) {
    case '9:16':
      return { width: 1080, height: 1920, ratio: '9:16', color: '#000000' };
    case '1:1':
      return { width: 1080, height: 1080, ratio: '1:1', color: '#000000' };
    case '3:4':
      return { width: 1080, height: 1440, ratio: '3:4', color: '#000000' };
    case '4:5':
      return { width: 1080, height: 1350, ratio: '4:5', color: '#000000' };
    case '16:9':
    default:
      return { width: 1920, height: 1080, ratio: '16:9', color: '#000000' };
  }
}

/**
 * Estimate slide speech duration in milliseconds if not pre-measured.
 */
function estimateSlideDurationMs(slide: DeckSlide, defaultSeconds = 4): number {
  const explicitSec = (slide as any).seconds;
  if (explicitSec && Number.isFinite(explicitSec) && explicitSec > 0) {
    return Math.round(explicitSec * 1000);
  }
  const speechText = (slide.speech || '').trim();
  if (speechText) {
    // Chinese characters pace: ~3.8 - 4.5 chars/sec -> ~230ms per char
    // English words pace: ~2.5 words/sec -> ~400ms per word
    const hasCjk = /[\u4e00-\u9fa5]/.test(speechText);
    const ms = hasCjk
      ? Math.round(speechText.length * 230)
      : Math.round(speechText.split(/\s+/).length * 400);
    return Math.max(3000, ms);
  }
  return defaultSeconds * 1000;
}

/**
 * Extract clean spoken sentence or subtitle text for a slide.
 */
function getSlideNarrationText(slide: DeckSlide): string {
  if (slide.speech && slide.speech.trim()) {
    return slide.speech.trim();
  }
  const parts: string[] = [];
  if (slide.title) parts.push(slide.title);
  if (slide.subtitle) parts.push(slide.subtitle);
  if (slide.bullets && slide.bullets.length > 0) {
    parts.push(slide.bullets.slice(0, 2).join('，'));
  }
  return parts.join('。') || '欢迎观看爱创工坊作品。';
}

/**
 * Serialize rich text content string expected by JianYing / CapCut.
 */
function serializeCapCutTextContent(text: string, fontSize = 8.0, _textColor = '#FFFFFF'): string {
  return JSON.stringify({
    text,
    styles: [
      {
        range: [0, text.length],
        font: { path: '' },
        size: fontSize,
        color: [1.0, 1.0, 1.0],
      },
    ],
  });
}

/**
 * Build a complete CapCut / JianYing Pro desktop project draft directory.
 */
export async function buildCapCutDraft(
  doc: DeckDocument,
  options: BuildCapCutDraftOptions = {}
): Promise<BuildCapCutDraftResult> {
  const draftId = crypto.randomUUID().toUpperCase();
  const rawTitle = (doc.frontmatter.title || 'Aimake Video Project').trim();
  const draftName = rawTitle.replace(/[\\/:*?"<>|]+/g, '_').slice(0, 50);
  const fps = options.fps || doc.frontmatter.fps || 30.0;
  const canvasConfig = getCanvasDimensions(doc.frontmatter.aspect);

  // Target directory selection
  const baseOutDir = options.outputDir
    ? path.resolve(options.outputDir)
    : path.resolve(process.cwd(), 'exports', `capcut-${draftId.slice(0, 8)}`);
  const draftDir = path.join(baseOutDir, draftId);
  await fs.mkdir(draftDir, { recursive: true });

  const materials: CapCutDraftContent['materials'] = {
    videos: [],
    audios: [],
    texts: [],
    speeds: [{ id: 'mat_spd_norm', speed: 1.0, mode: 0 }],
    transitions: [
      {
        id: 'mat_trans_dissolve',
        name: '叠化',
        type: 'transition',
        duration: 500_000,
        is_overlap: false,
      },
    ],
    canvases: [{ id: 'mat_canvas_default', type: 'canvas_color', color: '#000000' }],
    material_animations: [],
    sound_channel_mappings: [],
  };

  // Six-Track Standard Timeline
  const trackVideoCards: CapCutTrack = { id: 'track_video_main', type: 'video', flag: 0, segments: [] };
  const trackVideoPip: CapCutTrack = { id: 'track_video_pip', type: 'video', flag: 0, segments: [] };
  const trackTextTitles: CapCutTrack = { id: 'track_text_titles', type: 'text', flag: 0, segments: [] };
  const trackTextSubtitles: CapCutTrack = { id: 'track_text_subtitles', type: 'text', flag: 0, segments: [] };
  const trackAudioVoice: CapCutTrack = { id: 'track_audio_voice', type: 'audio', flag: 0, segments: [] };
  const trackAudioBgm: CapCutTrack = { id: 'track_audio_bgm', type: 'audio', flag: 0, segments: [] };

  let currentUs = 0;
  const defaultSeconds = doc.frontmatter.secondsPerSlide || 4;

  // Global Audio Track if provided (e.g. single rendered master WAV)
  let masterAudioId: string | undefined;
  let masterAudioDurationUs: number | undefined;
  if (options.audioTrackPath && fsSync.existsSync(options.audioTrackPath)) {
    masterAudioId = `mat_aud_master_${draftId.slice(0, 6)}`;
    const srcAudio = path.resolve(options.audioTrackPath);
    const draftAudioPath = path.join(draftDir, path.basename(srcAudio));
    if (path.resolve(srcAudio) !== path.resolve(draftAudioPath)) {
      await fs.copyFile(srcAudio, draftAudioPath);
    }
    try {
      const audioBytes = await fs.readFile(draftAudioPath);
      const parsedWav = parsePcmWav(audioBytes);
      masterAudioDurationUs = Math.round(parsedWav.durationMs * US_PER_MS);
    } catch {
      // Non-WAV or unparsed audio; fallback handled below
    }
    materials.audios.push({
      id: masterAudioId,
      type: 'record',
      path: draftAudioPath,
      duration: masterAudioDurationUs ?? 0, // Will be finalized after slide loop
      material_name: path.basename(draftAudioPath),
    });
  }

  // Iterate slides as audio-paced scenes
  for (let idx = 0; idx < doc.slides.length; idx++) {
    const slide = doc.slides[idx];
    const slideDurationMs =
      options.slideDurationsMs?.[idx] || estimateSlideDurationMs(slide, defaultSeconds);
    const sceneDurationUs = Math.round(slideDurationMs * US_PER_MS);

    // 1. Video Slide Card Material & Segment (Track 0)
    const rawImgPath = options.slideImages?.[idx]
      ? path.resolve(options.slideImages[idx])
      : path.join(draftDir, `slide_${idx + 1}.png`);

    // Real slide images must exist; placeholder logic removed
    if (!fsSync.existsSync(rawImgPath)) {
      throw new Error(
        `Slide image not found for slide ${idx + 1}: ${rawImgPath}. Real slide images must be rendered (e.g. via exportDeckToPngs) before building CapCut draft.`
      );
    }

    const cardImgPath = path.join(draftDir, `slide_${idx + 1}.png`);
    if (path.resolve(rawImgPath) !== path.resolve(cardImgPath)) {
      await fs.copyFile(rawImgPath, cardImgPath);
    }

    const vidMatId = `mat_vid_${String(idx + 1).padStart(3, '0')}`;
    materials.videos.push({
      id: vidMatId,
      type: 'photo',
      path: cardImgPath,
      duration: sceneDurationUs,
      width: canvasConfig.width,
      height: canvasConfig.height,
      material_name: path.basename(cardImgPath),
    });

    trackVideoCards.segments.push({
      id: `seg_vid_${String(idx + 1).padStart(3, '0')}`,
      material_id: vidMatId,
      target_timerange: { start: currentUs, duration: sceneDurationUs },
      source_timerange: { start: 0, duration: sceneDurationUs },
      clip: {
        alpha: 1.0,
        flip: { horizontal: false, vertical: false },
        rotation: 0.0,
        scale: { x: 1.0, y: 1.0 },
        transform: { x: 0.0, y: 0.0 },
      },
      volume: 1.0,
      speed: 1.0,
      extra_material_refs: ['mat_spd_norm'],
    });

    // 2. Title Overlay Material & Segment (Track 2)
    const titleText = (slide.title || `Slide ${idx + 1}`).trim();
    if (titleText) {
      const titleMatId = `mat_txt_title_${String(idx + 1).padStart(3, '0')}`;
      materials.texts.push({
        id: titleMatId,
        typesetting: 0,
        font_size: 10.0,
        font_path: '',
        text_color: '#FFFFFF',
        content: serializeCapCutTextContent(titleText, 10.0, '#FFFFFF'),
      });

      trackTextTitles.segments.push({
        id: `seg_txt_title_${String(idx + 1).padStart(3, '0')}`,
        material_id: titleMatId,
        target_timerange: { start: currentUs, duration: sceneDurationUs },
        source_timerange: { start: 0, duration: sceneDurationUs },
      });
    }

    // 3. Subtitle / Spoken Narration Material & Segment (Track 3)
    const narrationText = getSlideNarrationText(slide);
    if (narrationText) {
      const subMatId = `mat_txt_sub_${String(idx + 1).padStart(3, '0')}`;
      materials.texts.push({
        id: subMatId,
        typesetting: 0,
        font_size: 7.5,
        font_path: '',
        text_color: '#FFCC00',
        content: serializeCapCutTextContent(narrationText, 7.5, '#FFCC00'),
      });

      trackTextSubtitles.segments.push({
        id: `seg_txt_sub_${String(idx + 1).padStart(3, '0')}`,
        material_id: subMatId,
        target_timerange: { start: currentUs, duration: sceneDurationUs },
        source_timerange: { start: 0, duration: sceneDurationUs },
      });
    }

    // 4. Advance timeline cursor
    currentUs += sceneDurationUs;
  }

  // Bind Master Audio to Track 4 if present
  if (masterAudioId) {
    const audioMat = materials.audios.find((a) => a.id === masterAudioId);
    const audioDurationUs = masterAudioDurationUs ?? currentUs;
    if (audioMat) {
      audioMat.duration = audioDurationUs;
    }
    const safeSourceDuration = Math.min(audioDurationUs, currentUs);
    trackAudioVoice.segments.push({
      id: `seg_aud_master_${draftId.slice(0, 6)}`,
      material_id: masterAudioId,
      target_timerange: { start: 0, duration: currentUs },
      source_timerange: { start: 0, duration: safeSourceDuration },
      volume: 1.0,
      speed: 1.0,
      extra_material_refs: ['mat_spd_norm'],
    });
  }

  const tracks: CapCutTrack[] = [
    trackVideoCards,
    trackVideoPip,
    trackTextTitles,
    trackTextSubtitles,
    trackAudioVoice,
    trackAudioBgm,
  ];

  const draftContent: CapCutDraftContent = {
    canvas_config: canvasConfig,
    duration: currentUs,
    fps,
    materials,
    tracks,
  };

  // 5. Generate draft_cover.png
  const coverPath = path.join(draftDir, 'draft_cover.png');
  const firstSlideImg = materials.videos[0]?.path || options.slideImages?.[0];
  if (firstSlideImg && fsSync.existsSync(firstSlideImg)) {
    await fs.copyFile(firstSlideImg, coverPath);
  } else {
    throw new Error('Draft cover image could not be created: no valid slide images available.');
  }

  // 6. Generate draft_meta_info.json
  const nowSec = Math.floor(Date.now() / 1000);
  const draftMeta: CapCutMetaInfo = {
    draft_id: draftId,
    draft_name: draftName,
    draft_root_path: draftDir,
    draft_fold_path: draftDir,
    draft_cover_path: coverPath,
    tm_draft_create: nowSec,
    tm_draft_modified: nowSec,
    duration: currentUs,
    draft_timeline_duration: currentUs,
    tm_duration: currentUs,
  };

  const contentPath = path.join(draftDir, 'draft_content.json');
  const metaPath = path.join(draftDir, 'draft_meta_info.json');

  await fs.writeFile(contentPath, JSON.stringify(draftContent, null, 2), 'utf8');
  await fs.writeFile(metaPath, JSON.stringify(draftMeta, null, 2), 'utf8');

  // 7. Optional local install into CapCut / JianYing application draft directory
  let installedLocal = false;
  let localDraftPath: string | undefined;

  if (options.installLocal) {
    const localDirs = detectLocalDraftDirectories(options.localProjectsDir);
    const targetBase =
      options.localProjectsDir
        ? options.localProjectsDir
        : options.targetApp === 'jianying'
          ? localDirs.jianying
          : options.targetApp === 'capcut'
            ? localDirs.capcut
            : localDirs.preferred;

    if (targetBase) {
      await fs.mkdir(targetBase, { recursive: true });
      localDraftPath = path.join(targetBase, draftId);
      await fs.mkdir(localDraftPath, { recursive: true });

      // Clone draftContent so localDraftPath has its own rewritten material paths
      const localDraftContent: CapCutDraftContent = JSON.parse(JSON.stringify(draftContent));

      // Copy referenced video images and rewrite paths
      for (const vid of localDraftContent.materials.videos) {
        if (vid.path && fsSync.existsSync(vid.path)) {
          const destPath = path.join(localDraftPath, path.basename(vid.path));
          if (path.resolve(vid.path) !== path.resolve(destPath)) {
            await fs.copyFile(vid.path, destPath);
          }
          vid.path = destPath;
        }
      }

      // Copy referenced audio assets and rewrite paths
      for (const aud of localDraftContent.materials.audios) {
        if (aud.path && fsSync.existsSync(aud.path)) {
          const destPath = path.join(localDraftPath, path.basename(aud.path));
          if (path.resolve(aud.path) !== path.resolve(destPath)) {
            await fs.copyFile(aud.path, destPath);
          }
          aud.path = destPath;
        }
      }

      // Copy cover image
      const localCoverPath = path.join(localDraftPath, 'draft_cover.png');
      if (fsSync.existsSync(coverPath)) {
        await fs.copyFile(coverPath, localCoverPath);
      }

      // Write rewritten draft_content.json into localDraftPath
      await fs.writeFile(
        path.join(localDraftPath, 'draft_content.json'),
        JSON.stringify(localDraftContent, null, 2),
        'utf8'
      );

      // Write rewritten draft_meta_info.json into localDraftPath
      const localMeta: CapCutMetaInfo = {
        ...draftMeta,
        draft_root_path: localDraftPath,
        draft_fold_path: localDraftPath,
        draft_cover_path: localCoverPath,
      };
      await fs.writeFile(
        path.join(localDraftPath, 'draft_meta_info.json'),
        JSON.stringify(localMeta, null, 2),
        'utf8'
      );

      installedLocal = true;
    }
  }

  return {
    draftId,
    draftName,
    draftDir,
    contentPath,
    metaPath,
    coverPath,
    durationUs: currentUs,
    durationMs: Math.round(currentUs / US_PER_MS),
    installedLocal,
    localDraftPath,
    content: draftContent,
    meta: draftMeta,
  };
}
