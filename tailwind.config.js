/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html",
  ],
  darkMode: 'class', // Enable dark mode variant
  theme: {
    extend: {
      colors: {
        // Inrupt/Podspaces color scheme
        'inrupt-navy': '#0d3050',
        'inrupt-dark': '#021732',
        'inrupt-deeper': '#021930',
        'inrupt-blue': '#2563eb',
        'inrupt-light': '#f8fafc',
        'inrupt-accent': '#3b82f6',
        'inrupt-red': '#dc2626',
        'solid-purple': '#7c4dff',  // Solid logo's purple color
        'solid-purple-dark': '#6a3df7', // Darker shade for hover states
        
        // NeXTSTEP authentic colors based on the desktop image
        'next-gray': '#727272',
        'next-dark': '#333333',
        'next-black': '#000000',
        'next-white': '#EEEEEE',
        'next-blue': '#0066CC', 
        'next-highlight': '#3399FF',
        'next-shadow': '#000000',
        'next-accent': '#F5F5F5', // Off-white for subtle contrast
        'next-green': '#17ae65', // Color from the NeXT logo
        'next-red': '#f14729',   // Color from the NeXT logo
        'next-menu': '#727272',  // Menu bar color
        'next-titlebar': '#727272', // Window title bar
        'next-border': '#999999', // Border color
      },
      fontFamily: {
        'inrupt': ['Inconsolata', 'Open Sans', 'sans-serif'], // Inrupt's font stack
        'inrupt-body': ['Open Sans', 'system-ui', 'sans-serif'], // Inrupt's body text
        'next': ['Helvetica', 'Arial', 'sans-serif'], // More authentic to original NeXTSTEP
        'mono': ['Courier', 'monospace'], // Original NeXTSTEP monospace font
      },
      boxShadow: {
        'inrupt': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'next': '6px 6px 10px rgba(0, 0, 0, 0.5)', // Stronger, more authentic shadow
        'next-inset': 'inset 1px 1px 3px rgba(0, 0, 0, 0.4)',
        'next-window': '6px 6px 0 rgba(0, 0, 0, 0.9)', // The distinctive NeXTSTEP "hard shadow"
      },
      borderRadius: {
        'next': '0px', // NeXTSTEP used square corners, not rounded
      },
      clipPath: {
        'inrupt-angle': 'polygon(0 0, 100% 0, 100% 85%, 0 100%)', // Inrupt's angled section style
      }
    },
  },
  plugins: [],
  // Support conditional classes for different themes
  variants: {
    extend: {
      backgroundColor: ['dark'],
      textColor: ['dark'],
      borderColor: ['dark'],
    },
  },
}