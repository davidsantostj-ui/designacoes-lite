import { useCallback, useMemo, useState } from 'react';
import { collection, doc, getDocs, query, where, writeBatch } from 'firebase/firestore';
import { filterCollection, patchCollectionItems, replaceCollection } from '../utils/dataStateUtils';
import {
  buildMeetingBatchLabel,
  buildMeetingSyncKey,
  getMeetingSectionMeta,
  normalizeKeyText
} from '../utils/meetingImportUtils.js';

const compareMeetingsAsc = (a, b) => {
  const byDate = String(a.date || '').localeCompare(String(b.date || ''));
  if (byDate !== 0) return byDate;
  return String(a.sort_key || '').localeCompare(String(b.sort_key || ''));
};

export const useMeetingsBatchActions = ({
  addToast,
  assignments,
  meetings,
  closeMeetingsImportPreview,
  closeMeetingsReclassify,
  confirm,
  db,
  guardAdminAction,
  meetingsReclassifyState,
  setData,
  setMeetingsReclassifyState
}) => {
  const [isUndoingMeetingsImport, setIsUndoingMeetingsImport] = useState(false);
  const [isWipingMeetingsData, setIsWipingMeetingsData] = useState(false);
  const [isSavingMeetingsReclassify, setIsSavingMeetingsReclassify] = useState(false);
  const [isShiftingDates, setIsShiftingDates] = useState(false);
  const [lastMeetingsImportResult, setLastMeetingsImportResult] = useState(null);

  const latestMeetingsImportBatch = useMemo(() => {
    const batchMap = new Map();

    (meetings || []).forEach((entry) => {
      const batchId = entry?.import_batch_id;
      if (!batchId) return;

      const current = batchMap.get(batchId) || {
        batchId,
        batchLabel: entry.import_batch_label || buildMeetingBatchLabel(entry.date, entry.date),
        importedAtMs: Number(entry.imported_at_ms || 0),
        meetingsCount: 0,
        assignmentsCount: 0,
        linkedCount: 0,
        externalCount: 0,
        ambiguousCount: 0
      };

      current.batchLabel =
        current.batchLabel || entry.import_batch_label || buildMeetingBatchLabel(entry.date, entry.date);
      current.importedAtMs = Math.max(current.importedAtMs || 0, Number(entry.imported_at_ms || 0));
      current.meetingsCount += 1;
      if (entry.user_id || entry.match_state === 'linked') current.linkedCount += 1;
      else if (entry.match_state === 'ambiguous') current.ambiguousCount += 1;
      else current.externalCount += 1;
      batchMap.set(batchId, current);
    });

    (assignments || []).forEach((entry) => {
      const batchId = entry?.import_batch_id;
      if (!batchId) return;

      const current = batchMap.get(batchId) || {
        batchId,
        batchLabel:
          entry.import_batch_label || buildMeetingBatchLabel(entry.date || '', entry.date || ''),
        importedAtMs: Number(entry.imported_at_ms || 0),
        meetingsCount: 0,
        assignmentsCount: 0,
        linkedCount: 0,
        externalCount: 0,
        ambiguousCount: 0
      };

      current.batchLabel =
        current.batchLabel ||
        entry.import_batch_label ||
        buildMeetingBatchLabel(entry.date || '', entry.date || '');
      current.importedAtMs = Math.max(current.importedAtMs || 0, Number(entry.imported_at_ms || 0));
      current.assignmentsCount += 1;
      batchMap.set(batchId, current);
    });

    const batches = [...batchMap.values()];
    if (lastMeetingsImportResult?.batchId && !batchMap.has(lastMeetingsImportResult.batchId)) {
      batches.push(lastMeetingsImportResult);
    }
    batches.sort((a, b) => Number(b.importedAtMs || 0) - Number(a.importedAtMs || 0));
    return batches[0] || lastMeetingsImportResult || null;
  }, [assignments, meetings, lastMeetingsImportResult]);

  const latestMeetingsBatchRows = useMemo(() => {
    const batchId = latestMeetingsImportBatch?.batchId;
    if (!batchId) return [];

    const grouped = new Map();

    (meetings || [])
      .filter((entry) => entry.import_batch_id === batchId)
      .forEach((entry) => {
        const syncKey =
          entry.sync_key ||
          buildMeetingSyncKey({
            date: entry.date,
            designation: entry.designation,
            line: entry.import_line
          });

        const sectionMeta = getMeetingSectionMeta(entry.designation);
        const current = grouped.get(syncKey) || {
          id: syncKey,
          syncKey,
          date: entry.date,
          designation: entry.designation,
          importLine: Number(entry.import_line || 999),
          sectionKey: entry.section_key || sectionMeta.key,
          sectionLabel: entry.section_label || sectionMeta.label,
          sectionOrder: Number(entry.section_order || sectionMeta.order || 99),
          designationOrder: Number(entry.designation_order || 999),
          meetingIds: []
        };

        current.meetingIds.push(entry.id);
        current.importLine = Math.min(current.importLine, Number(entry.import_line || 999));
        current.designationOrder = Math.min(
          current.designationOrder || 999,
          Number(entry.designation_order || 999)
        );
        grouped.set(syncKey, current);
      });

    return [...grouped.values()].sort((a, b) => {
      const byDate = String(a.date || '').localeCompare(String(b.date || ''));
      if (byDate !== 0) return byDate;
      const bySection = Number(a.sectionOrder || 99) - Number(b.sectionOrder || 99);
      if (bySection !== 0) return bySection;
      const byOrder = Number(a.designationOrder || 999) - Number(b.designationOrder || 999);
      if (byOrder !== 0) return byOrder;
      return Number(a.importLine || 999) - Number(b.importLine || 999);
    });
  }, [latestMeetingsImportBatch, meetings]);

  const handleOpenLatestMeetingsReclassify = useCallback(() => {
    if (!latestMeetingsImportBatch?.batchId) return;
    setMeetingsReclassifyState({
      open: true,
      batchId: latestMeetingsImportBatch.batchId,
      batchLabel: latestMeetingsImportBatch.batchLabel || '',
      rows: latestMeetingsBatchRows
    });
  }, [latestMeetingsBatchRows, latestMeetingsImportBatch, setMeetingsReclassifyState]);

  const handleUndoMeetingsImport = useCallback(
    async (batchId) => {
      if (!batchId || isUndoingMeetingsImport) return;
      if (
        !(await guardAdminAction('Apenas administradores podem desfazer importações de reuniões.'))
      ) {
        return;
      }

      const approved = await confirm({
        title: 'Desfazer importação',
        message: 'Isso vai remover as Reuniões deste lote e as designações derivadas na agenda.',
        confirmText: 'Desfazer'
      });
      if (!approved) return;

      setIsUndoingMeetingsImport(true);
      try {
        const [meetingsSnap, assignmentsSnap] = await Promise.all([
          getDocs(query(collection(db, 'meetings'), where('import_batch_id', '==', batchId))),
          getDocs(query(collection(db, 'assignments'), where('import_batch_id', '==', batchId)))
        ]);

        const docsToDelete = [...meetingsSnap.docs, ...assignmentsSnap.docs];
        for (let index = 0; index < docsToDelete.length; index += 450) {
          const chunk = docsToDelete.slice(index, index + 450);
          const batch = writeBatch(db);
          chunk.forEach((docSnap) => batch.delete(docSnap.ref));
          await batch.commit();
        }

        setData((prev) =>
          filterCollection(
            filterCollection(prev, 'meetings', (entry) => entry.import_batch_id !== batchId),
            'assignments',
            (entry) => entry.import_batch_id !== batchId
          )
        );
        setLastMeetingsImportResult((prev) => (prev?.batchId === batchId ? null : prev));
        addToast('Importação de Reuniões desfeita.', 'success');
      } catch (error) {
        console.error(error);
        addToast('Erro ao desfazer a importação de Reuniões.', 'error');
      } finally {
        setIsUndoingMeetingsImport(false);
      }
    },
    [addToast, confirm, db, guardAdminAction, isUndoingMeetingsImport, setData]
  );

  const handleWipeMeetingsData = useCallback(async () => {
    if (isWipingMeetingsData) return;
    if (!(await guardAdminAction('Apenas administradores podem apagar dados de reuniões.'))) {
      return;
    }

    const approved = await confirm({
      title: 'Apagar reuniões importadas',
      message:
        'Isso removerá todas as reuniões importadas e todas as designações geradas a partir delas. Essa ação é definitiva.',
      confirmText: 'Apagar tudo'
    });
    if (!approved) return;

    setIsWipingMeetingsData(true);
    try {
      const [meetingsSnap, assignmentsSnap] = await Promise.all([
        getDocs(collection(db, 'meetings')),
        getDocs(query(collection(db, 'assignments'), where('source', '==', 'meeting_import')))
      ]);

      const docsToDelete = [...meetingsSnap.docs, ...assignmentsSnap.docs];
      for (let index = 0; index < docsToDelete.length; index += 450) {
        const chunk = docsToDelete.slice(index, index + 450);
        const batch = writeBatch(db);
        chunk.forEach((docSnap) => batch.delete(docSnap.ref));
        await batch.commit();
      }

      setData((prev) =>
        filterCollection(replaceCollection(prev, 'meetings', []), 'assignments', (entry) => {
          return entry.source !== 'meeting_import';
        })
      );
      setLastMeetingsImportResult(null);
      closeMeetingsReclassify();
      closeMeetingsImportPreview();
      addToast('Reuniões importadas e designações derivadas removidas.', 'success');
    } catch (error) {
      console.error(error);
      addToast('Erro ao apagar os dados de reuniões.', 'error');
    } finally {
      setIsWipingMeetingsData(false);
    }
  }, [
    addToast,
    closeMeetingsImportPreview,
    closeMeetingsReclassify,
    confirm,
    db,
    guardAdminAction,
    isWipingMeetingsData,
    setData
  ]);

  const handleSaveMeetingsReclassify = useCallback(async () => {
    const state = meetingsReclassifyState;
    const rows = state?.rows || [];
    if (!rows.length) {
      closeMeetingsReclassify();
      return;
    }
    if (isSavingMeetingsReclassify) return;
    if (
      !(await guardAdminAction('Apenas administradores podem reclassificar importações de reuniões.'))
    ) {
      return;
    }

    setIsSavingMeetingsReclassify(true);
    try {
      const meetingById = new Map((meetings || []).map((entry) => [entry.id, entry]));
      const updates = [];

      rows.forEach((row) => {
        row.meetingIds.forEach((meetingId) => {
          const entry = meetingById.get(meetingId);
          if (!entry) return;

          const sortKey = [
            row.date,
            String(row.sectionOrder || 99).padStart(2, '0'),
            String(row.designationOrder || 999).padStart(4, '0'),
            String(row.importLine || 999).padStart(4, '0'),
            String(
              entry.role_order || (entry.role_type === 'assistente_leitor' ? 2 : 1)
            ).padStart(2, '0'),
            normalizeKeyText(entry.participant_name)
          ].join('|');

          updates.push({
            id: meetingId,
            changes: {
              section_key: row.sectionKey,
              section_label: row.sectionLabel,
              section_order: row.sectionOrder,
              designation_order: row.designationOrder,
              sort_key: sortKey
            }
          });
        });
      });

      for (let index = 0; index < updates.length; index += 450) {
        const chunk = updates.slice(index, index + 450);
        const batch = writeBatch(db);
        chunk.forEach((item) => {
          batch.update(doc(db, 'meetings', item.id), item.changes);
        });
        await batch.commit();
      }

      const changesMap = new Map(updates.map((item) => [item.id, item.changes]));
      setData((prev) =>
        patchCollectionItems(prev, 'meetings', changesMap, {
          sortFn: compareMeetingsAsc
        })
      );

      closeMeetingsReclassify();
      addToast('Classificação do lote atualizada.', 'success');
    } catch (error) {
      console.error(error);
      addToast('Erro ao reclassificar o lote de Reuniões.', 'error');
    } finally {
      setIsSavingMeetingsReclassify(false);
    }
  }, [
    addToast,
    closeMeetingsReclassify,
    db,
    guardAdminAction,
    isSavingMeetingsReclassify,
    meetings,
    meetingsReclassifyState,
    setData
  ]);

  const handleShiftDate = useCallback(async (sourceDate, targetDate) => {
    if (!sourceDate || !targetDate || sourceDate === targetDate) {
      addToast('Datas inválidas para deslocamento.', 'warn');
      return false;
    }
    if (isShiftingDates) return false;
    if (!(await guardAdminAction('Apenas administradores podem deslocar datas.'))) {
      return false;
    }

    const sourceMeetings = (meetings || []).filter((m) => m.date === sourceDate);
    const sourceAssignments = (assignments || []).filter((a) => a.date === sourceDate);

    if (sourceMeetings.length === 0 && sourceAssignments.length === 0) {
      addToast('Nenhum dado encontrado na data de origem.', 'info');
      return false;
    }

    const approved = await confirm({
      title: 'Deslocar Data em Lote',
      message: `Você está prestes a mover ${sourceMeetings.length} item(ns) de reunião e ${sourceAssignments.length} designação(ões) do dia ${sourceDate.split('-').reverse().join('/')} para o dia ${targetDate.split('-').reverse().join('/')}. Continuar?`,
      confirmText: 'Mover Tudo'
    });
    if (!approved) return false;

    setIsShiftingDates(true);
    try {
      const updates = [];
      
      sourceMeetings.forEach((m) => {
        updates.push({ collection: 'meetings', id: m.id, changes: { date: targetDate } });
      });
      sourceAssignments.forEach((a) => {
        updates.push({ collection: 'assignments', id: a.id, changes: { date: targetDate } });
      });

      for (let index = 0; index < updates.length; index += 450) {
        const chunk = updates.slice(index, index + 450);
        const batch = writeBatch(db);
        chunk.forEach((item) => {
          batch.update(doc(db, item.collection, item.id), item.changes);
        });
        await batch.commit();
      }

      setData((prev) => {
        const nextMeetings = (prev.meetings || []).map((m) => {
          if (m.date === sourceDate) return { ...m, date: targetDate };
          return m;
        });
        const nextAssignments = (prev.assignments || []).map((a) => {
          if (a.date === sourceDate) return { ...a, date: targetDate };
          return a;
        });
        return { ...prev, meetings: nextMeetings, assignments: nextAssignments };
      });

      addToast('Deslocamento concluído com sucesso.', 'success');
      return true;
    } catch (error) {
      console.error(error);
      addToast('Erro ao deslocar datas.', 'error');
      return false;
    } finally {
      setIsShiftingDates(false);
    }
  }, [addToast, confirm, db, guardAdminAction, isShiftingDates, meetings, assignments, setData]);

  return {
    handleOpenLatestMeetingsReclassify,
    handleSaveMeetingsReclassify,
    handleUndoMeetingsImport,
    handleWipeMeetingsData,
    handleShiftDate,
    isSavingMeetingsReclassify,
    isUndoingMeetingsImport,
    isWipingMeetingsData,
    isShiftingDates,
    latestMeetingsImportBatch,
    setLastMeetingsImportResult
  };
};
