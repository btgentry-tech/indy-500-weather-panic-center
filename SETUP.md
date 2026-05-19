# Setup Guide — Indy 500 Weather Panic Center

Step-by-step instructions for Brandon. No advanced assumptions.

---

## Part 1 — Create the Firebase project

1. Open [https://console.firebase.google.com](https://console.firebase.google.com)
2. Click **Add project**
3. Name it `indy-weather-panic` (or similar) → Continue → Create project
4. In the left sidebar, click **Build** → **Messaging**
5. If prompted, click **Get started** to enable Cloud Messaging

### Web app config

1. Click the gear icon → **Project settings**
2. Scroll to **Your apps** → click the **Web** icon `</>`
3. App nickname: `panic-center-web` → Register app
4. Copy the `firebaseConfig` values — you will paste them into `.env.local` soon

### Web Push key (VAPID)

1. Still in **Project settings** → tab **Cloud Messaging**
2. Scroll to **Web configuration** → **Web Push certificates**
3. Click **Generate key pair**
4. Copy the key → this is `NEXT_PUBLIC_FIREBASE_VAPID_KEY`

### Service account (for server + GitHub Actions)

1. **Project settings** → tab **Service accounts**
2. Click **Generate new private key** → Confirm
3. A `.json` file downloads — keep it safe
4. You will paste the **entire JSON file contents** into `FIREBASE_SERVICE_ACCOUNT_JSON` (as one line in GitHub/Vercel, or multiline in `.env.local`)

---

## Part 2 — Local environment file

1. Open Terminal
2. Run:

```bash
cd ~/Documents/indy-500-weather-panic-center
cp .env.example .env.local
```

3. Open `.env.local` in Cursor or TextEdit
4. Fill in every value:

| Variable | Where to get it |
|----------|-----------------|
| `NOAA_USER_AGENT` | `(indy-panic-center, your-email@example.com)` |
| `NEXT_PUBLIC_FIREBASE_*` | Firebase web app config |
| `NEXT_PUBLIC_FIREBASE_VAPID_KEY` | Cloud Messaging → Web Push key pair |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Paste full service account JSON |
| `FCM_TOPIC` | `indy-panic` (default is fine) |

5. Generate `public/firebase-config.json` for the service worker:

```bash
npm run prebuild
```

6. Start the app:

```bash
npm run dev
```

7. Open [http://localhost:3000](http://localhost:3000)

---

## Part 3 — GitHub repository

1. Go to [https://github.com/new](https://github.com/new)
2. Repository name: `indy-500-weather-panic-center`
3. Create repository (no need to add README if you already have code)
4. In Terminal:

```bash
cd ~/Documents/indy-500-weather-panic-center
git remote add origin https://github.com/YOUR_USERNAME/indy-500-weather-panic-center.git
git add .
git commit -m "Initial panic center deployment"
git push -u origin main
```

### GitHub Actions (optional manual poll only)

Production polling runs on **Vercel Cron**, not GitHub schedule. You can still run **Actions → Poll Weather (manual)** if you add a `BLOB_READ_WRITE_TOKEN` secret (same token as Vercel).

---

## Part 4 — Deploy to Vercel

1. Go to [https://vercel.com](https://vercel.com) → sign in
2. **Add New** → **Project**
3. Import your GitHub repo `indy-500-weather-panic-center`
4. Framework: **Next.js** (auto-detected)
5. **Storage** → create a **Blob** store and connect it to the project (auto-adds `BLOB_READ_WRITE_TOKEN`)
6. **Settings** → **Environment Variables** — add every variable from `.env.local`, plus:

| Variable | Required | Notes |
|----------|----------|-------|
| `CRON_SECRET` | Yes | Long random string; Vercel Cron sends `Authorization: Bearer …` |
| `NOAA_USER_AGENT` | Yes | `(indy-panic-center, you@email.com)` |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | For push | Full service account JSON |
| `FCM_TOPIC` | Optional | Default `indy-panic` |
| `NEXT_PUBLIC_FIREBASE_*` | Yes | Web app config |
| `NEXT_PUBLIC_FIREBASE_VAPID_KEY` | Yes | Web push key |
| `BLOB_READ_WRITE_TOKEN` | Yes | Auto-set when Blob store is linked |

7. Click **Deploy**
8. **Settings** → **Cron Jobs** — confirm `/api/poll-weather` every 15 minutes (from `vercel.json`)
9. **Settings** → **General** → leave **Output Directory** blank (do not set `out` — that disables API routes)

### Test poll manually

```bash
curl -s "https://YOUR-APP.vercel.app/api/poll-weather?secret=YOUR_CRON_SECRET" | jq
```

Expect JSON with `checkedAt`, `snapshotSaved`, `notificationSent`, `panicIndex`, etc.

### Verify cron is firing

1. Vercel → **Logs** → filter path `/api/poll-weather` — entries every ~15 min
2. Site **Last NOAA check** should advance (may lag one ISR cycle; client refresh hits `/api/data/station`)
3. Vercel → **Storage** → **Blob** → files under `weather-data/`

### Install on phone (iPhone)

1. Open the Vercel URL in **Safari**
2. Tap **Share** → **Add to Home Screen**
3. Open the app from your home screen
4. Tap **Enable Atmospheric Alerts** and allow notifications

> iOS only sends push notifications to installed home-screen PWAs (16.4+).

### Install on Android

1. Open the Vercel URL in Chrome
2. Tap menu → **Install app** or **Add to Home screen**
3. Enable alerts from inside the app

---

## Part 5 — Verify notifications

1. On the deployed site, enable alerts (subscribes your device to topic `indy-panic`)
2. Trigger a poll (`curl` above) or run locally after a forecast change:

```bash
npm run poll:dry   # preview only
npm run poll       # saves snapshot + may notify
```

3. You should receive a notification like: `PANIC INDEX elevated to 2. Storm timing moved earlier.`

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| NOAA errors | Set `NOAA_USER_AGENT` with a real contact email |
| Subscribe API 500 | Check `FIREBASE_SERVICE_ACCOUNT_JSON` on Vercel |
| No push on iPhone | Must use Home Screen installed PWA, not Safari tab |
| Empty dashboard | Link Vercel Blob, set `CRON_SECRET`, trigger `/api/poll-weather` |
| API routes 404 | Clear Vercel **Output Directory** (must be empty for Next.js serverless) |
| Last NOAA check stuck | Check Vercel Cron logs; confirm `CRON_SECRET` + Blob token |
| Service worker errors | Run `npm run prebuild` after changing Firebase env vars; push requires production build (`npm run build && npm start`) — dev mode disables PWA |
| Alerts show OFFLINE after subscribe | Check Vercel env vars; confirm `/sw.js` loads on deployed site |

---

## File locations cheat sheet

| What | Path |
|------|------|
| Live data (production) | Vercel Blob `weather-data/*` |
| Seed / local dev data | `public/data/*` |
| Poll logic | `src/lib/run-poll.ts` |
| Cron endpoint | `src/app/api/poll-weather/route.ts` |
| Poll CLI | `npm run poll` |
| Optional manual GHA | `.github/workflows/poll-weather.yml` |
| FCM handlers (imported into PWA SW) | `public/fcm-handlers.js` |
