import type { ForecastSnapshot } from "@/lib/types";
import { getPanicIndexLabel } from "@/lib/panic-index";
import { truncateChangeLine } from "@/lib/labels";
import { formatStationTime } from "@/lib/format";
import { TrendIndicator } from "./TrendIndicator";

interface PanicHeroProps {
  snapshot: ForecastSnapshot;
}

export function PanicHero({ snapshot }: PanicHeroProps) {
  const race = snapshot.days.raceDay;

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
        className={`panic-index-level panic-index-${snapshot.panicIndex}`}
      >
        {getPanicIndexLabel(snapshot.panicIndex)}
      </div>
      <p className="hero-rain">
        Race Day Rain: <strong>{race.rainPct}%</strong>
      </p>
      <TrendIndicator trend={race.trend} />
      <p className="hero-updated">
        Last updated: {formatStationTime(snapshot.fetchedAt)}
      </p>
      <p className="hero-change">
        {truncateChangeLine(
          snapshot.lastForecastChange ?? snapshot.mood,
        )}
      </p>
    </section>
  );
}
