import React, { useMemo, useState } from 'react';
import {
  CalendarDays,
  FileAudio2,
  FileDown,
  MessageCircle,
  Mic2,
  Pencil,
  Trash2,
  User,
  X
} from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import { printTalksMonth } from '../../utils/printUtils';
import { buildWhatsAppLink, getUserDisplayName } from '../../utils/textUtils';
import {
  TALK_CHAIR_ASSIGNMENT_TYPE,
  TALK_READER_ASSIGNMENT_TYPE,
  buildMonthOptions,
  compareTalksAsc,
  formatTalkWhatsAppMessage
} from '../../utils/talkUtils';
import StatusIcon from '../../components/StatusIcon';
import { JW_SONGS, JW_TALKS } from '../../constants/jwData';

const TALK_CARD_THEMES = [
  {
    panel: 'border-rose-200 bg-rose-50/90 dark:border-rose-700 dark:bg-rose-900/15',
    badge: 'bg-rose-100 text-rose-700 dark:bg-rose-900/20 dark:text-rose-200',
    accent: 'bg-rose-500'
  },
  {
    panel: 'border-amber-200 bg-amber-50/90 dark:border-amber-700 dark:bg-amber-900/15',
    badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-200',
    accent: 'bg-amber-500'
  },
  {
    panel: 'border-sky-200 bg-sky-50/90 dark:border-sky-700 dark:bg-sky-900/15',
    badge: 'bg-sky-100 text-sky-700 dark:bg-sky-900/20 dark:text-sky-200',
    accent: 'bg-sky-500'
  },
  {
    panel: 'border-emerald-200 bg-emerald-50/90 dark:border-emerald-700 dark:bg-emerald-900/15',
    badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-200',
    accent: 'bg-emerald-500'
  }
];

const buildInitialFormState = () => ({
  date: '',
  chairmanUserId: '',
  speakerName: '',
  speakerCongregation: '',
  talkNumber: '',
  talkTheme: '',
  songNumber: '',
  songTheme: ''
});

const buildFormStateFromTalk = (talk) => ({
  date: talk?.date || '',
  chairmanUserId: talk?.chairmanAssignment?.usuario_id || '',
  speakerName: talk?.speakerName || '',
  speakerCongregation: talk?.speakerCongregation || '',
  talkNumber: talk?.talkNumber || '',
  talkTheme: talk?.talkTheme || '',
  songNumber: talk?.songNumber || '',
  songTheme: talk?.songTheme || ''
});

