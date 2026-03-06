/* eslint-disable */
/* global WebImporter */

/**
 * Parser for Hero Image Carousel block
 *
 * Source: .jlr-hero-slider-wrapper
 * Base Block: Hero Image Carousel
 *
 * Block Structure (from markdown example):
 * | **Hero Image Carousel** | |
 * | --- | --- |
 * | ![alt](image-url) | ## HEADING Description text |
 * | ![alt](image-url) | ## HEADING Description text |
 *
 * Source HTML Pattern:
 * <section class="jlr-hero-slider-wrapper jlr-section">
 *   <div class="jlr-hero-carousel-core">
 *     <swiper-container>
 *       <div class="swiper-slide jlr-slide">
 *         <div class="jlr-hero-carousel-slide-core">
 *           <div class="jlr-hero-carousel-slide-core__media-box">
 *             <picture><img src="..." alt="..."></picture>
 *           </div>
 *           <div class="jlr-hero-slider-banner">
 *             <div class="jlr-hero-slider-banner__copy">
 *               <h3>heading</h3>
 *               <div class="jlr-paragraph">description</div>
 *             </div>
 *           </div>
 *         </div>
 *       </div>
 *     </swiper-container>
 *   </div>
 * </section>
 *
 * Generated: 2026-03-04
 */
export default function parse(element, { document }) {
  const cells = [];

  // Get all slides, filtering out swiper duplicates
  const slides = Array.from(
    element.querySelectorAll('.swiper-slide.jlr-slide')
  ).filter((slide) => !slide.classList.contains('swiper-slide-duplicate'));

  slides.forEach((slide) => {
    // Extract image
    const img = slide.querySelector('.jlr-hero-carousel-slide-core__media-box img')
      || slide.querySelector('.jlr-hero-slider__bg-image')
      || slide.querySelector('img');

    // Extract heading from banner (source uses h1 or h2, not h3)
    const heading = slide.querySelector('.jlr-hero-slider-banner__copy h1')
      || slide.querySelector('.jlr-hero-slider-banner__copy h2')
      || slide.querySelector('.jlr-hero-slider-banner__copy h3')
      || slide.querySelector('.jlr-hero-slider-banner h1, .jlr-hero-slider-banner h2');

    // Extract description
    const desc = slide.querySelector('.jlr-hero-slider-banner__copy .jlr-paragraph')
      || slide.querySelector('.jlr-hero-slider-banner__copy div[class*="paragraph"]');

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

    if (imageCell.length > 0 || textCell.length > 0) {
      cells.push([imageCell, textCell]);
    }
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'Hero Image Carousel', cells });
  element.replaceWith(block);
}
