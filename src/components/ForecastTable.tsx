import type { ForecastSnapshot } from "@/lib/types";
import { RaceWeekendTable } from "./RaceWeekendTable";

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
      <RaceWeekendTable snapshot={snapshot} previous={previous} />
    </section>
  );
}
