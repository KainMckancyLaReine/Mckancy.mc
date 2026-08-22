import { gsap, ScrollTrigger } from './motion';
import { LANG_EVENT, t } from './lang';

export function initClock(): void {
  const el = document.getElementById('navTime');
  if (!el) return;
  const update = () => {
    try {
      const t = new Date().toLocaleTimeString('en-GB', {
        timeZone: 'Europe/Amsterdam',
        hour: '2-digit',
        minute: '2-digit',
      });
      el.textContent = 'AMS · ' + t;
    } catch {
      el.textContent = '';
    }
  };
  update();
  setInterval(update, 30000);
}

const THEME_KEY = 'kmlr-theme';

/** Paper colours for the browser chrome, matched to `--paper` in each theme. */
const THEME_COLOR = { light: '#f4f3ef', dark: '#0d0d0d' };

/**
 * Resolve the theme the visitor should get: their own saved choice first,
 * otherwise whatever their OS is set to. This runs a second time in a tiny
 * inline script in the document head — the class has to be on `<body>`
 * before first paint or a dark-mode visitor gets a white flash on every
 * load — and the two must agree on the storage key.
 */
export function preferredTheme(): 'light' | 'dark' {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'dark' || saved === 'light') return saved;
  } catch {
    /* private mode — fall through to the OS preference */
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(theme: 'light' | 'dark', btn: HTMLElement | null): void {
  const dark = theme === 'dark';
  document.body.classList.toggle('dark', dark);
  // Kept in step with the pre-paint class the head script sets: leaving it
  // on after a switch to light would hold the dark page background under a
  // light body.
  document.documentElement.classList.toggle('theme-dark', dark);
  btn?.setAttribute('aria-pressed', String(dark));
  const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (meta) meta.content = THEME_COLOR[theme];
}

export function initThemeToggle(): void {
  const themeBtn = document.getElementById('themeToggle');
  const system = window.matchMedia('(prefers-color-scheme: dark)');

  applyTheme(preferredTheme(), themeBtn);

  // Follow the OS while the visitor has not expressed a preference of
  // their own — once they click the toggle, their choice wins for good.
  system.addEventListener('change', () => {
    let saved: string | null = null;
    try {
      saved = localStorage.getItem(THEME_KEY);
    } catch {
      /* ignore */
    }
    if (saved) return;
    applyTheme(system.matches ? 'dark' : 'light', themeBtn);
  });

  if (!themeBtn) return;
  themeBtn.addEventListener('click', () => {
    const next = document.body.classList.contains('dark') ? 'light' : 'dark';
    applyTheme(next, themeBtn);
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      /* private mode — the choice just won't survive a reload */
    }
    gsap.fromTo(themeBtn, { rotate: 0 }, { rotate: 360, duration: 0.6, ease: 'power3.out' });
    setTimeout(() => ScrollTrigger.refresh(), 400);
  });
}

/**
 * Anchor-link jump, animated by hand (no native `behavior: 'smooth'`
 * anywhere): Chrome has a real bug where native smooth-scroll combined
 * with `scroll-snap-type` can snap the page back to 0 mid-animation, on
 * both `scrollTo({behavior:'smooth'})` and `scrollIntoView({behavior:
 * 'smooth'})`. A plain rAF tween avoids the native API entirely.
 */
export function initSmoothAnchors(): void {
  function animateScrollTo(targetY: number, duration = 700) {
    const startY = window.scrollY;
    const delta = targetY - startY;
    const startTime = performance.now();
    function ease(t: number) {
      return 1 - Math.pow(1 - t, 3);
    }
    function step(now: number) {
      const t = Math.min(1, (now - startTime) / duration);
      window.scrollTo(0, startY + delta * ease(t));
      if (t < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href')?.slice(1);
      if (!id) return;
      const target = document.getElementById(id);
      if (!target) return;
      e.preventDefault();
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const targetY = Math.min(maxScroll, target.getBoundingClientRect().top + window.scrollY);
      animateScrollTo(targetY);
    });
  });
}

/**
 * The nav is fixed and inherits the page's ink colour, but two sections
 * paint themselves near-black in *both* themes — Selected Work and
 * Contact. Over either of them the logo, links, clock and both toggles
 * were near-black on near-black. `body.nav-on-dark` flips the four tokens
 * the nav reads from; this decides when it is on.
 *
 * Deliberately an IntersectionObserver rather than a ScrollTrigger. The
 * craft reel pins for six viewports between these two sections, and a
 * trigger measured against document coordinates behind a pin was reading
 * Contact as never reached — the nav stayed black on black all the way
 * down the last screen. The observer asks the browser what is actually
 * under the nav band right now, so pinning cannot desynchronise it, and
 * it keeps working when reduced motion switches the reel off entirely.
 *
 * Tracked as a set: both sections can be in the band across a single
 * frame, and whichever leaves second would otherwise clear the class
 * while the other still wants it.
 */
export function initNavContrast(): void {
  const nav = document.getElementById('mainNav');
  const sections = ['worlds', 'contact']
    .map((id) => document.getElementById(id))
    .filter((el): el is HTMLElement => el !== null);
  if (!nav || !sections.length || !('IntersectionObserver' in window)) return;

  const onDark = new Set<Element>();
  let observer: IntersectionObserver | null = null;

  const observe = (): void => {
    observer?.disconnect();
    onDark.clear();

    // Shrink the viewport down to just the strip the nav bar occupies, so
    // "is a dark section under the nav" becomes a plain intersection test.
    const band = nav.offsetHeight || 68;
    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) onDark.add(entry.target);
          else onDark.delete(entry.target);
        });
        document.body.classList.toggle('nav-on-dark', onDark.size > 0);
      },
      { rootMargin: `0px 0px -${Math.max(0, window.innerHeight - band)}px 0px`, threshold: 0 }
    );
    sections.forEach((el) => observer?.observe(el));
  };

  observe();

  // The band is measured in pixels, so it has to be re-cut when the
  // viewport height changes. Debounced because mobile browsers fire this
  // every time the URL bar slides.
  let resizeTimer = 0;
  window.addEventListener('resize', () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(observe, 200);
  });
}

export function initMobileDrawer(): void {
  const navToggle = document.getElementById('navToggle');
  const drawer = document.getElementById('mobileDrawer');
  if (!navToggle || !drawer) return;

  const setOpen = (open: boolean): void => {
    drawer.classList.toggle('open', open);
    navToggle.setAttribute('aria-expanded', String(open));
    // Lifts the nav over the drawer and locks the page behind it — see the
    // `body.drawer-open` rules in style.css.
    document.body.classList.toggle('drawer-open', open);
    // Hidden from the accessibility tree as well as from view, so a
    // screen reader does not read five links that are off-screen.
    drawer.toggleAttribute('inert', !open);
    navToggle.setAttribute('aria-label', t(open ? 'nav.menu.close' : 'nav.menu'));
  };

  setOpen(false);

  // `write()` resets this button's aria-label from the dictionary on every
  // swap, which would say "open menu" over an already-open drawer.
  window.addEventListener(LANG_EVENT, () => setOpen(drawer.classList.contains('open')));

  navToggle.addEventListener('click', () => setOpen(!drawer.classList.contains('open')));
  drawer.querySelectorAll<HTMLElement>('[data-drawer-link]').forEach((a) => {
    a.addEventListener('click', () => setOpen(false));
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && drawer.classList.contains('open')) {
      setOpen(false);
      navToggle.focus();
    }
  });
}
