import React, { useState } from 'react';
import { Lesson, Subject } from '@/types/database';
import { useData } from '@/context/DataContext';
import { X, Calendar, Clock, AlertCircle, ArrowRight } from 'lucide-react';

interface ManualRescheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  lesson: Lesson;
  subject: Subject;
}

export const ManualRescheduleModal: React.FC<ManualRescheduleModalProps> = ({
  isOpen,
  onClose,
  lesson,
  subject,
}) => {
  const { rescheduleLessonManual, getTimetable } = useData();

  const [newDate, setNewDate] = useState(lesson.scheduled_date);
  const [startTime, setStartTime] = useState(lesson.period_start);
  const [endTime, setEndTime] = useState(lesson.period_end);
  const [reason, setReason] = useState('Rescheduled by teacher');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const timetable = getTimetable(subject.id);

  const handleQuickSlotSelect = (slotStartTime: string, slotEndTime: string) => {
    setStartTime(slotStartTime);
    setEndTime(slotEndTime);
  };

  const handleRescheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const res = rescheduleLessonManual(lesson.id, newDate, startTime, endTime, reason);
    if (res.success) {
      onClose();
    } else {
      setError(res.error || 'Failed to reschedule lesson.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
      <div className="bg-[var(--main-bg)] rounded-xl border border-[var(--border-color)] shadow-xl max-w-lg w-full p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
          <div>
            <h3 className="text-sm font-semibold text-[var(--primary-text)]">
              Manual Lesson Rescheduling
            </h3>
            <p className="text-xs text-[var(--secondary-text)]">
              Select an available weekday period within the semester
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[var(--secondary-text)] hover:text-[var(--primary-text)] rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-lg flex items-start gap-2 text-xs text-rose-700 dark:text-rose-300">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="p-3 bg-[var(--subtle-surface)] rounded-lg border border-[var(--border-color)] text-xs space-y-1">
          <div className="text-[11px] font-medium text-[var(--secondary-text)]">Lesson details</div>
          <div className="font-semibold text-[var(--primary-text)]">
            {lesson.topic_title || 'Topic'}
          </div>
          <div className="text-[var(--secondary-text)] font-mono text-[11px]">
            Original: {lesson.scheduled_date} ({lesson.period_start}–{lesson.period_end})
          </div>
        </div>

        <form onSubmit={handleRescheduleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[var(--secondary-text)] mb-1.5">
              New Teaching Date *
            </label>
            <input
              type="date"
              required
              min={subject.semester_start_date}
              max={subject.semester_end_date}
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--border-color)] bg-[var(--input-bg)] text-[var(--primary-text)] focus:outline-none focus:border-[var(--primary-text)] transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[var(--secondary-text)] mb-1.5">
                Period Start Time *
              </label>
              <input
                type="time"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-[var(--border-color)] bg-[var(--input-bg)] text-[var(--primary-text)] focus:outline-none focus:border-[var(--primary-text)] transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--secondary-text)] mb-1.5">
                Period End Time *
              </label>
              <input
                type="time"
                required
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-[var(--border-color)] bg-[var(--input-bg)] text-[var(--primary-text)] focus:outline-none focus:border-[var(--primary-text)] transition-colors"
              />
            </div>
          </div>

          {/* Quick select timetable slot buttons */}
          {timetable.length > 0 && (
            <div>
              <span className="block text-[11px] font-medium text-[var(--secondary-text)] mb-1.5">
                Or quick-pick from standard timetable periods:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {timetable.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => handleQuickSlotSelect(t.start_time, t.end_time)}
                    className="px-2.5 py-1 text-[11px] font-mono rounded-md bg-[var(--subtle-surface)] hover:bg-[var(--hover-bg)] text-[var(--primary-text)] border border-[var(--border-color)] transition-colors"
                  >
                    {t.start_time}–{t.end_time} {t.label ? `(${t.label})` : ''}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-[var(--secondary-text)] mb-1.5">
              Reason / Academic Note
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Compensatory lecture due to campus symposium"
              className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--border-color)] bg-[var(--input-bg)] text-[var(--primary-text)] focus:outline-none focus:border-[var(--primary-text)] transition-colors"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[var(--border-color)]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-[var(--secondary-text)] hover:text-[var(--primary-text)] hover:bg-[var(--hover-bg)] rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-medium text-[var(--btn-primary-text)] bg-[var(--btn-primary-bg)] hover:opacity-90 rounded-lg transition-opacity"
            >
              Confirm Reschedule
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
