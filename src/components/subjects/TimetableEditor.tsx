import React, { useState } from 'react';
import { useData } from '@/context/DataContext';
import {
  FIXED_PERIODS,
  TIMETABLE_TIMELINE,
} from '@/config/timetableConfig';
import {
  Clock,
  CheckCircle2,
  Coffee,
  Utensils,
  BookOpen,
} from 'lucide-react';

interface TimetableEditorProps {
  subjectId: string;
}

const WEEKDAYS = [
  { id: 1, name: 'Monday', short: 'Mon' },
  { id: 2, name: 'Tuesday', short: 'Tue' },
  { id: 3, name: 'Wednesday', short: 'Wed' },
  { id: 4, name: 'Thursday', short: 'Thu' },
  { id: 5, name: 'Friday', short: 'Fri' },
];

export const TimetableEditor: React.FC<TimetableEditorProps> = ({ subjectId }) => {
  const { getAllTeacherTimetable, subjects, savePeriodAssignment } = useData();
  const [selectedWeekday, setSelectedWeekday] = useState<number>(1);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  const currentSubject = subjects.find((s) => s.id === subjectId);
  const allSlots = getAllTeacherTimetable();

  // Find all slots for the selected weekday
  const currentDaySlots = allSlots.filter((s) => s.weekday === selectedWeekday);
  const periodSubjectMap = new Map<number, string | null>();
  currentDaySlots.forEach((s) => {
    if (s.period_number) {
      periodSubjectMap.set(s.period_number, s.subject_id);
    }
  });

  const handleTogglePeriod = (periodNumber: number) => {
    const assigned = periodSubjectMap.get(periodNumber);
    const newSubjectId = assigned === subjectId ? null : subjectId;
    savePeriodAssignment(selectedWeekday, periodNumber, newSubjectId);

    const dayName = WEEKDAYS.find((w) => w.id === selectedWeekday)?.name;
    setSaveStatus(
      newSubjectId
        ? `Assigned Period ${periodNumber} on ${dayName}`
        : `Removed Period ${periodNumber} on ${dayName}`
    );
    setTimeout(() => setSaveStatus(null), 2500);
  };

  return (
    <div className="bg-[var(--main-bg)] rounded-xl border border-[var(--border-color)] p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--border-color)] pb-4">
        <div>
          <h3 className="text-base font-semibold text-[var(--primary-text)] flex items-center gap-2">
            <Clock className="w-4 h-4 text-[var(--secondary-text)]" />
            Weekly Timetable Schedule
          </h3>
          <p className="text-xs text-[var(--secondary-text)] mt-0.5">
            Assign fixed periods for <strong className="text-[var(--primary-text)]">{currentSubject?.name}</strong> ({currentSubject?.class_programme} — Sec {currentSubject?.section}).
          </p>
        </div>

        {/* Weekday Switcher */}
        <div className="flex items-center gap-1 bg-[var(--subtle-surface)] p-1 rounded-lg border border-[var(--border-color)]">
          {WEEKDAYS.map((w) => {
            const isSelected = selectedWeekday === w.id;
            const isAssigned = allSlots.some(
              (s) => s.weekday === w.id && s.subject_id === subjectId
            );
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
                {isAssigned && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary-text)]" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {saveStatus && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 font-medium transition-all">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{saveStatus}</span>
        </div>
      )}

      {/* 8 Fixed Periods List */}
      <div className="space-y-3">
        {TIMETABLE_TIMELINE.map((item, index) => {
          if (!item.isTeaching) {
            return (
              <div
                key={`sub-sep-${index}`}
                className="py-2.5 px-4 rounded-lg border border-dashed border-[var(--border-color)] bg-[var(--subtle-surface)] flex items-center justify-between text-xs text-[var(--secondary-text)]"
              >
                <div className="flex items-center gap-2 font-medium">
                  {item.type === 'break' ? (
                    <Coffee className="w-3.5 h-3.5 text-[var(--secondary-text)] shrink-0" />
                  ) : (
                    <Utensils className="w-3.5 h-3.5 text-[var(--secondary-text)] shrink-0" />
                  )}
                  <span className="font-semibold text-[var(--primary-text)]">{item.label}</span>
                </div>
                <span className="font-mono text-xs text-[var(--secondary-text)]">
                  {item.displayTime}
                </span>
              </div>
            );
          }

          const pConfig = item;
          const assignedSubId = periodSubjectMap.get(pConfig.periodNumber);
          const isThisSubject = assignedSubId === subjectId;
          const isOtherSubject = !!assignedSubId && !isThisSubject;
          const otherSubject = isOtherSubject
            ? subjects.find((s) => s.id === assignedSubId)
            : undefined;

          return (
            <div
              key={`sub-p-${pConfig.periodNumber}`}
              className={`p-4 rounded-xl border transition-all flex items-center justify-between gap-4 ${
                isThisSubject
                  ? 'bg-[var(--subtle-surface)] border-[var(--border-color)]'
                  : isOtherSubject
                  ? 'bg-[var(--main-bg)] border-[var(--border-color)] opacity-60'
                  : 'bg-[var(--main-bg)] border-[var(--border-color)]'
              }`}
            >
              <div className="flex items-center gap-3.5">
                <div
                  className={`w-9 h-9 rounded-lg flex flex-col items-center justify-center font-medium text-xs shrink-0 ${
                    isThisSubject
                      ? 'bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)]'
                      : 'bg-[var(--hover-bg)] text-[var(--secondary-text)] border border-[var(--border-color)]'
                  }`}
                >
                  <span className="text-[9px] uppercase font-normal">P</span>
                  <span className="text-xs leading-none">{pConfig.periodNumber}</span>
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-[var(--primary-text)]">
                      {pConfig.label}
                    </span>
                    <span className="font-mono text-xs text-[var(--secondary-text)]">
                      {pConfig.displayTime}
                    </span>
                  </div>

                  <div className="text-[11px] mt-0.5">
                    {isThisSubject ? (
                      <span className="font-medium text-[var(--primary-text)]">
                        Assigned to {currentSubject?.name}
                      </span>
                    ) : isOtherSubject ? (
                      <span className="text-[var(--secondary-text)]">
                        Assigned to {otherSubject?.name} ({otherSubject?.class_programme} - Sec {otherSubject?.section})
                      </span>
                    ) : (
                      <span className="text-[var(--secondary-text)] italic">Free period</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={() => handleTogglePeriod(pConfig.periodNumber)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  isThisSubject
                    ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 hover:bg-rose-500/20'
                    : isOtherSubject
                    ? 'bg-[var(--hover-bg)] text-[var(--primary-text)] border border-[var(--border-color)] hover:opacity-80'
                    : 'bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] hover:opacity-90'
                }`}
              >
                {isThisSubject ? 'Remove Period' : isOtherSubject ? 'Reassign to this course' : 'Assign Period'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
