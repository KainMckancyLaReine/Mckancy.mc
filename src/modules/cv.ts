import { gsap, rafThrottle } from './motion';
import { LANG_EVENT, getLang, setLang, t } from './lang';

/**
 * CV — the fullscreen dossier overlay.
 *
 * Deliberately *not* a section of the page. The page keeps its scroll
 * offset, the dossier drops over it through an aperture wipe, and closing
 * puts the visitor back exactly where they were. That also keeps the CV
 * out of the main document flow, so none of the pinned ScrollTriggers on
 * the page below have to be recalculated when it opens.
 *
 * Everything scroll-driven inside the overlay runs off the overlay's own
 * scroller rather than ScrollTrigger. Two reasons: the page's triggers pin
 * for several viewports and a `scroller:` swap mid-session made them
 * remeasure against the wrong element, and a single rAF-throttled handler
 * over ~40 elements is cheaper than ~40 triggers that only ever matter
 * while the overlay is up.
 *
 * Reveals use one IntersectionObserver rooted on that scroller, so an
 * element that never comes into view never costs an animation.
 */

/* Resolved through Vite (same idiom as the hero photo in main.ts): a bare
   './assets/...' string only happens to work from the published root — it
   404s in `vite dev`, which serves from app/. */
const cvPdfUrl = new URL('../../assets/cv/Kain-Mckancy-La-Reine-CV.pdf', import.meta.url).href;

const GLYPHS = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789#%&$@/<>*+';

let reduceMotion = false;
let isOpen = false;
let lastTrigger: HTMLElement | null = null;
let pageScrollY = 0;

/* ------------------------------------------------------------------ */
/* text splitting                                                      */
/* ------------------------------------------------------------------ */

/**
 * Wrap every visible character of `root` in its own inline-block span,
 * walking through element children so the italic accent spans in the
 * headings keep their colour. Whitespace stays plain text — wrapping it
 * too would let a line break land inside a word.
 */
function splitChars(root: HTMLElement): HTMLElement[] {
  if (root.dataset.cvSplitDone === '1') {
    return Array.from(root.querySelectorAll<HTMLElement>('.cv-char'));
  }

  const chars: HTMLElement[] = [];

  const walk = (node: Node): void => {
    Array.from(node.childNodes).forEach((child) => {
      if (child.nodeType === Node.TEXT_NODE) {
        const text = child.textContent ?? '';
        if (!text.trim()) return;
        const frag = document.createDocumentFragment();
        // Characters are grouped per word. Bare inline-block glyphs let the
        // browser break a line *inside* a word — "La Rein / e." — because
        // every glyph is its own box; a nowrap wrapper per word fixes it
        // without giving up per-character animation.
        text.split(/(\s+)/).forEach((chunk) => {
          if (!chunk) return;
          if (/^\s+$/.test(chunk)) {
            frag.appendChild(document.createTextNode(' '));
            return;
          }
          const word = document.createElement('span');
          word.className = 'cv-word';
          for (const ch of chunk) {
            const span = document.createElement('span');
            span.className = 'cv-char';
            span.textContent = ch;
            chars.push(span);
            word.appendChild(span);
          }
          frag.appendChild(word);
        });
        child.parentNode?.replaceChild(frag, child);
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        walk(child);
      }
    });
  };

  walk(root);
  root.dataset.cvSplitDone = '1';
  return chars;
}

/** Roll `el` through random glyphs and land on its own text. One tween, one onComplete. */
function scramble(el: HTMLElement, duration = 0.7): void {
  const final = el.dataset.cvFinal ?? el.textContent ?? '';
  el.dataset.cvFinal = final;
  if (reduceMotion) {
    el.textContent = final;
    return;
  }
  const state = { p: 0 };
  gsap.to(state, {
    p: 1,
    duration,
    ease: 'power2.inOut',
    onUpdate: () => {
      const locked = Math.floor(state.p * final.length);
      el.textContent =
        final.slice(0, locked) +
        final
          .slice(locked)
          .split('')
          .map((c) => (c === ' ' ? ' ' : GLYPHS[(Math.random() * GLYPHS.length) | 0]))
          .join('');
    },
    onComplete: () => {
      el.textContent = final;
    },
  });
}

