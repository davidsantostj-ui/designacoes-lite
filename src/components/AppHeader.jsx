import React from 'react';
import { Bell, Search, Settings, RefreshCw } from 'lucide-react';
import UserAvatar from './UserAvatar';

const AppHeader = ({
  user,
  getUserDisplayName,
  setIsUserMenuOpen,
  setView,
  handleManualUpdate,
  updateAvailable,
  isUpdatingApp,
  handleOpenNotices,
  totalAlertsCount,
  hasAdminAccess,
  handleOpenAdminProgramming,
  isImpersonating,
  view
}) => {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/70 shadow-sm glass header-surface dark:border-slate-800">
      <div className="app-shell flex items-center justify-between gap-3 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <button onClick={() => setIsUserMenuOpen(true)} className="touch-target">
            <UserAvatar
              name={user.name}
              surname={user.surname}
              userId={user.id}
              size="md"
              lastActive={Date.now()}
            />
          </button>

          <div className="min-w-0 max-w-[58vw] sm:max-w-none">
            <h2 className="truncate text-[15px] font-black leading-tight text-slate-900 dark:text-white sm:text-base">
              Olá, {getUserDisplayName(user)}
            </h2>
            <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-500">
              Acesso ativo
            </span>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5 rounded-2xl border border-slate-200/70 bg-white/85 px-2 py-1.5 shadow-sm dark:border-slate-700 dark:bg-navy-800/85">
          <button
            onClick={() => setView('SEARCH')}
            className="touch-target h-9 w-9 rounded-xl text-slate-600"
          >
            <Search size={16} />
          </button>
          <button
            onClick={handleManualUpdate}
            className={`touch-target h-9 w-9 rounded-xl ${
              updateAvailable ? 'bg-emerald-600/15 text-emerald-700' : 'text-slate-600'
            }`}
            title="Atualizar app"
          >
            <RefreshCw size={16} className={isUpdatingApp ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={() => handleOpenNotices('NOTIFICATIONS')}
            className="touch-target relative h-9 w-9 rounded-xl text-slate-600"
          >
            <Bell size={16} />
            {totalAlertsCount > 0 && (
              <div className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full border border-white bg-red-500" />
            )}
          </button>

          {hasAdminAccess && (
            <button
              onClick={() => handleOpenAdminProgramming('PROG_OVERVIEW')}
              className={`touch-target h-9 w-9 rounded-xl ${
                isImpersonating
                  ? 'bg-orange-500/15 text-orange-600'
                  : view === 'ADMIN'
                    ? 'bg-navy-900 text-white'
                    : 'text-slate-600'
              }`}
              title={isImpersonating ? 'Voltar ao admin' : 'Abrir admin'}
            >
              <Settings size={16} />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
