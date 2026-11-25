import { readFile, lstat, unlink } from 'node:fs/promises';
import { basename } from 'node:path';
import type { DeckDocument } from '../schema/types.js';
import {
  AimakeError,
  assertExactKeys,
  assertRealParentWithinRoot,
  assertRealPathWithinRoot,
  canonicalJson,
  ensureChildDirectory,
  ensureRootDirectory,
  resolveWithinRoot,
  sanitizeSafeId,
  SCHEMA_VERSION,
  schemaRecord,
  sha256Hex,
  writeExclusive,
} from './foundation.js';
import {
  offlineFixtureSpeechProvider,
  OFFLINE_TONE_GENERATOR,
  splitTtsText,
  type SpeechProvider,
  type SpeechProviderProvenance,
  type SpeechSubtitle,
} from './providers.js';
import { buildSrt, type TimedSpeechChunk } from './srt.js';
import {
  compileDeckSpeechScript,
  estimateDeckSpeechUsage,
  readPaidSpeechApproval,
  resolveSpeechConfiguration,
  type DeckSpeechUsageEstimate,
  type PaidSpeechApproval,
  type TencentSpeechConfiguration,
} from './usage-and-approval.js';
import { concatenatePcmWavs, parsePcmWav } from './wav.js';

export interface SpeechAiDisclosure {
  visibleLabel: string;
  embeddedMetadata: boolean;
  exportPolicy: 'human-review-required';
  syntheticSpeech: boolean;
  providerId: string;
}

export interface DeckSpeechChunkProvenance {
  kind: 'reused';
  fromRunId: string;
  fromRunDir?: string;
  requestId: string;
}

export interface DeckSpeechChunkArtifact {
  slideId: string;
  chunkIndex: number;
  textHash: string;
  audioPath: string;
  subtitlesPath: string;
  durationMs: number;
  requestId: string;
  sessionId: string;
  audioSha256: string;
  subtitlesSha256: string;
  provenance?: DeckSpeechChunkProvenance;
}

export interface DeckSpeechManifest {
  schemaVersion: typeof SCHEMA_VERSION;
  runId: string;
  providerId: string;
  inputHash: string;
  scriptHash: string;
  estimateHash: string | null;
  configuration: TencentSpeechConfiguration;
  audioPath: string;
  audioSha256: string;
  srtPath: string;
  srtSha256: string;
  totalDurationMs: number;
  slideDurationsMs: Record<string, number>;
  aiDisclosure: SpeechAiDisclosure;
  chunks: DeckSpeechChunkArtifact[];
  provenance?: SpeechProviderProvenance;
}

export interface SynthesizeDeckSpeechOptions {
  provider?: SpeechProvider;
  configuration?: Partial<TencentSpeechConfiguration>;
  runId?: string;
  inputHash?: string;
  reuseFromRunDir?: string;
  reuseSlideIds?: ReadonlySet<string> | readonly string[];
  estimate?: DeckSpeechUsageEstimate;
  aiDisclosure?: Partial<SpeechAiDisclosure>;
  cleanIncompleteChunks?: boolean;
  forceRecovery?: boolean;
}

export interface SynthesizeDeckSpeechResult {
  audioPath: string;
  srtPath: string;
  manifestPath: string;
  manifest: DeckSpeechManifest;
  slideDurationsMs: Record<string, number>;
  totalDurationMs: number;
  providerCalls: number;
  reusedSlideIds: string[];
  synthesizedSlideIds: string[];
}

export function wavDurationMs(wavBuffer: Uint8Array): number {
  return parsePcmWav(wavBuffer).durationMs;
}

export function concatenatePcmWavBuffers(
  wavBuffers: readonly Uint8Array[],
  defaultSampleRate = 16000
): Buffer {
  return concatenatePcmWavs(wavBuffers, defaultSampleRate).wav;
}

