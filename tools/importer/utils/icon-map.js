/* eslint-disable */

/**
 * Maps JLR source icon CSS classes to their unicode glyph characters.
 *
 * Source:  <i class="ready-to-go-bar__icon jlr-icon icon-ignite-configure">
 * Output:  The raw unicode character (e.g. '\ue078')
 *
 * The glyph is dropped directly into the document so the block can
 * render it with font-family: icons — no SVGs, no per-icon CSS rules.
 */

const ICON_MAP = {
  'icon-ignite-configure': '\ue078',
  'icon-ignite-drive':     '\ue079',
  'icon-phone':            '\ue0c2',
  'icon-map-pin':          '\ue092',
  'icon-thumbnail_view':   '\ue11c',
  'icon-driveonroad':      '\ue056',
  'icon-finance-calculator': '\ue069',
  'icon-email':            '\ue05b',
  'icon-request-quote-dollar': '\ue0dd',
  'icon-envelope':         '\ue05b',
  'icon-calculator':       '\ue069',
  'icon-bookmark':         '\ue076',
  'icon-ignite-brochure':  '\ue076',
  'icon-ignite-inform':    '\ue07b',
};

/**
 * Return the unicode glyph character for a JLR icon element.
 * Falls back to a positional guess if no CSS class matches.
 *
 * @param {Element} iconElement  The <i> element with icon classes
 * @param {number}  index        Position in the quicklinks bar (0-based)
 * @returns {string} The unicode character for the icon
 */
export function getIconGlyph(iconElement, index) {
  if (iconElement) {
    for (const [cssClass, glyph] of Object.entries(ICON_MAP)) {
      if (iconElement.classList.contains(cssClass)) return glyph;
    }
  }

  // Positional fallback: configure / phone / drive / map-pin
  const fallback = ['\ue078', '\ue0c2', '\ue079', '\ue092'];
  return fallback[index] || '';
}
