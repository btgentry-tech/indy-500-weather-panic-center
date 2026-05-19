"use client";

import { useEffect, useState } from "react";
import { formatClockNow, formatStationTime } from "@/lib/format";

const FLAVOR_LINES = [
  "Checking latest forecast…",
  "Monitoring station online.",
  "Forecast revised again.",
  "Monitoring storm timing.",
  "Forecast stability low.",
  "Radar situation evolving.",
];

interface StationStatusProps {
  lastSync: string | null;
  snapshotId: string | null;
}

export function StationStatus({ lastSync, snapshotId }: StationStatusProps) {
  const [clock, setClock] = useState("");
  const [flavorIndex, setFlavorIndex] = useState(0);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    setClock(formatClockNow());
    const clockTimer = setInterval(() => setClock(formatClockNow()), 1000);
    const flavorTimer = setInterval(
      () => setFlavorIndex((i) => (i + 1) % FLAVOR_LINES.length),
      6000,
    );
    const checkTimer = setInterval(() => {
      setChecking(true);
      setTimeout(() => setChecking(false), 800);
    }, 45000);
    return () => {
      clearInterval(clockTimer);
      clearInterval(flavorTimer);
      clearInterval(checkTimer);
    };
  }, []);

  return (
    <section className="panel station-status" aria-label="Station status">
      <div className="status-row">
        <span className="radar-pulse" aria-hidden="true" />
        <span className="status-blink" aria-hidden="true">
          █
        </span>
        <span>
          {checking ? "Checking latest forecast…" : FLAVOR_LINES[flavorIndex]}
        </span>
      </div>
      <p className="status-line">
        LOCAL TIME (IMS): <strong>{clock}</strong>
      </p>
      <p className="status-line">
        LAST SYNC:{" "}
        {lastSync ? (
          <strong title={lastSync}>{formatStationTime(lastSync)}</strong>
        ) : (
          "NO DATA"
        )}
        {snapshotId ? ` — ${snapshotId}` : ""}
      </p>
    </section>
  );
}
