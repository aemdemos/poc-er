/**
 * Cards (hero) block parser
 * Extracts vehicle family hero cards from the "house of brands" section.
 * Each card gets: background image (col 1), brand name + CTA + video link (col 2).
 */
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
      const strong = document.createElement('strong');
      strong.textContent = image.alt;
      body.appendChild(strong);
      body.appendChild(document.createTextNode(' '));
      const cta = document.createElement('a');
      cta.href = link.href;
      cta.textContent = link.textContent.trim() || 'Enter';
      body.appendChild(cta);

      // Extract background video URL for hover playback
      const videoSource = item.querySelector('video source');
      if (videoSource && videoSource.src) {
        const videoLink = document.createElement('a');
        videoLink.href = videoSource.src;
        videoLink.textContent = 'video';
        body.appendChild(videoLink);
      }

      cells.push([image, body]);
    }
  });

  return cells;
}
