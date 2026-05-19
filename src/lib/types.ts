export type StormRisk = "NONE" | "ELEVATED" | "ACTIVE";
export type TrendArrow = "↑" | "↓" | "→";

/** Derived bunker interpretation — not an official NOAA metric. */
export type ForecastStabilityLevel =
  | "stable"
  | "mostly-stable"
  | "unsettled"
  | "volatile"
  | "rapidly-changing";
export type PanicIndexLevel = 1 | 2 | 3 | 4 | 5;
/** @deprecated Use PanicIndexLevel */
export type DefconLevel = PanicIndexLevel;
export type DayKey = "carbDay" | "legendsDay" | "raceDay";
export type ChangelogSeverity = "info" | "warning" | "alert";

export interface RaceDayForecast {
  label: string;
  date: string;
  rainPct: number;
  stormRisk: StormRisk;
  highTemp: number;
  trend: TrendArrow;
  shortForecast: string;
  detailedForecast: string;
}

export interface HourlyPoint {
  time: string;
  rainPct: number;
  shortForecast: string;
  hasStormWording: boolean;
}

export interface VolatilityStats {
  changes24h: number;
  largestRainSwing: number;
  stabilityScore: number;
  volatilityScore: number;
}

export interface LocalConditions {
  temperatureF: number | null;
  condition: string | null;
  windDirection: string | null;
  windSpeedMph: number | null;
  observedAt: string | null;
}

export interface StationMeta {
  lastCheckedAt: string | null;
  lastSnapshotAt: string | null;
  lastSnapshotId: string | null;
  lastForecastChangeAt: string | null;
  lastForecastChangeSummary: string | null;
  localConditions?: LocalConditions | null;
}

/** Written every poll run for pipeline diagnostics. */
export interface PollHeartbeat {
  at: string;
  ok: boolean;
  outcome:
    | "checked_no_save"
    | "saved"
    | "saved_notify"
    | "outside_window"
    | "error";
  message: string;
  shouldSave?: boolean;
  /** Grid differed from previous snapshot (FCM trigger). */
  hasForecastDataChanged?: boolean;
  /** Editorial/changelog threshold met. */
  hasMeaningfulChange?: boolean;
  snapshotId?: string;
  panicIndex?: number;
  error?: string;
}

export interface ForecastSnapshot {
  id: string;
  fetchedAt: string;
  noaaGeneratedAt: string;
  panicIndex: PanicIndexLevel;
  /** 2 = 1 calm / 5 high concern; omit on legacy snapshots */
  panicScale?: number;
  /** Legacy field — kept in sync when writing */
  defcon?: PanicIndexLevel;
  /** @deprecated No longer computed — retained for legacy JSON only */
  panicMeter?: number;
  mood: string;
  /** Legacy numeric score 0–100 (higher = more stable) */
  forecastStability: number;
  forecastStabilityLevel?: ForecastStabilityLevel;
  lastForecastChange: string | null;
  days: Record<DayKey, RaceDayForecast>;
  hourly: HourlyPoint[];
  volatility: VolatilityStats;
}

export interface ChangelogEntry {
  at: string;
  snapshotId: string;
  severity: ChangelogSeverity;
  summary: string;
  details: string[];
  panicIndexFrom?: PanicIndexLevel;
  panicIndexTo?: PanicIndexLevel;
  /** Legacy fields */
  defconFrom?: PanicIndexLevel;
  defconTo?: PanicIndexLevel;
}

export interface ChangelogFile {
  entries: ChangelogEntry[];
}

export interface DataIndex {
  snapshots: string[];
}

export interface LatestPointer {
  snapshotId: string;
  updatedAt: string;
}

export interface CompareResult {
  hasMeaningfulChange: boolean;
  details: string[];
  severity: ChangelogSeverity;
  summary: string;
  panicIndexFrom?: PanicIndexLevel;
  panicIndexTo?: PanicIndexLevel;
  notificationTitle: string;
  notificationBody: string;
}

export interface NormalizedForecast {
  noaaGeneratedAt: string;
  days: Record<DayKey, Omit<RaceDayForecast, "trend">>;
  hourly: HourlyPoint[];
}

/** Raw snapshot shape from disk (may use legacy defcon field) */
export type RawForecastSnapshot = Omit<ForecastSnapshot, "panicIndex"> & {
  panicIndex?: PanicIndexLevel;
  panicScale?: number;
  defcon?: PanicIndexLevel;
};
