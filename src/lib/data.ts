import fs from "fs/promises";
import path from "path";
import { resolveSnapshotStabilityLevel } from "./forecast-stability";
import { normalizeLegacyPanicIndex } from "./panic-index";
import type {
  ChangelogEntry,
  ChangelogFile,
  DataIndex,
  ForecastSnapshot,
  LatestPointer,
  RawForecastSnapshot,
  StationMeta,
} from "./types";

export const DATA_DIR = path.join(process.cwd(), "public", "data");
export const HISTORY_DIR = path.join(DATA_DIR, "history");

export function historyPath(id: string): string {
  return path.join(HISTORY_DIR, `${id}.json`);
}

export function normalizeSnapshot(raw: RawForecastSnapshot): ForecastSnapshot {
  const rawLevel = raw.panicIndex ?? raw.defcon ?? 3;
  const panicIndex =
    raw.panicScale === 2
      ? (rawLevel as ForecastSnapshot["panicIndex"])
      : normalizeLegacyPanicIndex(rawLevel);
  const volatility = raw.volatility ?? {
    changes24h: 0,
    largestRainSwing: 0,
    stabilityScore: raw.forecastStability ?? 50,
    volatilityScore: 100 - (raw.forecastStability ?? 50),
  };

  return {
    ...raw,
    panicIndex,
    panicScale: 2,
    defcon: panicIndex,
    volatility,
    forecastStabilityLevel: resolveSnapshotStabilityLevel({
      ...raw,
      panicIndex,
      volatility,
    }),
  };
}

export function normalizeChangelogEntry(entry: ChangelogEntry): ChangelogEntry {
  return {
    ...entry,
    panicIndexFrom: entry.panicIndexFrom ?? entry.defconFrom,
    panicIndexTo: entry.panicIndexTo ?? entry.defconTo,
  };
}

export function snapshotForDisk(
  snapshot: ForecastSnapshot,
): ForecastSnapshot {
  return {
    ...snapshot,
    panicIndex: snapshot.panicIndex,
    panicScale: 2,
    defcon: snapshot.panicIndex,
  };
}

export async function readJson<T>(filePath: string): Promise<T | null> {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function writeJson(filePath: string, data: unknown): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

export async function loadIndex(): Promise<DataIndex> {
  return (
    (await readJson<DataIndex>(path.join(DATA_DIR, "index.json"))) ?? {
      snapshots: [],
    }
  );
}

export async function loadLatestPointer(): Promise<LatestPointer | null> {
  return readJson<LatestPointer>(path.join(DATA_DIR, "latest.json"));
}

export async function loadLatestSnapshot(): Promise<ForecastSnapshot | null> {
  const pointer = await loadLatestPointer();
  if (!pointer) return null;
  return loadSnapshot(pointer.snapshotId);
}

export async function loadSnapshot(id: string): Promise<ForecastSnapshot | null> {
  const raw = await readJson<RawForecastSnapshot>(historyPath(id));
  if (!raw) return null;
  return normalizeSnapshot(raw);
}

export async function loadAllSnapshots(): Promise<ForecastSnapshot[]> {
  const index = await loadIndex();
  const snapshots: ForecastSnapshot[] = [];
  for (const id of index.snapshots) {
    const snap = await loadSnapshot(id);
    if (snap) snapshots.push(snap);
  }
  return snapshots;
}

const EMPTY_STATION: StationMeta = {
  lastCheckedAt: null,
  lastSnapshotAt: null,
  lastSnapshotId: null,
  lastOperationalUpdateAt: null,
  lastOperationalUpdateSummary: null,
};

/** Align station telemetry with the latest snapshot — single source for forecast time. */
export function normalizeStationMeta(
  raw: StationMeta,
  latestSnapshot: ForecastSnapshot | null,
): StationMeta {
  let lastSnapshotAt = raw.lastSnapshotAt;
  let lastSnapshotId = raw.lastSnapshotId;
  let lastOperationalUpdateAt = raw.lastOperationalUpdateAt ?? null;
  let lastOperationalUpdateSummary = raw.lastOperationalUpdateSummary ?? null;

  if (latestSnapshot) {
    lastSnapshotId = latestSnapshot.id;
    lastSnapshotAt = latestSnapshot.fetchedAt;
    if (latestSnapshot.lastForecastChange) {
      lastOperationalUpdateAt = latestSnapshot.fetchedAt;
      lastOperationalUpdateSummary = latestSnapshot.lastForecastChange;
    }
  }

  return {
    ...raw,
    lastSnapshotId,
    lastSnapshotAt,
    lastOperationalUpdateAt,
    lastOperationalUpdateSummary,
  };
}

export async function loadStationMeta(): Promise<StationMeta> {
  const raw =
    (await readJson<StationMeta>(path.join(DATA_DIR, "station.json"))) ??
    { ...EMPTY_STATION };
  const latestSnapshot = await loadLatestSnapshot();
  return normalizeStationMeta(raw, latestSnapshot);
}

export async function updateStationMeta(meta: StationMeta): Promise<void> {
  await writeJson(path.join(DATA_DIR, "station.json"), meta);
}

export async function loadChangelog(): Promise<ChangelogFile> {
  const file =
    (await readJson<ChangelogFile>(path.join(DATA_DIR, "changelog.json"))) ?? {
      entries: [],
    };
  return {
    entries: file.entries.map(normalizeChangelogEntry),
  };
}

export async function saveSnapshot(snapshot: ForecastSnapshot): Promise<void> {
  await writeJson(historyPath(snapshot.id), snapshotForDisk(snapshot));
}

export async function updateIndex(id: string): Promise<void> {
  const index = await loadIndex();
  if (!index.snapshots.includes(id)) {
    index.snapshots.push(id);
  }
  await writeJson(path.join(DATA_DIR, "index.json"), index);
}

export async function updateLatest(
  id: string,
  updatedAt: string = new Date().toISOString(),
): Promise<void> {
  await writeJson(path.join(DATA_DIR, "latest.json"), {
    snapshotId: id,
    updatedAt,
  } satisfies LatestPointer);
}

export async function appendChangelog(
  changelog: ChangelogFile,
  entry: ChangelogEntry,
): Promise<void> {
  changelog.entries.unshift(entry);
  changelog.entries = changelog.entries.slice(0, 200);
  await writeJson(path.join(DATA_DIR, "changelog.json"), changelog);
}

export function publicDataUrl(relative: string): string {
  return `/data/${relative}`;
}
