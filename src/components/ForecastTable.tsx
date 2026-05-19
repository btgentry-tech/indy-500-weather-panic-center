import { RACE_DAYS } from "@/lib/race-days";
import {
  computeDayStabilityLevel,
  FORECAST_STABILITY_DISCLAIMER,
  stabilityCssClass,
  stabilityLabel,
} from "@/lib/forecast-stability";
import { stormDisplayLabel } from "@/lib/labels";
import type { ForecastSnapshot } from "@/lib/types";
import { TrendIndicator } from "./TrendIndicator";

interface ForecastTableProps {
  snapshot: ForecastSnapshot;
  history: ForecastSnapshot[];
}

export function ForecastTable({ snapshot, history }: ForecastTableProps) {
  return (
    <section className="panel">
      <h2 className="panel-title">Race Weekend Forecast</h2>
      <p className="forecast-table-note">
        Stability tracks how much each day&apos;s NOAA forecast has shifted
        between polls. {FORECAST_STABILITY_DISCLAIMER}
      </p>
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
              const dayStability = computeDayStabilityLevel(
                history,
                config.key,
                day.rainPct,
              );
              const isRaceDay = config.key === "raceDay";
              return (
                <tr
                  key={config.key}
                  className={isRaceDay ? "row-race-day" : undefined}
                >
                  <td className="col-event">{day.label}</td>
                  <td className="col-value col-rain">{day.rainPct}%</td>
                  <td className="col-muted">{stormLabel}</td>
                  <td className="col-muted">{day.highTemp}°</td>
                  <td
                    className={`col-stability ${stabilityCssClass(dayStability)}`}
                  >
                    {stabilityLabel(dayStability)}
                  </td>
                  <td className="col-trend">
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
