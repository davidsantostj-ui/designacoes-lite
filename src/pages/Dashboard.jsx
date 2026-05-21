import React from 'react';
import { useNavigate } from 'react-router-dom';
import HeroSection from '../components/dashboard/HeroSection';
import QuickLinks from '../components/dashboard/QuickLinks';
import NoticeBoard from '../components/dashboard/NoticeBoard';
import CustomCalendar from '../components/dashboard/CustomCalendar';
import { BookOpen, MapPin, ChevronRight } from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6 pb-20 animate-fade-in">
      
      {/* Seção 2: Destaque (Próxima Designação) */}
      <section className="animate-slide-up" style={{ animationDelay: '0ms' }}>
        <HeroSection />
      </section>

      {/* Seção: Links Rápidos (Acomoda até 6 botões de forma uniforme) */}
      <section className="space-y-2.5 animate-slide-up" style={{ animationDelay: '30ms' }}>
        <h3 className="text-[10px] uppercase tracking-[0.2em] font-black text-slate-400 dark:text-slate-500 pl-1">
          Links Rápidos
        </h3>
        <QuickLinks />
      </section>

      {/* Seção 3: Avisos */}
      <section className="animate-slide-up" style={{ animationDelay: '50ms' }}>
        <NoticeBoard />
      </section>

      {/* Seção 4: Atividades e Campo */}
      <section className="grid grid-cols-2 gap-4 animate-slide-up" style={{ animationDelay: '100ms' }}>
        <button 
          onClick={() => navigate('/atividades')}
          className="relative overflow-hidden rounded-[24px] bg-white dark:bg-slate-900/60 backdrop-blur-md border border-slate-200 dark:border-slate-800 shadow-sm p-4 text-left hover:shadow-md hover:scale-[1.02] active:scale-95 transition-all group"
        >
          <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 w-max mb-3">
            <BookOpen size={20} />
          </div>
          <h4 className="text-sm font-black text-slate-800 dark:text-slate-100 mb-1">Atividades Espirituais</h4>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1 group-hover:text-blue-500 transition-colors">
            Ver Dicas <ChevronRight size={12} />
          </p>
        </button>

        <button 
          onClick={() => navigate('/campo')}
          className="relative overflow-hidden rounded-[24px] bg-white dark:bg-slate-900/60 backdrop-blur-md border border-slate-200 dark:border-slate-800 shadow-sm p-4 text-left hover:shadow-md hover:scale-[1.02] active:scale-95 transition-all group"
        >
          <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 w-max mb-3">
            <MapPin size={20} />
          </div>
          <h4 className="text-sm font-black text-slate-800 dark:text-slate-100 mb-1">Serviço de Campo</h4>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1 group-hover:text-emerald-500 transition-colors">
            Programação <ChevronRight size={12} />
          </p>
        </button>
      </section>

      {/* Seção 5: Calendário Moderno */}
      <section className="animate-slide-up" style={{ animationDelay: '150ms' }}>
        <CustomCalendar />
      </section>
      
    </div>
  );
}
