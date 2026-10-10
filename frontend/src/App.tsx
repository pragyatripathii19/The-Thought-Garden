import { useState } from 'react';
import { Header } from './components/Header';
import { GardenView } from './views/GardenView';
import { CollectionsView } from './views/CollectionsView';
import { SearchView } from './views/SearchView';
import { SettingsView } from './views/SettingsView';
import { StorageProvider } from './context/StorageContext';
import { NavTab } from './types';

export function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('garden');

  return (
    <StorageProvider>
      <div className="min-h-screen bg-parchment flex flex-col font-sans text-earth-800">
      {/* Top Navigation & Local Status */}
      <Header activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Main View Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {activeTab === 'garden' && <GardenView />}
        {activeTab === 'collections' && <CollectionsView />}
        {activeTab === 'search' && <SearchView />}
        {activeTab === 'settings' && <SettingsView />}
      </main>

      {/* Footer */}
      <footer className="border-t border-parchment-border py-6 text-center text-xs text-stone-400">
        <p>The Thought Garden &bull; Plant a thought. Let the garden grow.</p>
      </footer>
    </div>
    </StorageProvider>
  );
}

export default App;
