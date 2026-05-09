import { getDateDaysAgo, getMonthStartIso } from '../utils/dateUtils';
import { createDataProvider } from './dataProvider';

const provider = createDataProvider();

export function buildDataLoader({
  withRetry,
  isRealAdminUser
}) {
  const inFlight = new Map();
  const INITIAL_ASSIGNMENTS_LIMIT = 500;
  const UPCOMING_ASSIGNMENTS_LIMIT = 500;
  const MEETINGS_LIMIT = 500;
  
  const getCurrentWeekCutoff = () => getDateDaysAgo((new Date().getDay() + 6) % 7);

  const runOnce = async (key, fn) => {
    if (inFlight.has(key)) return inFlight.get(key);
    const p = fn().finally(() => inFlight.delete(key));
    inFlight.set(key, p);
    return p;
  };

  const loadSections = async (sections = []) => {
    const updates = {};
    const ready = {};
    const errors = {};
    const wanted = new Set(sections);
    const loadSectionSafely = async (key, loader) => {
      try {
        await loader();
      } catch (error) {
        errors[key] = error;
        console.error(`loadSections:${key} failed`, error);
      }
    };

    if (wanted.has('users')) {
      await loadSectionSafely('users', async () => {
        const users = await provider.getUsers();
        updates.users = users;
        ready.users = true;
      });
    }

    if (wanted.has('assignments')) {
      await loadSectionSafely('assignments', async () => {
        const assignments = await provider.getAssignments();
        updates.assignments = assignments.sort((a, b) => {
          if (a.date === b.date) {
            return String(b.id || '').localeCompare(String(a.id || ''));
          }
          return String(b.date || '').localeCompare(String(a.date || ''));
        });
        ready.assignments = true;
      });
    }

    if (wanted.has('meetings')) {
      await loadSectionSafely('meetings', async () => {
        const meetings = await provider.getMeetings();
        updates.meetings = meetings;
        ready.meetings = true;
      });
    }

    if (wanted.has('talks')) {
      await loadSectionSafely('talks', async () => {
        const talks = await provider.getTalks();
        updates.talks = talks;
        ready.talks = true;
      });
    }

    if (wanted.has('notifications')) {
      await loadSectionSafely('notifications', async () => {
        const notifications = await provider.getNotifications();
        updates.notifications = notifications;
        ready.notifications = true;
      });
    }

    if (wanted.has('announcements')) {
      await loadSectionSafely('announcements', async () => {
        const announcements = await provider.getAnnouncements();
        const items = announcements.sort((a, b) => (b.pinned === true) - (a.pinned === true));
        updates.announcements = items;
        ready.announcements = true;
      });
    }

    if (wanted.has('swapLogs')) {
      await loadSectionSafely('swapLogs', async () => {
        const swapLogs = await provider.getSwapLogs();
        updates.swapLogs = swapLogs;
        ready.swapLogs = true;
      });
    }

    if (wanted.has('specialEvents')) {
      await loadSectionSafely('specialEvents', async () => {
        const specialEvents = await provider.getSpecialEvents();
        updates.specialEvents = specialEvents;
        ready.specialEvents = true;
      });
    }

    return { updates, ready, errors };
  };

  return { loadSections };
}