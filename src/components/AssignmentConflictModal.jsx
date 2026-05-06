import React from 'react';
import { X } from 'lucide-react';

const AssignmentConflictModal = ({
  state,
  onClose,
  onAssignAnyway,
  onPickUser,
  freeUsers = [],
  monthCounts = {},
  formatDatePt,
  formatAssignmentLabel,
  getUserDisplayName
}) => {
  if (!state?.open) return null;
  const userName = state.userName || 'Usuário';
  const conflictCount = state.conflicts?.length || 0;
  const isMechanicalConflict = state.conflictKind === 'mechanical';
  return (
    <div
      className="fixed inset-0 z-[260] bg-black/40 flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white dark:bg-navy-900 card-surface rounded-4xl shadow-2xl p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-black uppercase tracking-widest">
              {isMechanicalConflict ? 'Conflito de designação mecânica' : 'Conflito de designação'}
            </h3>
            <p className="text-xs text-slate-500 mt-2">
              {isMechanicalConflict
                ? `${userName} já possui ${conflictCount} designação(ões) mecânica(s) em ${formatDatePt(state.date)}.`
                : `${userName} já possui ${conflictCount} designação(ões) em ${formatDatePt(state.date)}.`}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar conflito"
            className="touch-target w-8 h-8 rounded-full bg-slate-100 dark:bg-navy-800 flex items-center justify-center"
          >
            <X size={14} />
          </button>
        </div>
        {conflictCount > 0 && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-2xl p-3 space-y-2">
            <p className="text-[9px] font-black uppercase tracking-widest text-amber-700 dark:text-amber-300">
              {isMechanicalConflict ? 'Mecânicas existentes' : 'Designações existentes'}
            </p>
            <div className="space-y-1">
              {state.conflicts.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center justify-between text-[10px] font-semibold text-slate-700 dark:text-slate-200"
                >
                  <span>{formatAssignmentLabel(a.tipo_designacao)}</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase ${a.status === 'confirmado' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-200' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300'}`}
                  >
                    {a.status || 'pendente'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <button
            onClick={onAssignAnyway}
            className="py-3 rounded-2xl bg-navy-900 text-white text-[10px] font-black uppercase tracking-widest"
          >
            Designar mesmo assim
          </button>
          <button
            type="button"
            onClick={() => {}}
            title="Veja opções abaixo"
            className="py-3 rounded-2xl bg-slate-100 dark:bg-navy-800 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300"
          >
            Escolher outra pessoa
          </button>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">
              Pessoas livres e habilitadas
            </p>
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
              {freeUsers.length}
            </span>
          </div>
          <div className="max-h-56 overflow-y-auto no-scrollbar space-y-2">
            {freeUsers.map((u) => (
              <button
                key={u.id}
                onClick={() => onPickUser(u.id)}
                className="w-full text-left p-3 rounded-2xl bg-white dark:bg-navy-800 border dark:border-slate-800 flex items-center justify-between hover:shadow-sm transition-all"
              >
                <div className="min-w-0">
                  <p className="text-xs font-bold truncate">{getUserDisplayName(u)}</p>
                  <p className="text-[9px] text-slate-400 uppercase font-bold tracking-widest">
                    {monthCounts[u.id] || 0} tarefa(s) no mês
                  </p>
                </div>
                <span className="text-[9px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
                  Designar
                </span>
              </button>
            ))}
            {freeUsers.length === 0 && (
              <p className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest py-6">
                Nenhum elegível livre nessa data.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssignmentConflictModal;