function isOfflineFixtureProvider(provider: SpeechProvider): boolean {
  return (
    provider.providerId === 'offline-fixture' &&
    provider.provenance?.kind === 'offline-fixture' &&
    provider.provenance.generator === OFFLINE_TONE_GENERATOR
  );
}

export async function verifyPaidSpeechApproval(
  runDir: string,
  estimate: DeckSpeechUsageEstimate,
  provider: SpeechProvider,
  options?: { alternateEstimateHash?: string }
): Promise<PaidSpeechApproval | null> {
  if (isOfflineFixtureProvider(provider)) {
    return null;
  }

  if (provider.providerId !== estimate.providerId) {
    throw new AimakeError(
      'PROVIDER_MISMATCH',
      `Speech provider '${provider.providerId}' does not match estimate provider '${estimate.providerId}'`
    );
  }

  let approval: PaidSpeechApproval;
  try {
    approval = await readPaidSpeechApproval(runDir);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new AimakeError(
        'PAID_APPROVAL_REQUIRED',
        'Paid TTS provider call requires an approved speech estimate in runDir',
        {
          providerId: provider.providerId,
          estimateHash: estimate.estimateHash,
          billableCharacters: estimate.billableCharacters,
          requestCount: estimate.requestCount,
        }
      );
    }
    throw error;
  }

  const matchesPrimary = approval.estimateHash === estimate.estimateHash;
  const matchesAlternate =
    options?.alternateEstimateHash !== undefined &&
    approval.estimateHash === options.alternateEstimateHash;

  if (!matchesPrimary && !matchesAlternate) {
    throw new AimakeError(
      'APPROVAL_ESTIMATE_MISMATCH',
      'Paid-provider approval does not match the current speech estimate',
      {
        approvedEstimateHash: approval.estimateHash,
        expectedEstimateHash: estimate.estimateHash,
      }
    );
  }

  return approval;
}

function safeSlideFileStem(slideId: string, fallbackIndex: number): string {
  return sanitizeSafeId(slideId, `slide-${fallbackIndex + 1}`);
}

function relativeToRoot(root: string, targetPath: string): string {
  const prefix = root.endsWith('/') ? root : `${root}/`;
  if (!targetPath.startsWith(prefix)) {
    throw new AimakeError('PATH_ESCAPE', 'Artifact path is outside runDir');
  }
  return targetPath.slice(prefix.length);
}

async function writeOrVerifyFile(
  targetPath: string,
  content: string | Uint8Array,
  conflictCode: string
): Promise<void> {
  const expectedSha = sha256Hex(content);
  try {
    const existing = await readFile(targetPath);
    if (sha256Hex(existing) !== expectedSha) {
      throw new AimakeError(
        conflictCode,
        'Existing speech artifact differs from deterministic output'
      );
    }
    return;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
  }
  await writeExclusive(targetPath, content);
}

