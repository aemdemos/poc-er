/* eslint-disable */
/* global WebImporter */

/**
 * Parser for cards block
 *
 * Source: https://www.landrover-egypt.com/en/defender/overview
 * Base Block: cards
 *
 * Block Structure (from markdown example):
 * - Row N: [image] | [title + description + CTAs]
 *
 * Source HTML Pattern:
 * <div class="jlr-content-blocks">
 *   <div class="jlr-grid--columns-N">
 *     <div class="jlr-block-item">
 *       <img> + <h2> + <p> + <a>explore</a> + <a>BUILD YOUR OWN</a>
 *     </div>
 *     ...
 *   </div>
 * </div>
 *
 * Handles: 4-up vehicle lineup, 2-up partnerships, 3-up explore cards
 *
 * Generated: 2026-02-27
 */
export default function parse(element, { document }) {
  // Find all card items within the grid
  // VALIDATED: .jlr-block-item.jlr-content-blocks__item found in captured DOM
  const cardItems = Array.from(
    element.querySelectorAll('.jlr-block-item.jlr-content-blocks__item')
  );

  // Fallback: try broader selector
  if (cardItems.length === 0) {
    cardItems.push(...element.querySelectorAll('.jlr-block-item'));
  }

  const cells = [];

  cardItems.forEach((card) => {
    // Strip footnote markers (sub/sup) to prevent inline disclaimer text
    // e.g., LOADSPACE "UP TO 2277 litres" instead of "UP TO 2277 litres** Wet: ..."
    card.querySelectorAll('sub, sup, subscript, superscript').forEach((el) => el.remove());

    // Extract image
    // VALIDATED: img inside .jlr-block-item__image-wrapper picture
    const img = card.querySelector('.jlr-block-item__image-wrapper img') ||
                card.querySelector('img');

    // Extract heading
    // VALIDATED: h2 class="jlr-block-item__heading"
    const heading = card.querySelector('.jlr-block-item__heading') ||
                    card.querySelector('h2');

    // Extract description
    // VALIDATED: div class="jlr-block-item__paragraph"
    const description = card.querySelector('.jlr-block-item__paragraph') ||
                        card.querySelector('.jlr-column-template__paragraph');

    // Extract CTA links
    // VALIDATED: a.jlr-button (primary) and a.jlr-cta (secondary) found in captured DOM
    const primaryCta = card.querySelector('.jlr-column-template__button');
    const secondaryCta = card.querySelector('.jlr-cta');

    // Build image cell
    const imageCell = [];
    if (img) {
      const imgEl = document.createElement('img');
      imgEl.src = img.getAttribute('src');
      imgEl.alt = img.getAttribute('alt') || '';
      imageCell.push(imgEl);
    }

    // Build text cell — each piece in its own <p> for clear line separation
    const body = document.createElement('div');
    if (heading) {
      const p = document.createElement('p');
      const strong = document.createElement('strong');
      strong.textContent = heading.textContent.trim();
      p.appendChild(strong);
      body.appendChild(p);
    }
    if (description) {
      const p = document.createElement('p');
      p.textContent = description.textContent.trim();
      body.appendChild(p);
    }
    if (primaryCta) {
      const p = document.createElement('p');
      const a = document.createElement('a');
      a.href = primaryCta.getAttribute('href');
      a.textContent = primaryCta.textContent.trim();
      p.appendChild(a);
      body.appendChild(p);
    }
    if (secondaryCta) {
      const p = document.createElement('p');
      p.append('\u203A ');
      const a = document.createElement('a');
      a.href = secondaryCta.getAttribute('href');
      a.textContent = secondaryCta.textContent.trim();
      p.appendChild(a);
      body.appendChild(p);
    }

    cells.push([imageCell, body]);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'Cards', cells });
  element.replaceWith(block);
}
