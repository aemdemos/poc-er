import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

export default function decorate(block) {
  /* change to ul, li */
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    moveInstrumentation(row, li);
    while (row.firstElementChild) li.append(row.firstElementChild);
    [...li.children].forEach((div) => {
      const hasOnlyImg = div.children.length === 1
        && (div.querySelector(':scope > picture') || div.querySelector(':scope > img')
          || (div.querySelector(':scope > p') && div.querySelector(':scope > p > img')
            && div.querySelector(':scope > p').children.length === 1));
      if (hasOnlyImg) div.className = 'cards-card-image';
      else div.className = 'cards-card-body';
    });
    ul.append(li);
  });
  ul.querySelectorAll('picture > img').forEach((img) => {
    // Skip optimization for external images (different origin)
    const isExternal = img.src && !img.src.startsWith(window.location.origin);
    if (isExternal) return;
    const optimizedPic = createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]);
    moveInstrumentation(img, optimizedPic.querySelector('img'));
    img.closest('picture').replaceWith(optimizedPic);
  });
  block.textContent = '';
  block.append(ul);

  /* Default variant: restructure card body for proper styling hooks */
  if (!block.classList.contains('hero')) {
    ul.querySelectorAll('.cards-card-body').forEach((body) => {
      /* Extract <strong> (not inside a link) as card title */
      const strongP = body.querySelector('p > strong:only-child');
      if (strongP) {
        const p = strongP.parentElement;
        const title = document.createElement('h3');
        title.textContent = strongP.textContent;
        body.insertBefore(title, body.firstChild);
        p.remove();
      }

      /* Tag plain-text paragraphs as description */
      [...body.querySelectorAll('p')].forEach((p) => {
        if (p.textContent.trim() && !p.querySelector('a') && !p.classList.contains('button-container')) {
          p.className = 'cards-card-description';
        }
      });
    });
  }

  /* hero variant: video backgrounds that play on hover */
  if (block.classList.contains('hero')) {
    ul.querySelectorAll('li').forEach((li) => {
      const videoLink = [...li.querySelectorAll('.cards-card-body a')]
        .find((a) => /^video\b/i.test(a.textContent.trim()));
      if (videoLink) {
        /* Extract URL from link text (DA preserves text but mangles href) */
        const urlMatch = videoLink.textContent.trim()
          .match(/^video\s+(https?:\/\/.+)/i);
        const videoUrl = urlMatch ? urlMatch[1] : videoLink.href;

        const video = document.createElement('video');
        video.muted = true;
        video.loop = true;
        video.preload = 'auto';
        video.playsInline = true;
        video.src = videoUrl;

        const imageDiv = li.querySelector('.cards-card-image');
        if (imageDiv) imageDiv.append(video);

        videoLink.remove();

        li.addEventListener('mouseenter', () => video.play());
        li.addEventListener('mouseleave', () => video.pause());
      }
    });
  }
}
