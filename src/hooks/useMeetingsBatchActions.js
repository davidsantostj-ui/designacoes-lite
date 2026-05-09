import { useCallback } from 'react';
import { apiProvider } from '../services/apiProvider';

export const useMeetingsBatchActions = () => {
  return {
    handleOpenLatestMeetingsReclassify: () => {},
    handleSaveMeetingsReclassify: () => {},
    handleShiftDate: () => {},
    handleUndoMeetingsImport: () => {},
    handleWipeMeetingsData: () => {},
    isSavingMeetingsReclassify: false,
    isUndoingMeetingsImport: false,
    isWipingMeetingsData: false,
    isShiftingDates: false,
    latestMeetingsImportBatch: null,
    setLastMeetingsImportResult: () => {}
  };
};