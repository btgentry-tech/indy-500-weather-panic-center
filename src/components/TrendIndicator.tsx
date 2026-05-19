import { getTrendDisplay } from "@/lib/labels";
import type { TrendArrow } from "@/lib/types";

interface TrendIndicatorProps {
  trend: TrendArrow;
  inline?: boolean;
}

export function TrendIndicator({ trend, inline = false }: TrendIndicatorProps) {
  const { arrow, label, className } = getTrendDisplay(trend);

  if (inline) {
    return (
      <span className={`trend-indicator ${className}`}>
        {arrow} {label}
      </span>
    );
  }

  return (
    <p className={`trend-indicator trend-line ${className}`}>
      {arrow} {label}
    </p>
  );
}
