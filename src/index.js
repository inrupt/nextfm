import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';

// Add error boundary for development
if (process.env.NODE_ENV === 'development') {
  const originalConsoleError = console.error;
  console.error = (...args) => {
    if (args[0]?.includes('React will try to recreate this component tree')) {
      return;
    }
    originalConsoleError(...args);
  };
}

const rootElement = document.getElementById('root');
const root = createRoot(rootElement);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
