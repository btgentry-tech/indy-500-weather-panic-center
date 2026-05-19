import { compareForecasts } from "./compare";
import type { CompareResult, ForecastSnapshot } from "./types";

export type IncidentTone = "improving" | "worsening" | "uncertain";

export function buildSnapshotRevision(
  previous: ForecastSnapshot | null,
  snapshot: ForecastSnapshot,
): CompareResult {
  return compareForecasts(
    previous,
    snapshot.days,
    snapshot.hourly,
    snapshot.panicIndex,
    previous?.panicIndex,
  );
}

export function incidentToneFromRevision(
  compare: CompareResult,
  previous?: ForecastSnapshot,
): IncidentTone {
  if (!previous) return "uncertain";

  if (
    compare.panicIndexFrom !== undefined &&
    compare.panicIndexTo !== undefined
  ) {
    if (compare.panicIndexTo > compare.panicIndexFrom) return "worsening";
    if (compare.panicIndexTo < compare.panicIndexFrom) return "improving";
  }

  if (compare.severity === "alert") return "worsening";

  const lower = compare.summary.toLowerCase();
  if (
    lower.includes("improving") ||
    lower.includes("easing") ||
    lower.includes("retreating") ||
    lower.includes("dropped") ||
    lower.includes("steadier")
  ) {
    return "improving";
  }
  if (
    lower.includes("worsened") ||
    lower.includes("climbed") ||
    lower.includes("climbing") ||
    lower.includes("upgraded") ||
    lower.includes("rising") ||
    lower.includes("building")
  ) {
    return "worsening";
  }

  return "uncertain";
}
