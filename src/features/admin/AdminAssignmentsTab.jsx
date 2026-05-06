import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CalendarClock,
  FileSpreadsheet,
  Pencil,
  Save,
  Sparkles,
  Trash2,
  Users,
  X
} from 'lucide-react';
import {
  ASSIGNMENT_TYPE_GROUPS,
  MECHANICAL_ASSIGNMENT_TYPES,
  SPIRITUAL_ASSIGNMENT_TYPES
} from '../../constants/appConstants';
import { getAssignmentCategoryMeta, isMechanicalAssignment } from '../../utils/assignmentUtils';
import { isMeetingSyncableAssignmentType } from '../../utils/meetingImportUtils';
import ParticipantSelectModal from '../../components/ParticipantSelectModal';

const recentFilters = [
  { id: 'all', label: 'Todas' },
  { id: 'mechanical', label: 'Mecânicas' },
  { id: 'spiritual', label: 'Espirituais' }
];

const statusTone = {
  pendente: 'bg-amber-100 text-amber-700',
  confirmado: 'bg-emerald-100 text-emerald-700',
  troca: 'bg-orange-100 text-orange-700',
  rejeitado: 'bg-rose-100 text-rose-700'
};

const groupDescription = {
  mechanical: 'Microfones, indicadores e áudio/vídeo.',
  spiritual: 'Leitura, presidência, orações e partes espirituais.'
};

const quickActionCardClass =
  'h-full min-h-[92px] rounded-[20px] border border-slate-200 bg-white px-4 py-3 text-left shadow-sm transition-all hover:shadow-md dark:border-slate-800 dark:bg-navy-900';

const buildEmptyEditState = () => ({
  id: '',
  date: '',
  usuario_id: '',
  tipo_designacao: ''
});

