import { useCallback, useEffect, useState, useRef } from 'react';
import { collection, doc, getDoc, getDocs, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';

const STORAGE_KEY = 'guest_data_cache';
const CACHE_EXPIRY_MS = 5 * 60 * 1000;

const getMonthBounds = () => {
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 2, 0);
  const fmt = (d) => d.toISOString().slice(0, 10);
  return { start: fmt(firstDay), end: fmt(lastDay) };
};

const loadCachedData = () => {
  try {
    const cached = localStorage.getItem(STORAGE_KEY);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < CACHE_EXPIRY_MS) {
        return data;
      }
    }
  } catch {}
  return null;
};

const saveCachedData = (data) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ data, timestamp: Date.now() }));
  } catch {}
};

const clearCachedData = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
};

const isOnline = () => {
  if (typeof window === 'undefined') return true;
  return navigator.onLine !== false;
};

export const useGuestData = () => {
  const [guestConfig, setGuestConfig] = useState(null);
  const [meetings, setMeetings] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [talks, setTalks] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [specialEvents, setSpecialEvents] = useState([]);
  const [contactInfo, setContactInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const { start, end } = getMonthBounds();

  const fetchAllData = useCallback(async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    setError(null);

    try {
      const results = await Promise.allSettled([
        getDoc(doc(db, 'guest_config', 'main')),
        getDocs(query(collection(db, 'meetings'), where('date', '>=', start), where('date', '<=', end), orderBy('date', 'asc'))),
        getDocs(query(collection(db, 'assignments'), where('date', '>=', start), where('date', '<=', end))),
        getDocs(query(collection(db, 'talks'), where('date', '>=', start), where('date', '<=', end), orderBy('date', 'asc'))),
        getDocs(query(collection(db, 'announcements'), orderBy('created_at', 'desc'), limit(10))),
        getDocs(query(collection(db, 'specialEvents'), where('date', '>=', start), orderBy('date', 'asc'), limit(10))),
        getDoc(doc(db, 'congregation_info', 'main')).catch(() => ({ exists: () => false }))
      ]);

      if (results[0].status === 'fulfilled') {
        const snap = results[0].value;
        setGuestConfig(snap.exists() ? snap.data() : null);
      }

      if (results[1].status === 'fulfilled') {
        setMeetings(results[1].value.docs.map((d) => ({ id: d.id, ...d.data() })));
      }

      if (results[2].status === 'fulfilled') {
        setAssignments(results[2].value.docs.map((d) => ({ id: d.id, ...d.data() })).filter((a) => a.status !== 'rejeitado'));
      }

      if (results[3].status === 'fulfilled') {
        setTalks(results[3].value.docs.map((d) => ({ id: d.id, ...d.data() })));
      }

      if (results[4].status === 'fulfilled') {
        setAnnouncements(results[4].value.docs.map((d) => ({ id: d.id, ...d.data() })));
      }

      if (results[5].status === 'fulfilled') {
        setSpecialEvents(results[5].value.docs.map((d) => ({ id: d.id, ...d.data() })));
      }

      if (results[6].status === 'fulfilled' && results[6].value.exists()) {
        setContactInfo(results[6].value.data());
      }

      const dataToCache = {
        guestConfig: results[0].status === 'fulfilled' && results[0].value.exists() ? results[0].value.data() : null,
        meetings: results[1].status === 'fulfilled' ? results[1].value.docs.map((d) => ({ id: d.id, ...d.data() })) : [],
        assignments: results[2].status === 'fulfilled' ? results[2].value.docs.map((d) => ({ id: d.id, ...d.data() })).filter((a) => a.status !== 'rejeitado') : [],
        talks: results[3].status === 'fulfilled' ? results[3].value.docs.map((d) => ({ id: d.id, ...d.data() })) : [],
        announcements: results[4].status === 'fulfilled' ? results[4].value.docs.map((d) => ({ id: d.id, ...d.data() })) : [],
        specialEvents: results[5].status === 'fulfilled' ? results[5].value.docs.map((d) => ({ id: d.id, ...d.data() })) : [],
        contactInfo: results[6].status === 'fulfilled' && results[6].value.exists() ? results[6].value.data() : null
      };
      saveCachedData(dataToCache);
    } catch (err) {
      console.error('useGuestData error', err);
      setError('Não foi possível carregar os dados.');
    } finally {
      setIsLoading(false);
    }
  }, [start, end]);

  const refresh = useCallback(async (skipCache = false) => {
    const online = isOnline();

    if (!skipCache && online) {
      const cached = loadCachedData();
      if (cached) {
        setGuestConfig(cached.guestConfig);
        setMeetings(cached.meetings || []);
        setAssignments(cached.assignments || []);
        setTalks(cached.talks || []);
        setAnnouncements(cached.announcements || []);
        setSpecialEvents(cached.specialEvents || []);
        setContactInfo(cached.contactInfo || null);
      }
    }

    if (!online) {
      const cached = loadCachedData();
      if (cached) {
        setGuestConfig(cached.guestConfig);
        setMeetings(cached.meetings || []);
        setAssignments(cached.assignments || []);
        setTalks(cached.talks || []);
        setAnnouncements(cached.announcements || []);
        setSpecialEvents(cached.specialEvents || []);
        setContactInfo(cached.contactInfo || null);
        setIsLoading(false);
        setError('Modo offline. Mostrando dados em cache.');
        return;
      }
      setError('Sem conexão e sem dados em cache.');
      setIsLoading(false);
      return;
    }

    await fetchAllData(true);
  }, [fetchAllData]);

  const clearCache = useCallback(() => {
    clearCachedData();
  }, []);

  const mountedRef = useRef(true);
  const unsubscribesRef = useRef([]);

  useEffect(() => {
    mountedRef.current = true;
    fetchAllData(true);

    const unsubMeetings = onSnapshot(
      query(collection(db, 'meetings'), where('date', '>=', start), where('date', '<=', end), orderBy('date', 'asc')),
      (snapshot) => {
        if (mountedRef.current) {
          setMeetings(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
        }
      },
      () => {}
    );

    const unsubAssignments = onSnapshot(
      query(collection(db, 'assignments'), where('date', '>=', start), where('date', '<=', end)),
      (snapshot) => {
        if (mountedRef.current) {
          setAssignments(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })).filter((a) => a.status !== 'rejeitado'));
        }
      },
      () => {}
    );

    const unsubTalks = onSnapshot(
      query(collection(db, 'talks'), where('date', '>=', start), where('date', '<=', end), orderBy('date', 'asc')),
      (snapshot) => {
        if (mountedRef.current) {
          setTalks(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
        }
      },
      () => {}
    );

    const unsubAnnouncements = onSnapshot(
      query(collection(db, 'announcements'), orderBy('created_at', 'desc'), limit(10)),
      (snapshot) => {
        if (mountedRef.current) {
          setAnnouncements(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
        }
      },
      () => {}
    );

    const unsubSpecialEvents = onSnapshot(
      query(collection(db, 'specialEvents'), where('date', '>=', start), orderBy('date', 'asc'), limit(10)),
      (snapshot) => {
        if (mountedRef.current) {
          setSpecialEvents(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
        }
      },
      () => {}
    );

    const unsubGuestConfig = onSnapshot(
      doc(db, 'guest_config', 'main'),
      (snapshot) => {
        if (mountedRef.current) {
          setGuestConfig(snapshot.exists() ? snapshot.data() : null);
        }
      },
      () => {}
    );

    unsubscribesRef.current = [unsubMeetings, unsubAssignments, unsubTalks, unsubAnnouncements, unsubSpecialEvents, unsubGuestConfig];

    return () => {
      unsubscribesRef.current.forEach((unsub) => {
        if (unsub) unsub();
      });
      mountedRef.current = false;
    };
  }, [fetchAllData, start, end]);

  return {
    guestConfig,
    meetings,
    assignments,
    talks,
    announcements,
    specialEvents,
    contactInfo,
    isLoading,
    error,
    refresh,
    clearCache
  };
};
