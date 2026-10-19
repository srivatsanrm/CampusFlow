import React, { useState, useEffect } from 'react';

interface WelcomeSplashProps {
  onFinish: () => void;
  durationMs?: number;
}

/**
 * Minimal Welcome Splash Animation
 * - Displays "Welcome back to CampusFlow" as plain, elegant typography.
 * - Minimalist ChatGPT style, theme-aware (uses CSS variables).
 * - Fades in smoothly, holds for approximately 4 seconds total, then fades out elegantly.
 * - Respects prefers-reduced-motion.
 * - Plays only once per full application load.
 */
export const WelcomeSplash: React.FC<WelcomeSplashProps> = ({
  onFinish,
  durationMs = 4000,
}) => {
  const [stage, setStage] = useState<'entering' | 'holding' | 'leaving'>('entering');

  useEffect(() => {
    // Check prefers-reduced-motion
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches) {
      onFinish();
      return;
    }

    // Step 1: Smooth, graceful fade in (over first 800ms)
    const enterTimer = setTimeout(() => {
      setStage('holding');
    }, 800);

    // Step 2: Smooth, elegant fade out before the finish (800ms fade out)
    const leaveTimer = setTimeout(() => {
      setStage('leaving');
    }, Math.max(800, durationMs - 800));

    // Step 3: Finish and seamlessly unmount overlay
    const finishTimer = setTimeout(() => {
      onFinish();
    }, durationMs);

    return () => {
      clearTimeout(enterTimer);
      clearTimeout(leaveTimer);
      clearTimeout(finishTimer);
    };
  }, [durationMs, onFinish]);

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        backgroundColor: 'var(--main-bg)',
        color: 'var(--primary-text)',
      }}
      className={`fixed inset-0 z-50 flex items-center justify-center select-none transition-opacity duration-800 ease-in-out ${
        stage === 'leaving' ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div
        className={`text-center px-6 transition-all duration-800 ease-in-out ${
          stage === 'entering'
            ? 'opacity-0 translate-y-1.5 scale-[0.99]'
            : stage === 'leaving'
            ? 'opacity-0 translate-y-[-2px] scale-[1.005]'
            : 'opacity-100 translate-y-0 scale-100'
        }`}
      >
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-normal tracking-tight text-[var(--primary-text)] font-sans antialiased">
          Welcome back to <span className="font-semibold">CampusFlow</span>
        </h1>
      </div>
    </div>
  );
};
