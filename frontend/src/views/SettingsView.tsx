import React, { useState, useRef } from 'react';
import { Download, Upload, AlertTriangle, LogOut, UserRound } from 'lucide-react';
import { useThoughts } from '../context/StorageContext';
import { useAuth } from '../context/AuthContext';
import { ImportBackupModal } from '../components/ImportBackupModal';
import { OrganizingSettingsCard } from '../components/OrganizingSettingsCard';
import { LeafLogoIcon } from '../components/BotanicalIllustrations';
import { GardenGuide } from '../components/GardenGuide';

export const SettingsView: React.FC = () => {
  const {
    thoughts,
    collections,
    connections,
    exportBackup,
    setIsAdminModalOpen,
    setIsFeedbackModalOpen,
    setIsOnboardingOpen,
    deleteAccount,
    userProfile,
    isAdmin,
  } = useThoughts();
  const { logout } = useAuth();
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deletePassword, setDeletePassword] = useState('');
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const runDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deletePassword || isDeleting) return;
    try {
      setIsDeleting(true);
      setDeleteError(null);
      // On success the account is gone and the app returns to the sign-up screen.
      await deleteAccount(deletePassword);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Something went wrong. Nothing was deleted.');
      setIsDeleting(false);
    }
  };

  const closeDeleteDialog = () => {
    if (isDeleting) return;
    setIsConfirmDeleteOpen(false);
    setDeleteError(null);
    setDeletePassword('');
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
    } catch {
      setIsLoggingOut(false);
    }
  };
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setIsImportModalOpen(true);
    }
    e.target.value = '';
  };

  const handleOpenImport = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    } else {
      setIsImportModalOpen(true);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      <div className="pb-1">
        <h2 className="font-serif text-[36px] sm:text-[42px] leading-tight font-semibold text-garden-ink tracking-tight">
          Settings
        </h2>
        <p className="text-sm text-garden-ink-soft mt-1">How your garden works, organising, your data and your account</p>
      </div>

      {/* About the garden (formerly Learn & Explore), including how thoughts grow */}
      <GardenGuide />

      {/* Automatic organising */}
      <OrganizingSettingsCard />

      {/* Your data: counts, export and import */}
      <div className="bg-garden-card border border-garden-line rounded-2xl p-5 sm:p-6 space-y-4">
        <h3 className="font-serif text-2xl font-semibold text-garden-ink">Your data</h3>

        <div className="grid grid-cols-3 gap-3 text-center">
          {[
            { label: 'Thoughts', value: thoughts.length },
            { label: 'Collections', value: collections.length },
            { label: 'Connections', value: connections.length },
          ].map((stat) => (
            <div key={stat.label} className="p-3 rounded-xl bg-[#FDFBF3] border border-garden-line">
              <div className="text-[26px] font-serif font-semibold text-garden-ink tabular-nums">{stat.value}</div>
              <div className="text-[11px] text-garden-ink-soft mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={exportBackup}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-garden-moss hover:bg-garden-moss-dark text-garden-paper rounded-full text-sm font-semibold transition-transform active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span>Export backup</span>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            accept=".json,application/json"
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            type="button"
            onClick={handleOpenImport}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-garden-card hover:bg-garden-paper-deep border border-garden-line text-garden-ink rounded-full text-sm font-semibold transition-transform active:scale-95"
          >
            <Upload className="w-4 h-4 text-garden-ink-soft" />
            <span>Import backup</span>
          </button>
          <span className="text-xs text-garden-ink-faint">A JSON file of your thoughts, collections and connections.</span>
        </div>
      </div>

      {/* Pilot Admin & Telemetry Card */}
      <div className="bg-garden-card border border-garden-line rounded-2xl p-5 sm:p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h3 className="font-serif text-2xl font-semibold text-garden-ink flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-garden-pill/60 text-garden-moss flex items-center justify-center text-xs">
                <LeafLogoIcon className="w-3.5 h-3.5" />
              </span>
              <span>{isAdmin ? 'Pilot Testing & Admin' : 'Feedback & Profile'}</span>
            </h3>
            <p className="text-xs text-garden-ink-soft leading-relaxed">
              {isAdmin
                ? 'Track who registered, thoughts planted per day, and feedback submitted by pilot testers.'
                : 'Tell us what works and what doesn\u2019t, or update how we greet you.'}
            </p>
          </div>
          {isAdmin && (
            <span className="text-[10px] font-mono text-garden-ink-faint bg-garden-paper-deep px-2 py-1 rounded-md border border-garden-line">
              Ctrl + Shift + A
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-2.5 pt-1">
          {isAdmin && (
            <button
              type="button"
              onClick={() => setIsAdminModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-garden-moss hover:bg-garden-moss-dark text-garden-paper rounded-full text-xs font-semibold transition-transform active:scale-95"
            >
              <span>Open Pilot Admin Dashboard</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsFeedbackModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-garden-pill/60 hover:bg-garden-pill/60 text-garden-moss border border-[#CBD5AE] rounded-xl text-xs font-semibold transition-colors"
          >
            <LeafLogoIcon className="w-3.5 h-3.5" />
            <span>Give Feedback</span>
          </button>

          <button
            type="button"
            onClick={() => setIsOnboardingOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-garden-card hover:bg-garden-paper-deep border border-garden-line text-garden-ink-soft rounded-xl text-xs font-medium transition-colors"
          >
            <span>Edit Profile & Intent</span>
          </button>
        </div>
      </div>

      {/* Account */}
      <div className="bg-garden-card border border-garden-line rounded-2xl p-5 sm:p-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-garden-pill/60 text-garden-moss flex items-center justify-center shrink-0">
            <UserRound className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h3 className="font-serif text-xl font-semibold text-garden-ink">Account</h3>
            <p className="text-xs text-garden-ink-soft truncate">Signed in as {userProfile?.email}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-garden-card hover:bg-garden-paper-deep border border-garden-line text-garden-ink rounded-xl text-xs font-semibold disabled:opacity-50"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>{isLoggingOut ? 'Logging out\u2026' : 'Log out'}</span>
        </button>
      </div>

      {/* Danger Zone: Account Deletion */}
      <div className="bg-[#fff8f8] border border-[#f3d6d6] rounded-2xl p-5 sm:p-6 space-y-3">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-red-100 text-red-700 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3 className="font-serif text-xl font-semibold text-red-950">
              Danger Zone: Delete Account
            </h3>
            <p className="text-xs text-[#825454] leading-relaxed">
              Permanently delete your account and everything in it from the server: all thoughts, collections,
              connections and feedback. Export a backup first if you might want them later.
            </p>
          </div>
        </div>

        <div className="pt-2">
          <button
            type="button"
            onClick={() => setIsConfirmDeleteOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-garden-paper rounded-xl text-xs font-semibold transition-transform active:scale-95"
          >
            <span>Delete Account</span>
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {isConfirmDeleteOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 !m-0 z-50 flex items-center justify-center p-4 bg-garden-ink/60 backdrop-blur-sm animate-fade-in"
          onClick={closeDeleteDialog}
        >
          <form
            onSubmit={runDelete}
            className="bg-garden-card border border-[#eed0d0] rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="font-serif text-2xl font-semibold text-red-950">
                Are you absolutely sure?
              </h3>
              <p className="text-xs text-[#6e5858] leading-relaxed">
                This action is permanent and cannot be undone:
              </p>
            </div>

            <ul className="text-xs text-[#715454] space-y-2 bg-[#fdf2f2] p-3.5 rounded-2xl border border-[#f5dada]">
              <li className="flex items-start gap-2">
                <span className="text-red-500 font-bold">&bull;</span>
                <span>All <strong>{thoughts.length} thoughts</strong> will be deleted from your account.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500 font-bold">&bull;</span>
                <span>All custom collections and connections will be wiped clean.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500 font-bold">&bull;</span>
                <span>Your account and feedback will be deleted, and you'll be logged out everywhere.</span>
              </li>
            </ul>

            <div className="space-y-1.5">
              <label htmlFor="delete-password" className="block text-xs font-semibold text-[#715454]">
                Enter your password to confirm
              </label>
              <input
                id="delete-password"
                type="password"
                autoComplete="current-password"
                autoFocus
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-garden-card border border-[#f1c9c9] text-sm text-garden-ink focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
              />
            </div>

            {deleteError && (
              <p role="alert" className="text-xs text-[#7a2e2e] bg-[#fff1f1] border border-[#f1c9c9] rounded-2xl p-3.5">
                {deleteError}
              </p>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={closeDeleteDialog}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-garden-ink-soft hover:bg-garden-paper-deep transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isDeleting || !deletePassword}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-garden-paper rounded-xl text-xs font-semibold transition-transform active:scale-95"
              >
                <span>{isDeleting ? 'Deleting everything\u2026' : 'Yes, delete my account'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Import Backup Modal */}
      <ImportBackupModal
        isOpen={isImportModalOpen}
        onClose={() => {
          setIsImportModalOpen(false);
          setSelectedFile(null);
        }}
        initialFile={selectedFile}
      />
    </div>
  );
};
