import { useRef, useState } from 'react';
import { THEMES, useTheme } from '../themes/themeContext';
import { getThemeClasses } from '../themes/themeStyles';
import { parseWinampSkin, storeWinampSkin } from '../themes/winampThemeParser';

const ThemeSelector = () => {
  const { currentTheme, setTheme, winampSkins, refreshWinampSkins } = useTheme();
  const classes = getThemeClasses(currentTheme);
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  // Handle Winamp skin upload
  const handleSkinUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    // Check if it's likely a Winamp skin (.wsz file)
    if (!file.name.toLowerCase().endsWith('.wsz')) {
      setError('Please select a valid Winamp skin file (.wsz)');
      return;
    }
    
    try {
      setUploading(true);
      setError(null);
      
      // Parse the skin and extract colors
      const themeConfig = await parseWinampSkin(file);
      
      // Store the skin in localStorage
      const themeId = storeWinampSkin(themeConfig);
      
      // Refresh the list of available skins
      refreshWinampSkins();
      
      // Apply the new skin
      setTheme(themeId);
      
      setUploading(false);
    } catch (error) {
      console.error('Error loading Winamp skin:', error);
      setError('Failed to load Winamp skin. The file may be corrupted or in an unsupported format.');
      setUploading(false);
    }
    
    // Reset the file input
    event.target.value = '';
  };

  return (
    <div className="relative inline-block">
      <div className="flex items-center">
        <select
          value={currentTheme}
          onChange={(e) => setTheme(e.target.value)}
          className={`${classes.input} text-xs py-0.5 px-2 bg-opacity-90`}
          aria-label="Select theme"
        >
          <option value={THEMES.NEXT}>NextFM Theme</option>
          <option value={THEMES.DEFAULT}>Inrupt Theme</option>
          
          {/* Display Winamp skins if any are available */}
          {winampSkins.length > 0 && (
            <optgroup label="Winamp Skins">
              {winampSkins.map((skin) => (
                <option key={skin.id} value={skin.id}>
                  {skin.name}
                </option>
              ))}
            </optgroup>
          )}
        </select>
        
        {/* Winamp skin upload button */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".wsz"
          onChange={handleSkinUpload}
          className="hidden"
          id="winamp-skin-upload"
        />
        <label
          htmlFor="winamp-skin-upload"
          className={`${classes.button} ml-2 text-xs px-2 py-0.5 cursor-pointer`}
        >
          {uploading ? 'Uploading...' : 'Import Winamp Skin'}
        </label>
      </div>
      
      {/* Error message */}
      {error && (
        <div className="text-xs text-red-500 mt-1">
          {error}
        </div>
      )}
    </div>
  );
};

export default ThemeSelector;
