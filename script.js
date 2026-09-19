(() => {
  'use strict';
  // Decorative, deterministic single-cell atlas. These are illustrations, not research data.
  const group = document.getElementById('cell-points');
  if (group) {
    const clusters = [
      [89, 78, 47, 28, '#788960'], [159, 121, 33, 21, '#a4aa70'],
      [233, 61, 43, 27, '#b7664b'], [289, 113, 34, 25, '#526f5e']
    ];
    clusters.forEach(([cx, cy, rx, ry, color], cluster) => {
      const clusterGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      clusterGroup.classList.add('cell-cluster');
      clusterGroup.style.setProperty('--cluster-delay', (cluster * 130) + 'ms');
      for (let i = 0; i < 80; i++) {
        const angle = i * 2.39996 + cluster;
        const radius = Math.sqrt((i + .5) / 80);
        const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        dot.setAttribute('cx', (cx + Math.cos(angle) * rx * radius).toFixed(2));
        dot.setAttribute('cy', (cy + Math.sin(angle) * ry * radius + Math.sin(i * .7) * 4).toFixed(2));
        dot.setAttribute('r', (1.3 + (i % 3) * .35).toFixed(2));
        dot.setAttribute('fill', color);
        dot.setAttribute('opacity', '.75');
        clusterGroup.append(dot);
      }
      group.append(clusterGroup);
    });
  }

  const heatmap = document.getElementById('heatmap-cells');
  if (heatmap) {
    const palette = ['#e8ebdf', '#d2dbc5', '#afc09d', '#778f70', '#b96a54'];
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 12; col++) {
        const cell = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        const signal = (row * 7 + col * 3 + (row === Math.floor(col / 2) ? 4 : 0)) % palette.length;
        cell.setAttribute('x', String(col * 23.5));
        cell.setAttribute('y', String(row * 24));
        cell.setAttribute('width', '20');
        cell.setAttribute('height', '20');
        cell.setAttribute('rx', '1.5');
        cell.setAttribute('fill', palette[signal]);
        heatmap.append(cell);
      }
    }
  }

  const trajectory = document.getElementById('trajectory-points');
  if (trajectory) {
    const branches = [
      [[38, 135], [165, 88], '#728a6c'], [[165, 88], [317, 34], '#b96852'],
      [[165, 88], [317, 142], '#9da968'], [[165, 88], [240, 20], '#587568']
    ];
    branches.forEach(([[x1, y1], [x2, y2], color], branch) => {
      for (let i = 0; i < 24; i++) {
        const t = i / 23;
        const bend = Math.sin(t * Math.PI) * (branch % 2 ? -12 : 12);
        const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        dot.setAttribute('cx', (x1 + (x2 - x1) * t + Math.sin(i * 2.1 + branch) * 4).toFixed(2));
        dot.setAttribute('cy', (y1 + (y2 - y1) * t + bend + Math.cos(i * 1.7) * 3).toFixed(2));
        dot.setAttribute('r', (1.5 + (i % 3) * .35).toFixed(2));
        dot.setAttribute('fill', color);
        dot.setAttribute('opacity', '.76');
        trajectory.append(dot);
      }
    });
  }

  // Native anchor links still work without JavaScript. This only tracks location.
  const links = [...document.querySelectorAll('nav a[href^="#"]')];
  const sections = links.map(link => document.querySelector(link.getAttribute('href'))).filter(Boolean);
  const progress = document.createElement('div');
  progress.className = 'reading-progress';
  progress.setAttribute('aria-hidden', 'true');
  document.body.append(progress);
  const timeline = document.querySelector('.timeline');
  let frame = 0;
  function updateNavigation() {
    frame = 0;
    const marker = document.querySelector('.site-header').getBoundingClientRect().bottom + 95;
    let active = null;
    for (const section of sections) {
      if (section.getBoundingClientRect().top <= marker) active = section.id;
    }
    links.forEach(link => {
      if (link.hash === '#' + active) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
    const distance = document.documentElement.scrollHeight - innerHeight;
    progress.style.transform = 'scaleX(' + (distance > 0 ? Math.min(1, Math.max(0, scrollY / distance)) : 0) + ')';
    if (timeline) {
      const rect = timeline.getBoundingClientRect();
      const amount = Math.max(0, Math.min(1, (innerHeight * .73 - rect.top) / rect.height));
      timeline.style.setProperty('--journey-progress', amount.toFixed(3));
    }
  }
  addEventListener('scroll', () => {
    if (!frame) frame = requestAnimationFrame(updateNavigation);
  }, { passive: true });
  addEventListener('resize', updateNavigation);
  updateNavigation();

  // Progressive enhancement: text is never hidden while waiting for an observer.
  // Motion is cancellable, follows live OS preference changes, and stops offscreen.
  const motionQuery = matchMedia('(prefers-reduced-motion: reduce)');
  const pointerQuery = matchMedia('(hover: hover) and (pointer: fine)');
  const motionButton = document.getElementById('motion-toggle');
  let motionPreference = 'on';
  try { motionPreference = localStorage.getItem('xiaoshan-motion') || 'on'; } catch {}
  let motionEnabled = false;
  const runningReveals = new Set();
  const art = document.querySelector('.hero-art');
  const stage = document.querySelector('.art-stage');
  let pointerFrame = 0;

  function resetArt() {
    cancelAnimationFrame(pointerFrame);
    pointerFrame = 0;
    if (stage) {
      stage.style.removeProperty('--art-rx');
      stage.style.removeProperty('--art-ry');
    }
  }
  function applyMotionPreference() {
    motionEnabled = motionPreference !== 'off' && !motionQuery.matches;
    document.documentElement.dataset.motion = motionEnabled ? 'on' : 'off';
    if (!motionEnabled) {
      runningReveals.forEach(animation => animation.cancel());
      runningReveals.clear();
      resetArt();
    }
    if (motionButton) {
      motionButton.hidden = false;
      motionButton.disabled = motionQuery.matches;
      motionButton.setAttribute('aria-pressed', String(motionEnabled));
      motionButton.textContent = motionQuery.matches ? '动效已随系统关闭' : motionEnabled ? '关闭页面动效' : '开启页面动效';
    }
  }
  motionButton?.addEventListener('click', () => {
    motionPreference = motionEnabled ? 'off' : 'on';
    try { localStorage.setItem('xiaoshan-motion', motionPreference); } catch {}
    applyMotionPreference();
  });
  motionQuery.addEventListener('change', applyMotionPreference);
  pointerQuery.addEventListener('change', resetArt);
  applyMotionPreference();

  if ('IntersectionObserver' in window) {
    const revealGroups = [
      ['.about-grid > div', 100], ['.milestones > div', 110], ['.section-heading', 0],
      ['.project', 140], ['.site-note', 0], ['.now-intro', 0], ['.now-list article', 90],
      ['.journey-layout > div', 0], ['.timeline li', 80], ['.belief > *', 100],
      ['.contact-main > *', 100]
    ];
    const revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        revealObserver.unobserve(entry.target);
        if (!motionEnabled || !entry.target.animate) return;
        const animation = entry.target.animate([
          { opacity: 0, transform: 'translateY(24px)' },
          { opacity: 1, transform: 'translateY(0)' }
        ], { duration: 850, delay: Number(entry.target.dataset.revealDelay || 0),
          easing: 'cubic-bezier(.16,1,.3,1)', fill: 'backwards' });
        runningReveals.add(animation);
        const cleanup = () => runningReveals.delete(animation);
        animation.addEventListener('finish', cleanup, { once: true });
        animation.addEventListener('cancel', cleanup, { once: true });
      });
    }, { threshold: .08, rootMargin: '0px 0px -22px 0px' });
    revealGroups.forEach(([selector, delay]) => {
      document.querySelectorAll(selector).forEach((el, index) => {
        el.dataset.revealDelay = String((index % 3) * delay);
        revealObserver.observe(el);
      });
    });
    const visibleObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        const el = entry.target;
        // One-shot art and rules keep their final state; ambient motion pauses.
        if (el.matches('.hero-art, .now-section, .status-dot')) {
          el.classList.toggle('motion-visible', entry.isIntersecting);
          if (el === art && !entry.isIntersecting) resetArt();
        } else if (entry.isIntersecting) {
          el.classList.add('motion-visible');
          visibleObserver.unobserve(el);
        }
      });
    }, { threshold: .08 });
    document.querySelectorAll('.hero-art, .now-section, .project, .section-label, .status-dot').forEach(el => visibleObserver.observe(el));
  }
  art?.addEventListener('pointermove', event => {
    if (!motionEnabled || !pointerQuery.matches || event.pointerType !== 'mouse') return;
    const rect = art.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - .5;
    const y = (event.clientY - rect.top) / rect.height - .5;
    cancelAnimationFrame(pointerFrame);
    pointerFrame = requestAnimationFrame(() => {
      stage.style.setProperty('--art-rx', (-y * 3).toFixed(2) + 'deg');
      stage.style.setProperty('--art-ry', (x * 3).toFixed(2) + 'deg');
    });
  });
  art?.addEventListener('pointerleave', resetArt);
  function updatePageVisibility() {
    document.documentElement.toggleAttribute('data-page-hidden', document.hidden);
    if (document.hidden) {
      resetArt();
      runningReveals.forEach(animation => animation.pause());
    } else runningReveals.forEach(animation => animation.play());
  }
  document.addEventListener('visibilitychange', updatePageVisibility);
  updatePageVisibility();

  const copyButton = document.getElementById('copy-email');
  const status = document.getElementById('copy-status');
  let statusTimeout;
  copyButton?.addEventListener('click', async () => {
    clearTimeout(statusTimeout);
    try {
      await navigator.clipboard.writeText('wqshan2025@163.com');
      status.textContent = '邮箱已复制';
    } catch {
      status.textContent = '请长按或选中上方邮箱复制';
    }
    statusTimeout = setTimeout(() => { status.textContent = ''; }, 5000);
  });
})();
