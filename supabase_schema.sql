-- ── EduTutor BD — Supabase SQL Schema ──────────────────────────
-- Run this in: Supabase Dashboard → SQL Editor → New Query

-- 1. Profiles table (linked to Supabase Auth)
CREATE TABLE IF NOT EXISTS profiles (
  id       UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name     TEXT NOT NULL,
  email    TEXT NOT NULL,
  grade    TEXT DEFAULT 'SSC',
  role     TEXT DEFAULT 'student',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Sessions table (quiz results)
CREATE TABLE IF NOT EXISTS sessions (
  id             BIGSERIAL PRIMARY KEY,
  student_id     UUID REFERENCES profiles(id) ON DELETE CASCADE,
  subject        TEXT NOT NULL,
  chapter_id     TEXT NOT NULL,
  question       TEXT,
  student_answer TEXT,
  score          INTEGER DEFAULT 0,
  max_score      INTEGER DEFAULT 5,
  percentage     INTEGER DEFAULT 0,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read/update their own; service key can do everything
CREATE POLICY "profiles_self" ON profiles
  FOR ALL USING (auth.uid() = id);

-- Sessions: users can insert/read their own
CREATE POLICY "sessions_self" ON sessions
  FOR ALL USING (auth.uid() = student_id);

-- 4. Index for faster queries
CREATE INDEX IF NOT EXISTS sessions_student_idx ON sessions(student_id);
CREATE INDEX IF NOT EXISTS sessions_subject_idx ON sessions(subject);
