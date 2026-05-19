import { AsciiHeader } from "@/components/AsciiHeader";
import { HistoryChartsClient } from "@/components/charts/HistoryChartsClient";
import { loadAllSnapshots } from "@/lib/data";

export const revalidate = 900;

export default async function HistoryPage() {
  const snapshots = await loadAllSnapshots();

  return (
    <>
      <AsciiHeader
        compact
        pageHint="How panic index and hourly rain shifted over time"
      />
      <section className="panel">
        <h2 className="panel-title">Forecast History</h2>
        <p className="status-line">
          {snapshots.length} revision(s) on record. Hover charts for full
          timestamps.
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
