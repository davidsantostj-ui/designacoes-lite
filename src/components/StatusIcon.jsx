import React from 'react';
import { CheckCircle2, Clock, XCircle, CalendarClock, RefreshCw } from 'lucide-react';

export const StatusIcon = ({ status, className = '' }) => {
  const normStatus = String(status || 'programado').toLowerCase();

  switch (normStatus) {
    case 'confirmado':
      return (
        <span
          className={`inline-flex items-center gap-1 text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 ${className}`}
          title="Confirmado"
        >
          <CheckCircle2 size={14} className="opacity-90" />
          <span className="sr-only">Confirmado</span>
        </span>
      );
    case 'pendente':
    case 'pendentes': // from dashboards sometimes
      return (
        <span
          className={`inline-flex items-center gap-1 text-[10px] font-black uppercase text-amber-500 dark:text-amber-400 ${className}`}
          title="Pendente"
        >
          <Clock size={14} className="opacity-90" />
          <span className="sr-only">Pendente</span>
        </span>
      );
    case 'troca':
      return (
        <span
          className={`inline-flex items-center gap-1 text-[10px] font-black uppercase text-orange-500 dark:text-orange-400 ${className}`}
          title="Troca"
        >
          <RefreshCw size={14} className="opacity-90" />
          <span className="sr-only">Troca</span>
        </span>
      );
    case 'rejeitado':
      return (
        <span
          className={`inline-flex items-center gap-1 text-[10px] font-black uppercase text-rose-500 dark:text-rose-400 ${className}`}
          title="Rejeitado"
        >
          <XCircle size={14} className="opacity-90" />
          <span className="sr-only">Rejeitado</span>
        </span>
      );
    case 'programado':
    default:
      return (
        <span
          className={`inline-flex items-center gap-1 text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 ${className}`}
          title="Programado"
        >
          <CalendarClock size={14} className="opacity-80" />
          <span className="sr-only">Programado</span>
        </span>
      );
  }
};

export default StatusIcon;
