import React, { useState } from 'react';
import { useData } from '@/context/DataContext';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Info,
} from 'lucide-react';
import { formatDateISO } from '@/engine/schedulingEngine';
import { buildMonthCalendarMatrix } from '@/engine/calendarEngine';
import { getNowInKolkata } from '@/engine/reminderEngine';
import { Lesson, OfficialHoliday } from '@/types/database';

export const AcademicCalendarView: React.FC = () => {
  const { getAllLessons, officialHolidays, updateLessonStatus } = useData();

  // Automatically open the current local month & year whenever navigating to Calendar
  const [currentMonth, setCurrentMonth] = useState<Date>(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1, 12, 0, 0);
  });
  const [selectedEventDate, setSelectedEventDate] = useState<string | null>(null);

  const allLessons = getAllLessons();
  const { dateStr: todayKolkata } = getNowInKolkata();

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth(); // 0..11

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(year, month - 1, 1, 12, 0, 0));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(year, month + 1, 1, 12, 0, 0));
  };

  const handleCurrentMonth = () => {
    const now = new Date();
    setCurrentMonth(new Date(now.getFullYear(), now.getMonth(), 1, 12, 0, 0));
  };

  const handleYearChange = (newYear: number) => {
    setCurrentMonth(new Date(newYear, month, 1, 12, 0, 0));
  };

  const handleMonthChange = (newMonth: number) => {
    setCurrentMonth(new Date(year, newMonth, 1, 12, 0, 0));
  };

  // Build calendar matrix using tested calendarEngine
  const calendarDays = buildMonthCalendarMatrix(year, month, todayKolkata);

  // Map events to date
  const holidayMap = new Map<string, OfficialHoliday>();
  officialHolidays.forEach((h) => holidayMap.set(h.holiday_date, h));

  const lessonsByDate = new Map<string, Lesson[]>();
  allLessons.forEach((l) => {
    const list = lessonsByDate.get(l.scheduled_date) || [];
    list.push(l);
    lessonsByDate.set(l.scheduled_date, list);
  });

  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  // Available year list for selector (2024 to 2032)
  const availableYears = [2024, 2025, 2026, 2027, 2028, 2029, 2030, 2031, 2032];

  // Selected date lessons & holiday
  const selectedHoliday = selectedEventDate ? holidayMap.get(selectedEventDate) : null;
  const selectedLessons = selectedEventDate ? lessonsByDate.get(selectedEventDate) || [] : [];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Calendar Header with Navigation */}
      <div className="bg-[var(--main-bg)] rounded-xl border border-[var(--border-color)] p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-semibold text-[var(--primary-text)] tracking-tight">
            {monthNames[month]} {year}
          </h2>

          {/* Quick Month & Year Dropdown Selectors */}
          <div className="flex items-center gap-1.5 ml-2">
            <select
              value={month}
              onChange={(e) => handleMonthChange(Number(e.target.value))}
              aria-label="Select month"
              className="text-xs bg-[var(--subtle-surface)] text-[var(--primary-text)] border border-[var(--border-color)] rounded-lg px-2 py-1 font-medium focus:outline-none"
            >
              {monthNames.map((mName, mIdx) => (
                <option key={mName} value={mIdx}>
                  {mName}
                </option>
              ))}
            </select>

            <select
              value={year}
              onChange={(e) => handleYearChange(Number(e.target.value))}
              aria-label="Select year"
              className="text-xs bg-[var(--subtle-surface)] text-[var(--primary-text)] border border-[var(--border-color)] rounded-lg px-2 py-1 font-medium font-mono focus:outline-none"
            >
              {availableYears.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCurrentMonth}
            className="px-3 py-1.5 text-xs font-medium text-[var(--primary-text)] bg-[var(--subtle-surface)] hover:bg-[var(--hover-bg)] border border-[var(--border-color)] rounded-lg transition-colors"
          >
            Today
          </button>
          <div className="flex items-center border border-[var(--border-color)] rounded-lg overflow-hidden bg-[var(--main-bg)]">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 hover:bg-[var(--hover-bg)] text-[var(--secondary-text)]"
              title="Previous Month"
              aria-label="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNextMonth}
              className="p-1.5 hover:bg-[var(--hover-bg)] text-[var(--secondary-text)] border-l border-[var(--border-color)]"
              title="Next Month"
              aria-label="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-[var(--secondary-text)] bg-[var(--main-bg)] p-3.5 rounded-xl border border-[var(--border-color)]">
        <span className="text-[11px] font-semibold text-[var(--secondary-text)] uppercase tracking-wider">Legend:</span>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
          <span>Official Holiday</span>
        </div>
        <div className="flex items-center gap-1.5 text-[var(--secondary-text)]">
          <span className="w-2.5 h-2.5 rounded-sm bg-[var(--hover-bg)] border border-[var(--border-color)]" />
          <span>Weekend (Sat / Sun)</span>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-[var(--main-bg)] rounded-xl border border-[var(--border-color)] overflow-hidden overflow-x-auto">
        <div className="min-w-[640px]">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 border-b border-[var(--border-color)] bg-[var(--subtle-surface)] text-center py-2.5 text-xs font-medium text-[var(--secondary-text)]">
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div className="opacity-60">Sat</div>
            <div className="opacity-60">Sun</div>
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7 divide-x divide-y divide-[var(--border-color)]">
            {calendarDays.map((day, idx) => {
              const isWeekendDay = idx % 7 === 5 || idx % 7 === 6; // Sat or Sun
              const holiday = holidayMap.get(day.dateStr);
              const dayLessons = lessonsByDate.get(day.dateStr) || [];

              return (
                <div
                  key={day.dateStr}
                  onClick={() => setSelectedEventDate(day.dateStr)}
                  className={`min-h-[105px] p-2 flex flex-col justify-between transition-colors cursor-pointer group ${
                    !day.isCurrentMonth
                      ? 'opacity-30 bg-[var(--subtle-surface)]/40'
                      : isWeekendDay
                      ? 'bg-[var(--subtle-surface)]/60'
                      : 'hover:bg-[var(--hover-bg)]'
                  } ${selectedEventDate === day.dateStr ? 'ring-1 ring-[var(--secondary-text)] inset-0' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs ${
                        holiday
                          ? 'text-rose-600 dark:text-rose-400 font-semibold'
                          : isWeekendDay
                          ? 'text-[var(--secondary-text)] opacity-70'
                          : 'text-[var(--primary-text)] font-medium'
                      }`}
                    >
                      {day.dayNum}
                    </span>
                    {holiday && (
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500" title={holiday.name} />
                    )}
                  </div>

                  {/* Day badges */}
                  <div className="space-y-1 mt-1">
                    {holiday && (
                      <div className="p-1 rounded bg-rose-500/10 border border-rose-500/20 text-[10px] font-medium text-rose-600 dark:text-rose-400 leading-tight truncate">
                        {holiday.name}
                      </div>
                    )}

                    {dayLessons.slice(0, 2).map((l) => (
                      <div
                        key={l.id}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-medium truncate ${
                          l.status === 'completed'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                            : l.status === 'not_completed'
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                            : 'bg-[var(--subtle-surface)] text-[var(--primary-text)] border border-[var(--border-color)]'
                        }`}
                      >
                        {l.period_start} {l.subject_name || 'Class'}
                      </div>
                    ))}

                    {dayLessons.length > 2 && (
                      <span className="text-[10px] text-[var(--secondary-text)] font-medium pl-1">
                        +{dayLessons.length - 2} more
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Selected Day Detail Drawer / Modal */}
      {selectedEventDate && (
        <div className="bg-[var(--main-bg)] rounded-xl border border-[var(--border-color)] p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
            <div>
              <h3 className="text-sm font-semibold text-[var(--primary-text)]">
                Events on {selectedEventDate}
              </h3>
              <p className="text-xs text-[var(--secondary-text)]">
                {selectedHoliday ? `Official Holiday: ${selectedHoliday.name}` : 'Standard Teaching Day'}
              </p>
            </div>
            <button
              onClick={() => setSelectedEventDate(null)}
              className="text-xs text-[var(--secondary-text)] hover:text-[var(--primary-text)] transition-colors"
            >
              Close
            </button>
          </div>

          {selectedHoliday && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg flex items-center gap-2 text-xs text-rose-600 dark:text-rose-400 font-medium">
              <Sparkles className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{selectedHoliday.name} — Teaching sessions are strictly excluded today</span>
            </div>
          )}

          {selectedLessons.length === 0 ? (
            <p className="text-xs text-[var(--secondary-text)] py-3">No teaching sessions scheduled for this date.</p>
          ) : (
            <div className="space-y-2">
              {selectedLessons.map((l) => (
                <div
                  key={l.id}
                  className="p-3 bg-[var(--subtle-surface)] border border-[var(--border-color)] rounded-lg flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-medium text-[var(--primary-text)]">
                        {l.period_start}–{l.period_end}
                      </span>
                      <span className="font-medium text-[var(--primary-text)]">
                        {l.subject_name}
                      </span>
                    </div>
                    <div className="text-[var(--secondary-text)] mt-0.5">
                      {l.topic_title || 'Topic'}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-medium px-2 py-0.5 rounded-md uppercase ${
                        l.status === 'completed'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                          : l.status === 'not_completed'
                          ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                          : 'bg-[var(--hover-bg)] text-[var(--secondary-text)] border border-[var(--border-color)]'
                      }`}
                    >
                      {l.status}
                    </span>

                    {l.status !== 'completed' && (
                      <button
                        onClick={() => updateLessonStatus(l.id, 'completed')}
                        className="px-2 py-1 bg-[var(--btn-primary-bg)] hover:opacity-90 text-[var(--btn-primary-text)] font-medium text-[11px] rounded-lg transition-opacity"
                      >
                        Mark Done
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
