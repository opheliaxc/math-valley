# SQLite Persistence — Spec

*As of October 14, 2026*

## 1. Purpose

Replace Math Valley's local JSON file store (`server/data/math-valley-data.json`) with a **SQLite** database, run in-process by the existing Node/Express API. This adds:

- real transactions, so one answer's writes either all land or none do;
- schema migrations;
- a typed query layer;
- automated backups with a tested restore.

The deployment stays traditional: one Node process on one server, with the database as one file on that server's disk. There is no database server to install.

**This changes the storage layer only.** The React frontend, the API contract (URLs, request and response shapes), the Question Generator, and the mastery and unlock logic all stay as they are. If any API response changes shape, that is a bug.

## 2. Decisions Made

| Topic | Decision |
| --- | --- |
| Database | SQLite, one file |
| Driver | `better-sqlite3`, synchronous and fast. It ships prebuilt binaries for common OS and Node combinations |
| Query layer | **Kysely**, a light typed SQL query builder, using its built-in `SqliteDialect` over `better-sqlite3`. No ORM, so no Prisma, TypeORM, or Sequelize |
| Migrations | Plain numbered `.sql` files plus a small custom runner, with version tracked by `PRAGMA user_version` |
| Backups | SQLite's online backup API (`db.backup()` in `better-sqlite3`), on a schedule, with a retention limit and an integrity check. Off-server copies are an optional extra (Section 10) |
| Identity | Unchanged: the profile picker asks for grade and avatar, and asks for the name only when more than one profile matches. **No authentication or authorization**, as this is a learning project |
| Instances | **Exactly one** app process writes to the database file. No horizontal scaling |
| Cutover | A temporary `STORAGE_DRIVER=json\|sqlite` switch lets both stores run side by side until SQLite is verified. The JSON store is then removed |

## 3. Why SQLite Fits

- **The data is relational.** Students have standard progress, attempts, and sessions, and sessions reference standards.
- **The mastery rule is one query.** "At least 8 correct in the most recent 10 attempts" is `ORDER BY id DESC LIMIT 10`.
- **One answer touches several things:** an attempt row, the session position, possibly a mastery flag, an unlock, and XP. A transaction makes that atomic. The JSON store needed a hand-written write queue and atomic rename for the same guarantee.
- **WAL mode** lets reads run during a write. A single synchronous writer in one process cannot race itself.
- **Operations are simple.** Back up and restore by copying one file.

## 4. Phase 0 Comes First: Match the Real Code

This spec describes the **target**. The existing code (the JSON store, its types, the API routes, the multi-user session work) is the **ground truth** for names and behavior. Before any code changes, Cursor audits the codebase and maps what exists to the schema below. Where they differ:

- **Field and table names** follow the existing TypeScript types, so the schema below gets renamed.
- **What gets stored versus derived** follows the existing app. For example, if island status is currently computed from mastery rather than saved, keep it computed and drop the `island_progress` table.
- **Anything in the JSON file that has no home** in the schema below gets flagged to Dev. Do not drop it silently.

## 5. Target Schema (`001_init.sql`)

Conventions:

- Timestamps are `TEXT` ISO-8601 in UTC, for example `2026-10-14T16:20:00.000Z`.
- Booleans are `INTEGER` 0 or 1.
- IDs that already exist in the JSON file (student and session IDs) are kept as `TEXT`, so imported data keeps its identity.
- `attempts` uses an `INTEGER` autoincrement primary key, which also gives a reliable "most recent" order.

