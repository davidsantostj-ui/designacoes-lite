import React, { useDeferredValue, useMemo, useState } from 'react';
import { BellRing, Megaphone, Pin, Search, Trash2 } from 'lucide-react';
import PageHeader from '../PageHeader';
import RichTextDisplay from '../RichTextDisplay';

const TAB_OPTIONS = [
  { id: 'NOTIFICATIONS', label: 'Para você', icon: BellRing },
  { id: 'ANNOUNCEMENTS', label: 'Congregação', icon: Megaphone }
];

const READ_FILTERS = [
  { id: 'all', label: 'Tudo' },
  { id: 'unread', label: 'Não lidas' }
];

const normalizeText = (value) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

const NoticesView = ({
  isRealAdmin,
  dataReady,
  data,
  user,
  notificationsForUser,
  alertTab,
  setAlertTab,
  handleOpenNotification,
  handleMarkAnnouncementRead,
  handleClearNotifications,
  handleClearReadAnnouncements,
  handleCreateAnnouncement,
  handleDeleteAnnouncement,
  getFriendlyTime,
  unreadNotificationsCount,
  unreadAnnouncementsCount,
  renderSkeletonList,
  onBack,
  onLoadMoreNotifications,
  notificationsHasMore,
  isLoadingMoreNotifications
}) => {
  const [search, setSearch] = useState('');
  const [readFilter, setReadFilter] = useState('all');
  const deferredSearch = useDeferredValue(search);


  const filteredNotifications = useMemo(() => {
    const query = normalizeText(deferredSearch);
    return notificationsForUser.filter((notification) => {
      const isRead = (notification.read_by || []).includes(user.id);
      if (readFilter === 'unread' && isRead) return false;
      if (!query) return true;
      return normalizeText(notification.text).includes(query);
    });
  }, [deferredSearch, notificationsForUser, readFilter, user.id]);

  const filteredAnnouncements = useMemo(() => {
    const query = normalizeText(deferredSearch);
    return (data.announcements || []).filter((announcement) => {
      const isRead = (announcement.read_by || []).includes(user.id);
      if (readFilter === 'unread' && isRead) return false;
      if (!query) return true;
      return normalizeText(`${announcement.title} ${announcement.message}`).includes(query);
    });
  }, [data.announcements, deferredSearch, readFilter, user.id]);

  return (
    <div className="page-shell space-y-5 animate-fade-in">
      <PageHeader
        eyebrow="Comunicação"
        title="Avisos"
        description="Tudo o que precisa de atenção fica aqui: notificações pessoais e avisos da congregação no mesmo fluxo."
        onBack={onBack}
      />

      {/* Contadores lado a lado */}
      <section className="grid grid-cols-2 gap-3">
        <div className="flex items-center gap-4 rounded-[24px] border border-blue-200 bg-blue-50/90 px-5 py-4 shadow-sm dark:border-blue-800 dark:bg-blue-950/25">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300">
            <BellRing size={18} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-blue-500 dark:text-blue-400">Para você</p>
            <p className="mt-0.5 text-3xl font-black text-blue-700 dark:text-blue-200">{unreadNotificationsCount}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-[24px] border border-amber-200 bg-amber-50/90 px-5 py-4 shadow-sm dark:border-amber-800 dark:bg-amber-900/20">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-300">
            <Megaphone size={18} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-amber-600 dark:text-amber-400">Congregação</p>
            <p className="mt-0.5 text-3xl font-black text-amber-700 dark:text-amber-200">{unreadAnnouncementsCount}</p>
          </div>
        </div>
      </section>

      {/* Abas Para Você / Congregação com visual colorido */}
      <section className="grid grid-cols-2 gap-3">
        {TAB_OPTIONS.map((tab) => {
          const isActive = alertTab === tab.id;
          const isNotif = tab.id === 'NOTIFICATIONS';
          const base = isNotif
            ? 'border-blue-200 dark:border-blue-800'
            : 'border-amber-200 dark:border-amber-800';
          const activeBg = isNotif
            ? 'bg-blue-600 border-blue-600 text-white shadow-md dark:bg-blue-500 dark:border-blue-500'
            : 'bg-amber-500 border-amber-500 text-white shadow-md dark:bg-amber-600 dark:border-amber-600';
          const inactiveBg = isNotif
            ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-300'
            : 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-300';

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setAlertTab(tab.id)}
              className={`flex items-center justify-center gap-2 rounded-[20px] border px-4 py-3.5 text-[11px] font-black uppercase tracking-[0.14em] transition-all hover:-translate-y-0.5 ${
                isActive ? activeBg : `${inactiveBg} ${base}`
              }`}
            >
              <tab.icon size={15} />
              {tab.label}
            </button>
          );
        })}
      </section>

      <section className="panel-card space-y-3">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
          <label className="relative block">
            <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={
                alertTab === 'NOTIFICATIONS'
                  ? 'Buscar texto da notificação'
                  : 'Buscar por título ou mensagem'
              }
              className="soft-input pl-11"
            />
          </label>

          <div className="flex flex-wrap gap-2">
            {READ_FILTERS.map((filter) => (
              <button
                key={filter.id}
                type="button"
                onClick={() => setReadFilter(filter.id)}
                className={readFilter === filter.id ? 'chip-toggle chip-toggle-active' : 'chip-toggle'}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {alertTab === 'NOTIFICATIONS' && (
        <section className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                Caixa de entrada
              </p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">
                Lembretes, importações e comunicados direcionados a você.
              </p>
            </div>

            {notificationsForUser.length > 0 && (
              <button type="button" onClick={handleClearNotifications} className="soft-button-danger">
                Limpar
              </button>
            )}
          </div>

          {!dataReady.notifications ? (
            <div className="space-y-3">{renderSkeletonList(4, 'h-20 w-full rounded-4xl')}</div>
          ) : (
            <>
              {filteredNotifications.map((notification) => {
                const isRead = (notification.read_by || []).includes(user.id);

                return (
                  <button
                    key={notification.id}
                    type="button"
                    onClick={() => handleOpenNotification(notification)}
                    className={`w-full rounded-[26px] border-l-4 p-4 text-left shadow-sm transition-all hover:shadow-md ${
                      isRead
                        ? 'card-surface border-navy-900 dark:border-blue-500'
                        : 'border-amber-500 bg-amber-50 dark:bg-amber-900/20'
                    }`}
                  >
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {notification.text}
                    </p>
                    <div className="mt-2 flex items-center justify-between gap-3">
                      <span className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">
                        {getFriendlyTime(notification.created_at)}
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.14em] ${
                          isRead ? 'bg-slate-100 text-slate-500' : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {isRead ? 'Lida' : 'Nova'}
                      </span>
                    </div>
                  </button>
                );
              })}

              {filteredNotifications.length === 0 && (
                <div className="panel-card text-center text-sm font-semibold text-slate-500 dark:text-slate-300">
                  Nada pendente na sua caixa de entrada com os filtros atuais.
                </div>
              )}

              {notificationsHasMore && (
                <button
                  type="button"
                  onClick={() => onLoadMoreNotifications && onLoadMoreNotifications()}
                  disabled={isLoadingMoreNotifications}
                  className="soft-button-secondary w-full justify-center disabled:opacity-60"
                >
                  {isLoadingMoreNotifications ? 'Carregando...' : 'Carregar mais'}
                </button>
              )}
            </>
          )}
        </section>
      )}

      {alertTab === 'ANNOUNCEMENTS' && (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                Avisos da congregação
              </p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">
                Comunicados gerais, avisos fixados e novidades do mês.
              </p>
            </div>

            {isRealAdmin && (data.announcements || []).length > 0 && (
              <button
                type="button"
                onClick={handleClearReadAnnouncements}
                className="soft-button-danger"
              >
                Excluir lidos
              </button>
            )}
          </div>

          {isRealAdmin && (
            <form
              onSubmit={handleCreateAnnouncement}
              className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-navy-800"
            >
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                Novo aviso
              </p>

              <div className="mt-4 space-y-3">
                <input name="title" placeholder="Título" className="soft-input" required />
                <textarea
                  name="message"
                  placeholder="Mensagem"
                  className="soft-input min-h-[120px] resize-y"
                  required
                />
                <label className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
                  <input type="checkbox" name="pinned" />
                  Fixar no topo
                </label>
                <button type="submit" className="soft-button-primary">
                  Publicar aviso
                </button>
              </div>
            </form>
          )}

          {!dataReady.announcements ? (
            <div className="space-y-3">{renderSkeletonList(4, 'h-24 w-full rounded-4xl')}</div>
          ) : (
            <>
              {filteredAnnouncements.map((announcement) => {
                const isRead = (announcement.read_by || []).includes(user.id);

                return (
                  <div
                    key={announcement.id}
                    className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-navy-800"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          {announcement.pinned && <Pin size={15} className="text-amber-500" />}
                          <h3 className="truncate text-base font-black text-slate-900 dark:text-white">
                            {announcement.title}
                          </h3>
                        </div>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-300">
                          {getFriendlyTime(announcement.created_at)}
                        </p>
                      </div>

                      {isRealAdmin && (
                        <button
                          type="button"
                          onClick={() => handleDeleteAnnouncement(announcement.id)}
                          className="touch-target flex h-9 w-9 items-center justify-center rounded-2xl bg-red-50 text-red-500"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>

                    <RichTextDisplay content={announcement.message} className="mt-4" />

                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                      <span
                        className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${
                          isRead ? 'bg-slate-100 text-slate-500' : 'bg-emerald-50 text-emerald-700'
                        }`}
                      >
                        {isRead ? 'Lido' : 'Não lido'}
                      </span>

                      {!isRead && (
                        <button
                          type="button"
                          onClick={() => handleMarkAnnouncementRead(announcement.id)}
                          className="soft-button-secondary"
                        >
                          Marcar como lido
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              {filteredAnnouncements.length === 0 && (
                <div className="panel-card text-center text-sm font-semibold text-slate-500 dark:text-slate-300">
                  Nenhum aviso encontrado com os filtros atuais.
                </div>
              )}
            </>
          )}
        </section>
      )}
    </div>
  );
};

export default NoticesView;
