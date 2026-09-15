import { gsap } from './motion';
import { t } from './lang';

/**
 * The CV boot sequence — what happens between the click and the dossier.
 *
 * The central rule here: every step does real work. "Preparing profile"
 * decodes the portrait, "Typesetting" waits on `document.fonts.ready`,
 * "Compiling sections" runs the DOM preparation the dossier would
 * otherwise do lazily on first scroll, and "Verifying document" actually
 * fetches the PDF — which is why there is an honest degraded state when
 * that fetch fails. A sequence that only counted milliseconds would read
 * as theatre the second a visitor on a slow connection watched it finish
 * before the page was ready.
 *
 * Each step also has a floor (`minMs`). Real work on a warm connection
 * finishes in single-digit milliseconds, and six states flashing past in
 * 40ms is noise, not information. The floor is what makes the sequence
 * legible; the real work is what makes it honest.
 *
 * Nothing here animates a property that triggers layout. The rail is a
 * scaled transform, the counter is tabular-numeric so its width is fixed,
 * and the log has a fixed height with the overflow clipped — so no step,
 * however long its label, can shift anything on screen.
 */

export type BootOutcome = 'ready' | 'degraded' | 'aborted';

export interface BootRefs {
  root: HTMLElement;
  panel: HTMLElement;
  status: HTMLElement;
  log: HTMLElement;
  rail: HTMLElement;
  fill: HTMLElement;
  counter: HTMLElement;
  note: HTMLElement;
  hint: HTMLElement;
}

export interface BootDeps {
  /** Portrait used by the profile card — decoded, not just requested. */
  photoUrl: string;
  pdfUrl: string;
  /** DOM work the dossier needs: heading splits, meter measurements. */
  prepare: () => void;
  /** Handed the object URL once the PDF is in memory. */
  onDocumentReady: (objectUrl: string, bytes: number) => void;
  /** Told when the document could not be fetched, so the UI can say so. */
  onDocumentFailed: () => void;
}

export interface BootOptions {
  reduceMotion: boolean;
  /** Second and later opens: the assets are warm, so the full sequence would be a lie. */
  abbreviated: boolean;
  /** The element that was clicked — the panel arrives from its direction. */
  trigger: HTMLElement | null;
  signal: AbortSignal;
}

interface Step {
  key: string;
  fallback: string;
  weight: number;
  minMs: number;
  /** A step that throws is fatal only if `critical`; otherwise the run degrades. */
  critical?: boolean;
  task?: (deps: BootDeps, signal: AbortSignal) => Promise<void>;
}

class AbortedError extends Error {}

function sleep(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const id = window.setTimeout(() => {
      signal.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    const onAbort = (): void => {
      window.clearTimeout(id);
      reject(new AbortedError());
    };
    signal.addEventListener('abort', onAbort, { once: true });
  });
}

/** Decode rather than just load: a decoded image cannot stall the first paint of the card. */
function decodeImage(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      if ('decode' in img) img.decode().then(() => resolve(), () => resolve());
      else resolve();
    };
    img.onerror = () => reject(new Error('portrait failed'));
    img.src = url;
  });
}

const STEPS: Step[] = [
  {
    key: 'cv.boot.profile',
    fallback: 'Preparing profile',
    weight: 18,
    minMs: 280,
    task: (deps) => decodeImage(deps.photoUrl),
  },
  {
    key: 'cv.boot.type',
    fallback: 'Typesetting',
    weight: 12,
    minMs: 220,
    task: () => (document.fonts ? document.fonts.ready.then(() => undefined) : Promise.resolve()),
  },
  {
    key: 'cv.boot.sections',
    fallback: 'Compiling sections',
    weight: 22,
    minMs: 300,
    task: (deps) =>
      new Promise((resolve) => {
        // On the next frame, so the measurement work never lands in the
        // same frame as the panel's entrance animation.
        requestAnimationFrame(() => {
          deps.prepare();
          resolve();
        });
      }),
  },
  {
    key: 'cv.boot.verify',
    fallback: 'Verifying document',
    weight: 26,
    minMs: 340,
    task: async (deps, signal) => {
      const res = await fetch(deps.pdfUrl, { signal });
      if (!res.ok) throw new Error(`pdf ${res.status}`);
      const blob = await res.blob();
      deps.onDocumentReady(URL.createObjectURL(blob), blob.size);
    },
  },
  { key: 'cv.boot.assemble', fallback: 'Assembling dossier', weight: 14, minMs: 260 },
  { key: 'cv.boot.ready', fallback: 'Ready', weight: 8, minMs: 200 },
];

const ABBREVIATED: Step[] = [
  { key: 'cv.boot.restore', fallback: 'Restoring dossier', weight: 100, minMs: 420 },
];

/* ------------------------------------------------------------------ */
/* panel chrome                                                        */
/* ------------------------------------------------------------------ */

/**
 * Move the current line into the log and write a new one. The log is a
 * fixed-height, bottom-aligned column with `overflow: hidden`, so lines
 * leave the top by themselves and nothing reflows.
 */
