import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { ThemeColors, EmotionalState, getThemeFromPAD, DEFAULT_THEME } from './theme';

const BORDER = 'rgba(255,255,255,0.1)';
const DANGER = '#c97070';
const GREEN  = '#6dbf8a';

function lightenHex(hex: string, amount: number): string {
  const r = Math.min(255, parseInt(hex.slice(1, 3), 16) + amount);
  const g = Math.min(255, parseInt(hex.slice(3, 5), 16) + amount);
  const b = Math.min(255, parseInt(hex.slice(5, 7), 16) + amount);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

export interface ThemeContextValue {
  // Core palette from getThemeFromPAD
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  text: string;
  muted: string;
  // Derived extras used across the app
  surface2: string;
  border: string;
  danger: string;
  green: string;
  // Live emotional state
  trust: number;
  valence: number;
  arousal: number;
  longing: number;
  updateMood: (trust: number, valence: number, arousal: number, longing: number) => void;
}

const DEFAULT_STATE: EmotionalState = { trust: 0.5, valence: 0, arousal: 0, longing: 0 };

function buildValue(
  theme: ThemeColors,
  state: EmotionalState,
  updateMood: ThemeContextValue['updateMood'],
): ThemeContextValue {
  return {
    ...theme,
    surface2: lightenHex(theme.surface, 12),
    border: BORDER,
    danger: DANGER,
    green: GREEN,
    ...state,
    updateMood,
  };
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<EmotionalState>(DEFAULT_STATE);
  const [theme, setTheme] = useState<ThemeColors>(() => getThemeFromPAD(DEFAULT_STATE));

  const updateMood = useCallback((
    trust: number,
    valence: number,
    arousal: number,
    longing: number,
  ) => {
    const clamped: EmotionalState = {
      trust:   Math.max(0, Math.min(1, trust)),
      valence: Math.max(-1, Math.min(1, valence)),
      arousal: Math.max(-1, Math.min(1, arousal)),
      longing: Math.max(0, Math.min(1, longing)),
    };
    setState(clamped);
    setTheme(getThemeFromPAD(clamped));
  }, []);

  return (
    <ThemeContext.Provider value={buildValue(theme, state, updateMood)}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    // Pre-auth screens (login/register) render outside ThemeProvider
    return buildValue(DEFAULT_THEME, DEFAULT_STATE, () => {});
  }
  return ctx;
}

export function usePrimaryColor(): string {
  return useTheme().primary;
}

export default ThemeContext;
