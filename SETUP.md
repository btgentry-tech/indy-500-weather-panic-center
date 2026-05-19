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

### GitHub Actions secrets

1. Repo → **Settings** → **Secrets and variables** → **Actions**
2. Add:

| Secret | Required | Notes |
|--------|----------|-------|
| `NOAA_USER_AGENT` | Yes | Same as `.env.local` |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | For push | Full service account JSON |
| `FCM_TOPIC` | Optional | Default `indy-panic` |

### Allow workflow to push commits

1. **Settings** → **Actions** → **General**
2. **Workflow permissions** → **Read and write permissions**
3. Save

### Enable scheduled workflows

**Settings** → **Actions** → **General** → ensure Actions and scheduled workflows are enabled.

### Test the 15-minute poll

1. **Actions** → **Poll Weather** → **Run workflow**
2. Wait for green checkmark
3. Confirm a new commit on `main` like `chore(weather): poll …`
4. Check `public/data/station.json` — `lastCheckedAt` should update every run

---

## Part 4 — Deploy to Vercel

Vercel only hosts the site. **Polling runs on GitHub Actions** (free every 15 minutes).

1. Go to [https://vercel.com](https://vercel.com) → sign in
2. **Add New** → **Project** → import `indy-500-weather-panic-center`
3. Framework: **Next.js** (auto-detected)
4. **Environment Variables** — add from `.env.local` (Firebase client + admin for subscribe API):

| Variable | Required on Vercel |
|----------|-------------------|
| `NEXT_PUBLIC_FIREBASE_*` | Yes (alerts PWA) |
| `NEXT_PUBLIC_FIREBASE_VAPID_KEY` | Yes |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Yes (`/api/subscribe`) |
| `FCM_TOPIC` | Optional |

`NOAA_USER_AGENT` is **not** required on Vercel (only in GitHub Actions).

5. Click **Deploy** — each `chore(weather): poll …` push to `main` triggers a redeploy

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
2. Send a **manual test push** (no forecast change required):

```bash
npm run notify:test
```

Or in GitHub: **Actions** → **Test Push Notification** → **Run workflow**.

3. Put the app in the background (or close it) and wait for the OS notification. If the app is open in the foreground, you may only see the in-app `INCOMING:` line instead.

4. For a real forecast-driven push, run **Poll Weather** after a forecast change, or locally:

```bash
npm run poll:dry   # preview only
npm run poll       # saves snapshot + may notify
```

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| NOAA errors | Set `NOAA_USER_AGENT` with a real contact email |
| Subscribe API 500 | Check `FIREBASE_SERVICE_ACCOUNT_JSON` on Vercel |
| No push on iPhone | Must use Home Screen installed PWA, not Safari tab |
| Empty dashboard | Run `npm run poll` or wait for GitHub Actions |
| Last NOAA check stuck | Check **Actions** → Poll Weather; enable scheduled workflows |
| No `chore(weather)` commits | Verify `NOAA_USER_AGENT` secret; check workflow logs |
| Service worker errors | Run `npm run prebuild` after changing Firebase env vars; push requires production build (`npm run build && npm start`) — dev mode disables PWA |
| Alerts show OFFLINE after subscribe | Check Vercel env vars; confirm `/sw.js` loads on deployed site |

---

## File locations cheat sheet

| What | Path |
|------|------|
| Snapshots / station meta | `public/data/*` |
| Poll logic | `src/lib/run-poll.ts` |
| Poll CLI | `npm run poll` |
| Scheduled poll | `.github/workflows/poll-weather.yml` |
| FCM handlers (imported into PWA SW) | `public/fcm-handlers.js` |
