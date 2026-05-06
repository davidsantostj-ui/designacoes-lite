import React from 'react';
import { X } from 'lucide-react';

const ConfirmModal = ({ state, onCancel, onConfirm }) => {
  if (!state?.open) return null;
  return (
    <div
      className="fixed inset-0 z-[250] bg-black/30 flex items-center justify-center p-4 animate-fade-in"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-md bg-white dark:bg-navy-900 card-surface rounded-4xl shadow-xl p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-black uppercase tracking-widest">
              {state.title || 'Confirmar ação'}
            </h3>
            {state.message && <p className="text-xs text-slate-500 mt-2">{state.message}</p>}
          </div>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Fechar confirmação"
            className="touch-target w-8 h-8 rounded-full bg-slate-100 dark:bg-navy-800 flex items-center justify-center"
          >
            <X size={14} />
          </button>
        </div>
        <div className="flex gap-2 justify-end">
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
            disabled={state.loading}
            className="px-4 py-2 rounded-xl bg-red-600 text-white text-[10px] font-black uppercase disabled:opacity-50"
          >
            {state.confirmText || 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
