import { supabase } from '../../services/supabase';
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
      addToast('Preencha os campos obrigatorios do discurso.', 'warn');
      return false;
    }

    if ((data.talks || []).some((entry) => entry?.date === date)) {
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

    const conflictingChairAssignment = (data.assignments || []).find(
      (entry) =>
        entry?.date === date &&
        entry?.tipo_designacao === TALK_CHAIR_ASSIGNMENT_TYPE &&
        entry?.status !== 'rejeitado'
    );

    try {
      // Generate IDs
      const talkId = `talk_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const chairmanAssignmentId = conflictingChairAssignment 
        ? conflictingChairAssignment.id
        : `assignment_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const notificationId = `notif_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

      const didReassignChairman = conflictingChairAssignment && conflictingChairAssignment.usuario_id !== chairmanUserId;
      const nextChairmanStatus = didReassignChairman ? 'pendente' : (conflictingChairAssignment?.status || 'pendente');

      const talkPayload = {
        id: talkId,
        date,
        monthKey: getMonthKey(date),
        speakerName,
        speakerCongregation,
        talkNumber,
        talkTheme,
        songNumber,
        songTheme,
        chairmanAssignmentId: chairmanAssignmentId,
        notificationId: notificationId,
        created_at: new Date().toISOString(),
        created_by: user?.id || ''
      };
      const assignmentPayload = {
        id: chairmanAssignmentId,
        date,
        usuario_id: chairmanUserId,
        tipo_designacao: TALK_CHAIR_ASSIGNMENT_TYPE,
        status: nextChairmanStatus,
        source: 'talk_schedule',
        talkScheduleId: talkId,
        created_at: conflictingChairAssignment?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
        updated_by: user?.id || ''
      };
      
      const sendNotification = !conflictingChairAssignment || didReassignChairman;
      const notificationPayload = sendNotification ? {
        id: notificationId,
        text: `Voce recebeu a designacao de Presidente Fim de Semana em ${formatDatePt(date)}.`,
        authorId: user?.id || '',
        targetUserId: chairmanUserId,
        created_at: new Date().toISOString(),
        type: 'talk_assignment',
        talkScheduleId: talkId,
        targetView: 'ASSIGNMENTS_MONTH',
        read_by: []
      } : null;

      // Insert into Supabase
      const inserts = [
        supabase.from('talks').insert(talkPayload),
        supabase.from('assignments').insert(assignmentPayload)
      ];
      if (sendNotification && notificationPayload) {
        inserts.push(supabase.from('notifications').insert(notificationPayload));
      }
      
      await Promise.all(inserts);

      const localCreatedAt = new Date();
      setData((prev) => {
        let nextData = mergeCollectionById(
          prev,
          'talks',
          [{ id: talkId, ...talkPayload, created_at: localCreatedAt }],
          { sortFn: compareTalksAsc }
        );
        
        if (conflictingChairAssignment) {
          nextData = patchCollectionItem(
            nextData,
            'assignments',
            chairmanAssignmentId,
            { ...assignmentPayload, updated_at: localCreatedAt },
            { sortFn: compareAssignmentsDesc }
          );
        } else {
          nextData = mergeCollectionById(
            nextData,
            'assignments',
            [{ id: chairmanAssignmentId, ...assignmentPayload, created_at: localCreatedAt }],
            { sortFn: compareAssignmentsDesc }
          );
        }
        
        if (sendNotification && notificationPayload) {
          nextData = prependCollectionItems(
            nextData,
            'notifications',
            [{ id: notificationId, ...notificationPayload, created_at: localCreatedAt }],
            { limit: 80, sortFn: compareNotificationsDesc }
          );
        }
        
        return nextData;
      });

      addToast(
        conflictingChairAssignment 
          ? 'Discurso vinculado a designacao existente.' 
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
      const chairmanAssignmentId = currentTalk.chairmanAssignmentId
        ? currentTalk.chairmanAssignmentId
        : `assignment_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const notificationId =
        currentTalk.notificationId ||
        (data.notifications || []).find((entry) => entry?.talkScheduleId === talkId)?.id ||
        `notif_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

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
        chairmanAssignmentId: chairmanAssignmentId,
        notificationId,
        updated_at: new Date().toISOString(),
        updated_by: user?.id || ''
      };
      const assignmentPayload = {
        date,
        usuario_id: chairmanUserId,
        tipo_designacao: TALK_CHAIR_ASSIGNMENT_TYPE,
        status: nextChairmanStatus,
        source: 'talk_schedule',
        talkScheduleId: talkId,
        ...(existingChairmanAssignment?.created_at ? {} : { created_at: new Date().toISOString() }),
        updated_at: new Date().toISOString(),
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
          : { created_at: new Date().toISOString() }),
        updated_at: new Date().toISOString(),
        ...(didReschedule || didReassignChairman ? { read_by: [] } : {})
      };

      // Update in Supabase
      const updates = [
        supabase.from('talks').update(talkPayload).eq('id', talkId),
        supabase.from('assignments').upsert({ id: chairmanAssignmentId, ...assignmentPayload })
      ];
      
      const existingNotification =
        (data.notifications || []).find((entry) => entry.id === notificationId) || null;
      if (existingNotification) {
        updates.push(supabase.from('notifications').update(notificationPayload).eq('id', notificationId));
      } else if (notificationPayload.created_at) {
        updates.push(supabase.from('notifications').insert({ id: notificationId, ...notificationPayload }));
      }
      
      await Promise.all(updates);

      const localUpdatedAt = new Date();

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
                id: chairmanAssignmentId,
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
      message: 'Deseja excluir esse discurso e a designacao vinculada do presidente?',
      confirmText: 'Excluir'
    });
    if (!approved) return false;

    try {
      const relatedNotificationId =
        talk.notificationId ||
        (data.notifications || []).find((entry) => entry?.talkScheduleId === talk.id)?.id ||
        '';
      
      // Delete from Supabase
      const deletions = [
        supabase.from('talks').delete().eq('id', talk.id)
      ];
      if (talk.chairmanAssignmentId) {
        deletions.push(supabase.from('assignments').delete().eq('id', talk.chairmanAssignmentId));
      }
      if (relatedNotificationId) {
        deletions.push(supabase.from('notifications').delete().eq('id', relatedNotificationId));
      }
      
      await Promise.all(deletions);

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

      addToast('Discurso excluido.', 'success');
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
