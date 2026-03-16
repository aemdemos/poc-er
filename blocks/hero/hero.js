/* Helper: test whether a link is a video link (by text convention from the import parser) */
function isVideoLink(a) {
  return /^video\b/i.test(a.textContent.trim());
}

/* Extract the actual video URL from link text (DA mangles href, but preserves text).
 * Text format: "video https://cdn.example.com/file.mp4"
 * Falls back to href for local preview where DA processing doesn't apply. */
function getVideoUrl(a) {
  const match = a.textContent.trim().match(/^(?:video-mobile|video-poster|video)\s+(https?:\/\/.+)/i);
  return match ? match[1] : a.href;
}

/* Return the video type keyword from the link text */
function getVideoType(a) {
  const t = a.textContent.trim().toLowerCase();
  if (t.startsWith('video-mobile')) return 'video-mobile';
  return 'video';
}

export default function decorate(block) {
  /* Parse markdown headings – EDS doesn't process # syntax inside table cells */
  block.querySelectorAll('p').forEach((p) => {
    const text = p.textContent.trim();
    if (text.startsWith('# ')) {
      const h1 = document.createElement('h1');
      h1.textContent = text.substring(2).trim();
      p.replaceWith(h1);
    }
  });

  const isModelOverview = block.classList.contains('model-overview');

  if (isModelOverview) {
    /* Model-overview variant: tag CTA buttons for CSS-driven font icons */
    const ctaLinks = [...block.querySelectorAll('.button-container a')]
      .filter((a) => !isVideoLink(a));
    if (ctaLinks[0]) ctaLinks[0].classList.add('hero-cta-primary');
    if (ctaLinks[1]) ctaLinks[1].classList.add('hero-cta-secondary');

    /* Wrap non-video button containers in a flex row */
    const btnContainers = [...block.querySelectorAll('.button-container')]
      .filter((bc) => !bc.querySelector('a') || !isVideoLink(bc.querySelector('a')));
    if (btnContainers.length > 0) {
      const row = document.createElement('div');
      row.className = 'hero-cta-row';
      btnContainers[0].parentNode.insertBefore(row, btnContainers[0]);
      btnContainers.forEach((bc) => row.appendChild(bc));
    }
  } else {
    /* Default: add down-arrow icon to CTA links (excluding video links) */
    block.querySelectorAll('a').forEach((link) => {
      if (isVideoLink(link)) return;
      const arrow = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      arrow.setAttribute('class', 'hero-arrow-icon');
      arrow.setAttribute('viewBox', '0 0 24 24');
      arrow.setAttribute('aria-hidden', 'true');
      arrow.innerHTML = '<path d="M18.31 14.84Q18.57 15.01 18.61 15.35Q18.65 15.7 18.53 15.87L12.64 22.61Q12.6 22.66 12.55 22.74Q12.55 22.79 12.53 22.81Q12.51 22.83 12.47 22.83L12.38 22.91Q12.3 23 11.99 23Q11.74 23 11.65 22.91L11.52 22.83Q11.48 22.79 11.44 22.72Q11.39 22.66 11.35 22.61L5.59 15.95Q5.38 15.78 5.38 15.39Q5.38 15.01 5.59 14.84Q6.37 14.32 6.8 14.92L11.09 19.99V1.82Q11.09 1 11.91 1Q12.73 1 12.73 1.82V19.99L17.15 14.92Q17.67 14.41 18.31 14.84Z"/>';
      link.prepend(arrow);
    });
  }

  /* Video background: find all video links by text convention, replace with <video> */
  const videoLinks = [...block.querySelectorAll('a')].filter(isVideoLink);
  if (videoLinks.length > 0) {
    const video = document.createElement('video');
    video.muted = true;
    video.autoplay = true;
    video.loop = true;
    video.playsInline = true;
    video.preload = 'auto';

    /* Separate desktop vs mobile sources by link text convention */
    const desktopLink = videoLinks.find((a) => getVideoType(a) === 'video')
      || videoLinks[0];
    const mobileLink = videoLinks.find((a) => getVideoType(a) === 'video-mobile');

    if (mobileLink && desktopLink) {
      /* Responsive sources: mobile for narrow screens, desktop for wide */
      const mobileSrc = document.createElement('source');
      mobileSrc.src = getVideoUrl(mobileLink);
      mobileSrc.type = 'video/mp4';
      mobileSrc.media = '(max-width: 899px)';
      video.append(mobileSrc);

      const desktopSrc = document.createElement('source');
      desktopSrc.src = getVideoUrl(desktopLink);
      desktopSrc.type = 'video/mp4';
      desktopSrc.media = '(min-width: 900px)';
      video.append(desktopSrc);
    } else {
      /* Single source — no media query needed */
      const source = document.createElement('source');
      source.src = getVideoUrl(desktopLink);
      source.type = 'video/mp4';
      video.append(source);
    }

    /* Place video in the background media container (first row's inner div) */
    const pictureDiv = block.querySelector('picture')?.closest('div > div')
      || block.querySelector(':scope > div:first-child > div');
    if (pictureDiv) {
      pictureDiv.append(video);
    }

    /* Remove all video links — only remove parent container if it has no other content */
    videoLinks.forEach((link) => {
      const container = link.closest('.button-container') || link.closest('p');
      if (container) {
        link.remove();
        /* Remove the container only if it's now empty */
        if (!container.textContent.trim() && !container.querySelector('a, img, picture')) {
          container.remove();
        }
      } else {
        link.remove();
      }
    });

    /* Play/pause toggle – circular ring with centered icon (matches original site) */
    const btn = document.createElement('button');
    btn.className = 'hero-video-toggle';
    btn.setAttribute('aria-label', 'Pause video');
    btn.innerHTML = `
      <svg class="hero-toggle-ring" viewBox="50 50 100 100">
        <circle cx="100" cy="100" r="45" fill="none"
          style="stroke-dasharray: 283;"></circle>
      </svg>
      <svg class="hero-toggle-progress" viewBox="50 50 100 100">
        <circle cx="100" cy="100" r="45" fill="none"
          style="stroke-dasharray: 283; stroke-dashoffset: 283;"></circle>
      </svg>
      <svg class="hero-icon hero-icon-pause" viewBox="0 0 24 24"
        fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
        <line x1="8" y1="5" x2="8" y2="19"/>
        <line x1="16" y1="5" x2="16" y2="19"/>
      </svg>
      <svg class="hero-icon hero-icon-play" viewBox="0 0 24 24" style="display:none"
        fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round">
        <polygon points="8,4 20,12 8,20"/>
      </svg>`;
    block.append(btn);

    const pauseIcon = btn.querySelector('.hero-icon-pause');
    const playIcon = btn.querySelector('.hero-icon-play');

    btn.addEventListener('click', () => {
      if (video.paused) {
        video.play();
        pauseIcon.style.display = '';
        playIcon.style.display = 'none';
        btn.setAttribute('aria-label', 'Pause video');
        block.classList.remove('hero-paused');
      } else {
        video.pause();
        pauseIcon.style.display = 'none';
        playIcon.style.display = '';
        btn.setAttribute('aria-label', 'Play video');
        block.classList.add('hero-paused');
      }
    });
  }
}
