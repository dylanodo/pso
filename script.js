/* Modern interactions (no frameworks) */
(() => {
  const qs = (sel, ctx=document) => ctx.querySelector(sel);
  const qsa = (sel, ctx=document) => Array.from(ctx.querySelectorAll(sel));

  /* Header shadow on scroll */
  const header = qs('.site-header');
  const shadowToggle = () => {
    if (window.scrollY > 4) header.classList.add('scrolled');
    else header.classList.remove('scrolled');
  };
  shadowToggle();
  window.addEventListener('scroll', shadowToggle, { passive: true });

  /* Accessible mobile menu */
  const toggle = qs('.nav-toggle');
  const menu = qs('#mainmenu');
  if (toggle && menu) {
    toggle.addEventListener('click', () => {
      const expanded = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!expanded));
      menu.classList.toggle('open');
      if (!expanded) qsa('a', menu)[0]?.focus();
    });
    // Close on escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && menu.classList.contains('open')) {
        toggle.click();
        toggle.focus();
      }
    });
  }

  /* Smooth scroll that accounts for sticky header height */
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const headerHeight = () => header?.offsetHeight ?? 0;
  qsa('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (!id || id === '#' || id === '#top') return;
      const el = qs(id);
      if (!el) return;
      e.preventDefault();
      const y = el.getBoundingClientRect().top + window.scrollY - headerHeight() - 8;
      window.scrollTo({ top: y, behavior: prefersReduced ? 'auto' : 'smooth' });
      // Close mobile menu after navigation
      if (menu?.classList.contains('open')) toggle?.click();
      history.pushState(null, '', id);
    });
  });

  /* Reveal on scroll */
  const reveals = qsa('.reveal');
  if (!prefersReduced && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.08 });
    reveals.forEach(el => io.observe(el));
  } else {
    reveals.forEach(el => el.classList.add('in'));
  }

  /* Active link highlighting */
  const sections = qsa('main section[id]');
  const navLinks = qsa('.site-nav .menu a').filter(a => a.getAttribute('href')?.startsWith('#'));
  const activate = (id) => {
    navLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === `#${id}`));
  };
  const spy = () => {
    let current = sections[0]?.id;
    sections.forEach(sec => {
      const top = sec.getBoundingClientRect().top - headerHeight() - 20;
      if (top <= 0) current = sec.id;
    });
    if (current) activate(current);
  };
  spy();
  window.addEventListener('scroll', spy, { passive: true });

  /* Lightweight parallax ornament in hero */
  const ornament = qs('.hero-ornament');
  if (ornament && !prefersReduced) {
    window.addEventListener('scroll', () => {
      const y = window.scrollY * 0.15;
      ornament.style.transform = `translate3d(0, ${y}px, 0)`;
    }, { passive: true });
  }

  /* Pause Sketchfab iframes when offscreen (saves CPU) */
  const players = qsa('.sketchfab-embed iframe');
  if ('IntersectionObserver' in window) {
    const iframeIO = new IntersectionObserver((entries) => {
      entries.forEach(({ isIntersecting, target }) => {
        const src = target.getAttribute('src');
        if (!src) return;
        const url = new URL(src);
        // Toggle autostart to effectively pause/play when offscreen/onscreen
        if (!isIntersecting && url.searchParams.get('autostart') === '1') {
          url.searchParams.set('autostart', '0');
          target.setAttribute('src', url.toString());
        } else if (isIntersecting && url.searchParams.get('autostart') === '0') {
          url.searchParams.set('autostart', '1');
          target.setAttribute('src', url.toString());
        }
      });
    }, { rootMargin: '0px 0px -25% 0px' });
    players.forEach(p => iframeIO.observe(p));
  }
})();