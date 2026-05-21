import React, { useState, useEffect } from 'react';
import { useData } from '../../context/DataStore';
import { Info, Star, Clock } from 'lucide-react';
import RichTextDisplay from '../RichTextDisplay';

// Subcomponente isolado para não re-renderizar a lista inteira a cada segundo
const Countdown = ({ targetDate }) => {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = new Date(targetDate) - new Date();
      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((difference / 1000 / 60) % 60);
        return `${days}d ${hours}h ${minutes}m`;
      }
      return 'Chegou!';
    };

    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 60000); // Atualiza a cada minuto para poupar CPU

    return () => clearInterval(timer);
  }, [targetDate]);

  return (
    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 text-xs font-bold border border-amber-200 dark:border-amber-500/30">
      <Clock size={12} />
      Faltam {timeLeft}
    </div>
  );
};

export default function NoticeBoard() {
  const { notices } = useData();

  if (notices.length === 0) return null;

  // Pegamos apenas o mais recente ou o mais importante (com specialDate)
  const sortedNotices = [...notices].sort((a, b) => {
    if (a.specialDate && !b.specialDate) return -1;
    if (!a.specialDate && b.specialDate) return 1;
    return new Date(b.date) - new Date(a.date);
  });

  const topNotice = sortedNotices[0];
  const isSpecial = !!topNotice.specialDate;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3 px-1">
        <h3 className="text-xs font-black tracking-[0.2em] uppercase text-slate-400 flex items-center gap-2">
          <Info size={16} className="text-blue-500" /> Avisos
        </h3>
      </div>
      
      <div className={`relative overflow-hidden rounded-[24px] bg-white dark:bg-slate-900/60 backdrop-blur-md border shadow-sm p-5 ${isSpecial ? 'border-amber-200 dark:border-amber-900/50' : 'border-slate-200 dark:border-slate-800'}`}>
        <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${isSpecial ? 'bg-gradient-to-b from-amber-400 to-orange-500' : 'bg-gradient-to-b from-blue-400 to-indigo-500'}`}></div>
        
        {isSpecial && (
          <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-amber-500/20 to-transparent rounded-bl-[40px] flex items-start justify-end p-3">
            <Star size={16} className="text-amber-500" fill="currentColor" />
          </div>
        )}
        
        <h4 className="text-base font-black text-slate-800 dark:text-slate-100 pr-8 pl-2">{topNotice.title}</h4>
        <RichTextDisplay content={topNotice.content} className="mt-2 pl-2" />
        
        <div className="mt-4 flex items-center justify-between pl-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            {new Date(topNotice.date).toLocaleDateString('pt-BR')}
          </span>
          {isSpecial && <Countdown targetDate={topNotice.specialDate} />}
        </div>
      </div>
    </div>
  );
}
