import React, { useCallback, useState } from 'react';
import { createDataProvider } from '../services/dataProvider';
import { normalizeAssignmentType } from '../utils/assignmentUtils';
import { normalizeCsvDate, parseCsv } from '../utils/csvUtils';
import {
  buildImportedAssignmentKey,
  buildMeetingBatchLabel,
  buildMeetingEntryKey,
  buildMeetingSyncKey,
  getMeetingAgendaAssignmentType,
  getMeetingDesignationOrder,
  getMeetingRoleLabel,
  getMeetingSectionMeta,
  getMeetingSectionMetaFromValue,
  isMeetingJewelsDesignation,
  normalizeKeyText,
  sortMeetingPreviewRows
} from '../utils/meetingImportUtils.js';
import { normalizePersonName } from '../utils/textUtils';

export const EMPTY_MEETINGS_IMPORT_PREVIEW = {
  open: false,
  fileName: '',
  minDate: '',
  maxDate: '',
  rows: [],
  existingAssignmentKeys: [],
  skippedExistingMeetings: 0,
  skippedExistingAssignments: 0,
  skippedCsv: 0
};

export const useMeetingsImportActions = ({
  addToast,
  assignments,
  assignmentTypes,
  buildAssignmentPayload,
  canUserTakeAssignment,
  closeMeetingsImportPreview,
  commitMeetingsImport,
  db,
  externalSelectionValue,
  getUserDisplayName,
  guardAdminAction,
  meetings,
  meetingsImportPreview,
  setMeetingsImportPreview,
  setLastMeetingsImportResult,
  userId,
  users
}) => {
  const [isImportingMeetings, setIsImportingMeetings] = useState(false);

  const handleSelectMeetingsPreviewUser = useCallback((rowId, value) => {
    setMeetingsImportPreview((prev) => ({
      ...prev,
      rows: (prev.rows || []).map((row) =>
        row.id === rowId ? { ...row, selectedUserId: value } : row
      )
    }));
  }, [setMeetingsImportPreview]);

  const handleUpdateMeetingsPreviewSection = useCallback((syncKey, sectionKey) => {
    setMeetingsImportPreview((prev) => {
      const currentRow = (prev.rows || []).find((row) => row.syncKey === syncKey);
      const sectionMeta = getMeetingSectionMetaFromValue(sectionKey, currentRow?.designation || '');
      return {
        ...prev,
        rows: sortMeetingPreviewRows(
          (prev.rows || []).map((row) =>
            row.syncKey === syncKey
              ? {
                  ...row,
                  sectionKey: sectionMeta.key,
                  sectionLabel: sectionMeta.label,
                  sectionOrder: sectionMeta.order,
                  assignmentType: getMeetingAgendaAssignmentType({
                    designation: row.designation,
                    roleType: row.roleType,
                    sectionKey: sectionMeta.key,
                    roleLabel: row.roleLabel,
                    hasAssistant: row.hasAssistant === true
                  }),
                  designationOrder: getMeetingDesignationOrder(
                    row.designation,
                    sectionMeta.key,
                    row.line
                  )
                }
              : row
          )
        )
      };
    });
  }, [setMeetingsImportPreview]);

  const handleUpdateMeetingsPreviewOrder = useCallback((syncKey, value) => {
    setMeetingsImportPreview((prev) => ({
      ...prev,
      rows: sortMeetingPreviewRows(
        (prev.rows || []).map((row) =>
          row.syncKey === syncKey
            ? {
                ...row,
                designationOrder: isMeetingJewelsDesignation(row.designation)
                  ? 2
                  : Math.max(1, Number(value || 1))
              }
            : row
        )
      )
    }));
  }, [setMeetingsImportPreview]);

  const handleUpdateMeetingsPreviewAssignmentType = useCallback((rowId, value) => {
    const nextType = normalizeAssignmentType(value) || value;
    setMeetingsImportPreview((prev) => ({
      ...prev,
      rows: (prev.rows || []).map((row) =>
        row.id === rowId ? { ...row, assignmentType: nextType } : row
      )
    }));
  }, [setMeetingsImportPreview]);

  const handleImportMeetingsFile = useCallback(
    async (file) => {
      if (!file) return;
      if (isImportingMeetings) return;
      if (!(await guardAdminAction('Apenas administradores podem importar programação de reuniões.'))) {
        return;
      }

      setIsImportingMeetings(true);
      try {
        const text = await file.text();
        const { headers, rows } = parseCsv(text);
        if (!rows.length) {
          addToast('Arquivo CSV vazio.', 'warn');
          return;
        }

        const hasDateColumn = headers.includes('data') || headers.includes('date') || headers.includes('dia');
        const hasDesignationColumn =
          headers.includes('designacao') ||
          headers.includes('designação') ||
          headers.includes('tarefa') ||
          headers.includes('tipo');
        const hasSectionColumn =
          headers.includes('secao') ||
          headers.includes('seção') ||
          headers.includes('section');
        const hasOrderColumn = headers.includes('ordem') || headers.includes('order');
        const hasPrincipalColumn = headers.includes('principal') || headers.includes('nome');
        const hasAssistantColumn =
          headers.includes('ajudante_leitor') ||
          headers.includes('ajudante/leitor') ||
          headers.includes('ajudante leitor') ||
          headers.includes('ajudante') ||
          headers.includes('assistente_leitor') ||
          headers.includes('assistente/leitor') ||
          headers.includes('assistente leitor') ||
          headers.includes('assistente') ||
          headers.includes('leitor');

        if (!hasDateColumn || !hasDesignationColumn || !hasPrincipalColumn || !hasAssistantColumn) {
          addToast(
            'CSV fora do modelo esperado. Baixe o modelo de Reuniões e exporte novamente.',
            'warn'
          );
          return;
        }

        const usersIndex = (users || []).map((entry) => ({
          id: entry.id,
          label: getUserDisplayName(entry),
          norm: normalizePersonName(getUserDisplayName(entry))
        }));
        const usersByName = new Map();
        usersIndex.forEach((entry) => {
          if (!entry.norm) return;
          const list = usersByName.get(entry.norm) || [];
          list.push(entry);
          usersByName.set(entry.norm, list);
        });

        const preparedEntries = [];
        let minDate = '';
        let maxDate = '';

        const pushPreparedEntry = (
          date,
          designation,
          participantName,
          roleType,
          line,
          rawSection = '',
          rawOrder = '',
          hasAssistant = false
        ) => {
          const cleanName = String(participantName || '').trim();
          const cleanDesignation = String(designation || '').trim();
          if (!date || !cleanDesignation || !cleanName) return;

          const sectionMeta = rawSection
            ? getMeetingSectionMetaFromValue(rawSection, cleanDesignation)
            : getMeetingSectionMeta(cleanDesignation);
          const parsedOrder = Number(rawOrder);
          const hasForcedPlacement = isMeetingJewelsDesignation(cleanDesignation);

          preparedEntries.push({
            id: `${line}_${roleType}_${normalizePersonName(cleanName)}_${normalizeKeyText(cleanDesignation)}`,
            syncKey: buildMeetingSyncKey({ date, designation: cleanDesignation, line }),
            line,
            date,
            designation: cleanDesignation,
            roleType,
            roleLabel: getMeetingRoleLabel(cleanDesignation, roleType),
            designationOrder:
              !hasForcedPlacement && Number.isFinite(parsedOrder) && parsedOrder > 0
                ? parsedOrder
                : getMeetingDesignationOrder(cleanDesignation, sectionMeta.key, line),
            roleOrder: roleType === 'assistente_leitor' ? 2 : 1,
            participantName: cleanName,
            participantNorm: normalizePersonName(cleanName),
            hasAssistant,
            sectionKey: sectionMeta.key,
            sectionLabel: sectionMeta.label,
            sectionOrder: sectionMeta.order
          });
        };

        rows.forEach((row, index) => {
          const date = normalizeCsvDate(row.data || row.date || row.dia || '');
          const rawSection = row.secao || row['seção'] || row.section || '';
          const rawOrder = row.ordem || row.order || '';
          const designationAlt = row['designação'] || '';
          const assistantName =
            row.ajudante_leitor ||
            row['ajudante/leitor'] ||
            row['ajudante leitor'] ||
            row.ajudante ||
            row.assistente_leitor ||
            row['assistente/leitor'] ||
            row['assistente leitor'] ||
            row.assistente ||
            row.leitor ||
            '';
          const designation = row.designacao || row.tarefa || row.tipo || designationAlt || '';
          if (!date || !designation) return;
          if (!minDate || date < minDate) minDate = date;
          if (!maxDate || date > maxDate) maxDate = date;

          pushPreparedEntry(
            date,
            designation || designationAlt,
            row.principal || row.nome || '',
            'principal',
            index + 2,
            rawSection,
            rawOrder,
            Boolean(String(assistantName || '').trim())
          );
          pushPreparedEntry(
            date,
            designation || designationAlt,
            assistantName,
            'assistente_leitor',
            index + 2,
            rawSection,
            rawOrder,
            Boolean(String(assistantName || '').trim())
          );
        });

        if (!preparedEntries.length) {
          addToast('Nenhuma linha válida para Reuniões.', 'warn');
          return;
        }

        const existingMeetingKeys = new Set();
        const existingAssignmentKeys = new Set();

        const collectMeetingKey = (entry) => {
          if (!entry?.date || !entry?.designation || !entry?.participant_name) return;
          existingMeetingKeys.add(
            buildMeetingEntryKey({
              date: entry.date,
              designation: entry.designation,
              participantName: entry.participant_name,
              roleType: entry.role_type || 'principal'
            })
          );
        };

        const collectAssignmentKey = (entry) => {
          if (!entry?.usuario_id || !entry?.date || !entry?.tipo_designacao) return;
          existingAssignmentKeys.add(
            buildImportedAssignmentKey(entry.usuario_id, entry.date, entry.tipo_designacao)
          );
          if (entry?.source === 'meeting_import' && entry?.meeting_designation) {
            existingAssignmentKeys.add(
              buildImportedAssignmentKey(
                entry.usuario_id,
                entry.date,
                getMeetingAgendaAssignmentType({
                  designation: entry.meeting_designation,
                  roleType: entry.meeting_role_type || 'principal',
                  roleLabel: entry.tipo_designacao,
                  hasAssistant: entry.meeting_has_assistant === true
                })
              )
            );
          }
        };

        if (minDate && maxDate) {
          try {
            const snap = await getDocs(
              query(
                collection(db, 'meetings'),
                where('date', '>=', minDate),
                where('date', '<=', maxDate),
                orderBy('date')
              )
            );
            snap.forEach((docSnap) => collectMeetingKey(docSnap.data()));
          } catch (error) {
            console.error(error);
            (meetings || []).forEach((entry) => collectMeetingKey(entry));
          }

          try {
            const snap = await getDocs(
              query(
                collection(db, 'assignments'),
                where('date', '>=', minDate),
                where('date', '<=', maxDate),
                orderBy('date')
              )
            );
            snap.forEach((docSnap) => collectAssignmentKey(docSnap.data()));
          } catch (error) {
            console.error(error);
            (assignments || []).forEach((entry) => collectAssignmentKey(entry));
          }
        }

        const queuedMeetingKeys = new Set();
        const previewRows = [];
        let skippedExistingMeetings = 0;
        let skippedExistingAssignments = 0;
        let skippedCsv = 0;

        preparedEntries.forEach((entry) => {
          const meetingKey = buildMeetingEntryKey(entry);
          if (existingMeetingKeys.has(meetingKey)) {
            skippedExistingMeetings += 1;
            return;
          }
          if (queuedMeetingKeys.has(meetingKey)) {
            skippedCsv += 1;
            return;
          }
          queuedMeetingKeys.add(meetingKey);

          const normalizedName = normalizePersonName(entry.participantName);
          const candidates = normalizedName ? usersByName.get(normalizedName) || [] : [];
          const matchedUser = candidates.length === 1 ? candidates[0] : null;
          const assignmentType = getMeetingAgendaAssignmentType({
            designation: entry.designation,
            roleType: entry.roleType,
            sectionKey: entry.sectionKey,
            roleLabel: entry.roleLabel,
            hasAssistant: entry.hasAssistant === true
          });

          if (matchedUser) {
            const assignmentKey = buildImportedAssignmentKey(
              matchedUser.id,
              entry.date,
              assignmentType
            );
            if (existingAssignmentKeys.has(assignmentKey)) {
              skippedExistingAssignments += 1;
            }
          }

          previewRows.push({
            ...entry,
            participantNorm: normalizedName,
            candidates,
            candidateLabel: matchedUser?.label || '',
            assignmentType,
            hasExplicitSection: hasSectionColumn,
            hasExplicitOrder: hasOrderColumn,
            selectedUserId: matchedUser?.id || externalSelectionValue
          });
        });

        if (!previewRows.length) {
          addToast('Nenhuma nova participação para importar.', 'info');
          return;
        }

        setMeetingsImportPreview({
          open: true,
          fileName: file.name || 'reunioes.csv',
          minDate,
          maxDate,
          rows: sortMeetingPreviewRows(previewRows),
          existingAssignmentKeys: Array.from(existingAssignmentKeys),
          skippedExistingMeetings,
          skippedExistingAssignments,
          skippedCsv
        });

        addToast('Prévia de importação pronta para revisão.', 'info');
      } catch (error) {
        console.error(error);
        if (error?.code === 'permission-denied') {
          addToast(
            'Sem permissão para salvar Reuniões. Publique as regras do Firestore antes de importar.',
            'error'
          );
        } else {
          addToast('Erro ao importar Reuniões.', 'error');
        }
      } finally {
        setIsImportingMeetings(false);
      }
    },
    [
      addToast,
      assignments,
      db,
      externalSelectionValue,
      getUserDisplayName,
      guardAdminAction,
      isImportingMeetings,
      meetings,
      setMeetingsImportPreview,
      users
    ]
  );

  const handleConfirmMeetingsImport = useCallback(
    async (options = {}) => {
      const preview = meetingsImportPreview;
      const rows = preview?.rows || [];
      if (!rows.length) {
        closeMeetingsImportPreview();
        return;
      }
      if (isImportingMeetings) return;
      if (!(await guardAdminAction('Apenas administradores podem confirmar importações de reuniões.'))) {
        return;
      }

      const invalidAgendaRows = rows.filter((row) => {
        const selectedUserId =
          row.selectedUserId && row.selectedUserId !== externalSelectionValue ? row.selectedUserId : '';
        if (!selectedUserId) return false;
        const normalizedType = normalizeAssignmentType(row.assignmentType || '');
        return !normalizedType || !assignmentTypes.includes(normalizedType);
      });

      if (invalidAgendaRows.length > 0 && options.allowCustomAgendaTypes !== true) {
        addToast('Ha tipos da agenda fora do cadastro. Revise ou use "Importar mesmo assim".', 'warn');
        return;
      }

      const ineligibleAgendaRows = rows.filter((row) => {
        const selectedUserId =
          row.selectedUserId && row.selectedUserId !== externalSelectionValue ? row.selectedUserId : '';
        if (!selectedUserId) return false;
        const normalizedType = normalizeAssignmentType(row.assignmentType || '');
        const matchedUser = (users || []).find((entry) => entry.id === selectedUserId);
        return !!matchedUser && !canUserTakeAssignment(matchedUser, normalizedType);
      });

      if (ineligibleAgendaRows.length > 0) {
        addToast(
          'Há vínculos com usuários que não estão habilitados para a designação escolhida.',
          'warn'
        );
        return;
      }

      setIsImportingMeetings(true);
      try {
        const batchId = `meetings_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        const importedAtMs = Date.now();
        const batchLabel = buildMeetingBatchLabel(preview.minDate, preview.maxDate);
        const existingAssignmentKeys = new Set(preview.existingAssignmentKeys || []);
        const queuedAssignmentKeys = new Set();
        const meetingPayloads = [];
        const assignmentPayloads = [];
        let linkedCount = 0;
        let externalCount = 0;
        let ambiguousCount = 0;
        let skippedExistingAssignments = Number(preview.skippedExistingAssignments || 0);

        rows.forEach((row) => {
          const selectedUserId =
            row.selectedUserId && row.selectedUserId !== externalSelectionValue ? row.selectedUserId : '';
          const hasCandidates = (row.candidates || []).length > 0;
          const matchState = selectedUserId ? 'linked' : hasCandidates ? 'ambiguous' : 'external';
          const normalizedAssignmentType = normalizeAssignmentType(row.assignmentType || '');
          const assignmentType = normalizedAssignmentType || row.assignmentType || row.roleLabel;
          const keepCustomAgendaLabel =
            !!assignmentType && !assignmentTypes.includes(normalizedAssignmentType);
          const meetingDesignation =
            keepCustomAgendaLabel && row.assignmentType ? row.assignmentType : row.designation;
          const sortKey = [
            row.date,
            String(row.sectionOrder || 99).padStart(2, '0'),
            String(row.designationOrder || 999).padStart(4, '0'),
            String(row.line || 999).padStart(4, '0'),
            String(row.roleOrder || 99).padStart(2, '0'),
            normalizeKeyText(row.participantName)
          ].join('|');

          meetingPayloads.push({
            date: row.date,
            designation: meetingDesignation,
            sync_key: row.syncKey,
            section_key: row.sectionKey,
            section_label: row.sectionLabel,
            section_order: row.sectionOrder,
            designation_order: row.designationOrder || 999,
            role_type: row.roleType,
            role_label: row.roleLabel,
            assignment_type: assignmentType,
            role_order: row.roleOrder,
            participant_name: row.participantName,
            participant_name_norm: row.participantNorm || normalizePersonName(row.participantName),
            user_id: selectedUserId,
            match_state: matchState,
            import_source: 'meetings_csv',
            import_file_name: preview.fileName || '',
            import_line: row.line,
            import_batch_id: batchId,
            import_batch_label: batchLabel,
            imported_at_ms: importedAtMs,
            sort_key: sortKey,
            created_at: serverTimestamp(),
            created_by: userId || ''
          });

          if (selectedUserId) {
            linkedCount += 1;
            const assignmentKey = buildImportedAssignmentKey(selectedUserId, row.date, assignmentType);
            if (existingAssignmentKeys.has(assignmentKey) || queuedAssignmentKeys.has(assignmentKey)) {
              skippedExistingAssignments += 1;
              return;
            }
            queuedAssignmentKeys.add(assignmentKey);
            assignmentPayloads.push({
              ...buildAssignmentPayload(row.date, selectedUserId, assignmentType, 'confirmado', {
                participantName: row.participantName
              }),
              source: 'meeting_import',
              allowSwap: false,
              meeting_role_type: row.roleType,
              meeting_role_label: row.roleLabel,
              meeting_designation: meetingDesignation,
              meeting_assignment_type: assignmentType,
              meeting_sync_key: row.syncKey,
              meeting_import_line: row.line,
              meeting_has_assistant: row.hasAssistant === true,
              import_batch_id: batchId,
              import_batch_label: batchLabel,
              imported_at_ms: importedAtMs
            });
            return;
          }

          if (matchState === 'ambiguous') ambiguousCount += 1;
          else externalCount += 1;
        });

        if (!meetingPayloads.length) {
          addToast('Nenhuma nova participação para importar.', 'info');
          closeMeetingsImportPreview();
          return;
        }

        await commitMeetingsImport(meetingPayloads, assignmentPayloads);

        setLastMeetingsImportResult({
          batchId,
          batchLabel,
          importedAtMs,
          meetingsCount: meetingPayloads.length,
          assignmentsCount: assignmentPayloads.length,
          linkedCount,
          externalCount,
          ambiguousCount
        });
        closeMeetingsImportPreview();

        addToast(`Importação de Reuniões concluída: ${meetingPayloads.length}.`, 'success');
        if (assignmentPayloads.length > 0) {
          addToast(`${assignmentPayloads.length} participação(ões) entrou(aram) na agenda.`, 'info');
        }
        if (externalCount > 0) {
          addToast(`${externalCount} participação(ões) ficou(aram) só em Reuniões.`, 'info');
        }
        if (ambiguousCount > 0) {
          addToast(`${ambiguousCount} nome(s) ficaram com possível vínculo.`, 'warn');
        }
        if (skippedExistingAssignments > 0) {
          addToast(`Designações já existentes ignoradas: ${skippedExistingAssignments}.`, 'info');
        }
      } catch (error) {
        console.error(error);
        if (error?.code === 'permission-denied') {
          addToast('Sem permissão para salvar Reuniões. Verifique as regras do Firestore.', 'error');
        } else {
          addToast('Erro ao confirmar a importação de Reuniões.', 'error');
        }
      } finally {
        setIsImportingMeetings(false);
      }
    },
    [
      addToast,
      assignmentTypes,
      buildAssignmentPayload,
      canUserTakeAssignment,
      closeMeetingsImportPreview,
      commitMeetingsImport,
      externalSelectionValue,
      guardAdminAction,
      isImportingMeetings,
      meetingsImportPreview,
      setLastMeetingsImportResult,
      userId,
      users
    ]
  );

  return {
    handleConfirmMeetingsImport,
    handleImportMeetingsFile,
    handleSelectMeetingsPreviewUser,
    handleUpdateMeetingsPreviewAssignmentType,
    handleUpdateMeetingsPreviewOrder,
    handleUpdateMeetingsPreviewSection,
    isImportingMeetings
  };
};
