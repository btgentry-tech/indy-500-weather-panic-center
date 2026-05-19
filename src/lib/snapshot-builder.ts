import { compareForecasts } from "./compare";
import {
  buildRaceDayRows,
  computePanicIndex,
  PANIC_INDEX_MOODS,
} from "./panic-index";
import type {
  DayKey,
  ForecastSnapshot,
  HourlyPoint,
  NormalizedForecast,
} from "./types";
import { computeSnapshotStabilityLevel } from "./forecast-stability";
import { computeVolatility } from "./volatility";
import { formatSnapshotId } from "./race-days";

function hourlyForecastChanged(
  previous: HourlyPoint[],
  next: HourlyPoint[],
): boolean {
  if (previous.length !== next.length) return true;
  for (let i = 0; i < previous.length; i++) {
    if (previous[i].rainPct !== next[i].rainPct) return true;
    if (previous[i].hasStormWording !== next[i].hasStormWording) return true;
    if (previous[i].shortForecast !== next[i].shortForecast) return true;
  }
  return false;
}

/**
 * True when any NOAA grid field differs from the previous poll — triggers snapshot
 * history, editorial updates, changelog, timestamps, and notifications.
 */
export function hasForecastDataChanged(
  previous: ForecastSnapshot,
  next: ForecastSnapshot,
): boolean {
  if (previous.panicIndex !== next.panicIndex) return true;

  for (const key of ["carbDay", "legendsDay", "raceDay"] as const) {
    const prevDay = previous.days[key];
    const nextDay = next.days[key];
    if (
      prevDay.rainPct !== nextDay.rainPct ||
      prevDay.trend !== nextDay.trend ||
      prevDay.stormRisk !== nextDay.stormRisk ||
      prevDay.highTemp !== nextDay.highTemp ||
      prevDay.shortForecast !== nextDay.shortForecast
    ) {
      return true;
    }
  }

  if (hourlyForecastChanged(previous.hourly, next.hourly)) return true;

  return false;
}

export function buildSnapshot(
  forecast: NormalizedForecast,
  history: ForecastSnapshot[],
  fetchedAt: Date = new Date(),
  previousOverride?: ForecastSnapshot | null,
): ForecastSnapshot {
  const previous =
    previousOverride ?? history[history.length - 1] ?? null;
  const id = formatSnapshotId(fetchedAt);

  const days = buildRaceDayRows(forecast, previous?.days);

  const volatility = computeVolatility(history, { days });
  const panicIndex = computePanicIndex(days, volatility.largestRainSwing);
  const forecastStabilityLevel = computeSnapshotStabilityLevel(history, {
    days,
  });
  const forecastStability = volatility.stabilityScore;

  const compare = compareForecasts(
    previous,
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
    lastForecastChange: previous ? compare.summary : null,
    days,
    hourly: forecast.hourly,
    volatility,
  };
}

/** @deprecated Use hasForecastDataChanged — kept for callers/tests. */
export function shouldPersistSnapshot(
  previous: ForecastSnapshot | null,
  next: ForecastSnapshot,
): boolean {
  if (!previous) return true;
  return hasForecastDataChanged(previous, next);
}
