import { collection, getDocs, limit, orderBy, query, where } from 'firebase/firestore';

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
        const snap = await runOnce('users', () =>
          isRealAdminUser
            ? withRetry(() => getDocs(collection(db, 'users')))
            : withRetry(() =>
                getDocs(query(collection(db, 'users'), where('approved', '==', true), limit(200)))
              )
        );
        updates.users = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        ready.users = true;
      });
    }

    if (wanted.has('assignments')) {
      await loadSectionSafely('assignments', async () => {
        const cutoff = getMonthStartIso(new Date());
        const upcomingCutoff = getDateDaysAgo(0);
        const [monthSnap, upcomingSnap] = await Promise.all([
          runOnce(`assignments:month:${cutoff}`, () =>
            withRetry(() =>
              getDocs(
                query(
                  collection(db, 'assignments'),
                  where('date', '>=', cutoff),
                  orderBy('date', 'desc'),
                  limit(INITIAL_ASSIGNMENTS_LIMIT)
                )
              )
            )
          ),
          runOnce(`assignments:upcoming:${upcomingCutoff}`, () =>
            withRetry(() =>
              getDocs(
                query(
                  collection(db, 'assignments'),
                  where('date', '>=', upcomingCutoff),
                  orderBy('date', 'asc'),
                  limit(UPCOMING_ASSIGNMENTS_LIMIT)
                )
              )
            )
          )
        ]);
        const merged = new Map();
        [monthSnap, upcomingSnap].forEach((snap) => {
          snap.docs.forEach((entry) => {
            merged.set(entry.id, { id: entry.id, ...entry.data() });
          });
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
        const snap = await runOnce('meetings', () =>
          withRetry(() =>
            getDocs(
              query(
                collection(db, 'meetings'),
                where('date', '>=', cutoff),
                orderBy('date', 'asc'),
                limit(MEETINGS_LIMIT)
              )
            )
          )
        );
        updates.meetings = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        ready.meetings = true;
      });
    }

    if (wanted.has('talks')) {
      await loadSectionSafely('talks', async () => {
        const cutoff = getCurrentWeekCutoff();
        const futureLimitDate = new Date(`${cutoff}T12:00:00`);
        futureLimitDate.setMonth(futureLimitDate.getMonth() + 7);
        const futureLimit = `${futureLimitDate.getFullYear()}-${String(futureLimitDate.getMonth() + 1).padStart(2, '0')}-01`;
        const snap = await runOnce(`talks:${cutoff}:${futureLimit}`, () =>
          withRetry(() =>
            getDocs(
              query(
                collection(db, 'talks'),
                where('date', '>=', cutoff),
                where('date', '<', futureLimit),
                orderBy('date', 'asc'),
                limit(80)
              )
            )
          )
        );
        updates.talks = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        ready.talks = true;
      });
    }

    if (wanted.has('notifications')) {
      await loadSectionSafely('notifications', async () => {
        const snap = await runOnce('notifications', () =>
          withRetry(() =>
            getDocs(
              query(collection(db, 'notifications'), orderBy('created_at', 'desc'), limit(15))
            )
          )
        );
        updates.notifications = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        ready.notifications = true;
      });
    }

    if (wanted.has('announcements')) {
      await loadSectionSafely('announcements', async () => {
        const snap = await runOnce('announcements', () =>
          withRetry(() =>
            getDocs(
              query(collection(db, 'announcements'), orderBy('created_at', 'desc'), limit(50))
            )
          )
        );
        const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        items.sort((a, b) => (b.pinned === true) - (a.pinned === true));
        updates.announcements = items;
        ready.announcements = true;
      });
    }

    if (wanted.has('swapLogs')) {
      await loadSectionSafely('swapLogs', async () => {
        const snap = await runOnce('swapLogs', () =>
          withRetry(() =>
            getDocs(query(collection(db, 'swap_logs'), orderBy('createdAt', 'desc'), limit(200)))
          )
        );
        updates.swapLogs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        ready.swapLogs = true;
      });
    }

    if (wanted.has('specialEvents')) {
      await loadSectionSafely('specialEvents', async () => {
        const cutoff = getDateDaysAgo(30); // Carrega eventos desde 30 dias atrás para o histórico próximo
        const snap = await runOnce('specialEvents', () =>
          withRetry(() =>
            getDocs(
              query(
                collection(db, 'specialEvents'),
                where('date', '>=', cutoff),
                orderBy('date', 'asc'),
                limit(50)
              )
            )
          )
        );
        updates.specialEvents = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        ready.specialEvents = true;
      });
    }

    return { updates, ready, errors };
  };

  return { loadSections };
}
