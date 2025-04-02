import React, { createContext, useContext, useState, useEffect } from 'react';

// Define available themes
export const THEMES = {
  DEFAULT: 'default',  // Original solid-fm theme
  NEXT: 'next'         // NeXT-inspired theme
};

// Create theme context
const ThemeContext = createContext({
  currentTheme: THEMES.DEFAULT,
  setTheme: () => {}
});

// Theme provider component
export const ThemeProvider = ({ children }) => {
  // Try to get theme from localStorage or use default
  const [currentTheme, setCurrentTheme] = useState(() => {
    const savedTheme = localStorage.getItem('solid-fm-theme');
    return Object.values(THEMES).includes(savedTheme) ? savedTheme : THEMES.DEFAULT;
  });

  // Set theme and save to localStorage
  const setTheme = (theme) => {
    if (Object.values(THEMES).includes(theme)) {
      setCurrentTheme(theme);
      localStorage.setItem('solid-fm-theme', theme);
    }
  };

  // Apply theme-specific class to body
  useEffect(() => {
    document.body.dataset.theme = currentTheme;
    
    // Apply theme-specific classes
    if (currentTheme === THEMES.NEXT) {
      document.body.classList.add('next-theme-background', 'dark');
    } else {
      document.body.classList.remove('next-theme-background', 'dark');
    }
  }, [currentTheme]);

  // Expose theme context
  const value = {
    currentTheme,
    setTheme,
    isNeXTTheme: currentTheme === THEMES.NEXT
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

// Hook for using the theme
export const useTheme = () => useContext(ThemeContext);
