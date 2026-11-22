import crypto from 'node:crypto';
import type { NormalizedSource, IntakeOptions } from './types.js';

export function isTwitterUrl(url: string): boolean {
  return /(?:twitter\.com|x\.com)\/([a-zA-Z0-9_]+)\/status\/(\d+)/i.test(url);
}

export function parseTwitterCoordinates(url: string): { user: string; id: string } | null {
  const match = url.match(/(?:twitter\.com|x\.com)\/([a-zA-Z0-9_]+)\/status\/(\d+)/i);
  if (!match) return null;
  return { user: match[1], id: match[2] };
}

export async function scrapeTwitterPost(
  url: string,
  options: IntakeOptions = {}
): Promise<NormalizedSource> {
  const coords = parseTwitterCoordinates(url);
  const now = new Date().toISOString();
  const user = coords?.user || 'unknown';
  const id = coords?.id || '0';

  // Strategy 1: FxTwitter JSON API (Edge unauthenticated open API)
  try {
    const fxUrl = `https://api.fxtwitter.com/${user}/status/${id}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), options.timeoutMs || 8000);

    const res = await fetch(fxUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Aimake-Intake-Engine/1.0 (+https://aimake.cc)',
        Accept: 'application/json',
      },
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data = (await res.json()) as any;
      if (data?.tweet) {
        const t = data.tweet;
        const authorName = t.author?.name || user;
        const authorHandle = t.author?.screen_name || user;
        const tweetText = t.text || '';
        const title = options.title || `X Post by @${authorHandle}: ${tweetText.slice(0, 48).trim()}...`;
        const likes = typeof t.likes === 'number' ? t.likes : 0;
        const retweets = typeof t.retweets === 'number' ? t.retweets : 0;
        const views = typeof t.views === 'number' ? t.views : 0;

        const mdLines = [
          `# ${title}`,
          '',
          `> ${tweetText.split('\n').join('\n> ')}`,
          '',
          `**Author**: [${authorName} (@${authorHandle})](https://x.com/${authorHandle})  `,
          `**Published**: \`${t.created_at || now}\`  `,
          `**Original URL**: [${url}](${url})  `,
          '',
          '## 📊 Post Engagement & Metrics',
          `- **Likes**: ${likes.toLocaleString()}`,
          `- **Retweets**: ${retweets.toLocaleString()}`,
          ...(views > 0 ? [`- **Impressions / Views**: ${views.toLocaleString()}`] : []),
        ];

        // Include media if present
        if (t.media?.photos && Array.isArray(t.media.photos) && t.media.photos.length > 0) {
          mdLines.push('', '## 🖼️ Attached Media');
          for (const p of t.media.photos) {
            if (p.url) mdLines.push(`![](${p.url})`);
          }
        }

        // Include quote tweet if present
        if (t.quote) {
          mdLines.push(
            '',
            `### 🔁 Quoted Post by @${t.quote.author?.screen_name || 'user'}:`,
            `> ${(t.quote.text || '').split('\n').join('\n> ')}`
          );
        }

        const fullMd = mdLines.join('\n');
        const hash = crypto.createHash('sha256').update(fullMd).digest('hex');

        return {
          title,
          author: `@${authorHandle} (${authorName})`,
          sourceUrl: url,
          sourceType: 'x-twitter',
          capturedAt: now,
          tags: Array.from(new Set(['X', 'Twitter', authorHandle, ...(options.tags || [])])),
          metrics: [
            { label: 'Likes', value: likes.toLocaleString() },
            { label: 'Retweets', value: retweets.toLocaleString() },
            ...(views > 0 ? [{ label: 'Views', value: views.toLocaleString() }] : []),
          ],
          markdown: fullMd,
          sha256: hash,
        };
      }
    }
  } catch {
    // Fall through to Strategy 2 (Jina Reader)
  }

  // Strategy 2: Jina Reader Markdown Proxy
  try {
    const jinaUrl = `https://r.jina.ai/${url}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), options.timeoutMs || 8000);

    const res = await fetch(jinaUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Aimake-Intake-Engine/1.0 (+https://aimake.cc)',
      },
    });
    clearTimeout(timeout);

    if (res.ok) {
      const text = await res.text();
      const title = options.title || `X Thread by @${user} (${id})`;
      const fullMd = [
        `# ${title}`,
        '',
        `*Captured via Jina Reader from [${url}](${url}) on ${now}*`,
        '',
        text,
      ].join('\n');

      const hash = crypto.createHash('sha256').update(fullMd).digest('hex');
      return {
        title,
        author: `@${user}`,
        sourceUrl: url,
        sourceType: 'x-twitter',
        capturedAt: now,
        tags: Array.from(new Set(['X', 'Twitter', user, ...(options.tags || [])])),
        markdown: fullMd,
        sha256: hash,
      };
    }
  } catch {
    // Fall through to fallback
  }

  // Strategy 3: Safe Structured Fallback
  const fallbackTitle = options.title || `X Post by @${user} (${id})`;
  const fallbackMd = [
    `# ${fallbackTitle}`,
    '',
    `**Source URL**: [${url}](${url})  `,
    `**User**: @${user}  `,
    `**Post ID**: \`${id}\`  `,
    `**Captured**: \`${now}\`  `,
    '',
    `> Post reference recorded from ${url}. (Fetched in offline or firewalled environment)`,
  ].join('\n');

  return {
    title: fallbackTitle,
    author: `@${user}`,
    sourceUrl: url,
    sourceType: 'x-twitter',
    capturedAt: now,
    tags: Array.from(new Set(['X', 'Twitter', user, ...(options.tags || [])])),
    markdown: fallbackMd,
    sha256: crypto.createHash('sha256').update(fallbackMd).digest('hex'),
  };
}
