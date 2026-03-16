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
 * Note: Ready-to-go bar (.ready-to-go-bar) is handled by floating-quicklinks.js
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

      // Extract CTAs — primary buttons become EDS buttons, secondary become text links
      // VALIDATED: a.jlr-button (primary) and a.jlr-cta (secondary) in captured DOM
      const primaryBtns = Array.from(copyBlock.querySelectorAll('a.jlr-button, a.jlr-column-template__button'));
      const secondaryLinks = Array.from(copyBlock.querySelectorAll('a.jlr-cta'));

      primaryBtns.forEach((link) => {
        const p = document.createElement('p');
        const a = document.createElement('a');
        a.href = link.getAttribute('href');
        a.textContent = link.textContent.trim();
        p.appendChild(a);
        textCell.push(p);
      });
      secondaryLinks.forEach((link) => {
        const p = document.createElement('p');
        p.append('\u203A ');
        const a = document.createElement('a');
        a.href = link.getAttribute('href');
        a.textContent = link.textContent.trim();
        p.appendChild(a);
        textCell.push(p);
      });
    }

    // Extract images from masonry grid
    // DOM uses <picture><img> inside grid items, not .jlr-masonry-block__image
    const imageWrapper = masonryRoot.querySelector('.jlr-masonry-block__grid-wrapper');
    const imageCell = [];
    if (imageWrapper) {
      const seen = new Set();
      const images = Array.from(imageWrapper.querySelectorAll(
        '.jlr-masonry-block__grid__item img, .jlr-masonry-block__image, picture img'
      ));
      images.forEach((img) => {
        const src = img.getAttribute('src');
        if (!src || seen.has(src)) return;
        seen.add(src);
        const imgEl = document.createElement('img');
        imgEl.src = src;
        imgEl.alt = img.getAttribute('alt') || '';
        imageCell.push(imgEl);
      });
    }

    // Extract video from NUXT-injected data attribute.
    // Video link goes into imageCell at the "wide" slot position.
    // For images-left (reversed): wide slot is child 2 (after 2nd image, absorbs it as poster).
    // For images-right (not reversed): wide slot is last (standalone, no poster).
    const masonryVideo = masonryRoot.getAttribute('data-masonry-video');
    if (masonryVideo) {
      const noPoster = masonryRoot.getAttribute('data-masonry-video-no-poster') === 'true';
      const videoLink = document.createElement('a');
      videoLink.href = masonryVideo;
      videoLink.textContent = noPoster ? 'video' : 'video-poster';
      const videoP = document.createElement('p');
      videoP.appendChild(videoLink);

      if (!noPoster && isReversed && imageCell.length >= 2) {
        // Images-left: video after 2nd image (absorbs it as poster for wide top-right slot)
        imageCell.splice(2, 0, videoP);
      } else {
        // Images-right or no poster: video last (standalone in wide bottom-right slot)
        imageCell.push(videoP);
      }
    }

    // Build row based on orientation
    if (isReversed) {
      cells.push([imageCell, textCell]);
    } else {
      cells.push([textCell, imageCell]);
    }
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'Columns', cells });
  element.replaceWith(block);
}
