/* eslint-disable no-undef */
/* REMOVABLE DEBUG — delete [sw-push-debug] logging when push pipeline is verified */

importScripts("/firebase-sw-config.js");
importScripts(
  "https://www.gstatic.com/firebasejs/10.13.0/firebase-app-compat.js",
);
importScripts(
  "https://www.gstatic.com/firebasejs/10.13.0/firebase-messaging-compat.js",
);

function swPushDebug(...args) {
  console.log("[sw-push-debug]", ...args);
}

function displayBackgroundNotification(payload) {
  swPushDebug("onBackgroundMessage payload received", {
    notification: payload.notification ?? null,
    data: payload.data ?? null,
  });

  const title = payload.notification?.title ?? "Atmospheric Alert";
  const body =
    payload.notification?.body ??
    "Forecast conditions revised. Consult panic center.";

  swPushDebug("notification title/body resolved", { title, body });
  swPushDebug("calling self.registration.showNotification()", { title, body });

  return self.registration
    .showNotification(title, {
      body,
      icon: "/icons/icon-192.svg",
      badge: "/icons/icon-192.svg",
      tag: "indy-panic-alert",
    })
    .then(() => {
      swPushDebug("showNotification() resolved");
    })
    .catch((error) => {
      swPushDebug("showNotification() rejected", {
        message: error instanceof Error ? error.message : String(error),
      });
    });
}

// Firebase messaging — synchronous init during initial worker evaluation
const firebaseConfig = self.__INDY_FIREBASE_CONFIG__ ?? {};
let messaging = null;

if (firebaseConfig.apiKey) {
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }
  messaging = firebase.messaging();
  swPushDebug("Firebase messaging initialized in service worker (sync)");
} else {
  swPushDebug("Firebase config missing in firebase-sw-config.js");
}

if (messaging) {
  messaging.onBackgroundMessage((payload) => {
    swPushDebug("onBackgroundMessage invoked");
    return displayBackgroundNotification(payload);
  });
  swPushDebug("onBackgroundMessage handler registered (sync)");
} else {
  swPushDebug("onBackgroundMessage handler not registered (no messaging)");
}

self.addEventListener("push", (event) => {
  let payloadSummary = null;
  try {
    payloadSummary = event.data ? event.data.json() : null;
  } catch {
    payloadSummary = event.data ? event.data.text() : null;
  }
  swPushDebug("push event received", {
    hasData: Boolean(event.data),
    payload: payloadSummary,
  });
});

self.addEventListener("notificationclick", (event) => {
  swPushDebug("notificationclick event", {
    title: event.notification?.title ?? null,
    body: event.notification?.body ?? null,
    tag: event.notification?.tag ?? null,
  });

  event.notification.close();
  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((list) => {
        swPushDebug("notificationclick clients matched", {
          clientCount: list.length,
        });
        for (const client of list) {
          if ("focus" in client) return client.focus();
        }
        if (clients.openWindow) return clients.openWindow("/");
      }),
  );
});

self.addEventListener("pushsubscriptionchange", (event) => {
  swPushDebug("pushsubscriptionchange event", {
    hasNewSubscription: Boolean(event.newSubscription),
    hasOldSubscription: Boolean(event.oldSubscription),
  });
});
