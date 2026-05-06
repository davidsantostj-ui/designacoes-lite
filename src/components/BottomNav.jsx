import { Calendar as CalIcon, FileAudio2, Home, Repeat, Users } from 'lucide-react';

const NAV_ITEMS = [
  { id: 'DASHBOARD', icon: Home, label: 'Inicio', accent: 'text-blue-600' },
  { id: 'MEETINGS', icon: Users, label: 'Reuniões', accent: 'text-violet-600' },
  { id: 'ASSIGNMENTS_MONTH', icon: CalIcon, label: 'Agenda', accent: 'text-emerald-600' },
  { id: 'SWAP_MARKET', icon: Repeat, label: 'Trocas', accent: 'text-orange-600' },
  { id: 'TALKS', icon: FileAudio2, label: 'Discursos', accent: 'text-rose-600' }
];

const BottomNav = ({ view, onNavigate }) => (
  <nav className="fixed bottom-3 left-1/2 z-[220] w-[calc(100%-1rem)] max-w-3xl -translate-x-1/2 rounded-[28px] border border-slate-200/80 bg-white/92 p-2 shadow-2xl backdrop-blur-xl dark:border-slate-800 dark:bg-navy-900/92">
    <div className="grid grid-cols-5 gap-1">
      {NAV_ITEMS.map((item) => {
        const isActive = view === item.id;

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onNavigate(item.id)}
            className={`relative flex min-w-0 flex-col items-center justify-center rounded-[22px] px-1 py-2 transition-all ${
              isActive
                ? 'bg-slate-100 text-slate-900 shadow-sm dark:bg-navy-800 dark:text-white'
                : 'text-slate-400'
            }`}
          >
            <item.icon
              size={18}
              className={`mb-1 transition-transform ${isActive ? `${item.accent} scale-110` : ''}`}
              strokeWidth={isActive ? 2.5 : 2}
            />
            <span className="text-[9px] font-black uppercase leading-tight tracking-[0.16em]">
              {item.label}
            </span>

            {isActive && <div className="absolute bottom-1 h-1.5 w-1.5 rounded-full bg-current" />}
          </button>
        );
      })}
    </div>
  </nav>
);

export default BottomNav;
