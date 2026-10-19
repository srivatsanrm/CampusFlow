import {
  UserProfile,
  Subject,
  TimetableSlot,
  Unit,
  Topic,
  OfficialHoliday,
  NonTeachingDate,
  Lesson,
  LessonHistory,
  PaceSettings,
} from '@/types/database';
import { INITIAL_OFFICIAL_HOLIDAYS_2026 } from '@/engine/holidays2026';
import { FIXED_PERIODS, getPeriodConfig, mapLegacyTimeToPeriod } from '@/config/timetableConfig';

const STORAGE_KEYS = {
  CURRENT_USER: 'campusflow_current_user',
  USERS: 'campusflow_users',
  SUBJECTS: 'campusflow_subjects',
  TIMETABLE: 'campusflow_timetable',
  UNITS: 'campusflow_units',
  TOPICS: 'campusflow_topics',
  HOLIDAYS: 'campusflow_holidays',
  NON_TEACHING: 'campusflow_non_teaching',
  LESSONS: 'campusflow_lessons',
  LESSON_HISTORY: 'campusflow_lesson_history',
  PACE_SETTINGS: 'campusflow_pace_settings',
};

const memoryStore = new Map<string, string>();

function getItem<T>(key: string, defaultValue: T): T {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const raw = window.localStorage.getItem(key);
      if (!raw) return defaultValue;
      return JSON.parse(raw);
    }
    const mem = memoryStore.get(key);
    if (!mem) return defaultValue;
    return JSON.parse(mem);
  } catch (err) {
    console.error(`Error reading ${key} from storage:`, err);
    return defaultValue;
  }
}

function setItem<T>(key: string, value: T): void {
  try {
    const serialized = JSON.stringify(value);
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, serialized);
    } else {
      memoryStore.set(key, serialized);
    }
  } catch (err) {
    console.error(`Error writing ${key} to storage:`, err);
  }
}

import { generateMultiYearHolidays, generateHolidaysForYear } from '@/engine/holidayRecurrence';

// Initialize persistent official holidays across multiple years (2026-2030+) idempotently
export function initOfficialHolidays(): OfficialHoliday[] {
  const existing = getItem<OfficialHoliday[]>(STORAGE_KEYS.HOLIDAYS, []);
  
  // Base multi-year generation from 2026 through 2030
  const multiYearDefaults = generateMultiYearHolidays(2026, 2030);

  if (!existing || existing.length === 0) {
    setItem(STORAGE_KEYS.HOLIDAYS, multiYearDefaults);
    return multiYearDefaults;
  }

  // If existing list only contains 2026 holidays or lacks future years, seamlessly merge without duplicates
  const existingDatesAndNames = new Set(existing.map((h) => `${h.name}__${h.holiday_date}`));
  let hasNew = false;
  const merged = [...existing];

  for (const h of multiYearDefaults) {
    const key = `${h.name}__${h.holiday_date}`;
    if (!existingDatesAndNames.has(key)) {
      merged.push(h);
      hasNew = true;
    }
  }

  if (hasNew) {
    merged.sort((a, b) => a.holiday_date.localeCompare(b.holiday_date));
    setItem(STORAGE_KEYS.HOLIDAYS, merged);
  }

  return merged;
}


