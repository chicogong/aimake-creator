import fs from 'node:fs/promises';
import path from 'node:path';
import type { RadarItem } from '../schema/types.js';
import { runTrendRadar, parseFeedXml } from './radar-engine.js';

export interface FeedSubscription {
  id: string;
  type: 'hackernews' | 'rss';
  url?: string;
  name: string;
  intervalMinutes: number;
  lastSuccessAt?: string;
  lastAttemptAt?: string;
  lastError?: string;
  nextCheckAt?: string;
  itemCount: number;
}

export interface FeedSchedulerState {
  version: '2.0.0';
  subscriptions: FeedSubscription[];
  items: RadarItem[];
  lastCatchUpAt?: string;
}

export interface PollResult {
  subscriptionId: string;
  newItemsCount: number;
  totalItemsCount: number;
  success: boolean;
  error?: string;
}

const DEFAULT_SUBSCRIPTIONS: FeedSubscription[] = [
  {
    id: 'hn-top',
    type: 'hackernews',
    name: 'Hacker News Top (Tech & AI)',
    intervalMinutes: 30,
    itemCount: 0,
  },
  {
    id: 'rss-google-ai',
    type: 'rss',
    name: 'Google News / Tech Top Stories',
    url: 'https://news.google.com/rss/headlines/section/topic/TECHNOLOGY?hl=zh-CN&gl=CN&ceid=CN:zh-Hans',
    intervalMinutes: 60,
    itemCount: 0,
  },
];

// Single in-flight poll lock per subscription to guarantee deduplicated concurrent runs
const inFlightPolls = new Map<string, Promise<PollResult>>();

async function fetchFeedWithTimeout(url: string, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  if (typeof timer.unref === 'function') timer.unref();
  try {
    return await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Aimake-Feed-Scheduler/2.0 (+https://aimake.cc)',
        Accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml, application/json',
      },
    });
  } finally {
    clearTimeout(timer);
  }
}

function getSchedulerStatePath(workspaceDir: string): string {
  return path.join(workspaceDir, '.aimake', 'feed-scheduler.json');
}

/**
 * Loads persistent feed scheduler state from .aimake/feed-scheduler.json
 */
export async function loadSchedulerState(workspaceDir: string): Promise<FeedSchedulerState> {
  const filePath = getSchedulerStatePath(workspaceDir);
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    const parsed = JSON.parse(raw) as Partial<FeedSchedulerState>;
    const subs = Array.isArray(parsed.subscriptions) && parsed.subscriptions.length > 0
      ? parsed.subscriptions
      : DEFAULT_SUBSCRIPTIONS;
    return {
      version: '2.0.0',
      subscriptions: subs,
      items: Array.isArray(parsed.items) ? parsed.items : [],
      lastCatchUpAt: parsed.lastCatchUpAt,
    };
  } catch {
    return {
      version: '2.0.0',
      subscriptions: DEFAULT_SUBSCRIPTIONS,
      items: [],
    };
  }
}

/**
 * Saves persistent feed scheduler state atomically
 */
export async function saveSchedulerState(
  workspaceDir: string,
  state: FeedSchedulerState
): Promise<void> {
  const filePath = getSchedulerStatePath(workspaceDir);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  const tmpPath = `${filePath}.tmp.${Date.now()}`;
  await fs.writeFile(tmpPath, JSON.stringify(state, null, 2), 'utf8');
  await fs.rename(tmpPath, filePath);
}

/**
 * Core intake worker: Polls a specific subscription with concurrency lock & deduplication.
 */
