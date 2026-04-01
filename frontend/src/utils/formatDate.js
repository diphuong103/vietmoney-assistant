/**
 * Format a date to a readable string.
 * @param {Date|string} date
 * @returns {string}  e.g. "Mon, Jun 2"
 */
export function formatDate(date) {
  return new Date(date).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
  });
}

/**
 * Format a date to time string.
 * @param {Date|string} date
 * @returns {string}  e.g. "14:30"
 */
export function formatTime(date) {
  return new Date(date).toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit',
  });
}

/**
 * Relative time (e.g. "2h ago").
 * @param {Date|string} date
 * @returns {string}
 */
export function timeAgo(date) {
  const diff = (Date.now() - new Date(date).getTime()) / 1000;
  if (diff < 60)   return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}
