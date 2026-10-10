import React, { useState, useRef } from 'react';
import { Download, Upload, Shield, HardDrive, AlertTriangle } from 'lucide-react';
import { useThoughts } from '../context/StorageContext';
import { ImportBackupModal } from '../components/ImportBackupModal';

export const SettingsView: React.FC = () => {
  const {
    thoughts,
    collections,
    connections,
    exportBackup,
    setIsAdminModalOpen,
    setIsFeedbackModalOpen,
    setIsOnboardingOpen,
  } = useThoughts();
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
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
              Local-First & Completely Private
            </h3>
            <p className="text-xs text-[#596d5e] leading-relaxed">
              The Thought Garden stores all data inside your browser using IndexedDB. No accounts, no tracking, and no thoughts are ever uploaded to any server or cloud database.
            </p>
            <div className="flex items-center gap-1.5 pt-1 text-[11px] text-amber-800 font-medium">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>Clearing browser cookies or cache may erase local data. Export regular backups below.</span>
            </div>
          </div>
        </div>
      </div>

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
            <div className="text-base font-serif font-bold text-[#233126] truncate">IndexedDB</div>
            <div className="text-[11px] text-[#718273] mt-0.5">Storage Engine</div>
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
              <span>Pilot Testing & Admin</span>
            </h3>
            <p className="text-xs text-[#718273] leading-relaxed">
              Track who registered, thoughts planted per day, and feedback submitted by pilot testers.
            </p>
          </div>
          <span className="text-[10px] font-mono text-[#8a998c] bg-[#f5f2e9] px-2 py-1 rounded-md border border-[#e5dfd2]">
            Ctrl + Shift + A
          </span>
        </div>

        <div className="flex flex-wrap gap-2.5 pt-1">
          <button
            type="button"
            onClick={() => setIsAdminModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#344e3b] hover:bg-[#2b4131] text-white rounded-xl text-xs font-semibold shadow-xs transition-transform active:scale-95"
          >
            <span>Open Pilot Admin Dashboard</span>
          </button>

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
