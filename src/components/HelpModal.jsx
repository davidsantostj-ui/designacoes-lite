import React from 'react';
import { X } from 'lucide-react';

const HelpModal = ({ open, onClose }) => {
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
          <h3 className="text-sm font-black uppercase tracking-widest">Ajuda</h3>
          <button
            onClick={onClose}
            className="touch-target w-8 h-8 rounded-full bg-slate-100 dark:bg-navy-800 flex items-center justify-center"
          >
            <X size={14} />
          </button>
        </div>
        <div className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
          <p className="text-xs uppercase font-black tracking-widest text-slate-400">
            Resumo rápido
          </p>
          <ul className="space-y-2 text-sm">
            <li>Designações: veja suas escalas e confirme presença.</li>
            <li>Trocas: solicite e acompanhe trocas de designação.</li>
            <li>Calendário: navegue entre meses e toque em um dia para ver itens.</li>
            <li>Notificações e anúncios: avisos internos e comunicados.</li>
            <li>Admin: aprovar usuários, importar CSV e ajustar nomes.</li>
          </ul>
          <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400">
            Dica: use Atualizar para buscar a versão mais recente. Esqueceu a senha? Use
            Recuperar senha na tela de login.
          </p>
        </div>
      </div>
    </div>
  );
};

export default HelpModal;
