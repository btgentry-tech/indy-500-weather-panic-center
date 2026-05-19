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
}

export function PanicHero({ snapshot }: PanicHeroProps) {
  const stability = resolveSnapshotStabilityLevel(snapshot);
  const revisionAt = snapshot.fetchedAt;
  const revisionText = snapshot.lastForecastChange;

  return (
    <section
      className="panel panic-hero panel-live dashboard-overall"
      aria-label="Overall race-week weather status"
    >
      <div className="hero-live-row">
        <span className="live-badge">LIVE</span>
        <span className="radar-pulse" aria-hidden="true" />
      </div>
      <p className="hero-forecast-asof">
        <span className="field-label">Latest NOAA forecast</span>
        <time dateTime={snapshot.fetchedAt}>
          {formatStationTime(snapshot.fetchedAt)}
        </time>
      </p>
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
      {revisionText ? (
        <div className="hero-revision">
          <p className="hero-revision-header">
            <span className="field-label">Latest operational update</span>
            <time className="incident-time" dateTime={revisionAt}>
              {formatStationTime(revisionAt)}
            </time>
          </p>
          <p className="hero-revision-text">
            {truncateChangeLine(revisionText, 160)}
          </p>
        </div>
      ) : null}
    </section>
  );
}
