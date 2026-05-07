import { supabase } from '../../services/supabase';
import {
  filterCollection,
  mergeCollectionById,
  patchCollectionItem,
  patchCollectionItems,
  prependCollectionItems
} from '../../utils/dataStateUtils';
import { isMechanicalAssignment } from '../../utils/assignmentUtils';
import {
  buildMeetingSyncKey,
  getMeetingSyncMetaForAssignmentType,
  isMeetingSyncableAssignmentType
} from '../../utils/meetingImportUtils';
import { normalizePersonName } from '../../utils/textUtils';

const compareAssignmentsDesc = (a, b) => {
  if (a.date === b.date) return a.id > b.id ? -1 : 1;
  return a.date > b.date ? -1 : 1;
};

const compareMeetingsAsc = (a, b) => {
  const byDate = String(a.date || '').localeCompare(String(b.date || ''));
  if (byDate !== 0) return byDate;
  return String(a.sort_key || '').localeCompare(String(b.sort_key || ''));
};

const cleanFirestoreChanges = (value = {}) =>
  Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== undefined));

const cleanLogMeta = (value = {}) =>
  Object.fromEntries(
    Object.entries(value).filter(([, entry]) => entry !== undefined && entry !== null && entry !== '')
  );

const buildMeetingSortKey = ({
  date,
  sectionOrder,
  designationOrder,
  importLine,
  roleOrder,
  participantName
}) =>
  [
    date,
    String(sectionOrder || 99).padStart(2, '0'),
    String(designationOrder || 999).padStart(4, '0'),
    String(importLine || 999).padStart(4, '0'),
    String(roleOrder || 99).padStart(2, '0'),
    normalizePersonName(participantName)
  ].join('|');

const findLinkedMeetingEntries = (assignment, meetings = []) => {
  const batchId = String(assignment?.import_batch_id || '');
  const meetingSyncKey = String(assignment?.meeting_sync_key || '');
  const importLine = Number(assignment?.meeting_import_line || 0);
  const roleType = String(assignment?.meeting_role_type || '');
  const designation = String(assignment?.meeting_designation || '');
  const date = String(assignment?.date || '');
  const userId = String(assignment?.usuario_id || '');
  const assignmentType = String(
    assignment?.meeting_assignment_type || assignment?.tipo_designacao || ''
  );

  const importedMeetings = (meetings || []).filter((entry) => entry?.import_source === 'meetings_csv');

  const filterByBatch = (entry) => !batchId || String(entry?.import_batch_id || '') === batchId;

  const bySyncKey = importedMeetings.filter(
    (entry) =>
      filterByBatch(entry) &&
      meetingSyncKey &&
      String(entry?.sync_key || '') === meetingSyncKey &&
      (!roleType || String(entry?.role_type || '') === roleType)
  );
  if (bySyncKey.length > 0) return bySyncKey;

  const byImportLine = importedMeetings.filter(
    (entry) =>
      filterByBatch(entry) &&
      importLine > 0 &&
      Number(entry?.import_line || 0) === importLine &&
      (!date || String(entry?.date || '') === date) &&
      (!designation || String(entry?.designation || '') === designation) &&
      (!roleType || String(entry?.role_type || '') === roleType)
  );
  if (byImportLine.length > 0) return byImportLine;

  return importedMeetings.filter(
    (entry) =>
      filterByBatch(entry) &&
      (!date || String(entry?.date || '') === date) &&
      (!designation || String(entry?.designation || '') === designation) &&
      (!roleType || String(entry?.role_type || '') === roleType) &&
      (!assignmentType || String(entry?.assignment_type || '') === assignmentType) &&
      (!userId || String(entry?.user_id || '') === userId)
  );
};

