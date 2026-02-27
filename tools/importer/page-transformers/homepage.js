/**
 * Homepage page transformer
 * Transforms the Land Rover Egypt homepage into EDS content
 */
import cardsHeroParser from '../block-parsers/cards-hero.js';

export default function transform(document) {
  const results = [];

  // Parse the house of brands block
  const hobBlock = document.querySelector('.jlr-house-of-brands-block');
  if (hobBlock) {
    const cells = cardsHeroParser(hobBlock, document);
    results.push({
      type: 'block',
      cells,
    });
  }

  // Extract metadata
  const meta = {};
  const title = document.querySelector('title');
  if (title) meta.title = title.textContent;
  const desc = document.querySelector('meta[name="description"]');
  if (desc) meta.description = desc.content;
  const ogImage = document.querySelector('meta[property="og:image"]');
  if (ogImage) meta['og:image'] = ogImage.content;

  return { main: results, metadata: meta };
}
