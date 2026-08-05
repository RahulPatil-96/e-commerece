/**
 * Unified Motion Tokens System
 * Single source of truth for animation timing, easings, staggers, and perspective across the entire app.
 */

export const motionTokens = {
  duration: {
    instant: 0.1,
    fast: 0.25,
    normal: 0.45,
    slow: 0.8,
    cinematic: 1.2,
  },

  easing: {
    // GSAP power4.out equivalent cubic bezier
    primary: [0.16, 1, 0.3, 1],
    // GSAP expo.out
    expo: [0.19, 1, 0.22, 1],
    // Smooth power2.out
    smooth: [0.25, 1, 0.5, 1],
    // Bounce / tactile feedback
    bounce: [0.34, 1.56, 0.64, 1],
  },

  stagger: {
    cards: 0.08,
    list: 0.05,
    hero: 0.12,
  },

  perspective: 1000,
  blur: 10,
};

export default motionTokens;
