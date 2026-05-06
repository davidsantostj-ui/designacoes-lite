import React, { useCallback, useDeferredValue, useEffect, useMemo, useState } from 'react';
import { CalendarDays, ChevronDown, Printer, Search, Flag, UserX } from 'lucide-react';
import { MECHANICAL_ASSIGNMENT_TYPES } from '../../constants/appConstants';
import PageHeader from '../../components/PageHeader';
import { getEventColors, getEventMeta } from '../../utils/specialEventsUtils';
import {
  formatAssignmentLabel,
  isMechanicalAssignment,
  normalizeAssignmentType
} from '../../utils/assignmentUtils';
import {
  buildMeetingSyncKeyForAssignmentType,
  getMeetingSyncMetaForAssignmentType
} from '../../utils/meetingImportUtils';
import { printMeetingsWeek } from '../../utils/printUtils';
import { getUserDisplayName as getUserDisplayNameUtil } from '../../utils/textUtils';
import { parseIsoDate, formatIsoDate } from '../../utils/meetingViewUtils.cjs';
import StatusIcon from '../../components/StatusIcon';
import ParticipantSelectModal from '../../components/ParticipantSelectModal';

const SECTION_META = {
  abertura: {
    key: 'abertura',
    label: 'Abertura',
    order: 1,
    panelClass: 'border-sky-200 bg-sky-50/90 dark:border-sky-700 dark:bg-sky-900/10',
    badgeClass: 'bg-sky-200 text-sky-900 dark:bg-sky-800 dark:text-sky-100',
    accentClass: 'bg-sky-500',
    textClass: 'text-sky-900 dark:text-sky-200'
  },
  tesouros: {
    key: 'tesouros',
    label: 'Tesouros da Palavra de Deus',
    order: 2,
    panelClass: 'border-orange-200 bg-orange-50/90 dark:border-orange-600 dark:bg-orange-900/15',
    badgeClass: 'bg-orange-200 text-orange-900 dark:bg-orange-900/15 dark:text-orange-200',
    accentClass: 'bg-orange-500',
    textClass: 'text-orange-900 dark:text-orange-200'
  },
  ministerio: {
    key: 'ministerio',
    label: 'Faca Seu Melhor no Ministerio',
    order: 3,
    panelClass: 'border-emerald-200 bg-emerald-50/90 dark:border-emerald-600 dark:bg-emerald-900/15',
    badgeClass: 'bg-emerald-200 text-emerald-900 dark:bg-emerald-900/15 dark:text-emerald-200',
    accentClass: 'bg-emerald-500',
    textClass: 'text-emerald-900 dark:text-emerald-200'
  },
  vida_crista: {
    key: 'vida_crista',
    label: 'Nossa Vida Crista',
    order: 4,
    panelClass: 'border-amber-200 bg-amber-50/90 dark:border-amber-600 dark:bg-amber-900/15',
    badgeClass: 'bg-amber-200 text-amber-900 dark:bg-amber-900/15 dark:text-amber-200',
    accentClass: 'bg-amber-500',
    textClass: 'text-amber-900 dark:text-amber-200'
  },
  encerramento: {
    key: 'encerramento',
    label: 'Encerramento',
    order: 5,
    panelClass: 'border-slate-200 bg-slate-50/95 dark:border-slate-700 dark:bg-slate-900/60',
    badgeClass: 'bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-100',
    accentClass: 'bg-slate-500',
    textClass: 'text-slate-800 dark:text-slate-200'
  },
  programa: {
    key: 'programa',
    label: 'Programa',
    order: 6,
    panelClass: 'border-violet-200 bg-violet-50/90 dark:border-violet-700 dark:bg-violet-900/15',
    badgeClass: 'bg-violet-200 text-violet-900 dark:bg-violet-900/15 dark:text-violet-200',
    accentClass: 'bg-violet-500',
    textClass: 'text-violet-900 dark:text-violet-200'
  }
};

const WEEKEND_SECTION = {
  key: 'fim_de_semana',
  label: 'Fim de Semana',
  shortLabel: 'Fim de Semana',
  order: 7,
  panelClass: 'border-rose-200 bg-rose-50/90 dark:border-rose-700 dark:bg-rose-900/15',
  badgeClass: 'bg-rose-200 text-rose-900 dark:bg-rose-900/15 dark:text-rose-200',
  accentClass: 'bg-rose-500'
};

const MECHANICAL_SECTION = {
  key: 'mecanicas',
  label: 'Designações Mecânicas',
  shortLabel: 'Mecânicas',
  order: 8,
  panelClass: 'border-cyan-200 bg-cyan-50/90 dark:border-cyan-700 dark:bg-cyan-900/15',
  badgeClass: 'bg-cyan-200 text-cyan-900 dark:bg-cyan-900/15 dark:text-cyan-200',
  accentClass: 'bg-cyan-500'
};


const mechanicalOrderMap = new Map(
  MECHANICAL_ASSIGNMENT_TYPES.map((type, index) => [normalizeAssignmentType(type) || type, index + 1])
);

const normalizeText = (value) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

const isJewelsDesignation = (value) => normalizeText(value).includes('joias');

const addDays = (date, amount) => {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
};

const capitalize = (value) => (value ? value.charAt(0).toUpperCase() + value.slice(1) : value);

const formatDayLabel = (isoDate) => {
  const date = parseIsoDate(isoDate);
  if (!date) return isoDate;
  const weekday = capitalize(date.toLocaleDateString('pt-BR', { weekday: 'long' }));
  const shortDate = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  return `${weekday}, ${shortDate}`;
};

const getWeekStartIso = (isoDate) => {
  const date = parseIsoDate(isoDate);
  if (!date) return '';
  const weekday = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - weekday);
  return formatIsoDate(date);
};

const formatWeekLabel = (weekStartIso) => {
  const start = parseIsoDate(weekStartIso);
  if (!start) return 'Semana';
  const end = addDays(start, 6);
  return `Semana de ${start.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit'
  })} a ${end.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}`;
};

const formatWeekOptionLabel = (weekStartIso) => {
  const start = parseIsoDate(weekStartIso);
  if (!start) return 'Semana';
  return `Semana de ${start.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}`;
};

const formatMonthLabel = (monthKey) => {
  const [year, month] = monthKey.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1);
  const formatted = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
};

const getMonthKey = (isoDate) => String(isoDate).slice(0, 7);

const getCurrentWeekKey = () => getWeekStartIso(formatIsoDate(new Date()));

