import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Handle client-side routing when refreshing pages
const handleSavedPath = () => {
  // Check if there's a saved path in sessionStorage
  const savedPath = sessionStorage.getItem('spa_path');
  if (savedPath) {
    // Remove the saved path from sessionStorage
    sessionStorage.removeItem('spa_path');
    // Navigate to the saved path
    window.history.replaceState(null, '', savedPath);
  }
};

// Run the handler before rendering the app
handleSavedPath();

// Create the root element
const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element not found');
}

// Create the root and render the app
createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>
);
