/* eslint-disable no-undef */
importScripts("/firebase-sw-config.js");
importScripts(
  "https://www.gstatic.com/firebasejs/10.13.0/firebase-app-compat.js",
);
importScripts(
  "https://www.gstatic.com/firebasejs/10.13.0/firebase-messaging-compat.js",
);

function displayBackgroundNotification(payload) {
  const title = payload.notification?.title ?? "Atmospheric Alert";
  const body =
    payload.notification?.body ??
    "Forecast conditions revised. Consult panic center.";

  return self.registration.showNotification(title, {
    body,
    icon: "/icons/icon-192.svg",
    badge: "/icons/icon-192.svg",
    tag: "indy-panic-alert",
  });
}

const firebaseConfig = self.__INDY_FIREBASE_CONFIG__ ?? {};
let messaging = null;

if (firebaseConfig.apiKey) {
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }
  messaging = firebase.messaging();
} else {
  console.warn("[fcm-handlers] Firebase config not set.");
}

if (messaging) {
  messaging.onBackgroundMessage((payload) => {
    return displayBackgroundNotification(payload);
  });
}

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
