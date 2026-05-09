import React from 'react';
import { useData } from '../context/DataStore';
import { ArrowLeft, MapPin, Video, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function FieldService() {
  const { fieldService } = useData();
  const navigate = useNavigate();

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      {/* Header específico da página com Botão Voltar */}
      <div className="flex items-center gap-3 mb-6">
        <button 
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm"
        >
          <ArrowLeft size={20} className="text-slate-600 dark:text-slate-300" />
        </button>
        <div>
          <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white leading-none">
            Serviço de Campo
          </h2>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
            Programação da semana
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {fieldService.length === 0 ? (
          <div className="text-center p-8 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
            <p className="text-sm text-slate-400 font-bold">Nenhuma saída de campo programada.</p>
          </div>
        ) : (
          fieldService.map(item => (
            <div 
              key={item.id} 
              className="rounded-[24px] bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 shadow-sm p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="text-lg font-black text-slate-800 dark:text-slate-100">{item.dayOfWeek}</h4>
                  <p className="text-sm font-bold text-blue-600 dark:text-blue-400">{item.time}</p>
                </div>
                <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${item.type === 'Zoom' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'}`}>
                  {item.type}
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 text-slate-400">
                    {item.type === 'Zoom' ? <Video size={16} /> : <MapPin size={16} />}
                  </div>
                  <div className="flex-1">
                    <p className="text-xs uppercase tracking-widest font-bold text-slate-400 mb-0.5">Local / Link</p>
                    {item.type === 'Zoom' ? (
                      <a href={item.location_or_link} target="_blank" rel="noreferrer" className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline break-all">
                        {item.location_or_link}
                      </a>
                    ) : (
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        {item.location_or_link}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="mt-0.5 text-slate-400">
                    <User size={16} />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-widest font-bold text-slate-400 mb-0.5">Dirigente</p>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      {item.conductor}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
