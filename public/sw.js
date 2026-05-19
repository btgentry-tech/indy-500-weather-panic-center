/* FCM service worker — background push for Indy Panic Center */
/* fcm-handlers registers push/messaging handlers during initial evaluation */
importScripts("/fcm-handlers.js");

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});
