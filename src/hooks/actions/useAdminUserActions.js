import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch
} from 'firebase/firestore';
import { filterCollection, mapCollection, patchCollectionItem } from '../../utils/dataStateUtils';
import { sendPasswordResetEmail } from 'firebase/auth';
import { getUserDisplayName, normalizePersonName } from '../../utils/textUtils';
const normalizeDomain = (value) =>
  String(value || '')
    .trim()
    .replace(/^@/, '')
    .toLowerCase();

const isValidDomain = (value) =>
  /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/i.test(value);

export const useAdminUserActions = ({
  auth,
  db,
  user,
  data,
  setData,
  setUser,
  originalAdmin,
  setOriginalAdmin,
  setView,
  addToast,
  confirm,
  assignmentTypes
}) => {
  const handleUpdateApproval = async (uid, approved) => {
    try {
      await updateDoc(doc(db, 'users', uid), { approved: !!approved });
      setData((prev) => patchCollectionItem(prev, 'users', uid, { approved }));
      addToast('Aprovação atualizada.', 'success');
    } catch (error) {
      addToast('Erro ao atualizar aprovação.', 'error');
    }
  };

  const handleApproveAll = async () => {
    const pendingUsers = (data.users || []).filter((entry) => !entry.approved);
    if (pendingUsers.length === 0) {
      addToast('Nenhum cadastro pendente para aprovar.', 'info');
      return false;
    }

    const approved = await confirm({
      title: 'Aprovar cadastros',
      message: `Aprovar ${pendingUsers.length} cadastro(s) pendente(s)?`,
      confirmText: 'Aprovar'
    });
    if (!approved) return false;

    try {
      const batch = writeBatch(db);
      pendingUsers.forEach((entry) => {
        batch.update(doc(db, 'users', entry.id), { approved: true });
      });
      await batch.commit();
      setData((prev) => mapCollection(prev, 'users', (entry) => ({ ...entry, approved: true })));
      addToast('Todos aprovados.', 'success');
      return true;
    } catch (error) {
      addToast('Erro ao aprovar todos.', 'error');
      return false;
    }
  };

  const handleApproveByDomain = async (rawDomain = '') => {
    const domain = normalizeDomain(rawDomain);
    if (!domain) {
      addToast('Informe um domínio válido, por exemplo: exemplo.com.', 'warn');
      return false;
    }
    if (!isValidDomain(domain)) {
      addToast('Domínio inválido. Use o formato exemplo.com.', 'warn');
      return false;
    }

    const pendingUsers = (data.users || []).filter(
      (entry) => !entry.approved && (entry.email || '').toLowerCase().endsWith(`@${domain}`)
    );
    if (pendingUsers.length === 0) {
      addToast('Nenhum usuário pendente encontrado para esse domínio.', 'info');
      return false;
    }

    const approved = await confirm({
      title: 'Aprovar por domínio',
      message: `Aprovar ${pendingUsers.length} cadastro(s) do domínio ${domain}?`,
      confirmText: 'Aprovar'
    });
    if (!approved) return false;

    try {
      const batch = writeBatch(db);
      pendingUsers.forEach((entry) => {
        batch.update(doc(db, 'users', entry.id), { approved: true });
      });
      await batch.commit();
      setData((prev) =>
        mapCollection(prev, 'users', (entry) =>
          (entry.email || '').toLowerCase().endsWith(`@${domain}`)
            ? { ...entry, approved: true }
            : entry
        )
      );
      addToast('Aprovação em massa concluída.', 'success');
      return true;
    } catch (error) {
      addToast('Erro ao aprovar por domínio.', 'error');
      return false;
    }
  };

  const handleImpersonate = (target) => {
    if (!target || !user) return;
    setOriginalAdmin(user);
    setUser(target);
    setView('DASHBOARD');
  };

  const stopImpersonating = (nextView = 'DASHBOARD') => {
    const authUid = auth.currentUser?.uid;
    const adminUser = data.users.find((entry) => entry.id === authUid) || originalAdmin;
    if (adminUser) setUser(adminUser);
    setOriginalAdmin(null);
    setView(nextView);
  };

  const handleToggleAdminRole = async (uid, isAdmin) => {
    try {
      await updateDoc(doc(db, 'users', uid), { isAdmin: !!isAdmin });
      setData((prev) => patchCollectionItem(prev, 'users', uid, { isAdmin }));
      addToast('Permissão atualizada.', 'success');
    } catch (error) {
      addToast('Erro ao atualizar permissão.', 'error');
    }
  };

  const handleDeleteUser = async (uid) => {
    const approved = await confirm({
      title: 'Excluir usuário',
      message: 'Deseja excluir este usuário?',
      confirmText: 'Excluir'
    });
    if (!approved) return;

    try {
      await deleteDoc(doc(db, 'users', uid));
      setData((prev) => filterCollection(prev, 'users', (entry) => entry.id !== uid));
      addToast('Usuário excluído.', 'success');
    } catch (error) {
      addToast('Erro ao excluir usuário.', 'error');
    }
  };

  const handleAdminUpdateUserName = async (uid, name, surname) => {
    try {
      await updateDoc(doc(db, 'users', uid), { name, surname });
      setData((prev) => patchCollectionItem(prev, 'users', uid, { name, surname }));
      addToast('Usuário atualizado.', 'success');
    } catch (error) {
      addToast('Erro ao atualizar usuário.', 'error');
    }
  };

  const handleUpdateUserCapabilities = async (uid, nextCapabilities) => {
    const normalizedCapabilities = assignmentTypes.reduce((accumulator, type) => {
      accumulator[type] = nextCapabilities?.[type] === true;
      return accumulator;
    }, {});

    try {
      await updateDoc(doc(db, 'users', uid), { assignmentCapabilities: normalizedCapabilities });
      setData((prev) =>
        patchCollectionItem(prev, 'users', uid, {
          assignmentCapabilities: normalizedCapabilities
        })
      );
      setUser((prev) =>
        prev && prev.id === uid ? { ...prev, assignmentCapabilities: normalizedCapabilities } : prev
      );
      addToast('Atribuições atualizadas.', 'success');
    } catch (error) {
      addToast('Erro ao atualizar atribuições.', 'error');
    }
  };

  const handleSendBroadcast = async (event) => {
    event.preventDefault();
    const form = event.target;
    const message = String(form.msg.value || '').trim();
    if (!message) return;

    try {
      const batch = writeBatch(db);
      (data.users || [])
        .filter((entry) => entry.approved)
        .forEach((entry) => {
          const refDoc = doc(collection(db, 'notifications'));
          batch.set(refDoc, {
            text: message,
            authorId: user?.id || '',
            targetUserId: entry.id,
            created_at: serverTimestamp(),
            type: 'broadcast',
            targetView: 'NOTICES',
            read_by: []
          });
        });
      await batch.commit();
      addToast('Comunicado enviado.', 'success');
      form.reset();
    } catch (error) {
      addToast('Erro ao enviar comunicado.', 'error');
    }
  };

  const handleSendRecoveryEmail = async (email) => {
    if (!email) {
      addToast('Este usuário não possui e-mail cadastrado.', 'warn');
      return false;
    }

    const approved = await confirm({
      title: 'Enviar Recuperação de Senha',
      message: `Enviar e-mail de redefinição de senha para ${email}?`,
      confirmText: 'Enviar'
    });
    if (!approved) return false;

    try {
      await sendPasswordResetEmail(auth, email);
      addToast('E-mail de recuperação enviado com sucesso.', 'success');
      return true;
    } catch (error) {
      console.error(error);
      addToast('Erro ao enviar e-mail de recuperação.', 'error');
      return false;
    }
  };

  const handleTransferAssignments = async (fromUid, toUid) => {
    if (!fromUid || !toUid || fromUid === toUid) {
      addToast('Selecione usuários diferentes.', 'warn');
      return false;
    }

    const fromUser = (data.users || []).find((u) => u.id === fromUid);
    const toUser = (data.users || []).find((u) => u.id === toUid);
    if (!fromUser || !toUser) {
      addToast('Usuários não encontrados.', 'error');
      return false;
    }

    const toUserName = getUserDisplayName(toUser);
    const toUserNormName = normalizePersonName(toUserName);

    const assignmentsRef = collection(db, 'assignments');
    const q = query(assignmentsRef, where('usuario_id', '==', fromUid));
    const snapshot = await getDocs(q);
    const count = snapshot.size;

    const meetingsRef = collection(db, 'meetings');
    const qMeetings = query(meetingsRef, where('user_id', '==', fromUid));
    const meetingsSnapshot = await getDocs(qMeetings);
    const meetingsCount = meetingsSnapshot.size;

    if (count === 0 && meetingsCount === 0) {
      addToast('Nenhuma designação encontrada para transferir.', 'info');
      return false;
    }

    const totalToTransfer = Math.max(count, meetingsCount);

    const approved = await confirm({
      title: 'Transferir Designações',
      message: `Transferir designação(ões) de "${fromUser.name || 'Usuário'}" para "${toUser.name || 'Usuário'}"?`,
      confirmText: 'Transferir'
    });
    if (!approved) return false;

    try {
      const docsArr = snapshot.docs;
      for (let i = 0; i < docsArr.length; i += 400) {
        const batch = writeBatch(db);
        const chunk = docsArr.slice(i, i + 400);
        chunk.forEach((docSnap) => {
          batch.update(docSnap.ref, { usuario_id: toUid });
        });
        await batch.commit();
      }

      const meetingsArr = meetingsSnapshot.docs;
      for (let i = 0; i < meetingsArr.length; i += 400) {
        const batch = writeBatch(db);
        const chunk = meetingsArr.slice(i, i + 400);
        chunk.forEach((docSnap) => {
          batch.update(docSnap.ref, { 
            user_id: toUid,
            participant_name: toUserName,
            participant_name_norm: toUserNormName,
            match_state: 'linked'
          });
        });
        await batch.commit();
      }

      // Update local state to immediately show changes without reloading
      setData((prev) => {
        const updatedAssignments = (prev.assignments || []).map((a) => {
          if (a.usuario_id === fromUid) {
            return { ...a, usuario_id: toUid };
          }
          return a;
        });
        
        const updatedMeetings = (prev.meetings || []).map((m) => {
          if (m.user_id === fromUid) {
            return { 
              ...m, 
              user_id: toUid,
              participant_name: toUserName,
              participant_name_norm: toUserNormName,
              match_state: 'linked'
            };
          }
          return m;
        });

        return { ...prev, assignments: updatedAssignments, meetings: updatedMeetings };
      });

      addToast(`Designação(ões) transferida(s) com sucesso.`, 'success');
      return true;
    } catch (error) {
      console.error(error);
      addToast('Erro ao transferir designações.', 'error');
      return false;
    }
  };

  return {
    handleUpdateApproval,
    handleApproveAll,
    handleApproveByDomain,
    handleImpersonate,
    stopImpersonating,
    handleToggleAdminRole,
    handleDeleteUser,
    handleAdminUpdateUserName,
    handleUpdateUserCapabilities,
    handleSendBroadcast,
    handleSendRecoveryEmail,
    handleTransferAssignments
  };
};
