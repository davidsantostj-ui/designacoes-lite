export const useAnnouncementActions = ({
  api,
  db,
  user,
  addToast,
  confirm,
  runExclusive,
  guardAuth,
  setDismissedPinned,
  setView,
  setAlertTab,
  data,
  collection,
  addDoc,
  serverTimestamp,
  deleteDoc,
  doc,
  updateDoc,
  arrayUnion
}) => {
  const handleCreateAnnouncement = async (e) => {
    e.preventDefault();
    const form = e.target;
    const title = form.title.value.trim();
    const message = form.message.value.trim();
    const pinned = form.pinned.checked;
    if (!title || !message) return;
    try {
      await api.createAnnouncement({ title, message, pinned, authorId: user.id });
      await addDoc(collection(db, 'notifications'), {
        text: `Novo anúncio: ${title}`,
        authorId: user.id,
        created_at: serverTimestamp(),
        type: 'announcement',
        targetView: 'NOTICES',
        read_by: []
      });
      addToast('Anúncio publicado.', 'success');
      form.reset();
    } catch (e) {
      addToast('Erro ao publicar anúncio.', 'error');
    }
  };

  const handleDeleteAnnouncement = async (id) => {
    const confirmed = await confirm({
      title: 'Excluir anúncio',
      message: 'Excluir este anúncio?',
      confirmText: 'Excluir'
    });
    if (!confirmed) return;
    await runExclusive(`del_announcement_${id}`, async () => {
      try {
        await api.deleteAnnouncement(id);
        addToast('Anúncio excluído.', 'success');
      } catch (e) {
        addToast('Erro ao excluir anúncio.', 'error');
      }
    });
  };

  const handleMarkAnnouncementRead = async (id) => {
    try {
      if (!(await guardAuth())) return;
      await updateDoc(doc(db, 'announcements', id), { read_by: arrayUnion(user.id) });
    } catch (e) {
      addToast('Erro ao marcar anúncio.', 'error');
    }
  };

  const handleDismissPinned = (id) => {
    if (!id) return;
    setDismissedPinned((prev) => (prev.includes(id) ? prev : [...prev, id]));
  };

  const handleOpenPinned = async (id) => {
    if (!id) return;
    await handleMarkAnnouncementRead(id);
    if (typeof setAlertTab === 'function') setAlertTab('ANNOUNCEMENTS');
    setView('NOTICES');
  };

  const handleClearReadAnnouncements = async () => {
    const confirmed = await confirm({
      title: 'Excluir anúncios lidos',
      message: 'Excluir todos os anúncios lidos?',
      confirmText: 'Excluir'
    });
    if (!confirmed) return;
    await runExclusive('clear_read_announcements', async () => {
      try {
        if (!(await guardAuth())) return;
        const readAnnouncements = data.announcements.filter((a) =>
          (a.read_by || []).includes(user.id)
        );
        await Promise.all(readAnnouncements.map((a) => deleteDoc(doc(db, 'announcements', a.id))));
        addToast('Anúncios lidos excluídos.', 'success');
      } catch (e) {
        addToast('Erro ao excluir anúncios lidos.', 'error');
      }
    });
  };

  return {
    handleCreateAnnouncement,
    handleDeleteAnnouncement,
    handleMarkAnnouncementRead,
    handleDismissPinned,
    handleOpenPinned,
    handleClearReadAnnouncements
  };
};
