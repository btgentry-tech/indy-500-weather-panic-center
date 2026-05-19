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
        <span>Total revisions on record:</span>{" "}
        <strong>{record.totalRevisions}</strong>
        <span className="vol-sep">|</span>
        <span>Revisions (24h):</span> <strong>{record.changes24h}</strong>
      </p>
      <p className="volatility-line">
        <span>Largest rain swing (record):</span>{" "}
        <strong>{record.largestRainSwingRecord}%</strong>
        <span className="vol-sep">|</span>
        <span>Latest rain swing:</span>{" "}
        <strong>{record.latestRainSwing}%</strong>
        <span className="vol-sep">|</span>
        <span>Stability:</span> <strong>{record.stabilityScore}%</strong>
        <span className="vol-sep">|</span>
        <span>Panic meter:</span> <strong>{panicMeter}/100</strong>
      </p>
    </section>
  );
}
