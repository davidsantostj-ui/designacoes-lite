import { useMemo } from 'react';

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

export const useNotificationsState = ({ notifications, announcements, user }) => {
  const notificationsForUser = useMemo(() => {
    if (!user) return [];
    const clearedAt = toMillis(user.notificationsClearedAt);
    return notifications.filter((n) => {
      if (n.targetUserId && n.targetUserId !== user.id) return false;
      const createdAt = toMillis(n.created_at);
      if (!clearedAt || !createdAt) return true;
      return createdAt > clearedAt;
    });
  }, [notifications, user]);

  const unreadNotificationsCount = useMemo(() => {
    if (!user) return 0;
    return notificationsForUser.filter((n) => !(n.read_by || []).includes(user.id)).length;
  }, [notificationsForUser, user]);

  const unreadAnnouncementsCount = useMemo(() => {
    if (!user) return 0;
    return announcements.filter((a) => !(a.read_by || []).includes(user.id)).length;
  }, [announcements, user]);

  const totalAlertsCount = useMemo(
    () => unreadNotificationsCount + unreadAnnouncementsCount,
    [unreadNotificationsCount, unreadAnnouncementsCount]
  );

  return {
    notificationsForUser,
    unreadNotificationsCount,
    unreadAnnouncementsCount,
    totalAlertsCount
  };
};
