import crypto from 'node:crypto';
import type { NormalizedSource, IntakeOptions, IntakeMetric } from './types.js';

export function isTableFile(filePathOrExt: string): boolean {
  return /\.(csv|tsv)$/i.test(filePathOrExt);
}

function parseCsvRows(text: string, delimiter = ','): string[][] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const rows: string[][] = [];

  for (const line of lines) {
    const row: string[] = [];
    let insideQuote = false;
    let current = '';

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        insideQuote = !insideQuote;
      } else if (char === delimiter && !insideQuote) {
        row.push(current.trim().replace(/^"|"$/g, ''));
        current = '';
      } else {
        current += char;
      }
    }
    row.push(current.trim().replace(/^"|"$/g, ''));
    rows.push(row);
  }

  return rows;
}

export function parseTableToMarkdown(
  rawText: string,
  fileName: string,
  options: IntakeOptions = {}
): NormalizedSource {
  const now = new Date().toISOString();
  const isTsv = /\.tsv$/i.test(fileName);
  const rows = parseCsvRows(rawText, isTsv ? '\t' : ',');
  const title = options.title || `Data Sheet: ${fileName}`;

  if (rows.length === 0) {
    const md = `# ${title}\n\n*Empty spreadsheet file.*`;
    return {
      title,
      sourceType: 'table-csv',
      capturedAt: now,
      tags: ['Table', 'CSV', ...(options.tags || [])],
      markdown: md,
      sha256: crypto.createHash('sha256').update(md).digest('hex'),
    };
  }

  const headers = rows[0];
  const dataRows = rows.slice(1);

  // Build Markdown table
  const mdTable = [
    `| ${headers.join(' | ')} |`,
    `| ${headers.map(() => ':---').join(' | ')} |`,
    ...dataRows.map((r) => `| ${headers.map((_, i) => r[i] || '-').join(' | ')} |`),
  ].join('\n');

  // Extract key metrics
  const metrics: IntakeMetric[] = [];
  for (const row of dataRows.slice(0, 6)) {
    // Look for row where first column is label and second/third is a number
    if (row.length >= 2) {
      const label = row[0];
      const val = row[1];
      if (/[\d$%xX+-]/.test(val) && val.length < 24) {
        const delta = row.length > 2 && /[%+-]/.test(row[2]) ? row[2] : undefined;
        metrics.push({ label, value: val, delta });
      }
    }
  }

  const metricBlock =
    metrics.length > 0
      ? [
          '## 📊 Extracted Bento Metrics',
          '```metric',
          ...metrics.map((m) => `${m.label} :: ${m.value}${m.delta ? ` | ${m.delta}` : ''}`),
          '```',
          '',
        ].join('\n')
      : '';

  const fullMd = [
    `# ${title}`,
    '',
    `**Source File**: \`${fileName}\`  `,
    `**Rows Count**: \`${dataRows.length}\`  `,
    `**Columns**: \`${headers.join(', ')}\`  `,
    `**Captured At**: \`${now}\`  `,
    '',
    metricBlock,
    '## 📑 Raw Data Table',
    '',
    mdTable,
  ].join('\n');

  return {
    title,
    sourceType: 'table-csv',
    capturedAt: now,
    tags: Array.from(new Set(['Data', 'Table', 'CSV', ...(options.tags || [])])),
    metrics,
    markdown: fullMd,
    sha256: crypto.createHash('sha256').update(fullMd).digest('hex'),
  };
}
