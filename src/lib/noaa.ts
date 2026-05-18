import { IMS_LAT, IMS_LON, RACE_DAYS } from "./race-days";
import { detectStormRisk } from "./defcon";
import type { DayKey, HourlyPoint, NormalizedForecast } from "./types";

const NOAA_BASE = "https://api.weather.gov";

export function getNoaaUserAgent(): string {
  return (
    process.env.NOAA_USER_AGENT ??
    "(indy-500-weather-panic-center, https://github.com/indy-panic)"
  );
}

interface NoaaPeriod {
  startTime: string;
  endTime: string;
  isDaytime: boolean;
  temperature: number;
  probabilityOfPrecipitation?: { value: number | null };
  shortForecast: string;
  detailedForecast: string;
}

interface NoaaForecastResponse {
  properties: {
    generatedAt: string;
    updateTime: string;
    periods: NoaaPeriod[];
  };
}

interface NoaaHourlyResponse {
  properties: {
    periods: NoaaPeriod[];
  };
}

interface NoaaPointsResponse {
  properties: {
    forecast: string;
    forecastHourly: string;
  };
}

async function noaaFetch<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    headers: {
      Accept: "application/geo+json",
      "User-Agent": getNoaaUserAgent(),
    },
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    throw new Error(`NOAA request failed (${res.status}): ${url}`);
  }

  return res.json() as Promise<T>;
}

function popValue(period: NoaaPeriod): number {
  return period.probabilityOfPrecipitation?.value ?? 0;
}

function dateKey(iso: string): string {
  return iso.slice(0, 10);
}

function hourInLocal(iso: string): number {
  const d = new Date(iso);
  return Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Indiana/Indianapolis",
      hour: "numeric",
      hour12: false,
    }).format(d),
  );
}

function isInWindow(
  iso: string,
  date: string,
  startHour: number,
  endHour: number,
): boolean {
  if (dateKey(iso) !== date) return false;
  const hour = hourInLocal(iso);
  return hour >= startHour && hour < endHour;
}

export async function fetchNoaaForecast(): Promise<NormalizedForecast> {
  const points = await noaaFetch<NoaaPointsResponse>(
    `${NOAA_BASE}/points/${IMS_LAT},${IMS_LON}`,
  );

  const [forecast, hourly] = await Promise.all([
    noaaFetch<NoaaForecastResponse>(points.properties.forecast),
    noaaFetch<NoaaHourlyResponse>(points.properties.forecastHourly),
  ]);

  const periods = forecast.properties.periods;
  const hourlyPeriods = hourly.properties.periods;

  const days = {} as NormalizedForecast["days"];

  for (const config of RACE_DAYS) {
    const dayPeriods = periods.filter(
      (p) =>
        p.isDaytime &&
        dateKey(p.startTime) === config.date,
    );

    const rainPct = dayPeriods.reduce(
      (max, p) => Math.max(max, popValue(p)),
      0,
    );

    const combinedText = dayPeriods
      .map((p) => `${p.shortForecast} ${p.detailedForecast}`)
      .join(" ");

    const highTemp = dayPeriods.reduce(
      (max, p) => Math.max(max, p.temperature),
      0,
    );

    const primary = dayPeriods[0];

    days[config.key] = {
      label: config.label,
      date: config.date,
      rainPct,
      stormRisk: detectStormRisk(combinedText),
      highTemp,
      shortForecast: primary?.shortForecast ?? "No daytime period available",
      detailedForecast:
        primary?.detailedForecast ?? "Forecast period not yet issued.",
    };
  }

  const hourlyPoints: HourlyPoint[] = [];

  for (const config of RACE_DAYS) {
    for (const period of hourlyPeriods) {
      if (
        !isInWindow(
          period.startTime,
          config.date,
          config.windowStartHour,
          config.windowEndHour,
        )
      ) {
        continue;
      }

      const text = `${period.shortForecast} ${period.detailedForecast}`;
      hourlyPoints.push({
        time: period.startTime,
        rainPct: popValue(period),
        shortForecast: period.shortForecast,
        hasStormWording: detectStormRisk(text) !== "NONE",
      });
    }
  }

  return {
    noaaGeneratedAt:
      forecast.properties.generatedAt ?? forecast.properties.updateTime,
    days,
    hourly: hourlyPoints,
  };
}

export async function fetchNoaaForecastSafe(): Promise<NormalizedForecast | null> {
  try {
    return await fetchNoaaForecast();
  } catch (error) {
    console.error("NOAA fetch failed:", error);
    return null;
  }
}
