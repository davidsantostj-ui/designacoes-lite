import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getPathForView, normalizeViewId } from '../utils/viewRoutes';

const toMillis = (value) => {
  if (!value) return 0;
  if (typeof value === 'number') return value;
  if (value instanceof Date) return value.getTime();
  if (typeof value?.toMillis === 'function') return value.toMillis();
  if (typeof value?.seconds === 'number') return value.seconds * 1000;
  if (typeof value === 'string') {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  return 0;
};

const getPermission = () =>
  typeof window !== 'undefined' && 'Notification' in window
    ? window.Notification.permission
    : 'unsupported';

const shouldUseDesktopSurface = () => {
  if (typeof document === 'undefined') return true;
  if (document.visibilityState === 'hidden') return true;
  if (typeof document.hasFocus === 'function') return !document.hasFocus();
  return false;
};

export const useBrowserNotifications = ({
  user,
  dataReady,
  notifications,
  announcements,
  assignments,
  formatDatePt,
  formatAssignmentLabel,
  soundEnabled,
  isDndNow,
  playNotificationSound,
  addToast
}) => {
  const notificationsSupported = useMemo(
    () => typeof window !== 'undefined' && 'Notification' in window,
    []
  );
  const [notificationPermission, setNotificationPermission] = useState(getPermission);
  const [desktopNotificationsEnabled, setDesktopNotificationsEnabled] = useState(false);
  const seenRef = useRef({
    notifications: new Set(),
    announcements: new Set(),
    assignments: new Set()
  });
  const bootstrappedUserRef = useRef('');

  useEffect(() => {
    setNotificationPermission(getPermission());
  }, []);

  useEffect(() => {
    if (!user?.id) {
      bootstrappedUserRef.current = '';
      setDesktopNotificationsEnabled(false);
      seenRef.current = {
        notifications: new Set(),
        announcements: new Set(),
        assignments: new Set()
      };
      return;
    }

    const stored = localStorage.getItem(`desktop_notifications_${user.id}`);
    setDesktopNotificationsEnabled(stored === 'true');
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    localStorage.setItem(`desktop_notifications_${user.id}`, String(desktopNotificationsEnabled));
  }, [desktopNotificationsEnabled, user?.id]);

  useEffect(() => {
    if (!notificationsSupported) return undefined;

    const syncPermission = () => setNotificationPermission(getPermission());
    window.addEventListener('focus', syncPermission);
    document.addEventListener('visibilitychange', syncPermission);
    return () => {
      window.removeEventListener('focus', syncPermission);
      document.removeEventListener('visibilitychange', syncPermission);
    };
  }, [notificationsSupported]);

  useEffect(() => {
    if (!user?.id) return;
    if (!dataReady?.notifications || !dataReady?.announcements || !dataReady?.assignments) return;
    if (bootstrappedUserRef.current === user.id) return;

    seenRef.current = {
      notifications: new Set((notifications || []).map((entry) => entry.id).filter(Boolean)),
      announcements: new Set((announcements || []).map((entry) => entry.id).filter(Boolean)),
      assignments: new Set(
        (assignments || [])
          .filter((entry) => entry?.usuario_id === user.id)
          .map((entry) => entry.id)
          .filter(Boolean)
      )
    };
    bootstrappedUserRef.current = user.id;
  }, [
    announcements,
    assignments,
    dataReady?.announcements,
    dataReady?.assignments,
    dataReady?.notifications,
    notifications,
    user?.id
  ]);

  const emitNotification = useCallback(
    async ({ title, body, view = 'DASHBOARD', tag }) => {
      if (!notificationsSupported) return false;
      if (!desktopNotificationsEnabled) return false;
      if (notificationPermission !== 'granted') return false;

      const normalizedView = normalizeViewId(view);
      const path = getPathForView(normalizedView);
      const options = {
        body,
        tag,
        icon: './icon-192.png',
        badge: './icon-192.png',
        data: { url: path }
      };

      try {
        const registration = await navigator.serviceWorker?.getRegistration?.();
        if (registration && typeof registration.showNotification === 'function') {
          await registration.showNotification(title, options);
        } else {
          new window.Notification(title, options);
        }

        if (soundEnabled && !isDndNow) {
          playNotificationSound?.();
        }
        return true;
      } catch (error) {
        return false;
      }
    },
    [
      desktopNotificationsEnabled,
      isDndNow,
      notificationPermission,
      notificationsSupported,
      playNotificationSound,
      soundEnabled
    ]
  );

  const toggleDesktopNotifications = useCallback(async () => {
    if (!notificationsSupported) {
      addToast?.('Seu navegador não oferece notificações do sistema.', 'warn');
      return false;
    }

    if (desktopNotificationsEnabled) {
      setDesktopNotificationsEnabled(false);
      addToast?.('Notificações do navegador desativadas.', 'info');
      return true;
    }

    if (notificationPermission === 'denied') {
      addToast?.('Permissão bloqueada no navegador. Libere as notificações do site.', 'warn');
      return false;
    }

    let permission = notificationPermission;
    if (permission !== 'granted') {
      permission = await window.Notification.requestPermission();
      setNotificationPermission(permission);
    }

    if (permission !== 'granted') {
      addToast?.('Permissão de notificação não concedida.', 'warn');
      return false;
    }

    setDesktopNotificationsEnabled(true);
    addToast?.('Notificações do navegador ativadas.', 'success');
    return true;
  }, [addToast, desktopNotificationsEnabled, notificationPermission, notificationsSupported]);

  useEffect(() => {
    if (!user?.id || bootstrappedUserRef.current !== user.id) return;

    const newAssignments = (assignments || []).filter(
      (assignment) =>
        assignment?.usuario_id === user.id &&
        assignment?.status !== 'rejeitado' &&
        assignment?.id &&
        !seenRef.current.assignments.has(assignment.id)
    );

    newAssignments.forEach((assignment) => {
      seenRef.current.assignments.add(assignment.id);
    });

    if (!newAssignments.length || !shouldUseDesktopSurface()) return;

    newAssignments.slice(-3).forEach((assignment) => {
      emitNotification({
        title: 'Nova designação',
        body: `${formatAssignmentLabel?.(assignment.tipo_designacao) || assignment.tipo_designacao} • ${
          formatDatePt?.(assignment.date) || assignment.date
        }`,
        view: 'ASSIGNMENTS_MONTH',
        tag: `assignment:${assignment.id}`
      });
    });
  }, [assignments, emitNotification, formatAssignmentLabel, formatDatePt, user?.id]);

  useEffect(() => {
    if (!user?.id || bootstrappedUserRef.current !== user.id) return;

    const newNotifications = (notifications || []).filter(
      (notification) =>
        notification?.id &&
        !(notification.read_by || []).includes(user.id) &&
        !seenRef.current.notifications.has(notification.id)
    );

    newNotifications.forEach((notification) => {
      seenRef.current.notifications.add(notification.id);
    });

    if (!newNotifications.length || !shouldUseDesktopSurface()) return;

    newNotifications.slice(-3).forEach((notification) => {
      emitNotification({
        title: 'Novo aviso para você',
        body: notification.text || 'Você recebeu uma nova atualização.',
        view: notification.targetView || 'NOTICES',
        tag: `notification:${notification.id}`
      });
    });
  }, [emitNotification, notifications, user?.id]);

  useEffect(() => {
    if (!user?.id || bootstrappedUserRef.current !== user.id) return;

    const newAnnouncements = (announcements || []).filter(
      (announcement) =>
        announcement?.id &&
        !(announcement.read_by || []).includes(user.id) &&
        !seenRef.current.announcements.has(announcement.id)
    );

    newAnnouncements.forEach((announcement) => {
      seenRef.current.announcements.add(announcement.id);
    });

    if (!newAnnouncements.length || !shouldUseDesktopSurface()) return;

    newAnnouncements
      .sort((a, b) => toMillis(a.created_at) - toMillis(b.created_at))
      .slice(-3)
      .forEach((announcement) => {
        emitNotification({
          title: announcement.pinned ? 'Aviso fixado' : 'Novo aviso da congregação',
          body: announcement.title || 'Confira o novo aviso publicado.',
          view: 'NOTICES',
          tag: `announcement:${announcement.id}`
        });
      });
  }, [announcements, emitNotification, user?.id]);

  return {
    notificationsSupported,
    notificationPermission,
    desktopNotificationsEnabled,
    toggleDesktopNotifications
  };
};
