/* eslint-disable */
/**
 * Build and Order Parser
 *
 * Extracts model/trim chooser data from injected __NUXT__ data
 * (data-build-and-order attribute) or falls back to DOM extraction.
 *
 * Returns: { models: [{ name, trims: [{ label, image }] }], ctas: [{ text, href, primary }] }
 */

export function extractBuildAndOrderData(element, document) {
  const result = { models: [], ctas: [] };

  // Prefer injected NUXT data
  const anchor = element.querySelector('[data-build-and-order]');
  if (anchor) {
    try {
      const data = JSON.parse(anchor.getAttribute('data-build-and-order'));
      if (data && data.models) return data;
    } catch (e) { /* fall through to DOM extraction */ }
  }

  // DOM fallback: extract whatever is visible
  const tabbedComponent = element.querySelector('.jlr-tabbed-component');
  if (tabbedComponent) {
    const model = { name: '', trims: [] };
    const buttons = Array.from(
      tabbedComponent.querySelectorAll('.jlr-tabs__navigation button')
    );
    const img = tabbedComponent.querySelector('img');
    buttons.forEach((btn) => {
      model.trims.push({
        label: btn.textContent.trim(),
        image: img ? img.src : '',
      });
    });
    if (model.trims.length > 0) result.models.push(model);
  }

  // Extract CTAs from sibling snippet
  const links = Array.from(element.querySelectorAll('.jlr-snippet a'));
  links.forEach((a) => {
    if (a.textContent.trim()) {
      result.ctas.push({
        text: a.textContent.trim(),
        href: a.href || '',
        primary: a.classList.contains('button') || a.closest('.jlr-snippet__button') !== null,
      });
    }
  });

  return result;
}
