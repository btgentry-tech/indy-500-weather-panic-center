import { AsciiHeader } from "@/components/AsciiHeader";
import { AlertSubscribePanel } from "@/components/AlertSubscribePanel";
import { ForecastTable } from "@/components/ForecastTable";
import { PanicHero } from "@/components/PanicHero";
import { VolatilityStrip } from "@/components/VolatilityStrip";
import {
  loadAllSnapshots,
  loadChangelog,
  loadLatestSnapshot,
  loadStationMeta,
} from "@/lib/data";
import { computeRecordVolatility } from "@/lib/volatility";

export const revalidate = 900;

export default async function DashboardPage() {
  const snapshot = await loadLatestSnapshot();
  const station = await loadStationMeta();
  const changelog = await loadChangelog();
  const history = await loadAllSnapshots();

  if (!snapshot) {
    return (
      <>
        <AsciiHeader compact />
        <AlertSubscribePanel />
        <section className="panel">
          <p className="severity-alert">
            NO SNAPSHOT DATA. Run poll or wait for GitHub Actions (every 15 min).
          </p>
        </section>
      </>
    );
  }

  const recordStats = computeRecordVolatility(
    history,
    changelog.entries.length,
  );

  return (
    <>
      <AsciiHeader compact />
      <AlertSubscribePanel />
      <PanicHero
        snapshot={snapshot}
        lastForecastChange={station.lastForecastChangeSummary}
        lastForecastChangeAt={station.lastForecastChangeAt}
      />
      <ForecastTable snapshot={snapshot} />
      <VolatilityStrip record={recordStats} panicMeter={snapshot.panicMeter} />
    </>
  );
}
