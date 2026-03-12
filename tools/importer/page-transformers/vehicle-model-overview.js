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
import { extractElectrifyingPowerData } from '../parsers/electrifying-power.js';
import { extractTabbedComponentData } from '../parsers/tabbed-component.js';
import { extractBuildAndOrderData } from '../parsers/build-and-order.js';
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

    // Hotspot rows: position | heading + description | sub-image
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
        const span = document.createElement('span');
        span.innerHTML = card.paragraph;
        contentCell.push(span);
      }

      const imageCell = [];
      if (card.image) {
        const imgEl = document.createElement('img');
        imgEl.src = card.image;
        imgEl.alt = card.heading || '';
        imageCell.push(imgEl);
      }

      cells.push([
        [posText],
        contentCell.length > 0 ? contentCell : [''],
        imageCell.length > 0 ? imageCell : [''],
      ]);
    }
  });

  return WebImporter.Blocks.createBlock(document, { name: 'Hotspots', cells });
}

/* ------------------------------------------------------------------ */
/*  Helper: create combined Electrifying Power block                   */
/* ------------------------------------------------------------------ */

function createElectrifyingPowerBlock(document, epDataArray) {
  const cells = [];

  epDataArray.forEach((data) => {
    // Tab label row — <strong> marker (same as hotspots)
    if (data.tabLabel) {
      const strong = document.createElement('strong');
      strong.textContent = data.tabLabel;
      cells.push([[strong], [''], [''], ['']]);
    }

    // Stat card rows: tagline | value | unit | disclaimer
    // Use DOM spans to safely handle special chars like < in values
    data.stats.forEach((stat) => {
      const taglineSpan = document.createElement('span');
      taglineSpan.textContent = stat.tagline;
      const valueSpan = document.createElement('span');
      valueSpan.textContent = stat.value;
      const unitSpan = document.createElement('span');
      unitSpan.textContent = stat.unit;
      const disclaimerSpan = document.createElement('span');
      disclaimerSpan.textContent = stat.disclaimer;
      cells.push([
        [taglineSpan],
        [valueSpan],
        [unitSpan],
        [disclaimerSpan],
      ]);
    });

    // Heading row
    if (data.heading) {
      const h3 = document.createElement('h3');
      h3.textContent = data.heading;
      cells.push([[h3], [''], [''], ['']]);
    }

    // Description row
    if (data.paragraph) {
      const p = document.createElement('p');
      p.textContent = data.paragraph;
      cells.push([[p], [''], [''], ['']]);
    }

    // CTA rows
    data.ctas.forEach((cta) => {
      const a = document.createElement('a');
      a.href = cta.href;
      a.textContent = cta.text;
      cells.push([[a], [''], [''], ['']]);
    });

    // Image row
    if (data.image) {
      cells.push([[data.image], [''], [''], ['']]);
    }

    // Layout flag row
    if (data.isReversed) {
      cells.push([['reversed'], [''], [''], ['']]);
    }
  });

  return WebImporter.Blocks.createBlock(document, {
    name: 'Electrifying Power',
    cells,
  });
}

/* ------------------------------------------------------------------ */
/*  Helper: create Edition Chooser block from tabbed-component data    */
/* ------------------------------------------------------------------ */

function createEditionChooserBlock(document, tabsData) {
  const cells = [];

  tabsData.forEach((tab) => {
    // Tab label row — <strong> marker
    if (tab.tabLabel) {
      const strong = document.createElement('strong');
      strong.textContent = tab.tabLabel;
      cells.push([[strong]]);
    }

    // Image row
    if (tab.image) {
      cells.push([[tab.image]]);
    }

    // Heading row
    if (tab.heading) {
      const h3 = document.createElement('h3');
      h3.textContent = tab.heading;
      cells.push([[h3]]);
    }

    // Description row — use <ul> if paragraph contains bullet points
    if (tab.paragraph) {
      const lines = tab.paragraph.split('\n').filter((l) => l.trim());
      const hasBullets = lines.some((l) => l.startsWith('•') || l.startsWith('-'));

      if (hasBullets) {
        const ul = document.createElement('ul');
        lines.forEach((line) => {
          const li = document.createElement('li');
          li.textContent = line.replace(/^[•\-]\s*/, '').trim();
          ul.appendChild(li);
        });
        cells.push([[ul]]);
      } else {
        const p = document.createElement('p');
        p.textContent = tab.paragraph;
        cells.push([[p]]);
      }
    }

    // CTA rows
    tab.ctas.forEach((cta) => {
      const a = document.createElement('a');
      a.href = cta.href;
      a.textContent = cta.text;
      cells.push([[a]]);
    });
  });

  return WebImporter.Blocks.createBlock(document, {
    name: 'Edition Chooser',
    cells,
  });
}

