export default async function decorate(block) {
  const rows = [...block.children];
  const firstRow = rows[0]?.firstElementChild;
  const hasImage = firstRow?.querySelector('picture, img');

  if (hasImage) {
    // Background-image quote: row 1 = image, row 2 = text
    block.classList.add('has-background');
    const imageRow = rows[0];
    const textRow = rows[1];

    // Move picture to block level as background
    const picture = imageRow.querySelector('picture') || imageRow.querySelector('img');
    if (picture) {
      imageRow.remove();
      block.prepend(picture);
    }

    // Style text row
    if (textRow) {
      textRow.className = 'quote-text';
    }
  } else {
    // Standard quote: row 1 = quotation, row 2 = attribution
    const [quotation, attribution] = rows.map((c) => c.firstElementChild);
    const blockquote = document.createElement('blockquote');

    quotation.className = 'quote-quotation';
    blockquote.append(quotation);

    if (attribution) {
      attribution.className = 'quote-attribution';
      blockquote.append(attribution);
      const ems = attribution.querySelectorAll('em');
      ems.forEach((em) => {
        const cite = document.createElement('cite');
        cite.innerHTML = em.innerHTML;
        em.replaceWith(cite);
      });
    }
    block.innerHTML = '';
    block.append(blockquote);
  }
}
