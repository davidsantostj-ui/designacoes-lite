import { useCallback, useMemo, useState } from 'react';
import {
  Timestamp,
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  where,
  writeBatch
} from 'firebase/firestore';
import { filterCollection, replaceCollection } from '../utils/dataStateUtils';

const toMillis = (value) => {
  if (!value) return 0;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  if (typeof value.toMillis === 'function') return value.toMillis();
  if (typeof value.seconds === 'number') return value.seconds * 1000;
  return 0;
};

export const useMaintenanceActions = ({
  db,
  addToast,
  confirm,
  guardAuth,
  isRealAdminUser,
  runExclusive,
  setData,
  getMonthStartIso
}) => {
  const [isCleaningAssignments, setIsCleaningAssignments] = useState(false);
  const [isCleaningNotifications, setIsCleaningNotifications] = useState(false);
  const [isWipingAssignments, setIsWipingAssignments] = useState(false);

  const cleanupAssignments = useCallback(
    async ({ skipConfirm = false, silent = false } = {}) => {
      if (!isRealAdminUser) {
        if (!silent) addToast('Apenas administradores.', 'warn');
        return null;
      }

      const now = new Date();
      const cutoffIso = getMonthStartIso(now);
      const label = now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

      if (!skipConfirm) {
        const confirmed = await confirm({
          title: 'Limpar designações antigas',
          message: `Isso apagará do banco todas as designações anteriores a ${label}. Essa ação é definitiva.`,
          confirmText: 'Apagar'
        });
        if (!confirmed) return null;
      }

      let result = null;

      await runExclusive('cleanup_assignments', async () => {
        if (!(await guardAuth())) return;
        setIsCleaningAssignments(true);
        try {
          let totalDeleted = 0;
          for (;;) {
            const snap = await getDocs(
              query(
                collection(db, 'assignments'),
                where('date', '<', cutoffIso),
                orderBy('date', 'asc'),
                limit(450)
              )
            );
            if (snap.empty) break;
            const batch = writeBatch(db);
            snap.docs.forEach((docSnap) => batch.delete(docSnap.ref));
            await batch.commit();
            totalDeleted += snap.size;
            if (snap.size < 450) break;
          }

          setData((prev) =>
            filterCollection(prev, 'assignments', (entry) => entry.date >= cutoffIso)
          );
          result = totalDeleted;

          if (!silent) {
            if (totalDeleted > 0) addToast(`Designações antigas removidas (${totalDeleted}).`, 'success');
            else addToast('Nenhuma designação antiga encontrada.', 'info');
          }
        } catch (error) {
          if (!silent) addToast('Erro ao limpar designações antigas.', 'error');
        } finally {
          setIsCleaningAssignments(false);
        }
      });

      return result;
    },
    [addToast, confirm, db, getMonthStartIso, guardAuth, isRealAdminUser, runExclusive, setData]
  );

  const cleanupNotifications = useCallback(
    async ({ skipConfirm = false, silent = false } = {}) => {
      if (!isRealAdminUser) {
        if (!silent) addToast('Apenas administradores.', 'warn');
        return null;
      }

      const now = new Date();
      const cutoffDate = new Date(now.getFullYear(), now.getMonth(), 1);
      const label = now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

      if (!skipConfirm) {
        const confirmed = await confirm({
          title: 'Limpar notificações antigas',
          message: `Isso apagará do banco todas as notificações anteriores a ${label}. Essa ação é definitiva.`,
          confirmText: 'Apagar'
        });
        if (!confirmed) return null;
      }

      let result = null;

      await runExclusive('cleanup_notifications', async () => {
        if (!(await guardAuth())) return;
        setIsCleaningNotifications(true);
        try {
          let totalDeleted = 0;
          const cutoffTs = Timestamp.fromDate(cutoffDate);

          for (;;) {
            const snap = await getDocs(
              query(
                collection(db, 'notifications'),
                where('created_at', '<', cutoffTs),
                orderBy('created_at', 'asc'),
                limit(450)
              )
            );
            if (snap.empty) break;
            const batch = writeBatch(db);
            snap.docs.forEach((docSnap) => batch.delete(docSnap.ref));
            await batch.commit();
            totalDeleted += snap.size;
            if (snap.size < 450) break;
          }

          const cutoffMs = cutoffDate.getTime();
          setData((prev) =>
            filterCollection(prev, 'notifications', (entry) => {
              const createdAt = toMillis(entry.created_at);
              return !createdAt || createdAt >= cutoffMs;
            })
          );
          result = totalDeleted;

          if (!silent) {
            if (totalDeleted > 0) addToast(`Notificações antigas removidas (${totalDeleted}).`, 'success');
            else addToast('Nenhuma notificação antiga encontrada.', 'info');
          }
        } catch (error) {
          if (!silent) addToast('Erro ao limpar notificações antigas.', 'error');
        } finally {
          setIsCleaningNotifications(false);
        }
      });

      return result;
    },
    [addToast, confirm, db, guardAuth, isRealAdminUser, runExclusive, setData]
  );

  const handleCleanupAssignments = useCallback(
    async () => cleanupAssignments(),
    [cleanupAssignments]
  );

  const handleCleanupNotifications = useCallback(
    async () => cleanupNotifications(),
    [cleanupNotifications]
  );

  const handleWipeAssignments = useCallback(async () => {
    if (!isRealAdminUser) {
      addToast('Apenas administradores.', 'warn');
      return;
    }

    const confirmed = await confirm({
      title: 'Apagar todas as designações',
      message:
        'Isso removerá todas as designações do banco (pendentes, confirmadas e trocas). Essa ação é definitiva.',
      confirmText: 'Apagar tudo'
    });
    if (!confirmed) return;

    await runExclusive('wipe_assignments', async () => {
      if (!(await guardAuth())) return;
      setIsWipingAssignments(true);
      try {
        let totalDeleted = 0;
        for (;;) {
          const snap = await getDocs(
            query(collection(db, 'assignments'), orderBy('date', 'asc'), limit(450))
          );
          if (snap.empty) break;
          const batch = writeBatch(db);
          snap.docs.forEach((docSnap) => batch.delete(docSnap.ref));
          await batch.commit();
          totalDeleted += snap.size;
          if (snap.size < 450) break;
        }

        setData((prev) => replaceCollection(prev, 'assignments', []));

        if (totalDeleted > 0) addToast(`Todas as designações removidas (${totalDeleted}).`, 'success');
        else addToast('Nenhuma designação encontrada.', 'info');
      } catch (error) {
        addToast('Erro ao apagar designações.', 'error');
      } finally {
        setIsWipingAssignments(false);
      }
    });
  }, [addToast, confirm, db, guardAuth, isRealAdminUser, runExclusive, setData]);

  const cleanupMonthLabel = useMemo(() => {
    const now = new Date();
    return now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  }, []);

  return {
    cleanupAssignments,
    cleanupNotifications,
    cleanupMonthLabel,
    handleCleanupAssignments,
    handleCleanupNotifications,
    handleWipeAssignments,
    isCleaningAssignments,
    isCleaningNotifications,
    isWipingAssignments
  };
};
