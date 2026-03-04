/* eslint-disable */

/**
 * Removes non-content elements that should be stripped during import.
 * Used for: .jlr-in-page-navigation, .jlr-html-box (iframe embeds),
 * standalone .jlr-tabs navigation sections.
 *
 * @param {Element} element  The element to remove
 */
export default function parse(element) {
  element.remove();
}
