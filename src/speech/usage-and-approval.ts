import { readFile } from 'node:fs/promises';
import { basename } from 'node:path';
import type { DeckDocument, DeckSlide, SupportedLocale } from '../schema/types.js';
import {
  AimakeError,
  assertRealParentWithinRoot,
  assertRealPathWithinRoot,
  canonicalJson,
  ensureRootDirectory,
  resolveWithinRoot,
  sanitizeSafeId,
  SCHEMA_VERSION,
  sha256Hex,
  writeExclusive,
} from './foundation.js';
import { splitTtsText } from './providers.js';

export interface TencentSpeechConfiguration {
  region: string;
  voiceType: number;
  primaryLanguage: 1 | 2;
  sampleRate: 8000 | 16000 | 24000;
  codec: 'wav' | 'mp3' | 'pcm';
  enableSubtitles: boolean;
}

export const DEFAULT_TENCENT_SPEECH_CONFIGURATION: TencentSpeechConfiguration = Object.freeze({
  region: 'ap-guangzhou',
  voiceType: 1001,
  primaryLanguage: 1,
  sampleRate: 16000,
  codec: 'wav',
  enableSubtitles: true,
});

export interface DeckSpeechSlide {
  slideId: string;
  index: number;
  narration: string;
  cite?: string;
}

export interface DeckSpeechScript {
  schemaVersion: typeof SCHEMA_VERSION;
  title: string;
  locale: SupportedLocale;
  inputHash: string;
  slides: DeckSpeechSlide[];
}

export interface DeckSpeechUsageEstimateBody {
  schemaVersion: typeof SCHEMA_VERSION;
  providerId: string;
  operation: 'TextToVoice';
  inputHash: string;
  scriptHash: string;
  billableCharacters: number;
  requestCount: number;
  slideCount: number;
  currencyCost: null;
  pricingStatus: 'provider-confirmation-required';
  configuration: TencentSpeechConfiguration;
}

export interface DeckSpeechUsageEstimate extends DeckSpeechUsageEstimateBody {
  estimateHash: string;
}

export interface EstimateDeckSpeechOptions {
  configuration?: Partial<TencentSpeechConfiguration>;
  providerId?: string;
  inputHash?: string;
  includedSlideIds?: ReadonlySet<string> | readonly string[];
}

export interface PaidSpeechApproval {
  schemaVersion: typeof SCHEMA_VERSION;
  runId: string;
  inputHash?: string;
  estimateHash: string;
  scope: 'paid-provider-call';
  approvedBy: 'local-user';
  approvedAt: string;
}

const CJK_CHAR_RE = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uac00-\ud7af]/;
const TERMINAL_PUNCT_RE = /[。！？.!?;；]$/;

function joinTextParts(parts: readonly string[], locale?: SupportedLocale): string {
  const cleaned = parts.map((p) => p.replace(/\s+/g, ' ').trim()).filter(Boolean);
  if (cleaned.length === 0) return '';
  const useCjkPunct =
    (locale !== undefined &&
      (locale === 'zh-CN' || locale === 'zh-TW' || locale === 'ja')) ||
    cleaned.some((part) => CJK_CHAR_RE.test(part));

  let result = '';
  for (let i = 0; i < cleaned.length; i += 1) {
    const part = cleaned[i]!;
    if (i === 0) {
      result = part;
      continue;
    }
    if (TERMINAL_PUNCT_RE.test(result)) {
      result = useCjkPunct ? `${result}${part}` : `${result} ${part}`;
    } else {
      result = useCjkPunct ? `${result}。${part}` : `${result}. ${part}`;
    }
  }
  return result;
}

/**
 * Extracts narration from `slide.speech`, falling back cleanly to `slide.title + slide.bullets`
 * (and subtitle/body/quote/metrics if both speech and title+bullets are empty).
 */
export function extractSlideNarration(slide: DeckSlide, locale?: SupportedLocale): string {
  if (typeof slide.speech === 'string' && slide.speech.trim().length > 0) {
    return slide.speech.replace(/\s+/g, ' ').trim();
  }

  const primaryParts = [slide.title, ...slide.bullets];
  const primary = joinTextParts(primaryParts, locale);
  if (primary.length > 0) {
    return primary;
  }

  const fallbackParts = [
    slide.subtitle ?? '',
    ...slide.bodyParagraphs,
    slide.quote?.text ?? '',
    ...slide.metrics.map((m) => `${m.label}: ${m.value}`),
  ];
  const fallback = joinTextParts(fallbackParts, locale);
  return fallback || `Slide ${slide.index + 1}`;
}

