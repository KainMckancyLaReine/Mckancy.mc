import { gsap, ScrollTrigger } from './motion';

export function initTransitionReveal(): void {
  gsap.set('.trans-h .word', { yPercent: 110 });
  gsap.set('.trans-eyebrow, .trans-coords, .trans-footer', { opacity: 0, y: 20 });

  ScrollTrigger.create({
    trigger: '#transition',
    start: 'top 80%',
    once: true,
    onEnter: () => {
      gsap.to('.trans-eyebrow, .trans-coords', { opacity: 1, y: 0, duration: 0.7, stagger: 0.1, ease: 'power3.out' });
      gsap.to('.trans-h .word', { yPercent: 0, duration: 1.2, stagger: 0.12, ease: 'expo.out' });
      gsap.to('.trans-footer', { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', delay: 0.6 });
    },
  });

  const exitTl = gsap.timeline({
    scrollTrigger: {
      trigger: '#transition',
      start: 'top top',
      end: '+=1400',
      scrub: 1,
      pin: true,
      anticipatePin: 1,
    },
  });

  exitTl.to('.trans-h', { scale: 1.06, duration: 0.2 }, 0);
  exitTl.to('.trans-h .line:nth-child(1) .word', { yPercent: -220, opacity: 0, duration: 0.35, ease: 'expo.in' }, 0.2);
  exitTl.to('.trans-h .line:nth-child(3) .word', { yPercent: 220, opacity: 0, duration: 0.35, ease: 'expo.in' }, 0.22);
  exitTl.to(
    '.trans-h .line:nth-child(2) .word',
    { scale: 4.2, opacity: 0, letterSpacing: '0.04em', duration: 0.45, ease: 'expo.in' },
    0.32
  );
  exitTl.to('.trans-eyebrow, .trans-coords, .trans-footer, .trans-bg-stripes', { opacity: 0, duration: 0.3 }, 0.3);
  exitTl.to('#transition', { yPercent: -100, duration: 0.35, ease: 'power2.in' }, 0.65);

  const about = document.getElementById('about');
  if (about) {
    about.style.position = 'relative';
    about.style.zIndex = '2';
    about.style.background = 'var(--paper)';
  }

  gsap.to('#ticker1', { xPercent: -50, duration: 28, ease: 'none', repeat: -1 });
}

export function buildTransitionMotion(reduceMotion: boolean): void {
  const streaksWrap = document.getElementById('tmStreaks');
  const particlesWrap = document.getElementById('tmParticles');
  const motion = document.querySelector<HTMLElement>('.trans-motion');
  if (!streaksWrap || !particlesWrap || !motion) return;

  if (reduceMotion) {
    motion.style.opacity = '0.5';
    return;
  }

  const isPhone = window.matchMedia('(max-width: 768px)').matches;
  const isTouchDev = window.matchMedia('(hover: none), (pointer: coarse)').matches;

  const STREAK_COUNT = isPhone ? 10 : 22;
  const streaks: { el: HTMLElement; speed: number; x: number }[] = [];
  for (let i = 0; i < STREAK_COUNT; i++) {
    const s = document.createElement('div');
    s.className = 'tm-streak';
    const top = Math.random() * 100;
    const len = 18 + Math.random() * 50;
    const opacity = 0.18 + Math.random() * 0.55;
    s.style.top = top + '%';
    s.style.width = len + 'vw';
    s.style.opacity = String(opacity);
    streaksWrap.appendChild(s);
    streaks.push({ el: s, speed: 0.6 + Math.random() * 2.4, x: Math.random() * 100 });
  }

  const PARTICLE_COUNT = isPhone ? 30 : isTouchDev ? 50 : 80;
  const particles: { el: HTMLElement; speed: number; driftX: number; y: number; x: number }[] = [];
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const p = document.createElement('div');
    p.className = 'tm-particle' + (Math.random() < 0.15 ? ' warm' : '');
    const size = 1 + Math.random() * 2.5;
    p.style.width = size + 'px';
    p.style.height = size + 'px';
    p.style.left = Math.random() * 100 + '%';
    p.style.top = Math.random() * 100 + '%';
    p.style.opacity = String(0.4 + Math.random() * 0.6);
    particlesWrap.appendChild(p);
    particles.push({
      el: p,
      speed: 0.3 + Math.random() * 1.8,
      driftX: (Math.random() - 0.5) * 0.6,
      y: Math.random() * 100,
      x: Math.random() * 100,
    });
  }

  let lastT = performance.now();
  let rafId: number | null = null;
  function tick(now: number) {
    const dt = Math.min(60, now - lastT) / 16.67;
    lastT = now;

    streaks.forEach((s) => {
      s.x -= s.speed * dt * 0.6;
      if (s.x < -80) s.x = 120 + Math.random() * 40;
      s.el.style.transform = `translateX(${s.x}vw)`;
    });

    particles.forEach((p) => {
      p.y += p.speed * dt * 0.18;
      p.x += p.driftX * dt * 0.08;
      if (p.y > 105) {
        p.y = -5;
        p.x = Math.random() * 100;
      }
      if (p.x > 105) p.x = -5;
      if (p.x < -5) p.x = 105;
      p.el.style.transform = `translate(${p.x - parseFloat(p.el.style.left)}%, ${p.y - parseFloat(p.el.style.top)}%)`;
    });

    rafId = requestAnimationFrame(tick);
  }
  rafId = requestAnimationFrame(tick);

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting && rafId === null) {
            lastT = performance.now();
            rafId = requestAnimationFrame(tick);
          } else if (!e.isIntersecting && rafId !== null) {
            cancelAnimationFrame(rafId);
            rafId = null;
          }
        });
      },
      { rootMargin: '200px' }
    );
    const transitionEl = document.getElementById('transition');
    if (transitionEl) io.observe(transitionEl);
  }

  gsap.to('.tm-orb-a', {
    yPercent: -25,
    xPercent: 12,
    scrollTrigger: { trigger: '#transition', start: 'top bottom', end: 'bottom top', scrub: 1 },
  });
  gsap.to('.tm-orb-b', {
    yPercent: 30,
    xPercent: -15,
    scrollTrigger: { trigger: '#transition', start: 'top bottom', end: 'bottom top', scrub: 1 },
  });
  gsap.to('.tm-orb-c', {
    yPercent: -45,
    xPercent: 8,
    scrollTrigger: { trigger: '#transition', start: 'top bottom', end: 'bottom top', scrub: 1 },
  });
  gsap.to('.tm-grid', {
    yPercent: 18,
    scrollTrigger: { trigger: '#transition', start: 'top bottom', end: 'bottom top', scrub: 1.2 },
  });
  gsap.to('.tm-grid-top', {
    yPercent: -18,
    scrollTrigger: { trigger: '#transition', start: 'top bottom', end: 'bottom top', scrub: 1.2 },
  });
  gsap.fromTo(
    '.trans-h',
    { scale: 0.94 },
    { scale: 1.04, scrollTrigger: { trigger: '#transition', start: 'top bottom', end: 'bottom top', scrub: 1.5 } }
  );
}
