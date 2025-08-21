// sw.js
// This service worker handles background notification actions.

self.addEventListener('notificationclick', (event) => {
  const reminderId = event.notification.data?.reminderId;
  
  // Always close the notification when clicked.
  event.notification.close();

  // Handle the 'snooze' action.
  if (event.action === 'snooze') {
    // NOTE: Using setTimeout in a service worker for delays longer than a few seconds
    // is not guaranteed to work, as the browser may terminate an idle worker.
    // For a short 5-minute snooze, it's generally acceptable.
    const snoozeTitle = event.notification.title;
    const snoozeBody = event.notification.body.replace('This is due', 'Snoozed reminder, was due');
    
    setTimeout(() => {
      self.registration.showNotification(snoozeTitle, {
        body: snoozeBody,
        icon: '/favicon.svg',
        tag: reminderId, // Re-use tag to allow replacement if snoozed again
        actions: event.notification.actions, // Keep the same actions
        data: event.notification.data,
      });
    }, 5 * 60 * 1000); // 5 minutes
  } else {
    // Default action (or 'open' action) is to focus the existing client or open a new one.
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then((clientList) => {
        for (const client of clientList) {
          // Check if the client is the root page.
          const clientUrl = new URL(client.url);
          if (clientUrl.pathname === '/' && 'focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow('/');
        }
      })
    );
  }
});

// Basic service worker lifecycle.
// install event: triggered when the service worker is first installed.
self.addEventListener('install', () => {
  // skipWaiting() forces the waiting service worker to become the active service worker.
  self.skipWaiting();
});

// activate event: triggered when the service worker becomes active.
self.addEventListener('activate', (event) => {
  // clients.claim() allows an active service worker to set itself as the controller for all clients within its scope.
  event.waitUntil(clients.claim());
});