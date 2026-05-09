import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataStore';
import { Settings, Shield, Moon, User as UserIcon, LogOut, ChevronRight } from 'lucide-react';

export default function MenuPage() {
  const navigate = useNavigate();
  const { currentUser, assignments, isDarkMode, toggleDarkMode } = useData();
  const pendingRejected = assignments.filter(a => a.status === 'rejected').length;

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      <section>
        <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Menu</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 font-medium">Opções e configurações da sua conta.</p>
      </section>

      <div className="space-y-3">
        <button 
          onClick={() => navigate('/ajustes')}
          className="w-full flex items-center justify-between p-4 rounded-[24px] bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:scale-[1.02] transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
              <Settings size={20} />
            </div>
            <span className="font-black text-slate-800 dark:text-slate-100">Ajustes Gerais</span>
          </div>
          <ChevronRight size={18} className="text-slate-400" />
        </button>

        {currentUser?.role === 'admin' && (
          <button 
            onClick={() => navigate('/admin')}
            className="w-full flex items-center justify-between p-4 rounded-[24px] bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:scale-[1.02] transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <Shield size={20} />
              </div>
              <span className="font-black text-slate-800 dark:text-slate-100">Painel de Administração</span>
            </div>
            <div className="flex items-center gap-2">
              {pendingRejected > 0 && (
                <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                  {pendingRejected}
                </span>
              )}
              <ChevronRight size={18} className="text-slate-400" />
            </div>
          </button>
        )}

        <button 
          onClick={toggleDarkMode}
          className="w-full flex items-center justify-between p-4 rounded-[24px] bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:scale-[1.02] transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Moon size={20} />
            </div>
            <span className="font-black text-slate-800 dark:text-slate-100">
              {isDarkMode ? 'Mudar para Tema Claro' : 'Mudar para Tema Escuro'}
            </span>
          </div>
        </button>

        <button 
          className="w-full flex items-center justify-between p-4 rounded-[24px] bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:scale-[1.02] transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <UserIcon size={20} />
            </div>
            <span className="font-black text-slate-800 dark:text-slate-100">Meu Perfil</span>
          </div>
          <ChevronRight size={18} className="text-slate-400" />
        </button>

        <button 
          className="w-full flex items-center justify-center gap-2 p-4 mt-8 rounded-[24px] bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 shadow-sm hover:bg-red-100 dark:hover:bg-red-500/20 hover:scale-[1.02] transition-all"
        >
          <LogOut size={20} />
          <span className="font-black">Sair da Conta</span>
        </button>
      </div>
    </div>
  );
}
