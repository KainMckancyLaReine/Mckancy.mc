import type Lenis from 'lenis';
import { gsap, ScrollTrigger } from './motion';
import { initHeroEntrance } from './hero';

export function initPreloader(lenis: Lenis, isTouch: boolean): void {
  const preloaderEl = document.getElementById('preloader');
  const words = document.querySelectorAll<HTMLElement>('.pre-word');
  const nameWords = document.querySelectorAll<HTMLElement>('.pre-name .word');
  if (!preloaderEl) {
    initHeroEntrance(isTouch);
    return;
  }

  lenis.stop();
  document.body.style.overflow = 'hidden';

  gsap.to(nameWords, { y: 0, opacity: 1, duration: 0.8, stagger: 0.1, ease: 'expo.out', delay: 0.1 });
  gsap.from('.pre-meta', { opacity: 0, y: -6, duration: 0.5, stagger: 0.05, delay: 0.3 });

  // Short by design — a portfolio shouldn't make people wait. Any
  // interaction (click, key, scroll, touch) skips straight to the hero.
  const totalDuration = 1400;
  const wordSlots = words.length;
  let currentWord = -1;
  let done = false;

  function setWord(idx: number) {
    if (idx === currentWord) return;
    words.forEach((w, i) => {
      w.classList.remove('active', 'out');
      if (i === idx) w.classList.add('active');
      else if (i < idx) w.classList.add('out');
    });
    currentWord = idx;
  }
  setTimeout(() => setWord(0), 400);

  const startTime = performance.now();
  function frame() {
    if (done) return;
    const elapsed = performance.now() - startTime;
    const progress = Math.min(1, elapsed / totalDuration);
    const wIdx = Math.min(wordSlots - 1, Math.floor(progress * wordSlots));
    setWord(wIdx);
    if (progress < 1) requestAnimationFrame(frame);
    else finishOut();
  }

  function finishOut() {
    if (done) return;
    done = true;
    skipEvents.forEach((evt) => window.removeEventListener(evt, skip));

    const tl = gsap.timeline({
      defaults: { ease: 'expo.inOut' },
      onComplete: () => {
        preloaderEl!.style.display = 'none';
        document.body.style.overflow = '';
        lenis.start();
        initHeroEntrance(isTouch);
      },
    });
    tl.to('.pre-meta', { opacity: 0, duration: 0.4 }, 0);
    tl.to('.pre-words', { y: -10, opacity: 0, duration: 0.4 }, 0);
    tl.to('.pre-name .word', { y: '-100%', duration: 0.6, stagger: 0.05, ease: 'expo.in' }, 0.02);
    tl.to('#preloader', { yPercent: -100, duration: 0.8, ease: 'expo.inOut' }, 0.3);
  }

  const skipEvents = ['pointerdown', 'keydown', 'wheel', 'touchstart'] as const;
  function skip() {
    finishOut();
  }
  skipEvents.forEach((evt) => window.addEventListener(evt, skip, { once: true, passive: true }));

  requestAnimationFrame(frame);

  window.addEventListener('load', () => {
    setTimeout(() => ScrollTrigger.refresh(), 200);
  });
}
