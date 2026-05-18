import type {
  DayKey,
  DefconLevel,
  ForecastConfidence,
  NormalizedForecast,
  RaceDayForecast,
  StormRisk,
  TrendArrow,
} from "./types";
import { RACE_DAYS } from "./race-days";

export const DEFCON_MOODS: Record<DefconLevel, string> = {
  5: "Ideal grilling weather",
  4: "Minor atmospheric nonsense",
  3: "Monitoring situation",
  2: "Dangerous moisture developments",
  1: "Race control pacing internally",
};

const STORM_WEIGHT: Record<StormRisk, number> = {
  NONE: 0,
  ELEVATED: 12,
  ACTIVE: 24,
};

export function detectStormRisk(text: string): StormRisk {
  const lower = text.toLowerCase();
  if (
    lower.includes("thunderstorm") ||
    lower.includes("severe") ||
    lower.includes("tsra")
  ) {
    return "ACTIVE";
  }
  if (
    lower.includes("storm") ||
    lower.includes("lightning") ||
    lower.includes("hail")
  ) {
    return "ELEVATED";
  }
  return "NONE";
}

export function computeDefcon(
  days: Record<DayKey, Pick<RaceDayForecast, "rainPct" | "stormRisk">>,
  largestRainSwing = 0,
): DefconLevel {
  const race = days.raceDay;
  const raceRain = race.rainPct;
  const raceStorm = race.stormRisk;

  if (
    raceRain >= 75 &&
    raceStorm === "ACTIVE" &&
    largestRainSwing >= 15
  ) {
    return 1;
  }
  if (raceRain >= 60 || raceStorm === "ACTIVE") {
    return 2;
  }
  if (raceRain >= 40 || race.stormRisk === "ELEVATED") {
    return 3;
  }
  if (raceRain >= 20) {
    return 4;
  }
  return 5;
}

export function computePanicMeter(
  days: Record<DayKey, Pick<RaceDayForecast, "rainPct" | "stormRisk">>,
  volatilityScore: number,
): number {
  const carb = days.carbDay.rainPct;
  const legends = days.legendsDay.rainPct;
  const race = days.raceDay.rainPct;

  const rainScore = Math.min(
    100,
    carb * 0.2 + legends * 0.3 + race * 0.5,
  );
  const stormScore =
    STORM_WEIGHT[days.carbDay.stormRisk] +
    STORM_WEIGHT[days.legendsDay.stormRisk] +
    STORM_WEIGHT[days.raceDay.stormRisk];

  return Math.round(
    Math.min(100, rainScore * 0.65 + stormScore * 0.2 + volatilityScore * 0.15),
  );
}

export function computeTrend(
  current: number,
  previous: number | undefined,
): TrendArrow {
  if (previous === undefined) return "→";
  const delta = current - previous;
  if (delta >= 5) return "↑";
  if (delta <= -5) return "↓";
  return "→";
}

export function computeConfidence(
  rainHistory: number[],
): ForecastConfidence {
  if (rainHistory.length < 2) return "UNCERTAIN";
  const deltas = rainHistory
    .slice(1)
    .map((v, i) => Math.abs(v - rainHistory[i]));
  const avgDelta = deltas.reduce((a, b) => a + b, 0) / deltas.length;
  const latest = rainHistory[rainHistory.length - 1];
  const prev = rainHistory[rainHistory.length - 2];
  if (avgDelta < 8) return "STABLE";
  if (latest > prev + 10) return "DETERIORATING";
  return "UNCERTAIN";
}

export function buildRaceDayRows(
  forecast: NormalizedForecast,
  previous?: Record<DayKey, RaceDayForecast>,
  rainHistory: number[] = [],
): Record<DayKey, RaceDayForecast> {
  const result = {} as Record<DayKey, RaceDayForecast>;

  for (const config of RACE_DAYS) {
    const day = forecast.days[config.key];
    const prev = previous?.[config.key];
    const confidence = computeConfidence([
      ...rainHistory,
      day.rainPct,
    ]);

    result[config.key] = {
      ...day,
      confidence,
      trend: computeTrend(day.rainPct, prev?.rainPct),
    };
  }

  return result;
}

export function getDefconLabel(level: DefconLevel): string {
  return `DEFCON ${level}`;
}
