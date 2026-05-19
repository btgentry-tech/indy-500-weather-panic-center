import { compareForecasts } from "./compare";
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
} from "./data";
import { sendTopicNotification } from "./firebase-admin";
import { fetchLocalConditionsSafe, fetchNoaaForecast } from "./noaa";
import { isWithinPollingWindow } from "./race-days";
import { buildSnapshot, shouldPersistSnapshot } from "./snapshot-builder";
import { seedBlobFromPublicIfEmpty, writeStorageJson } from "./storage";
import type { ChangelogEntry, PollHeartbeat, StationMeta } from "./types";

export interface PollRunLog {
  ok: boolean;
  checkedAt: string;
  outcome: PollHeartbeat["outcome"];
  message: string;
  snapshotSaved: boolean;
  snapshotId?: string;
  forecastChanged: boolean;
  notificationSent: boolean;
  panicIndex?: number;
  seededFromPublic?: boolean;
  error?: string;
}

export interface RunPollOptions {
  /** Skip April–May window guard (local dev / forced runs). */
  forceWindow?: boolean;
  dryRun?: boolean;
}

async function writeHeartbeat(hb: PollHeartbeat, dryRun: boolean): Promise<void> {
  if (dryRun) return;
  await writeStorageJson("poll-heartbeat.json", hb);
}

export async function runPoll(options: RunPollOptions = {}): Promise<PollRunLog> {
  const { forceWindow = false, dryRun = false } = options;
  const checkedAt = new Date().toISOString();

  const seededFromPublic = await seedBlobFromPublicIfEmpty();

  const priorStation = await loadStationMeta();
  let station: StationMeta = {
    ...priorStation,
    lastCheckedAt: checkedAt,
  };

  if (!forceWindow && !isWithinPollingWindow()) {
    if (!dryRun) {
      await updateStationMeta(station);
      await writeHeartbeat(
        {
          at: checkedAt,
          ok: true,
          outcome: "outside_window",
          message: "Outside April–May polling window.",
        },
        dryRun,
      );
    }
    return {
      ok: true,
      checkedAt,
      outcome: "outside_window",
      message: "Outside April–May polling window.",
      snapshotSaved: false,
      forecastChanged: false,
      notificationSent: false,
      seededFromPublic,
    };
  }

  try {
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

    if (!shouldSave) {
      if (!dryRun) {
        await updateStationMeta(station);
        await writeHeartbeat(
          {
            at: checkedAt,
            ok: true,
            outcome: "checked_no_save",
            message: "NOAA checked; no material forecast change.",
            shouldSave: false,
            hasMeaningfulChange: compare.hasMeaningfulChange,
            panicIndex: snapshot.panicIndex,
          },
          dryRun,
        );
      }
      return {
        ok: true,
        checkedAt,
        outcome: "checked_no_save",
        message: "NOAA checked; no material forecast change.",
        snapshotSaved: false,
        forecastChanged: compare.hasMeaningfulChange,
        notificationSent: false,
        panicIndex: snapshot.panicIndex,
        seededFromPublic,
      };
    }

    if (dryRun) {
      return {
        ok: true,
        checkedAt,
        outcome: "saved",
        message: `DRY RUN — would save ${snapshot.id}`,
        snapshotSaved: false,
        forecastChanged: compare.hasMeaningfulChange,
        notificationSent: false,
        panicIndex: snapshot.panicIndex,
        snapshotId: snapshot.id,
        seededFromPublic,
      };
    }

    await saveSnapshot(snapshot);
    await updateIndex(snapshot.id);
    await updateLatest(snapshot.id);

    station.lastSnapshotAt = snapshot.fetchedAt;
    station.lastSnapshotId = snapshot.id;

    let outcome: PollHeartbeat["outcome"] = "saved";
    let message = `Snapshot saved: ${snapshot.id}`;
    let notificationSent = false;

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
        notificationSent = true;
      } else {
        message =
          "Snapshot saved; notification skipped (no FIREBASE_SERVICE_ACCOUNT_JSON).";
      }
    }

    await updateStationMeta(station);
    await writeHeartbeat(
      {
        at: checkedAt,
        ok: true,
        outcome,
        message,
        shouldSave: true,
        hasMeaningfulChange: compare.hasMeaningfulChange,
        snapshotId: snapshot.id,
        panicIndex: snapshot.panicIndex,
      },
      dryRun,
    );

    return {
      ok: true,
      checkedAt,
      outcome,
      message,
      snapshotSaved: true,
      snapshotId: snapshot.id,
      forecastChanged: compare.hasMeaningfulChange,
      notificationSent,
      panicIndex: snapshot.panicIndex,
      seededFromPublic,
    };
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    try {
      if (!dryRun) await updateStationMeta(station);
    } catch {
      /* best effort */
    }
    if (!dryRun) {
      await writeHeartbeat(
        {
          at: checkedAt,
          ok: false,
          outcome: "error",
          message: errMsg,
          error: errMsg,
        },
        dryRun,
      );
    }
    return {
      ok: false,
      checkedAt,
      outcome: "error",
      message: errMsg,
      snapshotSaved: false,
      forecastChanged: false,
      notificationSent: false,
      error: errMsg,
      seededFromPublic,
    };
  }
}
