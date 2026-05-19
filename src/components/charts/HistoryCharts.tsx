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
  Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { CHART_AMBER_FILL, CHART_COLORS } from "@/lib/chart-colors";
import type { ForecastSnapshot } from "@/lib/types";
import { formatChartLabel, formatStationTime } from "@/lib/format";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    mode: "index" as const,
    intersect: false,
  },
  plugins: {
    legend: {
      labels: {
        color: CHART_COLORS.text,
        font: { family: "Courier New", size: 11 },
      },
    },
    title: {
      color: CHART_COLORS.label,
      font: { family: "Courier New", size: 12 },
    },
    tooltip: {
      titleColor: CHART_COLORS.label,
      bodyColor: CHART_COLORS.text,
      backgroundColor: "#0a0a0a",
      borderColor: CHART_COLORS.grid,
      borderWidth: 1,
      titleFont: { family: "Courier New" },
      bodyFont: { family: "Courier New" },
    },
  },
  scales: {
    x: {
      ticks: {
        color: CHART_COLORS.textDim,
        font: { family: "Courier New", size: 10 },
      },
      grid: { color: CHART_COLORS.gridDim },
    },
    y: {
      ticks: {
        color: CHART_COLORS.textDim,
        font: { family: "Courier New", size: 10 },
      },
      grid: { color: CHART_COLORS.gridDim },
    },
  },
};

function labelsFromSnapshots(snapshots: ForecastSnapshot[]): string[] {
  return snapshots.map((s) => formatChartLabel(s.fetchedAt));
}

function tooltipTitle(snapshots: ForecastSnapshot[]) {
  return snapshots.map((s) => formatStationTime(s.fetchedAt));
}

interface HistoryChartsProps {
  snapshots: ForecastSnapshot[];
}

export function HistoryCharts({ snapshots }: HistoryChartsProps) {
  const labels = labelsFromSnapshots(snapshots);
  const tooltips = tooltipTitle(snapshots);

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

  const latest = snapshots[snapshots.length - 1];
  const raceHourly = latest?.hourly.filter((h) =>
    h.time.includes("2026-05-24"),
  );

  const hourlyData = {
    labels: raceHourly?.map((h) => h.time.slice(11, 16)) ?? [],
    datasets: [
      {
        label: "Race Day Hourly Rain %",
        data: raceHourly?.map((h) => h.rainPct) ?? [],
        borderColor: CHART_COLORS.amber,
        fill: true,
        backgroundColor: CHART_AMBER_FILL,
        tension: 0.2,
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
    <>
      <section className="panel chart-panel">
        <h2 className="panel-title">Rain % Over Time</h2>
        <div style={{ height: 220 }}>
          <Line
            data={rainData}
            options={{
              ...chartOptions,
              plugins: {
                ...chartOptions.plugins,
                tooltip: {
                  ...chartOptions.plugins.tooltip,
                  callbacks: tooltipCallbacks,
                },
                title: {
                  display: true,
                  text: "Race Weekend Precipitation Probability",
                  color: CHART_COLORS.label,
                },
              },
            }}
          />
        </div>
      </section>

      <section className="panel chart-panel">
        <h2 className="panel-title">PANIC INDEX Over Time</h2>
        <div style={{ height: 220 }}>
          <Line
            data={panicIndexData}
            options={{
              ...chartOptions,
              plugins: {
                ...chartOptions.plugins,
                tooltip: {
                  ...chartOptions.plugins.tooltip,
                  callbacks: tooltipCallbacks,
                },
              },
              scales: {
                ...chartOptions.scales,
                y: {
                  ...chartOptions.scales.y,
                  min: 1,
                  max: 5,
                },
              },
            }}
          />
        </div>
      </section>


      <section className="panel chart-panel">
        <h2 className="panel-title">Race Day Hourly Precipitation</h2>
        <div style={{ height: 220 }}>
          <Line data={hourlyData} options={chartOptions} />
        </div>
      </section>
    </>
  );
}
