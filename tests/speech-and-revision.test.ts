import { lstat, mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';
import type { DeckDocument } from '../src/schema/types.js';
import {
  AimakeError,
  approvePaidSpeechCall,
  buildDeckFromFacts,
  concatenatePcmWavBuffers,
  estimateDeckSpeechUsage,
  extractFactsFromReleaseOrMarkdown,
  offlineFixtureSpeechProvider,
  parsePcmWav,
  readDeckSpeechManifest,
  sha256Hex,
  splitTtsText,
  synthesizeDeckSpeech,
  TencentTccliSpeechProvider,
  verifyDeckFactCitations,
  wavDurationMs,
  type SpeechProvider,
  type SpeechRequest,
  type SpeechResult,
} from '../src/speech/index.js';
import {
  acquireRunLease,
  applyDraftRevisionToDeck,
  assessDeckRevisionImpact,
  createDeckDraftRevision,
  getRunLeaseStatus,
  readDeckDraftRevision,
  updateDeckDraftSlide,
  withRunLease,
} from '../src/revision/index.js';

const tempDirs: string[] = [];

async function makeTempDir(prefix: string): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), prefix));
  tempDirs.push(dir);
  return dir;
}

afterEach(async () => {
  while (tempDirs.length > 0) {
    const dir = tempDirs.pop()!;
    await rm(dir, { recursive: true, force: true });
  }
});

function createSampleDeck(): DeckDocument {
  return {
    frontmatter: {
      title: 'Aimake Local Release Briefing',
      template: 'ppt-executive-16x9',
      locale: 'en',
      aspect: '16:9',
      watermark: false,
      fps: 24,
      secondsPerSlide: 4,
      tags: ['release', 'local-first'],
    },
    slides: [
      {
        index: 0,
        id: 's1',
        layout: 'cover',
        title: 'Local-First Speech Pipeline',
        bullets: ['Deterministic WAV synthesis with SHA-256 receipts'],
        bodyParagraphs: [],
        metrics: [],
        speech: 'Welcome to the Aimake local speech pipeline release briefing.',
      },
      {
        index: 1,
        id: 's2',
        layout: 'bullets',
        title: 'Partial Slide Reuse',
        bullets: ['Unchanged slides copy verified audio without new provider calls'],
        bodyParagraphs: [],
        metrics: [],
        speech: 'When you edit one slide, unchanged slides reuse verified audio chunks.',
      },
      {
        index: 2,
        id: 's3',
        layout: 'outro',
        title: 'Ready to Ship',
        bullets: ['Review subtitles before publishing', 'Verify SHA-256 receipts'],
        bodyParagraphs: [],
        metrics: [],
        // Intentionally omit `speech` to verify title + bullets fallback
      },
    ],
  };
}

function createCountingPaidProvider(): {
  provider: SpeechProvider;
  calls: SpeechRequest[];
} {
  const fixture = offlineFixtureSpeechProvider();
  const calls: SpeechRequest[] = [];
  const provider: SpeechProvider = {
    providerId: 'tencent-tts',
    async synthesize(request: SpeechRequest): Promise<SpeechResult> {
      calls.push(request);
      const base = await fixture.synthesize(request);
      return {
        ...base,
        requestId: `tc-req-${calls.length}-${sha256Hex(request.text).slice(0, 12)}`,
      };
    },
  };
  return { provider, calls };
}

describe('splitTtsText', () => {
  it('splits long CJK and Latin narration cleanly at punctuation boundaries within code-point limits', () => {
    const cjkText =
      '这是第一句非常清晰的本地语音旁白测试，用来验证标点切分是否自然。第二句继续介绍确定性哈希校验与字幕同步机制，确保每一段都不超过腾讯云语音接口的字符上限！第三句展示增量复用能力，避免重复调用付费接口。';
    const cjkSegments = splitTtsText(cjkText, 40);
    expect(cjkSegments.length).toBeGreaterThanOrEqual(2);
    for (const seg of cjkSegments) {
      expect([...seg].length).toBeLessThanOrEqual(40);
    }
    expect(cjkSegments.join('')).toBe(cjkText);

    const emojiText = '🚀'.repeat(25) + '. ' + '✨'.repeat(25);
    const emojiSegments = splitTtsText(emojiText, 30);
    expect(emojiSegments).toHaveLength(2);
    expect([...emojiSegments[0]!].length).toBeLessThanOrEqual(30);
  });

  it('rejects empty text and out-of-range segment limits', () => {
    expect(() => splitTtsText('   \n\t  ')).toThrowError(AimakeError);
    try {
      splitTtsText('   ');
    } catch (err) {
      expect((err as AimakeError).code).toBe('TTS_TEXT_EMPTY');
    }

    expect(() => splitTtsText('hello', 0)).toThrowError(AimakeError);
    expect(() => splitTtsText('hello', 151)).toThrowError(AimakeError);
  });
});

