import { gsap, ScrollTrigger } from './motion';
import { LANG_EVENT } from './lang';

/**
 * Scroll-linked "reading" reveal.
 *
 * Every word inside a `.read-reveal` block starts dimmed and lights up to
 * its own full colour as that block scrolls through the viewport, so the
 * paragraph appears to be read along with the visitor.
 *
 * Two decisions worth keeping:
 *
 * 1. It animates `opacity`, not `color`. The site has a light and a dark
 *    theme that swap `--ink`/`--ink-2` underneath, and `<strong>` inside
 *    these paragraphs is a different colour from the body text. Tweening
 *    to a concrete colour would mean recomputing every target on a theme
 *    switch and would flatten the emphasis; fading each word up to its own
 *    inherited colour keeps both correct for free.
 *
 * 2. The split walks the DOM instead of touching `innerHTML`, so inline
 *    markup (`<strong>`, `<em>`, links) survives intact. Rebuilding the
 *    paragraph from a string would drop it.
 */

const DIM = 0.2;

/** Wrap each word of a text node in its own span, leaving whitespace as-is. */
function splitTextNode(node: Text): void {
  const parts = (node.textContent ?? '').split(/(\s+)/).filter((p) => p.length > 0);
  if (!parts.length) return;

  const frag = document.createDocumentFragment();
  for (const part of parts) {
    if (part.trim().length === 0) {
      frag.appendChild(document.createTextNode(part));
      continue;
    }
    const span = document.createElement('span');
    span.className = 'rr-word';
    span.textContent = part;
    frag.appendChild(span);
  }
  node.parentNode?.replaceChild(frag, node);
}

/** Recursively split every text node under `root`, skipping anything already split. */
function splitWords(root: HTMLElement): void {
  if (root.dataset.rrSplit === 'true') return;

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      if (parent?.classList.contains('rr-word')) return NodeFilter.FILTER_REJECT;
      return (node.textContent ?? '').trim().length ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
    },
  });

  const textNodes: Text[] = [];
  let current = walker.nextNode();
  while (current) {
    textNodes.push(current as Text);
    current = walker.nextNode();
  }

  textNodes.forEach(splitTextNode);
  root.dataset.rrSplit = 'true';
}

/** Every tween this module owns, so a language swap can tear them down cleanly. */
let tweens: gsap.core.Tween[] = [];

function buildReveal(): void {
  for (const tween of tweens) {
    tween.scrollTrigger?.kill();
    tween.kill();
  }
  tweens = [];

  const blocks = gsap.utils.toArray<HTMLElement>('.read-reveal');

  blocks.forEach((block) => {
    // Each direct child block (a paragraph, a quote) gets its own scrub, so a
    // long section reads through paragraph by paragraph instead of one
    // 200-word stagger spread over the whole column.
    const lines = block.matches('p, .rr-line')
      ? [block]
      : gsap.utils.toArray<HTMLElement>(block.querySelectorAll<HTMLElement>('p, .rr-line'));

    lines.forEach((line) => {
      splitWords(line);
      const words = line.querySelectorAll<HTMLElement>('.rr-word');
      if (!words.length) return;

      const tween = gsap.fromTo(
        words,
        { opacity: DIM },
        {
          opacity: 1,
          ease: 'none',
          // `duration` longer than `stagger` is what softens the leading
          // edge: at 3-to-1 roughly three words are mid-fade at any moment,
          // so the reveal reads as a light sweeping across the line instead
          // of words flicking on one at a time.
          duration: 3,
          stagger: 1,
          scrollTrigger: {
            trigger: line,
            start: 'top 82%',
            end: 'bottom 55%',
            scrub: 0.4,
          },
        }
      );
      tweens.push(tween);
    });
  });

  // The split changes the height of nothing, but it does change how the
  // browser measures the block; refresh once so every trigger below it
  // starts from correct positions.
  ScrollTrigger.refresh();
}

export function initReadReveal(reduceMotion: boolean): void {
  const blocks = gsap.utils.toArray<HTMLElement>('.read-reveal');
  if (!blocks.length) return;

  // Reduced motion: leave the text at full contrast, no scroll scrubbing.
  if (reduceMotion) {
    blocks.forEach((block) => block.classList.add('rr-static'));
    return;
  }

  buildReveal();

  // A language swap replaces the paragraph HTML wholesale, which throws
  // away every `.rr-word` span these tweens were animating. Rebuild from
  // the new copy rather than leaving the block dimmed forever.
  window.addEventListener(LANG_EVENT, () => buildReveal());
}