async function readChunkReceipt(
  root: string,
  receiptPath: string,
  audioPath: string,
  subtitlesPath: string,
  expected: Pick<DeckSpeechChunkArtifact, 'slideId' | 'chunkIndex' | 'textHash' | 'sessionId'>,
  options?: { autoClean?: boolean }
): Promise<{
  receipt: DeckSpeechChunkArtifact;
  audio: Buffer;
  subtitles: SpeechSubtitle[];
} | undefined> {
  try {
    await Promise.all([
      assertRealPathWithinRoot(root, receiptPath),
      assertRealPathWithinRoot(root, audioPath),
      assertRealPathWithinRoot(root, subtitlesPath),
    ]);
    const [receiptRaw, audio, subtitlesRaw] = await Promise.all([
      readFile(receiptPath, 'utf8'),
      readFile(audioPath),
      readFile(subtitlesPath),
    ]);
    const receipt = JSON.parse(receiptRaw) as DeckSpeechChunkArtifact;
    const expectedAudioRel = relativeToRoot(root, audioPath);
    const expectedSubtitlesRel = relativeToRoot(root, subtitlesPath);

    const validProvenance =
      receipt.provenance === undefined ||
      (receipt.provenance.kind === 'reused' &&
        typeof receipt.provenance.fromRunId === 'string' &&
        receipt.provenance.fromRunId.length > 0 &&
        typeof receipt.provenance.requestId === 'string' &&
        receipt.provenance.requestId.length > 0);

    const valid =
      receipt.slideId === expected.slideId &&
      receipt.chunkIndex === expected.chunkIndex &&
      receipt.textHash === expected.textHash &&
      receipt.sessionId === expected.sessionId &&
      receipt.audioPath === expectedAudioRel &&
      receipt.subtitlesPath === expectedSubtitlesRel &&
      typeof receipt.durationMs === 'number' &&
      receipt.durationMs >= 0 &&
      receipt.audioSha256 === sha256Hex(audio) &&
      receipt.subtitlesSha256 === sha256Hex(subtitlesRaw) &&
      typeof receipt.requestId === 'string' &&
      receipt.requestId.length > 0 &&
      validProvenance;

    if (!valid) {
      throw new AimakeError(
        'SPEECH_ARTIFACT_INTEGRITY_FAILED',
        `Speech chunk receipt failed SHA-256 verification for ${expected.slideId}`
      );
    }

    const parsedSubtitles = JSON.parse(subtitlesRaw.toString('utf8')) as SpeechSubtitle[];
    if (!Array.isArray(parsedSubtitles)) {
      throw new AimakeError(
        'SPEECH_ARTIFACT_INTEGRITY_FAILED',
        `Speech chunk subtitles are invalid for ${expected.slideId}`
      );
    }

    return { receipt, audio, subtitles: parsedSubtitles };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    const leftovers = await Promise.all(
      [audioPath, subtitlesPath, receiptPath].map(async (filePath) => {
        try {
          await lstat(filePath);
          return filePath;
        } catch (inner) {
          if ((inner as NodeJS.ErrnoException).code === 'ENOENT') return null;
          throw inner;
        }
      })
    );
    const existingLeftovers = leftovers.filter((p): p is string => Boolean(p));
    if (existingLeftovers.length > 0) {
      if (options?.autoClean) {
        await Promise.all(
          existingLeftovers.map(async (filePath) => {
            try {
              await unlink(filePath);
            } catch {
              // ignore
            }
          })
        );
        return undefined;
      }
      throw new AimakeError(
        'SPEECH_RECOVERY_REQUIRED',
        'Partial speech chunk artifacts exist; refusing to repeat a provider call'
      );
    }
    return undefined;
  }
}

