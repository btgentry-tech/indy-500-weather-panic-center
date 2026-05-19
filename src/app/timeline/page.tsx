import { AsciiHeader } from "@/components/AsciiHeader";
import { IncidentReport } from "@/components/IncidentReport";
import { loadAllSnapshots } from "@/lib/data";

export const dynamic = "force-static";

export default async function TimelinePage() {
  const snapshots = await loadAllSnapshots();
  const reversed = [...snapshots].reverse();

  return (
    <>
      <AsciiHeader
        compact
        pageHint="Incident reports — expandable revision log"
      />
      <section className="panel">
        <h2 className="panel-title">Atmospheric Incident Log</h2>
        <p className="status-line">
          Tap an entry to expand details. Green = improving, red = worsening.
        </p>
        {reversed.length === 0 ? (
          <p>No incidents on record.</p>
        ) : (
          <div className="incident-list">
            {reversed.map((snap, index) => (
              <IncidentReport
                key={snap.id}
                snapshot={snap}
                previous={reversed[index + 1]}
              />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
