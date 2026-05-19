import { POLL_INTERVAL_MINUTES } from "./polling";

/** Minutes after last check before we warn that automated polling may be down. */
export const POLL_STALE_MINUTES = POLL_INTERVAL_MINUTES * 2;

export function minutesSince(iso: string | null, now = new Date()): number | null {
  if (!iso) return null;
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return null;
  return Math.floor((now.getTime() - then) / 60_000);
}

export function isPollStale(
  lastCheckedAt: string | null,
  now = new Date(),
): boolean {
  const mins = minutesSince(lastCheckedAt, now);
  if (mins === null) return true;
  return mins >= POLL_STALE_MINUTES;
}
