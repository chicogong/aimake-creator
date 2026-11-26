import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import hljs from 'highlight.js/lib/core';
import langBash from 'highlight.js/lib/languages/bash';
import langCss from 'highlight.js/lib/languages/css';
import langGo from 'highlight.js/lib/languages/go';
import langJavascript from 'highlight.js/lib/languages/javascript';
import langJson from 'highlight.js/lib/languages/json';
import langMarkdown from 'highlight.js/lib/languages/markdown';
import langPython from 'highlight.js/lib/languages/python';
import langRust from 'highlight.js/lib/languages/rust';
import langSql from 'highlight.js/lib/languages/sql';
import langSwift from 'highlight.js/lib/languages/swift';
import langTypescript from 'highlight.js/lib/languages/typescript';
import langXml from 'highlight.js/lib/languages/xml';
import langYaml from 'highlight.js/lib/languages/yaml';
import type { DeckDocument, TemplateManifest } from '../schema/types.js';
import { renderMermaidSvg } from './mermaid-svg.js';

hljs.registerLanguage('typescript', langTypescript);
hljs.registerLanguage('ts', langTypescript);
hljs.registerLanguage('javascript', langJavascript);
hljs.registerLanguage('js', langJavascript);
hljs.registerLanguage('python', langPython);
hljs.registerLanguage('py', langPython);
hljs.registerLanguage('bash', langBash);
hljs.registerLanguage('sh', langBash);
hljs.registerLanguage('zsh', langBash);
hljs.registerLanguage('json', langJson);
hljs.registerLanguage('css', langCss);
hljs.registerLanguage('xml', langXml);
hljs.registerLanguage('html', langXml);
hljs.registerLanguage('yaml', langYaml);
hljs.registerLanguage('yml', langYaml);
hljs.registerLanguage('sql', langSql);
hljs.registerLanguage('go', langGo);
hljs.registerLanguage('rust', langRust);
hljs.registerLanguage('swift', langSwift);
hljs.registerLanguage('markdown', langMarkdown);

