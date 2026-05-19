"use client";

import { useCallback, useEffect, useState } from "react";
import { getClientMessaging } from "@/lib/firebase-client";
import {
  ALERTS_ARMED_EVENT,
  isAlertsArmed,
  notificationsSupported,
} from "@/lib/alerts-storage";
import {
  enableAppAlerts,
  needsAlertSetupGuide,
  resubscribeIfArmed,
} from "@/lib/alerts-fcm";
import { onMessage } from "firebase/messaging";
import { IphoneSetupModal } from "@/components/IphoneSetupModal";

type AlertState = "offline" | "requesting" | "armed" | "denied" | "failed";

export function AlertSubscribePanel() {
  const [state, setState] = useState<AlertState>("offline");
  const [status, setStatus] = useState("");
  const [foregroundMsg, setForegroundMsg] = useState<string | null>(null);
  const [setupModalOpen, setSetupModalOpen] = useState(false);

  const syncArmedState = useCallback(async () => {
    if (!isAlertsArmed()) {
      setState(
        typeof Notification !== "undefined" &&
          Notification.permission === "denied"
          ? "denied"
          : "offline",
      );
      return;
    }

    setState("armed");
    if (notificationsSupported()) {
      await resubscribeIfArmed();
    }
  }, []);

  useEffect(() => {
    syncArmedState();
    const onArmed = () => syncArmedState();
    window.addEventListener(ALERTS_ARMED_EVENT, onArmed);
    return () => window.removeEventListener(ALERTS_ARMED_EVENT, onArmed);
  }, [syncArmedState]);

  useEffect(() => {
    if (!notificationsSupported()) return;
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
      await enableAppAlerts();
      setState("armed");
      setStatus("");
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

  function handleEnableClick() {
    if (needsAlertSetupGuide()) {
      setSetupModalOpen(true);
      return;
    }
    void enableAlerts();
  }

  if (state === "armed") {
    return null;
  }

  const statusLabel =
    state === "denied"
      ? "ALERTS DENIED"
      : state === "requesting"
        ? "ARMING..."
        : "ALERTS OFFLINE";

  return (
    <>
      <section className="panel alert-panel" aria-label="Weather alerts">
        <p
          className={`alert-status ${state === "offline" ? "alert-status-offline" : ""}`}
        >
          {statusLabel}
        </p>
        <button
          type="button"
          className="btn-terminal btn-alert"
          onClick={handleEnableClick}
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
      <IphoneSetupModal
        open={setupModalOpen}
        onClose={() => setSetupModalOpen(false)}
      />
    </>
  );
}
