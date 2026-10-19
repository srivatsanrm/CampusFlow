export type UserRole = 'teacher' | 'admin';
export type ThemePreference = 'light' | 'dark' | 'system';
export type SubjectStatus = 'active' | 'archived';
export type LessonStatus = 'planned' | 'completed' | 'not_completed';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  timezone: string;
  theme_preference: ThemePreference;
  created_at: string;
  updated_at: string;
}

export interface Subject {
  id: string;
  user_id: string;
  name: string;                      // e.g. Physics
  class_programme: string;           // e.g. B.Tech CSE
  year_semester: string;             // e.g. Year 2 / Sem 4
  section: string;                   // e.g. Section A
  classroom?: string | null;         // e.g. Room 204
  subject_code?: string | null;      // e.g. PH101
  notes?: string | null;
  semester_start_date: string;       // YYYY-MM-DD
  semester_end_date: string;         // YYYY-MM-DD
  status: SubjectStatus;
  created_at: string;
  updated_at: string;
}

export interface TimetableSlot {
  id: string;
  subject_id: string | null; // nullable for free / blank periods
  user_id: string;
  weekday: number; // 1 = Monday, ..., 5 = Friday
  period_number?: number; // 1 to 8 (Fixed daily timetable period)
  start_time: string; // HH:MM
  end_time: string;   // HH:MM
  label?: string | null;
  classroom?: string | null;
  created_at: string;
  updated_at: string;
  // virtual joined fields for timetable view
  subject_name?: string;
  class_programme?: string;
  section?: string;
  planned_topic?: string;
  is_completed?: boolean;
}

export interface Unit {
  id: string;
  subject_id: string;
  user_id: string;
  title: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
  topics?: Topic[];
}

export interface Topic {
  id: string;
  unit_id: string;
  subject_id: string;
  user_id: string;
  title: string;
  estimated_periods: number;
  sort_order: number;
  is_completed: boolean;
  completed_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface OfficialHoliday {
  id: string;
  name: string;
  holiday_date: string; // YYYY-MM-DD
  source_year: number;
  created_at: string;
  updated_at: string;
}

export interface NonTeachingDate {
  id: string;
  subject_id: string;
  user_id: string;
  date: string; // YYYY-MM-DD
  reason: string;
  created_at: string;
}

export interface Lesson {
  id: string;
  subject_id: string;
  topic_id: string;
  user_id: string;
  scheduled_date: string; // YYYY-MM-DD
  period_start: string;   // HH:MM
  period_end: string;     // HH:MM
  status: LessonStatus;
  completed_at?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  // Joined virtual fields
  topic_title?: string;
  unit_title?: string;
  subject_name?: string;
  class_programme?: string;
  section?: string;
  classroom?: string;
}

export interface LessonHistory {
  id: string;
  lesson_id: string;
  user_id: string;
  previous_date?: string | null;
  new_date?: string | null;
  previous_status?: LessonStatus | null;
  new_status?: LessonStatus | null;
  reason?: string | null;
  created_at: string;
}

export type PaceStatus =
  | 'on_track'
  | 'at_risk'
  | 'behind_schedule'
  | 'complete'
  | 'not_configured'
  | 'insufficient_data'
  | 'invalid_dates';

export interface PaceSettings {
  subject_id: string;
  user_id: string;
  topics_per_period?: number; // Teacher's configurable planning assumption (default 1.0)
  safety_buffer?: number;     // Buffer periods for At Risk threshold (default 5)
  updated_at: string;
}

export interface SubjectForecast {
  subjectId: string;
  subjectName: string;
  classProgramme: string;
  section: string;
  totalTopics: number;
  completedTopics: number;
  remainingTopics: number;
  completionPercentage: number;
  topicsPerPeriodRate: number;
  isHistoricalRate: boolean;
  plannedPeriodsNeeded: number;
  availableRemainingSlots: number;
  bufferPeriods: number; // availableRemainingSlots - plannedPeriodsNeeded
  estimatedCompletionDate: string | null;
  estimatedCompletionDisplay: string | null; // e.g. "November 24, 2026"
  semesterDeadline: string;
  status: PaceStatus;
  detailMessage: string;
}
