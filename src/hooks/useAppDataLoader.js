import { useCallback, useMemo, useState } from 'react';
import { buildDataLoader } from '../services/dataLoader';
import { replaceCollection } from '../utils/dataStateUtils';
import { normalizeViewId } from '../utils/viewRoutes';

export const useAppDataLoader = ({
  initialData,
  initialReady,
  db,
  withRetry,
  getDateDaysAgo,
  getMonthStartIso,
  isImpersonating,
  user,
  isRealAdminUser,
  authReady,
  guardAuth,
  addToast
}) => {
  const [data, setData] = useState(initialData);
  const [dataReady, setDataReady] = useState(initialReady);

  const dataLoader = useMemo(
    () =>
      buildDataLoader({
        db,
        withRetry,
        getDateDaysAgo,
        getMonthStartIso,
        isImpersonating,
        user,
        isRealAdminUser
      }),
    [db, withRetry, getDateDaysAgo, getMonthStartIso, isImpersonating, user, isRealAdminUser]
  );

  const loadSections = useCallback(
    async (sections, opts = {}) => {
      if (!(await guardAuth())) return false;
      try {
        const { updates, ready, errors } = await dataLoader.loadSections(sections || []);
        if (Object.keys(updates).length > 0) {
          setData((prev) =>
            Object.entries(updates).reduce((nextState, [key, value]) => {
              if (Array.isArray(value)) return replaceCollection(nextState, key, value);
              return { ...nextState, [key]: value };
            }, prev)
          );
        }
        if (Object.keys(ready).length > 0) {
          setDataReady((prev) => ({ ...prev, ...ready }));
        }
        const hasErrors = Object.keys(errors || {}).length > 0;
        const loadedSomething =
          Object.keys(updates).length > 0 || Object.keys(ready).length > 0;
        if (hasErrors) {
          console.error('loadSections partial failure', errors);
          const failedKeys = Object.keys(errors).join(', ');
          if (!opts.silent) {
            addToast(`Falha parcial ao carregar: ${failedKeys}. Tente atualizar a página.`, 'warn');
          }
        } else if (!opts.silent && opts.toast) {
          addToast(opts.toast, 'success');
        }
        
        if (!loadedSomething && hasErrors) {
          return false;
        }
        return true;
      } catch (e) {
        if (!opts.silent && opts.toastError) addToast(opts.toastError, 'error');
        return false;
      }
    },
    [guardAuth, addToast, dataLoader]
  );

  const handleRefreshData = useCallback(
    async (opts = {}) => {
      const sections = opts.sections || [
        'users',
        'assignments',
        'meetings',
        'talks',
        'notifications',
        'announcements',
        'swapLogs',
        'specialEvents'
      ];
      await loadSections(sections, {
        silent: opts.silent,
        toast: 'Dados atualizados.',
        toastError: 'Erro ao atualizar dados.'
      });
    },
    [loadSections]
  );

  const safeLoadSections = useCallback(
    async (sections, opts = {}) => {
      if (!user || !authReady) return false;
      try {
        return await loadSections(sections, opts);
      } catch (e) {
        console.error('loadSections failed', e);
        return false;
      }
    },
    [user, authReady, loadSections]
  );

  const loadForView = useCallback(
    (nextView) => {
      if (!user || !authReady) return;
      const normalizedView = normalizeViewId(nextView);
      if (normalizedView === 'DASHBOARD') {
        safeLoadSections(['assignments', 'meetings', 'notifications', 'announcements', 'specialEvents'], {
          silent: true
        });
      } else if (normalizedView === 'ASSIGNMENTS_MONTH') {
        safeLoadSections(['assignments', 'swapLogs'], { silent: true });
      } else if (normalizedView === 'MEETINGS') {
        safeLoadSections(['meetings', 'assignments', 'users', 'specialEvents'], { silent: true });
        safeLoadSections(['talks'], { silent: true });
      } else if (normalizedView === 'TALKS') {
        safeLoadSections(['assignments', 'users', 'talks'], { silent: true });
      } else if (normalizedView === 'SWAP_MARKET') {
        safeLoadSections(['assignments', 'swapLogs', 'users'], { silent: true });
      } else if (normalizedView === 'NOTICES') {
        safeLoadSections(['notifications', 'announcements'], { silent: true });
      } else if (normalizedView === 'SEARCH') {
        safeLoadSections(['users'], { silent: true });
      }
    },
    [user, authReady, safeLoadSections]
  );

  return {
    data,
    setData,
    dataReady,
    setDataReady,
    loadSections,
    handleRefreshData,
    safeLoadSections,
    loadForView
  };
};