```sql
PRAGMA foreign_keys = ON;

-- Key/value metadata (app version, last backup time, JSON import marker)
CREATE TABLE app_meta (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE students (
  id             TEXT PRIMARY KEY,
  name           TEXT NOT NULL,
  grade          INTEGER NOT NULL CHECK (grade BETWEEN 1 AND 4),          -- real-life grade
  content_level  INTEGER NOT NULL CHECK (content_level BETWEEN 1 AND 4),  -- separate from grade; capped at 4
  avatar         TEXT NOT NULL,
  xp             INTEGER NOT NULL DEFAULT 0 CHECK (xp >= 0),
  lunara_level   INTEGER NOT NULL DEFAULT 1,
  created_at     TEXT NOT NULL,
  updated_at     TEXT NOT NULL
);
-- Profile picker lookup: grade + avatar, then name
CREATE INDEX idx_students_grade_avatar ON students (grade, avatar);
-- Guarantees the picker can always tell profiles apart (see Section 13, item 1)
CREATE UNIQUE INDEX uq_students_grade_avatar_name
  ON students (grade, avatar, name COLLATE NOCASE);

-- Island (domain) state per student per content level, only if the app stores it today (Section 4)
CREATE TABLE island_progress (
  student_id             TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  content_level          INTEGER NOT NULL CHECK (content_level BETWEEN 1 AND 4),
  domain_key             TEXT NOT NULL,   -- e.g. 'operations-algebraic-thinking', 'geometry'
  status                 TEXT NOT NULL CHECK (status IN ('locked','unlocked','mastered')),
  active_standard_index  INTEGER NOT NULL DEFAULT 0,
  updated_at             TEXT NOT NULL,
  PRIMARY KEY (student_id, content_level, domain_key)
);

-- Mastery flags per standard and difficulty. The rolling window comes from attempts, not stored here.
CREATE TABLE standard_progress (
  student_id     TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  standard_code  TEXT NOT NULL,   -- e.g. 'NY-3.NBT.2'
  difficulty     TEXT NOT NULL CHECK (difficulty IN ('beginner','advanced')),
  mastered       INTEGER NOT NULL DEFAULT 0 CHECK (mastered IN (0,1)),
  mastered_at    TEXT,
  updated_at     TEXT NOT NULL,
  PRIMARY KEY (student_id, standard_code, difficulty)
);

CREATE TABLE sessions (
  id               TEXT PRIMARY KEY,
  student_id       TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  domain_key       TEXT NOT NULL,
  standard_code    TEXT NOT NULL,
  difficulty       TEXT NOT NULL CHECK (difficulty IN ('beginner','advanced')),
  status           TEXT NOT NULL CHECK (status IN ('active','completed','abandoned')),
  current_index    INTEGER NOT NULL DEFAULT 0,
  total_questions  INTEGER NOT NULL,
  correct_count    INTEGER NOT NULL DEFAULT 0,
  started_at       TEXT NOT NULL,
  completed_at     TEXT
);
CREATE INDEX idx_sessions_student_status ON sessions (student_id, status);
-- At most one active session per student
CREATE UNIQUE INDEX uq_sessions_one_active
  ON sessions (student_id) WHERE status = 'active';

-- Questions served in a session, kept only so an active session can resume exactly (Section 13, item 2)
CREATE TABLE session_questions (
  session_id     TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  position       INTEGER NOT NULL,
  question_json  TEXT NOT NULL CHECK (json_valid(question_json)),  -- the GeneratedQuestion as served
  PRIMARY KEY (session_id, position)
);

-- Append-only answer history; source of the 8-of-last-10 window
CREATE TABLE attempts (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id      TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  session_id      TEXT REFERENCES sessions(id) ON DELETE SET NULL,
  standard_code   TEXT NOT NULL,
  difficulty      TEXT NOT NULL CHECK (difficulty IN ('beginner','advanced')),
  question_type   TEXT NOT NULL CHECK (question_type IN ('multiple-choice','true-false','short-answer')),
  given_answer    TEXT NOT NULL,
  correct_answer  TEXT NOT NULL,
  is_correct      INTEGER NOT NULL CHECK (is_correct IN (0,1)),
  created_at      TEXT NOT NULL
);
CREATE INDEX idx_attempts_window
  ON attempts (student_id, standard_code, difficulty, id DESC);
```

**Rolling-window query** (the existing pure `isStandardMastered` logic receives these rows; the rule itself stays in that function, not in SQL):

```sql
SELECT is_correct FROM attempts
WHERE student_id = ? AND standard_code = ? AND difficulty = ?
ORDER BY id DESC
LIMIT 10;
```

