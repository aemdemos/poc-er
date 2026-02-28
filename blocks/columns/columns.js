export default function decorate(block) {
  const cols = [...block.firstElementChild.children];
  block.classList.add(`columns-${cols.length}-cols`);

  /* Classify each column as image / masonry / text */
  [...block.children].forEach((row) => {
    [...row.children].forEach((col) => {
      const pics = col.querySelectorAll('picture');
      const hasNonVideoLinks = col.querySelector('a:not([href$=".mp4"])');

      if (pics.length > 1 && !hasNonVideoLinks) {
        /* Multi-image masonry grid */
        col.classList.add('columns-masonry');
        if (pics.length === 4) col.classList.add('columns-masonry-4');

        /* 0. Tag every picture / video-link with its original position
         *    so we can restore correct order after DOM reshuffling. */
        let pos = 0;
        const tagItem = (el) => { el.dataset.gridPos = pos; pos += 1; };
        col.querySelectorAll('picture, a[href$=".mp4"]').forEach(tagItem);

        /* 1. Convert .mp4 links into video wrappers.
         *    The poster picture is the link's previous element sibling. */
        col.querySelectorAll('a[href$=".mp4"]').forEach((link) => {
          const videoUrl = link.href;
          const prevPic = link.previousElementSibling;
          if (prevPic && prevPic.tagName === 'PICTURE') {
            const posterImg = prevPic.querySelector('img');
            const posterSrc = posterImg ? posterImg.currentSrc || posterImg.src : '';

            const video = document.createElement('video');
            video.src = videoUrl;
            video.poster = posterSrc;
            video.muted = true;
            video.loop = true;
            video.playsInline = true;
            video.autoplay = true;

            const wrapper = document.createElement('div');
            wrapper.className = 'columns-masonry-video';
            /* Carry the poster picture's position to the wrapper */
            wrapper.dataset.gridPos = prevPic.dataset.gridPos;
            wrapper.append(prevPic);
            wrapper.append(video);
            link.before(wrapper);
          }
          link.remove();
        });

        /* 2. Move video wrappers out of any <p> parents */
        col.querySelectorAll('.columns-masonry-video').forEach((w) => {
          if (w.parentElement.tagName === 'P') {
            w.parentElement.before(w);
          }
        });

        /* 3. Unwrap any pictures still inside <p> tags */
        col.querySelectorAll('p > picture').forEach((pic) => {
          pic.parentElement.before(pic);
        });

        /* 4. Clean up empty <p> tags */
        col.querySelectorAll('p').forEach((p) => {
          if (!p.textContent.trim() && !p.querySelector('picture, img')) p.remove();
        });

        /* 5. Re-append grid items sorted by original position */
        const gridItems = [...col.querySelectorAll(':scope > picture, :scope > .columns-masonry-video')];
        gridItems.sort((a, b) => (+(a.dataset.gridPos || 0)) - (+(b.dataset.gridPos || 0)));
        gridItems.forEach((item) => {
          delete item.dataset.gridPos;
          col.append(item);
        });
      } else if (pics.length === 1 && !hasNonVideoLinks) {
        col.classList.add('columns-img-col');
      }
    });
  });

  /* Process text columns in 2-col layouts */
  block.querySelectorAll(
    '.columns-2-cols > div > div:not(.columns-img-col):not(.columns-masonry)',
  ).forEach((textCol) => {
    const p = textCol.querySelector('p');
    if (!p) return;

    /* 1. Collect links and remove them from the paragraph */
    const links = [...p.querySelectorAll('a')];
    links.forEach((link) => link.remove());

    /* 2. Parse "## HEADING description" text */
    const text = p.textContent.trim();
    if (text.startsWith('## ')) {
      const rest = text.substring(3).trim();
      /* Heading = leading ALL-CAPS / digit-only words */
      const match = rest.match(/^((?:[A-Z0-9]+(?:\s+|$))+)([\s\S]*)/);
      if (match) {
        const h2 = document.createElement('h2');
        h2.textContent = match[1].trim();
        p.before(h2);

        const desc = match[2].trim();
        if (desc) {
          p.textContent = desc;
        } else {
          p.remove();
        }
      }
    } else if (!text) {
      p.remove();
    }

    /* 3. Build CTA container from collected links */
    if (links.length > 0) {
      const ctaDiv = document.createElement('div');
      ctaDiv.className = 'columns-cta';
      links.forEach((link) => {
        const label = link.textContent.trim().toUpperCase();
        link.classList.add(
          label === 'BUILD YOUR OWN' ? 'columns-cta-secondary' : 'columns-cta-primary',
        );
        ctaDiv.append(link);
      });
      textCol.append(ctaDiv);
    }
  });
}
