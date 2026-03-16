import { useWindowDimensions } from 'react-native';

export type SizeClass = 'compact' | 'medium' | 'expanded';

/**
 * Returns a Material 3–inspired window size class based on screen width.
 * compact  < 600dp  — phones in portrait
 * medium   600–839dp — phones in landscape, small tablets
 * expanded ≥ 840dp  — large tablets, desktops
 */
export function useWindowSizeClass(): SizeClass {
  const { width } = useWindowDimensions();
  if (width >= 840) return 'expanded';
  if (width >= 600) return 'medium';
  return 'compact';
}
