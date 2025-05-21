import React, { useState, useEffect } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { useTheme, THEMES } from './themes/themeContext';
import { getThemeClasses } from './themes/themeStyles';
// Import theme-specific logos
import nextLogo from './NeXT_logo.svg';
import solidLogo from './solid.png';

const NEXT_BOOT_STEPS = [
  "NextFM BIOS v2.3 initialized",
  "Checking system resources...",
  "Mounting Solid filesystem...",
  "Authenticating secure session...",
  "Initializing user interface...",
  "Ready"
];

const NEXT_LEGACY_BOOT_STEPS = [
  "NextFM System v1.0 initialized",
  "Checking system resources...",
  "Mounting Solid filesystem...",
  "Authenticating secure session...",
  "Initializing user interface...",
  "Ready"
];

const RadioLoader = () => {
  const { currentTheme } = useTheme();
  const classes = getThemeClasses(currentTheme);
  const isNeXTTheme = currentTheme === THEMES.NEXT;
  
  // Choose theme-specific elements
  const logoToUse = isNeXTTheme ? nextLogo : solidLogo;
  const bootSteps = isNeXTTheme ? NEXT_BOOT_STEPS : NEXT_LEGACY_BOOT_STEPS;
  
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [blinking, setBlinking] = useState(true);

  useEffect(() => {
    // Progress through boot steps
    const stepInterval = setInterval(() => {
      if (currentStep < bootSteps.length - 1) {
        setCurrentStep(prev => prev + 1);
        setCompletedSteps(prev => [...prev, currentStep]);
      } else {
        clearInterval(stepInterval);
        setCompletedSteps(prev => [...prev, currentStep]);
      }
    }, 1200);

    // Cursor blinking effect
    const blinkInterval = setInterval(() => {
      setBlinking(prev => !prev);
    }, 500);

    return () => {
      clearInterval(stepInterval);
      clearInterval(blinkInterval);
    };
  }, [currentStep, bootSteps]);

  return (
    <div className={`min-h-screen ${isNeXTTheme ? "bg-next-black" : "bg-gray-100"} p-6 flex items-center justify-center`}>
      <div className={`${classes.window} mx-auto max-w-md w-full`}>
        {/* Theme-appropriate title bar */}
        <div className={classes.titleBar}>
          <div className={classes.titleText}>
            NextFM Boot Console
          </div>
          <div className={`w-3 h-3 border ${isNeXTTheme ? "border-next-border" : "border-gray-300"}`}></div>
        </div>
        
        <div className={`${isNeXTTheme ? "bg-next-dark border-t border-next-border" : "bg-white"}`}>
          {/* Logo and header */}
          <div className={`flex items-center justify-center p-3 ${
            isNeXTTheme ? "border-b border-next-border bg-next-gray" : "border-b border-gray-200 bg-gray-50"
          }`}>
            <img 
              src={logoToUse} 
              alt="NextFM Logo" 
              className="h-14 mr-3"
            />
            <div>
              <h2 className={`font-bold text-sm ${
                isNeXTTheme ? "text-next-white" : "text-inrupt-navy"
              }`}>
                NextFM System
              </h2>
              <p className={`text-xs ${
                isNeXTTheme ? "text-next-white/70" : "text-gray-600"
              }`}>
                Boot Sequence v1.0
              </p>
            </div>
          </div>
          
          {/* Console output */}
          <div className={`p-4 font-mono text-xs ${
            isNeXTTheme 
              ? "bg-next-black text-next-white border-t border-next-border" 
              : "bg-inrupt-navy text-white border-t border-gray-700"
          }`}>
            <div className={`font-bold pb-1 mb-2 ${
              isNeXTTheme 
                ? "border-b border-next-border text-next-white/80" 
                : "border-b border-gray-600 text-white/80"
            }`}>
              System Log:
            </div>
            
            <div className="space-y-1">
              {bootSteps.map((step, index) => {
                const isActive = index === currentStep;
                const isCompleted = completedSteps.includes(index);
                
                return (
                  <div key={index} className={`flex items-start ${!isActive && !isCompleted ? 'hidden' : ''}`}>
                    <span className="mr-1 w-3">
                      {isCompleted && (
                        <CheckCircle2 className={`h-3 w-3 mt-0.5 ${
                          isNeXTTheme ? "text-next-green" : "text-green-400"
                        }`} />
                      )}
                    </span>
                    <div className="flex-1">
                      <span className={`mr-2 ${
                        isNeXTTheme ? "text-next-white/70" : "text-white/70"
                      }`}>
                        [{String(index).padStart(2, '0')}]
                      </span>
                      <span className={
                        isCompleted 
                          ? isNeXTTheme ? 'text-next-white/90' : 'text-white/90'
                          : isNeXTTheme ? 'text-next-blue' : 'text-blue-300'
                      }>
                        {step}
                      </span>
                      {isActive && blinking && (
                        <span className={`ml-1 ${isNeXTTheme ? "text-next-blue" : "text-blue-300"}`}>_</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Progress bar */}
            <div className={`mt-4 mb-2 ${
              isNeXTTheme 
                ? "border border-next-border bg-next-dark" 
                : "border border-gray-600 bg-gray-800"
            }`}>
              <div 
                className={`h-2 transition-all duration-300 ${
                  isNeXTTheme ? "bg-next-blue" : "bg-inrupt-blue"
                }`}
                style={{
                  width: `${((completedSteps.length) / bootSteps.length) * 100}%`,
                }}
              ></div>
            </div>
            
            {/* Boot status */}
            <div className={`flex justify-between items-center text-xs pt-2 mt-3 ${
              isNeXTTheme 
                ? "border-t border-next-border" 
                : "border-t border-gray-600"
            }`}>
              <span className={isNeXTTheme ? "text-next-white/70" : "text-white/70"}>
                {completedSteps.length === bootSteps.length ? 
                  "System Ready" : 
                  `Loading: ${Math.round((completedSteps.length / bootSteps.length) * 100)}%`}
              </span>
              <span className={isNeXTTheme ? "text-next-white/50" : "text-white/50"}>Solid Protocol</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RadioLoader;