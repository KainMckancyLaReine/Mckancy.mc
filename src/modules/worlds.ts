import { gsap } from './motion';

/**
 * Projects flow normally in the document (no pin, no crossfade-scale
 * stage) — each card just reveals with a light fade/slide as it enters
 * the viewport, and gets a subtle cursor-linked tilt on hover.
 */
export function initWorlds(): void {
  const worlds = gsap.utils.toArray<HTMLElement>('.world');

  worlds.forEach((w) => {
    w.style.opacity = '1';
    gsap.from(w.querySelectorAll('.world-title, .world-meta, .world-copy, .world-tags > span, .mockup'), {
      y: 30,
      opacity: 0,
      duration: 0.8,
      stagger: 0.06,
      ease: 'power3.out',
      scrollTrigger: { trigger: w, start: 'top 78%', once: true },
    });

    w.addEventListener('mousemove', (e) => {
      const r = w.getBoundingClientRect();
      const dx = (e.clientX - r.left) / r.width - 0.5;
      const dy = (e.clientY - r.top) / r.height - 0.5;
      gsap.to(w.querySelectorAll('.mockup'), { rotateY: dx * 4, rotateX: -dy * 3, duration: 0.8, ease: 'power3.out' });
    });
    w.addEventListener('mouseleave', () => {
      gsap.to(w.querySelectorAll('.mockup'), { rotateY: 0, rotateX: 0, duration: 0.8 });
    });
  });
}
