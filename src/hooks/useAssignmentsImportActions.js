import { useCallback, useState } from 'react';
import { collection, getDocs, orderBy, query, where } from 'firebase/firestore';
import { isMechanicalAssignment, normalizeAssignmentType } from '../utils/assignmentUtils';
import { normalizeCsvDate, parseCsv } from '../utils/csvUtils';
import {
  buildImportedAssignmentKey,
  isMeetingSyncableAssignmentType
} from '../utils/meetingImportUtils.js';
import { EXTERNAL_SELECTION } from '../components/MeetingsImportPreviewModal.jsx';
import { fixMojibake, getUserDisplayName, normalizePersonName } from '../utils/textUtils';

export const EMPTY_ASSIGNMENTS_IMPORT_PREVIEW = {
  open: false,
  fileName: '',
  rows: [],
  ignoredRows: [],
  showInMeetings: true,
  skippedExisting: 0,
  skippedCsv: 0
};

export const EMPTY_CSV_RESOLVE_STATE = {
  open: false,
  rows: [],
  ignoredRows: [],
  baseRows: [],
  fileName: '',
  baseKeys: [],
  baseMechanicalKeys: [],
  existingKeys: [],
  existingMechanicalKeys: [],
  skippedExisting: 0,
  skippedCsv: 0
};

const normalizeStatus = (value) => {
  const normalized = String(value || '')
    .trim()
    .toLowerCase();
  if (normalized === 'confirmado' || normalized === 'confirmada') return 'confirmado';
  if (normalized === 'troca' || normalized === 'permuta') return 'troca';
  return 'pendente';
};

const sortPreviewRows = (rows) =>
  [...(rows || [])].sort((a, b) => {
    const byDate = String(a.date || '').localeCompare(String(b.date || ''));
    if (byDate !== 0) return byDate;
    return Number(a.line || 0) - Number(b.line || 0);
  });

