import { gsap, ScrollTrigger } from './motion';

/**
 * Lightweight scroll-reveal for the "I make websites that move" statement.
 * No pin, no scrub, no per-frame DOM writes — the ambient orbs/grid behind
 * it are pure CSS animations (see .tm-orb / .tm-grid in style.css).
 */
export function initTransitionReveal(): void {
  gsap.set('.trans-h .word', { yPercent: 110 });
  gsap.set('.trans-eyebrow, .trans-coords, .trans-footer', { opacity: 0, y: 20 });

  ScrollTrigger.create({
    trigger: '#transition',
    start: 'top 80%',
    once: true,
    onEnter: () => {
      gsap.to('.trans-eyebrow, .trans-coords', { opacity: 1, y: 0, duration: 0.7, stagger: 0.1, ease: 'power3.out' });
      gsap.to('.trans-h .word', { yPercent: 0, duration: 1.2, stagger: 0.12, ease: 'expo.out' });
      gsap.to('.trans-footer', { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', delay: 0.4 });
    },
  });

  gsap.to('#ticker1', { xPercent: -50, duration: 28, ease: 'none', repeat: -1 });
}
