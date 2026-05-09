import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataStore';
import { User, Mail, Lock, Moon, Sun, Globe, DownloadCloud, Info, ChevronRight, LogOut, ArrowLeft } from 'lucide-react';

export default function Settings() {
  const { currentUser, isDarkMode, toggleDarkMode } = useData();
  const navigate = useNavigate();

  const OptionRow = ({ icon: Icon, title, value, onClick, isLast }) => (
    <button onClick={onClick} className={`w-full flex items-center justify-between p-4 bg-white dark:bg-slate-900/50 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors ${!isLast ? 'border-b border-slate-100 dark:border-slate-800/50' : ''}`}>
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400">
          <Icon size={16} strokeWidth={2.5} />
        </div>
        <span className="text-sm font-black text-slate-700 dark:text-slate-200">{title}</span>
      </div>
      <div className="flex items-center gap-2">
        {value && <span className="text-xs font-bold text-slate-400 max-w-[150px] truncate">{value}</span>}
        {onClick && <ChevronRight size={16} className="text-slate-300" />}
      </div>
    </button>
  );

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      <div className="flex items-center gap-3 mb-6">
        <button 
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm"
        >
          <ArrowLeft size={20} className="text-slate-600 dark:text-slate-300" />
        </button>
        <div>
          <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white leading-none">Ajustes</h2>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">Configure seu perfil e preferências.</p>
        </div>
      </div>

      <div className="animate-slide-up" style={{ animationDelay: '50ms' }}>
        <h3 className="text-[10px] font-black tracking-[0.2em] uppercase text-slate-400 mb-2 px-2">Perfil</h3>
        <div className="rounded-[24px] overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm">
          <OptionRow icon={User} title="Nome" value={currentUser?.name} onClick={() => alert('Modo de demonstração: Edição desativada')} />
          <OptionRow icon={Mail} title="E-mail" value={currentUser?.email} onClick={() => alert('Modo de demonstração: Edição desativada')} />
          <OptionRow icon={Lock} title="Senha" value="********" onClick={() => alert('Modo de demonstração: Edição desativada')} isLast />
        </div>
      </div>

      <div className="animate-slide-up" style={{ animationDelay: '100ms' }}>
        <h3 className="text-[10px] font-black tracking-[0.2em] uppercase text-slate-400 mb-2 px-2 mt-6">Preferências</h3>
        <div className="rounded-[24px] overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900/50">
          <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800/50">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400">
                {isDarkMode ? <Moon size={16} strokeWidth={2.5} /> : <Sun size={16} strokeWidth={2.5} />}
              </div>
              <span className="text-sm font-black text-slate-700 dark:text-slate-200">Modo Escuro</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" checked={isDarkMode} onChange={toggleDarkMode} />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-500"></div>
            </label>
          </div>
          <OptionRow icon={Globe} title="Idioma" value="Português (BR)" onClick={() => alert('Apenas PT-BR disponível')} isLast />
        </div>
      </div>

      <div className="animate-slide-up" style={{ animationDelay: '150ms' }}>
        <h3 className="text-[10px] font-black tracking-[0.2em] uppercase text-slate-400 mb-2 px-2 mt-6">Sistema</h3>
        <div className="rounded-[24px] overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm">
          <OptionRow icon={DownloadCloud} title="Buscar Atualizações" onClick={() => alert('O aplicativo já está na versão mais recente!')} />
          <OptionRow icon={Info} title="Versão do App" value="v6.0.0-lite" isLast />
        </div>
      </div>
      
      <div className="pt-4 flex justify-center animate-slide-up" style={{ animationDelay: '200ms' }}>
        <button className="text-xs font-black text-red-500 uppercase tracking-widest px-6 py-4 rounded-2xl hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors flex items-center gap-2">
          <LogOut size={16} strokeWidth={3} /> Sair do Aplicativo
        </button>
      </div>
    </div>
  );
}
