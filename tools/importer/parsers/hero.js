/* eslint-disable */
/* global WebImporter */

/**
 * Parser for hero block
 *
 * Source: https://www.landrover-egypt.com/en/defender/overview
 * Base Block: hero
 *
 * Block Structure (from markdown example):
 * - Row 1: Background image/video
 * - Row 2: Heading (h1)
 * - Row 3: Subtitle + CTA link
 *
 * Source HTML Pattern:
 * <section class="jlr-immersive-hero jlr-section jlr-section--dark-theme">
 *   <div class="jlr-immersive-hero__video">...<video>...</video></div>
 *   <h1 class="jlr-immersive-hero__content__heading">EMBRACE THE IMPOSSIBLE</h1>
 *   <div class="jlr-immersive-hero__content__paragraph">SINCE 1948</div>
 *   <a class="jlr-button" href="#explore">EXPLORE</a>
 * </section>
 *
 * Generated: 2026-02-27
 */
export default function parse(element, { document }) {
  // Extract background image from the hero
  // VALIDATED: .jlr-immersive-hero__auto-column--big contains the hero visual
  const heroImage = element.querySelector('.jlr-immersive-hero__auto-column--big img') ||
                    element.querySelector('.jlr-immersive-hero img');

  // Extract heading
  // VALIDATED: h1 class="jlr-immersive-hero__content__heading"
  const heading = element.querySelector('.jlr-immersive-hero__content__heading') ||
                  element.querySelector('h1');

  // Extract subtitle paragraph
  // VALIDATED: div class="jlr-immersive-hero__content__paragraph"
  const subtitle = element.querySelector('.jlr-immersive-hero__content__paragraph');

  // Extract CTA links
  // VALIDATED: a.jlr-button inside .jlr-immersive-hero__content__buttons-holder
  const ctaLinks = Array.from(
    element.querySelectorAll('.jlr-immersive-hero__content__buttons-holder a.jlr-button')
  );

  // Build cells matching Hero block markdown structure
  const cells = [];

  // Row 1: Background image
  if (heroImage) {
    cells.push([heroImage]);
  }

  // Row 2: Heading
  if (heading) {
    const h1 = document.createElement('h1');
    h1.textContent = heading.textContent.trim();
    cells.push([h1]);
  }

  // Row 3: Subtitle + CTAs
  const contentCell = [];
  if (subtitle) {
    contentCell.push(subtitle.textContent.trim());
  }
  ctaLinks.forEach((link) => {
    const a = document.createElement('a');
    a.href = link.getAttribute('href');
    a.textContent = link.textContent.trim();
    contentCell.push(a);
  });
  if (contentCell.length > 0) {
    cells.push(contentCell);
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'Hero', cells });
  element.replaceWith(block);
}
