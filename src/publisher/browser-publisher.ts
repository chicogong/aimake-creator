import http from 'node:http';
import type { PlatformPublishResult, PublishOptions } from './types.js';

/**
 * Checks if a local Chromium-based browser with remote debugging is accessible.
 */
export async function checkLocalChromeDebugPort(port = 9222): Promise<boolean> {
  return new Promise((resolve) => {
    const req = http.get(`http://127.0.0.1:${port}/json/version`, { timeout: 1200 }, (res) => {
      if (res.statusCode === 200) {
        resolve(true);
      } else {
        resolve(false);
      }
    });
    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
  });
}

/**
 * Attempts automated publishing/draft-saving via local CDP session if available.
 */
export async function attemptBrowserPublish(
  platform: 'zhihu' | 'juejin',
  title: string,
  content: string,
  options: PublishOptions = {}
): Promise<PlatformPublishResult> {
  const port = options.chromePort || 9222;
  const isDebugAvailable = await checkLocalChromeDebugPort(port);

  if (!isDebugAvailable) {
    return {
      platform,
      status: 'packaged',
      message: `Local Chrome debug port ${port} not active. Package generated for manual or extension-based publishing.`,
    };
  }

  // Attempt dynamic import of Playwright to connect over CDP
  try {
    const { chromium } = await import('playwright');
    const browser = await chromium.connectOverCDP(`http://127.0.0.1:${port}`);
    const contexts = browser.contexts();
    const context = contexts[0] || (await browser.newContext());

    if (platform === 'juejin') {
      const page = await context.newPage();
      await page.goto('https://juejin.cn/editor/drafts/new', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1500);

      // Set Title
      const titleInput = await page.$('input.title-input, textarea.title-input, input[placeholder*="输入文章标题"]');
      if (titleInput) {
        await titleInput.fill(title);
      }

      // Inject Markdown Content via CodeMirror if available
      await page.evaluate((text) => {
        const cmEl = document.querySelector('.CodeMirror') as any;
        if (cmEl && cmEl.CodeMirror) {
          cmEl.CodeMirror.setValue(text);
        } else {
          const textarea = document.querySelector('textarea');
          if (textarea) textarea.value = text;
        }
      }, content);

      const url = page.url();
      return {
        platform: 'juejin',
        status: 'draft_saved',
        url,
        message: 'Draft populated successfully in local Chrome session.',
      };
    } else if (platform === 'zhihu') {
      const page = await context.newPage();
      await page.goto('https://zhuanlan.zhihu.com/write', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1500);

      // Set Title
      const titleInput = await page.$('textarea.WriteIndex-titleInput, textarea[placeholder*="标题"]');
      if (titleInput) {
        await titleInput.fill(title);
      }

      const url = page.url();
      return {
        platform: 'zhihu',
        status: 'draft_saved',
        url,
        message: 'Draft page opened and title populated in local Chrome session.',
      };
    }
  } catch (err: any) {
    return {
      platform,
      status: 'packaged',
      message: `Browser automation fallback: ${err?.message || 'unknown error'}. Local formatted files ready.`,
    };
  }

  return {
    platform,
    status: 'packaged',
    message: 'Local formatted files ready in output bundle.',
  };
}
