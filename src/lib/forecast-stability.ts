import type { DayKey, ForecastSnapshot } from "./types";
import { computeVolatility } from "./volatility";

/** Derived interpretation — not an official NOAA metric. */
export type ForecastStabilityLevel =
  | "stable"
  | "mostly-stable"
  | "unsettled"
  | "volatile"
  | "rapidly-changing";

/** Plain-language status + one-line meaning per stability band. */
export const FORECAST_STABILITY_COPY: Record<
  ForecastStabilityLevel,
  { label: string; explanation: string }
> = {
  stable: {
    label: "Forecast holding steady",
    explanation:
      "Recent NOAA polls mostly agree — rain odds and timing are not bouncing around.",
  },
  "mostly-stable": {
    label: "Mostly steady",
    explanation:
      "Guidance drifts a little between polls, but nothing dramatic yet.",
  },
  unsettled: {
    label: "NOAA guidance still shifting",
    explanation:
      "Rain chances and storm timing keep moving as new polls land.",
  },
  volatile: {
    label: "Forecast changing frequently",
    explanation:
      "Big revisions are common — percentages and storm wording keep swinging.",
  },
  "rapidly-changing": {
    label: "Forecast in heavy flux",
    explanation:
      "Poll-to-poll jumps are large; treat the outlook as highly uncertain.",
  },
};

export const FORECAST_STABILITY_DISCLAIMER =
  "Internal trend analysis — unofficial.";

/** @deprecated Use FORECAST_STABILITY_COPY[level].label */
export const FORECAST_STABILITY_LABELS: Record<ForecastStabilityLevel, string> =
  Object.fromEntries(
    Object.entries(FORECAST_STABILITY_COPY).map(([k, v]) => [k, v.label]),
  ) as Record<ForecastStabilityLevel, string>;

/** @deprecated Use stabilityExplanation */
export const FORECAST_STABILITY_NOTE =
  "How much NOAA forecasts have shifted between recent polls.";

export function stabilityLabel(level: ForecastStabilityLevel): string {
  return FORECAST_STABILITY_COPY[level].label;
}

export function stabilityExplanation(level: ForecastStabilityLevel): string {
  return FORECAST_STABILITY_COPY[level].explanation;
}

/** One-line stability context + unofficial disclaimer (hero display). */
export function stabilityDetailLine(level: ForecastStabilityLevel): string {
  return `${FORECAST_STABILITY_COPY[level].explanation} ${FORECAST_STABILITY_DISCLAIMER}`;
}

export function stabilityLevelFromVolatilityScore(
  volatilityScore: number,
  changes24h: number,
  largestRainSwing: number,
): ForecastStabilityLevel {
  let score = volatilityScore;
  if (changes24h >= 4) score = Math.min(100, score + 12);
  if (largestRainSwing >= 20) score = Math.min(100, score + 10);

  if (score < 22) return "stable";
  if (score < 42) return "mostly-stable";
  if (score < 58) return "unsettled";
  if (score < 78) return "volatile";
  return "rapidly-changing";
}

export function stabilityLevelFromNumericScore(
  forecastStability: number,
): ForecastStabilityLevel {
  if (forecastStability >= 80) return "stable";
  if (forecastStability >= 60) return "mostly-stable";
  if (forecastStability >= 40) return "unsettled";
  if (forecastStability >= 20) return "volatile";
  return "rapidly-changing";
}

export function computeSnapshotStabilityLevel(
  history: ForecastSnapshot[],
  current: Pick<ForecastSnapshot, "days">,
): ForecastStabilityLevel {
  const vol = computeVolatility(history, current);
  return stabilityLevelFromVolatilityScore(
    vol.volatilityScore,
    vol.changes24h,
    vol.largestRainSwing,
  );
}

export function computeDayStabilityLevel(
  history: ForecastSnapshot[],
  dayKey: DayKey,
  currentRain: number,
): ForecastStabilityLevel {
  const previous = history[history.length - 1];
  const rainSeries = history.slice(-6).map((s) => s.days[dayKey].rainPct);

  let largestSwing = 0;
  if (previous) {
    largestSwing = Math.abs(currentRain - previous.days[dayKey].rainPct);
  }

  const recent = history.slice(-8);
  let revisionShifts = 0;
  for (let i = 1; i < recent.length; i++) {
    if (recent[i].days[dayKey].rainPct !== recent[i - 1].days[dayKey].rainPct) {
      revisionShifts += 1;
    }
  }

  const variance =
    rainSeries.length > 1
      ? rainSeries.reduce((sum, val) => {
          const mean = rainSeries.reduce((a, b) => a + b, 0) / rainSeries.length;
          return sum + Math.abs(val - mean);
        }, 0) / (rainSeries.length - 1)
      : 0;

  const score = Math.round(
    Math.min(100, revisionShifts * 10 + largestSwing * 0.9 + variance),
  );

  return stabilityLevelFromVolatilityScore(score, revisionShifts, largestSwing);
}

export function resolveSnapshotStabilityLevel(
  snapshot: ForecastSnapshot,
): ForecastStabilityLevel {
  if (snapshot.forecastStabilityLevel) {
    return snapshot.forecastStabilityLevel;
  }
  if (snapshot.volatility) {
    return stabilityLevelFromVolatilityScore(
      snapshot.volatility.volatilityScore,
      snapshot.volatility.changes24h,
      snapshot.volatility.largestRainSwing,
    );
  }
  return stabilityLevelFromNumericScore(snapshot.forecastStability ?? 50);
}

export function stabilityCssClass(
  level: ForecastStabilityLevel,
): "stability-calm" | "stability-mid" | "stability-high" {
  if (level === "stable" || level === "mostly-stable") return "stability-calm";
  if (level === "unsettled") return "stability-mid";
  return "stability-high";
}
