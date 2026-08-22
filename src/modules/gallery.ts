import { gsap, rafThrottle } from './motion';

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
    // Wide screenshot frames get a gentler angle than the portraits —
    // the same tilt on a 2-column card would collide with its neighbours.
    const wide = card.classList.contains('gc-wide');
    const angle = (i % 2 === 0 ? -1 : 1) * ((wide ? 1.4 : 2.6) + (i % 3) * 0.7);
    gsap.set(card, { rotate: angle, transformPerspective: 900 });
    card.style.animationDuration = `${6.5 + (i % 4) * 0.9}s`;
    card.style.animationDelay = `${-(i * 1.9)}s`;
  });

  gsap.from(cards, {
    opacity: 0,
    y: 30,
    scale: 0.92,
    rotate: (i: number) => (i % 2 === 0 ? -9 : 9),
    duration: 0.9,
    stagger: { each: 0.06, from: 'start' },
    ease: 'back.out(1.3)',
    scrollTrigger: { trigger: grid, start: 'top 85%', once: true },
  });

  if (!isTouch) {
    cards.forEach((card) => {
      // Rect cached on enter, write batched to one rAF — the tilt used to
      // force a layout read on every pointer event.
      let rect: DOMRect | null = null;
      card.addEventListener('mouseenter', () => {
        rect = card.getBoundingClientRect();
      });
      card.addEventListener(
        'mousemove',
        rafThrottle((e: MouseEvent) => {
          const r = rect ?? card.getBoundingClientRect();
          const dx = (e.clientX - r.left) / r.width - 0.5;
          const dy = (e.clientY - r.top) / r.height - 0.5;
          gsap.to(card, {
            rotateY: dx * 11,
            rotateX: dy * -11,
            scale: 1.03,
            zIndex: 5,
            duration: 0.4,
            ease: 'power2.out',
          });
        }) as EventListener
      );
      card.addEventListener('mouseleave', () => {
        rect = null;
        gsap.to(card, {
          rotateY: 0,
          rotateX: 0,
          scale: 1,
          duration: 0.6,
          ease: 'elastic.out(1,0.5)',
          onComplete: () => gsap.set(card, { zIndex: 'auto' }),
        });
      });
    });
  }
}
