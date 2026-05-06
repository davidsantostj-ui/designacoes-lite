import React from 'react';
import { CalendarClock, FileSpreadsheet, Link2, Users, X } from 'lucide-react';

const formatStatusLabel = (value) => {
  const normalized = String(value || '').toLowerCase();
  if (normalized === 'confirmado') return 'Confirmado';
  if (normalized === 'troca') return 'Troca';
  return 'Pendente';
};

const AssignmentsImportPreviewModal = ({
  state,
  onClose,
  onConfirm,
  onToggleShowInMeetings,
  formatDatePt
}) => {
  if (!state?.open) return null;

  const rows = state.rows || [];
  const ignoredRows = state.ignoredRows || [];
  const canImport = rows.length > 0;
  const meetingEligibleCount = rows.filter((row) => row.meetingEligible).length;
  const skippedCount =
    Number(state?.skippedExisting || 0) + Number(state?.skippedCsv || 0);

  return (
    <div
      className="fixed inset-0 z-[270] flex items-center justify-center bg-black/50 p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="card-surface no-scrollbar max-h-[90vh] w-full max-w-4xl space-y-5 overflow-y-auto rounded-4xl bg-white p-6 shadow-2xl dark:bg-navy-900"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">
              Prévia do lote
            </p>
            <h3 className="mt-1 text-lg font-black tracking-tight text-slate-900 dark:text-white">
              Revise antes de importar
            </h3>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">
              Confirme os responsáveis e o impacto na agenda antes de publicar.
            </p>
            <p className="mt-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Arquivo: {state.fileName || 'designacoes.csv'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="touch-target flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 dark:bg-navy-800"
          >
            <X size={16} />
          </button>
        </div>

        <div className={`grid grid-cols-2 gap-3 ${ignoredRows.length > 0 ? 'sm:grid-cols-5' : 'sm:grid-cols-4'}`}>
          <div className="rounded-3xl bg-slate-50 p-4 dark:bg-navy-800">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">
              Linhas
            </p>
            <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
              {rows.length}
            </p>
          </div>
          <div className="rounded-3xl bg-emerald-50 p-4">
            <p className="text-[9px] font-black uppercase tracking-widest text-emerald-700">
              Agenda
            </p>
            <p className="mt-2 text-2xl font-black text-emerald-700">{rows.length}</p>
          </div>
          <div className="rounded-3xl bg-violet-50 p-4">
            <p className="text-[9px] font-black uppercase tracking-widest text-violet-700">
              Reuniões
            </p>
            <p className="mt-2 text-2xl font-black text-violet-700">
              {state.showInMeetings ? meetingEligibleCount : 0}
            </p>
          </div>
          <div className="rounded-3xl bg-slate-50 p-4 dark:bg-navy-800">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">
              Ignoradas
            </p>
            <p className="mt-2 text-2xl font-black text-slate-500">{skippedCount}</p>
          </div>
          {ignoredRows.length > 0 && (
            <div className="rounded-3xl bg-rose-50 p-4">
              <p className="text-[9px] font-black uppercase tracking-widest text-rose-700">
                Fora do app
              </p>
              <p className="mt-2 text-2xl font-black text-rose-700">{ignoredRows.length}</p>
            </div>
          )}
        </div>

        {meetingEligibleCount > 0 && (
          <label className="flex items-start gap-3 rounded-3xl border border-violet-200 bg-violet-50 p-4 text-sm text-violet-800">
            <input
              type="checkbox"
              checked={state.showInMeetings === true}
              onChange={(event) => onToggleShowInMeetings(event.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-violet-300 text-violet-600 focus:ring-violet-500"
            />
            <span>
              <span className="block font-black">Publicar também em Reuniões</span>
              <span className="mt-1 block text-[11px] leading-snug text-violet-700">
                {meetingEligibleCount} item(ns) de meio de semana também aparecerá(ão) no menu
                Reuniões.
              </span>
            </span>
          </label>
        )}

        {ignoredRows.length > 0 && (
          <div className="rounded-3xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-rose-700">
                Não importados
              </p>
              <span className="rounded-full bg-white/80 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-rose-700">
                {ignoredRows.length}
              </span>
            </div>
            <p className="mt-2 text-[12px] leading-relaxed text-rose-800">
              Estes nomes ainda não existem no app e foram ignorados neste lote.
            </p>

            <div className="mt-3 space-y-2">
              {ignoredRows.map((row) => (
                <div
                  key={row.id || `${row.line}-${row.name}-${row.type}`}
                  className="rounded-2xl border border-rose-200 bg-white/80 px-3 py-3"
                >
                  <div className="flex flex-wrap items-center gap-2 text-[9px] font-black uppercase tracking-widest text-rose-600">
                    <span>Linha {row.line}</span>
                    {row.date ? <span>{formatDatePt(row.date)}</span> : null}
                  </div>
                  <p className="mt-2 text-sm font-black text-slate-900">{row.name}</p>
                  <p className="mt-1 text-[11px] font-semibold text-slate-500">
                    {row.type}
                    {row.reason ? ` • ${row.reason}` : ''}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-3">
          {rows.map((row) => (
            <div
              key={row.id}
              className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-navy-800"
            >
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[9px] font-black uppercase tracking-widest text-blue-600">
                      {formatDatePt(row.date)}
                    </span>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-slate-500">
                      {formatStatusLabel(row.status)}
                    </span>
                    {row.meetingEligible && state.showInMeetings && (
                      <span className="rounded-full bg-violet-100 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-violet-700">
                        Também em Reuniões
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-sm font-black text-slate-900 dark:text-white">
                    {row.type}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-3 text-[11px] font-semibold text-slate-500 dark:text-slate-300">
                    <span className="inline-flex items-center gap-1.5">
                      <Users size={12} />
                      {row.userLabel || row.name || 'Usuário vinculado'}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <FileSpreadsheet size={12} />
                      Linha {row.line}
                    </span>
                    {row.meetingEligible && (
                      <span className="inline-flex items-center gap-1.5">
                        <Link2 size={12} />
                        Compatível com Reuniões
                      </span>
                    )}
                  </div>
                </div>

                <div className="rounded-2xl bg-slate-50 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:bg-navy-900 dark:text-slate-300">
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarClock size={12} />
                    Agenda pronta
                  </span>
                </div>
              </div>
            </div>
          ))}

          {rows.length === 0 && (
            <div className="rounded-3xl bg-slate-50 p-6 text-center dark:bg-navy-800">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Nenhuma linha pronta para importar.
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl bg-slate-100 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:bg-navy-800 dark:text-slate-200"
          >
            Cancelar
          </button>
          {canImport && (
            <button
              type="button"
              onClick={onConfirm}
              className="rounded-2xl bg-navy-900 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-white dark:bg-blue-500"
            >
              Importar agora
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AssignmentsImportPreviewModal;
