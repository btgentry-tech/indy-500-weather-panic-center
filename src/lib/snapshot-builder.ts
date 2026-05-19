import { compareForecasts } from "./compare";
import {
  buildRaceDayRows,
  computePanicIndex,
  PANIC_INDEX_MOODS,
} from "./panic-index";
import type { ForecastSnapshot, NormalizedForecast } from "./types";
import { computeSnapshotStabilityLevel } from "./forecast-stability";
import { computeVolatility } from "./volatility";
import { formatSnapshotId } from "./race-days";

export function buildSnapshot(
  forecast: NormalizedForecast,
  history: ForecastSnapshot[],
  fetchedAt = new Date(),
): ForecastSnapshot {
  const previous = history[history.length - 1];
  const id = formatSnapshotId(fetchedAt);

  const days = buildRaceDayRows(forecast, previous?.days);

  const volatility = computeVolatility(history, { days });
  const panicIndex = computePanicIndex(days, volatility.largestRainSwing);
  const forecastStabilityLevel = computeSnapshotStabilityLevel(history, {
    days,
  });
  const forecastStability = volatility.stabilityScore;

  const compare = compareForecasts(
    previous ?? null,
    days,
    forecast.hourly,
    panicIndex,
    previous?.panicIndex,
  );

  return {
    id,
    fetchedAt: fetchedAt.toISOString(),
    noaaGeneratedAt: forecast.noaaGeneratedAt,
    panicIndex,
    panicScale: 2,
    defcon: panicIndex,
    mood: PANIC_INDEX_MOODS[panicIndex],
    forecastStability,
    forecastStabilityLevel,
    lastForecastChange: compare.hasMeaningfulChange
      ? compare.summary
      : previous?.lastForecastChange ?? null,
    days,
    hourly: forecast.hourly,
    volatility,
  };
}

export function shouldPersistSnapshot(
  previous: ForecastSnapshot | null,
  next: ForecastSnapshot,
): boolean {
  if (!previous) return true;
  if (previous.panicIndex !== next.panicIndex) return true;

  for (const key of ["carbDay", "legendsDay", "raceDay"] as const) {
    if (
      previous.days[key].rainPct !== next.days[key].rainPct ||
      previous.days[key].stormRisk !== next.days[key].stormRisk ||
      previous.days[key].highTemp !== next.days[key].highTemp
    ) {
      return true;
    }
  }

  return false;
}
