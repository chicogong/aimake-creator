import { AimakeError } from './foundation.js';

export interface ParsedPcmWav {
  audioFormat: number;
  channels: number;
  sampleRate: number;
  byteRate: number;
  blockAlign: number;
  bitsPerSample: number;
  pcmData: Buffer;
  durationMs: number;
}

export interface ConcatenatedPcmWav {
  wav: Buffer;
  channels: number;
  sampleRate: number;
  bitsPerSample: number;
  blockAlign: number;
  totalPcmBytes: number;
  durationMs: number;
}

export function createPcmWavHeader(
  pcmByteLength: number,
  sampleRate: number,
  channels = 1,
  bitsPerSample = 16
): Buffer {
  const bytesPerSample = bitsPerSample / 8;
  const blockAlign = channels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const buffer = Buffer.alloc(44);
  buffer.write('RIFF', 0, 'ascii');
  buffer.writeUInt32LE(36 + pcmByteLength, 4);
  buffer.write('WAVEfmt ', 8, 'ascii');
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(channels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(bitsPerSample, 34);
  buffer.write('data', 36, 'ascii');
  buffer.writeUInt32LE(pcmByteLength, 40);
  return buffer;
}

export function pcmDurationMs(
  pcmByteLength: number,
  sampleRate: number,
  blockAlign = 2
): number {
  if (pcmByteLength <= 0 || sampleRate <= 0 || blockAlign <= 0) return 0;
  const sampleFrames = pcmByteLength / blockAlign;
  return Math.round((sampleFrames / sampleRate) * 1000);
}

export function parsePcmWav(input: Uint8Array): ParsedPcmWav {
  const buf = Buffer.isBuffer(input)
    ? input
    : Buffer.from(input.buffer, input.byteOffset, input.byteLength);

  if (buf.length < 44) {
    throw new AimakeError('WAV_INVALID', 'WAV buffer is shorter than 44-byte RIFF header');
  }
  if (buf.toString('ascii', 0, 4) !== 'RIFF' || buf.toString('ascii', 8, 12) !== 'WAVE') {
    throw new AimakeError('WAV_INVALID', 'Missing RIFF/WAVE signature');
  }

  let fmtFound = false;
  let audioFormat = 0;
  let channels = 0;
  let sampleRate = 0;
  let byteRate = 0;
  let blockAlign = 0;
  let bitsPerSample = 0;
  let pcmData: Buffer | undefined;

  let offset = 12;
  while (offset + 8 <= buf.length) {
    const chunkId = buf.toString('ascii', offset, offset + 4);
    const chunkSize = buf.readUInt32LE(offset + 4);
    const dataStart = offset + 8;
    if (dataStart + chunkSize > buf.length) {
      throw new AimakeError('WAV_INVALID', `Truncated RIFF chunk '${chunkId}'`);
    }

    if (chunkId === 'fmt ') {
      if (chunkSize < 16) {
        throw new AimakeError('WAV_INVALID', 'WAV fmt chunk must be at least 16 bytes');
      }
      audioFormat = buf.readUInt16LE(dataStart);
      channels = buf.readUInt16LE(dataStart + 2);
      sampleRate = buf.readUInt32LE(dataStart + 4);
      byteRate = buf.readUInt32LE(dataStart + 8);
      blockAlign = buf.readUInt16LE(dataStart + 12);
      bitsPerSample = buf.readUInt16LE(dataStart + 14);
      fmtFound = true;
    } else if (chunkId === 'data') {
      pcmData = buf.subarray(dataStart, dataStart + chunkSize);
      break;
    }

    offset = dataStart + chunkSize + (chunkSize % 2);
  }

  if (!fmtFound || !pcmData) {
    throw new AimakeError('WAV_INVALID', 'WAV is missing fmt or data chunk');
  }
  if (audioFormat !== 1) {
    throw new AimakeError('WAV_UNSUPPORTED_FORMAT', `Expected PCM format (1), got ${audioFormat}`);
  }
  if (
    channels < 1 ||
    sampleRate < 1 ||
    bitsPerSample < 8 ||
    bitsPerSample % 8 !== 0 ||
    blockAlign !== channels * (bitsPerSample / 8)
  ) {
    throw new AimakeError('WAV_INVALID', 'WAV PCM geometry is invalid');
  }

  return {
    audioFormat,
    channels,
    sampleRate,
    byteRate,
    blockAlign,
    bitsPerSample,
    pcmData,
    durationMs: pcmDurationMs(pcmData.length, sampleRate, blockAlign),
  };
}

export function concatenatePcmWavs(
  wavBuffers: readonly Uint8Array[],
  defaultSampleRate = 16000
): ConcatenatedPcmWav {
  if (wavBuffers.length === 0) {
    const header = createPcmWavHeader(0, defaultSampleRate, 1, 16);
    return {
      wav: header,
      channels: 1,
      sampleRate: defaultSampleRate,
      bitsPerSample: 16,
      blockAlign: 2,
      totalPcmBytes: 0,
      durationMs: 0,
    };
  }

  const parsed = wavBuffers.map((b) => parsePcmWav(b));
  const first = parsed[0]!;
  for (let i = 1; i < parsed.length; i += 1) {
    const current = parsed[i]!;
    if (
      current.sampleRate !== first.sampleRate ||
      current.channels !== first.channels ||
      current.bitsPerSample !== first.bitsPerSample
    ) {
      throw new AimakeError(
        'WAV_FORMAT_MISMATCH',
        'Cannot concatenate WAV chunks with mismatched sampleRate, channels, or bitsPerSample'
      );
    }
  }

  const totalPcmBytes = parsed.reduce((sum, item) => sum + item.pcmData.length, 0);
  const header = createPcmWavHeader(
    totalPcmBytes,
    first.sampleRate,
    first.channels,
    first.bitsPerSample
  );
  const wav = Buffer.concat([header, ...parsed.map((item) => item.pcmData)], 44 + totalPcmBytes);

  return {
    wav,
    channels: first.channels,
    sampleRate: first.sampleRate,
    bitsPerSample: first.bitsPerSample,
    blockAlign: first.blockAlign,
    totalPcmBytes,
    durationMs: pcmDurationMs(totalPcmBytes, first.sampleRate, first.blockAlign),
  };
}
