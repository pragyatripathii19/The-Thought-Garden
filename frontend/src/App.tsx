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
import { StorageProvider } from './context/StorageContext';
import { NavTab } from './types';

export function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('garden');
  const [isNewThoughtModalOpen, setIsNewThoughtModalOpen] = useState(false);

  // Global keyboard shortcut: 'Ctrl + N' opens New Thought modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        setIsNewThoughtModalOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <StorageProvider>
      <div className="min-h-screen bg-[#faf8f4] flex flex-col md:flex-row font-sans text-[#233126]">
        {/* Desktop Sidebar (>= md) */}
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Right Content Column */}
        <div className="flex-1 flex flex-col min-w-0 min-h-screen">
          {/* Top Header (Search & PT Avatar on Desktop, Full Header on Mobile) */}
          <TopHeader activeTab={activeTab} onTabChange={setActiveTab} />

          {/* Main Content Area */}
          <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 md:py-8 pb-24 md:pb-12">
            {activeTab === 'garden' && (
              <GardenView
                onNavigateTab={setActiveTab}
                onOpenNewThought={() => setIsNewThoughtModalOpen(true)}
              />
            )}
            {activeTab === 'collections' && <CollectionsView />}
            {activeTab === 'search' && <SearchView />}
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
      </div>
    </StorageProvider>
  );
}

export default App;
