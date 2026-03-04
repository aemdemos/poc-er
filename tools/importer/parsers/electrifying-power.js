/* eslint-disable */
/* global WebImporter */

/**
 * Parser for electrifying-power → Columns block with formatted specs
 *
 * Source: .jlr-electrifying-power
 * Base Block: Columns
 *
 * Block Structure (from markdown example):
 * | **Columns** | |
 * | --- | --- |
 * | ## HEADING Description SPEC_LABEL: VALUE / SPEC_LABEL: VALUE [CTA](url) | ![img](url) |
 * OR reversed:
 * | ![img](url) | ## HEADING Description SPEC_LABEL: VALUE / SPEC_LABEL: VALUE |
 *
 * Source HTML Pattern:
 * <section class="jlr-electrifying-power jlr-section">
 *   <div class="jlr-grid--columns-3">
 *     <div class="jlr-electrifying-power__copy">
 *       <div class="jlr-electrifying-power__items">
 *         <div class="jlr-electrifying-power__item">
 *           <h4 class="__tagline">0-100 KM/H</h4>
 *           <h5 class="__title"><span>4,0</span>SEC</h5>
 *         </div>
 *         ...
 *       </div>
 *       <div class="jlr-column-template">
 *         <h2>DEFENDER OCTA</h2>
 *         <div class="jlr-column-template__paragraph">Description</div>
 *         <a href="...">CTA</a>
 *       </div>
 *     </div>
 *     <picture class="jlr-electrifying-power__image"><img></picture>
 *   </div>
 * </section>
 *
 * Generated: 2026-03-04
 */
export default function parse(element, { document }) {
  const cells = [];

  // Extract heading
  const heading = element.querySelector('.jlr-column-template__heading')
    || element.querySelector('.jlr-electrifying-power__copy h2');

  // Extract description
  const desc = element.querySelector('.jlr-column-template__paragraph');

  // Extract spec items
  const specItems = Array.from(element.querySelectorAll('.jlr-electrifying-power__item'));
  const specs = specItems.map((item) => {
    const tagline = item.querySelector('.jlr-electrifying-power__item__tagline');
    const title = item.querySelector('.jlr-electrifying-power__item__title');
    if (tagline && title) {
      const label = tagline.textContent.trim();
      const value = title.textContent.trim().replace(/\s+/g, ' ');
      return `${label}: ${value}`;
    }
    return null;
  }).filter(Boolean);

  // Extract CTAs
  const ctaLinks = Array.from(element.querySelectorAll('.jlr-column-template__link a, .jlr-electrifying-power__copy a.jlr-cta, .jlr-electrifying-power__copy a.jlr-button'));

  // Extract image
  const img = element.querySelector('.jlr-electrifying-power__image img')
    || element.querySelector('picture img');

  // Build text cell
  const textCell = [];
  if (heading) {
    const h2 = document.createElement('h2');
    h2.textContent = heading.textContent.trim();
    textCell.push(h2);
  }

  // Combine description and specs into one text block
  let textContent = '';
  if (desc) {
    // Get clean text, strip footnote markers
    textContent = desc.textContent.trim().replace(/<[^>]+>/g, '');
  }
  if (specs.length > 0) {
    const specLine = specs.join(' / ');
    textContent = textContent ? `${textContent} ${specLine}` : specLine;
  }
  if (textContent) {
    textCell.push(textContent);
  }

  ctaLinks.forEach((link) => {
    const a = document.createElement('a');
    a.href = link.getAttribute('href');
    a.textContent = link.textContent.trim();
    textCell.push(a);
  });

  // Build image cell
  const imageCell = [];
  if (img) {
    const imgEl = document.createElement('img');
    imgEl.src = img.getAttribute('src');
    imgEl.alt = img.getAttribute('alt') || '';
    imageCell.push(imgEl);
  }

  // Determine layout order: check if image comes before text in DOM
  const copyEl = element.querySelector('.jlr-electrifying-power__copy');
  const imageEl = element.querySelector('.jlr-electrifying-power__image');

  let textFirst = true;
  if (copyEl && imageEl) {
    // Compare DOM positions - if image appears before copy, it's image-first
    const position = copyEl.compareDocumentPosition(imageEl);
    // eslint-disable-next-line no-bitwise
    textFirst = !!(position & Node.DOCUMENT_POSITION_FOLLOWING);
  }

  if (textFirst) {
    cells.push([textCell, imageCell]);
  } else {
    cells.push([imageCell, textCell]);
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'Columns', cells });
  element.replaceWith(block);
}
