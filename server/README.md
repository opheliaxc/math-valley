# Math Valley API

Local persistence API (Node `http` + SQLite).

## Start

From the project root:

```bash
npm run dev      # API + Vite
npm run server   # API only
npm start        # production-style: API + built frontend from dist/
```

Defaults: `http://127.0.0.1:3001`. Override with `PORT` / `HOST`. See root [README](../README.md) and [`.env.example`](../.env.example).

## Data

| Path | Purpose |
|------|---------|
| `server/data/math-valley.db` | SQLite database |
| `server/data/backups/` | Online backups |

Legacy JSON can still be imported/exported via `npm run db:import-json` / `db:export-json`.

## Production

Use **pm2** with `ecosystem.config.cjs` at the repo root (one instance, fork mode). Full setup, migrations, backup/restore, and native-build notes are in the root README.
