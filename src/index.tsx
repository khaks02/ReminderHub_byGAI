import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Re-enabled the service worker registration to restore notification functionality.
window.addEventListener('load', () => {
  if ('serviceWorker' in navigator) {
    // In certain sandboxed or iframe-based environments, relative paths for service
    // workers can be misinterpreted. To ensure the correct origin, we construct
    // the full, absolute URL to the service worker script.
    const swUrl = `${window.location.origin}/sw.js`;
    navigator.serviceWorker.register(swUrl)
      .then(registration => {
        console.log('[ServiceWorker] Registration successful. Scope:', registration.scope);
      })
      .catch(error => {
        // Made the error log more descriptive to help pinpoint the cause.
        console.error('[ServiceWorker] Registration failed. The document might not be in a valid state or a secure context. Error:', error);
      });
  }
});


const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);