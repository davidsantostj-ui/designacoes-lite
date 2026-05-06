import React from 'react';

const NotificationsHistoryView = ({
  dataReady,
  notificationsForUser,
  renderSkeletonList,
  getFriendlyTime,
  totalApprovedUsers,
  handleClearNotifications,
  setView,
  updateDoc,
  doc,
  db,
  arrayUnion,
  resolveNotificationTarget,
  user,
  onClose,
  onLoadMore,
  hasMore,
  isLoadingMore
}) => {
  return (
    <div className="page-shell space-y-4 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2 px-1">
        <h2 className="text-xl font-black uppercase tracking-tight">Histórico</h2>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleClearNotifications}
            className="text-[9px] font-black text-red-500 uppercase tracking-widest"
          >
            LIMPAR
          </button>
          <button
            onClick={onClose}
            className="text-[9px] font-black text-slate-400 uppercase tracking-widest"
          >
            FECHAR
          </button>
        </div>
      </div>
      <div className="space-y-3">
        {!dataReady.notifications ? (
          <div className="space-y-3">{renderSkeletonList(5, 'h-16 w-full')}</div>
        ) : (
          <>
            {notificationsForUser.map((n) => {
              const readBy = n.read_by || [];
              const isRead = readBy.includes(user.id);
              return (
                <button
                  key={n.id}
                  onClick={() => {
                    updateDoc(doc(db, 'notifications', n.id), {
                      read_by: arrayUnion(user.id)
                    }).catch(() => {});
                    setView(resolveNotificationTarget(n));
                  }}
                  className={`w-full text-left p-4 rounded-3xl shadow-sm border-l-4 animate-slide-up hover:shadow-md transition-all card-surface ${isRead ? 'bg-white dark:bg-navy-800 border-navy-900 dark:border-blue-500' : 'bg-amber-50 dark:bg-amber-900/20 border-amber-500'}`}
                >
                  <p className="text-sm font-semibold dark:text-slate-100">{n.text}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[8px] text-slate-400 uppercase font-bold tracking-widest">
                      {getFriendlyTime(n.created_at)}
                    </span>
                    <span className="text-[8px] font-black uppercase text-slate-500">
                      Lido: {(readBy || []).length}/{totalApprovedUsers}
                    </span>
                  </div>
                </button>
              );
            })}
            {notificationsForUser.length === 0 && (
              <p className="text-center py-20 text-slate-400 font-bold uppercase text-[10px]">
                Sem novidades recentes.
              </p>
            )}
            {hasMore && (
              <button
                type="button"
                onClick={() => onLoadMore && onLoadMore()}
                disabled={isLoadingMore}
                className="w-full bg-white dark:bg-navy-800 card-surface py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 disabled:opacity-60"
              >
                {isLoadingMore ? 'Carregando...' : 'Carregar mais'}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default NotificationsHistoryView;
