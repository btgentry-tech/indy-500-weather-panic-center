import {
  celsiusToF,
  degreesToCardinal,
  metersPerSecToMph,
  normalizeConditionText,
} from "./local-conditions";
import { IMS_LAT, IMS_LON, RACE_DAYS } from "./race-days";
import { detectStormRisk } from "./panic-index";
import type {
  DayKey,
  HourlyPoint,
  LocalConditions,
  NormalizedForecast,
} from "./types";

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
    observationStations: string;
  };
}

interface NoaaStationsResponse {
  features: Array<{ id: string }>;
}

interface NoaaQuantity {
  value: number | null;
  unitCode?: string;
}

interface NoaaObservationResponse {
  properties: {
    timestamp: string | null;
    temperature: NoaaQuantity | null;
    textDescription: string | null;
    windDirection: NoaaQuantity | null;
    windSpeed: NoaaQuantity | null;
  };
}

async function noaaFetch<T>(
  url: string,
  revalidateSeconds = 0,
): Promise<T> {
  const res = await fetch(url, {
    headers: {
      Accept: "application/geo+json",
      "User-Agent": getNoaaUserAgent(),
    },
    next: { revalidate: revalidateSeconds },
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

function parseObservation(
  observation: NoaaObservationResponse,
): LocalConditions | null {
  const { properties } = observation;
  const tempC = properties.temperature?.value;
  const windDeg = properties.windDirection?.value;
  const windMs = properties.windSpeed?.value;

  const temperatureF =
    tempC != null && Number.isFinite(tempC) ? celsiusToF(tempC) : null;
  const condition = normalizeConditionText(properties.textDescription);
  const windDirection =
    windDeg != null && Number.isFinite(windDeg)
      ? degreesToCardinal(windDeg)
      : null;
  const windSpeedMph =
    windMs != null && Number.isFinite(windMs) ? metersPerSecToMph(windMs) : null;

  if (temperatureF == null && !condition && windSpeedMph == null) {
    return null;
  }

  return {
    temperatureF,
    condition,
    windDirection,
    windSpeedMph,
    observedAt: properties.timestamp,
  };
}

function conditionsFromHourlyPeriod(period: NoaaPeriod): LocalConditions {
  return {
    temperatureF: Number.isFinite(period.temperature) ? period.temperature : null,
    condition: normalizeConditionText(period.shortForecast),
    windDirection: null,
    windSpeedMph: null,
    observedAt: period.startTime,
  };
}

export async function fetchLocalConditions(
  revalidateSeconds = 0,
): Promise<LocalConditions | null> {
  const points = await noaaFetch<NoaaPointsResponse>(
    `${NOAA_BASE}/points/${IMS_LAT},${IMS_LON}`,
    revalidateSeconds,
  );

  try {
    const stations = await noaaFetch<NoaaStationsResponse>(
      points.properties.observationStations,
      revalidateSeconds,
    );
    const stationUrl = stations.features[0]?.id;
    if (stationUrl) {
      const observation = await noaaFetch<NoaaObservationResponse>(
        `${stationUrl}/observations/latest`,
        revalidateSeconds,
      );
      const parsed = parseObservation(observation);
      if (parsed) return parsed;
    }
  } catch (error) {
    console.warn("NOAA observation fetch failed, using hourly fallback:", error);
  }

  const hourly = await noaaFetch<NoaaHourlyResponse>(
    points.properties.forecastHourly,
    revalidateSeconds,
  );
  const current = hourly.properties.periods[0];
  return current ? conditionsFromHourlyPeriod(current) : null;
}

export async function fetchLocalConditionsSafe(
  revalidateSeconds = 0,
): Promise<LocalConditions | null> {
  try {
    return await fetchLocalConditions(revalidateSeconds);
  } catch (error) {
    console.error("Local conditions fetch failed:", error);
    return null;
  }
}
