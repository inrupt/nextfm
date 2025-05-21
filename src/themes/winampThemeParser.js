/**
 * Winamp Skin Theme Parser for NextFM
 * 
 * This module handles parsing .wsz files (Winamp skins) and extracting
 * color information to be used in the NextFM theming system.
 */

import JSZip from 'jszip';

// Main file names in Winamp skins that we want to analyze
const WINAMP_SKIN_FILES = {
  MAIN: 'MAIN.BMP',            // Main window UI
  PLAYLIST: 'PLEDIT.BMP',      // Playlist window
  TITLEBAR: 'TITLEBAR.BMP',    // Title bar elements
  VOLUME: 'VOLUME.BMP',        // Volume slider
  BALANCE: 'BALANCE.BMP',      // Balance slider
  TEXT: 'TEXT.BMP',            // Fonts
  NUMBERS: 'NUMBERS.BMP',      // Numbers
  CBUTTONS: 'CBUTTONS.BMP',    // Control buttons
};

/**
 * Parses a Winamp skin file (.wsz) and extracts color information
 * 
 * @param {File} file - The .wsz file to parse
 * @returns {Promise<Object>} - Theme configuration with extracted colors
 */
export const parseWinampSkin = async (file) => {
  try {
    // Read the file using JSZip
    const zip = new JSZip();
    const zipContents = await zip.loadAsync(file);
    
    // Get relevant BMP files from the skin
    const files = {};
    
    // Try to load the main files we're interested in
    for (const key in WINAMP_SKIN_FILES) {
      const filename = WINAMP_SKIN_FILES[key];
      const zipFile = zipContents.file(filename);
      
      if (zipFile) {
        // Get binary data for each BMP file
        files[key] = await zipFile.async('arraybuffer');
      }
    }
    
    // If we have the MAIN.BMP file, extract colors
    if (files.MAIN) {
      const colors = extractColorsFromBMP(files.MAIN);
      
      // Get additional colors from other files if available
      const playlistColors = files.PLAYLIST ? extractColorsFromBMP(files.PLAYLIST) : {};
      const titlebarColors = files.TITLEBAR ? extractColorsFromBMP(files.TITLEBAR) : {};
      
      // Process colors into a theme configuration
      return generateThemeConfig(
        file.name.replace('.wsz', ''),
        colors,
        playlistColors, 
        titlebarColors
      );
    } else {
      throw new Error('Invalid Winamp skin: MAIN.BMP file not found');
    }
  } catch (error) {
    console.error('Error parsing Winamp skin:', error);
    throw error;
  }
};

/**
 * Extract colors from a BMP file's binary data
 * 
 * @param {ArrayBuffer} bmpData - Raw BMP file data
 * @returns {Object} - Object with extracted colors
 */
const extractColorsFromBMP = (bmpData) => {
  // Create a data view to read the BMP header
  const view = new DataView(bmpData);
  
  // BMP header checks
  // Check if it's a valid BMP (starts with 'BM')
  if (view.getUint16(0, true) !== 0x4D42) { // 'BM' in ASCII
    throw new Error('Invalid BMP file format');
  }
  
  // Read BMP header info
  const pixelDataOffset = view.getUint32(10, true);
  const width = view.getUint32(18, true);
  const height = view.getUint32(22, true);
  const bitsPerPixel = view.getUint16(28, true);
  
  // For simplicity, we'll focus on the top part of the MAIN.BMP file
  // which usually contains the main colors of the skin
  
  // Extract primary colors from specific areas of the BMP
  
  // Create a pixel reader based on bits per pixel
  const getPixel = createPixelReader(view, bitsPerPixel, pixelDataOffset);
  
  // Collect areas of interest for different files
  const colors = {};
  
  // Main window background color (from top corner)
  colors.background = getPixel(0, 0);
  
  // For MAIN.BMP, sample various regions to find representative colors
  if (width === 275 && height === 116) { // Standard Winamp 2.x skin dimensions
    // Title bar color (top middle)
    colors.titleBar = getPixel(width / 2, 0);
    
    // Text color (sample from playback time area)
    colors.text = getMostContrastingColor(getPixel(130, 26), colors.background);
    
    // Button color (from play button area)
    colors.button = getPixel(width / 2, 88);
    
    // Accent color (from seekbar)
    colors.accent = getPixel(width / 2, 72);
  } else {
    // For non-standard sizes, take samples from relative positions
    // Title bar (top 10%)
    colors.titleBar = getPixel(width / 2, height * 0.05);
    
    // Text area (middle)
    colors.text = getMostContrastingColor(getPixel(width / 2, height / 2), colors.background);
    
    // Button (bottom area)
    colors.button = getPixel(width / 2, height * 0.75);
    
    // Accent (bottom third)
    colors.accent = getPixel(width / 2, height * 0.66);
  }
  
  return colors;
};

