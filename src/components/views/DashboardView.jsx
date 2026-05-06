import React from 'react';
import {
  BellRing,
  Calendar as CalIcon,
  ChevronLeft,
  ChevronRight,
  Pin,
  Repeat,
  Sparkles,
  Users,
  X
} from 'lucide-react';
import SkeletonBlock from '../SkeletonBlock';
import StatusIcon from '../StatusIcon';
import EventCountdownBlock from './EventCountdownBlock';

const DashboardView = ({
  waReminder,
  sendWhatsAppReminder,
  activePinnedAnnouncement,
  handleOpenPinned,
  handleDismissPinned,
  setView,
  dataReady,
  unreadAnnouncementsCount,
  unreadNotificationsCount,
  totalAlertsCount,
  handleCalendarNavigate,
  monthLabel,
  monthWeeks,
  myAssignmentsByDate,
  selectedDate,
  setSelectedDate,
  setCalendarDate,
  formatAssignmentLabel,
  formatDatePt,
  dayAssignments,
  renderSkeletonList,
  myAssignmentsCount,
  isPastDate,
  nextAssignment,
  todayAssignments,
  weekAssignments,
  myPendingAssignmentsCount,
  swapMarketplaceCount,
  hasAdminAccess,
  isImpersonating,
  isRealAdmin,
  adminProgrammingSummary,
  onOpenNotices,
  onOpenAdminProgramming,
  specialEvents
}) => {
  const formatCountLabel = (count, singular, plural) =>
    `${count} ${count === 1 ? singular : plural}`;

  const formatProgrammingSummary = (summary) => {
    const reviewCount = Number(summary?.reviewCount || 0);
    const assignmentsCount = Number(summary?.assignmentsCount || 0);
    const pendingAssignmentsCount = Number(summary?.pendingAssignmentsCount || 0);

    return `${formatCountLabel(reviewCount, 'item', 'itens')} pedindo revisão, ${formatCountLabel(
      assignmentsCount,
      'designação',
      'designações'
    )} ${assignmentsCount === 1 ? 'sincronizada' : 'sincronizadas'} e ${formatCountLabel(
      pendingAssignmentsCount,
      'pendência',
      'pendências'
    )} ${pendingAssignmentsCount === 1 ? 'aberta' : 'abertas'}.`;
  };

  const quickActions = [
    {
      id: 'ASSIGNMENTS_MONTH',
      label: 'Minha agenda',
      helper: 'Suas próximas designações',
      icon: CalIcon,
      tone: 'text-blue-600',
      chipClass: 'chip-blue',
      ready: dataReady.assignments,
      statusText: formatCountLabel(myAssignmentsCount, 'item', 'itens'),
      onClick: () => setView('ASSIGNMENTS_MONTH')
    },
    {
      id: 'SWAP_MARKET',
      label: 'Trocas',
      helper: 'Pedidos disponíveis',
      icon: Repeat,
      tone: 'text-orange-500',
      chipClass: 'chip-orange',
      ready: dataReady.assignments,
      statusText: formatCountLabel(swapMarketplaceCount, 'aberta', 'abertas'),
      hasSwapOpen: swapMarketplaceCount > 0,
      onClick: () => setView('SWAP_MARKET')
    }
  ];

  const pendingCards = [
    {
      id: 'today',
      label: 'Hoje',
      helper:
        todayAssignments.length > 0
          ? `${todayAssignments.length} designações no seu dia.`
          : 'Sua agenda de hoje está livre.',
      value: todayAssignments.length,
      tone: 'border-blue-100 bg-blue-50/90 text-blue-700'
    },
    {
      id: 'week',
      label: 'Próximos 7 dias',
      helper:
        weekAssignments.length > 0
          ? `${formatCountLabel(weekAssignments.length, 'compromisso', 'compromissos')} chegando.`
          : 'Sem novas designações nessa janela.',
      value: weekAssignments.length,
      tone: 'border-violet-100 bg-violet-50/90 text-violet-700'
    },
    {
      id: 'pending',
      label: 'Pendentes',
      helper:
        myPendingAssignmentsCount > 0
          ? 'Itens aguardando sua confirmação.'
          : 'Nenhuma confirmação pendente.',
      value: myPendingAssignmentsCount,
      tone: 'border-orange-100 bg-orange-50/90 text-orange-700'
    },
    {
      id: 'meetings_push',
      label: 'Reuniões',
      helper: 'Ver programa semanal',
      value: 'Abrir',
      tone: 'border-violet-100 bg-violet-50/90 text-violet-700 dark:bg-violet-900/20 dark:text-violet-200 dark:border-violet-800',
      onClick: () => setView('MEETINGS')
    }
  ];

  const metricsGridClass = 'grid-cols-2 sm:grid-cols-4';
  const hasAttentionContent = Boolean(waReminder || activePinnedAnnouncement);

  return (
    <div className="page-shell space-y-4 animate-fade-in">
      <section className="panel-card relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-r from-blue-50/90 via-white to-violet-50/80 dark:from-blue-950/40 dark:via-navy-800 dark:to-violet-950/30" />

        <div className="relative space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="rounded-full bg-white/80 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500 shadow-sm dark:bg-navy-900/80 dark:text-slate-300">
              Painel da semana
            </span>
            <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-emerald-700">
              {nextAssignment ? formatDatePt(nextAssignment.date) : 'Agenda em dia'}
            </span>
          </div>

          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">
              Próxima designação
            </p>
            <h3 className="mt-2 text-[1.75rem] font-black leading-tight tracking-tight text-slate-900 dark:text-white sm:text-[2rem]">
              {nextAssignment
                ? formatAssignmentLabel(nextAssignment.tipo_designacao)
                : 'Nenhuma designação futura'}
            </h3>
            <p className="mt-2 max-w-[52ch] text-sm leading-relaxed text-slate-500 dark:text-slate-300">
              {nextAssignment
                ? `Status ${nextAssignment.status}. Abra a agenda para confirmar, revisar o histórico ou baixar o lembrete do calendário.`
                : 'Quando uma nova designação for atribuída, ela aparecerá aqui em destaque.'}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setView('ASSIGNMENTS_MONTH')}
              className="soft-button-primary min-w-0 flex-1 justify-center whitespace-nowrap px-4 py-3 sm:flex-none"
            >
              <CalIcon size={15} />
              Agenda
            </button>
            <button
              type="button"
              onClick={() => setView('MEETINGS')}
              className="soft-button-secondary min-w-0 flex-1 justify-center whitespace-nowrap px-4 py-3 sm:flex-none"
            >
              <Users size={15} />
              Reuniões
            </button>
            {hasAdminAccess && (
              <button
                type="button"
                onClick={() => onOpenAdminProgramming && onOpenAdminProgramming('PROG_OVERVIEW')}
                className="soft-button-secondary min-w-0 justify-center whitespace-nowrap px-4 py-3"
              >
                <Sparkles size={14} />
                {isImpersonating ? 'Voltar ao admin' : 'Admin'}
              </button>
            )}
          </div>

          <div className={`grid gap-2 ${metricsGridClass}`}>
            {pendingCards.map((card) => {
              const baseClass = `min-w-0 rounded-[24px] border px-3 py-3.5 shadow-sm text-left dark:border-slate-800 ${card.tone}`;
              const inner = (
                <>
                  <p className="truncate text-[10px] font-black uppercase tracking-[0.16em] opacity-80">
                    {card.label}
                  </p>
                  <p className="mt-2 text-2xl font-black leading-none sm:text-[2rem]">
                    {card.value}
                  </p>
                  {card.helper && (
                    <p className="mt-2 text-[11px] font-semibold leading-snug opacity-80">
                      {card.helper}
                    </p>
                  )}
                </>
              );

              // Fix #14: cards sem ação renderizados como div, com ação como button interativo
              if (card.onClick) {
                return (
                  <button
                    key={card.id}
                    type="button"
                    onClick={card.onClick}
                    title={card.label}
                    className={`${baseClass} cursor-pointer transition-transform hover:-translate-y-0.5 active:scale-95`}
                  >
                    {inner}
                  </button>
                );
              }
              return (
                <div key={card.id} className={baseClass}>
                  {inner}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {hasAttentionContent && (
        <section className="panel-card space-y-3">
          <div className="flex items-center gap-3">
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
              <BellRing size={18} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                Atenção agora
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-300">
                Alertas que merecem ação rápida antes de seguir.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {waReminder && (
              <div className="flex items-start justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50/90 p-4 dark:border-amber-700 dark:bg-amber-900/20">
                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-700">
                    Lembrete WhatsApp
                  </p>
                  <p className="mt-1 text-sm font-black text-slate-900 dark:text-white">
                    Designação em até 24h
                  </p>
                  <p className="mt-1 text-[11px] font-semibold leading-snug text-slate-500 dark:text-slate-300">
                    {waReminder.tipo_designacao} • {formatDatePt(waReminder.date)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => sendWhatsAppReminder(waReminder)}
                  className="rounded-2xl bg-emerald-600 px-3 py-2 text-[9px] font-black uppercase text-white"
                >
                  Enviar
                </button>
              </div>
            )}

            {activePinnedAnnouncement && (
              <div className="flex items-start justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50/90 p-4 dark:border-amber-700 dark:bg-amber-900/20">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Pin size={14} className="text-amber-600" />
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-700">
                      Aviso fixado
                    </p>
                  </div>
                  <p className="mt-1 text-sm font-black text-slate-900 dark:text-white">
                    {activePinnedAnnouncement.title}
                  </p>
                  <p className="mt-1 text-[11px] leading-snug text-slate-500 dark:text-slate-300">
                    {activePinnedAnnouncement.message}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenPinned(activePinnedAnnouncement.id)}
                    className="rounded-2xl bg-amber-600 px-3 py-1.5 text-[9px] font-black uppercase text-white"
                  >
                    Ler
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDismissPinned(activePinnedAnnouncement.id)}
                    className="touch-target h-8 w-8 rounded-2xl bg-white/70 text-slate-500"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      <section className="panel-card space-y-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
            Ações rápidas
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-300">
            Atalhos para as áreas mais usadas do app.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {quickActions.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={item.onClick}
              className={`relative flex min-w-0 flex-col items-start justify-between gap-4 rounded-[24px] border p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md ${item.chipClass} ${item.hasSwapOpen ? 'ring-2 ring-orange-400 animate-pulse-slow' : ''}`}
            >
              <div className="flex w-full items-start justify-between gap-2">
                <div className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/75 shadow-sm ring-1 ring-white/70 dark:bg-white/5 dark:ring-white/10">
                  <item.icon className={item.tone} size={18} />
                </div>
                {item.ready ? (
                  <p className="shrink-0 pt-1 text-[9px] font-black uppercase tracking-[0.16em] text-slate-400">
                    {item.statusText}
                  </p>
                ) : (
                  <SkeletonBlock className="mt-1 h-3 w-10" />
                )}
              </div>
              <div className="min-w-0 w-full mt-1">
                <p className="truncate text-[13px] sm:text-sm font-black text-slate-900 dark:text-slate-100">
                  {item.label}
                </p>
                <p className="mt-1 line-clamp-2 text-[10px] sm:text-[11px] leading-snug text-slate-500 dark:text-slate-300">
                  {item.helper}
                </p>
              </div>
              {item.badge > 0 && (
                <span className="absolute right-3 top-3 flex min-h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-black text-white">
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </section>

      {/* NOVO BANNER EVENTOS E AVISOS */}
      <section className="animate-fade-in relative overflow-hidden rounded-[24px] bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/80 p-5 shadow-sm dark:from-navy-900 dark:to-navy-800 dark:border-amber-900/50">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-900/40">
                <BellRing size={14} />
              </span>
              <p className="text-[10px] font-black uppercase tracking-widest text-amber-700 dark:text-amber-500">
                Avisos e Painel
              </p>
            </div>
            {totalAlertsCount > 0 && (
              <span className="rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-black text-white shadow-sm">
                +{totalAlertsCount} novos
              </span>
            )}
          </div>
          <div className="mt-1 grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="min-w-0">
              <h3 className="text-xl font-black text-slate-900 dark:text-white leading-tight">
                Mural da Congregação
              </h3>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300 line-clamp-2">
                Acesse notificações, anúncios oficiais e o calendário de Eventos Especiais.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setView('SPECIAL_EVENTS')}
                className="soft-button flex-1 lg:flex-none justify-center border-amber-200"
              >
                Eventos Especiais
              </button>
              <button
                type="button"
                onClick={() => onOpenNotices && onOpenNotices('NOTIFICATIONS')}
                className="soft-button-primary bg-amber-600 border-amber-600 text-white flex-1 lg:flex-none justify-center hover:bg-amber-700"
              >
                Ler Avisos
              </button>
            </div>
          </div>

          <EventCountdownBlock specialEvents={specialEvents} />
        </div>
      </section>

      {isRealAdmin && adminProgrammingSummary?.hasBatch && (
        <section className="panel-card">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">
                Programação em andamento
              </p>
              <h3 className="mt-2 text-lg font-black tracking-tight text-slate-900 dark:text-white">
                {adminProgrammingSummary.batchLabel}
              </h3>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">
                {formatProgrammingSummary(adminProgrammingSummary)}
              </p>
            </div>

            <button
              type="button"
              onClick={() => onOpenAdminProgramming && onOpenAdminProgramming('PROG_OVERVIEW')}
              className="soft-button-secondary"
            >
              Abrir fluxo do admin
            </button>
          </div>
        </section>
      )}

      <div className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-navy-800 sm:p-5">
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400">
              Calendário
            </h3>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Designações em verde • Avisos não lidos:{' '}
              {unreadAnnouncementsCount + unreadNotificationsCount}
            </p>
          </div>
        </div>

        <div className="mb-2 flex items-center justify-between">
          <button
            type="button"
            onClick={() => handleCalendarNavigate(-1)}
            className="touch-target flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 dark:bg-navy-900"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="min-w-[120px] text-center text-sm font-semibold capitalize text-slate-600">
            {monthLabel}
          </span>
          <button
            type="button"
            onClick={() => handleCalendarNavigate(1)}
            className="touch-target flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 dark:bg-navy-900"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        <div className="mb-3 grid grid-cols-7 text-[10px] font-black uppercase tracking-widest text-slate-400">
          {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Dom'].map((dayLabel) => (
            <div key={dayLabel} className="py-1 text-center">
              {dayLabel}
            </div>
          ))}
        </div>

        <div className="space-y-1">
          {monthWeeks.map((week, weekIndex) => (
            <div key={`w-${weekIndex}`} className="grid grid-cols-7 gap-1">
              {week.map((day, dayIndex) => {
                const assignmentCount = myAssignmentsByDate[day.dateStr]?.length || 0;
                const hasAssignments = assignmentCount > 0;
                const isSelected = selectedDate === day.dateStr;
                const isPast = day.inMonth && isPastDate && isPastDate(day.dateStr);
                const baseBg = hasAssignments
                  ? isPast
                    ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-200'
                    : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200'
                  : isPast
                    ? 'bg-slate-100 text-slate-400 dark:bg-navy-900 dark:text-slate-500'
                    : 'bg-slate-50 dark:bg-navy-900';
                const textTone = day.inMonth
                  ? isPast
                    ? 'text-slate-400 dark:text-slate-500'
                    : 'text-slate-800 dark:text-slate-100'
                  : 'text-slate-300';

                return (
                  <button
                    key={`d-${weekIndex}-${dayIndex}`}
                    type="button"
                    tabIndex={day.inMonth ? 0 : -1}
                    aria-label={`${day.date.getDate()}${day.inMonth ? '' : ' fora do mês'}${hasAssignments ? `, ${assignmentCount} designação` : ''}`}
                    onKeyDown={(e) => {
                      if (e.key === 'ArrowRight') handleCalendarNavigate(0, 1);
                      if (e.key === 'ArrowLeft') handleCalendarNavigate(0, -1);
                      if (e.key === 'ArrowUp') handleCalendarNavigate(-1, 0);
                      if (e.key === 'ArrowDown') handleCalendarNavigate(1, 0);
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setSelectedDate(day.dateStr);
                        if (!day.inMonth) {
                          setCalendarDate(new Date(day.date.getFullYear(), day.date.getMonth(), 1));
                        }
                      }
                    }}
                    onClick={() => {
                      setSelectedDate(day.dateStr);
                      if (!day.inMonth) {
                        setCalendarDate(new Date(day.date.getFullYear(), day.date.getMonth(), 1));
                      }
                    }}
                    className={`relative flex h-10 flex-col items-center justify-center rounded-xl px-1 text-xs font-bold sm:h-11 ${textTone} ${baseBg} ${
                      isSelected ? 'ring-2 ring-navy-900 dark:ring-blue-400' : ''
                    }`}
                  >
                    <span className="leading-none">{day.date.getDate()}</span>
                    {hasAssignments &&
                      (assignmentCount > 1 ? (
                        <span className="mt-1 inline-flex min-w-[16px] items-center justify-center rounded-full bg-emerald-600 px-1.5 py-[1px] text-[9px] font-black leading-none text-white">
                          {assignmentCount}
                        </span>
                      ) : (
                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      ))}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        <div className="mt-4 space-y-2">
          <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-400 sm:text-[12px]">
            Agenda do dia
          </h4>
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 sm:text-[12px]">
            Designações: {dayAssignments.length}
          </p>
          {!dataReady.assignments ? (
            <div className="space-y-2">{renderSkeletonList(3, 'h-12 w-full')}</div>
          ) : (
            <>
              {dayAssignments.map((assignment) => (
                <div
                  key={`cal-${assignment.id}`}
                  className="flex items-center justify-between rounded-2xl bg-slate-50 p-3 dark:bg-navy-900"
                >
                  <div>
                    <p className="text-sm font-bold sm:text-base">
                      {formatAssignmentLabel(assignment.tipo_designacao)}
                    </p>
                    <span className="text-[11px] text-slate-400 sm:text-xs">
                      {formatDatePt(assignment.date)}
                    </span>
                  </div>
                  <StatusIcon status={assignment.status} />
                </div>
              ))}

              {dayAssignments.length === 0 && (
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                  Nenhuma designação nessa data.
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const DashboardViewMemo = React.memo(DashboardView, (prevProps, nextProps) => {
  return (
    prevProps.selectedDate === nextProps.selectedDate &&
    prevProps.monthLabel === nextProps.monthLabel &&
    prevProps.dataReady === nextProps.dataReady &&
    prevProps.myAssignmentsCount === nextProps.myAssignmentsCount &&
    prevProps.unreadAnnouncementsCount === nextProps.unreadAnnouncementsCount &&
    prevProps.unreadNotificationsCount === nextProps.unreadNotificationsCount &&
    prevProps.totalAlertsCount === nextProps.totalAlertsCount &&
    prevProps.swapMarketplaceCount === nextProps.swapMarketplaceCount
  );
});

export default DashboardViewMemo;
