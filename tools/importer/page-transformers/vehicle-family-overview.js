/* eslint-disable */
/* global WebImporter */

/**
 * Vehicle Family Overview (T2) page transformer
 *
 * Handles 2 vehicle family pages:
 *   /en/defender/overview
 *   /en/discovery/overview
 *
 * T2 pages use the same block types as T3 (vehicle model overview):
 *   Hero, Cards, Carousel, Hero Image Carousel, Columns (masonry),
 *   Floating Quicklinks, snippets, disclaimers, Section Metadata, Metadata
 *
 * Since the DOM structure and block patterns are identical,
 * this transformer delegates to the T3 transformer.
 */

import vehicleModelTransform from './vehicle-model-overview.js';

export default function transform(main, document, url) {
  return vehicleModelTransform(main, document, url);
}
