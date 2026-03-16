export default function decorate(block) {
  const items = [];

  /* Parse authored rows: each row = one quick link
   * Col 1: icon glyph character (raw unicode from the JLR icon font)
   * Col 2: link (<a>)
   */
  [...block.children].forEach((row) => {
    const cols = [...row.children];
    if (cols.length < 2) return;

    const iconCol = cols[0];
    const linkCol = cols[1];

    const link = linkCol.querySelector('a');
    if (!link) return;

    const glyph = iconCol.textContent.trim();

    items.push({ glyph, label: link.textContent.trim(), href: link.href });
  });

  /* Build floating sidebar markup */
  const nav = document.createElement('nav');
  nav.className = 'floating-quicklinks-nav';
  nav.setAttribute('aria-label', 'Quick links');

  const list = document.createElement('ul');

  items.forEach(({ glyph, label, href }) => {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = href;
    a.setAttribute('aria-label', label);

    const iconSpan = document.createElement('span');
    iconSpan.className = 'floating-quicklinks-icon';
    iconSpan.textContent = glyph;

    const labelSpan = document.createElement('span');
    labelSpan.className = 'floating-quicklinks-label';
    labelSpan.textContent = label;

    a.append(iconSpan);
    a.append(labelSpan);
    li.append(a);
    list.append(li);
  });

  nav.append(list);

  /* Replace block contents */
  block.textContent = '';
  block.append(nav);
}
