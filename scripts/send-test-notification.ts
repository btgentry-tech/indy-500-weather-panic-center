import { sendTopicNotification } from "../src/lib/firebase-admin";
import { FCM_TOPIC_DEFAULT } from "../src/lib/race-days";

async function main() {
  if (!process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    console.error(
      "FIREBASE_SERVICE_ACCOUNT_JSON is not set. Add it to .env.local or GitHub Actions secrets.",
    );
    process.exit(1);
  }

  const topic = process.env.FCM_TOPIC ?? FCM_TOPIC_DEFAULT;
  const customBody = process.argv.slice(2).join(" ").trim();
  const title = "Test — Weather Alert";
  const body =
    customBody ||
    "Manual test from Indy 500 Weather Panic Center. If you see this, push notifications are working.";

  await sendTopicNotification(title, body, topic);
  console.log(`Sent to topic "${topic}":`);
  console.log(`  ${title}`);
  console.log(`  ${body}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
