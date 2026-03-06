/* eslint-disable */
/* global WebImporter */

/**
 * Transformer for Land Rover Egypt website cleanup
 * Purpose: Remove non-content elements, navigation, cookie banners, and fix DOM issues
 * Applies to: www.landrover-egypt.com (all templates)
 * Tested: /en/defender/overview, /en/
 * Generated: 2026-02-27
 *
 * SELECTORS EXTRACTED FROM:
 * - Captured DOM during migration workflow (cleaned.html)
 * - Page structure analysis from page migration workflow
 */

const TransformHook = {
  beforeTransform: 'beforeTransform',
  afterTransform: 'afterTransform',
};

/**
 * Polyfill for WebImporter.DOMUtils.remove — some versions of the
 * AEM Importer runtime don't provide DOMUtils on the global object.
 */
function removeElements(root, selectors) {
  if (typeof WebImporter !== 'undefined' && WebImporter.DOMUtils && WebImporter.DOMUtils.remove) {
    WebImporter.DOMUtils.remove(root, selectors);
  } else {
    selectors.forEach((selector) => {
      root.querySelectorAll(selector).forEach((el) => el.remove());
    });
  }
}

export default function transform(hookName, element, payload) {
  if (hookName === TransformHook.beforeTransform) {
    // Remove navigation structure
    // EXTRACTED: Found in captured DOM <div class="lrdx-navigation navigation-container">
    removeElements(element, [
      '.lrdx-navigation',
      '.lrdx-navigation-overlay',
    ]);

    // Remove cookie consent dialogs
    // EXTRACTED: Found in captured DOM <div class="cookie-consent">
    removeElements(element, [
      '.cookie-consent',
      '.cookie-consent__default-placeholder',
    ]);

    // Remove banner manager
    // EXTRACTED: Found in captured DOM <div class="jlr-banner-manager">
    removeElements(element, ['.jlr-banner-manager']);

    // Remove video loaders and controls
    // EXTRACTED: Found in captured DOM <div class="jlr-loader ...">
    removeElements(element, [
      '.jlr-loader',
      '.jlr-native-video-frame__loader',
    ]);

    // Remove block options (CMS editing controls)
    // EXTRACTED: Found in captured DOM <div class="rdx-render-block__options">
    removeElements(element, ['.rdx-render-block__options']);

    // Remove overlay elements
    // EXTRACTED: Found in captured DOM <div class="jlr-overlay">
    removeElements(element, ['.jlr-overlay']);

    // Remove icon elements from buttons (decorative)
    // EXTRACTED: Found in captured DOM <i class="jlr-button__icon ...">
    removeElements(element, [
      '.jlr-button__icon',
      '.jlr-cta__icon',
      '.jlr-dual-frame-carousel__yt-icon-box',
    ]);

    // Remove slide-down chevron button from hero
    removeElements(element, ['.jlr-immersive-hero__slide-down']);

    // Remove breadcrumbs
    removeElements(element, [
      '.breadcrumbs-container',
      '.breadcrumbs-seo',
    ]);

    // Remove in-page navigation (sticky anchor nav)
    removeElements(element, ['.jlr-in-page-navigation']);

    // Remove iframe embeds (configurator / MENA)
    // Note: only .jlr-html-box (iframe containers), NOT .jlr-html-elements
    // which is a utility class on all text content (headings, paragraphs).
    removeElements(element, ['.jlr-html-box']);

    // Remove swiper pagination and navigation controls (decorative)
    removeElements(element, [
      '.swiper-pagination',
      '.swiper-button-next',
      '.swiper-button-prev',
      '.jlr-carousel__loader-box',
      '.jlr-carousel__hero-pagination',
      '.jlr-carousel__hero-navigation-prev',
      '.jlr-carousel__hero-navigation-next',
      '.jlr-hero-carousel-core__container-end',
      '.jlr-slider__pagination',
      '.jlr-slider__navigation-prev',
      '.jlr-slider__navigation-next',
    ]);

    // Note: Hotspot card data injection is done in import.js (injectHotspotData)
    // BEFORE this cleanup runs. The import.js function parses __NUXT__ from the
    // raw HTML string and injects data-hotspot-cards attributes on containers.

    // Remove hotspot interactive overlays (non-content, positions are on wrapper items)
    removeElements(element, [
      '.jlr-hotspot',
      '.jlr-hotspots-container__text',
    ]);

    // Remove footer
    removeElements(element, [
      '.jlr-footer',
      'footer',
      '.footer-disclaimer',
    ]);

    // Remove cookie banner
    removeElements(element, ['.jlr-cookie-banner']);

    // Enable scrolling if body has overflow hidden
    if (element.style && element.style.overflow === 'hidden') {
      element.setAttribute('style', 'overflow: scroll;');
    }
  }

  if (hookName === TransformHook.afterTransform) {
    // Remove remaining non-content elements
    removeElements(element, [
      'source',
      'noscript',
      'link',
    ]);

    // Clean up tracking/data attributes
    const allElements = element.querySelectorAll('*');
    allElements.forEach((el) => {
      el.removeAttribute('data-gtm');
      el.removeAttribute('data-analytics');
      el.removeAttribute('onclick');
    });
  }
}
