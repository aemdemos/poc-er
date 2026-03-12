export default function decorate(block) {
  const rows = [...block.children];
  const tabs = [];
  let currentTab = null;

  // Parse rows into structured data
  rows.forEach((row) => {
    const cols = [...row.children];
    const col1 = cols[0];
    const col2 = cols[1];
    const col3 = cols[2];

    // Tab header row: first column has <strong> with tab name, second column empty
    const strong = col1.querySelector('strong');
    if (strong && (!col2 || !col2.textContent.trim())) {
      currentTab = { label: strong.textContent.trim(), mainImage: null, hotspots: [] };
      tabs.push(currentTab);
      return;
    }

    // Main image row: first column has picture/img, no coordinate text
    const pic = col1.querySelector('picture, img');
    if (pic && currentTab && !currentTab.mainImage) {
      currentTab.mainImage = col1.innerHTML;
      return;
    }

    // Hotspot item row: first column has "top, left" coordinates
    const coordText = col1.textContent.trim();
    const coordMatch = coordText.match(/^([\d.]+)\s*,\s*([\d.]+)$/);
    if (coordMatch && currentTab) {
      currentTab.hotspots.push({
        top: parseFloat(coordMatch[1]),
        left: parseFloat(coordMatch[2]),
        content: col2 ? col2.innerHTML : '',
        subImage: col3 ? col3.innerHTML : '',
      });
    }
  });

  block.textContent = '';

  // State - track active hotspot per tab (-1 means none selected)
  const state = {};
  tabs.forEach((_, i) => { state[i] = -1; });

  // Build tab navigation
  const tablist = document.createElement('div');
  tablist.className = 'hotspots-tabs';
  tablist.setAttribute('role', 'tablist');

  // Functions — defined before use
  function updateSlider(tabIdx) {
    const current = state[tabIdx];
    const detail = block.querySelector(`.hotspots-detail[data-tab="${tabIdx}"]`);

    // Update image slides
    detail.querySelectorAll('.hotspots-slide').forEach((s, i) => {
      s.classList.toggle('active', i === current);
    });

    // Update shared indicators
    detail.querySelectorAll('.hotspots-indicator').forEach((ind, i) => {
      ind.classList.toggle('active', i === current);
    });

    // Update content slides
    detail.querySelectorAll('.hotspots-slide-content').forEach((c, i) => {
      c.classList.toggle('active', i === current);
    });

    // Update dots on main image
    block.querySelectorAll(`.hotspots-panel[data-tab="${tabIdx}"] .hotspot-dot`).forEach((d, i) => {
      d.classList.toggle('active', i === current);
    });
  }

  function switchTab(index) {
    tablist.querySelectorAll('.hotspots-tab').forEach((t, i) => {
      t.setAttribute('aria-selected', i === index);
    });
    block.querySelectorAll('.hotspots-panel').forEach((p, i) => {
      p.setAttribute('aria-hidden', i !== index);
    });
    // Reset to closed state on tab switch
    state[index] = -1;
    const panel = block.querySelector(`.hotspots-panel[data-tab="${index}"]`);
    const main = panel.querySelector('.hotspots-main');
    const detail = panel.querySelector('.hotspots-detail');
    main.classList.remove('detail-open');
    detail.classList.remove('open');
    panel.querySelectorAll('.hotspot-dot').forEach((d) => d.classList.remove('active'));
  }

  function selectHotspot(tabIdx, hsIdx) {
    state[tabIdx] = hsIdx;
    const panel = block.querySelector(`.hotspots-panel[data-tab="${tabIdx}"]`);
    const main = panel.querySelector('.hotspots-main');
    const detail = panel.querySelector('.hotspots-detail');
    main.classList.add('detail-open');
    detail.classList.add('open');
    updateSlider(tabIdx);
  }

  function navigateSlide(tabIdx, direction) {
    const tab = tabs[tabIdx];
    const count = tab.hotspots.length;
    const current = state[tabIdx];
    const next = (current + direction + count) % count;
    selectHotspot(tabIdx, next);
  }

  function closeDetail(tabIdx) {
    state[tabIdx] = -1;
    const panel = block.querySelector(`.hotspots-panel[data-tab="${tabIdx}"]`);
    const main = panel.querySelector('.hotspots-main');
    const detail = panel.querySelector('.hotspots-detail');
    main.classList.remove('detail-open');
    detail.classList.remove('open');
    panel.querySelectorAll('.hotspot-dot').forEach((d) => d.classList.remove('active'));
  }

  tabs.forEach((tab, i) => {
    const btn = document.createElement('button');
    btn.className = 'hotspots-tab';
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
    panel.className = 'hotspots-panel';
    panel.setAttribute('role', 'tabpanel');
    panel.setAttribute('aria-hidden', tabIdx !== 0);
    panel.dataset.tab = tabIdx;

    const main = document.createElement('div');
    main.className = 'hotspots-main';

    // Image wrapper with dots
    const imageWrapper = document.createElement('div');
    imageWrapper.className = 'hotspots-image-wrapper';
    imageWrapper.innerHTML = tab.mainImage;

    tab.hotspots.forEach((hs, hsIdx) => {
      const dot = document.createElement('button');
      dot.className = 'hotspot-dot';
      dot.style.top = `${hs.top}%`;
      dot.style.left = `${hs.left}%`;
      dot.setAttribute('aria-label', `Hotspot ${hsIdx + 1}`);
      dot.dataset.index = hsIdx;
      dot.addEventListener('click', () => selectHotspot(tabIdx, hsIdx));
      imageWrapper.append(dot);
    });

    main.append(imageWrapper);

    // Detail side panel — hidden by default
    const detail = document.createElement('div');
    detail.className = 'hotspots-detail';
    detail.dataset.tab = tabIdx;

    const closeBtn = document.createElement('button');
    closeBtn.className = 'hotspots-close';
    closeBtn.setAttribute('aria-label', 'Close');
    closeBtn.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" fill="none"/></svg>';
    closeBtn.addEventListener('click', () => closeDetail(tabIdx));
    detail.append(closeBtn);

    // Slides container — images only
    const slidesContainer = document.createElement('div');
    slidesContainer.className = 'hotspots-slides';

    tab.hotspots.forEach((hs, hsIdx) => {
      const slide = document.createElement('div');
      slide.className = 'hotspots-slide';
      slide.dataset.index = hsIdx;

      if (hs.subImage) {
        const slideImg = document.createElement('div');
        slideImg.className = 'hotspots-slide-image';
        slideImg.innerHTML = hs.subImage;
        slide.append(slideImg);
      }

      slidesContainer.append(slide);
    });

    // Prev/Next navigation arrows on the slides
    const slideNav = document.createElement('div');
    slideNav.className = 'hotspots-slide-nav';
    slideNav.innerHTML = `
      <button type="button" class="hotspots-slide-prev" aria-label="Previous Slide"></button>
      <button type="button" class="hotspots-slide-next" aria-label="Next Slide"></button>
    `;
    slideNav.querySelector('.hotspots-slide-prev').addEventListener('click', () => navigateSlide(tabIdx, -1));
    slideNav.querySelector('.hotspots-slide-next').addEventListener('click', () => navigateSlide(tabIdx, 1));
    slidesContainer.append(slideNav);

    detail.append(slidesContainer);

    // Shared indicators — between image and content
    const indicators = document.createElement('div');
    indicators.className = 'hotspots-indicators';
    tab.hotspots.forEach((_, dotIdx) => {
      const ind = document.createElement('button');
      ind.className = 'hotspots-indicator';
      ind.setAttribute('aria-label', `Slide ${dotIdx + 1}`);
      ind.addEventListener('click', () => selectHotspot(tabIdx, dotIdx));
      indicators.append(ind);
    });
    detail.append(indicators);

    // Content slides
    const contentContainer = document.createElement('div');
    contentContainer.className = 'hotspots-content-slides';

    tab.hotspots.forEach((hs, hsIdx) => {
      const slideContent = document.createElement('div');
      slideContent.className = 'hotspots-slide-content';
      slideContent.dataset.index = hsIdx;
      slideContent.innerHTML = hs.content;
      contentContainer.append(slideContent);
    });

    detail.append(contentContainer);
    main.append(detail);
    panel.append(main);
    block.append(panel);
  });
}
