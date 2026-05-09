import React from 'react';
import { Bell, Search, Menu, Sun, Moon } from 'lucide-react';

const AppHeader = ({ user, isDark, onMenuClick, searchIcon, onSearchClick }) => {
  // Render-safe user object
  const displayUser = user || { name: 'Admin' };
  
  return (
    <header className="sticky top-0 z-50 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Left side - Menu and Title */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => onMenuClick && onMenuClick()}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            type="button"
          >
            <Menu className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
          <div className="flex flex-col">
            <span className="font-bold text-lg text-gray-900 dark:text-white">
              Designações
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Modo Offline
            </span>
          </div>
        </div>
        
        {/* Right side - Actions */}
        <div className="flex items-center gap-1">
          {searchIcon && (
            <button 
              onClick={() => onSearchClick && onSearchClick()}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              type="button"
            >
              <Search className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>
          )}
          <button 
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors relative"
            type="button"
          >
            <Bell className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;