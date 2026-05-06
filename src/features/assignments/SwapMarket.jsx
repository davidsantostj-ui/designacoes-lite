import React, { useDeferredValue, useMemo, useState } from 'react';
import { Repeat2, Search, Utensils } from 'lucide-react';
import PageHeader from '../../components/PageHeader';

const normalizeText = (value) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

const SwapMarket = ({
  data,
  user,
  onBack,
  formatDatePt,
  formatAssignmentLabel,
  isPastDate,
  handleAcceptSwap,
  getUserDisplayName
}) => {
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search);

  const openSwaps = useMemo(
    () =>
      (data.assignments || []).filter(
        (assignment) => assignment.status === 'troca' && !isPastDate(assignment.date)
      ),
    [data.assignments, isPastDate]
  );

  const filteredSwaps = useMemo(() => {
    const query = normalizeText(deferredSearch);
    if (!query) return openSwaps;

    return openSwaps.filter((assignment) => {
      const swapUser = (data.users || []).find((entry) => entry.id === assignment.usuario_id);
      const searchText = normalizeText(
        `${assignment.date} ${assignment.tipo_designacao} ${formatAssignmentLabel(
          assignment.tipo_designacao
        )} ${getUserDisplayName(swapUser)}`
      );
      return searchText.includes(query);
    });
  }, [data.users, deferredSearch, formatAssignmentLabel, getUserDisplayName, openSwaps]);

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Trocas"
        title="Mural de trocas"
        description="Veja quem abriu mão de uma designação e assuma apenas o que ainda estiver válido."
        onBack={onBack}
      />

      <section className="panel-card space-y-3">
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_220px] sm:items-center">
          <label className="relative block">
            <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por nome, designação ou data"
              className="soft-input pl-11"
            />
          </label>

          <div className="rounded-[22px] bg-orange-50 px-4 py-3 text-orange-700">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] opacity-80">
              Trocas abertas
            </p>
            <p className="mt-2 text-2xl font-black">{openSwaps.length}</p>
          </div>
        </div>
      </section>

      <div className="space-y-4">
        {filteredSwaps.map((assignment) => {
          const swapUser = (data.users || []).find((entry) => entry.id === assignment.usuario_id);
          const swapName = getUserDisplayName(swapUser) || 'Usuário';
          const isOwner = assignment.usuario_id === user.id;
          const canAccept = !isOwner && !isPastDate(assignment.date);

          return (
            <div
              key={assignment.id}
              className="card-surface animate-slide-up rounded-4xl border border-orange-100 p-5 shadow-sm dark:border-navy-700 dark:bg-navy-800"
            >
              <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_220px] md:items-start">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[9px] font-black uppercase tracking-widest text-orange-500">
                      {formatDatePt(assignment.date)}
                    </span>
                    <span className="rounded-full bg-orange-100 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-orange-700">
                      Troca aberta
                    </span>
                  </div>

                  <div className="mt-3 flex items-center gap-2">
                    {assignment.tipo_designacao === 'LANCHE_ORADOR' && (
                      <Utensils size={14} className="text-amber-500" />
                    )}
                    <h4 className="truncate text-xl font-black tracking-tight text-slate-900 dark:text-white">
                      {formatAssignmentLabel(assignment.tipo_designacao)}
                    </h4>
                  </div>

                  <p className="mt-2 text-sm font-semibold text-slate-500 dark:text-slate-300">
                    {swapName} precisa de troca nesta data.
                  </p>
                </div>

                <div className="rounded-[22px] border border-slate-200/80 bg-slate-50/90 p-2.5 dark:border-slate-700 dark:bg-navy-900/70">
                  <button
                    type="button"
                    onClick={() => canAccept && handleAcceptSwap(assignment.id)}
                    disabled={!canAccept}
                    className={`inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-[18px] border px-4 py-3 text-[0.68rem] font-black uppercase tracking-[0.14em] shadow-sm transition-all ${
                      canAccept
                        ? 'border-orange-500 bg-orange-500 text-white hover:bg-orange-600'
                        : 'cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400 dark:border-slate-700 dark:bg-navy-900'
                    }`}
                  >
                    <Repeat2 size={14} />
                    {isOwner
                      ? 'Sua troca'
                      : isPastDate(assignment.date)
                        ? 'Data expirada'
                        : 'Aceitar esta designação'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {filteredSwaps.length === 0 && (
          <div className="panel-card py-12 text-center text-sm font-semibold text-slate-500 dark:text-slate-300">
            Nenhuma troca encontrada com os filtros atuais.
          </div>
        )}
      </div>
    </div>
  );
};

export default SwapMarket;
