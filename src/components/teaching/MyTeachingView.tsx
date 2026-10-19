import React, { useState } from 'react';
import { useData } from '@/context/DataContext';
import { Subject } from '@/types/database';
import {
  Clock,
  MapPin,
  Check,
  Filter,
  BookOpen,
  ArrowRight,
} from 'lucide-react';

interface MyTeachingViewProps {
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

export const MyTeachingView: React.FC<MyTeachingViewProps> = ({
  onSelectSubject,
  onOpenNewSubjectModal,
}) => {
  const { getAllTeacherTimetable, subjects, getUnitsWithTopics, toggleTopicCompleted } = useData();

  const [viewMode, setViewMode] = useState<'weekly' | 'daily'>('weekly');
  const [selectedDay, setSelectedDay] = useState<number>(() => {
    const today = new Date().getDay();
    return today >= 1 && today <= 5 ? today : 1;
  });
  const [filterClass, setFilterClass] = useState<string>('all');

  const allSlots = getAllTeacherTimetable();

  // Distinct classes for filter
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

  const dailySlots = filteredSlots
    .filter((slot) => slot.weekday === selectedDay)
    .sort((a, b) => a.start_time.localeCompare(b.start_time));

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              My Teaching Schedule
            </h2>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
              Multi-Class Workload
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Track which class, section, and room you teach next. Complete topics directly between periods.
          </p>
        </div>

        {/* View mode toggle and class filter */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {classOptions.length > 1 && (
            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/60 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={filterClass}
                onChange={(e) => setFilterClass(e.target.value)}
                className="bg-transparent text-slate-700 dark:text-slate-200 focus:outline-none text-xs font-medium cursor-pointer"
              >
                <option value="all">All Classes & Sections</option>
                {classOptions.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200/60 dark:border-slate-700">
            <button
              onClick={() => setViewMode('weekly')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                viewMode === 'weekly'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-300'
              }`}
            >
              Weekly Timetable
            </button>
            <button
              onClick={() => setViewMode('daily')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                viewMode === 'daily'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-300'
              }`}
            >
              Daily Schedule
            </button>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {allSlots.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-12 text-center space-y-3">
          <Clock className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            Your timetable is not set up yet.
          </h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Configure weekly lecture periods for each of your teaching assignments to view your multi-class schedule.
          </p>
          <div className="pt-2">
            <button
              onClick={onOpenNewSubjectModal}
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors"
            >
              Configure Teaching Periods
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* DAILY VIEW */}
          {viewMode === 'daily' && (
            <div className="space-y-4">
              {/* Day selector tabs */}
              <div className="flex border-b border-slate-200 dark:border-slate-800 gap-2 overflow-x-auto pb-1">
                {WEEKDAYS.map((w) => {
                  const countForDay = filteredSlots.filter((s) => s.weekday === w.id).length;
                  const isSelected = selectedDay === w.id;

                  return (
                    <button
                      key={w.id}
                      onClick={() => setSelectedDay(w.id)}
                      className={`px-4 py-2 text-xs font-semibold rounded-t-lg border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
                        isSelected
                          ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/20'
                          : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                      }`}
                    >
                      <span>{w.name}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        {countForDay}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Day Period List */}
              <div className="space-y-3">
                {dailySlots.length === 0 ? (
                  <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 text-xs text-slate-400">
                    No classes scheduled for {WEEKDAYS.find((w) => w.id === selectedDay)?.name}.
                  </div>
                ) : (
                  dailySlots.map((slot) => {
                    const sub = subjects.find((s) => s.id === slot.subject_id);
                    const units = sub ? getUnitsWithTopics(sub.id) : [];
                    const allTopics = units.flatMap((u) => u.topics || []);
                    const pendingTopic = allTopics.find((t) => !t.is_completed);

                    return (
                      <div
                        key={slot.id}
                        className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all hover:border-blue-300 dark:hover:border-blue-700"
                      >
                        <div className="flex items-start gap-4">
                          <div className="px-3.5 py-2.5 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-mono font-bold text-sm text-center shrink-0 border border-blue-200 dark:border-blue-800">
                            <div>{slot.start_time}</div>
                            <div className="text-[10px] text-slate-400 font-normal">to</div>
                            <div>{slot.end_time}</div>
                          </div>

                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                                {slot.subject_name}
                              </h3>
                              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                {slot.class_programme} — Section {slot.section}
                              </span>
                              {slot.classroom && (
                                <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                                  <MapPin className="w-3.5 h-3.5 text-rose-500" />
                                  {slot.classroom}
                                </span>
                              )}
                            </div>

                            <div className="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-2">
                              <BookOpen className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                              <span className="font-medium">
                                Planned Topic: {pendingTopic ? pendingTopic.title : (allTopics.length > 0 ? 'All topics completed' : 'No topics added yet')}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Quick action: mark completed or open subject */}
                        <div className="flex items-center gap-2 self-end md:self-center">
                          {pendingTopic && (
                            <button
                              onClick={() => toggleTopicCompleted(pendingTopic.id, true)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors"
                            >
                              <Check className="w-3.5 h-3.5" /> Mark Topic Done
                            </button>
                          )}

                          {sub && (
                            <button
                              onClick={() => onSelectSubject(sub)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors"
                            >
                              <span>Course Details</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* WEEKLY VIEW */}
          {viewMode === 'weekly' && (
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {WEEKDAYS.map((w) => {
                const daySlots = filteredSlots
                  .filter((s) => s.weekday === w.id)
                  .sort((a, b) => a.start_time.localeCompare(b.start_time));

                return (
                  <div
                    key={w.id}
                    className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-xs space-y-3 flex flex-col"
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                          {w.name}
                        </h4>
                        <span className="text-[11px] text-slate-400">
                          {daySlots.length} teaching {daySlots.length === 1 ? 'period' : 'periods'}
                        </span>
                      </div>
                    </div>

                    <div className="flex-1 space-y-3">
                      {daySlots.length === 0 ? (
                        <div className="py-12 text-center text-xs text-slate-400">
                          No classes
                        </div>
                      ) : (
                        daySlots.map((slot) => {
                          const sub = subjects.find((s) => s.id === slot.subject_id);

                          return (
                            <div
                              key={slot.id}
                              onClick={() => sub && onSelectSubject(sub)}
                              className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80 hover:border-blue-400 cursor-pointer transition-all space-y-1.5 group"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-mono text-[11px] font-bold text-blue-600 dark:text-blue-400">
                                  {slot.start_time}–{slot.end_time}
                                </span>
                                {slot.label && (
                                  <span className="text-[10px] text-slate-400">
                                    {slot.label}
                                  </span>
                                )}
                              </div>

                              <div>
                                <div className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 transition-colors">
                                  {slot.subject_name}
                                </div>
                                <div className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                                  {slot.class_programme} — Sec {slot.section}
                                </div>
                              </div>

                              {slot.classroom && (
                                <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                  <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                                  <span>{slot.classroom}</span>
                                </div>
                              )}

                              <div className="text-[10px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800 truncate">
                                📌 {slot.planned_topic}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
};