function pushStatus(refs: BootRefs, text: string, reduceMotion: boolean): void {
  const previous = refs.status.textContent;

  if (previous) {
    const line = document.createElement('div');
    line.className = 'cvb-line';
    line.textContent = previous;
    refs.log.appendChild(line);

    const lines = Array.from(refs.log.children) as HTMLElement[];
    // Older lines recede rather than simply fading: each one loses a
    // little contrast and sits a hair further back.
    lines.forEach((el, i) => {
      const depth = lines.length - 1 - i;
      const opacity = Math.max(0, 0.42 - depth * 0.14);
      if (reduceMotion) gsap.set(el, { opacity });
      else gsap.to(el, { opacity, duration: 0.35, ease: 'power2.out' });
    });
    if (!reduceMotion) {
      gsap.fromTo(line, { opacity: 0, y: 8 }, { opacity: 0.42, y: 0, duration: 0.4, ease: 'expo.out' });
    }
    while (refs.log.children.length > 3) refs.log.firstElementChild?.remove();
  }

  refs.status.textContent = text;
  if (reduceMotion) return;
  gsap.fromTo(
    refs.status,
    { opacity: 0, y: 10, filter: 'blur(4px)' },
    { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.5, ease: 'expo.out', clearProps: 'filter' }
  );
}

/**
 * Drive the rail and the counter to `p` (0–1) as one movement, and resolve
 * when they get there. The promise matters at the end: the hand-off must
 * not start while the counter is still climbing, or the sequence fades out
 * on 94 and the visitor never sees it land.
 */
let progressState = { v: 0 };

function setProgress(refs: BootRefs, p: number, reduceMotion: boolean, duration = 0.62): Promise<void> {
  refs.fill.dataset.p = String(p);

  if (reduceMotion) {
    progressState.v = p;
    gsap.set(refs.fill, { scaleX: p });
    refs.counter.textContent = String(Math.round(p * 100)).padStart(3, '0');
    return Promise.resolve();
  }

  // One state object for the whole run, so a new target genuinely
  // overwrites the tween in flight instead of racing it to the counter.
  gsap.killTweensOf(progressState);
  return new Promise((resolve) => {
    gsap.to(progressState, {
      v: p,
      duration,
      ease: 'expo.out',
      onUpdate: () => {
        gsap.set(refs.fill, { scaleX: progressState.v });
        refs.counter.textContent = String(Math.round(progressState.v * 100)).padStart(3, '0');
      },
      onComplete: resolve,
    });
  });
}

/**
 * Panel entrance. It arrives from the direction of the button that was
 * clicked — clamped, so a trigger at the edge of the screen doesn't throw
 * it halfway across — which keeps the click and the panel spatially
 * connected without morphing any type.
 */
