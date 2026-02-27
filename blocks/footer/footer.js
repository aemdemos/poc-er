import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

const SOCIAL_ICONS = {
  'instagram.com': 'instagram',
  'youtube.com': 'youtube',
  'facebook.com': 'facebook',
  'twitter.com': 'twitter',
};

/* Market data: country → site URL, retailers, and languages */
const MARKETS = {
  UAE: {
    siteUrl: 'https://www.landrover-uae.com',
    flag: '\u{1F1E6}\u{1F1EA}',
    languages: ['English', 'Arabic'],
    retailers: [
      { id: 202, name: 'Sheikh Zayed Road Showroom' },
      { id: 205, name: 'Sharjah Showroom' },
      { id: 204, name: 'Garhoud Showroom' },
      { id: 206, name: 'Fujairah Showroom' },
      { id: 207, name: 'Ras Al Khaimah Showroom' },
      { id: 203, name: 'Al Barsha Showroom - APPROVED' },
      { id: 208, name: 'Rawdhat Abu Dhabi Showroom' },
      { id: 209, name: 'Premier Motors Al Ain' },
    ],
  },
  'Saudi Arabia': {
    siteUrl: 'https://www.landrover-saudi.com',
    flag: '\u{1F1F8}\u{1F1E6}',
    languages: ['English', 'Arabic'],
    retailers: [
      { id: 64, name: 'Riyadh Northern Ring Road Showroom' },
      { id: 61, name: 'Riyadh Khorais Showroom' },
      { id: 56, name: 'Jeddah Showroom - Naghi Motors' },
      { id: 58, name: 'Jeddah Showroom' },
      { id: 60, name: 'Jeddah Heraa Showroom' },
      { id: 57, name: 'Dammam Showroom - Naghi Motors' },
    ],
  },
  Qatar: {
    siteUrl: 'https://www.landrover-qatar.com',
    flag: '\u{1F1F6}\u{1F1E6}',
    languages: ['English', 'Arabic'],
    retailers: [
      { id: 38, name: 'Lusail Showroom' },
      { id: 39, name: 'Al Sadd Showroom' },
      { id: 42, name: 'Industrial Area Showroom & Service Center' },
      { id: 40, name: 'Lusail Boulevard Showroom & Service Center' },
    ],
  },
  Oman: {
    siteUrl: 'https://www.landrover-oman.com',
    flag: '\u{1F1F4}\u{1F1F2}',
    languages: ['English', 'Arabic'],
    retailers: [
      { id: 28, name: 'Muscat Showroom' },
    ],
  },
  Bahrain: {
    siteUrl: 'https://www.landroverbahrain.com',
    flag: '\u{1F1E7}\u{1F1ED}',
    languages: ['English', 'Arabic'],
    retailers: [
      { id: 19, name: 'Euro Motors' },
    ],
  },
  Kuwait: {
    siteUrl: 'https://www.landroverkuwait.com',
    flag: '\u{1F1F0}\u{1F1FC}',
    languages: ['English', 'Arabic'],
    retailers: [
      { id: 38, name: 'Land Rover Showroom' },
      { id: 39, name: 'Land Rover Approved Showroom' },
    ],
  },
  Jordan: {
    siteUrl: 'https://www.landrover-jordan.com',
    flag: '\u{1F1EF}\u{1F1F4}',
    languages: ['English', 'Arabic'],
    retailers: [
      { id: 19, name: 'Mahmoudia Motors Showroom' },
    ],
  },
  Egypt: {
    siteUrl: 'https://www.landrover-egypt.com',
    flag: '\u{1F1EA}\u{1F1EC}',
    languages: ['English', 'Arabic'],
    retailers: [
      { id: 26, name: 'Joseph Tito Showroom - MTI Automotive' },
      { id: 29, name: 'New Cairo Service Centre - MTI Automotive' },
      { id: 30, name: 'Al Obour Service Center' },
      { id: 28, name: 'Abu Rawash Service Centre - MTI Automotive' },
    ],
  },
  Palestine: {
    siteUrl: 'https://www.landrover-palestine.com',
    flag: '\u{1F1F5}\u{1F1F8}',
    languages: ['English', 'Arabic'],
    retailers: [
      { id: 26, name: 'Showroom, Ramallah & Al Bireh' },
    ],
  },
  Iraq: {
    siteUrl: 'https://www.landrover-iraq.com',
    flag: '\u{1F1EE}\u{1F1F6}',
    languages: ['English', 'Arabic', 'Kurdish'],
    retailers: [
      { id: 30, name: 'Erbil Showroom' },
      { id: 29, name: 'Baghdad Showroom' },
    ],
  },
  Morocco: {
    siteUrl: 'https://www.landrover-maroc.com',
    flag: '\u{1F1F2}\u{1F1E6}',
    languages: ['English', 'Arabic', 'French'],
    retailers: [
      { id: 54, name: 'Showroom Casablanca' },
      { id: 55, name: 'Showroom Rabat' },
      { id: 60, name: 'Showroom Tangier' },
      { id: 57, name: 'Showroom Fes' },
      { id: 58, name: 'Showroom Oujda' },
      { id: 59, name: 'Showroom Marrakesh' },
    ],
  },
  Lebanon: {
    siteUrl: 'https://www.landrover-lebanon.com',
    flag: '\u{1F1F1}\u{1F1E7}',
    languages: ['English', 'Arabic', 'French'],
    retailers: [
      { id: 17, name: 'Mana Automotive' },
    ],
  },
  Tunisia: {
    siteUrl: 'https://www.landrover-tunisie.com',
    flag: '\u{1F1F9}\u{1F1F3}',
    languages: ['English', 'Arabic', 'French'],
    retailers: [
      { id: 22, name: 'Showroom du Lac' },
    ],
  },
  Algeria: {
    siteUrl: 'https://www.landrover-algerie.com',
    flag: '\u{1F1E9}\u{1F1FF}',
    languages: ['English', 'Arabic', 'French'],
    retailers: [
      { id: 17, name: 'Eurl DMAA' },
    ],
  },
  Azerbaijan: {
    siteUrl: 'https://www.landrover-azerbaijan.com',
    flag: '\u{1F1E6}\u{1F1FF}',
    languages: ['English', 'Azerbaijani'],
    retailers: [
      { id: 2, name: 'Autolux' },
    ],
  },
  Kazakhstan: {
    siteUrl: 'https://www.landrover-kazakhstan.com',
    flag: '\u{1F1F0}\u{1F1FF}',
    languages: ['English', 'Russian', 'Kazakh'],
    retailers: [
      { id: 20, name: 'Almaty' },
      { id: 21, name: 'Astana' },
    ],
  },
  Armenia: {
    siteUrl: 'https://www.landrover-armenia.com',
    flag: '\u{1F1E6}\u{1F1F2}',
    languages: ['English', 'Russian', 'Armenian'],
    retailers: [
      { id: 15, name: 'Fora Premium' },
    ],
  },
};

