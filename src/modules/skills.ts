import { gsap } from './motion';

/**
 * Skills grid — a cascading wave reveal (from the center outward, not a
 * simple top-to-bottom stagger) plus a per-card cursor spotlight that
 * tracks the mouse via CSS custom properties (no rAF loop).
 */
export function initSkillsReveal(isTouch: boolean): void {
  const cards = gsap.utils.toArray<HTMLElement>('.skill-card');

  gsap.from(cards, {
    y: 36,
    opacity: 0,
    scale: 0.96,
    duration: 0.9,
    ease: 'power3.out',
    stagger: { each: 0.09, grid: [2, 3], from: 'center' },
    scrollTrigger: { trigger: '.skills-grid', start: 'top 85%', once: true },
  });

  gsap.from('#skillChips .skill-chip', {
    y: 16,
    opacity: 0,
    duration: 0.5,
    stagger: 0.05,
    ease: 'power3.out',
    scrollTrigger: { trigger: '#skillChips', start: 'top 92%', once: true },
  });

  if (!isTouch) {
    cards.forEach((card) => {
      card.addEventListener('mousemove', (e) => {
        const r = card.getBoundingClientRect();
        card.style.setProperty('--mx', `${((e.clientX - r.left) / r.width) * 100}%`);
        card.style.setProperty('--my', `${((e.clientY - r.top) / r.height) * 100}%`);
      });
    });
  }
}
