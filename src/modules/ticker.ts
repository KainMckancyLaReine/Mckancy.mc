import { gsap } from './motion';

/** Endless marquee that eases to a near-stop under the cursor, then eases back up to speed. */
export function initTicker(): void {
  const el = document.getElementById('ticker1');
  const track = el?.closest<HTMLElement>('.ticker');
  if (!el || !track) return;

  const tween = gsap.to(el, { xPercent: -50, duration: 28, ease: 'none', repeat: -1 });

  track.addEventListener('mouseenter', () => gsap.to(tween, { timeScale: 0.12, duration: 0.6, ease: 'power2.out' }));
  track.addEventListener('mouseleave', () => gsap.to(tween, { timeScale: 1, duration: 0.8, ease: 'power2.inOut' }));
}
