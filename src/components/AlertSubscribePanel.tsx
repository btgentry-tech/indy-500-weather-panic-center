"use client";

import { useCallback, useEffect, useState } from "react";
import { getClientMessaging, getVapidKey } from "@/lib/firebase-client";
import {
  ALERTS_ARMED_EVENT,
  isAlertsArmed,
  notificationsSupported,
  setAlertsArmed,
} from "@/lib/alerts-storage";
import { onMessage } from "firebase/messaging";

type AlertState =
  | "offline"
  | "requesting"
  | "disarming"
  | "armed"
  | "denied"
  | "failed"
  | "unsupported";

function isIos(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

function isStandalonePwa(): boolean {
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

async function subscribeToken(registration: ServiceWorkerRegistration): Promise<void> {
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

export function AlertSubscribePanel() {
  const [state, setState] = useState<AlertState>("offline");
  const [status, setStatus] = useState("");
  const [foregroundMsg, setForegroundMsg] = useState<string | null>(null);
  const [supported, setSupported] = useState(true);

  const syncArmedState = useCallback(async () => {
    if (!notificationsSupported()) {
      setSupported(false);
      setState("unsupported");
      return;
    }
    setSupported(true);

    if (!isAlertsArmed()) {
      setState(
        Notification.permission === "denied" ? "denied" : "offline",
      );
      return;
    }

    setState("armed");
    try {
      const registration = await registerServiceWorker();
      await subscribeToken(registration);
    } catch {
      /* armed in UI; re-subscribe may fail if Firebase unset locally */
    }
  }, []);

  useEffect(() => {
    syncArmedState();
    const onArmed = () => syncArmedState();
    window.addEventListener(ALERTS_ARMED_EVENT, onArmed);
    return () => window.removeEventListener(ALERTS_ARMED_EVENT, onArmed);
  }, [syncArmedState]);

  useEffect(() => {
    if (!supported) return;
    let unsubscribe: (() => void) | undefined;

    getClientMessaging()
      .then((messaging) => {
        unsubscribe = onMessage(messaging, (payload) => {
          const body =
            payload.notification?.body ?? "Forecast revised again.";
          setForegroundMsg(body);
        });
      })
      .catch(() => {});

    return () => unsubscribe?.();
  }, [supported]);

  async function enableAlerts() {
    setState("requesting");
    setStatus("Enabling alerts...");

    try {
      if (!notificationsSupported()) {
        setState("unsupported");
        throw new Error("Notifications not supported in this browser.");
      }

      if (isIos() && !isStandalonePwa()) {
        throw new Error(
          "Add to Home Screen first, then reopen to enable alerts.",
        );
      }

      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setState("denied");
        throw new Error("Notification permission denied.");
      }

      const registration = await registerServiceWorker();
      await subscribeToken(registration);

      setAlertsArmed(true);
      setState("armed");
      setStatus("");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Subscription failed.";
      if (Notification.permission === "denied") {
        setState("denied");
      } else if (state !== "unsupported") {
        setState("failed");
      }
      setStatus(message);
    }
  }

  async function disableAlerts() {
    setState("disarming");
    setStatus("Disabling alerts...");

    let serverError: string | null = null;

    try {
      const registration = await registerServiceWorker();
      await unsubscribeToken(registration);
    } catch (error) {
      serverError =
        error instanceof Error ? error.message : "Unsubscribe failed.";
    }

    setAlertsArmed(false);
    setForegroundMsg(null);
    setState(
      Notification.permission === "denied" ? "denied" : "offline",
    );

    if (serverError) {
      setStatus(
        `Alerts disabled locally. Topic unsubscribe failed: ${serverError}`,
      );
    } else {
      setStatus("");
    }
  }

  if (state === "armed" || state === "disarming") {
    return (
      <p className="alert-armed-strip status-line">
        <button
          type="button"
          className="btn-terminal btn-alert-compact"
          onClick={disableAlerts}
          disabled={state === "disarming"}
        >
          [ DISABLE ALERTS ]
        </button>
        {status ? <span className="alert-feedback"> {status}</span> : null}
      </p>
    );
  }

  if (state === "unsupported") {
    return (
      <p className="alert-collapsed status-line severity-warning">
        NOTIFICATIONS UNAVAILABLE IN THIS BROWSER
      </p>
    );
  }

  const statusLabel =
    state === "denied"
      ? "ALERTS DENIED"
      : state === "requesting"
        ? "ARMING..."
        : "ALERTS OFFLINE";

  return (
    <section className="panel alert-panel" aria-label="Panic alerts">
      <h2 className="alert-panel-header">ENABLE PANIC ALERTS</h2>
      <p
        className={`alert-status ${state === "offline" ? "alert-status-offline" : ""}`}
      >
        {statusLabel}
      </p>
      {isIos() && !isStandalonePwa() && (
        <p className="severity-warning ios-warning">
          iOS: add to Home Screen, then reopen.
        </p>
      )}
      <button
        type="button"
        className="btn-terminal btn-alert"
        onClick={enableAlerts}
        disabled={state === "requesting"}
      >
        [ ENABLE PANIC ALERTS ]
      </button>
      {status && <p className="status-line alert-feedback">{status}</p>}
      {foregroundMsg && (
        <p className="severity-warning alert-feedback">
          INCOMING: {foregroundMsg}
        </p>
      )}
    </section>
  );
}
