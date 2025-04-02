import React from 'react';
import { THEMES, useTheme } from '../themes/themeContext';
import { getThemeClasses } from '../themes/themeStyles';

const ThemeSelector = () => {
  const { currentTheme, setTheme } = useTheme();
  const classes = getThemeClasses(currentTheme);

  return (
    <div className="relative inline-block">
      <select
        value={currentTheme}
        onChange={(e) => setTheme(e.target.value)}
        className={`${classes.input} text-xs py-0.5 px-1`}
        aria-label="Select theme"
      >
        <option value={THEMES.DEFAULT}>Default Theme</option>
        <option value={THEMES.NEXT}>NeXT Theme</option>
      </select>
    </div>
  );
};

export default ThemeSelector;
