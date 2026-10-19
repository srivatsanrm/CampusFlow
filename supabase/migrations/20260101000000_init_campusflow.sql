-- CampusFlow PostgreSQL Schema & Row Level Security (RLS)

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'teacher' CHECK (role IN ('teacher', 'admin')),
  timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata',
  theme_preference TEXT NOT NULL DEFAULT 'light' CHECK (theme_preference IN ('light', 'dark', 'system')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Subjects Table (Each subject is a distinct teaching assignment per class & section)
CREATE TABLE IF NOT EXISTS subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  class_programme TEXT NOT NULL DEFAULT 'General',
  year_semester TEXT NOT NULL DEFAULT 'Sem 1',
  section TEXT NOT NULL DEFAULT 'A',
  classroom TEXT,
  subject_code TEXT,
  notes TEXT,
  semester_start_date DATE NOT NULL,
  semester_end_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Timetable Slots Table
CREATE TABLE IF NOT EXISTS timetable_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  weekday SMALLINT NOT NULL CHECK (weekday BETWEEN 1 AND 5), -- 1=Monday, ..., 5=Friday
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  label TEXT,
  classroom TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT valid_period_times CHECK (end_time > start_time)
);

-- 4. Units Table
CREATE TABLE IF NOT EXISTS units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. Topics Table
CREATE TABLE IF NOT EXISTS topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  estimated_periods INT NOT NULL DEFAULT 1 CHECK (estimated_periods > 0),
  sort_order INT NOT NULL DEFAULT 0,
  is_completed BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 6. Official Holidays Table (Centrally managed, shared across all teachers)
CREATE TABLE IF NOT EXISTS official_holidays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  holiday_date DATE NOT NULL UNIQUE,
  source_year INT NOT NULL DEFAULT 2026,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 7. Non-teaching Dates (e.g. Exams, Sports Day, Department Symposium)
CREATE TABLE IF NOT EXISTS non_teaching_dates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 8. Lessons Table
CREATE TABLE IF NOT EXISTS lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  scheduled_date DATE NOT NULL,
  period_start TIME NOT NULL,
  period_end TIME NOT NULL,
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'completed', 'not_completed')),
  completed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 9. Lesson History (Audit trail for manual rescheduling)
CREATE TABLE IF NOT EXISTS lesson_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  previous_date DATE,
  new_date DATE,
  previous_status TEXT,
  new_status TEXT,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_subjects_user ON subjects(user_id);
CREATE INDEX IF NOT EXISTS idx_timetable_subject ON timetable_slots(subject_id);
CREATE INDEX IF NOT EXISTS idx_timetable_user ON timetable_slots(user_id);
CREATE INDEX IF NOT EXISTS idx_units_subject ON units(subject_id);
CREATE INDEX IF NOT EXISTS idx_topics_unit ON topics(unit_id);
CREATE INDEX IF NOT EXISTS idx_topics_subject ON topics(subject_id);
CREATE INDEX IF NOT EXISTS idx_lessons_subject_date ON lessons(subject_id, scheduled_date);
CREATE INDEX IF NOT EXISTS idx_lessons_user ON lessons(user_id);
CREATE INDEX IF NOT EXISTS idx_official_holidays_date ON official_holidays(holiday_date);

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE timetable_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE units ENABLE ROW LEVEL SECURITY;
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE official_holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE non_teaching_dates ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_history ENABLE ROW LEVEL SECURITY;

-- Helper function to check if current user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies
CREATE POLICY "Users can view their own profile or admins view all"
  ON profiles FOR SELECT
  USING (auth.uid() = id OR is_admin());

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users manage their own subjects"
  ON subjects FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage their own timetable slots"
  ON timetable_slots FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage their own units"
  ON units FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage their own topics"
  ON topics FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "All authenticated users can read official holidays"
  ON official_holidays FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can insert official holidays"
  ON official_holidays FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Only admins can update official holidays"
  ON official_holidays FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Only admins can delete official holidays"
  ON official_holidays FOR DELETE
  TO authenticated
  USING (is_admin());

CREATE POLICY "Users manage their own non_teaching_dates"
  ON non_teaching_dates FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage their own lessons"
  ON lessons FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage their own lesson history"
  ON lesson_history FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Idempotent Official Holiday Dataset Seed (2026 official list)
INSERT INTO official_holidays (name, holiday_date, source_year)
VALUES
  ('New Year''s Day', '2026-01-01', 2026),
  ('Pongal', '2026-01-15', 2026),
  ('Thiruvalluvar Day', '2026-01-16', 2026),
  ('Uzhavar Thirunal', '2026-01-17', 2026),
  ('Republic Day', '2026-01-26', 2026),
  ('Thaipoosam', '2026-02-01', 2026),
  ('Telugu New Year''s Day', '2026-03-19', 2026),
  ('Ramzan [Idu''l Fitr]', '2026-03-21', 2026),
  ('Mahaveer Jayanthi', '2026-03-31', 2026),
  ('Good Friday', '2026-04-03', 2026),
  ('Tamil New Year''s Day / Dr. B.R. Ambedkar''s Birthday', '2026-04-14', 2026),
  ('May Day', '2026-05-01', 2026),
  ('Bakrid [Idul Azha]', '2026-05-28', 2026),
  ('Muharram', '2026-06-26', 2026),
  ('Independence Day', '2026-08-15', 2026),
  ('Milad-un-Nabi', '2026-08-26', 2026),
  ('Krishna Jayanthi', '2026-09-04', 2026),
  ('Vinayakar Chathurthi', '2026-09-14', 2026),
  ('Gandhi Jayanthi', '2026-10-02', 2026),
  ('Ayutha Pooja', '2026-10-19', 2026),
  ('Vijaya Dasami', '2026-10-20', 2026),
  ('Deepavali', '2026-11-08', 2026),
  ('Christmas', '2026-12-25', 2026)
ON CONFLICT (holiday_date) DO UPDATE 
SET name = EXCLUDED.name, source_year = EXCLUDED.source_year;
