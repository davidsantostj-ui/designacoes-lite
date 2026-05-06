import {
  canUserTakeAssignment,
  isMechanicalAssignment,
  normalizeAssignmentType
} from './assignmentUtils';
import { getUserDisplayName } from './textUtils';

const MILLIS_PER_DAY = 1000 * 60 * 60 * 24;

const compareIsoDates = (a, b) => String(a || '').localeCompare(String(b || ''));

const buildUserTypeKey = (userId, type) => `${userId}|${type}`;

const getDaysSinceLastAssignment = (lastDate, currentDate) => {
  if (!lastDate || !currentDate) return Number.MAX_SAFE_INTEGER;
  const prev = new Date(`${lastDate}T12:00:00`);
  const next = new Date(`${currentDate}T12:00:00`);
  if (Number.isNaN(prev.getTime()) || Number.isNaN(next.getTime())) return Number.MAX_SAFE_INTEGER;
  return Math.max(0, Math.round((next - prev) / MILLIS_PER_DAY));
};

const sortUsersForType = ({ candidates, date, type, monthCounts, typeCounts, lastAssignedDate }) =>
  [...candidates].sort((a, b) => {
    const totalA = monthCounts.get(a.id) || 0;
    const totalB = monthCounts.get(b.id) || 0;
    if (totalA !== totalB) return totalA - totalB;

    const typeA = typeCounts.get(buildUserTypeKey(a.id, type)) || 0;
    const typeB = typeCounts.get(buildUserTypeKey(b.id, type)) || 0;
    if (typeA !== typeB) return typeA - typeB;

    const gapA = getDaysSinceLastAssignment(lastAssignedDate.get(a.id), date);
    const gapB = getDaysSinceLastAssignment(lastAssignedDate.get(b.id), date);
    if (gapA !== gapB) return gapB - gapA;

    return getUserDisplayName(a).localeCompare(getUserDisplayName(b));
  });

const buildAutoAssignmentPreview = ({
  users = [],
  assignmentTypes = [],
  dates = [],
  existingAssignments = []
}) => {
  const approvedUsers = users.filter((user) => user?.approved);
  const selectedDates = [...new Set((dates || []).filter(Boolean))].sort(compareIsoDates);
  const selectedTypes = [...new Set((assignmentTypes || []).filter(Boolean))];

  const monthCounts = new Map();
  const typeCounts = new Map();
  const lastAssignedDate = new Map();
  const mechanicalUsersByDate = new Map();
  const filledTypesByDate = new Map();
  const existingCoveredAssignments = [];

  const sortedExistingAssignments = [...existingAssignments]
    .filter((entry) => entry?.date && entry?.usuario_id)
    .sort((a, b) => compareIsoDates(a.date, b.date));

  sortedExistingAssignments.forEach((assignment) => {
    const type = normalizeAssignmentType(assignment.tipo_designacao || '');
    const date = assignment.date;
    const userId = assignment.usuario_id;

    monthCounts.set(userId, (monthCounts.get(userId) || 0) + 1);
    if (type) {
      typeCounts.set(
        buildUserTypeKey(userId, type),
        (typeCounts.get(buildUserTypeKey(userId, type)) || 0) + 1
      );
    }
    if (!lastAssignedDate.has(userId) || compareIsoDates(date, lastAssignedDate.get(userId)) > 0) {
      lastAssignedDate.set(userId, date);
    }

    if (type && isMechanicalAssignment(type)) {
      if (!mechanicalUsersByDate.has(date)) mechanicalUsersByDate.set(date, new Set());
      mechanicalUsersByDate.get(date).add(userId);
    }

    if (type) {
      if (!filledTypesByDate.has(date)) filledTypesByDate.set(date, new Map());
      filledTypesByDate.get(date).set(type, assignment);
    }
  });

  const suggestedAssignments = [];
  const unresolvedAssignments = [];

  selectedDates.forEach((date) => {
    const assignedMechanicalUsers = new Set(mechanicalUsersByDate.get(date) || []);
    const filledTypes = new Map(filledTypesByDate.get(date) || []);

    selectedTypes.forEach((type) => {
      const existing = filledTypes.get(type);
      if (existing) {
        existingCoveredAssignments.push(existing);
      }
    });

    const tasks = selectedTypes
      .filter((type) => !filledTypes.has(type))
      .map((type) => ({
        type,
        candidates: approvedUsers.filter((user) => {
          if (!canUserTakeAssignment(user, type)) return false;
          if (isMechanicalAssignment(type) && assignedMechanicalUsers.has(user.id)) return false;
          return true;
        })
      }))
      .sort((a, b) => {
        if (a.candidates.length !== b.candidates.length) {
          return a.candidates.length - b.candidates.length;
        }
        return a.type.localeCompare(b.type);
      });

    tasks.forEach(({ type, candidates }) => {
      if (candidates.length === 0) {
        unresolvedAssignments.push({
          date,
          type,
          reason: isMechanicalAssignment(type)
            ? 'Nenhum usuário elegível livre para tarefa mecânica nessa data.'
            : 'Nenhum usuário elegível disponível nessa data.'
        });
        return;
      }

      const rankedCandidates = sortUsersForType({
        candidates,
        date,
        type,
        monthCounts,
        typeCounts,
        lastAssignedDate
      });

      const selectedUser = rankedCandidates[0];
      const payload = {
        date,
        usuario_id: selectedUser.id,
        tipo_designacao: type,
        status: 'pendente'
      };

      suggestedAssignments.push(payload);
      if (isMechanicalAssignment(type)) {
        assignedMechanicalUsers.add(selectedUser.id);
        mechanicalUsersByDate.set(date, assignedMechanicalUsers);
      }

      monthCounts.set(selectedUser.id, (monthCounts.get(selectedUser.id) || 0) + 1);
      typeCounts.set(
        buildUserTypeKey(selectedUser.id, type),
        (typeCounts.get(buildUserTypeKey(selectedUser.id, type)) || 0) + 1
      );
      lastAssignedDate.set(selectedUser.id, date);
    });
  });

  return {
    selectedDates,
    selectedTypes,
    suggestedAssignments,
    existingCoveredAssignments,
    unresolvedAssignments
  };
};

export { buildAutoAssignmentPreview };
