/* eslint-disable */
/* global WebImporter */

/**
 * Vehicle Model Overview (T3) page transformer
 *
 * Handles 9 vehicle model pages:
 *   Defender 110/90/130, Discovery, Discovery Sport,
 *   Range Rover, Range Rover Sport, Range Rover Evoque, Range Rover Velar
 *
 * Walks .rdx-render-block sections, identifies block types by CSS class,
 * calls the appropriate parser, and builds the final DOM structure with
 * section metadata and section separators.
 */

import heroParser from '../parsers/hero.js';
import floatingQuicklinksParser from '../parsers/floating-quicklinks.js';
import heroImageCarouselParser from '../parsers/hero-image-carousel.js';
import imageBoxParser from '../parsers/image-box.js';
import cardsParser from '../parsers/cards.js';
import carouselParser from '../parsers/carousel.js';
import columnsParser from '../parsers/columns.js';
import { extractHotspotData } from '../parsers/hotspots.js';
import electrifyingPowerParser from '../parsers/electrifying-power.js';
import tabbedComponentParser from '../parsers/tabbed-component.js';
import { createSectionMetadata, getStyleValue } from '../parsers/section-metadata.js';
import { createMetadataBlock } from '../parsers/metadata.js';

/* ------------------------------------------------------------------ */
/*  Block type identification                                          */
/* ------------------------------------------------------------------ */

function getBlockType(section) {
  if (!section) return 'unknown';
  const cls = section.className || '';

  // Order matters: more specific checks first
  if (cls.includes('jlr-immersive-hero')) return 'hero';
  if (cls.includes('ready-to-go-bar')) return 'floating-quicklinks';
  if (cls.includes('jlr-in-page-navigation')) return 'remove';
  if (cls.includes('jlr-html-box')) return 'remove';
  if (cls.includes('jlr-hero-slider-wrapper')) return 'hero-image-carousel';
  if (cls.includes('jlr-dual-frame-carousel')) return 'carousel';
  if (cls.includes('jlr-hotspots-container')) return 'hotspots';
  if (cls.includes('jlr-electrifying-power')) return 'electrifying-power';
  if (cls.includes('jlr-masonry-block')) return 'columns-masonry';
  if (cls.includes('jlr-collection-carousel')) return 'cards-collection';

  // Check for nested elements
  if (section.querySelector('.jlr-image-box-holder') || section.querySelector('.jlr-image-box')) return 'image-box';
  if (section.querySelector('.jlr-content-blocks')) return 'cards';
  if (section.querySelector('.jlr-tabbed-component')) return 'tabbed-component';

  // Snippet sections (headings, disclaimers, default content)
  const snippet = section.querySelector('.jlr-snippet');
  if (snippet) {
    if (snippet.classList.contains('jlr-snippet--disclaimer') || section.querySelector('.jlr-snippet--disclaimer')) {
      return 'disclaimer';
    }
    return 'snippet';
  }

  // Tab navigation (standalone .jlr-tabs without tabbed-component)
  if (cls.includes('jlr-tabs') || section.querySelector('.jlr-tabs__navigation')) return 'tab-nav';

  return 'unknown';
}

/**
 * Get theme class from a section element
 */
function getTheme(section) {
  const cls = section.className || '';
  if (cls.includes('jlr-section--dark-theme')) return 'jlr-section--dark-theme';
  if (cls.includes('jlr-section--light-theme')) return 'jlr-section--light-theme';
  if (cls.includes('jlr-section--grey-theme')) return 'jlr-section--grey-theme';
  return null; // white/default = no section metadata
}

/* ------------------------------------------------------------------ */
/*  Helper: call a parser safely                                       */
/* ------------------------------------------------------------------ */

/**
 * Wraps a section in a temporary parent, calls the parser,
 * and returns the resulting element(s).
 */
function callParser(parser, section, document) {
  const wrapper = document.createElement('div');
  wrapper.appendChild(section);
  parser(section, { document });
  // Parser replaced section with block via replaceWith
  // Return all children of wrapper (usually just the block)
  return Array.from(wrapper.childNodes);
}

/* ------------------------------------------------------------------ */
/*  Helper: create elements                                            */
/* ------------------------------------------------------------------ */

function createHr(document) {
  return document.createElement('hr');
}

function createHeading(document, text, level) {
  const h = document.createElement(`h${level}`);
  h.textContent = text;
  return h;
}

function createParagraph(document, text) {
  const p = document.createElement('p');
  p.textContent = text;
  return p;
}

function createLink(document, href, text) {
  const a = document.createElement('a');
  a.href = href;
  a.textContent = text;
  return a;
}

/* ------------------------------------------------------------------ */
/*  Helper: create combined Hotspots block from accumulated data       */
/* ------------------------------------------------------------------ */

