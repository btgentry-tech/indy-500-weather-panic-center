const TZ = "America/Indiana/Indianapolis";

export function formatStationTime(iso: string): string {
  const date = new Date(iso);
  return new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZoneName: "short",
  }).format(date);
}

export function formatFeedTime(iso: string): string {
  const date = new Date(iso);
  return new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

export function formatFeedDayKey(iso: string): string {
  const date = new Date(iso);
  return new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    day: "numeric",
    month: "short",
    year: "numeric",
  })
    .format(date)
    .toUpperCase();
}

export function formatChartLabel(iso: string): string {
  const date = new Date(iso);
  return new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

export function formatIncidentTime(iso: string): string {
  const date = new Date(iso);
  const day = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    month: "short",
    day: "numeric",
  })
    .format(date)
    .toUpperCase();
  const time = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZoneName: "short",
  }).format(date);
  return `${day} — ${time}`;
}

export function formatClockNow(): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  }).format(new Date());
}

/** Clock hour on event-day chart axis (e.g. 6 → "6:00 AM"). */
export function formatEventWindowHour(hour: number): string {
  const padded = hour.toString().padStart(2, "0");
  const date = new Date(`2026-05-22T${padded}:00:00-04:00`);
  return new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}