describe('TencentTccliSpeechProvider', () => {
  it('writes 0o600 temp JSON input, keeps narration out of argv, and cleans up temp dir on success and failure', async () => {
    const fixture = offlineFixtureSpeechProvider();
    const secretNarration = 'Confidential narration text must NEVER appear in argv!';
    const sampleWav = (
      await fixture.synthesize({
        text: secretNarration,
        sessionId: 'sess-1',
        voiceType: 1001,
        primaryLanguage: 2,
        sampleRate: 16000,
        codec: 'wav',
        enableSubtitles: true,
      })
    ).audio;

    let observedInputPath = '';
    let observedMode = 0;
    let observedPayload: Record<string, unknown> | undefined;
    let observedArgs: string[] = [];

    const provider = new TencentTccliSpeechProvider({
      region: 'ap-shanghai',
      runner: async (args) => {
        observedArgs = [...args];
        const urlArgIndex = args.indexOf('--cli-input-json');
        expect(urlArgIndex).toBeGreaterThan(-1);
        const fileUrl = args[urlArgIndex + 1]!;
        expect(fileUrl.startsWith('file://')).toBe(true);
        observedInputPath = fileURLToPath(fileUrl);

        const fileStats = await stat(observedInputPath);
        observedMode = fileStats.mode & 0o777;
        observedPayload = JSON.parse(await readFile(observedInputPath, 'utf8')) as Record<
          string,
          unknown
        >;

        return {
          status: 0,
          stderr: '',
          stdout: JSON.stringify({
            Response: {
              Audio: Buffer.from(sampleWav).toString('base64'),
              SessionId: 'sess-1',
              RequestId: 'req-tc-001',
              Subtitles: [
                {
                  Text: secretNarration,
                  BeginTime: 0,
                  EndTime: 1200,
                  BeginIndex: 0,
                  EndIndex: secretNarration.length,
                },
              ],
            },
          }),
        };
      },
    });

    const result = await provider.synthesize({
      text: secretNarration,
      sessionId: 'sess-1',
      voiceType: 1001,
      primaryLanguage: 2,
      sampleRate: 16000,
      codec: 'wav',
      enableSubtitles: true,
    });

    // Zero narration in argv
    expect(observedArgs.join(' ')).not.toContain(secretNarration);
    expect(observedArgs.join(' ')).not.toContain('Confidential');
    expect(observedArgs).toContain('--region');
    expect(observedArgs).toContain('ap-shanghai');

    // Strict 0o600 permissions on temp request file
    expect(observedMode).toBe(0o600);
    expect(observedPayload?.Text).toBe(secretNarration);
    expect(observedPayload?.SessionId).toBe('sess-1');
    expect(observedPayload?.EnableSubtitle).toBe(true);

    // Valid decoded response
    expect(result.requestId).toBe('req-tc-001');
    expect(result.sessionId).toBe('sess-1');
    expect(result.subtitles).toHaveLength(1);
    expect(wavDurationMs(result.audio)).toBeGreaterThan(0);

    // Temp file and parent temp directory removed after synthesis
    await expect(lstat(observedInputPath)).rejects.toMatchObject({ code: 'ENOENT' });
    await expect(lstat(dirname(observedInputPath))).rejects.toMatchObject({ code: 'ENOENT' });

    // Also verify cleanup when runner fails
    let failedInputPath = '';
    const failingProvider = new TencentTccliSpeechProvider({
      runner: async (args) => {
        failedInputPath = fileURLToPath(args[args.indexOf('--cli-input-json') + 1]!);
        return { status: 1, stdout: '', stderr: 'AuthFailure.SignatureFailure' };
      },
    });

    await expect(
      failingProvider.synthesize({
        text: 'Failure cleanup test',
        sessionId: 'sess-fail',
        voiceType: 1001,
        primaryLanguage: 2,
        sampleRate: 16000,
        codec: 'wav',
        enableSubtitles: true,
      })
    ).rejects.toMatchObject({ code: 'PROVIDER_CALL_FAILED' });

    await expect(lstat(failedInputPath)).rejects.toMatchObject({ code: 'ENOENT' });
    await expect(lstat(dirname(failedInputPath))).rejects.toMatchObject({ code: 'ENOENT' });
  });
});

