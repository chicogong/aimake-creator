import type { SpeechSubtitle } from './providers.js';

export interface TimedSpeechChunk {
  slideId: string;
  chunkIndex: number;
  durationMs: number;
  subtitles: SpeechSubtitle[];
  fallbackText: string;
}

const CJK_RE = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uac00-\ud7af]/;
const CJK_BREAK_RE = /[。！？.!?;；,，、：: ]/;

export function formatSrtTimestamp(milliseconds: number): string {
  const value = Math.max(0, Math.round(milliseconds));
  const hours = Math.floor(value / 3_600_000);
  const minutes = Math.floor((value % 3_600_000) / 60_000);
  const seconds = Math.floor((value % 60_000) / 1000);
  const millis = value % 1000;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')},${String(millis).padStart(3, '0')}`;
}

/**
 * Wraps subtitle text cleanly:
 * - CJK text wraps semantically at 8–14 code points per line without orphan 1–2 char tails.
 * - Latin/spaced text wraps by word boundaries up to 42 characters per line.
 */
export function wrapSubtitleLines(
  rawText: string,
  options?: { cjkMinChars?: number; cjkMaxChars?: number; latinMaxChars?: number }
): string[] {
  const cjkMin = options?.cjkMinChars ?? 8;
  const cjkMax = options?.cjkMaxChars ?? 14;
  const latinMax = options?.latinMaxChars ?? 42;

  const normalized = rawText.replace(/\s+/g, ' ').trim();
  if (!normalized) return [];

  if (CJK_RE.test(normalized)) {
    const points = [...normalized];
    if (points.length <= cjkMax) return [normalized];

    const lines: string[] = [];
    let start = 0;
    while (start < points.length) {
      const rem = points.length - start;
      if (rem <= cjkMax) {
        const tail = points.slice(start).join('').trim();
        if (tail) lines.push(tail);
        break;
      }

      let minCut = cjkMin;
      let maxCut = cjkMax;

      if (rem === cjkMax + 1) {
        // e.g. 15 chars -> 8 + 7 balanced split
        minCut = cjkMin;
        maxCut = Math.min(cjkMax, rem - (cjkMin - 1));
      } else if (rem <= cjkMax * 2) {
        // e.g. 16..28 chars -> guarantee both lines fall in [8, 14]
        minCut = Math.max(cjkMin, rem - cjkMax);
        maxCut = Math.min(cjkMax, rem - cjkMin);
      } else if (rem === cjkMax * 2 + 1) {
        // e.g. 29 chars -> avoid leaving 15 so remaining stays >= 16
        minCut = cjkMin;
        maxCut = cjkMax - 1;
      }

      let chosenEnd = -1;
      for (let idx = start + maxCut; idx >= start + minCut; idx -= 1) {
        if (CJK_BREAK_RE.test(points[idx - 1]!)) {
          chosenEnd = idx;
          break;
        }
      }

      if (chosenEnd === -1) {
        const estimatedLines = Math.max(2, Math.ceil(rem / Math.round((cjkMin + cjkMax) / 2)));
        const balanced = Math.ceil(rem / estimatedLines);
        const cutLen = Math.min(maxCut, Math.max(minCut, balanced));
        chosenEnd = start + cutLen;
      }

      const line = points.slice(start, chosenEnd).join('').trim();
      if (line) lines.push(line);
      start = chosenEnd;
      while (start < points.length && points[start] === ' ') {
        start += 1;
      }
    }

    return lines;
  }

  // Latin word wrapping
  const words = normalized.split(' ');
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length <= latinMax || !current) {
      current = candidate;
    } else {
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

interface SrtCue {
  beginTimeMs: number;
  endTimeMs: number;
  lines: string[];
}

function expandSubtitleToCues(
  text: string,
  beginTimeMs: number,
  endTimeMs: number,
  maxLinesPerCue = 2
): SrtCue[] {
  const lines = wrapSubtitleLines(text);
  if (lines.length === 0) return [];
  if (lines.length <= maxLinesPerCue) {
    return [{ beginTimeMs, endTimeMs, lines }];
  }

  const groups: string[][] = [];
  for (let i = 0; i < lines.length; i += maxLinesPerCue) {
    groups.push(lines.slice(i, i + maxLinesPerCue));
  }

  const totalWeight = groups.reduce(
    (sum, grp) => sum + grp.reduce((s, line) => s + Math.max(1, [...line].length), 0),
    0
  );
  const spanMs = Math.max(groups.length, endTimeMs - beginTimeMs);

  const cues: SrtCue[] = [];
  let cursorMs = beginTimeMs;
  let consumedWeight = 0;

  for (let idx = 0; idx < groups.length; idx += 1) {
    const group = groups[idx]!;
    const groupWeight = group.reduce((s, line) => s + Math.max(1, [...line].length), 0);
    consumedWeight += groupWeight;
    const nextEndMs =
      idx === groups.length - 1
        ? endTimeMs
        : Math.max(
            cursorMs + 1,
            beginTimeMs + Math.round((spanMs * consumedWeight) / totalWeight)
          );
    cues.push({
      beginTimeMs: cursorMs,
      endTimeMs: Math.max(cursorMs + 1, nextEndMs),
      lines: group,
    });
    cursorMs = Math.min(endTimeMs, nextEndMs);
  }

  return cues;
}

export function buildSrt(chunks: readonly TimedSpeechChunk[]): string {
  let offsetMs = 0;
  let cueIndex = 1;
  const entries: string[] = [];

  for (const chunk of chunks) {
    const rawSubtitles =
      chunk.subtitles.length > 0
        ? chunk.subtitles
        : [
            {
              text: chunk.fallbackText,
              beginTimeMs: 0,
              endTimeMs: chunk.durationMs,
              beginIndex: 0,
              endIndex: chunk.fallbackText.length,
            },
          ];

    for (const sub of rawSubtitles) {
      const start = offsetMs + Math.min(chunk.durationMs, Math.max(0, sub.beginTimeMs));
      const end =
        offsetMs +
        Math.min(chunk.durationMs, Math.max(sub.endTimeMs, sub.beginTimeMs + 1));
      const cues = expandSubtitleToCues(sub.text, start, Math.max(start + 1, end));
      for (const cue of cues) {
        entries.push(
          `${cueIndex}\n${formatSrtTimestamp(cue.beginTimeMs)} --> ${formatSrtTimestamp(cue.endTimeMs)}\n${cue.lines.join('\n')}\n`
        );
        cueIndex += 1;
      }
    }

    offsetMs += chunk.durationMs;
  }

  return entries.length > 0 ? `${entries.join('\n')}\n` : '';
}
