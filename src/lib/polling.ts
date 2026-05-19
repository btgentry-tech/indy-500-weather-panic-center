/** Vercel Cron poll cadence */
export const POLL_INTERVAL_MINUTES = 15;

export function pollCadenceLabel(): string {
  return `every ${POLL_INTERVAL_MINUTES} minutes (UTC)`;
}

/** Next poll boundary in UTC (15-minute grid) */
export function nextPollTimeUtc(now = new Date()): Date {
  const intervalMs = POLL_INTERVAL_MINUTES * 60 * 1000;
  return new Date(Math.ceil(now.getTime() / intervalMs) * intervalMs);
}

export function formatNextPollUtc(now = new Date()): string {
  const next = nextPollTimeUtc(now);
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZoneName: "short",
  }).format(next);
}
