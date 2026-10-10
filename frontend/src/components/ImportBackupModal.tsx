import React, { useState, useEffect } from 'react';
import { validateGardenBackup, GardenBackupV1, ImportStats } from '../lib/portability';
import { useThoughts } from '../context/StorageContext';

interface ImportBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialFile?: File | null;
}

export const ImportBackupModal: React.FC<ImportBackupModalProps> = ({
  isOpen,
  onClose,
  initialFile = null,
}) => {
  const { importBackup } = useThoughts();

  const [file, setFile] = useState<File | null>(initialFile);
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [validBackup, setValidBackup] = useState<GardenBackupV1 | null>(null);
  const [strategy, setStrategy] = useState<'merge' | 'replace'>('merge');
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [importSuccess, setImportSuccess] = useState<ImportStats | null>(null);

  useEffect(() => {
    if (initialFile) {
      setFile(initialFile);
      parseAndValidateFile(initialFile);
    } else {
      setFile(null);
      setValidBackup(null);
      setValidationError(null);
      setImportSuccess(null);
    }
  }, [initialFile, isOpen]);

  const parseAndValidateFile = async (f: File) => {
    setIsValidating(true);
    setValidationError(null);
    setValidBackup(null);
    setImportSuccess(null);

    try {
      const content = await f.text();
      const result = validateGardenBackup(content);
      if (result.valid && result.backup) {
        setValidBackup(result.backup);
      } else {
        setValidationError(result.error || 'Failed to validate backup file.');
      }
    } catch (err) {
      setValidationError(err instanceof Error ? err.message : 'Could not read file.');
    } finally {
      setIsValidating(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      parseAndValidateFile(selected);
    }
  };

  const handleImport = async () => {
    if (!validBackup) return;

    try {
      setIsImporting(true);
      const stats = await importBackup(validBackup, strategy);
      setImportSuccess(stats);
      setTimeout(() => {
        onClose();
      }, 1400);
    } catch (err) {
      setValidationError(err instanceof Error ? err.message : 'Error restoring backup.');
    } finally {
      setIsImporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="import-backup-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#233126]/40 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-[#fcfbf7] border border-[#e2dcce] rounded-2xl w-full max-w-lg p-6 shadow-xl relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-[#eee9dc] mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#e8efe9] flex items-center justify-center text-[#4a6b53]">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                />
              </svg>
            </div>
            <h2 id="import-backup-title" className="font-serif text-xl font-medium text-[#253227]">
              Restore Garden Data
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-[#7c8779] hover:text-[#2d3a2e] transition-colors p-1 rounded-lg hover:bg-[#ede9dc]"
            aria-label="Close modal"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {importSuccess ? (
          <div className="py-6 text-center space-y-3">
            <div className="w-12 h-12 mx-auto rounded-full bg-[#e8efe9] text-[#4a6b53] flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="font-serif text-lg font-medium text-[#2d3a2e]">
              Garden restored successfully
            </p>
            <p className="text-xs text-[#556354]">
              Added {importSuccess.thoughtsAdded} thoughts, {importSuccess.collectionsAdded} collections, and {importSuccess.connectionsAdded} connections.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* File selection if not selected */}
            {!file && (
              <div>
                <label className="block text-xs font-medium text-[#556354] mb-1.5">
                  Select Backup JSON File
                </label>
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={handleFileChange}
                  className="block w-full text-xs text-[#556354] file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-medium file:bg-[#ede9dc] file:text-[#4a6b53] hover:file:bg-[#e2dcce] cursor-pointer"
                />
              </div>
            )}

            {isValidating && (
              <div className="py-4 text-center text-xs text-[#7c8779]">
                Verifying backup file integrity...
              </div>
            )}

            {/* Validation error banner */}
            {validationError && (
              <div className="p-3.5 bg-[#fbf2ed] border border-[#eccdc1] rounded-xl text-xs text-[#a9442b] flex items-start gap-2.5">
                <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <div className="font-medium">Cannot import file</div>
                  <div className="mt-0.5 text-[#8b3823]">{validationError}</div>
                  <div className="mt-1 text-[11px] text-[#8b3823]/80">Existing garden data remains completely untouched.</div>
                </div>
              </div>
            )}

            {/* Valid backup preview */}
            {validBackup && (
              <div className="space-y-4">
                <div className="bg-[#f5f3ec] border border-[#e5dfd2] rounded-xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between text-xs text-[#556354]">
                    <span className="font-medium text-[#2d3a2e]">File: {file?.name}</span>
                    <span>Version {validBackup.version}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#ebe5d6] text-center">
                    <div className="bg-[#fcfbf7] p-2 rounded-lg border border-[#e8e2d4]">
                      <div className="font-serif text-base font-medium text-[#2d3a2e]">
                        {validBackup.garden.thoughts.length}
                      </div>
                      <div className="text-[11px] text-[#7c8779]">Thoughts</div>
                    </div>
                    <div className="bg-[#fcfbf7] p-2 rounded-lg border border-[#e8e2d4]">
                      <div className="font-serif text-base font-medium text-[#2d3a2e]">
                        {validBackup.garden.collections.length}
                      </div>
                      <div className="text-[11px] text-[#7c8779]">Collections</div>
                    </div>
                    <div className="bg-[#fcfbf7] p-2 rounded-lg border border-[#e8e2d4]">
                      <div className="font-serif text-base font-medium text-[#2d3a2e]">
                        {validBackup.garden.connections.length}
                      </div>
                      <div className="text-[11px] text-[#7c8779]">Connections</div>
                    </div>
                  </div>
                  {validBackup.exportedAt && (
                    <div className="text-[11px] text-[#7c8779] pt-1">
                      Exported on {new Date(validBackup.exportedAt).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  )}
                </div>

                {/* Import Strategy Selection */}
                <div className="space-y-2">
                  <span className="block text-xs font-medium text-[#2d3a2e]">Choose Import Method</span>
                  <div className="space-y-2">
                    <label
                      className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                        strategy === 'merge'
                          ? 'border-[#4a6b53] bg-[#f0f4f1]'
                          : 'border-[#e2dcce] bg-[#fcfbf7] hover:bg-[#f7f5ed]'
                      }`}
                    >
                      <input
                        type="radio"
                        name="import-strategy"
                        value="merge"
                        checked={strategy === 'merge'}
                        onChange={() => setStrategy('merge')}
                        className="mt-0.5 text-[#4a6b53] focus:ring-[#4a6b53]"
                      />
                      <div>
                        <div className="text-xs font-medium text-[#2d3a2e]">
                          Merge (Recommended)
                        </div>
                        <div className="text-[11px] text-[#556354] mt-0.5">
                          Adds backup thoughts and collections alongside your current garden without overwriting or creating duplicates.
                        </div>
                      </div>
                    </label>

                    <label
                      className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                        strategy === 'replace'
                          ? 'border-[#b85d39] bg-[#fdf5f2]'
                          : 'border-[#e2dcce] bg-[#fcfbf7] hover:bg-[#f7f5ed]'
                      }`}
                    >
                      <input
                        type="radio"
                        name="import-strategy"
                        value="replace"
                        checked={strategy === 'replace'}
                        onChange={() => setStrategy('replace')}
                        className="mt-0.5 text-[#b85d39] focus:ring-[#b85d39]"
                      />
                      <div>
                        <div className="text-xs font-medium text-[#b85d39]">
                          Replace Entire Garden
                        </div>
                        <div className="text-[11px] text-[#7c8779] mt-0.5">
                          Erases current garden data and restores exactly what is inside this backup file.
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#eee9dc]">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-xs font-medium text-[#556354] hover:text-[#2d3a2e] rounded-xl hover:bg-[#ede9dc] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleImport}
                    disabled={isImporting}
                    className={`px-4 py-2 text-xs font-medium text-white rounded-xl shadow-sm transition-all disabled:opacity-50 ${
                      strategy === 'replace'
                        ? 'bg-[#b85d39] hover:bg-[#a24e2d]'
                        : 'bg-[#4a6b53] hover:bg-[#3d5844]'
                    }`}
                  >
                    {isImporting
                      ? 'Restoring...'
                      : strategy === 'replace'
                      ? 'Replace & Restore'
                      : 'Merge into Garden'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
