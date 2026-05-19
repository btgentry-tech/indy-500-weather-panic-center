import { CHART_COLORS } from "@/lib/chart-colors";

export const baseChartOptions = {
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