describe('offlineFixtureSpeechProvider & synthesizeDeckSpeech', () => {
  it('produces RIFF WAV, deterministic SHA-256, stitched SRT, slideDurationsMs, and verifies manifest integrity', async () => {
    const deck = createSampleDeck();
    const runDir1 = await makeTempDir('aimake-speech-offline-1-');
    const runDir2 = await makeTempDir('aimake-speech-offline-2-');

    const res1 = await synthesizeDeckSpeech(deck, runDir1, {
      provider: offlineFixtureSpeechProvider(),
      runId: 'offline-run',
    });

    expect(res1.providerCalls).toBe(3);
    expect(res1.synthesizedSlideIds).toEqual(['s1', 's2', 's3']);
    expect(res1.reusedSlideIds).toEqual([]);

    const wavBytes = await readFile(res1.audioPath);
    expect(wavBytes.toString('ascii', 0, 4)).toBe('RIFF');
    expect(wavBytes.toString('ascii', 8, 12)).toBe('WAVE');
    const parsedWav = parsePcmWav(wavBytes);
    expect(parsedWav.sampleRate).toBe(16000);
    expect(parsedWav.durationMs).toBe(res1.totalDurationMs);

    const summedDurations = Object.values(res1.slideDurationsMs).reduce((a, b) => a + b, 0);
    expect(summedDurations).toBe(res1.totalDurationMs);
    expect(Object.keys(res1.slideDurationsMs)).toEqual(['s1', 's2', 's3']);

    // Verify stitched SRT covers all 3 slides including title+bullets fallback on s3
    const srt = await readFile(res1.srtPath, 'utf8');
    expect(srt).toContain('-->');
    expect(srt).toContain('Welcome to the Aimake local speech');
    expect(srt).toContain('Ready to Ship');

    // Verify manifest & AI disclosure
    const manifest = await readDeckSpeechManifest(runDir1);
    expect(manifest.aiDisclosure.visibleLabel).toBe('AI-GENERATED DRAFT');
    expect(manifest.aiDisclosure.exportPolicy).toBe('human-review-required');
    expect(manifest.aiDisclosure.syntheticSpeech).toBe(true);
    expect(manifest.chunks).toHaveLength(3);

    // Deterministic SHA-256 across independent fresh runs
    const res2 = await synthesizeDeckSpeech(deck, runDir2, {
      provider: offlineFixtureSpeechProvider(),
      runId: 'offline-run',
    });
    expect(res2.manifest.audioSha256).toBe(res1.manifest.audioSha256);
    expect(res2.manifest.srtSha256).toBe(res1.manifest.srtSha256);

    // Same-run cache hit: 0 provider calls on re-invocation
    const cached = await synthesizeDeckSpeech(deck, runDir1, {
      provider: offlineFixtureSpeechProvider(),
      runId: 'offline-run',
    });
    expect(cached.providerCalls).toBe(0);
    expect(cached.reusedSlideIds).toEqual(['s1', 's2', 's3']);
    expect(cached.synthesizedSlideIds).toEqual([]);

    // concatenatePcmWavBuffers helper check
    const stitchedBuf = concatenatePcmWavBuffers([wavBytes, wavBytes]);
    expect(wavDurationMs(stitchedBuf)).toBe(res1.totalDurationMs * 2);

    // Tamper detection on chunk WAV
    const firstChunkPath = join(runDir1, manifest.chunks[0]!.audioPath);
    const corrupted = Buffer.from(await readFile(firstChunkPath));
    corrupted[corrupted.length - 1] = corrupted[corrupted.length - 1]! ^ 0xff;
    await writeFile(firstChunkPath, corrupted);
    await expect(readDeckSpeechManifest(runDir1)).rejects.toMatchObject({
      code: 'SPEECH_ARTIFACT_INTEGRITY_FAILED',
    });
  });

  it('enforces PAID_APPROVAL_REQUIRED and achieves providerCalls === 1 on partial-slide reuse after editing 1 of 3 slides', async () => {
    const deck = createSampleDeck();
    const run1Dir = await makeTempDir('aimake-paid-run1-');
    const run2Dir = await makeTempDir('aimake-paid-run2-');
    const { provider, calls } = createCountingPaidProvider();

    // 1. Unapproved paid run MUST fail closed with PAID_APPROVAL_REQUIRED and 0 provider calls
    await expect(
      synthesizeDeckSpeech(deck, run1Dir, { provider, runId: 'run-base' })
    ).rejects.toMatchObject({ code: 'PAID_APPROVAL_REQUIRED' });
    expect(calls).toHaveLength(0);

    // 2. Approve full estimate and run base synthesis (3 slides -> 3 provider calls)
    const baseEstimate = estimateDeckSpeechUsage(deck, { providerId: 'tencent-tts' });
    await approvePaidSpeechCall(run1Dir, baseEstimate, { runId: 'run-base' });

    const run1 = await synthesizeDeckSpeech(deck, run1Dir, {
      provider,
      runId: 'run-base',
    });
    expect(run1.providerCalls).toBe(3);
    expect(run1.synthesizedSlideIds).toEqual(['s1', 's2', 's3']);
    expect(run1.reusedSlideIds).toEqual([]);
    expect(calls).toHaveLength(3);

    // 3. Edit 1 of 3 slides (s2)
    const editedDeck: DeckDocument = {
      ...deck,
      slides: deck.slides.map((slide) =>
        slide.id === 's2'
          ? {
              ...slide,
              speech: 'Edited slide two narration triggers only a single incremental TTS call.',
            }
          : slide
      ),
    };

    // 4. Attempting incremental paid run without approval still throws PAID_APPROVAL_REQUIRED
    await expect(
      synthesizeDeckSpeech(editedDeck, run2Dir, {
        provider,
        runId: 'run-rev',
        reuseFromRunDir: run1Dir,
      })
    ).rejects.toMatchObject({ code: 'PAID_APPROVAL_REQUIRED' });
    expect(calls).toHaveLength(3);

    // 5. Approve scoped estimate for ONLY the 1 changed slide ('s2')
    const partialEstimate = estimateDeckSpeechUsage(editedDeck, {
      providerId: 'tencent-tts',
      includedSlideIds: ['s2'],
    });
    expect(partialEstimate.slideCount).toBe(1);
    expect(partialEstimate.requestCount).toBe(1);
    await approvePaidSpeechCall(run2Dir, partialEstimate, { runId: 'run-rev' });

    // 6. Synthesize with reuseFromRunDir -> ONLY 1 provider call!
    const run2 = await synthesizeDeckSpeech(editedDeck, run2Dir, {
      provider,
      runId: 'run-rev',
      reuseFromRunDir: run1Dir,
    });
    expect(run2.providerCalls).toBe(1);
    expect(calls).toHaveLength(4);
    expect(run2.reusedSlideIds).toEqual(['s1', 's3']);
    expect(run2.synthesizedSlideIds).toEqual(['s2']);

    // Verify reused chunks carry provenance metadata and unchanged SHA-256
    const manifest2 = await readDeckSpeechManifest(run2Dir);
    const s1Chunk = manifest2.chunks.find((c) => c.slideId === 's1')!;
    const s2Chunk = manifest2.chunks.find((c) => c.slideId === 's2')!;
    const s3Chunk = manifest2.chunks.find((c) => c.slideId === 's3')!;

    expect(s1Chunk.provenance?.kind).toBe('reused');
    expect(s1Chunk.provenance?.fromRunId).toBe('run-base');
    expect(s1Chunk.audioSha256).toBe(run1.manifest.chunks[0]!.audioSha256);

    expect(s2Chunk.provenance).toBeUndefined();
    expect(s2Chunk.audioSha256).not.toBe(run1.manifest.chunks[1]!.audioSha256);

    expect(s3Chunk.provenance?.kind).toBe('reused');
    expect(s3Chunk.audioSha256).toBe(run1.manifest.chunks[2]!.audioSha256);
  });
});

