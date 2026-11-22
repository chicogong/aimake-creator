import type { RadarItem } from '../schema/types.js';

export interface RadarQueryOptions {
  sources?: Array<'hackernews' | 'github' | 'rss'>;
  rssUrls?: string[];
  keywords?: string[];
  limit?: number;
  timeoutMs?: number;
}

function parseRssXml(xml: string, sourceLabel: string): RadarItem[] {
  const items: RadarItem[] = [];

  // RSS 2.0 <item> blocks
  const itemMatches = xml.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi);
  for (const match of itemMatches) {
    const block = match[1];
    const title = extractXmlTag(block, 'title');
    const link = extractXmlTag(block, 'link') || extractXmlTag(block, 'guid');
    const pubDate = extractXmlTag(block, 'pubDate') || new Date().toISOString();
    const desc = extractXmlTag(block, 'description');
    if (title && link) {
      items.push({
        id: `${sourceLabel}:${link}`,
        source: sourceLabel,
        title: cleanCdata(title),
        url: cleanCdata(link),
        publishedAt: safeIsoDate(pubDate),
        summary: desc ? stripTags(cleanCdata(desc)).slice(0, 220) : undefined,
      });
    }
  }

  // Atom <entry> blocks
  if (items.length === 0) {
    const entryMatches = xml.matchAll(/<entry\b[^>]*>([\s\S]*?)<\/entry>/gi);
    for (const match of entryMatches) {
      const block = match[1];
      const title = extractXmlTag(block, 'title');
      const linkMatch = block.match(/<link[^>]+href=["']([^"']+)["']/i);
      const link = linkMatch ? linkMatch[1] : extractXmlTag(block, 'id');
      const updated = extractXmlTag(block, 'updated') || extractXmlTag(block, 'published') || new Date().toISOString();
      const summary = extractXmlTag(block, 'summary') || extractXmlTag(block, 'content');
      if (title && link) {
        items.push({
          id: `${sourceLabel}:${link}`,
          source: sourceLabel,
          title: cleanCdata(title),
          url: cleanCdata(link),
          publishedAt: safeIsoDate(updated),
          summary: summary ? stripTags(cleanCdata(summary)).slice(0, 220) : undefined,
        });
      }
    }
  }

  return items;
}

function extractXmlTag(block: string, tag: string): string | undefined {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
  const m = block.match(re);
  return m ? m[1].trim() : undefined;
}

function cleanCdata(raw: string): string {
  return raw.replace(/^<!\[CDATA\[([\s\S]*?)\]\]>$/i, '$1').trim();
}

function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function safeIsoDate(input: string): string {
  const d = new Date(input);
  return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}

export function parseFeedXml(xml: string, sourceLabel = 'rss'): RadarItem[] {
  return parseRssXml(xml, sourceLabel);
}

async function fetchWithTimeout(url: string, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Aimake-Radar/1.0 (+https://aimake.cc)' },
    });
  } finally {
    clearTimeout(timer);
  }
}

async function fetchHackerNewsTop(limit: number, timeoutMs: number): Promise<RadarItem[]> {
  const res = await fetchWithTimeout('https://hacker-news.firebaseio.com/v0/topstories.json', timeoutMs);
  if (!res.ok) return [];
  const ids = ((await res.json()) as number[]).slice(0, Math.min(limit, 15));
  const items = await Promise.all(
    ids.map(async (id): Promise<RadarItem | null> => {
      try {
        const itemRes = await fetchWithTimeout(
          `https://hacker-news.firebaseio.com/v0/item/${id}.json`,
          timeoutMs
        );
        if (!itemRes.ok) return null;
        const data = (await itemRes.json()) as {
          id: number;
          title?: string;
          url?: string;
          score?: number;
          time?: number;
        };
        if (!data.title) return null;
        return {
          id: `hn:${data.id}`,
          source: 'hackernews',
          title: data.title,
          url: data.url || `https://news.ycombinator.com/item?id=${data.id}`,
          publishedAt: data.time ? new Date(data.time * 1000).toISOString() : new Date().toISOString(),
          score: data.score,
        };
      } catch {
        return null;
      }
    })
  );
  return items.filter((i): i is RadarItem => i !== null);
}

async function fetchGitHubHotRepos(limit: number, timeoutMs: number): Promise<RadarItem[]> {
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400 * 1000).toISOString().slice(0, 10);
  const url = `https://api.github.com/search/repositories?q=created:>${sevenDaysAgo}&sort=stars&order=desc&per_page=${Math.min(limit, 15)}`;
  const res = await fetchWithTimeout(url, timeoutMs);
  if (!res.ok) return [];
  const json = (await res.json()) as {
    items?: Array<{
      id: number;
      full_name: string;
      html_url: string;
      description?: string;
      stargazers_count: number;
      created_at: string;
    }>;
  };
  return (json.items || []).map((repo) => ({
    id: `gh:${repo.id}`,
    source: 'github-trending',
    title: `${repo.full_name} (★ ${repo.stargazers_count})`,
    url: repo.html_url,
    publishedAt: repo.created_at,
    summary: repo.description || undefined,
    score: repo.stargazers_count,
  }));
}

export function filterRadarItems(items: RadarItem[], keywords: string[] = []): RadarItem[] {
  if (keywords.length === 0) return items;
  const lowered = keywords.map((k) => k.toLowerCase().trim()).filter(Boolean);
  if (lowered.length === 0) return items;
  return items.filter((item) => {
    const hay = `${item.title} ${item.summary || ''}`.toLowerCase();
    return lowered.some((kw) => hay.includes(kw));
  });
}

export async function runTrendRadar(options: RadarQueryOptions = {}): Promise<RadarItem[]> {
  const sources = options.sources || ['hackernews', 'github'];
  const limit = options.limit || 10;
  const timeoutMs = options.timeoutMs || 6000;
  const collected: RadarItem[] = [];

  for (const src of sources) {
    try {
      if (src === 'hackernews') {
        collected.push(...(await fetchHackerNewsTop(limit, timeoutMs)));
      } else if (src === 'github') {
        collected.push(...(await fetchGitHubHotRepos(limit, timeoutMs)));
      } else if (src === 'rss' && options.rssUrls) {
        for (const feedUrl of options.rssUrls) {
          const res = await fetchWithTimeout(feedUrl, timeoutMs);
          if (res.ok) {
            const xml = await res.text();
            collected.push(...parseRssXml(xml, new URL(feedUrl).hostname));
          }
        }
      }
    } catch {
      // Gracefully skip unreachable feeds in offline/restricted environments
    }
  }

  const filtered = filterRadarItems(collected, options.keywords);
  return filtered.slice(0, limit);
}
