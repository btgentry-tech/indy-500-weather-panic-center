export const ALERTS_ARMED_KEY = "alerts-armed";

export const ALERTS_ARMED_EVENT = "indy-alerts-armed-changed";

export function isAlertsArmed(): boolean {
  if (typeof window === "undefined") return false;
  if (!("Notification" in window)) return false;
  return (
    Notification.permission === "granted" &&
    localStorage.getItem(ALERTS_ARMED_KEY) === "1"
  );
}

export function setAlertsArmed(armed: boolean): void {
  if (typeof window === "undefined") return;
  if (armed) {
    localStorage.setItem(ALERTS_ARMED_KEY, "1");
  } else {
    localStorage.removeItem(ALERTS_ARMED_KEY);
  }
  window.dispatchEvent(new Event(ALERTS_ARMED_EVENT));
  window.dispatchEvent(new Event("storage"));
}

export function notificationsSupported(): boolean {
  if (typeof window === "undefined") return false;
  return "Notification" in window && "serviceWorker" in navigator;
}
