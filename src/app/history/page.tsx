import { AsciiHeader } from "@/components/AsciiHeader";
import { HistoryChartsClient } from "@/components/charts/HistoryChartsClient";
import { loadAllSnapshots } from "@/lib/data";

export const dynamic = "force-static";

export default async function HistoryPage() {
  const snapshots = await loadAllSnapshots();

  return (
    <>
      <AsciiHeader />
      <section className="panel">
        <h2 className="panel-title">Forecast History Charts</h2>
        <p className="status-line">
          {snapshots.length} snapshot(s) on record. Forecast confidence may
          deteriorate without warning.
        </p>
      </section>
      {snapshots.length === 0 ? (
        <p className="status-line">No chart data available.</p>
      ) : (
        <HistoryChartsClient snapshots={snapshots} />
      )}
    </>
  );
}
