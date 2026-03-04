/* eslint-disable */
/* global WebImporter */

/**
 * Section Metadata helpers
 *
 * Creates Section Metadata blocks from JLR theme CSS classes.
 * Theme mapping:
 *   jlr-section--dark-theme   → Style: dark
 *   jlr-section--light-theme  → Style: light
 *   jlr-section--grey-theme   → Style: disclaimer
 *   jlr-section--white-theme  → (no metadata needed, default)
 */

const THEME_MAP = {
  'jlr-section--dark-theme': 'dark',
  'jlr-section--light-theme': 'light',
  'jlr-section--grey-theme': 'disclaimer',
};

/**
 * Detect the theme class on a section element.
 * @param {Element} sectionEl
 * @returns {string|null} The JLR theme class, or null
 */
export function getThemeFromSection(sectionEl) {
  if (!sectionEl) return null;
  for (const cls of Object.keys(THEME_MAP)) {
    if (sectionEl.classList && sectionEl.classList.contains(cls)) return cls;
  }
  return null;
}

/**
 * Get the EDS style value for a theme class.
 * @param {string} themeClass
 * @returns {string|null}
 */
export function getStyleValue(themeClass) {
  return THEME_MAP[themeClass] || null;
}

/**
 * Create a Section Metadata block element.
 * @param {Document} document
 * @param {string} themeClass  One of the THEME_MAP keys
 * @returns {Element|null}     The block element, or null if white/default theme
 */
export function createSectionMetadata(document, themeClass) {
  const style = THEME_MAP[themeClass];
  if (!style) return null;

  const cells = [
    [['Style'], [style]],
  ];
  return WebImporter.Blocks.createBlock(document, { name: 'Section Metadata', cells });
}

/**
 * Create a Section Metadata block from a section element (auto-detects theme).
 * @param {Document} document
 * @param {Element} sectionEl
 * @returns {Element|null}
 */
export function createSectionMetadataFromElement(document, sectionEl) {
  const theme = getThemeFromSection(sectionEl);
  if (!theme) return null;
  return createSectionMetadata(document, theme);
}
