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
          let image = '';
          for (let fi = 0; fi < group.length; fi++) {
            const fkey = group[fi].key || group[fi].symbol || '';
            if (fkey === 'heading' && group[fi].value) heading = String(group[fi].value);
            if (fkey === 'paragraph' && group[fi].value) paragraph = String(group[fi].value);
            if (fkey === 'rdx-image' && group[fi].value) {
              try {
                const imgVal = typeof group[fi].value === 'string'
                  ? JSON.parse(group[fi].value)
                  : group[fi].value;
                if (imgVal && imgVal.id) {
                  image = `https://media.cdn-jaguarlandrover.com/api/v2/images/${imgVal.id}/w/1600/h/900.jpg`;
                }
              } catch (e) { /* ignore */ }
            }
          }
          return { heading, paragraph, image };
        });
        container.setAttribute('data-hotspot-cards', JSON.stringify(cards));
      }
    });
  } catch (e) {
    // Silent — positions and images will still be captured from the DOM
  }
}

/* ------------------------------------------------------------------ */
/*  Pre-processing: extract __NUXT__ electrifying-power data             */
/* ------------------------------------------------------------------ */

/**
 * Extracts structured stat-card data from the __NUXT__ script for
 * electrifying-power blocks and injects it as data attributes.
 *
 * Data model per block:
 *   attributes.fields[] — array of {symbol, value} for heading, paragraph, rdx-image, is_reversed
 *   attributes.field_groups[] — array of stat-card groups, each [{symbol, value}]
 *     symbol: tagline, title (<span>NUM</span>UNIT<sup>*</sup>), disclaimer
 */
function injectElectrifyingPowerData(document, html) {
  if (!html) return;

  const containers = Array.from(
    document.querySelectorAll('.jlr-electrifying-power')
  );
  if (containers.length === 0) return;

  try {
    const match = html.match(/window\.__NUXT__\s*=\s*(\(function\([\s\S]*?\)\([\s\S]*?\)\))\s*;?\s*<\/script>/);
    if (!match) return;

    const nuxt = new Function('return ' + match[1])();
    if (!nuxt || !nuxt.data || !nuxt.data[0] || !nuxt.data[0].blocks) return;

    const blocks = nuxt.data[0].blocks;
    const epBlocks = blocks.filter(
      (b) => b && b.attributes && b.attributes.key === 'jlr-electrifying-power'
    );

    containers.forEach((container, idx) => {
      const nuxtBlock = epBlocks[idx];
      if (!nuxtBlock || !nuxtBlock.attributes) return;

      const attrs = nuxtBlock.attributes;
      const data = {
        heading: '',
        paragraph: '',
        isReversed: false,
        image: '',
        imageAlt: '',
        stats: [],
      };

      // Extract top-level fields from attributes.fields[] array
      if (attrs.fields) {
        for (let fi = 0; fi < attrs.fields.length; fi++) {
          const f = attrs.fields[fi];
          const sym = f.symbol || f.key || '';
          if (sym === 'heading' && f.value) data.heading = String(f.value);
          if (sym === 'paragraph' && f.value) data.paragraph = String(f.value);
          if (sym === 'is_reversed') data.isReversed = !!f.value;
          if (sym === 'rdx-image' && f.value) {
            try {
              const imgVal = typeof f.value === 'string' ? JSON.parse(f.value) : f.value;
              if (imgVal && imgVal.id) {
                data.image = `https://media.cdn-jaguarlandrover.com/api/v2/images/${imgVal.id}/w/1600/h/900.jpg`;
                data.imageAlt = imgVal.alt || '';
              }
            } catch (e) { /* ignore */ }
          }
        }
      }

      // Extract stat cards from field_groups[]
      if (attrs.field_groups) {
        data.stats = attrs.field_groups.map((group) => {
          const stat = { tagline: '', title: '', disclaimer: '' };
          for (let gi = 0; gi < group.length; gi++) {
            const sym = group[gi].symbol || group[gi].key || '';
            if (sym === 'tagline' && group[gi].value) stat.tagline = String(group[gi].value);
            if (sym === 'title' && group[gi].value) stat.title = String(group[gi].value);
            if (sym === 'disclaimer' && group[gi].value) stat.disclaimer = String(group[gi].value);
          }
          return stat;
        });
      }

      container.setAttribute('data-electrifying-power', JSON.stringify(data));
    });
  } catch (e) {
    // Silent — DOM fallback in parser will still capture data
  }
}

