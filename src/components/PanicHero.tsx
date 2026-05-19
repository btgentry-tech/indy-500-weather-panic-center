import type { ForecastSnapshot } from "@/lib/types";
import { PANIC_INDEX_MOODS } from "@/lib/panic-index";
import { truncateChangeLine } from "@/lib/labels";
import { formatStationTime } from "@/lib/format";
import { PanicIndexMeter } from "./PanicIndexMeter";
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

  return (
    <section
      className="panel panic-hero"
      aria-label="Current panic status"
    >
      <div className="hero-live-row">
        <span className="live-badge">LIVE</span>
        <span className="status-blink" aria-hidden="true">
          █
        </span>
        <span className="radar-pulse" aria-hidden="true" />
      </div>
      <div
        className={`panic-index-block panic-index-${snapshot.panicIndex}`}
      >
        <div className="panic-index-headline">
          <span className="panic-index-caption">PANIC INDEX:</span>
          <span className="panic-index-fraction">
            {snapshot.panicIndex}/5
          </span>
        </div>
        <PanicIndexMeter level={snapshot.panicIndex} />
      </div>
      <p className="mood-line">{PANIC_INDEX_MOODS[snapshot.panicIndex]}</p>
      <p className="hero-rain">
        Race Day Rain: <strong>{race.rainPct}%</strong>
      </p>
      <TrendIndicator trend={race.trend} />
      <p className="hero-change">
        Latest change: {truncateChangeLine(changeText)}
        {lastForecastChangeAt ? (
          <span className="hero-change-time">
            {" "}
            ({formatStationTime(lastForecastChangeAt)})
          </span>
        ) : null}
      </p>
      <p className="hero-updated status-line">
        Snapshot {snapshot.id} — saved{" "}
        {formatStationTime(snapshot.fetchedAt)}
      </p>
    </section>
  );
}
