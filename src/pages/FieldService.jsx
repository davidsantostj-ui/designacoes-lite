import React from 'react';
import { useData } from '../context/DataStore';
import { ArrowLeft, MapPin, Video, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { parseLinks } from '../utils/textUtils';

// Helper to determine weekday sorting index (Brazil: Monday first)
const getDayIndex = (dayName) => {
  if (!dayName) return 99;
  const normalized = dayName.trim().toLowerCase()
    .replace('-feira', '');
  
  if (normalized.startsWith('segunda')) return 1;
  if (normalized.startsWith('terça') || normalized.startsWith('terca')) return 2;
  if (normalized.startsWith('quarta')) return 3;
  if (normalized.startsWith('quinta')) return 4;
  if (normalized.startsWith('sexta')) return 5;
  if (normalized.startsWith('sábado') || normalized.startsWith('sabado')) return 6;
  if (normalized.startsWith('domingo')) return 7;
  
  return 99;
};

// Helper to determine if weekday matches current day of the week
const isToday = (dayOfWeek) => {
  if (!dayOfWeek) return false;
  const currentDayIndex = new Date().getDay(); // 0 is Sunday, 1 is Monday, etc.
  const daysMapping = {
    0: 'domingo',
    1: 'segunda',
    2: 'terça',
    3: 'quarta',
    4: 'quinta',
    5: 'sexta',
    6: 'sábado'
  };
  const todayName = daysMapping[currentDayIndex];
  const normalizedCardDay = dayOfWeek.trim().toLowerCase().replace('-feira', '').replace('á', 'a').replace('ç', 'c');
  const normalizedTodayName = todayName.replace('á', 'a').replace('ç', 'c');
  
  return normalizedCardDay === normalizedTodayName;
};

export default function FieldService() {
  const { fieldService } = useData();
  const navigate = useNavigate();

  // Helper to safely render locations and parse clickable links
  const renderLocationOrLink = (text, type) => {
    if (!text) return null;
    
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const hasProtocol = text.match(urlRegex);
    
    if (hasProtocol) {
      return parseLinks(text).map((chunk, index) => 
        chunk.isLink ? (
          <a 
            key={index} 
            href={chunk.text} 
            target="_blank" 
            rel="noreferrer" 
            className="text-sm font-bold text-blue-600 dark:text-blue-400 hover:underline break-all"
          >
            {chunk.text}
          </a>
        ) : (
          <span key={index} className="text-slate-700 dark:text-slate-300">{chunk.text}</span>
        )
      );
    }
    
    // If it looks like a web link or is of type Zoom
    if (type === 'Zoom' || text.toLowerCase().startsWith('www.') || text.includes('.com') || text.includes('.org')) {
      const href = text.toLowerCase().startsWith('http') ? text : `https://${text}`;
      return (
        <a 
          href={href} 
          target="_blank" 
          rel="noreferrer" 
          className="text-sm font-bold text-blue-600 dark:text-blue-400 hover:underline break-all"
        >
          {text}
        </a>
      );
    }
    
    return <span className="text-slate-700 dark:text-slate-300">{text}</span>;
  };

  // Sort by day index (Brazil standard: Monday starts)
  const sortedFieldService = React.useMemo(() => {
    return [...fieldService].sort((a, b) => getDayIndex(a.dayOfWeek) - getDayIndex(b.dayOfWeek));
  }, [fieldService]);

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
            Serviço de Campo
          </h2>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
            Programação da semana
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {sortedFieldService.length === 0 ? (
          <div className="text-center p-8 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
            <p className="text-sm text-slate-400 font-bold">Nenhuma saída de campo programada.</p>
          </div>
        ) : (
          sortedFieldService.map(item => {
            const today = isToday(item.dayOfWeek);
            
            return (
              <div 
                key={item.id} 
                className={`relative overflow-hidden rounded-[24px] border transition-all duration-300 p-5 hover:-translate-y-0.5 ${
                  today 
                    ? 'border-2 border-emerald-500 dark:border-emerald-500 bg-gradient-to-br from-emerald-50/70 to-teal-50/40 dark:from-emerald-950/20 dark:to-teal-950/10 ring-4 ring-emerald-500/10 shadow-md shadow-emerald-500/5 dark:shadow-emerald-950/30' 
                    : 'border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/50 shadow-sm hover:shadow-md'
                }`}
              >
                {/* Left vertical visual accent border */}
                <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                  today 
                    ? 'bg-gradient-to-b from-emerald-400 to-teal-500' 
                    : item.type === 'Zoom' 
                      ? 'bg-gradient-to-b from-indigo-400 to-blue-500' 
                      : 'bg-gradient-to-b from-teal-400 to-emerald-500'
                }`}></div>
                
                <div className="flex justify-between items-start mb-4 pl-2">
                  <div>
                    <h4 className={`text-lg font-black ${
                      today ? 'text-emerald-950 dark:text-emerald-50' : 'text-slate-800 dark:text-slate-100'
                    }`}>
                      {item.dayOfWeek}
                    </h4>
                    <p className={`text-xs font-bold mt-0.5 inline-block px-2 py-0.5 rounded-md ${
                      today 
                        ? 'bg-emerald-100/80 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-400' 
                        : 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400'
                    }`}>
                      {item.time}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {today && (
                      <div className="bg-emerald-500 text-white dark:bg-emerald-600 px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase flex items-center gap-1.5 shadow-sm shadow-emerald-500/30">
                        <span className="relative flex h-1.5 w-1.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white"></span>
                        </span>
                        Hoje
                      </div>
                    )}
                    
                    <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      item.type === 'Zoom' 
                        ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400' 
                        : 'bg-teal-100 text-teal-700 dark:bg-teal-500/20 dark:text-teal-400'
                    }`}>
                      {item.type}
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3.5 pl-2">
                  <div className="flex items-start gap-3.5">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border transition-colors ${
                      today 
                        ? 'bg-emerald-100/80 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-200/30 dark:border-emerald-500/20' 
                        : 'bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 border-slate-100 dark:border-slate-800'
                    }`}>
                      {item.type === 'Zoom' ? <Video size={16} /> : <MapPin size={16} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] uppercase tracking-widest font-black text-slate-400 mb-0.5">Local / Link</p>
                      <div className="text-sm font-medium">
                        {renderLocationOrLink(item.location_or_link, item.type)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3.5">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border transition-colors ${
                      today 
                        ? 'bg-emerald-100/80 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-200/30 dark:border-emerald-500/20' 
                        : 'bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 border-slate-100 dark:border-slate-800'
                    }`}>
                      <User size={16} />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-widest font-black text-slate-400 mb-0.5">Dirigente</p>
                      <p className={`text-sm font-semibold ${
                        today ? 'text-emerald-950 dark:text-emerald-100' : 'text-slate-700 dark:text-slate-200'
                      }`}>
                        {item.conductor}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
