import React, { useState } from 'react';
import { useData } from '@/context/DataContext';
import { useAuth } from '@/context/AuthContext';
import { Shield, Plus, Trash2, Edit2, AlertCircle, CheckCircle2, Calendar, Check } from 'lucide-react';
import { OfficialHoliday } from '@/types/database';

export const HolidayAdminView: React.FC = () => {
  const { user } = useAuth();
  const { officialHolidays, addOfficialHoliday, updateOfficialHoliday, deleteOfficialHoliday } = useData();

  const [name, setName] = useState('');
  const [date, setDate] = useState('2026-01-01');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDate, setEditDate] = useState('');

  // Protect admin view
  if (user?.role !== 'admin') {
    return (
      <div className="p-8 max-w-lg mx-auto text-center space-y-3">
        <div className="p-3 bg-rose-50 dark:bg-rose-950/40 text-rose-600 rounded-2xl w-12 h-12 flex items-center justify-center mx-auto">
          <Shield className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-slate-900 dark:text-white">
          Restricted Administrator Portal
        </h3>
        <p className="text-xs text-slate-500">
          Only authorized college administrators can centrally modify official academic holidays.
        </p>
      </div>
    );
  }

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!name.trim()) {
      setError('Please provide the festival / holiday name.');
      return;
    }

    const res = addOfficialHoliday(name.trim(), date, parseInt(date.substring(0, 4)) || 2026);
    if (!res.success) {
      setError(res.error || 'Failed to add official holiday.');
    } else {
      setSuccess(`Added official holiday: ${name.trim()}`);
      setName('');
    }
  };

  const handleStartEdit = (h: OfficialHoliday) => {
    setEditingId(h.id);
    setEditName(h.name);
    setEditDate(h.holiday_date);
  };

  const handleSaveEdit = (h: OfficialHoliday) => {
    if (!editName.trim()) return;
    const res = updateOfficialHoliday({
      ...h,
      name: editName.trim(),
      holiday_date: editDate,
    });
    if (res.success) {
      setEditingId(null);
    } else {
      setError(res.error || 'Failed to update holiday.');
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-[var(--main-bg)] p-6 rounded-xl border border-[var(--border-color)] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[var(--subtle-surface)] text-[var(--secondary-text)] rounded-lg border border-[var(--border-color)]">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-[var(--primary-text)]">
                Official Holiday Administration
              </h2>
              <span className="text-[10px] font-medium uppercase tracking-wider bg-[var(--hover-bg)] text-[var(--secondary-text)] px-2 py-0.5 rounded border border-[var(--border-color)]">
                Admin Role
              </span>
            </div>
            <p className="text-xs text-[var(--secondary-text)] mt-0.5">
              Centrally managed calendar shared across all faculty members. Changes safely adjust upcoming lesson availability.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg flex items-center gap-2 text-xs text-rose-600 dark:text-rose-400">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Add Holiday Form */}
      <form
        onSubmit={handleAddSubmit}
        className="p-5 bg-[var(--main-bg)] rounded-xl border border-[var(--border-color)] space-y-3"
      >
        <h3 className="text-xs font-semibold text-[var(--primary-text)] uppercase tracking-wide">
          Add New Official Holiday
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <label className="block text-[11px] font-medium text-[var(--secondary-text)] mb-1">
              Festival / Holiday Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Founder's Memorial Day"
              className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--border-color)] bg-[var(--input-bg)] text-[var(--primary-text)] placeholder-[var(--secondary-text)] opacity-90 focus:outline-none focus:border-[var(--secondary-text)]"
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-[var(--secondary-text)] mb-1">
              Date *
            </label>
            <div className="flex gap-2">
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--border-color)] bg-[var(--input-bg)] text-[var(--primary-text)] focus:outline-none focus:border-[var(--secondary-text)]"
              />
              <button
                type="submit"
                className="px-3.5 py-2 text-xs font-medium text-[var(--btn-primary-text)] bg-[var(--btn-primary-bg)] hover:opacity-90 rounded-lg transition-opacity shrink-0 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* List of official holidays */}
      <div className="bg-[var(--main-bg)] rounded-xl border border-[var(--border-color)] overflow-hidden">
        <div className="p-4 bg-[var(--subtle-surface)] border-b border-[var(--border-color)] flex items-center justify-between">
          <span className="text-xs font-semibold text-[var(--primary-text)]">
            Official Holiday Directory ({officialHolidays.length} Recorded)
          </span>
          <span className="text-[11px] text-[var(--secondary-text)] font-mono">
            Source: 2026 Academic Calendar
          </span>
        </div>

        <div className="divide-y divide-[var(--border-color)]">
          {officialHolidays.map((h) => {
            const isEditing = editingId === h.id;
            return (
              <div
                key={h.id}
                className="p-3.5 flex items-center justify-between text-xs hover:bg-[var(--hover-bg)] transition-colors"
              >
                {isEditing ? (
                  <div className="flex-1 flex items-center gap-2">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="flex-1 px-2 py-1 text-xs rounded-lg border border-[var(--border-color)] bg-[var(--input-bg)] text-[var(--primary-text)]"
                    />
                    <input
                      type="date"
                      value={editDate}
                      onChange={(e) => setEditDate(e.target.value)}
                      className="px-2 py-1 text-xs rounded-lg border border-[var(--border-color)] bg-[var(--input-bg)] text-[var(--primary-text)]"
                    />
                    <button
                      onClick={() => handleSaveEdit(h)}
                      className="p-1 text-emerald-600 hover:bg-emerald-500/10 rounded"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs font-medium text-[var(--primary-text)] bg-[var(--subtle-surface)] px-2 py-0.5 rounded border border-[var(--border-color)]">
                        {h.holiday_date}
                      </span>
                      <span className="font-medium text-[var(--primary-text)]">
                        {h.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleStartEdit(h)}
                        className="p-1 text-[var(--secondary-text)] hover:text-[var(--primary-text)]"
                        title="Edit Holiday"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Remove official holiday: ${h.name}?`)) {
                            deleteOfficialHoliday(h.id);
                          }
                        }}
                        className="p-1 text-[var(--secondary-text)] hover:text-rose-600"
                        title="Delete Holiday"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
