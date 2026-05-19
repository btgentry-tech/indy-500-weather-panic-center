import type { ForecastSnapshot } from "@/lib/types";
import { PANIC_INDEX_MOODS } from "@/lib/panic-index";
import {
  FORECAST_STABILITY_DISCLAIMER,
  resolveSnapshotStabilityLevel,
  stabilityCssClass,
  stabilityExplanation,
  stabilityLabel,
} from "@/lib/forecast-stability";
import { truncateChangeLine } from "@/lib/labels";
import { formatStationTime } from "@/lib/format";

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
  const changeText =
    lastForecastChange ??
    snapshot.lastForecastChange ??
    "Awaiting the next NOAA forecast revision.";
  const changeAt = lastForecastChangeAt ?? snapshot.fetchedAt;
  const stability = resolveSnapshotStabilityLevel(snapshot);

  return (
    <section
      className="panel panic-hero panel-live dashboard-overall"
      aria-label="Overall race-week weather status"
    >
      <div className="hero-live-row">
        <span className="live-badge">LIVE</span>
        <span className="radar-pulse" aria-hidden="true" />
      </div>
      <div
        className={`panic-index-block panic-index-${snapshot.panicIndex}`}
      >
        <p className="panic-index-caption">Panic index</p>
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
        <span className="field-label">Overall NOAA stability</span>
        <p
          className={`hero-stability-value ${stabilityCssClass(stability)}`}
        >
          {stabilityLabel(stability)}
        </p>
        <p className="hero-stability-note">{stabilityExplanation(stability)}</p>
        <p className="hero-stability-derived">{FORECAST_STABILITY_DISCLAIMER}</p>
      </div>
      <div className="hero-incident">
        <p className="incident-header">
          <span className="field-label">Last forecast change</span>
          <time className="incident-time" dateTime={changeAt}>
            {formatStationTime(changeAt)}
          </time>
        </p>
        <p className="hero-incident-text">{truncateChangeLine(changeText, 120)}</p>
      </div>
    </section>
  );
}
