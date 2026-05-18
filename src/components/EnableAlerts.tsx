"use client";

import { useState } from "react";
import { getClientMessaging, getVapidKey } from "@/lib/firebase-client";

export function EnableAlerts() {
  const [status, setStatus] = useState<string>("");
  const [busy, setBusy] = useState(false);

  async function enableAlerts() {
    setBusy(true);
    setStatus("Requesting atmospheric alert clearance...");

    try {
      if (!("Notification" in window)) {
        throw new Error("This terminal does not support notifications.");
      }

      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        throw new Error("Alert clearance denied.");
      }

      const registration = await navigator.serviceWorker.register(
        "/firebase-messaging-sw.js",
        { scope: "/" },
      );

      await navigator.serviceWorker.ready;

      const messaging = await getClientMessaging();
      const vapidKey = getVapidKey();

      const token = await (
        await import("firebase/messaging")
      ).getToken(messaging, {
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

      setStatus(
        "Subscribed to indy-panic topic. Doug Boles will not be notified personally.",
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown subscription error.";
      setStatus(`FAILED: ${message}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="panel">
      <h2 className="panel-title">Atmospheric Alerts</h2>
      <p className="status-line">
        iPhone: Add to Home Screen first, then enable alerts. Safari 16.4+ only.
      </p>
      <button
        type="button"
        className="btn-terminal"
        onClick={enableAlerts}
        disabled={busy}
      >
        Enable Atmospheric Alerts
      </button>
      {status && <p className="status-line">{status}</p>}
    </section>
  );
}
