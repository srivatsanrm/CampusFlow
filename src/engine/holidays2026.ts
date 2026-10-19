import { OfficialHoliday } from '@/types/database';

/**
 * Supplied official holiday dataset for 2026
 * Preserves exact festival names and dates.
 */
export const INITIAL_OFFICIAL_HOLIDAYS_2026: Array<Omit<OfficialHoliday, 'id' | 'created_at' | 'updated_at'>> = [
  { name: "New Year's Day", holiday_date: "2026-01-01", source_year: 2026 },
  { name: "Pongal", holiday_date: "2026-01-15", source_year: 2026 },
  { name: "Thiruvalluvar Day", holiday_date: "2026-01-16", source_year: 2026 },
  { name: "Uzhavar Thirunal", holiday_date: "2026-01-17", source_year: 2026 },
  { name: "Republic Day", holiday_date: "2026-01-26", source_year: 2026 },
  { name: "Thaipoosam", holiday_date: "2026-02-01", source_year: 2026 },
  { name: "Telugu New Year's Day", holiday_date: "2026-03-19", source_year: 2026 },
  { name: "Ramzan [Idu'l Fitr]", holiday_date: "2026-03-21", source_year: 2026 },
  { name: "Mahaveer Jayanthi", holiday_date: "2026-03-31", source_year: 2026 },
  { name: "Good Friday", holiday_date: "2026-04-03", source_year: 2026 },
  { name: "Tamil New Year's Day / Dr. B.R. Ambedkar's Birthday", holiday_date: "2026-04-14", source_year: 2026 },
  { name: "May Day", holiday_date: "2026-05-01", source_year: 2026 },
  { name: "Bakrid [Idul Azha]", holiday_date: "2026-05-28", source_year: 2026 },
  { name: "Muharram", holiday_date: "2026-06-26", source_year: 2026 },
  { name: "Independence Day", holiday_date: "2026-08-15", source_year: 2026 },
  { name: "Milad-un-Nabi", holiday_date: "2026-08-26", source_year: 2026 },
  { name: "Krishna Jayanthi", holiday_date: "2026-09-04", source_year: 2026 },
  { name: "Vinayakar Chathurthi", holiday_date: "2026-09-14", source_year: 2026 },
  { name: "Gandhi Jayanthi", holiday_date: "2026-10-02", source_year: 2026 },
  { name: "Ayutha Pooja", holiday_date: "2026-10-19", source_year: 2026 },
  { name: "Vijaya Dasami", holiday_date: "2026-10-20", source_year: 2026 },
  { name: "Deepavali", holiday_date: "2026-11-08", source_year: 2026 },
  { name: "Christmas", holiday_date: "2026-12-25", source_year: 2026 },
];
