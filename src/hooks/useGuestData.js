import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../services/supabase';

const db = null;

// ─── Cache local (5 min) para modo offline e redução de reads ───────────────
const STORAGE_KEY = 'guest_data_cache_v2';
const CACHE_EXPIRY_MS = 5 * 60 * 1000;

const loadCachedData = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const { data, timestamp } = JSON.parse(raw);
    if (Date.now() - timestamp < CACHE_EXPIRY_MS) return data;
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

const isOnline = () => (typeof window === 'undefined' ? true : navigator.onLine !== false);

// ─── Hook ────────────────────────────────────────────────────────────────────
export const useGuestData = () => {
  const [guestConfig, setGuestConfig] = useState(null);
  const [meetings, setMeetings] = useState([]);
  const [talks, setTalks] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [specialEvents, setSpecialEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastFetchedAt, setLastFetchedAt] = useState(null);

  // Memoized para não recriar dependências a cada render
  const { start, end } = useMemo(() => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 2, 0);
    const fmt = (d) => d.toISOString().slice(0, 10);
    return { start: fmt(firstDay), end: fmt(lastDay) };
  }, []); // calculado uma única vez por montagem do hook

  const applyData = useCallback((cached) => {
    if (!cached) return;
    setGuestConfig(cached.guestConfig ?? null);
    setMeetings(cached.meetings ?? []);
    setTalks(cached.talks ?? []);
    setAnnouncements(cached.announcements ?? []);
    setSpecialEvents(cached.specialEvents ?? []);
  }, []);

  /**
   * Busca todos os dados do Firestore com getDocs (sem listeners abertos).
   * 5 reads por chamada:
   *   1. guest_config/main
   *   2. meetings (mês atual + próximo)
   *   3. talks (mês atual + próximo)
   *   4. announcements (últimos 10)
   *   5. specialEvents (próximos 10)
   *
   * A coleção `assignments` NÃO é lida aqui pois exige isApproved() nas
   * Firestore Rules — usuários anônimos não têm acesso.
   * O contactInfo é lido de guest_config/main.contactInfo.
   */
  const fetchAllData = useCallback(async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    setError(null);

    try {
      const results = await Promise.allSettled([
        // 1. Configuração do convidado (links, atividades, contactInfo)
        getDoc(doc(db, 'guest_config', 'main')),
        // 2. Reuniões do mês atual e próximo
        getDocs(
          query(
            collection(db, 'meetings'),
            where('date', '>=', start),
            where('date', '<=', end),
            orderBy('date', 'asc')
          )
        ),
        // 3. Discursos públicos do período
        getDocs(
          query(
            collection(db, 'talks'),
            where('date', '>=', start),
            where('date', '<=', end),
            orderBy('date', 'asc')
          )
        ),
        // 4. Avisos recentes
        getDocs(
          query(
            collection(db, 'announcements'),
            orderBy('created_at', 'desc'),
            limit(10)
          )
        ),
        // 5. Eventos especiais futuros
        getDocs(
          query(
            collection(db, 'specialEvents'),
            where('date', '>=', start),
            orderBy('date', 'asc'),
            limit(10)
          )
        )
      ]);

      const newGuestConfig =
        results[0].status === 'fulfilled' && results[0].value.exists()
          ? results[0].value.data()
          : null;

      const newMeetings =
        results[1].status === 'fulfilled'
          ? results[1].value.docs.map((d) => ({ id: d.id, ...d.data() }))
          : [];

      const newTalks =
        results[2].status === 'fulfilled'
          ? results[2].value.docs.map((d) => ({ id: d.id, ...d.data() }))
          : [];

      const newAnnouncements =
        results[3].status === 'fulfilled'
          ? results[3].value.docs.map((d) => ({ id: d.id, ...d.data() }))
          : [];

      const newSpecialEvents =
        results[4].status === 'fulfilled'
          ? results[4].value.docs.map((d) => ({ id: d.id, ...d.data() }))
          : [];

      setGuestConfig(newGuestConfig);
      setMeetings(newMeetings);
      setTalks(newTalks);
      setAnnouncements(newAnnouncements);
      setSpecialEvents(newSpecialEvents);
      setLastFetchedAt(new Date());

      // Salva no cache para modo offline
      saveCachedData({
        guestConfig: newGuestConfig,
        meetings: newMeetings,
        talks: newTalks,
        announcements: newAnnouncements,
        specialEvents: newSpecialEvents
      });

      // Log de falhas parciais (sem suprimir silenciosamente)
      const failed = results.filter((r) => r.status === 'rejected');
      if (failed.length > 0) {
        failed.forEach((r) => console.warn('[useGuestData] partial failure:', r.reason?.code, r.reason?.message));
      }
    } catch (err) {
      console.error('[useGuestData] fetch error:', err);
      setError('Não foi possível carregar os dados. Verifique sua conexão.');
    } finally {
      setIsLoading(false);
    }
  }, [start, end]);

  /**
   * Refresh manual: respeita cache válido para economizar reads.
   * skipCache=true força nova busca (botão de atualizar manual).
   */
  const refresh = useCallback(async (skipCache = false) => {
    if (!isOnline()) {
      const cached = loadCachedData();
      if (cached) {
        applyData(cached);
        setIsLoading(false);
        setError('Modo offline — exibindo dados salvos anteriormente.');
      } else {
        setError('Sem conexão e sem dados em cache disponíveis.');
        setIsLoading(false);
      }
      return;
    }

    if (!skipCache) {
      const cached = loadCachedData();
      if (cached) {
        // Carrega cache imediatamente para evitar tela vazia
        applyData(cached);
        setIsLoading(false);
        return;
      }
    }

    await fetchAllData(true);
  }, [fetchAllData, applyData]);

  const clearCache = useCallback(() => {
    clearCachedData();
  }, []);

  // Carga inicial — sem onSnapshot, sem listeners abertos
  useEffect(() => {
    refresh(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intencional: executa apenas na montagem

  return {
    guestConfig,
    meetings,
    talks,
    announcements,
    specialEvents,
    // contactInfo lido de guestConfig.contactInfo pelo componente consumidor
    isLoading,
    error,
    lastFetchedAt,
    refresh,
    clearCache
  };
};