const getCurrentMonthKey = () => getMonthKey(formatIsoDate(new Date()));

const isWeekendDay = (isoDate) => {
  const date = parseIsoDate(isoDate);
  if (!date) return false;
  const day = date.getDay();
  return day === 5 || day === 6 || day === 0;
};

const isMidweekDay = (isoDate) => !isWeekendDay(isoDate);

const isBibleStudyDesignation = (value) => {
  const normalized = normalizeText(value);
  return normalized.includes('estudo biblico de congregacao') || normalized.includes('estudo de congregacao');
};

const getCanonicalSectionKey = (entry) => {
  const designation = normalizeText(entry?.designation);
  if (isJewelsDesignation(designation)) return 'tesouros';
  const sectionKey = normalizeText(entry?.section_key);
  if (sectionKey && SECTION_META[sectionKey]) return sectionKey;
  const sectionLabel = normalizeText(entry?.section_label);
  if (sectionLabel.includes('abertura')) return 'abertura';
  if (sectionLabel.includes('tesouros')) return 'tesouros';
  if (sectionLabel.includes('ministerio')) return 'ministerio';
  if (sectionLabel.includes('vida crista')) return 'vida_crista';
  if (sectionLabel.includes('encerramento')) return 'encerramento';
  if (designation.includes('oracao final')) return 'encerramento';
  if (designation.includes('presidente') || designation.includes('oracao inicial')) return 'abertura';
  if (
    designation.includes('tesouros da palavra') ||
    designation.includes('encontre joias') ||
    designation.includes('leitura da biblia')
  ) {
    return 'tesouros';
  }
  if (
    designation.includes('iniciando conversas') ||
    designation.includes('cultivando o interesse') ||
    designation.includes('faca revisitas') ||
    designation.includes('explicando suas crencas')
  ) {
    return 'ministerio';
  }
  if (
    designation.includes('vida crista') ||
    designation.includes('estudo biblico de congregacao') ||
    designation.includes('estudo de congregacao')
  ) {
    return 'vida_crista';
  }
  return 'programa';
};

const getCanonicalDesignation = (value, sectionKey) => {
  const raw = String(value || '').trim();
  const normalized = normalizeText(raw);
  if (normalized.includes('presidente')) return 'Presidente';
  if (normalized.includes('oracao inicial')) return 'Oracao Inicial';
  if (normalized.includes('oracao final')) return 'Oracao Final';
  if (isJewelsDesignation(normalized)) return 'Joias Espirituais';
  if (
    normalized.includes('tesouros da palavra') ||
    normalized === 'tesouros' ||
    (sectionKey === 'tesouros' &&
      !isJewelsDesignation(normalized) &&
      !normalized.includes('leitura da biblia'))
  ) {
    return 'Tesouros da Palavra - Discurso';
  }
  if (normalized.includes('encontre joias')) return 'Encontre Joias';
  if (normalized.includes('leitura da biblia')) return 'Leitura da Biblia';
  if (normalized.includes('vida crista - parte 1') || normalized.includes('parte 1')) {
    return 'Vida Crista - Parte 1';
  }
  if (normalized.includes('vida crista - parte 2') || normalized.includes('parte 2')) {
    return 'Vida Crista - Parte 2';
  }
  if (isBibleStudyDesignation(normalized)) return 'Estudo Biblico de Congregacao';
  return raw || 'Designacao';
};

const getDesignationOrder = (entry, sectionKey) => {
  const designation = normalizeText(entry?.designation);
  if (sectionKey === 'tesouros' && isJewelsDesignation(designation)) return 2;
  const explicitOrder = Number(entry?.designation_order || 0);
  if (explicitOrder > 0) return explicitOrder;
  const importLine = Number(entry?.import_line || 999);
  if (sectionKey === 'abertura') {
    if (designation.includes('presidente')) return 1;
    if (designation.includes('oracao inicial')) return 2;
    return 20 + importLine;
  }
  if (sectionKey === 'tesouros') {
    if (isJewelsDesignation(designation) || designation.includes('encontre joias')) return 2;
    if (designation.includes('leitura da biblia')) return 3;
    return 1;
  }
  if (sectionKey === 'ministerio') return 100 + importLine;
  if (sectionKey === 'vida_crista') {
    if (designation.includes('parte 1')) return 1;
    if (designation.includes('parte 2')) return 2;
    if (isBibleStudyDesignation(designation)) return 90;
    return 10 + importLine;
  }
  if (sectionKey === 'encerramento') {
    if (designation.includes('oracao final')) return 1;
    return 20 + importLine;
  }
  return 1000 + importLine;
};

const getParticipantTone = (participant, currentUserId) => {
  if (participant?.userId === currentUserId)
    return 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-200';
  if (participant?.userId || participant?.matchState === 'linked')
    return 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-200';
  if (participant?.matchState === 'ambiguous')
    return 'bg-amber-100 text-amber-700 dark:bg-amber-900/15 dark:text-amber-200';
  return 'bg-slate-100 text-slate-600 dark:bg-navy-900/70 dark:text-slate-300';
};

const ParticipantBadge = ({ participant, currentUserId }) => {
  if (!participant || participant?.userId !== currentUserId) return null;
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[8px] font-black uppercase tracking-widest ${getParticipantTone(
        participant,
        currentUserId
      )}`}
    >
      Minha designacao
    </span>
  );
};

const PersonLine = ({ label, participant, currentUserId, tone = 'default', onEdit }) => {
  if (!participant) return null;
  
  const canEdit = onEdit && participant.assignmentId;
  const NameComponent = canEdit ? 'button' : 'span';
  const nameProps = canEdit 
    ? { onClick: () => onEdit(participant), type: 'button', className: 'font-extrabold text-sm text-slate-800 dark:text-slate-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer' }
    : { className: 'font-extrabold text-sm text-slate-800 dark:text-slate-100' };
  
  return (
    <div className={`py-1 ${tone === 'helper' ? 'opacity-90' : ''}`}>
      <div className="flex flex-col items-start md:items-end gap-1 md:text-right">
        {label ? (
          <span
            className={`text-[9px] font-black uppercase tracking-widest ${
              tone === 'helper' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            {label}
          </span>
        ) : null}
        <div className="flex flex-wrap items-center justify-start md:justify-end gap-2">
          <NameComponent {...nameProps}>{participant.name}</NameComponent>
          {(!participant.userId && participant.matchState !== 'linked') && (
            <span title="Usuário não cadastrado no app" className="text-slate-400">
              <UserX size={14} />
            </span>
          )}
          <ParticipantBadge participant={participant} currentUserId={currentUserId} />
        </div>
      </div>
    </div>
  );
};

