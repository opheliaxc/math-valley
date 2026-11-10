# Math Valley

Family learning app for Grades 1–4 math. React (Vite) frontend + Node API with **SQLite** persistence (`better-sqlite3` + Kysely).

## Requirements

- **Node.js 26** (see `.nvmrc` and `package.json` `engines`)
- On first install, `better-sqlite3` needs a matching native binary. Prefer installing **on the target machine**.

```bash
nvm use          # or install Node 26
npm ci
```

### Native module note (`better-sqlite3`)

**Never copy `node_modules` between machines** (for example Mac → Linux). Always run `npm ci` on the server.

If no prebuilt binary matches your OS/CPU/Node version, `npm ci` compiles from source. That needs:

- `python3`
- `make`
- a C++ compiler (`clang` / Xcode CLT on macOS, `build-essential` on Debian/Ubuntu)

## Local development

```bash
npm run dev
```

- API: `http://127.0.0.1:3001`
- Vite: `http://127.0.0.1:5173` (proxies `/api` → the API)

| Command | Purpose |
|---------|---------|
| `npm run dev` | API + Vite |
| `npm run server` | API only |
| `npm run build` | Typecheck + Vite production build → `dist/` |
| `npm start` | Production-style: serve API + `dist/` (loads `.env` if present) |
| `npm test` | Storage + API tests |

## Environment

Copy `.env.example` to `.env` and adjust. Variables:

| Variable | Default | Notes |
|----------|---------|--------|
| `PORT` | `3001` | |
| `HOST` | `127.0.0.1` (dev) / `0.0.0.0` (pm2) | Bind address |
| `NODE_ENV` | — | `production` enables static serving by default |
| `SERVE_STATIC` | on in production | `1` / `0` — serve Vite `dist/` from the API |
| `STATIC_DIR` | `dist` | Override build output path |
| `DB_PATH` | `server/data/math-valley.db` | Parent dir is created if missing |
| `BACKUP_DIR` | `server/data/backups` | Prefer a different disk in production if you can |
| `BACKUP_INTERVAL_HOURS` | `24` | |
| `BACKUP_RETENTION` | `14` | Count of rotating backups kept |

## Database migrations

Migrations live in `server/db/migrations/` and run **automatically at API startup** before listen. You can also run them by hand:

```bash
npm run db:status
npm run db:migrate
```

Never edit a migration that has already run; add a new numbered file instead.

## Landing page

The marketing landing page lives at **`/`** (code under `src/landing/`). The game entry screen and play flow live at **`/app`**.

| Edit this | To change |
|-----------|-----------|
| `src/landing/data/landingCopy.ts` | All landing wording (hero, sections, footer, meta title/description) |
| `src/landing/data/useLandingIslands.ts` | Friendly domain captions shown on island cards |
| `src/data/islandCatalog.ts` | Real island **names** and per-grade order (shared with the game map — do not type names into landing UI) |
| `docs/LANDING_PAGE_PLAN.md` | Spec, design tokens, and progress tracker |

Landing styles are scoped under `.mv-landing` in `src/landing/landing.css` so they do not affect game screens.

## File locations

| Path | Purpose |
|------|---------|
| `server/data/math-valley.db` | Live SQLite database (+ `-wal` / `-shm` while running) |
| `server/data/backups/` | Scheduled and on-demand backups |
| `server/data/math-valley.server.pid` | PID file (blocks restore while the server is up) |
| `dist/` | Built frontend (served by the API in production) |
| `src/landing/` | Landing page (route `/`) |

Keep `server/data` on **persistent disk** (not a disposable container layer).

## Backup and restore

```bash
npm run db:backup
npm run db:restore -- path/to/math-valley-….db
```

- Scheduled backups run while the server is up (interval + retention above).
- **Restore requires the server to be stopped.** It copies the current DB aside as `math-valley.db.before-restore-<timestamp>`, replaces the live file, clears stale WAL/SHM, and checks integrity.

One-time JSON bridge (import legacy file / dump for debugging):

```bash
npm run db:import-json -- [path] [--dry-run]
npm run db:export-json -- <out-file>
```

## Production with Docker (recommended on a server)

Single Compose service, SQLite on named volumes, port **3066**, behind your existing HTTPS reverse proxy.

```bash
cp .env.example .env
docker compose up -d --build
curl -s http://127.0.0.1:3066/api/health
```

Full guide (first deploy, update/rollback, backup/restore, warnings): **[docs/DEPLOY.md](docs/DEPLOY.md)**.

## Production (pm2, single instance)

One Node process only — **no pm2 cluster mode**.

```bash
nvm use
npm ci                 # on this machine — do not copy node_modules
npm run build
cp .env.example .env   # edit as needed
npx pm2 start ecosystem.config.cjs
# optional: survive reboot
npx pm2 save
npx pm2 startup
```

Useful commands:

```bash
npx pm2 status
npx pm2 logs math-valley
npx pm2 restart math-valley
curl -s http://127.0.0.1:3001/api/health
```

With a single instance, `pm2 reload` has no zero-downtime benefit; a restart is fine.

The API serves `/api/*` and the built SPA from the same origin (`SERVE_STATIC=1`), so the browser needs no CORS/proxy.

## Health check

`GET /api/health` → `{ ok: true, schemaVersion: N }` (or `503` if the database is unavailable).
