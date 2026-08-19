import { gsap } from './motion';

/** Simple stagger reveal for the gallery grid — no 3D spiral, no continuous spin loop. */
export function initGallery(): void {
  const grid = document.getElementById('galleryGrid');
  if (!grid) return;

  gsap.from(grid.querySelectorAll('.gallery-card'), {
    opacity: 0,
    y: 30,
    scale: 0.96,
    duration: 0.7,
    stagger: 0.06,
    ease: 'power3.out',
    scrollTrigger: { trigger: grid, start: 'top 85%', once: true },
  });
}
