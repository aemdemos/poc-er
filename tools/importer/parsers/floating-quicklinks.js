/* eslint-disable */
/* global WebImporter */

/**
 * Parser for Floating Quicklinks block
 *
 * Source: .ready-to-go-bar
 * Base Block: Floating Quicklinks
 *
 * Block Structure (from markdown example):
 * | **Floating Quicklinks** | |
 * | --- | --- |
 * | :configure: | [BUILD YOUR OWN](url) |
 * | :steering-wheel: | [BOOK A TEST DRIVE](url) |
 * | :calculator: | [REQUEST A CALLBACK](url) |
 * | :envelope: | [FIND A RETAILER](url) |
 *
 * Source HTML Pattern:
 * <section class="ready-to-go-bar jlr-section">
 *   <div class="jlr-grid__wrapper">
 *     <div class="jlr-grid jlr-grid--columns-4">
 *       <a href="..." class="ready-to-go-bar__item">
 *         <i class="ready-to-go-bar__icon jlr-icon icon-ignite-configure">
 *         <div class="ready-to-go-bar__cta"><span>Build your own</span></div>
 *       </a>
 *       ...
 *     </div>
 *   </div>
 * </section>
 *
 * Generated: 2026-03-04
 */
import { getIconName } from '../utils/icon-map.js';

export default function parse(element, { document }) {
  const cells = [];

  // Extract quicklink items
  const items = Array.from(element.querySelectorAll('.ready-to-go-bar__item'));

  items.forEach((item, index) => {
    const href = item.getAttribute('href');

    // Extract CTA text from the cta span
    const ctaText = item.querySelector('.jlr-cta__text span, .jlr-cta__text, .ready-to-go-bar__cta span');
    const linkText = ctaText ? ctaText.textContent.trim() : '';

    // Determine icon from the icon element's class
    const iconEl = item.querySelector('.ready-to-go-bar__icon');
    const iconName = getIconName(iconEl, index);

    // Build icon cell
    const iconCell = `:${iconName}:`;

    // Build link cell
    const link = document.createElement('a');
    link.href = href;
    link.textContent = linkText.toUpperCase();

    cells.push([iconCell, [link]]);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'Floating Quicklinks', cells });
  element.replaceWith(block);
}
