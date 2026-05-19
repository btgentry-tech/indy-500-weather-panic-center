import type {
  ForecastConfidence,
  StormRisk,
  TrendArrow,
} from "./types";

export interface TrendDisplay {
  arrow: TrendArrow;
  label: string;
  className: "trend-worse" | "trend-better" | "trend-stable";
}

export function getTrendDisplay(trend: TrendArrow): TrendDisplay {
  switch (trend) {
    case "↑":
      return { arrow: "↑", label: "worsening", className: "trend-worse" };
    case "↓":
      return { arrow: "↓", label: "improving", className: "trend-better" };
    default:
      return { arrow: "→", label: "stable", className: "trend-stable" };
  }
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

export function stabilityDisplayLabel(
  confidence: ForecastConfidence,
  trend: TrendArrow,
  volatilityScore?: number,
): string {
  if (volatilityScore !== undefined && volatilityScore >= 50) {
    return "Volatile";
  }
  if (trend === "↓" && confidence !== "DETERIORATING") {
    return "Improving";
  }
  if (confidence === "STABLE") return "Stable";
  if (confidence === "DETERIORATING") return "Weakening";
  if (confidence === "UNCERTAIN") return "Uncertain";
  return "Shifting";
}

export function truncateChangeLine(text: string | null, max = 72): string {
  if (!text) return "No recent revision.";
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}…`;
}
