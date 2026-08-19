import './style.css';
import { readViewportFlags } from './types';
import { gsap, createLenis } from './modules/motion';
import { initCursor } from './modules/cursor';
import { initPreloader } from './modules/preloader';
import { initTransitionReveal } from './modules/transition';
import { initAboutReveal } from './modules/about';
import { initSkillsReveal } from './modules/skills';
import { initWorlds } from './modules/worlds';
import { initGallery } from './modules/gallery';
import { initClock, initThemeToggle, initMobileDrawer } from './modules/nav';
import { initContactForm } from './modules/contact';

function probePhoto(): void {
  const img = new Image();
  img.onload = () => document.documentElement.classList.add('has-kain-photo');
  img.onerror = () => document.documentElement.classList.add('no-kain-photo');
  img.src = 'assets/kain.jpg?v=1';
}
probePhoto();

function boot(): void {
  const { isTouch, isDesktop } = readViewportFlags();

  const lenis = createLenis();

  initClock();
  initCursor(isTouch);
  initThemeToggle();
  initMobileDrawer();
  initContactForm();

  initTransitionReveal();
  initAboutReveal(isDesktop);
  initSkillsReveal();
  initWorlds();
  initGallery();

  if (!isDesktop) {
    const heroPhoto = document.querySelector('.hero-photo-wrap');
    if (heroPhoto) {
      gsap.from(heroPhoto, {
        opacity: 0,
        y: 40,
        scale: 0.95,
        duration: 1.1,
        ease: 'expo.out',
        scrollTrigger: { trigger: heroPhoto, start: 'top 92%', once: true },
      });
    }
    gsap.utils.toArray<HTMLElement>('.contact-info-block, .profile-card').forEach((el) => {
      gsap.from(el, {
        opacity: 0,
        y: 20,
        duration: 0.8,
        ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 88%', once: true },
      });
    });
  }

  // initPreloader runs the intro sequence, then kicks off the hero entrance itself.
  initPreloader(lenis, isTouch);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
