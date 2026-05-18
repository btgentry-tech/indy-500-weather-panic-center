/* eslint-disable no-undef */
importScripts(
  "https://www.gstatic.com/firebasejs/10.13.0/firebase-app-compat.js",
);
importScripts(
  "https://www.gstatic.com/firebasejs/10.13.0/firebase-messaging-compat.js",
);

function initMessaging() {
  return fetch("/firebase-config.json")
    .then((response) => response.json())
    .then((config) => {
      if (!firebase.apps.length) {
        firebase.initializeApp(config);
      }
      return firebase.messaging();
    });
}

initMessaging().then((messaging) => {
  messaging.onBackgroundMessage((payload) => {
    const title =
      payload.notification?.title ?? "Atmospheric Alert";
    const body =
      payload.notification?.body ??
      "Forecast conditions revised. Consult panic center.";

    self.registration.showNotification(title, {
      body,
      icon: "/icons/icon-192.svg",
      badge: "/icons/icon-192.svg",
      tag: "indy-panic-alert",
    });
  });
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((list) => {
        for (const client of list) {
          if ("focus" in client) return client.focus();
        }
        if (clients.openWindow) return clients.openWindow("/");
      }),
  );
});
