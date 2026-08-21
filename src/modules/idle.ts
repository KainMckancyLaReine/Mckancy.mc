import { gsap } from './motion';

/**
 * Off-screen animation parking.
 *
 * The page keeps ~35 ambient CSS animations alive at once — ten floating
 * gallery frames, eight drifting mockups, the ambient orbs, the grid, the
 * live-dot pulses. Each running animation keeps its element promoted to
 * its own compositor layer for the entire session, so the browser was
 * carrying (and re-compositing) every one of them even while the visitor
 * was three sections away.
 *
 * This parks each group while its section is outside the viewport and
 * un-parks it just before it scrolls back in. Purely a performance
 * measure: nothing is ever paused while it can be seen, and the paused
 * state is a CSS `animation-play-state`, so resuming is instant and keeps
 * the animation's phase (no visible restart).
 */
const ZONES = ['#hero', '#transition', '#worlds', '#gallery-section', '#skills'];

export function initIdleAnimations(): void {
  if (!('IntersectionObserver' in window)) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        (entry.target as HTMLElement).toggleAttribute('data-parked', !entry.isIntersecting);
      });
    },
    // One viewport of lead-in, so a group is always awake before it is
    // visible — a resumed animation is never seen starting.
    { rootMargin: '100% 0px 100% 0px', threshold: 0 }
  );

  ZONES.forEach((sel) => {
    const el = document.querySelector(sel);
    if (el) observer.observe(el);
  });

  parkTicker();
  warmImages();
}

/**
 * Decode section artwork before it is scrolled into view.
 *
 * The screenshots are CSS background-images, so the browser only decodes
 * them at the moment they first need to be painted — which is the moment
 * you are scrolling past them. Each decode is a chunk of main-thread work
 * landing mid-scroll, and it showed up as the only real frame spikes left
 * on the page. Kicking off `Image.decode()` two viewports early moves that
 * work to a background thread while nothing is happening.
 */
function warmImages(): void {
  const warmed = new Set<string>();

  const warm = (root: Element): void => {
    root.querySelectorAll<HTMLElement>('[style*="background-image"]').forEach((el) => {
      const match = /url\(["']?(.+?)["']?\)/.exec(el.style.backgroundImage);
      const src = match?.[1];
      if (!src || warmed.has(src)) return;
      warmed.add(src);
      const img = new Image();
      img.src = src;
      void img.decode().catch(() => {
        /* a failed prefetch must never surface — the paint path still works */
      });
    });
  };

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        observer.unobserve(entry.target);
        warm(entry.target);
      });
    },
    { rootMargin: '200% 0px', threshold: 0 }
  );

  ['#worlds', '#gallery-section', '#about'].forEach((sel) => {
    const el = document.querySelector(sel);
    if (el) observer.observe(el);
  });
}

/**
 * The marquee is a GSAP tween rather than a CSS animation, so it needs
 * its own park: a paused tween costs nothing on the ticker at all.
 */
function parkTicker(): void {
  const track = document.querySelector('.ticker');
  const el = document.getElementById('ticker1');
  if (!track || !el) return;

  const tweens = gsap.getTweensOf(el);
  if (tweens.length === 0) return;

  const observer = new IntersectionObserver(
    (entries) => {
      const visible = entries[0]?.isIntersecting ?? true;
      tweens.forEach((tween) => (visible ? tween.play() : tween.pause()));
    },
    { rootMargin: '50% 0px 50% 0px', threshold: 0 }
  );
  observer.observe(track);
}
