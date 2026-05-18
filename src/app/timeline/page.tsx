import { AsciiHeader } from "@/components/AsciiHeader";
import { loadAllSnapshots } from "@/lib/data";
import { summarizeSnapshotDelta } from "@/lib/volatility";

export const dynamic = "force-static";

export default async function TimelinePage() {
  const snapshots = await loadAllSnapshots();
  const reversed = [...snapshots].reverse();

  return (
    <>
      <AsciiHeader />
      <section className="panel">
        <h2 className="panel-title">Forecast Snapshot Timeline</h2>
        <p className="status-line">
          git log --oneline --graph --decorate --all (weather edition)
        </p>
        {reversed.length === 0 ? (
          <p>No snapshots committed.</p>
        ) : (
          reversed.map((snap, index) => {
            const previous = reversed[index + 1];
            const summary = previous
              ? summarizeSnapshotDelta(previous, snap)
              : "Initial commit";

            return (
              <details key={snap.id} className="timeline-row">
                <summary>
                  [{snap.id.replace("T", " ").slice(0, 16)}] {summary}
                </summary>
                <div className="timeline-detail">
                  <p>DEFCON {snap.defcon} — {snap.mood}</p>
                  <p>Panic meter: {snap.panicMeter}</p>
                  <p>Carb {snap.days.carbDay.rainPct}% | Legends{" "}
                  {snap.days.legendsDay.rainPct}% | Race{" "}
                  {snap.days.raceDay.rainPct}%</p>
                  <p>NOAA generated: {snap.noaaGeneratedAt}</p>
                </div>
              </details>
            );
          })
        )}
      </section>
    </>
  );
}
