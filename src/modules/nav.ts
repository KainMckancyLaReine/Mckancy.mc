import { gsap, ScrollTrigger } from './motion';

export function initClock(): void {
  const el = document.getElementById('navTime');
  if (!el) return;
  const update = () => {
    try {
      const t = new Date().toLocaleTimeString('en-GB', {
        timeZone: 'Europe/Amsterdam',
        hour: '2-digit',
        minute: '2-digit',
      });
      el.textContent = 'AMS · ' + t;
    } catch {
      el.textContent = '';
    }
  };
  update();
  setInterval(update, 30000);
}

export function initThemeToggle(): void {
  const themeBtn = document.getElementById('themeToggle');
  if (!themeBtn) return;
  themeBtn.addEventListener('click', () => {
    document.body.classList.toggle('dark');
    gsap.fromTo(themeBtn, { rotate: 0 }, { rotate: 360, duration: 0.6, ease: 'power3.out' });
    setTimeout(() => ScrollTrigger.refresh(), 400);
  });
}

/**
 * Anchor-link jump, animated by hand (no native `behavior: 'smooth'`
 * anywhere): Chrome has a real bug where native smooth-scroll combined
 * with `scroll-snap-type` can snap the page back to 0 mid-animation, on
 * both `scrollTo({behavior:'smooth'})` and `scrollIntoView({behavior:
 * 'smooth'})`. A plain rAF tween avoids the native API entirely.
 */
export function initSmoothAnchors(): void {
  function animateScrollTo(targetY: number, duration = 700) {
    const startY = window.scrollY;
    const delta = targetY - startY;
    const startTime = performance.now();
    function ease(t: number) {
      return 1 - Math.pow(1 - t, 3);
    }
    function step(now: number) {
      const t = Math.min(1, (now - startTime) / duration);
      window.scrollTo(0, startY + delta * ease(t));
      if (t < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href')?.slice(1);
      if (!id) return;
      const target = document.getElementById(id);
      if (!target) return;
      e.preventDefault();
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const targetY = Math.min(maxScroll, target.getBoundingClientRect().top + window.scrollY);
      animateScrollTo(targetY);
    });
  });
}

export function initMobileDrawer(): void {
  const navToggle = document.getElementById('navToggle');
  const drawer = document.getElementById('mobileDrawer');
  if (!navToggle || !drawer) return;
  navToggle.addEventListener('click', () => drawer.classList.toggle('open'));
  drawer.querySelectorAll<HTMLElement>('[data-drawer-link]').forEach((a) => {
    a.addEventListener('click', () => drawer.classList.remove('open'));
  });
}
