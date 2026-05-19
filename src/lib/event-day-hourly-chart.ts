import { CHART_COLORS } from "./chart-colors";
import { RACE_DAYS } from "./race-days";
import type { ForecastSnapshot, HourlyPoint } from "./types";

const DAY_SHORT: Record<string, string> = {
  carbDay: "Carb",
  legendsDay: "Leg",
  raceDay: "Race",
};

function windowHourly(
  hourly: HourlyPoint[],
  date: string,
  startHour: number,
  endHour: number,
): HourlyPoint[] {
  return hourly
    .filter((h) => {
      if (!h.time.includes(date)) return false;
      const hour = Number.parseInt(h.time.slice(11, 13), 10);
      return hour >= startHour && hour <= endHour;
    })
    .sort((a, b) => a.time.localeCompare(b.time));
}

function axisLabel(time: string, dayShort: string): string {
  return `${dayShort} ${time.slice(11, 16)}`;
}

export function hasEventDayHourlyData(snapshot: ForecastSnapshot): boolean {
  return RACE_DAYS.some((config) => {
    const points = windowHourly(
      snapshot.hourly,
      config.date,
      config.windowStartHour,
      config.windowEndHour,
    );
    return points.length > 0;
  });
}

export function buildEventDayPrecipitationChartData(snapshot: ForecastSnapshot) {
  const labels: string[] = [];
  const carb: (number | null)[] = [];
  const legends: (number | null)[] = [];
  const race: (number | null)[] = [];

  for (const config of RACE_DAYS) {
    const points = windowHourly(
      snapshot.hourly,
      config.date,
      config.windowStartHour,
      config.windowEndHour,
    );
    const short = DAY_SHORT[config.key] ?? config.label;

    for (const point of points) {
      labels.push(axisLabel(point.time, short));
      carb.push(config.key === "carbDay" ? point.rainPct : null);
      legends.push(config.key === "legendsDay" ? point.rainPct : null);
      race.push(config.key === "raceDay" ? point.rainPct : null);
    }
  }

  return {
    labels,
    datasets: [
      {
        label: "Carb Day Rain %",
        data: carb,
        borderColor: CHART_COLORS.green,
        backgroundColor: "transparent",
        tension: 0.2,
        spanGaps: false,
      },
      {
        label: "Legends Day Rain %",
        data: legends,
        borderColor: CHART_COLORS.amber,
        backgroundColor: "transparent",
        tension: 0.2,
        spanGaps: false,
      },
      {
        label: "Race Day Rain %",
        data: race,
        borderColor: CHART_COLORS.red,
        backgroundColor: "transparent",
        tension: 0.2,
        spanGaps: false,
      },
    ],
  };
}
