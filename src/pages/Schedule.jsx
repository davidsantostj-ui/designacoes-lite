import React from 'react';
import { useData } from '../context/DataStore';
import { Calendar as CalendarIcon, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';

export default function Schedule() {
  const { currentUser, assignments, updateAssignmentStatus } = useData();
  
  // Filtrar apenas as deste usuário
  const myAssignments = assignments
    .filter(a => a.user_id === currentUser?.id)
    .sort((a,b) => new Date(a.date) - new Date(b.date));

  const handleReportAbsence = (id) => {
    if (window.confirm("Tem certeza que não poderá cumprir esta designação?\nEla será devolvida ao Administrador para reatribuição.")) {
      updateAssignmentStatus(id, 'rejected');
      alert("Ausência informada com sucesso. O administrador foi notificado na Caixa de Pendências.");
    }
  };

  return (
    <div className="space-y-6">
      <section className="animate-slide-up">
        <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Sua Agenda</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 font-medium">Visualize e gerencie seus compromissos.</p>
      </section>

      {/* Placeholder elegante para o calendário mensal */}
      <div className="rounded-[32px] bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/30 dark:to-blue-950/30 border border-blue-100/50 dark:border-blue-900/30 p-8 flex flex-col items-center justify-center animate-slide-up shadow-inner" style={{ animationDelay: '50ms' }}>
         <div className="w-16 h-16 bg-white dark:bg-slate-900 rounded-2xl shadow-sm flex items-center justify-center mb-4 border border-slate-100 dark:border-slate-800">
            <CalendarIcon size={28} className="text-blue-500" />
         </div>
         <p className="text-sm font-bold text-slate-500 dark:text-slate-400 text-center max-w-[200px]">
           O painel de calendário mensal interativo será exibido aqui.
         </p>
      </div>

      <div className="space-y-4 animate-slide-up" style={{ animationDelay: '100ms' }}>
        <h3 className="text-xs font-black tracking-[0.2em] uppercase text-slate-400 mb-2 mt-6 flex items-center gap-2 px-1">
          <Clock size={16} /> Próximas Tarefas
        </h3>
        
        {myAssignments.length === 0 ? (
          <div className="text-center p-8 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
            <p className="text-sm text-slate-400 font-bold">Sua agenda está livre no momento.</p>
          </div>
        ) : (
          myAssignments.map(assign => {
            const isRejected = assign.status === 'rejected';
            
            return (
              <div key={assign.id} className={`relative overflow-hidden rounded-[24px] bg-white dark:bg-slate-900/50 border transition-colors shadow-sm p-5 ${isRejected ? 'border-red-200 dark:border-red-900/30 opacity-80' : 'border-slate-200 dark:border-slate-800'}`}>
                {/* Barra lateral vibrante */}
                <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${isRejected ? 'bg-gradient-to-b from-red-400 to-rose-600' : 'bg-gradient-to-b from-emerald-400 to-teal-500'}`}></div>

                <div className="flex items-start justify-between pl-2">
                  <div>
                    <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg ${isRejected ? 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400' : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'}`}>
                      {new Date(assign.date).toLocaleDateString('pt-BR')}
                    </span>
                    <h4 className="text-xl font-black text-slate-800 dark:text-slate-100 mt-2">{assign.type}</h4>
                  </div>
                  
                  {isRejected ? (
                    <span className="bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400 text-[10px] uppercase font-black px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-sm border border-red-200 dark:border-red-500/30">
                      <AlertTriangle size={12} strokeWidth={3} /> Devolvida
                    </span>
                  ) : (
                    <span className="bg-emerald-500 text-white text-[10px] uppercase font-black px-3 py-1.5 rounded-xl flex items-center gap-1 shadow-md shadow-emerald-500/30">
                      <CheckCircle2 size={12} strokeWidth={3} /> Confirmada
                    </span>
                  )}
                </div>
                
                {!isRejected && (
                  <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800/50 pl-2">
                    <button 
                      onClick={() => handleReportAbsence(assign.id)} 
                      className="text-[11px] font-black tracking-wide uppercase text-rose-500 hover:text-white hover:bg-rose-500 px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 -ml-2"
                    >
                      <AlertTriangle size={14} strokeWidth={2.5} /> Informar Ausência
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
