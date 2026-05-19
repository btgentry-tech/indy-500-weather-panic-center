import type { ForecastSnapshot } from "@/lib/types";
import { PANIC_INDEX_MOODS } from "@/lib/panic-index";
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
  const changeText =
    lastForecastChange ??
    snapshot.lastForecastChange ??
    PANIC_INDEX_MOODS[snapshot.panicIndex];
  const changeAt = lastForecastChangeAt ?? snapshot.fetchedAt;
  const meterFilled = Math.max(
    0,
    Math.min(10, Math.round(snapshot.panicMeter / 10)),
  );
  const meterBar =
    "█".repeat(meterFilled) + "░".repeat(10 - meterFilled);

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
        <div className="panic-meter-block">
          <span className="field-label">Atmospheric load</span>
          <p
            className="panic-meter"
            aria-label={`Atmospheric load meter ${snapshot.panicMeter} out of 100`}
          >
            <span className="panic-meter-bar" aria-hidden="true">
              {meterBar}
            </span>
            <span className="panic-meter-value">{snapshot.panicMeter}/100</span>
          </p>
        </div>
      </div>
      <div className="hero-metrics">
        <div className="hero-metric">
          <span className="field-label">Race day rain</span>
          <span className="field-value field-value-live">{race.rainPct}%</span>
        </div>
        <TrendIndicator trend={race.trend} compact />
      </div>
      <div className="hero-incident">
        <p className="incident-header">
          <span className="field-label">Latest change</span>
          <time className="incident-time" dateTime={changeAt}>
            {formatStationTime(changeAt)}
          </time>
        </p>
        <p className="hero-incident-text">{truncateChangeLine(changeText, 120)}</p>
      </div>
    </section>
  );
}
