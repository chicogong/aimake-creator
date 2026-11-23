import fs from 'node:fs/promises';
import path from 'node:path';
import { adaptContentForPlatforms } from './markdown-adapter.js';
import { attemptBrowserPublish } from './browser-publisher.js';
import type {
  PlatformPublishResult,
  PublishOptions,
  PublishPlatform,
  PublishSummary,
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

  const targets: PublishPlatform[] = options.targets && options.targets.length > 0 && !options.targets.includes('all')
    ? options.targets
    : ['wechat', 'zhihu', 'juejin', 'xiaohongshu', 'pack'];

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

  // Generate README in bundle
  const readmeContent = [
    `# ${title} — Multi-Platform Publication Kit`,
    '',
    `*Generated on: ${now.toISOString()} via [Aimake.cc](https://aimake.cc)*`,
    '',
    '## 📦 Generated Artifacts',
    '',
    '- **微信公众号 (WeChat)**: `wechat.html` (100% inline-styled CSS, copy and paste into WeChat Official Account editor)',
    '- **知乎专栏 (Zhihu)**: `zhihu.md` (clean markdown with LaTeX formula support and topic suggestions)',
    '- **稀土掘金 (Juejin)**: `juejin.md` (Bytemd frontmatter, categories, and tags included)',
    '- **小红书 (Xiaohongshu)**: `xiaohongshu.txt` (high-engagement bullet summary with emojis and hashtags)',
    '- **跨平台同步清单**: `manifest.json` (compatible with Wechatsync / OpenWrite / PostBot)',
    '',
    '## 🚀 Fast Publishing Instructions',
    '',
    '### 1. 微信公众号',
    '打开 `wechat.html`，在浏览器中打开全选复制，或直接粘贴入微信后台富文本编辑器中，排版即可直接生效。',
    '',
    '### 2. 知乎专栏',
    '打开 [https://zhuanlan.zhihu.com/write](https://zhuanlan.zhihu.com/write)，复制 `zhihu.md` 内容直接粘贴。',
    '',
    '### 3. 稀土掘金',
    '打开 [https://juejin.cn/editor/drafts/new](https://juejin.cn/editor/drafts/new)，将 `juejin.md` 内容粘贴至编辑器，标签已自动配置。',
    '',
    '### 4. 自动化分发 (Wechatsync / CLI)',
    '```bash',
    `aimake publish "${path.relative(process.cwd(), absSource)}" --browser`,
    '```',
  ].join('\n');

  await fs.writeFile(path.join(baseOutDir, 'README.md'), readmeContent, 'utf-8');

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
