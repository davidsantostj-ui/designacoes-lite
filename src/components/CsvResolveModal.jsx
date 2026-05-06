import React from 'react';
import { X } from 'lucide-react';

const CsvResolveModal = ({ state, onCancel, onConfirm }) => {
  if (!state?.open) return null;
  const rows = state.rows || [];
  const ignoredRows = state.ignoredRows || [];
  const hasReadyRows = (state.baseRows || []).length > 0 || ignoredRows.length > 0;
  const primaryLabel = rows.length > 0 ? 'Continuar importação' : hasReadyRows ? 'Ver prévia' : 'Fechar';
  return (
    <div
      className="fixed inset-0 z-[260] bg-black/40 flex items-center justify-center p-4 animate-fade-in"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-lg bg-white dark:bg-navy-900 card-surface rounded-4xl shadow-2xl p-6 space-y-4 max-h-[85vh] overflow-y-auto no-scrollbar"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-black uppercase tracking-widest">Resolver nomes do CSV</h3>
            <p className="text-xs text-slate-500 mt-2">
              {rows.length > 0
                ? 'Alguns nomes bateram com mais de um usuário. Escolha o cadastro correto.'
                : 'Alguns nomes não foram encontrados no app e serão ignorados neste lote.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Fechar"
            className="touch-target w-8 h-8 rounded-full bg-slate-100 dark:bg-navy-800 flex items-center justify-center"
          >
            <X size={14} />
          </button>
        </div>
        <div className="space-y-3">
          {rows.map((r, idx) => (
            <div
              key={`${r.line}_${idx}`}
              className="p-3 rounded-3xl bg-slate-50 dark:bg-navy-800 border dark:border-slate-700"
            >
              <div className="flex items-center justify-between">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                  Linha {r.line}
                </p>
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                  {r.name || 'Sem nome'}
                </span>
              </div>
              <div className="mt-2">
                <select
                  value={r.selectedId || ''}
                  onChange={(e) => r.onSelect(e.target.value)}
                  className="w-full p-2 bg-white dark:bg-navy-900 rounded-xl text-xs font-bold border dark:border-slate-700"
                >
                  <option value="">Selecione o usuário</option>
                  {(r.candidates || []).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ))}
          {rows.length === 0 && (
            <p className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest py-6">
              Nada para resolver.
            </p>
          )}
        </div>
        {ignoredRows.length > 0 && (
          <div className="space-y-3 rounded-3xl border border-rose-200 bg-rose-50 p-4">
            <div>
              <h4 className="text-[10px] font-black uppercase tracking-widest text-rose-700">
                Não importados
              </h4>
              <p className="mt-2 text-xs text-rose-800">
                Estes nomes ainda não existem no app e ficarão fora da importação.
              </p>
            </div>
            <div className="space-y-2">
              {ignoredRows.map((row) => (
                <div
                  key={row.id || `${row.line}-${row.name}-${row.type}`}
                  className="rounded-2xl border border-rose-200 bg-white/80 px-3 py-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[9px] font-black uppercase tracking-widest text-rose-500">
                      Linha {row.line}
                    </p>
                    <span className="text-[9px] font-black uppercase tracking-widest text-rose-500">
                      {row.date || ''}
                    </span>
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
        <div className="flex gap-2 justify-end pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-navy-800 text-[10px] font-black uppercase"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 rounded-xl bg-navy-900 text-white text-[10px] font-black uppercase"
          >
            {primaryLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CsvResolveModal;
