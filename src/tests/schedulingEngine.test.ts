import { describe, it, expect } from 'vitest';
import { generateSchedule, isWeekend, parseDateISO } from '../engine/schedulingEngine';
import { calculateSubjectForecast } from '../engine/forecastEngine';
import { INITIAL_OFFICIAL_HOLIDAYS_2026 } from '../engine/holidays2026';
import { Subject, TimetableSlot, Topic, OfficialHoliday } from '../types/database';

describe('CampusFlow Scheduling Engine & Multi-Class Support', () => {
  const dummySubject1: Subject = {
    id: 'sub-cse-a',
    user_id: 'user-1',
    name: 'Physics',
    class_programme: 'B.Tech CSE',
    year_semester: 'Year 1 / Sem 2',
    section: 'A',
    classroom: 'Room 204',
    subject_code: 'PHY101',
    semester_start_date: '2026-01-05', // Monday
    semester_end_date: '2026-04-30',   // Thursday
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const dummySubject2: Subject = {
    id: 'sub-ece-b',
    user_id: 'user-1',
    name: 'Physics',
    class_programme: 'B.Tech ECE',
    year_semester: 'Year 1 / Sem 2',
    section: 'B',
    classroom: 'Room 310',
    subject_code: 'PHY101',
    semester_start_date: '2026-01-05',
    semester_end_date: '2026-04-30',
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // Timetable for CSE-A: Monday (1) 09:00-09:50
  const timetableSlotsCSE: TimetableSlot[] = [
    {
      id: 'ts-1',
      subject_id: 'sub-cse-a',
      user_id: 'user-1',
      weekday: 1, // Mon
      start_time: '09:00',
      end_time: '09:50',
      label: 'Period 1',
      classroom: 'Room 204',
      created_at: '',
      updated_at: '',
    },
  ];

  // Timetable for ECE-B: Tuesday (2) 10:00-10:50
  const timetableSlotsECE: TimetableSlot[] = [
    {
      id: 'ts-2',
      subject_id: 'sub-ece-b',
      user_id: 'user-1',
      weekday: 2, // Tue
      start_time: '10:00',
      end_time: '10:50',
      label: 'Period 2',
      classroom: 'Room 310',
      created_at: '',
      updated_at: '',
    },
  ];

  const topicsCSE: Topic[] = [
    {
      id: 't-1',
      unit_id: 'u-1',
      subject_id: 'sub-cse-a',
      user_id: 'user-1',
      title: "Interference & Newton's Rings",
      estimated_periods: 2,
      sort_order: 1,
      is_completed: true,
      created_at: '',
      updated_at: '',
    },
    {
      id: 't-2',
      unit_id: 'u-1',
      subject_id: 'sub-cse-a',
      user_id: 'user-1',
      title: 'Diffraction',
      estimated_periods: 2,
      sort_order: 2,
      is_completed: false,
      created_at: '',
      updated_at: '',
    },
  ];

  const topicsECE: Topic[] = [
    {
      id: 't-3',
      unit_id: 'u-2',
      subject_id: 'sub-ece-b',
      user_id: 'user-1',
      title: "Interference & Newton's Rings",
      estimated_periods: 2,
      sort_order: 1,
      is_completed: false, // ECE-B has not completed this topic yet!
      created_at: '',
      updated_at: '',
    },
    {
      id: 't-4',
      unit_id: 'u-2',
      subject_id: 'sub-ece-b',
      user_id: 'user-1',
      title: 'Diffraction',
      estimated_periods: 2,
      sort_order: 2,
      is_completed: false,
      created_at: '',
      updated_at: '',
    },
  ];

  const holidays: OfficialHoliday[] = INITIAL_OFFICIAL_HOLIDAYS_2026.map((h, i) => ({
    ...h,
    id: `hol-${i}`,
    created_at: '',
    updated_at: '',
  }));

  it('excludes Saturdays and Sundays', () => {
    expect(isWeekend(new Date(2026, 0, 10, 12))).toBe(true);
    expect(isWeekend(new Date(2026, 0, 11, 12))).toBe(true);
    expect(isWeekend(new Date(2026, 0, 12, 12))).toBe(false);
  });

  it('keeps independent progress between two classes sharing the same subject name', () => {
    const forecastCSE = calculateSubjectForecast({
      subject: dummySubject1,
      topics: topicsCSE,
      timetableSlots: timetableSlotsCSE,
      officialHolidays: holidays,
      nonTeachingDates: [],
    });

    const forecastECE = calculateSubjectForecast({
      subject: dummySubject2,
      topics: topicsECE,
      timetableSlots: timetableSlotsECE,
      officialHolidays: holidays,
      nonTeachingDates: [],
    });

    // CSE-A has 1 of 2 topics completed (50%)
    expect(forecastCSE.completedTopics).toBe(1);
    expect(forecastCSE.completionPercentage).toBe(50);
    expect(forecastCSE.classProgramme).toBe('B.Tech CSE');
    expect(forecastCSE.section).toBe('A');

    // ECE-B has 0 of 2 topics completed (0%)
    expect(forecastECE.completedTopics).toBe(0);
    expect(forecastECE.completionPercentage).toBe(0);
    expect(forecastECE.classProgramme).toBe('B.Tech ECE');
    expect(forecastECE.section).toBe('B');
  });

  it('generates lessons deterministically respecting holidays and multi-period topics', () => {
    const result = generateSchedule({
      subject: dummySubject1,
      timetableSlots: timetableSlotsCSE,
      orderedTopics: topicsCSE,
      officialHolidays: holidays,
      nonTeachingDates: [],
      userId: 'user-1',
    });

    expect(result.isFeasible).toBe(true);
    expect(result.totalPeriodsRequired).toBe(4); // 2 + 2
    expect(result.lessons.length).toBe(4);

    // Verify all scheduled lessons fall strictly on Mon (1)
    for (const lesson of result.lessons) {
      const d = parseDateISO(lesson.scheduled_date);
      expect(d.getDay()).toBe(1);
      // No lesson on Republic Day (Monday 2026-01-26)
      expect(lesson.scheduled_date).not.toBe('2026-01-26');
    }
  });

  it('preserves existing completed lessons during replanning', () => {
    const existingCompleted = [
      {
        id: 'less-comp-1',
        subject_id: 'sub-cse-a',
        topic_id: 't-1',
        user_id: 'user-1',
        scheduled_date: '2026-01-05',
        period_start: '09:00',
        period_end: '09:50',
        status: 'completed' as const,
        completed_at: '2026-01-05T09:45:00Z',
        notes: 'Covered Newton rings',
        created_at: '',
        updated_at: '',
      },
    ];

    const result = generateSchedule({
      subject: dummySubject1,
      timetableSlots: timetableSlotsCSE,
      orderedTopics: topicsCSE,
      officialHolidays: holidays,
      nonTeachingDates: [],
      existingCompletedLessons: existingCompleted,
      userId: 'user-1',
    });

    expect(result.lessons.length).toBe(4);
    const completedLesson = result.lessons.find((l) => l.scheduled_date === '2026-01-05');
    expect(completedLesson).toBeDefined();
    expect(completedLesson?.status).toBe('completed');
  });

  it('reports shortage when syllabus exceeds semester end date', () => {
    const tightSubject: Subject = {
      ...dummySubject1,
      semester_start_date: '2026-01-05',
      semester_end_date: '2026-01-09', // only 1 Monday = 1 slot
    };

    const result = generateSchedule({
      subject: tightSubject,
      timetableSlots: timetableSlotsCSE,
      orderedTopics: topicsCSE, // requires 4 periods
      officialHolidays: holidays,
      nonTeachingDates: [],
      userId: 'user-1',
    });

    expect(result.isFeasible).toBe(false);
    expect(result.periodShortage).toBe(3);
    expect(result.warnings.length).toBeGreaterThan(0);
  });
});
