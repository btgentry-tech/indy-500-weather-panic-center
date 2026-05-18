import type { VolatilityStats } from "@/lib/types";

interface VolatilityPanelProps {
  volatility: VolatilityStats;
}

export function VolatilityPanel({ volatility }: VolatilityPanelProps) {
  return (
    <section className="panel">
      <h2 className="panel-title">Volatility Panel</h2>
      <table className="data">
        <tbody>
          <tr>
            <th scope="row">Changes (24h)</th>
            <td>{volatility.changes24h}</td>
          </tr>
          <tr>
            <th scope="row">Largest Rain Swing</th>
            <td>{volatility.largestRainSwing}%</td>
          </tr>
          <tr>
            <th scope="row">Stability Score</th>
            <td>{volatility.stabilityScore}</td>
          </tr>
          <tr>
            <th scope="row">Volatility Score</th>
            <td className="severity-warning">
              {volatility.volatilityScore}
            </td>
          </tr>
        </tbody>
      </table>
    </section>
  );
}
