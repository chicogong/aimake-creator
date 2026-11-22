import PptxGenJS from 'pptxgenjs';
import type { DeckDocument, DeckSlide } from '../schema/types.js';

interface ThemePalette {
  bg: string;
  surface: string;
  border: string;
  title: string;
  body: string;
  muted: string;
  accent: string;
}

function resolvePptPalette(templateId: string, customAccent?: string): ThemePalette {
  const cleanHex = (h: string) => h.replace(/^#/, '').toUpperCase();
  const isDark = templateId.includes('tech') || templateId.includes('neon') || templateId.includes('kinetic');
  if (isDark) {
    return {
      bg: '0F1218',
      surface: '181D27',
      border: '2A3242',
      title: 'F8FAFC',
      body: 'CBD5E1',
      muted: '94A3B8',
      accent: cleanHex(customAccent || '38BDF8'),
    };
  }
  return {
    bg: 'F8F7F4',
    surface: 'FFFFFF',
    border: 'E2E8F0',
    title: '0F172A',
    body: '334155',
    muted: '64748B',
    accent: cleanHex(customAccent || '2B6BE6'),
  };
}

function chooseFontFace(locale: string): string {
  if (locale === 'ja') return 'Hiragino Sans';
  if (locale === 'ko') return 'Apple SD Gothic Neo';
  if (locale.startsWith('zh')) return 'PingFang SC';
  return 'Arial';
}

function addSlideContent(
  pptx: PptxGenJS,
  s: PptxGenJS.Slide,
  slide: DeckSlide,
  doc: DeckDocument,
  palette: ThemePalette,
  fontFace: string
): void {
  s.background = { color: palette.bg };

  // Top accent bar
  s.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 0,
    w: 13.333,
    h: 0.08,
    fill: { color: palette.accent },
    line: { color: palette.accent, width: 0 },
  });

  if (slide.eyebrow) {
    s.addText(slide.eyebrow.toUpperCase(), {
      x: 0.8,
      y: 0.55,
      w: 8.5,
      h: 0.35,
      fontFace,
      fontSize: 11,
      bold: true,
      color: palette.accent,
      charSpacing: 2,
    });
  }

  const isCover = slide.index === 0 || slide.layout === 'cover';
  s.addText(slide.title, {
    x: 0.8,
    y: isCover ? 1.5 : 0.95,
    w: 11.7,
    h: isCover ? 1.6 : 0.95,
    fontFace,
    fontSize: isCover ? 36 : 26,
    bold: true,
    color: palette.title,
    valign: 'top',
  });

  let cursorY = isCover ? 3.25 : 2.05;

  if (slide.subtitle) {
    s.addText(slide.subtitle, {
      x: 0.8,
      y: cursorY,
      w: 11.2,
      h: 0.65,
      fontFace,
      fontSize: isCover ? 18 : 15,
      color: palette.muted,
    });
    cursorY += 0.75;
  }

  // Metrics grid (native editable cards!)
  if (slide.metrics.length > 0) {
    const count = Math.min(slide.metrics.length, 4);
    const gap = 0.25;
    const cardW = (11.73 - gap * (count - 1)) / count;
    slide.metrics.slice(0, count).forEach((m, idx) => {
      const cardX = 0.8 + idx * (cardW + gap);
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

  // Two-column comparison
  if (slide.comparison) {
    const colW = 5.7;
    const renderCol = (x: number, title: string, items: string[], borderCol: string) => {
      s.addShape(pptx.ShapeType.roundRect, {
        x,
        y: cursorY,
        w: colW,
        h: 3.1,
        rectRadius: 0.08,
        fill: { color: palette.surface },
        line: { color: borderCol, width: 1.5 },
      });
      s.addText(title, {
        x: x + 0.25,
        y: cursorY + 0.2,
        w: colW - 0.5,
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
            x: x + 0.25,
            y: cursorY + 0.75,
            w: colW - 0.5,
            h: 2.1,
            fontFace,
            fontSize: 14,
            color: palette.body,
            lineSpacingMultiple: 1.3,
          }
        );
      }
    };
    renderCol(0.8, slide.comparison.leftTitle, slide.comparison.leftItems, palette.border);
    renderCol(6.83, slide.comparison.rightTitle, slide.comparison.rightItems, palette.accent);
    cursorY += 3.3;
  }

  // Bullets & body paragraphs
  const bulletList = [...slide.bodyParagraphs, ...slide.bullets];
  if (bulletList.length > 0 && cursorY < 6.2) {
    s.addText(
      bulletList.map((b) => ({ text: b, options: { bullet: slide.bullets.length > 0, breakLine: true } })),
      {
        x: 0.8,
        y: cursorY,
        w: 11.5,
        h: Math.max(1.2, 6.4 - cursorY),
        fontFace,
        fontSize: 16,
        color: palette.body,
        valign: 'top',
        lineSpacingMultiple: 1.35,
      }
    );
    cursorY += Math.min(2.2, bulletList.length * 0.45);
  }

  // Code block
  if (slide.code && cursorY < 6.2) {
    const codeH = Math.min(2.6, 6.5 - cursorY);
    s.addShape(pptx.ShapeType.roundRect, {
      x: 0.8,
      y: cursorY,
      w: 11.7,
      h: codeH,
      rectRadius: 0.08,
      fill: { color: '0B0F19' },
      line: { color: '1E293B', width: 1 },
    });
    s.addText(slide.code.code, {
      x: 1.0,
      y: cursorY + 0.15,
      w: 11.3,
      h: codeH - 0.3,
      fontFace: 'Menlo',
      fontSize: 12,
      color: 'E2E8F0',
      valign: 'top',
    });
  }

  // Quote callout
  if (slide.quote && cursorY < 6.3) {
    s.addShape(pptx.ShapeType.roundRect, {
      x: 0.8,
      y: Math.min(cursorY, 5.4),
      w: 11.7,
      h: 1.1,
      rectRadius: 0.06,
      fill: { color: palette.surface },
      line: { color: palette.accent, width: 1.2 },
    });
    s.addText(
      `“${slide.quote.text}”${slide.quote.author ? `  — ${slide.quote.author}` : ''}`,
      {
        x: 1.05,
        y: Math.min(cursorY, 5.4) + 0.15,
        w: 11.2,
        h: 0.8,
        fontFace,
        fontSize: 14,
        italic: true,
        color: palette.body,
      }
    );
  }

  // Footer provenance & watermark
  const footerLeft = slide.cite ? `Ref: ${slide.cite}` : doc.frontmatter.author || '';
  const footerRight = doc.frontmatter.watermark
    ? `Created with Aimake.cc · ${slide.index + 1}/${doc.slides.length}`
    : `${slide.index + 1}/${doc.slides.length}`;

  if (footerLeft) {
    s.addText(footerLeft, {
      x: 0.8,
      y: 6.95,
      w: 7.5,
      h: 0.3,
      fontFace: 'Menlo',
      fontSize: 9.5,
      color: palette.muted,
    });
  }
  s.addText(footerRight, {
    x: 8.5,
    y: 6.95,
    w: 4.0,
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

export async function exportDeckToPptx(doc: DeckDocument, outFile: string): Promise<string> {
  const PptxConstructor = (PptxGenJS as unknown as { default?: typeof PptxGenJS }).default || PptxGenJS;
  const pptx = new PptxConstructor();
  pptx.layout = 'LAYOUT_WIDE'; // 13.333 x 7.5 inches (16:9)
  pptx.title = doc.frontmatter.title;
  pptx.author = doc.frontmatter.author || 'Aimake Creator';
  pptx.subject = 'Generated by Aimake Multimodal Creator OS';

  const palette = resolvePptPalette(doc.frontmatter.template, doc.frontmatter.accentColor);
  const fontFace = chooseFontFace(doc.frontmatter.locale);

  for (const slide of doc.slides) {
    const s = pptx.addSlide();
    addSlideContent(pptx, s, slide, doc, palette, fontFace);
  }

  await pptx.writeFile({ fileName: outFile });
  return outFile;
}
