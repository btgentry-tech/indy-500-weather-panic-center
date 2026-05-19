import { formatStationTime } from "./format";

/** GitHub Actions poll cadence */
export const POLL_INTERVAL_MINUTES = 15;

const INTERVAL_MS = POLL_INTERVAL_MINUTES * 60 * 1000;

export function pollCadenceLabel(): string {
  return `every ${POLL_INTERVAL_MINUTES} minutes`;
}

/**
 * Next expected poll: 15 minutes after the last check, advancing until after `now`.
 * Falls back to the next UTC :00/:15/:30/:45 boundary when no last check exists.
 */
export function nextPollTime(
  now = new Date(),
  lastCheckedAt: string | null = null,
): Date {
  if (lastCheckedAt) {
    const lastMs = new Date(lastCheckedAt).getTime();
    if (!Number.isNaN(lastMs)) {
      let nextMs = lastMs + INTERVAL_MS;
      while (nextMs <= now.getTime()) {
        nextMs += INTERVAL_MS;
      }
      return new Date(nextMs);
    }
  }

  return new Date(Math.ceil(now.getTime() / INTERVAL_MS) * INTERVAL_MS);
}

/** @deprecated Use nextPollTime */
export function nextPollTimeUtc(now = new Date()): Date {
  return nextPollTime(now, null);
}

export function formatNextPoll(
  now = new Date(),
  lastCheckedAt: string | null = null,
): string {
  return formatStationTime(nextPollTime(now, lastCheckedAt).toISOString());
}

/** @deprecated Use formatNextPoll */
export function formatNextPollUtc(now = new Date()): string {
  return formatNextPoll(now, null);
}
