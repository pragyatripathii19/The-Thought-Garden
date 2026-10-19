import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { listenForInstall } from './lib/install';

listenForInstall();

// Keeps the app's own files on the device (see public/sw.js). Production only, so dev always serves fresh code.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Without it the app still works; it just loads from the network each time.
    });
  });
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
