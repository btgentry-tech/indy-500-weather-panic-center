import type { RecordVolatilityStats } from "@/lib/types";

interface VolatilityStripProps {
  record: RecordVolatilityStats;
  panicMeter: number;
}

export function VolatilityStrip({ record, panicMeter }: VolatilityStripProps) {
  return (
    <section className="panel volatility-strip" aria-label="Forecast volatility">
      <h2 className="panel-title">How Unstable Has It Been?</h2>
      <div className="vol-metrics">
        <div className="vol-metric">
          <span className="field-label">Total revisions</span>
          <span className="field-value">{record.totalRevisions}</span>
        </div>
        <div className="vol-metric">
          <span className="field-label">Revisions (24h)</span>
          <span className="field-value">{record.changes24h}</span>
        </div>
        <div className="vol-metric vol-metric-highlight">
          <span className="field-label">Max rain swing</span>
          <span className="field-value">{record.largestRainSwingRecord}%</span>
        </div>
      </div>
      <div className="vol-metrics">
        <div className="vol-metric">
          <span className="field-label">Latest rain swing</span>
          <span className="field-value">{record.latestRainSwing}%</span>
        </div>
        <div className="vol-metric">
          <span className="field-label">Stability score</span>
          <span className="field-value">{record.stabilityScore}%</span>
        </div>
        <div className="vol-metric">
          <span className="field-label">Panic meter</span>
          <span className="field-value">{panicMeter}/100</span>
        </div>
      </div>
    </section>
  );
}
