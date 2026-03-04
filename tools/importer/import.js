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
/*  Export for AEM Bulk Import Tool                                     */
/* ------------------------------------------------------------------ */

export default {
  /**
   * Apply DOM operations to the provided document and return
   * the root element to be then transformed to Markdown.
   */
  transformDOM({ document, url, html, params }) {
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