export const useAssignmentActions = ({
  db,
  user,
  data,
  setData,
  addToast,
  confirm,
  guardAuth,
  guardManageAssignments,
  canUserTakeAssignment,
  assignForm,
  setAssignForm,
  assignmentConflict,
  setAssignmentConflict,
  getUserMechanicalAssignmentsOnDate,
  getUserSpiritualAssignmentsOnDate,
  getUserDisplayName,
  freeUsersForSelectedDate,
  setReassigningId
}) => {
  const resetAssignForm = () => {
    setAssignForm({ date: '', userId: '', type: '', publishToMeetings: false });
  };

  const appendLocalSwapLog = (logEntry) => {
    if (!logEntry?.id) return;
    setData((prev) => prependCollectionItems(prev, 'swapLogs', [logEntry], { limit: 250 }));
  };

  const logAssignmentAction = async (assignmentId, action, meta = {}) => {
    if (!assignmentId || !action) return;

    try {
      const cleanedMeta = cleanLogMeta(meta);
      const refDoc = await addDoc(collection(db, 'swap_logs'), {
        assignmentId,
        action,
        actorId: user?.id || '',
        meta: cleanedMeta,
        createdAt: serverTimestamp()
      });
      appendLocalSwapLog({
        id: refDoc.id,
        assignmentId,
        action,
        actorId: user?.id || '',
        meta: cleanedMeta,
        createdAt: new Date()
      });
    } catch (error) {
      // noop
    }
  };

  const createAssignmentRecord = async ({
    date,
    userId,
    type,
    status = 'pendente',
    location = '',
    showInMeetings = false
  }) => {
    if (!(await guardManageAssignments())) return null;
    const targetUser = (data.users || []).find((entry) => entry.id === userId);
    if (targetUser && !canUserTakeAssignment(targetUser, type)) {
      throw new Error('ineligible-user');
    }

    const payload = {
      date,
      usuario_id: userId,
      tipo_designacao: type,
      status,
      location: location || '',
      show_in_meetings: showInMeetings === true,
      created_at: serverTimestamp(),
      created_by: user?.id || ''
    };
    if (!payload.show_in_meetings) delete payload.show_in_meetings;

    const refDoc = await addDoc(collection(db, 'assignments'), payload);
    setData((prev) =>
      mergeCollectionById(prev, 'assignments', [{ id: refDoc.id, ...payload }], {
        sortFn: compareAssignmentsDesc
      })
    );
    await logAssignmentAction(refDoc.id, 'criar_designacao', {
      date,
      assignmentType: type,
      userName: getUserDisplayName(targetUser)
    });
    return refDoc;
  };

  const handleCreateAssignment = async (event) => {
    event.preventDefault();
    if (!assignForm.date || !assignForm.userId || !assignForm.type) return;

    const selectedUser = data.users.find((entry) => entry.id === assignForm.userId);
    if (!selectedUser || !canUserTakeAssignment(selectedUser, assignForm.type)) {
      addToast('Esse usuário não está habilitado para essa designação.', 'warn');
      return;
    }

    const isMechanical = isMechanicalAssignment(assignForm.type);
    const conflicts = isMechanical
      ? getUserMechanicalAssignmentsOnDate(assignForm.userId, assignForm.date)
      : getUserSpiritualAssignmentsOnDate(assignForm.userId, assignForm.date);
      
    if (conflicts.length > 0) {
      setAssignmentConflict({
        open: true,
        conflictKind: isMechanical ? 'mechanical' : 'spiritual',
        date: assignForm.date,
        userId: assignForm.userId,
        userName: getUserDisplayName(selectedUser),
        type: assignForm.type,
        showInMeetings: assignForm.publishToMeetings === true,
        conflicts
      });
      return;
    }

    try {
      const created = await createAssignmentRecord({
        date: assignForm.date,
        userId: assignForm.userId,
        type: assignForm.type,
        showInMeetings: assignForm.publishToMeetings === true
      });
      if (!created) return;
      addToast('Designação criada.', 'success');
      resetAssignForm();
    } catch (error) {
      addToast('Erro ao criar designação.', 'error');
    }
  };

  const handleAssignAnyway = async () => {
    if (!assignmentConflict?.date || !assignmentConflict?.userId || !assignmentConflict?.type) {
      setAssignmentConflict(null);
      return;
    }

    try {
      const created = await createAssignmentRecord({
        date: assignmentConflict.date,
        userId: assignmentConflict.userId,
        type: assignmentConflict.type,
        showInMeetings: assignmentConflict.showInMeetings === true
      });
      if (!created) return;
      addToast('Designação criada.', 'success');
      resetAssignForm();
    } catch (error) {
      addToast('Erro ao criar designação.', 'error');
    } finally {
      setAssignmentConflict(null);
    }
  };

  const handlePickAlternativeUser = async (userId) => {
    if (!assignmentConflict?.date || !assignmentConflict?.type || !userId) {
      setAssignmentConflict(null);
      return;
    }

    try {
      const created = await createAssignmentRecord({
        date: assignmentConflict.date,
        userId,
        type: assignmentConflict.type,
        showInMeetings: assignmentConflict.showInMeetings === true
      });
      if (!created) return;
      addToast('Designação criada.', 'success');
      resetAssignForm();
    } catch (error) {
      addToast('Erro ao criar designação.', 'error');
    } finally {
      setAssignmentConflict(null);
    }
  };

  const handlePickNextAvailable = () => {
    if (!assignForm.date || freeUsersForSelectedDate.length === 0) return;
    setAssignForm((prev) => ({ ...prev, userId: freeUsersForSelectedDate[0].id }));
  };

  const handleDeleteAssignment = async (id) => {
    if (!(await guardManageAssignments())) return;
    const approved = await confirm({
      title: 'Excluir designação',
      message: 'Deseja excluir esta designação?',
      confirmText: 'Excluir'
    });
    if (!approved) return;

    try {
      const assignment = (data.assignments || []).find((entry) => entry.id === id);
      const assignedUser = (data.users || []).find((entry) => entry.id === assignment?.usuario_id);
      
      const matchedMeetings = findLinkedMeetingEntries(assignment, data.meetings || []);
      const batch = writeBatch(db);
      
      batch.delete(doc(db, 'assignments', id));
      
      const meetingChangesById = new Map();
      matchedMeetings.forEach((meetingEntry) => {
        const changes = {
          user_id: '',
          participant_name: '',
          participant_name_norm: '',
          match_state: 'unlinked'
        };
        batch.update(doc(db, 'meetings', meetingEntry.id), changes);
        meetingChangesById.set(meetingEntry.id, changes);
      });
      
      await batch.commit();

      setData((prev) => {
        const next = filterCollection(prev, 'assignments', (entry) => entry.id !== id);
        if (meetingChangesById.size > 0) {
          return patchCollectionItems(next, 'meetings', meetingChangesById, { sortFn: compareMeetingsAsc });
        }
        return next;
      });

      await logAssignmentAction(id, 'excluir_designacao', {
        date: assignment?.date,
        assignmentType: assignment?.tipo_designacao,
        userName: getUserDisplayName(assignedUser)
      });
      addToast('Designação excluída.', 'success');
    } catch (error) {
      addToast('Erro ao excluir designação.', 'error');
    }
  };

  const confirmMechanicalOverride = async () =>
    confirm({
      title: 'Confirmar ajuste manual',
      message:
        'Esse publicador já possui uma designação desse tipo (Mecânica ou Espiritual) nesta data. Deseja salvar mesmo assim?',
      confirmText: 'Salvar mesmo assim'
    });

const handleUpdateAssignment = async (assignmentId, changes) => {
    if (!assignmentId) return false;
    if (!(await guardManageAssignments())) return false;

    const assignment = (data.assignments || []).find((entry) => entry.id === assignmentId);
    if (!assignment) return false;

    const nextDate = changes?.date || assignment.date;
    const nextUserId = changes?.usuario_id ?? assignment.usuario_id;
    const nextType = changes?.tipo_designacao || assignment.tipo_designacao;
    const nextParticipantName = changes?.participant_name ?? null;

    const targetUser = nextUserId ? (data.users || []).find((entry) => entry.id === nextUserId) : null;
    
    if (nextUserId && targetUser && !canUserTakeAssignment(targetUser, nextType)) {
      addToast('Esse usuário não está habilitado para essa designação.', 'warn');
      return false;
    }

    const isMechanical = isMechanicalAssignment(nextType);
    const dayConflicts = nextUserId
      ? isMechanical
        ? getUserMechanicalAssignmentsOnDate(nextUserId, nextDate).filter(
            (entry) => entry.id !== assignmentId
          )
        : getUserSpiritualAssignmentsOnDate(nextUserId, nextDate).filter(
            (entry) => entry.id !== assignmentId
          )
      : [];

    if (dayConflicts.length > 0) {
      const approved = await confirmMechanicalOverride();
      if (!approved) return false;
    }

    try {
      const previousUser = (data.users || []).find((entry) => entry.id === assignment.usuario_id);
      
      const updatePayload = {
        date: nextDate,
        tipo_designacao: nextType
      };

      if (nextUserId) {
        updatePayload.usuario_id = nextUserId;
        updatePayload.participant_name = nextParticipantName || getUserDisplayName(targetUser);
        updatePayload.participant_name_norm = normalizePersonName(updatePayload.participant_name);
      } else if (nextParticipantName) {
        updatePayload.usuario_id = '';
        updatePayload.participant_name = nextParticipantName;
        updatePayload.participant_name_norm = normalizePersonName(nextParticipantName);
      }

      await updateDoc(doc(db, 'assignments', assignmentId), updatePayload);

      setData((prev) =>
        patchCollectionItem(
          prev,
          'assignments',
          assignmentId,
          updatePayload,
          { sortFn: compareAssignmentsDesc }
        )
      );
      
      const nextUserName = nextUserId ? getUserDisplayName(targetUser) : (nextParticipantName || 'Externo');
      await logAssignmentAction(assignmentId, 'atualizar_designacao', {
        previousDate: assignment.date,
        nextDate,
        previousType: assignment.tipo_designacao,
        nextType,
        previousUserName: getUserDisplayName(previousUser) || assignment.participant_name || 'Externo',
        nextUserName
      });

      addToast('Designação atualizada.', 'success');
      setReassigningId(null);
      return true;
    } catch (error) {
      addToast('Erro ao atualizar designação.', 'error');
      return false;
    }
  };

  const handleManagedUpdateAssignment = async (assignmentId, changes) => {
    if (!assignmentId) return false;
    if (!(await guardManageAssignments())) return false;

    const assignment = (data.assignments || []).find((entry) => entry.id === assignmentId);
    if (!assignment || assignment?.source !== 'meeting_import') {
      return handleUpdateAssignment(assignmentId, changes);
    }

    const nextDate = changes?.date || assignment.date;
    const nextUserId = changes?.usuario_id || assignment.usuario_id;
    const nextType = changes?.tipo_designacao || assignment.tipo_designacao;
    const targetUser = (data.users || []).find((entry) => entry.id === nextUserId);

    if (!targetUser || !canUserTakeAssignment(targetUser, nextType)) {
      addToast('Esse usuário não está habilitado para essa designação.', 'warn');
      return false;
    }

    if (!isMeetingSyncableAssignmentType(nextType)) {
      addToast(
        'Itens importados de Reuniões só podem ser ajustados para designações espirituais compatíveis.',
        'warn'
      );
      return false;
    }

    const isMechanical = isMechanicalAssignment(nextType);
    const dayConflicts = isMechanical
      ? getUserMechanicalAssignmentsOnDate(nextUserId, nextDate).filter(
          (entry) => entry.id !== assignmentId
        )
      : getUserSpiritualAssignmentsOnDate(nextUserId, nextDate).filter(
          (entry) => entry.id !== assignmentId
        );
        
    if (dayConflicts.length > 0) {
      const approved = await confirmMechanicalOverride();
      if (!approved) return false;
    }

    const matchedMeetings = findLinkedMeetingEntries(assignment, data.meetings || []);
    if (!matchedMeetings.length) {
      addToast(
        'Não foi possível localizar a participação correspondente em Reuniões para sincronizar a correção.',
        'warn'
      );
      return false;
    }

    const nextMeta = getMeetingSyncMetaForAssignmentType(nextType);
    if (!nextMeta) {
      addToast('Erro ao atualizar designação.', 'error');
      return false;
    }

    try {
      const participantName = getUserDisplayName(targetUser);
      const previousUser = (data.users || []).find((entry) => entry.id === assignment.usuario_id);
      let assignmentChanges = {
        date: nextDate,
        usuario_id: nextUserId,
        tipo_designacao: nextType
      };
      const meetingChangesById = new Map();

      matchedMeetings.forEach((meetingEntry) => {
        const importLine = Number(
          assignment?.meeting_import_line || meetingEntry?.import_line || 999
        );
        const nextSyncKey = buildMeetingSyncKey({
          date: nextDate,
          designation: nextMeta.designation,
          line: importLine
        });

        meetingChangesById.set(
          meetingEntry.id,
          cleanFirestoreChanges({
            date: nextDate,
            user_id: nextUserId,
            participant_name: participantName,
            participant_name_norm: normalizePersonName(participantName),
            designation: nextMeta.designation,
            sync_key: nextSyncKey,
            section_key: nextMeta.sectionKey,
            section_label: nextMeta.sectionLabel,
            section_order: nextMeta.sectionOrder,
            designation_order: nextMeta.designationOrder,
            assignment_type: nextMeta.assignmentType,
            role_type: nextMeta.roleType,
            role_label: nextMeta.roleLabel,
            role_order: nextMeta.roleOrder,
            match_state: 'linked',
            sort_key: buildMeetingSortKey({
              date: nextDate,
              sectionOrder: nextMeta.sectionOrder,
              designationOrder: nextMeta.designationOrder,
              importLine,
              roleOrder: nextMeta.roleOrder,
              participantName
            })
          })
        );

        assignmentChanges = {
          ...assignmentChanges,
          meeting_designation: nextMeta.designation,
          meeting_assignment_type: nextMeta.assignmentType,
          meeting_role_type: nextMeta.roleType,
          meeting_role_label: nextMeta.roleLabel,
          meeting_sync_key: nextSyncKey,
          meeting_import_line: importLine
        };
      });

      const batch = writeBatch(db);
      batch.update(doc(db, 'assignments', assignmentId), cleanFirestoreChanges(assignmentChanges));
      meetingChangesById.forEach((meetingChanges, meetingId) => {
        batch.update(doc(db, 'meetings', meetingId), meetingChanges);
      });
      await batch.commit();

      setData((prev) =>
        patchCollectionItems(
          patchCollectionItem(prev, 'assignments', assignmentId, assignmentChanges, {
            sortFn: compareAssignmentsDesc
          }),
          'meetings',
          meetingChangesById,
          { sortFn: compareMeetingsAsc }
        )
      );
      await logAssignmentAction(assignmentId, 'atualizar_designacao', {
        previousDate: assignment.date,
        nextDate,
        previousType: assignment.tipo_designacao,
        nextType,
        previousUserName: getUserDisplayName(previousUser),
        nextUserName: getUserDisplayName(targetUser)
      });

      addToast('Designação atualizada.', 'success');
      setReassigningId(null);
      return true;
    } catch (error) {
      addToast('Erro ao atualizar designação.', 'error');
      return false;
    }
  };

  const handleReassign = async (assignmentId, newUserId) => {
    if (!assignmentId || !newUserId) return;
    if (!(await guardManageAssignments())) return;
    const assignment = (data.assignments || []).find((entry) => entry.id === assignmentId);
    const targetUser = (data.users || []).find((entry) => entry.id === newUserId);
    if (!assignment || !targetUser) return;

    if (!canUserTakeAssignment(targetUser, assignment.tipo_designacao)) {
      addToast('Esse usuário não está habilitado para essa designação.', 'warn');
      return;
    }

    const isMechanical = isMechanicalAssignment(assignment.tipo_designacao);
    const dayConflicts = isMechanical
      ? getUserMechanicalAssignmentsOnDate(newUserId, assignment.date).filter(
          (entry) => entry.id !== assignmentId
        )
      : getUserSpiritualAssignmentsOnDate(newUserId, assignment.date).filter(
          (entry) => entry.id !== assignmentId
        );
        
    if (dayConflicts.length > 0) {
      const approved = await confirmMechanicalOverride();
      if (!approved) return;
    }

    try {
      const previousUser = (data.users || []).find((entry) => entry.id === assignment.usuario_id);
      await updateDoc(doc(db, 'assignments', assignmentId), { usuario_id: newUserId });
      setData((prev) =>
        patchCollectionItem(
          prev,
          'assignments',
          assignmentId,
          { usuario_id: newUserId },
          { sortFn: compareAssignmentsDesc }
        )
      );
      await logAssignmentAction(assignmentId, 'reatribuir_designacao', {
        previousUserName: getUserDisplayName(previousUser),
        nextUserName: getUserDisplayName(targetUser),
        assignmentType: assignment.tipo_designacao,
        date: assignment.date
      });
      addToast('Designação atualizada.', 'success');
      setReassigningId(null);
    } catch (error) {
      addToast('Erro ao atualizar designação.', 'error');
    }
  };

  const commitAssignmentsImport = async (assignments, perUserCounts) => {
    if (assignments.length === 0) return;
    if (!(await guardManageAssignments())) return;

    const createdAssignments = [];
    const chunks = [];
    for (let index = 0; index < assignments.length; index += 450) {
      chunks.push(assignments.slice(index, index + 450));
    }

    for (const chunk of chunks) {
      const batch = writeBatch(db);
      chunk.forEach((payload) => {
        const refDoc = doc(collection(db, 'assignments'));
        const dataPayload = { ...payload };
        if (!dataPayload.location) delete dataPayload.location;
        batch.set(refDoc, dataPayload);
        createdAssignments.push({ id: refDoc.id, ...dataPayload });
      });
      await batch.commit();
    }

    setData((prev) =>
      mergeCollectionById(prev, 'assignments', createdAssignments, {
        sortFn: compareAssignmentsDesc
      })
    );

    const notificationEntries = Array.from(perUserCounts.entries()).map(([targetUserId, count]) => ({
      targetUserId,
      count
    }));
    const notificationChunks = [];
    for (let index = 0; index < notificationEntries.length; index += 450) {
      notificationChunks.push(notificationEntries.slice(index, index + 450));
    }

    for (const chunk of notificationChunks) {
      const batch = writeBatch(db);
      chunk.forEach(({ targetUserId, count }) => {
        const refDoc = doc(collection(db, 'notifications'));
        const text =
          count === 1
            ? 'Você recebeu 1 nova designação.'
            : `Você recebeu ${count} novas designações.`;

        batch.set(refDoc, {
          text,
          authorId: user?.id || '',
          targetUserId,
          created_at: serverTimestamp(),
          type: 'assignment_import',
          targetView: 'ASSIGNMENTS_MONTH',
          read_by: []
        });
      });
      await batch.commit();
    }
  };

  const commitMeetingsImport = async (meetings, assignments) => {
    if ((!meetings || meetings.length === 0) && (!assignments || assignments.length === 0)) return;
    if (!(await guardManageAssignments())) return;

    const createdMeetings = [];
    const createdAssignments = [];

    const persistChunked = async (items, collectionName, sink) => {
      const chunks = [];
      for (let index = 0; index < items.length; index += 450) {
        chunks.push(items.slice(index, index + 450));
      }
      for (const chunk of chunks) {
        const batch = writeBatch(db);
        chunk.forEach((payload) => {
          const refDoc = doc(collection(db, collectionName));
          batch.set(refDoc, payload);
          sink.push({ id: refDoc.id, ...payload });
        });
        await batch.commit();
      }
    };

    if (meetings?.length) await persistChunked(meetings, 'meetings', createdMeetings);
    if (assignments?.length) await persistChunked(assignments, 'assignments', createdAssignments);

    setData((prev) =>
      mergeCollectionById(
        mergeCollectionById(prev, 'meetings', createdMeetings, {
          sortFn: compareMeetingsAsc
        }),
        'assignments',
        createdAssignments,
        { sortFn: compareAssignmentsDesc }
      )
    );
  };

  const handleAccept = async (assignmentId) => {
    if (!(await guardAuth())) return;
    try {
      const assignment = (data.assignments || []).find((entry) => entry.id === assignmentId);
      await updateDoc(doc(db, 'assignments', assignmentId), { status: 'confirmado' });
      setData((prev) =>
        patchCollectionItem(prev, 'assignments', assignmentId, { status: 'confirmado' })
      );
      await logAssignmentAction(assignmentId, 'confirmar_designacao', {
        assignmentType: assignment?.tipo_designacao,
        date: assignment?.date
      });
      addToast('Designação confirmada.', 'success');
    } catch (error) {
      addToast('Erro ao confirmar designação.', 'error');
    }
  };

  const handleSwapRequest = async (assignment) => {
    if (!assignment?.id) return;
    if (!(await guardAuth())) return;
    if (assignment.allowSwap === false) {
      addToast('Essa participação da reunião não permite troca.', 'info');
      return;
    }

    try {
      await updateDoc(doc(db, 'assignments', assignment.id), { status: 'troca' });
      setData((prev) => patchCollectionItem(prev, 'assignments', assignment.id, { status: 'troca' }));
      await logAssignmentAction(assignment.id, 'solicitar_troca', {
        assignmentType: assignment.tipo_designacao,
        date: assignment.date
      });
      addToast('Troca solicitada.', 'success');
    } catch (error) {
      addToast('Erro ao solicitar troca.', 'error');
    }
  };

  const handleCancelSwap = async (assignment) => {
    if (!assignment?.id) return;
    if (!(await guardAuth())) return;
    if (assignment.allowSwap === false) {
      addToast('Essa participação da reunião não permite troca.', 'info');
      return;
    }

    try {
      await updateDoc(doc(db, 'assignments', assignment.id), { status: 'pendente' });
      setData((prev) =>
        patchCollectionItem(prev, 'assignments', assignment.id, { status: 'pendente' })
      );
      await logAssignmentAction(assignment.id, 'cancelar_troca', {
        assignmentType: assignment.tipo_designacao,
        date: assignment.date
      });
      addToast('Troca cancelada.', 'success');
    } catch (error) {
      addToast('Erro ao cancelar troca.', 'error');
    }
  };

  const handleAcceptSwap = async (assignmentId) => {
    if (!assignmentId || !user?.id) return;
    if (!(await guardAuth())) return;
    const assignment = (data.assignments || []).find((entry) => entry.id === assignmentId);
    if (!assignment) return;

    if (isMechanicalAssignment(assignment.tipo_designacao)) {
      const dayConflicts = getUserMechanicalAssignmentsOnDate(user.id, assignment.date).filter(
        (entry) => entry.id !== assignmentId
      );
      if (dayConflicts.length > 0) {
        addToast('Você já possui uma designação mecânica nessa data.', 'warn');
        return;
      }
    }

    try {
      const previousUser = (data.users || []).find((entry) => entry.id === assignment.usuario_id);
      await updateDoc(doc(db, 'assignments', assignmentId), {
        usuario_id: user.id,
        status: 'pendente'
      });
      setData((prev) =>
        patchCollectionItem(prev, 'assignments', assignmentId, {
          usuario_id: user.id,
          status: 'pendente'
        })
      );
      await logAssignmentAction(assignmentId, 'aceitar_troca', {
        assignmentType: assignment.tipo_designacao,
        date: assignment.date,
        previousUserName: getUserDisplayName(previousUser),
        nextUserName: getUserDisplayName(user)
      });
      addToast('Troca aceita.', 'success');
    } catch (error) {
      addToast('Erro ao aceitar troca.', 'error');
    }
  };

  return {
    resetAssignForm,
    createAssignmentRecord,
    handleCreateAssignment,
    handleAssignAnyway,
    handlePickAlternativeUser,
    handlePickNextAvailable,
    handleDeleteAssignment,
    handleUpdateAssignment: handleManagedUpdateAssignment,
    handleReassign,
    commitAssignmentsImport,
    commitMeetingsImport,
    handleAccept,
    handleSwapRequest,
    handleCancelSwap,
    handleAcceptSwap
  };
};

