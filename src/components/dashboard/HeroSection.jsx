import React from 'react';
import { Calendar as CalendarIcon, Clock } from 'lucide-react';
import { useData } from '../../context/DataStore';

export default function HeroSection() {
  const { currentUser, assignments } = useData();

  const myAssignments = assignments.filter(a => a.user_id === currentUser?.id && a.status !== 'rejected');
  const nextAssignment = myAssignments
    .filter(a => new Date(a.date) >= new Date(new Date().setHours(0,0,0,0)))
    .sort((a, b) => new Date(a.date) - new Date(b.date))[0];

  return (
    <div className="h-full rounded-[24px] p-5 bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30 relative overflow-hidden flex flex-col justify-between">
      {/* Decoração de fundo */}
      <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
      <div className="absolute -left-4 -bottom-4 w-24 h-24 bg-indigo-900/40 rounded-full blur-xl"></div>
      
      <div className="relative z-10">
        <p className="text-[10px] uppercase tracking-[0.2em] font-black text-blue-200 mb-2">Próxima Designação</p>
        <p className="text-xl font-black text-white leading-tight mb-4">
          {nextAssignment?.type || 'Nenhuma tarefa pendente'}
        </p>
      </div>

      <div className="relative z-10">
        {nextAssignment ? (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/20 backdrop-blur-md border border-white/10 text-white text-xs font-bold shadow-inner">
            <CalendarIcon size={14} />
            {new Date(nextAssignment.date).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })}
          </div>
        ) : (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/20 backdrop-blur-md border border-white/10 text-white text-xs font-bold">
            <Clock size={14} />
            Aguardando...
          </div>
        )}
      </div>
    </div>
  );
}