function escapeHtmlBasic(str: string): string {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function highlightCodeHtml(code: string, lang?: string): string {
  try {
    if (lang && hljs.getLanguage(lang)) {
      return hljs.highlight(code, { language: lang }).value;
    }
    return hljs.highlightAuto(code).value;
  } catch {
    return escapeHtmlBasic(code);
  }
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function getTemplatesRootDir(): string {
  // Works both from src/renderer/ (tsx) and dist/ (tsup bundle)
  const fromDist = path.resolve(__dirname, '../templates');
  const fromSrc = path.resolve(__dirname, '../../templates');
  return __dirname.endsWith('dist') ? fromDist : fromSrc;
}

export async function listTemplates(customDir?: string): Promise<TemplateManifest[]> {
  const root = customDir || getTemplatesRootDir();
  const entries = await fs.readdir(root, { withFileTypes: true });
  const manifests: TemplateManifest[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const manifestPath = path.join(root, entry.name, 'manifest.json');
    try {
      const raw = await fs.readFile(manifestPath, 'utf8');
      manifests.push(JSON.parse(raw) as TemplateManifest);
    } catch {
      // ignore folders without manifest.json
    }
  }

  return manifests.sort((a, b) => a.id.localeCompare(b.id));
}

export async function loadTemplateBundle(
  templateId: string,
  customDir?: string
): Promise<{ manifest: TemplateManifest; htmlSource: string }> {
  const root = customDir || getTemplatesRootDir();
  const dir = path.join(root, templateId);
  const [manifestRaw, htmlSource] = await Promise.all([
    fs.readFile(path.join(dir, 'manifest.json'), 'utf8'),
    fs.readFile(path.join(dir, 'template.html'), 'utf8'),
  ]);
  return {
    manifest: JSON.parse(manifestRaw) as TemplateManifest,
    htmlSource,
  };
}

export interface CompileHtmlOptions {
  editable?: boolean;
  singleSlideIndex?: number;
  customTemplatesDir?: string;
}

const ASPECT_DIMENSIONS: Record<string, [number, number]> = {
  '16:9': [1920, 1080],
  '3:4': [1080, 1440],
  '9:16': [1080, 1920],
  '1:1': [1080, 1080],
  '4:5': [1080, 1350],
};

/**
 * Compiles a DeckDocument + single-file parametric template.html into a self-contained HTML string.
 * Injects locale-aware typography rules (JP strict kinsoku, KR keep-all Pretendard, EN auto-fit)
 * and optional WYSIWYG [data-editable] bridge for Aimake Studio.
 */
export async function compileDeckToHtml(
  doc: DeckDocument,
  options: CompileHtmlOptions = {}
): Promise<{ html: string; manifest: TemplateManifest }> {
  const { manifest, htmlSource } = await loadTemplateBundle(
    doc.frontmatter.template,
    options.customTemplatesDir
  );

  const overrideDims =
    doc.frontmatter.aspect && doc.frontmatter.aspect !== manifest.aspect
      ? ASPECT_DIMENSIONS[doc.frontmatter.aspect]
      : undefined;
  const effectiveW = overrideDims ? overrideDims[0] : manifest.width;
  const effectiveH = overrideDims ? overrideDims[1] : manifest.height;
  const effectiveManifest: TemplateManifest = overrideDims
    ? { ...manifest, width: effectiveW, height: effectiveH }
    : manifest;

  const highlightedCodeMap: Record<number, string> = {};
  const diagramSvgMap: Record<number, string> = {};
  doc.slides.forEach((s, idx) => {
    if (s.code) {
      highlightedCodeMap[idx] = highlightCodeHtml(s.code.code, s.code.lang);
    }
    if (s.diagram) {
      diagramSvgMap[idx] = renderMermaidSvg(s.diagram.code);
    }
  });

  const payload = {
    deck: doc,
    manifest: effectiveManifest,
    options: {
      editable: Boolean(options.editable),
      singleSlideIndex: options.singleSlideIndex ?? null,
    },
    enhancements: {
      highlightedCodeMap,
      diagramSvgMap,
    },
  };

  const aspectOverrideCss = overrideDims
    ? `\n  .aimake-slide { width: ${effectiveW}px !important; height: ${effectiveH}px !important; }`
    : '';

  const localeCss = `
<style id="aimake-locale-typography">
  [lang="ja"], [lang="ja"] * {
    line-break: strict;
    word-break: normal;
    overflow-wrap: anywhere;
  }
  [lang="ko"], [lang="ko"] * {
    word-break: keep-all;
    overflow-wrap: break-word;
  }
  [lang="en"], [lang="es"] {
    hyphens: none;
    overflow-wrap: break-word;
  }
  [data-editable="true"]:hover {
    outline: 2px dashed rgba(43, 107, 230, 0.65);
    outline-offset: 4px;
    cursor: text;
  }
  [data-editable="true"]:focus {
    outline: 2px solid #2B6BE6;
    outline-offset: 4px;
    background: rgba(43, 107, 230, 0.08);
    border-radius: 4px;
  }
  /* Offline Highlight.js syntax colors on dark .code-box containers */
  .code-box .hljs-keyword, .code-box .hljs-selector-tag { color: #c084fc; font-weight: 600; }
  .code-box .hljs-string, .code-box .hljs-attr, .code-box .hljs-template-tag { color: #86efac; }
  .code-box .hljs-number, .code-box .hljs-literal, .code-box .hljs-built_in { color: #fbbf24; }
  .code-box .hljs-title, .code-box .hljs-function, .code-box .hljs-section { color: #60a5fa; font-weight: 600; }
  .code-box .hljs-comment, .code-box .hljs-quote { color: #94a3b8; font-style: italic; }
  .code-box .hljs-variable, .code-box .hljs-params { color: #f8fafc; }
  /* Offline Mermaid SVG container */
  .aimake-diagram-box {
    margin-top: 8px;
    padding: 20px 24px;
    border-radius: var(--radius, 14px);
    background: var(--surface, #ffffff);
    border: var(--bw, 1px) solid var(--border, rgba(0, 0, 0, 0.1));
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }
  .aimake-mermaid-svg {
    width: 100%;
    max-height: 520px;
    height: auto;
    display: block;
  }
  .aimake-mermaid-fallback {
    width: 100%;
    font-family: var(--mono, ui-monospace, monospace);
  }
  .aimake-mermaid-head {
    display: flex;
    justify-content: space-between;
    font-size: 13px;
    font-weight: 700;
    color: var(--accent, #18181b);
    margin-bottom: 10px;
  }
  .aimake-mermaid-code {
    margin: 0;
    font-size: 17px;
    line-height: 1.5;
    color: var(--ink, #141413);
    white-space: pre-wrap;
  }${aspectOverrideCss}
</style>`;

  const bootstrapScript = `
<script id="aimake-bootstrap">
  window.__AIMAKE_PAYLOAD__ = ${JSON.stringify(payload).replace(/<\//g, '<\\/')};
  window.addEventListener('DOMContentLoaded', () => {
    if (typeof window.renderDeck === 'function') {
      window.renderDeck(window.__AIMAKE_PAYLOAD__.deck, window.__AIMAKE_PAYLOAD__.options);
    }
    const enh = window.__AIMAKE_PAYLOAD__.enhancements || {};
    const slideEls = document.querySelectorAll('.aimake-slide');
    slideEls.forEach((slideEl, domIdx) => {
      const targetIdx = window.__AIMAKE_PAYLOAD__.options.singleSlideIndex !== null
        ? window.__AIMAKE_PAYLOAD__.options.singleSlideIndex
        : domIdx;
      const hlHtml = enh.highlightedCodeMap && enh.highlightedCodeMap[targetIdx];
      if (hlHtml) {
        const codeBox = slideEl.querySelector('.code-box');
        if (codeBox) codeBox.innerHTML = hlHtml;
      }
      const diagSvg = enh.diagramSvgMap && enh.diagramSvgMap[targetIdx];
      if (diagSvg && !slideEl.querySelector('.aimake-diagram-box')) {
        const box = document.createElement('div');
        box.className = 'aimake-diagram-box';
        box.innerHTML = diagSvg;
        const zone = slideEl.querySelector('.content-zone') || slideEl;
        zone.appendChild(box);
      }
    });
    if (window.__AIMAKE_PAYLOAD__.options.editable || window.self !== window.top) {
      let zoomMode = 'fit';
      let lastScale = -1;
      let rafId = 0;
      const fitStage = () => {
        if (typeof cancelAnimationFrame !== 'undefined') cancelAnimationFrame(rafId);
        rafId = (typeof requestAnimationFrame !== 'undefined' ? requestAnimationFrame : function(fn) { return setTimeout(fn, 16); })(() => {
          const availW = document.documentElement.clientWidth || window.innerWidth;
          const availH = document.documentElement.clientHeight || window.innerHeight;
          const root = document.getElementById('aimake-deck-root');
          if (!root || availW < 100 || availH < 100) return;
          let scale = 1;
          if (zoomMode === 'fit') {
            const scaleW = (availW - 44) / ${effectiveW};
            const scaleH = (availH - 44) / ${effectiveH};
            scale = Math.max(0.18, Math.min(1, scaleW, scaleH));
          } else {
            scale = Number(zoomMode) || 1;
          }
          if (Math.abs(scale - lastScale) > 0.003) {
            lastScale = scale;
            root.style.zoom = String(scale.toFixed(3));
          }
        });
      };
      fitStage();
      window.addEventListener('resize', fitStage);
      if (typeof ResizeObserver !== 'undefined') {
        new ResizeObserver(fitStage).observe(document.documentElement);
      }
      window.addEventListener('message', (ev) => {
        if (ev.data && ev.data.type === 'aimake:zoom') {
          zoomMode = ev.data.mode || 'fit';
          fitStage();
        }
      });
      window.addEventListener('keydown', (e) => {
        const target = e.target;
        const isEditing = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);
        if (isEditing) return;
        if (e.key === 'ArrowLeft' || e.key === 'PageUp' || e.key === 'ArrowUp') {
          e.preventDefault();
          window.parent.postMessage({ type: 'aimake:nav', action: 'prev' }, '*');
        } else if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === 'ArrowDown' || e.key === ' ') {
          e.preventDefault();
          window.parent.postMessage({ type: 'aimake:nav', action: 'next' }, '*');
        } else if (e.key === 'Escape') {
          e.preventDefault();
          window.parent.postMessage({ type: 'aimake:nav', action: 'escape' }, '*');
        } else if (e.key.toLowerCase() === 'f') {
          e.preventDefault();
          window.parent.postMessage({ type: 'aimake:nav', action: 'fullscreen' }, '*');
        }
      });
    }
    if (window.__AIMAKE_PAYLOAD__.options.editable) {
      document.querySelectorAll('[data-editable="true"]').forEach((el) => {
        el.setAttribute('contenteditable', 'true');
        el.setAttribute('spellcheck', 'false');
        el.addEventListener('blur', () => {
          const slideIndex = Number(el.getAttribute('data-slide-index') || '0');
          const field = el.getAttribute('data-field') || '';
          const value = (el.innerText || '').trim();
          window.parent.postMessage({
            type: 'aimake:edit',
            slideIndex,
            field,
            value
          }, '*');
        });
      });
    }
  });
</script>`;

  let finalHtml = htmlSource.replace(
    /<html([^>]*)>/i,
    (_match, attrs) => {
      const cleanedAttrs = attrs.replace(/\s*\blang=(['"])[^'"]*\1/gi, '');
      return `<html${cleanedAttrs} lang="${doc.frontmatter.locale}">`;
    }
  );
  if (finalHtml.includes('</head>')) {
    finalHtml = finalHtml.replace('</head>', `${localeCss}\n${bootstrapScript}\n</head>`);
  } else {
    finalHtml = `${localeCss}\n${bootstrapScript}\n${finalHtml}`;
  }

  return { html: finalHtml, manifest: effectiveManifest };
}
