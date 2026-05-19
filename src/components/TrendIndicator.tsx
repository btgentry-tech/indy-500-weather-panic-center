import { getTrendDisplay } from "@/lib/labels";
import type { TrendArrow } from "@/lib/types";

interface TrendIndicatorProps {
  trend: TrendArrow;
  inline?: boolean;
  compact?: boolean;
}

export function TrendIndicator({
  trend,
  inline = false,
  compact = false,
}: TrendIndicatorProps) {
  const { arrow, label, className } = getTrendDisplay(trend);

  if (inline) {
    return (
      <span className={`trend-indicator ${className}`}>
        {arrow} {label}
      </span>
    );
  }

  if (compact) {
    return (
      <div className={`hero-metric trend-metric ${className}`}>
        <span className="field-label">Trend</span>
        <span className={`trend-indicator field-value ${className}`}>
          {arrow} {label}
        </span>
      </div>
    );
  }

  return (
    <p className={`trend-indicator trend-line ${className}`}>
      {arrow} {label}
    </p>
  );
}
