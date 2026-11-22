import crypto from 'node:crypto';
import type { NormalizedSource, IntakeOptions, IntakeSourceType } from './types.js';

export function isWechatUrl(url: string): boolean {
  return /mp\.weixin\.qq\.com\/s/i.test(url);
}

export function isZhihuUrl(url: string): boolean {
  return /zhihu\.com\/(?:p\/|question\/)/i.test(url);
}

function stripHtml(html: string): { title: string; markdown: string } {
  let title = '';
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleMatch) {
    title = titleMatch[1].replace(/[\r\n\t]+/g, ' ').trim();
  }

  // Extract body or main content
  let body = html;
  const contentMatch =
    html.match(/<div[^>]+id=["']js_content["'][^>]*>([\s\S]*?)<\/div>/i) ||
    html.match(/<article[^>]*>([\s\S]*?)<\/article>/i) ||
    html.match(/<main[^>]*>([\s\S]*?)<\/main>/i) ||
    html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);

  if (contentMatch) {
    body = contentMatch[1];
  }

  // Convert headings
  let md = body
    .replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, '\n\n# $1\n\n')
    .replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, '\n\n## $1\n\n')
    .replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, '\n\n### $1\n\n')
    .replace(/<h4[^>]*>([\s\S]*?)<\/h4>/gi, '\n\n#### $1\n\n')
    .replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, '\n\n$1\n\n')
    .replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, '\n\n> $1\n\n')
    .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, '\n- $1')
    .replace(/<strong[^>]*>([\s\S]*?)<\/strong>/gi, '**$1**')
    .replace(/<b[^>]*>([\s\S]*?)<\/b>/gi, '**$1**')
    .replace(/<em[^>]*>([\s\S]*?)<\/em>/gi, '*$1*')
    // Handle WeChat images with data-src
    .replace(/<img[^>]+(?:data-src|src)=["']([^"']+)["'][^>]*>/gi, '\n![]($1)\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return { title: title || 'Scraped Article', markdown: md };
}

export async function scrapeWebArticle(
  url: string,
  options: IntakeOptions = {}
): Promise<NormalizedSource> {
  const now = new Date().toISOString();
  let sourceType: IntakeSourceType = 'web';
  if (isWechatUrl(url)) sourceType = 'wechat';
  else if (isZhihuUrl(url)) sourceType = 'zhihu';

  // Strategy 1: Jina Reader Proxy (High fidelity, strips ads/paywalls/CAPTCHAs)
  try {
    const jinaUrl = `https://r.jina.ai/${url}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), options.timeoutMs || 9000);

    const res = await fetch(jinaUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Aimake-Intake-Engine/1.0 (+https://aimake.cc)',
      },
    });
    clearTimeout(timeout);

    if (res.ok) {
      const text = await res.text();
      let title = options.title || '';
      if (!title) {
        const firstH1 = text.match(/^#\s+(.+)$/m);
        if (firstH1) title = firstH1[1].trim();
      }
      if (!title) {
        title = `${sourceType.toUpperCase()} Article: ${new URL(url).pathname.slice(0, 32)}`;
      }

      const fullMd = [
        `# ${title}`,
        '',
        `**Source URL**: [${url}](${url})  `,
        `**Channel**: \`${sourceType}\`  `,
        `**Captured**: \`${now}\`  `,
        '',
        text,
      ].join('\n');

      return {
        title,
        sourceUrl: url,
        sourceType,
        capturedAt: now,
        tags: Array.from(new Set([sourceType, 'Article', ...(options.tags || [])])),
        markdown: fullMd,
        sha256: crypto.createHash('sha256').update(fullMd).digest('hex'),
      };
    }
  } catch {
    // Fall through to Strategy 2
  }

  // Strategy 2: Direct Fetch & Strip HTML
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), options.timeoutMs || 8000);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });
    clearTimeout(timeout);

    if (res.ok) {
      const html = await res.text();
      const parsed = stripHtml(html);
      const title = options.title || parsed.title;

      const fullMd = [
        `# ${title}`,
        '',
        `**Source URL**: [${url}](${url})  `,
        `**Channel**: \`${sourceType}\`  `,
        `**Captured**: \`${now}\`  `,
        '',
        parsed.markdown,
      ].join('\n');

      return {
        title,
        sourceUrl: url,
        sourceType,
        capturedAt: now,
        tags: Array.from(new Set([sourceType, 'Article', ...(options.tags || [])])),
        markdown: fullMd,
        sha256: crypto.createHash('sha256').update(fullMd).digest('hex'),
      };
    }
  } catch {
    // Fall through
  }

  // Strategy 3: Offline deterministic record
  const fallbackTitle = options.title || `Article from ${new URL(url).hostname}`;
  const fallbackMd = [
    `# ${fallbackTitle}`,
    '',
    `**Source URL**: [${url}](${url})  `,
    `**Channel**: \`${sourceType}\`  `,
    `**Captured**: \`${now}\`  `,
    '',
    `> Content placeholder captured in offline mode. URL: ${url}`,
  ].join('\n');

  return {
    title: fallbackTitle,
    sourceUrl: url,
    sourceType,
    capturedAt: now,
    tags: Array.from(new Set([sourceType, 'Article', ...(options.tags || [])])),
    markdown: fallbackMd,
    sha256: crypto.createHash('sha256').update(fallbackMd).digest('hex'),
  };
}
