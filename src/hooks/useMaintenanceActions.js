import { useCallback, useMemo, useState } from 'react';
import { supabase } from '../services/supabase';
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
          title: 'Limpar designacoes antigas',
          message: `Isso apagara do banco todas as designacoes anteriores a ${label}. Essa acao eh definitiva.`,
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
            const { data, error } = await supabase
              .from('assignments')
              .delete()
              .lt('date', cutoffIso)
              .select('id');
            
            if (error || !data || data.length === 0) break;
            
            totalDeleted += data.length;
            if (data.length < 450) break;
          }

          setData((prev) =>
            filterCollection(prev, 'assignments', (entry) => entry.date >= cutoffIso)
          );
          result = totalDeleted;

          if (!silent) {
            if (totalDeleted > 0) addToast(`Designacoes antigas removidas (${totalDeleted}).`, 'success');
            else addToast('Nenhuma designacao antiga encontrada.', 'info');
          }
        } catch (error) {
          if (!silent) addToast('Erro ao limpar designacoes antigas.', 'error');
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
          title: 'Limpar notificacoes antigas',
          message: `Isso apagara do banco todas as notificacoes anteriores a ${label}. Essa acao eh definitiva.`,
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
          const cutoffMs = cutoffDate.getTime();

          for (;;) {
            const { data, error } = await supabase
              .from('notifications')
              .delete()
              .lt('created_at', cutoffDate.toISOString())
              .select('id');
            
            if (error || !data || data.length === 0) break;
            
            totalDeleted += data.length;
            if (data.length < 450) break;
          }

          setData((prev) =>
            filterCollection(prev, 'notifications', (entry) => {
              const createdAt = toMillis(entry.created_at);
              return !createdAt || createdAt >= cutoffMs;
            })
          );
          result = totalDeleted;

          if (!silent) {
            if (totalDeleted > 0) addToast(`Notificacoes antigas removidas (${totalDeleted}).`, 'success');
            else addToast('Nenhuma notificacao antiga encontrada.', 'info');
          }
        } catch (error) {
          if (!silent) addToast('Erro ao limpar notificacoes antigas.', 'error');
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
      title: 'Apagar todas as designacoes',
      message:
        'Isso removera todas as designacoes do banco (pendentes, confirmadas e trocas). Essa acao eh definitiva.',
      confirmText: 'Apagar tudo'
    });
    if (!confirmed) return;

    await runExclusive('wipe_assignments', async () => {
      if (!(await guardAuth())) return;
      setIsWipingAssignments(true);
      try {
        let totalDeleted = 0;
        for (;;) {
          const { data, error } = await supabase
            .from('assignments')
            .select('id')
            .order('date', { ascending: true })
            .limit(450);
          
          if (error || !data || data.length === 0) break;
          
          const ids = data.map(d => d.id);
          await supabase.from('assignments').delete().in('id', ids);
          
          totalDeleted += data.length;
          if (data.length < 450) break;
        }

        setData((prev) => replaceCollection(prev, 'assignments', []));

        if (totalDeleted > 0) addToast(`Todas as designacoes removidas (${totalDeleted}).`, 'success');
        else addToast('Nenhuma designacao encontrada.', 'info');
      } catch (error) {
        addToast('Erro ao apagar designacoes.', 'error');
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
