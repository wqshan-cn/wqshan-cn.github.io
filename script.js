(() => {
  'use strict';
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

  function playTransient(element, keyframes, options) {
    if (!motionEnabled || !element?.animate) return;
    const animation = element.animate(keyframes, options);
    runningReveals.add(animation);
    const cleanup = () => runningReveals.delete(animation);
    animation.addEventListener('finish', cleanup, { once: true });
    animation.addEventListener('cancel', cleanup, { once: true });
  }

  const figures = [
    { src: './assets/research-figures/figure-01.webp', label: 'FIG. 01', title: 'STUDY WORKFLOW', alt: '论文主图 1：研究流程图', position: '50% 50%' },
    { src: './assets/research-figures/figure-02.webp', label: 'FIG. 02', title: 'DIFFERENTIAL EXPRESSION', alt: '论文主图 2：差异表达与通路分析', position: '50% 28%' },
    { src: './assets/research-figures/figure-03.webp', label: 'FIG. 03', title: 'MODEL CONSTRUCTION', alt: '论文主图 3：模型构建与生存分析', position: '50% 34%' },
    { src: './assets/research-figures/figure-04.webp', label: 'FIG. 04', title: 'SINGLE-CELL LANDSCAPE', alt: '论文主图 4：单细胞图谱与细胞通讯分析', position: '50% 29%' },
    { src: './assets/research-figures/figure-05.webp', label: 'FIG. 05', title: 'SPATIAL TRANSCRIPTOMICS', alt: '论文主图 5：细胞轨迹与空间转录组分析', position: '50% 33%' },
    { src: './assets/research-figures/figure-06.webp', label: 'FIG. 06', title: 'CLINICAL ASSOCIATION', alt: '论文主图 6：临床关联与通路富集分析', position: '50% 30%' },
    { src: './assets/research-figures/figure-07.webp', label: 'FIG. 07', title: 'EXPRESSION VALIDATION', alt: '论文主图 7：基因表达与临床特征验证', position: '50% 30%' },
    { src: './assets/research-figures/figure-08.webp', label: 'FIG. 08', title: 'EXPERIMENTAL VALIDATION', alt: '论文主图 8：实验验证与组织学结果', position: '50% 27%' },
    { src: './assets/research-figures/supp-01.webp', label: 'SUPP. 01', title: 'EXPRESSION HEATMAPS', alt: '论文补充图 1：差异表达热图', position: '50% 50%' },
    { src: './assets/research-figures/supp-02.webp', label: 'SUPP. 02', title: 'SURVIVAL ANALYSIS', alt: '论文补充图 2：生存分析曲线', position: '50% 35%' }
  ];
  const figureCarousel = document.getElementById('figure-carousel');
  const activeFigure = document.getElementById('figure-active');
  const backOne = document.getElementById('figure-back-one');
  const backTwo = document.getElementById('figure-back-two');
  const figureLabel = document.getElementById('figure-label');
  const figureTitle = document.getElementById('figure-title');
  const figurePosition = document.getElementById('figure-position');
  const figureTabs = [...document.querySelectorAll('[data-figure]')];
  const lightbox = document.getElementById('figure-lightbox');
  const lightboxImage = document.getElementById('lightbox-image');
  let currentFigure = 0;

  function assignFigure(image, figure, includeAlt = false) {
    if (!image) return;
    image.src = figure.src;
    image.style.objectPosition = figure.position;
    if (includeAlt) image.alt = figure.alt;
  }
  function showFigure(index, direction = 1) {
    currentFigure = (index + figures.length) % figures.length;
    const current = figures[currentFigure];
    assignFigure(activeFigure, current, true);
    assignFigure(backOne, figures[(currentFigure + 1) % figures.length]);
    assignFigure(backTwo, figures[(currentFigure + 2) % figures.length]);
    figureLabel.textContent = current.label;
    figureTitle.textContent = current.title;
    figurePosition.textContent = String(currentFigure + 1).padStart(2, '0') + ' / ' + figures.length;
    figureTabs.forEach((tab, tabIndex) => {
      const selected = tabIndex === currentFigure;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
    });
    figureCarousel.dataset.current = String(currentFigure);
    playTransient(activeFigure, [
      { opacity: .2, transform: `translateX(${direction * 14}px) scale(1.015)` },
      { opacity: 1, transform: 'translateX(0) scale(1)' }
    ], { duration: 420, easing: 'cubic-bezier(.16,1,.3,1)' });
  }
  document.getElementById('figure-next')?.addEventListener('click', () => showFigure(currentFigure + 1, 1));
  document.getElementById('figure-prev')?.addEventListener('click', () => showFigure(currentFigure - 1, -1));
  figureTabs.forEach(tab => tab.addEventListener('click', () => showFigure(Number(tab.dataset.figure), Number(tab.dataset.figure) >= currentFigure ? 1 : -1)));
  let pointerStart = null;
  let swipeHandled = false;
  document.querySelector('.figure-stack')?.addEventListener('pointerdown', event => { pointerStart = event.clientX; swipeHandled = false; });
  document.querySelector('.figure-stack')?.addEventListener('pointerup', event => {
    if (pointerStart === null) return;
    const distance = event.clientX - pointerStart;
    pointerStart = null;
    if (Math.abs(distance) < 45) return;
    swipeHandled = true;
    showFigure(currentFigure + (distance < 0 ? 1 : -1), distance < 0 ? 1 : -1);
  });
  document.getElementById('figure-advance')?.addEventListener('click', () => {
    if (swipeHandled) { swipeHandled = false; return; }
    showFigure(currentFigure + 1, 1);
  });
  figureCarousel?.addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    showFigure(currentFigure + (event.key === 'ArrowRight' ? 1 : -1), event.key === 'ArrowRight' ? 1 : -1);
  });
  document.getElementById('figure-expand')?.addEventListener('click', () => {
    const current = figures[currentFigure];
    lightboxImage.src = current.src;
    lightboxImage.alt = current.alt + '，完整图';
    document.getElementById('lightbox-label').textContent = current.label;
    document.getElementById('lightbox-title').textContent = current.title;
    if (lightbox?.showModal) lightbox.showModal();
  });
  document.getElementById('lightbox-close')?.addEventListener('click', () => lightbox?.close());
  lightbox?.addEventListener('click', event => { if (event.target === lightbox) lightbox.close(); });
  showFigure(0, 1);

  const caseTabs = [...document.querySelectorAll('[data-case]')];
  const casePanels = [...document.querySelectorAll('.case-panel')];
  function showCase(index, focusTab = false) {
    const nextIndex = (index + caseTabs.length) % caseTabs.length;
    caseTabs.forEach((tab, tabIndex) => {
      const selected = tabIndex === nextIndex;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
      casePanels[tabIndex].hidden = !selected;
    });
    const panel = casePanels[nextIndex];
    playTransient(panel, [
      { opacity: 0, transform: 'translateY(12px)' },
      { opacity: 1, transform: 'translateY(0)' }
    ], { duration: 430, easing: 'cubic-bezier(.16,1,.3,1)' });
    document.getElementById('casebook').dataset.current = String(nextIndex);
    if (focusTab) caseTabs[nextIndex].focus();
  }
  caseTabs.forEach((tab, index) => {
    tab.addEventListener('click', () => showCase(index));
    tab.addEventListener('keydown', event => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? caseTabs.length - 1 : index + (event.key === 'ArrowRight' ? 1 : -1);
      showCase(next, true);
    });
  });

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
