#!/usr/bin/env node
/* eslint-disable no-console, no-await-in-loop, no-underscore-dangle */
/* eslint-disable import/no-extraneous-dependencies, import/no-unresolved */

/**
 * Bulk Import Runner — uses the real `aem import` server
 *
 * This script starts the official AEM CLI import server (`aem import`) which
 * provides a CORS proxy, then uses Playwright to load each page through that
 * proxy and run the import transformation. This is the same pipeline the
 * helix-importer-ui uses when you do a bulk import through the browser UI.
 *
 * Usage:
 *   node tools/importer/run-bulk-import.js \
 *     --urls tools/importer/all-urls.txt \
 *     --output-dir content
 *
 * Options:
 *   --urls          Text file with one URL per line (default: tools/importer/all-urls.txt)
 *   --output-dir    Directory to write .plain.html files (default: content)
 *   --port          Port for the aem import server (default: 3001)
 *   --cache         Path to a local folder to cache proxied responses (optional)
 *
 * Alternative (bypass aem import, use direct Playwright navigation):
 *   See: tools/importer/run-bulk-import.playwright-direct.js
 */

import {
  readFileSync, existsSync, mkdirSync, writeFileSync,
} from 'fs';
import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
import { chromium } from 'playwright';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const VIEWPORT_WIDTH = 1920;
const VIEWPORT_HEIGHT = 1080;
const PAGE_TIMEOUT = 45000;
const POPUP_DISMISS_DELAY = 500;
const ESCAPE_KEY_DELAY = 300;
const SERVER_STARTUP_TIMEOUT = 30000;
const SERVER_POLL_INTERVAL = 500;

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
 * Build the proxied URL for a given source URL through the aem import server.
 * Format: http://localhost:<port>/<path>?host=<origin>
 */
function buildProxyUrl(sourceUrl, port) {
  const u = new URL(sourceUrl);
  const proxyBase = `http://localhost:${port}`;
  const sep = u.search ? `${u.search}&` : '?';
  return `${proxyBase}${u.pathname}${sep}host=${encodeURIComponent(u.origin)}`;
}

/**
 * Start the `aem import` server as a child process.
 * Returns the child process handle.
 */