describe('extractFactsFromReleaseOrMarkdown & buildDeckFromFacts', () => {
  it('extracts facts from GitHub Release JSON and compiles a deterministic deck with verified citations', () => {
    const releaseJson = JSON.stringify({
      tagName: 'v2.1.0',
      name: 'Aimake v2.1.0 — Speech & Revisions',
      body: [
        '## What Changed',
        '- Added SHA-256 verified partial-slide TTS caching and reuse.',
        '- Added optimistic CAS Draft Revision persistence with O_EXCL run leases.',
        '- Added deterministic traceable fact extraction for GitHub Releases.',
      ].join('\n'),
    });

    const facts = extractFactsFromReleaseOrMarkdown(releaseJson, 'release.json');
    expect(facts.sourceFormat).toBe('github-release-json');
    expect(facts.version).toBe('v2.1.0');
    expect(facts.title).toBe('Aimake v2.1.0 — Speech & Revisions');
    expect(facts.facts.filter((f) => f.kind === 'version')).toHaveLength(1);
    expect(facts.facts.filter((f) => f.kind === 'title')).toHaveLength(1);
    expect(facts.facts.filter((f) => f.kind === 'highlight')).toHaveLength(3);
    expect(facts.facts[0]).toMatchObject({
      factId: 'fact:version',
      kind: 'version',
      pointer: '$.tagName',
    });

    const deckA = buildDeckFromFacts(facts);
    const deckB = buildDeckFromFacts(facts);
    expect(deckA).toEqual(deckB);
    expect(deckA.slides).toHaveLength(5); // cover + 3 highlights + outro

    for (const slide of deckA.slides) {
      expect(slide.cite).toBeDefined();
      expect(slide.cite).toMatch(/^fact:[a-z0-9:_-]+@/);
      expect(slide.speech && slide.speech.length > 0).toBe(true);
    }

    const verification = verifyDeckFactCitations(deckA, facts);
    expect(verification).toEqual({ valid: true, missingCitations: [] });
  });

  it('extracts facts from Markdown release notes and rejects highlight-less input', () => {
    const md = [
      '# Aimake 2.2 发布说明 v2.2.0',
      '',
      '- 本地语音合成支持单页增量复用，降低重复调用成本。',
      '- 新增草稿乐观锁校验，防止多会话并发覆盖。',
    ].join('\n');

    const facts = extractFactsFromReleaseOrMarkdown(md, 'CHANGELOG.md');
    expect(facts.sourceFormat).toBe('markdown');
    expect(facts.version).toBe('v2.2.0');
    expect(facts.facts.filter((f) => f.kind === 'highlight')).toHaveLength(2);

    const deck = buildDeckFromFacts(facts);
    expect(deck.frontmatter.locale).toBe('zh-CN');
    expect(verifyDeckFactCitations(deck, facts).valid).toBe(true);

    expect(() =>
      extractFactsFromReleaseOrMarkdown('# Empty Release\n\nHi.', 'empty.md')
    ).toThrowError(AimakeError);
    try {
      extractFactsFromReleaseOrMarkdown('# Empty Release\n\nHi.', 'empty.md');
    } catch (err) {
      expect((err as AimakeError).code).toBe('FACTS_INSUFFICIENT');
    }
  });
});

