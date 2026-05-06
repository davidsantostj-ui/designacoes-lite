export const ADMIN_UIDS = ['Y93qpOE5dHUpvHvRMyNpAfo9wwQ2', 'ZfQXTFDszIgJCPxwm5nenkydrmL2'];

export const BASE_ASSIGNMENT_TYPES = [
  'Microfone 1',
  'Microfone 2',
  'Indicador Entrada',
  'Indicador Auditório',
  'Sistema de Áudio',
  'Sistema de Vídeo',
  'Leitor A Sentinela',
  'Leitor Estudo Bíblico',
  'Presidente Fim de Semana',
  'Discurso Público'
];

export const MIDWEEK_ASSIGNMENT_TYPES = [
  'Presidente Meio de Semana',
  'Oração Inicial',
  'Oração Final',
  'Encontre Joias',
  'Discurso Tesouros',
  'Discurso 5 Min.',
  'Explicando Crenças',
  'Iniciando Conversas',
  'Cultivando o Interesse',
  'Fazendo Discípulos',
  'Faça Revisitas',
  'Leitura da Bíblia',
  'Dirigente Estudo Bíblico',
  'Vida Cristã - Parte 1',
  'Vida Cristã - Parte 2'
];

export const ASSIGNMENT_TYPES = [...BASE_ASSIGNMENT_TYPES, ...MIDWEEK_ASSIGNMENT_TYPES];

export const MECHANICAL_ASSIGNMENT_TYPES = [
  'Microfone 1',
  'Microfone 2',
  'Indicador Entrada',
  'Indicador Auditório',
  'Sistema de Áudio',
  'Sistema de Vídeo'
];

export const SPIRITUAL_ASSIGNMENT_TYPES = ASSIGNMENT_TYPES.filter(
  (type) => !MECHANICAL_ASSIGNMENT_TYPES.includes(type)
);

export const ASSIGNMENT_TYPE_GROUPS = [
  {
    id: 'mechanical',
    label: 'Designações Mecânicas',
    shortLabel: 'Mecânicas',
    types: MECHANICAL_ASSIGNMENT_TYPES
  },
  {
    id: 'spiritual',
    label: 'Designações Espirituais',
    shortLabel: 'Espirituais',
    types: SPIRITUAL_ASSIGNMENT_TYPES
  }
];

export const STATUS_TYPES = ['pendente', 'confirmado', 'rejeitado', 'troca'];