/**
 * Creates a function to read pixels based on bits per pixel
 * 
 * @param {DataView} view - DataView of the BMP file
 * @param {number} bitsPerPixel - Number of bits per pixel
 * @param {number} pixelDataOffset - Offset where pixel data begins
 * @returns {Function} - Function that gets RGB for a pixel
 */
const createPixelReader = (view, bitsPerPixel, pixelDataOffset) => {
  // Simplified pixel reader that handles common BMP formats
  return (x, y) => {
    try {
      // In BMPs, the bottom row comes first
      // For 24-bit color (common in Winamp skins)
      if (bitsPerPixel === 24) {
        const width = view.getUint32(18, true);
        const bytesPerRow = Math.floor((width * 3 + 3) / 4) * 4;
        
        // Calculate position in the pixel array
        const pos = pixelDataOffset + ((view.getUint32(22, true) - 1 - y) * bytesPerRow) + (x * 3);
        
        // BMP stores colors as BGR
        const b = view.getUint8(pos);
        const g = view.getUint8(pos + 1);
        const r = view.getUint8(pos + 2);
        
        return { r, g, b };
      }
      
      // Handle 8-bit indexed color with palette
      else if (bitsPerPixel === 8) {
        const width = view.getUint32(18, true);
        const bytesPerRow = Math.floor((width + 3) / 4) * 4;
        
        // Calculate position in the pixel array
        const pos = pixelDataOffset + ((view.getUint32(22, true) - 1 - y) * bytesPerRow) + x;
        
        // Get the color index from the pixel data
        const colorIndex = view.getUint8(pos);
        
        // Get the color from the palette (located after the header)
        const paletteOffset = 54; // Standard BMP header size
        const palettePos = paletteOffset + (colorIndex * 4);
        
        const b = view.getUint8(palettePos);
        const g = view.getUint8(palettePos + 1);
        const r = view.getUint8(palettePos + 2);
        
        return { r, g, b };
      }
      
      // Fallback for other formats
      return { r: 128, g: 128, b: 128 };
    } catch (error) {
      console.warn('Error reading pixel data:', error);
      return { r: 0, g: 0, b: 0 };
    }
  };
};

/**
 * Finds the color with the most contrast against a background
 * 
 * @param {Object} color - RGB color object
 * @param {Object} backgroundColor - Background RGB color object
 * @returns {Object} - Either the original color or inverted for better contrast
 */
const getMostContrastingColor = (color, backgroundColor) => {
  // Calculate luminance of both colors
  const bgLuminance = calculateLuminance(backgroundColor);
  const fgLuminance = calculateLuminance(color);
  
  // If the contrast isn't good enough, invert the color
  if (Math.abs(bgLuminance - fgLuminance) < 0.4) {
    return {
      r: 255 - color.r,
      g: 255 - color.g,
      b: 255 - color.b
    };
  }
  
  return color;
};

/**
 * Calculate relative luminance of an RGB color
 * 
 * @param {Object} color - RGB color object
 * @returns {number} - Luminance value between 0 and 1
 */
