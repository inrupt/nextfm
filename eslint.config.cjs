// eslint.config.cjs - Simple ESLint v9 config for NextFM
const globals = require('globals');
const reactPlugin = require('eslint-plugin-react');
const reactHooksPlugin = require('eslint-plugin-react-hooks');
const jsxA11yPlugin = require('eslint-plugin-jsx-a11y');

// Create a clean, minimal configuration based on Inrupt standards
module.exports = [
  // Core JS and React configurations
  {
    files: ['**/*.js', '**/*.jsx'],
    ignores: ['**/node_modules/**', '**/build/**', '**/dist/**'],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.jest,
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
      'jsx-a11y': jsxA11yPlugin
    },
    settings: {
      react: {
        version: 'detect', // Auto-detect React version from package.json
      },
    },
    // Essential rules only - keep it simple
    rules: {
      // Core ESLint rules - only enforce critical ones
      'no-unused-vars': ['warn', { 
        argsIgnorePattern: '^_', 
        varsIgnorePattern: '^_',
        destructuredArrayIgnorePattern: '^_'
      }],
      'no-undef': 'error',
      
      // React rules - minimal set
      'react/jsx-uses-react': 'off', // Not needed with React 17+
      'react/react-in-jsx-scope': 'off', // Not needed with React 17+
      'react/prop-types': 'off', // Skip prop validation
      
      // React Hooks rules - these prevent actual bugs
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      
      // Accessibility - warnings only, not errors
      'jsx-a11y/alt-text': 'warn',
      'jsx-a11y/aria-props': 'warn',
      'jsx-a11y/aria-role': 'warn',
      'jsx-a11y/no-static-element-interactions': 'warn',
    },
  },
  
  // Test files - even more relaxed rules
  {
    files: ['**/*.test.js', '**/*.test.jsx', '**/__tests__/**'],
    rules: {
      'no-unused-vars': 'off',
      'react/display-name': 'off',
    },
  },
];