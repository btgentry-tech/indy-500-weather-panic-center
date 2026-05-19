import type { ForecastSnapshot } from "@/lib/types";
import { formatIncidentTime } from "@/lib/format";
import { summarizeSnapshotDelta } from "@/lib/volatility";

type IncidentTone = "improving" | "worsening" | "uncertain";

function incidentTone(
  summary: string,
  current: ForecastSnapshot,
  previous?: ForecastSnapshot,
): IncidentTone {
  if (!previous) return "uncertain";
  const lower = summary.toLowerCase();
  if (lower.includes("improving") || lower.includes("retreating")) {
    return "improving";
  }
  if (
    lower.includes("elevated") ||
    lower.includes("instability") ||
    lower.includes("upward")
  ) {
    return "worsening";
  }
  if (current.panicIndex < previous.panicIndex) return "worsening";
  if (current.panicIndex > previous.panicIndex) return "improving";
  if (current.days.raceDay.rainPct > previous.days.raceDay.rainPct + 5) {
    return "worsening";
  }
  if (current.days.raceDay.rainPct < previous.days.raceDay.rainPct - 5) {
    return "improving";
  }
  return "uncertain";
}

interface IncidentReportProps {
  snapshot: ForecastSnapshot;
  previous?: ForecastSnapshot;
}

export function IncidentReport({ snapshot, previous }: IncidentReportProps) {
  const summary = previous
    ? summarizeSnapshotDelta(previous, snapshot)
    : "Baseline forecast recorded.";
  const tone = incidentTone(summary, snapshot, previous);

  return (
    <details className={`incident-report incident-${tone}`}>
      <summary className="incident-summary">
        <span className="incident-time">{formatIncidentTime(snapshot.fetchedAt)}</span>
        <span className="incident-headline">{summary}</span>
      </summary>
      <div className="incident-body">
        <p>
          PANIC INDEX: {snapshot.panicIndex} — {snapshot.mood}
        </p>
        <p>
          Carb {snapshot.days.carbDay.rainPct}% | Legends{" "}
          {snapshot.days.legendsDay.rainPct}% | Race{" "}
          {snapshot.days.raceDay.rainPct}%
        </p>
        <p className="status-line">Snapshot {snapshot.id}</p>
      </div>
    </details>
  );
}
