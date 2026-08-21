import { gsap, ScrollTrigger, rafThrottle } from './motion';

/**
 * Chapter 03 — "The Craft Reel".
 *
 * On desktop the whole chapter pins and six frames are pushed through a
 * 3D depth stack by scroll position itself (scrub), so the visitor is
 * effectively scrubbing a timeline rather than watching an autoplay:
 *
 *   · the heading is split per character and lands with a rotateX fold
 *   · outgoing frames recede into Z and tilt away from camera
 *   · incoming frames rise from -Z with the opposite tilt
 *   · an orange shutter wipes across on every cut
 *   · a rail, a fill bar and a tabular counter report the position
 *   · the Motion frame draws its own easing curve and rides a dot along
 *     it via getPointAtLength (no MotionPath plugin needed)
 *
 * Touch, narrow viewports and prefers-reduced-motion never reach any of
 * that: CSS renders the frames as a plain stacked list and this module
 * gives them a single soft stagger. Nothing is load-bearing on motion.
 */
export function initSkillsReveal(isTouch: boolean): void {
  const stage = document.getElementById('craftStage');
  const deck = document.getElementById('craftDeck');
  const frames = gsap.utils.toArray<HTMLElement>('.craft-frame');

  initChips();

  if (!stage || !deck || frames.length === 0) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canStack = window.matchMedia('(min-width: 1024px) and (hover: hover)').matches;

  initHeading(reduceMotion);

  if (!canStack || isTouch || reduceMotion) {
    initStackedFallback(frames, reduceMotion);
    return;
  }

  initSpotlight(frames);
  initMotionFrame();
  initReel(stage, frames);
}

/* ------------------------------------------------------------------ */

function initChips(): void {
  if (!document.getElementById('skillChips')) return;
  gsap.from('#skillChips .skill-chip', {
    y: 16,
    opacity: 0,
    duration: 0.5,
    stagger: 0.05,
    ease: 'power3.out',
    scrollTrigger: { trigger: '#skillChips', start: 'top 92%', once: true },
  });
}

/**
 * Split the heading into per-character spans without touching its markup
 * structure (the italic <span> and the <br/> both survive), then fold
 * the characters in on entry.
 */
function initHeading(reduceMotion: boolean): void {
  const heading = document.getElementById('craftHeading');
  if (!heading) return;

  const chars: HTMLElement[] = [];
  const walk = (node: Node): void => {
    [...node.childNodes].forEach((child) => {
      if (child.nodeType === Node.TEXT_NODE) {
        const text = child.textContent ?? '';
        if (!text.trim()) return;
        const frag = document.createDocumentFragment();
        [...text].forEach((ch) => {
          if (ch === ' ') {
            frag.appendChild(document.createTextNode(' '));
            return;
          }
          const span = document.createElement('span');
          span.className = 'cf-char';
          span.textContent = ch;
          frag.appendChild(span);
          chars.push(span);
        });
        child.parentNode?.replaceChild(frag, child);
      } else if (child.nodeType === Node.ELEMENT_NODE && (child as Element).tagName !== 'BR') {
        walk(child);
      }
    });
  };
  walk(heading);

  if (chars.length === 0) return;

  if (reduceMotion) {
    gsap.from(heading, {
      opacity: 0,
      duration: 0.6,
      scrollTrigger: { trigger: heading, start: 'top 88%', once: true },
    });
    return;
  }

  gsap.set(heading, { perspective: 800 });
  gsap.from(chars, {
    yPercent: 118,
    rotateX: -82,
    opacity: 0,
    transformOrigin: '50% 100%',
    duration: 0.85,
    ease: 'expo.out',
    stagger: { each: 0.022, from: 'start' },
    scrollTrigger: { trigger: heading, start: 'top 86%', once: true },
    // The fold plays exactly once. Stripping the transforms afterwards
    // (and the parent's perspective with them) lets the browser release
    // one compositor layer per character — two dozen of them here.
    onComplete: () => {
      gsap.set(chars, { clearProps: 'all' });
      gsap.set(heading, { clearProps: 'perspective' });
    },
  });
}

/** Touch / narrow / reduced-motion: one soft stagger, no pin, no 3D. */
function initStackedFallback(frames: HTMLElement[], reduceMotion: boolean): void {
  gsap.set(frames, { clearProps: 'transform,opacity,filter' });
  if (reduceMotion) return;

  frames.forEach((frame) => {
    gsap.from(frame, {
      y: 30,
      opacity: 0,
      duration: 0.7,
      ease: 'power3.out',
      scrollTrigger: { trigger: frame, start: 'top 88%', once: true },
    });
  });
}

/**
 * Cursor-tracked spotlight. The rect is cached on enter and the write is
 * batched into one rAF, so moving the mouse can never force a layout
 * read per pointer event.
 */
function initSpotlight(frames: HTMLElement[]): void {
  frames.forEach((frame) => {
    let rect: DOMRect | null = null;
    frame.addEventListener('mouseenter', () => {
      rect = frame.getBoundingClientRect();
    });
    frame.addEventListener('mouseleave', () => {
      rect = null;
    });
    frame.addEventListener(
      'mousemove',
      rafThrottle((e: MouseEvent) => {
        const r = rect ?? frame.getBoundingClientRect();
        frame.style.setProperty('--mx', `${((e.clientX - r.left) / r.width) * 100}%`);
        frame.style.setProperty('--my', `${((e.clientY - r.top) / r.height) * 100}%`);
      }) as EventListener
    );
  });
}

