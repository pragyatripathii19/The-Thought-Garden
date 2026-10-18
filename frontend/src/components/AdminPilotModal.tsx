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
  Sun,
  Undo2,
  FolderTree,
  Library,
  Link2,
  Bookmark,
  Sparkles,
} from 'lucide-react';
import { useThoughts } from '../context/StorageContext';
import { AdminOverviewData, AdminUserRow, GrowthStage } from '../types';
import { fetchAdminOverview, adminDeletePilotUser } from '../lib/pilotApi';
import { generateAdminSummaryReport } from '../lib/analytics';
import { localDateKey } from '../lib/date';
import { describeReason } from '../lib/profileReasons';
import { LeafRating } from './LeafRating';
import { stageConfig } from './GrowthStageBadge';

const CARD = 'p-4 rounded-2xl bg-garden-card border border-garden-line';
const PANEL = 'p-5 rounded-2xl bg-garden-card border border-garden-line space-y-4';
const CHIP = 'inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-garden-pill/60 text-garden-moss font-medium text-[11px]';

const pct = (part: number, whole: number) => (whole > 0 ? `${Math.round((part / whole) * 100)}%` : '—');
const actionsLine = (a: { actions: number; undone: number }) =>
  a.actions ? `${a.actions} · ${pct(a.undone, a.actions)} undone` : '0';
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;
const STAGE_BAR: Record<GrowthStage, string> = {
  seed: 'bg-[#E9D9AC]',
  sprout: 'bg-[#BFCB9C]',
  bloom: 'bg-[#E7CBBE]',
  mature: 'bg-garden-moss',
};

const Kpi: React.FC<{ label: string; value: React.ReactNode; note: string; Icon: React.ComponentType<{ className?: string }> }> = ({
  label,
  value,
  note,
  Icon,
}) => (
  <div className={`${CARD} space-y-1`}>
    <div className="flex items-center justify-between text-garden-ink-soft">
      <span className="text-xs font-semibold uppercase tracking-wider">{label}</span>
      <Icon className="w-4 h-4 text-garden-moss" />
    </div>
    <div className="text-[32px] font-serif font-semibold text-garden-ink tabular-nums">{value}</div>
    <div className="text-[11px] text-garden-ink-soft">{note}</div>
  </div>
);

const Row: React.FC<{ label: string; value: React.ReactNode; Icon: React.ComponentType<{ className?: string }> }> = ({
  label,
  value,
  Icon,
}) => (
  <div className="flex items-center justify-between gap-3 text-sm">
    <span className="inline-flex items-center gap-2 text-garden-ink-soft">
      <Icon className="w-4 h-4 text-garden-moss" />
      {label}
    </span>
    <span className="font-semibold text-garden-ink tabular-nums text-right">{value}</span>
  </div>
);