export async function pollSubscription(
  workspaceDir: string,
  subId: string,
  timeoutMs = 12000
): Promise<PollResult> {
  // 1. Re-use existing in-flight poll if one is currently active
  if (inFlightPolls.has(subId)) {
    return inFlightPolls.get(subId)!;
  }

  const pollPromise = (async () => {
    const state = await loadSchedulerState(workspaceDir);
    const sub = state.subscriptions.find((s) => s.id === subId);
    if (!sub) {
      throw new Error(`Feed subscription '${subId}' not found.`);
    }

    const now = new Date().toISOString();
    sub.lastAttemptAt = now;

    let fetchedItems: RadarItem[] = [];
    try {
      if (sub.type === 'hackernews') {
        fetchedItems = await runTrendRadar({
          sources: ['hackernews'],
          limit: 8,
          timeoutMs,
        });
        const hnItems = fetchedItems.filter((i) => i.source === 'Hacker News' || i.sourceKind === 'hackernews');
        if (hnItems.length > 0) fetchedItems = hnItems;
      } else if (sub.type === 'rss' && sub.url) {
        const res = await fetchFeedWithTimeout(sub.url, timeoutMs);
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        const xml = await res.text();
        fetchedItems = parseFeedXml(xml, sub.name);
        if (fetchedItems.length === 0) {
          throw new Error('未在该 RSS/Atom 订阅源解析出有效文章条目');
        }
      }

      // Preserve canonical capture date & timestamps
      for (const item of fetchedItems) {
        if (!item.publishedAt) item.publishedAt = now;
        (item as any).capturedAt = now;
        (item as any).subscriptionId = subId;
      }

      // Deduplicate against existing stored items by item ID & Canonical URL
      const existingIds = new Set(state.items.map((i) => i.id));
      const existingUrls = new Set(state.items.map((i) => (i.url || '').toLowerCase()).filter(Boolean));
      const newItems: RadarItem[] = [];

      for (const item of fetchedItems) {
        const urlKey = (item.url || '').toLowerCase();
        if (!existingIds.has(item.id) && (!urlKey || !existingUrls.has(urlKey))) {
          newItems.push(item);
          existingIds.add(item.id);
          if (urlKey) existingUrls.add(urlKey);
        }
      }

      // Prepend newest items, keep at most 100 items in cache
      state.items = [...newItems, ...state.items].slice(0, 100);

      sub.lastSuccessAt = now;
      sub.lastError = undefined;
      sub.itemCount = state.items.filter((i: any) => i.subscriptionId === subId).length;
      sub.nextCheckAt = new Date(Date.now() + sub.intervalMinutes * 60 * 1000).toISOString();

      await saveSchedulerState(workspaceDir, state);

      return {
        subscriptionId: subId,
        newItemsCount: newItems.length,
        totalItemsCount: sub.itemCount,
        success: true,
      };
    } catch (err: any) {
      sub.lastError = err.message || '上游请求超时或网络不可用';
      sub.nextCheckAt = new Date(Date.now() + Math.min(sub.intervalMinutes, 5) * 60 * 1000).toISOString();
      await saveSchedulerState(workspaceDir, state);

      return {
        subscriptionId: subId,
        newItemsCount: 0,
        totalItemsCount: sub.itemCount,
        success: false,
        error: sub.lastError,
      };
    } finally {
      inFlightPolls.delete(subId);
    }
  })();

  inFlightPolls.set(subId, pollPromise);
  return pollPromise;
}

/**
 * On-boot / Restart catch-up polling:
 * Inspects all subscriptions. If any subscription is due or has never succeeded,
 * runs catch-up poll immediately without blocking server boot.
 */
export async function runCatchUpPoll(
  workspaceDir: string,
  timeoutMs = 10000
): Promise<PollResult[]> {
  const state = await loadSchedulerState(workspaceDir);
  const now = Date.now();
  const results: PollResult[] = [];

  for (const sub of state.subscriptions) {
    const isDue =
      !sub.lastSuccessAt ||
      !sub.nextCheckAt ||
      new Date(sub.nextCheckAt).getTime() <= now;

    if (isDue) {
      try {
        const res = await pollSubscription(workspaceDir, sub.id, timeoutMs);
        results.push(res);
      } catch (err: any) {
        results.push({
          subscriptionId: sub.id,
          newItemsCount: 0,
          totalItemsCount: sub.itemCount,
          success: false,
          error: err.message,
        });
      }
    }
  }

  const updatedState = await loadSchedulerState(workspaceDir);
  updatedState.lastCatchUpAt = new Date().toISOString();
  await saveSchedulerState(workspaceDir, updatedState);

  return results;
}
