import fs from 'node:fs';
import { chromium, defineConfig } from '@playwright/test';

const hasBundledChromium = (() => {
  try {
    return fs.existsSync(chromium.executablePath());
  } catch {
    return false;
  }
})();

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 90_000,
  fullyParallel: false,
  workers: 1,
  use: {
    headless: true,
    ...(hasBundledChromium ? {} : { channel: 'chrome' }),
  },
});
