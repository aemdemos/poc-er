/* Icon font character map — from JLR icons.woff */
const ICON_MAP = {
  configure: '\ue078',
  'steering-wheel': '\ue056',
  calculator: '\ue069',
  envelope: '\ue05b',
};

export default function decorate(block) {
  const items = [];

  /* Parse authored rows: each row = one quick link
   * Col 1: icon (span.icon.icon-{name}) or text
   * Col 2: link (<a>)
   */
  [...block.children].forEach((row) => {
    const cols = [...row.children];
    if (cols.length < 2) return;

    const iconCol = cols[0];
    const linkCol = cols[1];

    const link = linkCol.querySelector('a');
    if (!link) return;

    /* Resolve icon character from span.icon class name */
    const iconSpan = iconCol.querySelector('.icon');
    let iconChar = '';
    if (iconSpan) {
      const iconClass = [...iconSpan.classList].find((c) => c.startsWith('icon-'));
      const iconName = iconClass ? iconClass.substring(5) : '';
      iconChar = ICON_MAP[iconName] || '';
    }

    items.push({ iconChar, label: link.textContent.trim(), href: link.href });
  });

  /* Build floating sidebar markup */
  const nav = document.createElement('nav');
  nav.className = 'floating-quicklinks-nav';
  nav.setAttribute('aria-label', 'Quick links');

  const list = document.createElement('ul');

  items.forEach(({ iconChar, label, href }) => {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = href;
    a.setAttribute('aria-label', label);

    const iconWrap = document.createElement('span');
    iconWrap.className = 'floating-quicklinks-icon';
    iconWrap.textContent = iconChar;

    const labelSpan = document.createElement('span');
    labelSpan.className = 'floating-quicklinks-label';
    labelSpan.textContent = label;

    a.append(iconWrap);
    a.append(labelSpan);
    li.append(a);
    list.append(li);
  });

  nav.append(list);

  /* Replace block contents */
  block.textContent = '';
  block.append(nav);
}
