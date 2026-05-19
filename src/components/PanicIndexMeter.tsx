import type { PanicIndexLevel } from "@/lib/types";

interface PanicIndexMeterProps {
  level: PanicIndexLevel;
}

export function PanicIndexMeter({ level }: PanicIndexMeterProps) {
  return (
    <p className="panic-index-meter" aria-label={`Severity ${level} of 5`}>
      <span className="meter-bracket" aria-hidden="true">
        [
      </span>{" "}
      {Array.from({ length: 5 }, (_, i) => (
        <span
          key={i}
          className={i < level ? "meter-seg meter-seg-filled" : "meter-seg meter-seg-empty"}
          aria-hidden="true"
        >
          {i < level ? "■" : "□"}
        </span>
      ))}{" "}
      <span className="meter-bracket" aria-hidden="true">
        ]
      </span>
    </p>
  );
}