/** Count `el` up to `to`, rounding on every frame so it never shows a fraction. */
function countTo(el: HTMLElement, to: number, suffix: string): void {
  if (reduceMotion) {
    el.textContent = String(to) + suffix;
    return;
  }
  const state = { v: 0 };
  gsap.to(state, {
    v: to,
    duration: 1.3,
    ease: 'expo.out',
    onUpdate: () => {
      el.textContent = String(Math.round(state.v)) + suffix;
    },
  });
}

/* ------------------------------------------------------------------ */
/* reveals                                                             */
/* ------------------------------------------------------------------ */

/** Everything that happens the first time an element scrolls into the plate. */
function reveal(el: HTMLElement): void {
  if (el.dataset.cvRevealed === '1') return;
  el.dataset.cvRevealed = '1';
  el.classList.add('is-in');

  const d = reduceMotion ? 0 : undefined;

  if (el.hasAttribute('data-cv-split')) {
    const chars = splitChars(el);
    // The heading itself was parked at opacity 0 with every other reveal
    // target; here it is the characters that animate, so the heading has
    // to be handed back its own opacity or the whole line stays invisible.
    gsap.set(el, { opacity: 1 });
    gsap.fromTo(
      chars,
      { yPercent: 115, opacity: 0, rotateX: -70 },
      {
        yPercent: 0,
        opacity: 1,
        rotateX: 0,
        duration: d ?? 0.9,
        stagger: d ?? 0.018,
        ease: 'expo.out',
        // Dropped once the reveal lands: a few hundred glyphs each holding
        // a transform is a lot of style for a heading that never moves again.
        clearProps: 'transform',
      }
    );
    return;
  }

  if (el.hasAttribute('data-cv-item')) {
    gsap.fromTo(
      el,
      { opacity: 0, y: 44, filter: 'blur(6px)' },
      { opacity: 1, y: 0, filter: 'blur(0px)', duration: d ?? 0.9, ease: 'expo.out', clearProps: 'filter' }
    );
    const date = el.querySelector<HTMLElement>('[data-cv-scramble]');
    if (date) gsap.delayedCall(d ?? 0.25, () => scramble(date));
    const chips = el.querySelectorAll<HTMLElement>('.tl-chips span');
    if (chips.length) {
      gsap.fromTo(
        chips,
        { opacity: 0, y: 12, scale: 0.9 },
        { opacity: 1, y: 0, scale: 1, duration: d ?? 0.5, stagger: d ?? 0.05, delay: d ?? 0.3, ease: 'back.out(2)' }
      );
    }
    return;
  }

  if (el.hasAttribute('data-cv-cert')) {
    const date = el.querySelector<HTMLElement>('[data-cv-scramble]');
    gsap.fromTo(
      el,
      { opacity: 0, y: 36, rotateX: -22, transformPerspective: 900 },
      { opacity: 1, y: 0, rotateX: 0, duration: d ?? 0.85, ease: 'expo.out', clearProps: 'transform' }
    );
    if (date) gsap.delayedCall(d ?? 0.2, () => scramble(date, 0.5));
    return;
  }

  if (el.classList.contains('cv-meter')) {
    const level = Number(el.dataset.cvLevel ?? '0');
    const fill = el.querySelector<HTMLElement>('.cm-track i');
    const value = el.querySelector<HTMLElement>('.cm-v');
    const track = el.querySelector<HTMLElement>('.cm-track');
    // The sweep travels the width of the *fill*, not of the track, so it
    // has to be measured rather than guessed in CSS.
    if (track) el.style.setProperty('--cm-sweep', `${(track.offsetWidth * level) / 100 + 40}px`);
    gsap.fromTo(el, { opacity: 0, x: -18 }, { opacity: 1, x: 0, duration: d ?? 0.6, ease: 'power3.out' });
    if (fill) {
      gsap.to(fill, { width: `${level}%`, duration: d ?? 1.5, ease: 'expo.out', delay: d ?? 0.15 });
    }
    if (value) {
      const state = { v: 0 };
      if (reduceMotion) {
        value.textContent = `${level}%`;
      } else {
        gsap.to(state, {
          v: level,
          duration: 1.5,
          delay: 0.15,
          ease: 'expo.out',
          onUpdate: () => {
            value.textContent = `${Math.round(state.v)}%`;
          },
        });
      }
    }
    return;
  }

  if (el.classList.contains('cv-stat')) {
    const n = el.querySelector<HTMLElement>('.cs-n');
    gsap.fromTo(el, { opacity: 0, y: 26 }, { opacity: 1, y: 0, duration: d ?? 0.7, ease: 'expo.out' });
    if (n) countTo(n, Number(el.dataset.cvCount ?? '0'), el.dataset.cvSuffix ?? '');
    return;
  }

  // data-cv-fade and anything else that just needs to arrive.
  gsap.fromTo(el, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: d ?? 0.8, ease: 'expo.out' });
}

