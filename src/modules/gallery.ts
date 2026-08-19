import { gsap } from './motion';

/**
 * Gallery — frames rotate in from random little angles (not a uniform
 * fade), then idle-float at their own desynced pace once settled, and
 * tilt toward the cursor on hover like you're picking the print up.
 */
export function initGallery(isTouch: boolean): void {
  const grid = document.getElementById('galleryGrid');
  if (!grid) return;

  const cards = grid.querySelectorAll<HTMLElement>('.gallery-card');

  cards.forEach((card, i) => {
    const angle = (i % 2 === 0 ? -1 : 1) * (6 + (i % 3) * 2);
    gsap.set(card, { rotate: angle, transformPerspective: 700 });
    card.style.animationDuration = `${5.5 + (i % 4) * 0.8}s`;
    card.style.animationDelay = `${-(i * 1.9)}s`;
  });

  gsap.from(cards, {
    opacity: 0,
    y: 26,
    scale: 0.9,
    rotate: (i: number) => (i % 2 === 0 ? -16 : 16),
    duration: 0.9,
    stagger: 0.05,
    ease: 'back.out(1.4)',
    scrollTrigger: { trigger: grid, start: 'top 85%', once: true },
  });

  if (!isTouch) {
    cards.forEach((card) => {
      card.addEventListener('mousemove', (e) => {
        const r = card.getBoundingClientRect();
        const dx = (e.clientX - r.left) / r.width - 0.5;
        const dy = (e.clientY - r.top) / r.height - 0.5;
        gsap.to(card, { rotateY: dx * 14, rotateX: dy * -14, duration: 0.4, ease: 'power2.out' });
      });
      card.addEventListener('mouseleave', () => {
        gsap.to(card, { rotateY: 0, rotateX: 0, duration: 0.6, ease: 'elastic.out(1,0.5)' });
      });
    });
  }
}
