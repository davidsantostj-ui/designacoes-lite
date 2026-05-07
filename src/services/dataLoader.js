import { supabase } from './supabase';

export function buildDataLoader({
  db,
  withRetry,
  getDateDaysAgo,
  getMonthStartIso,
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
        const { data } = await runOnce('users', () =>
          isRealAdminUser
            ? withRetry(() => supabase.from('profiles').select('*'))
            : withRetry(() =>
                supabase.from('profiles').select('*').eq('approved', true).limit(200))
        );
        updates.users = (data || []).map(d => ({ id: d.id, ...d }));
        ready.users = true;
      });
    }

    if (wanted.has('assignments')) {
      await loadSectionSafely('assignments', async () => {
        const cutoff = getMonthStartIso(new Date());
        const upcomingCutoff = getDateDaysAgo(0);
        const [monthData, upcomingData] = await Promise.all([
          runOnce(`assignments:month:${cutoff}`, () =>
            withRetry(() =>
              supabase
                .from('assignments')
                .select('*')
                .gte('date', cutoff)
                .order('date', { ascending: false })
                .limit(INITIAL_ASSIGNMENTS_LIMIT)
            )
          ),
          runOnce(`assignments:upcoming:${upcomingCutoff}`, () =>
            withRetry(() =>
              supabase
                .from('assignments')
                .select('*')
                .gte('date', upcomingCutoff)
                .order('date', { ascending: true })
                .limit(UPCOMING_ASSIGNMENTS_LIMIT)
            )
          )
        ]);
        const merged = new Map();
        [...(monthData?.data || []), ...(upcomingData?.data || [])].forEach((entry) => {
          merged.set(entry.id, { id: entry.id, ...entry });
        });
        updates.assignments = [...merged.values()].sort((a, b) => {
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
        const cutoff = getCurrentWeekCutoff();
        const { data } = await runOnce('meetings', () =>
          withRetry(() =>
            supabase
              .from('meetings')
              .select('*')
              .gte('date', cutoff)
              .order('date', { ascending: true })
              .limit(MEETINGS_LIMIT)
          )
        );
        updates.meetings = (data || []).map(d => ({ id: d.id, ...d }));
        ready.meetings = true;
      });
    }

    if (wanted.has('talks')) {
      await loadSectionSafely('talks', async () => {
        const cutoff = getCurrentWeekCutoff();
        const futureLimitDate = new Date(`${cutoff}T12:00:00`);
        futureLimitDate.setMonth(futureLimitDate.getMonth() + 7);
        const futureLimit = `${futureLimitDate.getFullYear()}-${String(futureLimitDate.getMonth() + 1).padStart(2, '0')}-01`;
        const { data } = await runOnce(`talks:${cutoff}:${futureLimit}`, () =>
          withRetry(() =>
            supabase
              .from('talks')
              .select('*')
              .gte('date', cutoff)
              .lt('date', futureLimit)
              .order('date', { ascending: true })
              .limit(80)
          )
        );
        updates.talks = (data || []).map(d => ({ id: d.id, ...d }));
        ready.talks = true;
      });
    }

    if (wanted.has('notifications')) {
      await loadSectionSafely('notifications', async () => {
        const { data } = await runOnce('notifications', () =>
          withRetry(() =>
            supabase
              .from('notifications')
              .select('*')
              .order('created_at', { ascending: false })
              .limit(15)
          )
        );
        updates.notifications = (data || []).map(d => ({ id: d.id, ...d }));
        ready.notifications = true;
      });
    }

    if (wanted.has('announcements')) {
      await loadSectionSafely('announcements', async () => {
        const { data } = await runOnce('announcements', () =>
          withRetry(() =>
            supabase
              .from('announcements')
              .select('*')
              .order('created_at', { ascending: false })
              .limit(50)
          )
        );
        const items = (data || []).map(d => ({ id: d.id, ...d }));
        items.sort((a, b) => (b.pinned === true) - (a.pinned === true));
        updates.announcements = items;
        ready.announcements = true;
      });
    }

    if (wanted.has('swapLogs')) {
      await loadSectionSafely('swapLogs', async () => {
        const { data } = await runOnce('swapLogs', () =>
          withRetry(() =>
            supabase
              .from('swap_logs')
              .select('*')
              .order('createdAt', { ascending: false })
              .limit(200)
          )
        );
        updates.swapLogs = (data || []).map(d => ({ id: d.id, ...d }));
        ready.swapLogs = true;
      });
    }

    if (wanted.has('specialEvents')) {
      await loadSectionSafely('specialEvents', async () => {
        const cutoff = getDateDaysAgo(30);
        const { data } = await runOnce('specialEvents', () =>
          withRetry(() =>
            supabase
              .from('specialEvents')
              .select('*')
              .gte('date', cutoff)
              .order('date', { ascending: true })
              .limit(50)
          )
        );
        updates.specialEvents = (data || []).map(d => ({ id: d.id, ...d }));
        ready.specialEvents = true;
      });
    }

    return { updates, ready, errors };
  };

  return { loadSections };
}