import type {
  CompareResult,
  ChangelogSeverity,
  DayKey,
  ForecastSnapshot,
  NormalizedForecast,
  PanicIndexLevel,
  RaceDayForecast,
  StormRisk,
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

interface ScoredLine {
  score: number;
  text: string;
}

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

function rainChangeLine(
  label: string,
  prevRain: number,
  nextRain: number,
): ScoredLine | null {
  const delta = nextRain - prevRain;
  if (delta === 0) return null;

  const abs = Math.abs(delta);
  const score = abs * 2 + (abs >= RAIN_MAJOR_THRESHOLD ? 24 : 0);

  if (delta > 0) {
    if (abs >= 10) {
      return {
        score,
        text: `${label} conditions worsened as rain odds climbed ${abs}%.`,
      };
    }
    return {
      score,
      text: `${label} rain chances ticked upward.`,
    };
  }

  if (abs >= 10) {
    return {
      score,
      text: `${label} rain chance dropped ${abs}%.`,
    };
  }
  return {
    score,
    text: `${label} improving — rain odds easing.`,
  };
}

function stormRiskLine(
  label: string,
  prev: StormRisk,
  next: StormRisk,
): ScoredLine | null {
  if (prev === next) return null;

  const flipped =
    hasStormWording(prev) !== hasStormWording(next);
  let score = flipped ? 28 : 12;

  if (next === "NONE") {
    return { score, text: `${label} storm threat easing.` };
  }
  if (prev === "NONE" && next === "ELEVATED") {
    return { score, text: `${label} storm risk building.` };
  }
  if (prev === "NONE" && next === "ACTIVE") {
    return { score, text: `${label} thunderstorm risk upgraded.` };
  }
  if (prev === "ACTIVE" && next !== "ACTIVE") {
    return {
      score,
      text: `${label} stabilizing. Thunderstorm wording downgraded.`,
    };
  }
  if (next === "ACTIVE") {
    return { score, text: `${label} conditions worsened — storm risk upgraded.` };
  }
  return { score, text: `${label} storm language adjusted.` };
}

function combineOperationalLines(lines: ScoredLine[]): string {
  if (lines.length === 0) return "";

  const ranked = [...lines].sort((a, b) => b.score - a.score);
  const primary = ranked[0];
  const secondary = ranked[1];

  if (!secondary || secondary.score < 8) {
    return primary.text;
  }

  if (secondary.score < primary.score * 0.45) {
    return primary.text;
  }

  const second = secondary.text;
  const needsPeriod =
    primary.text.endsWith(".") || primary.text.endsWith("!");
  const joiner = needsPeriod ? " " : ". ";
  return `${primary.text}${joiner}${second}`;
}

function buildOperationalSummary(
  previous: ForecastSnapshot,
  currentDays: Record<DayKey, RaceDayForecast>,
  currentHourly: NormalizedForecast["hourly"],
  panicIndex: PanicIndexLevel,
  previousPanicIndex: PanicIndexLevel | undefined,
  severityRef: { current: ChangelogSeverity },
): string {
  const lines: ScoredLine[] = [];
  let rainWorsening = 0;
  let rainImproving = 0;

  for (const config of RACE_DAYS) {
    const key = config.key;
    const prevDay = previous.days[key];
    const nextDay = currentDays[key];
    const delta = nextDay.rainPct - prevDay.rainPct;

    if (delta > 0) rainWorsening += 1;
    if (delta < 0) rainImproving += 1;

    const rain = rainChangeLine(config.label, prevDay.rainPct, nextDay.rainPct);
    if (rain) lines.push(rain);

    const storm = stormRiskLine(
      config.label,
      prevDay.stormRisk,
      nextDay.stormRisk,
    );
    if (storm) {
      lines.push(storm);
      if (storm.score >= 24) severityRef.current = "warning";
    }
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
    lines.push({
      score: 26,
      text: earlier
        ? "Storm window shifted earlier."
        : "Storm window shifted later.",
    });
    severityRef.current = "warning";
  }

  const indexChanged =
    previousPanicIndex !== undefined && previousPanicIndex !== panicIndex;

  if (indexChanged) {
    const rising = panicIndex > previousPanicIndex!;
    lines.push({
      score: 32,
      text: rising
        ? `Overall concern rising — panic index now ${panicIndex}/5.`
        : `Overall concern easing — panic index now ${panicIndex}/5.`,
    });
    severityRef.current = panicIndex >= 4 ? "alert" : "warning";
  }

  if (lines.length === 0 && hourlyRevisionNote(previous, currentHourly)) {
    return "Hourly slots reshuffled. Timing details still in flux.";
  }

  if (lines.length === 0) {
    return minorEditorialSummary(panicIndex);
  }

  const topScore = lines.reduce((max, line) => Math.max(max, line.score), 0);
  if (rainImproving >= 2 && rainWorsening === 0 && topScore < 30) {
    const raceVolatile = currentDays.raceDay.rainPct >= 40;
    if (raceVolatile) {
      return "Weekend outlook steadier overall. Race Day remains volatile.";
    }
    return "Weekend outlook steadier overall.";
  }

  if (rainWorsening >= 2 && rainImproving === 0) {
    const lead = combineOperationalLines(lines);
    if (!lead.toLowerCase().includes("weekend")) {
      return `Weekend rain risk climbing. ${lead}`;
    }
  }

  return combineOperationalLines(lines);
}

/**
 * Compares consecutive NOAA polls. Any grid delta is a forecast refresh (snapshot,
 * changelog, push). `isMajorChange` is editorial only — stronger copy and the
 * “latest operational update” timestamp, not whether the app updated.
 */
export function compareForecasts(
  previous: ForecastSnapshot | null,
  currentDays: Record<DayKey, RaceDayForecast>,
  currentHourly: NormalizedForecast["hourly"],
  panicIndex: PanicIndexLevel,
  previousPanicIndex?: PanicIndexLevel,
): CompareResult {
  const details: string[] = [];
  const severityRef: { current: ChangelogSeverity } = { current: "info" };

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

    if (prevDay.stormRisk !== nextDay.stormRisk) {
      details.push(
        `${config.label} storm risk ${prevDay.stormRisk} → ${nextDay.stormRisk}.`,
      );
      if (
        hasStormWording(prevDay.stormRisk) !== hasStormWording(nextDay.stormRisk)
      ) {
        severityRef.current = "warning";
      }
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
    severityRef.current = "warning";
  }

  const indexChanged =
    previousPanicIndex !== undefined && previousPanicIndex !== panicIndex;

  if (indexChanged) {
    details.push(`PANIC INDEX ${previousPanicIndex} → ${panicIndex}.`);
    severityRef.current = panicIndex >= 4 ? "alert" : "warning";
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

  const summary = buildOperationalSummary(
    previous,
    currentDays,
    currentHourly,
    panicIndex,
    previousPanicIndex,
    severityRef,
  );

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
    severity: severityRef.current,
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
