import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { AuthPortal } from '@/components/auth/AuthPortal';
import { Sidebar, NavTab } from '@/components/layout/Sidebar';
import { Header } from '@/components/common/Header';
import { DashboardView } from '@/components/dashboard/DashboardView';
import { TimetableView } from '@/components/timetable/TimetableView';
import { SubjectsListView } from '@/components/subjects/SubjectsListView';
import { SubjectDetailView } from '@/components/subjects/SubjectDetailView';
import { AcademicCalendarView } from '@/components/calendar/AcademicCalendarView';
import { HolidayAdminView } from '@/components/admin/HolidayAdminView';
import { SettingsView } from '@/components/settings/SettingsView';
import { NewSubjectModal } from '@/components/subjects/NewSubjectModal';
import { WelcomeSplash } from '@/components/common/WelcomeSplash';
import { Subject } from '@/types/database';

export const App: React.FC = () => {
  const { user, loading } = useAuth();

  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [newSubjectModalOpen, setNewSubjectModalOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Welcome splash animation state - only runs once per initial application load
  const [showSplash, setShowSplash] = useState<boolean>(() => {
    // Only show if user has not yet seen it during this session
    return !sessionStorage.getItem('campusflow_splash_seen');
  });

  const handleSplashFinish = () => {
    try {
      sessionStorage.setItem('campusflow_splash_seen', 'true');
    } catch (e) {
      // Ignore storage errors in restricted contexts
    }
    setShowSplash(false);
  };

  // Loading state (clean, no logo as per criteria)
  if (loading) {
    return (
      <div
        style={{ backgroundColor: 'var(--main-bg)', color: 'var(--primary-text)' }}
        className="min-h-screen flex flex-col items-center justify-center transition-colors"
      >
        <div
          style={{ borderColor: 'var(--border-color)', borderTopColor: 'var(--primary-text)' }}
          className="w-5 h-5 border-2 rounded-full animate-spin mb-3"
        />
        <p className="text-[13px] text-[var(--secondary-text)] font-medium">
          Loading...
        </p>
      </div>
    );
  }

  // 1. Unauthenticated: Strict Auth Portal Gate
  if (!user) {
    return <AuthPortal />;
  }

  // 2. Authenticated App Layout
  const getHeaderTitle = (): { title: string; subtitle?: string } => {
    if (selectedSubject) {
      return {
        title: selectedSubject.name,
        subtitle: `${selectedSubject.class_programme} — Section ${selectedSubject.section}`,
      };
    }
    switch (activeTab) {
      case 'dashboard':
        return {
          title: 'Dashboard',
        };
      case 'timetable':
        return {
          title: 'Timetable',
        };
      case 'subjects':
        return {
          title: 'Subjects',
        };
      case 'calendar':
        return {
          title: 'Calendar',
        };
      case 'admin-holidays':
        return {
          title: 'Holiday Admin',
          subtitle: 'Central calendar holidays',
        };
      case 'settings':
        return {
          title: 'Settings',
        };
    }
  };

  const headerInfo = getHeaderTitle();

  return (
    <div
      style={{ backgroundColor: 'var(--main-bg)', color: 'var(--primary-text)' }}
      className="min-h-screen flex transition-colors"
    >
      {/* Sidebar navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setSelectedSubject(null);
          setActiveTab(tab);
        }}
        mobileOpen={mobileSidebarOpen}
        setMobileOpen={setMobileSidebarOpen}
        collapsed={sidebarCollapsed}
        onToggleCollapsed={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main content view */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          title={headerInfo.title}
          subtitle={headerInfo.subtitle}
          onOpenMobileMenu={() => setMobileSidebarOpen(true)}
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
          isSidebarCollapsed={sidebarCollapsed}
          onNavigateSettings={() => {
            setSelectedSubject(null);
            setActiveTab('settings');
          }}
        />

        <main className="flex-1 overflow-y-auto">
          {selectedSubject ? (
            <SubjectDetailView
              subject={selectedSubject}
              onBack={() => setSelectedSubject(null)}
            />
          ) : (
            <>
              {activeTab === 'dashboard' && (
                <DashboardView
                  onNavigateTab={(tab) => setActiveTab(tab)}
                  onSelectSubject={(sub) => setSelectedSubject(sub)}
                  onOpenNewSubjectModal={() => setNewSubjectModalOpen(true)}
                />
              )}
              {activeTab === 'timetable' && (
                <TimetableView
                  onSelectSubject={(sub) => setSelectedSubject(sub)}
                  onOpenNewSubjectModal={() => setNewSubjectModalOpen(true)}
                />
              )}
              {activeTab === 'subjects' && (
                <SubjectsListView
                  onSelectSubject={(sub) => setSelectedSubject(sub)}
                />
              )}
              {activeTab === 'calendar' && <AcademicCalendarView />}
              {activeTab === 'admin-holidays' && <HolidayAdminView />}
              {activeTab === 'settings' && <SettingsView />}
            </>
          )}
        </main>
      </div>

      {/* Global New Subject Modal */}
      <NewSubjectModal
        isOpen={newSubjectModalOpen}
        onClose={() => setNewSubjectModalOpen(false)}
        onCreated={(sub) => {
          setSelectedSubject(sub);
        }}
      />

      {/* Subtle initial welcome animation */}
      {showSplash && <WelcomeSplash onFinish={handleSplashFinish} />}
    </div>
  );
};
