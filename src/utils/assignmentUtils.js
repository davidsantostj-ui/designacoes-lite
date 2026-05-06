import { ASSIGNMENT_TYPES, MECHANICAL_ASSIGNMENT_TYPES } from '../constants/appConstants';
import { fixMojibake, stripAccents } from './textUtils';

const LEGACY_MICROPHONE_TYPE = 'Microfone Volante';
const MICROPHONE_ASSIGNMENT_TYPES = ['Microfone 1', 'Microfone 2'];

const normalizeAssignmentTypeKey = (value) =>
  stripAccents(fixMojibake(String(value || '').trim())).toLowerCase();

const ASSIGNMENT_TYPE_BY_KEY = new Map(
  ASSIGNMENT_TYPES.map((type) => [normalizeAssignmentTypeKey(type), type])
);

const MECHANICAL_ASSIGNMENT_KEY_SET = new Set(
  MECHANICAL_ASSIGNMENT_TYPES.map((type) => normalizeAssignmentTypeKey(type))
);

const ASSIGNMENT_CATEGORY_META = {
  mechanical: {
    id: 'mechanical',
    label: 'Mecanica',
    badgeClass: 'bg-cyan-100 text-cyan-700 border border-cyan-200',
    accentClass: 'bg-cyan-500'
  },
  spiritual: {
    id: 'spiritual',
    label: 'Espiritual',
    badgeClass: 'bg-amber-100 text-amber-700 border border-amber-200',
    accentClass: 'bg-amber-500'
  },
  meeting: {
    id: 'meeting',
    label: 'Reuniao',
    badgeClass: 'bg-violet-100 text-violet-700 border border-violet-200',
    accentClass: 'bg-violet-500'
  }
};

const resolveCanonicalAssignmentType = (value) =>
  ASSIGNMENT_TYPE_BY_KEY.get(normalizeAssignmentTypeKey(value)) || value;

const formatAssignmentLabel = (type) => {
  const fixedType = fixMojibake(type);
  if (fixedType === 'LANCHE_ORADOR') return 'Lanche do Orador';
  if (fixedType === LEGACY_MICROPHONE_TYPE) return 'Microfone 1';
  return fixedType;
};

const normalizeAssignmentType = (value) => {
  const raw = fixMojibake(String(value || '').trim());
  if (!raw) return '';

  const cleaned = normalizeAssignmentTypeKey(raw);
  const aliases = {
    microfone: 'Microfone 1',
    'microfone 1': 'Microfone 1',
    'microfone 2': 'Microfone 2',
    'microfone volante': 'Microfone 1',
    indicador: 'Indicador Entrada',
    'indicador entrada': 'Indicador Entrada',
    'indicador de entrada': 'Indicador Entrada',
    'indicador da entrada': 'Indicador Entrada',
    'indicador auditorio': 'Indicador Auditorio',
    'indicador de auditorio': 'Indicador Auditorio',
    'sistema de som': 'Sistema de Audio',
    'sistema de audio': 'Sistema de Audio',
    'sistema audio': 'Sistema de Audio',
    'sistema de video': 'Sistema de Video',
    'sistema video': 'Sistema de Video',
    'leitor de a sentinela': 'Leitor A Sentinela',
    'leitor da sentinela': 'Leitor A Sentinela',
    'leitor estudo biblico': 'Leitor Estudo Biblico',
    'presidente fim de semana': 'Presidente Fim de Semana',
    'presidente meio de semana': 'Presidente Meio de Semana',
    'oracao inicial': 'Oracao Inicial',
    'oracao final': 'Oracao Final',
    'joias espirituais': 'Encontre Joias',
    'encontre joias': 'Encontre Joias',
    'discurso publico': 'Discurso Publico',
    'discurso tesouros': 'Discurso Tesouros',
    'discurso 5 min': 'Discurso 5 Min.',
    'discurso 5 min.': 'Discurso 5 Min.',
    'discurso 5 minutos': 'Discurso 5 Min.',
    'tesouros da palavra - discurso': 'Discurso Tesouros',
    'explicando crencas': 'Explicando Crencas',
    'explicando suas crencas': 'Explicando Crencas',
    'leitura da biblia': 'Leitura da Biblia',
    'dirigente estudo biblico': 'Dirigente Estudo Biblico',
    'estudo biblico de congregacao - dirigente': 'Dirigente Estudo Biblico',
    'vida crista - parte 1': 'Vida Crista - Parte 1',
    'vida crista - parte 2': 'Vida Crista - Parte 2',
    'lanche orador': 'LANCHE_ORADOR',
    'lanche do orador': 'LANCHE_ORADOR'
  };

  if (aliases[cleaned]) {
    return resolveCanonicalAssignmentType(aliases[cleaned]);
  }

  return ASSIGNMENT_TYPE_BY_KEY.get(cleaned) || raw;
};

const getDefaultAssignmentCapabilities = () =>
  ASSIGNMENT_TYPES.reduce((accumulator, type) => {
    accumulator[type] = true;
    return accumulator;
  }, {});

const getUserAssignmentCapabilities = (user) => {
  const stored =
    user && typeof user.assignmentCapabilities === 'object' ? user.assignmentCapabilities : {};
  const legacyMicrophoneCapability =
    typeof stored[LEGACY_MICROPHONE_TYPE] === 'boolean'
      ? stored[LEGACY_MICROPHONE_TYPE]
      : undefined;

  return ASSIGNMENT_TYPES.reduce((accumulator, type) => {
    let value = stored[type];
    if (typeof value !== 'boolean' && MICROPHONE_ASSIGNMENT_TYPES.includes(type)) {
      value = legacyMicrophoneCapability;
    }
    accumulator[type] = value !== false;
    return accumulator;
  }, {});
};

const canUserTakeAssignment = (user, type) => {
  if (!user?.approved || !type) return false;
  const capabilities = getUserAssignmentCapabilities(user);
  const normalizedType = normalizeAssignmentType(type);
  if (normalizedType in capabilities) return capabilities[normalizedType] === true;
  if (type in capabilities) return capabilities[type] === true;
  return true;
};

const isMechanicalAssignment = (type) =>
  MECHANICAL_ASSIGNMENT_KEY_SET.has(normalizeAssignmentTypeKey(normalizeAssignmentType(type) || type));

const isMeetingImportedAssignment = (assignment) =>
  assignment?.source === 'meeting_import' || assignment?.allowSwap === false;

const getAssignmentCategory = (assignmentOrType, source = '') => {
  if (assignmentOrType && typeof assignmentOrType === 'object') {
    if (isMeetingImportedAssignment(assignmentOrType)) return 'meeting';
    return isMechanicalAssignment(assignmentOrType.tipo_designacao) ? 'mechanical' : 'spiritual';
  }

  if (source === 'meeting_import') return 'meeting';
  return isMechanicalAssignment(assignmentOrType) ? 'mechanical' : 'spiritual';
};

const getAssignmentCategoryMeta = (assignmentOrType, source = '') =>
  ASSIGNMENT_CATEGORY_META[getAssignmentCategory(assignmentOrType, source)] ||
  ASSIGNMENT_CATEGORY_META.spiritual;

export {
  ASSIGNMENT_CATEGORY_META,
  formatAssignmentLabel,
  normalizeAssignmentType,
  getDefaultAssignmentCapabilities,
  getUserAssignmentCapabilities,
  canUserTakeAssignment,
  isMechanicalAssignment,
  isMeetingImportedAssignment,
  getAssignmentCategory,
  getAssignmentCategoryMeta
};
