import { AsciiHeader } from "@/components/AsciiHeader";
import { AlertSubscribePanel } from "@/components/AlertSubscribePanel";
import { ChangeFeed } from "@/components/ChangeFeed";
import { ForecastTable } from "@/components/ForecastTable";
import { PanicIndexPanel } from "@/components/PanicIndexPanel";
import { VolatilityPanel } from "@/components/VolatilityPanel";
import { loadChangelog, loadLatestSnapshot } from "@/lib/data";

export const dynamic = "force-static";

export default async function DashboardPage() {
  const snapshot = await loadLatestSnapshot();
  const changelog = await loadChangelog();

  if (!snapshot) {
    return (
      <>
        <AsciiHeader />
        <section className="panel">
          <p className="severity-alert">
            NO SNAPSHOT DATA. Run hourly poll or wait for GitHub Actions.
          </p>
        </section>
        <AlertSubscribePanel />
      </>
    );
  }

  return (
    <>
      <AsciiHeader />
      <PanicIndexPanel snapshot={snapshot} />
      <ForecastTable snapshot={snapshot} />
      <ChangeFeed entries={changelog.entries} />
      <VolatilityPanel volatility={snapshot.volatility} />
      <AlertSubscribePanel />
    </>
  );
}
