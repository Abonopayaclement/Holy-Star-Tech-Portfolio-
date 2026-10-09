import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LIGHT_COLORS, DARK_COLORS } from '../constants/theme';

export type ThemeMode = 'light' | 'dark';

export interface ThemeContextType {
  themeMode: ThemeMode;
  isDark: boolean;
  colors: typeof LIGHT_COLORS;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  toggleTheme: () => Promise<void>;
}

const THEME_STORAGE_KEY = '@queueless_theme_mode';

const ThemeContext = createContext<ThemeContextType>({
  themeMode: 'light',
  isDark: false,
  colors: LIGHT_COLORS,
  setThemeMode: async () => {},
  toggleTheme: async () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeMode, setThemeModeState] = useState<ThemeMode>('light');

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (savedTheme === 'dark' || savedTheme === 'light') {
          setThemeModeState(savedTheme);
        } else {
          // Explicit requirement: Mobile app MUST default to Light Mode
          setThemeModeState('light');
        }
      } catch (e) {
        console.error('Failed to load theme preference from storage:', e);
      }
    };
    loadTheme();
  }, []);

  const setThemeMode = async (mode: ThemeMode) => {
    try {
      setThemeModeState(mode);
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch (e) {
      console.error('Failed to save theme preference:', e);
    }
  };

  const toggleTheme = async () => {
    const next = themeMode === 'light' ? 'dark' : 'light';
    await setThemeMode(next);
  };

  const isDark = themeMode === 'dark';
  const colors = isDark ? DARK_COLORS : LIGHT_COLORS;

  return (
    <ThemeContext.Provider value={{ themeMode, isDark, colors, setThemeMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => useContext<ThemeContextType>(ThemeContext);