/* ------------------------------------------------------------------ */
/*  Pre-processing: extract __NUXT__ tabbed-component data              */
/* ------------------------------------------------------------------ */

/**
 * Extracts structured tab data from the __NUXT__ script for
 * jlr-tabbed-component blocks (edition choosers, build & order, etc.)
 * and injects it as data attributes.
 *
 * Data model per block:
 *   attributes.field_groups[] — one array per tab
 *     symbols: tab_label, heading, paragraph, rdx-image, rdx-links, component_type
 *   attributes.fields[] — block-level settings (box_color, block_scroll_id)
 */
function injectTabbedComponentData(document, html) {
  if (!html) return;

  const containers = Array.from(
    document.querySelectorAll('.jlr-tabbed-component')
  );
  if (containers.length === 0) return;

  try {
    const match = html.match(/window\.__NUXT__\s*=\s*(\(function\([\s\S]*?\)\([\s\S]*?\)\))\s*;?\s*<\/script>/);
    if (!match) return;

    const nuxt = new Function('return ' + match[1])();
    if (!nuxt || !nuxt.data || !nuxt.data[0] || !nuxt.data[0].blocks) return;

    const blocks = nuxt.data[0].blocks;
    const tcBlocks = blocks.filter(
      (b) => b && b.attributes && b.attributes.key === 'jlr-tabbed-component'
    );

    containers.forEach((container, idx) => {
      const nuxtBlock = tcBlocks[idx];
      if (!nuxtBlock || !nuxtBlock.attributes) return;

      const attrs = nuxtBlock.attributes;
      const data = {
        tabs: [],
        theme: '',
      };

      // Extract block-level fields
      if (attrs.fields) {
        for (let fi = 0; fi < attrs.fields.length; fi++) {
          const f = attrs.fields[fi];
          const sym = f.symbol || f.key || '';
          if (sym === 'box_color' && f.value) data.theme = String(f.value);
        }
      }

      // Extract per-tab data from field_groups
      if (attrs.field_groups) {
        data.tabs = attrs.field_groups.map((group) => {
          const tab = {
            tabLabel: '',
            heading: '',
            paragraph: '',
            image: '',
            links: [],
          };
          for (let gi = 0; gi < group.length; gi++) {
            const sym = group[gi].symbol || group[gi].key || '';
            if (sym === 'tab_label' && group[gi].value) tab.tabLabel = String(group[gi].value);
            if (sym === 'heading' && group[gi].value) tab.heading = String(group[gi].value);
            if (sym === 'paragraph' && group[gi].value) tab.paragraph = String(group[gi].value);
            if (sym === 'rdx-image' && group[gi].value) {
              try {
                const imgVal = typeof group[gi].value === 'string'
                  ? JSON.parse(group[gi].value)
                  : group[gi].value;
                if (imgVal && imgVal.id) {
                  tab.image = `https://media.cdn-jaguarlandrover.com/api/v2/images/${imgVal.id}/w/1600/h/900.jpg`;
                }
              } catch (e) { /* ignore */ }
            }
            if (sym === 'rdx-links' && group[gi].value) {
              const links = Array.isArray(group[gi].value) ? group[gi].value : [];
              tab.links = links
                .filter((l) => l && l.link_text && l.url)
                .map((l) => ({ text: l.link_text, url: l.url }));
            }
          }
          return tab;
        });
      }

      container.setAttribute('data-tabbed-component', JSON.stringify(data));
    });
  } catch (e) {
    // Silent — DOM fallback in parser will still capture data
  }
}

/* ------------------------------------------------------------------ */
/*  Pre-processing: extract __NUXT__ build-and-order data               */
/* ------------------------------------------------------------------ */

