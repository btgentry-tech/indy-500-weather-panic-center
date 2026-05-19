import type { ForecastSnapshot } from "@/lib/types";
import { getPanicIndexLabel } from "@/lib/panic-index";
import { formatStationTime } from "@/lib/format";

interface PanicIndexPanelProps {
  snapshot: ForecastSnapshot;
}

export function PanicIndexPanel({ snapshot }: PanicIndexPanelProps) {
  const bar = "█".repeat(Math.round(snapshot.panicMeter / 5)).padEnd(20, "░");

  return (
    <section className="panel" aria-label="Panic index status">
      <h2 className="panel-title">Main Panic Index Panel</h2>
      <div
        className={`panic-index-level panic-index-${snapshot.panicIndex}`}
      >
        {getPanicIndexLabel(snapshot.panicIndex)}
      </div>
      <p className="mood-line">{snapshot.mood}</p>
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
            <td title={snapshot.noaaGeneratedAt}>
              {formatStationTime(snapshot.noaaGeneratedAt)}
            </td>
          </tr>
          <tr>
            <th scope="row">Station Poll</th>
            <td title={snapshot.fetchedAt}>
              {formatStationTime(snapshot.fetchedAt)}
            </td>
          </tr>
        </tbody>
      </table>
    </section>
  );
}
