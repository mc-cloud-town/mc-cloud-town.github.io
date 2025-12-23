import { useContext } from 'react';
import { ThemeContext, Theme } from '@/context/ThemeContext';

interface UseThemeReturn {
  theme: Theme;
  toggleTheme: () => void;
  isDark: boolean;
}

export const useTheme = (): UseThemeReturn => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default useTheme;
