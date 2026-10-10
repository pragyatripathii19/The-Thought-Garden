/**
 * Formats an ISO date timestamp into a compact relative time string
 * matching the visual reference (e.g. "Just now", "2h ago", "1d ago").
 */
export function formatRelativeTime(
  isoString: string,
  nowTimestamp: number = Date.now()
): string {
  try {
    const timestamp = new Date(isoString).getTime();
    if (isNaN(timestamp)) {
      return isoString;
    }

    const diffMs = nowTimestamp - timestamp;
    if (diffMs < 0) {
      return 'Just now';
    }

    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMinutes < 1) {
      return 'Just now';
    }
    if (diffHours < 1) {
      return `${diffMinutes}m ago`;
    }
    if (diffDays < 1) {
      return `${diffHours}h ago`;
    }
    if (diffDays < 30) {
      return `${diffDays}d ago`;
    }

    // Older than 30 days
    return new Date(isoString).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return isoString;
  }
}
