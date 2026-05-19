import { CHART_COLORS } from "./chart-colors";
import { RACE_DAYS } from "./race-days";
import type { DayKey, ForecastSnapshot, HourlyPoint } from "./types";

function rainAtHour(
  hourly: HourlyPoint[],
  date: string,
  hour: number,
): number | null {
  const match = hourly.find((h) => {
    if (!h.time.includes(date)) return false;
    const hHour = Number.parseInt(h.time.slice(11, 13), 10);
    return hHour === hour;
  });
  return match?.rainPct ?? null;
}

/** Shared clock-hour axis spanning all event windows (e.g. 06:00–18:00). */
function sharedWindowHours(): number[] {
  const start = Math.min(...RACE_DAYS.map((d) => d.windowStartHour));
  const end = Math.max(...RACE_DAYS.map((d) => d.windowEndHour));
  const hours: number[] = [];
  for (let h = start; h <= end; h += 1) {
    hours.push(h);
  }
  return hours;
}

function formatHourLabel(hour: number): string {
  return `${hour.toString().padStart(2, "0")}:00`;
}

function seriesForDay(
  hourly: HourlyPoint[],
  key: DayKey,
  hours: number[],
): (number | null)[] {
  const config = RACE_DAYS.find((d) => d.key === key);
  if (!config) return hours.map(() => null);

  return hours.map((hour) => {
    if (hour < config.windowStartHour || hour > config.windowEndHour) {
      return null;
    }
    return rainAtHour(hourly, config.date, hour);
  });
}

export function hasEventDayHourlyData(snapshot: ForecastSnapshot): boolean {
  const hours = sharedWindowHours();
  return RACE_DAYS.some((config) =>
    hours.some(
      (hour) =>
        hour >= config.windowStartHour &&
        hour <= config.windowEndHour &&
        rainAtHour(snapshot.hourly, config.date, hour) !== null,
    ),
  );
}

export function buildEventDayPrecipitationChartData(snapshot: ForecastSnapshot) {
  const hours = sharedWindowHours();
  const labels = hours.map(formatHourLabel);

  return {
    labels,
    datasets: [
      {
        label: "Carb Day Rain %",
        data: seriesForDay(snapshot.hourly, "carbDay", hours),
        borderColor: CHART_COLORS.green,
        backgroundColor: "transparent",
        tension: 0.2,
        spanGaps: false,
      },
      {
        label: "Legends Day Rain %",
        data: seriesForDay(snapshot.hourly, "legendsDay", hours),
        borderColor: CHART_COLORS.amber,
        backgroundColor: "transparent",
        tension: 0.2,
        spanGaps: false,
      },
      {
        label: "Race Day Rain %",
        data: seriesForDay(snapshot.hourly, "raceDay", hours),
        borderColor: CHART_COLORS.red,
        backgroundColor: "transparent",
        tension: 0.2,
        spanGaps: false,
      },
    ],
  };
}
