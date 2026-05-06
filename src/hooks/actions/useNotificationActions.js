import { patchCollectionItem } from '../../utils/dataStateUtils';

export const useNotificationActions = ({
  db,
  user,
  addToast,
  confirm,
  runExclusive,
  guardAuth,
  setUser,
  setData,
  resolveNotificationTarget,
  setView,
  setAlertTab,
  doc,
  updateDoc,
  arrayUnion,
  serverTimestamp
}) => {
  const handleClearNotifications = async () => {
    const confirmed = await confirm({
      title: 'Limpar notificações',
      message: 'Deseja limpar todas as notificações?',
      confirmText: 'Limpar'
    });
    if (!confirmed) return;
    await runExclusive('clear_notifications', async () => {
      try {
        if (!(await guardAuth())) return;
        const clearedAtLocal = new Date();
        const clearedAtServer = serverTimestamp ? serverTimestamp() : clearedAtLocal;
        await updateDoc(doc(db, 'users', user.id), { notificationsClearedAt: clearedAtServer });
        if (setUser) {
          setUser((prev) =>
            prev ? { ...prev, notificationsClearedAt: clearedAtLocal } : prev
          );
        }
        setData((prev) =>
          patchCollectionItem(prev, 'users', user.id, {
            notificationsClearedAt: clearedAtLocal
          })
        );
        addToast('Notificações limpas.', 'success');
      } catch (e) {
        addToast('Erro ao limpar notificações.', 'error');
      }
    });
  };

  const handleOpenNotification = async (n) => {
    if (!n) return;
    try {
      if (!(await guardAuth())) return;
      await updateDoc(doc(db, 'notifications', n.id), { read_by: arrayUnion(user.id) });
      setData((prev) =>
        patchCollectionItem(prev, 'notifications', n.id, (item) => {
          const readBy = Array.isArray(item?.read_by) ? item.read_by : [];
          if (readBy.includes(user.id)) return null;
          return { read_by: [...readBy, user.id] };
        })
      );
    } catch (e) {
      // noop
    }
    const target = resolveNotificationTarget(n);
    if (typeof setAlertTab === 'function' && target === 'NOTICES') {
      const nextTab =
        n?.type === 'announcement' || String(n?.targetView || '').toUpperCase() === 'ANNOUNCEMENTS'
          ? 'ANNOUNCEMENTS'
          : 'NOTIFICATIONS';
      setAlertTab(nextTab);
    }
    setView(target);
  };

  return { handleClearNotifications, handleOpenNotification };
};
