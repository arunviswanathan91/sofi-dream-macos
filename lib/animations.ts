import { Easing } from 'react-native-reanimated';

// ─── M3 Spring Presets ───────────────────────────────────────────
export const M3_FAST_SPRING = {
  damping: 20,
  stiffness: 400,
  mass: 1,
};

export const M3_DEFAULT_SPRING = {
  damping: 22,
  stiffness: 300,
  mass: 1,
};

export const M3_SLOW_SPRING = {
  damping: 26,
  stiffness: 200,
  mass: 1,
};

export const M3_BUTTON_SPRING = {
  damping: 18,
  stiffness: 500,
  mass: 0.8,
};

// ─── M3 Easing Curves ────────────────────────────────────────────
export const M3_DECELERATE = Easing.bezier(0, 0, 0.2, 1);
export const M3_STANDARD = Easing.bezier(0.2, 0, 0, 1);
export const M3_ACCELERATE = Easing.bezier(0.3, 0, 1, 1);
