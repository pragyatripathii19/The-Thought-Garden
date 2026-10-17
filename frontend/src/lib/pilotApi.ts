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
 * Loads the admin dashboard. Only accounts listed in the server's ADMIN_EMAILS may open it.
 */
export async function fetchAdminOverview(): Promise<AdminOverviewData> {
  return apiFetch<AdminOverviewData>('/admin/overview');
}

/**
 * Deletes another user's account and everything in it (admin only).
 */
export async function adminDeletePilotUser(userId: string): Promise<void> {
  await apiFetch(`/admin/users/${encodeURIComponent(userId)}`, { method: 'DELETE' });
}
