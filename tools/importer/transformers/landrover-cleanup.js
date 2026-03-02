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

export default function transform(hookName, element, payload) {
  if (hookName === TransformHook.beforeTransform) {
    // Remove navigation structure
    // EXTRACTED: Found in captured DOM <div class="lrdx-navigation navigation-container">
    WebImporter.DOMUtils.remove(element, [
      '.lrdx-navigation',
      '.lrdx-navigation-overlay',
    ]);

    // Remove cookie consent dialogs
    // EXTRACTED: Found in captured DOM <div class="cookie-consent">
    WebImporter.DOMUtils.remove(element, [
      '.cookie-consent',
      '.cookie-consent__default-placeholder',
    ]);

    // Remove banner manager
    // EXTRACTED: Found in captured DOM <div class="jlr-banner-manager">
    WebImporter.DOMUtils.remove(element, ['.jlr-banner-manager']);

    // Remove video loaders and controls
    // EXTRACTED: Found in captured DOM <div class="jlr-loader ...">
    WebImporter.DOMUtils.remove(element, [
      '.jlr-loader',
      '.jlr-native-video-frame__loader',
    ]);

    // Remove block options (CMS editing controls)
    // EXTRACTED: Found in captured DOM <div class="rdx-render-block__options">
    WebImporter.DOMUtils.remove(element, ['.rdx-render-block__options']);

    // Remove overlay elements
    // EXTRACTED: Found in captured DOM <div class="jlr-overlay">
    WebImporter.DOMUtils.remove(element, ['.jlr-overlay']);

    // Remove icon elements from buttons (decorative)
    // EXTRACTED: Found in captured DOM <i class="jlr-button__icon ...">
    WebImporter.DOMUtils.remove(element, [
      '.jlr-button__icon',
      '.jlr-cta__icon',
      '.jlr-dual-frame-carousel__yt-icon-box',
    ]);

    // Remove slide-down chevron button from hero
    // EXTRACTED: Found in captured DOM <button class="jlr-immersive-hero__slide-down">
    WebImporter.DOMUtils.remove(element, ['.jlr-immersive-hero__slide-down']);

    // Enable scrolling if body has overflow hidden
    if (element.style && element.style.overflow === 'hidden') {
      element.setAttribute('style', 'overflow: scroll;');
    }
  }

  if (hookName === TransformHook.afterTransform) {
    // Remove remaining non-content elements
    WebImporter.DOMUtils.remove(element, [
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
