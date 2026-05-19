"use client";

import { useEffect, useState } from "react";
import { formatClockNow, formatStationTime } from "@/lib/format";
import { isPollStale, minutesSince } from "@/lib/poll-stale";
import { formatNextPoll, pollCadenceLabel } from "@/lib/polling";
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
    const refreshStation = async () => {
      try {
        const ts = Date.now();
        const [stationRes, latestRes] = await Promise.all([
          fetch(`/data/station.json?ts=${ts}`, { cache: "no-store" }),
          fetch(`/data/latest.json?ts=${ts}`, { cache: "no-store" }),
        ]);
        const stationData: StationMeta | null = stationRes.ok
          ? await stationRes.json()
          : null;
        const latest: { snapshotId?: string } | null = latestRes.ok
          ? await latestRes.json()
          : null;

        if (!stationData?.lastCheckedAt) return;

        let merged: StationMeta = { ...stationData };

        if (latest?.snapshotId) {
          const snapRes = await fetch(
            `/data/history/${latest.snapshotId}.json?ts=${ts}`,
            { cache: "no-store" },
          );
          if (snapRes.ok) {
            const snap: {
              id: string;
              fetchedAt: string;
              lastForecastChange?: string | null;
            } = await snapRes.json();
            merged = {
              ...merged,
              lastSnapshotId: snap.id,
              lastSnapshotAt: snap.fetchedAt,
            };
            if (snap.lastForecastChange) {
              merged.lastOperationalUpdateAt = snap.fetchedAt;
              merged.lastOperationalUpdateSummary = snap.lastForecastChange;
            }
          }
        }

        setStation(merged);
      } catch {
        /* ignore */
      }
    };
    refreshStation();
    const stationTimer = setInterval(refreshStation, 60_000);
    return () => clearInterval(stationTimer);
  }, []);

  useEffect(() => {
    setClock(formatClockNow());
    const refreshNextPoll = () =>
      setNextPoll(formatNextPoll(new Date(), station.lastCheckedAt));
    refreshNextPoll();
    const clockTimer = setInterval(() => setClock(formatClockNow()), 1000);
    const pollTimer = setInterval(refreshNextPoll, 30_000);
    const flavorTimer = setInterval(
      () => setFlavorIndex((i) => (i + 1) % FLAVOR_LINES.length),
      8000,
    );
    return () => {
      clearInterval(clockTimer);
      clearInterval(pollTimer);
      clearInterval(flavorTimer);
    };
  }, [station.lastCheckedAt]);

  const pollStale = isPollStale(station.lastCheckedAt);
  const minsSinceCheck = minutesSince(station.lastCheckedAt);

  return (
    <section className="station-telemetry" aria-label="Station telemetry">
      <p className="telemetry-flavor">
        <span className="radar-pulse" aria-hidden="true" />
        {FLAVOR_LINES[flavorIndex]}
      </p>
      <dl className="telemetry-grid">
        <div className="telemetry-row">
          <dt>Indianapolis Motor Speedway local time</dt>
          <dd>{clock || "—"}</dd>
        </div>
        <div className="telemetry-row">
          <dt>Last NOAA check</dt>
          <dd>
            {station.lastCheckedAt
              ? formatStationTime(station.lastCheckedAt)
              : "NO DATA"}
            {pollStale ? (
              <span className="telemetry-stale">
                Automated poll overdue
                {minsSinceCheck !== null
                  ? ` (${minsSinceCheck} min ago; expected every 15)`
                  : ""}
              </span>
            ) : null}
          </dd>
        </div>
        <div className="telemetry-row">
          <dt>Latest NOAA forecast</dt>
          <dd>
            {station.lastSnapshotAt
              ? formatStationTime(station.lastSnapshotAt)
              : "NONE"}
            {station.lastSnapshotId ? (
              <span className="telemetry-meta">{station.lastSnapshotId}</span>
            ) : null}
          </dd>
        </div>
        <div className="telemetry-row">
          <dt>Latest operational update</dt>
          <dd>
            {station.lastOperationalUpdateAt
              ? formatStationTime(station.lastOperationalUpdateAt)
              : "NONE YET"}
            {station.lastOperationalUpdateSummary ? (
              <span className="telemetry-note">
                {station.lastOperationalUpdateSummary}
              </span>
            ) : null}
          </dd>
        </div>
        <div className="telemetry-row">
          <dt>Poll cadence</dt>
          <dd>
            {pollCadenceLabel()}
            <span className="telemetry-meta">Next {nextPoll || "—"}</span>
          </dd>
        </div>
      </dl>
    </section>
  );
}