export function resolveSpeechConfiguration(
  partial?: Partial<TencentSpeechConfiguration>,
  locale?: SupportedLocale
): TencentSpeechConfiguration {
  const defaultPrimaryLanguage: 1 | 2 =
    locale === 'en' || locale === 'es' ? 2 : DEFAULT_TENCENT_SPEECH_CONFIGURATION.primaryLanguage;
  return {
    region: partial?.region ?? DEFAULT_TENCENT_SPEECH_CONFIGURATION.region,
    voiceType: partial?.voiceType ?? DEFAULT_TENCENT_SPEECH_CONFIGURATION.voiceType,
    primaryLanguage: partial?.primaryLanguage ?? defaultPrimaryLanguage,
    sampleRate: partial?.sampleRate ?? DEFAULT_TENCENT_SPEECH_CONFIGURATION.sampleRate,
    codec: partial?.codec ?? DEFAULT_TENCENT_SPEECH_CONFIGURATION.codec,
    enableSubtitles: partial?.enableSubtitles ?? DEFAULT_TENCENT_SPEECH_CONFIGURATION.enableSubtitles,
  };
}

export function compileDeckSpeechScript(
  deck: DeckDocument,
  options?: { inputHash?: string }
): DeckSpeechScript {
  if (!Array.isArray(deck.slides) || deck.slides.length === 0) {
    throw new AimakeError('DECK_SLIDES_EMPTY', 'Deck must contain at least one slide');
  }

  const slides: DeckSpeechSlide[] = deck.slides.map((slide, idx) => {
    const slideId = slide.id && slide.id.trim() ? slide.id.trim() : `slide-${idx + 1}`;
    return {
      slideId,
      index: idx,
      narration: extractSlideNarration(slide, deck.frontmatter.locale),
      ...(slide.cite ? { cite: slide.cite } : {}),
    };
  });

  const computedInputHash =
    options?.inputHash ??
    sha256Hex(
      canonicalJson({
        title: deck.frontmatter.title,
        locale: deck.frontmatter.locale,
        slides,
      })
    );

  return {
    schemaVersion: SCHEMA_VERSION,
    title: deck.frontmatter.title,
    locale: deck.frontmatter.locale,
    inputHash: computedInputHash,
    slides,
  };
}

export function estimateDeckSpeechUsage(
  deck: DeckDocument,
  options: EstimateDeckSpeechOptions = {}
): DeckSpeechUsageEstimate {
  const script = compileDeckSpeechScript(deck, { inputHash: options.inputHash });
  const configuration = resolveSpeechConfiguration(options.configuration, deck.frontmatter.locale);
  const providerId = options.providerId ?? 'tencent-tts';

  let selectedSlides = script.slides;
  if (options.includedSlideIds !== undefined) {
    const includeSet =
      options.includedSlideIds instanceof Set
        ? options.includedSlideIds
        : new Set(options.includedSlideIds);
    selectedSlides = script.slides.filter((s) => includeSet.has(s.slideId));
  }

  if (selectedSlides.length === 0) {
    throw new AimakeError(
      'ESTIMATE_SCOPE_EMPTY',
      'Speech estimate must include at least one slide'
    );
  }

  const segments = selectedSlides.flatMap((s) => splitTtsText(s.narration));
  const body: DeckSpeechUsageEstimateBody = {
    schemaVersion: SCHEMA_VERSION,
    providerId,
    operation: 'TextToVoice',
    inputHash: script.inputHash,
    scriptHash: sha256Hex(canonicalJson(script)),
    billableCharacters: segments.reduce((sum, seg) => sum + [...seg].length, 0),
    requestCount: segments.length,
    slideCount: selectedSlides.length,
    currencyCost: null,
    pricingStatus: 'provider-confirmation-required',
    configuration,
  };

  return {
    ...body,
    estimateHash: sha256Hex(canonicalJson(body)),
  };
}

export async function writeDeckSpeechUsageEstimate(
  runDir: string,
  estimate: DeckSpeechUsageEstimate
): Promise<string> {
  const root = await ensureRootDirectory(runDir);
  const targetPath = resolveWithinRoot(root, 'speech-estimate.json');
  await assertRealParentWithinRoot(root, targetPath);
  try {
    const existing = JSON.parse(await readFile(targetPath, 'utf8')) as DeckSpeechUsageEstimate;
    if (canonicalJson(existing) !== canonicalJson(estimate)) {
      throw new AimakeError(
        'ESTIMATE_CONFLICT',
        'Existing speech estimate differs from current deck or configuration'
      );
    }
    return targetPath;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
  }
  await writeExclusive(targetPath, `${JSON.stringify(estimate, null, 2)}\n`);
  return targetPath;
}

