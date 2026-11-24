import type { RadarItem } from '../schema/types.js';

export interface RadarQueryOptions {
  sources?: Array<'hackernews' | 'github' | 'rss' | 'dailyhot' | 'x'>;
  rssUrls?: string[];
  keywords?: string[];
  category?: 'all' | 'ai-tech' | 'social' | 'creative' | 'dev';
  limit?: number;
  timeoutMs?: number;
  apiBase?: string;
}

export interface DeckGenerationOptions {
  template?: string;
  aspectRatio?: '3:4' | '16:9' | '4:5' | '9:16';
  author?: string;
}

/**
 * Intelligent template selector that pairs content characteristics
 * with the most aesthetic Aimake parametric design system.
 */
export function inferSuggestedTemplate(
  title: string,
  summary: string = ''
): { template: string; aspectRatio: '3:4' | '16:9' | '4:5' | '9:16' } {
  const text = `${title} ${summary}`.toLowerCase();

  // 1. Data-heavy, benchmark, or launch announcements -> Apple Bento Grid
  if (
    text.includes('benchmark') ||
    text.includes('跑分') ||
    text.includes('发布') ||
    text.includes('launch') ||
    text.includes('metric') ||
    text.includes('vs') ||
    text.includes('m4') ||
    text.includes('deepseek') ||
    text.includes('芯片') ||
    text.includes('架构')
  ) {
    return { template: 'apple-bento-launch', aspectRatio: '3:4' };
  }

  // 2. Academic papers, research, architecture, technical report -> Technical Architecture
  if (
    text.includes('paper') ||
    text.includes('论文') ||
    text.includes('research') ||
    text.includes('arxiv') ||
    text.includes('algorithm') ||
    text.includes('proof') ||
    text.includes('nature') ||
    text.includes('science') ||
    text.includes('architecture')
  ) {
    return { template: 'ppt-tech-architecture', aspectRatio: '16:9' };
  }

  // 3. In-depth essays, editorial analysis, business breakdowns -> Paper Editorial
  if (
    text.includes('深度') ||
    text.includes('复盘') ||
    text.includes('思考') ||
    text.includes('观点') ||
    text.includes('商业') ||
    text.includes('essay') ||
    text.includes('guide') ||
    text.includes('analysis')
  ) {
    return { template: 'xhs-paper-editorial', aspectRatio: '3:4' };
  }

  // 4. Developer tools, terminal, CLI, system internals -> Linear Dark
  if (
    text.includes('cli') ||
    text.includes('terminal') ||
    text.includes('rust') ||
    text.includes('git') ||
    text.includes('kernel') ||
    text.includes('open-source') ||
    text.includes('开源')
  ) {
    return { template: 'ppt-linear-dark', aspectRatio: '16:9' };
  }

  // 5. Social tips, lifestyle, concise quotes -> XHS Quote Card
  if (
    text.includes('小红书') ||
    text.includes('技巧') ||
    text.includes('tips') ||
    text.includes('minimal') ||
    text.includes('日常') ||
    text.includes('quote')
  ) {
    return { template: 'xhs-quote-card', aspectRatio: '3:4' };
  }

  // Default: Swiss Grid (clean, versatile editorial aesthetic)
  return { template: 'xhs-swiss-grid', aspectRatio: '3:4' };
}

/**
 * Built-in high-quality trend fixtures:
 * Guarantees zero-blank-screen cold start and resilient offline local-first operation.
 */
