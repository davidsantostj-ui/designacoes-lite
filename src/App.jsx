import React from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Home, CalendarDays, CalendarClock, Search, RefreshCw, Menu } from 'lucide-react';
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

const LayoutContent = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, assignments, loading } = useData();

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
          <button className="w-9 h-9 rounded-full flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <Search size={18} />
          </button>
          <button className="w-9 h-9 rounded-full flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <RefreshCw size={18} />
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
            // Considerando ativo se a rota começar com o path do item, ou for exato
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