describe('acquireRunLease & withRunLease', () => {
  it('enforces O_EXCL 0o600 locking, rejects concurrent callers with RUN_BUSY, and recovers stale dead-PID leases', async () => {
    const workspace = await makeTempDir('aimake-lease-');
    const t0 = new Date('2026-06-01T10:00:00.000Z');

    // 1. Active lease blocks concurrent caller with RUN_BUSY and has 0o600 permissions
    const result = await withRunLease(
      workspace,
      'run-001',
      async (lease) => {
        const lockFile = join(workspace, 'runs', 'run-001', 'execution.lock');
        const lockStat = await stat(lockFile);
        expect(lockStat.mode & 0o777).toBe(0o600);
        expect(lease.record.runId).toBe('run-001');

        const status = await getRunLeaseStatus(workspace, 'run-001', t0);
        expect(status.state).toBe('active');

        await expect(
          acquireRunLease(workspace, 'run-001', { now: () => t0 })
        ).rejects.toMatchObject({ code: 'RUN_BUSY' });

        await lease.heartbeat();
        return 'ok';
      },
      { now: () => t0, staleAfterMs: 2_000 }
    );
    expect(result).toBe('ok');

    // Released after withRunLease completes
    expect((await getRunLeaseStatus(workspace, 'run-001', t0)).state).toBe('idle');

    // 2. Simulate crashed holder (never releases its lease)
    const crashedLease = await acquireRunLease(workspace, 'run-stale', {
      pid: 999_991,
      staleAfterMs: 2_000,
      now: () => t0,
    });
    expect(crashedLease.record.pid).toBe(999_991);

    const tAfterStale = new Date(t0.getTime() + 5_000);
    expect((await getRunLeaseStatus(workspace, 'run-stale', tAfterStale)).state).toBe('stale');

    // 2a. Stale timestamp BUT live PID -> MUST still throw RUN_BUSY
    await expect(
      acquireRunLease(workspace, 'run-stale', {
        now: () => tAfterStale,
        isProcessAlive: () => true,
      })
    ).rejects.toMatchObject({ code: 'RUN_BUSY' });

    // 2b. Stale timestamp AND dead PID -> recovers cleanly!
    const recovered = await withRunLease(
      workspace,
      'run-stale',
      async (lease) => {
        expect(lease.record.pid).toBe(process.pid);
        return 'recovered';
      },
      {
        now: () => tAfterStale,
        isProcessAlive: () => false,
      }
    );
    expect(recovered).toBe('recovered');
    expect((await getRunLeaseStatus(workspace, 'run-stale', tAfterStale)).state).toBe('idle');
  });
});

