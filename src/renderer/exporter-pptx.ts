import PptxGenJS from 'pptxgenjs';
import path from 'node:path';
import fsSync from 'node:fs';
import type { Browser } from 'playwright';
import type { DeckDocument, DeckSlide, AspectRatio } from '../schema/types.js';
import { getTemplateById } from '../templates/index.js';
import { renderMermaidSvg } from './mermaid-svg.js';
import { launchSmartBrowser } from './exporter-media.js';

export interface ThemePalette {
  bg: string;
  surface: string;
  border: string;
  title: string;
  body: string;
  muted: string;
  accent: string;
  accentSoft?: string;
  codeBg?: string;
  codeBorder?: string;
  codeInk?: string;
  tableHeaderBg?: string;
  tableZebraBg?: string;
  isDark?: boolean;
}

export interface SlideDimensions {
  aspect: AspectRatio;
  width: number;
  height: number;
  layoutName: string;
  margin: {
    x: number;
    y: number;
  };
  contentWidth: number;
  contentHeight: number;
}

export interface ParsedGfmTable {
  headers: string[];
  alignments: ('left' | 'center' | 'right')[];
  rows: string[][];
}

export interface TableLayoutCalc {
  colWidths: number[];
  rowHeights: number[];
  totalHeight: number;
  totalWidth: number;
  fontSize: number;
  headerFontSize: number;
}

/**
 * Normalizes any hex or rgb(a) color string into a clean 6-character uppercase hex string (without leading #).
 */
