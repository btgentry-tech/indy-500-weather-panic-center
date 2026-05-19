"use client";

import { useCallback, useEffect, useState } from "react";
import { getClientMessaging, getVapidKey } from "@/lib/firebase-client";
import { ALERTS_ARMED_KEY } from "@/lib/alerts-storage";
import { onMessage } from "firebase/messaging";

type AlertState = "offline" | "requesting" | "armed" | "denied" | "failed";

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

export function AlertSubscribePanel() {
  const [state, setState] = useState<AlertState>("offline");
  const [status, setStatus] = useState("");
  const [foregroundMsg, setForegroundMsg] = useState<string | null>(null);

  const checkArmed = useCallback(() => {
    if (
      typeof window !== "undefined" &&
      Notification.permission === "granted" &&
      localStorage.getItem(ALERTS_ARMED_KEY) === "1"
    ) {
      setState("armed");
    }
  }, []);

  useEffect(() => {
    checkArmed();
  }, [checkArmed]);

  useEffect(() => {
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
  }, []);

  async function enableAlerts() {
    setState("requesting");
    setStatus("Enabling alerts...");

    try {
      if (!("Notification" in window)) {
        throw new Error("Notifications not supported.");
      }

      if (isIos() && !isStandalonePwa()) {
        throw new Error(
          "Add to Home Screen first, then reopen to enable alerts.",
        );
      }

      if (!("serviceWorker" in navigator)) {
        throw new Error("Service worker unavailable.");
      }

      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setState("denied");
        throw new Error("Notification permission denied.");
      }

      const registration = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      const messaging = await getClientMessaging();
      const vapidKey = getVapidKey();

      const { getToken } = await import("firebase/messaging");
      const token = await getToken(messaging, {
        vapidKey,
        serviceWorkerRegistration: registration,
      });

      if (!token) {
        throw new Error("FCM token unavailable.");
      }

      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        throw new Error(body.error ?? "Subscription failed.");
      }

      localStorage.setItem(ALERTS_ARMED_KEY, "1");
      window.dispatchEvent(new Event("storage"));
      setState("armed");
      setStatus("Subscribed to indy-panic topic.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Subscription failed.";
      if (Notification.permission === "denied") {
        setState("denied");
      } else {
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
      <div className="alert-instructions">
        <p>
          <strong>DESKTOP:</strong> Enable browser notifications when prompted.
        </p>
        <p>
          <strong>IPHONE:</strong> Add to Home Screen first, then reopen this
          app to enable alerts.
        </p>
      </div>
      {isIos() && !isStandalonePwa() && (
        <p className="severity-warning ios-warning">
          iOS requires Home Screen install before alerts will work.
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
