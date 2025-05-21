# Solid-FM Themes

This directory contains the theming system for Solid-FM.

## Files

- `themeContext.js` - React context for theme state management
- `themeStyles.js` - CSS class mappings for different themes

## Available Themes

1. **Default** - The original Solid-FM styling
2. **NeXT** - NeXTSTEP-inspired styling that mimics the computer Tim Berners-Lee used to create the WWW

## How to Add a New Theme

1. Add the theme name to the `THEMES` object in `themeContext.js`
2. Add theme classes to `themeStyles.js`
3. Update the theme selector component
