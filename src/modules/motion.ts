import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/**
 * Global motion tuning — one place so every module inherits it.
 *
 * `force3D: 'auto'` (GSAP's own default, pinned here so nothing changes
 * it by accident) promotes an element to the compositor for the duration
 * of a tween and drops it back to a 2D transform afterwards. Forcing it
 * to `true` looks like a free win and is not: every element this page
 * ever tweens — each heading character, every chip, every mockup — would
 * keep a compositor layer alive for the whole session. That measured out
 * at roughly sixty extra permanent layers here.
 *
 * `lagSmoothing` stops GSAP from trying to "catch up" after a stall (a
 * long task, a tab regaining focus). Without it, one 500ms hitch makes
 * every timeline jump forward at once, which reads as a much worse
 * stutter than the hitch itself.
 */
gsap.defaults({ force3D: 'auto' });
gsap.ticker.lagSmoothing(500, 33);

ScrollTrigger.config({
  // Mobile browsers fire `resize` when the URL bar hides/shows. Recomputing
  // every trigger mid-scroll for that is the single biggest source of
  // stutter on phones.
  ignoreMobileResize: true,
  autoRefreshEvents: 'visibilitychange,DOMContentLoaded,load',
});

/**
 * Batch every scroll-linked read/write through one rAF. Handlers that
 * measure on `mousemove` (spotlights, magnets, card tilts) would
 * otherwise force a synchronous layout on every pointer event.
 */
export function rafThrottle<T extends unknown[]>(fn: (...args: T) => void): (...args: T) => void {
  let queued = false;
  let latest: T;
  return (...args: T) => {
    latest = args;
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      fn(...latest);
    });
  };
}

export { gsap, ScrollTrigger };
