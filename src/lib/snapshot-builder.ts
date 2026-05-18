import { compareForecasts } from "./compare";
import {
  buildRaceDayRows,
  computeDefcon,
  computePanicMeter,
  DEFCON_MOODS,
} from "./defcon";
import type { ForecastSnapshot, NormalizedForecast } from "./types";
import { computeForecastStability, computeVolatility } from "./volatility";
import { formatSnapshotId } from "./race-days";

export function buildSnapshot(
  forecast: NormalizedForecast,
  history: ForecastSnapshot[],
  fetchedAt = new Date(),
): ForecastSnapshot {
  const previous = history[history.length - 1];
  const id = formatSnapshotId(fetchedAt);

  const rainHistory = history
    .slice(-5)
    .map((s) => s.days.raceDay.rainPct);

  const days = buildRaceDayRows(forecast, previous?.days, rainHistory);

  const volatility = computeVolatility(history, { days });
  const defcon = computeDefcon(days, volatility.largestRainSwing);
  const panicMeter = computePanicMeter(days, volatility.volatilityScore);
  const forecastStability = computeForecastStability([
    ...history,
    {
      id,
      fetchedAt: fetchedAt.toISOString(),
      noaaGeneratedAt: forecast.noaaGeneratedAt,
      defcon,
      panicMeter,
      mood: DEFCON_MOODS[defcon],
      forecastStability: 0,
      lastForecastChange: null,
      days,
      hourly: forecast.hourly,
      volatility,
    },
  ]);

  const compare = compareForecasts(
    previous ?? null,
    days,
    forecast.hourly,
    defcon,
    previous?.defcon,
  );

  return {
    id,
    fetchedAt: fetchedAt.toISOString(),
    noaaGeneratedAt: forecast.noaaGeneratedAt,
    defcon,
    panicMeter,
    mood: DEFCON_MOODS[defcon],
    forecastStability,
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
  if (previous.defcon !== next.defcon) return true;

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