/* ------------------------------------------------------------------ */
/*  Helper: create Build and Order block from extracted data            */
/* ------------------------------------------------------------------ */

function createBuildAndOrderBlock(document, boData) {
  const cells = [];

  boData.models.forEach((model) => {
    // Model group header row: h3 in col1, col2 empty
    if (model.name) {
      const h3 = document.createElement('h3');
      h3.textContent = model.name;
      cells.push([[h3], ['']]);
    }

    // Trim rows: label in col1, image in col2
    model.trims.forEach((trim) => {
      const labelCell = [];
      if (trim.label) {
        const strong = document.createElement('strong');
        strong.textContent = trim.label;
        labelCell.push(strong);
      }
      const imageCell = [];
      if (trim.image) {
        const img = document.createElement('img');
        img.src = trim.image;
        img.alt = trim.label || '';
        imageCell.push(img);
      }
      cells.push([labelCell, imageCell]);
    });
  });

  // CTA row: primary in col1, secondary in col2
  const primaryCtas = boData.ctas.filter((c) => c.primary);
  const secondaryCtas = boData.ctas.filter((c) => !c.primary);
  const col1 = [];
  primaryCtas.forEach((cta) => {
    const a = document.createElement('a');
    a.href = cta.href;
    a.textContent = cta.text;
    const strong = document.createElement('strong');
    strong.appendChild(a);
    col1.push(strong);
  });
  const col2 = [];
  secondaryCtas.forEach((cta) => {
    const a = document.createElement('a');
    a.href = cta.href;
    a.textContent = cta.text;
    col2.push(a);
  });
  if (col1.length > 0 || col2.length > 0) {
    cells.push([col1.length > 0 ? col1 : [''], col2.length > 0 ? col2 : ['']]);
  }

  return WebImporter.Blocks.createBlock(document, {
    name: 'Build And Order',
    cells,
  });
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

  // Find the source <p> that contains the full disclaimer with inline formatting
  const sourceP = disclaimer.querySelector('.jlr-paragraph p') || disclaimer.querySelector('p');
  if (!sourceP) {
    // Fallback: grab plain text if no <p> found
    const text = disclaimer.textContent.trim();
    if (text) elements.push(createParagraph(document, text));
    return elements;
  }

  // Split the single <p> on double <br> boundaries into separate paragraphs,
  // preserving inline elements: <sup>, <sub>, <a>, and text nodes.
  const childNodes = Array.from(sourceP.childNodes);
  let currentP = document.createElement('p');

  const flushParagraph = () => {
    if (currentP.childNodes.length > 0 && currentP.textContent.trim()) {
      elements.push(currentP);
    }
    currentP = document.createElement('p');
  };

  let prevWasBr = false;
  for (const node of childNodes) {
    const isBr = node.nodeName === 'BR';
    if (isBr && prevWasBr) {
      // Double <br> = paragraph break — flush current paragraph
      flushParagraph();
      prevWasBr = false;
      continue;
    }
    if (prevWasBr) {
      // Single <br> that wasn't followed by another — keep it as a line break
      currentP.appendChild(document.createElement('br'));
    }
    if (isBr) {
      prevWasBr = true;
      continue;
    }
    prevWasBr = false;

    // Clone inline elements (sup, sub, a) or text nodes into current paragraph
    if (node.nodeType === 3) { // TEXT_NODE
      currentP.appendChild(document.createTextNode(node.textContent));
    } else if (node.nodeType === 1) { // ELEMENT_NODE
      currentP.appendChild(node.cloneNode(true));
    }
  }
  flushParagraph();

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
  let pendingEP = [];           // Accumulated electrifying-power data for combined block

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
      // Check if this is a build-and-order model switcher
      const boAttr = renderBlock.getAttribute('data-build-and-order')
        || section.getAttribute('data-build-and-order');
      if (boAttr) {
        try {
          const boData = JSON.parse(boAttr);
          if (boData.models && boData.models.length > 0) {
            // Flush pending snippet as section heading
            if (pendingSnippet) {
              pendingSnippet.forEach((el) => output.appendChild(el));
              pendingSnippet = null;
            }
            const boBlock = createBuildAndOrderBlock(document, boData);
            output.appendChild(boBlock);
            output.appendChild(createHr(document));
            // Skip the subsequent tabbed-component blocks that belong to this B&O
            // (they are the trim choosers controlled by this tab-nav)
            let skip = i + 1;
            while (skip < renderBlocks.length) {
              const nextSection = renderBlocks[skip].querySelector(':scope > section')
                || renderBlocks[skip].querySelector('section');
              if (nextSection && nextSection.querySelector('.jlr-tabbed-component')) {
                skip++;
              } else {
                break;
              }
            }
            // Also skip the CTA snippet that follows
            if (skip < renderBlocks.length) {
              const nextSection = renderBlocks[skip].querySelector(':scope > section')
                || renderBlocks[skip].querySelector('section');
              if (nextSection && nextSection.querySelector('.jlr-snippet') && !nextSection.querySelector('.jlr-snippet--disclaimer')) {
                skip++;
              }
            }
            i = skip - 1; // -1 because the for loop increments
            continue;
          }
        } catch (e) { /* fall through to normal tab-nav handling */ }
      }
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

    // Flush accumulated electrifying-power as a combined block
    if (blockType !== 'electrifying-power' && pendingEP.length > 0) {
      const epBlock = createElectrifyingPowerBlock(document, pendingEP);
      output.appendChild(epBlock);
      output.appendChild(createHr(document));
      pendingEP = [];
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
        const epData = extractElectrifyingPowerData(section, document);
        epData.tabLabel = pendingTabLabels.shift() || '';
        pendingEP.push(epData);
        continue; // Don't add to output yet — flushed when next non-EP block
      }

      case 'tabbed-component': {
        // Check if this is a build-and-order single-model case
        const boAttr = renderBlock.getAttribute('data-build-and-order')
          || section.getAttribute('data-build-and-order');
        if (boAttr) {
          try {
            const boData = JSON.parse(boAttr);
            if (boData.models && boData.models.length > 0) {
              const boBlock = createBuildAndOrderBlock(document, boData);
              blockElements = [boBlock];
              // Skip the CTA snippet that follows
              if (i + 1 < renderBlocks.length) {
                const nextSection = renderBlocks[i + 1].querySelector(':scope > section')
                  || renderBlocks[i + 1].querySelector('section');
                if (nextSection && nextSection.querySelector('.jlr-snippet') && !nextSection.querySelector('.jlr-snippet--disclaimer')) {
                  i++; // skip CTA snippet
                }
              }
              break;
            }
          } catch (e) { /* fall through */ }
        }

        const tcData = extractTabbedComponentData(section, document);
        if (tcData.isEditionChooser && tcData.tabs.length > 0) {
          const ecBlock = createEditionChooserBlock(document, tcData.tabs);
          blockElements = [ecBlock];
        }
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

  // Flush any remaining accumulated electrifying-power
  if (pendingEP.length > 0) {
    const epBlock = createElectrifyingPowerBlock(document, pendingEP);
    output.appendChild(epBlock);
    output.appendChild(createHr(document));
  }

  // Append page Metadata block
  const metadataBlock = createMetadataBlock(document);
  if (metadataBlock) {
    output.appendChild(metadataBlock);
  }

  return output;
}
