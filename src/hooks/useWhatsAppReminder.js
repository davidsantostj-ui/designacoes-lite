import { useEffect, useMemo, useState } from 'react';
import { compareIsoDates } from '../utils/dateUtils';

export const useWhatsAppReminder = ({ assignments, user, isPastDate }) => {
  const [waReminder, setWaReminder] = useState(null);

  const nextAssignment = useMemo(() => {
    const upcoming = assignments
      .filter((a) => a.usuario_id === user?.id && a.status !== 'rejeitado' && !isPastDate(a.date))
      .sort((a, b) => compareIsoDates(a.date, b.date));
    return upcoming[0] || null;
  }, [assignments, user, isPastDate]);

  useEffect(() => {
    if (!nextAssignment || !user) {
      setWaReminder(null);
      return;
    }
    const key = `wa_reminder_${user.id}_${nextAssignment.id}`;
    const alreadySent = localStorage.getItem(key);
    if (alreadySent) {
      setWaReminder(null);
      return;
    }
    const now = new Date();
    const targetDate = new Date(`${nextAssignment.date}T12:00:00`);
    const diffHours = (targetDate - now) / (1000 * 60 * 60);
    if (diffHours <= 24 && diffHours >= 0) {
      setWaReminder(nextAssignment);
    } else {
      setWaReminder(null);
    }
  }, [nextAssignment, user]);

  return { waReminder, nextAssignment };
};