const CompactParticipants = ({ item, currentUserId, onEditParticipant }) => {
  const handleEdit = (participant) => {
    if (!onEditParticipant) return;
    const itemId = item?.id || '';
    let assignmentId = null;
    if (itemId.startsWith('mechanical:')) {
      assignmentId = itemId.replace('mechanical:', '');
    } else if (itemId.startsWith('assignment:')) {
      assignmentId = itemId.replace('assignment:', '');
    }
    if (assignmentId) {
      onEditParticipant({
        assignmentId,
        participant,
        item
      });
    }
  };

  if (item.isBibleStudy) {
    return (
      <div className="space-y-2">
        <PersonLine label="Dirigente Estudo Biblico" participant={item.primary} currentUserId={currentUserId} onEdit={handleEdit} />
        <PersonLine label="Leitor Estudo Biblico" participant={item.secondary} currentUserId={currentUserId} onEdit={handleEdit} />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <PersonLine label={item.sectionKey === 'ministerio' ? 'Publicador(a)' : ''} participant={item.primary} currentUserId={currentUserId} onEdit={handleEdit} />
      {item.sectionKey === 'ministerio' && item.secondary ? (
        <PersonLine label="Ajudante" participant={item.secondary} currentUserId={currentUserId} tone="helper" onEdit={handleEdit} />
      ) : null}
      {item.extras.length > 0 ? (
        <div className="space-y-2">
          {item.extras.map((participant) => (
            <PersonLine key={participant.id} label="Participacao" participant={participant} currentUserId={currentUserId} onEdit={handleEdit} />
          ))}
        </div>
      ) : null}
    </div>
  );
};

const TalkMetaBlock = ({ label, value }) => (
  <div className="py-1">
    <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">{label}</p>
    <p className="text-sm font-extrabold leading-tight text-slate-900 dark:text-slate-100">{value}</p>
  </div>
);

const TalkSummaryCard = ({ talk, currentUserId, formatDatePt }) => (
  <div className="grid gap-4 px-4 py-4 md:grid-cols-[minmax(0,1.2fr)_minmax(240px,0.8fr)]">
    <div className="min-w-0">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-rose-200/50 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.16em] text-rose-800 dark:text-rose-200">
          {formatDatePt(talk.date)}
        </span>
        <StatusIcon status={talk.chairmanStatus} />
        {talk.isMine ? (
          <span className="rounded-full bg-emerald-200/50 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.16em] text-emerald-800 dark:text-emerald-200">
            Minha designacao
          </span>
        ) : null}
      </div>

      <p className="mt-2 text-[1.1rem] font-black leading-tight text-slate-900 dark:text-white">{talk.talkTheme}</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <TalkMetaBlock
          label="Orador"
          value={talk.speakerCongregation ? `${talk.speakerName} - ${talk.speakerCongregation}` : talk.speakerName}
        />
        <TalkMetaBlock label="Cantico" value={`Cantico ${talk.songNumber} - ${talk.songTheme}`} />
      </div>
    </div>

    <div className="space-y-1 mt-4 md:mt-0 pt-3 md:pt-0 border-t border-rose-200/50 md:border-t-0 md:text-right">
      <PersonLine label="Presidente fim de semana" participant={talk.chairmanParticipant} currentUserId={currentUserId} />
      <PersonLine label="Leitor A Sentinela" participant={talk.readerParticipant} currentUserId={currentUserId} />
    </div>
  </div>
);

const MechanicalAssignmentRow = ({ item, currentUserId, onEditParticipant }) => {
  const handleEdit = (participant) => {
    if (!onEditParticipant) return;
    const itemId = item?.id || '';
    const assignmentId = itemId.startsWith('mechanical:') ? itemId.replace('mechanical:', '') : null;
    if (assignmentId) {
      onEditParticipant({ assignmentId, participant, item });
    }
  };

  return (
    <div className="grid gap-2 px-4 py-3 md:grid-cols-[minmax(0,1fr)_minmax(220px,40%)] md:items-center">
      <div className="min-w-0">
        <div className="flex items-center justify-between md:justify-start gap-2">
          <p className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">{item.designation}</p>
          <StatusIcon status={item.status} className="ml-auto md:ml-0" />
        </div>
      </div>

      <div className="md:text-right">
        <PersonLine participant={item.primary} currentUserId={currentUserId} onEdit={handleEdit} />
      </div>
    </div>
  );
};

const renderSection = (section, children) => (
  <div key={section.key} className={`rounded-[1rem] border overflow-hidden ${section.panelClass} mb-4`}>
    <div className={`flex items-center gap-3 px-3 py-2 ${section.badgeClass}`}>
      <div className={`h-4 w-1.5 rounded-full ${section.accentClass}`} />
      <span className="text-[10px] font-extrabold uppercase tracking-widest">{section.label}</span>
    </div>
    <div className="divide-y divide-black/5 dark:divide-white/5">{children}</div>
  </div>
);

const renderDayGroup = (title, badgeClass, children) => (
  <div className="overflow-hidden rounded-[1.2rem] border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-navy-900/90">
    <div className={`px-4 py-2 ${badgeClass} border-b border-black/5 dark:border-white/5`}>
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-600 dark:text-slate-400">{title}</p>
    </div>
    <div className="p-2 sm:p-3 space-y-2">{children}</div>
  </div>
);

