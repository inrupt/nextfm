import React, { createContext, useContext, useState, useEffect } from 'react';
import { getStoredWinampSkins, initializeWinampThemes } from './winampThemeParser';

// Define available themes
export const THEMES = {
  DEFAULT: 'default',  // Inrupt/solid-fm theme
  NEXT: 'next',        // NeXT-inspired theme
  WINAMP: 'winamp'     // Prefix for Winamp skins
};

// Create theme context
const ThemeContext = createContext({
  currentTheme: THEMES.NEXT,
  setTheme: () => {},
  winampSkins: [],
  setWinampSkin: () => {},
  isWinampTheme: false
});

// Theme provider component
export const ThemeProvider = ({ children }) => {
  // Load all stored Winamp skins
  const [winampSkins, setWinampSkins] = useState(() => getStoredWinampSkins());
  
  // Try to get theme from localStorage or use NEXT theme as default
  const [currentTheme, setCurrentTheme] = useState(() => {
    const savedTheme = localStorage.getItem('solid-fm-theme');
    
    // Check if it's a standard theme
    if (Object.values(THEMES).includes(savedTheme)) {
      return savedTheme;
    }
    
    // Check if it's a Winamp theme
    if (savedTheme && savedTheme.startsWith('winamp-')) {
      return savedTheme;
    }
    
    // Default to NEXT theme
    return THEMES.NEXT;
  });

  // Initialize Winamp themes when component loads
  useEffect(() => {
    initializeWinampThemes();
  }, []);

  // Set theme and save to localStorage
  const setTheme = (theme) => {
    // Standard themes or Winamp themes
    if (Object.values(THEMES).includes(theme) || theme.startsWith('winamp-')) {
      setCurrentTheme(theme);
      localStorage.setItem('solid-fm-theme', theme);
    }
  };
  
  // Helper function to set a specific Winamp skin
  const setWinampSkin = (skinId) => {
    if (skinId && skinId.startsWith('winamp-')) {
      setTheme(skinId);
    }
  };
  
  // Refresh the list of Winamp skins
  const refreshWinampSkins = () => {
    setWinampSkins(getStoredWinampSkins());
  };

  // Apply theme-specific class to body
  useEffect(() => {
    document.body.dataset.theme = currentTheme;
    
    // Clear existing theme classes
    document.body.classList.remove('next-theme-background', 'dark');
    
    // Apply theme-specific classes
    if (currentTheme === THEMES.NEXT) {
      document.body.classList.add('next-theme-background', 'dark');
    }
  }, [currentTheme]);
  
  // Check if current theme is a Winamp theme
  const isWinampTheme = currentTheme.startsWith('winamp-');

  // Expose theme context
  const value = {
    currentTheme,
    setTheme,
    isNeXTTheme: currentTheme === THEMES.NEXT,
    isWinampTheme,
    winampSkins,
    setWinampSkin,
    refreshWinampSkins
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

// Hook for using the theme
export const useTheme = () => useContext(ThemeContext);
