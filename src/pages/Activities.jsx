import React from 'react';
import { useData } from '../context/DataStore';
import { ArrowLeft, BookOpen, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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
          <div className="text-center p-8 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
            <p className="text-sm text-slate-400 font-bold">Nenhuma atividade no momento.</p>
          </div>
        ) : (
          tips.map(tip => (
            <div 
              key={tip.id} 
              className={`relative overflow-hidden rounded-[24px] bg-white dark:bg-slate-900/50 border shadow-sm p-5 ${tip.active ? 'border-blue-200 dark:border-blue-900/30' : 'border-slate-200 dark:border-slate-800'}`}
            >
              <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${tip.active ? 'bg-gradient-to-b from-blue-400 to-indigo-500' : 'bg-slate-300 dark:bg-slate-700'}`}></div>
              
              <div className="flex gap-4 items-start pl-2">
                <div className={`mt-1 p-2 rounded-xl ${tip.active ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                  <BookOpen size={20} />
                </div>
                <div>
                  <h4 className="text-base font-black text-slate-800 dark:text-slate-100">{tip.title}</h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 leading-relaxed font-medium">
                    {tip.content}
                  </p>
                  
                  {tip.active && (
                    <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 text-[11px] font-bold">
                      <CheckCircle2 size={14} /> Ativo esta semana
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
