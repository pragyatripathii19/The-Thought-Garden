import React, { useState, useEffect } from 'react';
import {
  X,
  Shield,
  Users,
  Sprout,
  MessageSquare,
  Activity,
  Download,
  Copy,
  Check,
  RefreshCw,
  AlertCircle,
  Trash2,
  ChevronDown,
  ChevronUp,
  Flame,
  Calendar,
} from 'lucide-react';
import { useThoughts } from '../context/StorageContext';
import { AdminOverviewData, PilotUserProfile } from '../types';
import { fetchAdminOverview, adminDeletePilotUser } from '../lib/pilotApi';
import { generatePilotSummaryReport } from '../lib/analytics';
import { localDateKey } from '../lib/date';

export const AdminPilotModal: React.FC = () => {
  const { isAdminModalOpen, setIsAdminModalOpen, thoughts, userProfile, feedbacks: localFeedbacks } = useThoughts();
  const [data, setData] = useState<AdminOverviewData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [userToDelete, setUserToDelete] = useState<PilotUserProfile | null>(null);
  const [isDeletingUser, setIsDeletingUser] = useState(false);

  const handleLoadOverview = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setData(await fetchAdminOverview());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't load the dashboard");
    } finally {
      setIsLoading(false);
    }
  };

  // The signed-in account must be an admin (server-side ADMIN_EMAILS); no passcode.
  useEffect(() => {
    if (isAdminModalOpen) handleLoadOverview();
  }, [isAdminModalOpen]);

  if (!isAdminModalOpen) return null;

  const isAuthenticated = data !== null;

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    try {
      setIsDeletingUser(true);
      setError(null);
      await adminDeletePilotUser(userToDelete.id);
      const deletedId = userToDelete.id;
      setUserToDelete(null);
      if (expandedUserId === deletedId) {
        setExpandedUserId(null);
      }
      await handleLoadOverview();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete user');
    } finally {
      setIsDeletingUser(false);
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
    a.download = `pilot-garden-diagnostic-${localDateKey()}.json`;
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
          {!data ? (
            <div className="max-w-sm mx-auto my-8 p-6 bg-white border border-[#e2dcd0] rounded-3xl shadow-sm text-center space-y-4">
              {error ? (
                <>
                  <div className="flex items-center gap-2 p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs text-left">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleLoadOverview()}
                    disabled={isLoading}
                    className="w-full py-2.5 rounded-xl bg-[#344e3b] hover:bg-[#2b4131] disabled:opacity-40 text-white font-medium text-xs sm:text-sm shadow-xs transition-colors"
                  >
                    Try again
                  </button>
                </>
              ) : (
                <p className="text-sm text-[#718273]" role="status">Loading the dashboard…</p>
              )}
            </div>
          ) : (
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
                <div className="flex items-center justify-between">
                  <h3 className="font-serif text-base font-semibold text-[#233126] flex items-center gap-2">
                    <Users className="w-4 h-4 text-[#3d5a45]" />
                    <span>Registered Pilot Users ({data.users.length})</span>
                  </h3>
                  <span className="text-xs text-[#718273]">Live User Telemetry</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[#eee9dc] text-[#6d7f6f]">
                        <th className="pb-2 font-semibold">User</th>
                        <th className="pb-2 font-semibold">Goal / Intent</th>
                        <th className="pb-2 font-semibold">Thoughts</th>
                        <th className="pb-2 font-semibold">Streak</th>
                        <th className="pb-2 font-semibold">Last Active</th>
                        <th className="pb-2 font-semibold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f4f0e6]">
                      {data.users.map((u) => {
                        const isExpanded = expandedUserId === u.id;
                        return (
                          <React.Fragment key={u.id}>
                            <tr className="hover:bg-[#faf8f4] transition-colors">
                              <td className="py-2.5">
                                <div className="font-medium text-[#233126]">{u.name}</div>
                                <div className="text-[10px] text-[#788879]">{u.email || 'No email provided'}</div>
                              </td>
                              <td className="py-2.5 max-w-[200px]">
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
                              <td className="py-2.5">
                                <div className="inline-flex items-center gap-1 font-semibold text-[#2d4d33]">
                                  <Sprout className="w-3.5 h-3.5 text-[#3d5a45]" />
                                  <span>{u.totalThoughts || 0}</span>
                                </div>
                              </td>
                              <td className="py-2.5">
                                <div className="inline-flex items-center gap-1 text-amber-800 font-mono text-[11px]">
                                  <Flame className="w-3.5 h-3.5 text-amber-600" />
                                  <span>{u.streak ? `${u.streak}d` : '0d'}</span>
                                </div>
                              </td>
                              <td className="py-2.5 text-[#6e7d70]">
                                <div>{u.lastActiveAt ? new Date(u.lastActiveAt).toLocaleDateString() : '—'}</div>
                                <div className="text-[10px] text-[#8e9c8f]">
                                  Joined {new Date(u.createdAt).toLocaleDateString()}
                                </div>
                              </td>
                              <td className="py-2.5 text-right">
                                <div className="inline-flex items-center gap-1.5 justify-end">
                                  <button
                                    type="button"
                                    onClick={() => setExpandedUserId(isExpanded ? null : u.id)}
                                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-colors ${
                                      isExpanded
                                        ? 'bg-[#3d5a45] text-white border-[#3d5a45]'
                                        : 'bg-white hover:bg-[#f6f3eb] text-[#3e5241] border-[#ded8cb]'
                                    }`}
                                    title="View Activity Details"
                                  >
                                    <span>Activity</span>
                                    {isExpanded ? (
                                      <ChevronUp className="w-3 h-3" />
                                    ) : (
                                      <ChevronDown className="w-3 h-3" />
                                    )}
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => setUserToDelete(u)}
                                    className="p-1.5 text-[#88978a] hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    title={`Delete user ${u.name}`}
                                    aria-label={`Delete user ${u.name}`}
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>

                            {/* Expandable Per-User Activity Details */}
                            {isExpanded && (
                              <tr className="bg-[#f7f5ed]/90">
                                <td colSpan={6} className="p-4 space-y-3">
                                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#e8e2d4] pb-2">
                                    <div className="flex items-center gap-2">
                                      <span className="font-semibold text-xs text-[#233126]">
                                        Activity Telemetry: {u.name}
                                      </span>
                                      <span className="text-[10px] font-mono text-[#788879]">
                                        ID: {u.id}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs">
                                      <span className="px-2 py-0.5 rounded-full bg-[#e8efe9] text-[#2f5539] font-medium text-[11px]">
                                        🌱 Total: {u.totalThoughts || 0}
                                      </span>
                                      <span className="px-2 py-0.5 rounded-full bg-[#edf5ee] text-[#2f5539] font-medium text-[11px]">
                                        ☀️ Today: {u.thoughtsToday || 0}
                                      </span>
                                      <span className="px-2 py-0.5 rounded-full bg-[#fcedea] text-[#913b2e] font-medium text-[11px]">
                                        🔥 Streak: {u.streak || 0}d
                                      </span>
                                      <span className="px-2 py-0.5 rounded-full bg-[#edf1f8] text-[#2c4779] font-medium text-[11px]">
                                        💬 Feedback: {u.feedbackCount || 0}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                                    {/* Daily Log History */}
                                    <div className="bg-white p-3 rounded-xl border border-[#e4ded0] space-y-2">
                                      <span className="text-[11px] font-semibold text-[#4e6150] flex items-center gap-1.5">
                                        <Calendar className="w-3.5 h-3.5" />
                                        <span>Daily Activity History</span>
                                      </span>
                                      {!u.activityHistory || u.activityHistory.length === 0 ? (
                                        <p className="text-[11px] text-[#8e9c8f] italic py-1">
                                          No daily logs recorded yet.
                                        </p>
                                      ) : (
                                        <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
                                          {u.activityHistory.map((h, idx) => (
                                            <div
                                              key={idx}
                                              className="flex items-center justify-between text-[11px] py-1 px-2.5 rounded-lg bg-[#faf8f4] border border-[#f0ebe0]"
                                            >
                                              <span className="font-mono text-[#546656]">{h.date}</span>
                                              <div className="flex items-center gap-3">
                                                <span className="text-[#36593e] font-medium">
                                                  +{h.thoughts_count} today
                                                </span>
                                                <span className="text-[#788879]">
                                                  Total: {h.total_thoughts}
                                                </span>
                                                <span className="text-amber-700 font-mono text-[10px]">
                                                  🔥{h.streak}d
                                                </span>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>

                                    {/* User's Feedback items */}
                                    <div className="bg-white p-3 rounded-xl border border-[#e4ded0] space-y-2">
                                      <span className="text-[11px] font-semibold text-[#4e6150] flex items-center gap-1.5">
                                        <MessageSquare className="w-3.5 h-3.5" />
                                        <span>Feedback Submitted by {u.name}</span>
                                      </span>
                                      {data.feedback.filter((f) => f.userId === u.id).length === 0 ? (
                                        <p className="text-[11px] text-[#8e9c8f] italic py-1">
                                          No feedback submitted by this user yet.
                                        </p>
                                      ) : (
                                        <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                                          {data.feedback
                                            .filter((f) => f.userId === u.id)
                                            .map((f) => (
                                              <div
                                                key={f.id}
                                                className="p-2.5 rounded-lg bg-[#faf8f4] border border-[#f0ebe0] space-y-1 text-[11px]"
                                              >
                                                <div className="flex items-center justify-between text-[10px]">
                                                  <span className="font-bold text-[#34593e] uppercase">
                                                    {f.category} ({'🌿'.repeat(f.rating)})
                                                  </span>
                                                  <span className="text-[#849486]">
                                                    {new Date(f.createdAt).toLocaleDateString()}
                                                  </span>
                                                </div>
                                                <p className="text-[#2b3c2e] leading-snug">{f.message}</p>
                                              </div>
                                            ))}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
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
          )}
        </div>

        {/* Footer with Diagnostic Export Buttons */}
        {isAuthenticated && (
          <div className="p-4 sm:p-5 border-t border-[#eee9dc] bg-[#f5f2e9]/70 flex flex-wrap items-center justify-between gap-3 shrink-0">
            <span className="text-xs text-[#6e7d70]">
              Signed in as admin &bull; Counts only, no thought text
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

      {/* Admin Delete User Confirmation Modal */}
      {userToDelete && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-[#233126]/70 backdrop-blur-sm animate-fade-in"
          onClick={() => !isDeletingUser && setUserToDelete(null)}
        >
          <div
            className="bg-white border border-[#eed0d0] rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="font-serif text-lg font-bold text-red-950">
                Delete Pilot User?
              </h3>
              <p className="text-xs text-[#6e5858]">
                Are you sure you want to permanently delete pilot tester <strong>"{userToDelete.name}"</strong>?
              </p>
            </div>

            <p className="text-xs text-[#715454] bg-[#fdf2f2] p-3 rounded-xl border border-[#f5dada] leading-relaxed">
              This will permanently purge this user's profile, daily activity logs, and feedback messages from the central pilot database.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-1">
              <button
                type="button"
                disabled={isDeletingUser}
                onClick={() => setUserToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#546255] hover:bg-[#f3f0e8] transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeletingUser}
                onClick={handleDeleteUser}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-xs transition-transform active:scale-95"
              >
                <span>{isDeletingUser ? 'Deleting User...' : 'Confirm Delete'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
