import type {
  CompareResult,
  DayKey,
  DefconLevel,
  ForecastSnapshot,
  NormalizedForecast,
} from "./types";
import { DEFCON_MOODS } from "./defcon";
import { RACE_DAYS, getRaceDayByKey } from "./race-days";

const RAIN_THRESHOLD = 15;
const TIMING_SHIFT_HOURS = 2;

function hasStormWording(risk: string): boolean {
  return risk === "ACTIVE" || risk === "ELEVATED";
}

function findStormWindowStart(
  hourly: { time: string; hasStormWording: boolean; rainPct: number }[],
): Date | null {
  const stormHours = hourly.filter(
    (h) => h.hasStormWording || h.rainPct >= 40,
  );
  if (stormHours.length === 0) return null;
  return new Date(stormHours[0].time);
}

function timingShiftHours(
  prev: ForecastSnapshot | null,
  next: NormalizedForecast,
): number | null {
  if (!prev) return null;
  const prevStart = findStormWindowStart(prev.hourly);
  const nextStart = findStormWindowStart(next.hourly);
  if (!prevStart || !nextStart) return null;
  return Math.abs(nextStart.getTime() - prevStart.getTime()) / (1000 * 60 * 60);
}

export function compareForecasts(
  previous: ForecastSnapshot | null,
  currentDays: Record<DayKey, { rainPct: number; stormRisk: string }>,
  currentHourly: NormalizedForecast["hourly"],
  defcon: DefconLevel,
  previousDefcon?: DefconLevel,
): CompareResult {
  const details: string[] = [];
  let severity: CompareResult["severity"] = "info";
  const parts: string[] = [];

  if (!previous) {
    return {
      hasMeaningfulChange: true,
      details: ["Initial atmospheric baseline recorded."],
      severity: "info",
      summary: "Monitoring station online. Baseline forecast captured.",
      defconTo: defcon,
      notificationTitle: "Panic Center Online",
      notificationBody: `DEFCON ${defcon}. ${DEFCON_MOODS[defcon]}.`,
    };
  }

  let rainSwing = false;
  let improving = false;

  for (const config of RACE_DAYS) {
    const key = config.key;
    const prevRain = previous.days[key].rainPct;
    const nextRain = currentDays[key].rainPct;
    const delta = nextRain - prevRain;

    if (Math.abs(delta) >= RAIN_THRESHOLD) {
      rainSwing = true;
      const direction = delta > 0 ? "revised upward" : "revised downward";
      details.push(
        `${config.label} precipitation probability ${direction} (${prevRain}% → ${nextRain}%).`,
      );
      if (delta <= -RAIN_THRESHOLD) improving = true;
    }

    const prevStorm = hasStormWording(previous.days[key].stormRisk);
    const nextStorm = hasStormWording(currentDays[key].stormRisk);
    if (prevStorm !== nextStorm) {
      details.push(
        nextStorm
          ? `Thunderstorm language introduced for ${config.label}.`
          : `Thunderstorm language removed for ${config.label}.`,
      );
      severity = "warning";
    }
  }

  const shift = timingShiftHours(previous, {
    noaaGeneratedAt: "",
    days: currentDays as NormalizedForecast["days"],
    hourly: currentHourly,
  });

  if (shift !== null && shift >= TIMING_SHIFT_HOURS) {
    const prevStart = findStormWindowStart(previous.hourly);
    const nextStart = findStormWindowStart(currentHourly);
    const earlier =
      prevStart !== null &&
      nextStart !== null &&
      nextStart.getTime() < prevStart.getTime();
    details.push(
      earlier
        ? "Storm timing moved earlier."
        : "Storm timing moved later.",
    );
    severity = "warning";
    parts.push("Storm timing shifted.");
  }

  const defconChanged =
    previousDefcon !== undefined && previousDefcon !== defcon;

  if (defconChanged) {
    const direction = defcon < previousDefcon! ? "elevated" : "lowered";
    parts.push(`DEFCON ${direction} to ${defcon}.`);
    severity = defcon <= 2 ? "alert" : "warning";
    details.push(`DEFCON ${previousDefcon} → ${defcon}.`);
  }

  if (improving && !defconChanged) {
    parts.push("Forecast improving. Moisture retreating eastward.");
    severity = "info";
  } else if (rainSwing && defcon <= 3) {
    parts.push("Atmospheric instability increasing.");
    severity = "warning";
  }

  const hasMeaningfulChange =
    rainSwing ||
    defconChanged ||
    details.some((d) => d.includes("Thunderstorm")) ||
    (shift !== null && shift >= TIMING_SHIFT_HOURS);

  const summary =
    parts.length > 0
      ? parts.join(" ")
      : details[0] ?? "Forecast update recorded.";

  const notificationTitle = defconChanged
    ? `DEFCON ${defcon}`
    : "Forecast Update";

  const notificationBody =
    summary.length > 180 ? `${summary.slice(0, 177)}...` : summary;

  return {
    hasMeaningfulChange,
    details,
    severity,
    summary,
    defconFrom: defconChanged ? previousDefcon : undefined,
    defconTo: defconChanged ? defcon : undefined,
    notificationTitle,
    notificationBody,
  };
}

export function buildNotificationCopy(
  result: CompareResult,
): { title: string; body: string } {
  return {
    title: result.notificationTitle,
    body: result.notificationBody,
  };
}

export function dayLabel(key: DayKey): string {
  return getRaceDayByKey(key).label;
}
