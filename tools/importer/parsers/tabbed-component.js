/* eslint-disable */
/* global WebImporter */

/**
 * Parser for tabbed-component → structured per-tab data
 *
 * Source: .jlr-tabbed-component
 * Target Block: Edition Chooser (tabbed image + text block)
 *
 * Extracts structured data from injected __NUXT__ data attribute
 * (preferred) or falls back to DOM extraction (first tab only).
 *
 * Returns: [{ tabLabel, heading, paragraph, image, ctas: [{href, text}] }]
 *
 * Used by page transformer to build an Edition Chooser block table.
 */

/**
 * Clean paragraph HTML — strip tags, normalize whitespace,
 * convert <ul><li> to bullet lines and <br> to newlines.
 */
function cleanParagraph(html) {
  if (!html) return '';
  // Convert <li> items to bullet lines
  let text = html.replace(/<li[^>]*>/gi, '• ');
  // Convert <br> to newlines
  text = text.replace(/<br\s*\/?>/gi, '\n');
  // Strip remaining HTML tags
  text = text.replace(/<[^>]+>/g, '');
  // Clean up entities and whitespace
  text = text
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#x26;/gi, '&')
    .replace(/\u00a0/g, ' ');
  // Trim each line and remove empty lines
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line)
    .join('\n');
}

/**
 * Extract structured tabbed-component data from a section.
 * Returns an object: { tabs: [...], isEditionChooser: bool }
 *
 * tabs: [{ tabLabel, heading, paragraph, image (DOM element), ctas: [{href, text}] }]
 * isEditionChooser: true if tabs have heading+paragraph+image (edition pattern)
 */
export function extractTabbedComponentData(element, document) {
  const result = {
    tabs: [],
    isEditionChooser: false,
  };

  // Find the tabbed component root
  const tabbed = element.classList.contains('jlr-tabbed-component')
    ? element
    : element.querySelector('.jlr-tabbed-component');

  if (!tabbed) return result;

  // Prefer injected __NUXT__ data
  const injectedJson = tabbed.getAttribute('data-tabbed-component');
  if (injectedJson) {
    try {
      const data = JSON.parse(injectedJson);

      if (data.tabs && data.tabs.length > 0) {
        result.tabs = data.tabs.map((tab) => {
          const tabObj = {
            tabLabel: tab.tabLabel || '',
            heading: tab.heading || '',
            paragraph: cleanParagraph(tab.paragraph || ''),
            image: null,
            ctas: [],
          };

          if (tab.image) {
            const img = document.createElement('img');
            img.src = tab.image;
            img.alt = tab.heading || tab.tabLabel || '';
            tabObj.image = img;
          }

          if (tab.links && tab.links.length > 0) {
            tabObj.ctas = tab.links.map((link) => ({
              href: link.url || '',
              text: link.text || '',
            }));
          }

          return tabObj;
        });

        // Check if this is an edition chooser pattern
        // (has heading + paragraph + image for at least the first tab)
        const firstTab = result.tabs[0];
        result.isEditionChooser = !!(
          firstTab.heading && firstTab.paragraph && firstTab.image
        );
      }
    } catch (e) { /* fall through to DOM */ }
  }

  // DOM fallback — can only extract first/active tab
  if (result.tabs.length === 0) {
    const copyBox = tabbed.querySelector('.jlr-copy-box')
      || tabbed.querySelector('.jlr-tabbed-component__copy-box');

    const heading = copyBox
      ? (copyBox.querySelector('.jlr-copy-box__heading') || copyBox.querySelector('h2'))
      : null;

    const desc = copyBox
      ? (copyBox.querySelector('.jlr-copy-box__paragraph') || copyBox.querySelector('.jlr-paragraph'))
      : null;

    const img = tabbed.querySelector('.jlr-image-component img')
      || tabbed.querySelector('img');

    // Get tab labels from DOM navigation
    const tabButtons = Array.from(
      tabbed.querySelectorAll('.jlr-tabs__navigation button')
    );
    const activeLabel = tabButtons.length > 0 ? tabButtons[0].textContent.trim() : '';

    const tab = {
      tabLabel: activeLabel,
      heading: heading ? heading.textContent.trim() : '',
      paragraph: desc ? desc.textContent.trim() : '',
      image: null,
      ctas: [],
    };

    if (img) {
      const imgEl = document.createElement('img');
      imgEl.src = img.getAttribute('src');
      imgEl.alt = img.getAttribute('alt') || '';
      tab.image = imgEl;
    }

    // Extract CTAs
    const ctaContainer = copyBox || tabbed;
    const ctaLinks = Array.from(
      ctaContainer.querySelectorAll('a.jlr-button, a.jlr-cta')
    );
    tab.ctas = ctaLinks.map((link) => ({
      href: link.getAttribute('href'),
      text: link.textContent.trim(),
    }));

    if (tab.heading || tab.paragraph || tab.image) {
      result.tabs.push(tab);
      result.isEditionChooser = !!(tab.heading && tab.paragraph && tab.image);
    }
  }

  return result;
}