/**
 * Ensures social media links have icon spans,
 * even if the content pipeline strips them.
 */
function decorateSocialIcons(footer) {
  const socialSection = footer.querySelectorAll(':scope > .section')[1];
  if (!socialSection) return;

  socialSection.querySelectorAll('a').forEach((link) => {
    if (link.querySelector('.icon')) return;

    try {
      const url = new URL(link.href, window.location);
      const domain = Object.keys(SOCIAL_ICONS).find((d) => url.hostname.includes(d));
      if (domain) {
        const iconName = SOCIAL_ICONS[domain];
        const span = document.createElement('span');
        span.className = `icon icon-${iconName}`;
        const img = document.createElement('img');
        img.dataset.iconName = iconName;
        img.src = `${window.hlx.codeBasePath}/icons/${iconName}.svg`;
        img.alt = '';
        img.loading = 'lazy';
        img.width = 16;
        img.height = 16;
        span.append(img);
        link.prepend(span, ' ');
      }
    } catch { /* invalid URL, skip */ }
  });
}

/**
 * Creates a custom dropdown component.
 */
function createCustomSelect(label, defaultValue, options) {
  const field = document.createElement('div');
  field.className = 'retailer-finder-field';

  const labelEl = document.createElement('label');
  labelEl.textContent = label;

  const selectWrapper = document.createElement('div');
  selectWrapper.className = 'custom-select';
  selectWrapper.setAttribute('role', 'listbox');
  selectWrapper.setAttribute('aria-label', label);

  // Trigger
  const trigger = document.createElement('button');
  trigger.className = 'custom-select-trigger';
  trigger.setAttribute('type', 'button');
  trigger.setAttribute('aria-expanded', 'false');

  const triggerValue = document.createElement('span');
  triggerValue.className = 'custom-select-value';
  triggerValue.textContent = defaultValue.toUpperCase();

  const triggerChevron = document.createElement('span');
  triggerChevron.className = 'custom-select-chevron';

  trigger.append(triggerValue, triggerChevron);

  // Dropdown panel
  const panel = document.createElement('div');
  panel.className = 'custom-select-panel';

  options.forEach((opt) => {
    const item = document.createElement('div');
    item.className = 'custom-select-option';
    if (opt.value.toLowerCase() === defaultValue.toLowerCase()) {
      item.classList.add('selected');
    }
    item.setAttribute('role', 'option');
    item.dataset.value = opt.value;

    const text = document.createElement('span');
    text.className = 'custom-select-option-text';
    text.textContent = opt.value.toUpperCase();

    item.append(text);

    if (opt.flag) {
      const flag = document.createElement('span');
      flag.className = 'custom-select-option-flag';
      flag.textContent = opt.flag;
      item.append(flag);
    }

    item.addEventListener('click', () => {
      triggerValue.textContent = opt.value.toUpperCase();
      panel.querySelectorAll('.custom-select-option').forEach((o) => o.classList.remove('selected'));
      item.classList.add('selected');
      panel.prepend(item);
      selectWrapper.classList.remove('open');
      trigger.setAttribute('aria-expanded', 'false');
    });

    panel.append(item);
  });

  // Move the initially selected option to the top of the panel
  const selectedOption = panel.querySelector('.custom-select-option.selected');
  if (selectedOption) panel.prepend(selectedOption);

  // Toggle open/close
  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = selectWrapper.classList.contains('open');

    // Close all other dropdowns first
    document.querySelectorAll('.custom-select.open').forEach((s) => {
      s.classList.remove('open');
      s.querySelector('.custom-select-trigger').setAttribute('aria-expanded', 'false');
    });

    if (!isOpen) {
      selectWrapper.classList.add('open');
      trigger.setAttribute('aria-expanded', 'true');
    }
  });

  selectWrapper.append(trigger, panel);
  field.append(labelEl, selectWrapper);
  return field;
}

