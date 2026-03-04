/* eslint-disable */

/**
 * Maps JLR source icon CSS classes to EDS Floating Quicklinks icon tokens.
 *
 * Source:  <i class="ready-to-go-bar__icon jlr-icon icon-ignite-configure">
 * Output:  :configure:
 */

const ICON_MAP = {
  'icon-ignite-configure': 'configure',
  'icon-ignite-drive': 'steering-wheel',
  'icon-phone': 'steering-wheel',
  'icon-map-pin': 'envelope',
  'icon-thumbnail_view': 'calculator',
  'icon-request-quote-dollar': 'envelope',
  'icon-envelope': 'envelope',
  'icon-calculator': 'calculator',
  'icon-bookmark': 'envelope',
};

/**
 * Determine the EDS icon token from a JLR icon element.
 * Falls back to positional mapping if no CSS class match.
 *
 * @param {Element} iconElement  The <i> element with icon classes
 * @param {number}  index        Position in the quicklinks bar (0-based)
 * @returns {string} EDS icon token name (without colons)
 */
export function getIconName(iconElement, index) {
  if (iconElement) {
    for (const [cssClass, edsName] of Object.entries(ICON_MAP)) {
      if (iconElement.classList.contains(cssClass)) return edsName;
    }
  }

  // Positional fallback: Build / Test Drive / Callback / Find Retailer
  const positionalMap = ['configure', 'steering-wheel', 'calculator', 'envelope'];
  return positionalMap[index] || 'link';
}
