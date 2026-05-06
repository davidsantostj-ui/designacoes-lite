import React, { useMemo, useState } from 'react';
import { CalendarCheck2, Printer, Repeat2 } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import { getAssignmentActivityDetail, getAssignmentActivityLabel } from '../../utils/activityLogUtils';
import { compareIsoDates, isCurrentOrFutureDate } from '../../utils/dateUtils';
import { printAssignmentsAgenda } from '../../utils/printUtils';
import {
  getAssignmentCategoryMeta,
  isMechanicalAssignment,
  isMeetingImportedAssignment
} from '../../utils/assignmentUtils';
import StatusIcon from '../../components/StatusIcon';

const categoryOptions = [
  { id: 'all', label: 'Todas' },
  { id: 'mechanical', label: 'Mecanicas' },
  { id: 'spiritual', label: 'Espirituais' }
];

const EMPTY_ITEMS = [];


const actionButtonToneClass = {
  primary:
    'border-blue-600 bg-blue-600 text-white hover:border-blue-700 hover:bg-blue-700 dark:border-blue-500 dark:bg-blue-500 dark:hover:bg-blue-400',
  secondary:
    'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-navy-900 dark:text-slate-100 dark:hover:bg-navy-800',
  accent:
    'border-orange-500 bg-orange-500 text-white hover:border-orange-600 hover:bg-orange-600',
  ghost:
    'border-slate-200 bg-slate-50 text-slate-500 hover:bg-white dark:border-slate-700 dark:bg-navy-900 dark:text-slate-300 dark:hover:bg-navy-800',
  disabled:
    'border-slate-200 bg-slate-50 text-slate-400 opacity-70 dark:border-slate-700 dark:bg-navy-900 dark:text-slate-500'
};