describe('DeckDraftRevision (CAS, atomic 0o600 persistence, impact assessment)', () => {
  it('supports createDeckDraftRevision, optimistic CAS updateDeckDraftSlide with REVISION_STALE, and assessDeckRevisionImpact', async () => {
    const workspace = await makeTempDir('aimake-revision-');
    const deck = createSampleDeck();
    const baseRunId = 'run-draft-001';

    const v1 = await createDeckDraftRevision(workspace, baseRunId, deck, {
      now: new Date('2026-06-01T12:00:00.000Z'),
    });
    expect(v1.version).toBe(1);
    expect(v1.slides).toHaveLength(3);

    const draftFile = join(workspace, 'revisions', baseRunId, 'draft.json');
    expect((await stat(draftFile)).mode & 0o777).toBe(0o600);

    // Impact before any edits
    const initialImpact = assessDeckRevisionImpact(v1);
    expect(initialImpact.changedSlideIds).toEqual([]);
    expect(initialImpact.reusedSlideIds).toEqual(['s1', 's2', 's3']);
    expect(initialImpact.characterDelta).toBe(0);
    expect(initialImpact.requiresPaidProviderCall).toBe(false);

    // Valid CAS update on s2
    const newNarration = 'Updated slide two narration with concise phrasing.';
    const v2 = await updateDeckDraftSlide(
      workspace,
      baseRunId,
      {
        expectedRevisionHash: v1.revisionHash,
        slideId: 's2',
        narration: newNarration,
      },
      { now: new Date('2026-06-01T12:05:00.000Z') }
    );
    expect(v2.version).toBe(2);
    expect(v2.revisionHash).not.toBe(v1.revisionHash);
    expect((await stat(draftFile)).mode & 0o777).toBe(0o600);

    // Persisted revision matches v2
    const loaded = await readDeckDraftRevision(workspace, baseRunId);
    expect(loaded).toEqual(v2);

    // Stale CAS update using v1 hash MUST throw REVISION_STALE
    await expect(
      updateDeckDraftSlide(workspace, baseRunId, {
        expectedRevisionHash: v1.revisionHash,
        slideId: 's2',
        narration: 'Concurrent conflicting edit',
      })
    ).rejects.toMatchObject({ code: 'REVISION_STALE' });

    // Assess revision impact
    const impact = assessDeckRevisionImpact(v2);
    expect(impact.changedSlideIds).toEqual(['s2']);
    expect(impact.reusedSlideIds).toEqual(['s1', 's3']);
    expect(impact.requiresPaidProviderCall).toBe(true);
    expect(impact.characterDelta).toBe(
      [...newNarration].length - [...v1.slides[1]!.baseNarration].length
    );

    // Plug revised draft directly into DeckDocument -> synthesizeDeckSpeech partial reuse
    const patchedDeck = applyDraftRevisionToDeck(deck, v2);
    expect(patchedDeck.slides[1]!.speech).toBe(newNarration);
    expect(patchedDeck.slides[0]!.speech).toBe(deck.slides[0]!.speech);
  });
});
