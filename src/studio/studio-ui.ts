import { CALM_STUDIO_CSS } from './calm-ui/styles.js';
import { CALM_STUDIO_MARKUP } from './calm-ui/markup.js';
import { CALM_STUDIO_SCRIPT } from './calm-ui/script.js';

const AIMAKE_FAVICON_DATA_URI =
  'data:image/svg+xml,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" rx="113" fill="#17152D"/><g><path fill="#745DFF" d="M117 121 L258 79 Q293 69 286 103 L231 370 Q226 394 205 394 H117 Q93 394 93 370 V148 Q93 130 117 121 Z"/><rect fill="#FFCB49" x="304" y="98" width="156" height="156" rx="28"/><path fill="#B7AAFF" d="M292 273 H346 Q364 273 360 296 L345 379 Q342 395 321 395 H276 Q258 395 263 377 L281 295 Q285 273 292 273 Z"/><path fill="#FF6B74" d="M460 282 V368 Q460 395 432 395 H361 Q358 395 359 384 C367 316 399 286 448 282 Z"/></g></svg>'
  );

export function buildStudioShellHtml(): string {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link rel="icon" type="image/svg+xml" href="${AIMAKE_FAVICON_DATA_URI}" />
  <title>Aimake Studio · 爱创工坊</title>
  <style>${CALM_STUDIO_CSS}</style>
</head>
<body>
${CALM_STUDIO_MARKUP}
<script>${CALM_STUDIO_SCRIPT}</script>
</body>
</html>`;
}
