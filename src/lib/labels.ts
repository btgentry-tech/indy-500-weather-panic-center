import type { StormRisk, TrendArrow } from "./types";

export interface TrendDisplay {
  arrow: TrendArrow;
  label: string;
  className: "trend-worse" | "trend-better" | "trend-stable";
}

export function getTrendDisplay(trend: TrendArrow): TrendDisplay {
  switch (trend) {
    case "↑":
      return { arrow: "↑", label: "Rain rising", className: "trend-worse" };
    case "↓":
      return { arrow: "↓", label: "Rain easing", className: "trend-better" };
    default:
      return { arrow: "→", label: "Holding", className: "trend-stable" };
  }
}

export interface RainDeltaDisplay {
  arrow: "↑" | "↓";
  absDelta: number;
  className: "trend-worse" | "trend-better";
}

/** Change in rain % vs previous poll; null when unchanged or no prior snapshot. */
export function getRainDeltaDisplay(
  current: number,
  previous?: number,
): RainDeltaDisplay | null {
  if (previous === undefined) return null;
  const delta = current - previous;
  if (delta === 0) return null;
  if (delta > 0) {
    return { arrow: "↑", absDelta: delta, className: "trend-worse" };
  }
  return { arrow: "↓", absDelta: Math.abs(delta), className: "trend-better" };
}

export function stormDisplayLabel(risk: StormRisk, rainPct: number): string {
  if (risk === "ACTIVE") {
    return rainPct >= 60 ? "Likely" : "Developing";
  }
  if (risk === "ELEVATED") {
    return rainPct >= 40 ? "Possible" : "Scattered";
  }
  if (rainPct >= 20) return "Isolated";
  return "Minimal";
}

export function truncateChangeLine(text: string | null, max = 72): string {
  if (!text) return "No recent revision.";
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}…`;
}
