import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataStore';
import { Settings, ShieldCheck, Moon, Sun, User as UserIcon, LogOut, ChevronRight, Hash, Star, KeyRound } from 'lucide-react';

export default function MenuPage() {
  const navigate = useNavigate();
  const { currentUser, assignments, isDarkMode, toggleDarkMode, logout } = useData();
  const [profileExpanded, setProfileExpanded] = useState(false);
  const pendingRejected = assignments.filter(a => a.status === 'rejected').length;

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      <section>
        <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Menu</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 font-medium">Opções e configurações da sua conta.</p>
      </section>

      <div className="space-y-3">

        {/* ===== MEU PERFIL (Card expansível com informações reais) ===== */}
        <div className="rounded-[24px] bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <button
            onClick={() => setProfileExpanded(!profileExpanded)}
            className="w-full flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all"
          >
            <div className="flex items-center gap-3">
              {/* Avatar com inicial */}
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-lg font-black shadow-md">
                {currentUser?.name?.charAt(0).toUpperCase() || '?'}
              </div>
              <div className="text-left">
                <p className="font-black text-slate-800 dark:text-slate-100 leading-none">
                  {currentUser?.name || 'Usuário'}
                </p>
                <p className="text-[11px] font-bold text-slate-400 mt-0.5">
                  {currentUser?.role === 'admin' ? '👑 Administrador' : 'Publicador'}
                </p>
              </div>
            </div>
            <ChevronRight
              size={18}
              className={`text-slate-400 transition-transform duration-300 ${profileExpanded ? 'rotate-90' : ''}`}
            />
          </button>

          {/* Detalhes do perfil expansível */}
          {profileExpanded && (
            <div className="border-t border-slate-100 dark:border-slate-800/50 px-4 pb-4 pt-3 space-y-3 animate-fade-in">
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
                <div className="w-8 h-8 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center">
                  <UserIcon size={15} className="text-slate-500 dark:text-slate-400" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nome</p>
                  <p className="text-sm font-black text-slate-800 dark:text-slate-100">{currentUser?.name || '—'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
                <div className="w-8 h-8 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center">
                  <Star size={15} className="text-amber-500" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Permissão</p>
                  <p className="text-sm font-black text-slate-800 dark:text-slate-100">
                    {currentUser?.role === 'admin' ? 'Administrador' : 'Publicador'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
                <div className="w-8 h-8 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center">
                  <KeyRound size={15} className="text-indigo-500" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">PIN de Acesso</p>
                  <p className="text-sm font-black text-slate-800 dark:text-slate-100 font-mono tracking-widest">
                    {'•'.repeat(currentUser?.pin?.length || 4)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
                <div className="w-8 h-8 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center">
                  <Hash size={15} className="text-slate-500 dark:text-slate-400" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">ID do Usuário</p>
                  <p className="text-xs font-mono text-slate-500 dark:text-slate-400 truncate max-w-[200px]">
                    {currentUser?.id || '—'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ===== AJUSTES GERAIS + TEMA (agrupados) ===== */}
        <div className="rounded-[24px] bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          {/* Ajustes Gerais */}
          <button
            onClick={() => navigate('/ajustes')}
            className="w-full flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                <Settings size={20} />
              </div>
              <div className="text-left">
                <span className="font-black text-slate-800 dark:text-slate-100 block">Ajustes Gerais</span>
                <span className="text-[11px] font-medium text-slate-400">Idioma, versão e mais</span>
              </div>
            </div>
            <ChevronRight size={18} className="text-slate-400" />
          </button>

          {/* Tema Escuro (toggle inline) */}
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl transition-colors ${isDarkMode ? 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400' : 'bg-amber-100 dark:bg-amber-500/20 text-amber-500'}`}>
                {isDarkMode ? <Moon size={20} /> : <Sun size={20} />}
              </div>
              <div>
                <span className="font-black text-slate-800 dark:text-slate-100 block">
                  {isDarkMode ? 'Tema Escuro' : 'Tema Claro'}
                </span>
                <span className="text-[11px] font-medium text-slate-400">Toque para alternar</span>
              </div>
            </div>
            {/* Toggle switch */}
            <label className="relative inline-flex items-center cursor-pointer" onClick={toggleDarkMode}>
              <div className={`w-12 h-6 rounded-full transition-all duration-300 ${isDarkMode ? 'bg-indigo-500' : 'bg-slate-200 dark:bg-slate-700'}`}>
                <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all duration-300 ${isDarkMode ? 'left-[26px]' : 'left-0.5'}`} />
              </div>
            </label>
          </div>
        </div>

        {/* ===== PAINEL DE ADMINISTRAÇÃO (somente admin) ===== */}
        {currentUser?.role === 'admin' && (
          <button
            onClick={() => navigate('/admin')}
            className="w-full flex items-center justify-between p-4 rounded-[24px] bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:scale-[1.02] transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <ShieldCheck size={20} />
              </div>
              <div className="text-left">
                <span className="font-black text-slate-800 dark:text-slate-100 block">Painel de Administração</span>
                <span className="text-[11px] font-medium text-slate-400">Usuários, designações e conteúdo</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {pendingRejected > 0 && (
                <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm animate-pulse">
                  {pendingRejected}
                </span>
              )}
              <ChevronRight size={18} className="text-slate-400" />
            </div>
          </button>
        )}

        {/* ===== SAIR DA CONTA ===== */}
        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 p-4 mt-4 rounded-[24px] bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 shadow-sm hover:bg-red-100 dark:hover:bg-red-500/20 hover:scale-[1.02] transition-all"
        >
          <LogOut size={20} />
          <span className="font-black">Sair da Conta</span>
        </button>

      </div>
    </div>
  );
}
