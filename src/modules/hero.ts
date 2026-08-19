import { gsap } from './motion';

export function initHeroEntrance(isTouch: boolean): void {
  const words = document.querySelectorAll<HTMLElement>('.hero-title .word');
  gsap.from(words, { yPercent: 110, duration: 1.1, ease: 'expo.out', stagger: 0.05 });
  gsap.from('.hero-top span', { opacity: 0, y: -10, duration: 0.7, ease: 'power3.out', stagger: 0.08, delay: 0.2 });
  gsap.from('.hero-cta-row > *', { y: 24, opacity: 0, duration: 0.8, ease: 'power3.out', stagger: 0.08, delay: 0.55 });
  gsap.from('.hero-bottom > div', { y: 20, opacity: 0, duration: 0.8, ease: 'power3.out', stagger: 0.07, delay: 0.7 });
  gsap.from('nav#mainNav', { y: -30, opacity: 0, duration: 0.8, ease: 'power3.out', delay: 0.4 });
  gsap.from('.hero-photo-wrap', { y: 50, opacity: 0, scale: 0.95, duration: 1.2, ease: 'expo.out', delay: 0.5 });
  gsap.from('.photo-bracket', { opacity: 0, scale: 0.4, duration: 0.6, stagger: 0.05, ease: 'power3.out', delay: 1.3 });

  if (!isTouch) {
    const hero = document.getElementById('hero');
    const title = document.querySelector<HTMLElement>('.hero-title');
    const photo = document.querySelector<HTMLElement>('.hero-photo-wrap');
    const glow = document.getElementById('heroGlow');
    if (hero && title && photo) {
      hero.addEventListener('mousemove', (e) => {
        const r = hero.getBoundingClientRect();
        if (glow) {
          glow.style.setProperty('--gx', `${((e.clientX - r.left) / r.width) * 100}%`);
          glow.style.setProperty('--gy', `${((e.clientY - r.top) / r.height) * 100}%`);
        }
        const cx = innerWidth / 2;
        const cy = innerHeight / 2;
        const dx = (e.clientX - cx) / cx;
        const dy = (e.clientY - cy) / cy;
        gsap.to(title, { x: dx * -8, y: dy * -5, duration: 1.2, ease: 'power3.out' });
        gsap.to(photo, {
          x: dx * 16,
          y: dy * 12,
          rotateY: dx * 3,
          rotateX: dy * -2,
          duration: 1.2,
          ease: 'power3.out',
          transformPerspective: 1500,
        });
      });
      hero.addEventListener('mouseleave', () => {
        gsap.to(title, { x: 0, y: 0, duration: 1.2, ease: 'power3.out' });
        gsap.to(photo, { x: 0, y: 0, rotateY: 0, rotateX: 0, duration: 1.2, ease: 'power3.out' });
      });
    }
  }

  gsap.to('.hero-title', {
    yPercent: -10,
    opacity: 0.55,
    scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: true },
  });
}
