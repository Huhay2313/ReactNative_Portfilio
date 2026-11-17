/**
 * Labfolio Motion & Physics System.
 *
 * Grounded in the Frequency-of-Use Gate and mobile motion craft:
 *   - Frequent actions (tab switches, typing/filtering, scrolling): instant or
 *     near-instant (<100ms), never blocking the user.
 *   - Occasional actions (button press, chip toggle, step check, sheet open):
 *     snappy springs & squash-and-stretch feedback that settle cleanly.
 *   - Rare / earned moments (completing the final step of an activity,
 *     unlocking a portfolio milestone): expressive celebratory spring.
 *
 * Every consumer calls `useMotionConfig()` so OS Reduce Motion automatically
 * downgrades spatial movement and springs to calm cross-fades or instant sets.
 */

import { Easing, useReducedMotion, type WithSpringConfig } from 'react-native-reanimated';

export const SPRINGS = {
  /** Critically damped utility spring: fast, crisp, zero sloppy overshoot. */
  snappy: {
    damping: 26,
    stiffness: 420,
    mass: 0.78,
  } satisfies WithSpringConfig,

  /** Tactile squash-and-stretch rebound for buttons, chips, and checkboxes. */
  tactile: {
    damping: 16,
    stiffness: 340,
    mass: 0.72,
  } satisfies WithSpringConfig,

  /** Expressive spring reserved ONLY for earned completions & milestones. */
  celebrate: {
    damping: 11,
    stiffness: 220,
    mass: 0.88,
  } satisfies WithSpringConfig,
} as const;

export const TIMING = {
  /** Instantaneous press-down response (Doherty threshold). */
  instant: 90,
  /** Micro-transitions (chips, focus ring, small fades). */
  quick: 160,
  /** Screen, sheet, and progress gauge transitions. */
  transition: 260,
  /** Deliberate completion or milestone reveal. */
  reveal: 360,
} as const;

export const EASING = {
  /** Decelerating entry curve: fast start, smooth settle (slow out). */
  enter: Easing.out(Easing.cubic),
  /** Accelerating exit curve: leaves quickly so attention can move on. */
  exit: Easing.in(Easing.cubic),
  /** Balanced state interpolation (slow in & slow out). */
  inOut: Easing.inOut(Easing.cubic),
} as const;

export interface MotionConfig {
  reduced: boolean;
  springs: typeof SPRINGS;
  timing: typeof TIMING;
  easing: typeof EASING;
}

/**
 * Exposes the motion tokens alongside the user's OS Reduce Motion setting.
 * Components inspect `motion.reduced` to replace spatial springs with calm fades.
 */
export function useMotionConfig(): MotionConfig {
  const reduced = useReducedMotion() ?? false;
  return {
    reduced,
    springs: SPRINGS,
    timing: TIMING,
    easing: EASING,
  };
}
