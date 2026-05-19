export const ALERTS_ARMED_KEY = "alerts-armed";

export function isAlertsArmed(): boolean {
  if (typeof window === "undefined") return false;
  return (
    Notification.permission === "granted" &&
    localStorage.getItem(ALERTS_ARMED_KEY) === "1"
  );
}
