import { gsap } from './motion';

export function initWorlds(isDesktop: boolean): void {
  const worlds = gsap.utils.toArray<HTMLElement>('.world');
  const worldNumEl = document.getElementById('worldNum');

  if (isDesktop) {
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: '#worldsStage',
        start: 'top top',
        end: '+=' + worlds.length * 1000,
        scrub: 1,
        pin: true,
        anticipatePin: 1,
        onUpdate: (s) => {
          const i = Math.min(worlds.length - 1, Math.floor(s.progress * worlds.length));
          if (worldNumEl) worldNumEl.textContent = String(i + 1).padStart(2, '0');
        },
      },
    });
    worlds.forEach((w, i) => {
      if (i === 0) tl.set(w, { opacity: 1, scale: 1, z: 0 }, 0);
      if (i > 0) {
        const t = i - 1;
        tl.to(worlds[i - 1], { opacity: 0, scale: 1.3, z: 500, rotateX: 6, duration: 1, ease: 'power2.inOut' }, t);
        tl.fromTo(
          w,
          { opacity: 0, scale: 0.75, z: -700, rotateX: -6 },
          { opacity: 1, scale: 1, z: 0, rotateX: 0, duration: 1, ease: 'power2.inOut' },
          t
        );
      }
    });

    document.querySelectorAll<HTMLElement>('.world').forEach((w) => {
      w.addEventListener('mousemove', (e) => {
        const r = w.getBoundingClientRect();
        const dx = (e.clientX - r.left) / r.width - 0.5;
        const dy = (e.clientY - r.top) / r.height - 0.5;
        gsap.to(w.querySelectorAll('.mockup'), { rotateY: dx * 4, rotateX: -dy * 3, duration: 0.8, ease: 'power3.out' });
      });
      w.addEventListener('mouseleave', () => {
        gsap.to(w.querySelectorAll('.mockup'), { rotateY: 0, rotateX: 0, duration: 0.8 });
      });
    });
    return;
  }

  const stage = document.getElementById('worldsStage');
  if (!stage) return;
  stage.style.height = 'auto';
  stage.style.minHeight = '0';
  worlds.forEach((w) => {
    w.style.position = 'relative';
    w.style.opacity = '1';
    w.style.padding = '70px 24px';
    w.style.borderBottom = '1px solid var(--line)';
  });
  worlds.forEach((w) => {
    gsap.from(w.querySelectorAll('.world-title, .world-meta, .world-copy, .world-tags > span, .mockup'), {
      y: 30,
      opacity: 0,
      duration: 0.8,
      stagger: 0.06,
      ease: 'power3.out',
      scrollTrigger: { trigger: w, start: 'top 80%', once: true },
    });
  });
}
