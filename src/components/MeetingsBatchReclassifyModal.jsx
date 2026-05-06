import React from 'react';
import { SlidersHorizontal, X } from 'lucide-react';

const SECTION_OPTIONS = [
  { key: 'abertura', label: 'Abertura' },
  { key: 'tesouros', label: 'Tesouros da Palavra de Deus' },
  { key: 'ministerio', label: 'Faça Seu Melhor no Ministério' },
  { key: 'vida_crista', label: 'Nossa Vida Cristã' },
  { key: 'encerramento', label: 'Encerramento' }
];

const MeetingsBatchReclassifyModal = ({
  state,
  onClose,
  onSave,
  onUpdateRow,
  isSaving,
  formatDatePt
}) => {
  if (!state?.open) return null;

  return (
    <div
      className="fixed inset-0 z-[271] bg-black/50 flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl bg-white dark:bg-navy-900 card-surface rounded-4xl shadow-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto no-scrollbar"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">
              Reclassificar lote
            </p>
            <h3 className="text-lg font-black uppercase tracking-tight mt-1">
              {state.batchLabel || 'Importação recente'}
            </h3>
            <p className="text-sm text-slate-500 mt-2 max-w-[58ch]">
              Ajuste Seção e Ordem do lote já importado sem precisar reenviar o arquivo.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="touch-target w-9 h-9 rounded-full bg-slate-100 dark:bg-navy-800 flex items-center justify-center"
          >
            <X size={16} />
          </button>
        </div>

        <div className="space-y-3">
          {(state.rows || []).map((row) => (
            <div
              key={row.id}
              className="p-4 rounded-3xl bg-white dark:bg-navy-800 border dark:border-slate-800 shadow-sm"
            >
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_200px_120px] lg:items-end">
                <div className="min-w-0">
                  <p className="text-[9px] font-black uppercase tracking-widest text-blue-500">
                    {formatDatePt(row.date)}
                  </p>
                  <p className="mt-2 text-sm font-black dark:text-white">{row.designation}</p>
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    Linha {row.importLine}
                  </p>
                </div>

                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <span className="inline-flex items-center gap-2 mb-2">
                    <SlidersHorizontal size={12} />
                    Seção
                  </span>
                  <select
                    value={row.sectionKey}
                    onChange={(e) => onUpdateRow(row.id, 'sectionKey', e.target.value)}
                    className="w-full p-3 bg-slate-50 dark:bg-navy-900 rounded-2xl text-xs font-bold border dark:border-slate-700 text-slate-700 dark:text-slate-200"
                  >
                    {SECTION_OPTIONS.map((section) => (
                      <option key={section.key} value={section.key}>
                        {section.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <span className="block mb-2">Ordem</span>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={row.designationOrder || 1}
                    onChange={(e) => onUpdateRow(row.id, 'designationOrder', e.target.value)}
                    className="w-full p-3 bg-slate-50 dark:bg-navy-900 rounded-2xl text-xs font-bold border dark:border-slate-700 text-slate-700 dark:text-slate-200"
                  />
                </label>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-2 justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-3 rounded-2xl bg-slate-100 dark:bg-navy-800 text-[10px] font-black uppercase tracking-widest"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={isSaving}
            className="px-4 py-3 rounded-2xl bg-navy-900 text-white text-[10px] font-black uppercase tracking-widest disabled:opacity-60"
          >
            {isSaving ? 'Salvando...' : 'Salvar classificação'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MeetingsBatchReclassifyModal;