const TalksView = ({
  data,
  dataReady,
  user,
  onBack,
  renderSkeletonList,
  formatDatePt,
  isRealAdmin,
  canUserTakeAssignment,
  handleCreateTalk,
  handleUpdateTalk,
  handleDeleteTalk
}) => {
  const [selectedMonth, setSelectedMonth] = useState(() => buildMonthOptions(new Date(), 7)[0]?.value || '');
  const [talkForm, setTalkForm] = useState(buildInitialFormState);
  const [editingTalkId, setEditingTalkId] = useState('');

  const monthOptions = useMemo(() => buildMonthOptions(new Date(), 7), []);
  const maxTalkDate = useMemo(() => {
    const limit = new Date();
    limit.setMonth(limit.getMonth() + 6, 28);
    return `${limit.getFullYear()}-${String(limit.getMonth() + 1).padStart(2, '0')}-${String(
      new Date(limit.getFullYear(), limit.getMonth() + 1, 0).getDate()
    ).padStart(2, '0')}`;
  }, []);

  const usersById = useMemo(
    () => new Map((data.users || []).map((entry) => [entry.id, entry])),
    [data.users]
  );

  const approvedChairmen = useMemo(
    () =>
      (data.users || [])
        .filter(
          (entry) =>
            entry.approved && canUserTakeAssignment(entry, TALK_CHAIR_ASSIGNMENT_TYPE)
        )
        .sort((left, right) => getUserDisplayName(left).localeCompare(getUserDisplayName(right))),
    [canUserTakeAssignment, data.users]
  );

  const talks = useMemo(() => {
    const assignments = data.assignments || [];
    const items = [...(data.talks || [])].sort(compareTalksAsc);
    
    const processedDates = new Set(items.map((talk) => talk.date));

    const result = items.map((talk) => {
      const chairmanAssignment =
        assignments.find((entry) => entry.id === talk.chairmanAssignmentId) ||
        assignments.find(
          (entry) =>
            entry.date === talk.date &&
            entry.tipo_designacao === TALK_CHAIR_ASSIGNMENT_TYPE &&
            entry.status !== 'rejeitado'
        ) ||
        null;
      const readerAssignment =
        assignments.find(
          (entry) =>
            entry.date === talk.date &&
            entry.tipo_designacao === TALK_READER_ASSIGNMENT_TYPE &&
            entry.status !== 'rejeitado'
        ) || null;
      const chairmanUser = chairmanAssignment ? usersById.get(chairmanAssignment.usuario_id) : null;
      const readerUser = readerAssignment ? usersById.get(readerAssignment.usuario_id) : null;

      return {
        ...talk,
        chairmanAssignment,
        readerAssignment,
        chairmanName: chairmanUser ? getUserDisplayName(chairmanUser) : 'Sem presidente',
        readerName: readerUser ? getUserDisplayName(readerUser) : 'Não definido',
        chairmanStatus: chairmanAssignment?.status || 'programado',
        isMine:
          chairmanAssignment?.usuario_id === user?.id || readerAssignment?.usuario_id === user?.id
      };
    });

    assignments
      .filter((a) => 
        (a.tipo_designacao === TALK_CHAIR_ASSIGNMENT_TYPE || a.tipo_designacao === TALK_READER_ASSIGNMENT_TYPE) && 
        a.status !== 'rejeitado' &&
        a.date
      )
      .forEach((assignment) => {
        if (processedDates.has(assignment.date)) return;
        
        const chairmanAssignment = assignments.find(
          (entry) =>
            entry.date === assignment.date &&
            entry.tipo_designacao === TALK_CHAIR_ASSIGNMENT_TYPE &&
            entry.status !== 'rejeitado'
        ) || null;
        const readerAssignment = assignments.find(
          (entry) =>
            entry.date === assignment.date &&
            entry.tipo_designacao === TALK_READER_ASSIGNMENT_TYPE &&
            entry.status !== 'rejeitado'
        ) || null;

        const chairmanUser = chairmanAssignment ? usersById.get(chairmanAssignment.usuario_id) : null;
        const readerUser = readerAssignment ? usersById.get(readerAssignment.usuario_id) : null;

        const chairmanName = chairmanUser ? getUserDisplayName(chairmanUser) : 'Sem presidente';
        const readerName = readerUser ? getUserDisplayName(readerUser) : 'Não definido';

        processedDates.add(assignment.date);
        result.push({
          id: `virtual:${assignment.date}`,
          isVirtual: true,
          date: assignment.date,
          monthKey: assignment.date.slice(0, 7),
          speakerName: 'Pendente',
          speakerCongregation: '',
          talkTheme: 'Discurso a ser programado',
          songNumber: '-',
          songTheme: '-',
          chairmanAssignmentId: chairmanAssignment?.id || '',
          chairmanAssignment,
          readerAssignment,
          chairmanName,
          readerName,
          chairmanStatus: chairmanAssignment?.status || 'programado',
          isMine: chairmanAssignment?.usuario_id === user?.id || readerAssignment?.usuario_id === user?.id
        });
      });

    return result.sort(compareTalksAsc);
  }, [data.assignments, data.talks, user?.id, usersById]);

  const visibleTalks = useMemo(
    () => talks.filter((talk) => String(talk.monthKey || talk.date?.slice(0, 7) || '') === selectedMonth),
    [selectedMonth, talks]
  );

  const monthLabel =
    monthOptions.find((option) => option.value === selectedMonth)?.label || 'Mês selecionado';

  const isLoading =
    !(
      dataReady.talks ||
      dataReady.assignments ||
      dataReady.users ||
      (data.talks || []).length > 0 ||
      (data.assignments || []).length > 0 ||
      (data.users || []).length > 0
    );

  const handleChangeForm = (field, value) => {
    setTalkForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleTalkNumberChange = (value) => {
    setTalkForm((prev) => {
      const next = { ...prev, talkNumber: value };
      const parsed = parseInt(value, 10);
      const key = !isNaN(parsed) ? String(parsed) : null;
      
      const prevParsed = parseInt(prev.talkNumber, 10);
      const prevKey = !isNaN(prevParsed) ? String(prevParsed) : null;
      const isThemeAutoFilled = prevKey && prev.talkTheme === JW_TALKS[prevKey];
      const isThemeEmpty = !prev.talkTheme;

      if (key && JW_TALKS[key]) {
        if (isThemeEmpty || isThemeAutoFilled) {
          next.talkTheme = JW_TALKS[key];
        }
      } else if (isThemeAutoFilled) {
        next.talkTheme = '';
      }
      return next;
    });
  };

  const handleSongNumberChange = (value) => {
    setTalkForm((prev) => {
      const next = { ...prev, songNumber: value };
      const parsed = parseInt(value, 10);
      const key = !isNaN(parsed) ? String(parsed) : null;
      
      const prevParsed = parseInt(prev.songNumber, 10);
      const prevKey = !isNaN(prevParsed) ? String(prevParsed) : null;
      const isThemeAutoFilled = prevKey && prev.songTheme === JW_SONGS[prevKey];
      const isThemeEmpty = !prev.songTheme;

      if (key && JW_SONGS[key]) {
        if (isThemeEmpty || isThemeAutoFilled) {
          next.songTheme = JW_SONGS[key];
        }
      } else if (isThemeAutoFilled) {
        next.songTheme = '';
      }
      return next;
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const saved = editingTalkId
      ? await handleUpdateTalk(editingTalkId, talkForm)
      : await handleCreateTalk(talkForm);
    if (saved) {
      setTalkForm(buildInitialFormState());
      setEditingTalkId('');
      setSelectedMonth(String(talkForm.date || '').slice(0, 7) || selectedMonth);
    }
  };

  const handleStartEdit = (talk) => {
    setEditingTalkId(talk.isVirtual ? '' : talk.id);
    setTalkForm(buildFormStateFromTalk(talk));
    setSelectedMonth(String(talk.monthKey || talk.date?.slice(0, 7) || selectedMonth));
  };

  const handleCancelEdit = () => {
    setEditingTalkId('');
    setTalkForm(buildInitialFormState());
  };

  const handleShareMonth = () => {
    const message = visibleTalks
      .map((talk) =>
        formatTalkWhatsAppMessage({
          talk,
          chairmanName: talk.chairmanName,
          readerName: talk.readerName,
          formatDatePt
        })
      )
      .join('\n\n');
    window.open(buildWhatsAppLink('', message), '_blank', 'noopener');
  };

  const handlePrintMonth = () => {
    printTalksMonth({
      monthLabel,
      talks: visibleTalks,
      formatDatePt
    });
  };

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Discursos"
        title="Programação de discursos"
        description="Agenda do fim de semana com orador, cântico, presidente e leitor da Sentinela."
        onBack={onBack}
        actions={
          <>
            <button
              type="button"
              onClick={handlePrintMonth}
              className="soft-button-secondary"
              disabled={visibleTalks.length === 0}
            >
              <FileDown size={14} />
              Exportar PDF
            </button>
            <button
              type="button"
              onClick={handleShareMonth}
              className="soft-button-secondary"
              disabled={visibleTalks.length === 0}
            >
              <MessageCircle size={14} />
              WhatsApp
            </button>
          </>
        }
      />

      {isRealAdmin && (
        <form className="panel-card space-y-4" onSubmit={handleSubmit}>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">
              {editingTalkId ? 'Edição do discurso' : 'Cadastro do mês'}
            </p>
            <h3 className="mt-1 text-lg font-black tracking-tight text-slate-900 dark:text-white">
              {editingTalkId ? 'Editar discurso do fim de semana' : 'Novo discurso do fim de semana'}
            </h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">
              {editingTalkId
                ? 'Atualize data, tema ou presidente sem perder o vínculo com a agenda.'
                : 'Ao salvar, o presidente recebe a designação na agenda e uma notificação persistida.'}
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            <label className="space-y-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Data
              </span>
              <input
                type="date"
                value={talkForm.date}
                min={new Date().toISOString().slice(0, 10)}
                max={maxTalkDate}
                onChange={(event) => handleChangeForm('date', event.target.value)}
                className="soft-input"
                required
              />
            </label>

            <label className="space-y-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Presidente
              </span>
              <select
                value={talkForm.chairmanUserId}
                onChange={(event) => handleChangeForm('chairmanUserId', event.target.value)}
                className="soft-select"
                required
              >
                <option value="">Selecione o presidente</option>
                {approvedChairmen.map((entry) => (
                  <option key={entry.id} value={entry.id}>
                    {getUserDisplayName(entry)}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Orador
              </span>
              <input
                type="text"
                value={talkForm.speakerName}
                onChange={(event) => handleChangeForm('speakerName', event.target.value)}
                className="soft-input"
                placeholder="Nome do orador"
                required
              />
            </label>

            <label className="space-y-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Congregação
              </span>
              <input
                type="text"
                value={talkForm.speakerCongregation}
                onChange={(event) => handleChangeForm('speakerCongregation', event.target.value)}
                className="soft-input"
                placeholder="Congregação do orador"
              />
            </label>

            <div className="flex gap-3 md:col-span-2 xl:col-span-2">
              <label className="space-y-2 w-[100px] shrink-0">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Nº Disc.
                </span>
                <input
                  type="text"
                  value={talkForm.talkNumber}
                  onChange={(event) => handleTalkNumberChange(event.target.value)}
                  className="soft-input"
                  placeholder="Ex.: 45"
                />
              </label>

              <label className="space-y-2 flex-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Tema do discurso
                </span>
                <input
                  type="text"
                  value={talkForm.talkTheme}
                  onChange={(event) => handleChangeForm('talkTheme', event.target.value)}
                  className="soft-input"
                  placeholder="Tema do discurso"
                  required
                />
              </label>
            </div>

            <div className="flex gap-3 md:col-span-2 xl:col-span-3">
              <label className="space-y-2 w-[100px] shrink-0">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Nº Cântico
                </span>
                <input
                  type="text"
                  value={talkForm.songNumber}
                  onChange={(event) => handleSongNumberChange(event.target.value)}
                  className="soft-input"
                  placeholder="Ex.: 23"
                  required
                />
              </label>

              <label className="space-y-2 flex-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Tema do cântico
                </span>
                <input
                  type="text"
                  value={talkForm.songTheme}
                  onChange={(event) => handleChangeForm('songTheme', event.target.value)}
                  className="soft-input"
                  placeholder="Tema do cântico"
                  required
                />
              </label>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <button type="submit" className="soft-button-primary flex-1 justify-center">
              <FileAudio2 size={15} />
              {editingTalkId ? 'Salvar alterações' : 'Salvar discurso'}
            </button>
            {editingTalkId && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="soft-button-ghost justify-center"
              >
                <X size={14} />
                Cancelar
              </button>
            )}
          </div>
        </form>
      )}

      <section className="panel-card space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">
              Planejamento
            </p>
            <h3 className="mt-1 text-lg font-black tracking-tight text-slate-900 dark:text-white">
              Discursos do mês
            </h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">
              Selecione o mês vigente ou avance para os próximos meses já programados.
            </p>
          </div>

          <div className="w-full lg:w-[260px]">
            <select
              value={selectedMonth}
              onChange={(event) => setSelectedMonth(event.target.value)}
              className="soft-select"
            >
              {monthOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-500 dark:bg-navy-900 dark:text-slate-300">
          {visibleTalks.length === 1
            ? `1 discurso programado para ${monthLabel}.`
            : `${visibleTalks.length} discursos programados para ${monthLabel}.`}
        </div>
      </section>

      {isLoading ? (
        <div className="space-y-3">{renderSkeletonList(4, 'h-40 w-full rounded-4xl')}</div>
      ) : (
        <div className="space-y-4">
          {visibleTalks.map((talk, index) => {
            const theme = TALK_CARD_THEMES[index % TALK_CARD_THEMES.length];
            const whatsappMessage = formatTalkWhatsAppMessage({
              talk,
              chairmanName: talk.chairmanName,
              readerName: talk.readerName,
              formatDatePt
            });

            return (
              <section
                key={talk.id}
                className={`relative overflow-hidden rounded-2xl border shadow-sm ${theme.panel}`}
              >
                <div className={`absolute inset-y-0 left-0 w-1.5 ${theme.accent}`} />

                <div className="space-y-4 px-5 py-5">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${theme.badge}`}>
                          {formatDatePt(talk.date)}
                        </span>
                        <StatusIcon status={talk.chairmanStatus} />
                        {talk.isMine && (
                          <span className="rounded-full bg-emerald-100 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-emerald-700">
                            Minha designação
                          </span>
                        )}
                      </div>

                      <h3 className="mt-3 text-[1.45rem] font-black leading-tight tracking-tight text-slate-900 dark:text-white">
                        {talk.talkNumber ? `Nº ${talk.talkNumber} - ` : ''}{talk.talkTheme}
                      </h3>

                      <p className="mt-2 text-sm font-semibold text-slate-600 dark:text-slate-300">
                        {talk.speakerName}
                        {talk.speakerCongregation ? ` • ${talk.speakerCongregation}` : ''}
                      </p>
                    </div>

                    <div className={`grid gap-2 w-full mt-2 ${isRealAdmin ? 'grid-cols-3' : 'grid-cols-1'}`}>
                      <button
                        type="button"
                        onClick={() => window.open(buildWhatsAppLink('', whatsappMessage), '_blank', 'noopener')}
                        className="soft-button-secondary flex-col sm:flex-row justify-center px-1 text-[10px] sm:text-xs"
                      >
                        <MessageCircle size={14} />
                        WhatsApp
                      </button>
                      {isRealAdmin && (
                        <button
                          type="button"
                          onClick={() => handleStartEdit(talk)}
                          className="soft-button-secondary flex-col sm:flex-row justify-center px-1 text-[10px] sm:text-xs"
                        >
                          <Pencil size={14} />
                          Editar
                        </button>
                      )}
                      {isRealAdmin && (
                        <button
                          type="button"
                          onClick={() => handleDeleteTalk(talk)}
                          className="soft-button-danger flex-col sm:flex-row justify-center px-1 text-[10px] sm:text-xs"
                        >
                          <Trash2 size={14} />
                          Excluir
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    <div className="rounded-2xl bg-white/70 px-4 py-4 shadow-sm dark:bg-navy-900/80 dark:border dark:border-slate-700">
                      <div className="flex items-center gap-2">
                        <CalendarDays size={15} className="text-amber-600" />
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400 dark:text-slate-300">
                          Cântico
                        </p>
                      </div>
                      <p className="mt-3 text-sm font-black text-slate-900 dark:text-slate-100">
                        Cântico {talk.songNumber}
                      </p>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">
                        {talk.songTheme}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-2xl bg-white/70 px-4 py-4 shadow-sm dark:bg-navy-900/80 dark:border dark:border-slate-700">
                        <div className="flex items-center gap-2">
                          <Mic2 size={15} className="text-rose-600" />
                          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400 dark:text-slate-300">
                            Orador
                          </p>
                        </div>
                        <p className="mt-3 text-sm font-black text-slate-900 dark:text-slate-100">
                          {talk.speakerName}
                        </p>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">
                          {talk.speakerCongregation || 'Congregação não informada'}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-white/70 px-4 py-4 shadow-sm dark:bg-navy-900/80 dark:border dark:border-slate-700 flex flex-col">
                        <div className="flex items-center gap-2">
                          <User size={15} className="text-blue-600" />
                          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400 dark:text-slate-300">
                            Presidente
                          </p>
                        </div>
                        <p className="mt-auto pt-3 text-sm font-black text-slate-900 dark:text-slate-100">
                          {talk.chairmanName}
                        </p>
                      </div>
                    </div>

                    <div className="rounded-2xl bg-white/70 px-4 py-4 shadow-sm dark:bg-navy-900/80 dark:border dark:border-slate-700">
                      <div className="flex items-center gap-2">
                        <User size={15} className="text-indigo-600" />
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400 dark:text-slate-300">
                          Leitor A Sentinela
                        </p>
                      </div>
                      <p className="mt-3 text-sm font-black text-slate-900 dark:text-slate-100">
                        {talk.readerName}
                      </p>
                    </div>
                  </div>
                </div>
              </section>
            );
          })}

          {visibleTalks.length === 0 && (
            <section className="panel-card py-10 text-center text-sm font-semibold text-slate-500 dark:text-slate-300">
              Nenhum discurso programado para este mês.
            </section>
          )}
        </div>
      )}
    </div>
  );
};

export default TalksView;
