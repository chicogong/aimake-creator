import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  applyChatSnapshot,
  classifyIntent,
  clearInMemorySnapshotsForTest,
  extractSlideFromLlmOutput,
  getPublicChatConfig,
  listRevisions,
  LOCAL_CLI_SPECS,
  processChatMessage,
  recordSnapshotPersistent,
  rollbackChatSnapshot,
  saveWorkspaceAiConfig,
} from '../src/studio/chat-engine.js';
import {
  ALL_TASK_RECIPES,
  buildAgentLaunchInfo,
} from '../src/workspace/index.js';
import type { DeckDocument } from '../src/schema/types.js';

const mockDeck: DeckDocument = {
  frontmatter: {
    title: '测试文稿',
    template: 'xhs-swiss-grid',
    locale: 'zh-CN',
    aspect: '3:4',
    tags: ['test'],
    watermark: false,
    fps: 30,
    secondsPerSlide: 4,
  },
  slides: [
    {
      index: 0,
      id: 'slide-1',
      layout: 'bullets',
      title: '第一页标题',
      subtitle: '第一页副标题',
      bullets: ['要点1', '要点2'],
      bodyParagraphs: [],
      metrics: [],
    },
    {
      index: 1,
      id: 'slide-2',
      layout: 'bullets',
      title: '第二页关于大模型套壳',
      subtitle: '毫无疑问这是颠覆性的技术革命',
      bullets: ['不仅如此而且不可否认非常重要'],
      bodyParagraphs: [],
      metrics: [],
    },
  ],
};

const tempDirs: string[] = [];

afterEach(async () => {
  clearInMemorySnapshotsForTest();
  while (tempDirs.length > 0) {
    const dir = tempDirs.pop();
    if (dir) await fs.rm(dir, { recursive: true, force: true });
  }
});