function createHotspotsBlock(document, hotspotsData) {
  const cells = [];

  hotspotsData.forEach((data) => {
    // Tab label row (e.g. EXTERIOR / INTERIOR)
    if (data.tabLabel) {
      const strong = document.createElement('strong');
      strong.textContent = data.tabLabel;
      cells.push([[strong], ['']]);
    }

    // Image row
    if (data.img) {
      cells.push([[data.img], ['']]);
    }

    // Hotspot rows: position | heading + description
    const count = Math.max(data.positions.length, data.cards.length);
    for (let i = 0; i < count; i++) {
      const pos = data.positions[i] || { top: '0', left: '0' };
      const card = data.cards[i] || {};

      const posText = `${pos.top}, ${pos.left}`;

      const contentCell = [];
      if (card.heading) {
        const strong = document.createElement('strong');
        strong.textContent = card.heading;
        contentCell.push(strong);
      }
      if (card.paragraph) {
        if (contentCell.length > 0) {
          contentCell.push(document.createElement('br'));
        }
        contentCell.push(card.paragraph);
      }

      cells.push([[posText], contentCell.length > 0 ? contentCell : ['']]);
    }
  });

  return WebImporter.Blocks.createBlock(document, { name: 'Hotspots', cells });
}

/* ------------------------------------------------------------------ */
/*  Helper: extract snippet content as default content                 */
/* ------------------------------------------------------------------ */

function extractSnippetContent(section, document) {
  const elements = [];

  const snippet = section.querySelector('.jlr-snippet');
  if (!snippet) return elements;

  // Extract heading
  const heading = snippet.querySelector('.jlr-snippet__heading');
  if (heading) {
    elements.push(createHeading(document, heading.textContent.trim(), 2));
  }

  // Extract paragraph
  const paragraph = snippet.querySelector('.jlr-snippet__paragraph');
  if (paragraph) {
    elements.push(createParagraph(document, paragraph.textContent.trim()));
  }

  // Extract CTA buttons
  const buttons = Array.from(snippet.querySelectorAll('.jlr-snippet__button, .jlr-snippet__container-buttons a'));
  buttons.forEach((btn) => {
    elements.push(createLink(document, btn.getAttribute('href'), btn.textContent.trim()));
  });

  return elements;
}

/* ------------------------------------------------------------------ */
/*  Helper: extract disclaimer content                                 */
/* ------------------------------------------------------------------ */

function extractDisclaimerContent(section, document) {
  const elements = [];

  const disclaimer = section.querySelector('.jlr-snippet--disclaimer');
  if (!disclaimer) return elements;

  const paragraphs = Array.from(disclaimer.querySelectorAll('.jlr-paragraph p, .jlr-paragraph'));
  paragraphs.forEach((p) => {
    const text = p.textContent.trim();
    if (text) {
      elements.push(createParagraph(document, text));
    }
  });

  // If no paragraphs found, try to get text directly
  if (elements.length === 0) {
    const text = disclaimer.textContent.trim();
    if (text) {
      elements.push(createParagraph(document, text));
    }
  }

  return elements;
}

/* ------------------------------------------------------------------ */
/*  Helper: parse collection carousel as Cards                         */
/* ------------------------------------------------------------------ */

function parseCollectionCarousel(section, document) {
  const cells = [];

  const slides = Array.from(
    section.querySelectorAll('.jlr-collection-carousel__slide')
  ).filter((s) => !s.classList.contains('swiper-slide-duplicate'));

  slides.forEach((slide) => {
    const img = slide.querySelector('.jlr-collection-card__image img') || slide.querySelector('img');
    const title = slide.querySelector('.jlr-collection-card__description-title');
    const desc = slide.querySelector('.jlr-collection-card__description-text');

    const imageCell = [];
    if (img) {
      const imgEl = document.createElement('img');
      imgEl.src = img.getAttribute('src');
      imgEl.alt = img.getAttribute('alt') || '';
      imageCell.push(imgEl);
    }

    const textCell = [];
    if (title) {
      const strong = document.createElement('strong');
      strong.textContent = title.textContent.trim();
      textCell.push(strong);
    }
    if (desc) {
      textCell.push(desc.textContent.trim());
    }

    cells.push([imageCell, textCell]);
  });

  return WebImporter.Blocks.createBlock(document, { name: 'Cards', cells });
}

/* ------------------------------------------------------------------ */
/*  Main transformer                                                   */
/* ------------------------------------------------------------------ */

