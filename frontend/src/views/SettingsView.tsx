import { Download, Upload, Shield, HardDrive, AlertTriangle } from 'lucide-react';

export const SettingsView: React.FC = () => {
  return (
    <div className="space-y-8 pb-16 max-w-3xl mx-auto">
      <div>
        <h2 className="font-serif text-3xl font-semibold text-earth-900 tracking-tight">
          Data & Settings
        </h2>
        <p className="text-sm text-stone-400 mt-1">
          Manage your personal garden data and backups
        </p>
      </div>

      {/* Storage Architecture Notice */}
      <div className="bg-sage-50/70 border border-sage-200/80 rounded-3xl p-6 sm:p-7 shadow-soft">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-sage-600 text-white flex items-center justify-center flex-shrink-0">
            <Shield className="w-5 h-5" />
          </div>
          <div className="space-y-2">
            <h3 className="font-serif text-lg font-semibold text-earth-900">
              Local-First & Completely Private
            </h3>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
              The Thought Garden stores all data inside your browser using IndexedDB. No accounts, no tracking, and no thoughts are ever uploaded to any server or cloud database.
            </p>
            <div className="flex items-center gap-2 pt-1 text-xs text-amber-800 font-medium">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span>Clearing browser history or cookies may erase your local data. Export regular backups below.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Data Backup & Restore */}
      <div className="bg-white border border-parchment-border rounded-3xl p-6 sm:p-8 shadow-soft space-y-6">
        <h3 className="font-serif text-xl font-semibold text-earth-900">
          Data Portability
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Export */}
          <div className="p-5 rounded-2xl bg-parchment-soft/50 border border-parchment-border flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-earth-900 font-medium mb-1">
                <Download className="w-4 h-4 text-sage-600" />
                <span>Export Garden</span>
              </div>
              <p className="text-xs text-stone-400 leading-relaxed mb-4">
                Download a full JSON backup of all your thoughts, connections, and collections.
              </p>
            </div>
            <button
              type="button"
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-sage-600 hover:bg-sage-700 text-white rounded-xl text-xs font-semibold shadow-soft transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Export as JSON</span>
            </button>
          </div>

          {/* Import */}
          <div className="p-5 rounded-2xl bg-parchment-soft/50 border border-parchment-border flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-earth-900 font-medium mb-1">
                <Upload className="w-4 h-4 text-sage-600" />
                <span>Import Backup</span>
              </div>
              <p className="text-xs text-stone-400 leading-relaxed mb-4">
                Restore a previously exported Thought Garden backup with validation safeguards.
              </p>
            </div>
            <button
              type="button"
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white hover:bg-parchment-soft border border-parchment-border text-earth-800 rounded-xl text-xs font-semibold shadow-soft transition-all"
            >
              <Upload className="w-4 h-4 text-stone-500" />
              <span>Choose Backup File</span>
            </button>
          </div>
        </div>
      </div>

      {/* Storage Information */}
      <div className="bg-white border border-parchment-border rounded-3xl p-6 sm:p-8 shadow-soft">
        <h3 className="font-serif text-xl font-semibold text-earth-900 mb-4 flex items-center gap-2">
          <HardDrive className="w-5 h-5 text-stone-400" />
          <span>Storage Information</span>
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-center">
          <div className="p-4 rounded-xl bg-parchment-soft/40 border border-parchment-border/60">
            <div className="text-2xl font-serif font-bold text-earth-900">0</div>
            <div className="text-xs text-stone-400 mt-1">Saved Thoughts</div>
          </div>
          <div className="p-4 rounded-xl bg-parchment-soft/40 border border-parchment-border/60">
            <div className="text-2xl font-serif font-bold text-earth-900">0</div>
            <div className="text-xs text-stone-400 mt-1">Collections</div>
          </div>
          <div className="p-4 rounded-xl bg-parchment-soft/40 border border-parchment-border/60 col-span-2 sm:col-span-1">
            <div className="text-2xl font-serif font-bold text-earth-900">IndexedDB</div>
            <div className="text-xs text-stone-400 mt-1">Storage Engine</div>
          </div>
        </div>
      </div>
    </div>
  );
};
