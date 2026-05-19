"use client";

import { useEffect, useState } from "react";
import { formatClockNow, formatStationTime } from "@/lib/format";

const FLAVOR_LINES = [
  "Monitoring station online.",
  "Forecast stability deteriorating.",
  "Unauthorized optimism discouraged.",
  "Atmospheric confidence low.",
  "Moisture developments under observation.",
];

interface StationStatusProps {
  lastSync: string | null;
  snapshotId: string | null;
}

export function StationStatus({ lastSync, snapshotId }: StationStatusProps) {
  const [clock, setClock] = useState("");
  const [flavorIndex, setFlavorIndex] = useState(0);

  useEffect(() => {
    setClock(formatClockNow());
    const clockTimer = setInterval(() => setClock(formatClockNow()), 1000);
    const flavorTimer = setInterval(
      () => setFlavorIndex((i) => (i + 1) % FLAVOR_LINES.length),
      8000,
    );
    return () => {
      clearInterval(clockTimer);
      clearInterval(flavorTimer);
    };
  }, []);

  return (
    <section className="panel station-status" aria-label="Station status">
      <div className="status-row">
        <span className="status-blink" aria-hidden="true">
          █
        </span>
        <span>{FLAVOR_LINES[flavorIndex]}</span>
      </div>
      <p className="status-line">
        LOCAL TIME (IMS): <strong>{clock}</strong>
      </p>
      <p className="status-line">
        LAST NOAA SYNC:{" "}
        {lastSync ? (
          <>
            <strong>{formatStationTime(lastSync)}</strong>
            {snapshotId ? ` — snapshot ${snapshotId}` : ""}
          </>
        ) : (
          "NO DATA ON RECORD"
        )}
      </p>
      <p className="status-line">
        NEXT SCHEDULED POLL: top of hour UTC (GitHub Actions)
      </p>
    </section>
  );
}