**Picture questions (geometry).** `question_json` holds the whole `GeneratedQuestion`, including any `VisualSpec`, so a resumed session redraws the same picture. Nothing geometry-specific is needed in the schema.

## 6. Database Module

`server/db/connection.ts` opens the database once at startup and exports it. On open it sets these pragmas:

| Pragma | Value | Why |
| --- | --- | --- |
| `journal_mode` | `WAL` | Reads proceed while a write is in progress |
| `foreign_keys` | `ON` | SQLite leaves this off by default, so every connection must turn it on |
| `busy_timeout` | `5000` | Waits instead of failing instantly if the backup holds a lock |
| `synchronous` | `NORMAL` | The safe, standard pairing with WAL |

**Configuration (environment variables):**

| Variable | Default (dev) | Notes |
| --- | --- | --- |
| `DB_PATH` | `server/data/math-valley.db` | The parent directory is created if missing |
| `BACKUP_DIR` | `server/data/backups` | In production, point this at a different disk from `DB_PATH` if possible |
| `BACKUP_INTERVAL_HOURS` | `24` | |
| `BACKUP_RETENTION` | `14` | Number of backup files kept |
| `STORAGE_DRIVER` | `sqlite` | `json` stays available only until Phase 9 |

**Also required:**
- Add `*.db`, `*.db-wal`, `*.db-shm`, and the backups directory to `.gitignore`.
- **Health check:** `GET /api/health` runs `SELECT 1` and returns the schema version. It returns 503 if the database is unavailable.
- **Graceful shutdown:** on `SIGINT` and `SIGTERM`, stop accepting requests, stop the backup timer, run `PRAGMA wal_checkpoint(TRUNCATE)`, then `db.close()`.

## 7. Migrations

**Layout:** `server/db/migrations/001_init.sql`, `002_<name>.sql`, and so on, numbered with no gaps.

**Runner** (`server/db/migrate.ts`), run automatically at startup before the server listens:

1. Read `PRAGMA user_version`, which is the number of the last applied migration.
2. Back up the database before applying anything (Section 9), unless the database is brand new.
3. For each migration file numbered higher than `user_version`, in order: start a transaction, run the file, set `PRAGMA user_version = N`, then commit.
4. **If any migration fails:** roll it back, log the file name and error, and **exit the process**. Never start the API on a half-migrated database.
5. If the database's `user_version` is **higher** than the newest migration file (the code is older than the data), refuse to start.

**Rules:**
- **Never edit a migration that has already run anywhere.** Fix mistakes with a new numbered migration.
- `npm run db:migrate` runs the same runner on demand. `npm run db:status` prints the current version and any pending files.

**Why not a framework?** A one-file runner with `user_version` is about 40 lines, has no dependencies, and is easy to read and test. Kysely ships its own migrator, but it expects migrations written in TypeScript. Plain `.sql` files are easier to review alongside the schema.

## 8. Query Layer and Repositories

**Kysely setup:** `server/db/kysely.ts` wraps the shared `better-sqlite3` connection with `new Kysely<DB>({ dialect: new SqliteDialect({ database }) })`.

**Types:** `server/db/schema-types.ts` holds a hand-written `DB` interface that matches the migrated schema, one interface per table.
- Keep it in sync by hand.
- A test (Phase 4) compares it against `PRAGMA table_info` for every table, so drift fails a test instead of reaching production.

**Repositories:** one module per area, all implementing the **existing storage interface** from the JSON persistence work:

```
server/storage/
  storage.ts             # the existing interface (unchanged, or extended only if Phase 0 finds gaps)
  json-store.ts          # existing JSON adapter (kept until Phase 9)
  sqlite-store.ts        # new adapter, composed from the repositories below
  index.ts               # picks the adapter from STORAGE_DRIVER
server/db/
  connection.ts
  kysely.ts
  schema-types.ts
  migrate.ts
  migrations/001_init.sql
  repositories/
    students.repo.ts     # create, findByGradeAvatar(grade, avatar, name?), update grade/contentLevel/xp
    progress.repo.ts     # standard_progress + island_progress reads and writes
    attempts.repo.ts     # insert, recentWindow(studentId, code, difficulty)
    sessions.repo.ts     # start, getActive, advance, complete, abandon, session_questions
  backup.ts
scripts/
  import-json.ts
  export-json.ts
  restore-backup.ts
```