export async function readDeckSpeechManifest(runDir: string): Promise<DeckSpeechManifest> {
  const root = await ensureRootDirectory(runDir);
  const manifestPath = resolveWithinRoot(root, 'manifest.json');
  await assertRealPathWithinRoot(root, manifestPath);

  const raw = schemaRecord(
    JSON.parse(await readFile(manifestPath, 'utf8')) as unknown,
    '$speechManifest',
    'SPEECH_MANIFEST_INTEGRITY_FAILED'
  );
  assertExactKeys(
    raw,
    [
      'schemaVersion',
      'runId',
      'providerId',
      'inputHash',
      'scriptHash',
      'estimateHash',
      'configuration',
      'audioPath',
      'audioSha256',
      'srtPath',
      'srtSha256',
      'totalDurationMs',
      'slideDurationsMs',
      'aiDisclosure',
      'chunks',
      'provenance',
    ],
    '$speechManifest',
    'SPEECH_MANIFEST_INTEGRITY_FAILED'
  );

  if (Array.isArray(raw.chunks)) {
    for (const [index, chunkValue] of raw.chunks.entries()) {
      const chunkRecord = schemaRecord(
        chunkValue,
        `$speechManifest.chunks[${index}]`,
        'SPEECH_MANIFEST_INTEGRITY_FAILED'
      );
      assertExactKeys(
        chunkRecord,
        [
          'slideId',
          'chunkIndex',
          'textHash',
          'audioPath',
          'subtitlesPath',
          'durationMs',
          'requestId',
          'sessionId',
          'audioSha256',
          'subtitlesSha256',
          'provenance',
        ],
        `$speechManifest.chunks[${index}]`,
        'SPEECH_MANIFEST_INTEGRITY_FAILED'
      );
    }
  }

  const manifest = raw as unknown as DeckSpeechManifest;
  const valid =
    manifest.schemaVersion === SCHEMA_VERSION &&
    typeof manifest.runId === 'string' &&
    manifest.runId.length > 0 &&
    typeof manifest.providerId === 'string' &&
    manifest.providerId.length > 0 &&
    typeof manifest.inputHash === 'string' &&
    /^[a-f0-9]{64}$/.test(manifest.inputHash) &&
    typeof manifest.scriptHash === 'string' &&
    /^[a-f0-9]{64}$/.test(manifest.scriptHash) &&
    (manifest.estimateHash === null ||
      (typeof manifest.estimateHash === 'string' && /^[a-f0-9]{64}$/.test(manifest.estimateHash))) &&
    typeof manifest.audioPath === 'string' &&
    typeof manifest.audioSha256 === 'string' &&
    /^[a-f0-9]{64}$/.test(manifest.audioSha256) &&
    typeof manifest.srtPath === 'string' &&
    typeof manifest.srtSha256 === 'string' &&
    /^[a-f0-9]{64}$/.test(manifest.srtSha256) &&
    typeof manifest.totalDurationMs === 'number' &&
    manifest.totalDurationMs >= 0 &&
    manifest.slideDurationsMs !== null &&
    typeof manifest.slideDurationsMs === 'object' &&
    !Array.isArray(manifest.slideDurationsMs) &&
    Array.isArray(manifest.chunks) &&
    manifest.chunks.length > 0;

  if (!valid) {
    throw new AimakeError(
      'SPEECH_MANIFEST_INTEGRITY_FAILED',
      'Speech manifest failed schema validation'
    );
  }

  const stitchedAudioPath = resolveWithinRoot(root, manifest.audioPath);
  const srtFilePath = resolveWithinRoot(root, manifest.srtPath);
  await Promise.all([
    assertRealPathWithinRoot(root, stitchedAudioPath),
    assertRealPathWithinRoot(root, srtFilePath),
  ]);
  const [stitchedAudio, srtBytes] = await Promise.all([
    readFile(stitchedAudioPath),
    readFile(srtFilePath),
  ]);
  if (sha256Hex(stitchedAudio) !== manifest.audioSha256 || sha256Hex(srtBytes) !== manifest.srtSha256) {
    throw new AimakeError(
      'SPEECH_MANIFEST_INTEGRITY_FAILED',
      'Stitched narration.wav or subtitles.srt does not match manifest SHA-256'
    );
  }

  for (const chunk of manifest.chunks) {
    const chunkAudioPath = resolveWithinRoot(root, chunk.audioPath);
    const chunkSubtitlesPath = resolveWithinRoot(root, chunk.subtitlesPath);
    const chunkReceiptPath = resolveWithinRoot(
      root,
      chunk.subtitlesPath.replace(/\.subtitles\.json$/, '.receipt.json')
    );
    const verified = await readChunkReceipt(root, chunkReceiptPath, chunkAudioPath, chunkSubtitlesPath, {
      slideId: chunk.slideId,
      chunkIndex: chunk.chunkIndex,
      textHash: chunk.textHash,
      sessionId: chunk.sessionId,
    });
    if (!verified || canonicalJson(verified.receipt) !== canonicalJson(chunk)) {
      throw new AimakeError(
        'SPEECH_MANIFEST_INTEGRITY_FAILED',
        `Speech manifest chunk for ${chunk.slideId} does not match its verified receipt`
      );
    }
  }

  return manifest;
}

