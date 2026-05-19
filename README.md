# INDY 500 WEATHER PANIC CENTER

Unofficial race-week forecast watch for Indianapolis Motor Speedway.

Tracks NOAA forecasts for the speedway (`39.7950, -86.2347`), stores hourly snapshots as JSON, computes a PANIC INDEX, and sends push notifications when forecasts change materially.

**Not** affiliated with IMS or NWS.

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
| `/` | Panic index, race day rain, change feed, weekend forecast |
| `/history` | Rain %, panic index, volatility charts |
| `/timeline` | Incident log of each forecast snapshot |
| `/archive` | Historic Indy weather lore (placeholder) |

## Commands

```bash
npm run dev          # local dev (port 3000)
npm run build        # production build
npm run poll:dry     # preview NOAA poll without writing files
npm run poll         # fetch NOAA, save snapshot, maybe notify
```

## Environment variables

See [`.env.example`](.env.example). Full setup: **[SETUP.md](SETUP.md)**.

## PANIC INDEX levels

| Level | Typical read |
|-------|----------------|
| 5 | Quiet — track drying possible |
| 4 | Mostly quiet |
| 3 | Monitoring storm timing |
| 2 | Conditions unstable |
| 1 | Radar situation evolving |

## 2026 race weekend dates

- **Carb Day** — May 22, 2026
- **Legends Day** — May 23, 2026
- **Race Day** — May 24, 2026

## Data format

Snapshots: `public/data/history/YYYY-MM-DD-HHmm.json`

## License

Fan project. Use responsibly. Do not trust weather apps.
