import { apiProvider } from '../services/apiProvider';

export const useMaintenanceActions = () => ({
  cleanupAssignments: async () => 0,
  cleanupNotifications: async () => 0,
  handleCleanupAssignments: async () => {},
  handleCleanupNotifications: async () => {},
  handleWipeAssignments: async () => {},
  isCleaningAssignments: false,
  isCleaningNotifications: false,
  isWipingAssignments: false,
  cleanupMonthLabel: ''
});