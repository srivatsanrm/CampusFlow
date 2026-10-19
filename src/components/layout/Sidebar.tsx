import {
  LayoutDashboard,
  Clock,
  BookOpen,
  Calendar,
  Settings as SettingsIcon,
  Shield,
  PanelLeftClose,
  PanelLeft,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export type NavTab = 'dashboard' | 'timetable' | 'subjects' | 'calendar' | 'settings' | 'admin-holidays';

interface SidebarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  mobileOpen,
  setMobileOpen,
  collapsed = false,
  onToggleCollapsed,
}) => {
  const { user } = useAuth();

  const navItems = [
    { id: 'dashboard' as NavTab, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'timetable' as NavTab, label: 'Timetable', icon: Clock },
    { id: 'subjects' as NavTab, label: 'Subjects', icon: BookOpen },
    { id: 'calendar' as NavTab, label: 'Calendar', icon: Calendar },
    { id: 'settings' as NavTab, label: 'Settings', icon: SettingsIcon },
  ];

  if (user?.role === 'admin') {
    navItems.push({
      id: 'admin-holidays' as NavTab,
      label: 'Holiday Admin',
      icon: Shield,
    });
  }

  const handleNavClick = (tab: NavTab) => {
    setActiveTab(tab);
    setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 md:hidden transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar container */}
      <aside
        style={{
          backgroundColor: 'var(--sidebar-bg)',
          borderColor: 'var(--border-color)',
        }}
        className={`fixed md:sticky top-0 left-0 h-screen border-r flex flex-col z-50 transition-all duration-200 ease-in-out ${
          collapsed ? 'md:w-16 w-64' : 'w-64'
        } ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Top Header: ChatGPT-style minimal text brand + sidebar toggle */}
        <div
          style={{ borderColor: 'var(--border-color)' }}
          className="h-14 px-3.5 flex items-center justify-between border-b"
        >
          {!collapsed ? (
            <div className="flex items-center gap-2 px-1">
              <span className="text-[15px] font-semibold text-[var(--primary-text)] tracking-tight">
                CampusFlow
              </span>
            </div>
          ) : (
            <div />
          )}

          <div className="flex items-center">
            {onToggleCollapsed && (
              <button
                onClick={onToggleCollapsed}
                className="p-2 rounded-lg text-[var(--secondary-text)] hover:text-[var(--primary-text)] hover:bg-[var(--hover-bg)] transition-colors focus:outline-none"
                title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                {collapsed ? (
                  <PanelLeft className="w-4 h-4" />
                ) : (
                  <PanelLeftClose className="w-4 h-4" />
                )}
              </button>
            )}

            {/* Close button on mobile */}
            <button
              onClick={() => setMobileOpen(false)}
              className="md:hidden p-2 rounded-lg text-[var(--secondary-text)] hover:text-[var(--primary-text)] hover:bg-[var(--hover-bg)]"
              aria-label="Close sidebar"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Navigation items (clean, no "Menu" text) */}
        <nav className="flex-1 px-2 py-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                title={collapsed ? item.label : undefined}
                className={`w-full flex items-center ${
                  collapsed ? 'justify-center px-2 py-2.5' : 'gap-3 px-3 py-2'
                } rounded-lg text-[13.5px] font-medium transition-colors ${
                  isActive
                    ? 'bg-[var(--hover-bg)] text-[var(--primary-text)] font-semibold'
                    : 'text-[var(--secondary-text)] hover:bg-[var(--hover-bg)] hover:text-[var(--primary-text)]'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0 stroke-[1.75]" />
                {!collapsed && <span className="truncate">{item.label}</span>}
                {!collapsed && item.id === 'admin-holidays' && (
                  <span
                    style={{
                      borderColor: 'var(--border-color)',
                      color: 'var(--secondary-text)',
                    }}
                    className="ml-auto text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded border"
                  >
                    Admin
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </aside>
    </>
  );
};
