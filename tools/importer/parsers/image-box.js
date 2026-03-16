/* eslint-disable */
/* global WebImporter */

/**
 * Parser for image-box (quote banner) → Quote block
 *
 * Source: .jlr-image-box (usually inside a carousel wrapper)
 * Output: Quote block with background image row + quotation row
 *
 * EDS block table structure:
 * | Quote         |
 * | ------------- |
 * | ![](img-url)  |
 * | "Quote text." |
 *
 * Source HTML Pattern:
 * <section class="jlr-section">
 *   <div class="jlr-image-box-holder">
 *     <div class="jlr-image-box">
 *       <picture><img src="..." alt="..." class="jlr-image-box__background"></picture>
 *       <div class="jlr-image-box__content">
 *         <div class="jlr-paragraph--size-quote">Quote text</div>
 *       </div>
 *     </div>
 *   </div>
 * </section>
 *
 * Generated: 2026-03-04
 * Updated: 2026-03-16 — changed from default content to Quote block
 */
export default function parse(element, { document }) {
  const cells = [];

  // Row 1: background image
  const img = element.querySelector('.jlr-image-box__background')
    || element.querySelector('.jlr-image-box img')
    || element.querySelector('img');

  if (img) {
    const imgEl = document.createElement('img');
    imgEl.src = img.getAttribute('src');
    imgEl.alt = img.getAttribute('alt') || '';
    cells.push([[imgEl]]);
  }

  // Row 2: quote text
  const quote = element.querySelector('.jlr-paragraph--size-quote')
    || element.querySelector('.jlr-image-box__content .jlr-paragraph');

  if (quote) {
    const p = document.createElement('p');
    p.textContent = quote.textContent.trim();
    cells.push([[p]]);
  }

  const block = WebImporter.Blocks.createBlock(document, {
    name: 'Quote',
    cells,
  });

  element.replaceWith(block);
}
