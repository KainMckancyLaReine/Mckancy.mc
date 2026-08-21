import './style.css';
import { readViewportFlags } from './types';
import { gsap } from './modules/motion';
import { initCursor } from './modules/cursor';
import { initPreloader } from './modules/preloader';
import { initTransitionReveal } from './modules/transition';
import { initTicker } from './modules/ticker';
import { initAboutReveal } from './modules/about';
import { initSkillsReveal } from './modules/skills';
import { initWorlds } from './modules/worlds';
import { initGallery } from './modules/gallery';
import { initClock, initThemeToggle, initMobileDrawer, initSmoothAnchors } from './modules/nav';
import { initContactForm, initContactReveal } from './modules/contact';
import { initIdleAnimations } from './modules/idle';

function probePhoto(): void {
  const img = new Image();
  img.onload = () => document.documentElement.classList.add('has-kain-photo');
  img.onerror = () => document.documentElement.classList.add('no-kain-photo');
  img.src = 'assets/gal/kain.webp?v=2';
}
probePhoto();

function boot(): void {
  const { isTouch, isDesktop } = readViewportFlags();

  initClock();
  initCursor(isTouch);
  initThemeToggle();
  initMobileDrawer();
  initSmoothAnchors();
  initContactForm();

  initTicker();
  initTransitionReveal(isTouch);
  initAboutReveal(isDesktop, isTouch);
  initSkillsReveal(isTouch);
  initWorlds(isTouch);
  initGallery(isTouch);
  initContactReveal();
  initIdleAnimations();

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
    gsap.from('.profile-card', {
      opacity: 0,
      y: 20,
      duration: 0.8,
      ease: 'power3.out',
      scrollTrigger: { trigger: '.profile-card', start: 'top 88%', once: true },
    });
  }

  // initPreloader runs the intro sequence, then kicks off the hero entrance itself.
  initPreloader(isTouch);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
