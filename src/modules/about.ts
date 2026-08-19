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

export function initAboutReveal(isDesktop: boolean, isTouch: boolean): void {
  gsap.utils.toArray<HTMLElement>('.section-title').forEach((el) => {
    gsap.from(el, { y: 50, opacity: 0, duration: 1.1, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 85%' } });
  });

  // KM.dev block — a curtain-wipe on the photo (not a fade) + text sliding
  // in from the opposite side with a springy overshoot, distinct from
  // both the about-title mask reveal and every other section's motion.
  const founderTl = gsap.timeline({
    scrollTrigger: { trigger: '.km-founder-block', start: 'top 78%' },
  });
  founderTl.fromTo(
    '.km-founder-photo',
    { clipPath: 'inset(0% 0% 0% 100%)' },
    { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.1, ease: 'power4.inOut' }
  );
  founderTl.from(
    '.km-founder-text > *',
    { x: 36, opacity: 0, duration: 0.9, stagger: 0.09, ease: 'back.out(1.6)' },
    0.25
  );

  const profileCard = document.querySelector<HTMLElement>('.profile-card');
  if (profileCard && !isTouch) {
    profileCard.addEventListener('mousemove', (e) => {
      const r = profileCard.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      gsap.to(profileCard, { rotateY: px * 8, rotateX: py * -8, duration: 0.5, ease: 'power2.out', transformPerspective: 800 });
    });
    profileCard.addEventListener('mouseleave', () => {
      gsap.to(profileCard, { rotateY: 0, rotateX: 0, duration: 0.7, ease: 'elastic.out(1,0.5)' });
    });
  }

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
