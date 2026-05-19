/**
 * REMOVABLE DEBUG — manual FCM topic notification for pipeline verification.
 * Delete this file and the `notify:test` npm script once push is confirmed in production.
 *
 * Requires FIREBASE_SERVICE_ACCOUNT_JSON (and optional FCM_TOPIC, default indy-panic).
 * Loads .env.local from the project root when present.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { sendTopicNotification } from "../src/lib/firebase-admin";
import { FCM_TOPIC_DEFAULT } from "../src/lib/race-days";

const TITLE = "PANIC TEST";
const BODY = "Atmospheric notification pipeline operational.";

function loadEnvLocal(): void {
  const envPath = path.join(
    path.dirname(fileURLToPath(import.meta.url)),
    "..",
    ".env.local",
  );
  if (!fs.existsSync(envPath)) return;

  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

async function main(): Promise<void> {
  loadEnvLocal();

  if (!process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT_JSON is not set. Add it to .env.local or export it before running.",
    );
  }

  const topic = process.env.FCM_TOPIC ?? FCM_TOPIC_DEFAULT;
  console.log(`[notify:test] REMOVABLE DEBUG — sending to topic "${topic}"`);
  await sendTopicNotification(TITLE, BODY, topic);
  console.log(`[notify:test] Sent: "${TITLE}" / "${BODY}"`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
