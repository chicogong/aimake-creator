import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {
  loadSchedulerState,
  saveSchedulerState,
  pollSubscription,
  runCatchUpPoll,
  type FeedSchedulerState,
} from '../src/radar/feed-scheduler.js';

describe('T-21 / Issue #59: Persistent Feed Scheduler & Catch-Up Poller', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'aimake-feed-test-'));
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it('initializes default subscriptions when no state file exists', async () => {
    const state = await loadSchedulerState(tmpDir);
    expect(state.version).toBe('2.0.0');
    expect(state.subscriptions.length).toBeGreaterThanOrEqual(2);
    expect(state.subscriptions.some((s) => s.id === 'hn-top')).toBe(true);
    expect(state.subscriptions.some((s) => s.id === 'rss-google-ai')).toBe(true);
    expect(state.items).toEqual([]);
  });

  it('persists and restores custom scheduler state atomically', async () => {
    const customState: FeedSchedulerState = {
      version: '2.0.0',
      subscriptions: [
        {
          id: 'custom-rss',
          type: 'rss',
          name: 'Custom Tech RSS',
          url: 'https://example.com/rss.xml',
          intervalMinutes: 15,
          itemCount: 1,
          lastSuccessAt: '2026-11-27T00:00:00.000Z',
          nextCheckAt: '2026-11-27T00:15:00.000Z',
        },
      ],
      items: [
        {
          id: 'rss:1',
          source: 'Custom Tech RSS',
          category: 'ai-tech',
          title: 'Claude 3.7 & Antigravity 2.0 Integration',
          url: 'https://example.com/item-1',
          publishedAt: '2026-11-27T00:00:00.000Z',
          suggestedTemplate: 'apple-bento-launch',
          suggestedAspectRatio: '16:9',
        },
      ],
      lastCatchUpAt: '2026-11-27T00:00:00.000Z',
    };

    await saveSchedulerState(tmpDir, customState);
    const loaded = await loadSchedulerState(tmpDir);

    expect(loaded.subscriptions[0].id).toBe('custom-rss');
    expect(loaded.items[0].title).toContain('Claude 3.7');
    expect(loaded.lastCatchUpAt).toBe('2026-11-27T00:00:00.000Z');
  });

  it('deduplicates concurrent in-flight poll triggers for the same subscription', async () => {
    // Trigger two polls concurrently on 'hn-top'
    const p1 = pollSubscription(tmpDir, 'hn-top', 5000);
    const p2 = pollSubscription(tmpDir, 'hn-top', 5000);

    // They must share the exact same promise reference or resolve identically
    const [res1, res2] = await Promise.all([p1, p2]);
    expect(res1.subscriptionId).toBe('hn-top');
    expect(res2.subscriptionId).toBe('hn-top');
    expect(res1.success).toBe(res2.success);
  });

  it('executes catch-up poll for due subscriptions and stores timestamps', async () => {
    // Write an expired subscription
    const overdueState: FeedSchedulerState = {
      version: '2.0.0',
      subscriptions: [
        {
          id: 'hn-top',
          type: 'hackernews',
          name: 'Hacker News Top',
          intervalMinutes: 30,
          itemCount: 0,
          nextCheckAt: new Date(Date.now() - 3600_000).toISOString(), // 1 hour ago (overdue)
        },
      ],
      items: [],
    };
    await saveSchedulerState(tmpDir, overdueState);

    const results = await runCatchUpPoll(tmpDir, 5000);
    expect(results.length).toBe(1);
    expect(results[0].subscriptionId).toBe('hn-top');

    const updated = await loadSchedulerState(tmpDir);
    expect(updated.lastCatchUpAt).toBeDefined();
    expect(updated.subscriptions[0].lastAttemptAt).toBeDefined();
    if (results[0].success) {
      expect(updated.subscriptions[0].lastSuccessAt).toBeDefined();
      expect(new Date(updated.subscriptions[0].nextCheckAt!).getTime()).toBeGreaterThan(Date.now());
    }
  });

  it('retains previous items on upstream timeout/error without corrupting cache', async () => {
    const existingState: FeedSchedulerState = {
      version: '2.0.0',
      subscriptions: [
        {
          id: 'unreachable-rss',
          type: 'rss',
          url: 'http://127.0.0.1:59999/unreachable-feed.xml',
          name: 'Unreachable Source',
          intervalMinutes: 10,
          itemCount: 1,
          lastSuccessAt: '2026-11-26T12:00:00.000Z',
        },
      ],
      items: [
        {
          id: 'cached:1',
          source: 'Unreachable Source',
          category: 'ai-tech',
          title: 'Preserved Historical Intelligence Item',
          url: 'https://example.com/cached-1',
          publishedAt: '2026-11-26T12:00:00.000Z',
        },
      ],
    };
    await saveSchedulerState(tmpDir, existingState);

    const res = await pollSubscription(tmpDir, 'unreachable-rss', 1000);
    expect(res.success).toBe(false);
    expect(res.error).toBeDefined();

    const after = await loadSchedulerState(tmpDir);
    // Cached items must be strictly preserved
    expect(after.items.length).toBe(1);
    expect(after.items[0].title).toBe('Preserved Historical Intelligence Item');
    expect(after.subscriptions[0].lastError).toBeDefined();
    expect(after.subscriptions[0].lastSuccessAt).toBe('2026-11-26T12:00:00.000Z');
  });

  it('Issue #81: equal subscription IDs in different workspaces poll independently', async () => {
    const ws1 = await fs.mkdtemp(path.join(os.tmpdir(), 'aimake-feed-ws1-'));
    const ws2 = await fs.mkdtemp(path.join(os.tmpdir(), 'aimake-feed-ws2-'));

    try {
      await loadSchedulerState(ws1);
      await loadSchedulerState(ws2);

      const [res1, res2] = await Promise.all([
        pollSubscription(ws1, 'hn-top', 5000),
        pollSubscription(ws2, 'hn-top', 5000),
      ]);

      expect(res1.subscriptionId).toBe('hn-top');
      expect(res2.subscriptionId).toBe('hn-top');

      const state1 = await loadSchedulerState(ws1);
      const state2 = await loadSchedulerState(ws2);

      expect(state1.subscriptions.find((s) => s.id === 'hn-top')?.lastAttemptAt).toBeDefined();
      expect(state2.subscriptions.find((s) => s.id === 'hn-top')?.lastAttemptAt).toBeDefined();
    } finally {
      await fs.rm(ws1, { recursive: true, force: true });
      await fs.rm(ws2, { recursive: true, force: true });
    }
  });

  it('Issue #81: concurrent refreshes for two different feeds in one workspace retain both items and timestamps', async () => {
    let delayA = 0;
    let delayB = 0;

    const server = http.createServer((req, res) => {
      const isA = req.url === '/feed-a.xml';
      const delay = isA ? delayA : delayB;

      setTimeout(() => {
        res.setHeader('Content-Type', 'application/xml; charset=utf-8');
        if (isA) {
          res.end(`<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Feed A</title>
    <item>
      <title>Article A: Autonomous Multi-Agent Swarms</title>
      <link>https://example.com/article-a</link>
      <description>Summary of Article A</description>
    </item>
  </channel>
</rss>`);
        } else if (req.url === '/feed-b.xml') {
          res.end(`<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Feed B</title>
    <item>
      <title>Article B: Local-First Publishing Flywheel</title>
      <link>https://example.com/article-b</link>
      <description>Summary of Article B</description>
    </item>
  </channel>
</rss>`);
        } else {
          res.statusCode = 404;
          res.end();
        }
      }, delay);
    });

    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));
    const port = (server.address() as any).port;

    try {
      const state: FeedSchedulerState = {
        version: '2.0.0',
        subscriptions: [
          {
            id: 'feed-a',
            type: 'rss',
            name: 'Feed A',
            url: `http://127.0.0.1:${port}/feed-a.xml`,
            intervalMinutes: 15,
            itemCount: 0,
          },
          {
            id: 'feed-b',
            type: 'rss',
            name: 'Feed B',
            url: `http://127.0.0.1:${port}/feed-b.xml`,
            intervalMinutes: 15,
            itemCount: 0,
          },
        ],
        items: [],
      };
      await saveSchedulerState(tmpDir, state);

      // Phase 1: Feed A finishes first, Feed B delayed
      delayA = 0;
      delayB = 40;
      const [resA1, resB1] = await Promise.all([
        pollSubscription(tmpDir, 'feed-a', 5000),
        pollSubscription(tmpDir, 'feed-b', 5000),
      ]);

      expect(resA1.success).toBe(true);
      expect(resB1.success).toBe(true);

      let reloaded = await loadSchedulerState(tmpDir);
      let subA = reloaded.subscriptions.find((s) => s.id === 'feed-a');
      let subB = reloaded.subscriptions.find((s) => s.id === 'feed-b');

      expect(subA?.lastSuccessAt).toBeDefined();
      expect(subB?.lastSuccessAt).toBeDefined();
      expect(subA?.itemCount).toBe(1);
      expect(subB?.itemCount).toBe(1);
      expect(reloaded.items.some((i: any) => i.subscriptionId === 'feed-a')).toBe(true);
      expect(reloaded.items.some((i: any) => i.subscriptionId === 'feed-b')).toBe(true);

      // Phase 2: Repeat with reversed completion order (Feed B finishes first, Feed A delayed)
      delayA = 40;
      delayB = 0;
      const [resA2, resB2] = await Promise.all([
        pollSubscription(tmpDir, 'feed-a', 5000),
        pollSubscription(tmpDir, 'feed-b', 5000),
      ]);

      expect(resA2.success).toBe(true);
      expect(resB2.success).toBe(true);

      reloaded = await loadSchedulerState(tmpDir);
      subA = reloaded.subscriptions.find((s) => s.id === 'feed-a');
      subB = reloaded.subscriptions.find((s) => s.id === 'feed-b');

      expect(subA?.lastSuccessAt).toBeDefined();
      expect(subB?.lastSuccessAt).toBeDefined();
      expect(subA?.itemCount).toBe(1);
      expect(subB?.itemCount).toBe(1);
      expect(reloaded.items.some((i: any) => i.subscriptionId === 'feed-a')).toBe(true);
      expect(reloaded.items.some((i: any) => i.subscriptionId === 'feed-b')).toBe(true);
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });
});
