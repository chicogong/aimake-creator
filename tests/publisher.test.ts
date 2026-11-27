import { describe, expect, it } from 'vitest';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { adaptContentForPlatforms, publishContent } from '../src/publisher/index.js';

describe('Multi-Platform Omni-Channel Publisher', () => {
  const sampleMarkdown = [
    '---',
    'title: 2026 Multimodal Agent Playbook',
    'category: 人工智能',
    'tags: [Agent, LLM, Markdown]',
    '---',
    '',
    '# 2026 Multimodal Agent Playbook',
    '',
    '## The Shifting Landscape',
    '',
    'Modern agentic workflows require unified knowledge intake and multi-channel delivery.',
    '',
    '### Core Metrics',
    '- **10x** Content reuse across channels',
    '- **100%** Local-first execution',
    '- **0** Cloud privacy leaks',
    '',
    '```python',
    'def create_deliverable():',
    '    return "High impact"',
    '```',
  ].join('\n');

  it('adapts raw markdown for WeChat, Zhihu, Juejin, and Xiaohongshu', () => {
    const adapted = adaptContentForPlatforms(sampleMarkdown, 'playbook.md', {
      tags: ['AI', 'Tech'],
      category: '前端与架构',
    });

    expect(adapted.all.title).toBe('2026 Multimodal Agent Playbook');
    expect(adapted.wechat.content).toContain('<section');
    expect(adapted.wechat.content).toContain('100%');
    expect(adapted.zhihu.content).toContain('2026 Multimodal Agent Playbook');
    expect(adapted.juejin.content).toContain('---');
    expect(adapted.juejin.content).toContain('theme: juejin');
    expect(adapted.xiaohongshu.content).toContain('📌');
    expect(adapted.pack.content).toContain('wechat.html');
  });

  it('runs publishContent to bundle files and compound to published.md', async () => {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'aimake-pub-test-'));
    const testFile = path.join(tempDir, 'test-article.md');
    await fs.writeFile(testFile, sampleMarkdown, 'utf-8');

    const outDir = path.join(tempDir, 'out-bundle');
    const summary = await publishContent(testFile, {
      outDir,
      targets: ['wechat', 'zhihu', 'juejin', 'xiaohongshu', 'pack'],
      workspaceDir: tempDir,
    });

    expect(summary.title).toBe('2026 Multimodal Agent Playbook');
    expect(summary.results.length).toBe(5);

    // Verify written bundle files
    const wechatExists = await fs.stat(path.join(outDir, 'wechat.html'));
    expect(wechatExists.isFile()).toBe(true);

    const manifestExists = await fs.stat(path.join(outDir, 'manifest.json'));
    expect(manifestExists.isFile()).toBe(true);

    const readmeExists = await fs.stat(path.join(outDir, 'README.md'));
    expect(readmeExists.isFile()).toBe(true);

    // Verify compounding wiki entry
    const publishedLog = await fs.readFile(path.join(tempDir, 'wiki', 'published.md'), 'utf-8');
    expect(publishedLog).toContain('2026 Multimodal Agent Playbook');
    expect(publishedLog).toContain('wechat');

    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('keeps article sources clickable in the WeChat rich text export', () => {
    const article = '# Article\n\n- [Official source](https://example.com/release?a=1&b=2)';
    const { wechat } = adaptContentForPlatforms(article, 'article.md');

    expect(wechat.content).toContain(
      '<a href="https://example.com/release?a=1&amp;b=2" style="color:#2B6BE6;text-decoration:underline;">Official source</a>'
    );
  });
});
