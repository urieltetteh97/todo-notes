import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';
import { getSetting, setSetting } from '../db/database';
import { darkColors, lightColors, type ThemeColors } from '../theme';

type ThemeContextValue = {
  colors: ThemeColors;
  isDarkMode: boolean;
  appearanceLoaded: boolean;
  setDarkMode: (enabled: boolean) => Promise<void>;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: PropsWithChildren) {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [appearanceLoaded, setAppearanceLoaded] = useState(false);

  useEffect(() => {
    getSetting('dark_mode')
      .then((value) => setIsDarkMode(value === '1'))
      .catch((error) => console.warn('Load appearance preference failed', error))
      .finally(() => setAppearanceLoaded(true));
  }, []);

  const setDarkMode = useCallback(async (enabled: boolean) => {
    await setSetting('dark_mode', enabled ? '1' : '0');
    setIsDarkMode(enabled);
  }, []);

  const value = useMemo(
    () => ({
      colors: isDarkMode ? darkColors : lightColors,
      isDarkMode,
      appearanceLoaded,
      setDarkMode,
    }),
    [isDarkMode, appearanceLoaded, setDarkMode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
}

export function useThemedStyles<T>(createStyles: (colors: ThemeColors) => T): T {
  const { colors } = useTheme();
  return useMemo(() => createStyles(colors), [colors, createStyles]);
}
