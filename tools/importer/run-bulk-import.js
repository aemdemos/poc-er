#!/usr/bin/env node
/* eslint-disable no-console, no-await-in-loop, import/no-extraneous-dependencies */
/* eslint-disable no-underscore-dangle */

/**
 * Bulk Import Runner with Timing
 *
 * Usage:
 *   node tools/importer/run-bulk-import.js \
 *     --import-script tools/importer/import.bundle.js \
 *     --urls tools/importer/bulk-urls.txt \
 *     --output-dir content/bulk-import
 */

import {
  readFileSync, existsSync, mkdirSync, writeFileSync,
} from 'fs';
import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { chromium } from 'playwright';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const VIEWPORT_WIDTH = 1920;
const VIEWPORT_HEIGHT = 1080;
const PAGE_TIMEOUT = 45000;
const POPUP_DISMISS_DELAY = 500;
const ESCAPE_KEY_DELAY = 300;
const MIN_DELAY = 1000;
const MAX_DELAY = 3000;

async function randomDelay() {
  const delay = Math.floor(Math.random() * (MAX_DELAY - MIN_DELAY + 1)) + MIN_DELAY;
  await new Promise((r) => { setTimeout(r, delay); });
}

async function randomScroll(page) {
  try {
    const scrolls = Math.floor(Math.random() * 3) + 1;
    for (let i = 0; i < scrolls; i += 1) {
      const scrollAmount = Math.floor(Math.random() * 500) + 200;
      await page.evaluate((amount) => window.scrollBy(0, amount), scrollAmount);
      await new Promise((r) => { setTimeout(r, Math.random() * 500 + 200); });
    }
  } catch { /* ignore scroll errors */ }
}

async function dismissPopups(page) {
  const selectors = [
    'button[id*="accept" i]',
    'button[class*="accept" i]',
    'button[class*="cookie" i]',
    'button[class*="consent" i]',
    '[aria-label*="accept" i]',
    '[aria-label*="agree" i]',
    '#onetrust-accept-btn-handler',
    '.cookie-consent-accept',
    'button[aria-label*="close" i]',
  ];

  try {
    const keywords = ['accept', 'agree', 'consent', 'allow', 'ok', 'close', 'continue'];

    selectors.forEach(async (sel) => {
      const els = await page.$$(sel);
      const visible = await Promise.all(
        els.map(async (el) => {
          const isVisible = await el.isVisible().catch(() => false);
          return { el, isVisible };
        }),
      );

      const visibleEls = visible.filter((v) => v.isVisible);
      await Promise.all(
        visibleEls.map(async ({ el }) => {
          const text = await el.evaluate((e) => e.textContent?.toLowerCase() || '');
          if (keywords.some((w) => text.includes(w))) {
            await el.click().catch(() => {});
            await page.waitForTimeout(POPUP_DISMISS_DELAY);
          }
        }),
      );
    });

    await page.keyboard.press('Escape').catch(() => {});
    await page.waitForTimeout(ESCAPE_KEY_DELAY);
  } catch { /* ignore popup errors */ }
}

function ensureDir(p) {
  mkdirSync(p, { recursive: true });
}

function sanitizeDocPath(docPath, url) {
  let normalized = docPath;
  if (!normalized || typeof normalized !== 'string') {
    normalized = new URL(url).pathname || '/';
  }
  normalized = normalized.replace(/\\/g, '/');
  if (normalized.startsWith('/')) normalized = normalized.slice(1);
  if (normalized.endsWith('/')) normalized = normalized.slice(0, -1);
  if (normalized === '') normalized = 'index';
  return normalized;
}

/**
 * Wrap plain DA HTML in a full page structure for AEM dev server.
 * Includes head.html content so scripts/styles load correctly.
 */
function wrapInHtmlPage(plainHtml) {
  return `<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<script src="/scripts/aem.js" type="module"></script>
<script src="/scripts/scripts.js" type="module"></script>
<link rel="stylesheet" href="/styles/styles.css"/>
</head>
<body>
<header></header>
<main>
${plainHtml}
</main>
<footer></footer>
</body>
</html>`;
}

