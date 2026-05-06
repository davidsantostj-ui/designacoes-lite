import React from 'react';
import { Key, LogOut, Moon, RefreshCw } from 'lucide-react';
import UserAvatar from './UserAvatar';

const UserMenuModal = ({
  open,
  user,
  displayName,
  currentVersion,
  isRefreshing,
  onToggleDark,
  onRefresh,
  onOpenAccount,
  onOpenHelp,
  onOpenAbout,
  onLogout,
  onClose
}) => {
  if (!open) return null;
  if (!user) return null;

  return (
    <div
      className="fixed inset-0 z-[120] bg-black/30 flex items-start justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm bg-white dark:bg-navy-900 card-surface rounded-4xl shadow-2xl p-5 space-y-4 animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3">
          <UserAvatar
            name={user.name}
            surname={user.surname}
            userId={user.id}
            size="md"
            lastActive={Date.now()}
          />
          <div className="min-w-0">
            <p className="text-sm font-black truncate">{displayName}</p>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">
              {user.email || ''}
            </p>
            <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest mt-1">
              Versão {currentVersion || '4.0.3'}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={onToggleDark}
            className="flex items-center justify-center gap-2 px-3 py-3 rounded-2xl bg-slate-100 dark:bg-navy-800 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300"
          >
            <Moon size={16} /> Tema
          </button>
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex items-center justify-center gap-2 px-3 py-3 rounded-2xl bg-slate-100 dark:bg-navy-800 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 disabled:opacity-60"
          >
            <RefreshCw size={16} /> {isRefreshing ? 'Atualizando...' : 'Atualizar'}
          </button>
          <button
            onClick={onOpenAccount}
            className="flex items-center justify-center gap-2 px-3 py-3 rounded-2xl bg-slate-100 dark:bg-navy-800 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300"
          >
            <Key size={16} /> Conta
          </button>
          <button
            onClick={onLogout}
            className="flex items-center justify-center gap-2 px-3 py-3 rounded-2xl bg-red-50 text-red-500 text-[10px] font-black uppercase tracking-widest"
          >
            <LogOut size={16} /> Sair
          </button>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onOpenHelp}
            className="flex-1 px-3 py-2 rounded-2xl bg-slate-50 dark:bg-navy-800 text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-300"
          >
            Ajuda
          </button>
          <button
            onClick={onOpenAbout}
            className="flex-1 px-3 py-2 rounded-2xl bg-slate-50 dark:bg-navy-800 text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-300"
          >
            Sobre
          </button>
        </div>
        <button
          onClick={onClose}
          className="w-full text-center text-[10px] font-black uppercase tracking-widest text-slate-400"
        >
          Fechar
        </button>
      </div>
    </div>
  );
};

export default UserMenuModal;
