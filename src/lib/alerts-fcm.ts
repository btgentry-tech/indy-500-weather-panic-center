import { getClientMessaging, getVapidKey } from "@/lib/firebase-client";
import {
  isAlertsArmed,
  notificationsSupported,
  setAlertsArmed,
} from "@/lib/alerts-storage";

export function isIos(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

export function isStandalonePwa(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // @ts-expect-error iOS Safari standalone
    window.navigator.standalone === true
  );
}

async function registerServiceWorker(): Promise<ServiceWorkerRegistration> {
  const existing = await navigator.serviceWorker.getRegistration("/");
  if (existing?.active) return existing;

  const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
  await navigator.serviceWorker.ready;
  return reg;
}

async function fetchFcmToken(
  registration: ServiceWorkerRegistration,
): Promise<string> {
  const messaging = await getClientMessaging();
  const { getToken } = await import("firebase/messaging");
  const token = await getToken(messaging, {
    vapidKey: getVapidKey(),
    serviceWorkerRegistration: registration,
  });
  if (!token) throw new Error("FCM token unavailable.");
  return token;
}

async function subscribeToken(
  registration: ServiceWorkerRegistration,
): Promise<void> {
  const token = await fetchFcmToken(registration);
  const res = await fetch("/api/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  });
  if (!res.ok) {
    const body = (await res.json()) as { error?: string };
    throw new Error(body.error ?? "Subscription failed.");
  }
}

async function unsubscribeToken(
  registration: ServiceWorkerRegistration,
): Promise<void> {
  const token = await fetchFcmToken(registration);
  const res = await fetch("/api/unsubscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  });
  if (!res.ok) {
    const body = (await res.json()) as { error?: string };
    throw new Error(body.error ?? "Unsubscribe failed.");
  }
}

export async function enableAppAlerts(): Promise<void> {
  if (!notificationsSupported()) {
    throw new Error("Notifications not supported in this browser.");
  }

  if (isIos() && !isStandalonePwa()) {
    throw new Error("Add to Home Screen first, then reopen to enable alerts.");
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    throw new Error("Notification permission denied.");
  }

  const registration = await registerServiceWorker();
  await subscribeToken(registration);
  setAlertsArmed(true);
}

export async function disableAppAlerts(): Promise<{ serverError?: string }> {
  let serverError: string | undefined;

  try {
    const registration = await registerServiceWorker();
    await unsubscribeToken(registration);
  } catch (error) {
    serverError =
      error instanceof Error ? error.message : "Unsubscribe failed.";
  }

  setAlertsArmed(false);
  return { serverError };
}

export async function resubscribeIfArmed(): Promise<void> {
  if (!notificationsSupported()) return;
  if (!isAlertsArmed()) return;

  try {
    const registration = await registerServiceWorker();
    await subscribeToken(registration);
  } catch {
    /* re-subscribe may fail if Firebase unset locally */
  }
}
