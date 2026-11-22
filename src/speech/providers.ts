import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { AimakeError } from './foundation.js';
import { createPcmWavHeader } from './wav.js';

export interface SpeechRequest {
  text: string;
  sessionId: string;
  voiceType: number;
  primaryLanguage: 1 | 2;
  sampleRate: 8000 | 16000 | 24000;
  codec: 'wav' | 'mp3' | 'pcm';
  enableSubtitles: boolean;
}

export interface SpeechSubtitle {
  text: string;
  beginTimeMs: number;
  endTimeMs: number;
  beginIndex: number;
  endIndex: number;
  phoneme?: string;
}

export interface SpeechResult {
  audio: Uint8Array;
  sessionId: string;
  requestId: string;
  subtitles: SpeechSubtitle[];
}

export const OFFLINE_TONE_GENERATOR = 'aimake.deterministic-tone.v1' as const;

export interface SpeechProviderProvenance {
  kind: 'offline-fixture';
  generator: typeof OFFLINE_TONE_GENERATOR;
  license: 'CC0-1.0';
  actualCost: {
    currency: 'USD';
    amount: 0;
    status: 'no-provider-call';
  };
}

export interface SpeechProvider {
  readonly providerId: string;
  readonly provenance?: SpeechProviderProvenance;
  synthesize(request: SpeechRequest): Promise<SpeechResult>;
}

export function splitTtsText(text: string, maximumCodePoints = 140): string[] {
  if (!Number.isInteger(maximumCodePoints) || maximumCodePoints < 1 || maximumCodePoints > 150) {
    throw new AimakeError(
      'TTS_SEGMENT_INVALID',
      'TTS segment limit must be between 1 and 150 code points'
    );
  }
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (!normalized) {
    throw new AimakeError('TTS_TEXT_EMPTY', 'TTS text must not be empty');
  }
  const points = [...normalized];
  const segments: string[] = [];
  let start = 0;
  while (start < points.length) {
    const hardEnd = Math.min(start + maximumCodePoints, points.length);
    let end = hardEnd;
    if (hardEnd < points.length) {
      for (let index = hardEnd; index > start + Math.floor(maximumCodePoints / 2); index -= 1) {
        if (/[。！？.!?;；,，、 ]/.test(points[index - 1]!)) {
          end = index;
          break;
        }
      }
    }
    const segment = points.slice(start, end).join('').trim();
    if (segment) segments.push(segment);
    start = end;
  }
  return segments;
}

export interface TccliResult {
  status: number | null;
  stdout: string;
  stderr: string;
  error?: Error;
}

export type TccliRunner = (args: string[]) => TccliResult | Promise<TccliResult>;

export interface TencentTccliProviderOptions {
  region?: string;
  runner?: TccliRunner;
}

interface TextToVoiceOutput {
  Response?: {
    Audio?: string;
    SessionId?: string;
    RequestId?: string;
    Subtitles?: Array<{
      Text?: string;
      BeginTime?: number;
      EndTime?: number;
      BeginIndex?: number;
      EndIndex?: number;
      Phoneme?: string | null;
    }>;
    Error?: { Code?: string; Message?: string };
  };
}

function mapTccliSubtitle(
  value: NonNullable<NonNullable<TextToVoiceOutput['Response']>['Subtitles']>[number]
): SpeechSubtitle | undefined {
  if (
    typeof value.Text !== 'string' ||
    typeof value.BeginTime !== 'number' ||
    typeof value.EndTime !== 'number' ||
    typeof value.BeginIndex !== 'number' ||
    typeof value.EndIndex !== 'number'
  ) {
    return undefined;
  }
  return {
    text: value.Text,
    beginTimeMs: value.BeginTime,
    endTimeMs: value.EndTime,
    beginIndex: value.BeginIndex,
    endIndex: value.EndIndex,
    ...(typeof value.Phoneme === 'string' ? { phoneme: value.Phoneme } : {}),
  };
}

function defaultTccliRunner(args: string[]): TccliResult {
  const result = spawnSync('tccli', args, {
    encoding: 'utf8',
    maxBuffer: 24 * 1024 * 1024,
  });
  return {
    status: result.status,
    stdout: result.stdout,
    stderr: result.stderr,
    ...(result.error ? { error: result.error } : {}),
  };
}

export async function tccliAvailable(runner: TccliRunner = defaultTccliRunner): Promise<boolean> {
  const result = await runner(['--version']);
  return !result.error && result.status === 0;
}

export class TencentTccliSpeechProvider implements SpeechProvider {
  readonly providerId = 'tencent-tts';
  readonly #region: string;
  readonly #runner: TccliRunner;

  constructor(options: TencentTccliProviderOptions = {}) {
    const region = options.region === undefined ? 'ap-guangzhou' : options.region.trim();
    if (!region) {
      throw new AimakeError('PROVIDER_CONFIG_MISSING', 'Tencent TTS region is required');
    }
    this.#region = region;
    this.#runner = options.runner ?? defaultTccliRunner;
  }

