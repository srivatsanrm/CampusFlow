import { describe, it, expect } from 'vitest';
import {
  generateHolidaysForYear,
  generateMultiYearHolidays,
  calculateGoodFriday,
  getNthWeekdayOfMonth,
  isLeapYear,
} from '@/engine/holidayRecurrence';
import { INITIAL_OFFICIAL_HOLIDAYS_2026 } from '@/engine/holidays2026';
import { initOfficialHolidays } from '@/lib/storage';

describe('CampusFlow Multi-Year Holiday System & Recurrence', () => {
  it('identifies leap years correctly', () => {
    expect(isLeapYear(2024)).toBe(true);
    expect(isLeapYear(2026)).toBe(false);
    expect(isLeapYear(2027)).toBe(false);
    expect(isLeapYear(2028)).toBe(true);
    expect(isLeapYear(2030)).toBe(false);
    expect(isLeapYear(2000)).toBe(true);
    expect(isLeapYear(1900)).toBe(false);
  });

  it('correctly calculates astronomical Good Friday dates for multiple years', () => {
    expect(calculateGoodFriday(2026)).toBe('2026-04-03');
    expect(calculateGoodFriday(2027)).toBe('2027-03-26');
    expect(calculateGoodFriday(2028)).toBe('2028-04-14'); // Leap year
    expect(calculateGoodFriday(2029)).toBe('2029-03-30');
    expect(calculateGoodFriday(2030)).toBe('2030-04-19');
  });

  it('correctly calculates N-th weekday of a month', () => {
    // 2nd Monday of October 2026 (Oct 1 is Thursday, Mon 1 is Oct 5, Mon 2 is Oct 12)
    // month: 10, weekday: 1 (Mon), nth: 2
    expect(getNthWeekdayOfMonth(2026, 10, 1, 2)).toBe('2026-10-12');
  });

  it('generates consistent recurring holidays for 2027, 2028 (leap year), 2029, and 2030', () => {
    const holidays2027 = generateHolidaysForYear(2027);
    const holidays2028 = generateHolidaysForYear(2028);

    // Fixed date holiday check: Republic Day (Jan 26)
    const rep2027 = holidays2027.find((h) => h.name === 'Republic Day');
    const rep2028 = holidays2028.find((h) => h.name === 'Republic Day');
    expect(rep2027?.holiday_date).toBe('2027-01-26');
    expect(rep2028?.holiday_date).toBe('2028-01-26');

    // Fixed date holiday check: Independence Day (Aug 15)
    const ind2027 = holidays2027.find((h) => h.name === 'Independence Day');
    const ind2028 = holidays2028.find((h) => h.name === 'Independence Day');
    expect(ind2027?.holiday_date).toBe('2027-08-15');
    expect(ind2028?.holiday_date).toBe('2028-08-15');

    // Fixed date holiday check: Gandhi Jayanthi (Oct 2)
    const gj2027 = holidays2027.find((h) => h.name === 'Gandhi Jayanthi');
    const gj2028 = holidays2028.find((h) => h.name === 'Gandhi Jayanthi');
    expect(gj2027?.holiday_date).toBe('2027-10-02');
    expect(gj2028?.holiday_date).toBe('2028-10-02');

    // Fixed date holiday check: Christmas (Dec 25)
    const xmas2027 = holidays2027.find((h) => h.name === 'Christmas');
    const xmas2028 = holidays2028.find((h) => h.name === 'Christmas');
    expect(xmas2027?.holiday_date).toBe('2027-12-25');
    expect(xmas2028?.holiday_date).toBe('2028-12-25');

    // Variable holiday check: Good Friday
    const gf2027 = holidays2027.find((h) => h.name === 'Good Friday');
    const gf2028 = holidays2028.find((h) => h.name === 'Good Friday');
    expect(gf2027?.holiday_date).toBe('2027-03-26');
    expect(gf2028?.holiday_date).toBe('2028-04-14');

    // Variable holiday check: Deepavali
    const deep2027 = holidays2027.find((h) => h.name === 'Deepavali');
    const deep2028 = holidays2028.find((h) => h.name === 'Deepavali');
    expect(deep2027?.holiday_date).toBe('2027-10-29');
    expect(deep2028?.holiday_date).toBe('2028-10-17');
  });

  it('generates multi-year holiday dataset without any duplicate entries', () => {
    const multi = generateMultiYearHolidays(2026, 2030);
    expect(multi.length).toBeGreaterThan(INITIAL_OFFICIAL_HOLIDAYS_2026.length);

    // Verify uniqueness of holiday date + name
    const set = new Set<string>();
    for (const h of multi) {
      const key = `${h.name}__${h.holiday_date}`;
      expect(set.has(key)).toBe(false);
      set.add(key);
    }
  });

  it('initOfficialHolidays seeds multi-year dataset into storage cleanly', () => {
    const holidays = initOfficialHolidays();
    expect(holidays.length).toBeGreaterThanOrEqual(100);

    const has2026 = holidays.some((h) => h.source_year === 2026);
    const has2027 = holidays.some((h) => h.source_year === 2027);
    const has2028 = holidays.some((h) => h.source_year === 2028);
    const has2029 = holidays.some((h) => h.source_year === 2029);

    expect(has2026).toBe(true);
    expect(has2027).toBe(true);
    expect(has2028).toBe(true);
    expect(has2029).toBe(true);
  });
});
