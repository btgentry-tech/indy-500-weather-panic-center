export type StormRisk = "NONE" | "ELEVATED" | "ACTIVE";
export type ForecastConfidence = "STABLE" | "UNCERTAIN" | "DETERIORATING";
export type TrendArrow = "↑" | "↓" | "→";
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
  confidence: ForecastConfidence;
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

export interface RecordVolatilityStats {
  totalRevisions: number;
  changes24h: number;
  largestRainSwingRecord: number;
  latestRainSwing: number;
  stabilityScore: number;
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

/** Written every poll run for pipeline diagnostics (GitHub Actions). */
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
  panicMeter: number;
  mood: string;
  forecastStability: number;
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
  days: Record<DayKey, Omit<RaceDayForecast, "confidence" | "trend">>;
  hourly: HourlyPoint[];
}

/** Raw snapshot shape from disk (may use legacy defcon field) */
export type RawForecastSnapshot = Omit<ForecastSnapshot, "panicIndex"> & {
  panicIndex?: PanicIndexLevel;
  panicScale?: number;
  defcon?: PanicIndexLevel;
};
