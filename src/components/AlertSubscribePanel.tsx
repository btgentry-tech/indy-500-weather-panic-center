"use client";

import { useCallback, useEffect, useState } from "react";
import { getClientMessaging, getVapidKey } from "@/lib/firebase-client";
import { onMessage } from "firebase/messaging";

type AlertState = "offline" | "requesting" | "armed" | "denied" | "failed";

const STORAGE_KEY = "alerts-armed";

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
      localStorage.getItem(STORAGE_KEY) === "1"
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
            payload.notification?.body ??
            "Atmospheric conditions revised.";
          setForegroundMsg(body);
        });
      })
      .catch(() => {
        /* Firebase not configured in dev */
      });

    return () => unsubscribe?.();
  }, []);

  async function enableAlerts() {
    setState("requesting");
    setStatus("Requesting atmospheric alert clearance...");

    try {
      if (!("Notification" in window)) {
        throw new Error("This terminal does not support notifications.");
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
        throw new Error("Alert clearance denied.");
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

      localStorage.setItem(STORAGE_KEY, "1");
      setState("armed");
      setStatus(
        "Subscribed to indy-panic topic. Atmospheric alerts armed.",
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown subscription error.";
      if (Notification.permission === "denied") {
        setState("denied");
      } else {
        setState("failed");
      }
      setStatus(`FAILED: ${message}`);
    }
  }

  const statusLabel =
    state === "armed"
      ? "ALERTS ARMED"
      : state === "denied"
        ? "ALERTS DENIED"
        : state === "requesting"
          ? "ARMING..."
          : "ALERTS OFFLINE";

  return (
    <section
      className={`panel alert-panel ${state === "armed" ? "alert-panel-armed" : ""}`}
      aria-label="Atmospheric alert subscription"
    >
      <h2 className="alert-panel-header">
        *** ATMOSPHERIC ALERT SUBSCRIPTION ***
      </h2>
      <p
        className={`alert-status ${state === "armed" ? "alert-status-armed" : "alert-status-offline"}`}
      >
        {statusLabel}
      </p>
      <div className="alert-instructions">
        <p>
          <strong>DESKTOP:</strong> Enable browser notifications when prompted.
        </p>
        <p>
          <strong>IPHONE:</strong> Add to Home Screen first, then reopen
          monitoring station to enable alerts.
        </p>
      </div>
      {isIos() && !isStandalonePwa() && (
        <p className="severity-warning ios-warning">
          STANDALONE PWA REQUIRED ON iOS — install to home screen before
          subscribing.
        </p>
      )}
      <button
        type="button"
        className="btn-terminal btn-alert"
        onClick={enableAlerts}
        disabled={state === "requesting" || state === "armed"}
      >
        [ SUBSCRIBE TO ALERTS ]
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
