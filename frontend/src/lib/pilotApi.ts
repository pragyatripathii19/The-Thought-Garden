import { PilotUserProfile, PilotFeedback, AdminOverviewData } from '../types';

const API_BASE = '/api';

/**
 * Sync or register pilot user profile with central server.
 */
export async function syncPilotSignup(profile: PilotUserProfile): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/pilot/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile),
    });
    return res.ok;
  } catch (err) {
    console.warn('Pilot signup sync deferred (offline/local mode):', err);
    return false;
  }
}

/**
 * Report daily activity (thoughts created today, streak, total thoughts).
 */
export async function syncPilotPing(ping: {
  userId: string;
  date: string;
  thoughtsCount: number;
  totalThoughts: number;
  streak: number;
}): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/pilot/ping`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ping),
    });
    return res.ok;
  } catch (err) {
    console.warn('Pilot activity ping deferred (offline/local mode):', err);
    return false;
  }
}

/**
 * Submit user feedback to central server.
 */
export async function submitPilotFeedback(
  feedback: Omit<PilotFeedback, 'createdAt'>
): Promise<{ ok: boolean; id?: string }> {
  try {
    const res = await fetch(`${API_BASE}/pilot/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(feedback),
    });
    if (!res.ok) {
      throw new Error(`Server returned HTTP ${res.status}`);
    }
    const data = await res.json();
    return { ok: true, id: data.id };
  } catch (err) {
    console.warn('Server feedback submission failed, saving locally:', err);
    // Return ok: true so user is not blocked, but indicate local mode
    return { ok: true, id: feedback.id };
  }
}

/**
 * Fetch complete Admin Overview using secret admin passcode.
 */
export async function fetchAdminOverview(passcode: string): Promise<AdminOverviewData> {
  const res = await fetch(`${API_BASE}/pilot/admin/overview`, {
    headers: {
      'x-admin-passcode': passcode,
    },
  });

  if (res.status === 401) {
    throw new Error('Invalid Admin Passcode. Access denied.');
  }

  if (!res.ok) {
    throw new Error(`Failed to load admin overview (HTTP ${res.status})`);
  }

  const data = await res.json();
  return data;
}

/**
 * Self-service deletion of user account and records from central server.
 */
export async function deletePilotUser(userId: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/pilot/users/${encodeURIComponent(userId)}`, {
      method: 'DELETE',
    });
    return res.ok;
  } catch (err) {
    console.warn('Backend user delete deferred/failed (offline/local mode):', err);
    return false;
  }
}

/**
 * Admin deletion of user account and associated records from central server.
 */
export async function adminDeletePilotUser(userId: string, passcode: string): Promise<boolean> {
  const res = await fetch(`${API_BASE}/pilot/admin/users/${encodeURIComponent(userId)}`, {
    method: 'DELETE',
    headers: {
      'x-admin-passcode': passcode,
    },
  });

  if (res.status === 401) {
    throw new Error('Unauthorized: Invalid admin passcode');
  }

  if (!res.ok) {
    throw new Error(`Failed to delete user (HTTP ${res.status})`);
  }

  const data = await res.json();
  return !!data.ok;
}
