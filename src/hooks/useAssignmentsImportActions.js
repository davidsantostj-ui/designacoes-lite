import { apiProvider } from '../services/apiProvider';

export const useAssignmentsImportActions = () => ({
  assignmentsImportPreview: { open: false },
  closeAssignmentsImportPreview: () => {},
  closeCsvResolve: () => {},
  csvResolveState: { open: false },
  handleConfirmAssignmentsImport: async () => {},
  handleConfirmCsvResolve: async () => {},
  handleImportAssignmentsFile: async () => {},
  handleToggleAssignmentsImportShowInMeetings: () => {},
  isImportingAssignments: false
});