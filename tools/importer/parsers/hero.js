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
  // Extract background image from the hero.
  // Some heroes use an <img>, others use a video with a poster attribute.
  let heroImage = element.querySelector('.jlr-immersive-hero__auto-column--big img') ||
                  element.querySelector('.jlr-immersive-hero img');

  // Fallback: use the video poster attribute as the hero background image
  if (!heroImage) {
    const video = element.querySelector('.jlr-immersive-hero__video video[poster]') ||
                  element.querySelector('video[poster]');
    if (video && video.getAttribute('poster')) {
      heroImage = document.createElement('img');
      heroImage.src = video.getAttribute('poster');
      heroImage.alt = '';
    }
  }

  // Extract heading
  // VALIDATED: h1 class="jlr-immersive-hero__content__heading"
  const heading = element.querySelector('.jlr-immersive-hero__content__heading') ||
                  element.querySelector('h1');

  // Extract subtitle paragraph
  // VALIDATED: div class="jlr-immersive-hero__content__paragraph"
  const subtitle = element.querySelector('.jlr-immersive-hero__content__paragraph');

  // Extract CTA links (primary buttons and anchor buttons)
  const ctaLinks = Array.from(
    element.querySelectorAll('.jlr-immersive-hero__content__buttons-holder a.jlr-button, .jlr-immersive-hero__content__buttons-holder a.jlr-immersive-hero__content__anchor-button')
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

  // Row 3: Subtitle + CTAs + optional video link — all in ONE cell
  const wrapper = document.createElement('div');
  if (subtitle) {
    const p = document.createElement('p');
    p.textContent = subtitle.textContent.trim();
    wrapper.appendChild(p);
  }
  ctaLinks.forEach((link) => {
    const a = document.createElement('a');
    a.href = link.getAttribute('href');
    a.textContent = link.textContent.trim();
    wrapper.appendChild(a);
  });

  // Extract video if present (desktop source preferred)
  const videoSource = element.querySelector('.jlr-immersive-hero__video video source[src]')
    || element.querySelector('.jlr-native-video-frame video source[src]')
    || element.querySelector('video source[src]');
  if (videoSource) {
    const videoLink = document.createElement('a');
    videoLink.href = videoSource.getAttribute('src');
    videoLink.textContent = 'video';
    wrapper.appendChild(videoLink);
  }

  if (wrapper.childNodes.length > 0) {
    cells.push([wrapper]);
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'Hero', cells });
  element.replaceWith(block);
}
