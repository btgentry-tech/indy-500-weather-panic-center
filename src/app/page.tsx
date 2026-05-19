import { AsciiHeader } from "@/components/AsciiHeader";
import { AlertSubscribePanel } from "@/components/AlertSubscribePanel";
import { ChangeFeed } from "@/components/ChangeFeed";
import { ForecastTable } from "@/components/ForecastTable";
import { PanicHero } from "@/components/PanicHero";
import { VolatilityStrip } from "@/components/VolatilityStrip";
import { loadChangelog, loadLatestSnapshot } from "@/lib/data";

export const dynamic = "force-static";

export default async function DashboardPage() {
  const snapshot = await loadLatestSnapshot();
  const changelog = await loadChangelog();

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

  return (
    <>
      <AsciiHeader compact />
      <AlertSubscribePanel />
      <PanicHero snapshot={snapshot} />
      <ChangeFeed entries={changelog.entries} />
      <ForecastTable snapshot={snapshot} />
      <VolatilityStrip
        volatility={snapshot.volatility}
        forecastStability={snapshot.forecastStability}
        panicMeter={snapshot.panicMeter}
      />
    </>
  );
}
