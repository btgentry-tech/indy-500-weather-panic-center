/**
 * Rewrites snapshot `mood` fields from current PANIC_INDEX_MOODS (by panicIndex).
 * Use after copy changes so timeline/history JSON matches the live hero without a NOAA poll.
 */
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const HISTORY_DIR = path.join(ROOT, "public", "data", "history");

const PANIC_INDEX_MOODS = {
  1: "Minimal threat. Backyard cookout conditions. Stable pattern. Panic systems idle.",
  2: "Minor concern. Small storm energy detected. Fans remain cautiously hydrated. Conditions worth monitoring.",
  3: "Moderate concern. Forecast confidence weakening. Pattern instability increasing. Contingency beers advised.",
  4: "High concern. Track drying equipment on standby. Atmospheric chaos entering the chat.",
  5: "Red alert. Every uncle in Indiana is now a meteorologist. Significant weather disruption possible.",
};

const files = await fs.readdir(HISTORY_DIR);
let updated = 0;

for (const name of files) {
  if (!name.endsWith(".json")) continue;
  const filePath = path.join(HISTORY_DIR, name);
  const raw = await fs.readFile(filePath, "utf8");
  const snap = JSON.parse(raw);
  const level = snap.panicIndex ?? snap.defcon;
  const mood = PANIC_INDEX_MOODS[level];
  if (!mood || snap.mood === mood) continue;
  snap.mood = mood;
  await fs.writeFile(filePath, `${JSON.stringify(snap, null, 2)}\n`, "utf8");
  updated += 1;
}

console.log(`Updated mood on ${updated} snapshot file(s).`);
