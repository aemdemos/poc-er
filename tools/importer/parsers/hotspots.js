/* eslint-disable */
/* global WebImporter */

/**
 * Parser for hotspots container → Hotspots block
 *
 * Source: .jlr-hotspots-container
 * Base Block: Hotspots
 *
 * Extracts the main image, hotspot positions (from inline styles),
 * and card content (headings + descriptions injected from __NUXT__
 * by the cleanup transformer).
 *
 * The page transformer combines multiple hotspot containers (e.g.
 * EXTERIOR + INTERIOR) into a single tabbed Hotspots block.
 *
 * Content model per container:
 * | **Hotspots** | |
 * | --- | --- |
 * | ![Main Image](url) | |
 * | 42, 25 | **UNSTOPPABLE** description text |
 * | 53, 34 | **BUILT TO ENDURE** description text |
 *
 * Source HTML Pattern:
 * <section class="jlr-hotspots-container jlr-section">
 *   <div class="jlr-hotspots-container__box">
 *     <div class="jlr-hotspots-container__columns">
 *       <div class="jlr-hotspots-wrapper">
 *         <picture><img src="..." alt="..."></picture>
 *         <div class="jlr-hotspots-wrapper__item" style="top:42%;left:25%">
 *           <button class="jlr-hotspot">...</button>
 *         </div>
 *       </div>
 *     </div>
 *   </div>
 * </section>
 *
 * Generated: 2026-03-06
 */

/**
 * Clean paragraph text from __NUXT__ data:
 * - Strip <sup>...</sup> footnote references
 * - Replace &nbsp; entities and Unicode non-breaking spaces with regular spaces
 */
function cleanParagraph(text) {
  if (!text) return text;
  return text
    .replace(/&nbsp;/gi, ' ')
    .replace(/\u00a0/g, ' ')
    .trim();
}

/**
 * Extract structured hotspot data from a single container element.
 * Used by both the standalone parser and the page transformer.
 */
export function extractHotspotData(element, document) {
  // Main image
  const img = element.querySelector('.jlr-hotspots-wrapper img')
    || element.querySelector('.jlr-hotspots-container__columns img')
    || element.querySelector('img');

  let imgEl = null;
  if (img) {
    imgEl = document.createElement('img');
    imgEl.src = img.getAttribute('src');
    imgEl.alt = img.getAttribute('alt') || '';
  }

  // Hotspot positions from wrapper item inline styles
  const items = Array.from(
    element.querySelectorAll('.jlr-hotspots-wrapper__item')
  );
  const positions = items.map((item) => {
    const style = item.getAttribute('style') || '';
    const topMatch = style.match(/top:\s*([\d.]+)%/);
    const leftMatch = style.match(/left:\s*([\d.]+)%/);
    return {
      top: topMatch ? topMatch[1] : '0',
      left: leftMatch ? leftMatch[1] : '0',
    };
  });

  // Card content from data attribute (injected by cleanup transformer from __NUXT__)
  let cards = [];
  const cardsJson = element.getAttribute('data-hotspot-cards');
  if (cardsJson) {
    try {
      cards = JSON.parse(cardsJson).map((card) => ({
        ...card,
        paragraph: cleanParagraph(card.paragraph),
      }));
    } catch (e) { /* ignore */ }
  }

  return { img: imgEl, positions, cards };
}

/**
 * Standalone parser — creates a single Hotspots block from one container.
 * The page transformer uses extractHotspotData() directly for combining
 * multiple containers into one tabbed block.
 */
export default function parse(element, { document }) {
  const data = extractHotspotData(element, document);

  if (!data.img && data.positions.length === 0) {
    element.remove();
    return null;
  }

  const cells = [];

  // Row 1: Main image
  if (data.img) {
    cells.push([[data.img], ['']]);
  }

  // Rows 2+: position | heading + description | sub-image
  const count = Math.max(data.positions.length, data.cards.length);
  for (let i = 0; i < count; i++) {
    const pos = data.positions[i] || { top: '0', left: '0' };
    const card = data.cards[i] || {};

    const posText = `${pos.top}, ${pos.left}`;

    const contentCell = [];
    if (card.heading) {
      const strong = document.createElement('strong');
      strong.textContent = card.heading;
      contentCell.push(strong);
    }
    if (card.paragraph) {
      if (contentCell.length > 0) {
        contentCell.push(document.createElement('br'));
      }
      const span = document.createElement('span');
      span.innerHTML = card.paragraph;
      contentCell.push(span);
    }

    const imageCell = [];
    if (card.image) {
      const imgEl = document.createElement('img');
      imgEl.src = card.image;
      imgEl.alt = card.heading || '';
      imageCell.push(imgEl);
    }

    cells.push([
      [posText],
      contentCell.length > 0 ? contentCell : [''],
      imageCell.length > 0 ? imageCell : [''],
    ]);
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'Hotspots', cells });
  element.replaceWith(block);
  return block;
}
