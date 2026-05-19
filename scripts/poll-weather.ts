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
  writeJson,
  DATA_DIR,
} from "../src/lib/data";
import { sendTopicNotification } from "../src/lib/firebase-admin";
import { fetchLocalConditionsSafe, fetchNoaaForecast } from "../src/lib/noaa";
import { isWithinPollingWindow } from "../src/lib/race-days";
import {
  buildSnapshot,
  shouldPersistSnapshot,
} from "../src/lib/snapshot-builder";
import type { ChangelogEntry, PollHeartbeat, StationMeta } from "../src/lib/types";
import path from "path";

const dryRun = process.argv.includes("--dry-run");
/** Bypass April–May window check (GitHub Actions) */
const forceWindow = process.argv.includes("--force-window");

function log(msg: string): void {
  console.log(`[poll] ${msg}`);
}

async function writeHeartbeat(hb: PollHeartbeat): Promise<void> {
  if (dryRun) {
    log(`heartbeat (dry-run): ${JSON.stringify(hb)}`);
    return;
  }
  await writeJson(path.join(DATA_DIR, "poll-heartbeat.json"), hb);
}

async function main() {
  const checkedAt = new Date().toISOString();
  const priorStation = await loadStationMeta();
  let station: StationMeta = {
    ...priorStation,
    lastCheckedAt: checkedAt,
  };

  if (!forceWindow && !isWithinPollingWindow()) {
    log("Outside polling window (America/Indiana). Exiting.");
    await updateStationMeta(station);
    await writeHeartbeat({
      at: checkedAt,
      ok: true,
      outcome: "outside_window",
      message: "Outside April–May polling window.",
    });
    return;
  }

  try {
    log("Fetching NOAA forecast…");
    const [forecast, localConditions] = await Promise.all([
      fetchNoaaForecast(),
      fetchLocalConditionsSafe(),
    ]);
    station.localConditions =
      localConditions ?? priorStation.localConditions ?? null;
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

    log(
      `compare: shouldSave=${shouldSave} meaningful=${compare.hasMeaningfulChange} panic=${snapshot.panicIndex}`,
    );

    if (!shouldSave) {
      await updateStationMeta(station);
      await writeHeartbeat({
        at: checkedAt,
        ok: true,
        outcome: "checked_no_save",
        message: "NOAA checked; no material forecast change.",
        shouldSave: false,
        hasMeaningfulChange: compare.hasMeaningfulChange,
        panicIndex: snapshot.panicIndex,
      });
      log("No material forecast change. Snapshot not saved.");
      return;
    }

    if (dryRun) {
      log(`DRY RUN — would save: ${snapshot.id}`);
      log(`DRY RUN — notify: ${compare.hasMeaningfulChange}`);
      return;
    }

    await saveSnapshot(snapshot);
    await updateIndex(snapshot.id);
    await updateLatest(snapshot.id);

    station.lastSnapshotAt = snapshot.fetchedAt;
    station.lastSnapshotId = snapshot.id;

    let outcome: PollHeartbeat["outcome"] = "saved";
    let message = `Snapshot saved: ${snapshot.id}`;

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
        outcome = "saved_notify";
        message = `Snapshot saved; notification sent. ${compare.summary}`;
        log("Notification dispatched to topic.");
      } else {
        message = `Snapshot saved; notification skipped (no FIREBASE_SERVICE_ACCOUNT_JSON).`;
        log("Skipping notification — FIREBASE_SERVICE_ACCOUNT_JSON not set.");
      }
    } else {
      log("Snapshot saved; no notification (immaterial revision).");
    }

    await updateStationMeta(station);
    await writeHeartbeat({
      at: checkedAt,
      ok: true,
      outcome,
      message,
      shouldSave: true,
      hasMeaningfulChange: compare.hasMeaningfulChange,
      snapshotId: snapshot.id,
      panicIndex: snapshot.panicIndex,
    });

    log(`Done. PANIC INDEX ${snapshot.panicIndex}`);
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    log(`ERROR: ${errMsg}`);
    try {
      await updateStationMeta(station);
    } catch {
      /* best effort */
    }
    await writeHeartbeat({
      at: checkedAt,
      ok: false,
      outcome: "error",
      message: errMsg,
      error: errMsg,
    });
    throw error;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
