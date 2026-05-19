"use client";

import { useEffect, useState } from "react";
import {
  formatWindPhrase,
  hasDisplayableConditions,
} from "@/lib/local-conditions";
import type { LocalConditions, StationMeta } from "@/lib/types";

interface LiveConditionsStripProps {
  conditions: LocalConditions | null | undefined;
}

export function LiveConditionsStrip({
  conditions: initialConditions,
}: LiveConditionsStripProps) {
  const [conditions, setConditions] = useState(initialConditions ?? null);

  useEffect(() => {
    const refresh = () => {
      fetch(`/data/station.json?ts=${Date.now()}`, { cache: "no-store" })
        .then((res) => (res.ok ? res.json() : null))
        .then((data: StationMeta | null) => {
          if (data?.localConditions) {
            setConditions(data.localConditions);
          }
        })
        .catch(() => {});
    };
    refresh();
    const timer = setInterval(refresh, 60_000);
    return () => clearInterval(timer);
  }, []);

  const wind = formatWindPhrase(
    conditions?.windDirection ?? null,
    conditions?.windSpeedMph ?? null,
  );

  return (
    <section
      className="conditions-strip"
      aria-label="Indianapolis Motor Speedway current conditions"
    >
      <h2 className="conditions-strip-label">
        Indianapolis Motor Speedway Conditions
      </h2>
      {hasDisplayableConditions(conditions) ? (
        <p className="conditions-strip-values">
          {conditions?.temperatureF != null ? (
            <span className="conditions-value conditions-temp">
              {conditions.temperatureF}°
            </span>
          ) : null}
          {conditions?.condition ? (
            <>
              {conditions.temperatureF != null ? (
                <span className="conditions-sep" aria-hidden="true">
                  •
                </span>
              ) : null}
              <span className="conditions-value">{conditions.condition}</span>
            </>
          ) : null}
          {wind ? (
            <>
              <span className="conditions-sep" aria-hidden="true">
                •
              </span>
              <span className="conditions-value conditions-wind">{wind}</span>
            </>
          ) : null}
        </p>
      ) : (
        <p className="conditions-strip-unavailable">
          Awaiting surface observation from NOAA grid.
        </p>
      )}
    </section>
  );
}
