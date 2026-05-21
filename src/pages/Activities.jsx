import React from 'react';
import { useData } from '../context/DataStore';
import { ArrowLeft, BookOpen, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import RichTextDisplay from '../components/RichTextDisplay';

export default function Activities() {
  const { tips } = useData();
  const navigate = useNavigate();

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      {/* Header específico da página com Botão Voltar */}
      <div className="flex items-center gap-3 mb-6">
        <button 
          onClick={() => window.history.length > 1 ? navigate(-1) : navigate('/')}
          className="w-10 h-10 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm"
        >
          <ArrowLeft size={20} className="text-slate-600 dark:text-slate-300" />
        </button>
        <div>
          <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white leading-none">
            Atividades
          </h2>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
            Dicas e encorajamento espiritual
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {tips.length === 0 ? (
          <div className="text-center p-8 rounded-[28px] border border-dashed border-slate-200 dark:border-slate-800">
            <p className="text-sm text-slate-400 font-bold">Nenhuma atividade no momento.</p>
          </div>
        ) : (
          tips.map(tip => (
            <div 
              key={tip.id} 
              className={`relative overflow-hidden rounded-[28px] bg-white/70 dark:bg-slate-900/60 backdrop-blur-md border shadow-sm p-6 hover:shadow-md hover:scale-[1.01] hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-300 ${tip.active ? 'border-indigo-500/50 dark:border-indigo-500/40 shadow-[0_8px_30px_rgb(0,0,0,0.02)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)]' : 'border-slate-200/80 dark:border-slate-800/80'}`}
            >
              <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${tip.active ? 'bg-gradient-to-b from-indigo-500 via-purple-500 to-teal-500' : 'bg-slate-300 dark:bg-slate-700'}`}></div>
              
              <div className="flex gap-4 items-start pl-2">
                <div className={`mt-0.5 p-3 rounded-2xl transition-all duration-300 ${tip.active ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
                  <BookOpen size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-base font-black text-slate-800 dark:text-slate-100">{tip.title}</h4>
                  
                  <RichTextDisplay content={tip.content} className="mt-2" />
                  
                  {tip.active && (
                    <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[11px] font-extrabold tracking-wide uppercase shadow-sm animate-pulse">
                      <CheckCircle2 size={13} /> Ativo esta semana
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
