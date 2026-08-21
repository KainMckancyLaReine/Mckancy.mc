import { gsap, rafThrottle } from './motion';

/**
 * Projects flow normally in the document (no pin, no crossfade-scale
 * stage). Each card's entrance direction mirrors its actual layout —
 * text and mockups slide in from opposite sides, matching whichever
 * side they sit on — and mockups get a slow, desynced antigravity
 * float plus a cursor-linked 3D tilt on hover.
 */
export function initWorlds(isTouch: boolean): void {
  const worlds = gsap.utils.toArray<HTMLElement>('.world');

  worlds.forEach((w, i) => {
    w.style.opacity = '1';
    const rev = w.querySelector('.world-grid')?.classList.contains('rev') ?? false;
    const textSide = rev ? 40 : -40;
    const visualSide = rev ? -40 : 40;

    const tl = gsap.timeline({ scrollTrigger: { trigger: w, start: 'top 78%', once: true } });
    tl.from(w.querySelectorAll('.world-meta, .world-title, .world-copy, .world-tags > span'), {
      x: textSide,
      opacity: 0,
      duration: 0.9,
      stagger: 0.07,
      ease: 'power3.out',
    });
    tl.from(
      w.querySelectorAll('.mockup'),
      { x: visualSide, opacity: 0, scale: 0.94, duration: 1, stagger: 0.12, ease: 'expo.out' },
      i % 2 === 0 ? 0.1 : 0
    );

    const mockups = w.querySelectorAll<HTMLElement>('.mockup');
    mockups.forEach((m, mi) => {
      m.style.animationDelay = `${-(i * 1.7 + mi * 2.3)}s`;
    });

    if (!isTouch) {
      let rect: DOMRect | null = null;
      w.addEventListener('mouseenter', () => {
        rect = w.getBoundingClientRect();
      });
      w.addEventListener(
        'mousemove',
        rafThrottle((e: MouseEvent) => {
          const r = rect ?? w.getBoundingClientRect();
          const dx = (e.clientX - r.left) / r.width - 0.5;
          const dy = (e.clientY - r.top) / r.height - 0.5;
          gsap.to(mockups, { rotateY: dx * 4, rotateX: -dy * 3, duration: 0.8, ease: 'power3.out' });
        }) as EventListener
      );
      w.addEventListener('mouseleave', () => {
        rect = null;
        gsap.to(mockups, { rotateY: 0, rotateX: 0, duration: 0.8 });
      });
    }
  });
}
