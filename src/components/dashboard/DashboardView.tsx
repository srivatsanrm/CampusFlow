import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import {
  BookOpen,
  Calendar,
  Plus,
  ArrowRight,
  Clock,
} from 'lucide-react';
import { Subject } from '@/types/database';
import { LiveClassReminderCard } from './LiveClassReminderCard';
import { PaceTrackerCard } from './PaceTrackerCard';

interface DashboardViewProps {
  onNavigateTab: (tab: 'timetable' | 'subjects' | 'calendar' | 'settings') => void;
  onSelectSubject: (subject: Subject) => void;
  onOpenNewSubjectModal: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigateTab,
  onSelectSubject,
  onOpenNewSubjectModal,
}) => {
  const { user } = useAuth();
  const { subjects, getSubjectForecast } = useData();

  const activeSubjects = subjects.filter((s) => s.status === 'active');

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Welcome Banner */}
      <div className="bg-[var(--main-bg)] rounded-xl border border-[var(--border-color)] p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-[var(--primary-text)]">
            Welcome back, {user?.full_name?.split(' ')[0] || 'Professor'}
          </h2>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onOpenNewSubjectModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-[var(--btn-primary-text)] bg-[var(--btn-primary-bg)] hover:opacity-90 rounded-lg transition-opacity"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Subject
          </button>

          <button
            onClick={() => onNavigateTab('timetable')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-[var(--primary-text)] bg-[var(--subtle-surface)] hover:bg-[var(--hover-bg)] rounded-lg border border-[var(--border-color)] transition-colors"
          >
            <Clock className="w-3.5 h-3.5 text-[var(--secondary-text)]" />
            View Timetable
          </button>

          <button
            onClick={() => onNavigateTab('calendar')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-[var(--primary-text)] bg-[var(--subtle-surface)] hover:bg-[var(--hover-bg)] rounded-lg border border-[var(--border-color)] transition-colors"
          >
            <Calendar className="w-3.5 h-3.5 text-[var(--secondary-text)]" />
            View Academic Calendar
          </button>
        </div>
      </div>

      {/* Live Class Reminder Card */}
      <LiveClassReminderCard
        onNavigateTab={onNavigateTab}
        onOpenNewSubjectModal={onOpenNewSubjectModal}
      />

      {/* Teaching Assignments Overview Card */}
      <div className="bg-[var(--main-bg)] rounded-xl border border-[var(--border-color)] p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
          <div>
            <h3 className="text-sm font-semibold text-[var(--primary-text)]">
              Teaching Assignments & Syllabus Progress
            </h3>
          </div>
          <button
            onClick={() => onNavigateTab('subjects')}
            className="text-xs text-[var(--secondary-text)] hover:text-[var(--primary-text)] flex items-center gap-1 font-medium transition-colors"
          >
            Manage Subjects <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {activeSubjects.length === 0 ? (
          <div className="py-10 text-center space-y-3">
            <BookOpen className="w-8 h-8 text-[var(--secondary-text)] mx-auto opacity-40" />
            <h4 className="text-sm font-medium text-[var(--primary-text)]">
              No subjects or classes created yet
            </h4>
            <button
              onClick={onOpenNewSubjectModal}
              className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-[var(--btn-primary-text)] bg-[var(--btn-primary-bg)] hover:opacity-90 rounded-lg"
            >
              <Plus className="w-3.5 h-3.5" /> Create Your First Subject
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeSubjects.map((sub) => {
              const forecast = getSubjectForecast(sub.id);
              return (
                <PaceTrackerCard
                  key={sub.id}
                  subject={sub}
                  forecast={forecast}
                  onSelectSubject={onSelectSubject}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
