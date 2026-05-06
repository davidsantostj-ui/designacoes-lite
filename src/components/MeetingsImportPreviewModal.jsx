import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, FileSearch, Link2, SlidersHorizontal, Users, X } from 'lucide-react';

const EXTERNAL_SELECTION = '__external__';

const SECTION_OPTIONS = [
  { key: 'abertura', label: 'Abertura' },
  { key: 'tesouros', label: 'Tesouros da Palavra de Deus' },
  { key: 'ministerio', label: 'Faça Seu Melhor no Ministério' },
  { key: 'vida_crista', label: 'Nossa Vida Cristã' },
  { key: 'encerramento', label: 'Encerramento' }
];

const getRowTone = (row) => {
  if (row.selectedUserId && row.selectedUserId !== EXTERNAL_SELECTION) {
    return 'bg-emerald-100 text-emerald-700';
  }
  if ((row.candidates || []).length > 0) {
    return 'bg-amber-100 text-amber-700';
  }
  return 'bg-slate-100 text-slate-500';
};

const getRowLabel = (row) => {
  if (row.selectedUserId && row.selectedUserId !== EXTERNAL_SELECTION) return 'Vai para a agenda';
  if ((row.candidates || []).length > 0) return 'Somente reunião por enquanto';
  return 'Somente reunião';
};

const getAssignmentOptionsForRow = (row, assignmentTypeOptions = []) => {
  const baseOptions = [...assignmentTypeOptions];
  if (row?.assignmentType && !baseOptions.includes(row.assignmentType)) {
    baseOptions.unshift(row.assignmentType);
  }
  return baseOptions;
};

