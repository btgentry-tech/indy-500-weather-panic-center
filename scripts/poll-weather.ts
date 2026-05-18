import { compareForecasts } from "../src/lib/compare";
import {
  appendChangelog,
  loadAllSnapshots,
  loadChangelog,
  loadLatestSnapshot,
  saveSnapshot,
  updateIndex,
  updateLatest,
} from "../src/lib/data";
import { sendTopicNotification } from "../src/lib/firebase-admin";
import { fetchNoaaForecast } from "../src/lib/noaa";
import { isWithinPollingWindow } from "../src/lib/race-days";
import {
  buildSnapshot,
  shouldPersistSnapshot,
} from "../src/lib/snapshot-builder";
import type { ChangelogEntry } from "../src/lib/types";

const dryRun = process.argv.includes("--dry-run");
const force = process.argv.includes("--force");

async function main() {
  if (!force && !isWithinPollingWindow()) {
    console.log("Outside polling window. Exiting cleanly.");
    return;
  }

  const forecast = await fetchNoaaForecast();
  const history = await loadAllSnapshots();
  const previous = await loadLatestSnapshot();
  const snapshot = buildSnapshot(forecast, history);

  const compare = compareForecasts(
    previous,
    snapshot.days,
    snapshot.hourly,
    snapshot.defcon,
    previous?.defcon,
  );

  const shouldSave =
    force || shouldPersistSnapshot(previous, snapshot) || !previous;

  if (!shouldSave && !compare.hasMeaningfulChange) {
    console.log("No material forecast change. Snapshot not saved.");
    return;
  }

  if (dryRun) {
    console.log("DRY RUN — would save snapshot:", snapshot.id);
    console.log("Compare:", compare);
    return;
  }

  await saveSnapshot(snapshot);
  await updateIndex(snapshot.id);
  await updateLatest(snapshot.id);

  if (compare.hasMeaningfulChange) {
    const changelog = await loadChangelog();
    const entry: ChangelogEntry = {
      at: snapshot.fetchedAt,
      snapshotId: snapshot.id,
      severity: compare.severity,
      summary: compare.summary,
      details: compare.details,
      defconFrom: compare.defconFrom,
      defconTo: compare.defconTo,
    };
    await appendChangelog(changelog, entry);

    if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
      await sendTopicNotification(
        compare.notificationTitle,
        compare.notificationBody,
      );
      console.log("Notification dispatched to topic.");
    } else {
      console.log("Skipping notification — FIREBASE_SERVICE_ACCOUNT_JSON not set.");
    }
  }

  console.log(`Snapshot saved: ${snapshot.id} (DEFCON ${snapshot.defcon})`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
