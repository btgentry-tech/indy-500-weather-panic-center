import type { ForecastSnapshot } from "@/lib/types";
import { PANIC_INDEX_MOODS } from "@/lib/panic-index";
import {
  FORECAST_STABILITY_NOTE,
  resolveSnapshotStabilityLevel,
  stabilityCssClass,
  stabilityLabel,
} from "@/lib/forecast-stability";
import { truncateChangeLine } from "@/lib/labels";
import { formatStationTime } from "@/lib/format";
import { TrendIndicator } from "./TrendIndicator";

interface PanicHeroProps {
  snapshot: ForecastSnapshot;
  lastForecastChange: string | null;
  lastForecastChangeAt: string | null;
}

export function PanicHero({
  snapshot,
  lastForecastChange,
  lastForecastChangeAt,
}: PanicHeroProps) {
  const race = snapshot.days.raceDay;
  const hasMeaningfulChange =
    Boolean(lastForecastChangeAt) &&
    Boolean(lastForecastChange ?? snapshot.lastForecastChange);
  const changeText =
    lastForecastChange ??
    snapshot.lastForecastChange ??
    "No meaningful forecast shift since the last editorial update.";
  const changeAt = lastForecastChangeAt ?? snapshot.fetchedAt;
  const stability = resolveSnapshotStabilityLevel(snapshot);

  return (
    <section
      className="panel panic-hero panel-live"
      aria-label="Current panic status"
    >
      <div className="hero-live-row">
        <span className="live-badge">LIVE</span>
        <span className="radar-pulse" aria-hidden="true" />
      </div>
      <div
        className={`panic-index-block panic-index-${snapshot.panicIndex}`}
      >
        <p className="panic-index-caption">PANIC INDEX</p>
        <p
          className="panic-index-fraction"
          aria-label={`Panic index ${snapshot.panicIndex} of 5`}
        >
          {snapshot.panicIndex}/5
        </p>
        <p className="panic-index-mood">
          {PANIC_INDEX_MOODS[snapshot.panicIndex]}
        </p>
      </div>
      <div className="hero-stability-block">
        <span className="field-label">Forecast stability</span>
        <p
          className={`hero-stability-value ${stabilityCssClass(stability)}`}
        >
          {stabilityLabel(stability)}
        </p>
        <p className="hero-stability-note">{FORECAST_STABILITY_NOTE}</p>
        <p className="hero-stability-derived">
          Derived interpretation — not an official NOAA metric.
        </p>
      </div>
      <div className="hero-metrics">
        <div className="hero-metric">
          <span className="field-label">Race day rain</span>
          <span className="field-value field-value-live">{race.rainPct}%</span>
        </div>
        <TrendIndicator trend={race.trend} compact />
        <p className="hero-forecast-asof">
          <span className="field-label">Forecast as of</span>{" "}
          <time dateTime={snapshot.fetchedAt}>
            {formatStationTime(snapshot.fetchedAt)}
          </time>
        </p>
      </div>
      <div className="hero-incident">
        <p className="incident-header">
          <span className="field-label">Last meaningful change</span>
          {hasMeaningfulChange ? (
            <time className="incident-time" dateTime={changeAt}>
              {formatStationTime(changeAt)}
            </time>
          ) : null}
        </p>
        <p className="hero-incident-text">{truncateChangeLine(changeText, 120)}</p>
      </div>
    </section>
  );
}
