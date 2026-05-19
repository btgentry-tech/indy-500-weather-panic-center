"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  ALERTS_ARMED_EVENT,
  isAlertsArmed,
} from "@/lib/alerts-storage";

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

  const refreshArmed = useCallback(() => {
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

  return (
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
        {alertsArmed && (
          <span className="nav-alerts-armed">ALERTS ARMED</span>
        )}
      </div>
    </nav>
  );
}