export const StorageDB = {
  // Current user & Auth
  getCurrentUser(): UserProfile | null {
    return getItem<UserProfile | null>(STORAGE_KEYS.CURRENT_USER, null);
  },
  setCurrentUser(user: UserProfile | null): void {
    setItem(STORAGE_KEYS.CURRENT_USER, user);
  },
  getUsers(): Array<UserProfile & { passwordHash: string }> {
    const existing = getItem<Array<UserProfile & { passwordHash: string }>>(STORAGE_KEYS.USERS, []);
    if (existing.length === 0) {
      const defaultUsers: Array<UserProfile & { passwordHash: string }> = [
        {
          id: "demo-teacher-id",
          email: "prof.sharma@college.edu",
          full_name: "Prof. Ramesh Sharma",
          role: "teacher",
          timezone: "Asia/Kolkata",
          theme_preference: "light",
          passwordHash: "teacher123",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: "demo-admin-id",
          email: "academic.dean@college.edu",
          full_name: "Dean of Academics",
          role: "admin",
          timezone: "Asia/Kolkata",
          theme_preference: "light",
          passwordHash: "admin123",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
      ];
      setItem(STORAGE_KEYS.USERS, defaultUsers);
      return defaultUsers;
    }
    return existing;
  },
  saveUser(user: UserProfile & { passwordHash: string }): void {
    const users = this.getUsers().filter((u) => u.id !== user.id && u.email !== user.email);
    users.push(user);
    setItem(STORAGE_KEYS.USERS, users);
  },

  // Subjects (scoped by user_id)
  getSubjects(userId: string): Subject[] {
    const all = getItem<Subject[]>(STORAGE_KEYS.SUBJECTS, []);
    return all.filter((s) => s.user_id === userId).map((s) => ({
      ...s,
      class_programme: s.class_programme || 'B.Tech CSE',
      year_semester: s.year_semester || 'Year 1 / Sem 1',
      section: s.section || 'A',
      classroom: s.classroom || '',
    }));
  },
  saveSubject(subject: Subject): void {
    const all = getItem<Subject[]>(STORAGE_KEYS.SUBJECTS, []).filter((s) => s.id !== subject.id);
    all.push(subject);
    setItem(STORAGE_KEYS.SUBJECTS, all);
  },
  deleteSubject(subjectId: string, userId: string): void {
    const all = getItem<Subject[]>(STORAGE_KEYS.SUBJECTS, []).filter(
      (s) => !(s.id === subjectId && s.user_id === userId)
    );
    setItem(STORAGE_KEYS.SUBJECTS, all);

    // Cascade delete lessons, topics, units, timetable, non-teaching dates
    const timetable = getItem<TimetableSlot[]>(STORAGE_KEYS.TIMETABLE, []).filter(
      (t) => t.subject_id !== subjectId
    );
    setItem(STORAGE_KEYS.TIMETABLE, timetable);

    const units = getItem<Unit[]>(STORAGE_KEYS.UNITS, []).filter((u) => u.subject_id !== subjectId);
    setItem(STORAGE_KEYS.UNITS, units);

    const topics = getItem<Topic[]>(STORAGE_KEYS.TOPICS, []).filter((t) => t.subject_id !== subjectId);
    setItem(STORAGE_KEYS.TOPICS, topics);

    const lessons = getItem<Lesson[]>(STORAGE_KEYS.LESSONS, []).filter((l) => l.subject_id !== subjectId);
    setItem(STORAGE_KEYS.LESSONS, lessons);

    const nonTeaching = getItem<NonTeachingDate[]>(STORAGE_KEYS.NON_TEACHING, []).filter(
      (nt) => nt.subject_id !== subjectId
    );
    setItem(STORAGE_KEYS.NON_TEACHING, nonTeaching);
  },

  // Timetable (Fixed 8 periods per weekday: 1..5, period: 1..8)
  getTimetable(subjectId: string, userId: string): TimetableSlot[] {
    const all = this.getAllUserTimetable(userId);
    return all.filter((t) => t.subject_id === subjectId);
  },
  getAllUserTimetable(userId: string): TimetableSlot[] {
    const raw = getItem<TimetableSlot[]>(STORAGE_KEYS.TIMETABLE, []);
    const userSlots = raw.filter((t) => (t.user_id === userId || !t.user_id));

    // Migrate/normalize to fixed 8-period timetable definitions
    const migrated: TimetableSlot[] = [];
    const seenKeys = new Set<string>();

    for (const slot of userSlots) {
      let periodNum = slot.period_number;
      if (!periodNum || periodNum < 1 || periodNum > 8) {
        periodNum = mapLegacyTimeToPeriod(slot.start_time) || 1;
      }
      const periodConfig = getPeriodConfig(periodNum) || FIXED_PERIODS[periodNum - 1];
      const key = `${slot.weekday}-${periodNum}`;

      if (!seenKeys.has(key)) {
        seenKeys.add(key);
        migrated.push({
          ...slot,
          user_id: userId,
          period_number: periodNum,
          start_time: periodConfig.startTime,
          end_time: periodConfig.endTime,
          label: periodConfig.label,
        });
      }
    }

    return migrated;
  },
  savePeriodAssignment(userId: string, weekday: number, periodNumber: number, subjectId: string | null): void {
    const all = getItem<TimetableSlot[]>(STORAGE_KEYS.TIMETABLE, []);
    const periodConfig = getPeriodConfig(periodNumber);
    if (!periodConfig) return;

    // Remove any existing entry for this user, weekday, and period_number
    const filtered = all.filter((s) => {
      if (s.user_id === userId && s.weekday === weekday) {
        const pNum = s.period_number || mapLegacyTimeToPeriod(s.start_time);
        if (pNum === periodNumber) return false;
      }
      return true;
    });

    if (subjectId) {
      const newSlot: TimetableSlot = {
        id: `slot-${userId}-${weekday}-${periodNumber}`,
        subject_id: subjectId,
        user_id: userId,
        weekday,
        period_number: periodNumber,
        start_time: periodConfig.startTime,
        end_time: periodConfig.endTime,
        label: periodConfig.label,
        classroom: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      filtered.push(newSlot);
    }

    setItem(STORAGE_KEYS.TIMETABLE, filtered);
  },
  saveTimetable(subjectId: string, userId: string, slots: TimetableSlot[]): void {
    // Keep other subjects' slots intact, replace slots for this subjectId
    const other = getItem<TimetableSlot[]>(STORAGE_KEYS.TIMETABLE, []).filter(
      (t) => t.subject_id !== subjectId || (t.user_id && t.user_id !== userId)
    );
    const sanitizedSlots = slots.map((s) => {
      const pNum = s.period_number || mapLegacyTimeToPeriod(s.start_time) || 1;
      const pConfig = getPeriodConfig(pNum) || FIXED_PERIODS[pNum - 1];
      return {
        ...s,
        subject_id: subjectId,
        user_id: userId,
        period_number: pNum,
        start_time: pConfig.startTime,
        end_time: pConfig.endTime,
        label: pConfig.label,
      };
    });
    setItem(STORAGE_KEYS.TIMETABLE, [...other, ...sanitizedSlots]);
  },
  addTimetableSlot(slot: TimetableSlot): void {
    const all = getItem<TimetableSlot[]>(STORAGE_KEYS.TIMETABLE, []);
    all.push(slot);
    setItem(STORAGE_KEYS.TIMETABLE, all);
  },
  updateTimetableSlot(slot: TimetableSlot): void {
    const all = getItem<TimetableSlot[]>(STORAGE_KEYS.TIMETABLE, []).filter((s) => s.id !== slot.id);
    all.push(slot);
    setItem(STORAGE_KEYS.TIMETABLE, all);
  },
  deleteTimetableSlot(slotId: string, userId: string): void {
    const all = getItem<TimetableSlot[]>(STORAGE_KEYS.TIMETABLE, []).filter(
      (s) => s.id !== slotId
    );
    setItem(STORAGE_KEYS.TIMETABLE, all);
  },

  // Units
  getUnits(subjectId: string, userId: string): Unit[] {
    const all = getItem<Unit[]>(STORAGE_KEYS.UNITS, []);
    return all.filter((u) => u.subject_id === subjectId && u.user_id === userId).sort((a, b) => a.sort_order - b.sort_order);
  },
  saveUnit(unit: Unit): void {
    const all = getItem<Unit[]>(STORAGE_KEYS.UNITS, []).filter((u) => u.id !== unit.id);
    all.push(unit);
    setItem(STORAGE_KEYS.UNITS, all);
  },
  deleteUnit(unitId: string, userId: string): void {
    const all = getItem<Unit[]>(STORAGE_KEYS.UNITS, []).filter(
      (u) => !(u.id === unitId && u.user_id === userId)
    );
    setItem(STORAGE_KEYS.UNITS, all);

    // Delete topics under this unit
    const topics = getItem<Topic[]>(STORAGE_KEYS.TOPICS, []).filter((t) => t.unit_id !== unitId);
    setItem(STORAGE_KEYS.TOPICS, topics);
  },

  // Topics
  getTopics(subjectId: string, userId: string): Topic[] {
    const all = getItem<Topic[]>(STORAGE_KEYS.TOPICS, []);
    return all.filter((t) => t.subject_id === subjectId && t.user_id === userId).sort((a, b) => a.sort_order - b.sort_order);
  },
  getAllActiveTopics(userId: string): Topic[] {
    const activeSubjects = this.getSubjects(userId).filter((s) => s.status === 'active');
    const activeSubjectIds = new Set(activeSubjects.map((s) => s.id));
    const all = getItem<Topic[]>(STORAGE_KEYS.TOPICS, []);
    return all.filter((t) => t.user_id === userId && activeSubjectIds.has(t.subject_id));
  },
  saveTopic(topic: Topic): void {
    const all = getItem<Topic[]>(STORAGE_KEYS.TOPICS, []).filter((t) => t.id !== topic.id);
    all.push(topic);
    setItem(STORAGE_KEYS.TOPICS, all);
  },
  saveTopicsBatch(topics: Topic[]): void {
    if (topics.length === 0) return;
    const ids = new Set(topics.map((t) => t.id));
    const existing = getItem<Topic[]>(STORAGE_KEYS.TOPICS, []).filter((t) => !ids.has(t.id));
    setItem(STORAGE_KEYS.TOPICS, [...existing, ...topics]);
  },
  deleteTopic(topicId: string, userId: string): void {
    const all = getItem<Topic[]>(STORAGE_KEYS.TOPICS, []).filter(
      (t) => !(t.id === topicId && t.user_id === userId)
    );
    setItem(STORAGE_KEYS.TOPICS, all);
    const lessons = getItem<Lesson[]>(STORAGE_KEYS.LESSONS, []).filter(
      (l) => !(l.topic_id === topicId && l.status === 'planned')
    );
    setItem(STORAGE_KEYS.LESSONS, lessons);
  },

  // Lessons
  getLessons(subjectId: string, userId: string): Lesson[] {
    const all = getItem<Lesson[]>(STORAGE_KEYS.LESSONS, []);
    return all.filter((l) => l.subject_id === subjectId && l.user_id === userId);
  },
  getAllLessons(userId: string): Lesson[] {
    const all = getItem<Lesson[]>(STORAGE_KEYS.LESSONS, []);
    return all.filter((l) => l.user_id === userId);
  },
  saveLessons(subjectId: string, userId: string, lessons: Lesson[]): void {
    const other = getItem<Lesson[]>(STORAGE_KEYS.LESSONS, []).filter(
      (l) => !(l.subject_id === subjectId && l.user_id === userId)
    );
    setItem(STORAGE_KEYS.LESSONS, [...other, ...lessons]);
  },
  updateLesson(lesson: Lesson): void {
    const all = getItem<Lesson[]>(STORAGE_KEYS.LESSONS, []).filter((l) => l.id !== lesson.id);
    all.push(lesson);
    setItem(STORAGE_KEYS.LESSONS, all);
  },

  // Lesson History
  addLessonHistory(entry: LessonHistory): void {
    const all = getItem<LessonHistory[]>(STORAGE_KEYS.LESSON_HISTORY, []);
    all.unshift(entry);
    setItem(STORAGE_KEYS.LESSON_HISTORY, all);
  },
  getLessonHistory(lessonId: string, userId: string): LessonHistory[] {
    const all = getItem<LessonHistory[]>(STORAGE_KEYS.LESSON_HISTORY, []);
    return all.filter((h) => h.lesson_id === lessonId && h.user_id === userId);
  },

  // Official Holidays (Shared across all accounts)
  getOfficialHolidays(): OfficialHoliday[] {
    return initOfficialHolidays().sort((a, b) => a.holiday_date.localeCompare(b.holiday_date));
  },
  saveOfficialHoliday(holiday: OfficialHoliday): void {
    const all = this.getOfficialHolidays().filter((h) => h.id !== holiday.id);
    all.push(holiday);
    setItem(STORAGE_KEYS.HOLIDAYS, all);
  },
  deleteOfficialHoliday(holidayId: string): void {
    const all = this.getOfficialHolidays().filter((h) => h.id !== holidayId);
    setItem(STORAGE_KEYS.HOLIDAYS, all);
  },

  // Non-teaching dates
  getNonTeachingDates(subjectId: string, userId: string): NonTeachingDate[] {
    const all = getItem<NonTeachingDate[]>(STORAGE_KEYS.NON_TEACHING, []);
    return all.filter((nt) => nt.subject_id === subjectId && nt.user_id === userId);
  },
  saveNonTeachingDate(date: NonTeachingDate): void {
    const all = getItem<NonTeachingDate[]>(STORAGE_KEYS.NON_TEACHING, []).filter((nt) => nt.id !== date.id);
    all.push(date);
    setItem(STORAGE_KEYS.NON_TEACHING, all);
  },
  deleteNonTeachingDate(id: string, userId: string): void {
    const all = getItem<NonTeachingDate[]>(STORAGE_KEYS.NON_TEACHING, []).filter(
      (nt) => !(nt.id === id && nt.user_id === userId)
    );
    setItem(STORAGE_KEYS.NON_TEACHING, all);
  },

  // Pace Settings (Configurable planning assumption per teaching assignment)
  getPaceSettings(subjectId: string, userId: string): PaceSettings | null {
    const all = getItem<PaceSettings[]>(STORAGE_KEYS.PACE_SETTINGS, []);
    return all.find((p) => p.subject_id === subjectId && p.user_id === userId) || null;
  },
  savePaceSettings(settings: PaceSettings): void {
    const all = getItem<PaceSettings[]>(STORAGE_KEYS.PACE_SETTINGS, []).filter(
      (p) => !(p.subject_id === settings.subject_id && p.user_id === settings.user_id)
    );
    all.push(settings);
    setItem(STORAGE_KEYS.PACE_SETTINGS, all);
  },

  // Clear all data for a user (subjects, timetable, units, topics, lessons, history)
  clearUserData(userId: string): void {
    const subjects = getItem<Subject[]>(STORAGE_KEYS.SUBJECTS, []).filter((s) => s.user_id !== userId);
    setItem(STORAGE_KEYS.SUBJECTS, subjects);

    const timetable = getItem<TimetableSlot[]>(STORAGE_KEYS.TIMETABLE, []).filter((t) => t.user_id !== userId);
    setItem(STORAGE_KEYS.TIMETABLE, timetable);

    const units = getItem<Unit[]>(STORAGE_KEYS.UNITS, []).filter((u) => u.user_id !== userId);
    setItem(STORAGE_KEYS.UNITS, units);

    const topics = getItem<Topic[]>(STORAGE_KEYS.TOPICS, []).filter((t) => t.user_id !== userId);
    setItem(STORAGE_KEYS.TOPICS, topics);

    const lessons = getItem<Lesson[]>(STORAGE_KEYS.LESSONS, []).filter((l) => l.user_id !== userId);
    setItem(STORAGE_KEYS.LESSONS, lessons);

    const history = getItem<LessonHistory[]>(STORAGE_KEYS.LESSON_HISTORY, []).filter((h) => h.user_id !== userId);
    setItem(STORAGE_KEYS.LESSON_HISTORY, history);

    const nonTeaching = getItem<NonTeachingDate[]>(STORAGE_KEYS.NON_TEACHING, []).filter((nt) => nt.user_id !== userId);
    setItem(STORAGE_KEYS.NON_TEACHING, nonTeaching);

    const pace = getItem<PaceSettings[]>(STORAGE_KEYS.PACE_SETTINGS, []).filter((p) => p.user_id !== userId);
    setItem(STORAGE_KEYS.PACE_SETTINGS, pace);
  },
};
