import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/cli.ts', 'src/index.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
  platform: 'node',
  target: 'node18',
  banner: {
    js: `import { createRequire as __createRequire } from 'node:module'; const require = __createRequire(import.meta.url);`,
  },
  noExternal: [
    '@clack/prompts',
    'commander',
    'fast-glob',
    'gray-matter',
    'highlight.js',
    'marked',
    'picocolors',
    'pptxgenjs',
    'yaml',
  ],
});
