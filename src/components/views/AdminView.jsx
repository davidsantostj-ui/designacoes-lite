import React from 'react';
import {
  BarChart3,
  CalendarClock,
  Database,
  Eye,
  FileSpreadsheet,
  Filter,
  Mail,
  Settings2,
  Sparkles,
  Upload,
  UserCheck,
  Users,
  Wand2
} from 'lucide-react';
import AdminAssignmentsTab from '../../features/admin/AdminAssignmentsTab';
import AdminAutoAssignmentsTab from '../../features/admin/AdminAutoAssignmentsTab';
import AdminFiltersTab from '../../features/admin/AdminFiltersTab';
import AdminApprovalsTab from '../../features/admin/AdminApprovalsTab';
import AdminStatusTab from '../../features/admin/AdminStatusTab';
import AdminUsersTab from '../../features/admin/AdminUsersTab';
import AdminMessagesTab from '../../features/admin/AdminMessagesTab';
import AdminReportsTab from '../../features/admin/AdminReportsTab';
import AdminBackupTab from '../../features/admin/AdminBackupTab';
import AdminMeetingsTab from '../../features/admin/AdminMeetingsTab';
import AdminSpecialEventsTab from '../../features/admin/AdminSpecialEventsTab';
import AdminGuestTab from '../../features/admin/AdminGuestTab';

const ADMIN_GROUPS = [
  {
    id: 'PROGRAMACAO',
    icon: CalendarClock,
    label: 'Programação',
    tabs: [
      { id: 'PROG_ADJUST', label: 'Manuais', icon: Wand2 },
      { id: 'PROG_IMPORT', label: 'Lote (CSV)', icon: Upload },
      { id: 'PROG_PUBLISH', label: 'Automático', icon: Sparkles },
      { id: 'PROG_EVENTS', label: 'Datas Especiais', icon: CalendarClock }
    ]
  },
  {
    id: 'PESSOAS',
    icon: Users,
    label: 'Pessoas',
    tabs: [
      { id: 'APROVACOES', label: 'Aprovações', icon: UserCheck },
      { id: 'USUARIOS', label: 'Usuários', icon: Users },
      { id: 'STATUS', label: 'Resumo', icon: BarChart3 }
    ]
  },
  {
    id: 'CONSULTAS',
    icon: Filter,
    label: 'Consultas',
    tabs: [
      { id: 'FILTROS', label: 'Busca', icon: Filter },
      { id: 'RELATORIOS', label: 'Relatórios', icon: FileSpreadsheet }
    ]
  },
  {
    id: 'SISTEMA',
    icon: Settings2,
    label: 'Sistema',
    tabs: [
      { id: 'MENSAGENS', label: 'Avisos', icon: Mail },
      { id: 'BACKUP', label: 'Backup', icon: Database }
    ]
  },
  {
    id: 'CONVIDADO',
    icon: Eye,
    label: 'Convidado',
    tabs: [
      { id: 'GUEST_CONFIG', label: 'Configuração', icon: Eye }
    ]
  }
];

const getAdminGroupByTab = (tabId) =>
  ADMIN_GROUPS.find((group) => group.tabs.some((tab) => tab.id === tabId)) || ADMIN_GROUPS[0];

