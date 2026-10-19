import { describe, it, expect } from 'vitest';
import {
  calculateClassReminder,
  timeStringToMinutes,
  formatTime12h,
  getNowInKolkata,
} from '../engine/reminderEngine';
import { Subject, TimetableSlot, OfficialHoliday } from '../types/database';
import { FIXED_PERIODS } from '../config/timetableConfig';

describe('reminderEngine Unit Tests', () => {
  it('converts HH:mm to minutes accurately', () => {
    expect(timeStringToMinutes('00:00')).toBe(0);
    expect(timeStringToMinutes('08:30')).toBe(510);
    expect(timeStringToMinutes('09:20')).toBe(560);
    expect(timeStringToMinutes('10:10')).toBe(610);
    expect(timeStringToMinutes('12:00')).toBe(720);
    expect(timeStringToMinutes('14:20')).toBe(860);
  });

  it('formats 24h to 12h AM/PM properly', () => {
    expect(formatTime12h('08:30')).toBe('8:30 AM');
    expect(formatTime12h('12:00')).toBe('12:00 PM');
    expect(formatTime12h('13:30')).toBe('1:30 PM');
    expect(formatTime12h('15:05')).toBe('3:05 PM');
  });

  it('detects no timetable configured correctly', () => {
    const reminder = calculateClassReminder({
      slots: [],
      subjects: [],
      officialHolidays: [],
    });
    expect(reminder.type).toBe('no_timetable');
    expect(reminder.title).toBe('No timetable configured');
  });

  it('detects official holidays correctly', () => {
    const kolkata = getNowInKolkata();
    const fakeHoliday: OfficialHoliday = {
      id: 'h-1',
      name: 'College Foundation Day',
      holiday_date: kolkata.dateStr,
      source_year: 2026,
      created_at: '',
      updated_at: '',
    };

    const reminder = calculateClassReminder({
      slots: [
        {
          id: 's-1',
          subject_id: 'sub-1',
          user_id: 'u-1',
          weekday: 1,
          period_number: 1,
          start_time: '08:30',
          end_time: '09:20',
          classroom: '204',
          label: 'Period 1',
          created_at: '',
          updated_at: '',
        },
      ],
      subjects: [
        {
          id: 'sub-1',
          user_id: 'u-1',
          name: 'Physics',
          class_programme: 'B.Tech CSE',
          year_semester: 'Year 1 / Sem 2',
          section: 'A',
          status: 'active',
          semester_start_date: '2026-01-01',
          semester_end_date: '2026-05-01',
          created_at: '',
          updated_at: '',
        },
      ],
      officialHolidays: [fakeHoliday],
    });

    expect(['holiday', 'weekend']).toContain(reminder.type);
  });

  it('identifies Morning Break (10:10-10:20 AM) and Lunch Break (12:00-12:40 PM)', () => {
    const fakeSubjects: Subject[] = [
      {
        id: 'sub-1',
        user_id: 'u-1',
        name: 'Mathematics',
        class_programme: 'B.Tech ECE',
        year_semester: 'Year 1 / Sem 2',
        section: 'B',
        status: 'active',
        semester_start_date: '2026-01-01',
        semester_end_date: '2026-05-01',
        created_at: '',
        updated_at: '',
      },
    ];

    const fakeSlots = [
      {
        id: 's-1',
        subject_id: 'sub-1',
        subject_name: 'Mathematics',
        class_programme: 'B.Tech ECE',
        section: 'B',
        user_id: 'u-1',
        weekday: 1, // Monday
        period_number: 3,
        start_time: '10:20',
        end_time: '11:10',
        created_at: '',
        updated_at: '',
      },
      {
        id: 's-2',
        subject_id: 'sub-1',
        subject_name: 'Mathematics',
        class_programme: 'B.Tech ECE',
        section: 'B',
        user_id: 'u-1',
        weekday: 1,
        period_number: 5,
        start_time: '12:40',
        end_time: '13:30',
        created_at: '',
        updated_at: '',
      },
    ];

    // Monday 10:15 AM (during morning break)
    // Date: Monday 2026-01-05
    const breakTime = new Date('2026-01-05T04:45:00.000Z'); // 10:15 AM IST is 04:45 UTC
    const breakReminder = calculateClassReminder({
      slots: fakeSlots,
      subjects: fakeSubjects,
      officialHolidays: [],
      overrideNow: breakTime,
    });

    expect(breakReminder.type).toBe('break');
    expect(breakReminder.title).toContain('Morning Break');
    expect(breakReminder.details?.subjectName).toBe('Mathematics');
    expect(breakReminder.details?.periodNumber).toBe(3);

    // Monday 12:20 PM (during lunch break) -> 06:50 UTC
    const lunchTime = new Date('2026-01-05T06:50:00.000Z');
    const lunchReminder = calculateClassReminder({
      slots: fakeSlots,
      subjects: fakeSubjects,
      officialHolidays: [],
      overrideNow: lunchTime,
    });

    expect(lunchReminder.type).toBe('lunch');
    expect(lunchReminder.title).toContain('Lunch Break');
    expect(lunchReminder.details?.subjectName).toBe('Mathematics');
    expect(lunchReminder.details?.periodNumber).toBe(5);
  });

  it('correctly reports Free Period when a teaching period is ongoing with no assigned class', () => {
    const fakeSubjects: Subject[] = [
      {
        id: 'sub-1',
        user_id: 'u-1',
        name: 'Physics',
        class_programme: 'B.Tech CSE',
        year_semester: 'Year 1 / Sem 2',
        section: 'A',
        status: 'active',
        semester_start_date: '2026-01-01',
        semester_end_date: '2026-05-01',
        created_at: '',
        updated_at: '',
      },
    ];

    // Teacher has class in Period 1 (08:30-09:20), but Period 2 (09:20-10:10) is FREE
    const fakeSlots = [
      {
        id: 's-1',
        subject_id: 'sub-1',
        subject_name: 'Physics',
        class_programme: 'B.Tech CSE',
        section: 'A',
        user_id: 'u-1',
        weekday: 1, // Monday
        period_number: 1,
        start_time: '08:30',
        end_time: '09:20',
        created_at: '',
        updated_at: '',
      },
      {
        id: 's-3',
        subject_id: 'sub-1',
        subject_name: 'Physics',
        class_programme: 'B.Tech CSE',
        section: 'A',
        user_id: 'u-1',
        weekday: 1,
        period_number: 3,
        start_time: '10:20',
        end_time: '11:10',
        created_at: '',
        updated_at: '',
      },
    ];

    // Monday 09:35 AM IST (during Period 2) -> 04:05 UTC
    const freePeriodTime = new Date('2026-01-05T04:05:00.000Z');
    const reminder = calculateClassReminder({
      slots: fakeSlots,
      subjects: fakeSubjects,
      officialHolidays: [],
      overrideNow: freePeriodTime,
    });

    expect(reminder.type).toBe('free_period');
    expect(reminder.title).toContain('Free Period · Period 2');
    expect(reminder.details?.subjectName).toBe('Physics'); // identifies next class (Period 3)
    expect(reminder.details?.periodNumber).toBe(3);
  });
});
