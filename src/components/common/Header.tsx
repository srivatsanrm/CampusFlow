import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { Moon, Sun, Monitor, LogOut, PanelLeft } from 'lucide-react';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onOpenMobileMenu?: () => void;
  onToggleSidebar?: () => void;
  isSidebarCollapsed?: boolean;
  onNavigateSettings?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  onOpenMobileMenu,
  onToggleSidebar,
  isSidebarCollapsed,
  onNavigateSettings,
}) => {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();

  return (
    <header
      style={{
        backgroundColor: 'var(--main-bg)',
        borderColor: 'var(--border-color)',
      }}
      className="h-14 px-4 sm:px-6 border-b flex items-center justify-between sticky top-0 z-30 transition-colors"
    >
      <div className="flex items-center gap-3">
        {/* Mobile menu button */}
        {onOpenMobileMenu && (
          <button
            onClick={onOpenMobileMenu}
            className="md:hidden p-2 text-[var(--secondary-text)] hover:text-[var(--primary-text)] hover:bg-[var(--hover-bg)] rounded-lg focus:outline-none"
            aria-label="Toggle navigation"
          >
            <PanelLeft className="w-4 h-4" />
          </button>
        )}

        {/* Collapsed sidebar expand button on desktop */}
        {isSidebarCollapsed && onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="hidden md:flex p-2 text-[var(--secondary-text)] hover:text-[var(--primary-text)] hover:bg-[var(--hover-bg)] rounded-lg focus:outline-none"
            title="Expand sidebar"
            aria-label="Expand sidebar"
          >
            <PanelLeft className="w-4 h-4" />
          </button>
        )}

        <div>
          <h1 className="text-[17px] font-semibold text-[var(--primary-text)] tracking-tight leading-none">
            {title}
          </h1>
          {subtitle && (
            <p className="text-[12px] text-[var(--secondary-text)] mt-0.5">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Theme segmented control */}
        <div
          style={{
            backgroundColor: 'var(--subtle-surface)',
            borderColor: 'var(--border-color)',
          }}
          className="flex items-center p-0.5 rounded-lg border"
        >
          <button
            onClick={() => setTheme('light')}
            className={`p-1.5 rounded-md text-xs transition-colors ${
              theme === 'light'
                ? 'bg-[var(--main-bg)] text-[var(--primary-text)] shadow-xs font-semibold'
                : 'text-[var(--secondary-text)] hover:text-[var(--primary-text)]'
            }`}
            title="Light mode"
            aria-label="Light mode"
          >
            <Sun className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setTheme('dark')}
            className={`p-1.5 rounded-md text-xs transition-colors ${
              theme === 'dark'
                ? 'bg-[var(--hover-bg)] text-[var(--primary-text)] shadow-xs font-semibold'
                : 'text-[var(--secondary-text)] hover:text-[var(--primary-text)]'
            }`}
            title="Dark mode"
            aria-label="Dark mode"
          >
            <Moon className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setTheme('system')}
            className={`p-1.5 rounded-md text-xs transition-colors ${
              theme === 'system'
                ? 'bg-[var(--main-bg)] text-[var(--primary-text)] shadow-xs font-semibold'
                : 'text-[var(--secondary-text)] hover:text-[var(--primary-text)]'
            }`}
            title="System theme"
            aria-label="System theme"
          >
            <Monitor className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* User profile button */}
        <button
          onClick={onNavigateSettings}
          title="Account Settings"
          aria-label="Account Settings"
          className="flex items-center gap-2 py-1 px-2 rounded-lg hover:bg-[var(--hover-bg)] text-[var(--primary-text)] transition-colors focus:outline-none"
        >
          <div
            style={{
              backgroundColor: 'var(--subtle-surface)',
              borderColor: 'var(--border-color)',
              color: 'var(--primary-text)',
            }}
            className="w-6 h-6 rounded-full border flex items-center justify-center font-medium text-[11px] uppercase"
          >
            {user?.full_name?.charAt(0) || 'P'}
          </div>
          <span className="text-[13px] font-medium hidden sm:inline truncate max-w-[120px]">
            {user?.full_name?.split(' ')[0] || 'Professor'}
          </span>
        </button>

        {/* Sign out button */}
        <button
          onClick={() => logout()}
          title="Sign out"
          aria-label="Sign out"
          className="p-1.5 text-[var(--secondary-text)] hover:text-[var(--primary-text)] hover:bg-[var(--hover-bg)] rounded-lg transition-colors focus:outline-none"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