/**
 * Returns the dealer locator URL for a given country and retailer.
 */
function getDealerUrl(countryName, retailerId) {
  const market = MARKETS[countryName];
  if (!market) return '/en/dealer-locator';
  return `${market.siteUrl}/en/dealer-locator?id=${retailerId}`;
}

/**
 * Rebuilds the options inside a custom select panel.
 */
function rebuildSelectOptions(selectWrapper, options, defaultValue) {
  const panel = selectWrapper.querySelector('.custom-select-panel');
  const triggerValue = selectWrapper.querySelector('.custom-select-value');
  panel.innerHTML = '';
  triggerValue.textContent = defaultValue.toUpperCase();

  options.forEach((opt) => {
    const item = document.createElement('div');
    item.className = 'custom-select-option';
    if (opt.value.toLowerCase() === defaultValue.toLowerCase()) {
      item.classList.add('selected');
    }
    item.setAttribute('role', 'option');
    item.dataset.value = opt.value;

    const text = document.createElement('span');
    text.className = 'custom-select-option-text';
    text.textContent = opt.value.toUpperCase();
    item.append(text);

    if (opt.flag) {
      const flag = document.createElement('span');
      flag.className = 'custom-select-option-flag';
      flag.textContent = opt.flag;
      item.append(flag);
    }

    item.addEventListener('click', () => {
      triggerValue.textContent = opt.value.toUpperCase();
      panel.querySelectorAll('.custom-select-option').forEach((o) => o.classList.remove('selected'));
      item.classList.add('selected');
      panel.prepend(item);
      selectWrapper.classList.remove('open');
      selectWrapper.querySelector('.custom-select-trigger').setAttribute('aria-expanded', 'false');
    });

    panel.append(item);
  });

  const selectedOption = panel.querySelector('.custom-select-option.selected');
  if (selectedOption) panel.prepend(selectedOption);
}

/**
 * Transforms the retailer finder section from authored content
 * into interactive custom dropdown selectors with a CTA button.
 */
