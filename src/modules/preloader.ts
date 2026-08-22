import { gsap, ScrollTrigger } from './motion';
import { initHeroEntrance } from './hero';

/**
 * Release the scroll lock the inline head script put on. Kept as one
 * function because every exit from the intro has to call it — the normal
 * outro, the skip, and the no-preloader path — and a page that stays
 * locked is unusable.
 */
function unlockScroll(): void {
  document.documentElement.classList.remove('is-preloading');
}

export function initPreloader(isTouch: boolean): void {
  const preloaderEl = document.getElementById('preloader');
  const words = document.querySelectorAll<HTMLElement>('.pre-word');
  const nameWords = document.querySelectorAll<HTMLElement>('.pre-name .word');
  if (!preloaderEl) {
    unlockScroll();
    initHeroEntrance(isTouch);
    return;
  }

  // The intro plays from the top. The browser restores the old offset on
  // a refresh, and landing mid-page behind the curtain means the curtain
  // lifts onto the middle of the site. A #hash is an intentional deep
  // link and keeps its destination.
  if (!location.hash) window.scrollTo(0, 0);

  gsap.to(nameWords, { y: 0, opacity: 1, duration: 0.8, stagger: 0.1, ease: 'expo.out', delay: 0.1 });
  gsap.from('.pre-meta', { opacity: 0, y: -6, duration: 0.5, stagger: 0.05, delay: 0.3 });

  // Short by design — a portfolio shouldn't make people wait. A tap or a
  // keypress skips straight to the hero. Scroll gestures deliberately do
  // not: the page is locked while the intro is up, so a wheel or a swipe
  // used to dismiss the curtain without moving anything, which read as
  // the intro randomly cutting itself short.
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
        unlockScroll();
        initHeroEntrance(isTouch);
      },
    });
    tl.to('.pre-meta', { opacity: 0, duration: 0.4 }, 0);
    tl.to('.pre-words', { y: -10, opacity: 0, duration: 0.4 }, 0);
    tl.to('.pre-name .word', { y: '-100%', duration: 0.6, stagger: 0.05, ease: 'expo.in' }, 0.02);
    tl.to('#preloader', { yPercent: -100, duration: 0.8, ease: 'expo.inOut' }, 0.3);
  }

  const skipEvents = ['pointerdown', 'keydown'] as const;
  function skip() {
    finishOut();
  }
  skipEvents.forEach((evt) => window.addEventListener(evt, skip, { once: true, passive: true }));

  requestAnimationFrame(frame);

  window.addEventListener('load', () => {
    setTimeout(() => ScrollTrigger.refresh(), 200);
  });
}
