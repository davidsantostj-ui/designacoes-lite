import React, { useMemo } from 'react';
import { CalendarDays, Flag, Info } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import SkeletonBlock from '../../components/SkeletonBlock';
import { getEventColors, getEventMeta } from '../../utils/specialEventsUtils';

// Fix #3: recebe specialEvents diretamente em vez do objeto data inteiro
// Fix #16: recebe dataReady para exibir skeleton enquanto carrega
const SpecialEventsView = ({ onBack, specialEvents = [], dataReady, formatDatePt }) => {
  // Fix #9: um único useMemo em vez de dois — evita recalcular today duas vezes
  const { futureEvents, pastEvents } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const future = specialEvents
      .filter((evt) => new Date(evt.date) >= today)
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    const past = specialEvents
      .filter((evt) => new Date(evt.date) < today)
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    return { futureEvents: future, pastEvents: past };
  }, [specialEvents]);

  const renderEventList = (list) => {
    if (list.length === 0) {
      return (
        <div className="rounded-[24px] border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-navy-800">
          <Flag size={24} className="mx-auto mb-3 text-slate-300" />
          <p className="text-[12px] font-black uppercase tracking-widest text-slate-400">
            Nenhum evento registrado.
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {list.map((evt) => {
          const meta = getEventMeta(evt.typeId);
          const colors = getEventColors(meta.color);

          return (
            <div
              key={evt.id}
              className={`relative overflow-hidden rounded-[24px] border ${colors.border} ${colors.bg} p-5 shadow-sm transition-transform hover:-translate-y-0.5`}
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`inline-flex rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ${colors.badge}`}>
                      {formatDatePt(evt.date)}
                    </span>
                  </div>
                  <h3 className={`text-xl font-black md:text-2xl ${colors.text} leading-tight`}>
                    {meta.label}
                  </h3>
                  {evt.labelOverrides && (
                    <p className={`mt-2 text-sm font-semibold opacity-90 ${colors.text}`}>
                      {evt.labelOverrides}
                    </p>
                  )}
                  {evt.cancellationRule && evt.cancellationRule !== 'none' && (
                    <div className="mt-4 flex items-center gap-2 bg-white/50 dark:bg-black/20 px-3 py-2 rounded-xl w-max max-w-full">
                      <Info size={14} className={colors.text} />
                      <p className={`text-[11px] font-bold ${colors.text} opacity-80 leading-snug`}>
                        {evt.cancellationRule === 'cancel_all'
                          ? 'Não haverá reuniões nesta semana.'
                          : evt.cancellationRule === 'cancel_midweek'
                          ? 'Reunião de Meio de Semana cancelada.'
                          : 'Reunião de Fim de Semana cancelada.'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="page-shell space-y-6">
      <PageHeader
        eyebrow="Calendário Geral"
        title="Eventos Especiais"
        description="Fique por dentro das datas de assembleias, congressos, visita do superintendente e muito mais."
        onBack={onBack}
      />

      {/* Fix #16: skeleton enquanto dados carregam */}
      {!dataReady?.specialEvents ? (
        <section className="space-y-3">
          <SkeletonBlock className="h-5 w-40 rounded-xl" />
          <SkeletonBlock className="h-28 w-full rounded-[24px]" />
          <SkeletonBlock className="h-28 w-full rounded-[24px]" />
        </section>
      ) : (
        <>
          <section className="space-y-4">
            <div className="flex items-center gap-2 px-2">
              <CalendarDays size={18} className="text-blue-500" />
              <h2 className="text-sm font-black uppercase tracking-widest text-slate-700 dark:text-slate-300">
                Próximos Eventos
              </h2>
            </div>
            {renderEventList(futureEvents)}
          </section>

          {pastEvents.length > 0 && (
            <section className="space-y-4 pt-6">
              <div className="flex items-center gap-2 px-2">
                <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">
                  Eventos Anteriores (Últimos 30 dias)
                </h2>
              </div>
              <div className="opacity-70 grayscale transition-all hover:grayscale-0 hover:opacity-100">
                {renderEventList(pastEvents)}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
};

export default SpecialEventsView;
