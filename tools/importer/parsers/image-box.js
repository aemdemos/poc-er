/* eslint-disable */
/* global WebImporter */

/**
 * Parser for image-box (quote banner) → default content
 *
 * Source: .jlr-image-box (usually inside a carousel wrapper)
 * Output: Default content (image + quote paragraph), NOT a block table
 *
 * Markdown output example:
 * ![alt](image-url)
 *
 * "Quote text here."
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
 */
export default function parse(element, { document }) {
  const container = document.createElement('div');

  // Extract the background image
  const img = element.querySelector('.jlr-image-box__background')
    || element.querySelector('.jlr-image-box img')
    || element.querySelector('img');

  if (img) {
    const imgEl = document.createElement('img');
    imgEl.src = img.getAttribute('src');
    imgEl.alt = img.getAttribute('alt') || '';
    container.appendChild(imgEl);
  }

  // Extract quote text
  const quote = element.querySelector('.jlr-paragraph--size-quote')
    || element.querySelector('.jlr-image-box__content .jlr-paragraph');

  if (quote) {
    const p = document.createElement('p');
    // Wrap in quotes to match ground truth format
    const text = quote.textContent.trim();
    p.textContent = `"${text}"`;
    container.appendChild(p);
  }

  // This outputs default content, not a block table
  element.replaceWith(container);
}