async function processUrl({
  context, url, helixScript, importScript, outputDir, index, total,
}) {
  const label = `[${index}/${total}]`;
  const startTime = Date.now();
  console.log(`${label} Starting: ${url}`);

  const page = await context.newPage();

  page.on('console', (msg) => {
    const type = msg.type();
    if (type === 'error') {
      const text = msg.text();
      if (!text.includes('Invalid JSON') && !text.includes('remove')) {
        console.error(`  [Browser] ${text.substring(0, 120)}`);
      }
    }
  });

  // Stealth
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
    window.chrome = { runtime: {} };
    Object.defineProperty(navigator, 'plugins', {
      get: () => [1, 2, 3, 4, 5],
    });
    Object.defineProperty(navigator, 'languages', {
      get: () => ['en-US', 'en'],
    });
  });

  try {
    // Navigate
    try {
      await page.goto(url, {
        waitUntil: 'networkidle',
        timeout: PAGE_TIMEOUT,
      });
    } catch {
      console.log('  Fallback to domcontentloaded...');
      await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: PAGE_TIMEOUT,
      });
      await page.waitForTimeout(3000);
    }

    await dismissPopups(page);
    await randomScroll(page);

    // Inject helix-importer bundle
    await page.evaluate((script) => {
      const orig = window.define;
      if (typeof window.define !== 'undefined') delete window.define;
      const s = document.createElement('script');
      s.textContent = script;
      document.head.appendChild(s);
      if (orig) window.define = orig;
    }, helixScript);

    // Inject bundled import script
    await page.evaluate((script) => {
      const s = document.createElement('script');
      s.textContent = script;
      document.head.appendChild(s);
    }, importScript);

    // Wait for CustomImportScript
    await page.waitForFunction(
      () => typeof window.CustomImportScript !== 'undefined'
        && window.CustomImportScript?.default,
      { timeout: 10000 },
    );

    // Run the transformation
    const result = await page.evaluate(async (pageUrl) => {
      if (!window.WebImporter
        || typeof window.WebImporter.html2md !== 'function') {
        throw new Error('WebImporter not available');
      }
      const config = window.CustomImportScript?.default;
      if (!config) throw new Error('CustomImportScript not available');

      const res = await window.WebImporter.html2md(pageUrl, document, config, {
        toDocx: false,
        toMd: true,
        originalURL: pageUrl,
      });
      res.html = window.WebImporter.md2da(res.md);
      return { path: res.path, html: res.html };
    }, url);

    if (!result.path || !result.html) {
      throw new Error(
        'Transform returned empty result '
        + `(path: ${typeof result.path}, html: ${typeof result.html})`,
      );
    }

    const relPath = sanitizeDocPath(result.path, url);

    // Save as .html with full page wrapper
    const htmlPath = join(outputDir, `${relPath}.html`);
    ensureDir(dirname(htmlPath));
    writeFileSync(htmlPath, wrapInHtmlPage(result.html), 'utf-8');

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`${label} Done: ${relPath}.html (${elapsed}s)`);
    return {
      success: true,
      path: relPath,
      url,
      elapsed: parseFloat(elapsed),
    };
  } catch (error) {
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.error(`${label} Failed (${elapsed}s): ${error.message}`);
    return {
      success: false,
      url,
      elapsed: parseFloat(elapsed),
      error: error.message,
    };
  } finally {
    await page.close().catch(() => {});
  }
}

async function main() {
  const args = process.argv.slice(2);
  const parsed = {};
  for (let i = 0; i < args.length; i += 1) {
    if (args[i].startsWith('--') && args[i + 1] && !args[i + 1].startsWith('--')) {
      i += 1;
      parsed[args[i - 1]] = args[i];
    }
  }

  const importScriptPath = resolve(
    parsed['--import-script'] || 'tools/importer/import.bundle.js',
  );
  const urlsFile = resolve(
    parsed['--urls'] || 'tools/importer/bulk-urls.txt',
  );
  const outputDir = resolve(
    parsed['--output-dir'] || 'content/bulk-import',
  );

  if (!existsSync(importScriptPath)) {
    console.error(`Import script not found: ${importScriptPath}`);
    process.exit(1);
  }
  if (!existsSync(urlsFile)) {
    console.error(`URLs file not found: ${urlsFile}`);
    process.exit(1);
  }

  const helixPath = join(__dirname, 'static', 'inject', 'helix-importer.js');
  if (!existsSync(helixPath)) {
    console.error(`helix-importer.js not found: ${helixPath}`);
    process.exit(1);
  }

  const helixScript = readFileSync(helixPath, 'utf-8');
  const importScript = readFileSync(importScriptPath, 'utf-8');
  const urls = readFileSync(urlsFile, 'utf-8')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#'));

  console.log('');
  console.log('=== BULK IMPORT ===');
  console.log(`  Import script: ${importScriptPath}`);
  console.log(`  URLs:          ${urls.length} pages`);
  console.log(`  Output:        ${outputDir}`);
  console.log('');

  ensureDir(outputDir);
  const totalStart = Date.now();

  const browser = await chromium.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--window-size=1920,1080',
    ],
  });

  const context = await browser.newContext({
    viewport: { width: VIEWPORT_WIDTH, height: VIEWPORT_HEIGHT },
    userAgent: [
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      'AppleWebKit/537.36 (KHTML, like Gecko)',
      'Chrome/120.0.0.0 Safari/537.36',
    ].join(' '),
    ignoreHTTPSErrors: true,
  });

  const results = [];

  try {
    for (let i = 0; i < urls.length; i += 1) {
      if (i > 0) await randomDelay();
      const result = await processUrl({
        context,
        url: urls[i],
        helixScript,
        importScript,
        outputDir,
        index: i + 1,
        total: urls.length,
      });
      results.push(result);
    }
  } finally {
    await context.close().catch(() => {});
    await browser.close().catch(() => {});
  }

  const totalElapsed = ((Date.now() - totalStart) / 1000).toFixed(1);
  const successes = results.filter((r) => r.success);
  const failures = results.filter((r) => !r.success);

  console.log('');
  console.log('=== TIMING REPORT ===');
  console.log('');
  results.forEach((r) => {
    const name = (r.path || new URL(r.url).pathname).padEnd(60);
    const time = `${r.elapsed}s`.padStart(7);
    const status = r.success ? 'OK' : 'FAIL';
    console.log(`  ${name} | ${time} | ${status}`);
  });
  console.log('');
  const avg = (
    results.reduce((sum, r) => sum + r.elapsed, 0) / results.length
  ).toFixed(1);
  console.log(
    `Total: ${totalElapsed}s`
    + ` | Success: ${successes.length}/${urls.length}`
    + ` | Failed: ${failures.length}/${urls.length}`,
  );
  console.log(`Average per page: ${avg}s`);

  // Save timing report as JSON
  const report = {
    timestamp: new Date().toISOString(),
    totalElapsedSeconds: parseFloat(totalElapsed),
    successCount: successes.length,
    failureCount: failures.length,
    averagePerPage: parseFloat(avg),
    pages: results,
  };
  const reportPath = join(outputDir, 'import-report.json');
  writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\nReport saved to ${reportPath}`);
}

main().catch((err) => {
  console.error('[Bulk Import] Fatal error:', err);
  process.exit(1);
});