const AdminAssignmentsTab = ({
  setAdminTab,
  data,
  assignForm,
  setAssignForm,
  handleCreateAssignment,
  getUserAssignmentsOnDate,
  formatAssignmentLabel,
  canUserTakeAssignment,
  selectedUserAssignments,
  handlePickNextAvailable,
  freeUsersForSelectedDate,
  formatDatePt,
  monthCountsForSelected,
  getUserDisplayName,
  handleDownloadAssignmentsTemplate,
  handleDownloadMechanicalAssignmentsTemplate,
  isImportingAssignments,
  handleImportAssignmentsFile,
  handleDeleteAssignment,
  handleUpdateAssignment
}) => {
  const [recentFilter, setRecentFilter] = useState('all');
  const [editingAssignment, setEditingAssignment] = useState(buildEmptyEditState);
  const [inlineEditingParticipant, setInlineEditingParticipant] = useState(null);
  const [filterUserId, setFilterUserId] = useState('');
  const [filterDateStart, setFilterDateStart] = useState('');
  const [filterDateEnd, setFilterDateEnd] = useState('');
  const [selectedAssignmentIds, setSelectedAssignmentIds] = useState([]);
  const [bulkMoveDate, setBulkMoveDate] = useState('');

  const handleInlineParticipantEdit = useCallback((assignment) => {
    setInlineEditingParticipant({
      assignmentId: assignment.id,
      assignment,
      currentParticipantName: assignment.usuario_id 
        ? getUserDisplayName((data.users || []).find(u => u.id === assignment.usuario_id))
        : assignment.participant_name || 'Não definido'
    });
  }, [data.users, getUserDisplayName]);

  const handleInlineParticipantSave = useCallback(async (selection) => {
    if (!inlineEditingParticipant) return false;
    const success = await handleUpdateAssignment(inlineEditingParticipant.assignmentId, {
      usuario_id: selection.usuario_id,
      participant_name: selection.participant_name
    });
    if (success) {
      setInlineEditingParticipant(null);
    }
    return success;
  }, [inlineEditingParticipant, handleUpdateAssignment]);

  const handleToggleSelectAssignment = useCallback((assignmentId) => {
    setSelectedAssignmentIds(prev => {
      if (prev.includes(assignmentId)) {
        return prev.filter(id => id !== assignmentId);
      }
      return [...prev, assignmentId];
    });
  }, []);

  const handleSelectAllAssignments = useCallback((assignments) => {
    if (selectedAssignmentIds.length === assignments.length) {
      setSelectedAssignmentIds([]);
    } else {
      setSelectedAssignmentIds(assignments.map(a => a.id));
    }
  }, [selectedAssignmentIds]);

  const handleBulkDelete = useCallback(async () => {
    if (selectedAssignmentIds.length === 0) return;
    const confirmed = window.confirm(`Excluir ${selectedAssignmentIds.length} designação(ões)?`);
    if (!confirmed) return;
    
    for (const id of selectedAssignmentIds) {
      await handleDeleteAssignment(id);
    }
    setSelectedAssignmentIds([]);
  }, [selectedAssignmentIds, handleDeleteAssignment]);

  const handleBulkMove = useCallback(async () => {
    if (selectedAssignmentIds.length === 0 || !bulkMoveDate) return;
    for (const id of selectedAssignmentIds) {
      await handleUpdateAssignment(id, { date: bulkMoveDate });
    }
    setSelectedAssignmentIds([]);
    setBulkMoveDate('');
  }, [selectedAssignmentIds, bulkMoveDate, handleUpdateAssignment]);

  useEffect(() => {
    try {
      const saveData = {
        userId: assignForm.userId,
        type: assignForm.type
      };
      localStorage.setItem('lastAssignmentForm', JSON.stringify(saveData));
    } catch {}
  }, [assignForm.userId, assignForm.type]);

  const loadLastAssignmentForm = useCallback(() => {
    try {
      const saved = localStorage.getItem('lastAssignmentForm');
      if (saved) {
        const { userId, type } = JSON.parse(saved);
        if (userId) setAssignForm(prev => ({ ...prev, userId }));
        if (type) setAssignForm(prev => ({ ...prev, type }));
      }
    } catch {}
  }, [setAssignForm]);

  const recentAssignments = useMemo(() => {
    let items = [...(data.assignments || [])];
    
    // Filter by category (existing)
    if (recentFilter === 'spiritual') {
      items = items.filter((entry) => {
        const categoryId = getAssignmentCategoryMeta(entry).id;
        return categoryId === 'spiritual' || categoryId === 'meeting';
      });
    } else if (recentFilter !== 'all') {
      items = items.filter((entry) => getAssignmentCategoryMeta(entry).id === recentFilter);
    }
    
    // Filter by user
    if (filterUserId) {
      items = items.filter((entry) => entry.usuario_id === filterUserId);
    }
    
    // Filter by date range
    if (filterDateStart) {
      items = items.filter((entry) => entry.date >= filterDateStart);
    }
    if (filterDateEnd) {
      items = items.filter((entry) => entry.date <= filterDateEnd);
    }
    
    return items.slice(0, 50);
  }, [data.assignments, recentFilter, filterUserId, filterDateStart, filterDateEnd]);

  const selectedCategoryMeta = assignForm.type
    ? getAssignmentCategoryMeta(assignForm.type)
    : getAssignmentCategoryMeta('Microfone 1');
  const selectedTypeShowsInMeetings = isMeetingSyncableAssignmentType(assignForm.type);
  const selectedMechanicalAssignments = useMemo(
    () =>
      (selectedUserAssignments || []).filter((entry) =>
        isMechanicalAssignment(entry?.tipo_designacao)
      ),
    [selectedUserAssignments]
  );

  const editUsers = useMemo(() => {
    if (!editingAssignment.tipo_designacao) {
      return (data.users || []).filter((entry) => entry.approved);
    }
    return (data.users || []).filter(
      (entry) => entry.approved && canUserTakeAssignment(entry, editingAssignment.tipo_designacao)
    );
  }, [canUserTakeAssignment, data.users, editingAssignment.tipo_designacao]);

  const editingSourceAssignment = useMemo(
    () => (data.assignments || []).find((entry) => entry.id === editingAssignment.id) || null,
    [data.assignments, editingAssignment.id]
  );

  const editTypeGroups = useMemo(() => {
    if (editingSourceAssignment?.source !== 'meeting_import') {
      return ASSIGNMENT_TYPE_GROUPS;
    }

    return ASSIGNMENT_TYPE_GROUPS.map((group) => ({
      ...group,
      types: group.types.filter((type) => isMeetingSyncableAssignmentType(type))
    })).filter((group) => group.types.length > 0);
  }, [editingSourceAssignment]);

  const handleStartEdit = (assignment) => {
    setEditingAssignment({
      id: assignment.id,
      date: assignment.date,
      usuario_id: assignment.usuario_id,
      tipo_designacao: assignment.tipo_designacao
    });
  };

  const handleCancelEdit = () => {
    setEditingAssignment(buildEmptyEditState());
  };

  const handleSaveEdit = async () => {
    if (
      !editingAssignment.id ||
      !editingAssignment.date ||
      !editingAssignment.usuario_id ||
      !editingAssignment.tipo_designacao
    ) {
      return;
    }

    const updated = await handleUpdateAssignment(editingAssignment.id, editingAssignment);
    if (updated) {
      handleCancelEdit();
    }
  };

  return (
    <div className="space-y-5">
      <section className="panel-card space-y-3">
        <div className="space-y-1.5">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">
              Programação manual
            </p>
            <h3 className="mt-1.5 text-lg font-black tracking-tight text-slate-900 dark:text-white">
              Criar, ajustar e revisar designações
            </h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">
              Diferencie rapidamente itens de reunião, mecânicos e espirituais.
            </p>
          </div>
        </div>

        <div className="grid items-stretch gap-2 md:grid-cols-3">
          <button
            type="button"
            onClick={() => setAdminTab('PROG_PUBLISH')}
            className={quickActionCardClass}
          >
            <span className="flex items-start gap-3">
              <Sparkles size={24} strokeWidth={2.2} className="mt-0.5 shrink-0 text-emerald-600" />
              <span className="min-w-0">
                <span className="block text-sm font-black tracking-[0.16em] text-slate-900 dark:text-white">
                Automático
              </span>
                <span className="mt-1 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-300">
                  Prévia e lote
                </span>
              </span>
            </span>
          </button>
          <button
            type="button"
            onClick={() => setAdminTab('PROG_IMPORT')}
            className={quickActionCardClass}
          >
            <span className="flex items-start gap-3">
              <CalendarClock size={24} strokeWidth={2.2} className="mt-0.5 shrink-0 text-violet-600" />
              <span className="min-w-0">
                <span className="block text-sm font-black tracking-[0.16em] text-slate-900 dark:text-white">
                Reuniões
              </span>
                <span className="mt-1 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-300">
                  Importar e revisar
                </span>
              </span>
            </span>
          </button>
          <label className={`${quickActionCardClass} cursor-pointer`}>
            <span className="flex items-start gap-3">
              <FileSpreadsheet size={24} strokeWidth={2.2} className="mt-0.5 shrink-0 text-blue-600" />
              <span className="min-w-0">
                <span className="block text-sm font-black tracking-[0.16em] text-slate-900 dark:text-white">
                CSV de designações
              </span>
                <span className="mt-1 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-300">
                  {isImportingAssignments ? 'Importando arquivo...' : 'Importação em lote'}
                </span>
              </span>
            </span>
            <input
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              disabled={isImportingAssignments}
              onChange={(event) => handleImportAssignmentsFile(event.target.files?.[0])}
            />
          </label>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[1.3fr_0.9fr]">
        <form className="panel-card space-y-4" onSubmit={handleCreateAssignment}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">
                Nova designação
              </p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">
                Somente admins podem gerar novas designações.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={loadLastAssignmentForm}
                className="text-[11px] font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400"
              >
                Carregar últimos valores
              </button>
              <span className={`rounded-full px-3 py-1 text-[10px] font-black ${selectedCategoryMeta.badgeClass}`}>
                {assignForm.type ? selectedCategoryMeta.label : 'Escolha o tipo'}
              </span>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Data
              </span>
              <input
                name="date"
                type="date"
                value={assignForm.date}
                onChange={(event) =>
                  setAssignForm((prev) => ({ ...prev, date: event.target.value }))
                }
                className="soft-input"
                required
              />
            </label>

            <label className="space-y-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Publicador
              </span>
              <select
                name="user"
                value={assignForm.userId}
                onChange={(event) =>
                  setAssignForm((prev) => ({ ...prev, userId: event.target.value }))
                }
                className="soft-select"
                required
              >
                <option value="">Selecione um publicador</option>
                {(data.users || [])
                  .filter(
                    (entry) =>
                      entry.approved &&
                      (!assignForm.type || canUserTakeAssignment(entry, assignForm.type))
                  )
                  .map((entry) => {
                    const dayAssignments = assignForm.date
                      ? getUserAssignmentsOnDate(entry.id, assignForm.date)
                      : [];
                    const suffix =
                      dayAssignments.length === 0
                        ? 'Livre'
                        : `${dayAssignments.length} no dia`;
                    return (
                      <option key={entry.id} value={entry.id}>
                        {getUserDisplayName(entry)} • {suffix}
                      </option>
                    );
                  })}
              </select>
            </label>
          </div>

          <label className="space-y-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Tipo de designação
            </span>
            <select
              name="type"
              value={assignForm.type}
              onChange={(event) =>
                setAssignForm((prev) => {
                  const nextType = event.target.value;
                  return {
                    ...prev,
                    type: nextType,
                    publishToMeetings: isMeetingSyncableAssignmentType(nextType)
                  };
                })
              }
              className="soft-select"
              required
            >
              <option value="">Selecione o tipo</option>
              {ASSIGNMENT_TYPE_GROUPS.map((group) => (
                <optgroup key={group.id} label={group.label}>
                  {group.types.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </label>

          {selectedTypeShowsInMeetings && (
            <label className="flex items-start gap-3 rounded-2xl border border-violet-200 bg-violet-50 px-4 py-3 text-sm text-violet-800">
              <input
                type="checkbox"
                checked={assignForm.publishToMeetings === true}
                onChange={(event) =>
                  setAssignForm((prev) => ({
                    ...prev,
                    publishToMeetings: event.target.checked
                  }))
                }
                className="mt-0.5 h-4 w-4 rounded border-violet-300 text-violet-600 focus:ring-violet-500"
              />
              <span>
                <span className="block font-black">Também mostrar em Reuniões</span>
                <span className="mt-1 block text-[11px] leading-snug text-violet-700">
                  Ao salvar, essa designação de meio de semana também aparecerá na página
                  Reuniões.
                </span>
              </span>
            </label>
          )}

          {assignForm.date && assignForm.userId && (
            <div
              className={`rounded-2xl px-4 py-3 text-sm ${
                isMechanicalAssignment(assignForm.type) && selectedMechanicalAssignments.length
                  ? 'bg-amber-50 text-amber-800'
                  : 'bg-emerald-50 text-emerald-700'
              }`}
            >
              <p className="font-black">
                {selectedUserAssignments.length === 0
                  ? 'Nenhuma outra designação nessa data.'
                  : `Esse publicador já possui ${selectedUserAssignments.length} designação(ões) nessa data.`}
              </p>
              {selectedUserAssignments.length > 0 && (
                <p className="mt-1 text-[11px] font-semibold">
                  Revise antes de salvar para evitar conflito no mesmo dia.
                </p>
              )}
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handlePickNextAvailable}
              disabled={!assignForm.date || freeUsersForSelectedDate.length === 0}
              className="soft-button-secondary disabled:opacity-60"
            >
              <Users size={14} />
              Próximo disponível
            </button>
            <button
              type="button"
              onClick={() =>
                setAssignForm({
                  date: assignForm.date,
                  userId: '',
                  type: '',
                  publishToMeetings: false
                })
              }
              className="soft-button-ghost"
            >
              Limpar seleção
            </button>
          </div>

          <button type="submit" className="soft-button-primary w-full justify-center">
            <Save size={15} />
            Salvar designação
          </button>
        </form>

        <div className="space-y-5">
          <section className="panel-card space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">
                  Disponibilidade
                </p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">
                  Sugestões rápidas para o dia selecionado.
                </p>
              </div>
              {assignForm.date && (
                <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-slate-500">
                  {formatDatePt(assignForm.date)}
                </span>
              )}
            </div>

            {assignForm.date ? (
              <div className="grid gap-2 sm:grid-cols-2">
                {freeUsersForSelectedDate.slice(0, 8).map((entry) => (
                  <button
                    key={entry.id}
                    type="button"
                    onClick={() => setAssignForm((prev) => ({ ...prev, userId: entry.id }))}
                    className="rounded-2xl border border-slate-200 bg-white px-3 py-3 text-left transition-all hover:shadow-sm dark:border-slate-700 dark:bg-navy-900"
                  >
                    <p className="truncate text-sm font-black text-slate-900 dark:text-white">
                      {getUserDisplayName(entry)}
                    </p>
                    <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      {monthCountsForSelected[entry.id] || 0} no mês
                    </p>
                  </button>
                ))}
                {freeUsersForSelectedDate.length === 0 && (
                  <div className="rounded-2xl bg-slate-50 px-4 py-5 text-center text-[11px] font-bold text-slate-500 dark:bg-navy-900 dark:text-slate-300">
                    Todos já estão ocupados nessa data.
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-2xl bg-slate-50 px-4 py-5 text-center text-[11px] font-bold text-slate-500 dark:bg-navy-900 dark:text-slate-300">
                Escolha uma data para ver quem está livre.
              </div>
            )}
          </section>

          <section className="panel-card space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">
                  Importação em lote
                </p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">
                  CSV rápido para designações mecânicas ou espirituais.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleDownloadAssignmentsTemplate}
                  className="soft-button-ghost"
                >
                  Modelo geral
                </button>
                <button
                  type="button"
                  onClick={handleDownloadMechanicalAssignmentsTemplate}
                  className="soft-button-ghost"
                >
                  Modelo mecânicas
                </button>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {[
                {
                  id: 'mechanical',
                  title: 'Mecânicas',
                  description: groupDescription.mechanical,
                  list: MECHANICAL_ASSIGNMENT_TYPES
                },
                {
                  id: 'spiritual',
                  title: 'Espirituais',
                  description: groupDescription.spiritual,
                  list: SPIRITUAL_ASSIGNMENT_TYPES
                }
              ].map((group) => (
                <div
                  key={group.id}
                  className="rounded-2xl bg-slate-50 px-4 py-4 dark:bg-navy-900"
                >
                  <p className="text-xs font-black text-slate-900 dark:text-white">{group.title}</p>
                  <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-300">
                    {group.description}
                  </p>
                  <p className="mt-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    {group.list.length} tipos
                  </p>
                </div>
              ))}
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-300">
              Colunas aceitas: `uid` opcional, `nome`, `tarefa`, `data`, `status`. O CSV agora
              abre uma prévia antes de confirmar o envio.
            </p>
          </section>
        </div>
      </div>

      <section className="panel-card space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">
              Últimas designações
            </p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">
              Edite o responsável, a data ou o tipo sem sair desta tela.
            </p>
          </div>

          <div className="grid w-full grid-cols-3 gap-2 md:w-[420px]">
            {recentFilters.map((filter) => (
              <button
                key={filter.id}
                type="button"
                onClick={() => setRecentFilter(filter.id)}
                className={`w-full justify-center ${
                  recentFilter === filter.id ? 'chip-toggle chip-toggle-active' : 'chip-toggle'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
          
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <label className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">
                Publicador
              </span>
              <select
                value={filterUserId}
                onChange={(e) => setFilterUserId(e.target.value)}
                className="soft-select text-sm"
              >
                <option value="">Todos</option>
                {(data.users || [])
                  .filter(u => u.approved)
                  .sort((a, b) => getUserDisplayName(a).localeCompare(getUserDisplayName(b)))
                  .map(u => (
                    <option key={u.id} value={u.id}>{getUserDisplayName(u)}</option>
                  ))}
              </select>
            </label>
            
            <label className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">
                Data inicial
              </span>
              <input
                type="date"
                value={filterDateStart}
                onChange={(e) => setFilterDateStart(e.target.value)}
                className="soft-input text-sm"
              />
            </label>
            
            <label className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">
                Data final
              </span>
              <input
                type="date"
                value={filterDateEnd}
                onChange={(e) => setFilterDateEnd(e.target.value)}
                className="soft-input text-sm"
              />
            </label>
          </div>
          
{(filterUserId || filterDateStart || filterDateEnd) && (
            <button
              type="button"
              onClick={() => {
                setFilterUserId('');
                setFilterDateStart('');
                setFilterDateEnd('');
              }}
              className="text-[11px] font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400"
            >
              Limpar filtros
            </button>
          )}

          {selectedAssignmentIds.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-3 p-3 rounded-2xl bg-blue-50 dark:bg-blue-900/20">
              <span className="text-[11px] font-bold text-blue-700 dark:text-blue-200">
                {selectedAssignmentIds.length} selecionada(s)
              </span>
              <button
                type="button"
                onClick={() => handleSelectAllAssignments(recentAssignments)}
                className="text-[11px] font-bold text-blue-600 hover:text-blue-700"
              >
                {selectedAssignmentIds.length === recentAssignments.length ? 'Desmarcar todos' : 'Selecionar todos'}
              </button>
              <button
                type="button"
                onClick={handleBulkDelete}
                className="soft-button-danger text-[11px] py-1.5"
              >
                Excluir selecionadas
              </button>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={bulkMoveDate}
                  onChange={(e) => setBulkMoveDate(e.target.value)}
                  className="soft-input text-[11px] py-1.5"
                />
                <button
                  type="button"
                  onClick={handleBulkMove}
                  disabled={!bulkMoveDate}
                  className="soft-button-secondary text-[11px] py-1.5 disabled:opacity-50"
                >
                  Mover para data
                </button>
              </div>
            </div>
          )}
        </div>
        
<div className="space-y-3">
          {recentAssignments.length > 0 && (
            <div className="flex items-center gap-2 px-4">
              <input
                type="checkbox"
                checked={selectedAssignmentIds.length === recentAssignments.length}
                onChange={() => handleSelectAllAssignments(recentAssignments)}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-[11px] font-bold text-slate-500">
                Selecionar todos ({recentAssignments.length})
              </span>
            </div>
          )}
          
          {recentAssignments.map((assignment) => {
            const assignedUser = (data.users || []).find((entry) => entry.id === assignment.usuario_id);
            const categoryMeta = getAssignmentCategoryMeta(assignment);
            const isEditing = editingAssignment.id === assignment.id;
            const isSelected = selectedAssignmentIds.includes(assignment.id);

            return (
              <div
                key={assignment.id}
                className={`rounded-[24px] border bg-white px-4 py-4 shadow-sm dark:border-slate-800 dark:bg-navy-900 ${
                  isSelected ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20' : 'border-slate-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleToggleSelectAssignment(assignment.id)}
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  
                  <div className="flex-1">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[10px] font-black uppercase tracking-[0.24em] text-blue-600">
                            {formatDatePt(assignment.date)}
                          </span>
                          <span className={`rounded-full px-3 py-1 text-[10px] font-black ${categoryMeta.badgeClass}`}>
                            {categoryMeta.label}
                          </span>
                          <span
                            className={`rounded-full px-3 py-1 text-[10px] font-black uppercase ${
                              statusTone[assignment.status] || 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {assignment.status}
                          </span>
                        </div>
                        <p className="text-base font-black text-slate-900 dark:text-white">
                          {formatAssignmentLabel(assignment.tipo_designacao)}
                        </p>
                        <button
                          type="button"
                          onClick={() => handleInlineParticipantEdit(assignment)}
                          className={`text-sm font-semibold transition-colors text-left ${
                            assignment.usuario_id
                              ? 'text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300'
                              : 'text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300'
                          }`}
                        >
                          {assignment.usuario_id
                            ? getUserDisplayName(assignedUser)
                            : assignment.participant_name || 'Não definido'}
                        </button>
                        {assignment.source === 'meeting_import' && (
                          <p className="text-[11px] font-semibold text-violet-600">
                            Gerada a partir da página de reuniões.
                          </p>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {!isEditing && (
                          <button
                            type="button"
                            onClick={() => handleStartEdit(assignment)}
                            className="soft-button-secondary"
                          >
                            <Pencil size={14} />
                            Editar
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDeleteAssignment(assignment.id)}
                          className="soft-button-danger"
                        >
                          <Trash2 size={14} />
                          Excluir
                        </button>
                      </div>
                    </div>

                    {isEditing && (
                      <div className="mt-4 grid gap-3 rounded-[22px] bg-slate-50 p-4 dark:bg-navy-800">
                        {editingSourceAssignment?.source === 'meeting_import' && (
                          <div className="rounded-2xl border border-violet-200 bg-violet-50 px-4 py-3 text-[11px] font-semibold text-violet-800">
                            Ajuste espiritual sincronizado: ao salvar, a Agenda e a página Reuniões serão
                            corrigidas juntas.
                          </div>
                        )}

                        <div className="grid gap-3 md:grid-cols-3">
                          <input
                            type="date"
                            value={editingAssignment.date}
                            onChange={(event) =>
                              setEditingAssignment((prev) => ({ ...prev, date: event.target.value }))
                            }
                            className="soft-input"
                          />
                          <select
                            value={editingAssignment.tipo_designacao}
                            onChange={(event) =>
                              setEditingAssignment((prev) => ({
                                ...prev,
                                tipo_designacao: event.target.value
                              }))}
                            className="soft-select"
                          >
                            <option value="">Selecione o tipo</option>
                            {editTypeGroups.map((group) => (
                              <optgroup key={group.key} label={group.title}>
                                {group.types.map((type) => (
                                  <option key={type} value={type}>{type}</option>
                                ))}
                              </optgroup>
                            ))}
                          </select>
                          <select
                            value={editingAssignment.usuario_id}
                            onChange={(event) =>
                              setEditingAssignment((prev) => ({
                                ...prev,
                                usuario_id: event.target.value
                              }))}
                            className="soft-select"
                          >
                            <option value="">Selecione um publicador</option>
                            {editUsers.map((entry) => (
                              <option key={entry.id} value={entry.id}>
                                {getUserDisplayName(entry)}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={handleSaveEdit}
                            className="soft-button-primary"
                          >
                            <Save size={14} />
                            Salvar alterações
                          </button>
                          <button
                            type="button"
                            onClick={handleCancelEdit}
                            className="soft-button-ghost"
                          >
                            <X size={14} />
                            Cancelar
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {recentAssignments.length === 0 && (
            <div className="rounded-[24px] bg-slate-50 px-4 py-6 text-center text-sm font-semibold text-slate-500 dark:bg-navy-900 dark:text-slate-300">
              Nenhuma designação encontrada nesse filtro.
            </div>
          )}
        </div>
      </section>
      
      <ParticipantSelectModal
        isOpen={!!inlineEditingParticipant}
        onClose={() => setInlineEditingParticipant(null)}
        onSelect={handleInlineParticipantSave}
        users={data.users || []}
        currentParticipantName={inlineEditingParticipant?.currentParticipantName}
        assignmentType={inlineEditingParticipant?.assignment?.tipo_designacao}
        canUserTakeAssignment={canUserTakeAssignment}
        getUserDisplayName={getUserDisplayName}
        formatDatePt={formatDatePt}
        assignmentDate={inlineEditingParticipant?.assignment?.date}
      />
    </div>
  );
};

export default AdminAssignmentsTab;
