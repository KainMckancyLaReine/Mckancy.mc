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

export function initMobileDrawer(): void {
  const navToggle = document.getElementById('navToggle');
  const drawer = document.getElementById('mobileDrawer');
  if (!navToggle || !drawer) return;
  navToggle.addEventListener('click', () => drawer.classList.toggle('open'));
  drawer.querySelectorAll<HTMLElement>('[data-drawer-link]').forEach((a) => {
    a.addEventListener('click', () => drawer.classList.remove('open'));
  });
}
