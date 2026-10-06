'use client';

import React, { useState, useEffect, useRef, ReactNode } from 'react';
import { ThemeContext, Theme } from './themeContextValue';

export { ThemeContext, type Theme } from './themeContextValue';
export type { ThemeContextType } from './themeContextValue';

export const THEME_STORAGE_KEY = 'ctec-theme-preference';

/**
 * Inline script run before first paint so the CSS variables match the
 * stored / system theme and the page doesn't flash the wrong colours.
 */
export const themeInitScript = `(function(){try{var t=localStorage.getItem('${THEME_STORAGE_KEY}');if(t!=='light'&&t!=='dark'){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}document.documentElement.setAttribute('data-theme',t)}catch(e){}})();`;

const resolveInitialTheme = (): Theme => {
  const current = document.documentElement.getAttribute('data-theme');
  if (current === 'light' || current === 'dark') {
    return current;
  }
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === 'light' || stored === 'dark') {
    return stored;
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
};

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  // Server render (and hydration) always starts with light; the real theme is
  // resolved on mount from the attribute set by themeInitScript.
  const [theme, setTheme] = useState<Theme>('light');
  const initialized = useRef(false);

  useEffect(() => {
    setTheme(resolveInitialTheme());
  }, []);

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      return;
    }
    // Apply theme to document
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  useEffect(() => {
    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      // Only auto-switch if user hasn't set a preference
      if (!localStorage.getItem(THEME_STORAGE_KEY)) {
        setTheme(e.matches ? 'dark' : 'light');
      }
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider
      value={{ theme, toggleTheme, isDark: theme === 'dark' }}
    >
      {children}
    </ThemeContext.Provider>
  );
};
