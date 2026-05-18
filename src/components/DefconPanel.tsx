import type { ForecastSnapshot } from "@/lib/types";
import { getDefconLabel } from "@/lib/defcon";

interface DefconPanelProps {
  snapshot: ForecastSnapshot;
}

export function DefconPanel({ snapshot }: DefconPanelProps) {
  const bar = "█".repeat(Math.round(snapshot.panicMeter / 5)).padEnd(20, "░");

  return (
    <section className="panel" aria-label="DEFCON status">
      <h2 className="panel-title">Main DEFCON Panel</h2>
      <div className={`defcon-level defcon-${snapshot.defcon}`}>
        {getDefconLabel(snapshot.defcon)}
      </div>
      <p>{snapshot.mood}</p>
      <table className="data">
        <tbody>
          <tr>
            <th scope="row">Panic Meter</th>
            <td className="meter">
              [{bar}] {snapshot.panicMeter}/100
            </td>
          </tr>
          <tr>
            <th scope="row">Forecast Stability</th>
            <td>{snapshot.forecastStability}%</td>
          </tr>
          <tr>
            <th scope="row">Last Forecast Change</th>
            <td>
              {snapshot.lastForecastChange ??
                "No material developments since last poll."}
            </td>
          </tr>
          <tr>
            <th scope="row">Last NOAA Update</th>
            <td>{snapshot.noaaGeneratedAt}</td>
          </tr>
          <tr>
            <th scope="row">Station Poll</th>
            <td>{snapshot.fetchedAt}</td>
          </tr>
        </tbody>
      </table>
    </section>
  );
}
