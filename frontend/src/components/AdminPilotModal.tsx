import React, { useState, useEffect } from 'react';
import {
  X,
  Shield,
  Lock,
  Users,
  Sprout,
  MessageSquare,
  Activity,
  Download,
  Copy,
  Check,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { useThoughts } from '../context/StorageContext';
import { AdminOverviewData } from '../types';
import { fetchAdminOverview } from '../lib/pilotApi';
import { generatePilotSummaryReport } from '../lib/analytics';

export const AdminPilotModal: React.FC = () => {
  const { isAdminModalOpen, setIsAdminModalOpen, thoughts, userProfile, feedbacks: localFeedbacks } = useThoughts();
  const [passcode, setPasscode] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [data, setData] = useState<AdminOverviewData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Auto-login if previously saved in session
  useEffect(() => {
    if (isAdminModalOpen) {
      const savedPass = sessionStorage.getItem('thought_garden_admin_pass');
      if (savedPass) {
        setPasscode(savedPass);
        handleLoadOverview(savedPass);
      }
    }
  }, [isAdminModalOpen]);

  if (!isAdminModalOpen) return null;

  const handleLoadOverview = async (codeToUse?: string) => {
    const code = codeToUse || passcode;
    if (!code) return;

    try {
      setIsLoading(true);
      setError(null);
      const res = await fetchAdminOverview(code);
      setData(res);
      setIsAuthenticated(true);
      sessionStorage.setItem('thought_garden_admin_pass', code);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopySummary = () => {
    const report = generatePilotSummaryReport(userProfile, thoughts, data?.feedback || localFeedbacks);
    navigator.clipboard.writeText(report);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadJson = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      adminOverview: data,
      localGardenThoughtsCount: thoughts.length,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pilot-garden-diagnostic-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-[#233126]/60 backdrop-blur-sm animate-fade-in"
      onClick={() => setIsAdminModalOpen(false)}
    >
      <div
        className="bg-[#faf8f4] border border-[#e3ded2] rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-[#eee9dc] bg-[#f5f2e9]/70 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#3d5a45] text-white flex items-center justify-center shadow-xs">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 id="admin-title" className="font-serif text-xl font-bold text-[#233126]">
                Pilot Insights & Admin
              </h2>
              <p className="text-xs text-[#6e7d70]">
                Live telemetry, usage trends & pilot feedback
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAuthenticated && (
              <button
                type="button"
                onClick={() => handleLoadOverview()}
                disabled={isLoading}
                className="p-2 text-[#5e6f60] hover:text-[#233126] hover:bg-[#ede8dc] rounded-xl transition-colors"
                title="Refresh Overview"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsAdminModalOpen(false)}
              className="p-2 text-[#7a877a] hover:text-[#233126] hover:bg-[#ede8dc] rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {!isAuthenticated ? (
            /* Passcode Gate */
            <div className="max-w-sm mx-auto my-8 p-6 bg-white border border-[#e2dcd0] rounded-3xl shadow-sm text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[#edf5ee] text-[#3d5a45] flex items-center justify-center mx-auto">
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-serif text-lg font-medium text-[#233126]">
                  Enter Admin Passcode
                </h3>
                <p className="text-xs text-[#718273] mt-1">
                  Default passcode is <code className="px-1.5 py-0.5 bg-[#f3f0e8] rounded font-mono text-[11px]">garden-admin-2026</code>
                </p>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs text-left">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleLoadOverview();
                }}
                className="space-y-3"
              >
                <input
                  type="password"
                  placeholder="Admin passcode"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#ded8cb] text-[#233126] text-sm focus:outline-hidden focus:border-[#4a6b53] focus:ring-2 focus:ring-[#e2ede4]"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={!passcode || isLoading}
                  className="w-full py-2.5 rounded-xl bg-[#344e3b] hover:bg-[#2b4131] disabled:opacity-40 text-white font-medium text-xs sm:text-sm shadow-xs transition-colors"
                >
                  {isLoading ? 'Authenticating…' : 'Unlock Admin Dashboard'}
                </button>
              </form>
            </div>
          ) : data ? (
            /* Authenticated Overview Dashboard */
            <>
              {/* Top KPI Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                <div className="p-4 rounded-2xl bg-white border border-[#e4ded0] shadow-xs space-y-1">
                  <div className="flex items-center justify-between text-[#718273]">
                    <span className="text-xs font-semibold uppercase tracking-wider">Pilot Users</span>
                    <Users className="w-4 h-4 text-[#3d5a45]" />
                  </div>
                  <div className="text-2xl font-serif font-bold text-[#233126]">
                    {data.summary.totalUsers}
                  </div>
                  <div className="text-[11px] text-[#556958]">Registered accounts</div>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-[#e4ded0] shadow-xs space-y-1">
                  <div className="flex items-center justify-between text-[#718273]">
                    <span className="text-xs font-semibold uppercase tracking-wider">Thoughts Logged</span>
                    <Sprout className="w-4 h-4 text-[#3d5a45]" />
                  </div>
                  <div className="text-2xl font-serif font-bold text-[#233126]">
                    {data.summary.totalThoughtsLogged}
                  </div>
                  <div className="text-[11px] text-[#556958]">Across all pilot users</div>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-[#e4ded0] shadow-xs space-y-1">
                  <div className="flex items-center justify-between text-[#718273]">
                    <span className="text-xs font-semibold uppercase tracking-wider">Feedback Items</span>
                    <MessageSquare className="w-4 h-4 text-[#3d5a45]" />
                  </div>
                  <div className="text-2xl font-serif font-bold text-[#233126]">
                    {data.summary.totalFeedback}
                  </div>
                  <div className="text-[11px] text-[#556958]">Submitted messages</div>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-[#e4ded0] shadow-xs space-y-1">
                  <div className="flex items-center justify-between text-[#718273]">
                    <span className="text-xs font-semibold uppercase tracking-wider">Active Today</span>
                    <Activity className="w-4 h-4 text-[#3d5a45]" />
                  </div>
                  <div className="text-2xl font-serif font-bold text-[#233126]">
                    {data.summary.activeToday}
                  </div>
                  <div className="text-[11px] text-[#556958]">Users active today</div>
                </div>
              </div>

              {/* Thoughts Per Day Chart */}
              <div className="p-5 rounded-2xl bg-white border border-[#e4ded0] shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-serif text-base font-semibold text-[#233126] flex items-center gap-2">
                    <Activity className="w-4 h-4 text-[#3d5a45]" />
                    <span>Thoughts Planted Per Day (All Users)</span>
                  </h3>
                  <span className="text-xs text-[#718273]">Daily Activity</span>
                </div>

                {data.thoughtsPerDayAgg.length === 0 ? (
                  <p className="text-xs text-[#8c9c8e] italic py-4 text-center">
                    No thoughts logged yet. Plant thoughts to see daily activity.
                  </p>
                ) : (
                  <div className="space-y-2 pt-2">
                    <div className="flex items-end gap-2 h-36 px-2 border-b border-[#eee9dc]">
                      {data.thoughtsPerDayAgg.map((item) => {
                        const maxVal = Math.max(...data.thoughtsPerDayAgg.map((x) => x.total_thoughts), 1);
                        const heightPct = Math.max(Math.round((item.total_thoughts / maxVal) * 100), 10);
                        return (
                          <div
                            key={item.date}
                            className="flex-1 flex flex-col items-center gap-1 group relative h-full justify-end"
                          >
                            <span className="text-[10px] font-mono text-[#526354] opacity-0 group-hover:opacity-100 transition-opacity">
                              {item.total_thoughts}
                            </span>
                            <div
                              style={{ height: `${heightPct}%` }}
                              className="w-full max-w-[28px] rounded-t-lg bg-[#53775c] group-hover:bg-[#344e3b] transition-all shadow-xs"
                              title={`${item.date}: ${item.total_thoughts} thoughts (${item.active_users} active users)`}
                            />
                            <span className="text-[9px] font-mono text-[#8b9b8d] truncate w-full text-center">
                              {item.date.slice(5)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Registered Pilot Users Table */}
              <div className="p-5 rounded-2xl bg-white border border-[#e4ded0] shadow-xs space-y-3">
                <h3 className="font-serif text-base font-semibold text-[#233126] flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#3d5a45]" />
                  <span>Registered Pilot Users ({data.users.length})</span>
                </h3>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[#eee9dc] text-[#6d7f6f]">
                        <th className="pb-2 font-semibold">User Name</th>
                        <th className="pb-2 font-semibold">Goal / Intent</th>
                        <th className="pb-2 font-semibold">Email</th>
                        <th className="pb-2 font-semibold">Joined Date</th>
                        <th className="pb-2 font-semibold">Last Active</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f4f0e6]">
                      {data.users.map((u) => (
                        <tr key={u.id} className="hover:bg-[#faf8f4] transition-colors">
                          <td className="py-2.5 font-medium text-[#233126]">{u.name}</td>
                          <td className="py-2.5">
                            <div className="flex flex-wrap gap-1">
                              {u.reasons?.map((r, i) => (
                                <span
                                  key={i}
                                  className="text-[10px] px-2 py-0.5 rounded-full bg-[#edf5ee] text-[#34593e] border border-[#d5e7d8]"
                                >
                                  {r}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="py-2.5 text-[#6e7d70]">{u.email || '—'}</td>
                          <td className="py-2.5 text-[#6e7d70]">
                            {new Date(u.createdAt).toLocaleDateString()}
                          </td>
                          <td className="py-2.5 text-[#6e7d70]">
                            {u.lastActiveAt ? new Date(u.lastActiveAt).toLocaleDateString() : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Feedback Inbox */}
              <div className="p-5 rounded-2xl bg-white border border-[#e4ded0] shadow-xs space-y-3">
                <h3 className="font-serif text-base font-semibold text-[#233126] flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-[#3d5a45]" />
                  <span>Pilot Feedback Inbox ({data.feedback.length})</span>
                </h3>

                {data.feedback.length === 0 ? (
                  <p className="text-xs text-[#8c9c8e] italic py-3">No feedback received yet.</p>
                ) : (
                  <div className="space-y-2.5">
                    {data.feedback.map((fb) => (
                      <div
                        key={fb.id}
                        className="p-3.5 rounded-xl bg-[#faf8f4] border border-[#e4ded0] space-y-1.5"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-[#233126]">{fb.userName || 'Anonymous'}</span>
                            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#edf5ee] text-[#34593e] border border-[#d2e4d5]">
                              {fb.category}
                            </span>
                            <span className="text-xs">{'🌿'.repeat(fb.rating)}</span>
                          </div>
                          <span className="text-[11px] text-[#788779]">
                            {new Date(fb.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-xs text-[#28392b] leading-relaxed whitespace-pre-wrap">
                          {fb.message}
                        </p>
                        {fb.email && (
                          <div className="text-[10px] text-[#6d7e70]">Contact: {fb.email}</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>

        {/* Footer with Diagnostic Export Buttons */}
        {isAuthenticated && (
          <div className="p-4 sm:p-5 border-t border-[#eee9dc] bg-[#f5f2e9]/70 flex flex-wrap items-center justify-between gap-3 shrink-0">
            <span className="text-xs text-[#6e7d70]">
              Passcode authenticated &bull; Real-time SQLite sync
            </span>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={handleCopySummary}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-[#faf8f4] border border-[#ded8cb] rounded-xl text-xs font-semibold text-[#233126] shadow-xs transition-transform active:scale-95"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-[#5e6f60]" />}
                <span>{copied ? 'Copied to Clipboard!' : 'Copy Summary'}</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadJson}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#344e3b] hover:bg-[#2b4131] text-white rounded-xl text-xs font-semibold shadow-xs transition-transform active:scale-95"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export JSON Report</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
