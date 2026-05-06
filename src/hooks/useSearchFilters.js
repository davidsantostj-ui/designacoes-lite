import { useMemo, useState } from 'react';
import { normalizeAssignmentType } from '../utils/assignmentUtils';

const DEFAULT_FILTERS = {
  text: '',
  user: '',
  dateFrom: '',
  dateTo: '',
  type: '',
  status: '',
  includeAssignments: true,
  includeUsers: true,
  includeNotifications: true
};

export const useSearchFilters = ({ assignments, users, notifications, formatDatePt }) => {
  const [searchFilters, setSearchFilters] = useState(DEFAULT_FILTERS);

  const searchResults = useMemo(() => {
    const text = searchFilters.text.trim().toLowerCase();
    const from = searchFilters.dateFrom ? new Date(`${searchFilters.dateFrom}T00:00:00`) : null;
    const to = searchFilters.dateTo ? new Date(`${searchFilters.dateTo}T23:59:59`) : null;
    const inRange = (dateStr) => {
      if (!from && !to) return true;
      const d = new Date(`${dateStr}T12:00:00`);
      if (from && d < from) return false;
      if (to && d > to) return false;
      return true;
    };
    const matchText = (value) =>
      !text ||
      String(value || '')
        .toLowerCase()
        .includes(text);
    const filteredAssignments = !searchFilters.includeAssignments
      ? []
      : assignments.filter((a) => {
          const normalizedType = normalizeAssignmentType(a.tipo_designacao);
          if (searchFilters.user && a.usuario_id !== searchFilters.user) return false;
          if (searchFilters.type && normalizedType !== searchFilters.type) return false;
          if (searchFilters.status && a.status !== searchFilters.status) return false;
          if (!inRange(a.date)) return false;
          return (
            matchText(a.tipo_designacao) ||
            matchText(normalizedType) ||
            matchText(formatDatePt(a.date))
          );
        });
    const filteredUsers = !searchFilters.includeUsers
      ? []
      : users.filter((u) => matchText(`${u.name} ${u.surname}`));
    const filteredNotifications = !searchFilters.includeNotifications
      ? []
      : notifications.filter((n) => {
          if (!matchText(n.text)) return false;
          const dateObj = n.created_at?.toDate
            ? n.created_at.toDate()
            : new Date(n.created_at || 0);
          if (from && dateObj < from) return false;
          if (to && dateObj > to) return false;
          return true;
        });
    return {
      assignments: filteredAssignments,
      users: filteredUsers,
      notifications: filteredNotifications
    };
  }, [assignments, users, notifications, searchFilters, formatDatePt]);

  return { searchFilters, setSearchFilters, searchResults };
};
