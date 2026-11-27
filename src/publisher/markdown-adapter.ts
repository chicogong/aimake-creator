import matter from 'gray-matter';
import { parseDeckMarkdown } from '../renderer/deck-parser.js';
import { renderWeChatInlineHtml } from '../renderer/wechat-inliner.js';
import { renderMermaidSvg } from '../renderer/mermaid-svg.js';
import type { DeckDocument } from '../schema/types.js';
import type { PlatformFormattedContent, PublishPlatform, PublishOptions } from './types.js';

function esc(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function inlineFormatHtml(text: string, accent = '#2B6BE6'): string {
  return esc(text).replace(
    /\[([^\]\n]+)\]\((https?:\/\/[^\s()<>]+)\)|\*\*([^*]+)\*\*|`([^`]+)`/g,
    (_, label: string, url: string, bold: string, code: string) => {
      if (url) return `<a href="${url}" style="color:${accent};text-decoration:underline;">${label}</a>`;
      if (bold) return `<strong style="color:${accent};font-weight:700;">${bold}</strong>`;
      return `<code style="background:#f1f5f9;color:#0f172a;padding:2px 6px;border-radius:4px;font-family:Menlo,Consolas,monospace;font-size:0.9em;">${code}</code>`;
    }
  );
}

export function normalizeToCdn(text: string): string {
  return text
    // Convert relative figure paths to jsdelivr CDN preview.png
    .replace(/\(!?(\.\.\/)+figures\/([a-zA-Z0-9_-]+)\/(preview\.png|diagram\.svg)\)/g, '(https://cdn.jsdelivr.net/gh/chicogong/agent-systems@main/figures/$2/preview.png)')
    // Convert raw.githubusercontent.com to cdn.jsdelivr.net
    .replace(/https:\/\/raw\.githubusercontent\.com\/chicogong\/agent-systems\/main\//g, 'https://cdn.jsdelivr.net/gh/chicogong/agent-systems@main/')
    .replace(/https:\/\/raw\.githubusercontent\.com\/([^/]+)\/([^/]+)\/([^/]+)\//g, 'https://cdn.jsdelivr.net/gh/$1/$2@$3/');
}

/**
 * Converts a standard Markdown string into WeChat-ready inline HTML.
 */
export function convertStandardMarkdownToWechatHtml(rawMd: string, title: string, accent = '#2B6BE6'): string {
  const normalizedMd = normalizeToCdn(rawMd);
  const lines = normalizedMd.split('\n');
  const htmlParts: string[] = [];

  htmlParts.push(`
    <section data-tool="aimake-publisher" style="max-width:677px;margin:0 auto;padding:18px 14px;font-family:-apple-system,BlinkMacSystemFont,'PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif;color:#1f2937;background:#ffffff;line-height:1.8;word-wrap:break-word;">
      <section style="margin:0 0 28px 0;padding:24px 20px;background:linear-gradient(135deg,#0f172a 0%,#1e293b 100%);border-radius:12px;color:#f8fafc;">
        <h1 style="margin:0;font-size:22px;line-height:1.45;font-weight:800;color:#ffffff;letter-spacing:-0.2px;">${esc(title)}</h1>
      </section>
  `);

  let inCodeBlock = false;
  let codeLang = '';
  let codeBuffer: string[] = [];
  let inList = false;
  let inTable = false;
  let tableRows: string[][] = [];

  const flushTable = () => {
    if (!inTable || tableRows.length === 0) return;
    const [header, ...rows] = tableRows;
    const bodyRows = rows.filter((r) => !r.every((c) => /^[-:| ]+$/.test(c)));

    let tableHtml = `
      <div style="margin:22px 0;overflow-x:auto;">
        <table style="width:100%;border-collapse:collapse;font-size:13.5px;line-height:1.6;border:1px solid #e2e8f0;border-radius:6px;overflow:hidden;">
    `;
    if (header) {
      tableHtml += `
        <thead>
          <tr style="background:#f1f5f9;color:#0f172a;font-weight:700;">
            ${header.map((c) => `<th style="padding:10px 12px;border:1px solid #e2e8f0;text-align:left;">${inlineFormatHtml(c, accent)}</th>`).join('')}
          </tr>
        </thead>
      `;
    }
    tableHtml += `<tbody>`;
    for (let ri = 0; ri < bodyRows.length; ri++) {
      const bg = ri % 2 === 0 ? '#ffffff' : '#f8fafc';
      tableHtml += `
        <tr style="background:${bg};">
          ${bodyRows[ri].map((c) => `<td style="padding:10px 12px;border:1px solid #e2e8f0;color:#334155;vertical-align:top;">${inlineFormatHtml(c, accent)}</td>`).join('')}
        </tr>
      `;
    }
    tableHtml += `</tbody></table></div>`;
    htmlParts.push(tableHtml);
    tableRows = [];
    inTable = false;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trimEnd();

    // Tables
    if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
      if (inList) {
        htmlParts.push(`</ul>`);
        inList = false;
      }
      inTable = true;
      const cells = line.trim().slice(1, -1).split('|').map((c) => c.trim());
      tableRows.push(cells);
      continue;
    } else if (inTable) {
      flushTable();
    }

    // Code blocks
    if (line.startsWith('```')) {
      if (!inCodeBlock) {
        if (inList) {
          htmlParts.push(`</ul>`);
          inList = false;
        }
        inCodeBlock = true;
        codeLang = line.replace(/^```/, '').trim();
        codeBuffer = [];
      } else {
        inCodeBlock = false;
        if (codeLang === 'mermaid') {
          try {
            const rawSvg = renderMermaidSvg(codeBuffer.join('\n'));
            const themedSvg = rawSvg
              .replace(/var\(--bg,\s*[^)]+\)/g, '#ffffff')
              .replace(/var\(--surface,\s*[^)]+\)/g, '#ffffff')
              .replace(/var\(--border,\s*[^)]+\)/g, '#cbd5e1')
              .replace(/var\(--ink,\s*[^)]+\)/g, '#0f172a')
              .replace(/var\(--accent,\s*[^)]+\)/g, accent)
              .replace(/var\(--muted,\s*[^)]+\)/g, '#64748b');

            htmlParts.push(`
              <section style="margin:20px 0;padding:16px 14px;background:#f8fafc;border:1px solid #e2e8f0;border-left:4px solid ${accent};border-radius:10px;text-align:center;">
                <p style="margin:0 0 10px 0;font-size:11px;font-weight:700;color:${accent};letter-spacing:1.2px;text-transform:uppercase;">架构与逻辑流程 (Mermaid)</p>
                <div style="overflow-x:auto;max-width:100%;margin:0 auto;">
                  ${themedSvg}
                </div>
              </section>
            `);
          } catch (_) {
            htmlParts.push(`
              <section style="margin:18px 0;background:#0f172a;border-radius:8px;padding:14px 16px;overflow-x:auto;">
                <p style="margin:0 0 6px 0;font-size:11px;color:#94a3b8;font-family:Menlo,Consolas,monospace;text-transform:uppercase;">mermaid</p>
                <pre style="margin:0;font-family:Menlo,Consolas,monospace;font-size:13px;line-height:1.6;color:#e2e8f0;white-space:pre-wrap;word-break:break-word;"><code>${esc(codeBuffer.join('\n'))}</code></pre>
              </section>
            `);
          }
        } else {
          htmlParts.push(`
            <section style="margin:18px 0;background:#0f172a;border-radius:8px;padding:14px 16px;overflow-x:auto;">
              ${codeLang ? `<p style="margin:0 0 6px 0;font-size:11px;color:#94a3b8;font-family:Menlo,Consolas,monospace;text-transform:uppercase;">${esc(codeLang)}</p>` : ''}
              <pre style="margin:0;font-family:Menlo,Consolas,monospace;font-size:13px;line-height:1.6;color:#e2e8f0;white-space:pre-wrap;word-break:break-word;"><code>${esc(codeBuffer.join('\n'))}</code></pre>
            </section>
          `);
        }
      }
      continue;
    }

    if (inCodeBlock) {
      codeBuffer.push(line);
      continue;
    }

    // Horizontal rule
    if (/^(---|___|\*\*\*)$/.test(line.trim())) {
      if (inList) {
        htmlParts.push(`</ul>`);
        inList = false;
      }
      htmlParts.push(`<hr style="border:none;border-top:1px dashed #cbd5e1;margin:28px 0;" />`);
      continue;
    }

    // Images: ![alt](url)
    const imgMatch = line.trim().match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (imgMatch) {
      if (inList) {
        htmlParts.push(`</ul>`);
        inList = false;
      }
      const alt = imgMatch[1];
      const src = imgMatch[2];
      htmlParts.push(`
        <figure style="margin:24px 0;text-align:center;">
          <img src="${esc(src)}" alt="${esc(alt)}" style="display:block;max-width:100%;margin:0 auto;border-radius:8px;box-shadow:0 4px 14px rgba(0,0,0,0.08);" />
          ${alt ? `<figcaption style="margin-top:8px;font-size:12.5px;color:#64748b;line-height:1.4;">${esc(alt)}</figcaption>` : ''}
        </figure>
      `);
      continue;
    }

    // Headings
    if (line.startsWith('# ')) {
      continue; // Skip top H1 since rendered in header banner
    } else if (line.startsWith('## ')) {
      if (inList) {
        htmlParts.push(`</ul>`);
        inList = false;
      }
      const text = line.replace(/^## /, '').trim();
      htmlParts.push(`
        <section style="margin:36px 0 16px 0;display:flex;align-items:center;">
          <span style="display:inline-block;width:4px;height:22px;background:${accent};border-radius:2px;margin-right:10px;"></span>
          <h2 style="margin:0;font-size:18px;line-height:1.45;font-weight:700;color:#0f172a;">${esc(text)}</h2>
        </section>
      `);
      continue;
    } else if (line.startsWith('### ')) {
      if (inList) {
        htmlParts.push(`</ul>`);
        inList = false;
      }
      const text = line.replace(/^### /, '').trim();
      htmlParts.push(`
        <h3 style="margin:24px 0 12px 0;font-size:16px;line-height:1.5;font-weight:700;color:#1e293b;">${esc(text)}</h3>
      `);
      continue;
    }

    // Blockquote
    if (line.startsWith('> ')) {
      if (inList) {
        htmlParts.push(`</ul>`);
        inList = false;
      }
      const text = line.replace(/^> /, '').trim();
      htmlParts.push(`
        <blockquote style="margin:16px 0;padding:12px 16px;background:#f8fafc;border-left:4px solid ${accent};border-radius:0 8px 8px 0;color:#334155;font-size:15px;line-height:1.75;">
          ${inlineFormatHtml(text, accent)}
        </blockquote>
      `);
      continue;
    }

    // Lists
    if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
      if (!inList) {
        htmlParts.push(`<ul style="margin:12px 0 18px 0;padding-left:22px;">`);
        inList = true;
      }
      const itemText = line.trim().replace(/^[-*]\s+/, '');
      htmlParts.push(`<li style="margin:0 0 8px 0;font-size:15px;line-height:1.75;color:#334155;">${inlineFormatHtml(itemText, accent)}</li>`);
      continue;
    } else {
      if (inList) {
        htmlParts.push(`</ul>`);
        inList = false;
      }
    }

    // Regular paragraphs
    if (line.trim().length > 0) {
      htmlParts.push(`<p style="margin:0 0 14px 0;font-size:15.5px;color:#1f2937;line-height:1.8;text-align:justify;">${inlineFormatHtml(line.trim(), accent)}</p>`);
    }
  }

  if (inTable) {
    flushTable();
  }

  if (inList) {
    htmlParts.push(`</ul>`);
  }

  htmlParts.push(`
      <section style="margin:36px 0 12px 0;padding-top:16px;border-top:1px solid #e2e8f0;text-align:center;font-size:12px;color:#94a3b8;">
        Published via <strong style="color:#0f172a;">Aimake.cc</strong> · Local-First Multimodal Content Studio
      </section>
    </section>
  `);

  return htmlParts.join('\n');
}

/**
 * Extracts key highlights for Xiaohongshu / social posts.
 */
function extractSocialSummary(title: string, markdown: string, tags: string[]): string {
  const lines = markdown.split('\n').map((l) => l.trim()).filter(Boolean);
  const takeaways: string[] = [];

  for (const l of lines) {
    if (l.startsWith('- ') || l.startsWith('* ') || l.startsWith('1. ') || l.startsWith('2. ') || l.startsWith('3. ')) {
      const clean = l.replace(/^([-*]|\d+\.)\s+/, '').replace(/\*\*/g, '');
      if (clean.length > 10 && clean.length < 80 && takeaways.length < 4) {
        takeaways.push(clean);
      }
    }
  }

  const tagList = tags.length > 0 ? tags : ['AI开发', '大模型', '软件架构', '技术分享', '工程师日常'];
  const hashTags = tagList.map((t) => `#${t.replace(/^#/, '')}`).join(' ');

  return [
    `🔥 ${title}`,
    '',
    '大家好！今天深入拆解一个在生产环境下极易被忽视的高频痛点与核心机制：',
    '',
    '📌 核心要点速览：',
    ...takeaways.map((t, idx) => `${idx + 1}️⃣ ${t}`),
    '',
    '💡 完整工程解析与零依赖交互式实验已开源，欢迎在评论区或主页直达阅读！',
    '',
    hashTags,
  ].join('\n');
}

/**
 * Safely parses frontmatter with gray-matter, normalizing non-standard headers like ---deck.
 */
function safeParseMatter(raw: string) {
  const normalized = raw.replace(/^---[a-zA-Z0-9_-]+\n/, '---\n');
  return matter(normalized);
}

/**
 * Adapts raw content (.deck.md or .md) into multi-platform formatted deliverables.
 */
export function adaptContentForPlatforms(
  rawContent: string,
  sourcePath: string,
  options: PublishOptions = {}
): Record<PublishPlatform, PlatformFormattedContent> {
  const normalizedRaw = rawContent.replace(/^---[a-zA-Z0-9_-]+\n/, '---\n');
  const isDeck = sourcePath.endsWith('.deck.md') || rawContent.includes('---deck') || (rawContent.includes('---') && rawContent.includes('template:'));
  
  let title = 'Untitled Article';
  let cleanMarkdown = rawContent;
  let deckDoc: DeckDocument | null = null;
  const tags = options.tags || ['人工智能', '架构', 'AI 编程'];
  const category = options.category || '人工智能';
  const topics = options.topics || ['人工智能', '大语言模型 (LLM)', '软件架构', '后端开发'];

  if (isDeck) {
    try {
      deckDoc = parseDeckMarkdown(normalizedRaw);
      title = deckDoc.frontmatter.title || deckDoc.slides[0]?.title || 'Untitled Deck';
      // Build markdown representation from deck slides
      const slideParts: string[] = [`# ${title}\n`];
      for (const s of deckDoc.slides) {
        slideParts.push(`## ${s.title}\n`);
        if (s.subtitle) slideParts.push(`*${s.subtitle}*\n`);
        for (const p of s.bodyParagraphs) slideParts.push(`${p}\n`);
        for (const b of s.bullets) slideParts.push(`- ${b}`);
        if (s.code) slideParts.push(`\n\`\`\`${s.code.lang}\n${s.code.code}\n\`\`\`\n`);
        if (s.diagram && s.diagram.engine === 'mermaid') slideParts.push(`\n\`\`\`mermaid\n${s.diagram.code}\n\`\`\`\n`);
      }
      cleanMarkdown = slideParts.join('\n');
    } catch {
      // Fallback to matter parsing
    }
  }

  if (!deckDoc) {
    const parsedMatter = safeParseMatter(rawContent);
    cleanMarkdown = parsedMatter.content.trim();
    if (parsedMatter.data?.title) {
      title = parsedMatter.data.title;
    } else {
      const h1Match = cleanMarkdown.match(/^#\s+(.+)$/m);
      if (h1Match) {
        title = h1Match[1].trim();
      }
    }
  }

  // Normalize all image URLs to fast, reliable CDN (jsdelivr) for domestic access
  cleanMarkdown = normalizeToCdn(cleanMarkdown);

  // Strip relative local file links (e.g. [返回首页](../../README.md)) as they are invalid on external platforms
  const platformCleanMarkdown = cleanMarkdown
    .replace(/(?:^|\n)\s*\[返回[^\]]*\]\([^)]+\)[^\n]*/g, '')
    .replace(/(?<!\!)\[([^\]]+)\]\((?!https?:\/\/|#|mailto:)([^)]+)\)/g, '$1');

  // 1. WeChat: 100% Inline CSS HTML
  const wechatHtml = deckDoc
    ? renderWeChatInlineHtml(deckDoc)
    : convertStandardMarkdownToWechatHtml(platformCleanMarkdown, title);

  // 2. Zhihu: Clean Markdown with topics header & LaTeX math support
  const zhihuContent = [
    `# ${title}`,
    '',
    `> 推荐话题：${topics.join(' / ')}`,
    '',
    platformCleanMarkdown.replace(/^#\s+.+\n+/, ''), // Strip redundant duplicate H1
  ].join('\n');

  // 3. Juejin: Bytemd frontmatter + GitHub markdown
  const juejinContent = [
    '---',
    'theme: juejin',
    'highlight: github',
    `category: ${category}`,
    `tags: [${tags.map((t) => `"${t}"`).join(', ')}]`,
    '---',
    '',
    platformCleanMarkdown,
  ].join('\n');

  // 4. Xiaohongshu: High-engagement short copy
  const xhsContent = extractSocialSummary(title, platformCleanMarkdown, tags);

  // 5. Cross-post Manifest (Wechatsync / OpenWrite compatible)
  const manifest = {
    title,
    category,
    tags,
    topics,
    sourcePath,
    createdAt: new Date().toISOString(),
    platforms: ['wechat', 'zhihu', 'juejin', 'xiaohongshu'],
    files: {
      wechat: 'wechat.html',
      zhihu: 'zhihu.md',
      juejin: 'juejin.md',
      xiaohongshu: 'xiaohongshu.txt',
    },
  };

  const wordCount = cleanMarkdown.length;

  return {
    wechat: {
      platform: 'wechat',
      title,
      content: wechatHtml,
      format: 'html',
      wordCount: wechatHtml.length,
      fileName: 'wechat.html',
      metadata: { target: '微信公众号草稿箱 / 富文本粘贴' },
    },
    zhihu: {
      platform: 'zhihu',
      title,
      content: zhihuContent,
      format: 'markdown',
      wordCount,
      fileName: 'zhihu.md',
      metadata: { topics },
    },
    juejin: {
      platform: 'juejin',
      title,
      content: juejinContent,
      format: 'markdown',
      wordCount,
      fileName: 'juejin.md',
      metadata: { category, tags },
    },
    xiaohongshu: {
      platform: 'xiaohongshu',
      title: title.slice(0, 20),
      content: xhsContent,
      format: 'text',
      wordCount: xhsContent.length,
      fileName: 'xiaohongshu.txt',
      metadata: { tags },
    },
    pack: {
      platform: 'pack',
      title,
      content: JSON.stringify(manifest, null, 2),
      format: 'text',
      wordCount: JSON.stringify(manifest).length,
      fileName: 'manifest.json',
      metadata: manifest,
    },
    all: {
      platform: 'all',
      title,
      content: cleanMarkdown,
      format: 'markdown',
      wordCount,
      fileName: 'article.md',
      metadata: manifest,
    },
  };
}
