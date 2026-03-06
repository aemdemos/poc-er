/* eslint-disable */
/* global WebImporter */

/**
 * Parser for tabbed-component → Columns block (image + text)
 *
 * Source: .jlr-tabbed-component (usually inside a parent section)
 * Base Block: Columns
 *
 * Only extracts the active/first tab's content (matches ground truth).
 *
 * Block Structure (from markdown example):
 * | **Columns** | |
 * | --- | --- |
 * | ![img](url) | ## HEADING Description text |
 *
 * Source HTML Pattern:
 * <section class="jlr-section">
 *   <div class="jlr-tabbed-component">
 *     <div>
 *       <div class="jlr-image-component">
 *         <img src="..." class="jlr-image">
 *       </div>
 *     </div>
 *     <section class="jlr-tabbed-component__navigation">
 *       <nav class="jlr-tabs__navigation">
 *         <button class="jlr-tab-button--active">INTUITIVE</button>
 *       </nav>
 *     </section>
 *     <div class="jlr-tabbed-component__copy-box jlr-copy-box">
 *       <h2>INTUITIVE</h2>
 *       <div class="jlr-copy-box__paragraph">Description</div>
 *     </div>
 *   </div>
 * </section>
 *
 * Generated: 2026-03-04
 */
export default function parse(element, { document }) {
  const cells = [];

  // Find the tabbed component root
  const tabbed = element.classList.contains('jlr-tabbed-component')
    ? element
    : element.querySelector('.jlr-tabbed-component');

  if (!tabbed) {
    element.remove();
    return;
  }

  // Extract the main image (shared across tabs)
  const img = tabbed.querySelector('.jlr-image-component img')
    || tabbed.querySelector('img');

  // Extract the active tab's text content
  const copyBox = tabbed.querySelector('.jlr-copy-box')
    || tabbed.querySelector('.jlr-tabbed-component__copy-box');

  const heading = copyBox
    ? (copyBox.querySelector('.jlr-copy-box__heading') || copyBox.querySelector('h2'))
    : null;

  const desc = copyBox
    ? (copyBox.querySelector('.jlr-copy-box__paragraph') || copyBox.querySelector('.jlr-paragraph'))
    : null;

  // Build image cell
  const imageCell = [];
  if (img) {
    const imgEl = document.createElement('img');
    imgEl.src = img.getAttribute('src');
    imgEl.alt = img.getAttribute('alt') || '';
    imageCell.push(imgEl);
  }

  // Build text cell
  const textCell = [];
  if (heading) {
    const h2 = document.createElement('h2');
    h2.textContent = heading.textContent.trim();
    textCell.push(h2);
  }
  if (desc) {
    textCell.push(desc.textContent.trim());
  }

  // Extract CTA links (e.g., BUILD YOUR OWN, EXPLORE MODELS in Build & Order)
  const ctaContainer = copyBox || tabbed;
  const ctaLinks = Array.from(
    ctaContainer.querySelectorAll('a.jlr-button, a.jlr-cta')
  );
  ctaLinks.forEach((link) => {
    const p = document.createElement('p');
    const a = document.createElement('a');
    a.href = link.getAttribute('href');
    a.textContent = link.textContent.trim();
    p.appendChild(a);
    textCell.push(p);
  });

  if (imageCell.length > 0 || textCell.length > 0) {
    cells.push([imageCell, textCell]);
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'Columns', cells });
  element.replaceWith(block);
}
