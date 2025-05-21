/**
 * Theme styles for Solid FM
 * This file contains style mapping for different themes
 */

import { THEMES } from './themeContext';

// Inrupt/Podspaces theme classes
const defaultTheme = {
  // Layout
  layout: 'min-h-screen p-4 md:p-6',
  container: 'max-w-4xl mx-auto',
  window: 'default-window',
  panel: 'default-panel',
  
  // Text - ensuring better contrast
  titleText: 'default-title-text',
  titleBar: 'default-title-bar',
  menuBar: 'default-menu-bar',
  menuItem: 'default-menu-item',
  // Text color for content on white backgrounds
  textPrimary: 'text-inrupt-navy',
  textSecondary: 'text-solid-purple',
  
  // Buttons
  button: 'default-button',
  buttonPrimary: 'default-button-primary',
  
  // Inputs
  input: 'default-input',
  
  // File list
  fileList: 'default-file-list',
  fileItem: 'default-file-item',
  selectedItem: 'bg-inrupt-navy/10 text-inrupt-navy border-l-2 border-inrupt-navy',
  
  // Error
  errorContainer: 'mb-4 p-3 bg-red-50 border-l-2 border-inrupt-red text-red-700 rounded font-inrupt-body',
  
  // Footer
  footer: 'default-footer'
};

// NeXT theme classes
const nextTheme = {
  // Layout
  layout: 'min-h-screen bg-next-black p-4 md:p-6',
  container: 'max-w-4xl mx-auto',
  window: 'next-window',
  panel: 'next-panel',
  
  // Text
  titleText: 'next-title-text',
  titleBar: 'next-title-bar',
  menuBar: 'next-menu-bar',
  menuItem: 'next-menu-item',
  
  // Buttons
  button: 'next-button',
  buttonPrimary: 'next-button-primary',
  
  // Inputs
  input: 'next-input',
  
  // File list
  fileList: 'next-file-list',
  fileItem: 'next-file-item group',
  selectedItem: 'bg-next-blue text-next-white',
  
  // Error
  errorContainer: 'mb-4 p-3 bg-next-red/10 border-l-2 border-next-red text-next-white rounded-sm',
  
  // Footer
  footer: 'next-footer'
};

// Winamp generic theme classes
const winampTheme = {
  // Layout
  layout: 'winamp-layout',
  container: 'max-w-4xl mx-auto',
  window: 'winamp-window',
  panel: 'winamp-window', // Reuse window style for panels
  
  // Text
  titleText: 'winamp-title-text',
  titleBar: 'winamp-title-bar',
  menuBar: 'winamp-menu-bar',
  menuItem: 'winamp-menu-item',
  
  // Buttons
  button: 'winamp-button',
  buttonPrimary: 'winamp-button-primary',
  
  // Inputs
  input: 'winamp-input',
  
  // File list
  fileList: 'winamp-file-list',
  fileItem: 'winamp-file-item',
  selectedItem: 'winamp-selected-item',
  
  // Error
  errorContainer: 'mb-4 p-3 border-l-2 border-red-500 rounded-sm winamp-window',
  
  // Footer
  footer: 'winamp-footer'
};

// Export theme mappings
export const getThemeClasses = (theme) => {
  switch (theme) {
    case THEMES.NEXT:
      return nextTheme;
    case THEMES.DEFAULT:
      return defaultTheme;
    default:
      // If it's a Winamp theme (starts with 'winamp-')
      if (theme.startsWith('winamp-')) {
        return winampTheme;
      }
      // Fallback to default theme
      return defaultTheme;
  }
};
