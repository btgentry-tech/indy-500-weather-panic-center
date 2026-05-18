import type { DayKey } from "./types";

export const IMS_LAT = 39.795;
export const IMS_LON = -86.2347;

export const POLLING_START = "2026-04-01";
export const POLLING_END = "2026-05-31";

export const FCM_TOPIC_DEFAULT = "indy-panic";

export interface RaceDayConfig {
  key: DayKey;
  label: string;
  date: string;
  windowStartHour: number;
  windowEndHour: number;
  /** Race Day green-flag window gets extra weight in timing analysis */
  priorityStartHour?: number;
  priorityEndHour?: number;
}

export const RACE_DAYS: RaceDayConfig[] = [
  {
    key: "carbDay",
    label: "Carb Day",
    date: "2026-05-22",
    windowStartHour: 8,
    windowEndHour: 18,
  },
  {
    key: "legendsDay",
    label: "Legends Day",
    date: "2026-05-23",
    windowStartHour: 8,
    windowEndHour: 18,
  },
  {
    key: "raceDay",
    label: "Race Day",
    date: "2026-05-24",
    windowStartHour: 6,
    windowEndHour: 18,
    priorityStartHour: 12,
    priorityEndHour: 16,
  },
];

export function getRaceDayByKey(key: DayKey): RaceDayConfig {
  const day = RACE_DAYS.find((d) => d.key === key);
  if (!day) throw new Error(`Unknown race day key: ${key}`);
  return day;
}

export function isWithinPollingWindow(date = new Date()): boolean {
  const iso = date.toISOString().slice(0, 10);
  return iso >= POLLING_START && iso <= POLLING_END;
}

export function formatSnapshotId(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Indiana/Indianapolis",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "00";

  return `${get("year")}-${get("month")}-${get("day")}-${get("hour")}${get("minute")}`;
}
