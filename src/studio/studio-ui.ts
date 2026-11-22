import { CALM_STUDIO_CSS } from './calm-ui/styles.js';
import { CALM_STUDIO_MARKUP } from './calm-ui/markup.js';
import { CALM_STUDIO_SCRIPT } from './calm-ui/script.js';

const AIMAKE_FAVICON_DATA_URI =
  'data:image/svg+xml,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="8" fill="#101727"/><path d="M13 6 4 24 20 27Z" fill="#F4F8FF"/><path d="M14.5 5.65 21 4 28 25 21.4 26.65Z" fill="#60A5FA"/></svg>'
  );

export function buildStudioShellHtml(): string {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link rel="icon" type="image/svg+xml" href="${AIMAKE_FAVICON_DATA_URI}" />
  <title>Aimake — 端到端多模态创作工作台</title>
  <style>${CALM_STUDIO_CSS}</style>
</head>
<body>
${CALM_STUDIO_MARKUP}
<script>${CALM_STUDIO_SCRIPT}</script>
</body>
</html>`;
}
