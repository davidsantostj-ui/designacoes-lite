import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Home, CalendarDays, CalendarClock, Search, RefreshCw, Menu, X, AlertTriangle } from 'lucide-react';
import { DataProvider, useData } from './context/DataStore';

import Dashboard from './pages/Dashboard';
import Meetings from './pages/Meetings';
import Schedule from './pages/Schedule';
import SettingsPage from './pages/Settings';
import Admin from './pages/Admin';
import Activities from './pages/Activities';
import FieldService from './pages/FieldService';
import MenuPage from './pages/Menu';
import Login from './pages/Login';

// Toast flutuante para o App
function AppToast({ msg, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, [onClose]);
  const colors = { success: 'bg-emerald-500', error: 'bg-red-500', info: 'bg-blue-500', warning: 'bg-amber-500' };
  return (
    <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-2 px-5 py-3 rounded-2xl text-white text-sm font-bold shadow-2xl animate-slide-up ${colors[type] || colors.info}`}>
      <span>{msg}</span>
      <button onClick={onClose} className="ml-1 opacity-70 hover:opacity-100"><X size={14}/></button>
    </div>
  );
}

const LayoutContent = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, assignments, loading, refreshData, notices, users } = useData();

  // Search & Refresh States
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toast, setToast] = useState(null);

  const handleRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      await refreshData();
      setToast({ msg: 'Dados sincronizados com o servidor 🔄', type: 'success' });
    } catch (e) {
      setToast({ msg: 'Erro ao sincronizar dados.', type: 'error' });
    } finally {
      setTimeout(() => setIsRefreshing(false), 800);
    }
  };

  // Se não estiver logado, exibe a tela de Login
  if (!currentUser) {
    if (loading) return null; // Evita flash da tela de login durante o fetch inicial
    return <Login />;
  }

  // Bolinha vermelha no Menu se houver designação rejeitada pendente (Admin)
  const pendingRejected = currentUser?.role === 'admin' ? assignments.filter(a => a.status === 'rejected').length : 0;

  // Menu de navegação inferior
  const navItems = [
    { path: '/', label: 'Início', icon: Home },
    { path: '/reunioes', label: 'Reuniões', icon: CalendarClock },
    { path: '/agenda', label: 'Agenda', icon: CalendarDays },
    { path: '/menu', label: 'Menu', icon: Menu, badge: pendingRejected },
  ];

  return (
    <div className="h-[100dvh] flex flex-col bg-[#f8fafc] dark:bg-[#0b1120] text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200 overflow-hidden relative">
      
      {/* TopBar Premium */}
      <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg sticky top-0 z-40 px-5 py-3 flex items-center justify-between shadow-sm border-b border-slate-200/50 dark:border-slate-800/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-md text-white font-black text-lg border-2 border-white dark:border-slate-800">
            {currentUser?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="hidden sm:block">
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest leading-none mb-0.5">Bem vindo!</p>
            <h1 className="text-sm font-black text-slate-800 dark:text-slate-100 leading-none">
              {currentUser?.name?.split(' ')[0]}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button 
            onClick={() => setIsSearchOpen(true)}
            className="w-9 h-9 rounded-full flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Search size={18} />
          </button>
          <button 
            onClick={handleRefresh}
            className="w-9 h-9 rounded-full flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <RefreshCw size={18} className={isRefreshing ? 'animate-spin text-blue-500' : ''} />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-x-hidden overflow-y-auto w-full relative z-0">
        <div className="max-w-lg mx-auto w-full px-4 pt-6 pb-24">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/reunioes" element={<Meetings />} />
            <Route path="/agenda" element={<Schedule />} />
            <Route path="/menu" element={<MenuPage />} />
            <Route path="/atividades" element={<Activities />} />
            <Route path="/campo" element={<FieldService />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/ajustes" element={<SettingsPage />} />
          </Routes>
        </div>
      </main>

      {/* Bottom Nav Premium */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg pb-safe border-t border-slate-200/50 dark:border-slate-800/50 z-30">
        <div className="max-w-lg mx-auto flex justify-between px-4 py-2">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
            return (
              <button 
                key={item.path} 
                onClick={() => navigate(item.path)}
                className={`relative flex flex-col items-center justify-center w-[4.5rem] h-14 rounded-2xl transition-all duration-300 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
              >
                {item.badge > 0 && (
                  <span className="absolute top-2 right-3 w-2 h-2 rounded-full bg-red-500 shadow-[0_0_0_2px_#ffffff] dark:shadow-[0_0_0_2px_#0f172a]" />
                )}
                <div className={`transition-transform duration-300 ${isActive ? '-translate-y-1' : ''}`}>
                  <Icon size={isActive ? 24 : 22} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                {isActive && (
                  <span className="absolute bottom-1 text-[10px] font-bold tracking-wide">
                    {item.label}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Overlay de Busca Universal */}
      {isSearchOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-[9999] flex flex-col p-4 animate-fade-in text-slate-100">
          <div className="max-w-lg mx-auto w-full flex flex-col h-full">
            {/* Header de busca */}
            <div className="flex items-center gap-3 py-3 border-b border-slate-800">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input 
                  type="text" 
                  placeholder="Pesquise tarefas, avisos ou membros..." 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 text-slate-100 text-sm font-semibold pl-10 pr-4 py-3 rounded-2xl focus:outline-none focus:border-blue-500 transition-colors placeholder-slate-500"
                  autoFocus
                />
              </div>
              <button 
                onClick={() => { setIsSearchOpen(false); setSearchQuery(''); }}
                className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Resultados de busca */}
            <div className="flex-1 overflow-y-auto py-4 space-y-6">
              {searchQuery.trim() === '' ? (
                <div className="text-center py-12 text-slate-500">
                  <Search size={36} className="mx-auto mb-2 opacity-30 text-slate-400" />
                  <p className="text-xs font-black uppercase tracking-widest">Busca Universal</p>
                  <p className="text-xs mt-1 font-medium">Digite para buscar designações, irmãos ou avisos.</p>
                </div>
              ) : (
                (() => {
                  const query = searchQuery.toLowerCase().trim();
                  
                  // Filtrar Usuários
                  const filteredUsers = users.filter(u => u.name.toLowerCase().includes(query));
                  
                  // Filtrar Avisos
                  const filteredNotices = notices.filter(n => 
                    n.title.toLowerCase().includes(query) || 
                    n.content.toLowerCase().includes(query)
                  );

                  // Filtrar Designações
                  const filteredAssignments = assignments.filter(a => {
                    const userName = users.find(u => u.id === a.user_id)?.name || '';
                    return a.type.toLowerCase().includes(query) || userName.toLowerCase().includes(query);
                  });

                  const totalResults = filteredUsers.length + filteredNotices.length + filteredAssignments.length;

                  if (totalResults === 0) {
                    return (
                      <div className="text-center py-12 text-slate-500">
                        <AlertTriangle size={32} className="mx-auto mb-2 text-slate-500 opacity-55" />
                        <p className="text-xs font-black uppercase tracking-widest">Nenhum resultado</p>
                        <p className="text-xs mt-1 font-medium">Não encontramos nada para "{searchQuery}".</p>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-6">
                      {/* Categoria: Membros */}
                      {filteredUsers.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-[10px] font-black tracking-widest uppercase text-slate-500 px-1">Membros ({filteredUsers.length})</h4>
                          <div className="space-y-1">
                            {filteredUsers.map(u => (
                              <div 
                                key={u.id} 
                                onClick={() => {
                                  setIsSearchOpen(false);
                                  setSearchQuery('');
                                  navigate('/menu');
                                }}
                                className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900/40 border border-slate-800/80 hover:bg-slate-800/50 hover:scale-[1.01] transition-all cursor-pointer"
                              >
                                <span className="text-sm font-bold text-slate-200">{u.name}</span>
                                <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                                  {u.role === 'admin' ? '👑 Admin' : 'Publicador'}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Categoria: Designações */}
                      {filteredAssignments.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-[10px] font-black tracking-widest uppercase text-slate-500 px-1">Designações ({filteredAssignments.length})</h4>
                          <div className="space-y-1.5">
                            {filteredAssignments.map(a => {
                              const userName = users.find(u => u.id === a.user_id)?.name || 'Sem nome';
                              const formattedDate = a.date.split('-').reverse().join('/');
                              const statusLabels = {
                                pending: { text: 'Pendente', class: 'bg-amber-500/20 text-amber-400' },
                                accepted: { text: 'Confirmado', class: 'bg-emerald-500/20 text-emerald-400' },
                                rejected: { text: 'Recusado', class: 'bg-rose-500/20 text-rose-400' }
                              };
                              const label = statusLabels[a.status] || { text: a.status, class: 'bg-slate-800 text-slate-400' };
                              return (
                                <div 
                                  key={a.id} 
                                  onClick={() => {
                                    setIsSearchOpen(false);
                                    setSearchQuery('');
                                    navigate('/agenda');
                                  }}
                                  className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900/40 border border-slate-800/80 hover:bg-slate-800/50 hover:scale-[1.01] transition-all cursor-pointer"
                                >
                                  <div>
                                    <span className="text-sm font-bold text-slate-200 block">{a.type}</span>
                                    <span className="text-xs text-slate-400 mt-0.5 font-medium block">
                                      👤 {userName} • 📅 {formattedDate}
                                    </span>
                                  </div>
                                  <span className={`text-[9px] font-extrabold uppercase px-2 py-1 rounded ${label.class}`}>
                                    {label.text}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Categoria: Mural de Avisos */}
                      {filteredNotices.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-[10px] font-black tracking-widest uppercase text-slate-500 px-1">Mural de Avisos ({filteredNotices.length})</h4>
                          <div className="space-y-1.5">
                            {filteredNotices.map(n => (
                              <div 
                                key={n.id} 
                                onClick={() => {
                                  setIsSearchOpen(false);
                                  setSearchQuery('');
                                  navigate('/');
                                }}
                                className="p-3.5 rounded-xl bg-slate-900/40 border border-slate-800/80 hover:bg-slate-800/50 hover:scale-[1.01] transition-all cursor-pointer space-y-1"
                              >
                                <span className="text-sm font-bold text-slate-200 block">{n.title}</span>
                                <span className="text-xs text-slate-400 font-medium line-clamp-2 block">{n.content}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()
              )}
            </div>
          </div>
        </div>
      )}

      {toast && <AppToast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default function App() {
  return (
    <DataProvider>
      <BrowserRouter>
        <LayoutContent />
      </BrowserRouter>
    </DataProvider>
  );
}