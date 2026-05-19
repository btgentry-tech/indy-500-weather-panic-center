"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { isAlertsArmed } from "@/lib/alerts-storage";

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
  const [briefingOpen, setBriefingOpen] = useState(false);
  const [alertsArmed, setAlertsArmed] = useState(false);

  const refreshArmed = useCallback(() => {
    setAlertsArmed(isAlertsArmed());
  }, []);

  useEffect(() => {
    refreshArmed();
    const onStorage = () => refreshArmed();
    window.addEventListener("storage", onStorage);
    const interval = setInterval(refreshArmed, 2000);
    return () => {
      window.removeEventListener("storage", onStorage);
      clearInterval(interval);
    };
  }, [refreshArmed]);

  return (
    <>
      <nav className="nav" aria-label="Main navigation">
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
        <button
          type="button"
          className="nav-link nav-btn-briefing"
          onClick={() => setBriefingOpen((v) => !v)}
          aria-expanded={briefingOpen}
        >
          [ ? briefing ]
        </button>
        {alertsArmed && (
          <span className="nav-alerts-armed">ALERTS ARMED</span>
        )}
      </nav>
      {briefingOpen && <BriefingDrawerForced onClose={() => setBriefingOpen(false)} />}
    </>
  );
}

function BriefingDrawerForced({ onClose }: { onClose: () => void }) {
  return (
    <section className="panel briefing-drawer" aria-label="Station briefing">
      <h2 className="panel-title">Briefing</h2>
      <p>
        Race-week forecast watch for Indianapolis Motor Speedway. Tracks rain
        chances, storm timing, and how often NOAA revises the forecast.
      </p>
      <ul className="intro-list">
        <li>
          <strong>Dashboard</strong> — panic index, race day rain, recent
          changes.
        </li>
        <li>
          <strong>History</strong> — charts of forecast evolution.
        </li>
        <li>
          <strong>Timeline</strong> — incident log of each snapshot.
        </li>
        <li>
          <strong>Archive</strong> — historic Indy weather lore (coming).
        </li>
      </ul>
      <button type="button" className="btn-terminal btn-dismiss" onClick={onClose}>
        [ Close Briefing ]
      </button>
    </section>
  );
}
