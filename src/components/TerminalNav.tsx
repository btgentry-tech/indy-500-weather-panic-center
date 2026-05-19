"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  ALERTS_ARMED_EVENT,
  isAlertsArmed,
  notificationsSupported,
} from "@/lib/alerts-storage";
import { disableAppAlerts, enableAppAlerts } from "@/lib/alerts-fcm";
import { AlertsConfirmModal } from "@/components/AlertsConfirmModal";

const LINKS = [
  { href: "/", label: "DASHBOARD" },
  { href: "/history", label: "HISTORY" },
  { href: "/timeline", label: "TIMELINE" },
  { href: "/archive", label: "ARCHIVE" },
] as const;

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname.startsWith(href);
}

export function TerminalNav() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [alertsArmed, setAlertsArmed] = useState(false);
  const [supported, setSupported] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [navError, setNavError] = useState("");

  const refreshArmed = useCallback(() => {
    setSupported(notificationsSupported());
    setAlertsArmed(isAlertsArmed());
  }, []);

  useEffect(() => {
    refreshArmed();
    const onUpdate = () => refreshArmed();
    window.addEventListener("storage", onUpdate);
    window.addEventListener(ALERTS_ARMED_EVENT, onUpdate);
    const interval = setInterval(refreshArmed, 2000);
    return () => {
      window.removeEventListener("storage", onUpdate);
      window.removeEventListener(ALERTS_ARMED_EVENT, onUpdate);
      clearInterval(interval);
    };
  }, [refreshArmed]);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  async function handleActivate() {
    setBusy(true);
    setNavError("");
    try {
      await enableAppAlerts();
      refreshArmed();
    } catch (error) {
      setNavError(
        error instanceof Error ? error.message : "Could not enable alerts.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleConfirmDisable() {
    setBusy(true);
    setNavError("");
    const { serverError } = await disableAppAlerts();
    setConfirmOpen(false);
    refreshArmed();
    if (serverError) {
      setNavError(`Disabled locally. Unsubscribe failed: ${serverError}`);
    }
    setBusy(false);
  }

  function renderAlertsStatus() {
    if (!supported) return null;

    if (alertsArmed) {
      return (
        <span className="nav-alerts-status">
          Alerts: Active{" "}
          <button
            type="button"
            className="nav-alerts-link"
            onClick={() => setConfirmOpen(true)}
            disabled={busy}
          >
            [disable?]
          </button>
        </span>
      );
    }

    return (
      <span className="nav-alerts-status">
        Alerts: Disabled{" "}
        <button
          type="button"
          className="nav-alerts-link"
          onClick={handleActivate}
          disabled={busy}
        >
          [activate?]
        </button>
      </span>
    );
  }

  return (
    <>
      <nav className="nav" aria-label="Main navigation">
        <button
          type="button"
          className="nav-menu-toggle"
          onClick={() => setMenuOpen((v) => !v)}
          aria-expanded={menuOpen}
          aria-controls="nav-links"
        >
          [ MENU ]
        </button>
        <div
          id="nav-links"
          className={`nav-links ${menuOpen ? "nav-links-open" : ""}`}
        >
          {LINKS.map(({ href, label }) => {
            const active = isActive(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                className={active ? "nav-link nav-link-active" : "nav-link"}
                aria-current={active ? "page" : undefined}
              >
                {active ? `[> ${label}]` : `[  ${label} ]`}
              </Link>
            );
          })}
          {renderAlertsStatus()}
          {navError ? (
            <span className="nav-alerts-error">{navError}</span>
          ) : null}
        </div>
      </nav>
      <AlertsConfirmModal
        open={confirmOpen}
        busy={busy}
        onConfirm={handleConfirmDisable}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  );
}
