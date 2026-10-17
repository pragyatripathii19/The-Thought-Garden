import React, { useEffect, useState } from 'react';
import { UploadCloud, Download, X } from 'lucide-react';
import { useThoughts } from '../context/StorageContext';
import { Collection, Connection, Thought } from '../types';
import {
  IndexedDBThoughtRepository,
  IndexedDBCollectionRepository,
  IndexedDBConnectionRepository,
  IndexedDBOrganizeEventRepository,
} from '../storage';
import { downloadBackupFile, serializeGardenBackup, validateGardenBackup } from '../lib/portability';

interface LocalGarden {
  thoughts: Thought[];
  collections: Collection[];
  connections: Connection[];
}

/**
 * Before accounts existed, gardens lived only in this browser. If one is still
 * here, offer to add it to the signed-in account, then remove the local copy.
 */
export const LocalGardenUploadCard: React.FC = () => {
  const { importBackup } = useThoughts();
  const [local, setLocal] = useState<LocalGarden | null>(null);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'done' | 'dismissed'>('idle');
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      new IndexedDBThoughtRepository().getAll(),
      new IndexedDBCollectionRepository().getAll(),
      new IndexedDBConnectionRepository().getAll(),
    ])
      .then(([thoughts, collections, connections]) => {
        if (!cancelled && thoughts.length > 0) setLocal({ thoughts, collections, connections });
      })
      .catch(() => {
        // No local database (or it can't be opened): nothing to offer.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!local || status === 'dismissed') return null;

  const count = local.thoughts.length;

  const upload = async () => {
    const validation = validateGardenBackup(
      serializeGardenBackup(local.thoughts, local.collections, local.connections)
    );
    if (!validation.valid || !validation.backup) {
      setMessage(
        `Some of the saved thoughts couldn't be read (${validation.error || 'unknown problem'}). Download a copy and send it to whoever runs this garden.`
      );
      return;
    }
    try {
      setStatus('uploading');
      setMessage(null);
      const stats = await importBackup(validation.backup, 'merge');
      await Promise.all([
        new IndexedDBThoughtRepository().clear(),
        new IndexedDBCollectionRepository().clear(),
        new IndexedDBConnectionRepository().clear(),
        new IndexedDBOrganizeEventRepository().clear(),
      ]);
      setStatus('done');
      setMessage(
        `Added ${stats.thoughtsAdded} thought${stats.thoughtsAdded === 1 ? '' : 's'} to your account. The copy in this browser has been removed.`
      );
    } catch (err) {
      setStatus('idle');
      setMessage(
        `${err instanceof Error ? err.message : 'The upload failed.'} Nothing was removed from this browser; try again.`
      );
    }
  };

  return (
    <div className="mb-5 bg-[#f2f7f3] border border-[#d6e5d8] rounded-2xl p-4 sm:p-5 shadow-xs space-y-3" role="region" aria-label="Thoughts saved in this browser">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-[#3d5a45] text-white flex items-center justify-center shrink-0">
          <UploadCloud className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0 space-y-1">
          <h3 className="font-serif text-base font-semibold text-[#233126]">
            {status === 'done' ? 'Your earlier thoughts are in your account' : `${count} thought${count === 1 ? '' : 's'} saved in this browser`}
          </h3>
          <p className="text-xs text-[#596d5e] leading-relaxed">
            {message ||
              'These were saved here before accounts existed. Add them to your account so they are kept safe and show up on your other devices.'}
          </p>
        </div>
        {status !== 'uploading' && (
          <button
            type="button"
            onClick={() => setStatus('dismissed')}
            aria-label="Hide for now"
            className="p-1 text-[#7c8779] hover:text-[#2d3a2e] rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      {status !== 'done' && (
        <div className="flex flex-wrap gap-2 pl-12">
          <button
            type="button"
            onClick={upload}
            disabled={status === 'uploading'}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#344e3b] hover:bg-[#2b4131] disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-xs"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>{status === 'uploading' ? 'Adding…' : 'Add them to my account'}</span>
          </button>
          <button
            type="button"
            onClick={() => downloadBackupFile(local.thoughts, local.collections, local.connections)}
            disabled={status === 'uploading'}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-[#f6f4ee] border border-[#e4ded0] text-[#233126] rounded-xl text-xs font-semibold"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download a copy</span>
          </button>
        </div>
      )}
    </div>
  );
};