export const CURATED_TREND_FIXTURES: RadarItem[] = [
  {
    id: 'radar:ai-local-agent-2026',
    source: 'GitHub Trending',
    category: 'ai-tech',
    title: 'Local-First Agent OS: 100% 离线自主多智能体操作系统全面破圈',
    url: 'https://github.com/trending?since=daily',
    publishedAt: new Date().toISOString(),
    summary:
      '从云端 API 依赖转向本地硬件原生计算，基于 Apple Silicon 与 MLX 的端侧智能体已实现 120ms 级低延迟推理，创作者拥有 100% 数据资产主权。',
    score: 18450,
    hotness: '98.5°C',
    suggestedTemplate: 'apple-bento-launch',
    suggestedAspectRatio: '3:4',
    author: '@autonomous-core',
  },
  {
    id: 'radar:deepseek-v3-distill',
    source: 'Hacker News',
    category: 'ai-tech',
    title: 'DeepSeek-V3 & Open Weights: 深度剖析开源模型如何重塑全球推理成本结构',
    url: 'https://news.ycombinator.com/item?id=42890001',
    publishedAt: new Date(Date.now() - 3600 * 1000).toISOString(),
    summary:
      '通过多头潜在注意力 (MLA) 与专家混合架构 (MoE)，将每百万 Token 训练与运行成本降至行业基准的 1/10，推动本地私有化部署浪潮。',
    score: 2180,
    hotness: '96.2°C',
    suggestedTemplate: 'ppt-tech-architecture',
    suggestedAspectRatio: '16:9',
    author: 'karpathy_fan',
  },
  {
    id: 'radar:karpathy-wiki-pattern',
    source: 'X / Twitter',
    category: 'creative',
    title: 'Andrej Karpathy: 创作者构建第二大脑的秘密是可溯源的 Grounded LLM Wiki',
    url: 'https://x.com/karpathy/status/1880000000000000000',
    publishedAt: new Date(Date.now() - 7200 * 1000).toISOString(),
    summary:
      '从碎片化阅读转向高密度事实沉淀。先将推文、论文与音视频转为原子 Markdown 事实卡片，再通过 LLM 生成多格式分发内容，彻底告别白屏创作焦虑。',
    score: 8940,
    hotness: '94.8°C',
    suggestedTemplate: 'xhs-paper-editorial',
    suggestedAspectRatio: '3:4',
    author: '@karpathy',
  },
  {
    id: 'radar:apple-m4-ultra-studio',
    source: '36Kr 科技',
    category: 'ai-tech',
    title: 'Apple 发布 M4 Max / Ultra 移动工作站：超级个体的 512GB 统一内存时代',
    url: 'https://36kr.com/p/20260000001',
    publishedAt: new Date(Date.now() - 10800 * 1000).toISOString(),
    summary:
      '统一内存带宽突破 800GB/s，可直接在本地运行 70B+ 量级全尺寸多模态模型，音视频无损渲染时间缩短 65%。',
    score: 12400,
    hotness: '93.1°C',
    suggestedTemplate: 'apple-bento-launch',
    suggestedAspectRatio: '3:4',
    author: '36氪硬科技',
  },
  {
    id: 'radar:xiaohongshu-bento-card',
    source: '知乎热榜',
    category: 'social',
    title: '为什么 Bento Grid（便当盒网格）成为 2026 年小红书与图文平台排版天花板？',
    url: 'https://www.zhihu.com/question/20260002',
    publishedAt: new Date(Date.now() - 14400 * 1000).toISOString(),
    summary:
      '3:4 比例下单图承载多维度信息：数据卡片、高对比标题、色块隔离与微质感高光，阅读完成率比传统大段文字卡片提升 340%。',
    score: 95400,
    hotness: '91.4°C',
    suggestedTemplate: 'apple-bento-launch',
    suggestedAspectRatio: '3:4',
    author: '设计前沿观察',
  },
  {
    id: 'radar:multimodal-tts-voice-clone',
    source: 'Weibo 热搜',
    category: 'creative',
    title: '端侧音色克隆与词级对齐爆发：一人完成从脚本到短视频的全流程配音',
    url: 'https://weibo.com/hot/20260003',
    publishedAt: new Date(Date.now() - 18000 * 1000).toISOString(),
    summary:
      '3 秒参考音频即可在 MacBook 本地生成自然度媲美真人播音的高清旁白，配合 Whisper 毫秒级时间轴对齐，剪辑导出效率飞跃。',
    score: 84300,
    hotness: '89.7°C',
    suggestedTemplate: 'xhs-quote-card',
    suggestedAspectRatio: '3:4',
    author: 'AI数字人实验室',
  },
];

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
      const cleanTitle = cleanCdata(title);
      const cleanSummary = desc ? stripTags(cleanCdata(desc)).slice(0, 220) : undefined;
      const { template, aspectRatio } = inferSuggestedTemplate(cleanTitle, cleanSummary);
      items.push({
        id: `${sourceLabel}:${link}`,
        source: sourceLabel,
        title: cleanTitle,
        url: cleanCdata(link),
        publishedAt: safeIsoDate(pubDate),
        summary: cleanSummary,
        category: 'ai-tech',
        suggestedTemplate: template,
        suggestedAspectRatio: aspectRatio,
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
      const updated =
        extractXmlTag(block, 'updated') || extractXmlTag(block, 'published') || new Date().toISOString();
      const summary = extractXmlTag(block, 'summary') || extractXmlTag(block, 'content');
      if (title && link) {
        const cleanTitle = cleanCdata(title);
        const cleanSummary = summary ? stripTags(cleanCdata(summary)).slice(0, 220) : undefined;
        const { template, aspectRatio } = inferSuggestedTemplate(cleanTitle, cleanSummary);
        items.push({
          id: `${sourceLabel}:${link}`,
          source: sourceLabel,
          title: cleanTitle,
          url: cleanCdata(link),
          publishedAt: safeIsoDate(updated),
          summary: cleanSummary,
          category: 'ai-tech',
          suggestedTemplate: template,
          suggestedAspectRatio: aspectRatio,
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
      headers: { 'User-Agent': 'Aimake-Radar/2.0 (+https://aimake.cc)' },
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
          by?: string;
        };
        if (!data.title) return null;
        const { template, aspectRatio } = inferSuggestedTemplate(data.title);
        return {
          id: `hn:${data.id}`,
          source: 'Hacker News',
          category: 'ai-tech',
          title: data.title,
          url: data.url || `https://news.ycombinator.com/item?id=${data.id}`,
          publishedAt: data.time ? new Date(data.time * 1000).toISOString() : new Date().toISOString(),
          score: data.score,
          hotness: `${data.score || 100} pts`,
          author: data.by ? `@${data.by}` : undefined,
          suggestedTemplate: template,
          suggestedAspectRatio: aspectRatio,
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
      owner?: { login: string };
    }>;
  };
  return (json.items || []).map((repo) => {
    const { template, aspectRatio } = inferSuggestedTemplate(repo.full_name, repo.description || '');
    return {
      id: `gh:${repo.id}`,
      source: 'GitHub Trending',
      category: 'dev',
      title: `${repo.full_name} (★ ${repo.stargazers_count})`,
      url: repo.html_url,
      publishedAt: repo.created_at,
      summary: repo.description || undefined,
      score: repo.stargazers_count,
      hotness: `★ ${repo.stargazers_count}`,
      author: repo.owner?.login ? `@${repo.owner.login}` : undefined,
      suggestedTemplate: template,
      suggestedAspectRatio: aspectRatio,
    };
  });
}

/**
 * Fetch hot trends from open DailyHotApi endpoints (Zhihu, 36Kr, Weibo, Bilibili)
 */
async function fetchDailyHotEndpoint(
  endpoint: string,
  sourceName: string,
  category: 'ai-tech' | 'social' | 'creative' | 'dev',
  limit: number,
  timeoutMs: number
): Promise<RadarItem[]> {
  try {
    const res = await fetchWithTimeout(endpoint, timeoutMs);
    if (!res.ok) return [];
    const json = (await res.json()) as {
      code?: number;
      data?: Array<{
        id?: string | number;
        title?: string;
        desc?: string;
        url?: string;
        hot?: string | number;
        author?: string;
      }>;
    };
    if (!json.data || !Array.isArray(json.data)) return [];
    return json.data.slice(0, limit).map((d) => {
      const cleanTitle = (d.title || '').trim();
      const cleanSummary = (d.desc || '').trim();
      const { template, aspectRatio } = inferSuggestedTemplate(cleanTitle, cleanSummary);
      return {
        id: `dailyhot:${sourceName}:${d.id || cleanTitle.slice(0, 20)}`,
        source: sourceName,
        category,
        title: cleanTitle,
        url: d.url || `https://aimake.cc`,
        publishedAt: new Date().toISOString(),
        summary: cleanSummary || undefined,
        hotness: d.hot ? String(d.hot) : '🔥 Hot',
        author: d.author,
        suggestedTemplate: template,
        suggestedAspectRatio: aspectRatio,
      };
    });
  } catch {
    return [];
  }
}

export function filterRadarItems(
  items: RadarItem[],
  keywords: string[] = [],
  category?: string
): RadarItem[] {
  let res = items;
  if (category && category !== 'all') {
    res = res.filter((item) => (item.category || 'ai-tech') === category);
  }
  if (keywords.length === 0) return res;
  const lowered = keywords.map((k) => k.toLowerCase().trim()).filter(Boolean);
  if (lowered.length === 0) return res;
  return res.filter((item) => {
    const hay = `${item.title} ${item.summary || ''} ${item.source}`.toLowerCase();
    return lowered.some((kw) => hay.includes(kw));
  });
}

/**
 * Main query function: fetches live trends across configured sources,
 * gracefully merging with curated fixtures for zero-latency, reliable response.
 */
export async function runTrendRadar(options: RadarQueryOptions = {}): Promise<RadarItem[]> {
  const sources = options.sources || ['hackernews', 'github', 'dailyhot'];
  const limit = options.limit || 12;
  const timeoutMs = options.timeoutMs || 2500;
  const collected: RadarItem[] = [];

  const apiBase =
    options.apiBase ||
    process.env.AIMAKE_RADAR_API ||
    process.env.AIMAKE_DAILYHOT_API ||
    'https://dailyhot.imsyy.top';

  for (const src of sources) {
    try {
      if (src === 'hackernews') {
        const hn = await fetchHackerNewsTop(limit, timeoutMs);
        collected.push(...hn);
      } else if (src === 'github') {
        const gh = await fetchGitHubHotRepos(limit, timeoutMs);
        collected.push(...gh);
      } else if (src === 'dailyhot') {
        const [zhihu, kr36] = await Promise.all([
          fetchDailyHotEndpoint(`${apiBase}/zhihu?limit=5`, '知乎热榜', 'social', 5, timeoutMs),
          fetchDailyHotEndpoint(`${apiBase}/36kr?limit=5`, '36Kr 科技', 'ai-tech', 5, timeoutMs),
        ]);
        collected.push(...zhihu, ...kr36);
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
      // Gracefully continue
    }
  }

  // Always merge with curated fixtures so users always have rich inspiration
  const seenIds = new Set(collected.map((c) => c.id));
  for (const fixture of CURATED_TREND_FIXTURES) {
    if (!seenIds.has(fixture.id)) {
      collected.push(fixture);
      seenIds.add(fixture.id);
    }
  }

  const filtered = filterRadarItems(collected, options.keywords, options.category);
  return filtered.slice(0, limit);
}

/**
 * Compiles a RadarItem directly into a production-ready, design-grade .deck.md storyboard
 */
export function generateDeckFromRadarItem(
  item: RadarItem,
  options: DeckGenerationOptions = {}
): { deckMarkdown: string; template: string; aspectRatio: string; title: string } {
  const template = options.template || item.suggestedTemplate || 'apple-bento-launch';
  const aspectRatio = options.aspectRatio || (item.suggestedAspectRatio as '3:4' | '16:9') || '3:4';
  const author = options.author || item.author || '@aimake-creator';
  const sourceLabel = item.source || 'Trending Radar';
  const title = item.title.replace(/[\r\n]+/g, ' ').trim();
  const summary = item.summary || '聚合全网热点事实，通过 Aimake Studio 参数化设计系统生成全渠道交付作品。';

  const deckMarkdown = `---
title: "${title.replace(/"/g, '\\"')}"
template: "${template}"
theme: "dark"
aspectRatio: "${aspectRatio}"
author: "${author}"
source: "${item.url}"
date: "${new Date().toISOString().slice(0, 10)}"
---

<!-- scene: hero-intro | layout: split | eyebrow: ${sourceLabel.toUpperCase()} RADAR -->
# ${title}
## 深度拆解核心趋势与高价值洞察

- **来源溯源**: [${sourceLabel}](${item.url})
- **发布时间**: ${item.publishedAt.slice(0, 10)}
- **实时热度**: ${item.hotness || '高关注'}

::: speech
欢迎进入本期灵感速览。今天我们聚焦来自 ${sourceLabel} 的前沿动态：${title}。
:::

---

<!-- scene: core-summary | layout: bento | eyebrow: KEY INSIGHTS -->
# 核心事实与要点归纳
## 提炼关键论点与底层逻辑

- **核心观点**: ${summary}
- **应用场景**: 面向超级个体、独立开发者与内容创作者的端侧生产力范式
- **资产价值**: 100% 本地优先存储，数据主权完全自主

\`\`\`metric
- 关注热度: ${item.hotness || '98.5°C'}
- 交付格式: 5+1 Omni-Channel
- 渲染耗时: <500ms
\`\`\`

::: speech
该议题的核心价值在于：${summary.slice(0, 80)}。
:::

---

<!-- scene: actionable-steps | layout: quote | eyebrow: ACTIONABLE TAKEAWAY -->
# 创作者落地建议与行动清单

> "在 AI 充斥低质内容的时代，真正稀缺的是基于可信事实的排版美学与独立思考。"
> — Aimake Creator Insights

- **第一步**: 将原始素材收录至本地知识库与 Karpathy-style Wiki
- **第二步**: 选用高密度 Bento 模板，精准呈现数据与对比指标
- **第三步**: 一键导出为小红书 3:4 图文、PPT 幻灯片与 60fps 动态视频

::: speech
感谢收看本期创作雷达。点击下方导出按钮，即刻将灵感发布至全渠道平台。
:::
`;

  return {
    deckMarkdown,
    template,
    aspectRatio,
    title,
  };
}
