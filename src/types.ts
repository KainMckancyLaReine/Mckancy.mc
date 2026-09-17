export interface ViewportFlags {
  isTouch: boolean;
  isDesktop: boolean;
  reduceMotion: boolean;
}

export function readViewportFlags(): ViewportFlags {
  return {
    isTouch: window.matchMedia('(hover: none), (pointer: coarse)').matches,
    isDesktop: window.matchMedia('(min-width: 1024px)').matches,
    reduceMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  };
}