export async function readDeckSpeechUsageEstimate(runDir: string): Promise<DeckSpeechUsageEstimate> {
  const root = await ensureRootDirectory(runDir);
  const targetPath = resolveWithinRoot(root, 'speech-estimate.json');
  await assertRealPathWithinRoot(root, targetPath);
  const value = JSON.parse(await readFile(targetPath, 'utf8')) as DeckSpeechUsageEstimate;
  const { estimateHash, ...body } = value;
  if (!/^[a-f0-9]{64}$/.test(estimateHash) || sha256Hex(canonicalJson(body)) !== estimateHash) {
    throw new AimakeError('ESTIMATE_INTEGRITY_FAILED', 'Speech estimate hash is invalid');
  }
  return value;
}

export async function approvePaidSpeechCall(
  runDir: string,
  estimateOrHash: string | DeckSpeechUsageEstimate,
  options?: { runId?: string; inputHash?: string; now?: Date }
): Promise<PaidSpeechApproval> {
  const root = await ensureRootDirectory(runDir);
  const runId = sanitizeSafeId(options?.runId ?? basename(root), 'speech-run');
  let confirmedEstimateHash: string;
  let inputHash = options?.inputHash;

  if (typeof estimateOrHash === 'string') {
    confirmedEstimateHash = estimateOrHash;
  } else {
    const { estimateHash, ...body } = estimateOrHash;
    if (!/^[a-f0-9]{64}$/.test(estimateHash) || sha256Hex(canonicalJson(body)) !== estimateHash) {
      throw new AimakeError('ESTIMATE_INTEGRITY_FAILED', 'Speech estimate hash is invalid');
    }
    confirmedEstimateHash = estimateHash;
    inputHash = inputHash ?? estimateOrHash.inputHash;
    await writeDeckSpeechUsageEstimate(root, estimateOrHash);
  }

  if (!/^[a-f0-9]{64}$/.test(confirmedEstimateHash)) {
    throw new AimakeError(
      'APPROVAL_ESTIMATE_INVALID',
      'confirmedEstimateHash must be a 64-character hex SHA-256 digest'
    );
  }

  // Verify against speech-estimate.json if already present in runDir
  try {
    const existingEstimate = await readDeckSpeechUsageEstimate(root);
    if (existingEstimate.estimateHash !== confirmedEstimateHash) {
      throw new AimakeError(
        'APPROVAL_ESTIMATE_MISMATCH',
        'Confirmed estimate hash does not match speech-estimate.json in runDir'
      );
    }
    inputHash = inputHash ?? existingEstimate.inputHash;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
  }

  const approvalPath = resolveWithinRoot(root, 'approval-paid-provider-call.json');
  await assertRealParentWithinRoot(root, approvalPath);

  try {
    const existing = await readPaidSpeechApproval(root);
    if (existing.estimateHash !== confirmedEstimateHash) {
      throw new AimakeError(
        'APPROVAL_ESTIMATE_MISMATCH',
        'Existing paid-provider approval is bound to another estimateHash'
      );
    }
    return existing;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
  }

  const approval: PaidSpeechApproval = {
    schemaVersion: SCHEMA_VERSION,
    runId,
    ...(inputHash ? { inputHash } : {}),
    estimateHash: confirmedEstimateHash,
    scope: 'paid-provider-call',
    approvedBy: 'local-user',
    approvedAt: (options?.now ?? new Date()).toISOString(),
  };

  await writeExclusive(approvalPath, `${JSON.stringify(approval, null, 2)}\n`);
  return approval;
}

export async function readPaidSpeechApproval(runDir: string): Promise<PaidSpeechApproval> {
  const root = await ensureRootDirectory(runDir);
  const approvalPath = resolveWithinRoot(root, 'approval-paid-provider-call.json');
  await assertRealPathWithinRoot(root, approvalPath);
  const approval = JSON.parse(await readFile(approvalPath, 'utf8')) as PaidSpeechApproval;
  const valid =
    approval.schemaVersion === SCHEMA_VERSION &&
    typeof approval.runId === 'string' &&
    approval.runId.length > 0 &&
    typeof approval.estimateHash === 'string' &&
    /^[a-f0-9]{64}$/.test(approval.estimateHash) &&
    approval.scope === 'paid-provider-call' &&
    approval.approvedBy === 'local-user' &&
    typeof approval.approvedAt === 'string' &&
    !Number.isNaN(Date.parse(approval.approvedAt));

  if (!valid) {
    throw new AimakeError(
      'APPROVAL_INTEGRITY_FAILED',
      'Paid-provider approval record is invalid or corrupted'
    );
  }
  return approval;
}