const AssignmentsMonth = ({
  data,
  dataReady,
  user,
  onBack,
  renderSkeletonList,
  formatDatePt,
  formatAssignmentLabel,
  handleAccept,
  handleSwapRequest,
  handleCancelSwap,
  downloadIcs,
  openSwapLogId,
  setOpenSwapLogId,
  swapLogsByAssignment,
  getUserDisplayName,
  getFriendlyTime,
  onLoadMore,
  hasMore,
  isLoadingMore
}) => {
  const [categoryFilter, setCategoryFilter] = useState('all');

  const users = data.users || EMPTY_ITEMS;
  const assignments = data.assignments || EMPTY_ITEMS;

  const myAssignments = useMemo(
    () =>
      assignments
        .filter(
          (assignment) =>
            assignment.usuario_id === user.id &&
            assignment.status !== 'rejeitado' &&
            isCurrentOrFutureDate(assignment.date)
        )
        .sort((a, b) => {
          const byDate = compareIsoDates(a.date, b.date);
          if (byDate !== 0) return byDate;
          return String(a.tipo_designacao || '').localeCompare(String(b.tipo_designacao || ''));
        }),
    [assignments, user.id]
  );

  const filteredAssignments = useMemo(() => {
    return myAssignments.filter((assignment) => {
      if (categoryFilter === 'mechanical') {
        return isMechanicalAssignment(assignment.tipo_designacao);
      }
      if (categoryFilter === 'spiritual') {
        return !isMechanicalAssignment(assignment.tipo_designacao);
      }
      return true;
    });
  }, [categoryFilter, myAssignments]);

  const isLoading = !dataReady.assignments;

  const handlePrint = () => {
    printAssignmentsAgenda({
      ownerName: getUserDisplayName(user),
      filtersLabel: `Categoria: ${
        categoryOptions.find((item) => item.id === categoryFilter)?.label || 'Todas'
      }`,
      assignments: filteredAssignments.map((assignment) => ({
        ...assignment,
        assignedUser: user
      })),
      formatDatePt,
      formatAssignmentLabel,
      getUserDisplayName
    });
  };

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Minha agenda"
        title="Próximas designações"
        description="Sua agenda mostra apenas hoje e as próximas datas do seu fluxo."
        onBack={onBack}
        actions={
          <button type="button" onClick={handlePrint} className="soft-button-secondary">
            <Printer size={14} />
            Exportar PDF
          </button>
        }
      />

      <section className="panel-card space-y-3">
        <div className="flex flex-wrap gap-2">
          {categoryOptions.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setCategoryFilter(option.id)}
              className={
                categoryFilter === option.id ? 'chip-toggle chip-toggle-active' : 'chip-toggle'
              }
            >
              {option.label}
            </button>
          ))}
        </div>
      </section>

      {isLoading ? (
        <div className="space-y-3">{renderSkeletonList(4, 'h-28 w-full rounded-4xl')}</div>
      ) : (
        <>
          {filteredAssignments.map((assignment) => {
            const isMeetingImported = isMeetingImportedAssignment(assignment);
            const categoryMeta = getAssignmentCategoryMeta(assignment);
            const showHistory = openSwapLogId === assignment.id;
            const swapLogs = (swapLogsByAssignment[assignment.id] || []).slice(0, 6);
            const canRequestSwap = !isMeetingImported && assignment.status !== 'troca';

            const actionItems = [];

            if (assignment.status === 'confirmado') {
              actionItems.push({
                id: 'calendar',
                label: 'Agenda',
                tone: 'secondary',
                icon: CalendarCheck2,
                onClick: () => downloadIcs(assignment)
              });
            }

            if (assignment.status === 'pendente') {
              actionItems.push({
                id: 'accept',
                label: 'Aceitar',
                tone: 'primary',
                icon: null,
                onClick: () => handleAccept(assignment.id)
              });
            }

            if (assignment.status !== 'troca') {
              actionItems.push({
                id: 'swap',
                label: 'Solicitar troca',
                tone: canRequestSwap ? 'accent' : 'disabled',
                icon: Repeat2,
                onClick: canRequestSwap ? () => handleSwapRequest(assignment) : undefined,
                disabled: !canRequestSwap
              });
            }

            if (!isMeetingImported && assignment.status === 'troca') {
              actionItems.push({
                id: 'cancel-swap',
                label: 'Cancelar troca',
                tone: 'ghost',
                icon: null,
                onClick: () => handleCancelSwap(assignment)
              });
            }

            return (
              <section key={assignment.id} className="panel-card relative overflow-hidden py-5 lg:px-6">
                <div className={`absolute left-0 top-0 h-full w-1.5 ${categoryMeta.accentClass}`} />

                <div className="pl-3 space-y-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-[0.24em] text-blue-600">
                      {formatDatePt(assignment.date)}
                    </span>
                    <span
                      className={`rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-widest ${categoryMeta.badgeClass}`}
                    >
                      {categoryMeta.label}
                    </span>
                    <StatusIcon status={assignment.status} />
                  </div>

                  <div className="min-w-0">
                    <h3 className="text-[1.35rem] sm:text-[1.5rem] font-extrabold leading-tight tracking-tight text-slate-900 dark:text-white">
                      {formatAssignmentLabel(assignment.tipo_designacao)}
                    </h3>

                    {isMeetingImported && (
                      <p className="mt-2 text-[11px] font-semibold leading-snug text-violet-600">
                        Vinda da programação de reuniões. Aceitação continua disponível, troca não.
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {actionItems.map((action) => {
                      const Icon = action.icon;
                      return (
                        <button
                          key={action.id}
                          type="button"
                          onClick={action.onClick}
                          disabled={action.disabled === true}
                          className={`inline-flex min-h-[36px] flex-1 sm:flex-none items-center justify-center gap-2 rounded-xl border px-4 py-1 text-[10px] font-black uppercase tracking-[0.14em] shadow-sm transition-all ${actionButtonToneClass[action.tone]}`}
                        >
                          {Icon ? <Icon size={14} className="shrink-0" /> : null}
                          <span>{action.label}</span>
                        </button>
                      );
                    })}
                    <button
                      type="button"
                      onClick={() => setOpenSwapLogId(showHistory ? null : assignment.id)}
                      className="inline-flex min-h-[36px] flex-1 sm:flex-none items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-slate-500 shadow-sm transition-all hover:bg-slate-50 dark:border-slate-700 dark:bg-navy-900 dark:text-slate-200 dark:hover:bg-navy-800"
                    >
                      {showHistory ? 'Ocultar historico' : 'Historico'}
                    </button>
                  </div>

                  {showHistory && (
                    <div className="mt-4 border-t border-slate-200 pt-3 dark:border-slate-800 space-y-2">
                      {swapLogs.map((log) => {
                        const who =
                          getUserDisplayName(
                            users.find((candidate) => candidate.id === log.actorId)
                          ) || 'Usuario';
                        const detail = getAssignmentActivityDetail(log, {
                          formatDatePt,
                          formatAssignmentLabel
                        });

                        return (
                          <div
                            key={log.id}
                            className="rounded-2xl bg-slate-50 px-3 py-3 dark:bg-navy-900"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <span className="text-sm font-black text-slate-800 dark:text-white">
                                {getAssignmentActivityLabel(log)}
                              </span>
                              <span className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
                                {getFriendlyTime(log.createdAt)}
                              </span>
                            </div>
                            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                              <span className="font-black">{who}</span>
                              {detail ? ` - ${detail}` : ''}
                            </p>
                          </div>
                        );
                      })}

                      {swapLogs.length === 0 && (
                        <p className="text-sm text-slate-400 py-2">
                          Sem historico para essa designação.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </section>
            );
          })}

          {filteredAssignments.length === 0 && (
            <section className="panel-card text-center text-sm font-semibold text-slate-500 dark:text-slate-300">
              Nenhuma próxima designação nesse filtro.
            </section>
          )}

          {hasMore && (
            <button
              type="button"
              onClick={() => onLoadMore && onLoadMore()}
              disabled={isLoadingMore}
              className="soft-button-secondary w-full justify-center disabled:opacity-60"
            >
              {isLoadingMore ? 'Carregando...' : 'Carregar mais'}
            </button>
          )}
        </>
      )}
    </div>
  );
};

export default AssignmentsMonth;
