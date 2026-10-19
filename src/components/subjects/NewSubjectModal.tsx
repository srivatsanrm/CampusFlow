import React, { useState } from 'react';
import { useData } from '@/context/DataContext';
import { X, BookOpen, AlertCircle } from 'lucide-react';
import { Subject } from '@/types/database';

interface NewSubjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (subject: Subject) => void;
}

export const NewSubjectModal: React.FC<NewSubjectModalProps> = ({ isOpen, onClose, onCreated }) => {
  const { addSubject } = useData();

  // Required Fields
  const [name, setName] = useState('');
  const [classProgramme, setClassProgramme] = useState('');
  const [yearSemester, setYearSemester] = useState('Year 1 / Sem 1');
  const [section, setSection] = useState('A');
  const [startDate, setStartDate] = useState('2026-01-05');
  const [endDate, setEndDate] = useState('2026-04-30');

  // Optional Fields
  const [subjectCode, setSubjectCode] = useState('');
  const [classroom, setClassroom] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Please provide a subject name.');
      return;
    }
    if (!classProgramme.trim()) {
      setError('Please provide the Class / Programme (e.g. B.Tech CSE).');
      return;
    }
    if (!section.trim()) {
      setError('Please provide the Section (e.g. A, B, or C).');
      return;
    }
    if (endDate <= startDate) {
      setError('Semester end date must be strictly after the semester start date.');
      return;
    }

    try {
      const created = addSubject({
        name: name.trim(),
        class_programme: classProgramme.trim(),
        year_semester: yearSemester.trim(),
        section: section.trim(),
        classroom: classroom.trim() || null,
        subject_code: subjectCode.trim() || null,
        notes: notes.trim() || null,
        semester_start_date: startDate,
        semester_end_date: endDate,
        status: 'active',
      });
      onCreated(created);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create subject.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in overflow-y-auto">
      <div className="bg-[var(--main-bg)] rounded-xl border border-[var(--border-color)] max-w-xl w-full p-6 space-y-4 my-8">
        <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-[var(--primary-text)]">
              Create Teaching Assignment
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[var(--secondary-text)] hover:text-[var(--primary-text)] rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg flex items-center gap-2 text-xs text-rose-600 dark:text-rose-400">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Subject Name */}
          <div>
            <label className="block text-xs font-medium text-[var(--secondary-text)] mb-1">
              Subject Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Physics or Compiler Design"
              className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border-color)] bg-[var(--input-bg)] text-[var(--primary-text)] placeholder-[var(--secondary-text)] opacity-90 focus:outline-none focus:border-[var(--secondary-text)]"
            />
          </div>

          {/* Class / Programme & Section */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-[var(--secondary-text)] mb-1">
                Class / Programme *
              </label>
              <input
                type="text"
                required
                value={classProgramme}
                onChange={(e) => setClassProgramme(e.target.value)}
                placeholder="e.g. B.Tech CSE or B.Sc Physics"
                className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--border-color)] bg-[var(--input-bg)] text-[var(--primary-text)] placeholder-[var(--secondary-text)] opacity-90 focus:outline-none focus:border-[var(--secondary-text)]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--secondary-text)] mb-1">
                Section *
              </label>
              <input
                type="text"
                required
                value={section}
                onChange={(e) => setSection(e.target.value)}
                placeholder="e.g. A"
                className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--border-color)] bg-[var(--input-bg)] text-[var(--primary-text)] placeholder-[var(--secondary-text)] opacity-90 focus:outline-none focus:border-[var(--secondary-text)] text-center font-semibold"
              />
            </div>
          </div>

          {/* Year/Semester & Subject Code */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[var(--secondary-text)] mb-1">
                Year / Semester *
              </label>
              <input
                type="text"
                required
                value={yearSemester}
                onChange={(e) => setYearSemester(e.target.value)}
                placeholder="e.g. Year 2 / Sem 3"
                className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--border-color)] bg-[var(--input-bg)] text-[var(--primary-text)] placeholder-[var(--secondary-text)] opacity-90 focus:outline-none focus:border-[var(--secondary-text)]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--secondary-text)] mb-1">
                Subject Code (Optional)
              </label>
              <input
                type="text"
                value={subjectCode}
                onChange={(e) => setSubjectCode(e.target.value)}
                placeholder="e.g. CS204"
                className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--border-color)] bg-[var(--input-bg)] text-[var(--primary-text)] placeholder-[var(--secondary-text)] opacity-90 focus:outline-none focus:border-[var(--secondary-text)] font-mono"
              />
            </div>
          </div>

          {/* Classroom & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[var(--secondary-text)] mb-1">
                Classroom / Room Number (Optional)
              </label>
              <input
                type="text"
                value={classroom}
                onChange={(e) => setClassroom(e.target.value)}
                placeholder="e.g. Room 204 or Lab 3"
                className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--border-color)] bg-[var(--input-bg)] text-[var(--primary-text)] placeholder-[var(--secondary-text)] opacity-90 focus:outline-none focus:border-[var(--secondary-text)]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--secondary-text)] mb-1">
                Notes (Optional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Morning batch"
                className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--border-color)] bg-[var(--input-bg)] text-[var(--primary-text)] placeholder-[var(--secondary-text)] opacity-90 focus:outline-none focus:border-[var(--secondary-text)]"
              />
            </div>
          </div>

          {/* Semester Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[var(--secondary-text)] mb-1">
                Semester Start Date *
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--border-color)] bg-[var(--input-bg)] text-[var(--primary-text)] focus:outline-none focus:border-[var(--secondary-text)]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--secondary-text)] mb-1">
                Semester End Date *
              </label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--border-color)] bg-[var(--input-bg)] text-[var(--primary-text)] focus:outline-none focus:border-[var(--secondary-text)]"
              />
            </div>
          </div>

          <p className="text-[11px] text-[var(--secondary-text)]">
            Teaching assignments for the same subject (e.g. Physics for CSE-A and Physics for ECE-B) are tracked independently with dedicated timetables and syllabus progress.
          </p>

          <div className="flex justify-end gap-2 pt-3 border-t border-[var(--border-color)]">
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
              Create Teaching Assignment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
