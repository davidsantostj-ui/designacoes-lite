import { supabase } from '../../services/supabase';
import { filterCollection, mapCollection, patchCollectionItem } from '../../utils/dataStateUtils';
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
      await supabase.from('users').update({ approved: !!approved }).eq('id', uid);
      setData((prev) => patchCollectionItem(prev, 'users', uid, { approved }));
      addToast('Aprovacao atualizada.', 'success');
    } catch (error) {
      addToast('Erro ao atualizar aprovacao.', 'error');
    }
  };

  const handleApproveAll = async () => {
    const pendingUsers = (data.users || []).filter((entry) => !entry.approved);
    if (pendingUsers.length === 0) {
      addToast('Nenhum cadastro pendente para aprobar.', 'info');
      return false;
    }

    const approved = await confirm({
      title: 'Aprovar cadastros',
      message: `Aprovar ${pendingUsers.length} cadastro(s) pendente(s)?`,
      confirmText: 'Aprovar'
    });
    if (!approved) return false;

    try {
      const userIds = pendingUsers.map(u => u.id);
      for (let i = 0; i < userIds.length; i += 450) {
        const chunk = userIds.slice(i, i + 450);
        for (const uid of chunk) {
          await supabase.from('users').update({ approved: true }).eq('id', uid);
        }
      }
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
      addToast('Informe um dominio valido, por exemplo: exemplo.com.', 'warn');
      return false;
    }
    if (!isValidDomain(domain)) {
      addToast('Dominio invalido. Use o formato exemplo.com.', 'warn');
      return false;
    }

    const pendingUsers = (data.users || []).filter(
      (entry) => !entry.approved && (entry.email || '').toLowerCase().endsWith(`@${domain}`)
    );
    if (pendingUsers.length === 0) {
      addToast('Nenhum usuario pendente encontrado para esse dominio.', 'info');
      return false;
    }

    const approved = await confirm({
      title: 'Aprovar por dominio',
      message: `Aprovar ${pendingUsers.length} cadastro(s) do dominio ${domain}?`,
      confirmText: 'Aprovar'
    });
    if (!approved) return false;

    try {
      const userIds = pendingUsers.map(u => u.id);
      for (let i = 0; i < userIds.length; i += 450) {
        const chunk = userIds.slice(i, i + 450);
        for (const uid of chunk) {
          await supabase.from('users').update({ approved: true }).eq('id', uid);
        }
      }
      setData((prev) =>
        mapCollection(prev, 'users', (entry) =>
          (entry.email || '').toLowerCase().endsWith(`@${domain}`)
            ? { ...entry, approved: true }
            : entry
        )
      );
      addToast('Aprovacao em masa concluida.', 'success');
      return true;
    } catch (error) {
      addToast('Erro ao aprovar por dominio.', 'error');
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
    const authUid = user?.id;
    const adminUser = data.users.find((entry) => entry.id === authUid) || originalAdmin;
    if (adminUser) setUser(adminUser);
    setOriginalAdmin(null);
    setView(nextView);
  };

  const handleToggleAdminRole = async (uid, isAdmin) => {
    try {
      await supabase.from('users').update({ isAdmin: !!isAdmin }).eq('id', uid);
      setData((prev) => patchCollectionItem(prev, 'users', uid, { isAdmin }));
      addToast('Permissao atualizada.', 'success');
    } catch (error) {
      addToast('Erro ao atualizar permissao.', 'error');
    }
  };

  const handleDeleteUser = async (uid) => {
    const approved = await confirm({
      title: 'Excluir usuario',
      message: 'Deseja excluir este usuario?',
      confirmText: 'Excluir'
    });
    if (!approved) return;

    try {
      await supabase.from('users').delete().eq('id', uid);
      setData((prev) => filterCollection(prev, 'users', (entry) => entry.id !== uid));
      addToast('Usuario excluido.', 'success');
    } catch (error) {
      addToast('Erro ao excluir usuario.', 'error');
    }
  };

  const handleAdminUpdateUserName = async (uid, name, surname) => {
    try {
      await supabase.from('users').update({ name, surname }).eq('id', uid);
      setData((prev) => patchCollectionItem(prev, 'users', uid, { name, surname }));
      addToast('Usuario atualizado.', 'success');
    } catch (error) {
      addToast('Erro ao atualizar usuario.', 'error');
    }
  };

  const handleUpdateUserCapabilities = async (uid, nextCapabilities) => {
    const normalizedCapabilities = assignmentTypes.reduce((accumulator, type) => {
      accumulator[type] = nextCapabilities?.[type] === true;
      return accumulator;
    }, {});

    try {
      await supabase.from('users').update({ assignmentCapabilities: normalizedCapabilities }).eq('id', uid);
      setData((prev) =>
        patchCollectionItem(prev, 'users', uid, {
          assignmentCapabilities: normalizedCapabilities
        })
      );
      setUser((prev) =>
        prev && prev.id === uid ? { ...prev, assignmentCapabilities: normalizedCapabilities } : prev
      );
      addToast('Atribuicoes atualizadas.', 'success');
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
      const notifications = (data.users || [])
        .filter((entry) => entry.approved)
        .map((entry) => ({
          id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 8)}_${entry.id}`,
          text: message,
          authorId: user?.id || '',
          targetUserId: entry.id,
          created_at: new Date().toISOString(),
          type: 'broadcast',
          targetView: 'NOTICES',
          read_by: []
        }));
      
      if (notifications.length > 0) {
        await supabase.from('notifications').insert(notifications);
      }
      addToast('Comunicado enviado.', 'success');
      form.reset();
    } catch (error) {
      addToast('Erro ao enviar comunicado.', 'error');
    }
  };

  const handleSendRecoveryEmail = async (email) => {
    if (!email) {
      addToast('Este usuario nao possui e-mail cadastrado.', 'warn');
      return false;
    }

    const approved = await confirm({
      title: 'Enviar Recuperacao de Senha',
      message: `Enviar e-mail de redefinicao de senha para ${email}?`,
      confirmText: 'Enviar'
    });
    if (!approved) return false;

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      if (error) throw error;
      
      addToast('E-mail de recuperacao enviado com sucesso.', 'success');
      return true;
    } catch (error) {
      console.error(error);
      addToast('Erro ao enviar e-mail de recuperacao.', 'error');
      return false;
    }
  };

  const handleTransferAssignments = async (fromUid, toUid) => {
    if (!fromUid || !toUid || fromUid === toUid) {
      addToast('Selecione usuarios diferentes.', 'warn');
      return false;
    }

    const fromUser = (data.users || []).find((u) => u.id === fromUid);
    const toUser = (data.users || []).find((u) => u.id === toUid);
    if (!fromUser || !toUser) {
      addToast('Usuarios nao encontrados.', 'error');
      return false;
    }

    const toUserName = getUserDisplayName(toUser);
    const toUserNormName = normalizePersonName(toUserName);

    const { data: assignmentsData } = await supabase
      .from('assignments')
      .select('id')
      .eq('usuario_id', fromUid);
    const count = assignmentsData?.length || 0;

    const { data: meetingsData } = await supabase
      .from('meetings')
      .select('id')
      .eq('user_id', fromUid);
    const meetingsCount = meetingsData?.length || 0;

    if (count === 0 && meetingsCount === 0) {
      addToast('Nenhuma designacao encontrada para transferir.', 'info');
      return false;
    }

    const totalToTransfer = Math.max(count, meetingsCount);

    const approved = await confirm({
      title: 'Transferir Designacoes',
      message: `Transferir designacao(oes) de "${fromUser.name || 'Usuario'}" para "${toUser.name || 'Usuario'}"?`,
      confirmText: 'Transferir'
    });
    if (!approved) return false;

    try {
      // Transfer assignments
      if (count > 0) {
        const assignmentIds = assignmentsData.map(a => a.id);
        for (let i = 0; i < assignmentIds.length; i += 450) {
          const chunk = assignmentIds.slice(i, i + 450);
          for (const id of chunk) {
            await supabase.from('assignments').update({ usuario_id: toUid }).eq('id', id);
          }
        }
      }

      // Transfer meetings
      if (meetingsCount > 0) {
        const meetingIds = meetingsData.map(m => m.id);
        for (let i = 0; i < meetingIds.length; i += 450) {
          const chunk = meetingIds.slice(i, i + 450);
          for (const id of chunk) {
            await supabase.from('meetings').update({ 
              user_id: toUid,
              participant_name: toUserName,
              participant_name_norm: toUserNormName,
              match_state: 'linked'
            }).eq('id', id);
          }
        }
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

      addToast(`Designacao(oes) transferida(s) com sucesso.`, 'success');
      return true;
    } catch (error) {
      console.error(error);
      addToast('Erro ao transferir designacoes.', 'error');
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
