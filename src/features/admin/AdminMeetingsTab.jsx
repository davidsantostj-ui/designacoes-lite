import React, { useCallback, useMemo } from 'react';
import { Download, RotateCcw, Trash2, Upload, Wand2, CalendarDays } from 'lucide-react';
import { getWeekStartIso } from '../../utils/meetingViewUtils.cjs';

const BUTTON_CLASS =
  'flex min-h-[48px] min-w-0 flex-1 basis-[calc(50%-0.25rem)] items-center justify-center gap-2 rounded-[16px] px-3 py-2 text-center text-[0.7rem] font-black uppercase tracking-[0.14em] leading-tight sm:min-w-[148px] sm:flex-none';

const BUTTON_TONE_CLASS = {
  primary: 'soft-button-primary',
  secondary: 'soft-button-secondary',
  neutral: 'soft-button',
  danger: 'soft-button-danger'
};

const STRINGS = {
  title: 'Programação das reuniões',
  subtitle: 'Importar, revisar e corrigir a programação mensal.',
  template: 'Modelo',
  importCsv: 'Importar CSV',
  preparing: 'Preparando...',
  wipeAll: 'Apagar tudo',
  wiping: 'Apagando...',
  reclassify: 'Reclassificar',
  saving: 'Salvando...',
  undoBatch: 'Desfazer lote',
  undoing: 'Desfazendo...',
  lastBatch: 'Último lote',
  recentImport: 'Importação recente',
  meetings: 'Reuniões',
  agenda: 'Agenda',
  inApp: 'No app',
  review: 'Revisar',
  viewMeetings: 'Ver reuniões',
  viewAgenda: 'Ver agenda',
  recentParticipations: 'Participações recentes',
  noImportedMeetings: 'Nenhuma participação importada ainda.',
  linked: 'No app',
  ambiguous: 'Revisar',
  external: 'Externo'
};

