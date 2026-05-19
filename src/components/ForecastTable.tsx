import { RACE_DAYS } from "@/lib/race-days";
import type { ForecastSnapshot } from "@/lib/types";

interface ForecastTableProps {
  snapshot: ForecastSnapshot;
}

export function ForecastTable({ snapshot }: ForecastTableProps) {
  return (
    <section className="panel">
      <h2 className="panel-title">Current Forecast Table</h2>
      <div className="table-scroll">
      <table className="data">
        <thead>
          <tr>
            <th>Event</th>
            <th>Rain %</th>
            <th>Storm Risk</th>
            <th>High Temp</th>
            <th>Confidence</th>
            <th>Trend</th>
          </tr>
        </thead>
        <tbody>
          {RACE_DAYS.map((config) => {
            const day = snapshot.days[config.key];
            const stormClass =
              day.stormRisk === "ACTIVE" ? "severity-alert" : "";
            return (
              <tr key={config.key}>
                <td>{day.label}</td>
                <td>{day.rainPct}%</td>
                <td className={stormClass}>{day.stormRisk}</td>
                <td>{day.highTemp}°F</td>
                <td>{day.confidence}</td>
                <td>{day.trend}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      </div>
    </section>
  );
}
