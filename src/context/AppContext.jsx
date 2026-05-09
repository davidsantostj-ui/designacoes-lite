import React, { createContext, useContext, useReducer, useCallback, useMemo } from 'react';

const AppContext = createContext(null);

const initialState = {
  user: {
    id: 'mock-admin-001',
    name: 'Administrador',
    email: 'admin@local.test',
    role: 'admin',
    approved: true,
    isAdmin: true
  },
  data: {
    users: [
      { id: '1', name: 'João Silva', email: 'joao@teste.com', approved: true },
      { id: '2', name: 'Maria Santos', email: 'maria@teste.com', approved: true }
    ],
    assignments: [
      { id: 'a1', userId: '1', userName: 'João Silva', date: '2024-01-15', type: 'Leitura' },
      { id: 'a2', userId: '2', userName: 'Maria Santos', date: '2024-01-15', type: 'Oração' }
    ],
    meetings: [
      { id: 'm1', date: '2024-01-20', theme: 'Revisão Semanal' }
    ],
    talks: [],
    notifications: [],
    announcements: [
      { id: 'an1', title: 'Bem-vindo!', message: 'Sistema de designações online', pinned: true }
    ],
    specialEvents: [],
    swapLogs: []
  },
  view: 'DASHBOARD',
  isLoading: false,
  isDarkMode: localStorage.getItem('theme') === 'dark',
  filters: {
    name: '',
    date: '',
    type: '',
    status: '',
    hasFiltered: false
  }
};

function appReducer(state, action) {
  switch (action.type) {
    case 'SET_VIEW':
      return { ...state, view: action.payload };
    case 'SET_DATA':
      return { ...state, data: { ...state.data, ...action.payload } };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'TOGGLE_DARK_MODE':
      const newDarkMode = !state.isDarkMode;
      localStorage.setItem('theme', newDarkMode ? 'dark' : 'light');
      return { ...state, isDarkMode: newDarkMode };
    case 'SET_FILTERS':
      return { ...state, filters: { ...state.filters, ...action.payload } };
    case 'CLEAR_FILTERS':
      return { ...state, filters: initialState.filters };
    default:
      return state;
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  const setView = useCallback((view) => {
    dispatch({ type: 'SET_VIEW', payload: view });
    window.history.pushState({}, '', `/${view.toLowerCase()}`);
  }, []);

  const setData = useCallback((data) => {
    dispatch({ type: 'SET_DATA', payload: data });
  }, []);

  const setLoading = useCallback((isLoading) => {
    dispatch({ type: 'SET_LOADING', payload: isLoading });
  }, []);

  const toggleDarkMode = useCallback(() => {
    dispatch({ type: 'TOGGLE_DARK_MODE' });
  }, []);

  const setFilters = useCallback((filters) => {
    dispatch({ type: 'SET_FILTERS', payload: filters });
  }, []);

  const clearFilters = useCallback(() => {
    dispatch({ type: 'CLEAR_FILTERS' });
  }, []);

  // Computed values
  const stats = useMemo(() => {
    const users = state.data?.users || [];
    const assignments = state.data?.assignments || [];
    const meetings = state.data?.meetings || [];
    const notifications = state.data?.notifications || [];
    const announcements = state.data?.announcements || [];
    return {
      totalUsers: users.length,
      totalAssignments: assignments.length,
      totalMeetings: meetings.length,
      totalNotifications: notifications.length,
      totalAnnouncements: announcements.length,
      pendingApprovals: users.filter(u => !u.approved).length
    };
  }, [state.data]);

  const value = useMemo(() => ({
    ...state,
    setView,
    setData,
    setLoading,
    toggleDarkMode,
    setFilters,
    clearFilters,
    stats
  }), [state, setView, setData, setLoading, toggleDarkMode, setFilters, clearFilters, stats]);

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}

export default AppContext;