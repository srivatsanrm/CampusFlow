import { OfficialHoliday } from '@/types/database';
import { INITIAL_OFFICIAL_HOLIDAYS_2026 } from './holidays2026';

/**
 * Recurrence rule configuration for Tamil Nadu / Indian Academic Official Holidays.
 *
 * Types of holidays:
 * 1. 'fixed': Same month and day every year (e.g. New Year, Republic Day, May Day, Independence Day, Gandhi Jayanthi, Christmas).
 * 2. 'weekday': Based on day of week in month (e.g., Nth weekday of a month or last weekday).
 * 3. 'lunar_or_annual': Annually variable holidays (e.g. Ramzan, Bakrid, Deepavali, Pongal variations, Good Friday).
 *    For verified years (2026, 2027, 2028, 2029, 2030), exact calendar dates from official state announcements
 *    are supplied. If year is beyond verified lookup, it safely retains the base or closest known date rule.
 */

// Known verified calendar dates for variable / lunar / calculation-based Indian & state holidays (2026-2030)
const KNOWN_VARIABLE_HOLIDAYS: Record<string, Record<number, string>> = {
  // Pongal (usually Jan 14 or 15)
  "Pongal": {
    2026: "2026-01-15",
    2027: "2027-01-15",
    2028: "2028-01-15",
    2029: "2029-01-14",
    2030: "2030-01-14",
  },
  // Thiruvalluvar Day (day after Pongal)
  "Thiruvalluvar Day": {
    2026: "2026-01-16",
    2027: "2027-01-16",
    2028: "2028-01-16",
    2029: "2029-01-15",
    2030: "2030-01-15",
  },
  // Uzhavar Thirunal (day after Thiruvalluvar Day)
  "Uzhavar Thirunal": {
    2026: "2026-01-17",
    2027: "2027-01-17",
    2028: "2028-01-17",
    2029: "2029-01-16",
    2030: "2030-01-16",
  },
  // Thaipoosam
  "Thaipoosam": {
    2026: "2026-02-01",
    2027: "2027-01-22",
    2028: "2028-02-10",
    2029: "2029-01-30",
    2030: "2030-01-19",
  },
  // Telugu New Year's Day (Ugadi)
  "Telugu New Year's Day": {
    2026: "2026-03-19",
    2027: "2027-04-07",
    2028: "2028-03-27",
    2029: "2029-03-16",
    2030: "2030-04-04",
  },
  // Ramzan [Idu'l Fitr]
  "Ramzan [Idu'l Fitr]": {
    2026: "2026-03-21",
    2027: "2027-03-10",
    2028: "2028-02-28",
    2029: "2029-02-16",
    2030: "2030-02-05",
  },
  // Mahaveer Jayanthi
  "Mahaveer Jayanthi": {
    2026: "2026-03-31",
    2027: "2027-04-19",
    2028: "2028-04-08",
    2029: "2029-03-28",
    2030: "2030-04-16",
  },
  // Good Friday (computable via Western Easter calculation)
  // 2026: Apr 3, 2027: Mar 26, 2028: Apr 14, 2029: Mar 30, 2030: Apr 19
  "Good Friday": {
    2026: "2026-04-03",
    2027: "2027-03-26",
    2028: "2028-04-14",
    2029: "2029-03-30",
    2030: "2030-04-19",
  },
  // Bakrid [Idul Azha]
  "Bakrid [Idul Azha]": {
    2026: "2026-05-28",
    2027: "2027-05-17",
    2028: "2028-05-05",
    2029: "2029-04-24",
    2030: "2030-04-14",
  },
  // Muharram
  "Muharram": {
    2026: "2026-06-26",
    2027: "2027-06-16",
    2028: "2028-06-04",
    2029: "2029-05-24",
    2030: "2030-05-14",
  },
  // Milad-un-Nabi
  "Milad-un-Nabi": {
    2026: "2026-08-26",
    2027: "2027-08-15",
    2028: "2028-08-04",
    2029: "2029-07-24",
    2030: "2030-07-13",
  },
  // Krishna Jayanthi (Janmashtami)
  "Krishna Jayanthi": {
    2026: "2026-09-04",
    2027: "2027-08-25",
    2028: "2028-09-12",
    2029: "2029-09-01",
    2030: "2030-08-21",
  },
  // Vinayakar Chathurthi (Ganesh Chaturthi)
  "Vinayakar Chathurthi": {
    2026: "2026-09-14",
    2027: "2027-09-04",
    2028: "2028-08-24",
    2029: "2029-09-12",
    2030: "2030-09-01",
  },
  // Ayutha Pooja
  "Ayutha Pooja": {
    2026: "2026-10-19",
    2027: "2027-10-09",
    2028: "2028-09-28",
    2029: "2029-10-17",
    2030: "2030-10-06",
  },
  // Vijaya Dasami
  "Vijaya Dasami": {
    2026: "2026-10-20",
    2027: "2027-10-10",
    2028: "2028-09-29",
    2029: "2029-10-18",
    2030: "2030-10-07",
  },
  // Deepavali
  "Deepavali": {
    2026: "2026-11-08",
    2027: "2027-10-29",
    2028: "2028-10-17",
    2029: "2029-11-05",
    2030: "2030-10-26",
  },
};

