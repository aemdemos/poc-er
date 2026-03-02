/* eslint-disable */
/* global WebImporter */

/**
 * Parser for columns block
 *
 * Source: https://www.landrover-egypt.com/en/defender/overview
 * Base Block: columns
 *
 * Block Structure (from markdown example):
 * - Row 1: [text column with heading + description + CTAs] | [image column with multiple images]
 * OR reversed:
 * - Row 1: [image column] | [text column]
 *
 * Source HTML Patterns:
 *
 * Pattern 1 - Masonry Block (.jlr-masonry-block):
 * <section class="jlr-masonry-block">
 *   <div class="jlr-grid--columns-3">
 *     <div class="jlr-masonry-block__copy">h2, p, CTAs</div>
 *     <div class="jlr-masonry-block__grid-wrapper">images x4</div>
 *   </div>
 * </section>
 * Reversed variant: .jlr-grid--columns-3-reversed (images first, text second)
 *
 * Pattern 2 - Ready-to-go bar (.ready-to-go-bar):
 * Horizontal row of 4 quick-action links
 *
 * Generated: 2026-02-27
 */
export default function parse(element, { document }) {
  const cells = [];

  // Check if this is a masonry block
  // VALIDATED: .jlr-masonry-block class on section
  const isMasonry = element.classList.contains('jlr-masonry-block') ||
                    element.querySelector('.jlr-masonry-block');
  const masonryRoot = element.classList.contains('jlr-masonry-block')
    ? element
    : element.querySelector('.jlr-masonry-block');

  if (masonryRoot) {
    // Check if reversed layout
    // VALIDATED: .jlr-grid--columns-3-reversed in captured DOM
    const isReversed = !!masonryRoot.querySelector('.jlr-grid--columns-3-reversed');

    // Extract text content
    // VALIDATED: .jlr-masonry-block__copy contains heading + description + CTAs
    const copyBlock = masonryRoot.querySelector('.jlr-masonry-block__copy');

    const textCell = [];
    if (copyBlock) {
      // Extract heading
      // VALIDATED: h2 class="jlr-column-template__heading"
      const heading = copyBlock.querySelector('.jlr-column-template__heading') ||
                      copyBlock.querySelector('h2');
      if (heading) {
        const h2 = document.createElement('h2');
        h2.textContent = heading.textContent.trim();
        textCell.push(h2);
      }

      // Extract description
      // VALIDATED: div class="jlr-column-template__paragraph"
      const desc = copyBlock.querySelector('.jlr-column-template__paragraph');
      if (desc) {
        textCell.push(desc.textContent.trim());
      }

      // Extract CTAs
      // VALIDATED: a.jlr-button (primary) and a.jlr-cta (secondary) in captured DOM
      const buttons = Array.from(copyBlock.querySelectorAll('a.jlr-button'));
      const ctaLinks = Array.from(copyBlock.querySelectorAll('a.jlr-cta'));

      [...buttons, ...ctaLinks].forEach((link) => {
        const a = document.createElement('a');
        a.href = link.getAttribute('href');
        a.textContent = link.textContent.trim();
        textCell.push(a);
      });
    }

    // Extract images
    // VALIDATED: .jlr-masonry-block__grid-wrapper contains image grid items
    const imageWrapper = masonryRoot.querySelector('.jlr-masonry-block__grid-wrapper');
    const imageCell = [];
    if (imageWrapper) {
      const images = Array.from(imageWrapper.querySelectorAll('.jlr-masonry-block__image'));
      images.forEach((img) => {
        const imgEl = document.createElement('img');
        imgEl.src = img.getAttribute('src');
        imgEl.alt = img.getAttribute('alt') || '';
        imageCell.push(imgEl);
      });
    }

    // Build row based on orientation
    if (isReversed) {
      cells.push([imageCell, textCell]);
    } else {
      cells.push([textCell, imageCell]);
    }
  } else {
    // Pattern 2: Ready-to-go bar or generic columns
    // Extract all links as individual columns
    const links = Array.from(element.querySelectorAll('a'));
    if (links.length > 0) {
      const row = links.map((link) => {
        const a = document.createElement('a');
        a.href = link.getAttribute('href');
        a.textContent = link.textContent.trim();
        return [a];
      });
      cells.push(row);
    }
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'Columns', cells });
  element.replaceWith(block);
}