const AdminView = ({
  setView,
  adminTab,
  setAdminTab,
  data,
  assignForm,
  setAssignForm,
  autoAssignForm,
  setAutoAssignForm,
  autoAssignPreview,
  isGeneratingAutoAssignments,
  isSavingAutoAssignments,
  handleGenerateAutoAssignmentsPreview,
  handleSaveAutoAssignments,
  handleCreateAssignment,
  getUserAssignmentsOnDate,
  formatAssignmentLabel,
  ASSIGNMENT_TYPES,
  canUserTakeAssignment,
  selectedUserAssignments,
  handlePickNextAvailable,
  freeUsersForSelectedDate,
  formatDatePt,
  monthCountsForSelected,
  getUserDisplayName,
  handleDownloadAssignmentsTemplate,
  handleDownloadMechanicalAssignmentsTemplate,
  isImportingAssignments,
  handleImportAssignmentsFile,
  isImportingMeetings,
  handleDownloadMeetingsTemplate,
  handleImportMeetingsFile,
  latestMeetingsImportBatch,
  handleOpenLatestMeetingsReclassify,
  handleUndoMeetingsImport,
  handleWipeMeetingsData,
  isUndoingMeetingsImport,
  isWipingMeetingsData,
  isSavingMeetingsReclassify,
  handleShiftDate,
  isShiftingDates,
  reassigningId,
  setReassigningId,
  handleDeleteAssignment,
  handleUpdateAssignment,
  handleReassign,
  filters,
  setFilters,
  STATUS_TYPES,
  filteredAssignments,
  handleUpdateApproval,
  handleApproveAll,
  handleApproveByDomain,
  user,
  isAdminUid,
  handleImpersonate,
  selectedAdminUser,
  setSelectedAdminUser,
  handleToggleAdminRole,
  handleDeleteUser,
  handleAdminUpdateUserName,
  getUserAssignmentCapabilities,
  handleUpdateUserCapabilities,
  handleSendBroadcast,
  handleSendRecoveryEmail,
  handleTransferAssignments,
  assignmentReport,
  downloadCsv,
  handleExportBackup,
  handleImportBackup,
  handleFixMojibake,
  isFixingMojibake,
  handleCleanupAssignments,
  handleCleanupNotifications,
  isCleaningAssignments,
  isCleaningNotifications,
  handleWipeAssignments,
  isWipingAssignments,
  cleanupMonthLabel,
  addToast,
  confirm,
  loadSections
}) => {
  const currentGroup = getAdminGroupByTab(adminTab);
  const pendingApprovals = (data?.users || []).filter((entry) => !entry.approved).length;

  // Calcula a segunda-feira da semana de uma data ISO (mesmo comportamento de meetingViewUtils)
  const getWeekStartIso = (isoDate) => {
    const [y, m, d] = isoDate.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    const weekday = (date.getDay() + 6) % 7;
    date.setDate(date.getDate() - weekday);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  const handleEditImportedWeek = React.useCallback((meetings) => {
    if (!meetings || meetings.length === 0) return;
    const sortedMeetings = [...meetings].sort((a, b) => (a.date || '').localeCompare(b.date || ''));
    const firstDate = sortedMeetings[0]?.date;
    if (firstDate) {
      const weekKey = getWeekStartIso(firstDate);
      localStorage.setItem('targetWeekKey', weekKey);
      setAdminTab('MEETINGS');
    }
  }, [setAdminTab]);

  const renderCurrentTab = () => {
    switch (adminTab) {
      case 'PROG_ADJUST':
        return (
          <AdminAssignmentsTab
            setAdminTab={setAdminTab}
            data={data}
            assignForm={assignForm}
            setAssignForm={setAssignForm}
            handleCreateAssignment={handleCreateAssignment}
            getUserAssignmentsOnDate={getUserAssignmentsOnDate}
            formatAssignmentLabel={formatAssignmentLabel}
            ASSIGNMENT_TYPES={ASSIGNMENT_TYPES}
            canUserTakeAssignment={canUserTakeAssignment}
            selectedUserAssignments={selectedUserAssignments}
            handlePickNextAvailable={handlePickNextAvailable}
            freeUsersForSelectedDate={freeUsersForSelectedDate}
            formatDatePt={formatDatePt}
            monthCountsForSelected={monthCountsForSelected}
            getUserDisplayName={getUserDisplayName}
            handleDownloadAssignmentsTemplate={handleDownloadAssignmentsTemplate}
            handleDownloadMechanicalAssignmentsTemplate={
              handleDownloadMechanicalAssignmentsTemplate
            }
            isImportingAssignments={isImportingAssignments}
            handleImportAssignmentsFile={handleImportAssignmentsFile}
            reassigningId={reassigningId}
            setReassigningId={setReassigningId}
            handleDeleteAssignment={handleDeleteAssignment}
            handleUpdateAssignment={handleUpdateAssignment}
            handleReassign={handleReassign}
          />
        );
      case 'PROG_IMPORT':
        return (
        <AdminMeetingsTab
          data={data}
          isImportingMeetings={isImportingMeetings}
          handleImportMeetingsFile={handleImportMeetingsFile}
          handleDownloadMeetingsTemplate={handleDownloadMeetingsTemplate}
          latestMeetingsImportBatch={latestMeetingsImportBatch}
          handleOpenLatestMeetingsReclassify={handleOpenLatestMeetingsReclassify}
          handleUndoMeetingsImport={handleUndoMeetingsImport}
          handleWipeMeetingsData={handleWipeMeetingsData}
          isUndoingMeetingsImport={isUndoingMeetingsImport}
          isWipingMeetingsData={isWipingMeetingsData}
          isSavingMeetingsReclassify={isSavingMeetingsReclassify}
          handleShiftDate={handleShiftDate}
          isShiftingDates={isShiftingDates}
          onNavigateToView={setAdminTab}
          onEditImportedWeek={handleEditImportedWeek}
          formatDatePt={formatDatePt}
        />
        );
      case 'PROG_PUBLISH':
        return (
          <AdminAutoAssignmentsTab
            autoAssignForm={autoAssignForm}
            setAutoAssignForm={setAutoAssignForm}
            autoAssignPreview={autoAssignPreview}
            isGeneratingAutoAssignments={isGeneratingAutoAssignments}
            isSavingAutoAssignments={isSavingAutoAssignments}
            handleGenerateAutoAssignmentsPreview={handleGenerateAutoAssignmentsPreview}
            handleSaveAutoAssignments={handleSaveAutoAssignments}
            ASSIGNMENT_TYPES={ASSIGNMENT_TYPES}
            data={data}
            getUserDisplayName={getUserDisplayName}
            formatDatePt={formatDatePt}
            formatAssignmentLabel={formatAssignmentLabel}
          />
        );
      case 'PROG_EVENTS':
        return (
          <AdminSpecialEventsTab
            data={data}
            formatDatePt={formatDatePt}
            addToast={addToast}
            confirm={confirm}
            loadSections={loadSections}
          />
        );
      case 'FILTROS':
        return (
          <AdminFiltersTab
            data={data}
            filters={filters}
            setFilters={setFilters}
            STATUS_TYPES={STATUS_TYPES}
            filteredAssignments={filteredAssignments}
            formatDatePt={formatDatePt}
            formatAssignmentLabel={formatAssignmentLabel}
            getUserDisplayName={getUserDisplayName}
          />
        );
      case 'APROVACOES':
        return (
          <AdminApprovalsTab
            data={data}
            handleUpdateApproval={handleUpdateApproval}
            handleApproveAll={handleApproveAll}
            handleApproveByDomain={handleApproveByDomain}
          />
        );
      case 'STATUS':
        return <AdminStatusTab data={data} />;
      case 'USUARIOS':
        return (
          <AdminUsersTab
            data={data}
            user={user}
            isAdminUid={isAdminUid}
            handleImpersonate={handleImpersonate}
            selectedAdminUser={selectedAdminUser}
            setSelectedAdminUser={setSelectedAdminUser}
            handleToggleAdminRole={handleToggleAdminRole}
            handleDeleteUser={handleDeleteUser}
            handleUpdateUserName={handleAdminUpdateUserName}
            ASSIGNMENT_TYPES={ASSIGNMENT_TYPES}
            getUserAssignmentCapabilities={getUserAssignmentCapabilities}
            handleUpdateUserCapabilities={handleUpdateUserCapabilities}
            handleSendRecoveryEmail={handleSendRecoveryEmail}
            handleTransferAssignments={handleTransferAssignments}
          />
        );
      case 'MENSAGENS':
        return <AdminMessagesTab handleSendBroadcast={handleSendBroadcast} />;
      case 'RELATORIOS':
        return (
          <AdminReportsTab
            assignmentReport={assignmentReport}
            data={data}
            downloadCsv={downloadCsv}
          />
        );
      case 'BACKUP':
        return (
          <AdminBackupTab
            handleExportBackup={handleExportBackup}
            handleImportBackup={handleImportBackup}
            handleFixMojibake={handleFixMojibake}
            isFixingMojibake={isFixingMojibake}
            handleCleanupAssignments={handleCleanupAssignments}
            handleCleanupNotifications={handleCleanupNotifications}
            isCleaningAssignments={isCleaningAssignments}
            isCleaningNotifications={isCleaningNotifications}
            handleWipeAssignments={handleWipeAssignments}
            isWipingAssignments={isWipingAssignments}
            cleanupMonthLabel={cleanupMonthLabel}
          />
        );
      case 'GUEST_CONFIG':
        return <AdminGuestTab addToast={addToast} />;
      default:
        return null;
    }
  };

  return (
    <div className="page-shell-tight animate-fade-in !pt-1">
      <div className="sticky top-0 z-30 mb-3 bg-[var(--bg)]/98 pb-2 pt-1 backdrop-blur-xl">
        <div className="rounded-[24px] border border-slate-200 bg-white px-3 py-2.5 shadow-lg dark:border-slate-800 dark:bg-navy-900">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-slate-500 dark:bg-navy-800 dark:text-slate-300">
              Admin
            </span>

            {ADMIN_GROUPS.map((group) => {
              const isActive = currentGroup.id === group.id;

              return (
                <button
                  key={group.id}
                  type="button"
                  onClick={() => setAdminTab(group.tabs[0].id)}
                  className={`inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-[10px] font-black uppercase tracking-[0.16em] transition-all ${
                    isActive
                      ? 'bg-navy-900 text-white dark:bg-blue-500'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-navy-800 dark:text-slate-200'
                  }`}
                >
                  <group.icon size={14} />
                  {group.label}
                  {group.id === 'PESSOAS' && pendingApprovals > 0 && (
                    <span
                      className={`rounded-full px-1.5 py-0.5 text-[9px] ${
                        isActive ? 'bg-white text-navy-900' : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {pendingApprovals}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-2.5 flex flex-wrap gap-2 border-t border-slate-200 pt-2.5 dark:border-slate-800">
            {currentGroup.tabs.map((tab) => {
              const isActive = adminTab === tab.id;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setAdminTab(tab.id)}
                  className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-[10px] font-black tracking-[0.08em] transition-all ${
                    isActive
                      ? 'bg-white text-slate-900 ring-1 ring-slate-200 shadow-sm dark:bg-navy-800 dark:text-white dark:ring-slate-700'
                      : 'text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-navy-800'
                  }`}
                >
                  <tab.icon size={13} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="space-y-5">{renderCurrentTab()}</div>
    </div>
  );
};

export default AdminView;