export const AdminPilotModal: React.FC = () => {
  const { isAdminModalOpen, setIsAdminModalOpen } = useThoughts();
  const [data, setData] = useState<AdminOverviewData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [userToDelete, setUserToDelete] = useState<AdminUserRow | null>(null);
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

  // Only admins reach this (users.is_admin or ADMIN_EMAILS); the server checks again.
  useEffect(() => {
    if (isAdminModalOpen) handleLoadOverview();
  }, [isAdminModalOpen]);

  if (!isAdminModalOpen) return null;

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    try {
      setIsDeletingUser(true);
      setError(null);
      await adminDeletePilotUser(userToDelete.id);
      if (expandedUserId === userToDelete.id) setExpandedUserId(null);
      setUserToDelete(null);
      await handleLoadOverview();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete user');
      setUserToDelete(null);
    } finally {
      setIsDeletingUser(false);
    }
  };

  const handleCopySummary = async () => {
    if (!data) return;
    try {
      await navigator.clipboard.writeText(generateAdminSummaryReport(data));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Copying to the clipboard isn’t allowed here. Use Export instead.');
    }
  };

  const handleDownloadJson = () => {
    if (!data) return;
    const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), ...data }, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `thought-garden-pilot-${localDateKey()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const s = data?.summary;
  const o = data?.organizing;
  const f = data?.features;
  const chartMax = data ? Math.max(...data.thoughtsPerDayAgg.map((d) => d.total_thoughts), 1) : 1;
  const stageTotal = f ? Object.values(f.stages).reduce((a, b) => a + b, 0) : 0;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-title"
      className="modal-overlay z-50 p-3 sm:p-5 bg-garden-ink/60 sm:backdrop-blur-sm animate-fade-in"
      onClick={() => setIsAdminModalOpen(false)}
    >
      <div
        className="modal-panel bg-[#FDFBF3] border border-garden-line rounded-3xl w-full max-w-5xl max-h-[92dvh] flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-garden-line bg-garden-paper-deep/70 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-garden-moss text-garden-paper flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 id="admin-title" className="font-serif text-[26px] font-semibold text-garden-ink">
                Admin dashboard
              </h2>
              <p className="text-xs text-garden-ink-soft">
                How the pilot is going · counts only, never thought text
                {data && ` · days in ${data.timeZone}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {data && (
              <button
                type="button"
                onClick={() => handleLoadOverview()}
                disabled={isLoading}
                className="p-2 text-garden-ink-soft hover:text-garden-ink hover:bg-garden-line rounded-xl transition-colors"
                title="Refresh"
                aria-label="Refresh"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsAdminModalOpen(false)}
              className="p-2 text-garden-ink-faint hover:text-garden-ink hover:bg-garden-line rounded-xl transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {error && data && (
            <div role="alert" className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {!data || !s || !o || !f ? (
            <div className="max-w-sm mx-auto my-8 p-6 bg-garden-card border border-garden-line rounded-3xl text-center space-y-4">
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
                    className="w-full py-2.5 rounded-full bg-garden-moss hover:bg-garden-moss-dark disabled:opacity-40 text-garden-paper font-medium text-sm transition-colors"
                  >
                    Try again
                  </button>
                </>
              ) : (
                <p className="text-sm text-garden-ink-soft" role="status">
                  Loading the dashboard…
                </p>
              )}
            </div>
          ) : (
            <>
              {/* Headline numbers */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
                <Kpi label="People" value={s.totalUsers} note={plural(s.admins, 'admin')} Icon={Users} />
                <Kpi
                  label="Active this week"
                  value={s.activeThisWeek}
                  note={`of ${s.totalUsers} · ${s.activeToday} today`}
                  Icon={Activity}
                />
                <Kpi
                  label="Thoughts this week"
                  value={s.thoughtsThisWeek}
                  note={`${s.totalThoughtsLogged} all time`}
                  Icon={Sprout}
                />
                <Kpi
                  label="Undo rate"
                  value={s.undoRate === null ? '—' : `${Math.round(s.undoRate * 100)}%`}
                  note={o.actions ? `of ${plural(o.actions, 'automatic action')}` : 'No automatic organising yet'}
                  Icon={Undo2}
                />
              </div>

              {/* Last 30 days */}
              <div className={PANEL}>
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="font-serif text-xl font-semibold text-garden-ink">Thoughts planted, last 30 days</h3>
                  <span className="text-xs text-garden-ink-soft">All people</span>
                </div>
                <div className="flex items-end gap-1 h-36 border-b border-garden-line" role="img"
                  aria-label={`Thoughts per day over the last 30 days; most in one day: ${chartMax}`}>
                  {data.thoughtsPerDayAgg.map((d) => (
                    <div key={d.date} className="flex-1 h-full flex flex-col justify-end items-center group relative">
                      <span className="absolute -top-0.5 text-[10px] text-garden-ink-soft opacity-0 group-hover:opacity-100 tabular-nums">
                        {d.total_thoughts}
                      </span>
                      <div
                        className={`w-full max-w-[18px] rounded-t ${d.total_thoughts ? 'bg-[#53775c] group-hover:bg-garden-moss' : 'bg-garden-line'}`}
                        style={{ height: d.total_thoughts ? `${Math.max((d.total_thoughts / chartMax) * 100, 6)}%` : '2px' }}
                        title={`${d.date}: ${plural(d.total_thoughts, 'thought')} from ${plural(d.active_users, 'person')}`}
                      />
                    </div>
                  ))}
                </div>
                <div className="flex justify-between text-[10px] text-garden-ink-faint tabular-nums">
                  <span>{data.thoughtsPerDayAgg[0]?.date.slice(5)}</span>
                  <span>{data.thoughtsPerDayAgg[14]?.date.slice(5)}</span>
                  <span>Today</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Organising health */}
                <div className={PANEL}>
                  <h3 className="font-serif text-xl font-semibold text-garden-ink">Organising health</h3>
                  <div className="space-y-2.5">
                    <Row label="Automatic actions" value={o.actions} Icon={FolderTree} />
                    <Row label="Undone by people" value={o.actions ? `${o.undone} (${pct(o.undone, o.actions)})` : '0'} Icon={Undo2} />
                    <Row
                      label="By AI (Smart organising)"
                      value={actionsLine(o.llm)}
                      Icon={Sparkles}
                    />
                    <Row
                      label="On-device"
                      value={actionsLine(o.onDevice)}
                      Icon={Sprout}
                    />
                    <Row label="Smart organising on" value={`${o.smartOrganizingOn} of ${s.totalUsers}`} Icon={Sparkles} />
                  </div>
                  <p className="text-xs text-garden-ink-faint leading-relaxed">
                    A high undo rate means automatic organising is guessing wrong and its thresholds need tuning.
                  </p>
                </div>

                {/* Features used */}
                <div className={PANEL}>
                  <h3 className="font-serif text-xl font-semibold text-garden-ink">Features used</h3>
                  <div className="space-y-2.5">
                    <Row
                      label="Collections"
                      value={`${f.collectionsMade} made · ${f.collectionsAuto} automatic`}
                      Icon={Library}
                    />
                    <Row label="Accepted connections" value={f.connections} Icon={Link2} />
                    <Row
                      label="Saved"
                      value={`${plural(f.savedThoughts, 'thought')} · ${plural(f.savedCollections, 'collection')}`}
                      Icon={Bookmark}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <span className="text-xs font-semibold uppercase tracking-wider text-garden-ink-soft">Growth stages</span>
                    <div className="flex h-2.5 rounded-full overflow-hidden bg-garden-line" aria-hidden="true">
                      {(Object.keys(stageConfig) as GrowthStage[]).map((st) =>
                        f.stages[st] ? (
                          <div key={st} className={STAGE_BAR[st]} style={{ width: `${(f.stages[st] / stageTotal) * 100}%` }} />
                        ) : null
                      )}
                    </div>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-garden-ink-soft">
                      {(Object.keys(stageConfig) as GrowthStage[]).map((st) => (
                        <span key={st} className="inline-flex items-center gap-1">
                          <span className={`w-2 h-2 rounded-full ${STAGE_BAR[st]}`} />
                          {stageConfig[st].label} {f.stages[st]}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* People */}
              <div className="p-5 rounded-2xl bg-garden-card border border-garden-line space-y-3">
                <h3 className="font-serif text-xl font-semibold text-garden-ink">People ({data.users.length})</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs min-w-[640px]">
                    <thead>
                      <tr className="border-b border-garden-line text-garden-ink-soft">
                        <th className="pb-2 font-semibold">Person</th>
                        <th className="pb-2 font-semibold">Why they’re here</th>
                        <th className="pb-2 font-semibold">Thoughts</th>
                        <th className="pb-2 font-semibold">Days active</th>
                        <th className="pb-2 font-semibold">Last active</th>
                        <th className="pb-2 font-semibold text-right">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-garden-line-soft">
                      {data.users.map((u) => {
                        const isExpanded = expandedUserId === u.id;
                        const userFeedback = data.feedback.filter((fb) => fb.userId === u.id);
                        return (
                          <React.Fragment key={u.id}>
                            <tr className="hover:bg-[#FDFBF3] transition-colors align-top">
                              <td className="py-2.5 pr-2">
                                <div className="font-medium text-garden-ink flex items-center gap-1.5">
                                  {u.name}
                                  {u.isAdmin && (
                                    <span className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full bg-garden-moss text-garden-paper">
                                      <Shield className="w-2.5 h-2.5" /> Admin
                                    </span>
                                  )}
                                </div>
                                <div className="text-[10px] text-garden-ink-faint">{u.email}</div>
                              </td>
                              <td className="py-2.5 pr-2 max-w-[220px]">
                                <div className="flex flex-wrap gap-1">
                                  {u.reasons.length === 0 && <span className="text-garden-ink-faint">—</span>}
                                  {u.reasons.map((r, i) => {
                                    const { label, Icon } = describeReason(r);
                                    return (
                                      <span key={i} className={`${CHIP} text-[10px]`}>
                                        <Icon className="w-3 h-3" />
                                        {label}
                                      </span>
                                    );
                                  })}
                                </div>
                              </td>
                              <td className="py-2.5 tabular-nums">
                                <div className="font-semibold text-garden-ink">{u.totalThoughts}</div>
                                <div className="text-[10px] text-garden-ink-faint">+{u.thoughtsThisWeek} this week</div>
                              </td>
                              <td className="py-2.5 tabular-nums">
                                <span className="font-semibold text-garden-ink">{u.daysActive30}</span>
                                <span className="text-garden-ink-faint"> / 30</span>
                              </td>
                              <td className="py-2.5 text-garden-ink-soft">
                                <div>{new Date(u.lastActiveAt).toLocaleDateString()}</div>
                                <div className="text-[10px] text-garden-ink-faint">
                                  Joined {new Date(u.createdAt).toLocaleDateString()}
                                </div>
                              </td>
                              <td className="py-2.5 text-right">
                                <div className="inline-flex items-center gap-1.5 justify-end">
                                  <button
                                    type="button"
                                    onClick={() => setExpandedUserId(isExpanded ? null : u.id)}
                                    aria-expanded={isExpanded}
                                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors ${
                                      isExpanded
                                        ? 'bg-garden-moss text-garden-paper border-garden-moss'
                                        : 'bg-garden-card hover:bg-garden-paper-deep text-garden-ink-soft border-garden-line'
                                    }`}
                                  >
                                    <span>Activity</span>
                                    {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                  </button>
                                  {!u.isAdmin && (
                                    <button
                                      type="button"
                                      onClick={() => setUserToDelete(u)}
                                      className="p-1.5 text-garden-ink-faint hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                      title={`Delete ${u.name}`}
                                      aria-label={`Delete ${u.name}`}
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>

                            {isExpanded && (
                              <tr className="bg-[#FDFBF3]/90">
                                <td colSpan={6} className="p-4 space-y-3">
                                  <div className="flex flex-wrap gap-1.5">
                                    <span className={CHIP}><Sun className="w-3 h-3" /> Today: {u.thoughtsToday}</span>
                                    <span className={`${CHIP} bg-[#F3E6C4] text-[#86641E]`}><Flame className="w-3 h-3" /> Streak: {u.streak}d</span>
                                    <span className={CHIP}><Library className="w-3 h-3" /> Collections: {u.collectionsMade} made, {u.collectionsAuto} auto</span>
                                    <span className={CHIP}><Link2 className="w-3 h-3" /> Connections: {u.connections}</span>
                                    <span className={CHIP}><Bookmark className="w-3 h-3" /> Saved: {u.savedThoughts + u.savedCollections}</span>
                                    <span className={CHIP}>
                                      <Undo2 className="w-3 h-3" /> Auto-organised: {u.autoActions}, undone {u.autoUndone}
                                    </span>
                                    <span className={CHIP}>
                                      <Sparkles className="w-3 h-3" /> Smart organising {u.smartOrganizing ? 'on' : 'off'}
                                    </span>
                                    <span className={CHIP}><MessageSquare className="w-3 h-3" /> Feedback: {u.feedbackCount}</span>
                                  </div>

                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div className="bg-garden-card p-3 rounded-xl border border-garden-line space-y-2">
                                      <span className="text-[11px] font-semibold text-garden-ink-soft flex items-center gap-1.5">
                                        <Calendar className="w-3.5 h-3.5" /> Days they planted thoughts
                                      </span>
                                      {u.activityHistory.length === 0 ? (
                                        <p className="text-[11px] text-garden-ink-faint italic py-1">No thoughts yet.</p>
                                      ) : (
                                        <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
                                          {u.activityHistory.map((h) => (
                                            <div
                                              key={h.date}
                                              className="flex items-center justify-between text-[11px] py-1 px-2.5 rounded-lg bg-[#FDFBF3] border border-garden-line tabular-nums"
                                            >
                                              <span className="text-garden-ink-soft">{h.date}</span>
                                              <span className="text-garden-moss font-medium">+{h.thoughts_count}</span>
                                              <span className="text-garden-ink-faint">Total {h.total_thoughts}</span>
                                              <span className="inline-flex items-center gap-0.5 text-[#86641E]">
                                                <Flame className="w-2.5 h-2.5" /> {h.streak}d
                                              </span>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>

                                    <div className="bg-garden-card p-3 rounded-xl border border-garden-line space-y-2">
                                      <span className="text-[11px] font-semibold text-garden-ink-soft flex items-center gap-1.5">
                                        <MessageSquare className="w-3.5 h-3.5" /> Their feedback
                                      </span>
                                      {userFeedback.length === 0 ? (
                                        <p className="text-[11px] text-garden-ink-faint italic py-1">No feedback yet.</p>
                                      ) : (
                                        <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                                          {userFeedback.map((fb) => (
                                            <div key={fb.id} className="p-2.5 rounded-lg bg-[#FDFBF3] border border-garden-line space-y-1 text-[11px]">
                                              <div className="flex items-center justify-between text-[10px]">
                                                <span className="inline-flex items-center gap-1.5 font-bold text-garden-moss uppercase">
                                                  {fb.category} <LeafRating rating={fb.rating} className="w-2.5 h-2.5" />
                                                </span>
                                                <span className="text-garden-ink-faint">{new Date(fb.createdAt).toLocaleDateString()}</span>
                                              </div>
                                              <p className="text-garden-ink leading-snug">{fb.message}</p>
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

              {/* Feedback inbox */}
              <div className="p-5 rounded-2xl bg-garden-card border border-garden-line space-y-3">
                <h3 className="font-serif text-xl font-semibold text-garden-ink">Feedback ({data.feedback.length})</h3>
                {data.feedback.length === 0 ? (
                  <p className="text-xs text-garden-ink-faint italic py-3">No feedback received yet.</p>
                ) : (
                  <div className="space-y-2.5">
                    {data.feedback.map((fb) => (
                      <div key={fb.id} className="p-3.5 rounded-xl bg-[#FDFBF3] border border-garden-line space-y-1.5">
                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-garden-ink">{fb.userName || 'Anonymous'}</span>
                            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-garden-pill/60 text-garden-moss border border-[#CBD5AE]">
                              {fb.category}
                            </span>
                            <LeafRating rating={fb.rating} />
                          </div>
                          <span className="text-[11px] text-garden-ink-soft">{new Date(fb.createdAt).toLocaleString()}</span>
                        </div>
                        <p className="text-xs text-garden-ink leading-relaxed whitespace-pre-wrap">{fb.message}</p>
                        {fb.email && <div className="text-[10px] text-garden-ink-soft">Contact: {fb.email}</div>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {data && (
          <div className="p-4 sm:p-5 border-t border-garden-line bg-garden-paper-deep/70 flex flex-wrap items-center justify-between gap-3 shrink-0">
            <span className="text-xs text-garden-ink-soft">Summary and export cover the whole pilot</span>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={handleCopySummary}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-garden-card hover:bg-[#FDFBF3] border border-garden-line rounded-full text-xs font-semibold text-garden-ink transition-transform active:scale-95"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-garden-moss" /> : <Copy className="w-3.5 h-3.5 text-garden-ink-soft" />}
                <span>{copied ? 'Copied' : 'Copy summary'}</span>
              </button>
              <button
                type="button"
                onClick={handleDownloadJson}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-garden-moss hover:bg-garden-moss-dark text-garden-paper rounded-full text-xs font-semibold transition-transform active:scale-95"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export JSON</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete confirmation */}
      {userToDelete && (
        <div
          role="dialog"
          aria-modal="true"
          className="modal-overlay z-60 bg-garden-ink/70 sm:backdrop-blur-sm animate-fade-in"
          onClick={() => !isDeletingUser && setUserToDelete(null)}
        >
          <div
            className="modal-panel bg-garden-card border border-[#eed0d0] rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-serif text-2xl font-semibold text-red-950">Delete {userToDelete.name}?</h3>
              <p className="text-xs text-[#6e5858]">
                This permanently deletes their account, their whole garden, and their feedback.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2.5 pt-1">
              <button
                type="button"
                disabled={isDeletingUser}
                onClick={() => setUserToDelete(null)}
                className="px-4 py-2 rounded-full text-xs font-semibold text-garden-ink-soft hover:bg-garden-paper-deep transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeletingUser}
                onClick={handleDeleteUser}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-full text-xs font-semibold transition-transform active:scale-95"
              >
                {isDeletingUser ? 'Deleting…' : 'Delete account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
