import { PilotFeedback, AdminOverviewData } from '../types';
import { apiFetch } from './api';

/**
 * Sends feedback from the signed-in user. Throws with the server's message if it fails.
 */
export async function submitPilotFeedback(feedback: Omit<PilotFeedback, 'createdAt'>): Promise<{ id: string }> {
  return apiFetch<{ id: string }>('/feedback', {
    method: 'POST',
    body: {
      category: feedback.category,
      rating: feedback.rating,
      message: feedback.message,
      email: feedback.email,
    },
  });
}

/**
 * Loads the admin dashboard. Only admins may open it (users.is_admin, or an email in ADMIN_EMAILS).
 */
export async function fetchAdminOverview(): Promise<AdminOverviewData> {
  // Days ("today", streaks, the chart) are counted in the admin's own time zone.
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  return apiFetch<AdminOverviewData>(`/admin/overview?tz=${encodeURIComponent(tz)}`);
}

/**
 * Deletes another user's account and everything in it (admin only).
 */
export async function adminDeletePilotUser(userId: string): Promise<void> {
  await apiFetch(`/admin/users/${encodeURIComponent(userId)}`, { method: 'DELETE' });
}
