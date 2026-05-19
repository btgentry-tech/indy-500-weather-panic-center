import { AsciiHeader } from "@/components/AsciiHeader";
import { AlertSubscribePanel } from "@/components/AlertSubscribePanel";
import { ForecastTable } from "@/components/ForecastTable";
import { PanicHero } from "@/components/PanicHero";
import { loadLatestSnapshot, loadStationMeta } from "@/lib/data";

export const revalidate = 900;

export default async function DashboardPage() {
  const snapshot = await loadLatestSnapshot();
  const station = await loadStationMeta();
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

  return (
    <>
      <AsciiHeader compact />
      <AlertSubscribePanel />
      <PanicHero
        snapshot={snapshot}
        lastMajorShiftAt={station.lastMajorShiftAt}
        lastMajorShiftSummary={station.lastMajorShiftSummary}
      />
      <ForecastTable snapshot={snapshot} />
    </>
  );
}
