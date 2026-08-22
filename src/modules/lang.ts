import { gsap, ScrollTrigger } from './motion';
import { NL } from './lang.nl';

/**
 * NL / EN language switch.
 *
 * Two halves live in this file.
 *
 * 1. A tiny i18n layer. Every translatable node in the markup carries
 *    `data-i18n="key"` (innerHTML) or `data-i18n-attr="attr:key,..."`
 *    (attributes). The English dictionary is *harvested from the markup
 *    itself* at boot rather than duplicated in a file — the HTML stays the
 *    single source of truth for English, so the two can never drift apart.
 *    Only the Dutch side is authored, in `lang.nl.ts`.
 *
 * 2. The switch itself: a pill in the nav whose two labels shuffle through
 *    random glyphs and re-resolve while a lime thumb springs across. It
 *    follows the same one-tween-with-an-onComplete idiom as the digit roll
 *    in `worlds.ts` — a chain of delayed calls can be stretched by a long
 *    frame and leave a scrambled glyph on screen for good.
 *
 * Anything that split text into per-word spans (the about title, the
 * read-reveal paragraphs) has to rebuild after a swap, so a swap fires a
 * `kmlr:langchange` event on `window` and those modules listen for it.
 * The initial application is deliberately silent: it runs before the
 * animation modules boot, so there is nothing to rebuild yet.
 */

export type Lang = 'en' | 'nl';

export const LANG_EVENT = 'kmlr:langchange';

const STORAGE_KEY = 'kmlr-lang';
const GLYPHS = 'ABCDEFGHJKLMNPQRSTUVWXYZ#%&$@/<>*+';

/**
 * English strings that exist only in JavaScript (form status, cursor
 * labels) and so cannot be harvested from the markup. Everything else
 * comes out of the DOM.
 */
const EN_RUNTIME: Record<string, string> = {
  'form.status.ok': "Message received. I'll be in touch.",
  'form.status.error': 'Something went wrong — please email me directly.',
  'form.subject': 'Project inquiry',
  'form.subject.fallback': 'New idea',
  'lang.to.nl': 'Schakel over naar Nederlands',
  'lang.to.en': 'Switch to English',
};

const EN: Record<string, string> = { ...EN_RUNTIME };

let current: Lang = 'en';
let reduceMotion = false;

/* ------------------------------------------------------------------ */
/* dictionary                                                          */
/* ------------------------------------------------------------------ */

function parseAttrPairs(spec: string): Array<[string, string]> {
  return spec
    .split(',')
    .map((pair) => pair.split(':'))
    .filter((parts): parts is [string, string] => parts.length === 2)
    .map(([attr, key]) => [attr.trim(), key.trim()] as [string, string]);
}

/** Read the English copy straight out of the markup, once, before anything mutates it. */
function harvestEnglish(): void {
  document.querySelectorAll<HTMLElement>('[data-i18n]').forEach((el) => {
    const key = el.dataset.i18n;
    if (key && !(key in EN)) EN[key] = el.innerHTML.trim();
  });
  document.querySelectorAll<HTMLElement>('[data-i18n-attr]').forEach((el) => {
    const spec = el.dataset.i18nAttr;
    if (!spec) return;
    for (const [attr, key] of parseAttrPairs(spec)) {
      if (!(key in EN)) EN[key] = el.getAttribute(attr) ?? '';
    }
  });
}

/** Translate a key in the language currently on screen. Falls back to English, then to the key. */
export function t(key: string): string {
  const value = current === 'nl' ? NL[key] : EN[key];
  return value ?? EN[key] ?? key;
}

export function getLang(): Lang {
  return current;
}

function write(lang: Lang): void {
  const dict = lang === 'nl' ? NL : EN;

  document.querySelectorAll<HTMLElement>('[data-i18n]').forEach((el) => {
    const key = el.dataset.i18n;
    if (!key || el.dataset.i18nLang === lang) return;
    const value = dict[key] ?? EN[key];
    if (value === undefined) return;
    el.innerHTML = value;
    el.dataset.i18nLang = lang;
    // The replacement wiped any per-word split; let read-reveal know it
    // has to run again over this block.
    delete el.dataset.rrSplit;
  });

  document.querySelectorAll<HTMLElement>('[data-i18n-attr]').forEach((el) => {
    const spec = el.dataset.i18nAttr;
    if (!spec) return;
    for (const [attr, key] of parseAttrPairs(spec)) {
      const value = dict[key] ?? EN[key];
      if (value !== undefined) el.setAttribute(attr, value);
    }
  });

  document.documentElement.lang = lang;
  document.documentElement.dataset.lang = lang;

  const ogLocale = document.querySelector<HTMLMetaElement>('meta[property="og:locale"]');
  if (ogLocale) ogLocale.content = lang === 'nl' ? 'nl_NL' : 'en_US';
}

/* ------------------------------------------------------------------ */
/* the switch                                                          */
/* ------------------------------------------------------------------ */

/**
 * Roll `el` through random glyphs and land on `final`.
 *
 * One tween drives the whole thing, so there is exactly one `onComplete`
 * that writes the real text — see the note on `scrambleNumber` in
 * `worlds.ts` for why a chain of `delayedCall`s is not equivalent.
 */
function scramble(el: HTMLElement, final: string, duration: number, delay: number): void {
  const state = { p: 0 };
  gsap.killTweensOf(state);
  gsap.to(state, {
    p: 1,
    duration,
    delay,
    ease: 'power2.inOut',
    onUpdate: () => {
      const locked = Math.floor(state.p * final.length);
      el.textContent =
        final.slice(0, locked) +
        final
          .slice(locked)
          .split('')
          .map(() => GLYPHS[(Math.random() * GLYPHS.length) | 0])
          .join('');
    },
    onComplete: () => {
      el.textContent = final;
    },
  });
}

