const formatTypeLabel = (type, formatAssignmentLabel) => {
  if (!type) return '';
  return typeof formatAssignmentLabel === 'function' ? formatAssignmentLabel(type) : String(type);
};

const formatDateLabel = (date, formatDatePt) => {
  if (!date) return '';
  return typeof formatDatePt === 'function' ? formatDatePt(date) : String(date);
};

const getAssignmentActivityLabel = (log) => {
  const action = String(log?.action || '');

  switch (action) {
    case 'criar_designacao':
      return 'Criou designação';
    case 'atualizar_designacao':
      return 'Atualizou designação';
    case 'reatribuir_designacao':
      return 'Reatribuiu designação';
    case 'excluir_designacao':
      return 'Excluiu designação';
    case 'confirmar_designacao':
      return 'Confirmou designação';
    case 'solicitar_troca':
      return 'Solicitou troca';
    case 'cancelar_troca':
      return 'Cancelou troca';
    case 'aceitar_troca':
      return 'Aceitou troca';
    default:
      return 'Atualização';
  }
};

const buildChangePair = (label, previousValue, nextValue) => {
  if (!previousValue && !nextValue) return '';
  if (previousValue && nextValue && previousValue !== nextValue) {
    return `${label}: ${previousValue} -> ${nextValue}`;
  }
  return `${label}: ${nextValue || previousValue}`;
};

const getAssignmentActivityDetail = (log, { formatAssignmentLabel, formatDatePt } = {}) => {
  const action = String(log?.action || '');
  const meta = log?.meta || {};

  switch (action) {
    case 'criar_designacao':
    case 'excluir_designacao': {
      const parts = [
        formatTypeLabel(meta.assignmentType, formatAssignmentLabel),
        formatDateLabel(meta.date, formatDatePt),
        meta.userName
      ].filter(Boolean);
      return parts.join(' • ');
    }
    case 'confirmar_designacao': {
      const parts = [
        formatTypeLabel(meta.assignmentType, formatAssignmentLabel),
        formatDateLabel(meta.date, formatDatePt)
      ].filter(Boolean);
      return parts.join(' • ');
    }
    case 'reatribuir_designacao': {
      return buildChangePair('Publicador', meta.previousUserName, meta.nextUserName);
    }
    case 'atualizar_designacao': {
      const changes = [
        buildChangePair(
          'Tipo',
          formatTypeLabel(meta.previousType, formatAssignmentLabel),
          formatTypeLabel(meta.nextType, formatAssignmentLabel)
        ),
        buildChangePair(
          'Data',
          formatDateLabel(meta.previousDate, formatDatePt),
          formatDateLabel(meta.nextDate, formatDatePt)
        ),
        buildChangePair('Publicador', meta.previousUserName, meta.nextUserName)
      ].filter(Boolean);

      if (changes.length > 0) return changes.join(' • ');

      const fallback = [
        formatTypeLabel(meta.nextType || meta.assignmentType, formatAssignmentLabel),
        formatDateLabel(meta.nextDate || meta.date, formatDatePt),
        meta.nextUserName || meta.userName
      ].filter(Boolean);
      return fallback.join(' • ');
    }
    case 'solicitar_troca':
    case 'cancelar_troca':
    case 'aceitar_troca': {
      const parts = [
        formatTypeLabel(meta.assignmentType, formatAssignmentLabel),
        formatDateLabel(meta.date, formatDatePt)
      ].filter(Boolean);
      return parts.join(' • ');
    }
    default:
      return '';
  }
};

export { getAssignmentActivityLabel, getAssignmentActivityDetail };
