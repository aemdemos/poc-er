/* eslint-disable */
/* global WebImporter */

/**
 * Parser for carousel block
 *
 * Source: https://www.landrover-egypt.com/en/defender/overview
 * Base Block: carousel
 *
 * Block Structure (from markdown example):
 * - Row N: [image] | [heading + description + CTA]
 *
 * Source HTML Patterns:
 *
 * Pattern 1 - Dual-Frame Carousel (.jlr-dual-frame-carousel):
 * <section class="jlr-dual-frame-carousel">
 *   <div class="swiper-slide">
 *     <div class="jlr-column-template"><h1/h3>heading</h1/h3><div>text</div><a>CTA</a></div>
 *     <div class="jlr-dual-frame-carousel__slider-img"><img></div>
 *   </div>
 * </section>
 *
 * Note: Hero Slider (.jlr-hero-slider-wrapper) is handled by hero-image-carousel.js
 *
 * Generated: 2026-02-27
 */
export default function parse(element, { document }) {
  const cells = [];

  // Detect pattern: dual-frame carousel
  // VALIDATED: .swiper-slide.jlr-slide inside .jlr-dual-frame-carousel
  const dualFrameSlides = Array.from(element.querySelectorAll('.swiper-slide.jlr-slide'));

  if (dualFrameSlides.length > 0) {
    // Pattern 1: Dual-frame carousel
    dualFrameSlides.forEach((slide) => {
      // Extract image
      // VALIDATED: .jlr-dual-frame-carousel__slider-img img
      const img = slide.querySelector('.jlr-dual-frame-carousel__slider-img img') ||
                  slide.querySelector('img');

      // Extract heading
      // VALIDATED: h1 or h3 class="jlr-column-template__heading"
      const heading = slide.querySelector('.jlr-column-template__heading') ||
                      slide.querySelector('h1, h2, h3');

      // Extract text
      // VALIDATED: div class="jlr-column-template__paragraph"
      const text = slide.querySelector('.jlr-column-template__paragraph');

      // Extract CTA
      // VALIDATED: a.jlr-column-template__button
      const cta = slide.querySelector('.jlr-column-template__button') ||
                  slide.querySelector('a.jlr-button');

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
      if (text) {
        textCell.push(text.textContent.trim());
      }
      if (cta) {
        const a = document.createElement('a');
        a.href = cta.getAttribute('href');
        a.textContent = cta.textContent.trim();
        textCell.push(a);
      }

      cells.push([imageCell, textCell]);
    });
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'Carousel', cells });
  element.replaceWith(block);
}
