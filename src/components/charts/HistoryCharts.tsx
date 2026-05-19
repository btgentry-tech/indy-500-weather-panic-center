"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { CHART_COLORS } from "@/lib/chart-colors";
import type { ForecastSnapshot } from "@/lib/types";
import { formatChartLabel, formatStationTime } from "@/lib/format";
import { baseChartOptions } from "./chart-options";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
);

function labelsFromSnapshots(snapshots: ForecastSnapshot[]): string[] {
  return snapshots.map((s) => formatChartLabel(s.fetchedAt));
}

function tooltipTitle(snapshots: ForecastSnapshot[]): string[] {
  return snapshots.map((s) => formatStationTime(s.fetchedAt));
}

interface HistoryChartsProps {
  snapshots: ForecastSnapshot[];
}

export function HistoryCharts({ snapshots }: HistoryChartsProps) {
  const labels = labelsFromSnapshots(snapshots);
  const tooltips = tooltipTitle(snapshots);

  const panicIndexData = {
    labels,
    datasets: [
      {
        label: "PANIC INDEX (1 = low, 5 = high concern)",
        data: snapshots.map((s) => s.panicIndex),
        borderColor: CHART_COLORS.red,
        stepped: true,
        backgroundColor: "transparent",
      },
    ],
  };

  const tooltipCallbacks = {
    title: (items: { dataIndex: number }[]) => {
      const i = items[0]?.dataIndex ?? 0;
      return tooltips[i] ?? "";
    },
  };

  return (
    <section className="panel chart-panel">
      <h2 className="panel-title">PANIC INDEX Over Time</h2>
      <div className="chart-canvas" style={{ height: 220 }}>
        <Line
          data={panicIndexData}
          options={{
            ...baseChartOptions,
            plugins: {
              ...baseChartOptions.plugins,
              tooltip: {
                ...baseChartOptions.plugins.tooltip,
                callbacks: tooltipCallbacks,
              },
            },
            scales: {
              ...baseChartOptions.scales,
              y: {
                ...baseChartOptions.scales.y,
                min: 1,
                max: 5,
              },
            },
          }}
        />
      </div>
    </section>
  );
}