const calculateLuminance = (color) => {
  // Convert RGB to relative luminance using the formula from WCAG 2.0
  const r = color.r / 255;
  const g = color.g / 255;
  const b = color.b / 255;
  
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

/**
 * Convert an RGB object to a hex color string
 * 
 * @param {Object} color - RGB color object
 * @returns {string} - Hex color string (e.g., "#FF5500")
 */
const rgbToHex = (color) => {
  return `#${color.r.toString(16).padStart(2, '0')}${color.g.toString(16).padStart(2, '0')}${color.b.toString(16).padStart(2, '0')}`;
};

/**
 * Generates a theme configuration from extracted colors
 * 
 * @param {string} skinName - Name of the skin
 * @param {Object} mainColors - Colors extracted from MAIN.BMP
 * @param {Object} playlistColors - Colors extracted from PLEDIT.BMP
 * @param {Object} titlebarColors - Colors extracted from TITLEBAR.BMP
 * @returns {Object} - Theme configuration for NextFM
 */
const generateThemeConfig = (skinName, mainColors, playlistColors, titlebarColors) => {
  // Convert RGB objects to hex strings
  const background = rgbToHex(mainColors.background);
  const titleBar = rgbToHex(mainColors.titleBar);
  const text = rgbToHex(mainColors.text);
  const button = rgbToHex(mainColors.button);
  const accent = rgbToHex(mainColors.accent);
  
  // Create a contrasting border color
  const border = calculateLuminance(mainColors.background) > 0.5 
    ? rgbToHex({r: Math.max(0, mainColors.background.r - 40), g: Math.max(0, mainColors.background.g - 40), b: Math.max(0, mainColors.background.b - 40)})
    : rgbToHex({r: Math.min(255, mainColors.background.r + 40), g: Math.min(255, mainColors.background.g + 40), b: Math.min(255, mainColors.background.b + 40)});
  
  // Create bright highlight color
  const highlight = rgbToHex({
    r: Math.min(255, mainColors.accent.r + 40),
    g: Math.min(255, mainColors.accent.g + 40),
    b: Math.min(255, mainColors.accent.b + 40)
  });
  
  return {
    id: `winamp-${skinName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
    name: `Winamp: ${skinName}`,
    colors: {
      background,
      titleBar,
      text,
      button,
      accent,
      border,
      highlight
    }
  };
};

/**
 * Creates a CSS string from the theme configuration that can be injected
 * into the document to apply the Winamp skin to NextFM's interface
 * 
 * @param {string} themeId - The ID of the Winamp theme
 * @param {Object} themeConfig - The theme configuration object
 * @returns {string} - CSS styles as a string
 */
export const generateWinampThemeCSS = (themeId, themeConfig) => {
  const { colors } = themeConfig;
  
  return `
    /* Winamp skin theme: ${themeConfig.name} */
    body[data-theme="${themeId}"] {
      background-color: ${colors.background};
      color: ${colors.text};
      
      /* Set CSS variables for the Winamp theme */
      --winamp-bg: ${colors.background};
      --winamp-titlebar: ${colors.titleBar};
      --winamp-text: ${colors.text};
      --winamp-button: ${colors.button};
      --winamp-accent: ${colors.accent};
      --winamp-highlight: ${colors.highlight};
      --winamp-border: ${colors.border};
    }
  `;
};

/**
 * Store a Winamp skin in localStorage for future use
 * 
 * @param {Object} themeConfig - The processed theme configuration
 */
export const storeWinampSkin = (themeConfig) => {
  try {
    // Get existing skins from localStorage
    const existingSkins = JSON.parse(localStorage.getItem('winamp-skins') || '[]');
    
    // Check if this skin ID already exists
    const existingIndex = existingSkins.findIndex(skin => skin.id === themeConfig.id);
    
    if (existingIndex !== -1) {
      // Update existing skin
      existingSkins[existingIndex] = themeConfig;
    } else {
      // Add new skin
      existingSkins.push(themeConfig);
    }
    
    // Store updated skins list in localStorage
    localStorage.setItem('winamp-skins', JSON.stringify(existingSkins));
    
    // Create and inject CSS
    injectWinampThemeCSS(themeConfig.id, themeConfig);
    
    return themeConfig.id;
  } catch (error) {
    console.error('Error storing Winamp skin:', error);
    throw error;
  }
};

/**
 * Get all stored Winamp skins from localStorage
 * 
 * @returns {Array} - Array of stored Winamp skin configurations
 */
export const getStoredWinampSkins = () => {
  try {
    return JSON.parse(localStorage.getItem('winamp-skins') || '[]');
  } catch (error) {
    console.error('Error loading stored Winamp skins:', error);
    return [];
  }
};

/**
 * Inject a Winamp theme's CSS into the document
 * 
 * @param {string} themeId - ID of the theme
 * @param {Object} themeConfig - Theme configuration
 */
export const injectWinampThemeCSS = (themeId, themeConfig) => {
  // Create a style element for this theme if it doesn't exist
  let styleEl = document.getElementById(`winamp-theme-${themeId}`);
  
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = `winamp-theme-${themeId}`;
    document.head.appendChild(styleEl);
  }
  
  // Set the CSS content
  styleEl.textContent = generateWinampThemeCSS(themeId, themeConfig);
};

/**
 * Initialize Winamp themes by injecting CSS for all stored skins
 */
export const initializeWinampThemes = () => {
  const storedSkins = getStoredWinampSkins();
  
  // Inject CSS for each stored skin
  storedSkins.forEach(skin => {
    injectWinampThemeCSS(skin.id, skin);
  });
};