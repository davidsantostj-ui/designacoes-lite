import React from 'react';
import { X } from 'lucide-react';

const AboutModal = ({ open, onClose, currentVersion }) => {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[120] bg-black/30 flex items-start justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md max-h-[85vh] overflow-y-auto no-scrollbar p-6 space-y-4 animate-fade-in bg-white dark:bg-navy-900 card-surface rounded-4xl shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black uppercase tracking-widest">Sobre</h3>
          <button
            onClick={onClose}
            className="touch-target w-8 h-8 rounded-full bg-slate-100 dark:bg-navy-800 flex items-center justify-center"
          >
            <X size={14} />
          </button>
        </div>
        <div className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
          <p className="text-sm font-bold">Minhas Designações</p>
          <p className="text-[10px] uppercase font-black tracking-widest text-slate-400">
            Versão {currentVersion || '5.1.1'}
          </p>
          <p className="text-sm">App interno para designações e avisos.</p>
        </div>
      </div>
    </div>
  );
};

export default AboutModal;
