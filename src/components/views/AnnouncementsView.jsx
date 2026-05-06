import React from 'react';
import { Pin, Trash2 } from 'lucide-react';

const AnnouncementsView = ({
  isRealAdmin,
  handleClearReadAnnouncements,
  onClose,
  handleCreateAnnouncement,
  dataReady,
  data,
  getFriendlyTime,
  handleDeleteAnnouncement,
  handleMarkAnnouncementRead,
  user,
  renderSkeletonList
}) => {
  return (
    <div className="page-shell space-y-5 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-black uppercase tracking-tight">Anúncios</h2>
        <div className="flex flex-wrap items-center gap-3">
          {isRealAdmin && (
            <button
              onClick={handleClearReadAnnouncements}
              className="text-[9px] font-black text-red-500 uppercase tracking-widest"
            >
              EXCLUIR LIDOS
            </button>
          )}
          <button
            onClick={onClose}
            className="text-[9px] font-black text-slate-400 uppercase tracking-widest"
          >
            FECHAR
          </button>
        </div>
      </div>
      {isRealAdmin && (
        <form
          onSubmit={handleCreateAnnouncement}
          className="bg-white dark:bg-navy-800 card-surface p-5 rounded-4xl shadow-sm border dark:border-slate-800 space-y-3"
        >
          <h3 className="text-xs font-black uppercase text-slate-400">Novo Anúncio</h3>
          <input
            name="title"
            placeholder="Título"
            className="w-full p-3 bg-slate-50 dark:bg-navy-900 rounded-xl text-sm border dark:border-slate-700"
            required
          />
          <textarea
            name="message"
            placeholder="Mensagem"
            className="w-full p-3 bg-slate-50 dark:bg-navy-900 rounded-xl text-sm border dark:border-slate-700 min-h-[120px]"
            required
          />
          <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
            <input type="checkbox" name="pinned" />
            Fixar no topo
          </label>
          <button
            type="submit"
            className="w-full bg-navy-900 text-white font-black py-4 rounded-2xl text-[10px] uppercase tracking-widest active:scale-95"
          >
            Publicar
          </button>
        </form>
      )}
      <div className="space-y-3">
        {!dataReady.announcements ? (
          <div className="space-y-3">{renderSkeletonList(4, 'h-20 w-full')}</div>
        ) : (
          <>
            {data.announcements.map((a) => (
              <div
                key={a.id}
                className="bg-white dark:bg-navy-800 card-surface p-4 rounded-3xl shadow-sm border dark:border-slate-800"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      {a.pinned && <Pin size={14} className="text-amber-500" />}
                      <h4 className="font-black text-sm truncate">{a.title}</h4>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {getFriendlyTime(a.created_at)}
                    </p>
                  </div>
                  {isRealAdmin && (
                    <button
                      onClick={() => handleDeleteAnnouncement(a.id)}
                      className="touch-target w-8 h-8 text-red-500 bg-red-50 dark:bg-red-900/20 dark:text-red-200 rounded-xl"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
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
          </>
        )}
      </div>
    </div>
  );
};

export default AnnouncementsView;
