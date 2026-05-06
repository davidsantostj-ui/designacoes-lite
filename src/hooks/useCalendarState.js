import { useCallback, useMemo, useState } from 'react';
import {
  compareIsoDates,
  formatIsoDateLocal,
  getMonthMatrix,
  isCurrentOrFutureDate
} from '../utils/dateUtils';

export const useCalendarState = ({ assignments, user, formatAssignmentLabel, formatDatePt }) => {
  const [selectedDate, setSelectedDate] = useState(() => formatIsoDateLocal(new Date()));
  const [calendarDate, setCalendarDate] = useState(() => new Date());
  const todayIso = formatIsoDateLocal(new Date());

  const monthWeeks = useMemo(() => getMonthMatrix(calendarDate), [calendarDate]);
  const monthLabel = useMemo(
    () => calendarDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
    [calendarDate]
  );

  const visibleAssignments = useMemo(() => {
    if (!user?.id) return [];
    return (assignments || [])
      .filter(
        (assignment) =>
          assignment.usuario_id === user.id &&
          assignment.status !== 'rejeitado' &&
          isCurrentOrFutureDate(assignment.date, todayIso)
      )
      .sort((a, b) => {
        const byDate = compareIsoDates(a.date, b.date);
        if (byDate !== 0) return byDate;
        return String(a.id || '').localeCompare(String(b.id || ''));
      });
  }, [assignments, todayIso, user?.id]);

  const myAssignmentsByDate = useMemo(() => {
    const map = {};
    visibleAssignments.forEach((a) => {
      if (!a?.date) return;
      if (!map[a.date]) map[a.date] = [];
      map[a.date].push(a);
    });
    return map;
  }, [visibleAssignments]);

  const dayAssignments = useMemo(
    () => myAssignmentsByDate[selectedDate] || [],
    [myAssignmentsByDate, selectedDate]
  );

  const myAssignmentsCount = useMemo(() => {
    return visibleAssignments.length;
  }, [visibleAssignments]);

  const handleCalendarNavigate = useCallback((offset, dayOffset = 0) => {
    setCalendarDate((prev) => {
      const next = new Date(prev.getFullYear(), prev.getMonth() + offset, 1);
      if (dayOffset !== 0) {
        const newDate = new Date(next.getFullYear(), next.getMonth(), next.getDate() + dayOffset);
        setSelectedDate(formatIsoDateLocal(newDate));
      } else {
        setSelectedDate(formatIsoDateLocal(next));
      }
      return next;
    });
  }, []);

  const formattedDayAssignments = useMemo(() => {
    return dayAssignments.map((a) => ({
      ...a,
      label: formatAssignmentLabel(a.tipo_designacao),
      dateLabel: formatDatePt(a.date)
    }));
  }, [dayAssignments, formatAssignmentLabel, formatDatePt]);

  return {
    selectedDate,
    setSelectedDate,
    calendarDate,
    setCalendarDate,
    monthWeeks,
    monthLabel,
    myAssignmentsByDate,
    dayAssignments,
    myAssignmentsCount,
    handleCalendarNavigate,
    formattedDayAssignments
  };
};
