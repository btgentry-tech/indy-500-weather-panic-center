import type {
  CompareResult,
  DayKey,
  ForecastSnapshot,
  NormalizedForecast,
  PanicIndexLevel,
} from "./types";
import { PANIC_INDEX_MOODS } from "./panic-index";
import { RACE_DAYS, getRaceDayByKey } from "./race-days";

const RAIN_THRESHOLD = 15;
const TIMING_SHIFT_HOURS = 2;

/** Light FCM body when the grid changed but editorial thresholds were not met. */
const MINOR_FORECAST_NOTIFICATION_BODIES = [
  "Forecast updated. Minor NOAA revision detected.",
  "Forecast refreshed. Small atmospheric wobble detected.",
] as const;

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

/**
 * Meaningful forecast change — higher bar for editorial summaries, changelog, and
 * "last meaningful change" timestamps (≥15% rain swing, panic index shift, storm
 * wording toggle, ≥2h storm-timing shift).
 *
 * Any forecast data change (`hasForecastDataChanged`) is a lower bar: any grid
 * field delta (rain, temp, storm risk, hourly slots, derived trends, panic index).
 * Push notifications fire on any data change, not only meaningful change.
 */
export function compareForecasts(
  previous: ForecastSnapshot | null,
  currentDays: Record<DayKey, { rainPct: number; stormRisk: string }>,
  currentHourly: NormalizedForecast["hourly"],
  panicIndex: PanicIndexLevel,
  previousPanicIndex?: PanicIndexLevel,
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
      panicIndexTo: panicIndex,
      notificationTitle: "Panic Center Online",
      notificationBody: `PANIC INDEX: ${panicIndex}/5. ${PANIC_INDEX_MOODS[panicIndex]}.`,
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

  const indexChanged =
    previousPanicIndex !== undefined && previousPanicIndex !== panicIndex;

  if (indexChanged) {
    const rising = panicIndex > previousPanicIndex!;
    if (rising) {
      parts.push(`PANIC INDEX elevated to ${panicIndex}.`);
    } else {
      parts.push(`PANIC INDEX eased to ${panicIndex}. Conditions improving.`);
    }
    severity = panicIndex >= 4 ? "alert" : "warning";
    details.push(`PANIC INDEX ${previousPanicIndex} → ${panicIndex}.`);
  }

  if (improving && !indexChanged) {
    parts.push("Forecast improving. Moisture retreating eastward.");
    severity = "info";
  } else if (rainSwing && panicIndex >= 4) {
    parts.push("Atmospheric instability increasing.");
    severity = "warning";
  }

  const hasMeaningfulChange =
    rainSwing ||
    indexChanged ||
    details.some((d) => d.includes("Thunderstorm")) ||
    (shift !== null && shift >= TIMING_SHIFT_HOURS);

  const summary =
    parts.length > 0
      ? parts.join(" ")
      : details[0] ?? "Forecast update recorded.";

  const notificationTitle = indexChanged
    ? `PANIC INDEX: ${panicIndex}/5`
    : "Forecast Update";

  const notificationBody =
    summary.length > 180 ? `${summary.slice(0, 177)}...` : summary;

  return {
    hasMeaningfulChange,
    details,
    severity,
    summary,
    panicIndexFrom: indexChanged ? previousPanicIndex : undefined,
    panicIndexTo: indexChanged ? panicIndex : undefined,
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

/** FCM copy: dramatic alert for meaningful/initial changes, lighter tone for minor grid revisions. */
export function buildForecastChangeNotification(
  compare: CompareResult,
  panicIndex: PanicIndexLevel,
  options: { meaningful: boolean; isInitial: boolean },
): { title: string; body: string } {
  if (options.isInitial || options.meaningful) {
    return buildNotificationCopy(compare);
  }

  const body =
    MINOR_FORECAST_NOTIFICATION_BODIES[
      panicIndex % MINOR_FORECAST_NOTIFICATION_BODIES.length
    ];
  return {
    title: "Forecast Update",
    body,
  };
}

export function dayLabel(key: DayKey): string {
  return getRaceDayByKey(key).label;
}
