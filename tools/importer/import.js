/* eslint-disable */
/* global WebImporter */

/**
 * Land Rover Egypt — AEM Bulk Import Entry Point
 *
 * Detects page template from URL, dispatches to the appropriate
 * page transformer, and generates EDS-compliant document paths.
 *
 * Templates:
 *   Homepage              — /en/
 *   Vehicle Family (T2)   — /en/{family}/overview
 *   Vehicle Model  (T3)   — /en/{family}/{year}/{model}/overview
 */

import homepageTransform from './page-transformers/homepage.js';
import vehicleFamilyTransform from './page-transformers/vehicle-family-overview.js';
import vehicleModelTransform from './page-transformers/vehicle-model-overview.js';
import cleanupTransform from './transformers/landrover-cleanup.js';

/* ------------------------------------------------------------------ */
/*  Template detection                                                 */
/* ------------------------------------------------------------------ */

function detectTemplate(url) {
  const path = new URL(url).pathname.replace(/\/$/, '');
  const segments = path.split('/').filter(Boolean);

  // Homepage: /en or /en/
  if (segments.length <= 1) return 'homepage';

  // T2 Vehicle Family: /en/{family}/overview  (3 segments)
  if (segments.length === 3 && segments[2] === 'overview') {
    return 'vehicle-family-overview';
  }

  // T3 Vehicle Model: /en/{family}/{year}/{model}/overview  (5 segments)
  // Also handles longer paths like /en/range-rover/25my/range-rover/overview
  if (segments.length >= 4 && segments[segments.length - 1] === 'overview') {
    return 'vehicle-model-overview';
  }

  // Default to T3
  return 'vehicle-model-overview';
}

/* ------------------------------------------------------------------ */
/*  Pre-processing: extract __NUXT__ hotspot data from raw HTML        */
/* ------------------------------------------------------------------ */

/**
 * Extracts hotspot card data (headings/descriptions) from the __NUXT__
 * script in the raw HTML and injects it as data attributes on the
 * corresponding DOM elements. This is needed because:
 * - Card content is dynamic (loaded on click) and NOT in the static DOM
 * - The helix-importer strips <script> tags when creating the document
 * - The raw `html` string still contains the __NUXT__ IIFE
 */
function injectHotspotData(document, html) {
  if (!html) return;

  const hotspotContainers = Array.from(
    document.querySelectorAll('.jlr-hotspots-container')
  );
  if (hotspotContainers.length === 0) return;

  try {
    // Extract the __NUXT__ IIFE from raw HTML
    const match = html.match(/window\.__NUXT__\s*=\s*(\(function\([\s\S]*?\)\([\s\S]*?\)\))\s*;?\s*<\/script>/);
    if (!match) return;

    // Execute the IIFE to get the data object
    const nuxt = new Function('return ' + match[1])();
    if (!nuxt || !nuxt.data || !nuxt.data[0] || !nuxt.data[0].blocks) return;

    const blocks = nuxt.data[0].blocks;
    const nuxtHotspots = blocks.filter(
      (b) => b && b.attributes && b.attributes.key === 'jlr-hotspots-container'
    );

    hotspotContainers.forEach((container, idx) => {
      const nuxtBlock = nuxtHotspots[idx];
      if (nuxtBlock && nuxtBlock.attributes && nuxtBlock.attributes.field_groups) {
        const cards = nuxtBlock.attributes.field_groups.map((group) => {
          let heading = '';
          let paragraph = '';
          for (let fi = 0; fi < group.length; fi++) {
            const fkey = group[fi].key || group[fi].symbol || '';
            if (fkey === 'heading' && group[fi].value) heading = String(group[fi].value);
            if (fkey === 'paragraph' && group[fi].value) paragraph = String(group[fi].value);
          }
          return { heading, paragraph };
        });
        container.setAttribute('data-hotspot-cards', JSON.stringify(cards));
      }
    });
  } catch (e) {
    // Silent — positions and images will still be captured from the DOM
  }
}

/* ------------------------------------------------------------------ */
/*  Export for AEM Bulk Import Tool                                     */
/* ------------------------------------------------------------------ */

export default {
  /**
   * Apply DOM operations to the provided document and return
   * the root element to be then transformed to Markdown.
   */
  transformDOM({ document, url, html, params }) {
    // 0. Inject __NUXT__ hotspot data before cleanup strips elements
    injectHotspotData(document, html);

    // 1. Run cleanup (beforeTransform)
    cleanupTransform('beforeTransform', document.body, { document, url, html, params });

    // 2. Detect template
    const template = detectTemplate(url);

    // 3. Get main content container
    const main = document.querySelector('#rdx-render')
      || document.querySelector('.blocks-list')
      || document.querySelector('.jlr-content')
      || document.body;

    // 4. Dispatch to page transformer
    let result;
    switch (template) {
      case 'homepage':
        result = homepageTransform(main, document, url);
        break;
      case 'vehicle-family-overview':
        result = vehicleFamilyTransform(main, document, url);
        break;
      case 'vehicle-model-overview':
      default:
        result = vehicleModelTransform(main, document, url);
        break;
    }

    // 5. Run cleanup (afterTransform)
    cleanupTransform('afterTransform', result, { document, url, html, params });

    return result;
  },

  /**
   * Return a path that describes the document being transformed.
   */
  generateDocumentPath({ document, url }) {
    const u = new URL(url);
    let path = u.pathname.replace(/\/$/, '') || '/index';
    return WebImporter.FileUtils.sanitizePath(path);
  },
};
