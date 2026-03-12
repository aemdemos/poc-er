export default function decorate(block) {
  const rows = [...block.children];
  const tabs = [];
  let currentTab = null;

  // Parse rows into structured tab data
  // Row types: <strong> = tab label, <picture>/<img> = image,
  //   <h3> = heading, <ul> = bullet list, <p> = description, <a> = CTA
  rows.forEach((row) => {
    const cell = row.children[0];
    if (!cell) return;

    const text = cell.textContent.trim();

    // Tab header: cell has <strong>
    const strong = cell.querySelector('strong');
    if (strong) {
      currentTab = {
        label: strong.textContent.trim(),
        heading: '',
        description: null,
        image: null,
        ctas: [],
      };
      tabs.push(currentTab);
      return;
    }

    if (!currentTab) return;

    // Image row: cell has <picture> or <img>
    const pic = cell.querySelector('picture, img');
    if (pic && !cell.querySelector('h3, a, ul, strong')) {
      currentTab.image = cell.innerHTML;
      return;
    }

    // Heading row: cell has <h3>
    const h3 = cell.querySelector('h3');
    if (h3) {
      currentTab.heading = h3.textContent.trim();
      return;
    }

    // CTA row: cell has <a> link (check for <a> without surrounding <ul>)
    const link = cell.querySelector('a');
    if (link && !cell.querySelector('ul, h3, strong')) {
      currentTab.ctas.push({
        href: link.getAttribute('href'),
        text: link.textContent.trim(),
      });
      return;
    }

    // Description: cell has <ul> (bullet list)
    const ul = cell.querySelector('ul');
    if (ul) {
      currentTab.description = cell.innerHTML;
      return;
    }

    // Description fallback: plain text in <p>
    if (text && !cell.querySelector('strong, h3, a, picture, img')) {
      const p = document.createElement('p');
      p.textContent = text;
      currentTab.description = p.outerHTML;
    }
  });

  // Clear original content
  block.textContent = '';

  // Build tab navigation
  const tablist = document.createElement('div');
  tablist.className = 'ec-tabs';
  tablist.setAttribute('role', 'tablist');

  // Image container (shared — content swapped on tab switch)
  const imageContainer = document.createElement('div');
  imageContainer.className = 'ec-image';

  function switchTab(index) {
    block.classList.add('ec-transitioning');
    setTimeout(() => {
      tablist.querySelectorAll('.ec-tab').forEach((t, i) => {
        t.setAttribute('aria-selected', i === index);
      });
      block.querySelectorAll('.ec-panel').forEach((p, i) => {
        p.setAttribute('aria-hidden', i !== index);
      });
      if (tabs[index] && tabs[index].image) {
        imageContainer.innerHTML = tabs[index].image;
      }
      requestAnimationFrame(() => {
        block.classList.remove('ec-transitioning');
      });
    }, 250);
  }

  tabs.forEach((tab, i) => {
    const btn = document.createElement('button');
    btn.className = 'ec-tab';
    btn.textContent = tab.label;
    btn.setAttribute('role', 'tab');
    btn.setAttribute('aria-selected', i === 0);
    btn.addEventListener('click', () => switchTab(i));
    tablist.append(btn);
  });

  // Set initial image
  if (tabs.length > 0 && tabs[0].image) {
    imageContainer.innerHTML = tabs[0].image;
  }

  block.append(imageContainer);
  block.append(tablist);

  // Build tab panels (content below tabs)
  tabs.forEach((tab, tabIdx) => {
    const panel = document.createElement('div');
    panel.className = 'ec-panel';
    panel.setAttribute('role', 'tabpanel');
    panel.setAttribute('aria-hidden', tabIdx !== 0);

    if (tab.heading) {
      const h2 = document.createElement('h2');
      h2.textContent = tab.heading;
      panel.append(h2);
    }

    // Right column: description + CTAs (for two-column desktop layout)
    const right = document.createElement('div');
    right.className = 'ec-panel-right';

    if (tab.description) {
      const descWrapper = document.createElement('div');
      descWrapper.className = 'ec-description';
      descWrapper.innerHTML = tab.description;
      right.append(descWrapper);
    }

    if (tab.ctas.length > 0) {
      const ctaContainer = document.createElement('div');
      ctaContainer.className = 'ec-ctas';
      tab.ctas.forEach((cta) => {
        const a = document.createElement('a');
        a.href = cta.href;
        a.textContent = cta.text;
        a.className = 'ec-cta';
        ctaContainer.append(a);
      });
      right.append(ctaContainer);
    }

    panel.append(right);
    block.append(panel);
  });
}
