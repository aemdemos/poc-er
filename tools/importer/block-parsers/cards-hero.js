/**
 * Cards (hero) block parser
 * Extracts vehicle family hero cards from the "house of brands" section.
 * Each card gets: background image (col 1), wordmark + CTA + video link (col 2).
 */

const WORDMARK_MAP = {
  'Range Rover': '/icons/wordmark-range-rover.svg',
  Defender: '/icons/wordmark-defender.svg',
  Discovery: '/icons/wordmark-discovery.svg',
};

export default function parse(element, document) {
  const items = element.querySelectorAll('.jlr-house-of-brands-block__item');
  const cells = [['Cards (hero)']];

  items.forEach((item) => {
    const img = item.querySelector('.jlr-house-of-brands-block__item__bg-picture img');
    const link = item.querySelector('a.jlr-button--type-primary:not(.jlr-house-of-brands-block__item__button-hidden)');

    if (img && link) {
      const image = document.createElement('img');
      image.src = img.src;
      let alt = 'Discovery';
      if (link.href.includes('rangerover')) alt = 'Range Rover';
      else if (link.href.includes('defender')) alt = 'Defender';
      image.alt = alt;

      const body = document.createElement('div');

      // Wordmark image instead of plain text brand name
      const wordmarkSrc = WORDMARK_MAP[alt];
      if (wordmarkSrc) {
        const wordmark = document.createElement('img');
        wordmark.src = wordmarkSrc;
        wordmark.alt = alt;
        const p = document.createElement('p');
        p.appendChild(wordmark);
        body.appendChild(p);
      }

      const cta = document.createElement('a');
      cta.href = link.href;
      cta.textContent = link.textContent.trim() || 'Enter';
      body.appendChild(cta);

      // Extract background video URL for hover playback
      const videoSource = item.querySelector('video source');
      if (videoSource && videoSource.src) {
        const videoLink = document.createElement('a');
        videoLink.href = videoSource.src;
        videoLink.textContent = `video ${videoSource.src}`;
        body.appendChild(videoLink);
      }

      cells.push([image, body]);
    }
  });

  return cells;
}
