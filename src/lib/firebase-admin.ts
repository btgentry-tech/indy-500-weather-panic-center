import { initializeApp, getApps, cert, type App } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";
import { FCM_TOPIC_DEFAULT } from "./race-days";

let app: App | undefined;

export function getFirebaseAdminApp(): App {
  if (app) return app;
  if (getApps().length > 0) {
    app = getApps()[0]!;
    return app;
  }

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON is not set");
  }

  const serviceAccount = JSON.parse(raw) as {
    project_id: string;
    client_email: string;
    private_key: string;
  };

  app = initializeApp({
    credential: cert({
      projectId: serviceAccount.project_id,
      clientEmail: serviceAccount.client_email,
      privateKey: serviceAccount.private_key.replace(/\\n/g, "\n"),
    }),
  });

  return app;
}

/** Empty `FCM_TOPIC` env (e.g. unset GitHub secret) falls back to default. */
export function resolveFcmTopic(override?: string): string {
  const configured = (override ?? process.env.FCM_TOPIC)?.trim();
  return configured || FCM_TOPIC_DEFAULT;
}

export async function subscribeTokenToTopic(
  token: string,
  topic?: string,
): Promise<void> {
  const resolved = resolveFcmTopic(topic);
  const messaging = getMessaging(getFirebaseAdminApp());
  await messaging.subscribeToTopic([token], resolved);
}

export async function unsubscribeTokenFromTopic(
  token: string,
  topic?: string,
): Promise<void> {
  const resolved = resolveFcmTopic(topic);
  const messaging = getMessaging(getFirebaseAdminApp());
  await messaging.unsubscribeFromTopic([token], resolved);
}

export async function sendTopicNotification(
  title: string,
  body: string,
  topic?: string,
): Promise<void> {
  const resolved = resolveFcmTopic(topic);
  const messaging = getMessaging(getFirebaseAdminApp());
  await messaging.send({
    topic: resolved,
    notification: { title, body },
    webpush: {
      notification: {
        title,
        body,
        icon: "/icons/icon-192.svg",
      },
    },
  });
}
