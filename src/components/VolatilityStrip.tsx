import type { RecordVolatilityStats } from "@/lib/types";

interface VolatilityStripProps {
  record: RecordVolatilityStats;
  panicMeter: number;
}

export function VolatilityStrip({ record, panicMeter }: VolatilityStripProps) {
  return (
    <section className="panel volatility-strip" aria-label="Forecast volatility">
      <h2 className="panel-title">How Unstable Has It Been?</h2>
      <p className="volatility-line">
        <span className="field-label">Total revisions</span>{" "}
        <span className="field-value">{record.totalRevisions}</span>
        <span className="vol-sep">|</span>
        <span className="field-label">24h</span>{" "}
        <span className="field-value">{record.changes24h}</span>
      </p>
      <p className="volatility-line">
        <span className="field-label">Max rain swing</span>{" "}
        <span className="field-value">{record.largestRainSwingRecord}%</span>
        <span className="vol-sep">|</span>
        <span className="field-label">Latest swing</span>{" "}
        <span className="field-value">{record.latestRainSwing}%</span>
        <span className="vol-sep">|</span>
        <span className="field-label">Stability</span>{" "}
        <span className="field-value">{record.stabilityScore}%</span>
        <span className="vol-sep">|</span>
        <span className="field-label">Panic meter</span>{" "}
        <span className="field-value">{panicMeter}/100</span>
      </p>
    </section>
  );
}
