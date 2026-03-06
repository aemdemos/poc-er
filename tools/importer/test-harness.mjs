/**
 * Test harness for running import.js locally via jsdom.
 *
 * Usage:
 *   node tools/importer/test-harness.mjs <cleaned-html-path> <source-url>
 *
 * Example:
 *   node tools/importer/test-harness.mjs \
 *     migration-work/defender-110-overview/cleaned.html \
 *     https://www.landrover-egypt.com/en/defender/26my/defender-110/overview
 */

import { readFileSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { JSDOM } = require('/usr/local/lib/node_modules/jsdom');

// ── Resolve args ──────────────────────────────────────────────────
const htmlPath = process.argv[2];
const sourceUrl = process.argv[3];

if (!htmlPath || !sourceUrl) {
  console.error('Usage: node test-harness.mjs <cleaned.html> <source-url>');
  process.exit(1);
}

let html = readFileSync(htmlPath, 'utf-8');

// ── Inject <head> metadata from metadata.json if available ───────
// The cleaned HTML from scraping has no <head> content.
// Try to inject title, description, og:image from the metadata.json
// in the same directory so the Metadata parser can find them.
const metadataJsonPath = join(dirname(htmlPath), 'metadata.json');
if (existsSync(metadataJsonPath)) {
  try {
    const meta = JSON.parse(readFileSync(metadataJsonPath, 'utf-8'));
    const headTags = [];
    if (meta.metadata) {
      if (meta.metadata.title) headTags.push(`<title>${meta.metadata.title}</title>`);
      if (meta.metadata.description) headTags.push(`<meta name="description" content="${meta.metadata.description}">`);
      if (meta.metadata['og:image']) headTags.push(`<meta property="og:image" content="${meta.metadata['og:image']}">`);
    }
    if (headTags.length > 0) {
      // Inject into <head> if it exists, otherwise wrap HTML
      if (html.includes('<head>')) {
        html = html.replace('<head>', '<head>' + headTags.join(''));
      } else {
        html = `<html><head>${headTags.join('')}</head><body>${html}</body></html>`;
      }
    }
  } catch (e) {
    // Silently ignore metadata injection failures
  }
}

// ── Create DOM ────────────────────────────────────────────────────
const dom = new JSDOM(html, { url: sourceUrl });
const { document } = dom.window;

// ── Mock WebImporter global ───────────────────────────────────────
globalThis.WebImporter = {
  Blocks: {
    /**
     * Creates a <table> element matching the AEM Import Tool's format:
     *   <table>
     *     <tr><th colspan="N">Block Name</th></tr>
     *     <tr><td>cell</td><td>cell</td></tr>
     *     ...
     *   </table>
     */
    createBlock(doc, { name, cells }) {
      const table = doc.createElement('table');

      // Header row
      const thead = doc.createElement('tr');
      const th = doc.createElement('th');
      th.textContent = name;
      if (cells.length > 0 && cells[0].length > 1) {
        th.setAttribute('colspan', String(cells[0].length));
      }
      thead.appendChild(th);
      table.appendChild(thead);

      // Data rows
      cells.forEach((row) => {
        const tr = doc.createElement('tr');
        row.forEach((cell) => {
          const td = doc.createElement('td');
          if (Array.isArray(cell)) {
            cell.forEach((item) => {
              if (typeof item === 'string') {
                td.appendChild(doc.createTextNode(item));
              } else if (item && item.nodeType) {
                td.appendChild(item);
              }
            });
          } else if (typeof cell === 'string') {
            td.textContent = cell;
          } else if (cell && cell.nodeType) {
            td.appendChild(cell);
          }
          tr.appendChild(td);
        });
        table.appendChild(tr);
      });

      return table;
    },
  },

  DOMUtils: {
    remove(element, selectors) {
      if (!element) return;
      selectors.forEach((sel) => {
        element.querySelectorAll(sel).forEach((el) => el.remove());
      });
    },
  },

  FileUtils: {
    sanitizePath(path) {
      return path
        .toLowerCase()
        .replace(/[^a-z0-9/.-]/g, '-')
        .replace(/-+/g, '-')
        .replace(/\/$/, '');
    },
  },
};

// ── Also expose Node constants on globalThis for compareDocumentPosition ─
globalThis.Node = dom.window.Node;

// ── Import and run ────────────────────────────────────────────────
const importModule = await import('./import.js');
const importer = importModule.default;

console.log('=== IMPORT DRY RUN ===');
console.log(`Source: ${sourceUrl}`);
console.log(`HTML:   ${htmlPath}`);
console.log('');

// Generate document path
const docPath = importer.generateDocumentPath({ document, url: sourceUrl });
console.log(`Document path: ${docPath}`);
console.log('');

// Run transformDOM
console.log('Running transformDOM...');
const result = importer.transformDOM({ document, url: sourceUrl, html, params: {} });

if (!result) {
  console.error('ERROR: transformDOM returned null/undefined');
  process.exit(1);
}

// ── Serialize result to simplified markdown-like output ───────────
console.log('=== OUTPUT STRUCTURE ===');
console.log('');

let sectionCount = 0;
let blockCount = 0;

for (const child of result.childNodes) {
  if (child.nodeName === 'HR') {
    sectionCount++;
    console.log('---');
    console.log('');
    continue;
  }

  if (child.nodeName === 'TABLE') {
    blockCount++;
    const headerRow = child.querySelector('tr:first-child th');
    const blockName = headerRow ? headerRow.textContent : '(unknown)';
    const dataRows = child.querySelectorAll('tr:not(:first-child)');
    console.log(`| **${blockName}** |`);
    console.log(`| --- |`);
    dataRows.forEach((row) => {
      const cells = Array.from(row.querySelectorAll('td'));
      const cellTexts = cells.map((td) => {
        let text = '';
        for (const node of td.childNodes) {
          if (node.nodeName === 'IMG') {
            const alt = node.getAttribute('alt') || '';
            const src = node.getAttribute('src') || '';
            // Shorten long URLs
            const shortSrc = src.length > 60 ? src.substring(0, 57) + '...' : src;
            text += `![${alt}](${shortSrc}) `;
          } else if (node.nodeName === 'A') {
            text += `[${node.textContent.trim()}](${(node.getAttribute('href') || '').substring(0, 40)}) `;
          } else if (node.nodeName === 'H1') {
            text += `# ${node.textContent.trim()} `;
          } else if (node.nodeName === 'H2') {
            text += `## ${node.textContent.trim()} `;
          } else if (node.nodeName === 'STRONG') {
            text += `**${node.textContent.trim()}** `;
          } else if (node.nodeType === 3) { // Text node
            const t = node.textContent.trim();
            if (t) text += t + ' ';
          } else if (node.nodeName === 'P') {
            text += node.textContent.trim() + ' ';
          } else if (node.nodeName === 'DIV') {
            // Recurse into div children
            for (const n of node.childNodes) {
              if (n.nodeName === 'IMG') {
                text += `![](${(n.getAttribute('src') || '').substring(0, 40)}) `;
              } else if (n.nodeName === 'P') {
                text += n.textContent.trim() + ' ';
              } else if (n.nodeType === 3 && n.textContent.trim()) {
                text += n.textContent.trim() + ' ';
              }
            }
          }
        }
        return text.trim() || '(empty)';
      });
      console.log(`| ${cellTexts.join(' | ')} |`);
    });
    console.log('');
    continue;
  }

  // Default content (headings, paragraphs, images, links)
  if (child.nodeName === 'H2') {
    console.log(`## ${child.textContent.trim()}`);
    console.log('');
  } else if (child.nodeName === 'H1') {
    console.log(`# ${child.textContent.trim()}`);
    console.log('');
  } else if (child.nodeName === 'P') {
    console.log(child.textContent.trim());
    console.log('');
  } else if (child.nodeName === 'IMG') {
    const alt = child.getAttribute('alt') || '';
    console.log(`![${alt}](${child.getAttribute('src')})`);
    console.log('');
  } else if (child.nodeName === 'A') {
    console.log(`[${child.textContent.trim()}](${child.getAttribute('href')})`);
    console.log('');
  } else if (child.nodeName === 'DIV') {
    // Container from image-box parser
    for (const n of child.childNodes) {
      if (n.nodeName === 'IMG') {
        console.log(`![${n.getAttribute('alt') || ''}](${n.getAttribute('src')})`);
      } else if (n.nodeName === 'P') {
        console.log(n.textContent.trim());
      }
    }
    console.log('');
  }
}

console.log('=== SUMMARY ===');
console.log(`Sections (---): ${sectionCount}`);
console.log(`Block tables:   ${blockCount}`);
console.log(`Total children: ${result.childNodes.length}`);
