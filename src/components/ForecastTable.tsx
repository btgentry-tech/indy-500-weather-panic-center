import { RACE_DAYS } from "@/lib/race-days";
import { stormDisplayLabel } from "@/lib/labels";
import type { ForecastSnapshot } from "@/lib/types";
import { RainDeltaIndicator } from "./RainDeltaIndicator";
import { TrendIndicator } from "./TrendIndicator";

interface ForecastTableProps {
  snapshot: ForecastSnapshot;
  previous?: ForecastSnapshot | null;
}

export function ForecastTable({ snapshot, previous }: ForecastTableProps) {
  return (
    <section className="panel dashboard-breakdown">
      <h2 className="panel-title">Race weekend breakdown</h2>
      <p className="forecast-table-note">
        Per-event rain, storms, and rain trend since the last poll.
      </p>
      <div className="table-scroll">
        <table className="data">
          <thead>
            <tr>
              <th>Event</th>
              <th>Rain %</th>
              <th>Storms</th>
              <th>High</th>
              <th>Rain trend</th>
            </tr>
          </thead>
          <tbody>
            {RACE_DAYS.map((config) => {
              const day = snapshot.days[config.key];
              const stormLabel = stormDisplayLabel(day.stormRisk, day.rainPct);
              const isRaceDay = config.key === "raceDay";
              return (
                <tr
                  key={config.key}
                  className={isRaceDay ? "row-race-day" : undefined}
                >
                  <td className="col-event">{day.label}</td>
                  <td className="col-value col-rain">
                    <span className="rain-pct-cell">
                      <span>{day.rainPct}%</span>
                      <RainDeltaIndicator
                        current={day.rainPct}
                        previous={previous?.days[config.key].rainPct}
                      />
                    </span>
                  </td>
                  <td className="col-muted">{stormLabel}</td>
                  <td className="col-muted">{day.highTemp}°</td>
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
