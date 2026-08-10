/**
 * Tokens de movimiento compartidos para Academia Mágica.
 *
 * Dos personalidades conviven en la app:
 * - "playful": vistas de alumno (niños) — springs con rebote, delight.
 * - "ui": vistas de admin y controles utilitarios — rápido, sin rebote, restraint.
 *
 * Todas las curvas respetan prefers-reduced-motion vía <MotionConfig reducedMotion="user">
 * en el layout raíz (ver src/components/motion-provider.tsx).
 */

export const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];
export const EASE_IN: [number, number, number, number] = [0.4, 0, 1, 1];

export const SPRING_PLAYFUL = {
  type: "spring" as const,
  stiffness: 380,
  damping: 22,
  mass: 0.9,
};

export const SPRING_UI = {
  type: "spring" as const,
  stiffness: 500,
  damping: 35,
};

export const fadeSlideUp = {
  initial: { opacity: 0, y: 12 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.22, ease: EASE_OUT },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: { duration: 0.15, ease: EASE_IN },
  },
};

export const fadeOnly = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.2, ease: EASE_OUT } },
  exit: { opacity: 0, transition: { duration: 0.15, ease: EASE_IN } },
};

export const popIn = {
  initial: { opacity: 0, scale: 0.85 },
  animate: { opacity: 1, scale: 1, transition: SPRING_PLAYFUL },
};

export const staggerContainer = (staggerDelay = 0.06, delayChildren = 0) => ({
  initial: {},
  animate: {
    transition: { staggerChildren: staggerDelay, delayChildren },
  },
});

export const staggerItem = {
  initial: { opacity: 0, y: 16, scale: 0.94 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: SPRING_PLAYFUL,
  },
};

// Variante mas contenida para listas/grids del panel admin (sin rebote).
export const staggerItemUi = {
  initial: { opacity: 0, y: 8 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.2, ease: EASE_OUT },
  },
};

export const collapseExpand = {
  initial: { opacity: 0, height: 0 },
  animate: {
    opacity: 1,
    height: "auto",
    transition: { duration: 0.25, ease: EASE_OUT },
  },
  exit: {
    opacity: 0,
    height: 0,
    transition: { duration: 0.18, ease: EASE_IN },
  },
};
