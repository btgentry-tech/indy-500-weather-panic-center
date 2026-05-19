import type { VolatilityStats } from "@/lib/types";

interface VolatilityStripProps {
  volatility: VolatilityStats;
  forecastStability: number;
  panicMeter: number;
}

export function VolatilityStrip({
  volatility,
  forecastStability,
  panicMeter,
}: VolatilityStripProps) {
  return (
    <section className="panel volatility-strip" aria-label="Forecast volatility">
      <h2 className="panel-title">How Unstable Has It Been?</h2>
      <p className="volatility-line">
        <span>Revisions (24h):</span> <strong>{volatility.changes24h}</strong>
        <span className="vol-sep">|</span>
        <span>Largest rain swing:</span>{" "}
        <strong>{volatility.largestRainSwing}%</strong>
        <span className="vol-sep">|</span>
        <span>Stability:</span> <strong>{forecastStability}%</strong>
        <span className="vol-sep">|</span>
        <span>Panic meter:</span> <strong>{panicMeter}/100</strong>
      </p>
    </section>
  );
}
