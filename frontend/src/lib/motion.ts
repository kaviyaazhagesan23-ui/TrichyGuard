import type { Variants } from 'framer-motion';

/** Staggered entrance for groups of cards. Reduced motion is handled by <MotionConfig reducedMotion="user">. */
export const containerVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.04 } },
};

export const itemVariants: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } },
};