export const useAssignmentsImportActions = ({
  addToast,
  assignments,
  buildAssignmentPayload,
  commitAssignmentsImport,
  db,
  guardAdminAction,
  users
}) => {
  const [isImportingAssignments, setIsImportingAssignments] = useState(false);
  const [csvResolveState, setCsvResolveState] = useState(EMPTY_CSV_RESOLVE_STATE);
  const [assignmentsImportPreview, setAssignmentsImportPreview] = useState(
    EMPTY_ASSIGNMENTS_IMPORT_PREVIEW
  );

  const closeCsvResolve = useCallback(() => {
    setCsvResolveState(EMPTY_CSV_RESOLVE_STATE);
  }, []);

  const closeAssignmentsImportPreview = useCallback(() => {
    setAssignmentsImportPreview(EMPTY_ASSIGNMENTS_IMPORT_PREVIEW);
  }, []);

  const handleToggleAssignmentsImportShowInMeetings = useCallback((value) => {
    setAssignmentsImportPreview((prev) => ({ ...prev, showInMeetings: value }));
  }, []);

  const loadAssignmentsInRange = useCallback(
    async (minDate, maxDate, warningMessage) => {
      if (!minDate || !maxDate) return [];

      try {
        const snap = await getDocs(
          query(
            collection(db, 'assignments'),
            where('date', '>=', minDate),
            where('date', '<=', maxDate),
            orderBy('date')
          )
        );
        return snap.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
      } catch (error) {
        console.error(error);
        addToast(warningMessage, 'warn');
        return (assignments || []).filter(
          (entry) => entry?.date >= minDate && entry?.date <= maxDate
        );
      }
    },
    [addToast, assignments, db]
  );

  const openAssignmentsPreview = useCallback(
    ({ fileName, rows, ignoredRows = [], skippedExisting = 0, skippedCsv = 0 }) => {
      if (!rows.length && !ignoredRows.length) {
        addToast('Nenhuma nova designação para importar.', 'info');
        return false;
      }

      setAssignmentsImportPreview({
        open: true,
        fileName: fileName || 'designacoes.csv',
        rows: sortPreviewRows(rows),
        ignoredRows: sortPreviewRows(ignoredRows),
        showInMeetings: rows.some((row) => row.meetingEligible),
        skippedExisting: Number(skippedExisting || 0),
        skippedCsv: Number(skippedCsv || 0)
      });
      if (ignoredRows.length > 0) {
        addToast(
          `${ignoredRows.length} nome(s) foram ignorados porque ainda não estão no app.`,
          'warn'
        );
      }
      addToast('Revise o lote antes de importar.', 'info');
      return true;
    },
    [addToast]
  );

  const handleImportAssignmentsFile = useCallback(
    async (file) => {
      if (!file || isImportingAssignments) return;
      if (
        !(await guardAdminAction('Apenas administradores podem importar novas designações.'))
      ) {
        return;
      }

      setIsImportingAssignments(true);
      try {
        const text = await file.text();
        const { rows } = parseCsv(text);
        if (!rows.length) {
          addToast('Arquivo CSV vazio.', 'warn');
          return;
        }

        const usersIndex = (users || []).map((entry) => ({
          id: entry.id,
          label: getUserDisplayName(entry),
          norm: normalizePersonName(getUserDisplayName(entry))
        }));
        const usersById = new Map(usersIndex.map((entry) => [entry.id, entry]));
        const usersByName = new Map();
        usersIndex.forEach((entry) => {
          if (!entry.norm) return;
          const list = usersByName.get(entry.norm) || [];
          list.push(entry);
          usersByName.set(entry.norm, list);
        });

        const preparedRows = [];
        let minDate = '';
        let maxDate = '';

        rows.forEach((row, index) => {
          const name = fixMojibake(row.nome || row.name || row.usuario || row.user || '');
          const uid = row.uid || row.usuario_id || row.user_id || row.userid || row.userId || '';
          const task = fixMojibake(row.tarefa || row.tipo || row.designacao || '');
          const date = normalizeCsvDate(row.data || row.date || row.dia || '');
          const status = normalizeStatus(row.status || row.situacao || '');
          const type = normalizeAssignmentType(task);
          if (!date || !type) return;

          if (!minDate || date < minDate) minDate = date;
          if (!maxDate || date > maxDate) maxDate = date;

          preparedRows.push({
            line: index + 2,
            name,
            uid,
            date,
            status,
            type
          });
        });

        if (!preparedRows.length) {
          addToast('Nenhuma linha válida no CSV.', 'warn');
          return;
        }

        const existingAssignments = await loadAssignmentsInRange(
          minDate,
          maxDate,
          'Não foi possível validar duplicatas no banco. Vou comparar com os dados carregados.'
        );

        const existingKeys = new Set();
        const existingMechanicalKeys = new Set();
        existingAssignments.forEach((entry) => {
          const uid = entry?.usuario_id;
          const date = entry?.date;
          const type = normalizeAssignmentType(entry?.tipo_designacao || '');
          if (!uid || !date || !type) return;

          existingKeys.add(buildImportedAssignmentKey(uid, date, type));
          if (isMechanicalAssignment(type)) {
            existingMechanicalKeys.add(`${uid}|${date}`);
          }
        });

        const resolvedRows = [];
        const unresolvedRows = [];
        const ignoredRows = [];
        const baseKeys = new Set();
        const baseMechanicalKeys = new Set();
        let skippedExisting = 0;
        let skippedCsv = 0;
        let skippedMechanicalExisting = 0;
        let skippedMechanicalCsv = 0;

        preparedRows.forEach(({ line, name, uid, date, status, type }) => {
          let matchedUser = null;
          const normalizedName = normalizePersonName(name);
          const nameCandidates = normalizedName ? usersByName.get(normalizedName) || [] : [];

          if (uid) {
            const userById = usersById.get(uid);
            if (userById) matchedUser = userById;
          }

          if (!matchedUser && nameCandidates.length === 1) {
            matchedUser = nameCandidates[0];
          }

          if (matchedUser) {
            const exactKey = buildImportedAssignmentKey(matchedUser.id, date, type);
            const mechanicalKey = `${matchedUser.id}|${date}`;

            if (existingKeys.has(exactKey)) {
              skippedExisting += 1;
              return;
            }
            if (isMechanicalAssignment(type) && existingMechanicalKeys.has(mechanicalKey)) {
              skippedExisting += 1;
              skippedMechanicalExisting += 1;
              return;
            }
            if (baseKeys.has(exactKey)) {
              skippedCsv += 1;
              return;
            }
            if (isMechanicalAssignment(type) && baseMechanicalKeys.has(mechanicalKey)) {
              skippedCsv += 1;
              skippedMechanicalCsv += 1;
              return;
            }

            resolvedRows.push({
              id: `${line}:${matchedUser.id}:${type}`,
              line,
              name: name || matchedUser.label || uid || '',
              userId: matchedUser.id,
              userLabel: matchedUser.label,
              date,
              status,
              type,
              meetingEligible: isMeetingSyncableAssignmentType(type)
            });
            baseKeys.add(exactKey);
            if (isMechanicalAssignment(type)) {
              baseMechanicalKeys.add(mechanicalKey);
            }
            return;
          }

          if (!matchedUser && nameCandidates.length === 0) {
            resolvedRows.push({
              id: `${line}:external:${type}`,
              line,
              name: name || uid || '',
              userId: EXTERNAL_SELECTION,
              userLabel: 'Não cadastrado (apenas na reunião)',
              date,
              status,
              type,
              meetingEligible: isMeetingSyncableAssignmentType(type)
            });
            return;
          }

          if (nameCandidates.length > 1) {
            unresolvedRows.push({
              line,
              name: name || uid || '',
              date,
              status,
              type,
              candidates: nameCandidates
            });
            return;
          }
        });

        if (skippedExisting) {
          addToast(`Duplicatas no banco ignoradas: ${skippedExisting}.`, 'info');
        }
        if (skippedCsv) {
          addToast(`Duplicatas no CSV ignoradas: ${skippedCsv}.`, 'info');
        }
        if (skippedMechanicalExisting) {
          addToast(
            `Tarefas mecânicas ignoradas por conflito no mesmo dia: ${skippedMechanicalExisting}.`,
            'info'
          );
        }
        if (skippedMechanicalCsv) {
          addToast(
            `Tarefas mecânicas duplicadas no CSV ignoradas: ${skippedMechanicalCsv}.`,
            'info'
          );
        }

        if (unresolvedRows.length > 0) {
          setCsvResolveState({
            open: true,
            fileName: file.name || 'designacoes.csv',
            rows: unresolvedRows.map((row, index) => ({
              ...row,
              onSelect: (value) =>
                setCsvResolveState((prev) => ({
                  ...prev,
                  rows: (prev.rows || []).map((entry, entryIndex) =>
                    entryIndex === index ? { ...entry, selectedId: value } : entry
                  )
                }))
            })),
            ignoredRows,
            baseRows: resolvedRows,
            baseKeys: Array.from(baseKeys),
            baseMechanicalKeys: Array.from(baseMechanicalKeys),
            existingKeys: Array.from(existingKeys),
            existingMechanicalKeys: Array.from(existingMechanicalKeys),
            skippedExisting,
            skippedCsv
          });
          addToast('Resolva os nomes pendentes para revisar o lote.', 'warn');
          return;
        }

        openAssignmentsPreview({
          fileName: file.name || 'designacoes.csv',
          rows: resolvedRows,
          ignoredRows,
          skippedExisting,
          skippedCsv
        });
      } catch (error) {
        console.error(error);
        addToast('Erro ao importar CSV.', 'error');
      } finally {
        setIsImportingAssignments(false);
      }
    },
    [
      addToast,
      guardAdminAction,
      isImportingAssignments,
      loadAssignmentsInRange,
      openAssignmentsPreview,
      users
    ]
  );

  const handleConfirmCsvResolve = useCallback(() => {
    const rows = csvResolveState.rows || [];
    if (!rows.length) {
      openAssignmentsPreview({
        fileName: csvResolveState.fileName || 'designacoes.csv',
        rows: csvResolveState.baseRows || [],
        ignoredRows: csvResolveState.ignoredRows || [],
        skippedExisting: Number(csvResolveState.skippedExisting || 0),
        skippedCsv: Number(csvResolveState.skippedCsv || 0)
      });
      closeCsvResolve();
      return;
    }

    const pendingRow = rows.find((row) => !row.selectedId);
    if (pendingRow) {
      addToast('Selecione usuários para todas as linhas.', 'warn');
      return;
    }

    const previewRows = [...(csvResolveState.baseRows || [])];
    const usedKeys = new Set([
      ...(csvResolveState.baseKeys || []),
      ...(csvResolveState.existingKeys || [])
    ]);
    const usedMechanicalKeys = new Set([
      ...(csvResolveState.baseMechanicalKeys || []),
      ...(csvResolveState.existingMechanicalKeys || [])
    ]);
    let skipped = 0;

    rows.forEach((row) => {
      const exactKey = buildImportedAssignmentKey(
        row.selectedId,
        row.payload.date,
        row.payload.type
      );
      const mechanicalKey = `${row.selectedId}|${row.payload.date}`;
      if (usedKeys.has(exactKey)) {
        skipped += 1;
        return;
      }
      if (isMechanicalAssignment(row.payload.type) && usedMechanicalKeys.has(mechanicalKey)) {
        skipped += 1;
        return;
      }

      const selectedUser = (row.candidates || []).find((candidate) => candidate.id === row.selectedId);
      previewRows.push({
        id: `${row.line}:${row.selectedId}:${row.payload.type}`,
        line: row.line,
        name: row.name,
        userId: row.selectedId,
        userLabel: selectedUser?.label || '',
        date: row.payload.date,
        status: row.payload.status,
        type: row.payload.type,
        meetingEligible: row.payload.meetingEligible === true
      });
      usedKeys.add(exactKey);
      if (isMechanicalAssignment(row.payload.type)) {
        usedMechanicalKeys.add(mechanicalKey);
      }
    });

    if (skipped) {
      addToast(`Duplicatas ignoradas: ${skipped}.`, 'info');
    }

    if (
      openAssignmentsPreview({
        fileName: csvResolveState.fileName || 'designacoes.csv',
        rows: previewRows,
        ignoredRows: csvResolveState.ignoredRows || [],
        skippedExisting: Number(csvResolveState.skippedExisting || 0),
        skippedCsv: Number(csvResolveState.skippedCsv || 0) + skipped
      })
    ) {
      closeCsvResolve();
    } else {
      closeCsvResolve();
    }
  }, [addToast, closeCsvResolve, csvResolveState, openAssignmentsPreview]);

  const handleConfirmAssignmentsImport = useCallback(async () => {
    const preview = assignmentsImportPreview;
    const rows = preview?.rows || [];
    if (!rows.length) {
      closeAssignmentsImportPreview();
      return;
    }

    if (
      !(await guardAdminAction('Apenas administradores podem confirmar a importação de designações.'))
    ) {
      return;
    }

    try {
      const minDate = rows.reduce(
        (currentValue, row) => (!currentValue || row.date < currentValue ? row.date : currentValue),
        ''
      );
      const maxDate = rows.reduce(
        (currentValue, row) => (!currentValue || row.date > currentValue ? row.date : currentValue),
        ''
      );

      const freshAssignments = await loadAssignmentsInRange(
        minDate,
        maxDate,
        'Não foi possível validar o período inteiro no banco. Vou comparar com os dados carregados.'
      );

      const usedExactKeys = new Set(
        freshAssignments.map((entry) =>
          buildImportedAssignmentKey(
            entry?.usuario_id,
            entry?.date,
            normalizeAssignmentType(entry?.tipo_designacao || '')
          )
        )
      );
      const usedMechanicalKeys = new Set(
        freshAssignments
          .filter((entry) => isMechanicalAssignment(entry?.tipo_designacao))
          .map((entry) => `${entry.usuario_id}|${entry.date}`)
      );
      const plannedExactKeys = new Set();
      const plannedMechanicalKeys = new Set();
      const safeRows = [];
      let skipped = 0;

      rows.forEach((row) => {
        const isExternal = row.userId === EXTERNAL_SELECTION;
        const mappedUserId = isExternal ? '' : row.userId;
        const exactKey = buildImportedAssignmentKey(mappedUserId, row.date, row.type);
        const mechanicalKey = `${mappedUserId}|${row.date}`;
        
        if (!isExternal) {
          if (usedExactKeys.has(exactKey) || plannedExactKeys.has(exactKey)) {
            skipped += 1;
            return;
          }
          if (
            isMechanicalAssignment(row.type) &&
            (usedMechanicalKeys.has(mechanicalKey) || plannedMechanicalKeys.has(mechanicalKey))
          ) {
            skipped += 1;
            return;
          }
        }

        safeRows.push(row);
        
        if (!isExternal) {
          plannedExactKeys.add(exactKey);
          if (isMechanicalAssignment(row.type)) {
            plannedMechanicalKeys.add(mechanicalKey);
          }
        }
      });

      if (!safeRows.length) {
        addToast('A prévia ficou desatualizada. Revise o lote e tente novamente.', 'warn');
        closeAssignmentsImportPreview();
        return;
      }

      if (skipped > 0) {
        addToast(`Itens ignorados por conflito recente: ${skipped}.`, 'info');
      }

      const nextAssignments = safeRows.map((row) => {
        const isExternal = row.userId === EXTERNAL_SELECTION;
        const mappedUserId = isExternal ? '' : row.userId;
        const payload = buildAssignmentPayload(row.date, mappedUserId, row.type, row.status, {
          showInMeetings: preview.showInMeetings && row.meetingEligible
        });
        if (isExternal) {
          payload.meeting_designation = row.type;
          payload.meeting_assignment_type = normalizeAssignmentType(row.type) || row.type;
          payload.participant_name = row.name;
          payload.source = 'external_assignment';
        }
        return payload;
      });
      const perUserCounts = new Map();
      nextAssignments.forEach((assignment) => {
        if (assignment.usuario_id) {
          perUserCounts.set(
            assignment.usuario_id,
            (perUserCounts.get(assignment.usuario_id) || 0) + 1
          );
        }
      });

      await commitAssignmentsImport(nextAssignments, perUserCounts);
      closeAssignmentsImportPreview();
      addToast('Importação concluída.', 'success');

      if (preview.showInMeetings) {
        const meetingsCount = safeRows.filter((row) => row.meetingEligible).length;
        if (meetingsCount > 0) {
          addToast(`${meetingsCount} designação(ões) também aparecerão em Reuniões.`, 'info');
        }
      }
    } catch (error) {
      console.error(error);
      addToast('Erro ao importar CSV.', 'error');
    }
  }, [
    addToast,
    assignmentsImportPreview,
    buildAssignmentPayload,
    closeAssignmentsImportPreview,
    commitAssignmentsImport,
    guardAdminAction,
    loadAssignmentsInRange
  ]);

  return {
    assignmentsImportPreview,
    closeAssignmentsImportPreview,
    closeCsvResolve,
    csvResolveState,
    handleConfirmAssignmentsImport,
    handleConfirmCsvResolve,
    handleImportAssignmentsFile,
    handleToggleAssignmentsImportShowInMeetings,
    isImportingAssignments
  };
};
