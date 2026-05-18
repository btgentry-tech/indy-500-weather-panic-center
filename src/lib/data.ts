import fs from "fs/promises";
import path from "path";
import type {
  ChangelogFile,
  DataIndex,
  ForecastSnapshot,
  LatestPointer,
} from "./types";

export const DATA_DIR = path.join(process.cwd(), "public", "data");
export const HISTORY_DIR = path.join(DATA_DIR, "history");

export function historyPath(id: string): string {
  return path.join(HISTORY_DIR, `${id}.json`);
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
  return readJson<ForecastSnapshot>(historyPath(id));
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

export async function loadChangelog(): Promise<ChangelogFile> {
  return (
    (await readJson<ChangelogFile>(path.join(DATA_DIR, "changelog.json"))) ?? {
      entries: [],
    }
  );
}

export async function saveSnapshot(snapshot: ForecastSnapshot): Promise<void> {
  await writeJson(historyPath(snapshot.id), snapshot);
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
  entry: ChangelogFile["entries"][number],
): Promise<void> {
  changelog.entries.unshift(entry);
  changelog.entries = changelog.entries.slice(0, 200);
  await writeJson(path.join(DATA_DIR, "changelog.json"), changelog);
}

/** Public URL helpers for client-side fetches */
export function publicDataUrl(relative: string): string {
  return `/data/${relative}`;
}
