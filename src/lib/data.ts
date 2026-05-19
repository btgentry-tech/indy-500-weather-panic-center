import fs from "fs/promises";
import path from "path";
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
  return {
    ...raw,
    panicIndex,
    panicScale: 2,
    defcon: panicIndex,
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
  return (await readJson<DataIndex>(path.join(DATA_DIR, "index.json"))) ?? {
    snapshots: [],
  };
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
  lastForecastChangeAt: null,
  lastForecastChangeSummary: null,
};

export async function loadStationMeta(): Promise<StationMeta> {
  const meta =
    (await readJson<StationMeta>(path.join(DATA_DIR, "station.json"))) ??
    { ...EMPTY_STATION };

  if (!meta.lastSnapshotId) {
    const latest = await loadLatestPointer();
    if (latest) {
      meta.lastSnapshotId = latest.snapshotId;
      meta.lastSnapshotAt = latest.updatedAt;
    }
  }

  if (!meta.lastForecastChangeSummary) {
    const snap = await loadLatestSnapshot();
    if (snap?.lastForecastChange) {
      meta.lastForecastChangeSummary = snap.lastForecastChange;
      meta.lastForecastChangeAt = meta.lastForecastChangeAt ?? snap.fetchedAt;
    }
  }

  return meta;
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

export async function updateLatest(id: string): Promise<void> {
  await writeJson(path.join(DATA_DIR, "latest.json"), {
    snapshotId: id,
    updatedAt: new Date().toISOString(),
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
