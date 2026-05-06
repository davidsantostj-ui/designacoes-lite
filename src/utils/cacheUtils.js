const CACHE_TTL_MS = 1000 * 60 * 60 * 6;
const CACHE_KEYS = {
  users: 'cache_users',
  assignments: 'cache_assignments',
  meetings: 'cache_meetings',
  talks: 'cache_talks',
  notifications: 'cache_notifications',
  announcements: 'cache_announcements',
  swapLogs: 'cache_swap_logs'
};

const safeLocalStorageGet = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const payload = JSON.parse(raw);
    if (!payload || typeof payload !== 'object') return fallback;
    if (payload.ts && Date.now() - payload.ts > CACHE_TTL_MS) return fallback;
    return payload.data ?? fallback;
  } catch (e) {
    return fallback;
  }
};

const safeLocalStorageSet = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify({ ts: Date.now(), data: value }));
  } catch (e) {
    // Ignore quota or serialization issues.
  }
};

const getInitialCache = () => {
  const data = {
    users: safeLocalStorageGet(CACHE_KEYS.users, []),
    assignments: safeLocalStorageGet(CACHE_KEYS.assignments, []),
    meetings: safeLocalStorageGet(CACHE_KEYS.meetings, []),
    talks: safeLocalStorageGet(CACHE_KEYS.talks, []),
    notifications: safeLocalStorageGet(CACHE_KEYS.notifications, []),
    announcements: safeLocalStorageGet(CACHE_KEYS.announcements, []),
    swapLogs: safeLocalStorageGet(CACHE_KEYS.swapLogs, [])
  };
  const ready = {
    users: data.users.length > 0,
    assignments: data.assignments.length > 0,
    meetings: data.meetings.length > 0,
    talks: data.talks.length > 0,
    notifications: data.notifications.length > 0,
    announcements: data.announcements.length > 0,
    swapLogs: data.swapLogs.length > 0
  };
  return { data, ready };
};

export { CACHE_TTL_MS, CACHE_KEYS, safeLocalStorageGet, safeLocalStorageSet, getInitialCache };
