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
import type { ForecastSnapshot } from "@/lib/types";

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
  plugins: {
    legend: {
      labels: { color: "#33ff33", font: { family: "Courier New" } },
    },
    title: {
      color: "#ffff00",
      font: { family: "Courier New", size: 12 },
    },
  },
  scales: {
    x: {
      ticks: { color: "#cccccc", font: { family: "Courier New", size: 10 } },
      grid: { color: "#222222" },
    },
    y: {
      ticks: { color: "#cccccc", font: { family: "Courier New", size: 10 } },
      grid: { color: "#222222" },
    },
  },
};

function labelsFromSnapshots(snapshots: ForecastSnapshot[]): string[] {
  return snapshots.map((s) => s.id.replace("2026-", ""));
}

interface HistoryChartsProps {
  snapshots: ForecastSnapshot[];
}

export function HistoryCharts({ snapshots }: HistoryChartsProps) {
  const labels = labelsFromSnapshots(snapshots);

  const rainData = {
    labels,
    datasets: [
      {
        label: "Carb Day Rain %",
        data: snapshots.map((s) => s.days.carbDay.rainPct),
        borderColor: "#33ff33",
        backgroundColor: "transparent",
        tension: 0.2,
      },
      {
        label: "Legends Day Rain %",
        data: snapshots.map((s) => s.days.legendsDay.rainPct),
        borderColor: "#ffff00",
        backgroundColor: "transparent",
        tension: 0.2,
      },
      {
        label: "Race Day Rain %",
        data: snapshots.map((s) => s.days.raceDay.rainPct),
        borderColor: "#ff3333",
        backgroundColor: "transparent",
        tension: 0.2,
      },
    ],
  };

  const panicIndexData = {
    labels,
    datasets: [
      {
        label: "PANIC INDEX (1 = maximum panic)",
        data: snapshots.map((s) => s.panicIndex),
        borderColor: "#ff3333",
        stepped: true,
        backgroundColor: "transparent",
      },
    ],
  };

  const volatilityData = {
    labels,
    datasets: [
      {
        label: "Volatility",
        data: snapshots.map((s) => s.volatility.volatilityScore),
        borderColor: "#ff3333",
        backgroundColor: "transparent",
      },
      {
        label: "Stability",
        data: snapshots.map((s) => s.volatility.stabilityScore),
        borderColor: "#33ff33",
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
        borderColor: "#ffff00",
        fill: true,
        backgroundColor: "rgba(255,255,0,0.08)",
        tension: 0.2,
      },
    ],
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
                title: {
                  display: true,
                  text: "Race Weekend Precipitation Probability",
                  color: "#ffff00",
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
        <h2 className="panel-title">Volatility / Stability</h2>
        <div style={{ height: 220 }}>
          <Line data={volatilityData} options={chartOptions} />
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
