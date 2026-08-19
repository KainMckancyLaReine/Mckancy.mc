import { gsap } from './motion';

function setPhase(phase: number): void {
  document.querySelectorAll<HTMLElement>('.phase-cell').forEach((cell) => {
    const p = Number(cell.dataset.phase);
    cell.classList.toggle('active', p === phase);
    cell.classList.toggle('done', p < phase);
  });
  document.querySelectorAll<HTMLElement>('.phase-desc-line').forEach((el) => {
    el.classList.toggle('active', Number(el.dataset.phaseLine) === phase);
  });
}

export function initSkillsTransformation(isDesktop: boolean): void {
  if (!isDesktop) {
    gsap.from('.figma-frame', {
      y: 40,
      opacity: 0,
      duration: 1,
      stagger: 0.08,
      ease: 'power3.out',
      scrollTrigger: { trigger: '#figmaWindow', start: 'top 70%' },
    });
    gsap.from('.phase-cell', {
      y: 20,
      opacity: 0,
      duration: 0.6,
      stagger: 0.08,
      scrollTrigger: { trigger: '#phaseRail', start: 'top 85%' },
    });
    return;
  }

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: '#skillsStage',
      start: 'top top',
      end: '+=4400',
      scrub: 1,
      pin: true,
      anticipatePin: 1,
      onUpdate: (s) => {
        let p = 0;
        if (s.progress >= 0.78) p = 3;
        else if (s.progress >= 0.52) p = 2;
        else if (s.progress >= 0.22) p = 1;
        setPhase(p);
      },
    },
  });

  tl.to('#figToolbar', { y: -40, opacity: 0, duration: 0.6 }, 0.15);
  tl.to('#figPanelLeft', { x: -200, opacity: 0, duration: 0.7 }, 0.18);
  tl.to('#figPanelRight', { x: 200, opacity: 0, duration: 0.7 }, 0.18);
  tl.to('#cmt-1, #cmt-2', { opacity: 0, scale: 0.6, duration: 0.4 }, 0.18);
  tl.to('.figma-frame', { boxShadow: '0 30px 80px -20px rgba(10,10,10,0.35)', duration: 0.6 }, 0.2);

  tl.to('#ff-header', { z: 220, x: -40, y: -10, rotateX: -8, rotateY: 6, duration: 0.8 }, 0.25);
  tl.to('#ff-hero', { z: 360, x: 20, y: -20, rotateY: -10, rotateX: 4, duration: 0.8 }, 0.25);
  tl.to('#ff-card-a', { z: 480, x: 70, y: 40, rotateY: 14, rotateX: 2, duration: 0.8 }, 0.27);
  tl.to('#ff-card-b', { z: 580, x: 90, y: -30, rotateY: -8, rotateX: -6, duration: 0.8 }, 0.27);
  tl.to('#ff-image', { z: 300, x: -60, y: 30, rotateX: -10, rotateY: -4, duration: 0.8 }, 0.29);
  tl.to('#ff-footer', { z: 240, x: -30, y: 50, rotateX: 12, rotateY: 8, duration: 0.8 }, 0.29);
  tl.to('#figCanvas', { rotateX: 6, rotateY: -5, duration: 0.8 }, 0.25);

  tl.to('#ff-header', { z: 0, x: 0, y: 0, rotateX: 0, rotateY: 0, duration: 0.9, ease: 'power2.out' }, 0.55);
  tl.to('#ff-hero', { z: 0, x: 0, y: 0, rotateY: 0, rotateX: 0, duration: 0.9, ease: 'power2.out' }, 0.55);
  tl.to('#ff-card-a', { z: 0, x: 0, y: 0, rotateY: 0, rotateX: 0, duration: 0.9, ease: 'power2.out' }, 0.57);
  tl.to('#ff-card-b', { z: 0, x: 0, y: 0, rotateY: 0, rotateX: 0, duration: 0.9, ease: 'power2.out' }, 0.57);
  tl.to('#ff-image', { z: 0, x: 0, y: 0, rotateX: 0, rotateY: 0, duration: 0.9, ease: 'power2.out' }, 0.59);
  tl.to('#ff-footer', { z: 0, x: 0, y: 0, rotateX: 0, rotateY: 0, duration: 0.9, ease: 'power2.out' }, 0.59);
  tl.to('#figCanvas', { rotateX: 0, rotateY: 0, duration: 0.9, ease: 'power2.out' }, 0.55);

  tl.to('.assembly-guide', { opacity: 0.7, duration: 0.3, stagger: 0.04 }, 0.62);
  tl.to('.assembly-guide', { opacity: 0, duration: 0.4 }, 0.78);

  tl.to('.figma-frame', { opacity: 0, scale: 0.98, duration: 0.5 }, 0.82);
  tl.to('#figCanvas', { backgroundImage: 'none', backgroundColor: '#ffffff', duration: 0.4 }, 0.82);
  tl.to('#figLive', { opacity: 1, duration: 0.7, pointerEvents: 'auto' }, 0.86);

  tl.from('#figLive .fig-live-top', { y: -20, opacity: 0, duration: 0.5, ease: 'power3.out' }, 0.88);
  tl.from('#figLive .fig-live-hero', { scale: 1.08, opacity: 0, duration: 0.9, ease: 'power3.out' }, 0.9);
  tl.from(
    '#figLive .fig-live-hero .issue, #figLive .fig-live-hero .img-tag',
    { y: 14, opacity: 0, duration: 0.5, stagger: 0.08, ease: 'power3.out' },
    0.96
  );
  tl.from('#figLive .fig-live-tags .fig-live-tag', { y: 14, opacity: 0, duration: 0.4, stagger: 0.05, ease: 'power3.out' }, 0.94);
  tl.from(
    '#figLive .fig-live-title',
    { y: 28, opacity: 0, filter: 'blur(8px)', duration: 0.7, ease: 'power3.out', clearProps: 'filter' },
    0.95
  );
  tl.from(
    '#figLive .fig-live-excerpt, #figLive .fig-live-byline',
    { y: 18, opacity: 0, duration: 0.5, stagger: 0.08, ease: 'power3.out' },
    0.97
  );
  tl.from('#figLive .fig-related', { x: 26, opacity: 0, duration: 0.55, stagger: 0.08, ease: 'power3.out' }, 0.94);
  tl.from('#figLive .fig-live-newsletter', { y: 22, opacity: 0, duration: 0.6, ease: 'power3.out' }, 1.0);
}
