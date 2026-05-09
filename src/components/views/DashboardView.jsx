import React from 'react';
import { Bell, Calendar, Users, Settings, Plus, Search, Sun, Moon } from 'lucide-react';

const DashboardView = () => {
  // Dados mockados hardcoded para garantir funcionamento
  const stats = {
    totalUsers: 2,
    totalAssignments: 5,
    totalMeetings: 3,
    totalNotifications: 0
  };

  const user = { name: 'Administrador' };
  const isDarkMode = false;

  return (
    <div className="p-4 space-y-6">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Olá, {user?.name?.split(' ')[0] || 'Admin'}!
          </h1>
          <p className="text-gray-500 text-sm">
            {new Date().toLocaleDateString('pt-BR', { 
              weekday: 'long', 
              day: 'numeric', 
              month: 'long' 
            })}
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-blue-500 text-white p-4 rounded-xl">
          <div className="text-2xl font-bold">{stats.totalUsers}</div>
          <div className="text-sm opacity-80">Usuários</div>
        </div>
        <div className="bg-green-500 text-white p-4 rounded-xl">
          <div className="text-2xl font-bold">{stats.totalAssignments}</div>
          <div className="text-sm opacity-80">Designações</div>
        </div>
        <div className="bg-purple-500 text-white p-4 rounded-xl">
          <div className="text-2xl font-bold">{stats.totalMeetings}</div>
          <div className="text-sm opacity-80">Reuniões</div>
        </div>
        <div className="bg-orange-500 text-white p-4 rounded-xl">
          <div className="text-2xl font-bold">{stats.totalNotifications}</div>
          <div className="text-sm opacity-80">Notificações</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <h2 className="font-semibold text-gray-900 mb-4">Ações Rápidas</h2>
        <div className="grid grid-cols-4 gap-3">
          <button className="flex flex-col items-center gap-2 p-3">
            <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center">
              <Plus className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs font-medium text-gray-600">Nova</span>
          </button>
          <button className="flex flex-col items-center gap-2 p-3">
            <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs font-medium text-gray-600">Usuários</span>
          </button>
          <button className="flex flex-col items-center gap-2 p-3">
            <div className="w-12 h-12 rounded-full bg-purple-500 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs font-medium text-gray-600">Calendário</span>
          </button>
          <button className="flex flex-col items-center gap-2 p-3">
            <div className="w-12 h-12 rounded-full bg-orange-500 flex items-center justify-center">
              <Bell className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs font-medium text-gray-600">Avisos</span>
          </button>
        </div>
      </div>

      {/* Search */}
      <button className="w-full flex items-center gap-3 p-4 bg-gray-100 rounded-xl text-gray-500">
        <Search className="w-5 h-5" />
        <span>Buscar...</span>
      </button>

      {/* Footer */}
      <div className="text-center py-4">
        <p className="text-xs text-gray-400">Modo Offline • Dados Locais</p>
      </div>
    </div>
  );
};

export default DashboardView;