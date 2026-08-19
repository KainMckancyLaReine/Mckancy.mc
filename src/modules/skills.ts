import { gsap } from './motion';

/** Simple stagger reveal for the skills grid — no pin, no scroll-jack. */
export function initSkillsReveal(): void {
  gsap.from('.skill-card', {
    y: 30,
    opacity: 0,
    duration: 0.8,
    stagger: 0.08,
    ease: 'power3.out',
    scrollTrigger: { trigger: '.skills-grid', start: 'top 85%', once: true },
  });
  gsap.from('#skillChips .skill-chip', {
    y: 16,
    opacity: 0,
    duration: 0.5,
    stagger: 0.05,
    ease: 'power3.out',
    scrollTrigger: { trigger: '#skillChips', start: 'top 92%', once: true },
  });
}
