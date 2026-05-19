"use client";

import { useEffect, useState } from "react";
import { formatClockNow, formatStationTime } from "@/lib/format";
import { formatNextPollUtc, pollCadenceLabel } from "@/lib/polling";
import type { StationMeta } from "@/lib/types";

const FLAVOR_LINES = [
  "Monitoring station online.",
  "Forecast watch active.",
  "NOAA grid polled on schedule.",
  "Awaiting next check window.",
];

interface StationStatusProps {
  station: StationMeta;
}

export function StationStatus({ station: initialStation }: StationStatusProps) {
  const [station, setStation] = useState(initialStation);
  const [clock, setClock] = useState("");
  const [nextPoll, setNextPoll] = useState("");
  const [flavorIndex, setFlavorIndex] = useState(0);

  useEffect(() => {
    const refreshStation = () => {
      fetch(`/data/station.json?ts=${Date.now()}`, { cache: "no-store" })
        .then((res) => (res.ok ? res.json() : null))
        .then((data: StationMeta | null) => {
          if (data?.lastCheckedAt) setStation(data);
        })
        .catch(() => {});
    };
    refreshStation();
    const stationTimer = setInterval(refreshStation, 60_000);
    return () => clearInterval(stationTimer);
  }, []);

  useEffect(() => {
    setClock(formatClockNow());
    setNextPoll(formatNextPollUtc());
    const clockTimer = setInterval(() => setClock(formatClockNow()), 1000);
    const pollTimer = setInterval(() => setNextPoll(formatNextPollUtc()), 30_000);
    const flavorTimer = setInterval(
      () => setFlavorIndex((i) => (i + 1) % FLAVOR_LINES.length),
      8000,
    );
    return () => {
      clearInterval(clockTimer);
      clearInterval(pollTimer);
      clearInterval(flavorTimer);
    };
  }, []);

  return (
    <section className="panel station-status" aria-label="Station status">
      <div className="status-row">
        <span className="radar-pulse" aria-hidden="true" />
        <span className="status-blink" aria-hidden="true">
          █
        </span>
        <span>{FLAVOR_LINES[flavorIndex]}</span>
      </div>
      <p className="status-line">
        LOCAL TIME (IMS): <strong>{clock}</strong>
      </p>
      <p className="status-line">
        LAST NOAA CHECK:{" "}
        {station.lastCheckedAt ? (
          <strong title={station.lastCheckedAt}>
            {formatStationTime(station.lastCheckedAt)}
          </strong>
        ) : (
          "NO DATA"
        )}
      </p>
      <p className="status-line">
        LAST FORECAST CHANGE:{" "}
        {station.lastForecastChangeAt ? (
          <strong title={station.lastForecastChangeAt}>
            {formatStationTime(station.lastForecastChangeAt)}
          </strong>
        ) : (
          "NONE ON RECORD"
        )}
        {station.lastForecastChangeSummary ? (
          <span className="station-change-note">
            {" "}
            — {station.lastForecastChangeSummary}
          </span>
        ) : null}
      </p>
      <p className="status-line">
        LAST SAVED SNAPSHOT:{" "}
        {station.lastSnapshotAt ? (
          <strong title={station.lastSnapshotAt}>
            {formatStationTime(station.lastSnapshotAt)}
          </strong>
        ) : (
          "NONE"
        )}
        {station.lastSnapshotId ? ` — ${station.lastSnapshotId}` : ""}
      </p>
      <p className="status-line">
        POLL CADENCE: <strong>{pollCadenceLabel()}</strong>
        <span className="vol-sep">|</span>
        NEXT: <strong>{nextPoll || "—"}</strong>
      </p>
    </section>
  );
}
