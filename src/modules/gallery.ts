import { gsap } from './motion';

export function initGallery(isDesktop: boolean): void {
  const gallerySpiral = document.getElementById('gallerySpiral');
  const galleryStage = document.getElementById('galleryStage');
  const galleryNumEl = document.getElementById('galleryNum');
  if (!gallerySpiral) return;

  const cards = gallerySpiral.querySelectorAll<HTMLElement>('.gallery-card');

  if (!isDesktop) {
    gsap.from(cards, {
      opacity: 0,
      y: 40,
      scale: 0.9,
      duration: 0.7,
      stagger: 0.08,
      ease: 'power3.out',
      scrollTrigger: { trigger: '#galleryStage', start: 'top 75%', once: true },
    });
    return;
  }

  const n = cards.length;
  const radius = 340;
  const verticalRange = 360;
  const turns = 1.3;

  cards.forEach((card, i) => {
    const t = i / (n - 1);
    const angle = t * Math.PI * 2 * turns;
    const y = (t - 0.5) * verticalRange;
    const r = radius - Math.abs((t - 0.5) * 50);
    card.dataset.angle = String(angle);
    card.dataset.y = String(y);
    card.dataset.r = String(r);
    card.style.transform = `rotateY(${angle}rad) translateZ(0px) translateY(${y}px) rotateY(${-angle}rad) scale(0.4)`;
    card.style.opacity = '0';
  });

  gsap.set(gallerySpiral, { rotationX: -6, rotationY: -540 });

  const tl = gsap.timeline({
    scrollTrigger: { trigger: '#galleryStage', start: 'top 75%', once: true },
  });

  tl.to(gallerySpiral, { rotationY: 0, duration: 2.0, ease: 'expo.out' }, 0);

  cards.forEach((card, i) => {
    const ang = parseFloat(card.dataset.angle!);
    const y = parseFloat(card.dataset.y!);
    const r = parseFloat(card.dataset.r!);
    tl.to(
      card,
      {
        transform: `rotateY(${ang}rad) translateZ(${r}px) translateY(${y}px) rotateY(${-ang}rad) scale(1)`,
        opacity: 1,
        duration: 1.4,
        ease: 'expo.out',
      },
      0.15 + i * 0.06
    );
  });

  let spinStartTime = 0;
  let spinActive = false;
  let mouseTiltX = 0;
  let mouseTiltY = 0;
  const SPIN_SPEED = 0.00018;

  tl.call(() => {
    if (galleryNumEl) galleryNumEl.textContent = '10';
    spinStartTime = performance.now();
    spinActive = true;
  });

  if (galleryStage) {
    galleryStage.addEventListener('mousemove', (e) => {
      const r = galleryStage.getBoundingClientRect();
      mouseTiltX = ((e.clientX - r.left) / r.width - 0.5) * 8;
      mouseTiltY = ((e.clientY - r.top) / r.height - 0.5) * 4;
    });
    galleryStage.addEventListener('mouseleave', () => {
      mouseTiltX = 0;
      mouseTiltY = 0;
    });
  }

  gsap.ticker.add(() => {
    if (!spinActive) return;
    const spinAngle = (performance.now() - spinStartTime) * SPIN_SPEED;
    gallerySpiral.style.transform = `rotateX(${-6 + mouseTiltY}deg) rotateY(${spinAngle + (mouseTiltX * Math.PI) / 180}rad)`;
    cards.forEach((card) => {
      const ang = parseFloat(card.dataset.angle!);
      const y = parseFloat(card.dataset.y!);
      const r = parseFloat(card.dataset.r!);
      card.style.transform = `rotateY(${ang}rad) translateZ(${r}px) translateY(${y}px) rotateY(${-ang - spinAngle}rad)`;
    });
  });

  const counter = { v: 0 };
  gsap.to(counter, {
    v: n,
    duration: 2.4,
    ease: 'power2.out',
    scrollTrigger: { trigger: '#galleryStage', start: 'top 75%', once: true },
    onUpdate: () => {
      const idx = Math.min(n, Math.round(counter.v));
      if (galleryNumEl) galleryNumEl.textContent = String(idx).padStart(2, '0');
    },
  });
}
