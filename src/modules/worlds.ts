import { gsap, ScrollTrigger, rafThrottle } from './motion';

/**
 * Selected Work — the stack.
 *
 * Layout: every project is a full-viewport `position: sticky` card. The
 * next card scrolls up over the one before it, which scales back, lifts
 * a few percent and dims, so its top edge stays visible behind the new
 * one. Five cards, one screenshot each, and the pile builds itself.
 *
 * Two things are worth knowing before editing this file.
 *
 * 1. Nothing here triggers off a `.pw-item`. A sticky element reports a
 *    *stuck* bounding box to `getBoundingClientRect()`, so if ScrollTrigger
 *    ever refreshes mid-stack (a tab regaining visibility is enough) it
 *    would measure the card where it is glued rather than where it lives
 *    in the document, and every start/end would be wrong. So each item
 *    gets a zero-height marker injected in front of it: a plain block in
 *    normal flow that always measures true. All triggers hang off those.
 *
 * 2. The item height and the sticky offset are 100svh/0 by design — that
 *    makes card i stick exactly when card i+1 starts entering from the
 *    bottom, so the "cover" scrub below is precisely one viewport long
 *    and never has to guess.
 *
 * Below 1024px, and for anyone who asked for reduced motion, the CSS
 * unstacks the whole thing into a plain column and this module drops the
 * scrubbed work entirely.
 */

const SCRAMBLE = '0123456789';

/**
 * Digit-roll on the big index number.
 *
 * Driven by one tween rather than a chain of delayed calls, so there is
 * always exactly one `onComplete` that writes the real number — a chain
 * can be stretched by a long frame and leave a scrambled digit on screen.
 */
function scrambleNumber(el: HTMLElement, final: string): void {
  const state = { p: 0 };
  gsap.to(state, {
    p: 1,
    duration: 0.55,
    ease: 'none',
    onUpdate: () => {
      const locked = Math.floor(state.p * final.length);
      el.textContent =
        final.slice(0, locked) +
        final
          .slice(locked)
          .split('')
          .map(() => SCRAMBLE[Math.floor(Math.random() * SCRAMBLE.length)])
          .join('');
    },
    onComplete: () => {
      el.textContent = final;
    },
  });
}

