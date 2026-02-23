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
      if (div.children.length === 1 && div.querySelector(':scope > picture')) div.className = 'cards-card-image';
      else div.className = 'cards-card-body';
    });
    ul.append(li);
  });
  ul.querySelectorAll('picture > img').forEach((img) => {
    const optimizedPic = createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]);
    moveInstrumentation(img, optimizedPic.querySelector('img'));
    img.closest('picture').replaceWith(optimizedPic);
  });
  block.textContent = '';
  block.append(ul);

  /* hero variant: video backgrounds that play on hover */
  if (block.classList.contains('hero')) {
    ul.querySelectorAll('li').forEach((li) => {
      const videoLink = li.querySelector('.cards-card-body a[href$=".mp4"]');
      if (videoLink) {
        const video = document.createElement('video');
        video.muted = true;
        video.loop = true;
        video.preload = 'auto';
        video.playsInline = true;
        video.src = videoLink.href;

        const imageDiv = li.querySelector('.cards-card-image');
        if (imageDiv) imageDiv.append(video);

        videoLink.remove();

        li.addEventListener('mouseenter', () => video.play());
        li.addEventListener('mouseleave', () => video.pause());
      }
    });
  }
}
