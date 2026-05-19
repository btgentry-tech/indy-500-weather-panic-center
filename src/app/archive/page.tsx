import { AsciiHeader } from "@/components/AsciiHeader";
import { ARCHIVE_INCIDENTS } from "@/lib/archive-incidents";
import Link from "next/link";

export const dynamic = "force-static";

export default function ArchivePage() {
  return (
    <>
      <AsciiHeader compact pageHint="Historic Indy 500 weather incidents" />
      <section className="panel">
        <h2 className="panel-title">Atmospheric Incident Archive</h2>
        <p className="status-line">
          Documented race-week weather disruptions at Indianapolis Motor
          Speedway. Unofficial reference — verify against primary sources.
        </p>
        <ul className="archive-list">
          {ARCHIVE_INCIDENTS.map((incident) => (
            <li key={incident.year} className="archive-item">
              <span className="archive-year">{incident.year}</span>
              <strong className="archive-title">{incident.title}</strong>
              <p className="archive-note">{incident.note}</p>
            </li>
          ))}
        </ul>
        <p className="status-line">
          <Link href="/">Return to dashboard</Link>
        </p>
      </section>
    </>
  );
}
