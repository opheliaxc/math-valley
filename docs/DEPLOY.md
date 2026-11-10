# Deploying Math Valley with Docker

Plain-language guide for hosting Math Valley on a server with **Docker Compose**. One app container only (SQLite cannot be shared by replicas). HTTPS and your domain stay on the **reverse proxy you already have**; this stack publishes the app on port **3066**.

## Server prerequisites

- **Docker Engine** and the **Compose plugin** (`docker compose version` should work).
- Enough disk for the image (~100–200 MB) plus the database and backups (start with a few GB free).
- Firewall: allow your reverse proxy to reach the app on **3066** (or only on localhost if the proxy is on the same machine). Do **not** expose 3066 to the public internet if the proxy already terminates HTTPS.
- Node is **not** required on the host when you use Docker; the image includes Node 26.

## First deployment from scratch

On the Ubuntu server (Intel / `amd64`):

```bash
git clone <your-repo-url> math-valley
cd math-valley
cp .env.example .env
# Edit .env if needed. Defaults already match Docker:
#   PORT=3066  HOST=0.0.0.0  DB_PATH=/data/math-valley.db  BACKUP_DIR=/backups
docker compose up -d --build
docker compose ps
curl -s http://127.0.0.1:3066/api/health
```

You should see `healthy` and `{"ok":true,"schemaVersion":1}`.

Named volumes are created automatically:

| Volume | Mount | Contents |
|--------|--------|----------|
| `math-valley_math-valley-data` | `/data` | Live SQLite DB |
| `math-valley_math-valley-backups` | `/backups` | Rotating backups |

Point your existing reverse proxy at `http://127.0.0.1:3066` (or the Docker host IP).

### Bind mounts instead of named volumes (optional)

Named volumes work out of the box. If you switch to host folders later, create them and give ownership to the container user **uid/gid 999**:

```bash
mkdir -p ./data ./backups
sudo chown -R 999:999 ./data ./backups
# or:
docker run --rm -v "$(pwd)/data":/data -v "$(pwd)/backups":/backups busybox:1.37.0 \
  chown -R 999:999 /data /backups
```

Host-owned folders without that `chown` fail with `SqliteError: unable to open database file` (`SQLITE_CANTOPEN`).

## Getting the app onto the Intel server

### A. Build on the server (recommended)

```bash
cd math-valley
git pull
docker compose up -d --build
```

The server builds for its own architecture. No image mismatch possible.

### B. Build on a Mac and ship an `amd64` image

Only if you cannot build on the server. On Apple Silicon you must target Intel explicitly:

```bash
# On the Mac
docker buildx build --platform linux/amd64 -t math-valley:local --load .
docker save math-valley:local | gzip > math-valley-amd64.tar.gz
# Copy to the server, then:
gunzip -c math-valley-amd64.tar.gz | docker load
cd math-valley   # needs docker-compose.yml + .env
docker compose up -d
```

**Warning — `exec format error`:** an **arm64** image built on a Mac will not run on Ubuntu Intel. Always use `--platform linux/amd64` (or build on the server). Check with:

```bash
docker image inspect math-valley:local --format '{{.Architecture}}'
```

Optional multi-arch build needs a registry (or OCI export); this project does not require pushing anywhere.

## Update to a new version

Tag the current image with the Git commit before rebuilding so you can roll back:

```bash
cd math-valley
COMMIT=$(git rev-parse --short HEAD)
docker tag math-valley:local math-valley:$COMMIT

git pull
docker compose build
docker compose up -d
docker compose ps
curl -s http://127.0.0.1:3066/api/health
```

### Roll back

```bash
docker tag math-valley:PREVIOUS_COMMIT math-valley:local
docker compose up -d
```

(Use the short commit you tagged earlier.) Data volumes are unchanged by image rollback.

## Logs, status, restart

```bash
docker compose ps
docker compose logs -f --tail 100
docker compose restart
docker compose stop          # clean SIGTERM; DB checkpoint
docker compose up -d
```

A clean stop should log:

```text
Received SIGTERM; shutting down…
Database checkpointed and closed cleanly.
```

