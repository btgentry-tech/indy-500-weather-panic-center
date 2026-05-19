import { RACE_DAYS } from "@/lib/race-days";
import {
  stabilityDisplayLabel,
  stormDisplayLabel,
} from "@/lib/labels";
import type { ForecastSnapshot } from "@/lib/types";
import { TrendIndicator } from "./TrendIndicator";

interface ForecastTableProps {
  snapshot: ForecastSnapshot;
}

export function ForecastTable({ snapshot }: ForecastTableProps) {
  return (
    <section className="panel">
      <h2 className="panel-title">Race Weekend Forecast</h2>
      <div className="table-scroll">
      <table className="data">
        <thead>
          <tr>
            <th>Event</th>
            <th>Rain %</th>
            <th>Storms</th>
            <th>High</th>
            <th>Forecast Stability</th>
            <th>Trend</th>
          </tr>
        </thead>
        <tbody>
          {RACE_DAYS.map((config) => {
            const day = snapshot.days[config.key];
            const stormLabel = stormDisplayLabel(day.stormRisk, day.rainPct);
            const stability = stabilityDisplayLabel(
              day.confidence,
              day.trend,
              config.key === "raceDay"
                ? snapshot.volatility.volatilityScore
                : undefined,
            );
            return (
              <tr key={config.key}>
                <td>{day.label}</td>
                <td>{day.rainPct}%</td>
                <td>{stormLabel}</td>
                <td>{day.highTemp}°</td>
                <td>{stability}</td>
                <td>
                  <TrendIndicator trend={day.trend} inline />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      </div>
    </section>
  );
}
