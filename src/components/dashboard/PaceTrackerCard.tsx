import React, { useState } from 'react';
import { Subject, SubjectForecast, PaceStatus } from '@/types/database';
import { useData } from '@/context/DataContext';
import {
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  SlidersHorizontal,
  ChevronRight,
  Info,
  Check,
} from 'lucide-react';

interface PaceTrackerCardProps {
  subject: Subject;
  forecast: SubjectForecast | null;
  onSelectSubject: (subject: Subject) => void;
}

export const PaceTrackerCard: React.FC<PaceTrackerCardProps> = ({
  subject,
  forecast,
  onSelectSubject,
}) => {
  const { savePaceSettings, getPaceSettings } = useData();
  const [showSettings, setShowSettings] = useState(false);

  const currentSettings = getPaceSettings(subject.id);
  const [topicsPerPeriodInput, setTopicsPerPeriodInput] = useState<string>(
    String(currentSettings?.topics_per_period ?? 1.0)
  );
  const [safetyBufferInput, setSafetyBufferInput] = useState<string>(
    String(currentSettings?.safety_buffer ?? 5)
  );
  const [saveSuccess, setSaveSuccess] = useState(false);

  const percentage = forecast?.completionPercentage ?? 0;
  const completedTopics = forecast?.completedTopics ?? 0;
  const totalTopics = forecast?.totalTopics ?? 0;
  const remainingTopics = forecast?.remainingTopics ?? 0;
  const status: PaceStatus = forecast?.status ?? 'not_configured';

  const handleSaveSettings = (e: React.FormEvent) => {
    e.stopPropagation();
    const rate = parseFloat(topicsPerPeriodInput);
    const buf = parseInt(safetyBufferInput, 10);
    savePaceSettings(
      subject.id,
      isNaN(rate) || rate <= 0 ? 1.0 : rate,
      isNaN(buf) || buf < 0 ? 5 : buf
    );
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      setShowSettings(false);
    }, 800);
  };

  // Status Styling & Badges
  const renderStatusBadge = () => {
    switch (status) {
      case 'on_track':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            On Track
          </span>
        );
      case 'at_risk':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <AlertTriangle className="w-3 h-3 text-amber-600 dark:text-amber-400" />
            At Risk
          </span>
        );
      case 'behind_schedule':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            <AlertOctagon className="w-3 h-3 text-rose-600 dark:text-rose-400" />
            Behind Schedule
          </span>
        );
      case 'complete':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
            Syllabus Complete
          </span>
        );
      case 'not_configured':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[var(--hover-bg)] text-[var(--secondary-text)] border border-[var(--border-color)]">
            Syllabus Not Configured
          </span>
        );
      case 'invalid_dates':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            Invalid Semester Dates
          </span>
        );
      case 'insufficient_data':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[var(--hover-bg)] text-[var(--secondary-text)] border border-[var(--border-color)]">
            Timetable Required
          </span>
        );
    }
  };

  // Progress Bar Color based on status
  const getProgressBarColor = () => {
    switch (status) {
      case 'behind_schedule':
        return 'bg-rose-500';
      case 'at_risk':
        return 'bg-amber-500';
      case 'complete':
      case 'on_track':
        return 'bg-emerald-500';
      default:
        return 'bg-[var(--primary-text)]';
    }
  };

  return (
    <div
      onClick={() => onSelectSubject(subject)}
      className="bg-[var(--main-bg)] rounded-xl border border-[var(--border-color)] p-5 hover:border-[var(--secondary-text)] transition-all cursor-pointer group flex flex-col justify-between space-y-4"
    >
      {/* Top Header: Subject info & Status Badge */}
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="text-base font-semibold text-[var(--primary-text)] group-hover:opacity-80 transition-opacity">
              {subject.name}
            </h4>
            <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-[var(--hover-bg)] text-[var(--secondary-text)] border border-[var(--border-color)]">
              {subject.class_programme} — Sec {subject.section}
            </span>
            {subject.classroom && (
              <span className="text-[11px] text-[var(--secondary-text)] font-medium">
                • {subject.classroom}
              </span>
            )}
          </div>
          <p className="text-xs text-[var(--secondary-text)]">
            Semester: {subject.semester_start_date} → {subject.semester_end_date}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {renderStatusBadge()}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowSettings(!showSettings);
            }}
            title="Configure planning assumption"
            className="p-1.5 text-[var(--secondary-text)] hover:text-[var(--primary-text)] hover:bg-[var(--hover-bg)] rounded-lg transition-colors"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Planning Assumption Inline Drawer */}
      {showSettings && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="p-3.5 bg-[var(--subtle-surface)] border border-[var(--border-color)] rounded-lg space-y-3 text-xs"
        >
          <div className="flex items-center justify-between">
            <span className="font-semibold text-[var(--primary-text)] flex items-center gap-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5 text-[var(--secondary-text)]" />
              Pace Planning Settings ({subject.class_programme} — Sec {subject.section})
            </span>
            <span className="text-[11px] text-[var(--secondary-text)]">
              {forecast?.isHistoricalRate ? 'Measured from class history' : 'Configured assumption'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-[var(--secondary-text)] mb-1">
                Topics covered per period:
              </label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                max="5.0"
                value={topicsPerPeriodInput}
                onChange={(e) => setTopicsPerPeriodInput(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-[var(--border-color)] bg-[var(--input-bg)] text-[var(--primary-text)] font-mono text-xs focus:border-[var(--secondary-text)] outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-[var(--secondary-text)] mb-1">
                At-Risk safety buffer (periods):
              </label>
              <input
                type="number"
                step="1"
                min="0"
                max="20"
                value={safetyBufferInput}
                onChange={(e) => setSafetyBufferInput(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-[var(--border-color)] bg-[var(--input-bg)] text-[var(--primary-text)] font-mono text-xs focus:border-[var(--secondary-text)] outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-[10px] text-[var(--secondary-text)]">
              Changes update completion forecast deterministically.
            </span>
            <button
              type="button"
              onClick={handleSaveSettings}
              className="inline-flex items-center gap-1 px-3 py-1 bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] hover:opacity-90 font-medium rounded-lg text-xs transition-opacity"
            >
              {saveSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5" /> Saved
                </>
              ) : (
                'Save Settings'
              )}
            </button>
          </div>
        </div>
      )}

      {/* Middle Section: Progress Bar & Topic Counts */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-medium">
          <span className="text-[var(--primary-text)]">
            Syllabus Progress: {percentage}%
          </span>
          <span className="text-[var(--secondary-text)]">
            {totalTopics === 0
              ? 'No topics configured'
              : `${completedTopics} / ${totalTopics} topics completed`}
          </span>
        </div>

        <div className="w-full bg-[var(--hover-bg)] h-2 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${getProgressBarColor()}`}
            style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-xs text-[var(--secondary-text)] pt-0.5">
          <span>{remainingTopics} remaining topic{remainingTopics === 1 ? '' : 's'}</span>
          <span>
            Rate: {forecast?.topicsPerPeriodRate ?? 1} topic/period
            {forecast?.isHistoricalRate ? ' (history)' : ' (plan)'}
          </span>
        </div>
      </div>

      {/* Useful Insight / Explanation Message (suppressed when complete) */}
      {forecast?.detailMessage && status !== 'complete' && (
        <div className="p-3 rounded-lg bg-[var(--subtle-surface)] border border-[var(--border-color)] flex items-start gap-2 text-xs text-[var(--secondary-text)]">
          <Info className="w-4 h-4 text-[var(--secondary-text)] shrink-0 mt-0.5" />
          <p className="leading-relaxed">{forecast.detailMessage}</p>
        </div>
      )}

      {/* Bottom Link: View Syllabus & Plan */}
      <div className="pt-1 flex items-center justify-end text-xs font-medium text-[var(--secondary-text)] group-hover:text-[var(--primary-text)] transition-colors">
        <span>View Syllabus & Classes</span>
        <ChevronRight className="w-4 h-4" />
      </div>
    </div>
  );
};
