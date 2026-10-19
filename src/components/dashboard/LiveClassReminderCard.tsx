import React, { useState, useEffect } from 'react';
import { useData } from '@/context/DataContext';
import {
  calculateClassReminder,
  ReminderState,
  EnrichedSlot,
} from '@/engine/reminderEngine';
import {
  Clock,
  MapPin,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  CalendarOff,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

interface LiveClassReminderCardProps {
  onNavigateTab: (tab: 'timetable' | 'subjects' | 'calendar' | 'settings') => void;
  onOpenNewSubjectModal: () => void;
}

export const LiveClassReminderCard: React.FC<LiveClassReminderCardProps> = ({
  onNavigateTab,
  onOpenNewSubjectModal,
}) => {
  const { getAllTeacherTimetable, subjects, officialHolidays } = useData();

  const [reminder, setReminder] = useState<ReminderState>(() =>
    calculateClassReminder({
      slots: getAllTeacherTimetable(),
      subjects,
      officialHolidays,
    })
  );

  // Reactive clean timer: updates every 15 seconds so as time passes the card updates live
  useEffect(() => {
    const updateReminder = () => {
      const slots = getAllTeacherTimetable();
      const current = calculateClassReminder({
        slots,
        subjects,
        officialHolidays,
      });
      setReminder(current);
    };

    updateReminder();
    const interval = setInterval(updateReminder, 15000); // 15s refresh
    return () => clearInterval(interval);
  }, [getAllTeacherTimetable, subjects, officialHolidays]);

  // Render variant based on reminder.type
  switch (reminder.type) {
    case 'in_progress':
      return (
        <div className="bg-[var(--subtle-surface)] border border-[var(--border-color)] rounded-xl p-5 transition-all">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-lg bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    In Progress
                  </span>
                  <span className="text-xs font-mono font-medium text-[var(--secondary-text)]">
                    {reminder.details?.timeRange}
                  </span>
                </div>
                <h3 className="text-base font-semibold text-[var(--primary-text)]">
                  {reminder.details?.subjectName}
                </h3>
                <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--secondary-text)]">
                  <span>{reminder.details?.classProgramme} — Section {reminder.details?.section}</span>
                  {reminder.details?.classroom && (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 opacity-60" />
                      {reminder.details.classroom}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={() => onNavigateTab('timetable')}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-medium text-[var(--btn-primary-text)] bg-[var(--btn-primary-bg)] hover:opacity-90 rounded-lg transition-opacity shrink-0"
            >
              Open Timetable
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      );

    case 'break':
    case 'lunch':
      return (
        <div className="bg-[var(--subtle-surface)] border border-[var(--border-color)] rounded-xl p-5 transition-all">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-lg bg-[var(--hover-bg)] text-[var(--primary-text)] border border-[var(--border-color)] flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5 text-[var(--secondary-text)]" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium bg-[var(--hover-bg)] text-[var(--secondary-text)] border border-[var(--border-color)]">
                    {reminder.type === 'break' ? 'Morning Break' : 'Lunch Break'}
                  </span>
                </div>
                <h3 className="text-base font-semibold text-[var(--primary-text)]">
                  {reminder.title}
                </h3>
                <p className="text-xs text-[var(--secondary-text)]">
                  {reminder.subtitle}
                </p>
                {reminder.details && (
                  <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--secondary-text)] pt-0.5">
                    <span className="font-medium text-[var(--primary-text)]">
                      {reminder.details.subjectName}
                    </span>
                    <span>•</span>
                    <span>{reminder.details.classProgramme} — Sec {reminder.details.section}</span>
                    {reminder.details.classroom && (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="w-3 h-3 opacity-60" />
                        {reminder.details.classroom}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={() => onNavigateTab('timetable')}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-medium text-[var(--primary-text)] bg-[var(--main-bg)] hover:bg-[var(--hover-bg)] border border-[var(--border-color)] rounded-lg transition-colors shrink-0"
            >
              View Timetable
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      );

    case 'free_period':
      return (
        <div className="bg-[var(--subtle-surface)] border border-[var(--border-color)] rounded-xl p-5 transition-all">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-lg bg-[var(--hover-bg)] text-[var(--secondary-text)] border border-[var(--border-color)] flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium bg-[var(--hover-bg)] text-[var(--secondary-text)] border border-[var(--border-color)]">
                    Currently Free
                  </span>
                </div>
                <h3 className="text-base font-semibold text-[var(--primary-text)]">
                  {reminder.title}
                </h3>
                <p className="text-xs text-[var(--secondary-text)]">
                  {reminder.subtitle}
                </p>
                {reminder.details && (
                  <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--secondary-text)] pt-0.5">
                    <span className="font-medium text-[var(--primary-text)]">
                      {reminder.details.subjectName}
                    </span>
                    <span>•</span>
                    <span>{reminder.details.classProgramme} — Sec {reminder.details.section}</span>
                    {reminder.details.classroom && (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="w-3 h-3 opacity-60" />
                        {reminder.details.classroom}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={() => onNavigateTab('timetable')}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-medium text-[var(--primary-text)] bg-[var(--main-bg)] hover:bg-[var(--hover-bg)] border border-[var(--border-color)] rounded-lg transition-colors shrink-0"
            >
              View Daily Schedule
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      );

    case 'upcoming':
      return (
        <div className="bg-[var(--subtle-surface)] border border-[var(--border-color)] rounded-xl p-5 transition-all">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-lg bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[var(--hover-bg)] text-[var(--primary-text)] border border-[var(--border-color)]">
                    {reminder.title}
                  </span>
                  <span className="text-xs font-mono font-medium text-[var(--secondary-text)]">
                    {reminder.details?.timeRange}
                  </span>
                </div>
                <h3 className="text-base font-semibold text-[var(--primary-text)]">
                  {reminder.details?.subjectName}
                </h3>
                <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--secondary-text)]">
                  <span>{reminder.details?.classProgramme} — Section {reminder.details?.section}</span>
                  {reminder.details?.classroom && (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 opacity-60" />
                      {reminder.details.classroom}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={() => onNavigateTab('timetable')}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-medium text-[var(--btn-primary-text)] bg-[var(--btn-primary-bg)] hover:opacity-90 rounded-lg transition-opacity shrink-0"
            >
              View Schedule
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      );

    case 'conflict':
      return (
        <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-5">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="space-y-2 flex-1">
              <div>
                <h3 className="text-sm font-semibold text-[var(--primary-text)]">
                  {reminder.title}
                </h3>
                <p className="text-xs text-[var(--secondary-text)]">
                  {reminder.subtitle}
                </p>
              </div>
              {reminder.conflictSlots && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {reminder.conflictSlots.map((cs, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-lg bg-[var(--main-bg)] border border-[var(--border-color)] text-xs"
                    >
                      <div className="font-medium text-[var(--primary-text)]">
                        {cs.subjectName}
                      </div>
                      <div className="text-[var(--secondary-text)] text-[11px]">
                        {cs.classProgramme} — Sec {cs.section}
                      </div>
                      <div className="text-amber-600 dark:text-amber-400 font-mono text-[11px] font-semibold mt-0.5">
                        {cs.timeRange}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={() => onNavigateTab('timetable')}
              className="px-3 py-1.5 text-xs font-medium text-[var(--btn-primary-text)] bg-[var(--btn-primary-bg)] hover:opacity-90 rounded-lg transition-opacity shrink-0"
            >
              Resolve Timetable
            </button>
          </div>
        </div>
      );

    case 'holiday':
      return (
        <div className="bg-[var(--subtle-surface)] border border-[var(--border-color)] rounded-xl p-5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-lg bg-[var(--hover-bg)] text-[var(--secondary-text)] border border-[var(--border-color)] flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[var(--primary-text)]">
                  {reminder.title}
                </h3>
                <p className="text-xs text-[var(--secondary-text)] mt-0.5">
                  {reminder.subtitle}
                </p>
              </div>
            </div>
            <button
              onClick={() => onNavigateTab('calendar')}
              className="text-xs font-medium text-[var(--secondary-text)] hover:text-[var(--primary-text)] transition-colors shrink-0"
            >
              Academic Calendar →
            </button>
          </div>
        </div>
      );

    case 'weekend':
      return (
        <div className="bg-[var(--subtle-surface)] border border-[var(--border-color)] rounded-xl p-4.5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[var(--hover-bg)] text-[var(--secondary-text)] border border-[var(--border-color)] flex items-center justify-center shrink-0">
                <CalendarOff className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-[var(--primary-text)]">
                  {reminder.title}
                </h4>
                <p className="text-[11px] text-[var(--secondary-text)] mt-0.5">
                  {reminder.subtitle}
                </p>
              </div>
            </div>
            <button
              onClick={() => onNavigateTab('timetable')}
              className="text-xs font-medium text-[var(--secondary-text)] hover:text-[var(--primary-text)] transition-colors shrink-0"
            >
              View Week Ahead →
            </button>
          </div>
        </div>
      );

    case 'done_for_today':
      return (
        <div className="bg-[var(--subtle-surface)] border border-[var(--border-color)] rounded-xl p-4.5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[var(--hover-bg)] text-emerald-600 dark:text-emerald-400 border border-[var(--border-color)] flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-[var(--primary-text)]">
                  {reminder.title}
                </h4>
                <p className="text-[11px] text-[var(--secondary-text)] mt-0.5">
                  {reminder.subtitle}
                </p>
              </div>
            </div>
            <button
              onClick={() => onNavigateTab('timetable')}
              className="text-xs font-medium text-[var(--secondary-text)] hover:text-[var(--primary-text)] transition-colors shrink-0"
            >
              View Tomorrow's Schedule →
            </button>
          </div>
        </div>
      );

    case 'no_timetable':
    default:
      return null;
  }
};
