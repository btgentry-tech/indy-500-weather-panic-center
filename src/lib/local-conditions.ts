import type { LocalConditions } from "./types";

const CARDINALS = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"] as const;

export function celsiusToF(celsius: number): number {
  return Math.round((celsius * 9) / 5 + 32);
}

export function metersPerSecToMph(ms: number): number {
  return Math.round(ms * 2.23694);
}

export function degreesToCardinal(degrees: number): string {
  const index = Math.round(degrees / 45) % 8;
  return CARDINALS[index] ?? "N";
}

export function normalizeConditionText(text: string | null | undefined): string | null {
  if (!text?.trim()) return null;
  return text.trim().replace(/\s+/g, " ").toUpperCase();
}

export function formatWindPhrase(
  direction: string | null,
  speedMph: number | null,
): string | null {
  if (direction && speedMph != null) {
    return `WIND ${direction} ${speedMph} MPH`;
  }
  if (speedMph != null) return `WIND ${speedMph} MPH`;
  return null;
}

export function hasDisplayableConditions(
  conditions: LocalConditions | null | undefined,
): boolean {
  if (!conditions) return false;
  return (
    conditions.temperatureF != null ||
    Boolean(conditions.condition) ||
    conditions.windSpeedMph != null
  );
}
