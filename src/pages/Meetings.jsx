import React, { useState } from 'react';
import { useData } from '../context/DataStore';
import { ChevronDown, ChevronUp, Calendar as CalendarIcon, Users } from 'lucide-react';

export default function Meetings() {
  const { meetings, assignments, users } = useData();
  const [expandedId, setExpandedId] = useState(null);

  // Filtrar designações do dia (apenas não rejeitadas)
  const getAssignmentsForDate = (date) => {
    return assignments.filter(a => a.date === date && a.status !== 'rejected').map(a => {
      const user = users.find(u => u.id === a.user_id);
      return { ...a, userName: user?.name || 'Desconhecido' };
    });
  };

  return (
    <div className="space-y-6">
      <section className="animate-slide-up">
        <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Reuniões</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 font-medium">Sua programação semanal e mecânicas.</p>
      </section>

      <div className="space-y-3 animate-slide-up" style={{ animationDelay: '50ms' }}>
        {meetings.sort((a,b) => new Date(a.date) - new Date(b.date)).map(meeting => {
          const isExpanded = expandedId === meeting.id;
          const meetingAssignments = getAssignmentsForDate(meeting.date);

          return (
            <div key={meeting.id} className="rounded-[24px] bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 overflow-hidden transition-all duration-300 shadow-sm">
              <button 
                onClick={() => setExpandedId(isExpanded ? null : meeting.id)}
                className="w-full p-5 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
              >
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-[9px] uppercase tracking-[0.2em] font-black px-2 py-1 rounded-lg ${meeting.type === 'Fim de Semana' ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400' : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400'}`}>
                      {meeting.type}
                    </span>
                    <span className="text-xs font-bold text-slate-500 flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                      <CalendarIcon size={12} /> {new Date(meeting.date).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  <h3 className="text-base font-black text-slate-800 dark:text-slate-100">{meeting.title}</h3>
                </div>
                <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center shrink-0 ml-3">
                  {isExpanded ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
                </div>
              </button>

              {isExpanded && (
                <div className="px-5 pb-5 pt-3 border-t border-slate-100 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-900/20">
                  <h4 className="text-[10px] uppercase tracking-[0.2em] font-black text-slate-400 mb-3 flex items-center gap-1.5">
                    <Users size={12} /> Designações Mecânicas
                  </h4>
                  
                  {meetingAssignments.length === 0 ? (
                    <p className="text-sm text-slate-500 font-medium italic">Nenhuma designação registrada para esta data.</p>
                  ) : (
                    <div className="space-y-2">
                      {meetingAssignments.map(assign => {
                        const isMine = currentUser?.id && assign.user_id === currentUser.id;
                        return (
                          <div key={assign.id} className={`flex items-center justify-between p-3 rounded-[16px] border shadow-sm transition-all ${isMine ? 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-500/30 ring-1 ring-blue-500/20' : 'bg-white dark:bg-slate-800 border-slate-200/50 dark:border-slate-700/50'}`}>
                            <span className={`text-sm font-bold ${isMine ? 'text-blue-700 dark:text-blue-300' : 'text-slate-700 dark:text-slate-200'}`}>
                              {assign.type} {isMine && '🌟'}
                            </span>
                            <span className={`text-xs font-black px-3 py-1.5 rounded-xl ${isMine ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300'}`}>
                              {assign.userName}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
