import type { ForecastSnapshot } from "@/lib/types";
import { formatIncidentTime } from "@/lib/format";
import { PANIC_INDEX_MOODS } from "@/lib/panic-index";
import {
  resolveSnapshotStabilityLevel,
  stabilityCssClass,
  stabilityDetailLine,
  stabilityLabel,
} from "@/lib/forecast-stability";
import {
  buildSnapshotRevision,
  incidentToneFromRevision,
} from "@/lib/incident-revision";
import { RaceWeekendTable } from "./RaceWeekendTable";

interface IncidentReportProps {
  snapshot: ForecastSnapshot;
  previous?: ForecastSnapshot;
}

export function IncidentReport({ snapshot, previous }: IncidentReportProps) {
  const revision = buildSnapshotRevision(previous ?? null, snapshot);
  const headline = revision.summary;
  const tone = incidentToneFromRevision(revision, previous);
  const stability = resolveSnapshotStabilityLevel(snapshot);
  const stabilityClass = stabilityCssClass(stability);

  return (
    <details className={`incident-report incident-${tone}`}>
      <summary className="incident-summary">
        <span className="incident-time">
          {formatIncidentTime(snapshot.fetchedAt)}
        </span>
        <span className="incident-headline">{headline}</span>
      </summary>
      <div className="incident-body">
        <section
          className={`incident-section panic-index-block panic-index-${snapshot.panicIndex}`}
          aria-label="Panic index at this revision"
        >
          <span className="field-label">Panic index</span>
          <p className="incident-panic-fraction">{snapshot.panicIndex}/5</p>
          <p className="hero-detail-line">
            {PANIC_INDEX_MOODS[snapshot.panicIndex]}
          </p>
          {revision.panicIndexFrom !== undefined &&
          revision.panicIndexTo !== undefined ? (
            <p className="hero-detail-line incident-index-shift">
              {revision.panicIndexTo > revision.panicIndexFrom
                ? `Overall concern rising — was ${revision.panicIndexFrom}/5 at prior poll.`
                : `Overall concern easing — was ${revision.panicIndexFrom}/5 at prior poll.`}
            </p>
          ) : null}
        </section>

        <section className="incident-section" aria-label="NOAA stability">
          <span className="field-label">Overall NOAA stability</span>
          <p className={`hero-stability-value ${stabilityClass}`}>
            {stabilityLabel(stability)}
          </p>
          <p className="hero-detail-line">{stabilityDetailLine(stability)}</p>
        </section>

        {previous ? (
          <section className="incident-section" aria-label="Operational update">
            <span className="field-label">Operational update</span>
            <p className="hero-detail-line">{revision.summary}</p>
            {revision.details.length > 0 ? (
              <ul className="incident-details">
                {revision.details.map((detail) => (
                  <li key={detail}>{detail}</li>
                ))}
              </ul>
            ) : null}
          </section>
        ) : null}

        <section
          className="incident-section incident-weekend"
          aria-label="Race weekend breakdown"
        >
          <span className="field-label">Race weekend breakdown</span>
          <p className="hero-detail-line">
            {previous
              ? "Per-event rain, storms, and poll-to-poll changes at this revision."
              : "Per-event rain, storms, and trends at baseline capture."}
          </p>
          <RaceWeekendTable snapshot={snapshot} previous={previous} />
        </section>
      </div>
    </details>
  );
}