export function initWorlds(isTouch: boolean): void {
  const stack = document.getElementById('projectsList');
  if (!stack) return;

  const items = gsap.utils.toArray<HTMLElement>('.pw-item', stack);
  if (items.length === 0) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) return;

  // Matches the CSS breakpoint that turns the sticky stack back into a
  // plain column — the two must never disagree.
  const stacked = window.matchMedia('(min-width: 1024px)').matches;

  // --- zero-height, non-sticky measuring posts (see note 1 above) ------
  const marks = items.map((item) => {
    const mark = document.createElement('span');
    mark.className = 'pw-mark';
    mark.setAttribute('aria-hidden', 'true');
    mark.style.cssText = 'display:block;height:0;pointer-events:none;';
    item.insertAdjacentElement('beforebegin', mark);
    return mark;
  });

  items.forEach((item, i) => {
    const card = item.querySelector<HTMLElement>('.pw-card');
    const shot = item.querySelector<HTMLElement>('.pw-shot');
    const img = item.querySelector<HTMLElement>('.pw-img');
    const scan = item.querySelector<HTMLElement>('.pw-scan');
    const veil = item.querySelector<HTMLElement>('.pw-veil');
    const chrome = item.querySelector<HTMLElement>('.pw-chrome');
    const caption = item.querySelector<HTMLElement>('.pw-caption');
    const idx = item.querySelector<HTMLElement>('.pw-idx-n');
    const lines = item.querySelectorAll<HTMLElement>('.pw-l > span');
    const bits = item.querySelectorAll<HTMLElement>(
      '.pw-idx-r, .pw-idx-y, .pw-kicker, .pw-lede, .pw-tags li, .pw-cta'
    );
    if (!card || !shot || !img) return;

    // The shot box is cropped 5% vertically in CSS, which is the room the
    // parallax below travels in — so the image itself rests at scale 1 and
    // no screenshot is ever narrowed.
    gsap.set(img, { transformOrigin: '50% 50%' });

    // --- entrance: the shot wipes open, the type pushes up ------------
    const tl = gsap.timeline({
      scrollTrigger: { trigger: marks[i], start: 'top 78%', once: true },
    });

    tl.fromTo(
      shot,
      { clipPath: 'inset(0% 0% 100% 0%)' },
      { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.15, ease: 'expo.inOut' },
      0
    )
      .fromTo(img, { scale: 1.12 }, { scale: 1, duration: 1.7, ease: 'expo.out' }, 0)
      .fromTo(
        lines,
        { yPercent: 115 },
        { yPercent: 0, duration: 1, stagger: 0.09, ease: 'expo.out' },
        0.12
      )
      .fromTo(
        bits,
        { y: 18, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.7, stagger: 0.055, ease: 'power3.out' },
        0.28
      );

    if (chrome) {
      tl.fromTo(chrome, { yPercent: -110 }, { yPercent: 0, duration: 0.8, ease: 'expo.out' }, 0.06);
    }
    if (scan) {
      // Rides the wipe down the screenshot, then blinks out.
      tl.fromTo(
        scan,
        { y: 0, opacity: 0 },
        { y: () => shot.clientHeight, opacity: 1, duration: 1.15, ease: 'expo.inOut' },
        0
      ).to(scan, { opacity: 0, duration: 0.3 }, 0.95);
    }
    if (caption) {
      // Explicit fromTo, never `from`: `from` records its end value from
      // whatever the element happens to read as at init time, which for a
      // tween positioned this late in the timeline is not reliably its
      // resting state.
      tl.fromTo(
        caption,
        { y: 16, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.65, ease: 'power3.out' },
        0.8
      );
    }
    if (idx) {
      const final = idx.dataset.num ?? idx.textContent ?? '';
      tl.add(() => scrambleNumber(idx, final), 0.1);
    }

    if (!stacked) return;

    // --- parallax inside the frame, across two viewports of scroll ----
    gsap.fromTo(
      img,
      { yPercent: -2.4 },
      {
        yPercent: 2.4,
        ease: 'none',
        scrollTrigger: {
          trigger: marks[i],
          start: 'top bottom',
          end: () => `+=${window.innerHeight * 2}`,
          scrub: true,
          invalidateOnRefresh: true,
        },
      }
    );

    // --- being covered by the next card -------------------------------
    // Exactly one viewport: from the moment card i+1 appears at the
    // bottom edge to the moment it is flush against the top.
    const next = marks[i + 1];
    if (!next) return;

    const cover = gsap.timeline({
      scrollTrigger: { trigger: next, start: 'top bottom', end: 'top top', scrub: true },
    });
    cover.to(card, { scale: 0.945, yPercent: -5, rotateX: 2.5, ease: 'none' }, 0);
    if (veil) cover.to(veil, { opacity: 0.66, ease: 'none' }, 0);
  });

  // --- bottom scrubber: fill, active label, accent colour -------------
  const fill = stack.querySelector<HTMLElement>('.pw-rail-fill');
  const railItems = Array.from(stack.querySelectorAll<HTMLElement>('.pw-rail-list li'));

  const rail = stack.querySelector<HTMLElement>('.pw-rail');

  if (stacked && fill && rail && railItems.length > 0) {
    let active = -1;
    ScrollTrigger.create({
      trigger: stack,
      start: 'top top',
      end: 'bottom bottom',
      onToggle: (self) => rail.classList.toggle('is-live', self.isActive),
      onUpdate: (self) => {
        fill.style.width = `${(self.progress * 100).toFixed(2)}%`;
        const i = Math.min(railItems.length - 1, Math.floor(self.progress * railItems.length));
        if (i === active) return;
        active = i;
        railItems.forEach((li, n) => li.classList.toggle('is-on', n === i));
        const accent = getComputedStyle(railItems[i]).getPropertyValue('--pa').trim();
        if (accent) stack.style.setProperty('--pa-on', accent);
      },
    });
    railItems[0].classList.add('is-on');
  }

  // --- flip the fixed nav to light while this dark section is under it -
  const section = document.getElementById('worlds');
  if (section) {
    ScrollTrigger.create({
      trigger: section,
      start: 'top 34px',
      end: 'bottom 34px',
      onToggle: (self) => document.body.classList.toggle('nav-on-dark', self.isActive),
    });
  }

  // --- pointer-linked tilt on the frame -------------------------------
  if (isTouch) return;

  items.forEach((item) => {
    const card = item.querySelector<HTMLElement>('.pw-card');
    const frame = item.querySelector<HTMLElement>('.pw-frame');
    if (!card || !frame) return;

    // Rect is cached on enter: measuring on every pointer event forces a
    // synchronous layout, which is exactly what the rest of this page
    // spent so much effort avoiding.
    let rect: DOMRect | null = null;
    card.addEventListener('mouseenter', () => {
      rect = card.getBoundingClientRect();
    });
    card.addEventListener(
      'mousemove',
      rafThrottle((e: MouseEvent) => {
        const r = rect ?? card.getBoundingClientRect();
        const dx = (e.clientX - r.left) / r.width - 0.5;
        const dy = (e.clientY - r.top) / r.height - 0.5;
        gsap.to(frame, {
          rotateY: dx * 6,
          rotateX: -dy * 4.5,
          transformPerspective: 1200,
          duration: 0.9,
          ease: 'power3.out',
        });
      }) as EventListener
    );
    card.addEventListener('mouseleave', () => {
      rect = null;
      gsap.to(frame, { rotateY: 0, rotateX: 0, duration: 1, ease: 'power3.out' });
    });
  });
}
