/* eslint-disable */
/**
 * Build and Order Block
 *
 * Two-level tabbed model/trim chooser with vehicle images and CTAs.
 *
 * Block table format (two columns):
 *   Row: <h3>model name</h3>  |  (empty)           — model group (level-1 tab)
 *   Row: <strong>trim</strong> |  <picture>/<img>   — trim + vehicle image
 *   Row: <strong><a>CTA</a></strong> | <a>CTA</a>  — primary + secondary CTAs
 */
export default function decorate(block) {
  const rows = [...block.children];

  // Parse rows into structured data
  const models = [];
  const ctas = [];
  let currentModel = null;

  rows.forEach((row) => {
    const cells = [...row.children];
    const col1 = cells[0];
    const col2 = cells[1];
    if (!col1) return;

    const h3 = col1.querySelector('h3');
    const strong = col1.querySelector('strong');
    const link = col1.querySelector('a');

    if (h3) {
      // Model group row: h3 in col1
      currentModel = { name: h3.textContent.trim(), trims: [] };
      models.push(currentModel);
    } else if (strong && !link) {
      // Trim row: label in col1, image in col2
      if (!currentModel) {
        currentModel = { name: '', trims: [] };
        models.push(currentModel);
      }
      const trim = { label: strong.textContent.trim(), image: '' };
      if (col2) {
        const picture = col2.querySelector('picture') || col2.querySelector('img');
        if (picture) {
          const img = picture.tagName === 'IMG' ? picture : picture.querySelector('img');
          if (img) trim.image = img.closest('picture')?.outerHTML || img.outerHTML;
        }
      }
      currentModel.trims.push(trim);
    } else if (link) {
      // CTA row: primary (strong>a) in col1, secondary (a) in col2
      ctas.push({
        text: link.textContent.trim(),
        href: link.href,
        primary: !!link.closest('strong'),
      });
      if (col2) {
        const secondaryLink = col2.querySelector('a');
        if (secondaryLink) {
          ctas.push({
            text: secondaryLink.textContent.trim(),
            href: secondaryLink.href,
            primary: !!secondaryLink.closest('strong'),
          });
        }
      }
    }
  });

  if (models.length === 0) return;

  // Clear the block
  block.textContent = '';

  // Model tabs (level 1) — hidden if only one unnamed model
  const hasModelTabs = models.length > 1 || (models.length === 1 && models[0].name);
  const modelTablist = document.createElement('div');
  modelTablist.className = 'bo-model-tabs';
  modelTablist.setAttribute('role', 'tablist');
  if (!hasModelTabs) modelTablist.hidden = true;

  // Image container (shared, swaps on trim change) — placed after model tabs
  const imageContainer = document.createElement('div');
  imageContainer.className = 'bo-image';

  // Trim panels (one per model, each containing its own trim tablist)
  const trimPanels = [];

  // Tab switching functions (defined before use)
  const switchModel = (modelIdx) => {
    block.classList.add('bo-transitioning');
    setTimeout(() => {
      modelTablist.querySelectorAll('.bo-model-tab').forEach((t, idx) => {
        t.setAttribute('aria-selected', idx === modelIdx);
      });
      trimPanels.forEach((p, idx) => {
        p.setAttribute('aria-hidden', idx !== modelIdx);
      });
      const firstTrim = models[modelIdx].trims[0];
      if (firstTrim?.image) {
        imageContainer.innerHTML = firstTrim.image;
      }
      trimPanels[modelIdx].querySelectorAll('.bo-trim-tab').forEach((t, idx) => {
        t.setAttribute('aria-selected', idx === 0);
      });
      requestAnimationFrame(() => block.classList.remove('bo-transitioning'));
    }, 250);
  };

  const switchTrim = (modelIdx, trimIdx) => {
    block.classList.add('bo-transitioning');
    setTimeout(() => {
      const trim = models[modelIdx].trims[trimIdx];
      if (trim?.image) {
        imageContainer.innerHTML = trim.image;
      }
      trimPanels[modelIdx].querySelectorAll('.bo-trim-tab').forEach((t, idx) => {
        t.setAttribute('aria-selected', idx === trimIdx);
      });
      requestAnimationFrame(() => block.classList.remove('bo-transitioning'));
    }, 250);
  };

  models.forEach((model, idx) => {
    const btn = document.createElement('button');
    btn.className = 'bo-model-tab';
    btn.setAttribute('role', 'tab');
    btn.setAttribute('aria-selected', idx === 0);
    btn.textContent = model.name;
    btn.addEventListener('click', () => switchModel(idx));
    modelTablist.append(btn);
  });
  block.append(modelTablist);
  block.append(imageContainer);

  models.forEach((model, modelIdx) => {
    const panel = document.createElement('div');
    panel.className = 'bo-trim-panel';
    panel.setAttribute('aria-hidden', modelIdx !== 0);

    const trimTablist = document.createElement('div');
    trimTablist.className = 'bo-trim-tabs';
    trimTablist.setAttribute('role', 'tablist');

    model.trims.forEach((trim, trimIdx) => {
      const btn = document.createElement('button');
      btn.className = 'bo-trim-tab';
      btn.setAttribute('role', 'tab');
      btn.setAttribute('aria-selected', trimIdx === 0);
      btn.textContent = trim.label;
      btn.addEventListener('click', () => switchTrim(modelIdx, trimIdx));
      trimTablist.append(btn);
    });

    panel.append(trimTablist);
    trimPanels.push(panel);
    block.append(panel);
  });

  // CTAs
  if (ctas.length > 0) {
    const ctaContainer = document.createElement('div');
    ctaContainer.className = 'bo-ctas';
    ctas.forEach((cta) => {
      const a = document.createElement('a');
      a.href = cta.href;
      a.textContent = cta.text;
      a.className = cta.primary ? 'bo-cta-primary' : 'bo-cta-secondary';
      ctaContainer.append(a);
    });
    block.append(ctaContainer);
  }

  // Set initial image
  if (models[0].trims[0]?.image) {
    imageContainer.innerHTML = models[0].trims[0].image;
  }
}
