/* eslint-disable */
/* global WebImporter */

/**
 * Parser for Floating Quicklinks block
 *
 * Source: .ready-to-go-bar
 * Base Block: Floating Quicklinks
 *
 * Each row = [icon glyph, link].
 * The icon cell contains a raw unicode character from the JLR icon font
 * (e.g. U+E078 for configure). The block renders it with font-family: icons.
 *
 * Source HTML Pattern:
 * <section class="ready-to-go-bar jlr-section">
 *   <div class="jlr-grid__wrapper">
 *     <div class="jlr-grid jlr-grid--columns-4">
 *       <a href="..." class="ready-to-go-bar__item">
 *         <i class="ready-to-go-bar__icon jlr-icon icon-ignite-configure">
 *         <div class="ready-to-go-bar__cta"><span>Build your own</span></div>
 *       </a>
 *     </div>
 *   </div>
 * </section>
 *
 * Generated: 2026-03-04
 */
import { getIconGlyph } from '../utils/icon-map.js';

export default function parse(element, { document }) {
  const cells = [];

  const items = Array.from(element.querySelectorAll('.ready-to-go-bar__item'));

  items.forEach((item, index) => {
    const href = item.getAttribute('href');

    const ctaText = item.querySelector('.jlr-cta__text span, .jlr-cta__text, .ready-to-go-bar__cta span');
    const linkText = ctaText ? ctaText.textContent.trim() : '';

    const iconEl = item.querySelector('.ready-to-go-bar__icon');
    const glyph = getIconGlyph(iconEl, index);

    const link = document.createElement('a');
    link.href = href;
    link.textContent = linkText.toUpperCase();

    cells.push([glyph, [link]]);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'Floating Quicklinks', cells });
  element.replaceWith(block);
}
