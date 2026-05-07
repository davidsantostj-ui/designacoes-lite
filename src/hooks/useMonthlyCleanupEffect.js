import { useEffect } from 'react';
import { supabase } from '../services/supabase';
import { patchCollectionItem } from '../utils/dataStateUtils';

export const useMonthlyCleanupEffect = ({
  addToast,
  authReady,
  cleanupAssignments,
  cleanupNotifications,
  db,
  isRealAdminUser,
  setData,
  setUser,
  user
}) => {
  useEffect(() => {
    if (!user || !authReady || !isRealAdminUser) return;

    const now = new Date();
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    if (user.lastCleanupMonth === monthKey) return;

    let cancelled = false;

    const run = async () => {
      const [assignmentsDeleted, notificationsDeleted] = await Promise.all([
        cleanupAssignments({ skipConfirm: true, silent: true }),
        cleanupNotifications({ skipConfirm: true, silent: true })
      ]);

      if (cancelled) return;
      if (assignmentsDeleted === null || notificationsDeleted === null) return;

      try {
        await supabase.from('users').update({
          lastCleanupMonth: monthKey,
          lastCleanupAt: new Date().toISOString()
        }).eq('id', user.id);

        setUser((prev) => (prev ? { ...prev, lastCleanupMonth: monthKey } : prev));
        setData((prev) => patchCollectionItem(prev, 'users', user.id, { lastCleanupMonth: monthKey }));

        const total = (assignmentsDeleted || 0) + (notificationsDeleted || 0);
        if (total > 0) addToast(`Limpeza mensal concluida (${total}).`, 'success');
      } catch (error) {
        addToast('Erro ao registrar limpeza mensal.', 'error');
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [
    addToast,
    authReady,
    cleanupAssignments,
    cleanupNotifications,
    db,
    isRealAdminUser,
    setData,
    setUser,
    user
  ]);
};
