import type { DeckDocument, DeckSlide } from '../schema/types.js';

function esc(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function inlineFormat(text: string, accent: string): string {
  return esc(text)
    .replace(/\*\*([^*]+)\*\*/g, `<strong style="color:${accent};font-weight:700;">$1</strong>`)
    .replace(/`([^`]+)`/g, `<code style="background:#f1f3f7;color:#1e293b;padding:2px 6px;border-radius:4px;font-family:Menlo,Consolas,monospace;font-size:0.9em;">$1</code>`);
}

function renderSlideSection(slide: DeckSlide, accent: string, index: number, total: number): string {
  const parts: string[] = [];

  if (index === 0) {
    parts.push(`
      <section style="margin:0 0 28px 0;padding:28px 24px;background:linear-gradient(145deg,#111317 0%,#1d222b 100%);border-radius:14px;color:#f8fafc;">
        ${slide.eyebrow ? `<p style="margin:0 0 10px 0;font-size:12px;letter-spacing:1.6px;text-transform:uppercase;color:${accent};font-weight:700;">${esc(slide.eyebrow)}</p>` : ''}
        <h1 style="margin:0 0 12px 0;font-size:24px;line-height:1.4;font-weight:800;color:#ffffff;">${inlineFormat(slide.title, '#93c5fd')}</h1>
        ${slide.subtitle ? `<p style="margin:0;font-size:15px;line-height:1.65;color:#cbd5e1;">${inlineFormat(slide.subtitle, '#93c5fd')}</p>` : ''}
      </section>
    `);
  } else {
    parts.push(`
      <section style="margin:32px 0 16px 0;display:flex;align-items:center;">
        <span style="display:inline-block;width:4px;height:20px;background:${accent};border-radius:2px;margin-right:10px;"></span>
        <h2 style="margin:0;font-size:19px;line-height:1.45;font-weight:700;color:#111827;">${esc(`${index}. ${slide.title}`)}</h2>
      </section>
    `);
    if (slide.subtitle) {
      parts.push(`<p style="margin:0 0 14px 0;font-size:15px;color:#4b5563;line-height:1.7;">${inlineFormat(slide.subtitle, accent)}</p>`);
    }
  }

  for (const p of slide.bodyParagraphs) {
    parts.push(`<p style="margin:0 0 14px 0;font-size:16px;color:#1f2937;line-height:1.8;text-align:justify;">${inlineFormat(p, accent)}</p>`);
  }

  if (slide.metrics.length > 0) {
    const cards = slide.metrics
      .map(
        (m) => `
        <section style="flex:1 1 45%;min-width:130px;background:#f8fafc;border:1px solid #e2e8f0;border-left:3px solid ${accent};border-radius:8px;padding:12px 14px;margin:4px;">
          <p style="margin:0 0 4px 0;font-size:12px;color:#64748b;">${esc(m.label)}</p>
          <p style="margin:0;font-size:20px;font-weight:800;color:#0f172a;font-family:Menlo,monospace;">${esc(m.value)}${m.delta ? ` <span style="font-size:12px;color:#15803d;font-weight:600;">${esc(m.delta)}</span>` : ''}</p>
        </section>`
      )
      .join('');
    parts.push(`<section style="display:flex;flex-wrap:wrap;margin:14px -4px;">${cards}</section>`);
  }

  if (slide.bullets.length > 0) {
    const items = slide.bullets
      .map(
        (b) =>
          `<li style="margin:0 0 10px 0;font-size:15.5px;line-height:1.75;color:#1f2937;">${inlineFormat(b, accent)}</li>`
      )
      .join('');
    parts.push(`<ul style="margin:12px 0 18px 0;padding-left:20px;">${items}</ul>`);
  }

  if (slide.comparison) {
    parts.push(`
      <section style="display:flex;gap:10px;margin:16px 0;">
        <section style="flex:1;background:#fef2f2;border:1px solid #fecaca;border-radius:10px;padding:14px;">
          <p style="margin:0 0 8px 0;font-weight:700;font-size:14px;color:#991b1b;">${esc(slide.comparison.leftTitle)}</p>
          ${slide.comparison.leftItems.map((i) => `<p style="margin:0 0 6px 0;font-size:13.5px;color:#7f1d1d;line-height:1.55;">• ${esc(i)}</p>`).join('')}
        </section>
        <section style="flex:1;background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:14px;">
          <p style="margin:0 0 8px 0;font-weight:700;font-size:14px;color:#1e40af;">${esc(slide.comparison.rightTitle)}</p>
          ${slide.comparison.rightItems.map((i) => `<p style="margin:0 0 6px 0;font-size:13.5px;color:#1e3a8a;line-height:1.55;">• ${esc(i)}</p>`).join('')}
        </section>
      </section>
    `);
  }

  if (slide.quote) {
    parts.push(`
      <blockquote style="margin:16px 0;padding:14px 18px;background:#f8fafc;border-left:4px solid ${accent};border-radius:0 8px 8px 0;color:#334155;font-size:15px;line-height:1.75;">
        <p style="margin:0;">“${inlineFormat(slide.quote.text, accent)}”</p>
        ${slide.quote.author ? `<p style="margin:8px 0 0 0;font-size:12.5px;color:#64748b;text-align:right;">— ${esc(slide.quote.author)}</p>` : ''}
      </blockquote>
    `);
  }

  if (slide.code) {
    parts.push(`
      <section style="margin:16px 0;background:#0f172a;border-radius:10px;padding:14px 16px;overflow-x:auto;">
        <p style="margin:0 0 8px 0;font-size:11px;color:#94a3b8;font-family:Menlo,Consolas,monospace;text-transform:uppercase;">${esc(slide.code.lang)}</p>
        <pre style="margin:0;font-family:Menlo,Consolas,monospace;font-size:13px;line-height:1.6;color:#e2e8f0;white-space:pre-wrap;word-break:break-word;"><code>${esc(slide.code.code)}</code></pre>
      </section>
    `);
  }

  if (slide.cite && index < total) {
    parts.push(`<p style="margin:6px 0 0 0;font-size:11.5px;color:#94a3b8;font-family:Menlo,monospace;">Source Ref: ${esc(slide.cite)}</p>`);
  }

  return parts.join('\n');
}

/**
 * Generates 100% inline-styled WeChat Official Account compatible HTML (no <style> tags required).
 */
export function renderWeChatInlineHtml(doc: DeckDocument): string {
  const accent = doc.frontmatter.accentColor || '#2B6BE6';
  const bodySections = doc.slides
    .map((s, idx) => renderSlideSection(s, accent, idx, doc.slides.length))
    .join('\n');

  const signature = doc.frontmatter.watermark
    ? `<section style="margin:36px 0 8px 0;padding-top:16px;border-top:1px solid #e5e7eb;text-align:center;font-size:12px;color:#9ca3af;">Created with <strong style="color:#4b5563;">Aimake.cc</strong> · Template <code>#${esc(doc.frontmatter.template)}</code></section>`
    : '';

  return [
    `<section data-tool="aimake-wechat" style="max-width:677px;margin:0 auto;padding:16px 12px;font-family:-apple-system,BlinkMacSystemFont,'PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif;color:#1f2937;background:#ffffff;line-height:1.75;word-wrap:break-word;">`,
    bodySections,
    signature,
    `</section>`,
  ].join('\n');
}
