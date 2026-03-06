/* eslint-disable */
/* global WebImporter */

/**
 * Homepage page transformer
 * Transforms the Land Rover Egypt homepage into EDS content.
 *
 * Returns a DOM element (like all other transformers) so that
 * the afterTransform cleanup can run querySelectorAll on it.
 */
import cardsHeroParser from '../block-parsers/cards-hero.js';
import { createMetadataBlock } from '../parsers/metadata.js';

export default function transform(main, document, url) {
  const output = document.createElement('div');

  // Parse the house of brands block (vehicle family hero cards)
  const hobBlock = main.querySelector('.jlr-house-of-brands-block');
  if (hobBlock) {
    const cells = cardsHeroParser(hobBlock, document);
    // cells is [[header], [row1col1, row1col2], ...] format
    const blockCells = cells.slice(1); // Remove header row
    const block = WebImporter.Blocks.createBlock(document, {
      name: cells[0][0] || 'Cards (hero)',
      cells: blockCells,
    });
    output.appendChild(block);
    output.appendChild(document.createElement('hr'));
  }

  // Append page Metadata block
  const metadataBlock = createMetadataBlock(document);
  if (metadataBlock) {
    output.appendChild(metadataBlock);
  }

  return output;
}