export default function transform(main, document, url) {
  const output = document.createElement('div');

  // Find all rdx-render-block containers
  const renderBlocks = Array.from(main.querySelectorAll('.rdx-render-block'));

  let pendingSnippet = null;    // Buffered snippet heading for next section
  let pendingTabLabels = [];    // Tab labels from preceding tab-nav
  let pendingHotspots = [];     // Accumulated hotspot data for combined block

  for (let i = 0; i < renderBlocks.length; i++) {
    const renderBlock = renderBlocks[i];

    // Process ALL rdx-render-block--tab elements (both active and inactive).
    // Inactive tabs have visibility:hidden + height:0 but full DOM content.
    // The parsers extract content from the DOM regardless of CSS visibility.

    const section = renderBlock.querySelector(':scope > section')
      || renderBlock.querySelector('section');
    if (!section) continue;

    const blockType = getBlockType(section);
    const theme = getTheme(section);

    // Skip elements that should be removed
    if (blockType === 'remove') continue;

    // Capture tab labels from tab navigation (used by subsequent hotspot blocks)
    if (blockType === 'tab-nav') {
      const buttons = Array.from(
        section.querySelectorAll('.jlr-tabs__navigation button')
      );
      pendingTabLabels = buttons.map((b) => b.textContent.trim());
      continue;
    }

    // Handle snippets (section headings) — buffer them
    if (blockType === 'snippet') {
      pendingSnippet = extractSnippetContent(section, document);
      continue;
    }

    // Flush accumulated hotspots as a combined Hotspots block
    if (blockType !== 'hotspots' && pendingHotspots.length > 0) {
      const hotspotBlock = createHotspotsBlock(document, pendingHotspots);
      output.appendChild(hotspotBlock);
      output.appendChild(createHr(document));
      pendingHotspots = [];
    }

    // Add pending snippet heading before the current block
    if (pendingSnippet) {
      // If previous section ended with <hr>, the snippet is part of the new section
      pendingSnippet.forEach((el) => output.appendChild(el));
      pendingSnippet = null;
    }

    // Process the block based on type
    let blockElements = [];

    switch (blockType) {
      case 'hero': {
        const nodes = callParser(heroParser, section, document);
        blockElements = nodes;
        break;
      }

      case 'floating-quicklinks': {
        const nodes = callParser(floatingQuicklinksParser, section, document);
        blockElements = nodes;
        break;
      }

      case 'image-box': {
        const nodes = callParser(imageBoxParser, section, document);
        blockElements = nodes;
        break;
      }

      case 'cards': {
        const nodes = callParser(cardsParser, section, document);
        blockElements = nodes;
        break;
      }

      case 'cards-collection': {
        const block = parseCollectionCarousel(section, document);
        blockElements = [block];
        break;
      }

      case 'hero-image-carousel': {
        const nodes = callParser(heroImageCarouselParser, section, document);
        blockElements = nodes;
        break;
      }

      case 'carousel': {
        const nodes = callParser(carouselParser, section, document);
        blockElements = nodes;
        break;
      }

      case 'columns-masonry': {
        const nodes = callParser(columnsParser, section, document);
        blockElements = nodes;
        break;
      }

      case 'hotspots': {
        // Extract full hotspot data (image, positions, cards)
        const hotspotData = extractHotspotData(section, document);
        hotspotData.tabLabel = pendingTabLabels.shift() || '';
        pendingHotspots.push(hotspotData);
        continue; // Don't add to output yet — flushed when next non-hotspot block
      }

      case 'electrifying-power': {
        const nodes = callParser(electrifyingPowerParser, section, document);
        blockElements = nodes;
        break;
      }

      case 'tabbed-component': {
        const nodes = callParser(tabbedComponentParser, section, document);
        blockElements = nodes;
        break;
      }

      case 'disclaimer': {
        const disclaimerElements = extractDisclaimerContent(section, document);
        disclaimerElements.forEach((el) => output.appendChild(el));

        // Add Section Metadata: disclaimer
        const disclaimerMeta = createSectionMetadata(document, 'jlr-section--grey-theme');
        if (disclaimerMeta) {
          output.appendChild(disclaimerMeta);
        }
        output.appendChild(createHr(document));
        continue;
      }

      default:
        continue;
    }

    // Append block elements to output
    blockElements.forEach((el) => output.appendChild(el));

    // Add Section Metadata if theme is not white/default
    if (theme) {
      const style = getStyleValue(theme);
      if (style) {
        const sectionMeta = createSectionMetadata(document, theme);
        if (sectionMeta) {
          output.appendChild(sectionMeta);
        }
      }
    }

    // Add section separator
    output.appendChild(createHr(document));
  }

  // Flush any remaining accumulated hotspots
  if (pendingHotspots.length > 0) {
    const hotspotBlock = createHotspotsBlock(document, pendingHotspots);
    output.appendChild(hotspotBlock);
    output.appendChild(createHr(document));
  }

  // Append page Metadata block
  const metadataBlock = createMetadataBlock(document);
  if (metadataBlock) {
    output.appendChild(metadataBlock);
  }

  return output;
}
