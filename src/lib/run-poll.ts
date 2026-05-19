import { buildNotificationCopy, compareForecasts } from "./compare";
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
} from "./data";
import { sendTopicNotification } from "./firebase-admin";
import { fetchLocalConditionsSafe, fetchNoaaForecast } from "./noaa";
import { isWithinPollingWindow } from "./race-days";
import {
  buildSnapshot,
  hasForecastDataChanged,
} from "./snapshot-builder";
import type {
  ChangelogEntry,
  ForecastSnapshot,
  PollHeartbeat,
  StationMeta,
} from "./types";
import path from "path";

export interface PollRunLog {
  ok: boolean;
  checkedAt: string;
  outcome: PollHeartbeat["outcome"];
  message: string;
  snapshotSaved: boolean;
  snapshotId?: string;
  forecastDataChanged: boolean;
  forecastChanged: boolean;
  notificationSent: boolean;
  panicIndex?: number;
  error?: string;
}

export interface RunPollOptions {
  /** Skip April–May window guard (local dev / forced runs). */
  forceWindow?: boolean;
  dryRun?: boolean;
}

async function writeHeartbeat(hb: PollHeartbeat, dryRun: boolean): Promise<void> {
  if (dryRun) return;
  await writeJson(path.join(DATA_DIR, "poll-heartbeat.json"), hb);
}

export async function runPoll(options: RunPollOptions = {}): Promise<PollRunLog> {
  const { forceWindow = false, dryRun = false } = options;
  const checkedAt = new Date().toISOString();

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
      forecastDataChanged: false,
      forecastChanged: false,
      notificationSent: false,
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
    const fetchedAt = new Date(checkedAt);
    const snapshot = buildSnapshot(forecast, history, fetchedAt, previous);

    const compare = compareForecasts(
      previous,
      snapshot.days,
      snapshot.hourly,
      snapshot.panicIndex,
      previous?.panicIndex,
    );

    const dataChanged =
      !previous || hasForecastDataChanged(previous, snapshot);

    if (dryRun) {
      const wouldNotify =
        dataChanged && Boolean(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
      return {
        ok: true,
        checkedAt,
        outcome: "saved",
        message: `DRY RUN — would ${dataChanged ? "save" : "skip save"} ${snapshot.id}${wouldNotify ? "; would notify" : ""}`,
        snapshotSaved: false,
        forecastDataChanged: dataChanged,
        forecastChanged: dataChanged,
        notificationSent: false,
        panicIndex: snapshot.panicIndex,
        snapshotId: snapshot.id,
      };
    }

    let persisted: ForecastSnapshot;
    let outcome: PollHeartbeat["outcome"] = dataChanged ? "saved" : "checked_no_save";
    let message = dataChanged
      ? `Forecast updated: ${compare.summary}`
      : "NOAA checked; forecast unchanged.";

    if (dataChanged) {
      persisted = {
        ...snapshot,
        lastForecastChange: compare.summary,
      };
      await saveSnapshot(persisted);
      await updateIndex(persisted.id);
      await updateLatest(persisted.id, persisted.fetchedAt);

      station.lastSnapshotAt = persisted.fetchedAt;
      station.lastSnapshotId = persisted.id;
      station.lastOperationalUpdateAt = persisted.fetchedAt;
      station.lastOperationalUpdateSummary = compare.summary;

      const changelog = await loadChangelog();
      const entry: ChangelogEntry = {
        at: checkedAt,
        snapshotId: persisted.id,
        severity: compare.severity,
        summary: compare.summary,
        details: compare.details,
        panicIndexFrom: compare.panicIndexFrom,
        panicIndexTo: compare.panicIndexTo,
        defconFrom: compare.panicIndexFrom,
        defconTo: compare.panicIndexTo,
      };
      await appendChangelog(changelog, entry);

      let notificationSent = false;

      if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
        const { title, body } = buildNotificationCopy(compare);
        await sendTopicNotification(title, body);
        notificationSent = true;
        outcome = "saved_notify";
        message = `Forecast updated. ${body}`;
      } else {
        message = `Forecast updated; notification skipped (no FIREBASE_SERVICE_ACCOUNT_JSON). ${compare.summary}`;
      }

      await updateStationMeta(station);
      await writeHeartbeat(
        {
          at: checkedAt,
          ok: true,
          outcome,
          message,
          shouldSave: true,
          hasForecastDataChanged: true,
          snapshotId: persisted.id,
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
        snapshotId: persisted.id,
        forecastDataChanged: true,
        forecastChanged: true,
        notificationSent,
        panicIndex: snapshot.panicIndex,
      };
    }

    persisted = previous!;
    await updateStationMeta(station);
    await writeHeartbeat(
      {
        at: checkedAt,
        ok: true,
        outcome,
        message,
        shouldSave: false,
        hasForecastDataChanged: false,
        snapshotId: persisted.id,
        panicIndex: snapshot.panicIndex,
      },
      dryRun,
    );

    return {
      ok: true,
      checkedAt,
      outcome,
      message,
      snapshotSaved: false,
      snapshotId: persisted.id,
      forecastDataChanged: false,
      forecastChanged: false,
      notificationSent: false,
      panicIndex: snapshot.panicIndex,
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
      forecastDataChanged: false,
      forecastChanged: false,
      notificationSent: false,
      error: errMsg,
    };
  }
}
