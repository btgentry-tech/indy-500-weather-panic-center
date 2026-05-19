export type ArchiveEventSeverity = "severe" | "operational";

export interface NotableWeatherEvent {
  year: number;
  tag: string;
  severity: ArchiveEventSeverity;
  summary: string;
  winner: string;
  officialDistance: string;
  status: string;
  narrative: string;
}

/**
 * Static reference — verify against official IMS historical records.
 * Editorial copy is original; facts cross-checked against official race results.
 */
export const NOTABLE_WEATHER_EVENTS: NotableWeatherEvent[] = [
  {
    year: 1973,
    tag: "SEVERE WEATHER INTERRUPTION",
    severity: "severe",
    summary:
      "Heavy rain, crashes, and deteriorating track conditions forced officials to stop the Indianapolis 500 after just 133 laps (332.5 miles), making it one of the shortest races in modern Speedway history.",
    winner: "Gordon Johncock",
    officialDistance: "133 laps",
    status: "Rain-shortened race",
    narrative:
      "Weather conditions worsened throughout the afternoon as visibility and grip continued to decline. Multiple serious accidents and standing water created increasingly dangerous circumstances before officials finally called the race early. The 1973 Indianapolis 500 remains one of the most controversial and tragic weather-affected races ever run at the Speedway.",
  },
  {
    year: 1975,
    tag: "RAIN-SHORTENED EVENT",
    severity: "severe",
    summary:
      "A sudden downpour on lap 174 forced officials to halt the Indianapolis 500 at 435 miles — 26 laps short of the scheduled distance — with Bobby Unser leading under a red flag.",
    winner: "Bobby Unser",
    officialDistance: "174 laps",
    status: "Rain-shortened race",
    narrative:
      "Skies had threatened for much of the afternoon before rain finally overwhelmed the racing surface late in the event. Unser received the checkered flag under caution and rain on the main straight, with Johnny Rutherford second and pole-sitter A. J. Foyt third. The 1975 race is remembered as a wet, truncated Memorial Day weekend conclusion rather than a full 500-mile contest.",
  },
  {
    year: 1986,
    tag: "TORNADO WARNING",
    severity: "severe",
    summary:
      "Severe thunderstorms and tornado warnings moved through central Indiana during race week, triggering widespread concern around Indianapolis Motor Speedway operations.",
    winner: "Bobby Rahal",
    officialDistance: "200 laps",
    status: "Severe weather alert during race weekend",
    narrative:
      "Storm systems moving across Indiana generated tornado warnings and dangerous atmospheric conditions in the region surrounding the Speedway. While the race itself ultimately reached full distance, the weekend is remembered for volatile weather and heightened severe-weather awareness around IMS operations.",
  },
  {
    year: 1989,
    tag: "WET TRACK CAUTION FINISH",
    severity: "operational",
    summary:
      "The Indianapolis 500 concluded under caution after the full 200-lap distance as officials held the field on a damp surface following a late-race incident in the closing stages.",
    winner: "Emerson Fittipaldi",
    officialDistance: "200 laps",
    status: "Caution finish on damp track",
    narrative:
      "Changing track conditions and a final-lap crash in turn three created uncertainty during the closing moments as moisture lingered on portions of the speedway. Emerson Fittipaldi took the checkered flag under yellow for his first Indianapolis 500 victory, becoming the first Brazilian winner in race history.",
  },
  {
    year: 1997,
    tag: "MULTI-DAY WEATHER DELAY",
    severity: "severe",
    summary:
      "Repeated rain delays stretched the Indianapolis 500 across three separate days, making it one of the most weather-disrupted races in Speedway history.",
    winner: "Arie Luyendyk",
    officialDistance: "200 laps",
    status: "Multi-day weather interruption",
    narrative:
      "The race originally began Sunday before heavy rain halted competition. Officials attempted to resume the event Monday, but additional weather delays again interrupted the race. The Indianapolis 500 ultimately resumed and concluded Tuesday, creating one of the strangest and most fragmented schedules ever seen at Indianapolis Motor Speedway.",
  },
  {
    year: 2004,
    tag: "DELAYED START",
    severity: "operational",
    summary:
      "Morning rain delayed the start of the Indianapolis 500 for several hours before conditions improved enough for a full 500-mile race.",
    winner: "Buddy Rice",
    officialDistance: "200 laps",
    status: "Delayed start",
    narrative:
      "Safety crews spent much of the afternoon drying the racing surface after storms moved through Indianapolis during the morning hours. Once conditions stabilized, the race proceeded to full distance without additional interruption.",
  },
  {
    year: 2007,
    tag: "RAIN-SHORTENED EVENT",
    severity: "severe",
    summary:
      "Steady rain forced officials to stop the Indianapolis 500 after 166 laps (415 miles), ending the race short of its scheduled distance.",
    winner: "Dario Franchitti",
    officialDistance: "166 laps",
    status: "Rain-shortened race",
    narrative:
      "Weather conditions deteriorated rapidly during the second half of the event as rain intensified around the Speedway. Officials displayed the red flag after lap 166 and eventually declared the race official, giving Dario Franchitti his first Indianapolis 500 victory.",
  },
  {
    year: 2022,
    tag: "DELAYED START",
    severity: "operational",
    summary:
      "Pre-race rain delayed the start of the Indianapolis 500 by roughly 40 minutes before track drying operations were completed.",
    winner: "Marcus Ericsson",
    officialDistance: "200 laps",
    status: "Delayed start",
    narrative:
      "Showers moved through Indianapolis shortly before the scheduled green flag, forcing teams and fans into a temporary holding pattern while safety crews prepared the racing surface. Once conditions stabilized, the race proceeded to full distance.",
  },
];
