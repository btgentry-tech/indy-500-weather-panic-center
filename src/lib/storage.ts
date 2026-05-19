import fs from "fs/promises";
import path from "path";
import { head, put } from "@vercel/blob";

export const DATA_DIR = path.join(process.cwd(), "public", "data");
const BLOB_PREFIX = "weather-data/";

export function useBlobStorage(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

function blobPathname(relativePath: string): string {
  return `${BLOB_PREFIX}${relativePath.replace(/^\//, "")}`;
}

async function readJsonFs<T>(relativePath: string): Promise<T | null> {
  try {
    const raw = await fs.readFile(path.join(DATA_DIR, relativePath), "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

async function writeJsonFs(relativePath: string, data: unknown): Promise<void> {
  const filePath = path.join(DATA_DIR, relativePath);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

async function readJsonBlob<T>(relativePath: string): Promise<T | null> {
  try {
    const meta = await head(blobPathname(relativePath));
    const res = await fetch(meta.url, { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

async function writeJsonBlob(relativePath: string, data: unknown): Promise<void> {
  await put(blobPathname(relativePath), JSON.stringify(data, null, 2), {
    access: "public",
    addRandomSuffix: false,
    contentType: "application/json",
    allowOverwrite: true,
  });
}

export async function readStorageJson<T>(
  relativePath: string,
): Promise<T | null> {
  if (useBlobStorage()) {
    return readJsonBlob<T>(relativePath);
  }
  return readJsonFs<T>(relativePath);
}

export async function writeStorageJson(
  relativePath: string,
  data: unknown,
): Promise<void> {
  if (useBlobStorage()) {
    await writeJsonBlob(relativePath, data);
    return;
  }
  await writeJsonFs(relativePath, data);
}

/** Copy bundled public/data into Blob on first production poll. */
export async function seedBlobFromPublicIfEmpty(): Promise<boolean> {
  if (!useBlobStorage()) return false;

  const existing = await readJsonBlob("station.json");
  if (existing) return false;

  const relPaths = [
    "station.json",
    "latest.json",
    "index.json",
    "changelog.json",
    "poll-heartbeat.json",
  ];

  for (const rel of relPaths) {
    const data = await readJsonFs(rel);
    if (data) await writeJsonBlob(rel, data);
  }

  const historyDir = path.join(DATA_DIR, "history");
  try {
    const files = await fs.readdir(historyDir);
    for (const file of files) {
      if (!file.endsWith(".json")) continue;
      const data = await readJsonFs(`history/${file}`);
      if (data) await writeJsonBlob(`history/${file}`, data);
    }
  } catch {
    /* no history yet */
  }

  return true;
}
