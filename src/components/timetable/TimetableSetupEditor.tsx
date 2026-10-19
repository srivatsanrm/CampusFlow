import React, { useState } from 'react';
import { useData } from '@/context/DataContext';
import { Subject } from '@/types/database';
import {
  FIXED_PERIODS,
  TIMETABLE_TIMELINE,
  TimelineSlotConfig,
} from '@/config/timetableConfig';
import {
  Clock,
  CheckCircle2,
  Coffee,
  Utensils,
  BookOpen,
  MapPin,
  Save,
  Sparkles,
} from 'lucide-react';

const WEEKDAYS = [
  { id: 1, name: 'Monday', short: 'Mon' },
  { id: 2, name: 'Tuesday', short: 'Tue' },
  { id: 3, name: 'Wednesday', short: 'Wed' },
  { id: 4, name: 'Thursday', short: 'Thu' },
  { id: 5, name: 'Friday', short: 'Fri' },
];

export const TimetableSetupEditor: React.FC = () => {
  const { getAllTeacherTimetable, subjects, savePeriodAssignment } = useData();
  const [selectedWeekday, setSelectedWeekday] = useState<number>(1);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  const allSlots = getAllTeacherTimetable();

  // Map of periodNumber (1..8) -> subject_id for the selected weekday
  const currentDaySlots = allSlots.filter((s) => s.weekday === selectedWeekday);
  const periodMap = new Map<number, string | null>();
  currentDaySlots.forEach((s) => {
    if (s.period_number) {
      periodMap.set(s.period_number, s.subject_id);
    }
  });

  const handlePeriodChange = (periodNumber: number, newSubjectId: string) => {
    const val = newSubjectId === 'FREE' || newSubjectId === '' ? null : newSubjectId;
    savePeriodAssignment(selectedWeekday, periodNumber, val);
    const dayName = WEEKDAYS.find((w) => w.id === selectedWeekday)?.name;
    setSaveStatus(`Saved Period ${periodNumber} for ${dayName}`);
    setTimeout(() => setSaveStatus(null), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Weekday Selector Bar */}
      <div className="bg-[var(--main-bg)] rounded-xl border border-[var(--border-color)] p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold text-[var(--primary-text)]">
            Daily Timetable Configuration
          </h3>
        </div>

        {/* Mon-Fri Tabs */}
        <div className="flex items-center gap-1 bg-[var(--subtle-surface)] p-1 rounded-lg border border-[var(--border-color)]">
          {WEEKDAYS.map((w) => {
            const isSelected = selectedWeekday === w.id;
            const dayAssignedCount = allSlots.filter((s) => s.weekday === w.id && s.subject_id).length;
            return (
              <button
                key={w.id}
                onClick={() => setSelectedWeekday(w.id)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-[var(--main-bg)] text-[var(--primary-text)] border border-[var(--border-color)]'
                    : 'text-[var(--secondary-text)] hover:text-[var(--primary-text)]'
                }`}
              >
                <span>{w.name}</span>
                {dayAssignedCount > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-medium ${
                    isSelected
                      ? 'bg-[var(--hover-bg)] text-[var(--primary-text)]'
                      : 'bg-[var(--hover-bg)] text-[var(--secondary-text)]'
                  }`}>
                    {dayAssignedCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Save notification banner */}
      {saveStatus && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 font-medium transition-all">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{saveStatus}</span>
        </div>
      )}

      {/* 8 Periods & Separators in strict chronological order */}
      <div className="space-y-3">
        {TIMETABLE_TIMELINE.map((item, index) => {
          if (!item.isTeaching) {
            // Break or Lunch Separator
            const isMorningBreak = item.type === 'break';
            return (
              <div
                key={`sep-${index}`}
                className="py-2.5 px-4 rounded-lg border border-dashed border-[var(--border-color)] bg-[var(--subtle-surface)] flex items-center justify-between text-xs text-[var(--secondary-text)]"
              >
                <div className="flex items-center gap-2.5">
                  {isMorningBreak ? (
                    <Coffee className="w-3.5 h-3.5 text-[var(--secondary-text)] shrink-0" />
                  ) : (
                    <Utensils className="w-3.5 h-3.5 text-[var(--secondary-text)] shrink-0" />
                  )}
                  <span className="font-medium text-[var(--primary-text)]">{item.label}</span>
                  <span className="text-[11px] text-[var(--secondary-text)]">
                    (Non-teaching separator)
                  </span>
                </div>
                <span className="font-mono text-[var(--secondary-text)] text-xs">
                  {item.displayTime}
                </span>
              </div>
            );
          }

          // Teaching Period (1 to 8)
          const pConfig = item;
          const assignedSubjectId = periodMap.get(pConfig.periodNumber) || '';
          const assignedSubject = subjects.find((s) => s.id === assignedSubjectId);
          const isFree = !assignedSubjectId;

          return (
            <div
              key={`period-${pConfig.periodNumber}`}
              className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--main-bg)] transition-all"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Period info & Fixed Time */}
                <div className="flex items-start md:items-center gap-3.5">
                  <div
                    className={`w-9 h-9 rounded-lg flex flex-col items-center justify-center shrink-0 text-xs ${
                      isFree
                        ? 'bg-[var(--hover-bg)] text-[var(--secondary-text)] border border-[var(--border-color)]'
                        : 'bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] font-medium'
                    }`}
                  >
                    <span className="text-[9px] uppercase leading-tight">P</span>
                    <span className="text-xs font-semibold leading-none">{pConfig.periodNumber}</span>
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold text-[var(--primary-text)]">
                        {pConfig.label}
                      </h4>
                      <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-[var(--hover-bg)] text-[var(--secondary-text)] border border-[var(--border-color)]">
                        {pConfig.displayTime}
                      </span>
                    </div>

                    <div className="mt-1 flex items-center gap-2">
                      {isFree ? (
                        <span className="inline-flex items-center text-[11px] text-[var(--secondary-text)]">
                          Period currently free
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs text-[var(--primary-text)] font-medium">
                          <BookOpen className="w-3.5 h-3.5 text-[var(--secondary-text)]" />
                          {assignedSubject?.class_programme} — Section {assignedSubject?.section}
                          {assignedSubject?.classroom && (
                            <span className="inline-flex items-center gap-0.5 text-[var(--secondary-text)] text-[11px] font-normal">
                              • Room {assignedSubject.classroom}
                            </span>
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Dropdown Selector */}
                <div className="w-full md:w-80">
                  <label className="block text-[10px] font-medium text-[var(--secondary-text)] uppercase tracking-wider mb-1">
                    Teaching Assignment
                  </label>
                  <select
                    value={assignedSubjectId || 'FREE'}
                    onChange={(e) => handlePeriodChange(pConfig.periodNumber, e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--border-color)] bg-[var(--input-bg)] text-[var(--primary-text)] focus:border-[var(--secondary-text)] outline-none transition-colors"
                  >
                    <option value="FREE">Free / None (No class scheduled)</option>
                    {subjects.map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        {sub.name} — {sub.class_programme}, Section {sub.section}
                        {sub.classroom ? ` (${sub.classroom})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
