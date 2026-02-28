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

  /* Add down-arrow icon to CTA links (excluding video links) */
  block.querySelectorAll('a:not([href$=".mp4"])').forEach((link) => {
    const arrow = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    arrow.setAttribute('class', 'hero-arrow-icon');
    arrow.setAttribute('viewBox', '0 0 24 24');
    arrow.setAttribute('aria-hidden', 'true');
    arrow.innerHTML = '<path d="M18.31 14.84Q18.57 15.01 18.61 15.35Q18.65 15.7 18.53 15.87L12.64 22.61Q12.6 22.66 12.55 22.74Q12.55 22.79 12.53 22.81Q12.51 22.83 12.47 22.83L12.38 22.91Q12.3 23 11.99 23Q11.74 23 11.65 22.91L11.52 22.83Q11.48 22.79 11.44 22.72Q11.39 22.66 11.35 22.61L5.59 15.95Q5.38 15.78 5.38 15.39Q5.38 15.01 5.59 14.84Q6.37 14.32 6.8 14.92L11.09 19.99V1.82Q11.09 1 11.91 1Q12.73 1 12.73 1.82V19.99L17.15 14.92Q17.67 14.41 18.31 14.84Z"/>';
    link.prepend(arrow);
  });

  /* Video background: find .mp4 link, replace with <video> element */
  const videoLink = block.querySelector('a[href$=".mp4"]');
  if (videoLink) {
    const video = document.createElement('video');
    video.muted = true;
    video.autoplay = true;
    video.loop = true;
    video.playsInline = true;
    video.preload = 'auto';

    const source = document.createElement('source');
    source.src = videoLink.href;
    source.type = 'video/mp4';
    video.append(source);

    /* Place video alongside the background picture */
    const pictureDiv = block.querySelector('picture')?.closest('div > div');
    if (pictureDiv) {
      pictureDiv.append(video);
    }

    videoLink.remove();

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
