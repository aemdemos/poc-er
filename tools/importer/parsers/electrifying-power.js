/* eslint-disable */
/* global WebImporter */

/**
 * Parser for electrifying-power → structured stat-card data
 *
 * Source: .jlr-electrifying-power
 * Target Block: Electrifying Power (custom tabbed block)
 *
 * Extracts structured data from injected __NUXT__ data attribute
 * (preferred) or falls back to DOM extraction.
 *
 * Returns: { heading, paragraph, isReversed, image, imageAlt, stats[], ctas[] }
 *
 * Used by page transformer to combine multiple EP sections into
 * a single tabbed block (same pattern as hotspots).
 */

/**
 * Parse the title HTML from __NUXT__: "<span>360</span>PS<sup>*</sup>"
 * Returns { value, unit }
 */
function parseTitleHtml(titleHtml) {
  if (!titleHtml) return { value: '', unit: '' };

  const spanMatch = titleHtml.match(/<span[^>]*>([\s\S]*?)<\/span>/);
  if (spanMatch) {
    const value = spanMatch[1].trim();
    // Everything after </span>
    let rest = titleHtml.substring(titleHtml.indexOf('</span>') + 7);
    // Strip HTML tags but keep text content (including sup content inline)
    rest = rest.replace(/<sup[^>]*>([\s\S]*?)<\/sup>/g, '$1');
    rest = rest.replace(/<[^>]+>/g, '').trim();
    return { value, unit: rest };
  }

  // Fallback: raw text, try to split at digit/letter boundary
  const text = titleHtml.replace(/<[^>]+>/g, '').trim();
  const match = text.match(/^([\d,.]+)\s*(.*)/);
  if (match) {
    return { value: match[1], unit: match[2] };
  }
  return { value: text, unit: '' };
}

/**
 * Decode common HTML entities to plain text
 */
function decodeEntities(text) {
  if (!text) return '';
  return text
    .replace(/&nbsp;/gi, ' ')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&amp;/gi, '&')
    .replace(/&#x26;/gi, '&')
    .replace(/\u00a0/g, ' ');
}

/**
 * Clean disclaimer HTML — strip tags, keep text
 */
function cleanDisclaimer(html) {
  if (!html) return '';
  return html
    .replace(/<sup[^>]*>([\s\S]*?)<\/sup>/g, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\u00a0/g, ' ')
    .trim();
}

/**
 * Clean paragraph HTML — strip tags but preserve text
 */
function cleanParagraph(html) {
  if (!html) return '';
  return html
    .replace(/<sub[^>]*>([\s\S]*?)<\/sub>/g, '$1')
    .replace(/<sup[^>]*>([\s\S]*?)<\/sup>/g, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\u00a0/g, ' ')
    .trim();
}

/**
 * Extract structured electrifying-power data from a single section.
 * Called by the page transformer to accumulate multiple sections.
 */
export function extractElectrifyingPowerData(element, document) {
  const result = {
    heading: '',
    paragraph: '',
    isReversed: false,
    image: null,
    stats: [],
    ctas: [],
  };

  // Prefer injected __NUXT__ data
  const injectedJson = element.getAttribute('data-electrifying-power');
  if (injectedJson) {
    try {
      const data = JSON.parse(injectedJson);
      result.heading = data.heading || '';
      result.paragraph = cleanParagraph(data.paragraph || '');
      result.isReversed = !!data.isReversed;

      if (data.image) {
        const img = document.createElement('img');
        img.src = data.image;
        img.alt = data.imageAlt || result.heading || '';
        result.image = img;
      }

      result.stats = (data.stats || []).map((stat) => {
        const { value, unit } = parseTitleHtml(stat.title);
        return {
          tagline: decodeEntities((stat.tagline || '').replace(/<[^>]+>/g, '').trim()),
          value: decodeEntities(value),
          unit: decodeEntities(unit),
          disclaimer: cleanDisclaimer(stat.disclaimer),
        };
      });
    } catch (e) { /* fall through to DOM */ }
  }

  // DOM fallback for stats
  if (result.stats.length === 0) {
    const items = Array.from(element.querySelectorAll('[class*="electrifying-power__item"]'));
    result.stats = items.map((item) => {
      const taglineEl = item.querySelector('[class*="tagline"]');
      const titleEl = item.querySelector('[class*="title"]');
      const disclaimerEl = item.querySelector('[class*="disclaimer"]');

      const titleText = titleEl ? titleEl.textContent.trim().replace(/\s+/g, '') : '';
      const valMatch = titleText.match(/^([\d,.]+)(.*)/);

      return {
        tagline: taglineEl ? taglineEl.textContent.trim() : '',
        value: valMatch ? valMatch[1] : titleText,
        unit: valMatch ? valMatch[2] : '',
        disclaimer: disclaimerEl ? disclaimerEl.textContent.trim() : '',
      };
    }).filter((s) => s.tagline || s.value);
  }

  // DOM fallback for heading
  if (!result.heading) {
    const h = element.querySelector('.jlr-column-template__heading')
      || element.querySelector('.jlr-electrifying-power__copy h2');
    if (h) result.heading = h.textContent.trim();
  }

  // DOM fallback for paragraph
  if (!result.paragraph) {
    const p = element.querySelector('.jlr-column-template__paragraph');
    if (p) result.paragraph = p.textContent.trim();
  }

  // DOM fallback for image
  if (!result.image) {
    const img = element.querySelector('.jlr-electrifying-power__image img')
      || element.querySelector('picture img');
    if (img) {
      const imgEl = document.createElement('img');
      imgEl.src = img.getAttribute('src');
      imgEl.alt = img.getAttribute('alt') || '';
      result.image = imgEl;
    }
  }

  // DOM fallback for reversed layout
  if (!result.isReversed) {
    const copyEl = element.querySelector('.jlr-electrifying-power__copy');
    const imageEl = element.querySelector('.jlr-electrifying-power__image');
    if (copyEl && imageEl) {
      const position = copyEl.compareDocumentPosition(imageEl);
      // eslint-disable-next-line no-bitwise
      result.isReversed = !(position & Node.DOCUMENT_POSITION_FOLLOWING);
    }
  }

  // Extract CTAs from DOM
  const ctaLinks = Array.from(element.querySelectorAll(
    '.jlr-column-template__link a, .jlr-electrifying-power__copy a.jlr-cta, .jlr-electrifying-power__copy a.jlr-button'
  ));
  result.ctas = ctaLinks.map((link) => ({
    href: link.getAttribute('href'),
    text: link.textContent.trim(),
  }));

  return result;
}
