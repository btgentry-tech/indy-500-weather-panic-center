import type { ForecastSnapshot } from "@/lib/types";
import { PANIC_INDEX_MOODS } from "@/lib/panic-index";
import {
  resolveSnapshotStabilityLevel,
  stabilityCssClass,
  stabilityDetailLine,
  stabilityLabel,
} from "@/lib/forecast-stability";
import { truncateChangeLine } from "@/lib/labels";
import { formatStationTime } from "@/lib/format";

interface PanicHeroProps {
  snapshot: ForecastSnapshot;
  revisionSummary: string | null;
}

export function PanicHero({ snapshot, revisionSummary }: PanicHeroProps) {
  const stability = resolveSnapshotStabilityLevel(snapshot);
  const revisionAt = snapshot.fetchedAt;
  const revisionText = revisionSummary ?? snapshot.lastForecastChange;

  return (
    <section
      className="panel panic-hero"
      aria-label="Overall race-week weather status"
    >
      <div className="hero-live-row">
        <span className="live-badge">LIVE</span>
        <span className="radar-pulse" aria-hidden="true" />
      </div>
      <div
        className={`panic-index-block panic-index-${snapshot.panicIndex}`}
      >
        <span className="field-label">Panic index</span>
        <p
          className="panic-index-fraction"
          aria-label={`Panic index ${snapshot.panicIndex} of 5`}
        >
          {snapshot.panicIndex}/5
        </p>
        <p className="hero-detail-line">
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
        <p className="hero-detail-line">{stabilityDetailLine(stability)}</p>
      </div>
      {revisionText ? (
        <div className="hero-revision">
          <p className="hero-revision-header">
            <span className="field-label">Latest operational update</span>
            <time className="incident-time" dateTime={revisionAt}>
              {formatStationTime(revisionAt)}
            </time>
          </p>
          <p className="hero-detail-line">
            {truncateChangeLine(revisionText, 160)}
          </p>
        </div>
      ) : null}
    </section>
  );
}
