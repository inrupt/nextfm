import React, { useState } from 'react';
import { useTheme, THEMES } from './themes/themeContext';
import { getThemeClasses } from './themes/themeStyles';
// Theme-specific logos
import nextLogo from './NeXT_logo.svg';
import solidLogo from './solid.png';

const StationSelector = ({ onLogin }) => {
  const { currentTheme } = useTheme();
  const classes = getThemeClasses(currentTheme);
  const isNeXTTheme = currentTheme === THEMES.NEXT;
  const logoToUse = isNeXTTheme ? nextLogo : solidLogo;
  
  const [selectedIDP, setSelectedIDP] = useState('podspaces');
  const [isAnimating, setIsAnimating] = useState(false);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualIDP, setManualIDP] = useState('');

  const stations = {
    podspaces: {
      oidcIssuer: 'https://login.inrupt.com',
      name: 'PodSpaces',
      buttonIndex: 0
    },
    manual: {
      oidcIssuer: '',
      name: 'Custom Provider',
      buttonIndex: 1
    }
  };

  const handleLogin = () => {
    setIsAnimating(true);
    setTimeout(() => {
      setIsAnimating(false);
      if (selectedIDP === 'manual' && manualIDP) {
        onLogin({
          oidcIssuer: manualIDP.startsWith('https://') ? manualIDP : `https://${manualIDP}`,
          name: 'Custom Provider'
        });
      } else {
        onLogin(stations[selectedIDP]);
      }
    }, 800);
  };

  return (
    <div className={`${classes.window} mx-auto max-w-lg`}>
      {/* Theme-appropriate title bar */}
      <div className={classes.titleBar}>
        <div className={classes.titleText}>Authentication</div>
        <div className={`w-3 h-3 border ${isNeXTTheme ? 'border-next-border' : 'border-gray-300'}`}></div>
      </div>
      
      {/* Main login window content */}
      <div className={`${isNeXTTheme ? 'bg-next-dark border-t border-next-border' : 'bg-white'} p-5`}>
        <div className="mb-6">
          <div className="flex justify-center mb-4">
            <img 
              src={logoToUse} 
              alt={isNeXTTheme ? "NeXT Logo" : "Solid Logo"} 
              className={isNeXTTheme ? "w-20 h-24" : "w-16 h-16"} 
            />
          </div>
          <div className="text-center">
            <h1 className={`text-xl font-bold ${isNeXTTheme ? 'text-next-white' : 'text-inrupt-navy'} mb-1`}>
              NextFM
            </h1>
            <p className={isNeXTTheme ? "text-next-white/60 text-xs" : "text-gray-500 text-xs font-inrupt-body"}>
              Web 3.0 File Management
            </p>
          </div>
        </div>
        
        {/* Provider selector panel */}
        <div className={isNeXTTheme ? "bg-next-gray border border-next-border mb-4" : "bg-white border border-gray-200 rounded-lg shadow-sm mb-4"}>
          <div className={isNeXTTheme ? "next-title-bar" : "bg-inrupt-navy text-white py-2 px-3 rounded-t-lg"}>
            <div className={isNeXTTheme ? "next-title-text text-xs" : "text-sm font-inrupt font-medium"}>
              Select Provider
            </div>
          </div>
          
          <div className={isNeXTTheme ? "p-2 bg-next-dark border-t border-next-border" : "p-3 bg-white"}>
            <div className="space-y-2">
              <button
                onClick={() => {
                  setSelectedIDP('podspaces');
                  setShowManualEntry(false);
                }}
                className={`w-full text-left p-2 text-sm flex items-center
                  ${selectedIDP === 'podspaces' 
                    ? isNeXTTheme 
                      ? 'bg-next-blue text-next-white' 
                      : 'bg-solid-purple text-white'
                    : isNeXTTheme
                      ? 'bg-next-gray text-next-white hover:bg-next-blue/30'
                      : 'bg-gray-100 text-gray-800 hover:bg-solid-purple/10'
                  } ${isNeXTTheme ? 'border border-next-border' : 'border border-gray-200 rounded'}`}
              >
                <span>Inrupt PodSpaces</span>
              </button>
              
              <button
                onClick={() => {
                  setSelectedIDP('manual');
                  setShowManualEntry(true);
                }}
                className={`w-full text-left p-2 text-sm flex items-center
                  ${selectedIDP === 'manual' 
                    ? isNeXTTheme 
                      ? 'bg-next-blue text-next-white' 
                      : 'bg-solid-purple text-white'
                    : isNeXTTheme
                      ? 'bg-next-gray text-next-white hover:bg-next-blue/30'
                      : 'bg-gray-100 text-gray-800 hover:bg-solid-purple/10'
                  } ${isNeXTTheme ? 'border border-next-border' : 'border border-gray-200 rounded'}`}
              >
                <span>Custom Provider</span>
              </button>
            </div>

            {showManualEntry && (
              <div className="mt-3 space-y-2">
                <input
                  type="url"
                  value={manualIDP}
                  onChange={(e) => setManualIDP(e.target.value)}
                  placeholder="openid.provider.com"
                  className={isNeXTTheme 
                    ? "next-input w-full py-1 px-2 text-xs font-mono"
                    : "default-input w-full py-1 px-2 text-xs font-mono"
                  }
                />
                <p className={isNeXTTheme 
                  ? "text-next-white/60 text-xs"
                  : "text-gray-500 text-xs"
                }>
                  Example: openid.charlie.inrupt.com
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleLogin}
            disabled={selectedIDP === 'manual' && (!manualIDP || manualIDP === 'https://')}
            className={`${isNeXTTheme 
              ? 'next-button-primary' 
              : 'bg-solid-purple text-white hover:bg-solid-purple-dark'} py-1 px-4 text-sm rounded transition
              ${isAnimating ? 'animate-pulse' : ''}
              disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isAnimating ? 'Connecting...' : 'Login'}
          </button>
        </div>
        
        <div className={`text-center ${isNeXTTheme 
          ? 'text-next-white/40' 
          : 'text-gray-400'} text-xs mt-6`}>
          <p>A Solid Protocol Application</p>
        </div>
      </div>
    </div>
  );
};

export default StationSelector;