function decorateRetailerFinder(footer) {
  const sections = footer.querySelectorAll(':scope > .section');
  const retailerSection = sections[2];
  if (!retailerSection) return;

  const h3 = retailerSection.querySelector('h3');
  if (!h3 || !h3.textContent.toLowerCase().includes('find a retailer')) return;

  // Parse authored list items: "Label|Default Value"
  const items = retailerSection.querySelectorAll('li');
  const authored = {};
  items.forEach((li) => {
    const text = li.textContent.trim();
    const [label, value] = text.split('|').map((s) => s.trim());
    if (label && value) authored[label] = value;
  });

  const defaultCountry = authored.Countries || 'Egypt';
  const defaultLanguage = authored.Language || 'English';
  const market = MARKETS[defaultCountry] || MARKETS.Egypt;
  const defaultRetailer = authored.Retailer || market.retailers[0]?.name || '';

  // Get the CTA link
  const ctaLink = retailerSection.querySelector('a');
  const ctaText = ctaLink ? ctaLink.textContent.trim() : 'Find a Retailer';

  // Build the retailer finder UI
  const wrapper = retailerSection.querySelector('.default-content-wrapper');
  if (!wrapper) return;

  wrapper.innerHTML = '';
  wrapper.classList.add('retailer-finder');

  const form = document.createElement('div');
  form.className = 'retailer-finder-form';

  // Country options from MARKETS
  const countryOptions = Object.keys(MARKETS).map((name) => ({
    value: name,
    flag: MARKETS[name].flag,
  }));
  const countryField = createCustomSelect('Countries', defaultCountry, countryOptions);
  form.append(countryField);

  // Language dropdown
  const languageOptions = market.languages.map((l) => ({ value: l }));
  const languageField = createCustomSelect('Language', defaultLanguage, languageOptions);
  form.append(languageField);

  // Retailer dropdown
  const retailerOptions = market.retailers.map((r) => ({ value: r.name }));
  const retailerField = createCustomSelect('Retailer', defaultRetailer, retailerOptions);
  form.append(retailerField);

  // CTA button
  const selectedRetailer = market.retailers.find(
    (r) => r.name.toLowerCase() === defaultRetailer.toLowerCase(),
  ) || market.retailers[0];
  const ctaButton = document.createElement('a');
  ctaButton.className = 'retailer-finder-cta';
  ctaButton.href = getDealerUrl(defaultCountry, selectedRetailer?.id);
  ctaButton.textContent = ctaText.toUpperCase();
  form.append(ctaButton);

  // Wire up country changes → update retailer & language dropdowns + CTA
  const countrySelect = countryField.querySelector('.custom-select');
  countrySelect.addEventListener('click', (e) => {
    const option = e.target.closest('.custom-select-option');
    if (!option) return;
    const country = option.dataset.value;
    const m = MARKETS[country];
    if (!m) return;

    // Rebuild retailer dropdown
    const retailerSelect = retailerField.querySelector('.custom-select');
    const newRetailerOpts = m.retailers.map((r) => ({ value: r.name }));
    rebuildSelectOptions(retailerSelect, newRetailerOpts, m.retailers[0]?.name || '');

    // Rebuild language dropdown
    const languageSelect = languageField.querySelector('.custom-select');
    const newLangOpts = m.languages.map((l) => ({ value: l }));
    const keepLang = m.languages.includes('English') ? 'English' : m.languages[0];
    rebuildSelectOptions(languageSelect, newLangOpts, keepLang);

    // Update CTA link
    ctaButton.href = getDealerUrl(country, m.retailers[0]?.id);
  });

  // Wire up retailer changes → update CTA link
  const retailerSelect = retailerField.querySelector('.custom-select');
  retailerSelect.addEventListener('click', (e) => {
    const option = e.target.closest('.custom-select-option');
    if (!option) return;
    const retailerName = option.dataset.value;
    const countryTrigger = countrySelect.querySelector('.custom-select-value');
    const country = Object.keys(MARKETS).find(
      (c) => c.toUpperCase() === countryTrigger.textContent,
    );
    const m = MARKETS[country];
    if (!m) return;
    const r = m.retailers.find((ret) => ret.name === retailerName);
    if (r) ctaButton.href = getDealerUrl(country, r.id);
  });

  wrapper.append(form);

  // Close dropdowns when clicking outside
  document.addEventListener('click', () => {
    wrapper.querySelectorAll('.custom-select.open').forEach((s) => {
      s.classList.remove('open');
      s.querySelector('.custom-select-trigger').setAttribute('aria-expanded', 'false');
    });
  });
}

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  // load footer as fragment
  const footerMeta = getMetadata('footer');
  const footerPath = footerMeta ? new URL(footerMeta, window.location).pathname : '/footer';
  const fragment = await loadFragment(footerPath);

  // decorate footer DOM
  block.textContent = '';
  const footer = document.createElement('div');
  while (fragment.firstElementChild) footer.append(fragment.firstElementChild);

  decorateSocialIcons(footer);
  decorateRetailerFinder(footer);
  block.append(footer);
}
