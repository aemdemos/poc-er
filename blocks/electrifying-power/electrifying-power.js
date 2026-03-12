export default function decorate(block) {
  const rows = [...block.children];
  const tabs = [];
  let currentTab = null;

  // Parse rows into structured data
  // Note: EDS wraps cell content in <p> tags, so we can't use <p> for detection
  rows.forEach((row) => {
    const cols = [...row.children];
    const col1 = cols[0];
    const col2 = cols[1];
    const col3 = cols[2];
    const col4 = cols[3];

    const col1Text = col1 ? col1.textContent.trim() : '';
    const col2Text = col2 ? col2.textContent.trim() : '';
    const col3Text = col3 ? col3.textContent.trim() : '';
    const col4Text = col4 ? col4.textContent.trim() : '';
    const restEmpty = !col2Text && !col3Text && !col4Text;

    // Tab header: first cell has <strong>, rest empty
    const strong = col1.querySelector('strong');
    if (strong && restEmpty) {
      currentTab = {
        label: strong.textContent.trim(),
        stats: [],
        heading: '',
        description: '',
        ctas: [],
        image: null,
        reversed: false,
      };
      tabs.push(currentTab);
      return;
    }

    if (!currentTab) return;

    // Heading row: first cell has <h3>
    const h3 = col1.querySelector('h3');
    if (h3) {
      currentTab.heading = h3.textContent.trim();
      return;
    }

    // Image row: first cell has <picture> or <img>
    const pic = col1.querySelector('picture, img');
    if (pic) {
      currentTab.image = col1.innerHTML;
      return;
    }

    // CTA row: first cell has <a> (not inside <p> as default text link)
    const link = col1.querySelector('a');
    if (link && restEmpty) {
      currentTab.ctas.push({
        href: link.getAttribute('href'),
        text: link.textContent.trim(),
      });
      return;
    }

    // Layout flag row
    if (col1Text === 'reversed' && restEmpty) {
      currentTab.reversed = true;
      return;
    }

    // Stat card row: col1 (tagline) + col2 (value) both have content
    if (col1Text && col2Text) {
      currentTab.stats.push({
        tagline: col1Text,
        value: col2Text,
        unit: col3Text,
        disclaimer: col4Text,
      });
      return;
    }

    // Description row: only first cell has text, rest empty
    if (col1Text && restEmpty) {
      currentTab.description = col1Text;
    }
  });

  // Clear original content
  block.textContent = '';

  // Build tab navigation
  const tablist = document.createElement('div');
  tablist.className = 'ep-tabs';
  tablist.setAttribute('role', 'tablist');

  function switchTab(index) {
    tablist.querySelectorAll('.ep-tab').forEach((t, i) => {
      t.setAttribute('aria-selected', i === index);
    });
    block.querySelectorAll('.ep-panel').forEach((p, i) => {
      p.setAttribute('aria-hidden', i !== index);
    });
  }

  tabs.forEach((tab, i) => {
    const btn = document.createElement('button');
    btn.className = 'ep-tab';
    btn.textContent = tab.label;
    btn.setAttribute('role', 'tab');
    btn.setAttribute('aria-selected', i === 0);
    btn.addEventListener('click', () => switchTab(i));
    tablist.append(btn);
  });
  block.append(tablist);

  // Build tab panels
  tabs.forEach((tab, tabIdx) => {
    const panel = document.createElement('div');
    panel.className = 'ep-panel';
    panel.setAttribute('role', 'tabpanel');
    panel.setAttribute('aria-hidden', tabIdx !== 0);

    const layout = document.createElement('div');
    layout.className = `ep-layout${tab.reversed ? ' ep-reversed' : ''}`;

    // Content side
    const content = document.createElement('div');
    content.className = 'ep-content';

    // Stats grid
    const statsGrid = document.createElement('div');
    statsGrid.className = 'ep-stats';

    tab.stats.forEach((stat) => {
      const card = document.createElement('div');
      card.className = 'ep-stat-card';

      const label = document.createElement('div');
      label.className = 'ep-stat-label';
      label.textContent = stat.tagline;

      const valueRow = document.createElement('div');
      valueRow.className = 'ep-stat-value-row';

      const num = document.createElement('span');
      num.className = 'ep-stat-number';
      num.textContent = stat.value;

      const unitEl = document.createElement('span');
      unitEl.className = 'ep-stat-unit';
      unitEl.textContent = stat.unit;

      valueRow.append(num, unitEl);
      card.append(label, valueRow);

      if (stat.disclaimer) {
        const disc = document.createElement('div');
        disc.className = 'ep-stat-disclaimer';
        disc.textContent = stat.disclaimer;
        card.append(disc);
      }

      statsGrid.append(card);
    });

    content.append(statsGrid);

    // Heading + description + CTAs
    const textBlock = document.createElement('div');
    textBlock.className = 'ep-text';

    if (tab.heading) {
      const h2 = document.createElement('h2');
      h2.textContent = tab.heading;
      textBlock.append(h2);
    }

    if (tab.description) {
      const p = document.createElement('p');
      p.textContent = tab.description;
      textBlock.append(p);
    }

    if (tab.ctas.length > 0) {
      const ctaContainer = document.createElement('div');
      ctaContainer.className = 'ep-ctas';
      tab.ctas.forEach((cta) => {
        const a = document.createElement('a');
        a.href = cta.href;
        a.textContent = cta.text;
        a.className = 'ep-cta';
        ctaContainer.append(a);
      });
      textBlock.append(ctaContainer);
    }

    content.append(textBlock);

    // Image side
    const imageContainer = document.createElement('div');
    imageContainer.className = 'ep-image';
    if (tab.image) {
      imageContainer.innerHTML = tab.image;
    }

    // Assemble layout (order depends on reversed flag)
    if (tab.reversed) {
      layout.append(imageContainer, content);
    } else {
      layout.append(content, imageContainer);
    }

    panel.append(layout);
    block.append(panel);
  });
}
