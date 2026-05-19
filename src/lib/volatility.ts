import type { DayKey, ForecastSnapshot, VolatilityStats } from "./types";
import { RACE_DAYS } from "./race-days";

const DAY_KEYS: DayKey[] = ["carbDay", "legendsDay", "raceDay"];

function hoursAgo(iso: string, hours: number): boolean {
  const then = new Date(iso).getTime();
  const cutoff = Date.now() - hours * 60 * 60 * 1000;
  return then >= cutoff;
}

export function computeVolatility(
  history: ForecastSnapshot[],
  current: Pick<ForecastSnapshot, "days">,
): VolatilityStats {
  const recent = history.filter((s) => hoursAgo(s.fetchedAt, 24));
  const previous = history[history.length - 1];

  let largestRainSwing = 0;
  if (previous) {
    for (const key of DAY_KEYS) {
      const swing = Math.abs(
        current.days[key].rainPct - previous.days[key].rainPct,
      );
      largestRainSwing = Math.max(largestRainSwing, swing);
    }
  }

  let changes24h = 0;
  for (let i = 1; i < recent.length; i++) {
    const prev = recent[i - 1];
    const next = recent[i];
    let changed = false;
    for (const key of DAY_KEYS) {
      if (
        prev.days[key].rainPct !== next.days[key].rainPct ||
        prev.days[key].stormRisk !== next.days[key].stormRisk
      ) {
        changed = true;
        break;
      }
    }
    if (changed) changes24h += 1;
  }

  const raceRainSeries = history
    .slice(-6)
    .map((s) => s.days.raceDay.rainPct);
  const variance =
    raceRainSeries.length > 1
      ? raceRainSeries.reduce((sum, val, i, arr) => {
          const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
          return sum + Math.abs(val - mean);
        }, 0) / (raceRainSeries.length - 1)
      : 0;

  const volatilityScore = Math.round(
    Math.min(100, changes24h * 12 + largestRainSwing * 0.8 + variance),
  );
  const stabilityScore = Math.round(Math.max(0, 100 - volatilityScore));

  return {
    changes24h,
    largestRainSwing,
    stabilityScore,
    volatilityScore,
  };
}

export function summarizeSnapshotDelta(
  previous: ForecastSnapshot,
  current: ForecastSnapshot,
): string {
  const parts: string[] = [];
  for (const config of RACE_DAYS) {
    const key = config.key;
    const from = previous.days[key].rainPct;
    const to = current.days[key].rainPct;
    if (from !== to) {
      parts.push(`${config.label} rain ${from}% → ${to}%`);
    }
  }
  if (previous.panicIndex !== current.panicIndex) {
    parts.unshift(
      `PANIC INDEX ${previous.panicIndex} → ${current.panicIndex}`,
    );
  }
  return parts.join(" | ") || "Routine NOAA revision recorded.";
}
