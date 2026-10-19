import { formatDateISO } from './schedulingEngine';

export interface CalendarDayCell {
  dateStr: string;
  dayNum: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  dayOfWeek: number; // 0=Mon, 1=Tue, ..., 6=Sun
}

/**
 * Builds a strictly correct monthly calendar grid starting on Monday (0=Mon, ..., 6=Sun)
 * Properly handles 28, 29, 30, and 31 day months, leap years, and exact weekday offsets.
 */
export function buildMonthCalendarMatrix(year: number, month: number, todayDateStr?: string): CalendarDayCell[] {
  // First day of current month
  const firstDate = new Date(year, month, 1, 12, 0, 0);
  // Total days in current month (day 0 of next month is the last day of this month)
  const daysInMonth = new Date(year, month + 1, 0, 12, 0, 0).getDate();

  // getDay(): 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
  // Convert to Monday-first index: Monday = 0, ..., Sunday = 6
  const rawDay = firstDate.getDay();
  const mondayOffset = rawDay === 0 ? 6 : rawDay - 1;

  const cells: CalendarDayCell[] = [];

  // 1. Previous month trailing days
  const prevMonthLastDate = new Date(year, month, 0, 12, 0, 0).getDate();
  for (let i = mondayOffset - 1; i >= 0; i--) {
    const d = prevMonthLastDate - i;
    const dateObj = new Date(year, month - 1, d, 12, 0, 0);
    const dateStr = formatDateISO(dateObj);
    cells.push({
      dateStr,
      dayNum: d,
      isCurrentMonth: false,
      isToday: Boolean(todayDateStr && dateStr === todayDateStr),
      dayOfWeek: cells.length % 7,
    });
  }

  // 2. Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const dateObj = new Date(year, month, d, 12, 0, 0);
    const dateStr = formatDateISO(dateObj);
    cells.push({
      dateStr,
      dayNum: d,
      isCurrentMonth: true,
      isToday: Boolean(todayDateStr && dateStr === todayDateStr),
      dayOfWeek: cells.length % 7,
    });
  }

  // 3. Next month leading days to complete full 7-day rows
  const remainder = cells.length % 7;
  if (remainder !== 0) {
    const extraNeeded = 7 - remainder;
    for (let d = 1; d <= extraNeeded; d++) {
      const dateObj = new Date(year, month + 1, d, 12, 0, 0);
      const dateStr = formatDateISO(dateObj);
      cells.push({
        dateStr,
        dayNum: d,
        isCurrentMonth: false,
        isToday: Boolean(todayDateStr && dateStr === todayDateStr),
        dayOfWeek: cells.length % 7,
      });
    }
  }

  return cells;
}
