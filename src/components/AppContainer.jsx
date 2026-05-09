import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { apiProvider } from '../services/apiProvider';
import { useToasts } from '../hooks/useToasts';
import { ASSIGNMENT_TYPES, ASSIGNMENT_TYPE_GROUPS } from '../constants/appConstants';

import AdminView from './views/AdminView';
import SecondaryViews from './views/SecondaryViews';
import DashboardView from './views/DashboardView';
import SearchView from './views/SearchView';
import NoticesView from './views/NoticesView';

const AppContainer = () => {
  const { view, setView, isDarkMode, user, data, setData } = useApp();
  const { addToast } = useToasts();
  const [dataReady, setDataReady] = useState(false);
  const [adminTab, setAdminTab] = useState('PROG_ADJUST');

  // Load Data
  const loadData = useCallback(async () => {
    try {
      const [users, assignments, meetings, talks, notifications, announcements, swapLogs, specialEvents] = await Promise.all([
        apiProvider.getUsers(),
        apiProvider.getAssignments(),
        apiProvider.getMeetings(),
        apiProvider.getTalks(),
        apiProvider.getNotifications(),
        apiProvider.getAnnouncements(),
        apiProvider.getSwapLogs ? apiProvider.getSwapLogs() : Promise.resolve([]),
        apiProvider.getSpecialEvents ? apiProvider.getSpecialEvents() : Promise.resolve([])
      ]);
      
      setData({
        users, assignments, meetings, talks, notifications, announcements, swapLogs, specialEvents
      });
      setDataReady(true);
    } catch (e) {
      console.error("Erro carregando dados:", e);
      addToast('Erro ao carregar dados do provedor', 'error');
    }
  }, [setData, addToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Form States
  const [assignForm, setAssignForm] = useState({ date: '', userId: '', type: '', publishToMeetings: false });
  const [filters, setFilters] = useState({ name: '', date: '', type: '', status: '', hasFiltered: false });

  // Common Utils
  const getUserDisplayName = useCallback((u) => u ? (u.name || u.email) : 'Desconhecido', []);
  const formatDatePt = useCallback((dateStr) => {
    if (!dateStr) return '';
    try {
      const [y, m, d] = dateStr.split('-');
      return `${d}/${m}/${y}`;
    } catch { return dateStr; }
  }, []);
  const formatAssignmentLabel = useCallback((type) => type || '', []);
  const canUserTakeAssignment = useCallback((u, type) => true, []);

  // CRUD Actions
  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    try {
      const newAssignment = {
        id: 'assign_' + Date.now(),
        date: assignForm.date,
        usuario_id: assignForm.userId,
        tipo_designacao: assignForm.type,
        status: 'pendente'
      };
      await apiProvider.createAssignment(newAssignment);
      addToast('Designação criada com sucesso!', 'success');
      loadData();
      setAssignForm({ ...assignForm, userId: '', type: '' });
    } catch (err) {
      addToast('Erro ao criar', 'error');
    }
  };

  const handleUpdateAssignment = async (id, updates) => {
    try {
      await apiProvider.updateAssignment(id, updates);
      addToast('Designação atualizada!', 'success');
      loadData();
      return true;
    } catch (err) {
      addToast('Erro ao atualizar', 'error');
      return false;
    }
  };

  const handleDeleteAssignment = async (id) => {
    try {
      await apiProvider.deleteAssignment(id);
      addToast('Excluído!', 'success');
      loadData();
      return true;
    } catch (err) {
      addToast('Erro ao excluir', 'error');
      return false;
    }
  };

  const handleUpdateApproval = async (id, approved) => {
    try {
      await apiProvider.updateUser(id, { approved });
      addToast(approved ? 'Aprovado' : 'Rejeitado', 'success');
      loadData();
    } catch (err) {}
  };

  // Rendering
  const renderContent = () => {
    if (!dataReady) return <div className="p-10 text-center">Carregando dados...</div>;

    switch (view) {
      case 'ADMIN':
        return (
          <AdminView 
            setView={setView}
            adminTab={adminTab}
            setAdminTab={setAdminTab}
            data={data}
            user={user}
            isAdminUid={true}
            assignForm={assignForm}
            setAssignForm={setAssignForm}
            handleCreateAssignment={handleCreateAssignment}
            handleUpdateAssignment={handleUpdateAssignment}
            handleDeleteAssignment={handleDeleteAssignment}
            handleUpdateApproval={handleUpdateApproval}
            getUserAssignmentsOnDate={() => []}
            formatAssignmentLabel={formatAssignmentLabel}
            ASSIGNMENT_TYPES={ASSIGNMENT_TYPES}
            canUserTakeAssignment={canUserTakeAssignment}
            selectedUserAssignments={[]}
            handlePickNextAvailable={() => {}}
            freeUsersForSelectedDate={data.users || []}
            formatDatePt={formatDatePt}
            monthCountsForSelected={{}}
            getUserDisplayName={getUserDisplayName}
            filters={filters}
            setFilters={setFilters}
            filteredAssignments={data.assignments || []}
          />
        );
      case 'SETTINGS':
      case 'REPORTS':
      case 'HISTORY':
      case 'CALENDAR':
      case 'MEETINGS':
      case 'ASSIGNMENTS_MONTH':
      case 'SWAP_MARKET':
      case 'TALKS':
      case 'SPECIAL_EVENTS':
        return (
          <SecondaryViews 
            view={view}
            data={data}
            dataReady={dataReady}
            user={user}
            formatDatePt={formatDatePt}
            getUserDisplayName={getUserDisplayName}
            formatAssignmentLabel={formatAssignmentLabel}
            canUserTakeAssignment={canUserTakeAssignment}
            handleUpdateAssignment={handleUpdateAssignment}
            onBack={() => setView('DASHBOARD')}
            isRealAdmin={true}
            isPastDate={() => false}
          />
        );
      case 'SEARCH':
        return <SearchView data={data} setView={setView} formatDatePt={formatDatePt} />;
      case 'NOTICES':
        return <NoticesView data={data} user={user} setView={setView} />;
      default:
        return <DashboardView data={data} user={user} setView={setView} formatDatePt={formatDatePt} />;
    }
  };

  return <>{renderContent()}</>;
};

export default AppContainer;
