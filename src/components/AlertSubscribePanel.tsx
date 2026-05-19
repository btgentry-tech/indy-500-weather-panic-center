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

/** REMOVABLE DEBUG — delete with push-debug logging cleanup */
function pushDebug(...args: unknown[]): void {
  console.log("[push-debug]", ...args);
}

type AlertState = "offline" | "requesting" | "armed" | "denied" | "failed" | "unsupported";

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
  try {
    const existing = await navigator.serviceWorker.getRegistration("/");
    if (existing?.active) {
      pushDebug("service worker: reusing active registration", {
        scope: existing.scope,
      });
      return existing;
    }

    pushDebug("service worker: registering /sw.js");
    const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
    await navigator.serviceWorker.ready;
    pushDebug("service worker: registration succeeded", {
      scope: reg.scope,
      active: Boolean(reg.active),
    });
    return reg;
  } catch (error) {
    pushDebug("service worker: registration failed", {
      message: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

async function subscribeToken(registration: ServiceWorkerRegistration): Promise<void> {
  const messaging = await getClientMessaging();
  const { getToken } = await import("firebase/messaging");

  let token: string | null = null;
  try {
    pushDebug("getToken: requesting FCM token");
    token = await getToken(messaging, {
      vapidKey: getVapidKey(),
      serviceWorkerRegistration: registration,
    });
    pushDebug("getToken: succeeded", {
      tokenLength: token?.length ?? 0,
      hasToken: Boolean(token),
    });
  } catch (error) {
    pushDebug("getToken: failed", {
      message: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }

  if (!token) throw new Error("FCM token unavailable.");

  pushDebug("POST /api/subscribe: sending");
  const res = await fetch("/api/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  });

  let responseBody: unknown = null;
  try {
    responseBody = await res.json();
  } catch {
    responseBody = "(non-JSON or empty body)";
  }

  pushDebug("POST /api/subscribe: response", {
    status: res.status,
    ok: res.ok,
    body: responseBody,
  });

  if (!res.ok) {
    const body = responseBody as { error?: string };
    throw new Error(body.error ?? "Subscription failed.");
  }
}

export function AlertSubscribePanel() {
  const [state, setState] = useState<AlertState>("offline");
  const [status, setStatus] = useState("");
  const [foregroundMsg, setForegroundMsg] = useState<string | null>(null);
  const [supported, setSupported] = useState(true);

  const syncArmedState = useCallback(async () => {
    pushDebug("syncArmedState: start", {
      notificationsSupported: notificationsSupported(),
      permission:
        typeof Notification !== "undefined" ? Notification.permission : "n/a",
      isAlertsArmed: isAlertsArmed(),
    });

    if (!notificationsSupported()) {
      setSupported(false);
      setState("unsupported");
      pushDebug("syncArmedState: unsupported browser");
      return;
    }
    setSupported(true);

    if (!isAlertsArmed()) {
      setState(
        Notification.permission === "denied" ? "denied" : "offline",
      );
      pushDebug("syncArmedState: not armed");
      return;
    }

    setState("armed");
    pushDebug("syncArmedState: armed in storage, re-subscribing");
    try {
      const registration = await registerServiceWorker();
      await subscribeToken(registration);
      pushDebug("syncArmedState: re-subscribe complete", {
        isAlertsArmed: isAlertsArmed(),
      });
    } catch (error) {
      pushDebug("syncArmedState: re-subscribe failed (UI still armed)", {
        message: error instanceof Error ? error.message : String(error),
        isAlertsArmed: isAlertsArmed(),
      });
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
    pushDebug("enableAlerts: start", { isAlertsArmed: isAlertsArmed() });
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
      pushDebug("enableAlerts: permission", { permission });
      if (permission !== "granted") {
        setState("denied");
        throw new Error("Notification permission denied.");
      }

      const registration = await registerServiceWorker();
      await subscribeToken(registration);

      setAlertsArmed(true);
      setState("armed");
      setStatus("Alerts armed. indy-panic topic.");
      pushDebug("enableAlerts: complete", {
        isAlertsArmed: isAlertsArmed(),
        uiState: "armed",
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Subscription failed.";
      pushDebug("enableAlerts: failed", {
        message,
        permission: Notification.permission,
        isAlertsArmed: isAlertsArmed(),
      });
      if (Notification.permission === "denied") {
        setState("denied");
      } else if (state !== "unsupported") {
        setState("failed");
      }
      setStatus(message);
    }
  }

  if (state === "armed") {
    return (
      <p className="alert-collapsed status-line">
        ALERTS ARMED — monitoring indy-panic topic
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
