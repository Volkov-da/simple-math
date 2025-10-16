import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Theme = 'professional' | 'playful' | 'focus';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>('professional');

  useEffect(() => {
    // Load theme from localStorage
    try {
      const savedTheme = localStorage.getItem('theme') as Theme;
      if (savedTheme && ['professional', 'playful', 'focus'].includes(savedTheme)) {
        setThemeState(savedTheme);
      }
    } catch (error) {
      console.error('Error loading theme:', error);
    }
  }, []);

  useEffect(() => {
    // Apply theme to document
    document.documentElement.setAttribute('data-theme', theme);
    
    // Save theme to localStorage
    try {
      localStorage.setItem('theme', theme);
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

export const themeConfig = {
  professional: {
    name: 'Professional',
    description: 'Clean and minimal design',
    colors: {
      primary: '#0ea5e9',
      success: '#22c55e',
      warning: '#f59e0b',
      error: '#ef4444',
      bg: '#ffffff',
      surface: '#f8f9fa',
      text: '#1f2937',
      textMuted: '#6b7280'
    }
  },
  playful: {
    name: 'Playful',
    description: 'Colorful and fun design',
    colors: {
      primary: '#a855f7',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#f87171',
      bg: '#fef7ff',
      surface: '#f3e8ff',
      text: '#581c87',
      textMuted: '#7c3aed'
    }
  },
  focus: {
    name: 'Focus',
    description: 'High contrast for concentration',
    colors: {
      primary: '#3b82f6',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      bg: '#0f172a',
      surface: '#1e293b',
      text: '#f1f5f9',
      textMuted: '#94a3b8'
    }
  }
};