/**
 * The Motion frame animates itself: the easing curve draws on, and a dot
 * rides the real path geometry via getPointAtLength — the same technique
 * MotionPathPlugin uses, done by hand so no extra plugin ships.
 */
let motionLoop: gsap.core.Timeline | null = null;

function initMotionFrame(): void {
  const path = document.getElementById('craftPath') as SVGPathElement | null;
  const dot = document.getElementById('craftDot') as SVGCircleElement | null;
  if (!path || !dot || typeof path.getTotalLength !== 'function') return;

  const length = path.getTotalLength();
  gsap.set(path, { strokeDasharray: length, strokeDashoffset: length });

  const rider = { t: 0 };
  motionLoop = gsap.timeline({ repeat: -1, repeatDelay: 0.55, paused: true });
  motionLoop
    .to(path, { strokeDashoffset: 0, duration: 1.5, ease: 'power2.inOut' })
    .to(
      rider,
      {
        t: 1,
        duration: 1.5,
        ease: 'power2.inOut',
        onUpdate: () => {
          const p = path.getPointAtLength(rider.t * length);
          gsap.set(dot, { attr: { cx: p.x, cy: p.y } });
        },
      },
      0
    )
    .to(dot, { scale: 1.55, transformOrigin: '50% 50%', duration: 0.22, yoyo: true, repeat: 1 }, 1.5)
    .to({}, { duration: 0.5 })
    .set(path, { strokeDashoffset: length })
    .set(rider, { t: 0 });
}

/* ------------------------------------------------------------------ */

/** The pinned, scrubbed depth stack. */
function initReel(stage: HTMLElement, frames: HTMLElement[]): void {
  const total = frames.length;
  const ticks = gsap.utils.toArray<HTMLElement>('.craft-tick');
  const bar = document.getElementById('craftBar');
  const counter = document.getElementById('craftCounter');
  const shutter = document.getElementById('craftShutter');

  // Transform + opacity only. An animated `filter: blur()` on a frame this
  // large re-rasterises it every single frame of the scrub — the depth
  // reads just as well from z/scale/rotateX, and this stays on the
  // compositor.
  const RESTING = { z: 0, y: 0, rotateX: 0, scale: 1, autoAlpha: 1 };
  const AHEAD = { z: -680, y: 130, rotateX: 24, scale: 0.9, autoAlpha: 0 };
  const BEHIND = { z: -300, y: -90, rotateX: -20, scale: 0.94, autoAlpha: 0 };

  frames.forEach((frame, i) => {
    gsap.set(frame, { transformPerspective: 1400, transformOrigin: '50% 50%' });
    gsap.set(frame, i === 0 ? RESTING : AHEAD);
  });

  let current = -1;
  const setActive = (index: number): void => {
    if (index === current) return;
    current = index;
    ticks.forEach((tick, i) => tick.classList.toggle('is-on', i === index));
    if (counter) counter.textContent = String(index + 1).padStart(2, '0');
    if (motionLoop) {
      // The Motion frame's own animation only runs while it's on camera.
      if (index === 1) motionLoop.restart(true);
      else motionLoop.pause(0);
    }
  };

  const timeline = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger: stage,
      start: 'top top',
      end: () => `+=${total * 620}`,
      pin: true,
      pinSpacing: true,
      anticipatePin: 1,
      scrub: 0.85,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        setActive(Math.round(self.progress * (total - 1)));
      },
    },
  });

  for (let i = 0; i < total - 1; i += 1) {
    const at = i;
    timeline
      .to(frames[i], { ...BEHIND, duration: 1, ease: 'power2.in' }, at)
      .to(frames[i + 1], { ...RESTING, duration: 1, ease: 'power2.out' }, at + 0.12);

    if (shutter) {
      // A narrow band of light sweeps across on every cut — the direction
      // alternates so consecutive transitions never read as the same move.
      const from = i % 2 === 0 ? -130 : 520;
      const to = i % 2 === 0 ? 520 : -130;
      timeline
        .fromTo(
          shutter,
          { xPercent: from, autoAlpha: 0 },
          { xPercent: to, autoAlpha: 1, duration: 1, ease: 'power1.inOut' },
          at
        )
        .to(shutter, { autoAlpha: 0, duration: 0.25, ease: 'power2.in' }, at + 0.75);
    }
  }

  if (bar) {
    // scaleY, not height — animating height would re-run layout on the
    // rail on every frame of the scrub.
    timeline.fromTo(bar, { scaleY: 0 }, { scaleY: 1, duration: total - 1 }, 0);
  }

  setActive(0);

  // The frames only need compositor layers while the reel is actually on
  // screen; holding six promoted layers for the whole page costs memory
  // and slows every unrelated scroll.
  ScrollTrigger.create({
    trigger: stage,
    start: 'top bottom',
    end: () => `+=${total * 620 + window.innerHeight * 2}`,
    onToggle: (self) => {
      gsap.set(frames, { willChange: self.isActive ? 'transform, opacity' : 'auto' });
    },
  });

  // Recalculate the pin (and everything downstream of it) after fonts and
  // images settle, so the reel never ends up measured against a stale height.
  window.addEventListener('load', () => ScrollTrigger.refresh());
}