**Rules:**
- **Kysely is used only inside `server/db/`.** Route handlers and game logic call the storage interface, never SQL.
- **Business logic stays pure.** `recordAttempt`, `isStandardMastered`, `advanceActiveStandardIfNeeded`, and the unlock rules keep their current code. Repositories load rows, the pure functions decide, and repositories save the results.
- **"Submit an answer" is one transaction:** insert the attempt, update the session position and correct count, set the mastery flag if earned, update island state if an unlock happened, add XP, and mark the session completed if it was the last question. Use `db.transaction().execute(async (trx) => { ... })`, and pass `trx` into every repository call in that flow.
- **The profile picker query** is `findByGradeAvatar(grade, avatar)`. If it returns more than one row, the API asks for the name (existing behavior), then calls `findByGradeAvatar(grade, avatar, name)`, which matches the name case-insensitively.
- All inputs are already validated at the API boundary by the JSON-store work. Keep that validation. The schema's `CHECK` constraints are a second safety net, not the primary check.

## 9. Backups and Restore

**Scheduled backup** (`server/db/backup.ts`), started after migrations succeed:

1. Every `BACKUP_INTERVAL_HOURS`, plus once at startup if the last backup is older than the interval, call `db.backup(<BACKUP_DIR>/math-valley-<UTC timestamp>.db)`. The online backup API copies a consistent snapshot while the app keeps serving.
2. Open the new file read-only and run `PRAGMA integrity_check`. If the result is anything other than `ok`, log an error and delete the bad file. The previous good backups stay.
3. Delete the oldest files beyond `BACKUP_RETENTION`.
4. Record the time in `app_meta` under `last_backup_at`, and log the result.

**Also:**
- **Before each migration**, take an extra backup named `math-valley-premigrate-v<N>-<timestamp>.db`, which retention does not delete.
- **On demand:** `npm run db:backup`.
- **Restore:** `npm run db:restore -- <backup file>`.
  - It refuses to run while the server is up. It checks for a lock or PID file, or simply requires the server to be stopped.
  - It first copies the current database aside (`math-valley.db.before-restore-<timestamp>`).
  - It then copies the backup into place, deletes stale `-wal` and `-shm` files, runs `integrity_check`, and prints the schema version.
- **A restore drill is part of the tests (Phase 7).** A backup that has never been restored is not yet a backup.

## 10. Optional: Off-Server Copies

Backups on the same machine protect against bad writes and bugs, but not against losing the server. Two options, either one acceptable, decided later:

- **A.** After each scheduled backup, upload the file to an S3 bucket (with versioning or a lifecycle rule for retention).
- **B.** **Litestream**, a separate small process that continuously streams the SQLite WAL to S3, giving point-in-time recovery. It needs WAL mode, which this spec already sets.

Not required to finish this migration. It is listed so it isn't forgotten (Section 13).

## 11. Importing Existing JSON Data

`npm run db:import-json -- [path] [--dry-run]`, defaulting to `server/data/math-valley-data.json`:

1. Read and validate the file with the same validation the JSON store uses. On malformed data, stop and report. **Do not partially import.**
2. Map every record to the new tables, following the Phase 0 mapping.
3. **`--dry-run`** prints the counts it *would* write (students, standard progress rows, attempts, sessions) and any records it can't map, and writes nothing.
4. **A real run** does the whole import in **one transaction**, then writes `app_meta.json_imported_at`.
5. **It is safe to re-run.** If `json_imported_at` is set, it refuses, unless `--force` is passed, which first requires an empty database.
6. Afterwards, **rename the JSON file** to `math-valley-data.imported-<date>.json`. Never delete it.
7. Print a before and after comparison: counts per table, plus a spot check of 3 random students (grade, content level, mastered standards, XP), so the result can be verified by eye.

