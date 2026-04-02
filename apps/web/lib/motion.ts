/**
 * Framer Motion presets — DESIGN_REFERENCE.md
 * All state changes use spring physics. Never linear.
 */

export const transitions = {
  spring: { type: "spring" as const, damping: 25, stiffness: 200 },
  snappy: { type: "spring" as const, damping: 30, stiffness: 400 },
  gentle: { type: "spring" as const, damping: 20, stiffness: 120 },
  step: { type: "spring" as const, damping: 28, stiffness: 250 },
  stagger: { staggerChildren: 0.08, delayChildren: 0.1 },
  staggerSlow: { staggerChildren: 0.15, delayChildren: 0.2 },
} as const;

export const slideVariants = {
  enter: (dir: 1 | -1) => ({
    x: dir > 0 ? 80 : -80,
    opacity: 0,
    scale: 0.98,
  }),
  center: { x: 0, opacity: 1, scale: 1 },
  exit: (dir: 1 | -1) => ({
    x: dir > 0 ? -80 : 80,
    opacity: 0,
    scale: 0.98,
  }),
};

export const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1 },
};

export const listItemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
};

export const checkmarkVariants = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: {
    pathLength: 1,
    opacity: 1,
    transition: { duration: 0.4, ease: "easeOut" as const },
  },
};
