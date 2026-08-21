import { gsap, ScrollTrigger, rafThrottle } from './motion';

/**
 * Lightweight scroll-reveal for the "I make websites that move" statement.
 * No pin, no scrub, no per-frame DOM writes — the ambient orbs/grid behind
 * it float via pure CSS keyframes (see .tm-orb / .tm-grid in style.css).
 * The whole ambient layer also drifts gently toward the cursor — a single
 * CSS-transitioned transform, not a second animation loop.
 */
export function initTransitionReveal(isTouch: boolean): void {
  gsap.set('.trans-h .word', { yPercent: 140, rotateZ: 3 });
  gsap.set('.trans-eyebrow, .trans-coords, .trans-footer', { opacity: 0, y: 20 });

  ScrollTrigger.create({
    trigger: '#transition',
    start: 'top 80%',
    once: true,
    onEnter: () => {
      gsap.to('.trans-eyebrow, .trans-coords', { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: 'power2.out' });
      gsap.to('.trans-h .word', { yPercent: 0, rotateZ: 0, duration: 1.4, stagger: 0.1, ease: 'back.out(1.5)' });
      gsap.to('.trans-footer', { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', delay: 0.5 });
    },
  });

  if (!isTouch) {
    const section = document.getElementById('transition');
    const motion = document.querySelector<HTMLElement>('.trans-motion');
    if (section && motion) {
      let rect: DOMRect | null = null;
      section.addEventListener('mouseenter', () => {
        rect = section.getBoundingClientRect();
      });
      section.addEventListener(
        'mousemove',
        rafThrottle((e: MouseEvent) => {
          const r = rect ?? section.getBoundingClientRect();
          const dx = (e.clientX - r.left) / r.width - 0.5;
          const dy = (e.clientY - r.top) / r.height - 0.5;
          motion.style.transform = `translate3d(${dx * -30}px, ${dy * -20}px, 0)`;
        }) as EventListener
      );
      section.addEventListener('mouseleave', () => {
        rect = null;
        motion.style.transform = 'translate3d(0, 0, 0)';
      });
    }
  }
}