**Order of attempts:** insert attempts sorted by their original timestamp, so autoincrement IDs keep the true order and the rolling window is correct after import.

**Export for debugging:** `npm run db:export-json -- <out file>` writes the database out in the old JSON shape. This is useful for diffing against the original during Phase 6, and as a human-readable dump.

## 12. Deployment

- **Node version** is pinned in `.nvmrc` and `package.json` `engines`. `better-sqlite3` is a native module, so the server's Node version must match the one it was installed with.
- **On the server:** run `npm ci` there. **Never copy `node_modules` from a different OS or CPU**, for example from a Mac to Linux. If no prebuilt binary matches, `npm ci` compiles one, which needs `python3`, `make`, and a C++ compiler. Document that fallback in the README.
- **Process manager:** `pm2` or `systemd`, with **one instance only** (no pm2 cluster mode) and automatic restart.
  - pm2 users should note that `pm2 reload` has no zero-downtime benefit with one instance. A restart is fine.
- **Disk:** the database and backups must live on **persistent storage**, such as the server's disk or an attached volume, never inside a container layer that is discarded on redeploy. If Docker is used later, mount `server/data` as a volume.
- **Static frontend:** served either by Express (`express.static` on the built React app) or by nginx in front of it, so the page and API share one origin and need no CORS.
- **README section:** first-time setup, env vars, how migrations run, how to back up and restore, and where the files live.

## 13. Open Items and Defaults

1. **Duplicate profiles.** The unique index on (grade, avatar, name, case-insensitive) guarantees the picker can always resolve a profile. Consequence: creating a second "Ali" with the same grade and avatar is rejected with a friendly message ("That name is taken for this avatar. Try another avatar or add a letter"). This needs a matching message in the profile-creation UI.
   - The same conflict can happen when a student's real-life grade is changed to match another profile. The same message applies.
   - If the import (Phase 6) finds existing duplicates, it reports them and stops. **Dev decides** how to rename them. The script does not guess.
2. **`session_questions` stores generated questions.** The JSON persistence prompt said "don't store generated questions unless truly necessary". Resuming an active session exactly is that necessity. If Phase 0 shows sessions currently resume some other way (for example re-generating from a stored seed), mirror that and drop this table.
3. **Old attempts are never pruned.** For one family's usage, the table stays small for years. Revisit only if the file grows past a few hundred MB.
4. **Off-server backups** (Section 10) are deferred, not required.
5. **No authentication.** Anyone who can reach the server can open any profile. That is acceptable for a learning project on a private or family deployment. If it is ever opened to the public internet for other families, add at minimum a parent PIN or a login, and review children's-data obligations (COPPA). This note is not legal advice.
6. **Single-instance rule.** If more capacity is ever needed, the move is to a database server (for example Postgres). Kysely makes that move cheaper, because most queries port with a dialect swap.

## 14. Phased Implementation Plan

Each phase ends with a test Dev can run. **No phase starts until the previous one is confirmed working.**

### Phase 0: Audit (no code changes)
Find and report:
- the current storage interface and JSON adapter;
- every API route that reads or writes data;
- the JSON file's actual shape (with a small redacted sample);
- how the multi-user profile picker queries profiles;
- how active sessions resume;
- which state is stored and which is derived (island status, active standard index, XP, Lunara level).

Produce a **mapping table: JSON field → table.column**, and list anything that doesn't fit Section 5.
**Test:** Dev reviews the mapping and confirms it, or answers flagged questions, before Phase 1.

### Phase 1: Driver, Connection, and Config
Install `better-sqlite3` and `kysely`, then add `connection.ts` with the pragmas, env config, `.gitignore` entries, `/api/health`, and graceful shutdown. Leave the app's storage untouched (still JSON).
**Test:** start the server and confirm `math-valley.db` is created. `GET /api/health` returns OK. Stop with Ctrl+C and confirm the log shows a clean close with no leftover `-wal` file. The app still works exactly as before.

