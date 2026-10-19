import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Eye, EyeOff, Lock, Mail, User, AlertCircle, CheckCircle2 } from 'lucide-react';

export const AuthPortal: React.FC = () => {
  const { login, register, resetPasswordRequest } = useAuth();
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');

  // Form states
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Status states
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetFormState = () => {
    setError(null);
    setSuccess(null);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetFormState();
    if (!email || !password) {
      setError('Please provide your email and password.');
      return;
    }

    setIsSubmitting(true);
    const res = await login(email, password);
    setIsSubmitting(false);

    if (!res.success) {
      setError(res.error || 'Failed to sign in. Please check your credentials.');
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetFormState();

    if (!fullName.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (!email || !email.includes('@')) {
      setError('Please enter a valid academic or professional email address.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    const res = await register(fullName.trim(), email.trim(), password);
    setIsSubmitting(false);

    if (!res.success) {
      setError(res.error || 'Failed to register account.');
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetFormState();

    if (!email) {
      setError('Please enter your registered email address.');
      return;
    }

    setIsSubmitting(true);
    const res = await resetPasswordRequest(email.trim());
    setIsSubmitting(false);

    if (res.success) {
      setSuccess('Password reset link sent! Check your email inbox for instructions.');
    } else {
      setError(res.error || 'Failed to send password reset email.');
    }
  };

  // Quick fill demo teacher credentials for instant testing in development
  const handleQuickDemoTeacher = () => {
    setEmail('prof.sharma@college.edu');
    setPassword('teacher123');
  };

  return (
    <div
      style={{ backgroundColor: 'var(--main-bg)', color: 'var(--primary-text)' }}
      className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 transition-colors"
    >
      <div className="sm:mx-auto sm:w-full sm:max-w-sm text-center">
        <h1 className="text-[22px] font-semibold tracking-tight text-[var(--primary-text)]">
          Welcome back
        </h1>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-sm">
        <div
          style={{
            backgroundColor: 'var(--main-bg)',
            borderColor: 'var(--border-color)',
          }}
          className="py-8 px-6 border rounded-xl sm:px-8"
        >
          {/* Header tabs for Sign in vs Register */}
          {mode !== 'forgot' && (
            <div
              style={{ borderColor: 'var(--border-color)' }}
              className="flex border-b mb-6"
            >
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  resetFormState();
                }}
                className={`flex-1 pb-2.5 text-[13.5px] font-medium text-center border-b-2 transition-all ${
                  mode === 'login'
                    ? 'border-[var(--primary-text)] text-[var(--primary-text)] font-semibold'
                    : 'border-transparent text-[var(--secondary-text)] hover:text-[var(--primary-text)]'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  resetFormState();
                }}
                className={`flex-1 pb-2.5 text-[13.5px] font-medium text-center border-b-2 transition-all ${
                  mode === 'register'
                    ? 'border-[var(--primary-text)] text-[var(--primary-text)] font-semibold'
                    : 'border-transparent text-[var(--secondary-text)] hover:text-[var(--primary-text)]'
                }`}
              >
                Create Account
              </button>
            </div>
          )}

          {/* Feedback banners */}
          {error && (
            <div
              style={{
                backgroundColor: 'var(--hover-bg)',
                borderColor: 'var(--border-color)',
              }}
              className="mb-5 p-3 rounded-lg border flex items-start gap-2.5 text-xs text-rose-600 dark:text-rose-400"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div
              style={{
                backgroundColor: 'var(--hover-bg)',
                borderColor: 'var(--border-color)',
              }}
              className="mb-5 p-3 rounded-lg border flex items-start gap-2.5 text-xs text-emerald-600 dark:text-emerald-400"
            >
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{success}</span>
            </div>
          )}

          {/* Mode: LOGIN */}
          {mode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[var(--secondary-text)] mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[var(--secondary-text)] absolute left-3 top-2.5 pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@college.edu"
                    style={{
                      backgroundColor: 'var(--input-bg)',
                      borderColor: 'var(--border-color)',
                      color: 'var(--primary-text)',
                    }}
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border placeholder-[var(--secondary-text)] focus:outline-none focus:ring-1 focus:ring-[var(--primary-text)] transition-all"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-medium text-[var(--secondary-text)]">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot');
                      resetFormState();
                    }}
                    className="text-[12px] text-[var(--secondary-text)] hover:text-[var(--primary-text)] underline"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[var(--secondary-text)] absolute left-3 top-2.5 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    style={{
                      backgroundColor: 'var(--input-bg)',
                      borderColor: 'var(--border-color)',
                      color: 'var(--primary-text)',
                    }}
                    className="w-full pl-9 pr-10 py-2 text-sm rounded-lg border placeholder-[var(--secondary-text)] focus:outline-none focus:ring-1 focus:ring-[var(--primary-text)] transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-[var(--secondary-text)] hover:text-[var(--primary-text)]"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center">
                <input
                  id="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 accent-neutral-800 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 text-xs text-[var(--secondary-text)]">
                  Remember my session securely
                </label>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  backgroundColor: 'var(--btn-primary-bg)',
                  color: 'var(--btn-primary-text)',
                }}
                className="w-full py-2.5 px-4 text-sm font-medium rounded-lg hover:opacity-90 focus:outline-none transition-opacity disabled:opacity-50"
              >
                {isSubmitting ? 'Signing in...' : 'Sign In'}
              </button>

              {/* Development Demo Login Helper */}
              {import.meta.env.DEV && (
                <div
                  style={{ borderColor: 'var(--border-color)' }}
                  className="mt-5 pt-4 border-t text-center"
                >
                  <span className="text-[11px] text-[var(--secondary-text)] uppercase tracking-wider font-semibold">
                    Demo Teacher
                  </span>
                  <div className="mt-2">
                    <button
                      type="button"
                      onClick={handleQuickDemoTeacher}
                      style={{
                        backgroundColor: 'var(--subtle-surface)',
                        borderColor: 'var(--border-color)',
                        color: 'var(--primary-text)',
                      }}
                      className="px-3 py-1.5 rounded-lg border text-xs font-medium hover:bg-[var(--hover-bg)] transition-colors"
                    >
                      Use Demo Account (Prof. Sharma)
                    </button>
                  </div>
                </div>
              )}
            </form>
          )}

          {/* Mode: REGISTER */}
          {mode === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[var(--secondary-text)] mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-[var(--secondary-text)] absolute left-3 top-2.5 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Prof. Ramesh Sharma"
                    style={{
                      backgroundColor: 'var(--input-bg)',
                      borderColor: 'var(--border-color)',
                      color: 'var(--primary-text)',
                    }}
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border placeholder-[var(--secondary-text)] focus:outline-none focus:ring-1 focus:ring-[var(--primary-text)] transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--secondary-text)] mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[var(--secondary-text)] absolute left-3 top-2.5 pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@college.edu"
                    style={{
                      backgroundColor: 'var(--input-bg)',
                      borderColor: 'var(--border-color)',
                      color: 'var(--primary-text)',
                    }}
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border placeholder-[var(--secondary-text)] focus:outline-none focus:ring-1 focus:ring-[var(--primary-text)] transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--secondary-text)] mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[var(--secondary-text)] absolute left-3 top-2.5 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    style={{
                      backgroundColor: 'var(--input-bg)',
                      borderColor: 'var(--border-color)',
                      color: 'var(--primary-text)',
                    }}
                    className="w-full pl-9 pr-10 py-2 text-sm rounded-lg border placeholder-[var(--secondary-text)] focus:outline-none focus:ring-1 focus:ring-[var(--primary-text)] transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-[var(--secondary-text)] hover:text-[var(--primary-text)]"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--secondary-text)] mb-1.5">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[var(--secondary-text)] absolute left-3 top-2.5 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your password"
                    style={{
                      backgroundColor: 'var(--input-bg)',
                      borderColor: 'var(--border-color)',
                      color: 'var(--primary-text)',
                    }}
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border placeholder-[var(--secondary-text)] focus:outline-none focus:ring-1 focus:ring-[var(--primary-text)] transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  backgroundColor: 'var(--btn-primary-bg)',
                  color: 'var(--btn-primary-text)',
                }}
                className="w-full py-2.5 px-4 text-sm font-medium rounded-lg hover:opacity-90 focus:outline-none transition-opacity disabled:opacity-50"
              >
                {isSubmitting ? 'Creating account...' : 'Create Account'}
              </button>
            </form>
          )}

          {/* Mode: FORGOT PASSWORD */}
          {mode === 'forgot' && (
            <form onSubmit={handleForgotSubmit} className="space-y-4">
              <div className="text-[14px] font-semibold text-[var(--primary-text)] mb-1">
                Reset your password
              </div>
              <p className="text-xs text-[var(--secondary-text)] leading-relaxed">
                Enter your registered academic email address.
              </p>

              <div>
                <label className="block text-xs font-medium text-[var(--secondary-text)] mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[var(--secondary-text)] absolute left-3 top-2.5 pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@college.edu"
                    style={{
                      backgroundColor: 'var(--input-bg)',
                      borderColor: 'var(--border-color)',
                      color: 'var(--primary-text)',
                    }}
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border placeholder-[var(--secondary-text)] focus:outline-none focus:ring-1 focus:ring-[var(--primary-text)] transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  backgroundColor: 'var(--btn-primary-bg)',
                  color: 'var(--btn-primary-text)',
                }}
                className="w-full py-2.5 px-4 text-sm font-medium rounded-lg hover:opacity-90 focus:outline-none transition-opacity disabled:opacity-50"
              >
                {isSubmitting ? 'Sending instructions...' : 'Send Reset Instructions'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  resetFormState();
                }}
                className="w-full text-center text-xs text-[var(--secondary-text)] hover:text-[var(--primary-text)] mt-2"
              >
                Back to Sign in
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
