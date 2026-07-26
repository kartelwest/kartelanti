import React, { createContext, useContext, useEffect, useState } from 'react';
import { Appearance, useColorScheme } from 'react-native';
import { colors, radius, shadows, spacing, typography } from './tokens';

export type ColorTheme = 'light' | 'dark';
export type Theme = ReturnType<typeof createTheme>;

function createTheme(colorScheme: ColorTheme) {
  return {
    name: colorScheme,
    colors: colors[colorScheme],
    spacing,
    radius,
    typography,
    shadows,
  };
}

const ThemeContext = createContext<Theme>(createTheme('light'));

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [theme, setTheme] = useState<Theme>(createTheme((systemScheme as 'light' | 'dark') ?? 'light'));

  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setTheme(createTheme((colorScheme as 'light' | 'dark') ?? 'light'));
    });
    return () => subscription.remove();
  }, []);

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