interface SwitchRefs {
  button: HTMLButtonElement;
  thumb: HTMLElement;
  scan: HTMLElement;
  slots: HTMLElement[];
  state: HTMLElement | null;
}

let refs: SwitchRefs | null = null;

/** Keep the pill's accessible name and active-side styling in step with `current`. */
function updateSwitchLabels(): void {
  if (!refs) return;
  const { button, state } = refs;
  button.dataset.lang = current;
  const label = current === 'nl' ? t('lang.to.en') : t('lang.to.nl');
  button.setAttribute('aria-label', label);
  button.setAttribute('title', label);
  if (state) state.textContent = current === 'nl' ? 'Nederlands' : 'English';
}

/** Snap the pill to match `current` with no motion — used on boot and under reduced motion. */
function syncSwitch(): void {
  if (!refs) return;
  updateSwitchLabels();
  gsap.set(refs.thumb, { xPercent: current === 'en' ? 100 : 0, skewX: 0, scaleX: 1 });
}

/** The full switch performance: thumb springs across, both labels reshuffle, a scan line sweeps. */
function animateSwitch(): void {
  if (!refs) return;
  const { thumb, scan, slots } = refs;
  const toEnglish = current === 'en';
  const target = toEnglish ? 100 : 0;

  updateSwitchLabels();

  if (reduceMotion) {
    syncSwitch();
    return;
  }

  gsap.killTweensOf([thumb, scan]);

  const tl = gsap.timeline();
  tl.to(thumb, { xPercent: target, duration: 0.62, ease: 'elastic.out(1, 0.7)' }, 0)
    // A short skew + stretch in the direction of travel, released on a
    // second spring — the thumb reads as launched rather than slid.
    .to(thumb, { skewX: toEnglish ? -16 : 16, scaleX: 1.24, duration: 0.13, ease: 'power2.out' }, 0)
    .to(thumb, { skewX: 0, scaleX: 1, duration: 0.5, ease: 'elastic.out(1, 0.5)' }, 0.13)
    .fromTo(
      scan,
      { xPercent: toEnglish ? -140 : 140, opacity: 1 },
      { xPercent: toEnglish ? 140 : -140, duration: 0.46, ease: 'power2.inOut' },
      0.02
    )
    .set(scan, { opacity: 0 });

  // Both labels reshuffle, the incoming one a beat later, so it reads as a
  // hand-off between the two rather than one blurred moment.
  slots.forEach((slot) => {
    const incoming = slot.dataset.ls === current;
    scramble(slot, slot.dataset.lsFinal ?? slot.textContent ?? '', 0.4, incoming ? 0.08 : 0);
  });
}

/** A quick re-focus over the copy that just changed, but only where the visitor can see it. */
function flashSwappedCopy(): void {
  if (reduceMotion) return;
  const inView: HTMLElement[] = [];
  document.querySelectorAll<HTMLElement>('[data-i18n]').forEach((el) => {
    const r = el.getBoundingClientRect();
    if (r.height > 0 && r.bottom > 0 && r.top < window.innerHeight) inView.push(el);
  });
  if (!inView.length) return;
  gsap.fromTo(
    inView,
    { filter: 'blur(5px)' },
    {
      filter: 'blur(0px)',
      duration: 0.45,
      stagger: 0.015,
      ease: 'power2.out',
      clearProps: 'filter',
    }
  );
}

export function setLang(lang: Lang, animate = true): void {
  if (lang === current) return;
  current = lang;
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    /* private mode — the choice just won't survive a reload */
  }

  write(lang);
  if (animate) {
    animateSwitch();
    flashSwappedCopy();
  } else {
    syncSwitch();
  }

  window.dispatchEvent(new CustomEvent(LANG_EVENT, { detail: { lang } }));

  // Dutch and English rarely wrap identically; every trigger below the
  // fold needs remeasuring once the new copy has laid out.
  requestAnimationFrame(() => ScrollTrigger.refresh());
}

function preferredLang(): Lang {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'nl' || saved === 'en') return saved;
  } catch {
    /* ignore */
  }
  const nav = navigator.languages?.[0] ?? navigator.language ?? 'en';
  return nav.toLowerCase().startsWith('nl') ? 'nl' : 'en';
}

/**
 * Must run before the animation modules — several of them split the copy
 * into per-word spans on init, and they should split the language the
 * visitor is actually going to read.
 */
export function initLang(prefersReducedMotion: boolean): void {
  reduceMotion = prefersReducedMotion;
  harvestEnglish();

  const button = document.getElementById('langSwitch') as HTMLButtonElement | null;
  if (button) {
    const thumb = button.querySelector<HTMLElement>('.ls-thumb');
    const scan = button.querySelector<HTMLElement>('.ls-scan');
    const slots = Array.from(button.querySelectorAll<HTMLElement>('.ls-slot'));
    if (thumb && scan && slots.length === 2) {
      slots.forEach((slot) => {
        slot.dataset.lsFinal = (slot.textContent ?? '').trim();
      });
      refs = { button, thumb, scan, slots, state: document.getElementById('langSwitchState') };
      button.addEventListener('click', () => setLang(current === 'nl' ? 'en' : 'nl'));
    }
  }

  const wanted = preferredLang();
  if (wanted !== 'en') {
    current = wanted;
    write(wanted);
  } else {
    write('en');
  }
  syncSwitch();
}