const formatImportMoment = (timestamp) => {
  if (!timestamp) return 'Agora';
  return new Date(timestamp).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const getMeetingBadge = (entry) => {
  if (entry.match_state === 'linked') {
    return { label: STRINGS.linked, tone: 'bg-blue-100 text-blue-700' };
  }
  if (entry.match_state === 'ambiguous') {
    return { label: STRINGS.ambiguous, tone: 'bg-amber-100 text-amber-700' };
  }
  return { label: STRINGS.external, tone: 'bg-slate-100 text-slate-500' };
};

const ActionButton = ({
  tone = 'secondary',
  icon: Icon,
  label,
  title,
  disabled = false,
  onClick,
  children
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    title={title || label}
    className={`${BUTTON_TONE_CLASS[tone] || BUTTON_TONE_CLASS.secondary} ${BUTTON_CLASS}`}
  >
    {Icon ? <Icon size={16} className="shrink-0" /> : null}
    <span className="whitespace-nowrap">{label}</span>
    {children}
  </button>
);

const UploadActionButton = ({ disabled, label, onFileSelect }) => (
  <label
    aria-disabled={disabled}
    title={label}
    className={`${BUTTON_TONE_CLASS.primary} ${BUTTON_CLASS} cursor-pointer ${
      disabled ? 'pointer-events-none opacity-60' : ''
    }`}
  >
    <Upload size={16} className="shrink-0" />
    <span className="whitespace-nowrap">{label}</span>
    <input
      type="file"
      accept=".csv,text/csv"
      className="hidden"
      disabled={disabled}
      onChange={(event) => onFileSelect(event.target.files?.[0])}
    />
  </label>
);

const AdminMeetingsTab = ({
  data,
  isImportingMeetings,
  handleImportMeetingsFile,
  handleDownloadMeetingsTemplate,
  latestMeetingsImportBatch,
  handleOpenLatestMeetingsReclassify,
  handleUndoMeetingsImport,
  handleWipeMeetingsData,
  isUndoingMeetingsImport,
  isWipingMeetingsData,
  isSavingMeetingsReclassify,
  handleShiftDate,
  isShiftingDates,
  onNavigateToView,
  onEditImportedWeek,
  formatDatePt
}) => {
  const [shiftSourceDate, setShiftSourceDate] = React.useState('');
  const [shiftTargetDate, setShiftTargetDate] = React.useState('');
  const recentMeetings = useMemo(() => {
    return [...(data.meetings || [])]
      .sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')))
      .slice(0, 10);
  }, [data.meetings]);

  return (
    <div className="space-y-4">
      <section className="panel-card space-y-3">
        <div className="grid gap-4 xl:grid-cols-[minmax(0,0.75fr)_minmax(0,1.25fr)] xl:items-center">
          <div className="min-w-0">
            <h3 className="text-[1.4rem] font-black tracking-tight text-slate-900 dark:text-white">
              {STRINGS.title}
            </h3>
            <p className="mt-1 max-w-[30ch] text-sm leading-snug text-slate-500 dark:text-slate-300">
              {STRINGS.subtitle}
            </p>
          </div>

          <div className="flex w-full flex-wrap gap-2 xl:justify-end">
            <ActionButton
              tone="secondary"
              icon={Download}
              label={STRINGS.template}
              onClick={handleDownloadMeetingsTemplate}
            />

            <UploadActionButton
              disabled={isImportingMeetings}
              label={isImportingMeetings ? STRINGS.preparing : STRINGS.importCsv}
              onFileSelect={handleImportMeetingsFile}
            />

            <ActionButton
              tone="danger"
              icon={Trash2}
              label={isWipingMeetingsData ? STRINGS.wiping : STRINGS.wipeAll}
              disabled={isWipingMeetingsData}
              onClick={handleWipeMeetingsData}
            />

            {latestMeetingsImportBatch ? (
              <ActionButton
                tone="neutral"
                icon={Wand2}
                label={isSavingMeetingsReclassify ? STRINGS.saving : STRINGS.reclassify}
                disabled={isSavingMeetingsReclassify}
                onClick={handleOpenLatestMeetingsReclassify}
              />
            ) : null}

            {latestMeetingsImportBatch ? (
              <ActionButton
                tone="danger"
                icon={RotateCcw}
                label={isUndoingMeetingsImport ? STRINGS.undoing : STRINGS.undoBatch}
                disabled={isUndoingMeetingsImport}
                onClick={() => handleUndoMeetingsImport(latestMeetingsImportBatch.batchId)}
              />
            ) : null}
          </div>
        </div>
      </section>

      {latestMeetingsImportBatch && (
        <section className="panel-card">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">
                {STRINGS.lastBatch}
              </p>
              <p className="mt-1 text-sm font-black text-slate-900 dark:text-white">
                {latestMeetingsImportBatch.batchLabel || STRINGS.recentImport}
              </p>
              <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-300">
                {formatImportMoment(latestMeetingsImportBatch.importedAtMs)}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-slate-100 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                {STRINGS.meetings}: {latestMeetingsImportBatch.meetingsCount || 0}
              </span>
              <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-200">
                {STRINGS.agenda}: {latestMeetingsImportBatch.assignmentsCount || 0}
              </span>
              <span className="rounded-full bg-blue-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-blue-700 dark:bg-blue-900/20 dark:text-blue-200">
                {STRINGS.inApp}: {latestMeetingsImportBatch.linkedCount || 0}
              </span>
              <span className="rounded-full bg-amber-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-amber-700 dark:bg-amber-900/20 dark:text-amber-200">
                {STRINGS.review}: {latestMeetingsImportBatch.ambiguousCount || 0}
              </span>
            </div>
          </div>

          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            <ActionButton
              tone="secondary"
              label={STRINGS.viewMeetings}
              onClick={() => onNavigateToView('MEETINGS')}
            />
            <ActionButton
              tone="secondary"
              label={STRINGS.viewAgenda}
              onClick={() => onNavigateToView('ASSIGNMENTS_MONTH')}
            />
            <ActionButton
              tone="primary"
              icon={CalendarDays}
              label="Editar Semana"
              onClick={() => onEditImportedWeek(
                (data.meetings || []).filter(m => 
                  m.importBatchId === latestMeetingsImportBatch?.batchId
                )
              )}
            />
          </div>
        </section>
      )}

      <section className="panel-card space-y-4">
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">
            Deslocar Data em Lote
          </p>
          <p className="mt-1 text-sm font-black text-slate-900 dark:text-white">
            Mover designações de um dia para o outro
          </p>
          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-300">
            Ideal para semana de visita de viajante. Todos os eventos de uma data serão transferidos, mantendo os status de aceitação.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-xs font-bold text-slate-500">Data de Origem (A mover)</span>
            <input
              type="date"
              value={shiftSourceDate}
              onChange={(e) => setShiftSourceDate(e.target.value)}
              className="soft-input w-full"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-bold text-slate-500">Data de Destino (Nova data)</span>
            <input
              type="date"
              value={shiftTargetDate}
              onChange={(e) => setShiftTargetDate(e.target.value)}
              className="soft-input w-full"
            />
          </label>
        </div>

        <button
          type="button"
          disabled={!shiftSourceDate || !shiftTargetDate || isShiftingDates}
          onClick={async () => {
            const success = await handleShiftDate(shiftSourceDate, shiftTargetDate);
            if (success) {
              setShiftSourceDate('');
              setShiftTargetDate('');
            }
          }}
          className="soft-button-primary w-full justify-center"
        >
          <RotateCcw size={16} />
          {isShiftingDates ? 'Deslocando...' : 'Deslocar todas as reuniões e designações'}
        </button>
      </section>

      <section className="panel-card space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h4 className="text-sm font-black text-slate-900 dark:text-white">
            {STRINGS.recentParticipations}
          </h4>
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            {recentMeetings.length} {recentMeetings.length === 1 ? 'item' : 'itens'}
          </span>
        </div>

        <div className="space-y-2">
          {recentMeetings.map((entry) => {
            const badge = getMeetingBadge(entry);
            return (
              <div
                key={entry.id || `${entry.date}_${entry.role_label}_${entry.participant_name}`}
                className="grid gap-3 rounded-[20px] border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-slate-800 dark:bg-navy-900 md:grid-cols-[minmax(0,1fr)_auto] md:items-center"
              >
                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-blue-600">
                    {formatDatePt(entry.date)}
                  </p>
                  <p
                    title={entry.role_label}
                    className="mt-1 break-words text-sm font-black leading-snug text-slate-900 dark:text-white md:truncate"
                  >
                    {entry.role_label}
                  </p>
                  <p
                    title={entry.participant_name}
                    className="mt-1 break-words text-sm leading-snug text-slate-500 dark:text-slate-300 md:truncate"
                  >
                    {entry.participant_name}
                  </p>
                </div>
                <span
                  className={`self-start rounded-full px-3 py-1 text-[10px] font-black ${badge.tone} md:self-center`}
                >
                  {badge.label}
                </span>
              </div>
            );
          })}

          {recentMeetings.length === 0 && (
            <div className="rounded-[20px] bg-slate-50 px-4 py-5 text-center text-sm font-semibold text-slate-500 dark:bg-navy-900 dark:text-slate-300">
              {STRINGS.noImportedMeetings}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default AdminMeetingsTab;
