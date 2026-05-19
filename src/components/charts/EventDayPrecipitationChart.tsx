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
import {
  buildEventDayPrecipitationChartData,
  hasEventDayHourlyData,
} from "@/lib/event-day-hourly-chart";
import type { ForecastSnapshot } from "@/lib/types";
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

const CHART_TITLE = "Event day precipitation window";

interface EventDayPrecipitationChartProps {
  snapshot: ForecastSnapshot;
}

export function EventDayPrecipitationChart({
  snapshot,
}: EventDayPrecipitationChartProps) {
  if (!hasEventDayHourlyData(snapshot)) {
    return (
      <section className="panel chart-panel dashboard-event-window-chart">
        <h2 className="panel-title">{CHART_TITLE}</h2>
        <p className="status-line">Hourly window data not available yet.</p>
      </section>
    );
  }

  const chartData = buildEventDayPrecipitationChartData(snapshot);

  return (
    <section className="panel chart-panel dashboard-event-window-chart">
      <h2 className="panel-title">{CHART_TITLE}</h2>
      <div className="chart-canvas" style={{ height: 240 }}>
        <Line
          data={chartData}
          options={{
            ...baseChartOptions,
            plugins: {
              ...baseChartOptions.plugins,
              title: {
                display: true,
                text: CHART_TITLE,
                color: CHART_COLORS.label,
              },
            },
          }}
        />
      </div>
    </section>
  );
}
