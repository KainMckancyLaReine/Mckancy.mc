import { gsap } from './motion';

export function initCursor(isTouch: boolean): void {
  if (isTouch) return;

  const cursorDot = document.getElementById('cursorDot');
  const cursorRing = document.getElementById('cursorRing');
  const cursorLabel = document.getElementById('cursorLabel');
  if (!cursorDot || !cursorRing) return;

  const cursor = { x: innerWidth / 2, y: innerHeight / 2 };
  const ring = { x: innerWidth / 2, y: innerHeight / 2 };

  window.addEventListener('mousemove', (e) => {
    cursor.x = e.clientX;
    cursor.y = e.clientY;
    cursorDot.style.transform = `translate3d(${cursor.x}px, ${cursor.y}px, 0) translate(-50%,-50%)`;
  });

  gsap.ticker.add(() => {
    ring.x += (cursor.x - ring.x) * 0.18;
    ring.y += (cursor.y - ring.y) * 0.18;
    cursorRing.style.transform = `translate3d(${ring.x}px, ${ring.y}px, 0) translate(-50%,-50%)`;
  });

  document.querySelectorAll<HTMLElement>('[data-magnet]').forEach((el) => {
    el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
    el.addEventListener('mouseleave', () => {
      document.body.classList.remove('cursor-hover');
      gsap.to(el, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1,0.4)' });
    });
    el.addEventListener('mousemove', (e) => {
      const r = el.getBoundingClientRect();
      const mx = e.clientX - (r.left + r.width / 2);
      const my = e.clientY - (r.top + r.height / 2);
      gsap.to(el, { x: mx * 0.18, y: my * 0.18, duration: 0.6, ease: 'power3.out' });
    });
  });

  // Cards that open a project/site get an orange "View" cursor instead of the magnet ring
  if (cursorLabel) {
    document.querySelectorAll<HTMLElement>('[data-cursor-label]').forEach((el) => {
      el.addEventListener('mouseenter', () => {
        cursorLabel.textContent = el.dataset.cursorLabel ?? 'View';
        document.body.classList.add('cursor-view');
      });
      el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-view'));
    });
  }
}
