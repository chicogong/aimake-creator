import crypto from 'node:crypto';
import type { NormalizedSource, IntakeOptions } from './types.js';

export function isTranscriptFile(filePathOrExt: string): boolean {
  return /\.(vtt|srt)$/i.test(filePathOrExt);
}

export function parseTranscriptToMarkdown(
  rawText: string,
  fileName: string,
  options: IntakeOptions = {}
): NormalizedSource {
  const now = new Date().toISOString();
  const title = options.title || `Transcript: ${fileName}`;

  // Strip WEBVTT header
  let cleaned = rawText.replace(/^WEBVTT[^\n]*\n+/i, '');

  // Regex to match timestamp lines:
  // 00:01:23.450 --> 00:01:26.780 or 00:01:23,450 --> 00:01:26,780
  const timestampRegex =
    /(?:(\d{1,2}:)?(\d{2}:\d{2})[.,]\d{3})\s*-->\s*(?:(?:\d{1,2}:)?(\d{2}:\d{2})[.,]\d{3})/;

  const rawBlocks = cleaned.split(/\n\s*\n/);
  const speechParagraphs: Array<{ timestamp: string; speaker?: string; text: string }> = [];

  for (const block of rawBlocks) {
    const lines = block.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) continue;

    let timeStr = '';
    const contentLines: string[] = [];

    for (const line of lines) {
      // Check if it's an index number like "1", "2"
      if (/^\d+$/.test(line)) continue;

      const timeMatch = line.match(timestampRegex);
      if (timeMatch) {
        timeStr = timeMatch[2] || timeMatch[1] || '00:00';
      } else {
        // Strip voice tags like <v Speaker> or <c.color>
        const stripped = line.replace(/<[^>]+>/g, '').trim();
        if (stripped) contentLines.push(stripped);
      }
    }

    if (contentLines.length > 0) {
      const fullSentence = contentLines.join(' ');
      // Detect speaker prefix like "Speaker: ..." or "[Speaker] ..."
      const speakerMatch = fullSentence.match(/^(?:\[([^\]]+)\]|([A-Za-z0-9_\s]+):)\s*(.+)$/);
      if (speakerMatch) {
        speechParagraphs.push({
          timestamp: timeStr,
          speaker: speakerMatch[1] || speakerMatch[2],
          text: speakerMatch[3],
        });
      } else {
        speechParagraphs.push({
          timestamp: timeStr,
          text: fullSentence,
        });
      }
    }
  }

  // Format into Markdown with timestamp anchors
  const mdLines = [
    `# ${title}`,
    '',
    `**Source File**: \`${fileName}\`  `,
    `**Captured At**: \`${now}\`  `,
    `**Segments**: \`${speechParagraphs.length}\`  `,
    '',
    '## 🎙️ Clean Transcript & Timestamps',
    '',
  ];

  for (const seg of speechParagraphs) {
    const timePrefix = seg.timestamp ? `\`[${seg.timestamp}]\` ` : '';
    const speakerPrefix = seg.speaker ? `**${seg.speaker}**: ` : '';
    mdLines.push(`${timePrefix}${speakerPrefix}${seg.text}`, '');
  }

  const fullMd = mdLines.join('\n');
  return {
    title,
    sourceType: 'transcript',
    capturedAt: now,
    tags: Array.from(new Set(['Transcript', 'Audio', 'Video', ...(options.tags || [])])),
    markdown: fullMd,
    sha256: crypto.createHash('sha256').update(fullMd).digest('hex'),
  };
}
