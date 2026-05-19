# INDY 500 WEATHER PANIC CENTER

Atmospheric Monitoring Division — unofficial race weekend forecast bunker.

Tracks NOAA forecasts for Indianapolis Motor Speedway (`39.7950, -86.2347`), stores hourly snapshots as JSON, computes PANIC INDEX escalation levels, and sends Firebase topic push notifications when forecasts change materially.

**Not** affiliated with IMS, NWS, or Doug Boles (he is merely pacing internally).

## Stack

- Next.js (App Router) + TypeScript
- Chart.js — forecast history charts
- NOAA Weather API — `api.weather.gov`
- JSON files in `public/data/` — no database
- GitHub Actions — hourly polling + git commits
- Firebase Cloud Messaging — topic `indy-panic`
- Vercel — hosting
- PWA — `@ducanh2912/next-pwa`

## Pages

| Route | Purpose |
|-------|---------|
| `/` | Panic index dashboard, forecast table, change feed |
| `/history` | Rain %, panic index, volatility charts |
| `/timeline` | Snapshot log (weather git history) |

## Commands

```bash
npm run dev          # local dev (port 3000)
npm run build        # production build
npm run poll:dry     # preview NOAA poll without writing files
npm run poll         # fetch NOAA, save snapshot, maybe notify
```

## Environment variables

See [`.env.example`](.env.example). Full click-by-click setup: **[SETUP.md](SETUP.md)**.

## PANIC INDEX levels

| Level | Mood |
|-------|------|
| 5 | Ideal grilling weather |
| 4 | Minor atmospheric nonsense |
| 3 | Monitoring situation |
| 2 | Dangerous moisture developments |
| 1 | Race control pacing internally |

## 2026 race weekend dates

- **Carb Day** — May 22, 2026
- **Legends Day** — May 23, 2026
- **Race Day** — May 24, 2026

## Data format

Snapshots: `public/data/history/YYYY-MM-DD-HHmm.json`

See seed files for example structure.

## License

Fan project. Use responsibly. Do not trust weather apps.
