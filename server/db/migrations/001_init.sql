-- Math Valley initial schema (normalized from the JSON document store).
-- Field names follow existing TypeScript types (snake_case in SQL).
-- PRAGMA foreign_keys is also set on every connection open.

PRAGMA foreign_keys = ON;

CREATE TABLE app_meta (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE students (
  id             TEXT PRIMARY KEY,
  name           TEXT NOT NULL,
  grade          INTEGER NOT NULL CHECK (grade BETWEEN 1 AND 4),
  avatar_id      TEXT NOT NULL,
  content_level  INTEGER NOT NULL CHECK (content_level BETWEEN 1 AND 4),
  xp             INTEGER NOT NULL DEFAULT 0 CHECK (xp >= 0),
  created_at     TEXT NOT NULL,
  updated_at     TEXT NOT NULL
);

CREATE INDEX idx_students_grade_avatar ON students (grade, avatar_id);

-- Profile picker: same grade+avatar allowed when names differ (case-insensitive).
CREATE UNIQUE INDEX uq_students_grade_avatar_name
  ON students (grade, avatar_id, name COLLATE NOCASE);

-- Legacy difficulty-tier streaks (player.topicProgress).
CREATE TABLE topic_tier_progress (
  student_id        TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  topic_id          TEXT NOT NULL,
  tier_index        INTEGER NOT NULL DEFAULT 0,
  correct_streak    INTEGER NOT NULL DEFAULT 0,
  incorrect_streak  INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (student_id, topic_id)
);

-- Per-zone XP (player.zoneXp).
CREATE TABLE zone_xp (
  student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  topic_id   TEXT NOT NULL,
  xp         INTEGER NOT NULL DEFAULT 0 CHECK (xp >= 0),
  PRIMARY KEY (student_id, topic_id)
);

-- World-map unlocked zones (player.unlockedZones).
CREATE TABLE unlocked_zones (
  student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  zone_id    TEXT NOT NULL,
  PRIMARY KEY (student_id, zone_id)
);

-- Island / topic mastery state (studentProgress.topics).
-- standard_order_json is the curriculum order snapshot stored with the topic.
CREATE TABLE topic_progress (
  student_id             TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  topic_id               TEXT NOT NULL,
  content_level          INTEGER NOT NULL CHECK (content_level BETWEEN 1 AND 4),
  standard_order_json    TEXT NOT NULL CHECK (json_valid(standard_order_json)),
  active_standard_index  INTEGER NOT NULL DEFAULT 0,
  status                 TEXT NOT NULL CHECK (status IN ('locked', 'unlocked', 'mastered')),
  updated_at             TEXT NOT NULL,
  PRIMARY KEY (student_id, topic_id, content_level)
);

-- Standard-level status (locked | active | mastered).
CREATE TABLE standard_meta (
  student_id     TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  standard_code  TEXT NOT NULL,
  status         TEXT NOT NULL CHECK (status IN ('locked', 'active', 'mastered')),
  updated_at     TEXT NOT NULL,
  PRIMARY KEY (student_id, standard_code)
);

-- Mastery flags per standard + difficulty (rolling window lives in attempts).
CREATE TABLE standard_progress (
  student_id     TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  standard_code  TEXT NOT NULL,
  difficulty     TEXT NOT NULL CHECK (difficulty IN ('beginner', 'advanced')),
  mastered       INTEGER NOT NULL DEFAULT 0 CHECK (mastered IN (0, 1)),
  mastered_at    TEXT,
  updated_at     TEXT NOT NULL,
  PRIMARY KEY (student_id, standard_code, difficulty)
);

CREATE TABLE sessions (
  id                      TEXT PRIMARY KEY,
  student_id              TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  topic_id                TEXT NOT NULL,
  status                  TEXT NOT NULL CHECK (status IN ('in_progress', 'completed', 'abandoned')),
  question_index          INTEGER NOT NULL DEFAULT 0,
  total_questions         INTEGER,
  correct_count           INTEGER NOT NULL DEFAULT 0,
  xp_earned               INTEGER,
  phase                   TEXT CHECK (phase IS NULL OR phase IN ('question', 'feedback', 'summary')),
  active_topic_id         TEXT,
  session_unlock_id       TEXT,
  content_level_advanced  INTEGER NOT NULL DEFAULT 0 CHECK (content_level_advanced IN (0, 1)),
  current_question_json   TEXT CHECK (
    current_question_json IS NULL OR json_valid(current_question_json)
  ),
  started_at              TEXT NOT NULL,
  updated_at              TEXT,
  completed_at            TEXT
);

CREATE INDEX idx_sessions_student_status ON sessions (student_id, status);

-- At most one in-progress session per student.
CREATE UNIQUE INDEX uq_sessions_one_in_progress
  ON sessions (student_id) WHERE status = 'in_progress';

-- Answers recorded inside the active session (activeSession.answers).
CREATE TABLE session_answers (
  session_id   TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  position     INTEGER NOT NULL,
  submitted    TEXT NOT NULL,
  is_correct   INTEGER NOT NULL CHECK (is_correct IN (0, 1)),
  answered_at  TEXT NOT NULL,
  PRIMARY KEY (session_id, position)
);

-- Append-only answer history for the mastery window (never pruned going forward).
-- given_answer / correct_answer / question_type may be empty for rows imported
-- from the old last-10 JSON attempt log.
CREATE TABLE attempts (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id      TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  session_id      TEXT REFERENCES sessions(id) ON DELETE SET NULL,
  standard_code   TEXT NOT NULL,
  difficulty      TEXT NOT NULL CHECK (difficulty IN ('beginner', 'advanced')),
  question_id     TEXT,
  question_type   TEXT NOT NULL DEFAULT '' CHECK (
    question_type = ''
    OR question_type IN ('multiple-choice', 'true-false', 'short-answer')
  ),
  given_answer    TEXT NOT NULL DEFAULT '',
  correct_answer  TEXT NOT NULL DEFAULT '',
  is_correct      INTEGER NOT NULL CHECK (is_correct IN (0, 1)),
  created_at      TEXT NOT NULL
);

CREATE INDEX idx_attempts_window
  ON attempts (student_id, standard_code, difficulty, id DESC);

CREATE TABLE missed_questions (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id      TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  standard_code   TEXT NOT NULL,
  difficulty      TEXT NOT NULL CHECK (difficulty IN ('beginner', 'advanced')),
  prompt          TEXT NOT NULL,
  created_at      TEXT NOT NULL
);

CREATE INDEX idx_missed_questions_student
  ON missed_questions (student_id, id);
