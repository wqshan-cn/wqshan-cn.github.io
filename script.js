(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const root = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const desktop = matchMedia('(min-width: 1000px) and (min-height: 650px)');
  const fine = matchMedia('(pointer: fine)');
  let userMotion = true;
  try { userMotion = localStorage.getItem('xiaoshan-motion') !== 'off'; } catch {}
  let motion = userMotion && !reduced.matches;
  let current = 0;
  const figures = [
    { src: 'figure-02.webp', label: 'FIG. 02 · A+B', title: '差异之中，\n寻找线索。', description: '从表达变化出发，让数据中的差异成为下一步研究的起点。完整展示两组火山图及其标注。', tags: 'R · Differential expression', alt: '论文图 2 的完整 A、B 火山图', width: '153.519%', top: '-40%', ratio: '2.01' },
    { src: 'figure-04.webp', label: 'FIG. 04 · A–D', title: '不同细胞，\n各有表达。', description: '从细胞分群到基因表达，在单细胞尺度观察组织的异质性。保留 A–D 子图与对应图例。', tags: 'Single-cell · Cell atlas', alt: '论文图 4 的完整 A 至 D 单细胞分析子图', width: '100%', top: '0%', ratio: '1.53' },
    { src: 'figure-05.webp', label: 'FIG. 05 · A+B', title: '沿着轨迹，\n追问变化。', description: '在拟时序轨迹中观察细胞状态的变化。并列呈现完整 A、B 子图，保留坐标与颜色图例。', tags: 'Single-cell · Pseudotime', alt: '论文图 5 的完整 A、B 拟时序轨迹子图', width: '100%', top: '0%', ratio: '2.65' }
  ];
  const path = './assets/research-figures/';
  const crop = $('figure-advance'), img = $('figure-active');
  const tabs = [...document.querySelectorAll('[data-figure]')];
  const region = $('research-scroll');
  const sticky = () => motion && desktop.matches;

  function showFigure(index, animate = true) {
    const next = (index + figures.length) % figures.length;
    const changed = current !== next;
    current = next;
    const f = figures[current];
    img.src = path + f.src;
    img.alt = f.alt;
    img.style.width = f.width;
    img.style.top = f.top;
    img.style.left = '0%';
    crop.style.aspectRatio = f.ratio;
    $('figure-label').textContent = f.label.split(' · ')[0];
    $('figure-title').textContent = f.title;
    $('figure-description').textContent = f.description;
    $('figure-tags').textContent = f.tags;
    $('figure-position').textContent = String(current + 1).padStart(2, '0') + ' / 03';
    $('canvas-label').textContent = f.label;
    tabs.forEach((tab, i) => {
      tab.setAttribute('aria-selected', String(i === current));
      tab.tabIndex = i === current ? 0 : -1;
    });
    if (motion && changed && animate) {
      crop.getAnimations().forEach(a => a.cancel());
      crop.animate([{ opacity: .25, transform: 'translateY(9px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 500, easing: 'cubic-bezier(.2,.7,.2,1)' });
    }
  }
  function chooseFigure(index, focus = false) {
    showFigure(index);
    if (sticky()) {
      const rect = region.getBoundingClientRect();
      const travel = region.offsetHeight - innerHeight;
      if (rect.top < innerHeight && rect.bottom > 100) {
        window.scrollTo({ top: scrollY + rect.top + Math.max(0, travel) * ((current + .5) / 3), behavior: 'instant' });
      }
    }
    if (focus) tabs[current].focus({ preventScroll: true });
  }
  tabs.forEach((tab, i) => tab.addEventListener('click', () => chooseFigure(i)));
  $('figure-prev').addEventListener('click', () => chooseFigure(current - 1));
  $('figure-next').addEventListener('click', () => chooseFigure(current + 1));
  let swiped = false;
  crop.addEventListener('click', () => {
    if (swiped) { swiped = false; return; }
    chooseFigure(current + 1);
  });
  $('figure-carousel').addEventListener('keydown', e => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
    e.preventDefault();
    chooseFigure(e.key === 'Home' ? 0 : e.key === 'End' ? 2 : current + (e.key === 'ArrowRight' ? 1 : -1), tabs.includes(e.target));
  });
  let touchStart = null;
  crop.addEventListener('pointerdown', e => { swiped = false; if (e.pointerType !== 'mouse') touchStart = { x: e.clientX, y: e.clientY }; });
  crop.addEventListener('pointerup', e => {
    if (!touchStart) return;
    const dx = e.clientX - touchStart.x, dy = e.clientY - touchStart.y;
    touchStart = null;
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      swiped = true;
      chooseFigure(current + (dx < 0 ? 1 : -1));
    }
  });
  crop.addEventListener('pointercancel', () => { touchStart = null; });

  const dialog = $('figure-lightbox');
  $('figure-expand').addEventListener('click', () => {
    const f = figures[current];
    $('lightbox-image').src = path + f.src;
    $('lightbox-image').alt = f.label.split(' · ')[0] + ' 完整论文图，未裁切';
    $('lightbox-label').textContent = f.label.split(' · ')[0] + ' · 完整论文图';
    dialog.showModal();
    if (motion) dialog.animate([{ opacity: 0, transform: 'scale(.975)' }, { opacity: 1, transform: 'scale(1)' }], { duration: 320, easing: 'cubic-bezier(.16,1,.3,1)' });
  });
  $('lightbox-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', e => {
    const r = dialog.getBoundingClientRect();
    if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) dialog.close();
  });

  const caseTabs = [...document.querySelectorAll('[data-case]')];
  const panels = [...document.querySelectorAll('.case-panel')];
  let previousCase = 0;
  function showCase(index, focus = false) {
    const selected = (index + panels.length) % panels.length;
    const direction = selected >= previousCase ? 1 : -1;
    previousCase = selected;
    caseTabs.forEach((tab, i) => {
      tab.setAttribute('aria-selected', String(i === selected));
      tab.tabIndex = i === selected ? 0 : -1;
      panels[i].hidden = i !== selected;
      panels[i].getAnimations().forEach(a => a.cancel());
    });
    if (motion) panels[selected].animate([{ opacity: .2, transform: 'translateX(' + direction * 24 + 'px)' }, { opacity: 1, transform: 'translateX(0)' }], { duration: 500, easing: 'cubic-bezier(.16,1,.3,1)' });
    if (focus) caseTabs[selected].focus({ preventScroll: true });
  }
  caseTabs.forEach((tab, i) => {
    tab.addEventListener('click', () => showCase(i));
    tab.addEventListener('keydown', e => {
      if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(e.key)) return;
      e.preventDefault();
      showCase(e.key === 'Home' ? 0 : e.key === 'End' ? 2 : i + (['ArrowRight', 'ArrowDown'].includes(e.key) ? 1 : -1), true);
    });
  });

  const navLinks = [...document.querySelectorAll('nav a')];
  const navSections = navLinks.map(link => document.querySelector(link.hash));
  let activeNav = '';
  let headerScrolled = false;
  let frame = 0;
  function onScroll() {
    frame = 0;
    // Read geometry before changing DOM, and only write when state changes.
    const scrolled = scrollY > 35;
    let active = '';
    navSections.forEach((section, i) => { if (section.getBoundingClientRect().top < 210) active = navLinks[i].hash; });
    let nextFigure = current;
    if (sticky()) {
      const rect = region.getBoundingClientRect();
      const travel = region.offsetHeight - innerHeight;
      if (rect.top <= 100 && rect.bottom > innerHeight - 100 && travel > 0) {
        const next = Math.min(2, Math.max(0, Math.floor((-rect.top / travel) * 3)));
        nextFigure = next;
      }
    }
    if (scrolled !== headerScrolled) {
      headerScrolled = scrolled;
      document.body.classList.toggle('scrolled', scrolled);
    }
    if (active !== activeNav) {
      activeNav = active;
      navLinks.forEach(link => {
        if (link.hash === active) link.setAttribute('aria-current', 'location');
        else if (link.hasAttribute('aria-current')) link.removeAttribute('aria-current');
      });
    }
    if (nextFigure !== current) showFigure(nextFigure);
  }
  const queueScroll = () => { if (!frame) frame = requestAnimationFrame(onScroll); };
  addEventListener('scroll', queueScroll, { passive: true });
  addEventListener('resize', queueScroll);

  const toggle = $('motion-toggle');
  function syncMotion() {
    motion = userMotion && !reduced.matches;
    root.dataset.motion = motion ? 'on' : 'off';
    if (sticky()) root.dataset.enhanced = '';
    else delete root.dataset.enhanced;
    toggle.hidden = false;
    toggle.setAttribute('aria-pressed', String(motion));
    toggle.textContent = reduced.matches ? '系统已减少动效' : motion ? '关闭动效' : '开启动效';
    toggle.disabled = reduced.matches;
    if (!motion) {
      document.getAnimations().forEach(a => a.cancel());
      document.querySelectorAll('[data-light]').forEach(el => { el.style.removeProperty('--pointer-x'); el.style.removeProperty('--pointer-y'); });
    }
    queueScroll();
  }
  toggle.addEventListener('click', () => {
    userMotion = !userMotion;
    try { localStorage.setItem('xiaoshan-motion', userMotion ? 'on' : 'off'); } catch {}
    syncMotion();
  });
  reduced.addEventListener('change', syncMotion);
  desktop.addEventListener('change', syncMotion);

  const revealObserver = new IntersectionObserver(entries => entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    revealObserver.unobserve(entry.target);
    if (!motion) return;
    const isYear = entry.target.closest('.chapters');
    const isHero = entry.target.closest('.hero');
    const isContact = entry.target.closest('.contact');
    const isAbout = entry.target.closest('.about');
    const from = isHero ? 'translateY(10px) scale(.98)' : isContact ? 'scale(.94)' : isYear ? 'translateX(24px)' : isAbout ? 'translateY(12px)' : 'translateY(22px)';
    entry.target.animate([
      { opacity: .15, transform: from },
      { opacity: 1, transform: 'translate(0) scale(1)' }
    ], { duration: isContact ? 1000 : isYear ? 850 : 750, easing: 'cubic-bezier(.16,1,.3,1)' });
  }), { threshold: .12 });
  document.querySelectorAll('[data-reveal]').forEach(el => revealObserver.observe(el));
  document.querySelectorAll('[data-light]').forEach(el => {
    let lightFrame = 0;
    el.addEventListener('pointermove', e => {
      if (!motion || !fine.matches || lightFrame) return;
      lightFrame = requestAnimationFrame(() => {
        lightFrame = 0;
        if (!motion) return;
        const r = el.getBoundingClientRect();
        el.style.setProperty('--pointer-x', ((e.clientX - r.left) / r.width * 100) + '%');
        el.style.setProperty('--pointer-y', ((e.clientY - r.top) / r.height * 100) + '%');
      });
    });
    el.addEventListener('pointerleave', () => {
      cancelAnimationFrame(lightFrame); lightFrame = 0;
      el.style.removeProperty('--pointer-x'); el.style.removeProperty('--pointer-y');
    });
  });
  const orbit = document.querySelector('.hero-orbit');
  new IntersectionObserver(entries => {
    orbit.style.animationPlayState = entries[0].isIntersecting ? 'running' : 'paused';
  }).observe($('home'));
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) root.dataset.pageHidden = '';
    else delete root.dataset.pageHidden;
  });
  $('copy-email').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText('wqshan2025@163.com');
      $('copy-status').textContent = '已复制';
    } catch { $('copy-status').textContent = '请长按或选中邮箱复制'; }
  });
  showFigure(0, false);
  syncMotion();
})();
