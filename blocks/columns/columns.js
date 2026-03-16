/* Helper: test whether a link is a video link (by text convention from the import parser) */
function isVideoLink(a) {
  return /^video\b/i.test(a.textContent.trim());
}

/* Extract the actual video URL from link text (DA mangles href, but preserves text).
 * Text format: "video-poster https://cdn.example.com/file.mp4"
 * Falls back to href for local preview where DA processing doesn't apply. */
function getVideoUrl(a) {
  const match = a.textContent.trim().match(/^(?:video-mobile|video-poster|video)\s+(https?:\/\/.+)/i);
  return match ? match[1] : a.href;
}

export default function decorate(block) {
  const cols = [...block.firstElementChild.children];
  block.classList.add(`columns-${cols.length}-cols`);

  /* Wrap standalone <img> in <picture> (mirrors AEM CDN behaviour) */
  block.querySelectorAll('img').forEach((img) => {
    if (img.parentElement.tagName !== 'PICTURE') {
      const picture = document.createElement('picture');
      img.before(picture);
      picture.append(img);
    }
  });

  /* Classify each column as image / masonry / text */
  [...block.children].forEach((row) => {
    [...row.children].forEach((col) => {
      const pics = col.querySelectorAll('picture');
      const videoLinks = [...col.querySelectorAll('a')].filter(isVideoLink);
      const allLinks = col.querySelectorAll('a');
      const hasNonVideoLinks = [...allLinks].some((a) => !isVideoLink(a));

      if (pics.length > 1 && !hasNonVideoLinks) {
        /* Multi-image masonry grid */
        col.classList.add('columns-masonry');

        /* Flag masonry on the right side (second column) */
        const colIndex = [...col.parentElement.children].indexOf(col);
        if (colIndex === 1) col.classList.add('columns-masonry-right');

        /* 0a. Unwrap video links from <p> / button-container wrappers.
         *     The EDS server wraps bare <a> in <p> via decorateButtons, which
         *     breaks poster detection (previousElementSibling). Move the <a>
         *     to the column level so it sits alongside <picture> siblings. */
        videoLinks.forEach((link) => {
          const parent = link.parentElement;
          if (parent && parent !== col && (parent.tagName === 'P' || parent.tagName === 'DIV')) {
            parent.before(link);
            if (!parent.textContent.trim() && !parent.querySelector('picture, img, a')) {
              parent.remove();
            }
          }
          link.classList.remove('button');
        });

        /* 0b. Tag every picture / video-link with its original position
         *     so we can restore correct order after DOM reshuffling. */
        let pos = 0;
        const tagItem = (el) => { el.dataset.gridPos = pos; pos += 1; };
        col.querySelectorAll('picture').forEach(tagItem);
        videoLinks.forEach(tagItem);

        /* 1. Convert video links into video wrappers.
         *    The poster picture is the link's previous element sibling (if any).
         *    EDS wraps bare <img> in <p>, so the poster may be inside a <p>. */
        videoLinks.forEach((link) => {
          const videoUrl = getVideoUrl(link);

          const video = document.createElement('video');
          video.src = videoUrl;
          video.muted = true;
          video.loop = true;
          video.playsInline = true;
          video.autoplay = true;

          const wrapper = document.createElement('div');
          wrapper.className = 'columns-masonry-video';

          /* Only absorb preceding image as poster when link text starts with 'video-poster' */
          const wantsPoster = link.textContent.trim().toLowerCase().startsWith('video-poster');
          const prevEl = link.previousElementSibling;
          let prevPic = null;
          if (wantsPoster && prevEl) {
            if (prevEl.tagName === 'PICTURE') {
              prevPic = prevEl;
            } else if (prevEl.tagName === 'P') {
              const innerPic = prevEl.querySelector(':scope > picture');
              if (innerPic) prevPic = innerPic;
            }
          }

          if (prevPic) {
            /* Use preceding picture as poster */
            const posterImg = prevPic.querySelector('img');
            video.poster = posterImg ? posterImg.currentSrc || posterImg.src : '';
            wrapper.dataset.gridPos = prevPic.dataset.gridPos;
            wrapper.append(prevPic);
            /* Remove empty <p> wrapper left behind */
            if (prevEl !== prevPic && !prevEl.textContent.trim() && !prevEl.querySelector('picture, img')) {
              prevEl.remove();
            }
          } else {
            /* Posterless video — keep its own grid position */
            wrapper.dataset.gridPos = link.dataset.gridPos || '0';
          }
          wrapper.append(video);
          link.before(wrapper);
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

        /* Set masonry-4 based on actual grid item count (pics + posterless videos) */
        if (gridItems.length >= 4) col.classList.add('columns-masonry-4');
      } else if (pics.length === 1 && !hasNonVideoLinks) {
        col.classList.add('columns-img-col');
      }
    });
  });

  /* Convert secondary button-containers to text links (› chevron style).
   * decorateButtons runs before block JS, so all links are already buttonized.
   * The first .button-container stays as a primary button; subsequent ones
   * become plain text links matching the original site's secondary CTA style. */
  block.querySelectorAll(
    '.columns-2-cols > div > div:not(.columns-img-col):not(.columns-masonry)',
  ).forEach((textCol) => {
    const containers = [...textCol.querySelectorAll('.button-container')];
    containers.forEach((container, idx) => {
      if (idx === 0) return; // keep first as primary button
      const a = container.querySelector('a.button');
      if (!a) return;
      a.classList.remove('button');
      container.classList.remove('button-container');
      container.classList.add('columns-text-link');
      container.insertBefore(document.createTextNode('\u203A '), a);
    });
  });
}