const MeetingsView = ({
  data,
  dataReady,
  user,
  onBack,
  formatDatePt,
  formatAssignmentLabel: formatAssignmentLabelProp,
  renderSkeletonList,
  getUserDisplayName: getUserDisplayNameProp,
  canUserTakeAssignment,
  handleUpdateAssignment
}) => {
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search);
  const [selectedMonthKey, setSelectedMonthKey] = useState(getCurrentMonthKey());
  
  const [expandedWeekKey, setExpandedWeekKey] = useState(() => {
    try {
      const saved = localStorage.getItem('targetWeekKey');
      if (saved) {
        localStorage.removeItem('targetWeekKey');
        return saved;
      }
    } catch {}
    return '';
  });
  const [collapsedWeeks, setCollapsedWeeks] = useState({});
  const [collapsedDays, setCollapsedDays] = useState({});
  
  const [editingParticipant, setEditingParticipant] = useState(null);

  const handleEditParticipant = useCallback((info) => {
    const { assignmentId, participant, item } = info;
    const assignment = (data.assignments || []).find(a => a.id === assignmentId);
    if (assignment) {
      setEditingParticipant({
        assignmentId,
        assignment,
        participantName: participant.name,
        participantUserId: participant.userId,
        item
      });
    }
  }, [data.assignments]);

  const handleSaveParticipantChange = useCallback(async (selection) => {
    if (!editingParticipant || !handleUpdateAssignment) return;
    const { assignmentId } = editingParticipant;
    const success = await handleUpdateAssignment(assignmentId, {
      usuario_id: selection.usuario_id,
      participant_name: selection.participant_name
    });
    if (success) {
      setEditingParticipant(null);
    }
  }, [editingParticipant, handleUpdateAssignment]);

  const currentWeekKey = getCurrentWeekKey();

  const formatTypeLabel = formatAssignmentLabelProp || formatAssignmentLabel;
  const getUserDisplayName = getUserDisplayNameProp || getUserDisplayNameUtil;
  const isAdminView = user?.isAdmin;

  const usersById = useMemo(
    () => new Map((data.users || []).map((entry) => [entry.id, entry])),
    [data.users]
  );

  const groupedMeetings = useMemo(() => {
    const grouped = new Map();
    const mergedEntries = [...(data.meetings || [])];

    (data.assignments || []).forEach((assignment) => {
      if (!assignment?.date) return;
      if (assignment?.source === 'meeting_import') return;
      if (assignment?.show_in_meetings !== true) return;
      if (assignment?.status === 'rejeitado') return;
      if (isMechanicalAssignment(assignment?.tipo_designacao)) return;

      const meta = getMeetingSyncMetaForAssignmentType(assignment.tipo_designacao);
      if (!meta) return;

      const assignedUser = usersById.get(assignment.usuario_id);
      const participantName = getUserDisplayName(assignedUser) || assignment.participant_name;
      if (!participantName) return;

      mergedEntries.push({
        id: `assignment:${assignment.id}`,
        date: assignment.date,
        designation: meta.designation,
        sync_key: buildMeetingSyncKeyForAssignmentType({
          date: assignment.date,
          type: meta.assignmentType
        }),
        section_key: meta.sectionKey,
        section_label: meta.sectionLabel,
        section_order: meta.sectionOrder,
        designation_order: meta.designationOrder,
        role_type: meta.roleType,
        role_label: meta.roleLabel,
        assignment_type: meta.assignmentType,
        role_order: meta.roleOrder,
        participant_name: participantName,
        participant_name_norm: normalizeText(participantName),
        user_id: assignment.usuario_id,
        match_state: 'linked',
        import_source: 'assignments_sync',
        import_line: 0
      });
    });

    mergedEntries.forEach((entry) => {
      if (!entry?.date || !entry?.designation || !entry?.participant_name) return;

      const rawSyncKey =
        entry.sync_key ||
        [entry.date, normalizeText(entry.designation), Number(entry.import_line || 0)].join('|');

      const sectionKey = getCanonicalSectionKey(entry);
      const meta = SECTION_META[sectionKey] || SECTION_META.programa;
      const designation = getCanonicalDesignation(entry.designation, sectionKey);
      const syncKey =
        isBibleStudyDesignation(designation) || isBibleStudyDesignation(entry.designation)
          ? `${entry.date}|${sectionKey}|estudo-biblico`
          : rawSyncKey;
      const roleType = entry.role_type || 'principal';
      const roleOrder = Number(entry.role_order || (roleType === 'assistente_leitor' ? 2 : 1));

      const participant = {
        id: `${syncKey}:${roleType}:${normalizeText(entry.participant_name)}`,
        name: entry.participant_name,
        userId: entry.user_id || '',
        matchState: entry.match_state || '',
        roleType,
        roleOrder,
        importLine: Number(entry.import_line || 999)
      };

      const current = grouped.get(syncKey) || {
        id: syncKey,
        date: entry.date,
        monthKey: String(entry.date).slice(0, 7),
        weekKey: getWeekStartIso(entry.date),
        sectionKey,
        sectionMeta: meta,
        designation,
        designationOrder: getDesignationOrder(entry, sectionKey),
        importLine: Number(entry.import_line || 999),
        participants: []
      };

      current.sectionKey = sectionKey;
      current.sectionMeta = meta;
      current.designation = designation;
      current.designationOrder = Math.min(
        current.designationOrder || 999,
        getDesignationOrder(entry, sectionKey)
      );
      current.importLine = Math.min(current.importLine || 999, Number(entry.import_line || 999));
      current.participants.push(participant);
      grouped.set(syncKey, current);
    });

    return [...grouped.values()]
      .map((group) => {
        const participants = [...group.participants].sort((a, b) => {
          const byRole = Number(a.roleOrder || 99) - Number(b.roleOrder || 99);
          if (byRole !== 0) return byRole;
          const byImportLine = Number(a.importLine || 999) - Number(b.importLine || 999);
          if (byImportLine !== 0) return byImportLine;
          return normalizeText(a.name).localeCompare(normalizeText(b.name));
        });

        const primary =
          participants.find((participant) => participant.roleType !== 'assistente_leitor') ||
          participants[0] ||
          null;
        const explicitSecondary =
          participants.find((participant) => participant.roleType === 'assistente_leitor') || null;
        const fallbackBibleStudySecondary =
          !explicitSecondary && isBibleStudyDesignation(group.designation) && participants.length > 1
            ? participants.find((participant) => participant.id !== primary?.id) || null
            : null;
        const secondary = explicitSecondary || fallbackBibleStudySecondary;

        return {
          ...group,
          participants,
          primary,
          secondary,
          extras: participants.filter(
            (participant) =>
              participant.id !== primary?.id && participant.id !== secondary?.id
          ),
          isBibleStudy: isBibleStudyDesignation(group.designation)
        };
      })
      .sort((a, b) => {
        const byDate = String(a.date || '').localeCompare(String(b.date || ''));
        if (byDate !== 0) return byDate;
        const bySection = Number(a.sectionMeta?.order || 99) - Number(b.sectionMeta?.order || 99);
        if (bySection !== 0) return bySection;
        const byDesignation = Number(a.designationOrder || 999) - Number(b.designationOrder || 999);
        if (byDesignation !== 0) return byDesignation;
        return Number(a.importLine || 999) - Number(b.importLine || 999);
      });
  }, [data.assignments, data.meetings, usersById]);

