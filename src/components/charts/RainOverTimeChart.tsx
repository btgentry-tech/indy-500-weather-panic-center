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

interface RainOverTimeChartProps {
  snapshots: ForecastSnapshot[];
}

export function RainOverTimeChart({ snapshots }: RainOverTimeChartProps) {
  const labels = snapshots.map((s) => formatChartLabel(s.fetchedAt));
  const tooltips = snapshots.map((s) => formatStationTime(s.fetchedAt));

  const rainData = {
    labels,
    datasets: [
      {
        label: "Carb Day Rain %",
        data: snapshots.map((s) => s.days.carbDay.rainPct),
        borderColor: CHART_COLORS.green,
        backgroundColor: "transparent",
        tension: 0.2,
      },
      {
        label: "Legends Day Rain %",
        data: snapshots.map((s) => s.days.legendsDay.rainPct),
        borderColor: CHART_COLORS.amber,
        backgroundColor: "transparent",
        tension: 0.2,
      },
      {
        label: "Race Day Rain %",
        data: snapshots.map((s) => s.days.raceDay.rainPct),
        borderColor: CHART_COLORS.red,
        backgroundColor: "transparent",
        tension: 0.2,
      },
    ],
  };

  return (
    <section className="panel chart-panel dashboard-rain-chart">
      <h2 className="panel-title">Rain forecast changes</h2>
      <div className="chart-canvas" style={{ height: 220 }}>
        <Line
          data={rainData}
          options={{
            ...baseChartOptions,
            plugins: {
              ...baseChartOptions.plugins,
              tooltip: {
                ...baseChartOptions.plugins.tooltip,
                callbacks: {
                  title: (items) => {
                    const i = items[0]?.dataIndex ?? 0;
                    return tooltips[i] ?? "";
                  },
                },
              },
              title: {
                display: true,
                text: "Rain forecast changes",
                color: CHART_COLORS.label,
              },
            },
          }}
        />
      </div>
    </section>
  );
}