## Backup and restore

Backups on the **same server** do not protect you if the whole machine is lost. Copy `/backups` elsewhere regularly (`scp`, `rsync`, or the optional S3 / Litestream ideas in `docs/sqlite-persistence-spec.md` Section 10).

### On-demand backup

```bash
docker compose exec app npm run db:backup
# or:
docker compose exec app node server/db/backup.ts
```

### List backups / integrity

```bash
docker compose exec app ls -la /backups
docker compose exec app node -e "const Database=require('better-sqlite3'); const fs=require('fs'); const f='/backups/'+fs.readdirSync('/backups').filter(x=>x.endsWith('.db')).sort().at(-1); const db=new Database(f,{readonly:true}); console.log(f, db.pragma('integrity_check',{simple:true})); db.close();"
```

### Copy backups off the server (example)

```bash
# Find the volume mountpoint, or use a helper container:
docker run --rm -v math-valley_math-valley-backups:/backups:ro -v "$(pwd)":/out busybox:1.37.0 \
  cp -a /backups /out/math-valley-backups-copy
# then scp/rsync that folder to another machine
```

### Restore (always stop the app first)

Do **not** rely on the PID file across containers. Stop Compose, restore, start again:

```bash
docker compose stop
docker compose run --rm --no-deps app node server/db/restore.ts /backups/math-valley-YYYY-….db
docker compose up -d
```

Restore copies the live DB aside as `math-valley.db.before-restore-…`, replaces the file, clears stale `-wal`/`-shm`, and runs `integrity_check`.

### Migration status

```bash
docker compose exec app npm run db:status
```

## Import old JSON data

Dry-run (safe; writes nothing):

```bash
docker compose run --rm --no-deps \
  -v /absolute/path/to/math-valley-data.json:/import/math-valley-data.json:ro \
  app node scripts/import-json.ts /import/math-valley-data.json --dry-run
```

A real import is destructive to an empty/fresh DB workflow — only run when you intend to; see the script flags (`--force`) and `docs/sqlite-persistence-spec.md` Section 11.

## Dangerous commands (read before running)

| Command / action | What it deletes |
|------------------|-----------------|
| `docker compose down` | Stops and removes containers/network. **Volumes keep data.** |
| `docker compose down -v` | Same **plus deletes** `math-valley-data` and `math-valley-backups` — **all student data and backups gone**. |
| `docker volume rm …` | Deletes that volume’s contents. |
| `docker system prune` | Removes unused images/containers/networks; with `-a` / `--volumes` can remove far more. |
| Deleting the data volume or bind-mount folder | Wipes the live database. |

## Hardening (already in Compose)

The `app` service uses a read-only root filesystem, `cap_drop: ALL`, `no-new-privileges`, memory/PID limits, and tmpfs for `/tmp` and `/app/server/data`. Data and backups stay on their volumes.

## Troubleshooting

| Symptom | Likely cause | What to try |
|---------|--------------|-------------|
| `SQLITE_CANTOPEN` / unable to open database | Bind-mount owned by host user, not uid 999 | `chown -R 999:999` on data/backups folders |
| Port already in use | Something else on 3066 | Change `PORT` in `.env`, or stop the other process |
| Container `unhealthy` | App crashed or DB path wrong | `docker compose logs`; `curl` `/api/health`; check `DB_PATH` |
| `exec format error` | arm64 image on amd64 host (or reverse) | Build on the server, or `docker buildx build --platform linux/amd64` |
| `better-sqlite3` / native module fails | Wrong arch binaries copied in | Never copy `node_modules` into the image; rebuild so `npm ci` runs inside Docker |
| Restore corrupted live DB | Restore while app still running | Always `docker compose stop` before restore |
| Permission denied writing backups | Same as data path ownership | Fix ownership on the backups mount |

## Related

- Env template: `.env.example`
- Persistence decisions: `docs/sqlite-persistence-spec.md` (Section 12 Deployment, Section 10 off-server copies)
- Local (non-Docker) pm2 flow: `README.md`
