import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  Subject,
  TimetableSlot,
  Unit,
  Topic,
  OfficialHoliday,
  NonTeachingDate,
  Lesson,
  SubjectForecast,
  PaceSettings,
} from '@/types/database';
import { StorageDB } from '@/lib/storage';
import { useAuth } from './AuthContext';
import { calculateSubjectForecast } from '@/engine/forecastEngine';
import { generateSchedule } from '@/engine/schedulingEngine';

interface DataContextType {
  subjects: Subject[];
  officialHolidays: OfficialHoliday[];
  refreshData: () => void;
  // Subject operations
  addSubject: (data: Omit<Subject, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Subject;
  updateSubject: (subject: Subject) => void;
  deleteSubject: (subjectId: string) => void;
  // Timetable
  getTimetable: (subjectId: string) => TimetableSlot[];
  getAllTeacherTimetable: () => TimetableSlot[];
  saveTimetable: (subjectId: string, slots: TimetableSlot[]) => void;
  savePeriodAssignment: (weekday: number, periodNumber: number, subjectId: string | null) => void;
  deleteTimetableSlot: (slotId: string) => void;
  // Units & Topics
  getUnitsWithTopics: (subjectId: string) => Unit[];
  addUnit: (subjectId: string, title: string) => Unit;
  updateUnit: (unit: Unit) => void;
  deleteUnit: (unitId: string) => void;
  addTopic: (unitId: string, subjectId: string, title: string, estimatedPeriods?: number) => Topic;
  updateTopic: (topic: Topic) => void;
  toggleTopicCompleted: (topicId: string, isCompleted: boolean) => void;
  deleteTopic: (topicId: string) => void;
  batchSaveUnitsAndTopics: (subjectId: string, units: Array<{ title: string; topics: Array<{ title: string; estimated_periods: number }> }>) => void;
  // Lessons & Scheduling
  getLessons: (subjectId: string) => Lesson[];
  getAllLessons: () => Lesson[];
  generateAndSaveSchedule: (subjectId: string) => { isFeasible: boolean; warnings: string[]; totalScheduled: number };
  updateLessonStatus: (lessonId: string, status: 'planned' | 'completed' | 'not_completed', notes?: string) => void;
  rescheduleLessonManual: (lessonId: string, newDate: string, startTime: string, endTime: string, reason?: string) => { success: boolean; error?: string };
  // Official Holidays (Admin only actions)
  addOfficialHoliday: (name: string, date: string, sourceYear?: number) => { success: boolean; error?: string };
  updateOfficialHoliday: (holiday: OfficialHoliday) => { success: boolean; error?: string };
  deleteOfficialHoliday: (holidayId: string) => void;
  // Forecasts & Metrics
  getSubjectForecast: (subjectId: string) => SubjectForecast | null;
  getPaceSettings: (subjectId: string) => PaceSettings | null;
  savePaceSettings: (subjectId: string, topicsPerPeriod?: number, safetyBuffer?: number) => void;
  loadDemoData: () => void;
  clearAllUserData: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [officialHolidays, setOfficialHolidays] = useState<OfficialHoliday[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  const refreshData = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  useEffect(() => {
    // Holidays are shared across all users
    const hols = StorageDB.getOfficialHolidays();
    setOfficialHolidays(hols);

    if (user) {
      const subs = StorageDB.getSubjects(user.id);
      setSubjects(subs);
    } else {
      setSubjects([]);
    }
  }, [user, refreshTrigger]);

  const addSubject = (data: Omit<Subject, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Subject => {
    if (!user) throw new Error('User not authenticated');
    const newSubject: Subject = {
      ...data,
      id: `sub-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      user_id: user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    StorageDB.saveSubject(newSubject);
    refreshData();
    return newSubject;
  };

  const updateSubject = (subject: Subject) => {
    if (!user || subject.user_id !== user.id) return;
    StorageDB.saveSubject({ ...subject, updated_at: new Date().toISOString() });
    refreshData();
  };

  const deleteSubject = (subjectId: string) => {
    if (!user) return;
    StorageDB.deleteSubject(subjectId, user.id);
    refreshData();
  };

  const getTimetable = (subjectId: string): TimetableSlot[] => {
    if (!user) return [];
    return StorageDB.getTimetable(subjectId, user.id);
  };

  const getAllTeacherTimetable = (): TimetableSlot[] => {
    if (!user) return [];
    const slots = StorageDB.getAllUserTimetable(user.id);
    const subMap = new Map(subjects.map((s) => [s.id, s]));

    // Enrich slots with subject, class/programme, section, and topic progress
    return slots.map((s) => {
      const sub = s.subject_id ? subMap.get(s.subject_id) : undefined;
      const topics = s.subject_id ? StorageDB.getTopics(s.subject_id, user.id) : [];
      const nextPendingTopic = topics.find((t) => !t.is_completed);

      return {
        ...s,
        subject_name: sub?.name || (s.subject_id ? 'Class' : 'Free'),
        class_programme: sub?.class_programme || '',
        section: sub?.section || '',
        classroom: s.classroom || sub?.classroom || '',
        planned_topic: nextPendingTopic ? nextPendingTopic.title : (topics.length > 0 ? 'All topics completed' : 'No topics added'),
        is_completed: nextPendingTopic ? nextPendingTopic.is_completed : false,
      };
    });
  };

  const savePeriodAssignment = (weekday: number, periodNumber: number, subjectId: string | null) => {
    if (!user) return;
    StorageDB.savePeriodAssignment(user.id, weekday, periodNumber, subjectId);
    refreshData();
  };

  const saveTimetable = (subjectId: string, slots: TimetableSlot[]) => {
    if (!user) return;
    StorageDB.saveTimetable(subjectId, user.id, slots);
    refreshData();
  };

  const deleteTimetableSlot = (slotId: string) => {
    if (!user) return;
    StorageDB.deleteTimetableSlot(slotId, user.id);
    refreshData();
  };

  const getUnitsWithTopics = (subjectId: string): Unit[] => {
    if (!user) return [];
    const units = StorageDB.getUnits(subjectId, user.id);
    const topics = StorageDB.getTopics(subjectId, user.id);
    return units.map((u) => ({
      ...u,
      topics: topics.filter((t) => t.unit_id === u.id),
    }));
  };

  const addUnit = (subjectId: string, title: string): Unit => {
    if (!user) throw new Error('Unauthenticated');
    const existing = StorageDB.getUnits(subjectId, user.id);
    const newUnit: Unit = {
      id: `unit-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      subject_id: subjectId,
      user_id: user.id,
      title,
      sort_order: existing.length + 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    StorageDB.saveUnit(newUnit);
    refreshData();
    return newUnit;
  };

  const updateUnit = (unit: Unit) => {
    if (!user || unit.user_id !== user.id) return;
    StorageDB.saveUnit({ ...unit, updated_at: new Date().toISOString() });
    refreshData();
  };

  const deleteUnit = (unitId: string) => {
    if (!user) return;
    StorageDB.deleteUnit(unitId, user.id);
    refreshData();
  };

  const addTopic = (unitId: string, subjectId: string, title: string, estimatedPeriods = 1): Topic => {
    if (!user) throw new Error('Unauthenticated');
    const existing = StorageDB.getTopics(subjectId, user.id).filter((t) => t.unit_id === unitId);
    const newTopic: Topic = {
      id: `topic-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      unit_id: unitId,
      subject_id: subjectId,
      user_id: user.id,
      title,
      estimated_periods: Math.max(1, estimatedPeriods),
      sort_order: existing.length + 1,
      is_completed: false,
      completed_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    StorageDB.saveTopic(newTopic);
    refreshData();
    return newTopic;
  };

  const updateTopic = (topic: Topic) => {
    if (!user || topic.user_id !== user.id) return;
    StorageDB.saveTopic({ ...topic, updated_at: new Date().toISOString() });
    refreshData();
  };

  const toggleTopicCompleted = (topicId: string, isCompleted: boolean) => {
    if (!user) return;
    const allTopics = StorageDB.getAllActiveTopics(user.id);
    const target = allTopics.find((t) => t.id === topicId);
    if (!target) return;

    const updated: Topic = {
      ...target,
      is_completed: isCompleted,
      completed_at: isCompleted ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    };
    StorageDB.saveTopic(updated);

    // If marked completed, also mark its scheduled lessons as completed if planned
    if (isCompleted) {
      const lessons = StorageDB.getLessons(target.subject_id, user.id);
      let changed = false;
      const updatedLessons = lessons.map((l) => {
        if (l.topic_id === topicId && l.status === 'planned') {
          changed = true;
          return {
            ...l,
            status: 'completed' as const,
            completed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
        }
        return l;
      });
      if (changed) {
        StorageDB.saveLessons(target.subject_id, user.id, updatedLessons);
      }
    }

    refreshData();
  };

  const deleteTopic = (topicId: string) => {
    if (!user) return;
    StorageDB.deleteTopic(topicId, user.id);
    refreshData();
  };

  const batchSaveUnitsAndTopics = (
    subjectId: string,
    extractedUnits: Array<{ title: string; topics: Array<{ title: string; estimated_periods: number }> }>
  ) => {
    if (!user) return;
    const now = new Date().toISOString();
    let currentUnits = StorageDB.getUnits(subjectId, user.id);
    const newTopics: Topic[] = [];

    extractedUnits.forEach((uData, uIdx) => {
      const uId = `unit-${Date.now()}-${uIdx}-${Math.random().toString(36).substr(2, 4)}`;
      const unitObj: Unit = {
        id: uId,
        subject_id: subjectId,
        user_id: user.id,
        title: uData.title,
        sort_order: currentUnits.length + uIdx + 1,
        created_at: now,
        updated_at: now,
      };
      StorageDB.saveUnit(unitObj);

      uData.topics.forEach((tData, tIdx) => {
        newTopics.push({
          id: `topic-${Date.now()}-${uIdx}-${tIdx}-${Math.random().toString(36).substr(2, 4)}`,
          unit_id: uId,
          subject_id: subjectId,
          user_id: user.id,
          title: tData.title,
          estimated_periods: Math.max(1, tData.estimated_periods || 1),
          sort_order: tIdx + 1,
          is_completed: false,
          completed_at: null,
          created_at: now,
          updated_at: now,
        });
      });
    });

    StorageDB.saveTopicsBatch(newTopics);
    refreshData();
  };

  const getLessons = (subjectId: string): Lesson[] => {
    if (!user) return [];
    const lessons = StorageDB.getLessons(subjectId, user.id);
    const topics = StorageDB.getTopics(subjectId, user.id);
    const units = StorageDB.getUnits(subjectId, user.id);
    const subject = subjects.find((s) => s.id === subjectId);

    const topicMap = new Map(topics.map((t) => [t.id, t]));
    const unitMap = new Map(units.map((u) => [u.id, u]));

    return lessons.map((l) => {
      const topic = topicMap.get(l.topic_id);
      const unit = topic ? unitMap.get(topic.unit_id) : undefined;
      return {
        ...l,
        topic_title: topic?.title || 'Unknown Topic',
        unit_title: unit?.title || 'General',
        subject_name: subject?.name || 'Subject',
        class_programme: subject?.class_programme || '',
        section: subject?.section || '',
        classroom: subject?.classroom || '',
      };
    });
  };

  const getAllLessons = (): Lesson[] => {
    if (!user) return [];
    const all = StorageDB.getAllLessons(user.id);
    const subMap = new Map(subjects.map((s) => [s.id, s]));

    return all.map((l) => {
      const sub = subMap.get(l.subject_id);
      return {
        ...l,
        subject_name: sub?.name || 'Subject',
        class_programme: sub?.class_programme || '',
        section: sub?.section || '',
        classroom: sub?.classroom || '',
      };
    });
  };

  const generateAndSaveSchedule = (
    subjectId: string
  ): { isFeasible: boolean; warnings: string[]; totalScheduled: number } => {
    if (!user) throw new Error('Unauthenticated');
    const subject = subjects.find((s) => s.id === subjectId);
    if (!subject) throw new Error('Subject not found');

    const timetable = StorageDB.getTimetable(subjectId, user.id);
    const topics = StorageDB.getTopics(subjectId, user.id);
    const existingLessons = StorageDB.getLessons(subjectId, user.id);
    const completedLessons = existingLessons.filter((l) => l.status === 'completed');
    const nonTeaching = StorageDB.getNonTeachingDates(subjectId, user.id);

    const result = generateSchedule({
      subject,
      timetableSlots: timetable,
      orderedTopics: topics,
      officialHolidays,
      nonTeachingDates: nonTeaching,
      existingCompletedLessons: completedLessons,
      userId: user.id,
    });

    const now = new Date().toISOString();
    const finalLessons: Lesson[] = result.lessons.map((l, idx) => ({
      ...l,
      id: (l as any).id || `lesson-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 4)}`,
      created_at: (l as any).created_at || now,
      updated_at: now,
    }));

    StorageDB.saveLessons(subjectId, user.id, finalLessons);
    refreshData();

    return {
      isFeasible: result.isFeasible,
      warnings: result.warnings,
      totalScheduled: finalLessons.length,
    };
  };

  const updateLessonStatus = (
    lessonId: string,
    status: 'planned' | 'completed' | 'not_completed',
    notes?: string
  ) => {
    if (!user) return;
    const all = StorageDB.getAllLessons(user.id);
    const target = all.find((l) => l.id === lessonId);
    if (!target) return;

    const previousStatus = target.status;
    const updatedLesson: Lesson = {
      ...target,
      status,
      notes: notes !== undefined ? notes : target.notes,
      completed_at: status === 'completed' ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    };

    StorageDB.updateLesson(updatedLesson);

    // Record audit trail in lesson_history
    StorageDB.addLessonHistory({
      id: `lh-${Date.now()}`,
      lesson_id: lessonId,
      user_id: user.id,
      previous_status: previousStatus,
      new_status: status,
      previous_date: target.scheduled_date,
      new_date: target.scheduled_date,
      reason: notes || `Marked ${status}`,
      created_at: new Date().toISOString(),
    });

    refreshData();
  };

  const rescheduleLessonManual = (
    lessonId: string,
    newDate: string,
    startTime: string,
    endTime: string,
    reason?: string
  ): { success: boolean; error?: string } => {
    if (!user) return { success: false, error: 'Unauthenticated' };
    const all = StorageDB.getAllLessons(user.id);
    const target = all.find((l) => l.id === lessonId);
    if (!target) return { success: false, error: 'Lesson not found' };

    const subject = subjects.find((s) => s.id === target.subject_id);
    if (!subject) return { success: false, error: 'Subject not found' };

    // Validation 1: Weekend check
    const [y, m, d] = newDate.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d, 12, 0, 0);
    const dayOfWeek = dateObj.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return { success: false, error: 'Selected date falls on a weekend (Saturday or Sunday).' };
    }

    // Validation 2: Official holiday check
    const isHoliday = officialHolidays.find((h) => h.holiday_date === newDate);
    if (isHoliday) {
      return { success: false, error: `Selected date is an official holiday: ${isHoliday.name}.` };
    }

    // Validation 3: Semester boundaries
    if (newDate < subject.semester_start_date || newDate > subject.semester_end_date) {
      return {
        success: false,
        error: `Selected date must be within semester dates (${subject.semester_start_date} to ${subject.semester_end_date}).`,
      };
    }

    // Validation 4: Existing lesson collision for this teacher
    const conflict = all.find(
      (l) =>
        l.id !== lessonId &&
        l.scheduled_date === newDate &&
        l.period_start === startTime &&
        l.status !== 'not_completed'
    );
    if (conflict) {
      return { success: false, error: `Conflict: You already have a class scheduled on ${newDate} at ${startTime}.` };
    }

    const previousDate = target.scheduled_date;
    const updatedLesson: Lesson = {
      ...target,
      scheduled_date: newDate,
      period_start: startTime,
      period_end: endTime,
      status: 'planned', // Reset to planned once rescheduled
      updated_at: new Date().toISOString(),
    };

    StorageDB.updateLesson(updatedLesson);

    StorageDB.addLessonHistory({
      id: `lh-${Date.now()}`,
      lesson_id: lessonId,
      user_id: user.id,
      previous_date: previousDate,
      new_date: newDate,
      previous_status: target.status,
      new_status: 'planned',
      reason: reason || 'Manual rescheduling by teacher',
      created_at: new Date().toISOString(),
    });

    refreshData();
    return { success: true };
  };

  // Admin holiday actions
  const addOfficialHoliday = (name: string, date: string, sourceYear = 2026): { success: boolean; error?: string } => {
    if (!user || user.role !== 'admin') {
      return { success: false, error: 'Unauthorized: Only administrators can manage official holidays.' };
    }

    const existing = officialHolidays.find((h) => h.holiday_date === date);
    if (existing) {
      return { success: false, error: `A holiday already exists on ${date}: ${existing.name}.` };
    }

    const newHoliday: OfficialHoliday = {
      id: `holiday-${Date.now()}`,
      name,
      holiday_date: date,
      source_year: sourceYear,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    StorageDB.saveOfficialHoliday(newHoliday);
    refreshData();
    return { success: true };
  };

  const updateOfficialHoliday = (holiday: OfficialHoliday): { success: boolean; error?: string } => {
    if (!user || user.role !== 'admin') {
      return { success: false, error: 'Unauthorized: Only administrators can edit official holidays.' };
    }
    StorageDB.saveOfficialHoliday({ ...holiday, updated_at: new Date().toISOString() });
    refreshData();
    return { success: true };
  };

  const deleteOfficialHoliday = (holidayId: string) => {
    if (!user || user.role !== 'admin') return;
    StorageDB.deleteOfficialHoliday(holidayId);
    refreshData();
  };

  const getPaceSettings = (subjectId: string): PaceSettings | null => {
    if (!user) return null;
    return StorageDB.getPaceSettings(subjectId, user.id);
  };

  const savePaceSettings = (subjectId: string, topicsPerPeriod?: number, safetyBuffer?: number) => {
    if (!user) return;
    StorageDB.savePaceSettings({
      subject_id: subjectId,
      user_id: user.id,
      topics_per_period: topicsPerPeriod,
      safety_buffer: safetyBuffer,
      updated_at: new Date().toISOString(),
    });
    refreshData();
  };

  const getSubjectForecast = (subjectId: string): SubjectForecast | null => {
    if (!user) return null;
    const subject = subjects.find((s) => s.id === subjectId);
    if (!subject) return null;

    const topics = StorageDB.getTopics(subjectId, user.id);
    const timetable = StorageDB.getTimetable(subjectId, user.id);
    const lessons = StorageDB.getLessons(subjectId, user.id);
    const nonTeaching = StorageDB.getNonTeachingDates(subjectId, user.id);
    const paceConfig = StorageDB.getPaceSettings(subjectId, user.id);

    return calculateSubjectForecast({
      subject,
      topics,
      timetableSlots: timetable,
      officialHolidays,
      nonTeachingDates: nonTeaching,
      lessons,
      planningTopicsPerPeriod: paceConfig?.topics_per_period,
      safetyBuffer: paceConfig?.safety_buffer ?? 5,
    });
  };

  const loadDemoData = () => {
    if (!user) return;
    // Create demo subject 1: Physics for B.Tech CSE, Section A
    const demoSub1: Subject = {
      id: `demo-sub-1-${Date.now()}`,
      user_id: user.id,
      name: 'Physics',
      class_programme: 'B.Tech CSE',
      year_semester: 'Year 1 / Sem 2',
      section: 'A',
      classroom: 'Room 204',
      subject_code: 'PHY101',
      notes: 'Morning batch',
      semester_start_date: '2026-01-05',
      semester_end_date: '2026-04-30',
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    StorageDB.saveSubject(demoSub1);

    // Timetable for Sub 1 (Physics CSE-A): Mon Period 1 (08:30-09:20), Wed Period 3 (10:20-11:10)
    const slots1: TimetableSlot[] = [
      { id: `slot-1`, subject_id: demoSub1.id, user_id: user.id, weekday: 1, period_number: 1, start_time: '08:30', end_time: '09:20', label: 'Period 1', classroom: 'Room 204', created_at: '', updated_at: '' },
      { id: `slot-2`, subject_id: demoSub1.id, user_id: user.id, weekday: 3, period_number: 3, start_time: '10:20', end_time: '11:10', label: 'Period 3', classroom: 'Room 204', created_at: '', updated_at: '' },
    ];
    StorageDB.saveTimetable(demoSub1.id, user.id, slots1);

    // Create demo subject 2: Physics for B.Tech ECE, Section B (Separate teaching assignment!)
    const demoSub2: Subject = {
      id: `demo-sub-2-${Date.now()}`,
      user_id: user.id,
      name: 'Physics',
      class_programme: 'B.Tech ECE',
      year_semester: 'Year 1 / Sem 2',
      section: 'B',
      classroom: 'Room 310',
      subject_code: 'PHY101',
      notes: 'Afternoon batch',
      semester_start_date: '2026-01-05',
      semester_end_date: '2026-04-30',
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    StorageDB.saveSubject(demoSub2);

    // Timetable for Sub 2 (Physics ECE-B): Tue Period 2 (09:20-10:10), Thu Period 5 (12:40-13:30)
    const slots2: TimetableSlot[] = [
      { id: `slot-3`, subject_id: demoSub2.id, user_id: user.id, weekday: 2, period_number: 2, start_time: '09:20', end_time: '10:10', label: 'Period 2', classroom: 'Room 310', created_at: '', updated_at: '' },
      { id: `slot-4`, subject_id: demoSub2.id, user_id: user.id, weekday: 4, period_number: 5, start_time: '12:40', end_time: '13:30', label: 'Period 5', classroom: 'Room 310', created_at: '', updated_at: '' },
    ];
    StorageDB.saveTimetable(demoSub2.id, user.id, slots2);

    // Create demo subject 3: Programming in Python for B.Tech CSE, Section C
    const demoSub3: Subject = {
      id: `demo-sub-3-${Date.now()}`,
      user_id: user.id,
      name: 'Programming in Python',
      class_programme: 'B.Tech CSE',
      year_semester: 'Year 1 / Sem 2',
      section: 'C',
      classroom: 'Lab 2',
      subject_code: 'CS102',
      notes: 'Practical lab & lecture',
      semester_start_date: '2026-01-05',
      semester_end_date: '2026-04-30',
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    StorageDB.saveSubject(demoSub3);

    // Timetable for Sub 3 (Python CSE-C): Mon Period 6 (13:30-14:20), Fri Period 4 (11:10-12:00)
    const slots3: TimetableSlot[] = [
      { id: `slot-5`, subject_id: demoSub3.id, user_id: user.id, weekday: 1, period_number: 6, start_time: '13:30', end_time: '14:20', label: 'Period 6', classroom: 'Lab 2', created_at: '', updated_at: '' },
      { id: `slot-6`, subject_id: demoSub3.id, user_id: user.id, weekday: 5, period_number: 4, start_time: '11:10', end_time: '12:00', label: 'Period 4', classroom: 'Lab 2', created_at: '', updated_at: '' },
    ];
    StorageDB.saveTimetable(demoSub3.id, user.id, slots3);

    // Units & Topics for Sub 1 (Physics CSE-A)
    const u1: Unit = { id: `u-1`, subject_id: demoSub1.id, user_id: user.id, title: 'Unit 1: Optics & Waves', sort_order: 1, created_at: '', updated_at: '' };
    StorageDB.saveUnit(u1);
    const demoTopics1: Topic[] = [
      { id: `t-1`, unit_id: u1.id, subject_id: demoSub1.id, user_id: user.id, title: "Interference & Newton's Rings", estimated_periods: 2, sort_order: 1, is_completed: true, completed_at: '2026-01-05T09:50:00Z', created_at: '', updated_at: '' },
      { id: `t-2`, unit_id: u1.id, subject_id: demoSub1.id, user_id: user.id, title: 'Diffraction at Single Slit', estimated_periods: 2, sort_order: 2, is_completed: true, completed_at: '2026-01-07T11:50:00Z', created_at: '', updated_at: '' },
      { id: `t-3`, unit_id: u1.id, subject_id: demoSub1.id, user_id: user.id, title: 'Polarization and Brewster Law', estimated_periods: 2, sort_order: 3, is_completed: false, completed_at: null, created_at: '', updated_at: '' },
    ];
    StorageDB.saveTopicsBatch(demoTopics1);

    // Units & Topics for Sub 2 (Physics ECE-B) - Independent progress!
    const u2: Unit = { id: `u-2`, subject_id: demoSub2.id, user_id: user.id, title: 'Unit 1: Optics & Waves', sort_order: 1, created_at: '', updated_at: '' };
    StorageDB.saveUnit(u2);
    const demoTopics2: Topic[] = [
      { id: `t-4`, unit_id: u2.id, subject_id: demoSub2.id, user_id: user.id, title: "Interference & Newton's Rings", estimated_periods: 2, sort_order: 1, is_completed: true, completed_at: '2026-01-06T10:50:00Z', created_at: '', updated_at: '' },
      { id: `t-5`, unit_id: u2.id, subject_id: demoSub2.id, user_id: user.id, title: 'Diffraction at Single Slit', estimated_periods: 2, sort_order: 2, is_completed: false, completed_at: null, created_at: '', updated_at: '' },
      { id: `t-6`, unit_id: u2.id, subject_id: demoSub2.id, user_id: user.id, title: 'Polarization and Brewster Law', estimated_periods: 2, sort_order: 3, is_completed: false, completed_at: null, created_at: '', updated_at: '' },
    ];
    StorageDB.saveTopicsBatch(demoTopics2);

    refreshData();
  };

  const clearAllUserData = () => {
    if (!user) return;
    StorageDB.clearUserData(user.id);
    refreshData();
  };

  return (
    <DataContext.Provider
      value={{
        subjects,
        officialHolidays,
        refreshData,
        addSubject,
        updateSubject,
        deleteSubject,
        getTimetable,
        getAllTeacherTimetable,
        saveTimetable,
        savePeriodAssignment,
        deleteTimetableSlot,
        getUnitsWithTopics,
        addUnit,
        updateUnit,
        deleteUnit,
        addTopic,
        updateTopic,
        toggleTopicCompleted,
        deleteTopic,
        batchSaveUnitsAndTopics,
        getLessons,
        getAllLessons,
        generateAndSaveSchedule,
        updateLessonStatus,
        rescheduleLessonManual,
        addOfficialHoliday,
        updateOfficialHoliday,
        deleteOfficialHoliday,
        getSubjectForecast,
        getPaceSettings,
        savePaceSettings,
        loadDemoData,
        clearAllUserData,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
