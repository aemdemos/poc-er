/* eslint-disable */
/* global WebImporter */

/**
 * Parser for hotspots container → extracts main image
 *
 * Source: .jlr-hotspots-container
 * Output: Returns the main image element for the page transformer to pair
 *
 * The page transformer collects images from consecutive hotspot sections
 * and pairs them into a single Columns block (exterior | interior).
 *
 * Markdown output example (after pairing by page transformer):
 * | **Columns** | |
 * | --- | --- |
 * | ![Exterior](img1) | ![Interior](img2) |
 *
 * Source HTML Pattern:
 * <section class="jlr-hotspots-container jlr-section">
 *   <div class="jlr-hotspots-container__box">
 *     <div class="jlr-hotspots-container__columns">
 *       <div class="jlr-hotspots-wrapper">
 *         <picture><img src="..." alt="..."></picture>
 *         <div class="jlr-hotspots-wrapper__item">...</div>
 *       </div>
 *     </div>
 *   </div>
 * </section>
 *
 * Generated: 2026-03-04
 */
export default function parse(element, { document }) {
  // Extract the main hotspot image (first image in the wrapper)
  const img = element.querySelector('.jlr-hotspots-wrapper img')
    || element.querySelector('.jlr-hotspots-container__columns img')
    || element.querySelector('img');

  if (img) {
    const imgEl = document.createElement('img');
    imgEl.src = img.getAttribute('src');
    imgEl.alt = img.getAttribute('alt') || '';
    // Mark this element for the page transformer to collect
    imgEl.setAttribute('data-hotspot-image', 'true');
    element.replaceWith(imgEl);
    return imgEl;
  }

  // Remove if no image found
  element.remove();
  return null;
}
