const stripAccents = (value) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

const normalizeKeyText = (value) =>
  stripAccents(String(value || '').toLowerCase())
    .replace(/\s+/g, ' ')
    .trim();

const normalizePersonName = (value) => {
  const raw = normalizeKeyText(value);
  return raw
    .replace(/\b(de|da|do|dos|das|junior|jr|filho|neto)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();
};

const normalizeMeetingAssignmentType = (value) => {
  const raw = String(value || '').trim();
  if (!raw) return '';

  const cleaned = normalizeKeyText(raw);
  const aliases = {
    'presidente meio de semana': 'Presidente Meio de Semana',
    'oracao inicial': 'Oração Inicial',
    'oracao final': 'Oração Final',
    'joias espirituais': 'Encontre Joias',
    'encontre joias': 'Encontre Joias',
    'discurso publico': 'Discurso Público',
    'discurso tesouros': 'Discurso Tesouros',
    'discurso 5 min': 'Discurso 5 Min.',
    'discurso 5 min.': 'Discurso 5 Min.',
    'discurso 5 minutos': 'Discurso 5 Min.',
    'tesouros da palavra - discurso': 'Discurso Tesouros',
    'explicando crencas': 'Explicando Crenças',
    'explicando suas crencas': 'Explicando Crenças',
    'iniciando conversas': 'Iniciando Conversas',
    'cultivando o interesse': 'Cultivando o Interesse',
    'fazendo discipulos': 'Fazendo Discípulos',
    'faca revisitas': 'Faça Revisitas',
    'leitura da biblia': 'Leitura da Bíblia',
    'leitor estudo biblico': 'Leitor Estudo Bíblico',
    'dirigente estudo biblico': 'Dirigente Estudo Bíblico',
    'estudo biblico de congregacao - dirigente': 'Dirigente Estudo Bíblico',
    'vida crista - parte 1': 'Vida Cristã - Parte 1',
    'vida crista - parte 2': 'Vida Cristã - Parte 2'
  };

  return aliases[cleaned] || raw;
};

const getMeetingDurationMinutes = (value) => {
  const match = String(value || '').match(/(\d+)\s*min/i);
  if (!match) return null;
  const parsed = Number(match[1]);
  return Number.isFinite(parsed) ? parsed : null;
};

const isMeetingJewelsDesignation = (designation) =>
  normalizeKeyText(designation).includes('joias');

const isMeetingBibleStudyDesignation = (designation) => {
  const normalized = normalizeKeyText(designation);
  return (
    normalized.includes('estudo biblico de congregacao') ||
    normalized.includes('estudo de congregacao')
  );
};

const getMeetingSyncMetaForAssignmentType = (value) => {
  const type = normalizeMeetingAssignmentType(value);
  switch (type) {
    case 'Presidente Meio de Semana':
      return {
        assignmentType: type,
        designation: 'Presidente',
        sectionKey: 'abertura',
        sectionLabel: 'Abertura',
        sectionOrder: 1,
        designationOrder: 1,
        roleType: 'principal',
        roleLabel: 'Presidente',
        roleOrder: 1
      };
    case 'Oração Inicial':
      return {
        assignmentType: type,
        designation: 'Oração Inicial',
        sectionKey: 'abertura',
        sectionLabel: 'Abertura',
        sectionOrder: 1,
        designationOrder: 2,
        roleType: 'principal',
        roleLabel: 'Oração Inicial',
        roleOrder: 1
      };
    case 'Discurso Tesouros':
      return {
        assignmentType: type,
        designation: 'Tesouros da Palavra - Discurso',
        sectionKey: 'tesouros',
        sectionLabel: 'Tesouros da Palavra de Deus',
        sectionOrder: 2,
        designationOrder: 1,
        roleType: 'principal',
        roleLabel: 'Tesouros da Palavra - Discurso',
        roleOrder: 1
      };
    case 'Discurso 5 Min.':
      return {
        assignmentType: type,
        designation: 'Discurso 5 Min.',
        sectionKey: 'ministerio',
        sectionLabel: 'Faça Seu Melhor no Ministério',
        sectionOrder: 3,
        designationOrder: 100,
        roleType: 'principal',
        roleLabel: 'Discurso 5 Min.',
        roleOrder: 1
      };
    case 'Explicando Crenças':
      return {
        assignmentType: type,
        designation: 'Explicando Crenças',
        sectionKey: 'ministerio',
        sectionLabel: 'Faça Seu Melhor no Ministério',
        sectionOrder: 3,
        designationOrder: 101,
        roleType: 'principal',
        roleLabel: 'Explicando Crenças',
        roleOrder: 1
      };
    case 'Iniciando Conversas':
      return {
        assignmentType: type,
        designation: 'Iniciando Conversas',
        sectionKey: 'ministerio',
        sectionLabel: 'Faça Seu Melhor no Ministério',
        sectionOrder: 3,
        designationOrder: 102,
        roleType: 'principal',
        roleLabel: 'Iniciando Conversas',
        roleOrder: 1
      };
    case 'Cultivando o Interesse':
      return {
        assignmentType: type,
        designation: 'Cultivando o Interesse',
        sectionKey: 'ministerio',
        sectionLabel: 'Faça Seu Melhor no Ministério',
        sectionOrder: 3,
        designationOrder: 103,
        roleType: 'principal',
        roleLabel: 'Cultivando o Interesse',
        roleOrder: 1
      };
    case 'Fazendo Discípulos':
      return {
        assignmentType: type,
        designation: 'Fazendo Discípulos',
        sectionKey: 'ministerio',
        sectionLabel: 'Faça Seu Melhor no Ministério',
        sectionOrder: 3,
        designationOrder: 104,
        roleType: 'principal',
        roleLabel: 'Fazendo Discípulos',
        roleOrder: 1
      };
    case 'Faça Revisitas':
      return {
        assignmentType: type,
        designation: 'Faça Revisitas',
        sectionKey: 'ministerio',
        sectionLabel: 'Faça Seu Melhor no Ministério',
        sectionOrder: 3,
        designationOrder: 105,
        roleType: 'principal',
        roleLabel: 'Faça Revisitas',
        roleOrder: 1
      };
    case 'Encontre Joias':
      return {
        assignmentType: type,
        designation: 'Joias Espirituais',
        sectionKey: 'tesouros',
        sectionLabel: 'Tesouros da Palavra de Deus',
        sectionOrder: 2,
        designationOrder: 2,
        roleType: 'principal',
        roleLabel: 'Joias Espirituais',
        roleOrder: 1
      };
    case 'Leitura da Bíblia':
      return {
        assignmentType: type,
        designation: 'Leitura da Bíblia',
        sectionKey: 'tesouros',
        sectionLabel: 'Tesouros da Palavra de Deus',
        sectionOrder: 2,
        designationOrder: 3,
        roleType: 'principal',
        roleLabel: 'Leitura da Bíblia',
        roleOrder: 1
      };
    case 'Vida Cristã - Parte 1':
      return {
        assignmentType: type,
        designation: 'Vida Cristã - Parte 1',
        sectionKey: 'vida_crista',
        sectionLabel: 'Nossa Vida Cristã',
        sectionOrder: 4,
        designationOrder: 1,
        roleType: 'principal',
        roleLabel: 'Vida Cristã - Parte 1',
        roleOrder: 1
      };
    case 'Vida Cristã - Parte 2':
      return {
        assignmentType: type,
        designation: 'Vida Cristã - Parte 2',
        sectionKey: 'vida_crista',
        sectionLabel: 'Nossa Vida Cristã',
        sectionOrder: 4,
        designationOrder: 2,
        roleType: 'principal',
        roleLabel: 'Vida Cristã - Parte 2',
        roleOrder: 1
      };
    case 'Dirigente Estudo Bíblico':
      return {
        assignmentType: type,
        designation: 'Estudo Bíblico de Congregação',
        sectionKey: 'vida_crista',
        sectionLabel: 'Nossa Vida Cristã',
        sectionOrder: 4,
        designationOrder: 90,
        roleType: 'principal',
        roleLabel: 'Dirigente Estudo Bíblico',
        roleOrder: 1
      };
    case 'Leitor Estudo Bíblico':
      return {
        assignmentType: type,
        designation: 'Estudo Bíblico de Congregação',
        sectionKey: 'vida_crista',
        sectionLabel: 'Nossa Vida Cristã',
        sectionOrder: 4,
        designationOrder: 90,
        roleType: 'assistente_leitor',
        roleLabel: 'Leitor Estudo Bíblico',
        roleOrder: 2
      };
    case 'Oração Final':
      return {
        assignmentType: type,
        designation: 'Oração Final',
        sectionKey: 'encerramento',
        sectionLabel: 'Encerramento',
        sectionOrder: 5,
        designationOrder: 1,
        roleType: 'principal',
        roleLabel: 'Oração Final',
        roleOrder: 1
      };
    default:
      return {
        assignmentType: type,
        designation: type || 'Designação',
        sectionKey: 'programa',
        sectionLabel: 'Programa',
        sectionOrder: 6,
        designationOrder: 1000,
        roleType: 'principal',
        roleLabel: type || 'Designação',
        roleOrder: 1
      };
  }
};

const isMeetingSyncableAssignmentType = (value) => !!getMeetingSyncMetaForAssignmentType(value);

const buildMeetingSyncKeyForAssignmentType = ({ date, type }) => {
  const meta = getMeetingSyncMetaForAssignmentType(type);
  if (!meta || !date) return '';
  if (
    meta.assignmentType === 'Dirigente Estudo Bíblico' ||
    meta.assignmentType === 'Leitor Estudo Bíblico'
  ) {
    return `${date}|vida_crista|estudo-biblico`;
  }
  return [date, meta.sectionKey, normalizeKeyText(meta.designation)].join('|');
};

const getMeetingAgendaAssignmentType = ({
  designation,
  roleType = 'principal',
  sectionKey = '',
  roleLabel = '',
  hasAssistant = false
}) => {
  const normalized = normalizeKeyText(designation);
  const normalizedSection = normalizeKeyText(sectionKey);
  const durationMinutes = getMeetingDurationMinutes(designation);

  if (roleType === 'assistente_leitor' && isMeetingBibleStudyDesignation(designation)) {
    return 'Leitor Estudo Bíblico';
  }
  if (normalized.includes('presidente')) return 'Presidente Meio de Semana';
  if (normalized.includes('oracao inicial')) return 'Oração Inicial';
  if (normalized.includes('oracao final')) return 'Oração Final';
  if (isMeetingJewelsDesignation(designation) || normalized.includes('encontre joias')) {
    return 'Encontre Joias';
  }
  if (normalized.includes('leitura da biblia')) return 'Leitura da Bíblia';
  if (isMeetingBibleStudyDesignation(designation)) {
    return roleType === 'assistente_leitor'
      ? 'Leitor Estudo Bíblico'
      : 'Dirigente Estudo Bíblico';
  }
  if (normalized.includes('vida crista - parte 1') || normalized.includes('parte 1')) {
    return 'Vida Cristã - Parte 1';
  }
  if (normalized.includes('vida crista - parte 2') || normalized.includes('parte 2')) {
    return 'Vida Cristã - Parte 2';
  }
  if (
    roleType === 'principal' &&
    (normalizedSection === 'tesouros' || normalized.includes('tesouros da palavra'))
  ) {
    return 'Discurso Tesouros';
  }
  if (
    roleType === 'principal' &&
    normalizedSection === 'ministerio' &&
    hasAssistant !== true &&
    durationMinutes !== null &&
    durationMinutes <= 5
  ) {
    return 'Discurso 5 Min.';
  }

  return normalizeMeetingAssignmentType(roleLabel || designation);
};

const getMeetingSecondaryRoleLabel = (designation) => {
  const normalized = normalizeKeyText(designation);
  if (isMeetingBibleStudyDesignation(normalized)) {
    return 'Leitor';
  }
  if (
    normalized.includes('iniciando conversas') ||
    normalized.includes('cultivando o interesse') ||
    normalized.includes('faca revisitas') ||
    normalized.includes('explicando suas crencas')
  ) {
    return 'Ajudante';
  }
  return 'Leitor';
};

const getMeetingRoleLabel = (designation, roleType) =>
  roleType === 'assistente_leitor'
    ? `${designation} - ${getMeetingSecondaryRoleLabel(designation)}`
    : designation;

const buildMeetingSyncKey = ({ date, designation, line }) =>
  [date, normalizeKeyText(designation), line || 0].join('|');

const buildMeetingEntryKey = ({ date, designation, participantName, roleType }) =>
  [date, normalizeKeyText(designation), roleType, normalizePersonName(participantName)].join('|');

const buildImportedAssignmentKey = (userId, date, type) =>
  [userId, date, normalizeKeyText(type)].join('|');

const getMeetingSectionMeta = (designation) => {
  const normalized = normalizeKeyText(designation);
  if (normalized.includes('oracao final')) {
    return { key: 'encerramento', label: 'Encerramento', order: 5 };
  }
  if (normalized.includes('presidente') || normalized.includes('oracao inicial')) {
    return { key: 'abertura', label: 'Abertura', order: 1 };
  }
  if (
    normalized.includes('tesouros') ||
    normalized.includes('joias') ||
    normalized.includes('leitura da biblia')
  ) {
    return { key: 'tesouros', label: 'Tesouros da Palavra de Deus', order: 2 };
  }
  if (
    normalized.includes('iniciando conversas') ||
    normalized.includes('cultivando o interesse') ||
    normalized.includes('faca revisitas') ||
    normalized.includes('explicando suas crencas')
  ) {
    return { key: 'ministerio', label: 'Faça Seu Melhor no Ministério', order: 3 };
  }
  if (
    normalized.includes('vida crista') ||
    normalized.includes('estudo biblico de congregacao') ||
    normalized.includes('estudo de congregacao')
  ) {
    return { key: 'vida_crista', label: 'Nossa Vida Cristã', order: 4 };
  }
  return { key: 'programa', label: 'Programa', order: 6 };
};

const getMeetingSectionMetaFromValue = (sectionValue, designation = '') => {
  if (isMeetingJewelsDesignation(designation)) {
    return { key: 'tesouros', label: 'Tesouros da Palavra de Deus', order: 2 };
  }

  const normalized = normalizeKeyText(sectionValue);
  if (normalized.includes('encerramento')) {
    return { key: 'encerramento', label: 'Encerramento', order: 5 };
  }
  if (normalized.includes('abertura')) {
    return { key: 'abertura', label: 'Abertura', order: 1 };
  }
  if (normalized.includes('tesouros')) {
    return { key: 'tesouros', label: 'Tesouros da Palavra de Deus', order: 2 };
  }
  if (normalized.includes('ministerio')) {
    return { key: 'ministerio', label: 'Faça Seu Melhor no Ministério', order: 3 };
  }
  if (normalized.includes('vida crista')) {
    return { key: 'vida_crista', label: 'Nossa Vida Cristã', order: 4 };
  }
  return getMeetingSectionMeta(designation);
};

const getMeetingDesignationOrder = (designation, sectionKey, importLine = 999) => {
  const normalized = normalizeKeyText(designation);
  if (sectionKey === 'abertura') {
    if (normalized.includes('presidente')) return 1;
    if (normalized.includes('oracao inicial')) return 2;
    return 20 + importLine;
  }
  if (sectionKey === 'tesouros') {
    if (normalized.includes('joias') || normalized.includes('encontre joias')) return 2;
    if (normalized.includes('leitura da biblia')) return 3;
    return 1;
  }
  if (sectionKey === 'ministerio') {
    return 100 + importLine;
  }
  if (sectionKey === 'vida_crista') {
    if (isMeetingBibleStudyDesignation(designation)) return 90;
    if (normalized.includes('parte 1')) return 1;
    if (normalized.includes('parte 2')) return 2;
    return 10 + importLine;
  }
  if (sectionKey === 'encerramento') {
    if (normalized.includes('oracao final')) return 1;
    return 20 + importLine;
  }
  return 1000 + importLine;
};

const sortMeetingPreviewRows = (rows = []) =>
  [...rows].sort((a, b) => {
    const byDate = String(a.date || '').localeCompare(String(b.date || ''));
    if (byDate !== 0) return byDate;
    const bySection = Number(a.sectionOrder || 99) - Number(b.sectionOrder || 99);
    if (bySection !== 0) return bySection;
    const byDesignationOrder = Number(a.designationOrder || 999) - Number(b.designationOrder || 999);
    if (byDesignationOrder !== 0) return byDesignationOrder;
    const byLine = Number(a.line || 999) - Number(b.line || 999);
    if (byLine !== 0) return byLine;
    const byRole = Number(a.roleOrder || 99) - Number(b.roleOrder || 99);
    if (byRole !== 0) return byRole;
    return normalizeKeyText(a.participantName).localeCompare(normalizeKeyText(b.participantName));
  });

const buildMeetingBatchLabel = (minDate, maxDate) => {
  const source = minDate || maxDate || new Date().toISOString().slice(0, 10);
  return String(source).slice(0, 7);
};

export {
  normalizeKeyText,
  normalizeMeetingAssignmentType,
  isMeetingJewelsDesignation,
  isMeetingBibleStudyDesignation,
  getMeetingAgendaAssignmentType,
  getMeetingSecondaryRoleLabel,
  getMeetingRoleLabel,
  getMeetingSyncMetaForAssignmentType,
  isMeetingSyncableAssignmentType,
  buildMeetingSyncKeyForAssignmentType,
  buildMeetingSyncKey,
  buildMeetingEntryKey,
  buildImportedAssignmentKey,
  getMeetingSectionMeta,
  getMeetingSectionMetaFromValue,
  getMeetingDesignationOrder,
  sortMeetingPreviewRows,
  buildMeetingBatchLabel
};
