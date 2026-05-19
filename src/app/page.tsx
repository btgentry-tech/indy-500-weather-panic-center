import { AsciiHeader } from "@/components/AsciiHeader";
import { AlertSubscribePanel } from "@/components/AlertSubscribePanel";
import { ForecastTable } from "@/components/ForecastTable";
import { RainOverTimeChart } from "@/components/charts/RainOverTimeChart";
import { PanicHero } from "@/components/PanicHero";
import { compareForecasts } from "@/lib/compare";
import { loadAllSnapshots, loadLatestSnapshot } from "@/lib/data";

export const revalidate = 900;

export default async function DashboardPage() {
  const history = await loadAllSnapshots();
  const snapshot =
    history.length > 0
      ? history[history.length - 1]
      : await loadLatestSnapshot();

  if (!snapshot) {
    return (
      <>
        <AsciiHeader compact />
        <AlertSubscribePanel />
        <section className="panel">
          <p className="severity-alert">
            NO SNAPSHOT DATA. Wait for GitHub Actions (every 15 min) or run{" "}
            <code>npm run poll</code>.
          </p>
        </section>
      </>
    );
  }

  const previous = history.length >= 2 ? history[history.length - 2] : null;
  const revisionSummary = compareForecasts(
    previous,
    snapshot.days,
    snapshot.hourly,
    snapshot.panicIndex,
    previous?.panicIndex,
  ).summary;

  return (
    <>
      <AsciiHeader compact />
      <AlertSubscribePanel />
      <PanicHero snapshot={snapshot} revisionSummary={revisionSummary} />
      <ForecastTable snapshot={snapshot} previous={previous} />
      {history.length > 0 ? <RainOverTimeChart snapshots={history} /> : null}
    </>
  );
}
