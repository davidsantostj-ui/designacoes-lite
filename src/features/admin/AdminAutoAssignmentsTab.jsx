import React, { useMemo } from 'react';
import { CalendarDays, CheckSquare, Sparkles, Wand2 } from 'lucide-react';
import { ASSIGNMENT_TYPE_GROUPS } from '../../constants/appConstants';
import { getMonthDates } from '../../utils/dateUtils';
import { isMeetingSyncableAssignmentType } from '../../utils/meetingImportUtils';

const weekdayLabel = (dateStr) =>
  new Date(`${dateStr}T12:00:00`)
    .toLocaleDateString('pt-BR', { weekday: 'short' })
    .replace('.', '')
    .slice(0, 3);

const presetButtonClass = 'chip-toggle';

const AdminAutoAssignmentsTab = ({
  autoAssignForm,
  setAutoAssignForm,
  autoAssignPreview,
  isGeneratingAutoAssignments,
  isSavingAutoAssignments,
  handleGenerateAutoAssignmentsPreview,
  handleSaveAutoAssignments,
  data,
  getUserDisplayName,
  formatDatePt,
  formatAssignmentLabel
}) => {
  const monthDates = useMemo(() => getMonthDates(autoAssignForm.month), [autoAssignForm.month]);

  const groupedPreview = useMemo(() => {
    if (!autoAssignPreview) return [];
    const byDate = new Map();
    autoAssignPreview.selectedDates.forEach((date) => {
      byDate.set(date, { date, existing: [], suggested: [], unresolved: [] });
    });
    autoAssignPreview.existingCoveredAssignments.forEach((entry) => {
      const current = byDate.get(entry.date) || { date: entry.date, existing: [], suggested: [], unresolved: [] };
      current.existing.push(entry);
      byDate.set(entry.date, current);
    });
    autoAssignPreview.suggestedAssignments.forEach((entry) => {
      const current = byDate.get(entry.date) || { date: entry.date, existing: [], suggested: [], unresolved: [] };
      current.suggested.push(entry);
      byDate.set(entry.date, current);
    });
    autoAssignPreview.unresolvedAssignments.forEach((entry) => {
      const current = byDate.get(entry.date) || { date: entry.date, existing: [], suggested: [], unresolved: [] };
      current.unresolved.push(entry);
      byDate.set(entry.date, current);
    });

    return Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date));
  }, [autoAssignPreview]);

  const selectedTypesSet = useMemo(
    () => new Set(autoAssignForm.selectedTypes || []),
    [autoAssignForm.selectedTypes]
  );
  const hasMeetingTypesSelected = useMemo(
    () => (autoAssignForm.selectedTypes || []).some((type) => isMeetingSyncableAssignmentType(type)),
    [autoAssignForm.selectedTypes]
  );

  const applyTypePreset = (types) => {
    setAutoAssignForm((prev) => ({
      ...prev,
      selectedTypes: [...types]
    }));
  };

  const toggleType = (type) => {
    setAutoAssignForm((prev) => {
      const checked = prev.selectedTypes.includes(type);
      return {
        ...prev,
        selectedTypes: checked
          ? prev.selectedTypes.filter((entry) => entry !== type)
          : [...prev.selectedTypes, type]
      };
    });
  };

  const toggleDate = (dateStr) => {
    setAutoAssignForm((prev) => {
      const checked = prev.selectedDates.includes(dateStr);
      return {
        ...prev,
        selectedDates: checked
          ? prev.selectedDates.filter((entry) => entry !== dateStr)
          : [...prev.selectedDates, dateStr].sort((a, b) => a.localeCompare(b))
      };
    });
  };

  return (
    <div className="space-y-5">
      <section className="panel-card space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">
              Distribuição automática
            </p>
            <h3 className="mt-2 text-lg font-black tracking-tight text-slate-900 dark:text-white">
              Gere uma prévia antes de salvar
            </h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">
              O sistema respeita as funções habilitadas e evita mais de uma mecânica no mesmo dia.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-2xl bg-emerald-50 px-4 py-3 text-emerald-700">
            <Sparkles size={18} />
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest">Seleção atual</p>
              <p className="text-sm font-black">
                {autoAssignForm.selectedTypes.length} função(ões) • {autoAssignForm.selectedDates.length} data(s)
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="space-y-4">
            <label className="space-y-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Mês de referência
              </span>
              <input
                type="month"
                value={autoAssignForm.month}
                onChange={(event) =>
                  setAutoAssignForm((prev) => ({
                    ...prev,
                    month: event.target.value,
                    selectedDates: []
                  }))
                }
                className="soft-input"
              />
            </label>

            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => applyTypePreset(ASSIGNMENT_TYPE_GROUPS.flatMap((group) => group.types))}
                  className={presetButtonClass}
                >
                  Todas
                </button>
                {ASSIGNMENT_TYPE_GROUPS.map((group) => (
                  <button
                    key={group.id}
                    type="button"
                    onClick={() => applyTypePreset(group.types)}
                    className={presetButtonClass}
                  >
                    {group.shortLabel}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => applyTypePreset([])}
                  className={presetButtonClass}
                >
                  Limpar
                </button>
              </div>

              {hasMeetingTypesSelected && (
                <label className="flex items-start gap-3 rounded-[20px] border border-violet-200 bg-violet-50 p-3 text-sm text-violet-800">
                  <input
                    type="checkbox"
                    checked={autoAssignForm.publishToMeetings === true}
                    onChange={(event) =>
                      setAutoAssignForm((prev) => ({
                        ...prev,
                        publishToMeetings: event.target.checked
                      }))
                    }
                    className="mt-0.5 h-4 w-4 rounded border-violet-300 text-violet-600 focus:ring-violet-500"
                  />
                  <span>
                    <span className="block font-black">Mostrar também em Reuniões</span>
                    <span className="mt-1 block text-[11px] leading-snug text-violet-700">
                      Tipos de meio de semana salvos neste lote também aparecerão na página
                      Reuniões.
                    </span>
                  </span>
                </label>
              )}

              {ASSIGNMENT_TYPE_GROUPS.map((group) => (
                <div key={group.id} className="rounded-[22px] bg-slate-50 p-4 dark:bg-navy-900">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-black text-slate-900 dark:text-white">
                        {group.label}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-300">
                        Selecione somente as funções que quer distribuir neste lote.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => applyTypePreset(group.types)}
                      className="text-[10px] font-black uppercase tracking-widest text-blue-600"
                    >
                      Marcar grupo
                    </button>
                  </div>

                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {group.types.map((type) => {
                      const checked = selectedTypesSet.has(type);
                      return (
                        <button
                          key={type}
                          type="button"
                          onClick={() => toggleType(type)}
                          className={`rounded-2xl border px-3 py-3 text-left transition-all ${
                            checked
                              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                              : 'border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-navy-800 dark:text-slate-300'
                          }`}
                        >
                          <span className="text-sm font-black">{type}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-[22px] bg-slate-50 p-4 dark:bg-navy-900">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <CalendarDays size={15} className="text-slate-400" />
                  <div>
                    <p className="text-sm font-black text-slate-900 dark:text-white">
                      Datas de reunião
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-300">
                      Selecione os dias que receberão esse lote automático.
                    </p>
                  </div>
                </div>
                <span className="rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:bg-navy-800">
                  {autoAssignForm.selectedDates.length}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setAutoAssignForm((prev) => ({ ...prev, selectedDates: [...monthDates] }))
                  }
                  className={presetButtonClass}
                >
                  Todas
                </button>
                <button
                  type="button"
                  onClick={() => setAutoAssignForm((prev) => ({ ...prev, selectedDates: [] }))}
                  className={presetButtonClass}
                >
                  Limpar
                </button>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4">
                {monthDates.map((dateStr) => {
                  const checked = autoAssignForm.selectedDates.includes(dateStr);
                  return (
                    <button
                      key={dateStr}
                      type="button"
                      onClick={() => toggleDate(dateStr)}
                      className={`rounded-2xl border px-3 py-3 transition-all ${
                        checked
                          ? 'border-navy-900 bg-navy-900 text-white dark:border-blue-500 dark:bg-blue-500'
                          : 'border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-navy-800 dark:text-slate-300'
                      }`}
                    >
                      <p className="text-base font-black leading-none">{dateStr.slice(-2)}</p>
                      <p className="mt-1 text-[10px] font-black uppercase tracking-widest opacity-75">
                        {weekdayLabel(dateStr)}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="button"
              onClick={handleGenerateAutoAssignmentsPreview}
              disabled={
                isGeneratingAutoAssignments ||
                autoAssignForm.selectedDates.length === 0 ||
                autoAssignForm.selectedTypes.length === 0
              }
              className="soft-button-primary w-full justify-center disabled:opacity-60"
            >
              <Wand2 size={15} />
              {isGeneratingAutoAssignments ? 'Gerando prévia...' : 'Gerar prévia automática'}
            </button>
          </div>
        </div>
      </section>

      {autoAssignPreview && (
        <section className="panel-card space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">
                Prévia
              </p>
              <h4 className="mt-2 text-lg font-black tracking-tight text-slate-900 dark:text-white">
                Revise antes de salvar
              </h4>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[
                { label: 'Datas', value: autoAssignPreview.selectedDates.length, tone: 'bg-slate-100 text-slate-700' },
                { label: 'Novas', value: autoAssignPreview.suggestedAssignments.length, tone: 'bg-emerald-50 text-emerald-700' },
                { label: 'Já preenchidas', value: autoAssignPreview.existingCoveredAssignments.length, tone: 'bg-blue-50 text-blue-700' },
                { label: 'Pendências', value: autoAssignPreview.unresolvedAssignments.length, tone: 'bg-amber-50 text-amber-700' }
              ].map((item) => (
                <div key={item.label} className={`rounded-2xl px-3 py-2 text-center ${item.tone}`}>
                  <p className="text-[9px] font-black uppercase tracking-widest opacity-75">{item.label}</p>
                  <p className="mt-1 text-lg font-black">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {groupedPreview.map((group) => (
              <div
                key={group.date}
                className="rounded-[24px] border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-navy-900"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm font-black text-slate-900 dark:text-white">
                    {formatDatePt(group.date)}
                  </p>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-slate-500">
                    {group.suggested.length} nova(s)
                  </span>
                </div>

                <div className="mt-3 grid gap-3 lg:grid-cols-3">
                  {group.existing.length > 0 && (
                    <div className="rounded-[20px] bg-blue-50 p-3">
                      <p className="text-[10px] font-black uppercase tracking-widest text-blue-700">
                        Já preenchidas
                      </p>
                      <div className="mt-2 space-y-2">
                        {group.existing.map((entry) => {
                          const assignedUser = data.users.find((user) => user.id === entry.usuario_id);
                          return (
                            <div key={`existing-${entry.id || `${entry.date}-${entry.tipo_designacao}`}`}>
                              <p className="text-sm font-black text-blue-900">
                                {formatAssignmentLabel(entry.tipo_designacao)}
                              </p>
                              <p className="text-[11px] font-semibold text-blue-700">
                                {getUserDisplayName(assignedUser)}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {group.suggested.length > 0 && (
                    <div className="rounded-[20px] bg-emerald-50 p-3">
                      <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700">
                        Novas designações
                      </p>
                      <div className="mt-2 space-y-2">
                        {group.suggested.map((entry) => {
                          const assignedUser = data.users.find((user) => user.id === entry.usuario_id);
                          return (
                            <div key={`suggested-${entry.date}-${entry.tipo_designacao}-${entry.usuario_id}`}>
                              <p className="text-sm font-black text-emerald-900">
                                {formatAssignmentLabel(entry.tipo_designacao)}
                              </p>
                              <p className="text-[11px] font-semibold text-emerald-700">
                                {getUserDisplayName(assignedUser)}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {group.unresolved.length > 0 && (
                    <div className="rounded-[20px] bg-amber-50 p-3">
                      <p className="text-[10px] font-black uppercase tracking-widest text-amber-700">
                        Pendências
                      </p>
                      <div className="mt-2 space-y-2">
                        {group.unresolved.map((entry) => (
                          <div key={`unresolved-${entry.date}-${entry.type}`}>
                            <p className="text-sm font-black text-amber-900">
                              {formatAssignmentLabel(entry.type)}
                            </p>
                            <p className="text-[11px] font-semibold text-amber-700">
                              {entry.reason}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={handleSaveAutoAssignments}
            disabled={
              isSavingAutoAssignments ||
              autoAssignPreview.saved ||
              autoAssignPreview.suggestedAssignments.length === 0
            }
            className="soft-button-primary w-full justify-center disabled:opacity-60"
          >
            <CheckSquare size={15} />
            {autoAssignPreview.saved
              ? 'Prévia já salva'
              : isSavingAutoAssignments
                ? 'Salvando designações...'
                : 'Salvar designações automáticas'}
          </button>
        </section>
      )}
    </div>
  );
};

export default AdminAutoAssignmentsTab;