function enter(refs: BootRefs, trigger: HTMLElement | null, reduceMotion: boolean): void {
  refs.root.classList.add('is-live');
  if (reduceMotion) {
    gsap.set(refs.root, { opacity: 1 });
    gsap.set(refs.panel, { opacity: 1, y: 0, x: 0, scale: 1 });
    return;
  }

  let fromX = 0;
  let fromY = -26;
  if (trigger) {
    const r = trigger.getBoundingClientRect();
    const p = refs.panel.getBoundingClientRect();
    fromX = gsap.utils.clamp(-90, 90, r.left + r.width / 2 - (p.left + p.width / 2)) * 0.5;
    fromY = gsap.utils.clamp(-120, 120, r.top + r.height / 2 - (p.top + p.height / 2)) * 0.35;
  }

  gsap.set(refs.root, { opacity: 1 });
  gsap
    .timeline()
    .fromTo(
      refs.panel,
      { opacity: 0, x: fromX, y: fromY, scale: 0.97, filter: 'blur(6px)' },
      { opacity: 1, x: 0, y: 0, scale: 1, filter: 'blur(0px)', duration: 0.85, ease: 'expo.out', clearProps: 'filter' }
    )
    .fromTo(refs.rail, { scaleX: 0.4, opacity: 0 }, { scaleX: 1, opacity: 1, duration: 0.7, ease: 'expo.out' }, 0.1)
    .fromTo(refs.hint, { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' }, 0.45);
}

/* ------------------------------------------------------------------ */
/* run                                                                 */
/* ------------------------------------------------------------------ */

export async function runBoot(refs: BootRefs, deps: BootDeps, opts: BootOptions): Promise<BootOutcome> {
  const { reduceMotion, signal } = opts;
  const steps = opts.abbreviated ? ABBREVIATED : STEPS;
  const total = steps.reduce((sum, s) => sum + s.weight, 0);

  // Reset — a previous run may have left the panel mid-sequence.
  refs.log.textContent = '';
  refs.status.textContent = '';
  refs.note.textContent = '';
  refs.note.classList.remove('is-shown');
  refs.fill.dataset.p = '0';
  gsap.killTweensOf(progressState);
  progressState = { v: 0 };
  gsap.set(refs.fill, { scaleX: 0 });
  refs.counter.textContent = '000';

  enter(refs, opts.trigger, reduceMotion);

  let done = 0;
  let outcome: BootOutcome = 'ready';

  for (const step of steps) {
    if (signal.aborted) return 'aborted';
    pushStatus(refs, t(step.key) || step.fallback, reduceMotion);

    const floor = sleep(reduceMotion ? 0 : step.minMs, signal);
    const work = step.task ? step.task(deps, signal) : Promise.resolve();

    try {
      await Promise.all([work, floor]);
    } catch (err) {
      if (err instanceof AbortedError || signal.aborted) return 'aborted';
      if (step.critical) throw err;
      // Honest failure: say what is missing, carry on with the rest.
      outcome = 'degraded';
      deps.onDocumentFailed();
      refs.note.textContent = t('cv.boot.note.nodoc') || 'Document unavailable — opening without the download';
      refs.note.classList.add('is-shown');
      if (!reduceMotion) {
        gsap.fromTo(refs.note, { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: 0.45, ease: 'power3.out' });
      }
      try {
        await floor;
      } catch {
        return 'aborted';
      }
    }

    done += step.weight;
    // Not awaited inside the loop: the rail should still be travelling
    // while the next step's label lands, the way a real progress bar lags
    // slightly behind the work it reports.
    void setProgress(refs, done / total, reduceMotion);
  }

  if (signal.aborted) return 'aborted';

  // Now it is awaited. The sequence ends on a resolved 100, held for a
  // beat, and only then hands over.
  await setProgress(refs, 1, reduceMotion, 0.4);
  try {
    await sleep(reduceMotion ? 0 : 200, signal);
  } catch {
    return 'aborted';
  }
  return outcome;
}

/* ------------------------------------------------------------------ */
/* hand-off                                                            */
/* ------------------------------------------------------------------ */

/**
 * The sequence does not end and get replaced — it becomes the dossier.
 * The rail is lifted out of the panel into the overlay at exactly its
 * current screen position, flown to the header hairline, and then drains
 * from "loaded" back to "unread", which is the same bar the visitor will
 * watch fill again as they scroll. The panel dissolves behind it.
 *
 * Returns a timeline the caller can nest, so the aperture and the first
 * section can run against the same clock rather than chasing it.
 */
export function handOff(refs: BootRefs, targetBar: HTMLElement, reduceMotion: boolean): gsap.core.Timeline {
  const tl = gsap.timeline();

  if (reduceMotion) {
    refs.root.classList.remove('is-live');
    gsap.set(refs.root, { opacity: 0 });
    return tl;
  }

  const from = refs.rail.getBoundingClientRect();
  const to = targetBar.getBoundingClientRect();

  // Out of the panel, into the overlay, pinned where it already appears —
  // no visible jump, because the rect it lands on is the rect it left.
  const parent = refs.rail.parentElement;
  // A placeholder with the rail's exact box, not a bare span: lifting the
  // rail out of a panel that is still visible would otherwise collapse it
  // by the rail's height plus its margin, mid-fade.
  const placeholder = document.createElement('div');
  const railStyle = getComputedStyle(refs.rail);
  placeholder.style.height = `${from.height}px`;
  placeholder.style.marginTop = railStyle.marginTop;
  placeholder.setAttribute('aria-hidden', 'true');
  parent?.insertBefore(placeholder, refs.rail);
  refs.root.appendChild(refs.rail);
  gsap.set(refs.rail, {
    position: 'fixed',
    left: from.left,
    top: from.top,
    width: from.width,
    height: from.height,
    margin: 0,
    zIndex: 8,
    transformOrigin: '0 0',
    x: 0,
    y: 0,
    scaleX: 1,
  });

  tl.to(refs.panel, { opacity: 0, y: -10, filter: 'blur(5px)', duration: 0.45, ease: 'power2.in' }, 0)
    .to([refs.hint, refs.note], { opacity: 0, duration: 0.3, ease: 'power2.in' }, 0)
    .to(
      refs.rail,
      {
        x: to.left - from.left,
        y: to.top - from.top,
        scaleX: to.width / from.width,
        duration: 0.85,
        ease: 'expo.inOut',
      },
      0.08
    )
    // The loading bar becomes the reading bar: full, then drained to the
    // dossier's actual scroll position, which is the top.
    .to(refs.fill, { scaleX: 0, duration: 0.7, ease: 'expo.inOut' }, 0.5)
    .to(refs.rail, { opacity: 0, duration: 0.25, ease: 'power2.in' }, 0.95)
    .add(() => {
      refs.root.classList.remove('is-live');
      gsap.set(refs.root, { opacity: 0 });
      // Put the rail back where the markup expects it, ready for the next open.
      gsap.set(refs.rail, { clearProps: 'all' });
      parent?.insertBefore(refs.rail, placeholder);
      placeholder.remove();
      gsap.set(refs.fill, { scaleX: 0 });
      refs.fill.dataset.p = '0';
    });

  return tl;
}