/**
 * Identifies the Build & Order pattern in __NUXT__ data:
 *   jlr-snippet ("BUILD AND ORDER") → optional jlr-tabs (model switcher)
 *   → 1+ jlr-tabbed-component (trim choosers) → jlr-snippet (CTAs)
 *
 * Two variants:
 *   Multi-model: snippet → jlr-tabs → N× jlr-tabbed-component → CTA snippet
 *   Single-model: snippet → 1× jlr-tabbed-component → CTA snippet
 *
 * Detection is purely structural (no heading-text matching):
 *   1. A heading-only jlr-snippet (has section_title, no *populated* rdx-link/rdx-links)
 *   2. Followed by tabbed-component(s) whose field_groups contain tab_label + rdx-image
 *   3. Followed by a CTA jlr-snippet (has *populated* rdx-link or rdx-links values)
 *
 * Injects aggregated JSON as data-build-and-order on the DOM anchor element.
 */
function injectBuildAndOrderData(document, html) {
  if (!html) return;

  try {
    const match = html.match(/window\.__NUXT__\s*=\s*(\(function\([\s\S]*?\)\([\s\S]*?\)\))\s*;?\s*<\/script>/);
    if (!match) return;

    const nuxt = new Function('return ' + match[1])();
    if (!nuxt || !nuxt.data || !nuxt.data[0] || !nuxt.data[0].blocks) return;

    const blocks = nuxt.data[0].blocks;

    /* Helper: check whether a jlr-tabbed-component block contains vehicle trim
       data (field_groups with tab_label + rdx-image pairs). */
    const isTrimChooser = (block) => {
      const groups = block?.attributes?.field_groups;
      if (!Array.isArray(groups) || groups.length < 2) return false;
      return groups.some((group) => {
        let hasLabel = false;
        let hasImage = false;
        for (let k = 0; k < group.length; k++) {
          const sym = group[k].symbol || group[k].key || '';
          if (sym === 'tab_label' && group[k].value) hasLabel = true;
          if (sym === 'rdx-image' && group[k].value) hasImage = true;
        }
        return hasLabel && hasImage;
      });
    };

    /* Helper: check whether a field has populated link values (non-empty array). */
    const hasPopulatedLinks = (fields) => fields.some((f) => {
      if (f.symbol !== 'rdx-link' && f.symbol !== 'rdx-links') return false;
      return Array.isArray(f.value) && f.value.length > 0;
    });

    /* Helper: check whether a jlr-snippet block is heading-only (has section_title
       but no populated CTA link values). */
    const isHeadingSnippet = (block) => {
      const fields = block?.attributes?.fields;
      if (!Array.isArray(fields)) return false;
      const hasTitle = fields.some((f) => f.symbol === 'section_title' && f.value);
      return hasTitle && !hasPopulatedLinks(fields);
    };

    /* Helper: check whether a jlr-snippet block is a CTA block
       (has populated rdx-link or rdx-links values). */
    const isCtaSnippet = (block) => {
      const fields = block?.attributes?.fields;
      if (!Array.isArray(fields)) return false;
      return hasPopulatedLinks(fields);
    };

    // Structural detection: snippet(heading) → [tabs] → tabbed-component(s) → snippet(CTA)
    for (let i = 0; i < blocks.length; i++) {
      const b = blocks[i];
      if (!b || !b.attributes) continue;
      if (b.attributes.key !== 'jlr-snippet') continue;
      if (!isHeadingSnippet(b)) continue;

      let j = i + 1;
      if (j >= blocks.length) continue;

      const data = { models: [], ctas: [] };

      // Check if next block is jlr-tabs (multi-model case, e.g. Discovery)
      if (blocks[j]?.attributes?.key === 'jlr-tabs') {
        // Verify at least one following tabbed-component is a trim chooser
        if (j + 1 >= blocks.length
          || blocks[j + 1]?.attributes?.key !== 'jlr-tabbed-component'
          || !isTrimChooser(blocks[j + 1])) continue;

        const tabsBlock = blocks[j].attributes;
        const modelLabels = (tabsBlock.field_groups || []).map((g) => {
          for (let k = 0; k < g.length; k++) {
            if ((g[k].symbol || g[k].key) === 'tab_label') return String(g[k].value || '');
          }
          return '';
        });
        j++;

        // Each subsequent jlr-tabbed-component corresponds to a model tab
        modelLabels.forEach((label) => {
          if (j < blocks.length && blocks[j]?.attributes?.key === 'jlr-tabbed-component') {
            const model = { name: label, trims: [] };
            const groups = blocks[j].attributes.field_groups || [];
            groups.forEach((group) => {
              const trim = { label: '', image: '' };
              for (let k = 0; k < group.length; k++) {
                const sym = group[k].symbol || group[k].key || '';
                if (sym === 'tab_label' && group[k].value) trim.label = String(group[k].value);
                if (sym === 'rdx-image' && group[k].value) {
                  try {
                    const imgVal = typeof group[k].value === 'string'
                      ? JSON.parse(group[k].value) : group[k].value;
                    if (imgVal && imgVal.id) {
                      trim.image = `https://media.cdn-jaguarlandrover.com/api/v2/images/${imgVal.id}/w/1600.jpg`;
                    }
                  } catch (e) { /* ignore */ }
                }
              }
              model.trims.push(trim);
            });
            data.models.push(model);
            j++;
          }
        });
      } else if (blocks[j]?.attributes?.key === 'jlr-tabbed-component'
        && isTrimChooser(blocks[j])) {
        // Single model case — no jlr-tabs, just one tabbed-component
        const model = { name: '', trims: [] };
        const groups = blocks[j].attributes.field_groups || [];
        groups.forEach((group) => {
          const trim = { label: '', image: '' };
          for (let k = 0; k < group.length; k++) {
            const sym = group[k].symbol || group[k].key || '';
            if (sym === 'tab_label' && group[k].value) trim.label = String(group[k].value);
            if (sym === 'rdx-image' && group[k].value) {
              try {
                const imgVal = typeof group[k].value === 'string'
                  ? JSON.parse(group[k].value) : group[k].value;
                if (imgVal && imgVal.id) {
                  trim.image = `https://media.cdn-jaguarlandrover.com/api/v2/images/${imgVal.id}/w/1600.jpg`;
                }
              } catch (e) { /* ignore */ }
            }
          }
          model.trims.push(trim);
        });
        data.models.push(model);
        j++;
      } else {
        // Neither tabs nor trim-chooser follows this heading — not a build-and-order section
        continue;
      }

      // Trailing block must be a CTA snippet (structural confirmation)
      if (j >= blocks.length || blocks[j]?.attributes?.key !== 'jlr-snippet'
        || !isCtaSnippet(blocks[j])) continue;

      // Extract CTAs from the trailing snippet
      const ctaFields = blocks[j].attributes.fields || [];
      const rdxLinkField = Array.isArray(ctaFields)
        ? ctaFields.find((f) => f.symbol === 'rdx-link')
        : null;
      if (rdxLinkField && Array.isArray(rdxLinkField.value)) {
        rdxLinkField.value.forEach((link) => {
          if (link && link.link_text && link.url) {
            data.ctas.push({ text: link.link_text, href: link.url, primary: true });
          }
        });
      }
      const rdxLinksField = Array.isArray(ctaFields)
        ? ctaFields.find((f) => f.symbol === 'rdx-links')
        : null;
      if (rdxLinksField && Array.isArray(rdxLinksField.value)) {
        rdxLinksField.value.forEach((l) => {
          if (l && l.link_text && l.url) {
            data.ctas.push({ text: l.link_text, href: l.url, primary: false });
          }
        });
      }

      if (data.models.length === 0) continue;

      // Inject onto the DOM anchor element using the __NUXT__ block index
      // which maps 1:1 to .rdx-render-block elements in the DOM.
      const allRenderBlocks = Array.from(document.querySelectorAll('.rdx-render-block'));
      if (i < allRenderBlocks.length) {
        for (let t = i + 1; t < allRenderBlocks.length; t++) {
          const next = allRenderBlocks[t];
          if (next.querySelector('.jlr-tabs__navigation') || next.querySelector('.jlr-tabbed-component')) {
            next.setAttribute('data-build-and-order', JSON.stringify(data));
            break;
          }
        }
      }
    }
  } catch (e) {
    // Silent — block simply won't be created
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
    // 0. Inject __NUXT__ data before cleanup strips elements
    injectHotspotData(document, html);
    injectElectrifyingPowerData(document, html);
    injectTabbedComponentData(document, html);
    injectBuildAndOrderData(document, html);

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
