import { compareForecasts } from "../src/lib/compare";
import {
  appendChangelog,
  loadAllSnapshots,
  loadChangelog,
  loadLatestSnapshot,
  loadStationMeta,
  saveSnapshot,
  updateIndex,
  updateLatest,
  updateStationMeta,
} from "../src/lib/data";
import { sendTopicNotification } from "../src/lib/firebase-admin";
import { fetchNoaaForecast } from "../src/lib/noaa";
import { isWithinPollingWindow } from "../src/lib/race-days";
import {
  buildSnapshot,
  shouldPersistSnapshot,
} from "../src/lib/snapshot-builder";
import type { ChangelogEntry, StationMeta } from "../src/lib/types";

const dryRun = process.argv.includes("--dry-run");
/** Bypass April–May window check (GitHub Actions) */
const forceWindow = process.argv.includes("--force-window");

async function main() {
  if (!forceWindow && !isWithinPollingWindow()) {
    console.log("Outside polling window. Exiting cleanly.");
    return;
  }

  const checkedAt = new Date().toISOString();
  const priorStation = await loadStationMeta();
  const station: StationMeta = {
    ...priorStation,
    lastCheckedAt: checkedAt,
  };

  const forecast = await fetchNoaaForecast();
  const history = await loadAllSnapshots();
  const previous = await loadLatestSnapshot();
  const snapshot = buildSnapshot(forecast, history);

  const compare = compareForecasts(
    previous,
    snapshot.days,
    snapshot.hourly,
    snapshot.panicIndex,
    previous?.panicIndex,
  );

  const shouldSave =
    !previous || shouldPersistSnapshot(previous, snapshot);

  if (!shouldSave) {
    if (!dryRun) {
      await updateStationMeta(station);
    }
    console.log("No material forecast change. Snapshot not saved.");
    console.log(`NOAA checked at ${checkedAt}`);
    return;
  }

  if (dryRun) {
    console.log("DRY RUN — would save snapshot:", snapshot.id);
    console.log("Notify:", compare.hasMeaningfulChange);
    console.log("Compare:", compare);
    return;
  }

  await saveSnapshot(snapshot);
  await updateIndex(snapshot.id);
  await updateLatest(snapshot.id);

  station.lastSnapshotAt = snapshot.fetchedAt;
  station.lastSnapshotId = snapshot.id;

  if (compare.hasMeaningfulChange) {
    station.lastForecastChangeAt = snapshot.fetchedAt;
    station.lastForecastChangeSummary = compare.summary;

    const changelog = await loadChangelog();
    const entry: ChangelogEntry = {
      at: snapshot.fetchedAt,
      snapshotId: snapshot.id,
      severity: compare.severity,
      summary: compare.summary,
      details: compare.details,
      panicIndexFrom: compare.panicIndexFrom,
      panicIndexTo: compare.panicIndexTo,
      defconFrom: compare.panicIndexFrom,
      defconTo: compare.panicIndexTo,
    };
    await appendChangelog(changelog, entry);

    if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
      await sendTopicNotification(
        compare.notificationTitle,
        compare.notificationBody,
      );
      console.log("Notification dispatched to topic.");
    } else {
      console.log(
        "Skipping notification — FIREBASE_SERVICE_ACCOUNT_JSON not set.",
      );
    }
  } else {
    console.log("Snapshot saved; no notification (immaterial revision).");
  }

  await updateStationMeta(station);

  console.log(
    `Snapshot saved: ${snapshot.id} (PANIC INDEX ${snapshot.panicIndex})`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
