import './style.css';
import { readViewportFlags } from './types';
import { gsap } from './modules/motion';
import { initCursor } from './modules/cursor';
import { initPreloader } from './modules/preloader';
import { initTransitionReveal } from './modules/transition';
import { initTicker } from './modules/ticker';
import { initAboutReveal } from './modules/about';
import { initReadReveal } from './modules/readreveal';
import { initSkillsReveal } from './modules/skills';
import { initWorlds } from './modules/worlds';
import { initGallery } from './modules/gallery';
import {
  initClock,
  initThemeToggle,
  initMobileDrawer,
  initSmoothAnchors,
  initNavContrast,
} from './modules/nav';
import { initLang } from './modules/lang';
import { initContactForm, initContactReveal } from './modules/contact';
import { initIdleAnimations } from './modules/idle';

// Resolved through Vite rather than written as a bare string. The bare
// path only ever happened to work from the published root — it 404s in
// `vite dev` (which serves from app/), and in production it pulled a
// second, unhashed copy of an image the page had already downloaded.
const kainPhotoUrl = new URL('../assets/gal/kain.webp', import.meta.url).href;

function probePhoto(): void {
  const img = new Image();
  img.onload = () => document.documentElement.classList.add('has-kain-photo');
  img.onerror = () => document.documentElement.classList.add('no-kain-photo');
  img.src = kainPhotoUrl;
}
probePhoto();

function boot(): void {
  const { isTouch, isDesktop, reduceMotion } = readViewportFlags();

  // First, always: several modules below split the copy into per-word
  // spans on init, so the page has to already be in the visitor's
  // language before any of them look at it.
  initLang(reduceMotion);

  initClock();
  initCursor(isTouch);
  initThemeToggle();
  initMobileDrawer();
  initSmoothAnchors();
  initNavContrast();
  initContactForm();

  initTicker();
  initTransitionReveal(isTouch);
  initAboutReveal(isDesktop, isTouch);
  initReadReveal(reduceMotion);
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
