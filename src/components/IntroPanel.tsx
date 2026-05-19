"use client";

import { useEffect, useState } from "react";

const DISMISS_KEY = "intro-dismissed";

export function IntroPanel() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(localStorage.getItem(DISMISS_KEY) !== "1");
  }, []);

  if (!visible) return null;

  return (
    <section className="panel intro-panel" aria-label="Station briefing">
      <h2 className="panel-title">What Is This?</h2>
      <p>
        This monitoring station tracks forecast volatility for Indianapolis
        Motor Speedway during Indy 500 race week. Forecast revisions,
        atmospheric instability, precipitation timing shifts, and panic
        escalation events are archived in real time.
      </p>
      <p className="status-line">
        Unauthorized optimism discouraged.
      </p>
      <ul className="intro-list">
        <li>
          <strong>Dashboard</strong> — current race-weekend forecast and live
          panic index status.
        </li>
        <li>
          <strong>History</strong> — charts showing how rain %, panic index,
          and volatility evolved over time.
        </li>
        <li>
          <strong>Timeline</strong> — complete atmospheric event log (every
          forecast snapshot).
        </li>
      </ul>
      <button
        type="button"
        className="btn-terminal btn-dismiss"
        onClick={() => {
          localStorage.setItem(DISMISS_KEY, "1");
          setVisible(false);
        }}
      >
        [ Dismiss Briefing ]
      </button>
    </section>
  );
}
