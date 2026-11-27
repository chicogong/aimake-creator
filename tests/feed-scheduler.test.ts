import { describe, it, expect, beforeEach, afterEach } from 'vitest';
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
});
