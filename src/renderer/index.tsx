/**
 * Electron Renderer Process Entry Point
 *
 * Initializes React application and mounts to DOM.
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import './styles/globals.css';

// Get root element
const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error(
    'Failed to find root element. Make sure there is a <div id="root"></div> in your HTML.'
  );
}

// Create React root and render app
const root = ReactDOM.createRoot(rootElement);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Hot Module Replacement (HMR) for development
if (import.meta.hot) {
  import.meta.hot.accept();
}
