import { collection, doc, serverTimestamp, writeBatch } from 'firebase/firestore';
import {
  filterCollection,
  mergeCollectionById,
  patchCollectionItem,
  prependCollectionItems
} from '../../utils/dataStateUtils';
import {
  TALK_CHAIR_ASSIGNMENT_TYPE,
  compareTalksAsc,
  getMonthKey
} from '../../utils/talkUtils';

const compareAssignmentsDesc = (a, b) => {
  if (a?.date === b?.date) return String(b?.id || '').localeCompare(String(a?.id || ''));
  return String(b?.date || '').localeCompare(String(a?.date || ''));
};

const toMillis = (value) => {
  if (!value) return 0;
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'number') return value;
  if (typeof value?.toMillis === 'function') return value.toMillis();
  if (typeof value?.seconds === 'number') return value.seconds * 1000;
  if (typeof value === 'string') {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  return 0;
};

const compareNotificationsDesc = (a, b) => toMillis(b?.created_at) - toMillis(a?.created_at);

export const useTalkActions = ({
  db,
  user,
  data,
  setData,
  addToast,
  confirm,
  guardManageTalks,
  canUserTakeAssignment,
  formatDatePt
}) => {
  const getTalkErrorMessage = (error, fallback) => {
    if (error?.code === 'permission-denied') {
      return 'Permissao negada ao salvar discurso. Verifique as regras do Firestore.';
    }
    return fallback;
  };

  const handleCreateTalk = async (talkForm) => {
    if (!(await guardManageTalks())) return false;

    const date = String(talkForm?.date || '').trim();
    const chairmanUserId = String(talkForm?.chairmanUserId || '').trim();
    const speakerName = String(talkForm?.speakerName || '').trim();
    const speakerCongregation = String(talkForm?.speakerCongregation || '').trim();
    const talkNumber = String(talkForm?.talkNumber || '').trim();
    const talkTheme = String(talkForm?.talkTheme || '').trim();
    const songNumber = String(talkForm?.songNumber || '').trim();
    const songTheme = String(talkForm?.songTheme || '').trim();

    if (!date || !chairmanUserId || !speakerName || !talkTheme || !songNumber || !songTheme) {
      addToast('Preencha os campos obrigatórios do discurso.', 'warn');
      return false;
    }

    if ((data.talks || []).some((entry) => entry?.date === date)) {
      addToast('Já existe um discurso cadastrado nessa data.', 'warn');
      return false;
    }

    const chairmanUser = (data.users || []).find((entry) => entry.id === chairmanUserId);
    if (!chairmanUser || !chairmanUser.approved) {
      addToast('Selecione um presidente aprovado.', 'warn');
      return false;
    }

    if (!canUserTakeAssignment(chairmanUser, TALK_CHAIR_ASSIGNMENT_TYPE)) {
      addToast('Esse publicador não está habilitado para Presidente Fim de Semana.', 'warn');
      return false;
    }

    const conflictingChairAssignment = (data.assignments || []).find(
      (entry) =>
        entry?.date === date &&
        entry?.tipo_designacao === TALK_CHAIR_ASSIGNMENT_TYPE &&
        entry?.status !== 'rejeitado'
    );

    try {
      const talkRef = doc(collection(db, 'talks'));
      const chairmanAssignmentRef = conflictingChairAssignment 
        ? doc(db, 'assignments', conflictingChairAssignment.id)
        : doc(collection(db, 'assignments'));
      const notificationRef = doc(collection(db, 'notifications'));
      const batch = writeBatch(db);

      const didReassignChairman = conflictingChairAssignment && conflictingChairAssignment.usuario_id !== chairmanUserId;
      const nextChairmanStatus = didReassignChairman ? 'pendente' : (conflictingChairAssignment?.status || 'pendente');

      const talkPayload = {
        date,
        monthKey: getMonthKey(date),
        speakerName,
        speakerCongregation,
        talkNumber,
        talkTheme,
        songNumber,
        songTheme,
        chairmanAssignmentId: chairmanAssignmentRef.id,
        notificationId: notificationRef.id,
        created_at: serverTimestamp(),
        created_by: user?.id || ''
      };
      const assignmentPayload = {
        date,
        usuario_id: chairmanUserId,
        tipo_designacao: TALK_CHAIR_ASSIGNMENT_TYPE,
        status: nextChairmanStatus,
        source: 'talk_schedule',
        talkScheduleId: talkRef.id,
        ...(conflictingChairAssignment?.created_at ? {} : { created_at: serverTimestamp() }),
        updated_at: serverTimestamp(),
        updated_by: user?.id || ''
      };
      
      const sendNotification = !conflictingChairAssignment || didReassignChairman;
      const notificationPayload = {
        text: `Você recebeu a designação de Presidente Fim de Semana em ${formatDatePt(date)}.`,
        authorId: user?.id || '',
        targetUserId: chairmanUserId,
        created_at: serverTimestamp(),
        type: 'talk_assignment',
        talkScheduleId: talkRef.id,
        targetView: 'ASSIGNMENTS_MONTH',
        read_by: []
      };

      batch.set(talkRef, talkPayload);
      batch.set(chairmanAssignmentRef, assignmentPayload, { merge: true });
      if (sendNotification) {
        batch.set(notificationRef, notificationPayload);
      }
      await batch.commit();

      const localCreatedAt = new Date();
      setData((prev) => {
        let nextData = mergeCollectionById(
          prev,
          'talks',
          [{ id: talkRef.id, ...talkPayload, created_at: localCreatedAt }],
          { sortFn: compareTalksAsc }
        );
        
        if (conflictingChairAssignment) {
          nextData = patchCollectionItem(
            nextData,
            'assignments',
            chairmanAssignmentRef.id,
            { ...assignmentPayload, updated_at: localCreatedAt },
            { sortFn: compareAssignmentsDesc }
          );
        } else {
          nextData = mergeCollectionById(
            nextData,
            'assignments',
            [{ id: chairmanAssignmentRef.id, ...assignmentPayload, created_at: localCreatedAt }],
            { sortFn: compareAssignmentsDesc }
          );
        }
        
        if (sendNotification) {
          nextData = prependCollectionItems(
            nextData,
            'notifications',
            [{ id: notificationRef.id, ...notificationPayload, created_at: localCreatedAt }],
            { limit: 80, sortFn: compareNotificationsDesc }
          );
        }
        
        return nextData;
      });

      addToast(
        conflictingChairAssignment 
          ? 'Discurso vinculado à designação existente.' 
          : 'Discurso cadastrado e presidente notificado.', 
        'success'
      );
      return true;
    } catch (error) {
      console.error('handleCreateTalk failed', error);
      addToast(getTalkErrorMessage(error, 'Erro ao cadastrar o discurso.'), 'error');
      return false;
    }
  };

  const handleUpdateTalk = async (talkId, talkForm) => {
    if (!talkId) return false;
    if (!(await guardManageTalks())) return false;

    const currentTalk = (data.talks || []).find((entry) => entry.id === talkId);
    if (!currentTalk) {
      addToast('Discurso nao encontrado para edicao.', 'warn');
      return false;
    }

    const date = String(talkForm?.date || '').trim();
    const chairmanUserId = String(talkForm?.chairmanUserId || '').trim();
    const speakerName = String(talkForm?.speakerName || '').trim();
    const speakerCongregation = String(talkForm?.speakerCongregation || '').trim();
    const talkNumber = String(talkForm?.talkNumber || '').trim();
    const talkTheme = String(talkForm?.talkTheme || '').trim();
    const songNumber = String(talkForm?.songNumber || '').trim();
    const songTheme = String(talkForm?.songTheme || '').trim();

    if (!date || !chairmanUserId || !speakerName || !talkTheme || !songNumber || !songTheme) {
      addToast('Preencha os campos obrigatorios do discurso.', 'warn');
      return false;
    }

    if ((data.talks || []).some((entry) => entry?.id !== talkId && entry?.date === date)) {
      addToast('Ja existe um discurso cadastrado nessa data.', 'warn');
      return false;
    }

    const chairmanUser = (data.users || []).find((entry) => entry.id === chairmanUserId);
    if (!chairmanUser || !chairmanUser.approved) {
      addToast('Selecione um presidente aprovado.', 'warn');
      return false;
    }

    if (!canUserTakeAssignment(chairmanUser, TALK_CHAIR_ASSIGNMENT_TYPE)) {
      addToast('Esse publicador nao esta habilitado para Presidente Fim de Semana.', 'warn');
      return false;
    }

    const existingChairmanAssignment =
      (data.assignments || []).find((entry) => entry.id === currentTalk.chairmanAssignmentId) || null;
    const conflictingChairAssignment = (data.assignments || []).find(
      (entry) =>
        entry?.id !== existingChairmanAssignment?.id &&
        entry?.date === date &&
        entry?.tipo_designacao === TALK_CHAIR_ASSIGNMENT_TYPE &&
        entry?.status !== 'rejeitado'
    );
    if (conflictingChairAssignment) {
      addToast('Ja existe um Presidente Fim de Semana cadastrado nessa data.', 'warn');
      return false;
    }

    try {
      const batch = writeBatch(db);
      const talkRef = doc(db, 'talks', talkId);
      const chairmanAssignmentRef = currentTalk.chairmanAssignmentId
        ? doc(db, 'assignments', currentTalk.chairmanAssignmentId)
        : doc(collection(db, 'assignments'));
      const notificationId =
        currentTalk.notificationId ||
        (data.notifications || []).find((entry) => entry?.talkScheduleId === talkId)?.id ||
        doc(collection(db, 'notifications')).id;
      const notificationRef = doc(db, 'notifications', notificationId);

      const didReschedule = currentTalk.date !== date;
      const didReassignChairman = existingChairmanAssignment?.usuario_id !== chairmanUserId;
      const nextChairmanStatus =
        didReschedule || didReassignChairman
          ? 'pendente'
          : existingChairmanAssignment?.status || 'pendente';

      const talkPayload = {
        date,
        monthKey: getMonthKey(date),
        speakerName,
        speakerCongregation,
        talkNumber,
        talkTheme,
        songNumber,
        songTheme,
        chairmanAssignmentId: chairmanAssignmentRef.id,
        notificationId,
        updated_at: serverTimestamp(),
        updated_by: user?.id || ''
      };
      const assignmentPayload = {
        date,
        usuario_id: chairmanUserId,
        tipo_designacao: TALK_CHAIR_ASSIGNMENT_TYPE,
        status: nextChairmanStatus,
        source: 'talk_schedule',
        talkScheduleId: talkId,
        ...(existingChairmanAssignment?.created_at ? {} : { created_at: serverTimestamp() }),
        updated_at: serverTimestamp(),
        updated_by: user?.id || ''
      };
      const notificationPayload = {
        text: `Voce recebeu a designacao de Presidente Fim de Semana em ${formatDatePt(date)}.`,
        authorId: user?.id || '',
        targetUserId: chairmanUserId,
        type: 'talk_assignment',
        talkScheduleId: talkId,
        targetView: 'ASSIGNMENTS_MONTH',
        ...(notificationId && (data.notifications || []).some((entry) => entry.id === notificationId)
          ? {}
          : { created_at: serverTimestamp() }),
        updated_at: serverTimestamp(),
        ...(didReschedule || didReassignChairman ? { read_by: [] } : {})
      };

      batch.set(talkRef, talkPayload, { merge: true });
      batch.set(chairmanAssignmentRef, assignmentPayload, { merge: true });
      batch.set(notificationRef, notificationPayload, { merge: true });
      await batch.commit();

      const localUpdatedAt = new Date();
      const existingNotification =
        (data.notifications || []).find((entry) => entry.id === notificationId) || null;

      setData((prev) =>
        mergeCollectionById(
          mergeCollectionById(
            patchCollectionItem(
              prev,
              'talks',
              talkId,
              {
                ...talkPayload,
                updated_at: localUpdatedAt
              },
              { sortFn: compareTalksAsc }
            ),
            'assignments',
            [
              {
                id: chairmanAssignmentRef.id,
                ...(existingChairmanAssignment || {}),
                ...assignmentPayload,
                updated_at: localUpdatedAt
              }
            ],
            { sortFn: compareAssignmentsDesc }
          ),
          'notifications',
          [
            {
              id: notificationId,
              ...(existingNotification || {}),
              ...notificationPayload,
              created_at: existingNotification?.created_at || localUpdatedAt,
              updated_at: localUpdatedAt
            }
          ],
          { sortFn: compareNotificationsDesc }
        )
      );

      addToast('Discurso atualizado.', 'success');
      return true;
    } catch (error) {
      console.error('handleUpdateTalk failed', error);
      addToast(getTalkErrorMessage(error, 'Erro ao atualizar o discurso.'), 'error');
      return false;
    }
  };

  const handleDeleteTalk = async (talk) => {
    if (!talk?.id) return false;
    if (!(await guardManageTalks())) return false;

    const approved = await confirm({
      title: 'Excluir discurso',
      message: 'Deseja excluir esse discurso e a designação vinculada do presidente?',
      confirmText: 'Excluir'
    });
    if (!approved) return false;

    try {
      const batch = writeBatch(db);
      const relatedNotificationId =
        talk.notificationId ||
        (data.notifications || []).find((entry) => entry?.talkScheduleId === talk.id)?.id ||
        '';
      batch.delete(doc(db, 'talks', talk.id));
      if (talk.chairmanAssignmentId) {
        batch.delete(doc(db, 'assignments', talk.chairmanAssignmentId));
      }
      if (relatedNotificationId) {
        batch.delete(doc(db, 'notifications', relatedNotificationId));
      }
      await batch.commit();

      setData((prev) =>
        filterCollection(
          filterCollection(
            filterCollection(prev, 'talks', (entry) => entry.id !== talk.id),
            'assignments',
            (entry) => entry.id !== talk.chairmanAssignmentId
          ),
          'notifications',
          (entry) => entry.id !== relatedNotificationId
        )
      );

      addToast('Discurso excluído.', 'success');
      return true;
    } catch (error) {
      console.error('handleDeleteTalk failed', error);
      addToast('Erro ao excluir o discurso.', 'error');
      return false;
    }
  };

  return {
    handleCreateTalk,
    handleUpdateTalk,
    handleDeleteTalk
  };
};
