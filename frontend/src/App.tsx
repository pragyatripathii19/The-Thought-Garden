import { useState, useEffect, useMemo } from 'react';
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
import { LocalGardenUploadCard } from './components/LocalGardenUploadCard';
import { AuthProvider, useAuth, hasSignedInHereBefore } from './context/AuthContext';
import { AuthView, AuthStatusScreen } from './views/AuthView';
import { LandingView } from './views/LandingView';
import { SignedOutScreen, hashForScreen, initialScreen, screenFromHash } from './lib/signedOutScreen';
import { createApiRepositories, importGardenOnServer } from './storage/api';

function AppContent() {
  const [activeTab, setActiveTab] = useState<NavTab>('garden');
  const [isNewThoughtModalOpen, setIsNewThoughtModalOpen] = useState(false);
  const { setIsAdminModalOpen, setIsFeedbackModalOpen, isAdmin } = useThoughts();

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
      if (isAdmin && (e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
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
  }, [isAdmin, setIsAdminModalOpen, setIsFeedbackModalOpen]);

  return (
    <div className="min-h-screen flex flex-col md:flex-row font-sans text-garden-ink">
      {/* Desktop Sidebar (>= md) */}
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Right Content Column */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Top Header (Search & Avatar on Desktop, Full Header on Mobile) */}
        <TopHeader activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Main Content Area */}
        <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 md:py-8 pb-24 md:pb-12">
          <LocalGardenUploadCard />
          {activeTab === 'garden' && (
            <GardenView
              onNavigateTab={setActiveTab}
              onOpenNewThought={() => setIsNewThoughtModalOpen(true)}
            />
          )}
          {activeTab === 'thoughts' && <AllThoughtsView />}
          {activeTab === 'collections' && <CollectionsView onNavigateTab={setActiveTab} />}
          {activeTab === 'search' && <SearchView onNavigateTab={setActiveTab} />}
          {activeTab === 'saved' && <SavedView onNavigateTab={setActiveTab} />}
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

/** The signed-in app. Remounted per account so nothing carries over between users. */
function SignedInApp() {
  const repositories = useMemo(() => createApiRepositories(), []);
  return (
    <StorageProvider
      {...repositories}
      importGarden={importGardenOnServer}
      seedStarterCollections={false}
      refreshOnFocus
    >
      <OrganizerProvider>
        <AppContent />
      </OrganizerProvider>
    </StorageProvider>
  );
}

/**
 * Landing page, sign-up or log-in. The screen lives in the URL hash (#signup, #login),
 * so the browser's back button returns to the landing page.
 */
function SignedOutApp() {
  const [screen, setScreen] = useState<SignedOutScreen>(() =>
    initialScreen(window.location.hash, hasSignedInHereBefore())
  );

  useEffect(() => {
    // Returning visitors open on Log in; record that in the URL without adding a history step.
    window.history.replaceState(window.history.state, '', urlFor(screen));
    const sync = () => setScreen(screenFromHash(window.location.hash));
    window.addEventListener('popstate', sync);
    window.addEventListener('hashchange', sync);
    return () => {
      window.removeEventListener('popstate', sync);
      window.removeEventListener('hashchange', sync);
    };
  }, []);

  const go = (next: SignedOutScreen, replace = false) => {
    if (replace) window.history.replaceState(window.history.state, '', urlFor(next));
    else window.history.pushState(null, '', urlFor(next));
    setScreen(next);
    window.scrollTo(0, 0);
  };

  if (screen === 'landing') return <LandingView onStart={() => go('signup')} onLogin={() => go('login')} />;
  return (
    <AuthView
      mode={screen}
      onModeChange={(mode) => go(mode, true)}
      onShowLanding={() => go('landing')}
    />
  );
}

function urlFor(screen: SignedOutScreen) {
  return window.location.pathname + window.location.search + hashForScreen(screen);
}

function AuthGate() {
  const { status, user, retry } = useAuth();

  // Drop #login / #signup from the address once someone is in.
  useEffect(() => {
    if (user && screenFromHash(window.location.hash) !== 'landing') {
      window.history.replaceState(window.history.state, '', urlFor('landing'));
    }
  }, [user]);

  if (status === 'loading' || status === 'unreachable') {
    return <AuthStatusScreen status={status} onRetry={retry} />;
  }
  if (status === 'signed-out' || !user) return <SignedOutApp />;
  return <SignedInApp key={user.id} />;
}

export function App() {
  return (
    <AuthProvider>
      <AuthGate />
    </AuthProvider>
  );
}

export default App;
