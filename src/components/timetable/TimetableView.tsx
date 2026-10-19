import React, { useState, useEffect } from 'react';
import { useData } from '@/context/DataContext';
import { Subject, TimetableSlot } from '@/types/database';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  BookOpen,
  Check,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  Filter,
  Settings2,
  Coffee,
  Utensils,
} from 'lucide-react';
import { formatDateISO } from '@/engine/schedulingEngine';
import { getNowInKolkata, timeStringToMinutes, formatTime12h } from '@/engine/reminderEngine';
import {
  FIXED_PERIODS,
  TIMETABLE_TIMELINE,
  getPeriodConfig,
} from '@/config/timetableConfig';
import { TimetableSetupEditor } from './TimetableSetupEditor';

interface TimetableViewProps {
  onSelectSubject: (subject: Subject) => void;
  onOpenNewSubjectModal: () => void;
}

const WEEKDAYS = [
  { id: 1, name: 'Monday', short: 'Mon' },
  { id: 2, name: 'Tuesday', short: 'Tue' },
  { id: 3, name: 'Wednesday', short: 'Wed' },
  { id: 4, name: 'Thursday', short: 'Thu' },
  { id: 5, name: 'Friday', short: 'Fri' },
];

export const TimetableView: React.FC<TimetableViewProps> = ({
  onSelectSubject,
  onOpenNewSubjectModal,
}) => {
  const { getAllTeacherTimetable, subjects, getUnitsWithTopics, toggleTopicCompleted, officialHolidays } = useData();

  const [viewMode, setViewMode] = useState<'daily' | 'weekly' | 'setup'>('daily');
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  const [filterClass, setFilterClass] = useState<string>('all');
  const [currentTimeMinutes, setCurrentTimeMinutes] = useState<number>(() => getNowInKolkata().currentMinutes);

  // Live timer for current period / upcoming countdown in Asia/Kolkata
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTimeMinutes(getNowInKolkata().currentMinutes);
    }, 15000); // Check every 15s
    return () => clearInterval(timer);
  }, []);

  const allSlots = getAllTeacherTimetable();
  const selectedDateStr = formatDateISO(selectedDate);
  const selectedDayOfWeek = selectedDate.getDay(); // 0=Sun, 1=Mon..5=Fri, 6=Sat
  const isWeekend = selectedDayOfWeek === 0 || selectedDayOfWeek === 6;
  const currentHoliday = officialHolidays.find((h) => h.holiday_date === selectedDateStr);

  // Distinct classes for filter dropdown
  const classOptions = Array.from(
    new Set(subjects.map((s) => `${s.class_programme} - ${s.section}`))
  );

  const filteredSlots = allSlots.filter((slot) => {
    if (filterClass !== 'all') {
      const matchKey = `${slot.class_programme} - ${slot.section}`;
      return matchKey === filterClass;
    }
    return true;
  });

  // Daily slots for selected day (1..5)
  const dayPeriodsMap = new Map<number, TimetableSlot>();
  if (!isWeekend && !currentHoliday) {
    filteredSlots
      .filter((s) => s.weekday === selectedDayOfWeek && s.period_number)
      .forEach((s) => {
        if (s.period_number) {
          dayPeriodsMap.set(s.period_number, s);
        }
      });
  }

  // Date Navigation Handlers
  const handlePrevDay = () => {
    const prev = new Date(selectedDate);
    prev.setDate(prev.getDate() - 1);
    setSelectedDate(prev);
  };

  const handleNextDay = () => {
    const next = new Date(selectedDate);
    next.setDate(next.getDate() + 1);
    setSelectedDate(next);
  };

  const handleToday = () => {
    setSelectedDate(new Date());
  };

  const handlePrevWeek = () => {
    const prev = new Date(selectedDate);
    prev.setDate(prev.getDate() - 7);
    setSelectedDate(prev);
  };

  const handleNextWeek = () => {
    const next = new Date(selectedDate);
    next.setDate(next.getDate() + 7);
    setSelectedDate(next);
  };

  // Human-readable date label
  const dateFormattedDisplay = selectedDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Banner with Navigation & Mode Toggles */}
      <div className="bg-[var(--main-bg)] rounded-xl border border-[var(--border-color)] p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-[var(--primary-text)]">
            Master Timetable
          </h2>
        </div>

        {/* View toggles & Class Filter */}
        <div className="flex flex-wrap items-center gap-3">
          {viewMode !== 'setup' && classOptions.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-[var(--secondary-text)]">
              <Filter className="w-3.5 h-3.5" />
              <select
                value={filterClass}
                onChange={(e) => setFilterClass(e.target.value)}
                className="px-2.5 py-1.5 text-xs rounded-lg border border-[var(--border-color)] bg-[var(--input-bg)] text-[var(--primary-text)] focus:outline-none focus:border-[var(--secondary-text)]"
              >
                <option value="all">All Classes & Sections</option>
                {classOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex items-center bg-[var(--subtle-surface)] p-1 rounded-lg border border-[var(--border-color)]">
            <button
              onClick={() => setViewMode('daily')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                viewMode === 'daily'
                  ? 'bg-[var(--main-bg)] text-[var(--primary-text)] border border-[var(--border-color)]'
                  : 'text-[var(--secondary-text)] hover:text-[var(--primary-text)]'
              }`}
            >
              Daily View
            </button>
            <button
              onClick={() => setViewMode('weekly')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                viewMode === 'weekly'
                  ? 'bg-[var(--main-bg)] text-[var(--primary-text)] border border-[var(--border-color)]'
                  : 'text-[var(--secondary-text)] hover:text-[var(--primary-text)]'
              }`}
            >
              Weekly Overview
            </button>
            <button
              onClick={() => setViewMode('setup')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1 ${
                viewMode === 'setup'
                  ? 'bg-[var(--main-bg)] text-[var(--primary-text)] border border-[var(--border-color)]'
                  : 'text-[var(--secondary-text)] hover:text-[var(--primary-text)]'
              }`}
            >
              <Settings2 className="w-3.5 h-3.5" />
              Configure Timetable
            </button>
          </div>
        </div>
      </div>

      {/* SETUP / TIMETABLE EDITOR VIEW */}
      {viewMode === 'setup' && (
        <TimetableSetupEditor />
      )}

      {/* DAILY TIMETABLE VIEW */}
      {viewMode === 'daily' && (
        <div className="space-y-4">
          {/* Daily Navigation Bar */}
          <div className="bg-[var(--main-bg)] rounded-xl border border-[var(--border-color)] p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={handleToday}
                className="px-3 py-1.5 text-xs font-medium text-[var(--primary-text)] bg-[var(--subtle-surface)] hover:bg-[var(--hover-bg)] border border-[var(--border-color)] rounded-lg transition-colors"
              >
                Today
              </button>
              <div className="flex items-center border border-[var(--border-color)] rounded-lg overflow-hidden bg-[var(--main-bg)]">
                <button
                  onClick={handlePrevDay}
                  className="p-1.5 hover:bg-[var(--hover-bg)] text-[var(--secondary-text)]"
                  title="Previous Day"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={handleNextDay}
                  className="p-1.5 hover:bg-[var(--hover-bg)] text-[var(--secondary-text)] border-l border-[var(--border-color)]"
                  title="Next Day"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <div className="text-sm font-semibold text-[var(--primary-text)] pl-2">
                {dateFormattedDisplay}
              </div>
            </div>

            {/* Optional Date Picker & Quick Configure */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <label htmlFor="daily-datepicker" className="text-xs text-[var(--secondary-text)]">
                  Jump to date:
                </label>
                <input
                  id="daily-datepicker"
                  type="date"
                  value={selectedDateStr}
                  onChange={(e) => {
                    if (e.target.value) {
                      const [y, m, d] = e.target.value.split('-').map(Number);
                      setSelectedDate(new Date(y, m - 1, d, 12, 0, 0));
                    }
                  }}
                  className="px-2.5 py-1 text-xs rounded-lg border border-[var(--border-color)] bg-[var(--input-bg)] text-[var(--primary-text)] focus:outline-none"
                />
              </div>

              <button
                onClick={() => setViewMode('setup')}
                className="text-xs text-[var(--secondary-text)] hover:text-[var(--primary-text)] font-medium flex items-center gap-1 transition-colors"
              >
                <Settings2 className="w-3.5 h-3.5" />
                Edit Schedule
              </button>
            </div>
          </div>

          {/* Day State Banner: Weekend, Holiday, or 8 Periods Timeline */}
          {isWeekend ? (
            <div className="p-8 text-center bg-[var(--main-bg)] rounded-xl border border-[var(--border-color)] space-y-2">
              <h4 className="text-sm font-medium text-[var(--primary-text)]">
                Weekend — No Teaching Scheduled
              </h4>
              <p className="text-xs text-[var(--secondary-text)]">
                Regular college timetable operates Monday through Friday. Your classes resume on Monday.
              </p>
            </div>
          ) : currentHoliday ? (
            <div className="p-8 text-center bg-rose-500/5 rounded-xl border border-rose-500/20 space-y-2">
              <Sparkles className="w-8 h-8 text-rose-500 mx-auto" />
              <h4 className="text-sm font-semibold text-rose-600 dark:text-rose-400">
                Official Holiday: {currentHoliday.name}
              </h4>
              <p className="text-xs text-[var(--secondary-text)]">
                All teaching periods are officially excused today as per the 2026 academic calendar.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {TIMETABLE_TIMELINE.map((item, index) => {
                if (!item.isTeaching) {
                  // Non-teaching Separator (Break or Lunch)
                  const isMorningBreak = item.type === 'break';
                  return (
                    <div
                      key={`daily-sep-${index}`}
                      className="py-2.5 px-4 rounded-lg border border-dashed border-[var(--border-color)] bg-[var(--subtle-surface)] flex items-center justify-between text-xs text-[var(--secondary-text)]"
                    >
                      <div className="flex items-center gap-2 font-medium">
                        {isMorningBreak ? (
                          <Coffee className="w-3.5 h-3.5 text-[var(--secondary-text)] shrink-0" />
                        ) : (
                          <Utensils className="w-3.5 h-3.5 text-[var(--secondary-text)] shrink-0" />
                        )}
                        <span className="font-semibold text-[var(--primary-text)]">{item.label}</span>
                      </div>
                      <span className="font-mono text-[var(--secondary-text)] text-xs">
                        {item.displayTime}
                      </span>
                    </div>
                  );
                }

                // Teaching Period (1 to 8)
                const pConfig = item;
                const slot = dayPeriodsMap.get(pConfig.periodNumber);
                const hasAssignedClass = !!slot && !!slot.subject_id;
                const sub = hasAssignedClass ? subjects.find((s) => s.id === slot.subject_id) : undefined;

                const units = sub ? getUnitsWithTopics(sub.id) : [];
                const allTopics = units.flatMap((u) => u.topics || []);
                const pendingTopic = allTopics.find((t) => !t.is_completed);

                // Check live timing
                const startM = timeStringToMinutes(pConfig.startTime);
                const endM = timeStringToMinutes(pConfig.endTime);
                const isToday = formatDateISO(new Date()) === selectedDateStr;
                const isInProgress = isToday && currentTimeMinutes >= startM && currentTimeMinutes < endM;
                const isUpcoming = isToday && startM > currentTimeMinutes && startM - currentTimeMinutes <= 60;
                const startsInMinutes = startM - currentTimeMinutes;

                if (!hasAssignedClass) {
                  // Free period
                  return (
                    <div
                      key={`daily-free-${pConfig.periodNumber}`}
                      className={`p-4 rounded-xl border transition-all flex items-center justify-between ${
                        isInProgress
                          ? 'bg-[var(--subtle-surface)] border-[var(--border-color)] ring-1 ring-[var(--secondary-text)]'
                          : 'bg-[var(--main-bg)] border-[var(--border-color)]'
                      }`}
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="w-9 h-9 rounded-lg bg-[var(--hover-bg)] text-[var(--secondary-text)] border border-[var(--border-color)] flex flex-col items-center justify-center text-xs shrink-0">
                          <span className="text-[9px] uppercase leading-tight">P</span>
                          <span className="text-xs leading-none font-medium">{pConfig.periodNumber}</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-[var(--primary-text)]">
                              {pConfig.label}
                            </span>
                            <span className="font-mono text-xs text-[var(--secondary-text)]">
                              {pConfig.displayTime}
                            </span>
                            {isInProgress && (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-[var(--hover-bg)] text-[var(--secondary-text)] border border-[var(--border-color)]">
                                Currently Free
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-[var(--secondary-text)] italic">
                            No class scheduled (Free Period)
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => setViewMode('setup')}
                        className="text-xs text-[var(--secondary-text)] hover:text-[var(--primary-text)] font-medium transition-colors"
                      >
                        + Assign Class
                      </button>
                    </div>
                  );
                }

                // Assigned Class Card
                return (
                  <div
                    key={`daily-period-${pConfig.periodNumber}`}
                    className={`bg-[var(--main-bg)] rounded-xl border p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all ${
                      isInProgress
                        ? 'border-emerald-500/40 ring-1 ring-emerald-500/20 bg-emerald-500/5'
                        : isUpcoming
                        ? 'border-[var(--secondary-text)]'
                        : 'border-[var(--border-color)]'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      {/* Period & Time Badge */}
                      <div className={`px-3 py-2 rounded-lg font-mono text-xs text-center shrink-0 border ${
                        isInProgress
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                          : 'bg-[var(--subtle-surface)] text-[var(--primary-text)] border-[var(--border-color)]'
                      }`}>
                        <div className="text-[9px] uppercase font-semibold text-[var(--secondary-text)]">P{pConfig.periodNumber}</div>
                        <div className="font-medium">{formatTime12h(pConfig.startTime)}</div>
                      </div>

                      {/* Subject Details */}
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          {isInProgress && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 uppercase tracking-wide">
                              In Progress
                            </span>
                          )}
                          {isUpcoming && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-[var(--hover-bg)] text-[var(--secondary-text)] border border-[var(--border-color)]">
                              Starts in {startsInMinutes} min
                            </span>
                          )}
                          <h3 className="text-base font-semibold text-[var(--primary-text)]">
                            {slot?.subject_name}
                          </h3>
                          <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-[var(--hover-bg)] text-[var(--secondary-text)] border border-[var(--border-color)]">
                            {slot?.class_programme} — Section {slot?.section}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--secondary-text)]">
                          {slot?.classroom ? (
                            <span className="inline-flex items-center gap-1 font-medium text-[var(--secondary-text)]">
                              <MapPin className="w-3.5 h-3.5 opacity-60" />
                              Room {slot.classroom}
                            </span>
                          ) : (
                            <span className="text-[var(--secondary-text)] italic">No room specified</span>
                          )}
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <BookOpen className="w-3.5 h-3.5 opacity-60 shrink-0" />
                            <strong>Planned Topic:</strong> {pendingTopic ? pendingTopic.title : (allTopics.length > 0 ? 'All topics completed' : 'No topics configured')}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Fast Actions */}
                    <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                      {pendingTopic && (
                        <button
                          onClick={() => toggleTopicCompleted(pendingTopic.id, true)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-lg transition-colors"
                        >
                          <Check className="w-3.5 h-3.5" /> Mark Topic Done
                        </button>
                      )}
                      {sub && (
                        <button
                          onClick={() => onSelectSubject(sub)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-[var(--secondary-text)] hover:text-[var(--primary-text)] hover:bg-[var(--hover-bg)] rounded-lg border border-[var(--border-color)] transition-colors"
                        >
                          <span>View Course</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* WEEKLY MASTER TIMETABLE VIEW */}
      {viewMode === 'weekly' && (
        <div className="space-y-4">
          {/* Week Overview Header */}
          <div className="bg-[var(--main-bg)] rounded-xl border border-[var(--border-color)] p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={handleToday}
                className="px-3 py-1.5 text-xs font-medium text-[var(--primary-text)] bg-[var(--subtle-surface)] hover:bg-[var(--hover-bg)] border border-[var(--border-color)] rounded-lg transition-colors"
              >
                Current Week
              </button>
              <div className="flex items-center border border-[var(--border-color)] rounded-lg overflow-hidden bg-[var(--main-bg)]">
                <button
                  onClick={handlePrevWeek}
                  className="p-1.5 hover:bg-[var(--hover-bg)] text-[var(--secondary-text)]"
                  title="Previous Week"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={handleNextWeek}
                  className="p-1.5 hover:bg-[var(--hover-bg)] text-[var(--secondary-text)] border-l border-[var(--border-color)]"
                  title="Next Week"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="text-xs text-[var(--secondary-text)]">
              Monday to Friday · 8 Fixed Periods Daily
            </div>
          </div>

          {/* Weekly Grid (Columns for Mon-Fri) */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {WEEKDAYS.map((w) => {
              const daySlots = filteredSlots.filter((s) => s.weekday === w.id);
              const daySlotMap = new Map<number, TimetableSlot>();
              daySlots.forEach((s) => {
                if (s.period_number) daySlotMap.set(s.period_number, s);
              });

              return (
                <div
                  key={w.id}
                  className="bg-[var(--main-bg)] rounded-xl border border-[var(--border-color)] p-4 space-y-3 flex flex-col"
                >
                  <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-2.5">
                    <div>
                      <h4 className="text-sm font-semibold text-[var(--primary-text)]">
                        {w.name}
                      </h4>
                      <span className="text-[11px] text-[var(--secondary-text)]">
                        {daySlots.filter((s) => s.subject_id).length} classes scheduled
                      </span>
                    </div>
                  </div>

                  {/* 8 Periods & Separators in Order */}
                  <div className="flex-1 space-y-2">
                    {TIMETABLE_TIMELINE.map((item, idx) => {
                      if (!item.isTeaching) {
                        return (
                          <div
                            key={`wk-sep-${idx}`}
                            className="py-1 px-2 rounded-md bg-[var(--subtle-surface)] border border-dashed border-[var(--border-color)] text-[10px] text-[var(--secondary-text)] flex items-center justify-between font-medium"
                          >
                            <span>{item.type === 'break' ? 'Break' : 'Lunch'}</span>
                            <span className="font-mono text-[9px]">{item.displayTime.split('–')[0].trim()}</span>
                          </div>
                        );
                      }

                      const slot = daySlotMap.get(item.periodNumber);
                      const isFree = !slot || !slot.subject_id;
                      const sub = !isFree ? subjects.find((s) => s.id === slot.subject_id) : undefined;

                      if (isFree) {
                        return (
                          <div
                            key={`wk-p-${item.periodNumber}`}
                            className="py-1.5 px-2.5 rounded-md border border-[var(--border-color)] bg-[var(--subtle-surface)] text-[11px] text-[var(--secondary-text)] flex items-center justify-between opacity-60"
                          >
                            <span className="font-mono text-[10px] font-medium text-[var(--secondary-text)]">
                              P{item.periodNumber}
                            </span>
                            <span className="italic text-[10px]">Free</span>
                          </div>
                        );
                      }

                      return (
                        <div
                          key={`wk-p-${item.periodNumber}`}
                          onClick={() => sub && onSelectSubject(sub)}
                          className="p-2.5 rounded-lg bg-[var(--subtle-surface)] border border-[var(--border-color)] hover:border-[var(--secondary-text)] cursor-pointer transition-all space-y-1 group"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-[10px] font-semibold text-[var(--primary-text)]">
                              P{item.periodNumber} · {item.startTime}
                            </span>
                            {slot.classroom && (
                              <span className="text-[9px] font-medium text-[var(--secondary-text)] bg-[var(--hover-bg)] px-1 rounded border border-[var(--border-color)]">
                                {slot.classroom}
                              </span>
                            )}
                          </div>

                          <div>
                            <div className="text-xs font-semibold text-[var(--primary-text)] group-hover:opacity-80 transition-opacity truncate">
                              {slot.subject_name}
                            </div>
                            <div className="text-[10px] text-[var(--secondary-text)] truncate">
                              {slot.class_programme} - {slot.section}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
