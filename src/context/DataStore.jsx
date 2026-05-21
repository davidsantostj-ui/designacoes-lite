import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const DataContext = createContext(null);

// Reuniões permanecem locais por enquanto, pois não têm tela de Admin para geri-las
const initialMeetings = [
  { id: 'm1', date: '2026-05-10', type: 'Fim de Semana', title: 'Reunião Pública e Estudo de A Sentinela' },
  { id: 'm2', date: '2026-05-12', type: 'Meio de Semana', title: 'Nossa Vida e Ministério Cristão' },
  { id: 'm3', date: '2026-05-17', type: 'Fim de Semana', title: 'Reunião Pública e Estudo de A Sentinela' },
  { id: 'm4', date: '2026-05-19', type: 'Meio de Semana', title: 'Nossa Vida e Ministério Cristão' }
];

export const DataProvider = ({ children }) => {
  const [users, setUsers] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [meetings] = useState(initialMeetings);
  const [notices, setNotices] = useState([]);
  const [tips, setTips] = useState([]);
  const [fieldService, setFieldService] = useState([]);
  const [quickLinks, setQuickLinks] = useState([]);
  
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('v2_theme') === 'dark');
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  // Função global de sincronização e busca
  const fetchAllData = async (showLoadingState = true) => {
    if (showLoadingState) setLoading(true);
    try {
      // 1. Fetch Users
      let { data: usersData, error: uErr } = await supabase.from('users').select('*');
      
      if (uErr) {
        console.error('[DataStore] Erro ao buscar usuários:', uErr.message, uErr);
      }

      // Auto-Seed: Se o banco estiver vazio, cria os usuários iniciais
      if (!uErr && (!usersData || usersData.length === 0)) {
        console.log('[DataStore] Banco vazio, criando usuários iniciais...');
        const { error: seedErr } = await supabase.from('users').insert([
          { name: 'David Santos', email: 'david@admin.com', role: 'admin', pin: '1804' },
          { name: 'Maria Santos', email: 'maria@teste.com', role: 'user', pin: '1234' },
          { name: 'Pedro Alves', email: 'pedro@teste.com', role: 'user', pin: '1234' },
          { name: 'Ana Costa', email: 'ana@teste.com', role: 'user', pin: '1234' }
        ]);
        if (seedErr) {
          console.error('[DataStore] Erro no auto-seed:', seedErr.message, seedErr);
        }
        const res = await supabase.from('users').select('*');
        usersData = res.data;
      } else if (!uErr && usersData) {
        // Fallback: Garantir que o David Santos exista
        const hasDavid = usersData.find(u => u.name === 'David Santos');
        if (!hasDavid) {
          const { error: fallbackErr } = await supabase.from('users').insert([
            { name: 'David Santos', email: 'david@admin.com', role: 'admin', pin: '1804' }
          ]);
          if (fallbackErr) console.error('[DataStore] Erro ao criar David Santos:', fallbackErr.message);
          const res = await supabase.from('users').select('*');
          usersData = res.data;
        }
      }
      setUsers(usersData || []);

      // Restaurar sessão
      const savedUserId = localStorage.getItem('v2_userId');
      if (savedUserId && usersData) {
        const foundUser = usersData.find(u => u.id === savedUserId);
        if (foundUser) setCurrentUser(foundUser);
      }

      // 2. Fetch Assignments
      const { data: assignData } = await supabase.from('assignments').select('*');
      setAssignments(assignData || []);

      // 3. Fetch Notices
      const { data: noticesData } = await supabase.from('notices').select('*').order('date', { ascending: false });
      setNotices(noticesData || []);

      // 4. Fetch Tips
      const { data: tipsData } = await supabase.from('tips').select('*');
      setTips(tipsData || []);

      // 5. Fetch Field Service (mapeando day_of_week para dayOfWeek)
      const { data: fieldData } = await supabase.from('field_service').select('*');
      const mappedFieldData = (fieldData || []).map(f => ({
        id: f.id,
        dayOfWeek: f.day_of_week || f.dayOfWeek || '',
        time: f.time,
        type: f.type,
        location_or_link: f.location_or_link,
        conductor: f.conductor
      }));
      setFieldService(mappedFieldData);

      // 6. Fetch Quick Links
      let { data: linksData, error: lErr } = await supabase.from('quick_links').select('*');
      
      // Auto-Seed Quick Links para o Dashboard não ficar vazio na primeira vez
      if (!lErr && (!linksData || linksData.length === 0)) {
        await supabase.from('quick_links').insert([
          { label: 'Site JW', icon: 'Globe', url: 'https://jw.org', color: 'bg-sky-100 text-sky-600 dark:bg-sky-500/20 dark:text-sky-400' },
          { label: 'Biblioteca', icon: 'BookOpen', url: 'https://wol.jw.org', color: 'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400' }
        ]);
        const resL = await supabase.from('quick_links').select('*');
        linksData = resL.data;
      }
      setQuickLinks(linksData || []);
    } catch (e) {
      console.error('[DataStore] Erro geral ao recarregar:', e);
    } finally {
      if (showLoadingState) setLoading(false);
    }
  };

  // Busca todos os dados do Supabase ao iniciar
  useEffect(() => {
    fetchAllData(true);
  }, []);

  // ===== FEAT #7: SUPABASE REALTIME =====
  // Atualizações propagadas em tempo real para todos os dispositivos conectados
  useEffect(() => {
    // Canal: assignments
    const assignChannel = supabase
      .channel('realtime-assignments')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'assignments' },
        (payload) => setAssignments(prev => [...prev, payload.new])
      )
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'assignments' },
        (payload) => setAssignments(prev => prev.map(a => a.id === payload.new.id ? payload.new : a))
      )
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'assignments' },
        (payload) => setAssignments(prev => prev.filter(a => a.id !== payload.old.id))
      )
      .subscribe();

    // Canal: users (para promoção a admin refletir sem reload)
    const usersChannel = supabase
      .channel('realtime-users')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'users' },
        (payload) => setUsers(prev => [...prev, payload.new])
      )
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'users' },
        (payload) => {
          setUsers(prev => prev.map(u => u.id === payload.new.id ? payload.new : u));
          // Atualiza o currentUser se for o mesmo
          setCurrentUser(prev => prev?.id === payload.new.id ? payload.new : prev);
        }
      )
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'users' },
        (payload) => setUsers(prev => prev.filter(u => u.id !== payload.old.id))
      )
      .subscribe();

    // Canal: notices
    const noticesChannel = supabase
      .channel('realtime-notices')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notices' },
        (payload) => setNotices(prev => {
          if (prev.some(x => x.id === payload.new.id)) return prev;
          return [payload.new, ...prev];
        })
      )
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'notices' },
        (payload) => setNotices(prev => prev.map(n => n.id === payload.new.id ? payload.new : n))
      )
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'notices' },
        (payload) => setNotices(prev => prev.filter(n => n.id !== payload.old.id))
      )
      .subscribe();

    // Canal: field_service
    const fieldServiceChannel = supabase
      .channel('realtime-field-service')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'field_service' },
        (payload) => {
          const mapped = {
            id: payload.new.id,
            dayOfWeek: payload.new.day_of_week || payload.new.dayOfWeek || '',
            time: payload.new.time,
            type: payload.new.type,
            location_or_link: payload.new.location_or_link,
            conductor: payload.new.conductor
          };
          setFieldService(prev => {
            if (prev.some(x => x.id === mapped.id)) return prev;
            return [...prev, mapped];
          });
        }
      )
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'field_service' },
        (payload) => {
          const mapped = {
            id: payload.new.id,
            dayOfWeek: payload.new.day_of_week || payload.new.dayOfWeek || '',
            time: payload.new.time,
            type: payload.new.type,
            location_or_link: payload.new.location_or_link,
            conductor: payload.new.conductor
          };
          setFieldService(prev => prev.map(f => f.id === mapped.id ? mapped : f));
        }
      )
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'field_service' },
        (payload) => setFieldService(prev => prev.filter(f => f.id !== payload.old.id))
      )
      .subscribe();

    // Canal: tips
    const tipsChannel = supabase
      .channel('realtime-tips')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'tips' },
        (payload) => setTips(prev => {
          if (prev.some(x => x.id === payload.new.id)) return prev;
          return [payload.new, ...prev];
        })
      )
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'tips' },
        (payload) => setTips(prev => prev.map(t => t.id === payload.new.id ? payload.new : t))
      )
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'tips' },
        (payload) => setTips(prev => prev.filter(t => t.id !== payload.old.id))
      )
      .subscribe();

    // Canal: quick_links
    const quickLinksChannel = supabase
      .channel('realtime-quick-links')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'quick_links' },
        (payload) => setQuickLinks(prev => {
          if (prev.some(x => x.id === payload.new.id)) return prev;
          return [...prev, payload.new];
        })
      )
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'quick_links' },
        (payload) => setQuickLinks(prev => prev.map(l => l.id === payload.new.id ? payload.new : l))
      )
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'quick_links' },
        (payload) => setQuickLinks(prev => prev.filter(l => l.id !== payload.old.id))
      )
      .subscribe();

    // Cleanup: unsubscribe ao desmontar
    return () => {
      supabase.removeChannel(assignChannel);
      supabase.removeChannel(usersChannel);
      supabase.removeChannel(noticesChannel);
      supabase.removeChannel(fieldServiceChannel);
      supabase.removeChannel(tipsChannel);
      supabase.removeChannel(quickLinksChannel);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('v2_theme', isDarkMode ? 'dark' : 'light');
    if (isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDarkMode]);


  const login = (userId) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      setCurrentUser(user);
      localStorage.setItem('v2_userId', user.id);
      return true;
    }
    return false;
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('v2_userId');
  };

  // ===== CRUD ASSIGNMENTS =====
  const createAssignment = async (data) => {
    const { data: newAssign, error } = await supabase.from('assignments').insert([data]).select();
    if (!error && newAssign) setAssignments(prev => [...prev, newAssign[0]]);
  };
  const updateAssignmentStatus = async (id, newStatus) => {
    const { error } = await supabase.from('assignments').update({ status: newStatus }).eq('id', id);
    if (!error) setAssignments(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a));
  };
  const deleteAssignment = async (id) => {
    const { error } = await supabase.from('assignments').delete().eq('id', id);
    if (!error) setAssignments(prev => prev.filter(a => a.id !== id));
  };
  const reassignTask = async (assignmentId, newUserId) => {
    const { error } = await supabase.from('assignments').update({ user_id: newUserId, status: 'pending' }).eq('id', assignmentId);
    if (!error) setAssignments(prev => prev.map(a => a.id === assignmentId ? { ...a, user_id: newUserId, status: 'pending' } : a));
  };

  // ===== CRUD USERS =====
  const createUser = async (data) => {
    const { data: newUser, error } = await supabase.from('users').insert([data]).select();
    if (!error && newUser) setUsers(prev => [...prev, newUser[0]]);
  };
  const deleteUser = async (id) => {
    const { error } = await supabase.from('users').delete().eq('id', id);
    if (!error) setUsers(prev => prev.filter(u => u.id !== id));
  };
  const updateUserRole = async (id, newRole) => {
    const { error } = await supabase.from('users').update({ role: newRole }).eq('id', id);
    if (!error) setUsers(prev => prev.map(u => u.id === id ? { ...u, role: newRole } : u));
  };

  // ===== CRUD NOTICES =====
  const createNotice = async (data) => {
    const { data: newNotice, error } = await supabase.from('notices').insert([data]).select();
    if (!error && newNotice) setNotices(prev => [newNotice[0], ...prev]);
  };
  const updateNotice = async (id, data) => {
    const { data: updatedNotice, error } = await supabase.from('notices').update(data).eq('id', id).select();
    if (!error && updatedNotice) {
      setNotices(prev => prev.map(n => n.id === id ? updatedNotice[0] : n));
      return true;
    }
    return false;
  };
  const deleteNotice = async (id) => {
    const { error } = await supabase.from('notices').delete().eq('id', id);
    if (!error) setNotices(prev => prev.filter(n => n.id !== id));
  };

  // ===== CRUD TIPS =====
  const createTip = async (data) => {
    const { data: newTip, error } = await supabase.from('tips').insert([data]).select();
    if (!error && newTip) setTips(prev => [newTip[0], ...prev]);
  };
  const updateTip = async (id, data) => {
    const { data: updatedTip, error } = await supabase.from('tips').update(data).eq('id', id).select();
    if (!error && updatedTip) {
      setTips(prev => prev.map(t => t.id === id ? updatedTip[0] : t));
      return true;
    }
    return false;
  };
  const deleteTip = async (id) => {
    const { error } = await supabase.from('tips').delete().eq('id', id);
    if (!error) setTips(prev => prev.filter(t => t.id !== id));
  };
  const toggleTipActive = async (id) => {
    const tip = tips.find(t => t.id === id);
    if (!tip) return;
    const { error } = await supabase.from('tips').update({ active: !tip.active }).eq('id', id);
    if (!error) setTips(prev => prev.map(t => t.id === id ? { ...t, active: !t.active } : t));
  };

  // ===== CRUD FIELD SERVICE =====
  const createFieldService = async (data) => {
    // Mapeamento de camelCase para snake_case do Postgres/Supabase
    const dbData = {
      day_of_week: data.dayOfWeek,
      time: data.time,
      type: data.type,
      location_or_link: data.location_or_link,
      conductor: data.conductor
    };
    const { data: newField, error } = await supabase.from('field_service').insert([dbData]).select();
    if (!error && newField) {
      // Mapeamento de volta para o frontend
      const mapped = {
        id: newField[0].id,
        dayOfWeek: newField[0].day_of_week,
        time: newField[0].time,
        type: newField[0].type,
        location_or_link: newField[0].location_or_link,
        conductor: newField[0].conductor
      };
      setFieldService(prev => [...prev, mapped]);
    }
  };
  const updateFieldService = async (id, data) => {
    const dbData = {
      day_of_week: data.dayOfWeek,
      time: data.time,
      type: data.type,
      location_or_link: data.location_or_link,
      conductor: data.conductor
    };
    const { data: updatedField, error } = await supabase.from('field_service').update(dbData).eq('id', id).select();
    if (!error && updatedField) {
      const mapped = {
        id: updatedField[0].id,
        dayOfWeek: updatedField[0].day_of_week,
        time: updatedField[0].time,
        type: updatedField[0].type,
        location_or_link: updatedField[0].location_or_link,
        conductor: updatedField[0].conductor
      };
      setFieldService(prev => prev.map(f => f.id === id ? mapped : f));
      return true;
    }
    return false;
  };
  const deleteFieldService = async (id) => {
    const { error } = await supabase.from('field_service').delete().eq('id', id);
    if (!error) setFieldService(prev => prev.filter(f => f.id !== id));
  };

  // ===== UPDATE PROFILE =====
  const updateUserProfile = async (id, profileData) => {
    const { error } = await supabase.from('users').update(profileData).eq('id', id);
    if (!error) {
      setUsers(prev => prev.map(u => u.id === id ? { ...u, ...profileData } : u));
      if (currentUser?.id === id) {
        setCurrentUser(prev => prev ? { ...prev, ...profileData } : null);
      }
      return true;
    }
    return false;
  };

  // ===== CRUD QUICK LINKS =====
  const createQuickLink = async (data) => {
    const { data: newLink, error } = await supabase.from('quick_links').insert([data]).select();
    if (!error && newLink) setQuickLinks(prev => [...prev, newLink[0]]);
  };
  const updateQuickLink = async (id, data) => {
    const { data: updatedLink, error } = await supabase.from('quick_links').update(data).eq('id', id).select();
    if (!error && updatedLink) {
      setQuickLinks(prev => prev.map(l => l.id === id ? updatedLink[0] : l));
      return true;
    }
    return false;
  };
  const deleteQuickLink = async (id) => {
    const { error } = await supabase.from('quick_links').delete().eq('id', id);
    if (!error) setQuickLinks(prev => prev.filter(l => l.id !== id));
  };

  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);

  const value = {
    users, assignments, meetings, notices, tips, fieldService, quickLinks, currentUser, isDarkMode, loading,
    createAssignment, updateAssignmentStatus, deleteAssignment, reassignTask,
    createUser, deleteUser, updateUserRole, updateUserProfile,
    createNotice, updateNotice, deleteNotice,
    createTip, updateTip, deleteTip, toggleTipActive,
    createFieldService, updateFieldService, deleteFieldService,
    createQuickLink, updateQuickLink, deleteQuickLink,
    toggleDarkMode, login, logout,
    refreshData: () => fetchAllData(false)
  };

  return (
    <DataContext.Provider value={value}>
      {/* Tela de Loading inicial enquanto busca os dados */}
      {loading ? (
        <div className="h-[100dvh] flex flex-col items-center justify-center bg-[#f8fafc] dark:bg-[#0b1120]">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-sm font-bold text-slate-500">Conectando ao banco de dados...</p>
        </div>
      ) : (
        children
      )}
    </DataContext.Provider>
  );
};

export const useData = () => useContext(DataContext);
