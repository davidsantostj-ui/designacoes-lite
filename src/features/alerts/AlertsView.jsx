import React from 'react';
import { Pin } from 'lucide-react';

const AlertsView = ({
  user,
  notificationsForUser,
  data,
  alertTab,
  setAlertTab,
  handleOpenNotification,
  handleMarkAnnouncementRead,
  handleClearNotifications,
  getFriendlyTime,
  unreadNotificationsCount,
  unreadAnnouncementsCount,
  onClose
}) => {
  return (
    <div className="page-shell space-y-4 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2 px-1">
        <h2 className="text-xl font-black uppercase tracking-tight">Central de Avisos</h2>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={onClose}
            className="text-[9px] font-black text-slate-400 uppercase tracking-widest"
          >
            FECHAR
          </button>
        </div>
      </div>
      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        {[
          { id: 'NOTIFICATIONS', label: `Notificações (${unreadNotificationsCount})` },
          { id: 'ANNOUNCEMENTS', label: `Anúncios (${unreadAnnouncementsCount})` }
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setAlertTab(t.id)}
            className={`px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest ${alertTab === t.id ? 'bg-navy-900 text-white' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {alertTab === 'NOTIFICATIONS' && (
        <div className="space-y-3">
          {notificationsForUser.length > 0 && (
            <div className="flex justify-end">
              <button
                onClick={handleClearNotifications}
                className="text-[9px] font-black uppercase tracking-widest text-red-500 bg-red-50 dark:bg-red-900/20 dark:text-red-200 px-3 py-1.5 rounded-full"
              >
                Limpar tudo
              </button>
            </div>
          )}
          {notificationsForUser.map((n) => {
            const isRead = (n.read_by || []).includes(user.id);
            return (
              <div
                key={n.id}
                onClick={() => handleOpenNotification(n)}
                className={`w-full text-left p-4 rounded-3xl shadow-sm border-l-4 animate-slide-up hover:shadow-md transition-all card-surface ${isRead ? 'bg-white dark:bg-navy-800 border-navy-900 dark:border-blue-500' : 'bg-amber-50 dark:bg-amber-900/20 border-amber-500'}`}
              >
                <p className="text-sm font-bold">{n.text}</p>
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">
                  {getFriendlyTime(n.created_at)}
                </span>
              </div>
            );
          })}
          {notificationsForUser.length === 0 && (
            <p className="text-center text-xs text-slate-400 py-10 font-bold uppercase">
              Sem notificações.
            </p>
          )}
        </div>
      )}

        {alertTab === 'ANNOUNCEMENTS' && (
        <div className="space-y-3">
          {data.announcements.map((a) => (
            <div
              key={`alert-a-${a.id}`}
              className="bg-white dark:bg-navy-800 card-surface p-4 rounded-3xl shadow-sm border dark:border-slate-800"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    {a.pinned && <Pin size={14} className="text-amber-500" />}
                    <h4 className="font-black text-sm truncate">{a.title}</h4>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{getFriendlyTime(a.created_at)}</p>
                </div>
              </div>
              <p className="text-sm mt-3">{a.message}</p>
              <div className="flex items-center justify-between mt-3">
                <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">
                  {(a.read_by || []).includes(user.id) ? 'Lido' : 'Não lido'}
                </span>
                {!(a.read_by || []).includes(user.id) && (
                  <button
                    onClick={() => handleMarkAnnouncementRead(a.id)}
                    className="text-[9px] font-black uppercase text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-200 px-3 py-1.5 rounded-full"
                  >
                    Marcar como lido
                  </button>
                )}
              </div>
            </div>
          ))}
          {data.announcements.length === 0 && (
            <p className="text-center text-xs text-slate-400 py-10 font-bold uppercase">
              Nenhum anúncio.
            </p>
          )}
        </div>
      )}

    </div>
  );
};

export default AlertsView;
