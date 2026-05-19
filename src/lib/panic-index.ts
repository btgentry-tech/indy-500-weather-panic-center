import type {
  DayKey,
  NormalizedForecast,
  PanicIndexLevel,
  RaceDayForecast,
  StormRisk,
  TrendArrow,
} from "./types";
import { RACE_DAYS } from "./race-days";

/** 1 = low concern, 5 = high concern */
export const PANIC_INDEX_MOODS: Record<PanicIndexLevel, string> = {
  1: "Minimal threat. Backyard cookout conditions. Stable pattern. Panic systems idle.",
  2: "Minor concern. Small storm energy detected. Fans remain cautiously hydrated. Conditions worth monitoring.",
  3: "Moderate concern. Forecast confidence weakening. Pattern instability increasing. Contingency beers advised.",
  4: "High concern. Track drying equipment on standby. Atmospheric chaos entering the chat.",
  5: "Red alert. Every uncle in Indiana is now a meteorologist. Significant weather disruption possible.",
};

/** @deprecated Use PANIC_INDEX_MOODS */
export const DEFCON_MOODS = PANIC_INDEX_MOODS;

export const PANIC_INDEX_LABELS: Record<PanicIndexLevel, string> = {
  1: "calm",
  2: "watchful",
  3: "unsettled",
  4: "high concern",
  5: "maximum concern",
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

/** Higher index = higher human concern (5 worst, 1 calm). */
export function computePanicIndex(
  days: Record<DayKey, Pick<RaceDayForecast, "rainPct" | "stormRisk">>,
  largestRainSwing = 0,
): PanicIndexLevel {
  const race = days.raceDay;
  const raceRain = race.rainPct;
  const raceStorm = race.stormRisk;

  if (
    raceRain >= 75 &&
    raceStorm === "ACTIVE" &&
    largestRainSwing >= 15
  ) {
    return 5;
  }
  if (raceRain >= 60 || raceStorm === "ACTIVE") {
    return 4;
  }
  if (raceRain >= 40 || race.stormRisk === "ELEVATED") {
    return 3;
  }
  if (raceRain >= 20) {
    return 2;
  }
  return 1;
}

/** @deprecated Use computePanicIndex */
export const computeDefcon = computePanicIndex;

/** Convert pre-scale snapshots (inverted DEFCON-style) to current scale. */
export function normalizeLegacyPanicIndex(level: number): PanicIndexLevel {
  if (level >= 1 && level <= 5) {
    return (6 - level) as PanicIndexLevel;
  }
  return 3;
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

export function buildRaceDayRows(
  forecast: NormalizedForecast,
  previous?: Record<DayKey, RaceDayForecast>,
): Record<DayKey, RaceDayForecast> {
  const result = {} as Record<DayKey, RaceDayForecast>;

  for (const config of RACE_DAYS) {
    const day = forecast.days[config.key];
    const prev = previous?.[config.key];

    result[config.key] = {
      ...day,
      trend: computeTrend(day.rainPct, prev?.rainPct),
    };
  }

  return result;
}

export function getPanicIndexLabel(level: PanicIndexLevel): string {
  return `PANIC INDEX: ${level}/5`;
}

/** @deprecated Use getPanicIndexLabel */
export const getDefconLabel = getPanicIndexLabel;