const REVEAL_SELECTOR =
  '[data-cv-split], [data-cv-item], [data-cv-cert], [data-cv-fade], .cv-meter, .cv-stat, .cv-facts li';

/* ------------------------------------------------------------------ */
/* init                                                                */
/* ------------------------------------------------------------------ */

export function initCv(isTouch: boolean, prefersReducedMotion: boolean): void {
  reduceMotion = prefersReducedMotion;

  const overlayEl = document.getElementById('cvOverlay');
  const scrollerEl = document.getElementById('cvScroll');
  const closeBtnEl = document.getElementById('cvClose');
  if (!overlayEl || !scrollerEl || !closeBtnEl) return;

  // Re-bound with an explicit type: `open()` and `close()` are hoisted
  // function declarations, and the compiler will not carry a narrowing
  // from the guard above into a closure that could run at any later time.
  const overlay: HTMLElement = overlayEl;
  const scroller: HTMLElement = scrollerEl;
  const closeBtn: HTMLElement = closeBtnEl;

  const blades = Array.from(overlay.querySelectorAll<HTMLElement>('.cv-ap'));
  const bar = overlay.querySelector<HTMLElement>('.cv-bar');
  const indexRail = overlay.querySelector<HTMLElement>('.cv-index');
  const progressBar = document.getElementById('cvProgressBar');
  const tlFill = document.getElementById('cvTlFill');
  const timeline = overlay.querySelector<HTMLElement>('.cv-timeline');
  const sections = Array.from(overlay.querySelectorAll<HTMLElement>('.cv-sec'));
  const indexButtons = Array.from(overlay.querySelectorAll<HTMLElement>('[data-cv-jump]'));
  const card = document.getElementById('cvIdCard');

  // Both download buttons point at the hashed asset Vite emits, and both
  // ask the browser for a human filename rather than the hashed one.
  overlay.querySelectorAll<HTMLAnchorElement>('#cvDownload, #cvDownload2').forEach((a) => {
    a.href = cvPdfUrl;
    a.setAttribute('download', 'Kain-Mckancy-La-Reine-CV.pdf');
    a.addEventListener('click', () => {
      a.classList.add('is-downloading');
      window.setTimeout(() => a.classList.remove('is-downloading'), 600);
    });
  });

  /* ---- language switch inside the bar ---- */
  const langBtn = document.getElementById('cvLang');
  if (langBtn) {
    // The button always offers the *other* language, so its face is the
    // one the visitor would be switching to — same reading as the nav pill.
    const syncLang = (): void => {
      const other = getLang() === 'nl' ? 'en' : 'nl';
      langBtn.textContent = other.toUpperCase();
      const label = t(other === 'nl' ? 'lang.to.nl' : 'lang.to.en');
      langBtn.setAttribute('aria-label', label);
      langBtn.setAttribute('title', label);
    };
    syncLang();
    window.addEventListener(LANG_EVENT, syncLang);
    langBtn.addEventListener('click', () => {
      setLang(getLang() === 'nl' ? 'en' : 'nl');
      if (!reduceMotion) {
        gsap.fromTo(langBtn, { scale: 0.86 }, { scale: 1, duration: 0.5, ease: 'back.out(3)' });
      }
    });
  }

  /* ---- reveal observer ---- */
  const revealTargets = Array.from(overlay.querySelectorAll<HTMLElement>(REVEAL_SELECTOR));
  // Hidden up front so nothing flashes at full opacity before its reveal.
  gsap.set(revealTargets, { opacity: 0 });

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        reveal(entry.target as HTMLElement);
        observer.unobserve(entry.target);
      });
    },
    { root: scroller, rootMargin: '0px 0px -12% 0px', threshold: 0.15 }
  );
  revealTargets.forEach((el) => observer.observe(el));

  /* ---- scroll-driven chrome ---- */
  /**
   * A jump — the index rail, or a fast flick — can carry the plate past
   * elements without them ever intersecting, and an IntersectionObserver
   * has nothing to report for a region that was never on screen. Those
   * elements would then sit at opacity 0 above the visitor. Anything that
   * ended up behind the viewport gets its reveal run immediately instead.
   */
  function flushSkipped(): void {
    revealTargets.forEach((el) => {
      if (el.dataset.cvRevealed === '1') return;
      if (el.getBoundingClientRect().bottom < 0) {
        reveal(el);
        observer.unobserve(el);
      }
    });
  }

  let settleTimer = 0;
  const onScroll = rafThrottle(() => {
    window.clearTimeout(settleTimer);
    settleTimer = window.setTimeout(flushSkipped, 140);

    const max = scroller.scrollHeight - scroller.clientHeight;
    const progress = max > 0 ? scroller.scrollTop / max : 0;
    if (progressBar) progressBar.style.width = `${progress * 100}%`;

    const mid = scroller.clientHeight * 0.5;

    // Timeline spine fills as the visitor moves through it.
    if (timeline && tlFill) {
      const r = timeline.getBoundingClientRect();
      const through = (mid - r.top) / Math.max(1, r.height);
      tlFill.style.height = `${Math.min(100, Math.max(0, through * 100))}%`;
    }

    // Ghost section numbers drift against the scroll, and the index rail
    // marks whichever section owns the middle of the screen.
    let active = 0;
    sections.forEach((sec, i) => {
      const r = sec.getBoundingClientRect();
      if (!reduceMotion) {
        const rel = (mid - (r.top + r.height / 2)) / Math.max(1, scroller.clientHeight);
        sec.style.setProperty('--cv-num-y', `${(rel * 60).toFixed(1)}px`);
      }
      if (r.top <= mid && r.bottom > mid * 0.4) active = i;
    });
    indexButtons.forEach((b, i) => b.classList.toggle('is-active', i === active));
  });
  scroller.addEventListener('scroll', onScroll as EventListener, { passive: true });

  indexButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = document.getElementById(btn.dataset.cvJump ?? '');
      if (!target) return;
      const top = target.offsetTop - 40;
      if (reduceMotion) {
        scroller.scrollTop = top;
        return;
      }
      // Hand-tweened for the same reason the page anchors are: native
      // smooth scrolling fights the other scroll work on this plate.
      gsap.to(scroller, { scrollTop: top, duration: 0.9, ease: 'expo.inOut' });
    });
  });

  /* ---- the ID card leans toward the pointer (desktop only) ---- */
  if (card && !isTouch && !reduceMotion) {
    const onMove = rafThrottle((e: MouseEvent) => {
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      gsap.to(card, {
        rotateY: px * 14,
        rotateX: -py * 14,
        transformPerspective: 900,
        duration: 0.7,
        ease: 'power3.out',
      });
    });
    card.addEventListener('mousemove', onMove as EventListener);
    card.addEventListener('mouseleave', () => {
      gsap.to(card, { rotateY: 0, rotateX: 0, duration: 0.9, ease: 'elastic.out(1, 0.5)' });
    });
  }

  /* ---- focus handling ---- */
  const focusables = (): HTMLElement[] =>
    Array.from(
      overlay.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    ).filter((el) => el.offsetParent !== null || el === scroller);

  function trapFocus(e: KeyboardEvent): void {
    if (e.key !== 'Tab') return;
    const list = focusables();
    if (!list.length) return;
    const first = list[0];
    const last = list[list.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  /* ---- open / close ---- */
  function open(trigger: HTMLElement | null): void {
    if (isOpen) return;
    isOpen = true;
    lastTrigger = trigger;

    // Freeze the page where it stands. `position: fixed` on the body would
    // also work and is worse: it collapses the layout, which forces every
    // pinned trigger underneath to remeasure on close.
    pageScrollY = window.scrollY;
    document.body.classList.add('cv-open');
    overlay.classList.add('is-open');
    overlay.removeAttribute('inert');
    overlay.setAttribute('aria-hidden', 'false');
    scroller.scrollTop = 0;
    document.addEventListener('keydown', onKeydown);

    if (reduceMotion) {
      gsap.set(overlay, { opacity: 1, scale: 1 });
      gsap.set(blades, { yPercent: (i) => (i === 0 ? -100 : 100) });
      scroller.focus({ preventScroll: true });
      onScroll();
      return;
    }

    gsap.killTweensOf([overlay, ...blades]);
    const tl = gsap.timeline({
      onComplete: () => {
        scroller.focus({ preventScroll: true });
        onScroll();
      },
    });

    tl.set(blades, { yPercent: 0 })
      .set(overlay, { opacity: 1, scale: 1.04 })
      // Blades part like a shutter, the plate settles back to 1:1 behind them.
      .to(blades, { yPercent: (i) => (i === 0 ? -100 : 100), duration: 0.95, ease: 'expo.inOut' }, 0)
      .to(overlay, { scale: 1, duration: 1.1, ease: 'expo.out' }, 0)
      .from(bar, { opacity: 0, y: -18, duration: 0.6, ease: 'power3.out' }, 0.35)
      .from(indexRail, { opacity: 0, x: -14, duration: 0.6, ease: 'power3.out' }, 0.45)
      .from(
        card,
        { opacity: 0, rotateY: -28, y: 40, transformPerspective: 900, duration: 1, ease: 'expo.out' },
        0.3
      );
  }

  function close(): void {
    if (!isOpen) return;
    isOpen = false;
    document.removeEventListener('keydown', onKeydown);
    overlay.setAttribute('inert', '');
    overlay.setAttribute('aria-hidden', 'true');

    const finish = (): void => {
      overlay.classList.remove('is-open');
      document.body.classList.remove('cv-open');
      // The page never actually moved, but Safari restores an offset of
      // its own when overflow comes back — put it back by hand.
      window.scrollTo(0, pageScrollY);
      lastTrigger?.focus({ preventScroll: true });
    };

    if (reduceMotion) {
      gsap.set(overlay, { opacity: 0 });
      finish();
      return;
    }

    gsap.killTweensOf([overlay, ...blades]);
    gsap
      .timeline({ onComplete: finish })
      .to(blades, { yPercent: 0, duration: 0.7, ease: 'expo.inOut' }, 0)
      .to(overlay, { scale: 1.03, duration: 0.7, ease: 'power2.in' }, 0)
      .to(overlay, { opacity: 0, duration: 0.25, ease: 'power2.in' }, 0.55);
  }

  function onKeydown(e: KeyboardEvent): void {
    if (e.key === 'Escape') {
      e.preventDefault();
      close();
      return;
    }
    trapFocus(e);
  }

  document.querySelectorAll<HTMLElement>('[data-cv-open]').forEach((btn) => {
    btn.addEventListener('click', () => open(btn));
  });
  closeBtn.addEventListener('click', () => close());

  // Clicking the dark margin beside the reading column closes too. The
  // test is on the scroller itself rather than on the veil underneath it:
  // the veil never receives a click, because the scroll plate covers it.
  scroller.addEventListener('click', (e) => {
    if (e.target === scroller) close();
  });

  const toContact = document.getElementById('cvToContact');
  toContact?.addEventListener('click', () => {
    close();
    const target = document.getElementById('contact');
    if (!target) return;
    // After the close animation, so the visitor sees where they land.
    window.setTimeout(() => {
      window.scrollTo({ top: target.offsetTop, behavior: reduceMotion ? 'auto' : 'smooth' });
    }, reduceMotion ? 0 : 820);
  });

  /* ---- language swap ---- */
  // `write()` replaces innerHTML, which wipes the per-character spans and
  // resets the meters' numbers. Anything already revealed is rebuilt in
  // place; anything still below the fold is left for the observer.
  window.addEventListener(LANG_EVENT, () => {
    overlay.querySelectorAll<HTMLElement>('[data-cv-split]').forEach((el) => {
      if (el.dataset.cvRevealed !== '1') return;
      delete el.dataset.cvSplitDone;
      const chars = splitChars(el);
      gsap.set(el, { opacity: 1 });
      if (reduceMotion) return;
      gsap.fromTo(
        chars,
        { yPercent: 60, opacity: 0 },
        { yPercent: 0, opacity: 1, duration: 0.6, stagger: 0.012, ease: 'expo.out', clearProps: 'transform' }
      );
    });
    // Dutch and English dates differ in length; re-lock the scrambled ones.
    overlay.querySelectorAll<HTMLElement>('[data-cv-scramble]').forEach((el) => {
      delete el.dataset.cvFinal;
    });
  });
}