  async synthesize(request: SpeechRequest): Promise<SpeechResult> {
    const directory = await mkdtemp(join(tmpdir(), 'aimake-tccli-'));
    const inputPath = join(directory, 'request.json');
    try {
      await writeFile(
        inputPath,
        JSON.stringify({
          Text: request.text,
          SessionId: request.sessionId,
          VoiceType: request.voiceType,
          PrimaryLanguage: request.primaryLanguage,
          SampleRate: request.sampleRate,
          Codec: request.codec,
          EnableSubtitle: request.enableSubtitles,
        }),
        { encoding: 'utf8', mode: 0o600 }
      );

      const result = await this.#runner([
        'tts',
        'TextToVoice',
        '--cli-input-json',
        pathToFileURL(inputPath).href,
        '--region',
        this.#region,
        '--version',
        '2019-08-23',
        '--output',
        'json',
      ]);

      if (result.error || result.status !== 0) {
        const detail = (result.stderr || result.stdout || result.error?.message || 'unknown error')
          .trim()
          .slice(-2000);
        throw new AimakeError('PROVIDER_CALL_FAILED', `tccli TextToVoice failed: ${detail}`);
      }

      let output: TextToVoiceOutput;
      try {
        output = JSON.parse(result.stdout) as TextToVoiceOutput;
      } catch {
        throw new AimakeError('PROVIDER_RESPONSE_INVALID', 'tccli returned non-JSON output');
      }

      const response = output.Response;
      if (response?.Error) {
        throw new AimakeError(
          'PROVIDER_CALL_FAILED',
          `Tencent TTS ${response.Error.Code ?? 'Error'}: ${response.Error.Message ?? 'unknown error'}`
        );
      }
      if (!response?.Audio || !response.RequestId || response.SessionId !== request.sessionId) {
        throw new AimakeError(
          'PROVIDER_RESPONSE_INVALID',
          'tccli response is missing audio, request ID, or matching session ID'
        );
      }

      const audio = Buffer.from(response.Audio, 'base64');
      if (audio.length === 0) {
        throw new AimakeError('PROVIDER_RESPONSE_INVALID', 'Tencent TTS returned empty audio');
      }

      return {
        audio,
        requestId: response.RequestId,
        sessionId: response.SessionId,
        subtitles: (response.Subtitles ?? []).flatMap((entry) => {
          const parsed = mapTccliSubtitle(entry);
          return parsed ? [parsed] : [];
        }),
      };
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  }
}

export function createTencentTccliSpeechProvider(
  options: TencentTccliProviderOptions = {}
): TencentTccliSpeechProvider {
  return new TencentTccliSpeechProvider(options);
}

function offlineDurationMs(text: string): number {
  return Math.min(12_000, Math.max(8_000, 6_500 + [...text].length * 25));
}

function deterministicToneWav(request: SpeechRequest): Buffer {
  if (request.codec !== 'wav') {
    throw new AimakeError(
      'OFFLINE_FIXTURE_CODEC_UNSUPPORTED',
      'Offline fixture supports WAV only'
    );
  }
  const milliseconds = offlineDurationMs(request.text);
  const sampleCount = Math.round((milliseconds * request.sampleRate) / 1000);
  const pcm = Buffer.alloc(sampleCount * 2);
  const digest = createHash('sha256').update(request.text).digest();
  const base = 174 + (digest[0]! % 72);
  for (let index = 0; index < sampleCount; index += 1) {
    const seconds = index / request.sampleRate;
    const fade = Math.min(1, seconds / 0.2, (milliseconds / 1000 - seconds) / 0.2);
    const pulse = Math.sin(Math.PI * Math.min(1, (seconds % 1.5) / 0.55)) ** 2;
    const wave =
      Math.sin(2 * Math.PI * base * seconds) * 0.7 +
      Math.sin(2 * Math.PI * base * 1.5 * seconds) * 0.3;
    const sample = Math.round(32767 * 0.055 * Math.max(0, fade) * pulse * wave);
    pcm.writeInt16LE(sample, index * 2);
  }
  return Buffer.concat([createPcmWavHeader(sampleCount * 2, request.sampleRate, 1, 16), pcm]);
}

export function offlineFixtureSpeechProvider(): SpeechProvider {
  return {
    providerId: 'offline-fixture',
    provenance: {
      kind: 'offline-fixture',
      generator: OFFLINE_TONE_GENERATOR,
      license: 'CC0-1.0',
      actualCost: {
        currency: 'USD',
        amount: 0,
        status: 'no-provider-call',
      },
    },
    async synthesize(request: SpeechRequest): Promise<SpeechResult> {
      const milliseconds = offlineDurationMs(request.text);
      const requestId = `offline:${createHash('sha256')
        .update(`${OFFLINE_TONE_GENERATOR}\0${request.text}`)
        .digest('hex')
        .slice(0, 24)}`;
      return {
        audio: deterministicToneWav(request),
        sessionId: request.sessionId,
        requestId,
        subtitles: [
          {
            text: request.text,
            beginTimeMs: 0,
            endTimeMs: milliseconds,
            beginIndex: 0,
            endIndex: request.text.length,
          },
        ],
      };
    },
  };
}
