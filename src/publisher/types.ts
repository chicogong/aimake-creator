export const VALID_PUBLISH_PLATFORMS = ['wechat', 'zhihu', 'juejin', 'xiaohongshu', 'pack'] as const;
export type PublishPlatform = typeof VALID_PUBLISH_PLATFORMS[number] | 'all';

export interface PublishOptions {
  targets?: PublishPlatform[];
  draft?: boolean;
  browser?: boolean;
  chromePort?: number;
  outDir?: string;
  tags?: string[];
  category?: string;
  topics?: string[];
  author?: string;
  coverImage?: string;
  workspaceDir?: string;
  asJson?: boolean;
}

export interface PlatformPublishResult {
  platform: PublishPlatform;
  status: 'published' | 'draft_saved' | 'packaged' | 'skipped' | 'failed';
  url?: string;
  filePath?: string;
  wordCount?: number;
  message?: string;
  error?: string;
}

export interface PlatformFormattedContent {
  platform: PublishPlatform;
  title: string;
  content: string;
  format: 'html' | 'markdown' | 'text';
  wordCount: number;
  fileName: string;
  metadata?: Record<string, unknown>;
}

export interface PublishSummary {
  sourceFile: string;
  title: string;
  bundleDir?: string;
  timestamp: string;
  results: PlatformPublishResult[];
}
