import type {
  CompareResult,
  DayKey,
  ForecastSnapshot,
  NormalizedForecast,
  PanicIndexLevel,
  RaceDayForecast,
} from "./types";
import { PANIC_INDEX_MOODS } from "./panic-index";
import { RACE_DAYS, getRaceDayByKey } from "./race-days";

const RAIN_MAJOR_THRESHOLD = 15;
const TIMING_SHIFT_HOURS = 2;

/** Light FCM / editorial copy for routine NOAA grid revisions. */
const MINOR_FORECAST_SUMMARIES = [
  "Forecast refreshed. Minor NOAA revision detected.",
  "Atmospheric wobble detected. Forecast updated.",
  "New NOAA guidance received.",
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

function hourlyRevisionNote(
  previous: ForecastSnapshot,
  currentHourly: NormalizedForecast["hourly"],
): boolean {
  if (previous.hourly.length !== currentHourly.length) return true;
  for (let i = 0; i < previous.hourly.length; i++) {
    const prev = previous.hourly[i];
    const next = currentHourly[i];
    if (
      prev.rainPct !== next.rainPct ||
      prev.hasStormWording !== next.hasStormWording ||
      prev.shortForecast !== next.shortForecast
    ) {
      return true;
    }
  }
  return false;
}

function minorEditorialSummary(panicIndex: PanicIndexLevel): string {
  return MINOR_FORECAST_SUMMARIES[
    panicIndex % MINOR_FORECAST_SUMMARIES.length
  ];
}

/**
 * Compares consecutive NOAA polls. Every detected grid change is a real forecast
 * update (editorial, changelog, timestamps, notifications). `isMajorChange` only
 * selects stronger alert wording — not whether the update counts.
 */
export function compareForecasts(
  previous: ForecastSnapshot | null,
  currentDays: Record<DayKey, RaceDayForecast>,
  currentHourly: NormalizedForecast["hourly"],
  panicIndex: PanicIndexLevel,
  previousPanicIndex?: PanicIndexLevel,
): CompareResult {
  const details: string[] = [];
  let severity: CompareResult["severity"] = "info";
  const parts: string[] = [];

  if (!previous) {
    return {
      isMajorChange: true,
      details: ["Initial atmospheric baseline recorded."],
      severity: "info",
      summary: "Monitoring station online. Baseline forecast captured.",
      panicIndexTo: panicIndex,
      notificationTitle: "Panic Center Online",
      notificationBody: `PANIC INDEX: ${panicIndex}/5. ${PANIC_INDEX_MOODS[panicIndex]}.`,
    };
  }

  let rainMajorSwing = false;
  let improving = false;

  for (const config of RACE_DAYS) {
    const key = config.key;
    const prevDay = previous.days[key];
    const nextDay = currentDays[key];
    const prevRain = prevDay.rainPct;
    const nextRain = nextDay.rainPct;
    const delta = nextRain - prevRain;

    if (prevRain !== nextRain) {
      const direction = delta > 0 ? "up" : "down";
      details.push(
        `${config.label} rain ${prevRain}% → ${nextRain}% (${direction}).`,
      );
    }

    if (Math.abs(delta) >= RAIN_MAJOR_THRESHOLD) {
      rainMajorSwing = true;
      if (delta <= -RAIN_MAJOR_THRESHOLD) improving = true;
    }

    if (prevDay.trend !== nextDay.trend) {
      details.push(
        `${config.label} trend ${prevDay.trend} → ${nextDay.trend}.`,
      );
    }

    if (prevDay.highTemp !== nextDay.highTemp) {
      details.push(
        `${config.label} high ${prevDay.highTemp}° → ${nextDay.highTemp}°.`,
      );
    }

    if (prevDay.shortForecast !== nextDay.shortForecast) {
      details.push(`${config.label} forecast wording revised.`);
    }

    const prevStorm = hasStormWording(prevDay.stormRisk);
    const nextStorm = hasStormWording(nextDay.stormRisk);
    if (prevDay.stormRisk !== nextDay.stormRisk) {
      details.push(
        nextStorm
          ? `${config.label} storm risk elevated (${nextDay.stormRisk}).`
          : `${config.label} storm risk eased (${nextDay.stormRisk}).`,
      );
      if (prevStorm !== nextStorm) severity = "warning";
    }
  }

  if (hourlyRevisionNote(previous, currentHourly)) {
    details.push("Hourly forecast slots revised.");
  }

  const shift = timingShiftHours(previous, {
    noaaGeneratedAt: "",
    days: currentDays,
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
  } else if (rainMajorSwing && panicIndex >= 4) {
    parts.push("Atmospheric instability increasing.");
    severity = "warning";
  }

  const stormRiskFlipped = RACE_DAYS.some((config) => {
    const key = config.key;
    return (
      hasStormWording(previous.days[key].stormRisk) !==
      hasStormWording(currentDays[key].stormRisk)
    );
  });

  const isMajorChange =
    rainMajorSwing ||
    indexChanged ||
    stormRiskFlipped ||
    (shift !== null && shift >= TIMING_SHIFT_HOURS);

  let summary: string;
  if (parts.length > 0) {
    summary = parts.join(" ");
  } else if (details.length > 0) {
    summary = details.slice(0, 2).join(" ");
  } else {
    summary = minorEditorialSummary(panicIndex);
  }

  const notificationTitle = indexChanged
    ? `PANIC INDEX: ${panicIndex}/5`
    : "Forecast Update";

  const notificationBody = isMajorChange
    ? summary.length > 180
      ? `${summary.slice(0, 177)}...`
      : summary
    : minorEditorialSummary(panicIndex);

  return {
    isMajorChange,
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

/** FCM copy: dramatic alert for major/initial changes, lighter tone for routine revisions. */
export function buildForecastChangeNotification(
  compare: CompareResult,
  panicIndex: PanicIndexLevel,
  options: { isMajor: boolean; isInitial: boolean },
): { title: string; body: string } {
  if (options.isInitial || options.isMajor) {
    return buildNotificationCopy(compare);
  }

  return {
    title: "Forecast Update",
    body: minorEditorialSummary(panicIndex),
  };
}

export function dayLabel(key: DayKey): string {
  return getRaceDayByKey(key).label;
}
