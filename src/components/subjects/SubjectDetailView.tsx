import React, { useState } from 'react';
import { Subject } from '@/types/database';
import { useData } from '@/context/DataContext';
import {
  ArrowLeft,
  Calendar,
  BookOpen,
  Clock,
  Sparkles,
  FileDown,
  Archive,
  MapPin,
  TrendingUp,
} from 'lucide-react';
import { SyllabusEditor } from './SyllabusEditor';
import { TimetableEditor } from './TimetableEditor';
import { PdfImportModal } from './PdfImportModal';
import { exportSubjectLessonPlanPdf } from './PdfExportService';

interface SubjectDetailViewProps {
  subject: Subject;
  onBack: () => void;
}

type TabType = 'overview' | 'syllabus' | 'timetable';

export const SubjectDetailView: React.FC<SubjectDetailViewProps> = ({ subject, onBack }) => {
  const {
    getLessons,
    getUnitsWithTopics,
    getTimetable,
    getSubjectForecast,
    deleteSubject,
  } = useData();

  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [pdfModalOpen, setPdfModalOpen] = useState(false);

  const timetable = getTimetable(subject.id);
  const units = getUnitsWithTopics(subject.id);
  const lessons = getLessons(subject.id);
  const forecast = getSubjectForecast(subject.id);

  const totalTopics = units.flatMap((u) => u.topics || []).length;
  const completedTopics = units.flatMap((u) => u.topics || []).filter((t) => t.is_completed).length;
  const completionPercentage = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

  const handleExportPdf = () => {
    if (!forecast) return;
    exportSubjectLessonPlanPdf(
      subject,
      lessons,
      forecast.completionPercentage,
      forecast.completedTopics,
      forecast.totalTopics
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-[var(--main-bg)] p-6 rounded-xl border border-[var(--border-color)]">
        <div className="flex items-start gap-4">
          <button
            onClick={onBack}
            className="p-2 text-[var(--secondary-text)] hover:text-[var(--primary-text)] hover:bg-[var(--hover-bg)] rounded-lg transition-colors shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-semibold text-[var(--primary-text)]">
                {subject.name}
              </h2>
              <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-[var(--hover-bg)] text-[var(--secondary-text)] border border-[var(--border-color)]">
                {subject.class_programme} — Section {subject.section}
              </span>
              {subject.subject_code && (
                <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-md bg-[var(--hover-bg)] text-[var(--secondary-text)] border border-[var(--border-color)]">
                  {subject.subject_code}
                </span>
              )}
            </div>
            <p className="text-xs text-[var(--secondary-text)] mt-1 flex flex-wrap items-center gap-2">
              <span>{subject.year_semester}</span>
              <span>•</span>
              <span>{subject.semester_start_date} → {subject.semester_end_date}</span>
              {subject.classroom && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-[var(--secondary-text)]">
                    <MapPin className="w-3 h-3 opacity-60" />
                    {subject.classroom}
                  </span>
                </>
              )}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportPdf}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[var(--primary-text)] bg-[var(--subtle-surface)] hover:bg-[var(--hover-bg)] rounded-lg border border-[var(--border-color)] transition-colors"
          >
            <FileDown className="w-3.5 h-3.5 text-[var(--secondary-text)]" />
            Export Plan PDF
          </button>

          <button
            onClick={() => {
              if (
                confirm(
                  `Are you sure you want to delete ${subject.name} (${subject.class_programme} - Sec ${subject.section})? This will safely remove its timetable and syllabus records.`
                )
              ) {
                deleteSubject(subject.id);
                onBack();
              }
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-500/10 rounded-lg border border-transparent hover:border-rose-500/20 transition-colors"
          >
            <Archive className="w-3.5 h-3.5" />
            Delete Assignment
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-[var(--border-color)] gap-6">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-2.5 text-xs font-medium border-b-2 transition-colors ${
            activeTab === 'overview'
              ? 'border-[var(--primary-text)] text-[var(--primary-text)]'
              : 'border-transparent text-[var(--secondary-text)] hover:text-[var(--primary-text)]'
          }`}
        >
          Overview & Forecast
        </button>
        <button
          onClick={() => setActiveTab('syllabus')}
          className={`pb-2.5 text-xs font-medium border-b-2 transition-colors ${
            activeTab === 'syllabus'
              ? 'border-[var(--primary-text)] text-[var(--primary-text)]'
              : 'border-transparent text-[var(--secondary-text)] hover:text-[var(--primary-text)]'
          }`}
        >
          Syllabus ({units.length} Units, {totalTopics} Topics)
        </button>
        <button
          onClick={() => setActiveTab('timetable')}
          className={`pb-2.5 text-xs font-medium border-b-2 transition-colors ${
            activeTab === 'timetable'
              ? 'border-[var(--primary-text)] text-[var(--primary-text)]'
              : 'border-transparent text-[var(--secondary-text)] hover:text-[var(--primary-text)]'
          }`}
        >
          Weekly Timetable ({timetable.length} Periods)
        </button>
      </div>

      {/* Tab 1: OVERVIEW & FORECAST */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Progress Card */}
          <div className="bg-[var(--main-bg)] rounded-xl border border-[var(--border-color)] p-6 space-y-4">
            <h3 className="text-sm font-semibold text-[var(--primary-text)]">
              Syllabus Completion
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 bg-[var(--subtle-surface)] rounded-lg border border-[var(--border-color)]">
                <span className="text-[11px] text-[var(--secondary-text)] uppercase font-medium">Total Topics</span>
                <div className="text-2xl font-semibold text-[var(--primary-text)] mt-1">
                  {totalTopics}
                </div>
              </div>
              <div className="p-4 bg-[var(--subtle-surface)] rounded-lg border border-[var(--border-color)]">
                <span className="text-[11px] text-[var(--secondary-text)] uppercase font-medium">Completed Topics</span>
                <div className="text-2xl font-semibold text-emerald-600 dark:text-emerald-400 mt-1">
                  {completedTopics}
                </div>
              </div>
              <div className="p-4 bg-[var(--subtle-surface)] rounded-lg border border-[var(--border-color)]">
                <span className="text-[11px] text-[var(--secondary-text)] uppercase font-medium">Remaining Topics</span>
                <div className="text-2xl font-semibold text-[var(--primary-text)] mt-1">
                  {totalTopics - completedTopics}
                </div>
              </div>
              <div className="p-4 bg-[var(--subtle-surface)] rounded-lg border border-[var(--border-color)]">
                <span className="text-[11px] text-[var(--secondary-text)] uppercase font-medium">Completion Rate</span>
                <div className="text-2xl font-semibold text-[var(--primary-text)] mt-1">
                  {completionPercentage}%
                </div>
              </div>
            </div>

            <div className="w-full bg-[var(--hover-bg)] h-2 rounded-full overflow-hidden">
              <div
                className="bg-[var(--primary-text)] h-full rounded-full transition-all"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </div>

          {/* Secondary Completion Forecast Card */}
          {forecast && (
            <div className="bg-[var(--main-bg)] rounded-xl border border-[var(--border-color)] p-6 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-[var(--secondary-text)]" />
                  <h4 className="text-sm font-semibold text-[var(--primary-text)]">
                    Completion Forecast
                  </h4>
                </div>
                <span
                  className={`text-[10px] font-medium px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                    forecast.status === 'on_track' || forecast.status === 'complete'
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                      : forecast.status === 'at_risk'
                      ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                      : forecast.status === 'behind_schedule'
                      ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                      : 'bg-[var(--hover-bg)] text-[var(--secondary-text)] border border-[var(--border-color)]'
                  }`}
                >
                  {forecast.status.replace('_', ' ')}
                </span>
              </div>
              <p className="text-xs text-[var(--secondary-text)] leading-relaxed">
                {forecast.detailMessage}
              </p>
              {forecast.estimatedCompletionDate && (
                <div className="text-xs text-[var(--secondary-text)] font-mono">
                  Estimated syllabus completion date: <strong>{forecast.estimatedCompletionDate}</strong> (Deadline: {subject.semester_end_date})
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: SYLLABUS */}
      {activeTab === 'syllabus' && (
        <SyllabusEditor subjectId={subject.id} onOpenPdfImport={() => setPdfModalOpen(true)} />
      )}

      {/* Tab 3: TIMETABLE */}
      {activeTab === 'timetable' && <TimetableEditor subjectId={subject.id} />}

      {/* PDF Syllabus Import Modal */}
      <PdfImportModal
        isOpen={pdfModalOpen}
        onClose={() => setPdfModalOpen(false)}
        subjectId={subject.id}
      />
    </div>
  );
};
