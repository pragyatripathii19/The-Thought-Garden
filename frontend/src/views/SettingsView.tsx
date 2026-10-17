import React, { useState, useRef } from 'react';
import { Download, Upload, Shield, HardDrive, AlertTriangle, LogOut, UserRound } from 'lucide-react';
import { useThoughts } from '../context/StorageContext';
import { useAuth } from '../context/AuthContext';
import { ImportBackupModal } from '../components/ImportBackupModal';
import { OrganizingSettingsCard } from '../components/OrganizingSettingsCard';

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
    <div className="space-y-6 pb-16 max-w-2xl mx-auto">
      <div className="border-b border-[#eee9dc] pb-4">
        <h2 className="font-serif text-2xl font-bold text-[#233126] tracking-tight">
          Data & Settings
        </h2>
        <p className="text-xs text-[#718273] mt-0.5">
          Manage your personal garden data and backups
        </p>
      </div>

      {/* Storage Architecture Notice */}
      <div className="bg-[#f2f7f3] border border-[#d6e5d8] rounded-2xl p-5 shadow-xs">
        <div className="flex items-start gap-3.5">
          <div className="w-9 h-9 rounded-xl bg-[#3d5a45] text-white flex items-center justify-center shrink-0">
            <Shield className="w-5 h-5" />
          </div>
          <div className="space-y-1.5">
            <h3 className="font-serif text-base font-semibold text-[#233126]">
              Saved to your account
            </h3>
            <p className="text-xs text-[#596d5e] leading-relaxed">
              Your thoughts, collections and connections are stored in your account on the Thought Garden server, so
              they're safe if you clear this browser and they appear on any device you log in from. Only you can see
              them in the app; whoever runs the server can access the database. The admin dashboard shows counts
              only, never what you wrote.
            </p>
            <p className="text-xs text-[#596d5e] leading-relaxed">
              Smart organising (on unless you turned it off below) also sends new thoughts to an AI service to sort
              them.
            </p>
          </div>
        </div>
      </div>

      {/* Automatic organising */}
      <OrganizingSettingsCard />

      {/* Data Backup & Restore */}
      <div className="bg-white border border-[#e2dcd0] rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
        <h3 className="font-serif text-lg font-semibold text-[#233126]">
          Data Portability
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* Export */}
          <div className="p-4 rounded-xl bg-[#faf8f4] border border-[#e4ded0] flex flex-col justify-between min-h-[140px]">
            <div>
              <div className="flex items-center gap-2 text-[#233126] font-medium text-xs mb-1">
                <Download className="w-4 h-4 text-[#3d5a45]" />
                <span>Export Garden</span>
              </div>
              <p className="text-xs text-[#718273] leading-relaxed mb-3">
                Download a full JSON backup of thoughts, connections, and collections.
              </p>
            </div>
            <button
              type="button"
              onClick={exportBackup}
              className="w-full inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-[#3d5a45] hover:bg-[#344e3b] text-white rounded-xl text-xs font-semibold shadow-xs transition-transform active:scale-95"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export as JSON</span>
            </button>
          </div>

          {/* Import */}
          <div className="p-4 rounded-xl bg-[#faf8f4] border border-[#e4ded0] flex flex-col justify-between min-h-[140px]">
            <div>
              <div className="flex items-center gap-2 text-[#233126] font-medium text-xs mb-1">
                <Upload className="w-4 h-4 text-[#3d5a45]" />
                <span>Import Backup</span>
              </div>
              <p className="text-xs text-[#718273] leading-relaxed mb-3">
                Restore a previously exported Thought Garden backup safely.
              </p>
            </div>
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
              className="w-full inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-white hover:bg-[#f6f4ee] border border-[#e4ded0] text-[#233126] rounded-xl text-xs font-semibold shadow-xs transition-transform active:scale-95"
            >
              <Upload className="w-3.5 h-3.5 text-[#738274]" />
              <span>Choose Backup File</span>
            </button>
          </div>
        </div>
      </div>

      {/* Storage Information */}
      <div className="bg-white border border-[#e2dcd0] rounded-2xl p-5 sm:p-6 shadow-xs">
        <h3 className="font-serif text-lg font-semibold text-[#233126] mb-3.5 flex items-center gap-2">
          <HardDrive className="w-4 h-4 text-[#738274]" />
          <span>Storage Information</span>
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="p-3 rounded-xl bg-[#faf8f4] border border-[#e4ded0]">
            <div className="text-xl font-serif font-bold text-[#233126]">{thoughts.length}</div>
            <div className="text-[11px] text-[#718273] mt-0.5">Thoughts</div>
          </div>
          <div className="p-3 rounded-xl bg-[#faf8f4] border border-[#e4ded0]">
            <div className="text-xl font-serif font-bold text-[#233126]">{collections.length}</div>
            <div className="text-[11px] text-[#718273] mt-0.5">Collections</div>
          </div>
          <div className="p-3 rounded-xl bg-[#faf8f4] border border-[#e4ded0]">
            <div className="text-xl font-serif font-bold text-[#233126]">{connections.length}</div>
            <div className="text-[11px] text-[#718273] mt-0.5">Connections</div>
          </div>
          <div className="p-3 rounded-xl bg-[#faf8f4] border border-[#e4ded0]">
            <div className="text-base font-serif font-bold text-[#233126] truncate">Your account</div>
            <div className="text-[11px] text-[#718273] mt-0.5">Stored in</div>
          </div>
        </div>
      </div>

      {/* Pilot Admin & Telemetry Card */}
      <div className="bg-white border border-[#e2dcd0] rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h3 className="font-serif text-lg font-semibold text-[#233126] flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-[#edf5ee] text-[#34593e] flex items-center justify-center text-xs">
                🌱
              </span>
              <span>{isAdmin ? 'Pilot Testing & Admin' : 'Feedback & Profile'}</span>
            </h3>
            <p className="text-xs text-[#718273] leading-relaxed">
              {isAdmin
                ? 'Track who registered, thoughts planted per day, and feedback submitted by pilot testers.'
                : 'Tell us what works and what doesn\u2019t, or update how we greet you.'}
            </p>
          </div>
          {isAdmin && (
            <span className="text-[10px] font-mono text-[#8a998c] bg-[#f5f2e9] px-2 py-1 rounded-md border border-[#e5dfd2]">
              Ctrl + Shift + A
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-2.5 pt-1">
          {isAdmin && (
            <button
              type="button"
              onClick={() => setIsAdminModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#344e3b] hover:bg-[#2b4131] text-white rounded-xl text-xs font-semibold shadow-xs transition-transform active:scale-95"
            >
              <span>Open Pilot Admin Dashboard</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsFeedbackModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#edf5ee] hover:bg-[#e0ebe2] text-[#34593e] border border-[#d4e4d7] rounded-xl text-xs font-semibold shadow-2xs transition-colors"
          >
            <span>🌱 Give Feedback</span>
          </button>

          <button
            type="button"
            onClick={() => setIsOnboardingOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-[#f6f4ee] border border-[#e4ded0] text-[#4d5d4f] rounded-xl text-xs font-medium transition-colors"
          >
            <span>Edit Profile & Intent</span>
          </button>
        </div>
      </div>

      {/* Account */}
      <div className="bg-white border border-[#e2dcd0] rounded-2xl p-5 sm:p-6 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-[#edf5ee] text-[#34593e] flex items-center justify-center shrink-0">
            <UserRound className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h3 className="font-serif text-base font-semibold text-[#233126]">Account</h3>
            <p className="text-xs text-[#718273] truncate">Signed in as {userProfile?.email}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-[#f6f4ee] border border-[#e4ded0] text-[#233126] rounded-xl text-xs font-semibold disabled:opacity-50"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>{isLoggingOut ? 'Logging out\u2026' : 'Log out'}</span>
        </button>
      </div>

      {/* Danger Zone: Account Deletion */}
      <div className="bg-[#fff8f8] border border-[#f3d6d6] rounded-2xl p-5 sm:p-6 shadow-xs space-y-3">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-red-100 text-red-700 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3 className="font-serif text-base font-semibold text-red-950">
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
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-transform active:scale-95"
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#233126]/60 backdrop-blur-sm animate-fade-in"
          onClick={closeDeleteDialog}
        >
          <form
            onSubmit={runDelete}
            className="bg-white border border-[#eed0d0] rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="font-serif text-lg font-bold text-red-950">
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
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#f1c9c9] text-sm text-[#233126] focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
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
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#546255] hover:bg-[#f3f0e8] transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isDeleting || !deletePassword}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-xs transition-transform active:scale-95"
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
