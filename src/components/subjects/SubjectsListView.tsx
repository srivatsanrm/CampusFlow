import React, { useState } from 'react';
import { Subject } from '@/types/database';
import { useData } from '@/context/DataContext';
import { BookOpen, Plus, Calendar, ArrowRight, Sparkles, MapPin } from 'lucide-react';
import { NewSubjectModal } from './NewSubjectModal';

interface SubjectsListViewProps {
  onSelectSubject: (subject: Subject) => void;
}

export const SubjectsListView: React.FC<SubjectsListViewProps> = ({ onSelectSubject }) => {
  const { subjects, getSubjectForecast, getTimetable, loadDemoData } = useData();
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[var(--main-bg)] p-6 rounded-xl border border-[var(--border-color)]">
        <div>
          <h2 className="text-xl font-semibold text-[var(--primary-text)]">
            My Teaching Assignments
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-[var(--btn-primary-text)] bg-[var(--btn-primary-bg)] hover:opacity-90 rounded-lg transition-opacity"
          >
            <Plus className="w-3.5 h-3.5" /> Add Subject
          </button>
        </div>
      </div>

      {/* Grid of subjects */}
      {subjects.length === 0 ? (
        <div className="bg-[var(--main-bg)] rounded-xl border border-dashed border-[var(--border-color)] p-12 text-center">
          <BookOpen className="w-10 h-10 text-[var(--secondary-text)] opacity-40 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-[var(--primary-text)]">
            No subjects created yet
          </h3>
          <button
            onClick={() => setModalOpen(true)}
            className="mt-4 px-4 py-2 text-xs font-medium text-[var(--btn-primary-text)] bg-[var(--btn-primary-bg)] hover:opacity-90 rounded-lg"
          >
            Add Subject Now
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {subjects.map((sub) => {
            const forecast = getSubjectForecast(sub.id);
            const percentage = forecast?.completionPercentage || 0;
            const slots = getTimetable(sub.id);

            return (
              <div
                key={sub.id}
                onClick={() => onSelectSubject(sub)}
                className="bg-[var(--main-bg)] rounded-xl border border-[var(--border-color)] p-5 hover:border-[var(--secondary-text)] cursor-pointer transition-all space-y-4 group"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-[var(--hover-bg)] text-[var(--secondary-text)] border border-[var(--border-color)]">
                      {sub.class_programme} — Sec {sub.section}
                    </span>
                    <h3 className="text-base font-semibold text-[var(--primary-text)] group-hover:opacity-80 transition-opacity mt-1.5">
                      {sub.name}
                    </h3>
                  </div>

                  {sub.subject_code && (
                    <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded-md bg-[var(--hover-bg)] text-[var(--secondary-text)] border border-[var(--border-color)]">
                      {sub.subject_code}
                    </span>
                  )}
                </div>

                <div className="space-y-1 text-xs text-[var(--secondary-text)]">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 opacity-60" />
                    <span>
                      {sub.semester_start_date} → {sub.semester_end_date}
                    </span>
                  </div>

                  {sub.classroom && (
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 opacity-60" />
                      <span>{sub.classroom}</span>
                    </div>
                  )}

                  <div className="text-[11px] text-[var(--secondary-text)]">
                    Timetable: {slots.length === 0 ? 'Not configured yet' : `${slots.length} weekly periods`}
                  </div>
                </div>

                {/* Topic-based Progress */}
                <div>
                  <div className="flex justify-between text-xs font-medium mb-1">
                    <span className="text-[var(--secondary-text)]">
                      {forecast?.totalTopics === 0
                        ? 'No topics'
                        : `${forecast?.completedTopics} of ${forecast?.totalTopics} topics`}
                    </span>
                    <span className="text-[var(--primary-text)]">{percentage}%</span>
                  </div>
                  <div className="w-full bg-[var(--hover-bg)] h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-[var(--primary-text)] h-full rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-[var(--border-color)] flex items-center justify-between text-xs font-medium text-[var(--secondary-text)] group-hover:text-[var(--primary-text)] transition-colors">
                  <span>Open Course Workspace</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* New Subject Modal */}
      <NewSubjectModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={(newSub) => {
          onSelectSubject(newSub);
        }}
      />
    </div>
  );
};
