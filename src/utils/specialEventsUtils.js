export const EVENT_TYPES = [
  { id: 'congresso', label: 'Congresso Regional', color: 'blue' },
  { id: 'assembleia', label: 'Assembleia de Circuito', color: 'violet' },
  { id: 'visita_sc', label: 'Visita do Superintendente', color: 'purple' }, // Fix #1: Superintedente → Superintendente
  { id: 'pregacao_especial', label: 'Pregação Especial', color: 'emerald' },
  { id: 'reuniao_especial', label: 'Reunião Especial', color: 'amber' },
  { id: 'celebracao', label: 'Celebração', color: 'rose' }
];

export const MEETING_CANCELLATION_RULES = [
  { id: 'none', label: 'Haverá as duas reuniões (Normal)' },
  { id: 'cancel_midweek', label: 'Apenas a do Meio de Semana é cancelada' },
  { id: 'cancel_weekend', label: 'Apenas a do Fim de Semana é cancelada' },
  { id: 'cancel_all', label: 'As duas reuniões serão canceladas' }
];

export const getEventMeta = (typeId) => {
  return EVENT_TYPES.find((t) => t.id === typeId) || EVENT_TYPES[0];
};

// Fix #4: Removido getCancellationLabel — export não utilizado em nenhum arquivo

// Fix #8: COLOR_MAP agora é constante fora da função (criada 1x, não a cada chamada)
const COLOR_MAP = {
  blue: {
    border: 'border-blue-200 dark:border-blue-700',
    bg: 'bg-blue-50/90 dark:bg-blue-900/15',
    badge: 'bg-blue-200 text-blue-900 dark:bg-blue-800 dark:text-blue-100',
    accent: 'bg-blue-500',
    text: 'text-blue-900 dark:text-blue-200'
  },
  violet: {
    border: 'border-violet-200 dark:border-violet-700',
    bg: 'bg-violet-50/90 dark:bg-violet-900/15',
    badge: 'bg-violet-200 text-violet-900 dark:bg-violet-800 dark:text-violet-100',
    accent: 'bg-violet-500',
    text: 'text-violet-900 dark:text-violet-200'
  },
  purple: {
    border: 'border-purple-200 dark:border-purple-700',
    bg: 'bg-purple-50/90 dark:bg-purple-900/15',
    badge: 'bg-purple-200 text-purple-900 dark:bg-purple-800 dark:text-purple-100',
    accent: 'bg-purple-500',
    text: 'text-purple-900 dark:text-purple-200'
  },
  emerald: {
    border: 'border-emerald-200 dark:border-emerald-700',
    bg: 'bg-emerald-50/90 dark:bg-emerald-900/15',
    badge: 'bg-emerald-200 text-emerald-900 dark:bg-emerald-800 dark:text-emerald-100',
    accent: 'bg-emerald-500',
    text: 'text-emerald-900 dark:text-emerald-200'
  },
  amber: {
    border: 'border-amber-200 dark:border-amber-700',
    bg: 'bg-amber-50/90 dark:bg-amber-900/15',
    badge: 'bg-amber-200 text-amber-900 dark:bg-amber-800 dark:text-amber-100',
    accent: 'bg-amber-500',
    text: 'text-amber-900 dark:text-amber-200'
  },
  rose: {
    border: 'border-rose-200 dark:border-rose-700',
    bg: 'bg-rose-50/90 dark:bg-rose-900/15',
    badge: 'bg-rose-200 text-rose-900 dark:bg-rose-800 dark:text-rose-100',
    accent: 'bg-rose-500',
    text: 'text-rose-900 dark:text-rose-200'
  }
};

export const getEventColors = (colorBase) => COLOR_MAP[colorBase] || COLOR_MAP.blue;