const MeetingsImportPreviewModal = ({
  state,
  onClose,
  onConfirm,
  onSelectUser,
  onUpdateSection,
  onUpdateOrder,
  onUpdateAssignmentType,
  assignmentTypeOptions,
  formatDatePt
}) => {
  const rows = useMemo(() => state?.rows || [], [state?.rows]);
  const [confirmCustomAgendaTypes, setConfirmCustomAgendaTypes] = useState(false);
  const summary = {
    total: rows.length,
    linked: rows.filter((row) => row.selectedUserId && row.selectedUserId !== EXTERNAL_SELECTION).length,
    external: rows.filter(
      (row) => !row.selectedUserId || row.selectedUserId === EXTERNAL_SELECTION
    ).length,
    ambiguous: rows.filter(
      (row) => (row.candidates || []).length > 0 && row.selectedUserId === EXTERNAL_SELECTION
    ).length,
    existingAgenda: Number(state?.skippedExistingAssignments || 0),
    skipped: Number(state?.skippedExistingMeetings || 0) + Number(state?.skippedCsv || 0)
  };

  const customAgendaRows = useMemo(
    () =>
      rows.filter((row) => {
        const selectedUserId =
          row.selectedUserId && row.selectedUserId !== EXTERNAL_SELECTION ? row.selectedUserId : '';
        if (!selectedUserId) return false;
        const assignmentType = String(row.assignmentType || '').trim();
        return !!assignmentType && !assignmentTypeOptions.includes(assignmentType);
      }),
    [assignmentTypeOptions, rows]
  );

  const customAgendaTypes = useMemo(
    () =>
      [...new Set(customAgendaRows.map((row) => String(row.assignmentType || '').trim()))].filter(
        Boolean
      ),
    [customAgendaRows]
  );

  const customAgendaSignature = useMemo(
    () => customAgendaTypes.join('|'),
    [customAgendaTypes]
  );

  useEffect(() => {
    setConfirmCustomAgendaTypes(false);
  }, [customAgendaSignature, state?.fileName, state?.open]);

  const handleConfirmClick = () => {
    if (customAgendaRows.length > 0 && !confirmCustomAgendaTypes) {
      setConfirmCustomAgendaTypes(true);
      return;
    }

    onConfirm({
      allowCustomAgendaTypes: customAgendaRows.length > 0
    });
  };

  if (!state?.open) return null;

  return (
    <div
      className="fixed inset-0 z-[270] bg-black/50 flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl bg-white dark:bg-navy-900 card-surface rounded-4xl shadow-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto no-scrollbar"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">
              Passo 3
            </p>
            <h3 className="text-lg font-black uppercase tracking-tight mt-1">
              Revisar importação de Reuniões
            </h3>
            <p className="text-sm text-slate-500 mt-2 max-w-[60ch]">
              Revise vínculos, agenda, Seção e Ordem antes de confirmar o lote.
            </p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-3">
              Arquivo: {state.fileName || 'CSV'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="touch-target w-9 h-9 rounded-full bg-slate-100 dark:bg-navy-800 flex items-center justify-center"
          >
            <X size={16} />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
          <div className="bg-slate-50 dark:bg-navy-800 rounded-3xl p-4">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Linhas</p>
            <p className="mt-2 text-2xl font-black dark:text-white">{summary.total}</p>
          </div>
          <div className="bg-slate-50 dark:bg-navy-800 rounded-3xl p-4">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Agenda</p>
            <p className="mt-2 text-2xl font-black text-emerald-600">{summary.linked}</p>
          </div>
          <div className="bg-slate-50 dark:bg-navy-800 rounded-3xl p-4">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">
              Só reunião
            </p>
            <p className="mt-2 text-2xl font-black text-slate-500">{summary.external}</p>
          </div>
          <div className="bg-slate-50 dark:bg-navy-800 rounded-3xl p-4">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Revisar</p>
            <p className="mt-2 text-2xl font-black text-amber-600">{summary.ambiguous}</p>
          </div>
          <div className="bg-slate-50 dark:bg-navy-800 rounded-3xl p-4">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">
              Já na agenda
            </p>
            <p className="mt-2 text-2xl font-black text-blue-600">{summary.existingAgenda}</p>
          </div>
          <div className="bg-slate-50 dark:bg-navy-800 rounded-3xl p-4">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Ignoradas</p>
            <p className="mt-2 text-2xl font-black text-slate-400">{summary.skipped}</p>
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-navy-800 rounded-3xl p-4 border dark:border-slate-800">
          <div className="flex items-center gap-2 text-slate-500">
            <FileSearch size={16} />
            <p className="text-[10px] font-black uppercase tracking-widest">
              Revise nomes com possível vínculo e classificação visual
            </p>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Você pode corrigir o vínculo, o tipo da agenda e a classificação visual antes de
            enviar para todos.
          </p>
        </div>

        {customAgendaRows.length > 0 && (
          <div
            className={`rounded-3xl border p-4 ${
              confirmCustomAgendaTypes
                ? 'border-amber-300 bg-amber-50 text-amber-900'
                : 'border-amber-200 bg-amber-50/70 text-amber-900'
            }`}
          >
            <div className="flex items-start gap-3">
              <AlertTriangle size={16} className="mt-0.5 shrink-0" />
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-widest">
                  Tipos da agenda fora do cadastro
                </p>
                <p className="text-sm font-semibold">
                  {customAgendaRows.length} participações usarão tipos que ainda não estão
                  cadastrados no app.
                </p>
                <p className="text-xs opacity-80">
                  Se você continuar, esses nomes serão importados mesmo assim e aparecerão com o
                  mesmo texto na agenda e em Reuniões.
                </p>
                <p className="text-[11px] font-semibold">
                  {customAgendaTypes.slice(0, 4).join(' | ')}
                  {customAgendaTypes.length > 4 ? ' | ...' : ''}
                </p>
                {confirmCustomAgendaTypes && (
                  <p className="text-xs font-bold">
                    Clique em <span className="uppercase">Importar mesmo assim</span> para
                    confirmar.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {rows.map((row) => (
            <div
              key={row.id}
              className="p-4 rounded-3xl bg-white dark:bg-navy-800 border dark:border-slate-800 shadow-sm"
            >
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[9px] font-black uppercase tracking-widest text-blue-500">
                        {formatDatePt(row.date)}
                      </span>
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                        Linha {row.line}
                      </span>
                      <span
                        className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${getRowTone(
                          row
                        )}`}
                      >
                        {getRowLabel(row)}
                      </span>
                    </div>
                    <p className="mt-2 text-sm font-black dark:text-white">{row.roleLabel}</p>
                    <p className="text-xs text-slate-500 mt-1">{row.participantName}</p>
                    <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      <span className="inline-flex items-center gap-1">
                        <Users size={12} />
                        {row.sectionLabel}
                      </span>
                      {row.selectedUserId && row.selectedUserId !== EXTERNAL_SELECTION && (
                        <span className="inline-flex items-center gap-1">
                          <Link2 size={12} />
                          Vai refletir na agenda
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="w-full lg:w-[280px]">
                    {(row.candidates || []).length > 0 ? (
                      <select
                        value={row.selectedUserId || EXTERNAL_SELECTION}
                        onChange={(e) => onSelectUser(row.id, e.target.value)}
                        className="w-full p-3 bg-slate-50 dark:bg-navy-900 rounded-2xl text-xs font-bold border dark:border-slate-700"
                      >
                        <option value={EXTERNAL_SELECTION}>Somente reunião</option>
                        {row.candidates.map((candidate) => (
                          <option key={candidate.id} value={candidate.id}>
                            {candidate.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="w-full p-3 bg-slate-50 dark:bg-navy-900 rounded-2xl text-xs font-bold border dark:border-slate-700 text-slate-500">
                        {row.selectedUserId && row.selectedUserId !== EXTERNAL_SELECTION
                          ? row.candidateLabel || 'Usuário vinculado'
                          : 'Sem usuário do app vinculado'}
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid gap-3 lg:grid-cols-[1fr_120px_1fr]">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    <span className="inline-flex items-center gap-2 mb-2">
                      <SlidersHorizontal size={12} />
                      Seção
                    </span>
                    <select
                      value={row.sectionKey}
                      onChange={(e) => onUpdateSection(row.syncKey, e.target.value)}
                      className="w-full p-3 bg-slate-50 dark:bg-navy-900 rounded-2xl text-xs font-bold border dark:border-slate-700 text-slate-700 dark:text-slate-200"
                    >
                      {SECTION_OPTIONS.map((section) => (
                        <option key={section.key} value={section.key}>
                          {section.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    <span className="block mb-2">Ordem</span>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={row.designationOrder || 1}
                      onChange={(e) => onUpdateOrder(row.syncKey, e.target.value)}
                      className="w-full p-3 bg-slate-50 dark:bg-navy-900 rounded-2xl text-xs font-bold border dark:border-slate-700 text-slate-700 dark:text-slate-200"
                    />
                  </label>

                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    <span className="block mb-2">Agenda</span>
                    <select
                      value={row.assignmentType || ''}
                      onChange={(e) => onUpdateAssignmentType(row.id, e.target.value)}
                      className="w-full p-3 bg-slate-50 dark:bg-navy-900 rounded-2xl text-xs font-bold border dark:border-slate-700 text-slate-700 dark:text-slate-200"
                    >
                      {getAssignmentOptionsForRow(row, assignmentTypeOptions).map((option) => (
                        <option key={`${row.id}-${option}`} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>
            </div>
          ))}

          {rows.length === 0 && (
            <div className="p-6 rounded-3xl bg-slate-50 dark:bg-navy-800 text-center">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Nada para importar.
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-2 justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-3 rounded-2xl bg-slate-100 dark:bg-navy-800 text-[10px] font-black uppercase tracking-widest"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirmClick}
            className="px-4 py-3 rounded-2xl bg-navy-900 text-white text-[10px] font-black uppercase tracking-widest"
          >
            {customAgendaRows.length > 0 && confirmCustomAgendaTypes
              ? 'Importar mesmo assim'
              : 'Importar agora'}
          </button>
        </div>
      </div>
    </div>
  );
};

export { EXTERNAL_SELECTION };
export default MeetingsImportPreviewModal;
