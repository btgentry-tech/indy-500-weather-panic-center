"use client";

import { useCallback, useEffect, useState } from "react";
import { getClientMessaging } from "@/lib/firebase-client";
import {
  ALERTS_ARMED_EVENT,
  isAlertsArmed,
  notificationsSupported,
} from "@/lib/alerts-storage";
import { enableAppAlerts, isIos, isStandalonePwa, resubscribeIfArmed } from "@/lib/alerts-fcm";
import { onMessage } from "firebase/messaging";

type AlertState =
  | "offline"
  | "requesting"
  | "armed"
  | "denied"
  | "failed"
  | "unsupported";

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
    await resubscribeIfArmed();
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
      await enableAppAlerts();
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

  if (state === "armed") {
    return null;
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
    <section className="panel alert-panel" aria-label="Weather alerts">
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
        [ ENABLE WEATHER ALERTS ]
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
