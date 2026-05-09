import React from 'react';
import { Calendar as CalIcon, BellRing, Home, Settings, Users } from 'lucide-react';

const NAV_ITEMS = [
  { id: 'DASHBOARD', icon: Home, label: 'Início' },
  { id: 'ADMIN', icon: Users, label: 'Admin' },
  { id: 'CALENDAR', icon: CalIcon, label: 'Agenda' },
  { id: 'NOTICES', icon: BellRing, label: 'Avisos' },
  { id: 'SETTINGS', icon: Settings, label: 'Ajustes' }
];

const BottomNav = ({ currentView, onNavigate }) => {
  const handleClick = (id) => {
    if (typeof onNavigate === 'function') {
      onNavigate(id);
    }
  };

  return (
    <nav className="fixed bottom-4 left-0 right-0 z-50">
      <div className="flex justify-around bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-3 px-4">
        {NAV_ITEMS.map((item) => {
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleClick(item.id)}
              className={`flex flex-col items-center gap-1 p-2 ${isActive ? 'text-blue-600' : 'text-gray-400'}`}
              type="button"
            >
              <item.icon className="w-6 h-6" />
              <span className="text-xs">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;