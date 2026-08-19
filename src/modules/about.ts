import { gsap } from './motion';

function wrapWord(txt: string): string {
  return `<span class="aw-mask" style="display:inline-block; overflow:hidden; vertical-align:bottom;"><span class="aw-inner" style="display:inline-block; will-change:transform;">${txt}</span></span>`;
}

function splitAboutTitleIntoWords(aboutTitle: HTMLElement): void {
  const out: string[] = [];
  aboutTitle.childNodes.forEach((node) => {
    if (node.nodeType === 3) {
      (node.textContent ?? '').split(/(\s+)/).forEach((w) => {
        if (w.trim().length) out.push(wrapWord(w));
        else if (w.length) out.push(w);
      });
    } else if (node instanceof HTMLElement && node.tagName === 'BR') {
      out.push('<br/>');
    } else if (node instanceof HTMLElement && node.tagName === 'SPAN') {
      const innerWords = (node.textContent ?? '')
        .split(/(\s+)/)
        .map((w) => (w.trim().length ? wrapWord(w) : w))
        .join('');
      out.push(`<span class="it" style="color:var(--orange);">${innerWords}</span>`);
    }
  });
  aboutTitle.innerHTML = out.join('');
}

export function initAboutReveal(isDesktop: boolean): void {
  gsap.utils.toArray<HTMLElement>('.section-title, .contact-title').forEach((el) => {
    gsap.from(el, { y: 50, opacity: 0, duration: 1.1, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 85%' } });
  });

  gsap.from('.km-founder-photo, .km-founder-text > *', {
    y: 30,
    opacity: 0,
    duration: 0.9,
    stagger: 0.08,
    ease: 'power3.out',
    scrollTrigger: { trigger: '.km-founder-block', start: 'top 80%' },
  });

  const aboutTitle = document.querySelector<HTMLElement>('.about-title');
  if (aboutTitle) splitAboutTitleIntoWords(aboutTitle);

  const aboutTl = gsap.timeline({
    scrollTrigger: { trigger: '#about', start: 'top 70%', toggleActions: 'play none none reverse' },
  });
  aboutTl.from('.about-title .aw-inner', { yPercent: 110, opacity: 0, duration: 1.1, stagger: 0.06, ease: 'expo.out' });
  aboutTl.from('#about > .container-x > .eyebrow', { x: -20, opacity: 0, duration: 0.7, ease: 'power3.out' }, 0.1);
  aboutTl.from('.profile-card', { x: -40, y: 30, opacity: 0, duration: 1, ease: 'power3.out' }, 0.35);
  aboutTl.from(
    '.about-body p',
    { y: 36, opacity: 0, filter: 'blur(6px)', duration: 0.9, stagger: 0.12, ease: 'power3.out', clearProps: 'filter' },
    0.4
  );

  gsap.from('.about-quote', {
    y: 40,
    opacity: 0,
    scale: 0.98,
    duration: 1.1,
    ease: 'expo.out',
    scrollTrigger: { trigger: '.about-quote', start: 'top 85%' },
  });
  gsap.from('.profile-card .pc-row, .profile-card > div:nth-child(3) > div', {
    y: 16,
    opacity: 0,
    duration: 0.7,
    stagger: 0.1,
    ease: 'power3.out',
    scrollTrigger: { trigger: '.profile-card', start: 'top 80%' },
  });

  if (isDesktop) {
    gsap.to('.profile-card', {
      yPercent: -8,
      ease: 'none',
      scrollTrigger: { trigger: '#about', start: 'top bottom', end: 'bottom top', scrub: 1 },
    });
    gsap.to('.about-body', {
      yPercent: 4,
      ease: 'none',
      scrollTrigger: { trigger: '#about', start: 'top bottom', end: 'bottom top', scrub: 1 },
    });
  }
}
