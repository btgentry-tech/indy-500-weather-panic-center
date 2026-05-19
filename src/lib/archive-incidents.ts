export interface ArchiveIncident {
  year: number;
  title: string;
  note: string;
}

/** Documented Indy 500 weather-related race disruptions — static reference only. */
export const ARCHIVE_INCIDENTS: ArchiveIncident[] = [
  {
    year: 2007,
    title: "Rain-shortened race (415 miles)",
    note: "Steady rain after lap 415. Race ended early; Dario Franchitti declared winner. Widely cited as a modern rain-shortened 500.",
  },
  {
    year: 1997,
    title: "Rain-delayed start; race finished under caution",
    note: "Start delayed by rain. Race concluded under caution after 167 laps (415 miles) with Arie Luyendyk winning.",
  },
  {
    year: 1989,
    title: "Race ended under caution (wet track)",
    note: "Concluded under caution on a damp track after 162 laps. Emerson Fittipaldi listed as winner.",
  },
  {
    year: 1975,
    title: "Postponed by rain",
    note: "Race postponed from Sunday to the following Saturday due to rain. Bobby Unser won when the event resumed.",
  },
  {
    year: 1973,
    title: "Rain-shortened race (133 laps)",
    note: "Stopped early due to rain and track conditions. Listed as 133 laps completed.",
  },
  {
    year: 2004,
    title: "Delayed start (rain)",
    note: "Start delayed several hours after morning rain. Race completed to full distance.",
  },
  {
    year: 2022,
    title: "Delayed start (rain)",
    note: "Start delayed roughly 40 minutes after pre-race rain. Race completed to scheduled distance.",
  },
];
