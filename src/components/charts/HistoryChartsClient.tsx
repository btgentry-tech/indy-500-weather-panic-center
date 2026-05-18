"use client";

import type { ForecastSnapshot } from "@/lib/types";
import { HistoryCharts } from "./HistoryCharts";

interface HistoryChartsClientProps {
  snapshots: ForecastSnapshot[];
}

export function HistoryChartsClient({ snapshots }: HistoryChartsClientProps) {
  return <HistoryCharts snapshots={snapshots} />;
}
