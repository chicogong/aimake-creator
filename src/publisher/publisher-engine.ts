import fs from 'node:fs/promises';
import path from 'node:path';
import { adaptContentForPlatforms } from './markdown-adapter.js';
import { attemptBrowserPublish } from './browser-publisher.js';
import {
  VALID_PUBLISH_PLATFORMS,
  type PlatformPublishResult,
  type PublishOptions,
  type PublishPlatform,
  type PublishSummary,
} from './types.js';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\u4e00-\u9fa5]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || 'article';
}

/**
 * Appends a compounding record to wiki/published.md if the workspace or wiki vault exists.
 */
async function compoundToPublishedLog(
  workspaceDir: string,
  summary: PublishSummary
): Promise<void> {
  const possiblePaths = [
    path.join(workspaceDir, 'wiki', 'published.md'),
    path.join(workspaceDir, 'published.md'),
  ];

  for (const pubPath of possiblePaths) {
    try {
      const dir = path.dirname(pubPath);
      await fs.mkdir(dir, { recursive: true });

      const entry = [
        `\n## ${summary.timestamp.slice(0, 10)} · ${summary.title}`,
        `- **Timestamp**: \`${summary.timestamp}\``,
        `- **Source**: \`${summary.sourceFile}\``,
        `- **Bundle**: \`${summary.bundleDir || 'N/A'}\``,
        `- **Channels**: ${summary.results.map((r) => `\`${r.platform}\` (${r.status})`).join(', ')}`,
        '',
      ].join('\n');

      let current = '';
      try {
        current = await fs.readFile(pubPath, 'utf-8');
      } catch {
        current = '# Published Deliverables Log\n\nCompounding record of published articles, decks, and multi-channel deliverables.\n';
      }

      await fs.writeFile(pubPath, current + entry, 'utf-8');
      break;
    } catch {
      // Continue silently if workspace has no wiki
    }
  }
}

/**
 * Orchestrates multi-platform article/deck packaging and publishing.
 */
export async function publishContent(
  sourceFile: string,
  options: PublishOptions = {}
): Promise<PublishSummary> {
  // Validate targets before creating any directories or touching disk
  const rawTargets = options.targets && options.targets.length > 0 ? options.targets : ['all'];
  const unsupportedTargets: string[] = [];

  for (const t of rawTargets) {
    if (t !== 'all' && !VALID_PUBLISH_PLATFORMS.includes(t as any)) {
      unsupportedTargets.push(String(t));
    }
  }

  if (unsupportedTargets.length > 0) {
    const errorMsg = `Unsupported publish target(s): ${unsupportedTargets.map((t) => `"${t}"`).join(', ')}. Supported targets: ${VALID_PUBLISH_PLATFORMS.join(', ')} (or 'all').`;
    const err = new Error(errorMsg) as any;
    err.code = 'INVALID_ARGUMENTS';
    err.exitCode = 2;
    throw err;
  }

  const targets: PublishPlatform[] = rawTargets.includes('all')
    ? [...VALID_PUBLISH_PLATFORMS]
    : (rawTargets as PublishPlatform[]);

  const absSource = path.resolve(process.cwd(), sourceFile);
  const rawContent = await fs.readFile(absSource, 'utf-8');

  const adapted = adaptContentForPlatforms(rawContent, absSource, options);
  const title = adapted.all.title;
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10);
  const timeSlug = `${dateStr}-${slugify(title)}`;

  // Determine output directory
  const baseOutDir = options.outDir
    ? path.resolve(process.cwd(), options.outDir)
    : path.resolve(process.cwd(), 'exports', 'publish', timeSlug);

  await fs.mkdir(baseOutDir, { recursive: true });

  const results: PlatformPublishResult[] = [];

  // Write adapted files to bundle directory
  for (const t of targets) {
    const item = adapted[t];
    if (!item) continue;

    const targetFilePath = path.join(baseOutDir, item.fileName);
    await fs.writeFile(targetFilePath, item.content, 'utf-8');

    let browserResult: PlatformPublishResult | null = null;
    if (options.browser && (t === 'zhihu' || t === 'juejin' || t === 'wechat')) {
      browserResult = await attemptBrowserPublish(t, title, item.content, options);
    }

    results.push(
      browserResult || {
        platform: t,
        status: 'packaged',
        filePath: targetFilePath,
        wordCount: item.wordCount,
        message: `Generated ready-to-publish ${item.fileName}`,
      }
    );
  }

  // Generate README in bundle describing only generated artifacts
  const artifactDescriptions: Record<string, string> = {
    wechat: '- **微信公众号 (WeChat)**: `wechat.html` (100% inline-styled CSS, copy and paste into WeChat Official Account editor)',
    zhihu: '- **知乎专栏 (Zhihu)**: `zhihu.md` (clean markdown with LaTeX formula support and topic suggestions)',
    juejin: '- **稀土掘金 (Juejin)**: `juejin.md` (Bytemd frontmatter, categories, and tags included)',
    xiaohongshu: '- **小红书 (Xiaohongshu)**: `xiaohongshu.txt` (high-engagement bullet summary with emojis and hashtags)',
    pack: '- **跨平台同步清单**: `manifest.json` (compatible with Wechatsync / OpenWrite / PostBot)',
  };

  const channelInstructions: Record<string, string[]> = {
    wechat: [
      '### 1. 微信公众号',
      '打开 `wechat.html`，在浏览器中打开全选复制，或直接粘贴入微信后台富文本编辑器中，排版即可直接生效。',
      '',
    ],
    zhihu: [
      '### 2. 知乎专栏',
      '打开 [https://zhuanlan.zhihu.com/write](https://zhuanlan.zhihu.com/write)，复制 `zhihu.md` 内容直接粘贴。',
      '',
    ],
    juejin: [
      '### 3. 稀土掘金',
      '打开 [https://juejin.cn/editor/drafts/new](https://juejin.cn/editor/drafts/new)，将 `juejin.md` 内容粘贴至编辑器，标签已自动配置。',
      '',
    ],
    xiaohongshu: [
      '### 4. 小红书',
      '复制 `xiaohongshu.txt` 内容发布至小红书创作者服务平台。',
      '',
    ],
    pack: [
      '### 5. 跨平台分发清单',
      '使用 `manifest.json` 配合多平台同步插件或自动化分发工具进行一键同步。',
      '',
    ],
  };

  const activeArtifactLines = results
    .map((r) => artifactDescriptions[r.platform])
    .filter(Boolean);

  const activeInstructionBlocks: string[] = [];
  let stepIndex = 1;
  for (const r of results) {
    const rawLines = channelInstructions[r.platform];
    if (rawLines && rawLines.length > 0) {
      const renumbered = rawLines.map((line, idx) =>
        idx === 0 ? line.replace(/^### \d+\.\s*/, `### ${stepIndex}. `) : line
      );
      activeInstructionBlocks.push(...renumbered);
      stepIndex++;
    }
  }

  const readmeLines = [
    `# ${title} — Multi-Platform Publication Kit`,
    '',
    `*Generated on: ${now.toISOString()} via [Aimake.cc](https://aimake.cc)*`,
    '',
    '## 📦 Generated Artifacts',
    '',
    ...activeArtifactLines,
    '',
  ];

  if (activeInstructionBlocks.length > 0) {
    readmeLines.push(
      '## 🚀 Fast Publishing Instructions',
      '',
      ...activeInstructionBlocks
    );
  }

  readmeLines.push(
    '### 自动化分发 (Wechatsync / CLI)',
    '```bash',
    `aimake publish "${path.relative(process.cwd(), absSource)}" --browser`,
    '```'
  );

  await fs.writeFile(path.join(baseOutDir, 'README.md'), readmeLines.join('\n'), 'utf-8');

  const summary: PublishSummary = {
    sourceFile: path.relative(process.cwd(), absSource),
    title,
    bundleDir: path.relative(process.cwd(), baseOutDir),
    timestamp: now.toISOString(),
    results,
  };

  // Log to compounding wiki if available
  const workspaceRoot = options.workspaceDir || process.cwd();
  await compoundToPublishedLog(workspaceRoot, summary);

  return summary;
}
