import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { useTheme } from '@/context/ThemeContext';
import { User, Moon, Sun, Monitor, LogOut, CheckCircle2, Lock, Trash2 } from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { user, updateProfile, logout, resetPasswordRequest } = useAuth();
  const { clearAllUserData } = useData();
  const { theme, setTheme } = useTheme();

  const [fullName, setFullName] = useState(user?.full_name || '');
  const [success, setSuccess] = useState<string | null>(null);
  const [clearSuccess, setClearSuccess] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) return;
    updateProfile({ full_name: fullName.trim() });
    setSuccess('Profile updated successfully.');
    setTimeout(() => setSuccess(null), 3000);
  };

  const handlePasswordReset = async () => {
    if (!user?.email) return;
    await resetPasswordRequest(user.email);
    setResetSent(true);
    setTimeout(() => setResetSent(false), 5000);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Settings Header */}
      <div className="bg-[var(--main-bg)] p-6 rounded-xl border border-[var(--border-color)]">
        <h2 className="text-lg font-semibold text-[var(--primary-text)] tracking-tight">
          Settings & Preferences
        </h2>
      </div>

      {success && (
        <div className="p-3 bg-[var(--subtle-surface)] border border-[var(--border-color)] rounded-lg flex items-center gap-2 text-xs text-[var(--primary-text)]">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span>{success}</span>
        </div>
      )}

      {/* Profile Section */}
      <div className="bg-[var(--main-bg)] rounded-xl border border-[var(--border-color)] p-6 space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-[var(--primary-text)]">
          <User className="w-4 h-4 text-[var(--secondary-text)]" />
          <span>Teacher Profile</span>
        </div>

        <form onSubmit={handleProfileSubmit} className="space-y-4 max-w-md">
          <div>
            <label className="block text-xs font-medium text-[var(--secondary-text)] mb-1.5">
              Full Name
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--border-color)] bg-[var(--input-bg)] text-[var(--primary-text)] focus:outline-none focus:border-[var(--primary-text)] transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--secondary-text)] mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              disabled
              value={user?.email || ''}
              className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--border-color)] bg-[var(--subtle-surface)] text-[var(--secondary-text)] cursor-not-allowed"
            />
          </div>

          <button
            type="submit"
            className="px-4 py-2 text-xs font-medium text-[var(--btn-primary-text)] bg-[var(--btn-primary-bg)] hover:opacity-90 rounded-lg transition-opacity"
          >
            Save Profile
          </button>
        </form>
      </div>

      {/* Account Security Section */}
      <div className="bg-[var(--main-bg)] rounded-xl border border-[var(--border-color)] p-6 space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-[var(--primary-text)]">
          <Lock className="w-4 h-4 text-[var(--secondary-text)]" />
          <span>Account Security & Password</span>
        </div>
        <p className="text-xs text-[var(--secondary-text)]">
          Need to change your password? Request a secure password reset link to your registered email address.
        </p>

        {resetSent && (
          <div className="p-3 bg-[var(--subtle-surface)] border border-[var(--border-color)] rounded-lg text-xs text-[var(--primary-text)] flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span>Password reset instructions have been dispatched to your email address.</span>
          </div>
        )}

        <button
          onClick={handlePasswordReset}
          className="px-4 py-2 text-xs font-medium text-[var(--primary-text)] bg-[var(--main-bg)] hover:bg-[var(--hover-bg)] border border-[var(--border-color)] rounded-lg transition-colors"
        >
          Send Password Reset Link
        </button>
      </div>

      {/* Appearance Section */}
      <div className="bg-[var(--main-bg)] rounded-xl border border-[var(--border-color)] p-6 space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-[var(--primary-text)]">
          <Moon className="w-4 h-4 text-[var(--secondary-text)]" />
          <span>Theme Selection</span>
        </div>

        <div className="grid grid-cols-3 gap-3 max-w-md">
          <button
            type="button"
            onClick={() => setTheme('light')}
            className={`p-3 rounded-lg border text-center transition-all ${
              theme === 'light'
                ? 'border-[var(--primary-text)] bg-[var(--hover-bg)] text-[var(--primary-text)] font-semibold shadow-xs'
                : 'border-[var(--border-color)] hover:bg-[var(--hover-bg)] text-[var(--secondary-text)]'
            }`}
          >
            <Sun className="w-4 h-4 mx-auto mb-1.5 text-[var(--primary-text)]" />
            <span className="text-xs">Light</span>
          </button>

          <button
            type="button"
            onClick={() => setTheme('dark')}
            className={`p-3 rounded-lg border text-center transition-all ${
              theme === 'dark'
                ? 'border-[var(--primary-text)] bg-[var(--hover-bg)] text-[var(--primary-text)] font-semibold shadow-xs'
                : 'border-[var(--border-color)] hover:bg-[var(--hover-bg)] text-[var(--secondary-text)]'
            }`}
          >
            <Moon className="w-4 h-4 mx-auto mb-1.5 text-[var(--primary-text)]" />
            <span className="text-xs">Dark</span>
          </button>

          <button
            type="button"
            onClick={() => setTheme('system')}
            className={`p-3 rounded-lg border text-center transition-all ${
              theme === 'system'
                ? 'border-[var(--primary-text)] bg-[var(--hover-bg)] text-[var(--primary-text)] font-semibold shadow-xs'
                : 'border-[var(--border-color)] hover:bg-[var(--hover-bg)] text-[var(--secondary-text)]'
            }`}
          >
            <Monitor className="w-4 h-4 mx-auto mb-1.5 text-[var(--secondary-text)]" />
            <span className="text-xs">System</span>
          </button>
        </div>
      </div>

      {/* Data Management & Reset Section */}
      <div className="bg-[var(--main-bg)] rounded-xl border border-[var(--border-color)] p-6 space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-[var(--primary-text)]">
          <Trash2 className="w-4 h-4 text-rose-500" />
          <span>Data Management & Reset</span>
        </div>
        <p className="text-xs text-[var(--secondary-text)]">
          Clear your subjects, timetable slots, syllabus topics, and lesson history. Official academic holidays and your login credentials will remain intact.
        </p>

        {clearSuccess && (
          <div className="p-3 bg-[var(--subtle-surface)] border border-[var(--border-color)] rounded-lg text-xs text-[var(--primary-text)] flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span>{clearSuccess}</span>
          </div>
        )}

        <button
          type="button"
          onClick={() => {
            if (window.confirm('Are you sure you want to clear all your subjects, timetables, and syllabus progress? This action cannot be undone.')) {
              clearAllUserData();
              setClearSuccess('All teaching data and syllabus records have been cleared.');
              setTimeout(() => setClearSuccess(null), 4000);
            }
          }}
          className="px-4 py-2 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-lg transition-colors"
        >
          Clear All Teaching Data
        </button>
      </div>

      {/* Logout button */}
      <div className="pt-2">
        <button
          onClick={logout}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign Out of CampusFlow
        </button>
      </div>
    </div>
  );
};
