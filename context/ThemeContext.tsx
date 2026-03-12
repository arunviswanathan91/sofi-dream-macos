/**
 * ThemeContext — provides dynamic colors based on the selected app theme.
 * Wrap the app at root level. Screens read from useThemeColors().
 */
import React, { createContext, useContext, useState, useEffect } from 'react';
import { getLocalProfile } from '../lib/localStore';
import type { AppTheme } from '../types';

export interface ThemeColors {
  bg: string;          // main background
  card: string;        // card / input background
  cardBorder: string;  // card border
  text: string;        // primary text
  subText: string;     // secondary / muted text
  tabBar: string;      // tab bar background
  header: string;      // header background
  isDark: boolean;
}

const THEME_PALETTE: Record<AppTheme, ThemeColors> = {
  'warm-cream': {
    bg: '#FAF7F2',
    card: '#FFF9F5',
    cardBorder: '#E2D8CF',
    text: '#3D2B1F',
    subText: '#8A7B72',
    tabBar: '#FAF7F2',
    header: '#FAF7F2',
    isDark: false,
  },
  'dark-walnut': {
    bg: '#2A1F17',
    card: '#3A2D23',
    cardBorder: '#4A3C30',
    text: '#F5EDE3',
    subText: '#A89080',
    tabBar: '#221A12',
    header: '#221A12',
    isDark: true,
  },
  'soft-sage': {
    bg: '#EAF0EA',
    card: '#F2F7F2',
    cardBorder: '#D0DDD0',
    text: '#2D402D',
    subText: '#6B8A6B',
    tabBar: '#EAF0EA',
    header: '#EAF0EA',
    isDark: false,
  },
  'lavender': {
    bg: '#F0EAF8',
    card: '#F7F2FC',
    cardBorder: '#D8CCE8',
    text: '#3D2D52',
    subText: '#7B6A9A',
    tabBar: '#EDE5F8',
    header: '#F0EAF8',
    isDark: false,
  },
};

interface ThemeContextValue {
  theme: AppTheme;
  colors: ThemeColors;
  setTheme: (t: AppTheme) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'warm-cream',
  colors: THEME_PALETTE['warm-cream'],
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<AppTheme>('warm-cream');

  // Load persisted theme from local store on mount
  useEffect(() => {
    getLocalProfile().then((profile) => {
      if (profile.theme) setThemeState(profile.theme);
    });
  }, []);

  const setTheme = (t: AppTheme) => setThemeState(t);

  return (
    <ThemeContext.Provider value={{ theme, colors: THEME_PALETTE[theme], setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

export { THEME_PALETTE };
