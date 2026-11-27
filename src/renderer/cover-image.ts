import fs from 'node:fs/promises';
import path from 'node:path';
import type { DeckDocument, DeckSlide } from '../schema/types.js';

const imageTypes: Readonly<Record<string, string>> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
};

const illustratedCoverTemplates = new Set([
  'apple-bento-launch',
  'xhs-warm-magazine',
  'linkedin-exec-carousel',
]);

/** Embeds a raster cover image stored alongside its deck. */
export async function readCoverImage(
  deck: DeckDocument,
  slide: DeckSlide
): Promise<string | undefined> {
  if (!illustratedCoverTemplates.has(deck.frontmatter.template) || slide.layout !== 'cover') return;
  if (!deck.sourcePath || !slide.imageUrl?.startsWith('./')) return;
  const type = imageTypes[path.extname(slide.imageUrl).toLowerCase()];
  if (!type) return;

  try {
    const folder = await fs.realpath(path.dirname(deck.sourcePath));
    const file = await fs.realpath(path.resolve(folder, slide.imageUrl));
    const relative = path.relative(folder, file);
    if (relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) return;
    if (!(await fs.stat(file)).isFile()) return;
    const bytes = await fs.readFile(file);
    return `data:${type};base64,${bytes.toString('base64')}`;
  } catch {
    // A deck can still be opened when its optional cover image is missing.
    return undefined;
  }
}