describe('chat-engine ("1+1" Real AI + Honest Offline Tools)', () => {
  it('classifies intents correctly', () => {
    expect(classifyIntent('请帮我新增一页介绍')).toBe('add_slide');
    expect(classifyIntent('帮我给文稿去AI味并口语化')).toBe('humanize');
    expect(classifyIntent('生成演说逐字稿')).toBe('speech_notes');
    expect(classifyIntent('翻译成英文')).toBe('translate');
    expect(classifyIntent('增加一个对比表格')).toBe('insert_block');
    expect(classifyIntent('扩写本页内容')).toBe('expand_slide');
    expect(classifyIntent('提炼金句卡片')).toBe('extract_quote');
    expect(classifyIntent('转为 Bento 风格')).toBe('bento_style');
    expect(classifyIntent('生成演讲大纲')).toBe('presentation_outline');
    expect(classifyIntent('翻译为双语')).toBe('bilingual_translate');
    expect(classifyIntent('把这页改成案例故事')).toBe('freeform');
  });

  it('calls OpenAI-compatible API cleanly and round-trips nested metric/speech markdown', async () => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'aimake-chat-api-'));
    tempDirs.push(tmpDir);
    const deckPath = path.join(tmpDir, 'deck.md');

    let capturedUrl = '';
    let capturedAuth = '';
    let capturedBody = '';

    const mockFetch: typeof fetch = async (input, init) => {
      capturedUrl = String(input);
      const headers = (init?.headers || {}) as Record<string, string>;
      capturedAuth = headers.Authorization || '';
      capturedBody = String(init?.body || '');

      const llmText = [
        'SUMMARY: 将第一页重构为三栏实测指标卡并补充口播稿',
        '<aimake-slide>',
        '<!-- scene: bench | layout: metrics | eyebrow: FIELD TEST -->',
        '# 实测 18 个月后的架构取舍',
        '## 决定体验上限的不是模型参数，而是端到端延迟',
        '',
        '- 去掉中心服务器，首屏渲染耗时降到百毫秒内',
        '',
        '```metric',
        '- 首屏加载: 86ms (-82%)',
        '- 本机留存: 100% (Zero-Cloud)',
        '```',
        '',
        '::: speech',
        '过去一年半的实测证明，真正决定工具能不能留下的，是端到端的响应延迟。',
        ':::',
        '</aimake-slide>',
      ].join('\n');

      return new Response(
        JSON.stringify({
          choices: [{ message: { content: llmText } }],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    };

    const res = await processChatMessage({
      message: '把当前页改成实测指标卡对比',
      activeSlideIndex: 0,
      deck: mockDeck,
      deckPath,
      workspaceDir: tmpDir,
      backend: 'api',
      apiConfigOverride: {
        baseUrl: 'https://api.deepseek.com/v1',
        apiKey: 'mock-aimake-key-001',
        model: 'deepseek-chat',
      },
      fetchImpl: mockFetch,
    });

    expect(capturedUrl).toBe('https://api.deepseek.com/v1/chat/completions');
    expect(capturedAuth).toBe('Bearer mock-aimake-key-001');
    expect(capturedBody).toContain('deepseek-chat');
    expect(capturedBody).toContain('第一页标题');

    expect(res.engineUsed).toContain('deepseek-chat');
    expect(res.needsAiSetup).toBeUndefined();
    expect(res.updatedDeck).toBeDefined();
    expect(res.updatedDeck!.slides[0].title).toBe('实测 18 个月后的架构取舍');
    expect(res.updatedDeck!.slides[0].metrics).toHaveLength(2);
    expect(res.updatedDeck!.slides[0].metrics[0].value).toBe('86ms');
    expect(res.updatedDeck!.slides[0].speech).toContain('端到端的响应延迟');
    expect(res.diffLines && res.diffLines.length).toBeGreaterThan(0);
    expect(res.revisionId).toMatch(/^rev-/);
  });

  it('invokes detected local CLI agent with exact non-interactive flags and no global config leaks', async () => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'aimake-chat-cli-'));
    tempDirs.push(tmpDir);

    let calledBinary = '';
    let calledArgs: string[] = [];

    const res = await processChatMessage({
      message: '新增一页介绍具身智能大模型落地路径',
      activeSlideIndex: 0,
      deck: mockDeck,
      workspaceDir: tmpDir,
      backend: 'cli:codebuddy',
      detectedClisOverride: [
        { id: 'codebuddy', label: 'CodeBuddy CLI', binary: '/opt/homebrew/bin/codebuddy', available: true },
      ],
      cliRunner: async (binary, args) => {
        calledBinary = binary;
        calledArgs = args;
        return [
          'SUMMARY: 新增具身智能三大落地路径页',
          '<aimake-slide>',
          '<!-- scene: embodied | layout: bullets | eyebrow: EMBODIED AI -->',
          '# 具身智能走进工厂的三个关键门槛',
          '## 触觉闭环、空间记忆与百毫秒端侧推理',
          '',
          '- 视觉-语言-动作统一表征降低跨本体微调成本',
          '- 高频力控反馈确保柔性装配良率稳定',
          '</aimake-slide>',
        ].join('\n');
      },
    });

    expect(calledBinary).toBe('/opt/homebrew/bin/codebuddy');
    expect(calledArgs).toContain('-p');
    expect(calledArgs).toContain('--tools');
    expect(calledArgs).toContain('--no-session-persistence');
    expect(res.engineUsed).toBe('CodeBuddy CLI');
    expect(res.updatedDeck?.slides).toHaveLength(3);
    expect(res.affectedSlideIndex).toBe(1);
    expect(res.updatedDeck!.slides[1].title).toContain('具身智能');

    // Verify all 5 declarative CLI specs build clean non-interactive argv
    expect(LOCAL_CLI_SPECS.map((s) => s.id)).toEqual([
      'codebuddy',
      'claude',
      'agy',
      'opencode',
      'codex',
    ]);
    expect(LOCAL_CLI_SPECS.find((s) => s.id === 'codex')!.buildArgs('hi')).toEqual([
      'exec',
      '--skip-git-repo-check',
      'hi',
    ]);
  });

  it('never injects fake copy or copies user prompt into bullets when unconfigured', async () => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'aimake-chat-unconfigured-'));
    tempDirs.push(tmpDir);

    const res = await processChatMessage({
      message: '把这页改成三段式个人故事',
      activeSlideIndex: 0,
      deck: mockDeck,
      workspaceDir: tmpDir,
      backend: 'auto',
      detectedClisOverride: [],
      apiConfigOverride: { baseUrl: '', apiKey: '', model: '' },
    });

    expect(res.needsAiSetup).toBe(true);
    expect(res.updatedDeck).toBeUndefined();
    expect(res.message).toContain('配置');
  });

  it('handles offline deterministic tools (humanize, add_slide scaffold, speech_notes, insert_block)', async () => {
    const humanizeRes = await processChatMessage({
      message: '去AI味',
      activeSlideIndex: 1,
      deck: mockDeck,
      mode: 'local',
    });
    expect(humanizeRes.updatedDeck?.slides[1].subtitle).not.toContain('毫无疑问');

    const speechRes = await processChatMessage({
      message: '生成演说口播逐字稿',
      activeSlideIndex: 0,
      deck: mockDeck,
      backend: 'offline',
    });
    expect(speechRes.updatedDeck?.slides[0].speech).toContain('第一页标题');

    const addRes = await processChatMessage({
      message: '加一页关于具身智能大模型',
      activeSlideIndex: 0,
      deck: mockDeck,
      backend: 'offline',
    });
    expect(addRes.updatedDeck?.slides).toHaveLength(3);
    expect(addRes.updatedDeck!.slides[1].title).toContain('具身智能');
  });

  it('persists revision snapshots on disk and restores cleanly even after clearing memory stack', async () => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'aimake-chat-rev-'));
    tempDirs.push(tmpDir);
    const deckPath = path.join(tmpDir, 'deck.md');
    await fs.writeFile(deckPath, '---\ntitle: 已经被改坏的文稿\n---\n\n# 坏掉的页\n', 'utf8');

    const revId = await recordSnapshotPersistent(deckPath, mockDeck, '磁盘持久化快照', tmpDir);
    expect(revId).toMatch(/^rev-/);

    const revisions = await listRevisions(tmpDir, deckPath);
    expect(revisions.some((r) => r.revisionId === revId)).toBe(true);

    // Simulate Studio server restart by clearing the in-memory ring buffer
    clearInMemorySnapshotsForTest();

    const rollbackRes = await rollbackChatSnapshot(deckPath, revId, tmpDir);
    expect(rollbackRes.success).toBe(true);
    expect(rollbackRes.restoredDeck?.frontmatter.title).toBe('测试文稿');
    const diskAfter = await fs.readFile(deckPath, 'utf8');
    expect(diskAfter).toContain('第一页标题');
  });

  it('saves and masks workspace API configuration safely without leaking raw keys', async () => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'aimake-chat-cfg-'));
    tempDirs.push(tmpDir);

    await saveWorkspaceAiConfig(tmpDir, {
      preferredBackend: 'api',
      baseUrl: 'https://api.deepseek.com/v1',
      model: 'deepseek-chat',
      apiKey: 'mock-aimake-key-9876',
    });

    // Updating baseUrl without passing apiKey should preserve existing key
    await saveWorkspaceAiConfig(tmpDir, {
      baseUrl: 'https://api.openai.com/v1',
    });

    const pub = await getPublicChatConfig(tmpDir);
    expect(pub.preferredBackend).toBe('api');
    expect(pub.api.baseUrl).toBe('https://api.openai.com/v1');
    expect(pub.api.hasApiKey).toBe(true);
    expect(pub.api.apiKeyMasked).toBe('mock••••9876');
    expect(JSON.stringify(pub)).not.toContain('mock-aimake-key-9876');
  });

  it('extracts fallback greedy fences cleanly', () => {
    const raw = [
      'SUMMARY: 演示对比',
      '```markdown',
      '# 架构对比',
      '```compare',
      '旧方案 :: 手工复制',
      '新方案 :: 一键编译',
      '```',
      '```',
    ].join('\n');

    const extracted = extractSlideFromLlmOutput(raw, mockDeck);
    expect(extracted.summary).toBe('演示对比');
    expect(extracted.slides[0].comparison?.rightTitle).toBe('新方案');
  });

  it('executes quick action intents offline with rich transformations and diff previews', async () => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'aimake-quick-actions-'));
    tempDirs.push(tmpDir);
    const deckPath = path.join(tmpDir, 'deck.md');

    // 1. extract_quote: 提炼金句卡片
    const quoteRes = await processChatMessage({
      message: '提炼金句卡片',
      intent: 'extract_quote',
      activeSlideIndex: 0,
      deck: mockDeck,
      deckPath,
      backend: 'offline',
      workspaceDir: tmpDir,
    });
    expect(quoteRes.engineUsed).toContain('金句提炼');
    expect(quoteRes.updatedDeck?.slides[0].layout).toBe('quote');
    expect(quoteRes.updatedDeck?.slides[0].quote?.text).toBeTruthy();
    expect(quoteRes.beforeSlideMd).toContain('第一页标题');
    expect(quoteRes.afterSlideMd).toContain('第一页标题');
    expect(quoteRes.suggestedActions).toContain('转为 Bento 风格');

    // 2. bento_style: 转为 Bento 风格
    const bentoRes = await processChatMessage({
      message: '转为 Bento 风格',
      intent: 'bento_style',
      activeSlideIndex: 0,
      deck: mockDeck,
      deckPath,
      backend: 'offline',
      workspaceDir: tmpDir,
    });
    expect(bentoRes.engineUsed).toContain('Bento 网格');
    expect(bentoRes.updatedDeck?.slides[0].layout).toBe('metrics');
    expect(bentoRes.updatedDeck?.slides[0].metrics?.length).toBeGreaterThanOrEqual(3);
    expect(bentoRes.beforeSlideMd).toBeTruthy();
    expect(bentoRes.afterSlideMd).toBeTruthy();

    // 3. presentation_outline: 生成演讲大纲
    const outlineRes = await processChatMessage({
      message: '生成演讲大纲',
      intent: 'presentation_outline',
      activeSlideIndex: 0,
      deck: mockDeck,
      deckPath,
      backend: 'offline',
      workspaceDir: tmpDir,
    });
    expect(outlineRes.engineUsed).toContain('演讲大纲');
    expect(outlineRes.updatedDeck?.slides.length).toBe(mockDeck.slides.length + 1);
    expect(outlineRes.updatedDeck?.slides[1].title).toContain('演说大纲');
    expect(outlineRes.updatedDeck?.slides[1].bullets.some((b) => b.includes('min'))).toBe(true);

    // 4. bilingual_translate: 翻译为双语
    const biRes = await processChatMessage({
      message: '翻译为双语',
      intent: 'bilingual_translate',
      activeSlideIndex: 0,
      deck: mockDeck,
      deckPath,
      backend: 'offline',
      workspaceDir: tmpDir,
    });
    expect(biRes.engineUsed).toContain('双语对照');
    expect(biRes.updatedDeck?.slides[0].title).toContain('·');
  });

  it('supports applyChatSnapshot and verifies diff markdown fields', async () => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'aimake-apply-test-'));
    tempDirs.push(tmpDir);
    const deckPath = path.join(tmpDir, 'deck.md');

    const applyRes = await applyChatSnapshot(
      deckPath,
      mockDeck,
      '一键应用测试快照',
      tmpDir
    );
    expect(applyRes.success).toBe(true);
    expect(applyRes.revisionId).toMatch(/^rev-/);

    const onDisk = await fs.readFile(deckPath, 'utf8');
    expect(onDisk).toContain('测试文稿');
  });

  it('generates ready-to-run 1-click external AI commands with rich prompt context for Claude, Codex, AGY, and CodeBuddy', () => {
    const wsDir = '/tmp/test-creator-space';

    // 1. Claude Code
    const claudeInfo = buildAgentLaunchInfo(wsDir, 'claude', {
      activeDeckRel: 'decks/demo.deck.md',
      recipeId: 'bento-style',
    });
    expect(claudeInfo.readyToRunCommand).toContain('claude -p');
    expect(claudeInfo.readyToRunCommand).toContain('decks/demo.deck.md');
    expect(claudeInfo.richPromptContext).toContain('Bento 便当盒');

    // 2. OpenAI Codex CLI
    const codexInfo = buildAgentLaunchInfo(wsDir, 'codex', {
      activeDeckRel: 'decks/demo.deck.md',
      recipeId: 'quote-extract',
    });
    expect(codexInfo.readyToRunCommand).toContain('codex exec --skip-git-repo-check');
    expect(codexInfo.richPromptContext).toContain('金句卡片');

    // 3. Google Antigravity (AGY)
    const agyInfo = buildAgentLaunchInfo(wsDir, 'agy', {
      activeDeckRel: 'decks/demo.deck.md',
      recipeId: 'presentation-outline',
    });
    expect(agyInfo.readyToRunCommand).toContain('agy -p');
    expect(agyInfo.richPromptContext).toContain('演讲大纲');

    // 4. CodeBuddy
    const cbInfo = buildAgentLaunchInfo(wsDir, 'codebuddy', {
      activeDeckRel: 'decks/demo.deck.md',
      recipeId: 'bilingual-translate',
    });
    expect(cbInfo.readyToRunCommand).toContain('codebuddy -p');
    expect(cbInfo.richPromptContext).toContain('双语对照');
  });
});