const weekendTalks = useMemo(() => {
    const assignments = data.assignments || [];
    const talksData = data.talks || [];
    
    const processedWeeks = new Set();
    const result = [];

    talksData.forEach((talk) => {
      if (!talk?.date || processedWeeks.has(talk.date)) return;
      processedWeeks.add(talk.date);

      const chairmanAssignment =
        assignments.find((entry) => entry.id === talk.chairmanAssignmentId) ||
        assignments.find(
          (entry) =>
            entry.date === talk.date &&
            entry.tipo_designacao === 'Presidente Fim de Semana' &&
            entry.status !== 'rejeitado'
        ) ||
        null;
      const readerAssignment =
        assignments.find(
          (entry) =>
            entry.date === talk.date &&
            entry.tipo_designacao === 'Leitor A Sentinela' &&
            entry.status !== 'rejeitado'
        ) || null;

      const chairmanUser = chairmanAssignment ? usersById.get(chairmanAssignment.usuario_id) : null;
      const readerUser = readerAssignment ? usersById.get(readerAssignment.usuario_id) : null;
      const chairmanName = chairmanUser ? getUserDisplayName(chairmanUser) : 'Sem presidente';
      const readerName = readerUser ? getUserDisplayName(readerUser) : 'Nao definido';

      result.push({
        id: `talk:${talk.id}`,
        date: talk.date,
        weekKey: getWeekStartIso(talk.date),
        speakerName: talk.speakerName || 'Sem orador',
        speakerCongregation: talk.speakerCongregation || '',
        talkTheme: talk.talkTheme || 'Discurso público',
        songNumber: talk.songNumber || '-',
        songTheme: talk.songTheme || '-',
        chairmanStatus: chairmanAssignment?.status || 'programado',
        isMine:
          chairmanAssignment?.usuario_id === user?.id || readerAssignment?.usuario_id === user?.id,
        chairmanParticipant: {
          id: `${talk.id}:chairman`,
          name: chairmanName,
          userId: chairmanAssignment?.usuario_id || '',
          matchState: chairmanAssignment ? 'linked' : ''
        },
        readerParticipant: {
          id: `${talk.id}:reader`,
          name: readerName,
          userId: readerAssignment?.usuario_id || '',
          matchState: readerAssignment ? 'linked' : ''
        }
      });
    });

    assignments
      .filter((a) => 
        (a.tipo_designacao === 'Leitor A Sentinela' || a.tipo_designacao === 'Presidente Fim de Semana') && 
        a.status !== 'rejeitado' &&
        isWeekendDay(a.date)
      )
      .forEach((assignment) => {
        if (processedWeeks.has(assignment.date)) return;
        
        const chairmanAssignment = assignments.find(
          (entry) =>
            entry.date === assignment.date &&
            entry.tipo_designacao === 'Presidente Fim de Semana' &&
            entry.status !== 'rejeitado'
        ) || null;
        const readerAssignment = assignments.find(
          (entry) =>
            entry.date === assignment.date &&
            entry.tipo_designacao === 'Leitor A Sentinela' &&
            entry.status !== 'rejeitado'
        ) || null;

        const chairmanUser = chairmanAssignment ? usersById.get(chairmanAssignment.usuario_id) : null;
        const readerUser = readerAssignment ? usersById.get(readerAssignment.usuario_id) : null;
        
        const chairmanName = chairmanUser 
          ? getUserDisplayName(chairmanUser) 
          : chairmanAssignment?.participant_name || chairmanAssignment?.name || 'Sem presidente';
          
        const readerName = readerUser 
          ? getUserDisplayName(readerUser) 
          : readerAssignment?.participant_name || readerAssignment?.name || 'Não definido';

        processedWeeks.add(assignment.date);
        result.push({
          id: `assignment:${assignment.id}`,
          date: assignment.date,
          weekKey: getWeekStartIso(assignment.date),
          speakerName: '',
          speakerCongregation: '',
          talkTheme: '',
          songNumber: '',
          songTheme: '',
          chairmanStatus: chairmanAssignment?.status || 'programado',
          isMine: chairmanAssignment?.usuario_id === user?.id || readerAssignment?.usuario_id === user?.id,
          chairmanParticipant: {
            id: `${assignment.id}:chairman`,
            name: chairmanName,
            userId: chairmanAssignment?.usuario_id || '',
            matchState: chairmanUser ? 'linked' : ''
          },
          readerParticipant: {
            id: `${assignment.id}:reader`,
            name: readerName,
            userId: readerAssignment?.usuario_id || '',
            matchState: readerUser ? 'linked' : ''
          }
        });
      });

    return result.sort((a, b) => {
      const byDate = String(a?.date || '').localeCompare(String(b?.date || ''));
      if (byDate !== 0) return byDate;
      return String(a?.id || '').localeCompare(String(b?.id || ''));
    });
  }, [data.assignments, data.talks, user?.id, usersById]);

  const mechanicalAssignments = useMemo(() => {
    return (data.assignments || [])
      .filter((assignment) => {
        if (!assignment?.date) return false;
        if (assignment?.status === 'rejeitado') return false;
        return isMechanicalAssignment(assignment.tipo_designacao);
      })
.map((assignment) => {
        const assignedUser = usersById.get(assignment.usuario_id);
        const participantName = 
          getUserDisplayName(assignedUser) || 
          assignment.participant_name || 
          assignment.name ||
          assignment.participantName ||
          'Sem publicador';
        const designation = formatTypeLabel(assignment.tipo_designacao || 'Designacao mecanica');

          return {
            id: `mechanical:${assignment.id}`,
            date: assignment.date,
          weekKey: getWeekStartIso(assignment.date),
            designation,
            status: assignment.status || 'programado',
            primary: {
              id: `${assignment.id}:primary`,
              name: participantName,
              userId: assignment.usuario_id,
              matchState: assignedUser ? 'linked' : ''
            },
            sortOrder:
              mechanicalOrderMap.get(normalizeAssignmentType(assignment.tipo_designacao) || assignment.tipo_designacao) ||
              999
          };
        })
      .sort((a, b) => {
        const byDate = String(a.date || '').localeCompare(String(b.date || ''));
        if (byDate !== 0) return byDate;
        const byOrder = Number(a.sortOrder || 999) - Number(b.sortOrder || 999);
        if (byOrder !== 0) return byOrder;
        return String(a.designation || '').localeCompare(String(b.designation || ''));
      });
  }, [data.assignments, formatTypeLabel, usersById]);

  const availableWeeks = useMemo(() => {
    const weeks = new Set();
    groupedMeetings.forEach((entry) => entry.weekKey && weeks.add(entry.weekKey));
    weekendTalks.forEach((entry) => entry.weekKey && weeks.add(entry.weekKey));
    mechanicalAssignments.forEach((entry) => entry.weekKey && weeks.add(entry.weekKey));
    return [...weeks].sort();
  }, [groupedMeetings, mechanicalAssignments, weekendTalks]);

  const visibleDays = useMemo(() => {
    const normalizedSearch = normalizeText(deferredSearch);
    const days = new Map();

    const ensureDay = (date) => {
      if (!date) return null;
      const key = String(date);
      if (!days.has(key)) {
        days.set(key, {
          key,
          date: key,
          weekKey: getWeekStartIso(key),
          label: formatDayLabel(key),
          meetingItems: [],
          weekendItems: [],
          mechanicalMidweekItems: [],
          mechanicalWeekendItems: []
        });
      }
      return days.get(key);
    };

    groupedMeetings.forEach((entry) => {
      const day = ensureDay(entry.date);
      if (day) day.meetingItems.push(entry);
    });
    weekendTalks.forEach((entry) => {
      const day = ensureDay(entry.date);
      if (day) day.weekendItems.push(entry);
    });
    mechanicalAssignments.forEach((entry) => {
      const day = ensureDay(entry.date);
      if (!day) return;
      if (isMidweekDay(entry.date)) {
        day.mechanicalMidweekItems.push(entry);
      } else {
        day.mechanicalWeekendItems.push(entry);
      }
    });

    const getMechanicalItems = (day) => {
      const items = [];
      if (day.mechanicalMidweekItems) items.push(...day.mechanicalMidweekItems);
      if (day.mechanicalWeekendItems) items.push(...day.mechanicalWeekendItems);
      return items;
    };

    return [...days.values()]
      .map((day) => ({
        ...day,
        searchText: normalizeText(
          [
            day.date,
            day.label,
            ...day.meetingItems.flatMap((entry) => [
              entry.designation,
              entry.sectionMeta?.label,
              entry.primary?.name,
              entry.secondary?.name,
              ...entry.extras.map((participant) => participant.name)
            ]),
            ...day.weekendItems.flatMap((entry) => [
              entry.talkTheme,
              entry.speakerName,
              entry.speakerCongregation,
              entry.songNumber,
              entry.songTheme,
              entry.chairmanParticipant?.name,
              entry.readerParticipant?.name
            ]),
            ...(day.mechanicalMidweekItems || []).flatMap((entry) => [entry.designation, entry.primary?.name]),
            ...(day.mechanicalWeekendItems || []).flatMap((entry) => [entry.designation, entry.primary?.name])
          ]
            .filter(Boolean)
            .join(' ')
        )
      }))
      .filter((day) => {
        const dayMonthKey = getMonthKey(day.date);
        if (selectedMonthKey && dayMonthKey !== selectedMonthKey) return false;
        if (!normalizedSearch) return true;
        return day.searchText.includes(normalizedSearch);
      })
      .sort((a, b) => String(a.date || '').localeCompare(String(b.date || '')));
  }, [deferredSearch, groupedMeetings, mechanicalAssignments, selectedMonthKey, weekendTalks]);

  const availableMonths = useMemo(() => {
    const months = new Set();
    availableWeeks.forEach((weekKey) => {
      months.add(getMonthKey(weekKey));
    });
    return [...months].sort();
  }, [availableWeeks]);

  useEffect(() => {
    if (availableMonths.length && !availableMonths.includes(selectedMonthKey)) {
      setSelectedMonthKey(availableMonths[0]);
    }
  }, [availableMonths, selectedMonthKey]);

  const weekGroups = useMemo(() => {
    const weeks = new Map();
    const allEvents = data.specialEvents || [];

    visibleDays.forEach((day) => {
      const week = weeks.get(day.weekKey) || {
        key: day.weekKey,
        label: formatWeekLabel(day.weekKey),
        days: [],
        specialEvent: allEvents.find((evt) => getWeekStartIso(evt.date) === day.weekKey) || null
      };
      week.days.push(day);
      weeks.set(day.weekKey, week);
    });

    return [...weeks.values()]
      .sort((a, b) => String(a.key || '').localeCompare(String(b.key || '')))
      .map((week) => ({
        ...week,
        days: week.days.sort((a, b) => String(a.date || '').localeCompare(String(b.date || '')))
      }));
  }, [visibleDays, data.specialEvents]);

  useEffect(() => {
    if (!weekGroups.length) return;
    setCollapsedWeeks((previous) => {
      const next = { ...previous };
      weekGroups.forEach((week, index) => {
        if (!(week.key in next)) {
          next[week.key] = weekGroups.length > 2 && index > 1;
        }
      });
      return next;
    });
  }, [weekGroups]);

  useEffect(() => {
    const dayKeys = weekGroups.flatMap((week) => week.days.map((day) => day.key));
    if (!dayKeys.length) return;
    setCollapsedDays((previous) => {
      const next = { ...previous };
      dayKeys.forEach((dayKey) => {
        if (!(dayKey in next)) {
          next[dayKey] = false;
        }
      });
      return next;
    });
  }, [weekGroups]);

  const handlePrintWeek = () => {
    const printableDays = weekGroups.map((week) =>
      week.days.map((day) => {
        const sections = [];

        Object.values(SECTION_META)
          .sort((a, b) => a.order - b.order)
          .forEach((section) => {
            const items = day.meetingItems.filter((item) => item.sectionKey === section.key);
            if (!items.length) return;
            sections.push({
              label: section.label,
              shortLabel: section.label,
              items: items.map((item) => ({
                dateLabel: formatDatePt(day.date),
                designation: item.designation,
                participantsLabel: [
                  item.primary?.name,
                  item.secondary?.name,
                  ...item.extras.map((participant) => participant.name)
                ]
                  .filter(Boolean)
                  .join(' - ')
              }))
            });
          });

        if (day.weekendItems.length > 0) {
          sections.push({
            label: WEEKEND_SECTION.label,
            shortLabel: WEEKEND_SECTION.shortLabel,
            items: day.weekendItems.map((item) => ({
              dateLabel: formatDatePt(day.date),
              designation: item.talkTheme,
              participantsLabel: [
                `Orador: ${item.speakerName}`,
                item.speakerCongregation ? `Congregacao: ${item.speakerCongregation}` : '',
                `Cantico ${item.songNumber}: ${item.songTheme}`,
                `Presidente: ${item.chairmanParticipant?.name || '-'}`,
                `Leitor A Sentinela: ${item.readerParticipant?.name || '-'}`
              ]
                .filter(Boolean)
                .join(' - ')
            }))
          });
        }

        const allMechanicalItems = [
          ...(day.mechanicalMidweekItems || []),
          ...(day.mechanicalWeekendItems || [])
        ];
        if (allMechanicalItems.length > 0) {
          sections.push({
            label: MECHANICAL_SECTION.label,
            shortLabel: MECHANICAL_SECTION.shortLabel,
            items: allMechanicalItems.map((item) => ({
              dateLabel: formatDatePt(day.date),
              designation: item.designation,
              participantsLabel: item.primary?.name || '-'
            }))
          });
        }

        return { label: day.label, sections };
      })
    );

    printMeetingsWeek({
      weekLabel:
        weekGroups.length === 1
          ? weekGroups[0].label
          : expandedWeekKey
            ? formatWeekLabel(expandedWeekKey)
            : 'Programação filtrada',
      days: printableDays.flat()
    });
  };

  const hasLoadedAnySource =
    dataReady.meetings ||
    dataReady.assignments ||
    dataReady.talks ||
    (data.meetings || []).length > 0 ||
    (data.assignments || []).length > 0 ||
    (data.talks || []).length > 0;

  const hasRenderedContent =
    groupedMeetings.length > 0 || weekendTalks.length > 0 || mechanicalAssignments.length > 0;

  if (!hasLoadedAnySource && !hasRenderedContent) {
    return (
      <div className="space-y-4">
        <div className="space-y-2 px-1">
          <h2 className="text-xl font-black uppercase tracking-tighter">Reuniões</h2>
          <p className="text-sm text-slate-500">
            Organizando a semana, o fim de semana e as designações mecânicas.
          </p>
        </div>
        <div className="space-y-3">{renderSkeletonList(5, 'h-28 w-full rounded-4xl')}</div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Reuniões"
        title="Programação semanal"
        description="Veja a semana completa com reuniões, resumo do fim de semana e designações mecânicas do dia."
        onBack={onBack}
        actions={
          <button type="button" onClick={handlePrintWeek} className="soft-button-secondary">
            <Printer size={14} />
            Exportar PDF
          </button>
        }
      />

      <section className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-gradient-to-br from-white via-orange-50 to-amber-50 shadow-sm dark:border-slate-800 dark:from-navy-900 dark:via-navy-900 dark:to-navy-800">
        <div className="flex flex-col gap-4 p-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/85 px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-slate-500 shadow-sm dark:bg-navy-800/85">
              <CalendarDays size={12} />
              Programação Unificada
            </div>
            <h2 className="mt-3 text-[1.65rem] font-black tracking-tight text-slate-900 dark:text-white">
              Reuniões
            </h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              Selecione o mês e clique na semana desejada.
            </p>
          </div>

          <div className="w-full lg:w-[220px]">
            <select
              value={selectedMonthKey}
              onChange={(event) => {
                setSelectedMonthKey(event.target.value);
                setExpandedWeekKey('');
              }}
              className="soft-select"
            >
              {availableMonths.map((monthKey) => (
                <option key={monthKey} value={monthKey}>
                  {formatMonthLabel(monthKey)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="rounded-[1.5rem] border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-navy-800">
        <label className="relative block">
          <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar nome, designacao, tema ou data"
            className="soft-input !pl-11 pr-4"
          />
        </label>
      </section>

      {weekGroups.length === 0 ? (
        <section className="rounded-[2rem] border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-navy-800">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            Nenhuma reuniao encontrada com os filtros atuais.
          </p>
        </section>
      ) : null}

      {weekGroups.map((week) => {
        const isCurrentWeek = week.key === currentWeekKey;
        const isWeekExpanded = expandedWeekKey === week.key;
        
        const weekClasses = isCurrentWeek
          ? 'border-emerald-300 bg-emerald-50/80 dark:border-emerald-600 dark:bg-emerald-900/20'
          : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-navy-800';
          
        const badgeClasses = isCurrentWeek
          ? 'bg-emerald-200 text-emerald-900 dark:bg-emerald-800 dark:text-emerald-100'
          : 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300';
          
        const textClasses = isCurrentWeek
          ? 'text-emerald-700 dark:text-emerald-300'
          : 'text-sky-700 dark:text-sky-300';
          
        return (
          <section
            key={week.key}
            style={{ contentVisibility: 'auto', containIntrinsicSize: 'auto 500px' }}
            className={`overflow-hidden rounded-[1.6rem] border shadow-sm ${weekClasses}`}
          >
            <button
              type="button"
              onClick={() => setExpandedWeekKey(isWeekExpanded ? '' : week.key)}
              className={`flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors ${
                isCurrentWeek 
                  ? 'hover:bg-emerald-100/50 dark:hover:bg-emerald-900/30' 
                  : 'hover:bg-sky-50/70 dark:hover:bg-navy-900/60'
              }`}
            >
              <div className="min-w-0">
                <span className={`inline-flex rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.18em] ${badgeClasses}`}>
                  {isCurrentWeek ? 'Semana atual' : 'Semana'}
                </span>
                <p className={`mt-2 text-sm font-black uppercase tracking-[0.18em] ${textClasses} sm:text-[0.95rem]`}>
                  {week.label}
                </p>
                <p className={`mt-1 text-[10px] font-bold uppercase tracking-[0.14em] ${isCurrentWeek ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-300'}`}>
                  {isWeekExpanded ? 'Toque para recolher' : 'Toque para expandir'}
                </p>
              </div>
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors ${
                  isWeekExpanded
                    ? isCurrentWeek
                      ? 'bg-emerald-500 text-white dark:bg-emerald-400'
                      : 'bg-sky-600 text-white dark:bg-sky-500'
                    : isCurrentWeek
                      ? 'bg-emerald-200 text-emerald-700 dark:bg-emerald-800 dark:text-emerald-200'
                      : 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300'
                }`}
              >
                <ChevronDown
                  size={18}
                  className={`transition-transform ${isWeekExpanded ? 'rotate-180' : ''}`}
                />
              </span>
            </button>

            {isWeekExpanded ? (
              <div className="space-y-4 px-4 pb-4">
                {week.days.map((day) => {
                  const isDayCollapsed = !!collapsedDays[day.key];

                  const isMidweekCancelled =
                    week.specialEvent?.cancellationRule === 'cancel_midweek' ||
                    week.specialEvent?.cancellationRule === 'cancel_all';

                  const isWeekendCancelled =
                    week.specialEvent?.cancellationRule === 'cancel_weekend' ||
                    week.specialEvent?.cancellationRule === 'cancel_all';

                  const renderSpecialEventNotice = (event, ruleMasked) => {
                    const meta = getEventMeta(event.typeId);
                    const colors = getEventColors(meta.color);
                    return (
                      <div className={`m-3 rounded-[1.25rem] border p-4 ${colors.bg} ${colors.border}`}>
                        <div className="flex items-center gap-2">
                          <Flag size={16} className={colors.text} />
                          <p className={`text-sm font-black uppercase ${colors.text}`}>{meta.label}</p>
                        </div>
                        {event.labelOverrides && (
                          <p className={`mt-1 text-xs opacity-90 ${colors.text}`}>{event.labelOverrides}</p>
                        )}
                        <p className={`mt-2 text-[11px] font-bold opacity-80 ${colors.text}`}>
                          {ruleMasked} foi cancelada nesta semana devido a este evento.
                        </p>
                      </div>
                    );
                  };

                  return (
                    <div
                      key={day.key}
                      className="overflow-hidden rounded-[1.35rem] border border-slate-200/80 bg-slate-50/90 dark:border-slate-700 dark:bg-navy-900/70"
                    >
                      <button
                        type="button"
                        onClick={() =>
                          setCollapsedDays((previous) => ({
                            ...previous,
                            [day.key]: !previous[day.key]
                          }))
                        }
                        className="flex w-full items-center justify-between gap-4 px-4 py-3.5 text-left"
                      >
                        <div>
                          <p className="text-[9px] font-black uppercase tracking-widest text-blue-500">
                            {formatDatePt(day.date)}
                          </p>
                          <p className="mt-1 text-sm font-black text-slate-900 dark:text-white">
                            {day.label}
                          </p>
                        </div>
                        <ChevronDown
                          size={18}
                          className={`shrink-0 text-slate-500 transition-transform ${
                            isDayCollapsed ? '' : 'rotate-180'
                          }`}
                        />
                      </button>

                      {!isDayCollapsed ? (
                        <div className="space-y-4 px-4 pb-4">
                          {isMidweekDay(day.date) && day.meetingItems.length > 0 &&
                            (isMidweekCancelled
                              ? renderDayGroup(
                                  'Reunião de Meio de Semana',
                                  'bg-slate-50 dark:bg-navy-900/10',
                                  renderSpecialEventNotice(week.specialEvent, 'A Reunião de Meio de Semana')
                                )
                              : renderDayGroup(
                                  'Reunião de Meio de Semana',
                                  'bg-sky-100/90 dark:bg-sky-900/10',
                                  Object.values(SECTION_META)
                                    .sort((a, b) => a.order - b.order)
                                    .map((section) => {
                                      const items = day.meetingItems.filter((item) => item.sectionKey === section.key);
                                      if (!items.length) return null;

                                      return renderSection(
                                        section,
                                        items.map((item) => (
                                          <div
                                            key={item.id}
                                            className="grid gap-2 px-4 py-3 md:grid-cols-[minmax(0,1fr)_minmax(240px,38%)] md:items-center"
                                          >
                                            <div className="min-w-0">
                                              <p className={`text-[11px] font-black uppercase tracking-wider opacity-90 ${section.textClass}`}>
                                                {item.designation}
                                              </p>
                                            </div>
                                            <div className="md:text-right">
                                              <CompactParticipants item={item} currentUserId={user?.id} onEditParticipant={isAdminView && handleUpdateAssignment ? handleEditParticipant : null} />
                                            </div>
                                          </div>
                                        ))
                                      );
                                    })
                                ))}

                          {isWeekendDay(day.date) &&
                            (day.weekendItems.length > 0
                              ? (isWeekendCancelled
                                ? renderDayGroup(
                                    'Reunião de Fim de Semana',
                                    'bg-slate-50 dark:bg-navy-900/10',
                                    renderSpecialEventNotice(week.specialEvent, 'A Reunião de Fim de Semana')
                                  )
                                : renderDayGroup(
                                    'Reunião de Fim de Semana',
                                    'bg-rose-100/90 dark:bg-rose-900/10',
                                    day.weekendItems.map((item) => (
                                      <TalkSummaryCard
                                        key={item.id}
                                        talk={item}
                                        currentUserId={user?.id}
                                        formatDatePt={formatDatePt}
                                      />
                                    ))
                                  ))
                              : renderDayGroup(
                                  'Reunião de Fim de Semana',
                                  'bg-rose-100/90 dark:bg-rose-900/10',
                                  <div className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">
                                    Ainda não há dados do discurso cadastrado para esta semana.
                                  </div>
                                ))}

                          {(day.mechanicalMidweekItems?.length > 0) &&
                            renderDayGroup(
                              'Designações Mecânicas',
                              'bg-cyan-100/90 dark:bg-cyan-900/10',
                              day.mechanicalMidweekItems.map((item) => (
                                <MechanicalAssignmentRow
                                  key={item.id}
                                  item={item}
                                  currentUserId={user?.id}
                                  onEditParticipant={isAdminView && handleUpdateAssignment ? handleEditParticipant : null}
                                />
                              ))
                            )}

                          {(day.mechanicalWeekendItems?.length > 0) &&
                            renderDayGroup(
                              'Designações Mecânicas do Fim de Semana',
                              'bg-orange-100/90 dark:bg-orange-900/10',
                              day.mechanicalWeekendItems.map((item) => (
                                <MechanicalAssignmentRow
                                  key={item.id}
                                  item={item}
                                  currentUserId={user?.id}
                                  onEditParticipant={isAdminView && handleUpdateAssignment ? handleEditParticipant : null}
                                />
                              ))
                            )}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            ) : null}
          </section>
        );
      })}

      <ParticipantSelectModal
        isOpen={!!editingParticipant}
        onClose={() => setEditingParticipant(null)}
        onSelect={handleSaveParticipantChange}
        users={data.users || []}
        currentParticipantName={editingParticipant?.participantName}
        assignmentType={editingParticipant?.assignment?.tipo_designacao}
        canUserTakeAssignment={canUserTakeAssignment}
        getUserDisplayName={getUserDisplayName}
        formatDatePt={formatDatePt}
        assignmentDate={editingParticipant?.assignment?.date}
      />
    </div>
  );
};

export default MeetingsView;
