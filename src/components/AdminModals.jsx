import React from 'react';
import ConfirmModal from './ConfirmModal';
import AssignmentConflictModal from './AssignmentConflictModal';
import CsvResolveModal from './CsvResolveModal';
import AssignmentsImportPreviewModal from './AssignmentsImportPreviewModal';
import MeetingsImportPreviewModal from './MeetingsImportPreviewModal';
import MeetingsBatchReclassifyModal from './MeetingsBatchReclassifyModal';

const AdminModals = ({
  confirmState,
  closeConfirm,
  acceptConfirm,
  
  assignmentConflict,
  setAssignmentConflict,
  handleAssignAnyway,
  handlePickAlternativeUser,
  freeUsersForConflictDate,
  conflictMonthCounts,
  formatDatePt,
  formatAssignmentLabel,
  getUserDisplayName,
  
  csvResolveState,
  dismissCsvResolve,
  handleConfirmCsvResolve,
  
  assignmentsImportPreview,
  dismissAssignmentsImportPreview,
  handleConfirmAssignmentsImport,
  handleToggleAssignmentsImportShowInMeetings,
  
  meetingsImportPreview,
  dismissMeetingsImportPreview,
  handleConfirmMeetingsImport,
  handleSelectMeetingsPreviewUser,
  handleUpdateMeetingsPreviewSection,
  handleUpdateMeetingsPreviewOrder,
  handleUpdateMeetingsPreviewAssignmentType,
  ASSIGNMENT_TYPES,
  
  meetingsReclassifyState,
  dismissMeetingsReclassify,
  handleSaveMeetingsReclassify,
  handleUpdateMeetingsReclassifyRow,
  isSavingMeetingsReclassify
}) => {
  return (
    <>
      <ConfirmModal 
        state={confirmState} 
        onCancel={closeConfirm} 
        onConfirm={acceptConfirm} 
      />

      <AssignmentConflictModal
        state={assignmentConflict}
        onClose={() => setAssignmentConflict(null)}
        onAssignAnyway={handleAssignAnyway}
        onPickUser={handlePickAlternativeUser}
        freeUsers={freeUsersForConflictDate}
        monthCounts={conflictMonthCounts}
        formatDatePt={formatDatePt}
        formatAssignmentLabel={formatAssignmentLabel}
        getUserDisplayName={getUserDisplayName}
      />

      <CsvResolveModal
        state={csvResolveState}
        onCancel={dismissCsvResolve}
        onConfirm={handleConfirmCsvResolve}
      />

      <AssignmentsImportPreviewModal
        state={assignmentsImportPreview}
        onClose={dismissAssignmentsImportPreview}
        onConfirm={handleConfirmAssignmentsImport}
        onToggleShowInMeetings={handleToggleAssignmentsImportShowInMeetings}
        formatDatePt={formatDatePt}
      />

      <MeetingsImportPreviewModal
        state={meetingsImportPreview}
        onClose={dismissMeetingsImportPreview}
        onConfirm={handleConfirmMeetingsImport}
        onSelectUser={handleSelectMeetingsPreviewUser}
        onUpdateSection={handleUpdateMeetingsPreviewSection}
        onUpdateOrder={handleUpdateMeetingsPreviewOrder}
        onUpdateAssignmentType={handleUpdateMeetingsPreviewAssignmentType}
        assignmentTypeOptions={ASSIGNMENT_TYPES}
        formatDatePt={formatDatePt}
      />

      <MeetingsBatchReclassifyModal
        state={meetingsReclassifyState}
        onClose={dismissMeetingsReclassify}
        onSave={handleSaveMeetingsReclassify}
        onUpdateRow={handleUpdateMeetingsReclassifyRow}
        isSaving={isSavingMeetingsReclassify}
        formatDatePt={formatDatePt}
      />
    </>
  );
};

export default AdminModals;