export function normalizeHex(color: string | undefined, fallback: string): string {
  if (!color || typeof color !== 'string') return fallback.replace(/^#/, '').toUpperCase();
  const trimmed = color.trim();
  if (trimmed.startsWith('#')) {
    const raw = trimmed.slice(1);
    if (raw.length === 3) {
      return (raw[0] + raw[0] + raw[1] + raw[1] + raw[2] + raw[2]).toUpperCase();
    }
    if (raw.length >= 6) {
      return raw.slice(0, 6).toUpperCase();
    }
  }
  const rgbaMatch = trimmed.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
  if (rgbaMatch) {
    const r = Math.min(255, Math.max(0, parseInt(rgbaMatch[1], 10))).toString(16).padStart(2, '0');
    const g = Math.min(255, Math.max(0, parseInt(rgbaMatch[2], 10))).toString(16).padStart(2, '0');
    const b = Math.min(255, Math.max(0, parseInt(rgbaMatch[3], 10))).toString(16).padStart(2, '0');
    return (r + g + b).toUpperCase();
  }
  const hexMatch = trimmed.match(/^[0-9A-Fa-f]{6}/);
  if (hexMatch) {
    return hexMatch[0].toUpperCase();
  }
  return fallback.replace(/^#/, '').toUpperCase();
}

/**
 * Resolves the PowerPoint Visual IR palette from template definitions,
 * supporting all 36 built-in templates with faithful CSS variable inheritance.
 */
export function resolvePptPalette(templateId: string, customAccent?: string): ThemePalette {
  const templateDef = getTemplateById(templateId);

  if (templateDef && templateDef.theme) {
    const theme = templateDef.theme;
    const bgHex = normalizeHex(theme.bg, 'F8F7F4');

    // Luminance test to determine dark mode
    const r = parseInt(bgHex.slice(0, 2), 16);
    const g = parseInt(bgHex.slice(2, 4), 16);
    const b = parseInt(bgHex.slice(4, 6), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    const isDark = luminance < 0.5;

    const bg = bgHex;
    const surface = normalizeHex(theme.surface, isDark ? '181D27' : 'FFFFFF');
    const border = normalizeHex(theme.border, isDark ? '2A3242' : 'E2E8F0');
    const title = normalizeHex(theme.ink, isDark ? 'F8FAFC' : '0F172A');
    const body = normalizeHex(theme.ink, isDark ? 'CBD5E1' : '334155');
    const muted = normalizeHex(theme.muted, isDark ? '94A3B8' : '64748B');
    const accent = customAccent
      ? normalizeHex(customAccent, '2B6BE6')
      : normalizeHex(theme.accent, isDark ? '38BDF8' : '2B6BE6');
    const accentSoft = theme.accentSoft
      ? normalizeHex(theme.accentSoft, accent)
      : undefined;

    const codeBg = normalizeHex(theme.codeBg, isDark ? '0B0F19' : 'F1F5F9');
    const codeBorder = normalizeHex(theme.codeBorder, isDark ? '1E293B' : 'CBD5E1');
    const codeInk = normalizeHex(theme.codeInk, isDark ? 'E2E8F0' : '1E293B');

    const tableHeaderBg = isDark ? surface : (surface === 'FFFFFF' ? 'F1F5F9' : surface);
    const tableZebraBg = isDark
      ? (bg === surface ? '121722' : bg)
      : (bg === 'FFFFFF' ? 'F8FAFC' : bg);

    return {
      bg,
      surface,
      border,
      title,
      body,
      muted,
      accent,
      accentSoft,
      codeBg,
      codeBorder,
      codeInk,
      tableHeaderBg,
      tableZebraBg,
      isDark,
    };
  }

  // Heuristic fallback for custom or unlisted templates
  const isDark =
    templateId.includes('tech') ||
    templateId.includes('neon') ||
    templateId.includes('kinetic') ||
    templateId.includes('dark');

  if (isDark) {
    return {
      bg: '0F1218',
      surface: '181D27',
      border: '2A3242',
      title: 'F8FAFC',
      body: 'CBD5E1',
      muted: '94A3B8',
      accent: normalizeHex(customAccent, '38BDF8'),
      codeBg: '0B0F19',
      codeBorder: '1E293B',
      codeInk: 'E2E8F0',
      tableHeaderBg: '1E293B',
      tableZebraBg: '141A24',
      isDark: true,
    };
  }

  return {
    bg: 'F8F7F4',
    surface: 'FFFFFF',
    border: 'E2E8F0',
    title: '0F172A',
    body: '334155',
    muted: '64748B',
    accent: normalizeHex(customAccent, '2B6BE6'),
    codeBg: 'F1F5F9',
    codeBorder: 'CBD5E1',
    codeInk: '1E293B',
    tableHeaderBg: 'F1F5F9',
    tableZebraBg: 'F8FAFC',
    isDark: false,
  };
}

/**
 * Resolves slide layout dimensions and margins based on deck aspect ratio.
 */
export function resolveSlideDimensions(aspect?: AspectRatio | string): SlideDimensions {
  const norm = (aspect || '16:9').toLowerCase().trim();
  switch (norm) {
    case '3:4':
      return {
        aspect: '3:4',
        width: 7.5,
        height: 10.0,
        layoutName: 'LAYOUT_3x4',
        margin: { x: 0.6, y: 0.6 },
        contentWidth: 6.3,
        contentHeight: 8.8,
      };
    case '4:5':
      return {
        aspect: '4:5',
        width: 8.0,
        height: 10.0,
        layoutName: 'LAYOUT_4x5',
        margin: { x: 0.65, y: 0.65 },
        contentWidth: 6.7,
        contentHeight: 8.7,
      };
    case '1:1':
      return {
        aspect: '1:1',
        width: 8.5,
        height: 8.5,
        layoutName: 'LAYOUT_1x1',
        margin: { x: 0.7, y: 0.7 },
        contentWidth: 7.1,
        contentHeight: 7.1,
      };
    case '9:16':
      return {
        aspect: '9:16',
        width: 7.5,
        height: 13.333,
        layoutName: 'LAYOUT_9x16',
        margin: { x: 0.6, y: 0.8 },
        contentWidth: 6.3,
        contentHeight: 11.733,
      };
    case '16:9':
    default:
      return {
        aspect: '16:9',
        width: 13.333,
        height: 7.5,
        layoutName: 'LAYOUT_WIDE',
        margin: { x: 0.8, y: 0.55 },
        contentWidth: 11.733,
        contentHeight: 6.4,
      };
  }
}

export function chooseFontFace(locale?: string): string {
  if (!locale) return 'Arial';
  if (locale === 'ja') return 'Hiragino Sans';
  if (locale === 'ko') return 'Apple SD Gothic Neo';
  if (locale.startsWith('zh')) return 'PingFang SC';
  return 'Arial';
}

/**
 * Parses GitHub Flavored Markdown (GFM) pipe table syntax.
 */
export function parseGfmTable(lines: string[]): ParsedGfmTable | null {
  let startIdx = -1;
  for (let i = 0; i < lines.length - 1; i++) {
    const curr = lines[i].trim();
    const next = lines[i + 1].trim();
    if (curr.includes('|') && /^\|?(\s*:?-+:?\s*\|)+\s*:?-+:?\s*\|?$/.test(next)) {
      startIdx = i;
      break;
    }
  }
  if (startIdx === -1) return null;

  const splitCells = (line: string): string[] => {
    const trimmed = line.trim().replace(/^\|/, '').replace(/\|$/, '');
    return trimmed.split('|').map((c) => c.trim());
  };

  const headerLine = lines[startIdx];
  const delimiterLine = lines[startIdx + 1];
  const rawHeaders = splitCells(headerLine);
  const rawDelims = splitCells(delimiterLine);

  const numCols = Math.min(rawHeaders.length, rawDelims.length);
  if (numCols === 0) return null;

  const headers = rawHeaders.slice(0, numCols);
  const alignments: ('left' | 'center' | 'right')[] = rawDelims.slice(0, numCols).map((d) => {
    const hasLeft = d.startsWith(':');
    const hasRight = d.endsWith(':');
    if (hasLeft && hasRight) return 'center';
    if (hasRight) return 'right';
    return 'left';
  });

  const rows: string[][] = [];
  for (let i = startIdx + 2; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line.includes('|')) break;
    const cells = splitCells(line);
    const row = headers.map((_, cIdx) => cells[cIdx] || '');
    rows.push(row);
  }

  return { headers, alignments, rows };
}

/**
 * Extracts any GFM table embedded in slide paragraphs or bullets.
 */
export function extractGfmTableFromSlide(slide: DeckSlide): {
  table: ParsedGfmTable | null;
  filteredParagraphs: string[];
  filteredBullets: string[];
} {
  // Support explicit slide.table if provided in AST
  const explicitTable = (slide as unknown as { table?: ParsedGfmTable }).table;
  if (explicitTable && Array.isArray(explicitTable.headers) && explicitTable.headers.length > 0) {
    return {
      table: explicitTable,
      filteredParagraphs: slide.bodyParagraphs,
      filteredBullets: slide.bullets,
    };
  }

  // Scan bodyParagraphs
  const table = parseGfmTable(slide.bodyParagraphs);
  if (table) {
    const isTableLine = (line: string) => {
      const trimmed = line.trim();
      return (
        trimmed.includes('|') &&
        (table.headers.some((h) => trimmed.includes(h)) ||
          /^\|?(\s*:?-+:?\s*\|)+\s*:?-+:?\s*\|?$/.test(trimmed) ||
          table.rows.some((r) => r.some((c) => c && trimmed.includes(c))))
      );
    };
    return {
      table,
      filteredParagraphs: slide.bodyParagraphs.filter((p) => !isTableLine(p)),
      filteredBullets: slide.bullets,
    };
  }

  // Scan bullets
  const bulletTable = parseGfmTable(slide.bullets);
  if (bulletTable) {
    const isTableLine = (line: string) => line.trim().includes('|');
    return {
      table: bulletTable,
      filteredParagraphs: slide.bodyParagraphs,
      filteredBullets: slide.bullets.filter((b) => !isTableLine(b)),
    };
  }

  return {
    table: null,
    filteredParagraphs: slide.bodyParagraphs,
    filteredBullets: slide.bullets,
  };
}

/**
 * Calculates adaptive column widths, row heights, and font scaling with overflow prevention.
 */
export function calculateTableRowHeights(
  table: ParsedGfmTable,
  contentWidth: number,
  maxAvailableHeight: number
): TableLayoutCalc {
  const numCols = table.headers.length;
  if (numCols === 0) {
    return {
      colWidths: [],
      rowHeights: [],
      totalHeight: 0,
      totalWidth: 0,
      fontSize: 11,
      headerFontSize: 12,
    };
  }

  // Weight columns by maximum character count
  const colMaxChars = table.headers.map((h, colIdx) => {
    let maxLen = h.length;
    for (const r of table.rows) {
      if (r[colIdx]) maxLen = Math.max(maxLen, r[colIdx].length);
    }
    return Math.max(maxLen, 3);
  });

  const totalChars = colMaxChars.reduce((sum, n) => sum + n, 0);
  const minColW = Math.min(0.8, contentWidth / numCols);

  let colWidths = colMaxChars.map((chars) =>
    Math.max(minColW, (chars / totalChars) * contentWidth)
  );
  const currentSum = colWidths.reduce((a, b) => a + b, 0);
  colWidths = colWidths.map((w) => (w / currentSum) * contentWidth);

  let fontSize = 11;
  let headerFontSize = 12;

  const computeHeights = (fs: number, hfs: number) => {
    const headerH = Math.max(0.36, hfs * 0.028 + 0.1);
    const rowHeights: number[] = [headerH];

    for (const row of table.rows) {
      let maxLines = 1;
      row.forEach((cellText, colIdx) => {
        const colW = colWidths[colIdx] || 1;
        const charsPerLine = Math.max(6, Math.floor((colW - 0.2) * (120 / fs)));
        const lines = Math.ceil(cellText.length / charsPerLine) || 1;
        maxLines = Math.max(maxLines, lines);
      });
      const rh = Math.max(0.32, maxLines * (fs * 0.02) + 0.12);
      rowHeights.push(rh);
    }
    return rowHeights;
  };

  let rowHeights = computeHeights(fontSize, headerFontSize);
  let totalHeight = rowHeights.reduce((a, b) => a + b, 0);

  // Overflow compression if table exceeds available height
  if (totalHeight > maxAvailableHeight && maxAvailableHeight > 0) {
    fontSize = 9.5;
    headerFontSize = 10.5;
    rowHeights = computeHeights(fontSize, headerFontSize);
    totalHeight = rowHeights.reduce((a, b) => a + b, 0);

    if (totalHeight > maxAvailableHeight) {
      const scale = Math.max(0.65, maxAvailableHeight / totalHeight);
      rowHeights = rowHeights.map((h) => Math.max(0.24, h * scale));
      totalHeight = rowHeights.reduce((a, b) => a + b, 0);
    }
  }

  return {
    colWidths,
    rowHeights,
    totalHeight,
    totalWidth: contentWidth,
    fontSize,
    headerFontSize,
  };
}

/**
 * Rasterizes Mermaid diagram code into a 3x High-DPI transparent PNG data URI using template theme colors.
 */
export async function rasterizeMermaidToHighDpiPng(
  code: string,
  palette: ThemePalette,
  browser?: Browser | null
): Promise<string | null> {
  const svg = renderMermaidSvg(code);
  if (!svg || svg.includes('aimake-mermaid-fallback')) {
    return null;
  }

  const themedSvg = svg
    .replace(/var\(--bg,\s*[^)]+\)/g, `#${palette.bg}`)
    .replace(/var\(--surface,\s*[^)]+\)/g, `#${palette.surface}`)
    .replace(/var\(--border,\s*[^)]+\)/g, `#${palette.border}`)
    .replace(/var\(--ink,\s*[^)]+\)/g, `#${palette.title}`)
    .replace(/var\(--accent,\s*[^)]+\)/g, `#${palette.accent}`)
    .replace(/var\(--muted,\s*[^)]+\)/g, `#${palette.muted}`);

  let localBrowser: Browser | null = null;
  try {
    const activeBrowser = browser || (localBrowser = await launchSmartBrowser());
    const page = await activeBrowser.newPage({
      viewport: { width: 1400, height: 900 },
      deviceScaleFactor: 3,
    });

    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  :root {
    --bg: #${palette.bg};
    --surface: #${palette.surface};
    --border: #${palette.border};
    --ink: #${palette.title};
    --accent: #${palette.accent};
    --muted: #${palette.muted};
  }
  body {
    margin: 0;
    padding: 16px;
    background: transparent;
  }
  svg {
    display: block;
    margin: 0 auto;
  }
</style>
</head>
<body>
${themedSvg}
</body>
</html>`;

    await page.setContent(html, { waitUntil: 'load' });
    const locator = page.locator('svg');
    const buf = await locator.screenshot({ omitBackground: true, type: 'png' });
    await page.close();

    return `data:image/png;base64,${buf.toString('base64')}`;
  } catch {
    return null;
  } finally {
    if (localBrowser) {
      await localBrowser.close();
    }
  }
}

/**
 * Renders slide content with responsive Visual IR coordinates, native tables, and High-DPI diagram assets.
 */
export async function addSlideContent(
  pptx: PptxGenJS,
  s: PptxGenJS.Slide,
  slide: DeckSlide,
  doc: DeckDocument,
  palette: ThemePalette,
  fontFace: string,
  dims?: SlideDimensions,
  browser?: Browser | null
): Promise<void> {
  const currentDims = dims || resolveSlideDimensions(doc.frontmatter?.aspect);
  s.background = { color: palette.bg };

  // Top accent bar
  s.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 0,
    w: currentDims.width,
    h: 0.08,
    fill: { color: palette.accent },
    line: { color: palette.accent, width: 0 },
  });

  if (slide.eyebrow) {
    s.addText(slide.eyebrow.toUpperCase(), {
      x: currentDims.margin.x,
      y: currentDims.margin.y,
      w: currentDims.contentWidth,
      h: 0.35,
      fontFace,
      fontSize: 11,
      bold: true,
      color: palette.accent,
      charSpacing: 2,
    });
  }

  const isCover = slide.index === 0 || slide.layout === 'cover';
  const titleY = slide.eyebrow
    ? currentDims.margin.y + 0.35
    : (isCover ? currentDims.margin.y + 0.8 : currentDims.margin.y + 0.3);
  const titleH = isCover ? 1.6 : 0.95;
  const titleFontSize = isCover
    ? (currentDims.contentWidth < 7.5 ? 28 : 36)
    : (currentDims.contentWidth < 7.5 ? 22 : 26);

  s.addText(slide.title, {
    x: currentDims.margin.x,
    y: titleY,
    w: currentDims.contentWidth,
    h: titleH,
    fontFace,
    fontSize: titleFontSize,
    bold: true,
    color: palette.title,
    valign: 'top',
  });

  let cursorY = titleY + (isCover ? 1.65 : 1.05);

  if (slide.subtitle) {
    const subFontSize = isCover
      ? (currentDims.contentWidth < 7.5 ? 15 : 18)
      : (currentDims.contentWidth < 7.5 ? 13 : 15);
    s.addText(slide.subtitle, {
      x: currentDims.margin.x,
      y: cursorY,
      w: currentDims.contentWidth,
      h: 0.65,
      fontFace,
      fontSize: subFontSize,
      color: palette.muted,
    });
    cursorY += 0.75;
  }

  // Native GFM Table with Zebra striping & dynamic layout
  const { table: parsedTable, filteredParagraphs, filteredBullets } = extractGfmTableFromSlide(slide);
  if (parsedTable && cursorY < currentDims.height - 1.2) {
    const maxTableH = Math.max(1.5, currentDims.height - 0.7 - cursorY);
    const tableLayout = calculateTableRowHeights(parsedTable, currentDims.contentWidth, maxTableH);

    const tableRows: any[][] = [];

    // Header row
    tableRows.push(
      parsedTable.headers.map((h, colIdx) => ({
        text: h,
        options: {
          fill: { color: palette.tableHeaderBg || (palette.isDark ? '1E293B' : palette.surface) },
          color: palette.accent,
          bold: true,
          align: parsedTable.alignments[colIdx] || 'left',
          valign: 'middle',
          fontFace,
          fontSize: tableLayout.headerFontSize,
          border: [
            { type: 'none' },
            { type: 'none' },
            { type: 'solid', pt: 1.5, color: palette.accent },
            { type: 'none' },
          ],
          margin: [0.06, 0.1, 0.06, 0.1],
        },
      }))
    );

    // Data rows with zebra striping
    parsedTable.rows.forEach((row, rowIdx) => {
      const isZebra = rowIdx % 2 === 1;
      const rowBg = isZebra
        ? (palette.tableZebraBg || (palette.isDark ? '141A24' : 'F8FAFC'))
        : (palette.surface || (palette.isDark ? '0F1218' : 'FFFFFF'));

      tableRows.push(
        row.map((cellText, colIdx) => ({
          text: cellText,
          options: {
            fill: { color: rowBg },
            color: palette.body,
            bold: false,
            align: parsedTable.alignments[colIdx] || 'left',
            valign: 'middle',
            fontFace,
            fontSize: tableLayout.fontSize,
            border: [
              { type: 'solid', pt: 0.5, color: palette.border },
              { type: 'none' },
              { type: 'solid', pt: 0.5, color: palette.border },
              { type: 'none' },
            ],
            margin: [0.05, 0.1, 0.05, 0.1],
          },
        }))
      );
    });

    s.addTable(tableRows, {
      x: currentDims.margin.x,
      y: cursorY,
      w: currentDims.contentWidth,
      colW: tableLayout.colWidths,
      rowH: tableLayout.rowHeights,
      autoPage: true,
      autoPageSlideStartY: currentDims.margin.y + 0.6,
    });

    cursorY += tableLayout.totalHeight + 0.3;
  }

  // Metrics grid (responsive layout for wide vs portrait aspects)
  if (slide.metrics && slide.metrics.length > 0 && cursorY < currentDims.height - 1.5) {
    const count = Math.min(slide.metrics.length, 4);
    const gap = 0.25;
    const isPortraitGrid = currentDims.contentWidth < 7.5 && count > 2;

    if (isPortraitGrid) {
      const cols = 2;
      const cardW = (currentDims.contentWidth - gap) / cols;
      const cardH = 1.35;
      slide.metrics.slice(0, 4).forEach((m, idx) => {
        const colIdx = idx % 2;
        const rowIdx = Math.floor(idx / 2);
        const cardX = currentDims.margin.x + colIdx * (cardW + gap);
        const cardY = cursorY + rowIdx * (cardH + gap);

        s.addShape(pptx.ShapeType.roundRect, {
          x: cardX,
          y: cardY,
          w: cardW,
          h: cardH,
          rectRadius: 0.08,
          fill: { color: palette.surface },
          line: { color: palette.border, width: 1 },
        });
        s.addText(m.label, {
          x: cardX + 0.15,
          y: cardY + 0.12,
          w: cardW - 0.3,
          h: 0.3,
          fontFace,
          fontSize: 11,
          color: palette.muted,
        });
        s.addText(m.value + (m.delta ? `  ${m.delta}` : ''), {
          x: cardX + 0.15,
          y: cardY + 0.48,
          w: cardW - 0.3,
          h: 0.7,
          fontFace: 'Menlo',
          fontSize: 20,
          bold: true,
          color: palette.accent,
        });
      });
      cursorY += 2 * cardH + gap + 0.3;
    } else {
      const cardW = (currentDims.contentWidth - gap * (count - 1)) / count;
      slide.metrics.slice(0, count).forEach((m, idx) => {
        const cardX = currentDims.margin.x + idx * (cardW + gap);
        s.addShape(pptx.ShapeType.roundRect, {
          x: cardX,
          y: cursorY,
          w: cardW,
          h: 1.55,
          rectRadius: 0.08,
          fill: { color: palette.surface },
          line: { color: palette.border, width: 1 },
        });
        s.addText(m.label, {
          x: cardX + 0.2,
          y: cursorY + 0.18,
          w: cardW - 0.4,
          h: 0.35,
          fontFace,
          fontSize: 12,
          color: palette.muted,
        });
        s.addText(m.value + (m.delta ? `  ${m.delta}` : ''), {
          x: cardX + 0.2,
          y: cursorY + 0.58,
          w: cardW - 0.4,
          h: 0.75,
          fontFace: 'Menlo',
          fontSize: 24,
          bold: true,
          color: palette.accent,
        });
      });
      cursorY += 1.8;
    }
  }

  // Two-column comparison
  if (slide.comparison && cursorY < currentDims.height - 2.0) {
    const gap = 0.25;
    const colW = (currentDims.contentWidth - gap) / 2;
    const renderCol = (x: number, title: string, items: string[], borderCol: string) => {
      s.addShape(pptx.ShapeType.roundRect, {
        x,
        y: cursorY,
        w: colW,
        h: Math.min(3.1, currentDims.height - cursorY - 1.0),
        rectRadius: 0.08,
        fill: { color: palette.surface },
        line: { color: borderCol, width: 1.5 },
      });
      s.addText(title, {
        x: x + 0.2,
        y: cursorY + 0.2,
        w: colW - 0.4,
        h: 0.45,
        fontFace,
        fontSize: 16,
        bold: true,
        color: palette.title,
      });
      if (items.length > 0) {
        s.addText(
          items.map((text) => ({ text, options: { bullet: true, breakLine: true } })),
          {
            x: x + 0.2,
            y: cursorY + 0.75,
            w: colW - 0.4,
            h: Math.max(1.2, currentDims.height - cursorY - 2.0),
            fontFace,
            fontSize: 13,
            color: palette.body,
            lineSpacingMultiple: 1.3,
          }
        );
      }
    };
    renderCol(currentDims.margin.x, slide.comparison.leftTitle, slide.comparison.leftItems, palette.border);
    renderCol(currentDims.margin.x + colW + gap, slide.comparison.rightTitle, slide.comparison.rightItems, palette.accent);
    cursorY += Math.min(3.3, currentDims.height - cursorY - 0.8);
  }

  // Mermaid Flowchart & Diagram Rasterization
  if (slide.diagram && slide.diagram.engine === 'mermaid' && cursorY < currentDims.height - 1.2) {
    const availW = currentDims.contentWidth;
    const availH = Math.max(1.8, currentDims.height - 0.7 - cursorY);
    const pngData = await rasterizeMermaidToHighDpiPng(slide.diagram.code, palette, browser);

    if (pngData) {
      const svg = renderMermaidSvg(slide.diagram.code);
      const vbMatch = svg.match(/viewBox="0 0 (\d+(?:\.\d+)?) (\d+(?:\.\d+)?)"/);
      const svgW = vbMatch ? parseFloat(vbMatch[1]) : 800;
      const svgH = vbMatch ? parseFloat(vbMatch[2]) : 400;
      const svgAspect = Math.max(0.2, svgW / Math.max(1, svgH));

      let imgW = availW;
      let imgH = imgW / svgAspect;
      if (imgH > availH) {
        imgH = availH;
        imgW = imgH * svgAspect;
      }
      const imgX = currentDims.margin.x + (availW - imgW) / 2;
      const imgY = cursorY + Math.max(0, (availH - imgH) / 4);

      s.addImage({
        data: pngData,
        x: imgX,
        y: imgY,
        w: imgW,
        h: imgH,
      });
      cursorY += imgH + 0.3;
    } else {
      // Fallback card when browser rasterizer is unavailable
      const cardH = Math.min(2.5, availH);
      s.addShape(pptx.ShapeType.roundRect, {
        x: currentDims.margin.x,
        y: cursorY,
        w: currentDims.contentWidth,
        h: cardH,
        rectRadius: 0.08,
        fill: { color: palette.surface },
        line: { color: palette.accent, width: 1.5 },
      });
      s.addText('MERMAID DIAGRAM', {
        x: currentDims.margin.x + 0.25,
        y: cursorY + 0.2,
        w: currentDims.contentWidth - 0.5,
        h: 0.35,
        fontFace: 'Menlo',
        fontSize: 11,
        bold: true,
        color: palette.accent,
      });
      s.addText(slide.diagram.code, {
        x: currentDims.margin.x + 0.25,
        y: cursorY + 0.6,
        w: currentDims.contentWidth - 0.5,
        h: cardH - 0.75,
        fontFace: 'Menlo',
        fontSize: 10.5,
        color: palette.body,
      });
      cursorY += cardH + 0.3;
    }
  }

  // Image assets (URLs, base64, or local files)
  if (slide.imageUrl && cursorY < currentDims.height - 1.2) {
    const availW = currentDims.contentWidth;
    const availH = Math.max(1.8, currentDims.height - 0.7 - cursorY);
    const imgH = Math.min(3.2, availH);
    const imgW = Math.min(availW, imgH * (16 / 9));
    const imgX = currentDims.margin.x + (availW - imgW) / 2;

    if (
      slide.imageUrl.startsWith('data:image/') ||
      slide.imageUrl.startsWith('http://') ||
      slide.imageUrl.startsWith('https://')
    ) {
      s.addImage({
        [slide.imageUrl.startsWith('data:') ? 'data' : 'path']: slide.imageUrl,
        x: imgX,
        y: cursorY,
        w: imgW,
        h: imgH,
      });
      cursorY += imgH + 0.3;
    } else if (fsSync.existsSync(slide.imageUrl)) {
      s.addImage({
        path: path.resolve(slide.imageUrl),
        x: imgX,
        y: cursorY,
        w: imgW,
        h: imgH,
      });
      cursorY += imgH + 0.3;
    }
  }

  // Bullets & body paragraphs (filtered from table lines)
  const bulletList = [...filteredParagraphs, ...filteredBullets];
  if (bulletList.length > 0 && cursorY < currentDims.height - 1.0) {
    const availH = Math.max(1.0, currentDims.height - 0.8 - cursorY);
    s.addText(
      bulletList.map((b) => ({ text: b, options: { bullet: filteredBullets.length > 0, breakLine: true } })),
      {
        x: currentDims.margin.x,
        y: cursorY,
        w: currentDims.contentWidth,
        h: availH,
        fontFace,
        fontSize: currentDims.contentWidth < 7.5 ? 14 : 16,
        color: palette.body,
        valign: 'top',
        lineSpacingMultiple: 1.35,
      }
    );
    cursorY += Math.min(availH, bulletList.length * 0.45);
  }

  // Code block
  if (slide.code && cursorY < currentDims.height - 1.2) {
    const codeH = Math.min(2.6, currentDims.height - 0.8 - cursorY);
    s.addShape(pptx.ShapeType.roundRect, {
      x: currentDims.margin.x,
      y: cursorY,
      w: currentDims.contentWidth,
      h: codeH,
      rectRadius: 0.08,
      fill: { color: palette.codeBg || (palette.isDark ? '0B0F19' : 'F1F5F9') },
      line: { color: palette.codeBorder || (palette.isDark ? '1E293B' : 'E2E8F0'), width: 1 },
    });
    s.addText(slide.code.code, {
      x: currentDims.margin.x + 0.2,
      y: cursorY + 0.15,
      w: currentDims.contentWidth - 0.4,
      h: codeH - 0.3,
      fontFace: 'Menlo',
      fontSize: currentDims.contentWidth < 7.5 ? 10.5 : 12,
      color: palette.codeInk || (palette.isDark ? 'E2E8F0' : '1E293B'),
      valign: 'top',
    });
    cursorY += codeH + 0.25;
  }

  // Quote callout
  if (slide.quote && cursorY < currentDims.height - 1.1) {
    const quoteY = Math.min(cursorY, currentDims.height - 1.8);
    s.addShape(pptx.ShapeType.roundRect, {
      x: currentDims.margin.x,
      y: quoteY,
      w: currentDims.contentWidth,
      h: 1.1,
      rectRadius: 0.06,
      fill: { color: palette.surface },
      line: { color: palette.accent, width: 1.2 },
    });
    s.addText(
      `“${slide.quote.text}”${slide.quote.author ? `  — ${slide.quote.author}` : ''}`,
      {
        x: currentDims.margin.x + 0.25,
        y: quoteY + 0.15,
        w: currentDims.contentWidth - 0.5,
        h: 0.8,
        fontFace,
        fontSize: 14,
        italic: true,
        color: palette.body,
      }
    );
  }

  // Footer provenance & watermark
  const footerY = currentDims.height - 0.55;
  const footerLeft = slide.cite ? `Ref: ${slide.cite}` : doc.frontmatter.author || '';
  const footerRight = doc.frontmatter.watermark
    ? `Created with Aimake.cc · ${slide.index + 1}/${doc.slides.length}`
    : `${slide.index + 1}/${doc.slides.length}`;

  if (footerLeft) {
    s.addText(footerLeft, {
      x: currentDims.margin.x,
      y: footerY,
      w: currentDims.contentWidth * 0.6,
      h: 0.3,
      fontFace: 'Menlo',
      fontSize: 9.5,
      color: palette.muted,
    });
  }
  s.addText(footerRight, {
    x: currentDims.margin.x + currentDims.contentWidth * 0.4,
    y: footerY,
    w: currentDims.contentWidth * 0.6,
    h: 0.3,
    fontFace: 'Menlo',
    fontSize: 9.5,
    align: 'right',
    color: palette.muted,
  });

  if (slide.speech) {
    s.addNotes(slide.speech);
  }
}

export async function exportDeckToPptx(
  doc: DeckDocument,
  outFile: string,
  options?: { browser?: Browser }
): Promise<string> {
  const PptxConstructor = (PptxGenJS as unknown as { default?: typeof PptxGenJS }).default || PptxGenJS;
  const pptx = new PptxConstructor();

  const dims = resolveSlideDimensions(doc.frontmatter?.aspect);
  if (dims.aspect === '16:9') {
    pptx.layout = 'LAYOUT_WIDE';
  } else {
    pptx.defineLayout({
      name: dims.layoutName,
      width: dims.width,
      height: dims.height,
    });
    pptx.layout = dims.layoutName;
  }

  pptx.title = doc.frontmatter.title;
  pptx.author = doc.frontmatter.author || 'Aimake Studio';
  pptx.subject = 'Generated by Aimake Studio (https://aimake.cc)';

  const palette = resolvePptPalette(doc.frontmatter.template, doc.frontmatter.accentColor);
  const fontFace = chooseFontFace(doc.frontmatter.locale);

  // Manage browser lifecycle for high-DPI rasterization across slides
  let sharedBrowser: Browser | null = null;
  const hasMermaid = doc.slides.some((s) => s.diagram?.engine === 'mermaid');
  if (hasMermaid && !options?.browser) {
    try {
      sharedBrowser = await launchSmartBrowser();
    } catch {
      sharedBrowser = null;
    }
  }

  const activeBrowser = options?.browser || sharedBrowser;

  try {
    for (const slide of doc.slides) {
      const s = pptx.addSlide();
      await addSlideContent(pptx, s, slide, doc, palette, fontFace, dims, activeBrowser);
    }
    await pptx.writeFile({ fileName: outFile });
    return outFile;
  } finally {
    if (sharedBrowser) {
      await sharedBrowser.close();
    }
  }
}
