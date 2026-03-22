export const Colors = {
  // Legacy palette (kept for backward compatibility)
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

  // Stitch "Warm Artisan Editorial" tokens
  primary: '#864D5F',
  primaryContainer: '#C9879A',
  onPrimary: '#FFFFFF',
  onPrimaryContainer: '#522232',
  tertiary: '#994530',
  tertiaryFixed: '#FFDAD2',
  background: '#FFF8F5',
  surfaceLow: '#F9F2EF',
  surfaceContainer: '#F3ECEA',
  surfaceHigh: '#EDE7E4',
  surfaceHighest: '#E8E1DE',
  surfaceLowest: '#FFFFFF',
  text: '#1D1B1A',
  subText: '#514346',
  outline: '#837376',
  outlineVariant: '#D5C2C5',
  secondary: '#625E5A',
  secondaryContainer: '#E8E1DC',
} as const;

export const StatusColors = {
  request: Colors.secondary,
  accepted: Colors.primaryContainer,
  shipped: Colors.primary,
  delivered: Colors.tertiary,
  cancelled: Colors.outline,
} as const;

// Stitch semantic status colors (bg/text pairs)
export const StatusTokens = {
  request:   { bg: Colors.secondaryContainer, text: Colors.secondary },
  accepted:  { bg: Colors.primaryContainer,   text: Colors.onPrimaryContainer },
  shipped:   { bg: Colors.surfaceHighest,     text: Colors.primary },
  delivered: { bg: Colors.tertiaryFixed,      text: Colors.tertiary },
  cancelled: { bg: Colors.surfaceHigh,        text: Colors.subText },
} as const;

export const UrgencyColors = {
  critical: Colors.coral,
  high: Colors.rose,
  medium: Colors.gold,
  low: Colors.sage,
} as const;

export const Fonts = {
  display: 'PlayfairDisplay',
  heading: 'PlayfairDisplay',
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
  card: 16,
  cardLarge: 24,
  pill: 999,
  full: 999,
} as const;

export type ThemeColors = typeof Colors;

/** Maps ISO currency code → symbol string */
export function getCurrencySymbol(currency: string): string {
  const map: Record<string, string> = {
    EUR: '€',
    GBP: '£',
    USD: '$',
    INR: '₹',
    CHF: 'Fr',
    SEK: 'kr',
    PLN: 'zł',
    JPY: '¥',
    AUD: 'A$',
    CAD: 'C$',
  };
  return map[currency] ?? currency;
}
