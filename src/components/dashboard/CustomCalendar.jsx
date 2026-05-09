import React, { useMemo, useState } from 'react';
import { useData } from '../../context/DataStore';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';

export default function CustomCalendar() {
  const { assignments, currentUser } = useData();
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Memoizamos a geração dos dias do mês para evitar re-renderizações pesadas
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startingDayOfWeek = firstDay.getDay(); // 0 = Domingo
    
    const days = [];
    
    // Dias do mês anterior para preencher a primeira linha
    for (let i = 0; i < startingDayOfWeek; i++) {
      const prevDate = new Date(year, month, -startingDayOfWeek + i + 1);
      days.push({ date: prevDate, isCurrentMonth: false });
    }
    
    // Dias do mês atual
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const date = new Date(year, month, i);
      days.push({ date: date, isCurrentMonth: true });
    }
    
    // Dias do próximo mês para completar o grid (42 células = 6 linhas)
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      const nextDate = new Date(year, month + 1, i);
      days.push({ date: nextDate, isCurrentMonth: false });
    }
    
    return days;
  }, [currentDate]);

  // Filtramos as designações para busca rápida
  const assignmentsMap = useMemo(() => {
    const map = {};
    assignments.forEach(a => {
      if (a.status !== 'rejected') {
        const dateStr = new Date(a.date).toDateString();
        if (!map[dateStr]) map[dateStr] = [];
        map[dateStr].push(a);
      }
    });
    return map;
  }, [assignments]);

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3 px-1">
        <h3 className="text-xs font-black tracking-[0.2em] uppercase text-slate-400 flex items-center gap-2">
          <CalendarIcon size={16} className="text-blue-500" /> Calendário
        </h3>
      </div>

      <div className="rounded-[24px] bg-white dark:bg-slate-900/60 backdrop-blur-md border border-slate-200 dark:border-slate-800 shadow-sm p-4">
        {/* Header do Calendário */}
        <div className="flex items-center justify-between mb-4">
          <button onClick={prevMonth} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <ChevronLeft size={20} className="text-slate-600 dark:text-slate-300" />
          </button>
          <h4 className="text-sm font-black text-slate-800 dark:text-slate-100">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h4>
          <button onClick={nextMonth} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <ChevronRight size={20} className="text-slate-600 dark:text-slate-300" />
          </button>
        </div>

        {/* Dias da Semana */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map(day => (
            <div key={day} className="text-center text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {day}
            </div>
          ))}
        </div>

        {/* Grid de Dias */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((dayObj, index) => {
            const dateStr = dayObj.date.toDateString();
            const dayAssignments = assignmentsMap[dateStr] || [];
            const isToday = new Date().toDateString() === dateStr;
            const hasMyAssignment = dayAssignments.some(a => a.userId === currentUser?.id);
            const hasOtherAssignment = dayAssignments.length > 0 && !hasMyAssignment;

            return (
              <div 
                key={index} 
                className={`relative flex flex-col items-center justify-center h-10 rounded-xl transition-all ${
                  !dayObj.isCurrentMonth ? 'opacity-30' : ''
                } ${
                  isToday ? 'bg-blue-50 dark:bg-blue-500/10 font-black text-blue-600 dark:text-blue-400' : 'text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <span className="text-sm">{dayObj.date.getDate()}</span>
                
                {/* Pontos de Designação */}
                <div className="absolute bottom-1.5 flex gap-0.5">
                  {hasMyAssignment && (
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                  )}
                  {hasOtherAssignment && !hasMyAssignment && (
                    <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600"></span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
