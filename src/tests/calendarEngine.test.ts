import { describe, it, expect } from 'vitest';
import { buildMonthCalendarMatrix } from '../engine/calendarEngine';

describe('calendarEngine Unit Tests', () => {
  it('correctly calculates January 2026 starting on Thursday', () => {
    // Jan 1 2026 is Thursday. Monday offset is 3 (Mon=0, Tue=1, Wed=2, Thu=3)
    const cells = buildMonthCalendarMatrix(2026, 0); // 0=Jan
    const jan1 = cells.find((c) => c.dateStr === '2026-01-01');
    expect(jan1).toBeDefined();
    expect(jan1?.dayOfWeek).toBe(3); // Thursday column
    expect(jan1?.isCurrentMonth).toBe(true);

    // Total days in Jan 2026 should be 31
    const janDays = cells.filter((c) => c.isCurrentMonth);
    expect(janDays.length).toBe(31);
    expect(cells.length % 7).toBe(0); // Perfect grid rows
  });

  it('correctly handles February in leap year (2024 = 29 days) vs non-leap (2026 = 28 days)', () => {
    const leapFeb = buildMonthCalendarMatrix(2024, 1);
    const nonLeapFeb = buildMonthCalendarMatrix(2026, 1);

    const leapDays = leapFeb.filter((c) => c.isCurrentMonth);
    const nonLeapDays = nonLeapFeb.filter((c) => c.isCurrentMonth);

    expect(leapDays.length).toBe(29);
    expect(nonLeapDays.length).toBe(28);
  });

  it('correctly aligns all weekdays sequentially without gaps', () => {
    const cells = buildMonthCalendarMatrix(2026, 9); // Oct 2026
    expect(cells.length % 7).toBe(0);
    for (let i = 0; i < cells.length; i++) {
      expect(cells[i].dayOfWeek).toBe(i % 7);
    }
  });
});