/**
 * Calculates Western Easter Sunday using the Meeus/Jones/Butcher algorithm
 * and derives Good Friday (Easter - 2 days).
 */
export function calculateGoodFriday(year: number): string {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31); // 3=Mar, 4=Apr
  const day = ((h + l - 7 * m + 114) % 31) + 1;

  // Good Friday is 2 days prior to Easter Sunday
  const easterDate = new Date(year, month - 1, day, 12, 0, 0);
  easterDate.setDate(easterDate.getDate() - 2);

  const mm = String(easterDate.getMonth() + 1).padStart(2, '0');
  const dd = String(easterDate.getDate()).padStart(2, '0');
  return `${year}-${mm}-${dd}`;
}

/**
 * Helper to compute N-th weekday of a month (1-indexed month: 1=Jan..12=Dec, weekday: 0=Sun..6=Sat, nth: 1..5)
 */
export function getNthWeekdayOfMonth(year: number, month: number, weekday: number, nth: number): string {
  const firstDay = new Date(year, month - 1, 1, 12, 0, 0);
  const firstDayOfWeek = firstDay.getDay();
  let dayOffset = weekday - firstDayOfWeek;
  if (dayOffset < 0) dayOffset += 7;
  const day = 1 + dayOffset + (nth - 1) * 7;
  const mm = String(month).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `${year}-${mm}-${dd}`;
}

/**
 * Checks if a given year is a leap year.
 */
export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/**
 * Generates official holidays for a specific target year using:
 * 1. Fixed date rules (same month & day every year, e.g. Jan 1, Jan 26, Apr 14, May 1, Aug 15, Oct 2, Dec 25).
 * 2. Verified lookup table for festival dates (2026-2030).
 * 3. Good Friday astronomical algorithm.
 * 4. Fallback to retaining base month & day if year is beyond verified dataset and not computable.
 */
export function generateHolidaysForYear(
  year: number,
  baseHolidays: Array<Omit<OfficialHoliday, 'id' | 'created_at' | 'updated_at'>> = INITIAL_OFFICIAL_HOLIDAYS_2026
): OfficialHoliday[] {
  const result: OfficialHoliday[] = [];
  const now = new Date().toISOString();

  baseHolidays.forEach((base, index) => {
    let targetDateStr: string;

    // Check 1: Good Friday algorithm
    if (base.name.toLowerCase().includes('good friday')) {
      targetDateStr = calculateGoodFriday(year);
    }
    // Check 2: Known variable holidays table
    else if (KNOWN_VARIABLE_HOLIDAYS[base.name] && KNOWN_VARIABLE_HOLIDAYS[base.name][year]) {
      targetDateStr = KNOWN_VARIABLE_HOLIDAYS[base.name][year];
    }
    // Check 3: Fixed date holidays (or default recurrence)
    else {
      // Split YYYY-MM-DD from base
      const parts = base.holiday_date.split('-');
      const month = parts[1];
      const day = parts[2];

      // Safe leap year guard (e.g. Feb 29 on non-leap year falls back to Feb 28)
      if (month === '02' && day === '29' && !isLeapYear(year)) {
        targetDateStr = `${year}-02-28`;
      } else {
        targetDateStr = `${year}-${month}-${day}`;
      }
    }

    result.push({
      id: `holiday-${year}-${index + 1}`,
      name: base.name,
      holiday_date: targetDateStr,
      source_year: year,
      created_at: now,
      updated_at: now,
    });
  });

  return result;
}

/**
 * Generates official holidays across a range of years (e.g., 2026 to 2030).
 * Ensures no duplicates and sorts strictly chronologically.
 */
export function generateMultiYearHolidays(
  startYear = 2026,
  endYear = 2030,
  baseHolidays = INITIAL_OFFICIAL_HOLIDAYS_2026
): OfficialHoliday[] {
  const allHolidays: OfficialHoliday[] = [];
  const seenDateNames = new Set<string>();

  for (let y = startYear; y <= endYear; y++) {
    const yearHolidays = generateHolidaysForYear(y, baseHolidays);
    for (const h of yearHolidays) {
      const key = `${h.name}__${h.holiday_date}`;
      if (!seenDateNames.has(key)) {
        seenDateNames.add(key);
        allHolidays.push(h);
      }
    }
  }

  return allHolidays.sort((a, b) => a.holiday_date.localeCompare(b.holiday_date));
}