export async function synthesizeDeckSpeech(
  deck: DeckDocument,
  runDir: string,
  options: SynthesizeDeckSpeechOptions = {}
): Promise<SynthesizeDeckSpeechResult> {
  const root = await ensureRootDirectory(runDir);
  const provider = options.provider ?? offlineFixtureSpeechProvider();
  const offlineFixture = isOfflineFixtureProvider(provider);
  const runId = sanitizeSafeId(options.runId ?? basename(root), 'speech-run');
  const autoClean = options.cleanIncompleteChunks ?? options.forceRecovery ?? true;
  const script = compileDeckSpeechScript(deck, { inputHash: options.inputHash });
  const configuration = resolveSpeechConfiguration(options.configuration, deck.frontmatter.locale);

  if (configuration.codec !== 'wav') {
    throw new AimakeError(
      'SPEECH_CODEC_UNSUPPORTED',
      'Deck narration synthesis currently requires PCM WAV codec'
    );
  }

  const chunksDir = await ensureChildDirectory(root, 'chunks');

  // Step 1: Load and verify reusable base run if requested
  let baseRoot: string | undefined;
  let baseManifest: DeckSpeechManifest | undefined;
  const reusableChunksByKey = new Map<string, DeckSpeechChunkArtifact>();
  const reusableSlideIdsFromBase = new Set<string>();

  if (options.reuseFromRunDir !== undefined) {
    baseRoot = await ensureRootDirectory(options.reuseFromRunDir);
    baseManifest = await readDeckSpeechManifest(baseRoot).catch((error) => {
      throw new AimakeError(
        'SPEECH_REUSE_REQUIRED',
        'Verified base speech manifest is required; refusing duplicate provider calls',
        { cause: error instanceof Error ? error.message : String(error) }
      );
    });

    if (baseManifest.providerId !== provider.providerId) {
      throw new AimakeError(
        'SPEECH_REUSE_PROVIDER_MISMATCH',
        `Base speech uses provider '${baseManifest.providerId}' instead of '${provider.providerId}'`
      );
    }
    if (canonicalJson(baseManifest.configuration) !== canonicalJson(configuration)) {
      throw new AimakeError(
        'SPEECH_REUSE_CONFIGURATION_MISMATCH',
        'Base speech configuration differs from the requested configuration'
      );
    }

    const baseChunksBySlide = new Map<string, DeckSpeechChunkArtifact[]>();
    for (const chunk of baseManifest.chunks) {
      reusableChunksByKey.set(`${chunk.slideId}\0${chunk.chunkIndex}\0${chunk.textHash}`, chunk);
      const list = baseChunksBySlide.get(chunk.slideId) ?? [];
      list.push(chunk);
      baseChunksBySlide.set(chunk.slideId, list);
    }

    const explicitReuseSet =
      options.reuseSlideIds !== undefined
        ? options.reuseSlideIds instanceof Set
          ? options.reuseSlideIds
          : new Set(options.reuseSlideIds)
        : undefined;

    for (const slide of script.slides) {
      const texts = splitTtsText(slide.narration);
      const baseSlideChunks = baseChunksBySlide.get(slide.slideId) ?? [];
      const exactMatch =
        baseSlideChunks.length === texts.length &&
        texts.every((text, chunkIndex) =>
          reusableChunksByKey.has(`${slide.slideId}\0${chunkIndex}\0${sha256Hex(text)}`)
        );

      if (explicitReuseSet !== undefined) {
        if (explicitReuseSet.has(slide.slideId)) {
          if (!exactMatch) {
            throw new AimakeError(
              'SPEECH_REUSE_REQUIRED',
              `Verified speech for slide '${slide.slideId}' is unavailable in reuseFromRunDir; refusing duplicate provider call`
            );
          }
          reusableSlideIdsFromBase.add(slide.slideId);
        }
      } else if (exactMatch) {
        reusableSlideIdsFromBase.add(slide.slideId);
      }
    }
  }

  // Step 2: Inspect same-run cache to determine which slides actually require provider calls
  const slidesNeedingProviderCall: string[] = [];
  for (const slide of script.slides) {
    if (reusableSlideIdsFromBase.has(slide.slideId)) continue;
    const texts = splitTtsText(slide.narration);
    const stem = safeSlideFileStem(slide.slideId, slide.index);
    let allCached = true;
    for (const [chunkIndex, text] of texts.entries()) {
      const baseName = `${stem}-${chunkIndex + 1}`;
      const sessionId = `${runId}-${baseName}`;
      const audioFilePath = resolveWithinRoot(chunksDir, `${baseName}.${configuration.codec}`);
      const subtitlesFilePath = resolveWithinRoot(chunksDir, `${baseName}.subtitles.json`);
      const receiptFilePath = resolveWithinRoot(chunksDir, `${baseName}.receipt.json`);
      const cached = await readChunkReceipt(
        root,
        receiptFilePath,
        audioFilePath,
        subtitlesFilePath,
        {
          slideId: slide.slideId,
          chunkIndex,
          textHash: sha256Hex(text),
          sessionId,
        },
        { autoClean }
      );
      if (!cached) {
        allCached = false;
        break;
      }
    }
    if (!allCached) {
      slidesNeedingProviderCall.push(slide.slideId);
    }
  }

  // Step 3: Compute deterministic run estimate and enforce paid-provider approval before ANY provider call
  const slidesNotReusedFromBase = script.slides
    .filter((slide) => !reusableSlideIdsFromBase.has(slide.slideId))
    .map((slide) => slide.slideId);

  const fullEstimate = estimateDeckSpeechUsage(deck, {
    configuration,
    providerId: provider.providerId,
    inputHash: script.inputHash,
  });
  const scopedEstimate =
    slidesNotReusedFromBase.length > 0
      ? estimateDeckSpeechUsage(deck, {
          configuration,
          providerId: provider.providerId,
          inputHash: script.inputHash,
          includedSlideIds: slidesNotReusedFromBase,
        })
      : null;

  if (options.estimate) {
    if (
      options.estimate.inputHash !== script.inputHash ||
      options.estimate.scriptHash !== fullEstimate.scriptHash
    ) {
      throw new AimakeError(
        'SCRIPT_CHANGED_AFTER_APPROVAL',
        'Deck narration script does not match the provided speech estimate'
      );
    }
  }

  const activeEstimate = options.estimate ?? scopedEstimate ?? fullEstimate;

  if (!offlineFixture && slidesNeedingProviderCall.length > 0) {
    await verifyPaidSpeechApproval(root, activeEstimate, provider, {
      alternateEstimateHash: options.estimate ? undefined : fullEstimate.estimateHash,
    });
  }

  // Step 4: Materialize every chunk (cached -> reused -> synthesized)
  const chunks: DeckSpeechChunkArtifact[] = [];
  const allWavBuffers: Buffer[] = [];
  const timedChunks: TimedSpeechChunk[] = [];
  const slideDurationsMs: Record<string, number> = {};
  const reusedSlideIds: string[] = [];
  const synthesizedSlideIds: string[] = [];
  let providerCalls = 0;

  for (const slide of script.slides) {
    const texts = splitTtsText(slide.narration);
    const stem = safeSlideFileStem(slide.slideId, slide.index);
    let slideDurationMs = 0;
    let slideUsedProvider = false;
    let slideUsedReuseOrCache = false;

    for (const [chunkIndex, text] of texts.entries()) {
      const baseName = `${stem}-${chunkIndex + 1}`;
      const sessionId = `${runId}-${baseName}`;
      const audioFilePath = resolveWithinRoot(chunksDir, `${baseName}.${configuration.codec}`);
      const subtitlesFilePath = resolveWithinRoot(chunksDir, `${baseName}.subtitles.json`);
      const receiptFilePath = resolveWithinRoot(chunksDir, `${baseName}.receipt.json`);
      await assertRealParentWithinRoot(root, audioFilePath);
      const textHash = sha256Hex(text);

      // 4a. Check same-run cache
      const cached = await readChunkReceipt(
        root,
        receiptFilePath,
        audioFilePath,
        subtitlesFilePath,
        {
          slideId: slide.slideId,
          chunkIndex,
          textHash,
          sessionId,
        },
        { autoClean }
      );
      if (cached) {
        chunks.push(cached.receipt);
        allWavBuffers.push(cached.audio);
        timedChunks.push({
          slideId: slide.slideId,
          chunkIndex,
          durationMs: cached.receipt.durationMs,
          subtitles: cached.subtitles,
          fallbackText: text,
        });
        slideDurationMs += cached.receipt.durationMs;
        slideUsedReuseOrCache = true;
        continue;
      }

      // 4b. Reuse verified chunk from base run
      if (reusableSlideIdsFromBase.has(slide.slideId) && baseRoot && baseManifest) {
        const baseChunk = reusableChunksByKey.get(`${slide.slideId}\0${chunkIndex}\0${textHash}`);
        if (!baseChunk) {
          throw new AimakeError(
            'SPEECH_REUSE_REQUIRED',
            `Verified chunk for slide '${slide.slideId}' is unavailable during reuse`
          );
        }
        const [audioBytes, subtitlesBytes] = await Promise.all([
          readFile(resolveWithinRoot(baseRoot, baseChunk.audioPath)),
          readFile(resolveWithinRoot(baseRoot, baseChunk.subtitlesPath)),
        ]);
        if (
          sha256Hex(audioBytes) !== baseChunk.audioSha256 ||
          sha256Hex(subtitlesBytes) !== baseChunk.subtitlesSha256
        ) {
          throw new AimakeError(
            'SPEECH_REUSE_REQUIRED',
            `Verified speech for slide '${slide.slideId}' changed during reuse; refusing duplicate provider call`
          );
        }

        const durationMs = wavDurationMs(audioBytes);
        const parsedSubtitles = JSON.parse(subtitlesBytes.toString('utf8')) as SpeechSubtitle[];
        await writeExclusive(audioFilePath, audioBytes);
        await writeExclusive(subtitlesFilePath, subtitlesBytes);

        const receipt: DeckSpeechChunkArtifact = {
          slideId: slide.slideId,
          chunkIndex,
          textHash,
          audioPath: relativeToRoot(root, audioFilePath),
          subtitlesPath: relativeToRoot(root, subtitlesFilePath),
          durationMs,
          requestId: `reused:${baseChunk.requestId}`,
          sessionId,
          audioSha256: sha256Hex(audioBytes),
          subtitlesSha256: sha256Hex(subtitlesBytes),
          provenance: {
            kind: 'reused',
            fromRunId: baseManifest.runId,
            fromRunDir: basename(baseRoot),
            requestId: baseChunk.requestId,
          },
        };
        await writeExclusive(receiptFilePath, `${JSON.stringify(receipt, null, 2)}\n`);

        chunks.push(receipt);
        allWavBuffers.push(audioBytes);
        timedChunks.push({
          slideId: slide.slideId,
          chunkIndex,
          durationMs,
          subtitles: parsedSubtitles,
          fallbackText: text,
        });
        slideDurationMs += durationMs;
        slideUsedReuseOrCache = true;
        continue;
      }

      // 4c. Synthesize via speech provider
      const result = await provider.synthesize({
        text,
        sessionId,
        voiceType: configuration.voiceType,
        primaryLanguage: configuration.primaryLanguage,
        sampleRate: configuration.sampleRate,
        codec: configuration.codec,
        enableSubtitles: configuration.enableSubtitles,
      });
      providerCalls += 1;

      const audioBuffer = Buffer.isBuffer(result.audio)
        ? result.audio
        : Buffer.from(result.audio.buffer, result.audio.byteOffset, result.audio.byteLength);
      const durationMs = wavDurationMs(audioBuffer);
      const subtitlesJson = `${JSON.stringify(result.subtitles, null, 2)}\n`;

      await writeExclusive(audioFilePath, audioBuffer);
      await writeExclusive(subtitlesFilePath, subtitlesJson);

      const receipt: DeckSpeechChunkArtifact = {
        slideId: slide.slideId,
        chunkIndex,
        textHash,
        audioPath: relativeToRoot(root, audioFilePath),
        subtitlesPath: relativeToRoot(root, subtitlesFilePath),
        durationMs,
        requestId: result.requestId,
        sessionId: result.sessionId,
        audioSha256: sha256Hex(audioBuffer),
        subtitlesSha256: sha256Hex(subtitlesJson),
      };
      await writeExclusive(receiptFilePath, `${JSON.stringify(receipt, null, 2)}\n`);

      chunks.push(receipt);
      allWavBuffers.push(audioBuffer);
      timedChunks.push({
        slideId: slide.slideId,
        chunkIndex,
        durationMs,
        subtitles: result.subtitles,
        fallbackText: text,
      });
      slideDurationMs += durationMs;
      slideUsedProvider = true;
    }

    slideDurationsMs[slide.slideId] = slideDurationMs;
    if (slideUsedProvider) {
      synthesizedSlideIds.push(slide.slideId);
    } else if (slideUsedReuseOrCache) {
      reusedSlideIds.push(slide.slideId);
    }
  }

  // Step 5: Stitch narration.wav, build subtitles.srt, and write manifest.json
  const stitched = concatenatePcmWavs(allWavBuffers, configuration.sampleRate);
  const srtContent = buildSrt(timedChunks);

  const audioPath = resolveWithinRoot(root, 'narration.wav');
  const srtPath = resolveWithinRoot(root, 'subtitles.srt');
  const manifestPath = resolveWithinRoot(root, 'manifest.json');

  await assertRealParentWithinRoot(root, audioPath);
  await assertRealParentWithinRoot(root, srtPath);
  await assertRealParentWithinRoot(root, manifestPath);

  await writeOrVerifyFile(audioPath, stitched.wav, 'SPEECH_ARTIFACT_CONFLICT');
  await writeOrVerifyFile(srtPath, srtContent, 'SPEECH_ARTIFACT_CONFLICT');

  const aiDisclosure: SpeechAiDisclosure = {
    visibleLabel: options.aiDisclosure?.visibleLabel ?? 'AI-GENERATED DRAFT',
    embeddedMetadata: options.aiDisclosure?.embeddedMetadata ?? false,
    exportPolicy: 'human-review-required',
    syntheticSpeech: options.aiDisclosure?.syntheticSpeech ?? true,
    providerId: provider.providerId,
  };

  const manifest: DeckSpeechManifest = {
    schemaVersion: SCHEMA_VERSION,
    runId,
    providerId: provider.providerId,
    inputHash: script.inputHash,
    scriptHash: fullEstimate.scriptHash,
    estimateHash: scopedEstimate ? activeEstimate.estimateHash : null,
    configuration,
    audioPath: 'narration.wav',
    audioSha256: sha256Hex(stitched.wav),
    srtPath: 'subtitles.srt',
    srtSha256: sha256Hex(srtContent),
    totalDurationMs: stitched.durationMs,
    slideDurationsMs,
    aiDisclosure,
    chunks,
    ...(provider.provenance === undefined ? {} : { provenance: provider.provenance }),
  };

  try {
    const existing = JSON.parse(await readFile(manifestPath, 'utf8')) as DeckSpeechManifest;
    if (canonicalJson(existing) !== canonicalJson(manifest)) {
      throw new AimakeError(
        'SPEECH_MANIFEST_CONFLICT',
        'Existing speech manifest differs from verified chunk receipts'
      );
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    await writeExclusive(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  }

  return {
    audioPath,
    srtPath,
    manifestPath,
    manifest,
    slideDurationsMs,
    totalDurationMs: stitched.durationMs,
    providerCalls,
    reusedSlideIds,
    synthesizedSlideIds,
  };
}
