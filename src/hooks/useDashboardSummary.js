import { useMemo } from 'react';
import { formatIsoDateLocal } from '../utils/dateUtils';

export const useDashboardSummary = ({ assignments, userId, latestMeetingsImportBatch }) => {
  const todayIso = formatIsoDateLocal(new Date());

  const weekWindowEndIso = useMemo(() => {
    const next = new Date(`${todayIso}T12:00:00`);
    next.setDate(next.getDate() + 7);
    return formatIsoDateLocal(next);
  }, [todayIso]);

  const upcomingAssignments = useMemo(
    () =>
      (assignments || [])
        .filter(
          (assignment) =>
            assignment.usuario_id === userId &&
            assignment.date >= todayIso &&
            assignment.status !== 'rejeitado'
        )
        .sort((a, b) => String(a.date || '').localeCompare(String(b.date || ''))),
    [assignments, todayIso, userId]
  );

  const nextAssignment = upcomingAssignments[0] || null;

  const todayAssignments = useMemo(
    () => upcomingAssignments.filter((assignment) => assignment.date === todayIso),
    [todayIso, upcomingAssignments]
  );

  const weekAssignments = useMemo(
    () =>
      upcomingAssignments.filter(
        (assignment) => assignment.date > todayIso && assignment.date <= weekWindowEndIso
      ),
    [todayIso, upcomingAssignments, weekWindowEndIso]
  );

  const myPendingAssignmentsCount = useMemo(
    () =>
      upcomingAssignments.filter((assignment) => assignment.status === 'pendente').length,
    [upcomingAssignments]
  );

  const swapMarketplaceCount = useMemo(
    () => (assignments || []).filter((assignment) => assignment.status === 'troca').length,
    [assignments]
  );

  const adminProgrammingSummary = useMemo(() => {
    const allAssignments = assignments || [];
    const syncedUpcomingCount = allAssignments.filter(
      (assignment) => assignment.source === 'meeting_import' && assignment.date >= todayIso
    ).length;

    return {
      hasBatch: Boolean(latestMeetingsImportBatch?.batchId),
      batchLabel: latestMeetingsImportBatch?.batchLabel || '',
      reviewCount: latestMeetingsImportBatch?.ambiguousCount || 0,
      meetingsCount: latestMeetingsImportBatch?.meetingsCount || 0,
      assignmentsCount: latestMeetingsImportBatch?.assignmentsCount || 0,
      pendingAssignmentsCount: allAssignments.filter(
        (assignment) => assignment.status === 'pendente' && assignment.date >= todayIso
      ).length,
      syncedUpcomingCount
    };
  }, [assignments, latestMeetingsImportBatch, todayIso]);

  return {
    adminProgrammingSummary,
    myPendingAssignmentsCount,
    nextAssignment,
    todayAssignments,
    swapMarketplaceCount,
    weekAssignments
  };
};
