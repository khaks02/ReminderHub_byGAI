import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Function to register the service worker
const registerServiceWorker = () => {
  if ('serviceWorker' in navigator) {
    // In certain sandboxed or iframe-based environments, relative paths for service
    // workers can be misinterpreted. To ensure the correct origin, we construct
    // the full, absolute URL to the service worker script.
    const swUrl = `${window.location.origin}/sw.js`;
    navigator.serviceWorker.register(swUrl)
      .then(registration => {
        console.log('ServiceWorker registration successful with scope: ', registration.scope);
      })
      .catch(error => {
        console.log('ServiceWorker registration failed: ', error);
      });
  }
};

// The 'load' event might have already fired.
// We check the document.readyState. If it's 'complete', we can register immediately.
// Otherwise, we wait for the 'load' event.
if (document.readyState === 'complete') {
  registerServiceWorker();
} else {
  window.addEventListener('load', registerServiceWorker);
}


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