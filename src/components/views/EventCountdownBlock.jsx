import React, { useMemo } from 'react';
import { CalendarDays, Clock } from 'lucide-react';
import { getEventColors, getEventMeta } from '../../utils/specialEventsUtils';

// Fix #11: getDaysRemaining fora do componente — não recriada a cada render
const calcDaysRemaining = (targetDateStr) => {
  const target = new Date(targetDateStr);
  target.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((target - today) / (1000 * 60 * 60 * 24));
};

// Fix #6: removido `const events = specialEvents` intermediário desnecessário
const EventCountdownBlock = ({ specialEvents = [] }) => {
  const closestEvent = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return specialEvents
      .filter((evt) => new Date(evt.date) >= today)
      .sort((a, b) => new Date(a.date) - new Date(b.date))[0] || null;
  }, [specialEvents]);

  if (!closestEvent) return null;

  const daysRemaining = calcDaysRemaining(closestEvent.date);
  const meta = getEventMeta(closestEvent.typeId);
  const colors = getEventColors(meta.color);

  return (
    // Fix #15: removido mt-4 — espaçamento controlado pelo gap do pai
    <div className={`flex items-center justify-between gap-3 rounded-2xl border ${colors.border} ${colors.bg} p-3`}>
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/60 shadow-sm dark:bg-black/20 ${colors.text}`}>
          <CalendarDays size={18} />
        </div>
        <div>
          <p className={`text-[10px] font-black uppercase tracking-widest ${colors.text} opacity-80`}>
            Próximo Evento Especial
          </p>
          <p className={`text-sm font-black md:text-base ${colors.text} leading-snug`}>
            {meta.label}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 flex-col items-end">
        <div className="flex items-center gap-1.5">
          <Clock size={12} className={`${colors.text} opacity-70`} />
          {/* Fix #13: "Hoje" quando daysRemaining === 0 */}
          <span className={`text-xl font-black md:text-2xl ${colors.text}`}>
            {daysRemaining === 0 ? '🎉' : daysRemaining}
          </span>
        </div>
        <p className={`text-[10px] font-black uppercase tracking-widest ${colors.text} opacity-70`}>
          {daysRemaining === 0 ? 'Hoje' : daysRemaining === 1 ? 'Dia' : 'Dias'}
        </p>
      </div>
    </div>
  );
};

export default EventCountdownBlock;
