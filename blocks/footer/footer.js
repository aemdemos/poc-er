import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

const SOCIAL_ICONS = {
  'instagram.com': 'instagram',
  'youtube.com': 'youtube',
  'facebook.com': 'facebook',
  'twitter.com': 'twitter',
};

/**
 * Ensures social media links have icon spans,
 * even if the content pipeline strips them.
 */
function decorateSocialIcons(footer) {
  const socialSection = footer.querySelectorAll(':scope > .section')[1];
  if (!socialSection) return;

  socialSection.querySelectorAll('a').forEach((link) => {
    if (link.querySelector('.icon')) return;

    try {
      const url = new URL(link.href, window.location);
      const domain = Object.keys(SOCIAL_ICONS).find((d) => url.hostname.includes(d));
      if (domain) {
        const iconName = SOCIAL_ICONS[domain];
        const span = document.createElement('span');
        span.className = `icon icon-${iconName}`;
        const img = document.createElement('img');
        img.dataset.iconName = iconName;
        img.src = `${window.hlx.codeBasePath}/icons/${iconName}.svg`;
        img.alt = '';
        img.loading = 'lazy';
        img.width = 16;
        img.height = 16;
        span.append(img);
        link.prepend(span, ' ');
      }
    } catch { /* invalid URL, skip */ }
  });
}

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  // load footer as fragment
  const footerMeta = getMetadata('footer');
  const footerPath = footerMeta ? new URL(footerMeta, window.location).pathname : '/footer';
  const fragment = await loadFragment(footerPath);

  // decorate footer DOM
  block.textContent = '';
  const footer = document.createElement('div');
  while (fragment.firstElementChild) footer.append(fragment.firstElementChild);

  decorateSocialIcons(footer);
  block.append(footer);
}