### Phase 2: Migration Runner and `001_init.sql`
Add `migrate.ts`, the migration file (adjusted per the Phase 0 mapping), `db:migrate`, and `db:status`. Run migrations at startup.
**Test:**
- Delete the database, start the server, and confirm `db:status` shows version 1 with nothing pending. Open the file in a SQLite viewer (for example DB Browser for SQLite) and confirm the tables and indexes exist.
- Add a throwaway `002_broken.sql` containing a syntax error and confirm the server refuses to start and the database stays at version 1. Then delete that file.

### Phase 3: Kysely Types and Repositories
Add `kysely.ts`, `schema-types.ts`, the four repositories, and `sqlite-store.ts`, which implements the storage interface. Nothing calls it yet.
**Test:** a scratch script (or unit tests) creates a student, finds them by grade and avatar, records 10 attempts, and reads the window back newest-first.

### Phase 4: Contract Tests (Both Adapters)
Write one test suite against the **storage interface**, then run it twice: once with the JSON adapter (on a temporary file) and once with the SQLite adapter (on a temporary database). It covers:
- profile create and lookup, including the duplicate-name case;
- the attempt window order;
- session start, advance, complete, and resume;
- mastery flags;
- island state;
- that a failed step inside "submit answer" rolls back everything (simulate a thrown error mid-transaction);
- that `schema-types.ts` matches `PRAGMA table_info`.

**Test:** `npm test` passes for both adapters. The same suite passing on both is the evidence that SQLite behaves like the store it replaces.

### Phase 5: Switch the API to SQLite
`server/storage/index.ts` picks the adapter from `STORAGE_DRIVER`, defaulting to `sqlite`. Wire "submit answer" through the single-transaction flow from Section 8. Routes and responses do not change.
**Test:** with a fresh database:
- create two profiles with the same grade and avatar and confirm the picker asks for the name;
- play a session and close the tab mid-session, then reopen and confirm it resumes on the same question;
- reach mastery on a Beginner level and confirm Advanced unlocks;
- restart the server and confirm everything is still there.

Set `STORAGE_DRIVER=json` and confirm the old store still works (it serves as the fallback until Phase 9).

### Phase 6: Import Existing JSON Data
Build `import-json.ts` and `export-json.ts` per Section 11.
**Test:**
- Run with `--dry-run` and check the counts against the JSON file.
- Run for real and read the spot-check output.
- Export to JSON and diff it against the original. Differences should be limited to expected ones, such as field ordering.
- Open the app as an existing student and confirm their islands, mastered standards, XP, and any active session are exactly as before.
- Re-run the import and confirm it refuses.

### Phase 7: Backups and Restore
Build `backup.ts` (scheduled, integrity-checked, with retention), the pre-migration backup, `db:backup`, and `db:restore`.
**Test:**
- Set `BACKUP_INTERVAL_HOURS` to a tiny value (or trigger `db:backup`) and confirm files appear, pass the integrity check, and are pruned past `BACKUP_RETENTION`.
- **Restore drill:** note a student's XP, answer a few questions, stop the server, restore the earlier backup, and start again. Confirm the XP is back to the noted value and `before-restore` exists.

### Phase 8: Deployment Readiness
Pin the Node version. Add the pm2 ecosystem file or systemd unit (single instance), production env examples, Express serving the built frontend, and the README section from Section 12.
**Test:**
- On a clean machine or VM (or a fresh clone with `node_modules` deleted), follow only the README: `npm ci`, build, and start.
- Confirm the app runs, migrations apply, a backup is created, and the health check passes.
- Reboot or restart the process manager and confirm the app comes back with its data.

### Phase 9: Cleanup and Regression
Remove the JSON adapter, the write queue and atomic-rename code, `STORAGE_DRIVER`, and the JSON-only contract-test run. Keep `import-json.ts` and `export-json.ts`.
**Test:** full regression across Grades 1–4:
- the profile picker, including the name prompt;
- islands in the right order;
- Beginner → Advanced → next standard;
- island → island;
- content-level advancement with re-lock;
- fractions and geometry questions rendering and resuming;
- a server restart mid-session.

`npm test` passes. Search the codebase for `math-valley-data.json` and confirm it is referenced only by the import and export scripts.
