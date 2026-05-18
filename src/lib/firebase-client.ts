import { initializeApp, getApps } from "firebase/app";
import {
  getMessaging,
  isSupported,
  type Messaging,
} from "firebase/messaging";

function getFirebaseConfig() {
  return {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };
}

export function getVapidKey(): string {
  const key = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
  if (!key) {
    throw new Error("NEXT_PUBLIC_FIREBASE_VAPID_KEY is not configured.");
  }
  return key;
}

export async function getClientMessaging(): Promise<Messaging> {
  const supported = await isSupported();
  if (!supported) {
    throw new Error("Firebase messaging not supported in this browser.");
  }

  const config = getFirebaseConfig();
  if (!config.apiKey || !config.projectId) {
    throw new Error("Firebase client environment variables are not configured.");
  }

  const app =
    getApps().length > 0 ? getApps()[0]! : initializeApp(config);

  return getMessaging(app);
}
