import { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { TopHeader } from './components/TopHeader';
import { MobileBottomNav } from './components/MobileBottomNav';
import { NewThoughtModal } from './components/NewThoughtModal';
import { GardenView } from './views/GardenView';
import { CollectionsView } from './views/CollectionsView';
import { SearchView } from './views/SearchView';
import { SavedView } from './views/SavedView';
import { SettingsView } from './views/SettingsView';
import { AllThoughtsView } from './views/AllThoughtsView';
import { StorageProvider } from './context/StorageContext';
import { NavTab } from './types';

import { OnboardingModal } from './components/OnboardingModal';
import { FeedbackModal } from './components/FeedbackModal';
import { AdminPilotModal } from './components/AdminPilotModal';
import { useThoughts } from './context/StorageContext';
import { OrganizerProvider } from './context/OrganizerContext';
import { OrganizeToast } from './components/OrganizeToast';

function AppContent() {
  const [activeTab, setActiveTab] = useState<NavTab>('garden');
  const [isNewThoughtModalOpen, setIsNewThoughtModalOpen] = useState(false);
  const { setIsAdminModalOpen, setIsFeedbackModalOpen } = useThoughts();

  // Global keyboard shortcuts:
  // - Ctrl + N: New Thought
  // - Ctrl + Shift + A: Admin Panel
  // - Ctrl + Shift + F: Feedback
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        setIsNewThoughtModalOpen(true);
      }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        e.preventDefault();
        setIsAdminModalOpen(true);
      }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'F' || e.key === 'f')) {
        e.preventDefault();
        setIsFeedbackModalOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setIsAdminModalOpen, setIsFeedbackModalOpen]);

  return (
    <div className="min-h-screen bg-[#faf8f4] flex flex-col md:flex-row font-sans text-[#233126]">
      {/* Desktop Sidebar (>= md) */}
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Right Content Column */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Top Header (Search & Avatar on Desktop, Full Header on Mobile) */}
        <TopHeader activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Main Content Area */}
        <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 md:py-8 pb-24 md:pb-12">
          {activeTab === 'garden' && (
            <GardenView
              onNavigateTab={setActiveTab}
              onOpenNewThought={() => setIsNewThoughtModalOpen(true)}
            />
          )}
          {activeTab === 'thoughts' && <AllThoughtsView />}
          {activeTab === 'collections' && <CollectionsView onNavigateTab={setActiveTab} />}
          {activeTab === 'search' && <SearchView onNavigateTab={setActiveTab} />}
          {activeTab === 'saved' && <SavedView />}
          {activeTab === 'settings' && <SettingsView />}
        </main>
      </div>

      {/* Mobile Fixed Bottom Navigation Bar (< md) */}
      <MobileBottomNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenNewThought={() => setIsNewThoughtModalOpen(true)}
      />

      {/* Dedicated "New Thought" Modal */}
      <NewThoughtModal
        isOpen={isNewThoughtModalOpen}
        onClose={() => setIsNewThoughtModalOpen(false)}
      />

      {/* Automatic organising notice with Undo */}
      <OrganizeToast />

      {/* Pilot Modals */}
      <OnboardingModal />
      <FeedbackModal />
      <AdminPilotModal />
    </div>
  );
}

export function App() {
  return (
    <StorageProvider>
      <OrganizerProvider>
        <AppContent />
      </OrganizerProvider>
    </StorageProvider>
  );
}

export default App;