function startAemImportServer(port, cacheDir) {
  const args = [
    'import',
    '--no-open',
    '--skip-ui',
    '--port', String(port),
    '--allow-insecure',
  ];

  if (cacheDir) {
    args.push('--cache', cacheDir);
  }

  console.log(`  Starting: aem ${args.join(' ')}`);

  const child = spawn('aem', args, {
    cwd: resolve(__dirname, '../..'),
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  child.stdout.on('data', (data) => {
    const line = data.toString().trim();
    if (line) console.log(`  [aem import] ${line}`);
  });

  child.stderr.on('data', (data) => {
    const line = data.toString().trim();
    if (line) console.error(`  [aem import] ${line}`);
  });

  return child;
}

/**
 * Wait for the aem import server to become ready by polling the port.
 */
async function waitForServer(port, timeoutMs = SERVER_STARTUP_TIMEOUT) {
  const start = Date.now();
  const url = `http://localhost:${port}/`;

  while (Date.now() - start < timeoutMs) {
    try {
      const resp = await fetch(url);
      // The server returns 403 when no host param is set — that means it's up
      if (resp.status === 403 || resp.ok) {
        return true;
      }
    } catch {
      // not ready yet
    }
    await new Promise((r) => { setTimeout(r, SERVER_POLL_INTERVAL); });
  }

  throw new Error(`aem import server did not start within ${timeoutMs / 1000}s`);
}

/**
 * Gracefully stop the aem import server.
 */
function stopServer(child) {
  return new Promise((res) => {
    if (!child || child.killed) {
      res();
      return;
    }
    child.on('close', () => res());
    child.kill('SIGTERM');
    // Force kill after 5s if it hasn't exited
    setTimeout(() => {
      if (!child.killed) {
        child.kill('SIGKILL');
      }
      res();
    }, 5000);
  });
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

    const dismissOne = async (sel) => {
      const els = await page.$$(sel);
      await Promise.all(els.map(async (el) => {
        const isVisible = await el.isVisible().catch(() => false);
        if (isVisible) {
          const text = await el.evaluate((e) => e.textContent?.toLowerCase() || '');
          if (keywords.some((w) => text.includes(w))) {
            await el.click().catch(() => {});
            await page.waitForTimeout(POPUP_DISMISS_DELAY);
          }
        }
      }));
    };
    await Promise.all(selectors.map(dismissOne));

    await page.keyboard.press('Escape').catch(() => {});
    await page.waitForTimeout(ESCAPE_KEY_DELAY);
  } catch { /* ignore popup errors */ }
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

async function processUrl({
  context, url, helixScript, importScript, outputDir, port, index, total,
}) {
  const label = `[${index}/${total}]`;
  const startTime = Date.now();
  const proxyUrl = buildProxyUrl(url, port);
  console.log(`${label} Starting: ${url}`);
  console.log(`  Proxy → ${proxyUrl}`);

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

  try {
    // Navigate through the aem import proxy
    try {
      await page.goto(proxyUrl, {
        waitUntil: 'networkidle',
        timeout: PAGE_TIMEOUT,
      });
    } catch {
      console.log('  Fallback to domcontentloaded...');
      await page.goto(proxyUrl, {
        waitUntil: 'domcontentloaded',
        timeout: PAGE_TIMEOUT,
      });
      await page.waitForTimeout(3000);
    }

    await dismissPopups(page);
    await randomScroll(page);

    // Inject helix-importer library
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

    // Run the transformation — pass the ORIGINAL url (not the proxy url)
    // so that generateDocumentPath and template detection work correctly
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

    const plainPath = join(outputDir, `${relPath}.plain.html`);
    ensureDir(dirname(plainPath));
    writeFileSync(plainPath, result.html, 'utf-8');

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

  const urlsFile = resolve(
    parsed['--urls'] || 'tools/importer/all-urls.txt',
  );
  const outputDir = resolve(
    parsed['--output-dir'] || 'content',
  );
  const port = parseInt(parsed['--port'] || '3001', 10);
  const cacheDir = parsed['--cache'] || null;

  // The import script is still needed for browser injection
  const importScriptPath = resolve(
    parsed['--import-script'] || 'tools/importer/import.bundle.js',
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
  // The bundle uses ES module `export { import_default as default }` which
  // doesn't work when injected as a regular <script> tag. Replace it with a
  // window global assignment so the script is accessible after injection.
  const importScriptRaw = readFileSync(importScriptPath, 'utf-8');
  const importScript = importScriptRaw.replace(
    /export\s*\{\s*import_default\s+as\s+default\s*\}\s*;?\s*$/,
    'window.CustomImportScript = { default: import_default };',
  );
  const urls = readFileSync(urlsFile, 'utf-8')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#'));

  console.log('');
  console.log('=== BULK IMPORT (aem import proxy) ===');
  console.log(`  Import script: ${importScriptPath}`);
  console.log(`  URLs:          ${urls.length} pages`);
  console.log(`  Output:        ${outputDir}`);
  console.log(`  Proxy port:    ${port}`);
  if (cacheDir) console.log(`  Cache:         ${cacheDir}`);
  console.log('');

  // --- Start the aem import server ---
  console.log('Starting aem import server...');
  const aemProcess = startAemImportServer(port, cacheDir);

  let serverStopped = false;
  const cleanup = async () => {
    if (!serverStopped) {
      serverStopped = true;
      console.log('\nStopping aem import server...');
      await stopServer(aemProcess);
      console.log('Server stopped.');
    }
  };

  // Ensure cleanup on exit
  process.on('SIGINT', async () => { await cleanup(); process.exit(130); });
  process.on('SIGTERM', async () => { await cleanup(); process.exit(143); });

  try {
    await waitForServer(port);
    console.log(`aem import server ready on port ${port}\n`);
  } catch (err) {
    console.error(err.message);
    await cleanup();
    process.exit(1);
  }

  // --- Run the import ---
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
      const result = await processUrl({
        context,
        url: urls[i],
        helixScript,
        importScript,
        outputDir,
        port,
        index: i + 1,
        total: urls.length,
      });
      results.push(result);
    }
  } finally {
    await context.close().catch(() => {});
    await browser.close().catch(() => {});
    await cleanup();
  }

  // --- Report ---
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
    method: 'aem-import-proxy',
    proxyPort: port,
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

main().catch(async (err) => {
  console.error('[Bulk Import] Fatal error:', err);
  process.exit(1);
});
