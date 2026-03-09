export const Colors = {
  cream: '#FAF7F2',
  warmWhite: '#FFFCF7',
  bark: '#3D2B1F',
  rose: '#C97B5A',
  gold: '#D4A853',
  sage: '#8BAF8D',
  sky: '#A3C4D4',
  lilac: '#B8A4C8',
  coral: '#E07B6A',
  muted: '#8A7B72',
  border: '#E2D8CF',
  white: '#FFFFFF',
  black: '#000000',
} as const;

export const StatusColors = {
  request: Colors.gold,
  accepted: Colors.rose,
  shipped: Colors.sky,
  delivered: Colors.sage,
  cancelled: Colors.muted,
} as const;

export const UrgencyColors = {
  critical: Colors.coral,
  high: Colors.rose,
  medium: Colors.gold,
  low: Colors.sage,
} as const;

export const Fonts = {
  display: 'PlayfairDisplay',
  body: 'DMSans',
  mono: 'DMMono',
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const BorderRadius = {
  sm: 6,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
} as const;

export type ThemeColors = typeof Colors;
