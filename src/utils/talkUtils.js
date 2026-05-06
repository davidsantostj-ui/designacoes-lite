import { compareIsoDates, formatIsoDateLocal } from './dateUtils';

const TALK_CHAIR_ASSIGNMENT_TYPE = 'Presidente Fim de Semana';
const TALK_READER_ASSIGNMENT_TYPE = 'Leitor A Sentinela';

const getMonthKey = (dateStr) => String(dateStr || '').slice(0, 7);

const buildMonthOptions = (baseDate = new Date(), totalMonths = 7) => {
  const options = [];
  for (let index = 0; index < totalMonths; index += 1) {
    const date = new Date(baseDate.getFullYear(), baseDate.getMonth() + index, 1);
    const value = formatIsoDateLocal(date).slice(0, 7);
    const label = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    options.push({ value, label });
  }
  return options;
};

const compareTalksAsc = (left, right) => {
  const byDate = compareIsoDates(left?.date, right?.date);
  if (byDate !== 0) return byDate;
  return String(left?.id || '').localeCompare(String(right?.id || ''));
};

const formatTalkWhatsAppMessage = ({
  talk,
  chairmanName = '',
  readerName = '',
  formatDatePt
}) => {
  const lines = [
    `Discursos - ${formatDatePt?.(talk?.date) || talk?.date || ''}`,
    `Orador: ${talk?.speakerName || '-'}`,
    `Congregação: ${talk?.speakerCongregation || '-'}`,
    `Tema: ${talk?.talkTheme || '-'}`,
    `Cântico ${talk?.songNumber || '-'}: ${talk?.songTheme || '-'}`,
    `Presidente: ${chairmanName || '-'}`,
    `Leitor A Sentinela: ${readerName || '-'}`
  ];
  return lines.join('\n');
};

export {
  TALK_CHAIR_ASSIGNMENT_TYPE,
  TALK_READER_ASSIGNMENT_TYPE,
  getMonthKey,
  buildMonthOptions,
  compareTalksAsc,
  formatTalkWhatsAppMessage
};
