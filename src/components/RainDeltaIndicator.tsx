import { getRainDeltaDisplay } from "@/lib/labels";

interface RainDeltaIndicatorProps {
  current: number;
  previous?: number;
}

export function RainDeltaIndicator({ current, previous }: RainDeltaIndicatorProps) {
  const delta = getRainDeltaDisplay(current, previous);
  if (!delta) return null;

  const direction = delta.arrow === "↑" ? "increased" : "decreased";

  return (
    <span
      className={`rain-delta trend-indicator ${delta.className}`}
      aria-label={`Rain ${direction} ${delta.absDelta} percent since last poll`}
    >
      {delta.arrow} {delta.absDelta}%
    </span>
  );
}
