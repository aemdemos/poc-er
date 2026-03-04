/* eslint-disable */
/* global WebImporter */

/**
 * Page Metadata block creator
 *
 * Extracts <meta> tags from <head> and creates the Metadata block
 * that appears at the bottom of every EDS page.
 *
 * Output:
 *   | **Metadata** | |
 *   | title | Page Title |
 *   | description | Meta description |
 *   | og:image | https://cdn.example.com/image.jpg |
 */

/**
 * Create the page Metadata block from document head.
 * @param {Document} document
 * @returns {Element}
 */
export function createMetadataBlock(document) {
  const cells = [];

  // Title
  const title = document.querySelector('title');
  if (title && title.textContent.trim()) {
    cells.push([['title'], [title.textContent.trim()]]);
  }

  // Description
  const desc = document.querySelector('meta[name="description"]');
  if (desc && desc.getAttribute('content')) {
    cells.push([['description'], [desc.getAttribute('content')]]);
  }

  // Open Graph image
  const ogImage = document.querySelector('meta[property="og:image"]');
  if (ogImage && ogImage.getAttribute('content')) {
    cells.push([['og:image'], [ogImage.getAttribute('content')]]);
  }

  return WebImporter.Blocks.createBlock(document, { name: 'Metadata', cells });
}
