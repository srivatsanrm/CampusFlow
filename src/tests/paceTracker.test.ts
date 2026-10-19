import { describe, it, expect } from 'vitest';
import { calculateSubjectForecast } from '../engine/forecastEngine';
import { Subject, Topic, TimetableSlot, OfficialHoliday, Lesson } from '../types/database';

describe('Smart Syllabus Pace Tracker', () => {
  const holidays: OfficialHoliday[] = [
    {
      id: 'h-1',
      name: 'Republic Day',
      holiday_date: '2026-01-26', // Monday
      source_year: 2026,
      created_at: '',
      updated_at: '',
    },
  ];

  const dummySubjectCSE: Subject = {
    id: 'sub-cse-a',
    user_id: 'prof-1',
    name: 'Physics',
    class_programme: 'B.Tech CSE',
    year_semester: 'Year 1 / Sem 2',
    section: 'A',
    classroom: 'Room 204',
    subject_code: 'PHY101',
    semester_start_date: '2026-01-05',
    semester_end_date: '2026-04-30',
    status: 'active',
    created_at: '',
    updated_at: '',
  };

  const dummySubjectECE: Subject = {
    id: 'sub-ece-b',
    user_id: 'prof-1',
    name: 'Physics',
    class_programme: 'B.Tech ECE',
    year_semester: 'Year 1 / Sem 2',
    section: 'B',
    classroom: 'Room 310',
    subject_code: 'PHY101',
    semester_start_date: '2026-01-05',
    semester_end_date: '2026-04-30',
    status: 'active',
    created_at: '',
    updated_at: '',
  };

  const timetableCSE: TimetableSlot[] = [
    {
      id: 'slot-1',
      subject_id: 'sub-cse-a',
      user_id: 'prof-1',
      weekday: 1, // Monday
      period_number: 1,
      start_time: '08:30',
      end_time: '09:20',
      label: 'Period 1',
      created_at: '',
      updated_at: '',
    },
    {
      id: 'slot-2',
      subject_id: 'sub-cse-a',
      user_id: 'prof-1',
      weekday: 3, // Wednesday
      period_number: 3,
      start_time: '10:20',
      end_time: '11:10',
      label: 'Period 3',
      created_at: '',
      updated_at: '',
    },
  ];

  const timetableECE: TimetableSlot[] = [
    {
      id: 'slot-3',
      subject_id: 'sub-ece-b',
      user_id: 'prof-1',
      weekday: 2, // Tuesday
      period_number: 2,
      start_time: '09:20',
      end_time: '10:10',
      label: 'Period 2',
      created_at: '',
      updated_at: '',
    },
  ];

  const topicsCSE: Topic[] = [
    { id: 't1', unit_id: 'u1', subject_id: 'sub-cse-a', user_id: 'prof-1', title: 'Optics 1', estimated_periods: 1, sort_order: 1, is_completed: true, created_at: '', updated_at: '' },
    { id: 't2', unit_id: 'u1', subject_id: 'sub-cse-a', user_id: 'prof-1', title: 'Optics 2', estimated_periods: 1, sort_order: 2, is_completed: true, created_at: '', updated_at: '' },
    { id: 't3', unit_id: 'u1', subject_id: 'sub-cse-a', user_id: 'prof-1', title: 'Optics 3', estimated_periods: 1, sort_order: 3, is_completed: false, created_at: '', updated_at: '' },
    { id: 't4', unit_id: 'u1', subject_id: 'sub-cse-a', user_id: 'prof-1', title: 'Optics 4', estimated_periods: 1, sort_order: 4, is_completed: false, created_at: '', updated_at: '' },
  ];

  it('calculates progress percentage and remaining topics accurately', () => {
    // Evaluation as of Jan 5, 2026 08:00 AM
    const asOf = new Date('2026-01-05T02:30:00Z'); // 8:00 AM IST
    const forecast = calculateSubjectForecast({
      subject: dummySubjectCSE,
      topics: topicsCSE,
      timetableSlots: timetableCSE,
      officialHolidays: holidays,
      nonTeachingDates: [],
      asOfDate: asOf,
    });

    expect(forecast.totalTopics).toBe(4);
    expect(forecast.completedTopics).toBe(2);
    expect(forecast.remainingTopics).toBe(2);
    expect(forecast.completionPercentage).toBe(50);
    expect(forecast.status).toBe('on_track');
  });

  it('handles zero topics gracefully without NaN or division by zero', () => {
    const forecast = calculateSubjectForecast({
      subject: dummySubjectCSE,
      topics: [],
      timetableSlots: timetableCSE,
      officialHolidays: holidays,
      nonTeachingDates: [],
    });

    expect(forecast.totalTopics).toBe(0);
    expect(forecast.completionPercentage).toBe(0);
    expect(forecast.status).toBe('not_configured');
    expect(forecast.detailMessage).toContain('Syllabus not configured');
  });

  it('handles 100% completed syllabus correctly', () => {
    const allCompletedTopics: Topic[] = topicsCSE.map((t) => ({ ...t, is_completed: true }));
    const forecast = calculateSubjectForecast({
      subject: dummySubjectCSE,
      topics: allCompletedTopics,
      timetableSlots: timetableCSE,
      officialHolidays: holidays,
      nonTeachingDates: [],
    });

    expect(forecast.completionPercentage).toBe(100);
    expect(forecast.remainingTopics).toBe(0);
    expect(forecast.plannedPeriodsNeeded).toBe(0);
    expect(forecast.status).toBe('complete');
    expect(forecast.detailMessage).toContain('Syllabus complete');
  });

  it('filters past and in-progress teaching periods on current day in Asia/Kolkata', () => {
    // 2026-01-05 is a Monday.
    // CSE Period 1 is 08:30 - 09:20 AM.
    // At 09:00 AM IST, Period 1 is in progress; it should NOT be counted as a future teaching opportunity.
    const duringPeriod1 = new Date('2026-01-05T03:30:00Z'); // 09:00 AM IST
    const forecast = calculateSubjectForecast({
      subject: dummySubjectCSE,
      topics: topicsCSE,
      timetableSlots: timetableCSE,
      officialHolidays: holidays,
      nonTeachingDates: [],
      asOfDate: duringPeriod1,
    });

    // Before Period 1 on Monday:
    const beforePeriod1 = new Date('2026-01-05T02:00:00Z'); // 07:30 AM IST
    const forecastBefore = calculateSubjectForecast({
      subject: dummySubjectCSE,
      topics: topicsCSE,
      timetableSlots: timetableCSE,
      officialHolidays: holidays,
      nonTeachingDates: [],
      asOfDate: beforePeriod1,
    });

    // The slot on 2026-01-05 Period 1 was counted before 8:30 AM, but excluded during/after
    expect(forecastBefore.availableRemainingSlots).toBe(forecast.availableRemainingSlots + 1);
  });

  it('excludes official holidays from available teaching periods', () => {
    // 2026-01-26 is Republic Day (Monday). CSE has a Monday slot.
    // With holiday, available periods should be 1 less than without holiday.
    const asOf = new Date('2026-01-05T02:00:00Z');
    const withHoliday = calculateSubjectForecast({
      subject: dummySubjectCSE,
      topics: topicsCSE,
      timetableSlots: timetableCSE,
      officialHolidays: holidays,
      nonTeachingDates: [],
      asOfDate: asOf,
    });

    const withoutHoliday = calculateSubjectForecast({
      subject: dummySubjectCSE,
      topics: topicsCSE,
      timetableSlots: timetableCSE,
      officialHolidays: [],
      nonTeachingDates: [],
      asOfDate: asOf,
    });

    expect(withoutHoliday.availableRemainingSlots).toBe(withHoliday.availableRemainingSlots + 1);
  });

  it('provides independent forecasts for different sections of the same subject', () => {
    // CSE-A has 2 slots/week; ECE-B has 1 slot/week
    const combinedTimetable = [...timetableCSE, ...timetableECE];

    const topicsECE: Topic[] = [
      { id: 't-e1', unit_id: 'u1', subject_id: 'sub-ece-b', user_id: 'prof-1', title: 'Optics 1', estimated_periods: 1, sort_order: 1, is_completed: false, created_at: '', updated_at: '' },
    ];

    const asOf = new Date('2026-01-05T02:00:00Z');

    const forecastCSE = calculateSubjectForecast({
      subject: dummySubjectCSE,
      topics: topicsCSE,
      timetableSlots: combinedTimetable,
      officialHolidays: holidays,
      nonTeachingDates: [],
      asOfDate: asOf,
    });

    const forecastECE = calculateSubjectForecast({
      subject: dummySubjectECE,
      topics: topicsECE,
      timetableSlots: combinedTimetable,
      officialHolidays: holidays,
      nonTeachingDates: [],
      asOfDate: asOf,
    });

    // CSE-A has 2 slots per week; ECE-B has 1 slot per week
    expect(forecastCSE.availableRemainingSlots).toBeGreaterThan(forecastECE.availableRemainingSlots);
    expect(forecastCSE.section).toBe('A');
    expect(forecastECE.section).toBe('B');
  });

  it('detects Behind Schedule when required periods exceed available periods', () => {
    // Subject with only 1 week semester length
    const tightSubject: Subject = {
      ...dummySubjectCSE,
      semester_start_date: '2026-01-05',
      semester_end_date: '2026-01-07', // only Mon and Wed = 2 slots
    };

    // 10 uncompleted topics = 10 periods needed
    const manyTopics: Topic[] = Array.from({ length: 10 }, (_, i) => ({
      id: `top-${i}`,
      unit_id: 'u1',
      subject_id: 'sub-cse-a',
      user_id: 'prof-1',
      title: `Topic ${i}`,
      estimated_periods: 1,
      sort_order: i,
      is_completed: false,
      created_at: '',
      updated_at: '',
    }));

    const asOf = new Date('2026-01-05T02:00:00Z');
    const forecast = calculateSubjectForecast({
      subject: tightSubject,
      topics: manyTopics,
      timetableSlots: timetableCSE,
      officialHolidays: [],
      nonTeachingDates: [],
      asOfDate: asOf,
    });

    expect(forecast.status).toBe('behind_schedule');
    expect(forecast.bufferPeriods).toBeLessThan(0);
    expect(forecast.detailMessage).toContain('shortfall');
  });

  it('triggers At Risk when safety buffer <= 5 periods', () => {
    // Available periods = 3, needed periods = 2 -> buffer = 1 (<= 5)
    const tightSubject: Subject = {
      ...dummySubjectCSE,
      semester_start_date: '2026-01-05',
      semester_end_date: '2026-01-12', // Mon(Jan 5), Wed(Jan 7), Mon(Jan 12) = 3 slots
    };

    const topics: Topic[] = [
      { id: 'top-1', unit_id: 'u1', subject_id: 'sub-cse-a', user_id: 'prof-1', title: 'T1', estimated_periods: 1, sort_order: 1, is_completed: false, created_at: '', updated_at: '' },
      { id: 'top-2', unit_id: 'u1', subject_id: 'sub-cse-a', user_id: 'prof-1', title: 'T2', estimated_periods: 1, sort_order: 2, is_completed: false, created_at: '', updated_at: '' },
    ];

    const asOf = new Date('2026-01-05T02:00:00Z');
    const forecast = calculateSubjectForecast({
      subject: tightSubject,
      topics,
      timetableSlots: timetableCSE,
      officialHolidays: [],
      nonTeachingDates: [],
      asOfDate: asOf,
      safetyBuffer: 5,
    });

    expect(forecast.status).toBe('at_risk');
    expect(forecast.bufferPeriods).toBe(1);
    expect(forecast.detailMessage).toContain('buffer period');
  });

  it('accounts for scheduled replacement lessons without double counting', () => {
    // Teacher manually scheduled a replacement lesson on Thursday (Jan 8, 2026) 10:20-11:10
    const replacementLesson: Lesson = {
      id: 'less-rep-1',
      subject_id: 'sub-cse-a',
      topic_id: 't3',
      user_id: 'prof-1',
      scheduled_date: '2026-01-08',
      period_start: '10:20',
      period_end: '11:10',
      status: 'planned',
      created_at: '',
      updated_at: '',
    };

    const asOf = new Date('2026-01-05T02:00:00Z');
    const withoutReplacement = calculateSubjectForecast({
      subject: dummySubjectCSE,
      topics: topicsCSE,
      timetableSlots: timetableCSE,
      officialHolidays: holidays,
      nonTeachingDates: [],
      asOfDate: asOf,
    });

    const withReplacement = calculateSubjectForecast({
      subject: dummySubjectCSE,
      topics: topicsCSE,
      timetableSlots: timetableCSE,
      officialHolidays: holidays,
      nonTeachingDates: [],
      lessons: [replacementLesson],
      asOfDate: asOf,
    });

    expect(withReplacement.availableRemainingSlots).toBe(withoutReplacement.availableRemainingSlots + 1);
  });
});
